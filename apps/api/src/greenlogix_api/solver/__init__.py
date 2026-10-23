"""Heuristic VRP: cluster → capacity split → NN+2-opt; plus D-17 baseline."""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field

from greenlogix_api.carbon import kg_co2, litres_used
from greenlogix_api.geo.restrictions import check_truck_ban
from greenlogix_api.geo.restrictions import parse_time_str as parse_hhmm
from greenlogix_api.geo.truck_profile import (
    DEFAULT_TRUCK_PROFILE,
    TruckProfile,
    profile_for_vehicle_model,
)
from greenlogix_api.models import Order, Vehicle
from greenlogix_api.schemas import TotalsOut
from greenlogix_api.solver.baseline import baseline_fill
from greenlogix_api.solver.cluster import CLUSTER_RADIUS_KM, greedy_clusters
from greenlogix_api.solver.distance import road_km
from greenlogix_api.solver.eco import (
    eco_leg_cost,
    eco_weight_from_env,
    make_eco_pair_km,
)
from greenlogix_api.solver.flags import optimizer_from_env
from greenlogix_api.solver.nn_two_opt import sequence_orders, tour_km
from greenlogix_api.solver.road_baseline import (
    ROUTING_QUALITY_DEGRADED,
    ROUTING_QUALITY_UNAVAILABLE,
    CircuityRoadBaseline,
    RoadBaseline,
    evaluate_restriction_coverage,
    materialize_matrix,
    quality_for_provider,
    resolve_road_baseline,
)

log = logging.getLogger("greenlogix")

PairKm = Callable[[float, float, float, float], float]

ROUTE_COLORS = [
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#a65628",
    "#f781bf",
    "#999999",
    "#66c2a5",
    "#fc8d62",
]


@dataclass
class PlannedStop:
    seq: int
    kind: str
    order: Order | None
    lat: float
    lng: float
    address: str
    phone: str
    window_start: str
    window_end: str
    notes: str
    kg: float


@dataclass
class PlannedRoute:
    vehicle: Vehicle
    orders: list[Order]
    overload: bool
    km: float
    litres: float
    kg_co2: float
    color: str
    stops: list[PlannedStop] = field(default_factory=list)


@dataclass
class VrpResult:
    routes: list[PlannedRoute]
    unassigned_ids: list[int]
    totals: TotalsOut
    baseline: TotalsOut
    distance_provider: str = "circuity"
    routing_quality: str = ROUTING_QUALITY_DEGRADED
    eco_weight: float = 0.0
    # T-LOOP-ROUTING (additive): which restriction overlay was enforced,
    # e.g. "decision23-2018-v1:checked:clear".
    restriction_coverage: str = "decision23-2018-v1:unchecked"
    optimizer_used: str = "legacy"
    ban_conflicts: int = 0
    time_window_conflicts: int = 0

def _depot_stop(seq: int, depot: tuple[float, float], name: str) -> PlannedStop:
    return PlannedStop(
        seq=seq,
        kind="depot",
        order=None,
        lat=depot[0],
        lng=depot[1],
        address=name,
        phone="",
        window_start="",
        window_end="",
        notes="",
        kg=0.0,
    )


def _stop_from_order(seq: int, order: Order) -> PlannedStop:
    return PlannedStop(
        seq=seq,
        kind="stop",
        order=order,
        lat=order.lat,
        lng=order.lng,
        address=order.address,
        phone=order.phone,
        window_start=order.window_start,
        window_end=order.window_end,
        notes=order.notes,
        kg=order.kg,
    )


def _metrics(km: float, vehicle: Vehicle) -> tuple[float, float]:
    liq = litres_used(km, vehicle.l_per_100km)
    co2 = kg_co2(km, vehicle.l_per_100km, vehicle.fuel)
    return liq, co2


def _sum_totals(routes: list[PlannedRoute]) -> TotalsOut:
    return TotalsOut(
        km=sum(r.km for r in routes),
        litres=sum(r.litres for r in routes),
        kg_co2=sum(r.kg_co2 for r in routes),
    )


