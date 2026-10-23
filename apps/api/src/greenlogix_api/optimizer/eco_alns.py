"""EcoALNS: Adaptive Large Neighborhood Search for Green Vehicle Routing.

Implements the canonical Pollution-Routing destroy and repair operators (Demir et al. 2012)
with load-dependent and uphill-payload considerations (Lai et al. 2024).
"""

from __future__ import annotations

import copy
import math
import random
import time
from collections.abc import Callable
from dataclasses import dataclass, field

from greenlogix_api.energy.base import EnergyModel
from greenlogix_api.energy.hdt_v1 import HdtEnergyModelV1
from greenlogix_api.geo.restrictions import check_truck_ban
from greenlogix_api.geo.truck_profile import DEFAULT_TRUCK_PROFILE, TruckProfile
from greenlogix_api.solver.distance import haversine_km


@dataclass
class CustomerNode:
    order_id: int
    lat: float
    lng: float
    kg: float
    window_start_min: int = 480  # 08:00
    window_end_min: int = 660    # 11:00


@dataclass
class VehicleTour:
    vehicle_id: int
    plate: str
    capacity_kg: float
    profile: TruckProfile = DEFAULT_TRUCK_PROFILE
    stops: list[CustomerNode] = field(default_factory=list)


@dataclass
class EcoSolution:
    tours: list[VehicleTour]
    depot_lat: float
    depot_lng: float
    total_km: float = 0.0
    total_fuel_litres: float = 0.0
    total_co2: float = 0.0
    unassigned: list[CustomerNode] = field(default_factory=list)
    # Convergence trace (CR-12/CR-13 v2 slice, additive).
    #
    # One row per ALNS iteration: iteration, fuel, unassigned, accepted,
    # destroy_op, repair_op, temperature. Deterministic given seed except
    # wall-clock budget truncation (budget path returns best-so-far with a
    # short trace — length asserts only, never time equality).
    convergence_trace: list[dict[str, object]] = field(default_factory=list)


def evaluate_tour_metrics(
    tour: VehicleTour,
    depot_lat: float,
    depot_lng: float,
    energy_model: EnergyModel | None = None,
) -> tuple[float, float, float]:
    """Compute total distance (km), fuel (litres), and CO2 (kg) for a tour."""
    model = energy_model or HdtEnergyModelV1()
    if not tour.stops:
        return 0.0, 0.0, 0.0

    total_km = 0.0
    total_fuel = 0.0
    total_co2 = 0.0

    # Total payload loaded at depot
    current_payload = sum(s.kg for s in tour.stops)

    # Leg 1: Depot to Stop 1
    prev_lat, prev_lng = depot_lat, depot_lng
    for stop in tour.stops:
        leg_km = haversine_km(prev_lat, prev_lng, stop.lat, stop.lng) * 1.35
        est = model.estimate_segment_energy(
            length_km=leg_km,
            profile=tour.profile,
            payload_kg=current_payload,
            speed_kmh=30.0,
        )
        total_km += leg_km
        total_fuel += est.fuel_litres
        total_co2 += est.ttw_kg_co2

        # Cargo delivered at this stop
        current_payload = max(0.0, current_payload - stop.kg)
        prev_lat, prev_lng = stop.lat, stop.lng

    # Return leg: Last stop back to Depot
    return_km = haversine_km(prev_lat, prev_lng, depot_lat, depot_lng) * 1.35
    est_return = model.estimate_segment_energy(
        length_km=return_km,
        profile=tour.profile,
        payload_kg=0.0,  # empty truck returning to depot
        speed_kmh=35.0,
    )
    total_km += return_km
    total_fuel += est_return.fuel_litres
    total_co2 += est_return.ttw_kg_co2

    return round(total_km, 2), round(total_fuel, 4), round(total_co2, 4)


def _roulette_choice(rng: random.Random, weights: dict[str, float]) -> str:
    """Roulette-wheel selection over operator weights. Deterministic given rng."""
    total = sum(weights.values())
    r = rng.random() * total
    upto = 0.0
    for key, w in weights.items():
        upto += w
        if r <= upto:
            return key
    return next(reversed(weights))


