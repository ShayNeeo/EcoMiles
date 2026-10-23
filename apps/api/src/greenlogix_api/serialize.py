"""SQLModel → OpenAPI response models."""

from __future__ import annotations

from greenlogix_api.late import late_risk
from greenlogix_api.models import Order, Route, Stop, Vehicle
from greenlogix_api.schemas import OrderOut, RouteOut, StopOut, VehicleOut
from greenlogix_api.solver import PlannedRoute, PlannedStop


def order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id or 0,
        address=order.address,
        lat=order.lat,
        lng=order.lng,
        receiver=order.receiver,
        phone=order.phone,
        kg=order.kg,
        window_start=order.window_start,
        window_end=order.window_end,
        cargo_type=order.cargo_type,
        notes=order.notes,
        excel_row=order.excel_row,
        status=order.status,
        late_risk=late_risk(order.lat, order.lng, order.window_end),
        # T-LOOP-GOFA: additive provenance passthrough (all nullable).
        place_id=order.place_id,
        place_provider=order.place_provider,
        place_confidence=order.place_confidence,
        geocode_at=order.geocode_at,
    )


def vehicle_out(vehicle: Vehicle) -> VehicleOut:
    return VehicleOut(
        id=vehicle.id or 0,
        plate=vehicle.plate,
        type=vehicle.type,
        capacity_kg=vehicle.capacity_kg,
        fuel=vehicle.fuel,
        l_per_100km=vehicle.l_per_100km,
        status=vehicle.status,
        # T-02 C-02: additive envelope passthrough (None = not recorded).
        height_m=getattr(vehicle, "height_m", None),
        width_m=getattr(vehicle, "width_m", None),
        length_m=getattr(vehicle, "length_m", None),
        gvw_kg=getattr(vehicle, "gvw_kg", None),
        axle_load_t=getattr(vehicle, "axle_load_t", None),
        frontal_area_m2=getattr(vehicle, "frontal_area_m2", None),
        cd=getattr(vehicle, "cd", None),
    )


def stop_out(stop: Stop) -> StopOut:
    return StopOut(
        id=stop.id or 0,
        seq=stop.seq,
        kind=stop.kind,
        order_id=stop.order_id,
        lat=stop.lat,
        lng=stop.lng,
        address=stop.address,
        phone=stop.phone,
        window_start=stop.window_start,
        window_end=stop.window_end,
        notes=stop.notes,
        kg=stop.kg,
        status=stop.status,
        fail_reason=stop.fail_reason,
        late_risk=late_risk(stop.lat, stop.lng, stop.window_end),
    )


def route_out(route: Route, stops: list[Stop]) -> RouteOut:
    ordered = sorted(stops, key=lambda s: s.seq)
    return RouteOut(
        id=route.id or 0,
        vehicle_id=route.vehicle_id,
        plate=route.plate,
        color=route.color,
        published=route.published,
        km=route.km,
        litres=route.litres,
        kg_co2=route.kg_co2,
        overload=route.overload,
        stops=[stop_out(s) for s in ordered],
    )


def planned_to_stop_models(route_id: int, planned: PlannedRoute) -> list[Stop]:
    rows: list[Stop] = []
    for stop in planned.stops:
        rows.append(_planned_stop_row(route_id, stop))
    return rows


def _planned_stop_row(route_id: int, stop: PlannedStop) -> Stop:
    order = stop.order
    return Stop(
        route_id=route_id,
        seq=stop.seq,
        kind=stop.kind,
        order_id=order.id if order is not None else None,
        lat=stop.lat,
        lng=stop.lng,
        address=stop.address,
        phone=stop.phone,
        window_start=stop.window_start,
        window_end=stop.window_end,
        notes=stop.notes,
        kg=stop.kg,
        status="pending",
        fail_reason=None,
    )