def _split_cluster(
    cluster: list[Order],
    vehicle: Vehicle,
) -> tuple[list[Order], list[Order], bool]:
    load: list[Order] = []
    leftover: list[Order] = []
    kg = 0.0
    overflow = False
    for order in cluster:
        if kg + order.kg <= vehicle.capacity_kg:
            load.append(order)
            kg += order.kg
        else:
            leftover.append(order)
            overflow = True
    overload = overflow or kg > vehicle.capacity_kg
    return load, leftover, overload


def assign_clusters(
    clusters: list[list[Order]],
    vehicles: list[Vehicle],
    *,
    pair_km: PairKm | None = None,
    eco_weight: float = 0.0,
    depot: tuple[float, float] | None = None,
) -> tuple[list[tuple[Vehicle, list[Order], bool]], list[int]]:
    ready = [v for v in vehicles if v.status == "ready"]
    ready.sort(key=lambda v: (-v.capacity_kg, v.plate))
    ranked = sorted(clusters, key=lambda c: -sum(o.kg for o in c))
    assigned: list[tuple[Vehicle, list[Order], bool]] = []
    unassigned: list[int] = []
    if eco_weight > 0 and pair_km is not None and depot is not None:
        remaining = list(ready)
        for cluster in ranked:
            leftover = list(cluster)
            cluster_kg = sum(o.kg for o in cluster)
            while leftover and remaining:
                best_i: int | None = None
                best_key: tuple[float, float, str] | None = None
                best_load: list[Order] | None = None
                best_rest: list[Order] = []
                best_vehicle: Vehicle | None = None
                best_split = False
                for i, vehicle in enumerate(remaining):
                    load, rest, split_over = _split_cluster(leftover, vehicle)
                    if not load:
                        continue
                    km = tour_km(load, depot, pair_km=pair_km)
                    cost = eco_leg_cost(km, vehicle.l_per_100km, vehicle.fuel, eco_weight)
                    key = (-sum(o.kg for o in load), cost, vehicle.plate)
                    if best_key is None or key < best_key:
                        best_i = i
                        best_key = key
                        best_load = load
                        best_rest = rest
                        best_vehicle = vehicle
                        best_split = split_over
                if best_i is None or best_load is None or best_vehicle is None:
                    break
                remaining.pop(best_i)
                leftover = best_rest
                overload = best_split or cluster_kg > best_vehicle.capacity_kg
                assigned.append((best_vehicle, best_load, overload))
            for order in leftover:
                if order.id is not None:
                    unassigned.append(order.id)
        return assigned, unassigned

    vi = 0
    for cluster in ranked:
        leftover = list(cluster)
        cluster_kg = sum(o.kg for o in cluster)
        while leftover and vi < len(ready):
            vehicle = ready[vi]
            vi += 1
            load, leftover, split_over = _split_cluster(leftover, vehicle)
            overload = split_over or cluster_kg > vehicle.capacity_kg
            if load:
                assigned.append((vehicle, load, overload))
            else:
                for order in leftover:
                    if order.id is not None:
                        unassigned.append(order.id)
                leftover = []
                break
        for order in leftover:
            if order.id is not None:
                unassigned.append(order.id)
    return assigned, unassigned


def _build_route(
    vehicle: Vehicle,
    orders: list[Order],
    overload: bool,
    depot: tuple[float, float],
    depot_name: str,
    color: str,
    *,
    sequence: bool,
    pair_km: PairKm = road_km,
    eco_weight: float = 0.0,
) -> PlannedRoute:
    cost_fn = (
        make_eco_pair_km(pair_km, vehicle.l_per_100km, vehicle.fuel, eco_weight)
        if eco_weight
        else pair_km
    )
    sequenced = sequence_orders(orders, depot, pair_km=pair_km, cost_fn=cost_fn) if sequence else list(orders)
    km = tour_km(sequenced, depot, pair_km=pair_km)
    liq, co2 = _metrics(km, vehicle)
    stops = [_depot_stop(0, depot, depot_name)]
    for i, order in enumerate(sequenced, start=1):
        stops.append(_stop_from_order(i, order))
    stops.append(_depot_stop(len(stops), depot, depot_name))
    return PlannedRoute(
        vehicle=vehicle,
        orders=sequenced,
        overload=overload,
        km=km,
        litres=liq,
        kg_co2=co2,
        color=color,
        stops=stops,
    )