def _insertion_fuel_delta(
    tour: VehicleTour,
    customer: CustomerNode,
    pos: int,
    depot_lat: float,
    depot_lng: float,
    *,
    enforce_time_windows: bool = False,
    enforce_truck_ban: bool = False,
) -> float:
    """Fuel delta of inserting customer at pos. Inf if constraints violated."""
    if sum(s.kg for s in tour.stops) + customer.kg > tour.capacity_kg:
        return float("inf")

    if enforce_truck_ban:
        v_class = getattr(getattr(tour, "profile", None), "vehicle_class", "xe_tai_nho")
        w_start = f"{int(customer.window_start_min) // 60:02d}:{int(customer.window_start_min) % 60:02d}"
        w_end = f"{int(customer.window_end_min) // 60:02d}:{int(customer.window_end_min) % 60:02d}"
        if check_truck_ban(w_start, w_end, v_class).is_restricted:
            return float("inf")

    if enforce_time_windows:
        candidate_stops = [*tour.stops[:pos], customer, *tour.stops[pos:]]
        cur_lat, cur_lng = depot_lat, depot_lng
        cur_time = 480.0  # 08:00
        for s in candidate_stops:
            leg_km = haversine_km(cur_lat, cur_lng, s.lat, s.lng) * 1.35
            arr_time = cur_time + (leg_km / 30.0 * 60.0)
            if arr_time > s.window_end_min:
                return float("inf")
            cur_time = max(arr_time, float(s.window_start_min))
            cur_lat, cur_lng = s.lat, s.lng

    _, old_fuel, _ = evaluate_tour_metrics(tour, depot_lat, depot_lng)
    tour.stops.insert(pos, customer)
    _, new_fuel, _ = evaluate_tour_metrics(tour, depot_lat, depot_lng)
    tour.stops.pop(pos)
    return new_fuel - old_fuel

def single_random_destroy(
    tours: list[VehicleTour],
    destroy_count: int,
    rng: random.Random,
) -> list[CustomerNode]:
    """Destroy op 1 (legacy): pop one random stop per tour until count reached."""
    removed: list[CustomerNode] = []
    for tour in tours:
        if len(tour.stops) > 1 and len(removed) < destroy_count:
            idx = rng.randint(0, len(tour.stops) - 1)
            removed.append(tour.stops.pop(idx))
    return removed


def random_removal_destroy(
    tours: list[VehicleTour],
    destroy_count: int,
    rng: random.Random,
) -> list[CustomerNode]:
    """Destroy op 2: pool every stop, shuffle deterministically, remove first N.

    Unlike single_random_destroy (at most one per tour), this can empty a
    small tour and diversifies neighborhoods. Seeded via rng — no global random.
    """
    indexed: list[tuple[int, int]] = [
        (ti, si) for ti, t in enumerate(tours) for si in range(len(t.stops))
    ]
    rng.shuffle(indexed)
    victims = indexed[:destroy_count]
    removed: list[CustomerNode] = []
    by_tour: dict[int, list[int]] = {}
    for ti, si in victims:
        by_tour.setdefault(ti, []).append(si)
    for ti, positions in by_tour.items():
        for si in sorted(positions, reverse=True):
            if 0 <= si < len(tours[ti].stops):
                removed.append(tours[ti].stops.pop(si))
    return removed


def worst_fuel_removal_destroy(
    tours: list[VehicleTour],
    destroy_count: int,
    rng: random.Random,
    depot_lat: float = 10.8123,
    depot_lng: float = 106.6543,
) -> list[CustomerNode]:
    """Destroy op 3 (CR-13 GreenLogix): worst marginal-fuel removal.

    Scores each stop by its removal saving (current tour fuel minus fuel
    without that stop, via full re-evaluation so payload-before-leg effects
    per §11.5 are captured), removes the highest-saving stops first.
    Exact ties broken by seeded rng draw only — otherwise deterministic.
    Capacity-independent (removal never violates capacity).
    """
    scored: list[tuple[float, int, int]] = []
    for ti, tour in enumerate(tours):
        if not tour.stops:
            continue
        _, base_fuel, _ = evaluate_tour_metrics(tour, depot_lat, depot_lng)
        for si, _stop in enumerate(tour.stops):
            removed_stop = tour.stops.pop(si)
            _, rest_fuel, _ = evaluate_tour_metrics(tour, depot_lat, depot_lng)
            tour.stops.insert(si, removed_stop)
            scored.append((base_fuel - rest_fuel, ti, si))
    # Highest saving first; exact-tie shuffle via rng keeps determinism.
    scored.sort(key=lambda e: e[0])
    tied: list[list[tuple[float, int, int]]] = []
    for entry in scored:
        if tied and tied[-1] and tied[-1][0][0] == entry[0]:
            tied[-1].append(entry)
        else:
            tied.append([entry])
    ordered: list[tuple[float, int, int]] = []
    for group in reversed(tied):
        if len(group) > 1:
            group = list(group)
            rng.shuffle(group)
        ordered.extend(group)
    victims = ordered[:destroy_count]
    removed: list[CustomerNode] = []
    by_tour: dict[int, list[int]] = {}
    for _, ti, si in victims:
        by_tour.setdefault(ti, []).append(si)
    for ti, positions in by_tour.items():
        for si in sorted(positions, reverse=True):
            if 0 <= si < len(tours[ti].stops):
                removed.append(tours[ti].stops.pop(si))
    return removed