def profiles_for_vehicles(vehicles: list[Vehicle]) -> dict[int | str, TruckProfile]:
    """Build one explicit TruckProfile per vehicle (T-LOOP-ROUTING).

    Keyed by ``vehicle.id`` (falling back to ``plate``). Unknown types
    resolve to the explicit logged default via
    :func:`profile_for_vehicle_model` — never a silent fallback.
    """
    profiles: dict[int | str, TruckProfile] = {}
    for vehicle in vehicles:
        key: int | str = vehicle.id if vehicle.id is not None else vehicle.plate
        profiles[key] = profile_for_vehicle_model(vehicle)
    return profiles


def _primary_profile(
    vehicles: list[Vehicle],
    profiles: dict[int | str, TruckProfile] | None = None,
) -> TruckProfile | None:
    """Profile driving the shared distance matrix: heaviest ready vehicle."""
    ready = [v for v in vehicles if v.status == "ready"] or list(vehicles)
    if not ready:
        return None
    profiles = profiles or profiles_for_vehicles(vehicles)
    best = max(
        ready,
        key=lambda v: (
            profiles.get(v.id if v.id is not None else v.plate) or profile_for_vehicle_model(v)
        ).gross_vehicle_weight_t,
    )
    return profiles.get(best.id if best.id is not None else best.plate)


def _inject_truck_profile(provider: RoadBaseline, profile: TruckProfile | None) -> RoadBaseline:
    """Thread the per-fleet truck profile into a Valhalla-capable provider.

    Sets ``truck_profile`` on providers that carry one (Valhalla directly,
    or the primary/innermost leg of a Fallback chain); leaves circuity and
    unknown providers untouched. Never raises.
    """
    if profile is None:
        return provider
    try:
        current = getattr(provider, "truck_profile", None)
        if current is None and hasattr(provider, "truck_profile"):
            provider.truck_profile = profile
            return provider
        primary = getattr(provider, "primary", None)
        if primary is not None:
            _inject_truck_profile(primary, profile)
            return provider
        fallback = getattr(provider, "fallback", None)
        if fallback is not None:
            _inject_truck_profile(fallback, profile)
    except Exception:
        log.warning("truck profile injection skipped for provider=%r", getattr(provider, "provider_id", "?"))
    return provider