def uphill_payload_removal_destroy(
    tours: list[VehicleTour],
    destroy_count: int,
    rng: random.Random,
    depot_lat: float = 10.8123,
    depot_lng: float = 106.6543,
) -> list[CustomerNode]:
    """Destroy op 4 (CR-13 GreenLogix): uphill-payload removal.

    Proxy for the §11.5 / Lai-2024 insight (heavy payload carried through
    expensive legs first): scores each stop by payload-before-leg × leg-km
    summed over legs the stop's payload travels, removes the highest first.
    CustomerNode carries no grade field, so leg-km stands in for segment
    cost — heavier-earlier stops on longer legs score highest. Exact ties
    broken by seeded rng draw only. Deterministic otherwise.
    """
    scored: list[tuple[float, int, int]] = []
    for ti, tour in enumerate(tours):
        if not tour.stops:
            continue
        total_payload = sum(s.kg for s in tour.stops)
        carried = total_payload
        prev_lat, prev_lng = depot_lat, depot_lng
        for si, stop in enumerate(tour.stops):
            leg_km = haversine_km(prev_lat, prev_lng, stop.lat, stop.lng) * 1.35
            scored.append((carried * leg_km, ti, si))
            carried = max(0.0, carried - stop.kg)
            prev_lat, prev_lng = stop.lat, stop.lng
    scored.sort(key=lambda e: e[0])
    tied: list[list[tuple[float, int, int]]] = []
    for entry in scored:
        if tied and tied[-1] and tied[-1][0][0] == entry[0]:
            tied[-1].append(entry)
        else:
            tied.append([entry])
    ordered: list[tuple[float, int, int]] = []
    for group in reversed(tied):
        if len(group) > 1:
            group = list(group)
            rng.shuffle(group)
        ordered.extend(group)
    victims = ordered[:destroy_count]
    removed: list[CustomerNode] = []
    by_tour: dict[int, list[int]] = {}
    for _, ti, si in victims:
        by_tour.setdefault(ti, []).append(si)
    for ti, positions in by_tour.items():
        for si in sorted(positions, reverse=True):
            if 0 <= si < len(tours[ti].stops):
                removed.append(tours[ti].stops.pop(si))
    return removed


def ban_window_removal_destroy(
    tours: list[VehicleTour],
    destroy_count: int,
    rng: random.Random,
    depot_lat: float = 10.8123,
    depot_lng: float = 106.6543,
) -> list[CustomerNode]:
    """Destroy op 5 (CR-13 GreenLogix): ban-window conflict removal.

    Scores each stop by Decision 23/2018 overlap (geo.restrictions
    .check_truck_ban on the stop window x tour profile class): restricted
    stops first, unrestricted last. Binary score - exact ties broken by
    seeded rng draw only, deterministic otherwise. Removal never violates
    capacity; ACTIVE_RULES only read, never mutated.
    """
    scored: list[tuple[int, int, int]] = []
    for ti, tour in enumerate(tours):
        if not tour.stops:
            continue
        v_class = getattr(getattr(tour, "profile", None), "vehicle_class", "xe_tai_nho")
        for si, stop in enumerate(tour.stops):
            try:
                w_start = f"{int(stop.window_start_min) // 60:02d}:{int(stop.window_start_min) % 60:02d}"
                w_end = f"{int(stop.window_end_min) // 60:02d}:{int(stop.window_end_min) % 60:02d}"
                restricted = bool(check_truck_ban(w_start, w_end, v_class).is_restricted)
            except Exception:
                restricted = False
            scored.append((1 if restricted else 0, ti, si))
    scored.sort(key=lambda e: e[0])
    tied: list[list[tuple[int, int, int]]] = []
    for entry in scored:
        if tied and tied[-1] and tied[-1][0][0] == entry[0]:
            tied[-1].append(entry)
        else:
            tied.append([entry])
    ordered: list[tuple[int, int, int]] = []
    for group in reversed(tied):
        if len(group) > 1:
            group = list(group)
            rng.shuffle(group)
        ordered.extend(group)
    victims = ordered[:destroy_count]
    removed: list[CustomerNode] = []
    by_tour: dict[int, list[int]] = {}
    for _, ti, si in victims:
        by_tour.setdefault(ti, []).append(si)
    for ti, positions in by_tour.items():
        for si in sorted(positions, reverse=True):
            if 0 <= si < len(tours[ti].stops):
                removed.append(tours[ti].stops.pop(si))
    return removed


def eco_greedy_repair(
    removed: list[CustomerNode],
    tours: list[VehicleTour],
    depot_lat: float,
    depot_lng: float,
    *,
    enforce_time_windows: bool = False,
    enforce_truck_ban: bool = False,
) -> list[CustomerNode]:
    """Repair op 1 (legacy): eco-marginal cheapest-fuel insertion per customer."""
    still_out: list[CustomerNode] = []
    for c in removed:
        best_tour: VehicleTour | None = None
        best_pos = -1
        best_delta = float("inf")
        for tour in tours:
            for pos in range(len(tour.stops) + 1):
                delta = _insertion_fuel_delta(
                    tour,
                    c,
                    pos,
                    depot_lat,
                    depot_lng,
                    enforce_time_windows=enforce_time_windows,
                    enforce_truck_ban=enforce_truck_ban,
                )
                if delta < best_delta:
                    best_delta = delta
                    best_tour = tour
                    best_pos = pos
        if best_tour is not None and best_pos >= 0 and best_delta < float("inf"):
            best_tour.stops.insert(best_pos, c)
        else:
            still_out.append(c)
    return still_out

def eco_regret_repair(
    removed: list[CustomerNode],
    tours: list[VehicleTour],
    depot_lat: float,
    depot_lng: float,
    *,
    enforce_time_windows: bool = False,
    enforce_truck_ban: bool = False,
) -> list[CustomerNode]:
    """Repair op 2: regret-2 insertion with time-window-aware tie-break.

    Each round computes best/second-best feasible insertion fuel delta per
    pending customer, inserts the customer with max regret first. Ties broken
    by earliest window_end_min (time-window-aware greedy). Deterministic:
    iteration order sorted by order_id, no randomness inside.
    """
    pending = sorted(removed, key=lambda c: c.order_id)
    still_out: list[CustomerNode] = []
    while pending:
        best_regret = float("-inf")
        best_c: CustomerNode | None = None
        best_tour: VehicleTour | None = None
        best_pos = -1
        for c in pending:
            first = float("inf")
            second = float("inf")
            first_tour: VehicleTour | None = None
            first_pos = -1
            for tour in tours:
                for pos in range(len(tour.stops) + 1):
                    delta = _insertion_fuel_delta(
                        tour,
                        c,
                        pos,
                        depot_lat,
                        depot_lng,
                        enforce_time_windows=enforce_time_windows,
                        enforce_truck_ban=enforce_truck_ban,
                    )
                    if delta < first:
                        second = first
                        first = delta
                        first_tour = tour
                        first_pos = pos
                    elif delta < second:
                        second = delta
            if first == float("inf"):
                regret = float("-inf")
            elif second == float("inf"):
                regret = first  # only one feasible spot: prioritize by cost
            else:
                regret = second - first
            # Time-window-aware tie-break: earlier deadline wins ties.
            if best_c is None or regret > best_regret or (
                regret == best_regret and c.window_end_min < best_c.window_end_min
            ):
                best_regret = regret
                best_c = c
                best_tour = first_tour
                best_pos = first_pos
        assert best_c is not None
        if best_tour is not None and best_pos >= 0 and best_regret > float("-inf"):
            best_tour.stops.insert(best_pos, best_c)
            pending.remove(best_c)
        else:
            still_out.append(best_c)
            pending.remove(best_c)
    return still_out


def _update_weights(
    weights: dict[str, float],
    chosen: str,
    improved: bool,
    reward: float = 0.2,
    decay: float = 0.99,
    floor: float = 0.1,
) -> None:
    """Simple adaptive weight update: reward global-best iterations, else decay."""
    if improved:
        weights[chosen] = weights.get(chosen, 1.0) + reward
    else:
        weights[chosen] = max(floor, weights.get(chosen, 1.0) * decay)