def run_vrp(
    orders: list[Order],
    vehicles: list[Vehicle],
    depot: tuple[float, float],
    depot_name: str,
    radius_km: float = CLUSTER_RADIUS_KM,
    pair_km: PairKm | None = None,
    eco_weight: float | None = None,
    road_baseline: RoadBaseline | None = None,
    *,
    optimizer: str | None = None,
    enforce_time_windows: bool = False,
    enforce_truck_ban: bool = False,
) -> VrpResult:
    effective_optimizer = optimizer if optimizer in {"legacy", "ecoalns"} else optimizer_from_env()
    optimizer_used = effective_optimizer

    provider_name = "circuity"
    routing_quality = ROUTING_QUALITY_DEGRADED
    # T-LOOP-ROUTING: per-vehicle profiles + restriction overlay label.
    vehicle_profiles = profiles_for_vehicles(vehicles)
    primary_profile = _primary_profile(vehicles, vehicle_profiles)
    primary_class = primary_profile.vehicle_class if primary_profile else "xe_tai_nho"

    if pair_km is None:
        if not orders:
            provider_name = "circuity"
            routing_quality = ROUTING_QUALITY_UNAVAILABLE
            pair_km = CircuityRoadBaseline().pair_km
        else:
            provider = road_baseline or resolve_road_baseline()
            _inject_truck_profile(provider, primary_profile)
            points = [depot, *[(order.lat, order.lng) for order in orders]]
            cached, provider_name, routing_quality = materialize_matrix(provider, points)
            pair_km = cached.pair_km
    elif road_baseline is not None:
        provider_name = getattr(road_baseline, "provider_id", "circuity")
        routing_quality = quality_for_provider(provider_name)
    weight = eco_weight if eco_weight is not None else eco_weight_from_env()

    unassigned_ids: list[int] = []
    candidate_orders: list[Order] = []

    for order in orders:
        is_ban = False
        ban_res = check_truck_ban(order.window_start, order.window_end, primary_class)
        if ban_res.is_restricted:
            is_ban = True

        is_tw_impossible = False
        end_t = parse_hhmm(order.window_end)
        if end_t is not None:
            travel_min = pair_km(depot[0], depot[1], order.lat, order.lng) / 30.0 * 60.0
            earliest_arr = 480.0 + travel_min
            end_min = end_t.hour * 60 + end_t.minute
            if earliest_arr > end_min:
                is_tw_impossible = True

        if enforce_truck_ban and is_ban:
            if order.id is not None:
                unassigned_ids.append(order.id)
            continue

        if enforce_time_windows and is_tw_impossible:
            if order.id is not None:
                unassigned_ids.append(order.id)
            continue

        candidate_orders.append(order)

    routes: list[PlannedRoute] = []

    if effective_optimizer == "ecoalns":
        from greenlogix_api.optimizer.eco_alns import (
            CustomerNode,
            VehicleTour,
            solve_eco_alns,
        )
        ready_vehicles = [v for v in vehicles if v.status == "ready"] or list(vehicles)
        vehicle_tours = [
            VehicleTour(
                vehicle_id=v.id or 0,
                plate=v.plate,
                capacity_kg=v.capacity_kg,
                profile=vehicle_profiles.get(v.id or v.plate, DEFAULT_TRUCK_PROFILE),
                stops=[],
            )
            for v in ready_vehicles
        ]
        orders_by_id = {o.id: o for o in candidate_orders if o.id is not None}
        customer_nodes = []
        for o in candidate_orders:
            st = parse_hhmm(o.window_start)
            et = parse_hhmm(o.window_end)
            s_min = (st.hour * 60 + st.minute) if st else 480
            e_min = (et.hour * 60 + et.minute) if et else 660
            customer_nodes.append(
                CustomerNode(
                    order_id=o.id or 0,
                    lat=o.lat,
                    lng=o.lng,
                    kg=o.kg,
                    window_start_min=s_min,
                    window_end_min=e_min,
                )
            )
        eco_sol = solve_eco_alns(
            customer_nodes,
            vehicle_tours,
            depot[0],
            depot[1],
            enforce_time_windows=enforce_time_windows,
            enforce_truck_ban=enforce_truck_ban,
        )
        for un in eco_sol.unassigned:
            if un.order_id and un.order_id not in unassigned_ids:
                unassigned_ids.append(un.order_id)

        v_by_id = {v.id: v for v in ready_vehicles}
        v_by_plate = {v.plate: v for v in ready_vehicles}
        for i, tour in enumerate(eco_sol.tours):
            if not tour.stops:
                continue
            vehicle = v_by_id.get(tour.vehicle_id) or v_by_plate.get(tour.plate) or ready_vehicles[0]
            tour_orders = [orders_by_id[s.order_id] for s in tour.stops if s.order_id in orders_by_id]
            if not tour_orders:
                continue
            if enforce_time_windows:
                valid_orders: list[Order] = []
                curr_loc = depot
                curr_time = 480.0
                for o in tour_orders:
                    t_min = pair_km(curr_loc[0], curr_loc[1], o.lat, o.lng) / 30.0 * 60.0
                    arr_min = curr_time + t_min
                    et = parse_hhmm(o.window_end)
                    if et is not None and arr_min > (et.hour * 60 + et.minute):
                        if o.id is not None and o.id not in unassigned_ids:
                            unassigned_ids.append(o.id)
                    else:
                        valid_orders.append(o)
                        curr_loc = (o.lat, o.lng)
                        st = parse_hhmm(o.window_start)
                        s_min = (st.hour * 60 + st.minute) if st else 480
                        curr_time = max(arr_min, float(s_min))
                tour_orders = valid_orders

            if not tour_orders:
                continue

            km = tour_km(tour_orders, depot, pair_km=pair_km)
            liq, co2 = _metrics(km, vehicle)
            overload = sum(o.kg for o in tour_orders) > vehicle.capacity_kg
            color = ROUTE_COLORS[i % len(ROUTE_COLORS)]
            stops = [_depot_stop(0, depot, depot_name)]
            for seq, o in enumerate(tour_orders, start=1):
                stops.append(_stop_from_order(seq, o))
            stops.append(_depot_stop(len(stops), depot, depot_name))
            routes.append(
                PlannedRoute(
                    vehicle=vehicle,
                    orders=tour_orders,
                    overload=overload,
                    km=km,
                    litres=liq,
                    kg_co2=co2,
                    color=color,
                    stops=stops,
                )
            )
    else:
        clusters = greedy_clusters(candidate_orders, radius_km=radius_km)
        assigned, unassigned_cluster = assign_clusters(
            clusters,
            vehicles,
            pair_km=pair_km,
            eco_weight=weight,
            depot=depot,
        )
        for uid in unassigned_cluster:
            if uid not in unassigned_ids:
                unassigned_ids.append(uid)

        for i, (vehicle, load, overload) in enumerate(assigned):
            color = ROUTE_COLORS[i % len(ROUTE_COLORS)]
            cost_fn = (
                make_eco_pair_km(pair_km, vehicle.l_per_100km, vehicle.fuel, weight)
                if weight
                else pair_km
            )
            sequenced = sequence_orders(load, depot, pair_km=pair_km, cost_fn=cost_fn)
            if enforce_time_windows:
                valid_orders: list[Order] = []
                curr_loc = depot
                curr_time = 480.0
                for o in sequenced:
                    t_min = pair_km(curr_loc[0], curr_loc[1], o.lat, o.lng) / 30.0 * 60.0
                    arr_min = curr_time + t_min
                    et = parse_hhmm(o.window_end)
                    if et is not None and arr_min > (et.hour * 60 + et.minute):
                        if o.id is not None and o.id not in unassigned_ids:
                            unassigned_ids.append(o.id)
                    else:
                        valid_orders.append(o)
                        curr_loc = (o.lat, o.lng)
                        st = parse_hhmm(o.window_start)
                        s_min = (st.hour * 60 + st.minute) if st else 480
                        curr_time = max(arr_min, float(s_min))
                sequenced = valid_orders

            if not sequenced:
                continue

            km = tour_km(sequenced, depot, pair_km=pair_km)
            liq, co2 = _metrics(km, vehicle)
            stops = [_depot_stop(0, depot, depot_name)]
            for seq, o in enumerate(sequenced, start=1):
                stops.append(_stop_from_order(seq, o))
            stops.append(_depot_stop(len(stops), depot, depot_name))
            routes.append(
                PlannedRoute(
                    vehicle=vehicle,
                    orders=sequenced,
                    overload=overload,
                    km=km,
                    litres=liq,
                    kg_co2=co2,
                    color=color,
                    stops=stops,
                )
            )

    ban_conflicts = 0
    time_window_conflicts = 0
    for r in routes:
        curr_loc = depot
        curr_time = 480.0
        for s in r.stops:
            if s.kind == "depot":
                continue
            if check_truck_ban(s.window_start, s.window_end, primary_class).is_restricted:
                ban_conflicts += 1
            t_min = pair_km(curr_loc[0], curr_loc[1], s.lat, s.lng) / 30.0 * 60.0
            arr_min = curr_time + t_min
            et = parse_hhmm(s.window_end)
            if et is not None and arr_min > (et.hour * 60 + et.minute):
                time_window_conflicts += 1
            curr_loc = (s.lat, s.lng)
            st = parse_hhmm(s.window_start)
            s_min = (st.hour * 60 + st.minute) if st else 480
            curr_time = max(arr_min, float(s_min))

    all_routed_stops = [s for r in routes for s in r.stops if s.kind != "depot"]
    restriction_coverage = evaluate_restriction_coverage(all_routed_stops, primary_class)

    base_assign = baseline_fill(orders, vehicles)
    baseline_routes: list[PlannedRoute] = []
    for i, (vehicle, load) in enumerate(base_assign):
        baseline_routes.append(
            _build_route(
                vehicle,
                load,
                False,
                depot,
                depot_name,
                ROUTE_COLORS[i % len(ROUTE_COLORS)],
                sequence=False,
                pair_km=pair_km,
                eco_weight=weight,
            )
        )
    return VrpResult(
        routes=routes,
        unassigned_ids=sorted(set(unassigned_ids)),
        totals=_sum_totals(routes),
        baseline=_sum_totals(baseline_routes),
        distance_provider=provider_name,
        routing_quality=routing_quality,
        eco_weight=weight,
        restriction_coverage=restriction_coverage,
        optimizer_used=optimizer_used,
        ban_conflicts=ban_conflicts,
        time_window_conflicts=time_window_conflicts,
    )