DESTROY_OPS: dict[str, Callable] = {
    "single_random": single_random_destroy,
    "random_removal": random_removal_destroy,
    "worst_fuel": worst_fuel_removal_destroy,
    "uphill_payload": uphill_payload_removal_destroy,
    "ban_window": ban_window_removal_destroy,
}

REPAIR_OPS: dict[str, Callable] = {
    "eco_greedy": eco_greedy_repair,
    "eco_regret": eco_regret_repair,
}


def solve_eco_alns(
    customers: list[CustomerNode],
    vehicles: list[VehicleTour],
    depot_lat: float,
    depot_lng: float,
    *,
    iterations: int = 30,
    seed: int = 42,
    destroy_op: str | None = None,
    repair_op: str | None = None,
    acceptance: str = "hillclimb",
    sa_temp0: float = 1.0,
    sa_cooling: float = 0.995,
    time_budget_s: float | None = None,
    enforce_time_windows: bool = False,
    enforce_truck_ban: bool = False,
) -> EcoSolution:
    """Solve green VRP using Adaptive Large Neighborhood Search.

    Operators: destroy in {single_random, random_removal, worst_fuel,
    uphill_payload, ban_window, none}; repair in {eco_greedy, eco_regret}. None
    (default) = adaptive roulette-wheel selection with simple reward
    (+0.2 on global-best, x0.99 decay otherwise, floor 0.1).
    destroy_op="none" skips the destroy step (ablation baseline).
    All randomness flows from random.Random(seed) — same seed gives
    identical output (temperature schedule is closed-form; budget path
    truncates by wall-clock so only trace length varies, never results).

    Acceptance (CR-12 v2 slice, opt-in): "hillclimb" (default — accept
    candidate iff fuel <= best AND unassigned count does not grow,
    documented; no SA temperature) or "sa" (simulated annealing —
    always accept improvements; accept worse fuel with probability
    exp(-delta/temp), temp = sa_temp0 * sa_cooling**it, draws from the
    seeded rng; unassigned growth still rejected to protect feasibility).

    Budget (CR-12 v2 slice, opt-in): time_budget_s caps wall-clock
    seconds; loop stops early and returns best-so-far with its trace.

    Trace (CR-12 v2 slice): best_solution.convergence_trace holds one
    row per iteration (iteration, fuel, unassigned, accepted,
    destroy_op, repair_op, temperature).
    """
    rng = random.Random(seed)
    use_sa = acceptance.strip().lower() in {"sa", "annealing", "simulated_annealing"}
    solution = EcoSolution(tours=copy.deepcopy(vehicles), depot_lat=depot_lat, depot_lng=depot_lng)

    # Initial construction: capacity-aware greedy assignment
    pool = list(customers)
    for c in pool:
        assigned = False
        for tour in solution.tours:
            current_kg = sum(s.kg for s in tour.stops)
            if current_kg + c.kg <= tour.capacity_kg:
                if enforce_truck_ban:
                    v_class = getattr(getattr(tour, "profile", None), "vehicle_class", "xe_tai_nho")
                    w_start = f"{int(c.window_start_min) // 60:02d}:{int(c.window_start_min) % 60:02d}"
                    w_end = f"{int(c.window_end_min) // 60:02d}:{int(c.window_end_min) % 60:02d}"
                    if check_truck_ban(w_start, w_end, v_class).is_restricted:
                        continue
                if enforce_time_windows:
                    candidate = [*tour.stops, c]
                    cur_lat, cur_lng = depot_lat, depot_lng
                    cur_time = 480.0
                    violates = False
                    for s in candidate:
                        leg_km = haversine_km(cur_lat, cur_lng, s.lat, s.lng) * 1.35
                        arr_time = cur_time + (leg_km / 30.0 * 60.0)
                        if arr_time > s.window_end_min:
                            violates = True
                            break
                        cur_time = max(arr_time, float(s.window_start_min))
                        cur_lat, cur_lng = s.lat, s.lng
                    if violates:
                        continue
                tour.stops.append(c)
                assigned = True
                break
        if not assigned:
            solution.unassigned.append(c)
    # Evaluate baseline
    tot_km, tot_fuel, tot_co2 = 0.0, 0.0, 0.0
    for t in solution.tours:
        k, f, c = evaluate_tour_metrics(t, depot_lat, depot_lng)
        tot_km += k
        tot_fuel += f
        tot_co2 += c
    solution.total_km = round(tot_km, 2)
    solution.total_fuel_litres = round(tot_fuel, 4)
    solution.total_co2 = round(tot_co2, 4)

    best_solution = copy.deepcopy(solution)

    # ALNS loop (hill-climb default; SA opt-in; adaptive weights when op not pinned)
    destroy_count = max(1, min(3, len(customers) // 4))
    destroy_weights: dict[str, float] = {
        "single_random": 1.0,
        "random_removal": 1.0,
        "worst_fuel": 1.0,
        "uphill_payload": 1.0,
        "ban_window": 1.0,
    }
    repair_weights: dict[str, float] = {"eco_greedy": 1.0, "eco_regret": 1.0}
    deadline = None if time_budget_s is None else time.perf_counter() + time_budget_s

    for it in range(iterations):
        if deadline is not None and time.perf_counter() >= deadline:
            break
        current = copy.deepcopy(best_solution)
        # Trace rows are deep-copied with best_solution — reset the working
        # copy so rows accumulate on best only when it improves/breaks ties.
        current.convergence_trace = list(best_solution.convergence_trace)

        d_name = destroy_op
        if d_name is None:
            d_name = _roulette_choice(rng, destroy_weights)
        r_name = repair_op
        if r_name is None:
            r_name = _roulette_choice(rng, repair_weights)
        temperature = sa_temp0 * (sa_cooling**it) if use_sa else 0.0

        # 1. Destroy step (skipped when destroy_op="none" for ablation)
        removed: list[CustomerNode] = []
        if d_name != "none":
            destroy_fn = DESTROY_OPS[d_name]
            try:
                removed = destroy_fn(current.tours, destroy_count, rng, depot_lat, depot_lng)
            except TypeError:
                # Legacy 3-arg destroy ops (single_random, random_removal).
                removed = destroy_fn(current.tours, destroy_count, rng)

        # 2. Repair step
        if removed:
            repair_fn = REPAIR_OPS[r_name]
            try:
                failed = repair_fn(
                    removed,
                    current.tours,
                    depot_lat,
                    depot_lng,
                    enforce_time_windows=enforce_time_windows,
                    enforce_truck_ban=enforce_truck_ban,
                )
            except TypeError:
                failed = repair_fn(removed, current.tours, depot_lat, depot_lng)
            current.unassigned.extend(failed)
        # 3. Acceptance evaluation (hill-climb)
        cur_km, cur_fuel, cur_co2 = 0.0, 0.0, 0.0
        for t in current.tours:
            k, f, c = evaluate_tour_metrics(t, depot_lat, depot_lng)
            cur_km += k
            cur_fuel += f
            cur_co2 += c
        current.total_km = round(cur_km, 2)
        current.total_fuel_litres = round(cur_fuel, 4)
        current.total_co2 = round(cur_co2, 4)

        improved = (
            current.total_fuel_litres <= best_solution.total_fuel_litres
            and len(current.unassigned) <= len(best_solution.unassigned)
        )
        accepted = improved
        if use_sa and not improved:
            # SA uphill move: worse fuel accepted with exp(-delta/temp);
            # unassigned growth still rejected to protect feasibility.
            # Weight update below still uses `improved` (true global-best
            # gain), not SA acceptance, so uphill moves never earn reward.
            delta = current.total_fuel_litres - best_solution.total_fuel_litres
            feasible_move = len(current.unassigned) <= len(best_solution.unassigned)
            if feasible_move and temperature > 0 and rng.random() < math.exp(-delta / temperature):
                accepted = True
        if accepted:
            current.convergence_trace.append(
                {
                    "iteration": it,
                    "fuel": current.total_fuel_litres,
                    "unassigned": len(current.unassigned),
                    "accepted": True,
                    "destroy_op": d_name,
                    "repair_op": r_name,
                    "temperature": round(temperature, 6),
                }
            )
            best_solution = current
        else:
            best_solution.convergence_trace.append(
                {
                    "iteration": it,
                    "fuel": best_solution.total_fuel_litres,
                    "unassigned": len(best_solution.unassigned),
                    "accepted": False,
                    "destroy_op": d_name,
                    "repair_op": r_name,
                    "temperature": round(temperature, 6),
                }
            )

        # 4. Adaptive weight update (only for adaptively chosen ops)
        if destroy_op is None and d_name != "none":
            _update_weights(destroy_weights, d_name, improved)
        if repair_op is None:
            _update_weights(repair_weights, r_name, improved)

    return best_solution
