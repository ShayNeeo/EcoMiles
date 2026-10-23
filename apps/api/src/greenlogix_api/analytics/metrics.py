"""Pure KPI formulas for the analytics endpoints (CR-20261018-001 §4.1).

No I/O, no DB, no FastAPI: each function takes already-aggregated inputs and
returns ``float | None``. ``None`` means *not computable from the data on hand*
— a missing input or a zero denominator. It is never a fabricated default:
callers must surface ``None`` instead of substituting 0 (the demo-grade
"invent a number" pattern is exactly what this CR removes).
"""

from __future__ import annotations

from collections.abc import Sequence


def _pct(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator * 100.0

def _bounded_pct(numerator: float | None, denominator: float | None) -> float | None:
    """Share that cannot physically exceed 100 %.

    A share whose numerator is negative, or larger than its denominator, means
    the inputs disagree (a bad join, a double-counted row). ``None`` is the
    honest answer: an impossible percentage is worse than a missing one.
    """
    if numerator is not None and numerator < 0:
        return None
    if numerator is not None and denominator is not None and numerator > denominator:
        return None
    return _pct(numerator, denominator)

def _ratio(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator

def empty_running_pct(km_empty: float | None, km_total: float | None) -> float | None:
    """Empty vehicle-km ÷ total vehicle-km × 100.

    Standard: Eurostat road-freight indicator "empty running" (share of the
    vehicle-km driven without cargo). Bounded to 0–100 %: empty km can never
    exceed total km, so an out-of-range pair yields ``None`` rather than an
    impossible share. ``None`` also when either input is missing or
    ``km_total == 0``. Today ``routes`` stores closed depot loops with no empty
    leg recorded, so callers pass ``km_empty=None`` and get ``None`` back —
    reporting 0 % would claim a measured empty share that does not exist.
    """
    return _bounded_pct(km_empty, km_total)

def payload_utilisation_pct(
    kg_delivered: float | None, capacity_kg_dispatched: float | None
) -> float | None:
    """kg delivered ÷ capacity dispatched × 100.

    Standard: fleet-utilisation metric (weight-based payload utilisation of the
    deployed fleet). The denominator is the capacity of every route dispatch
    (a vehicle running two routes contributes its capacity twice), so the share
    matches what was actually offered on the road and agrees with
    ``routes.overload``.

    ``None`` when either input is missing or nothing was dispatched (capacity 0
    ⇒ no utilisation to state, never 0 %). Deliberately *not* bounded at 100 %:
    an overloaded dispatch is a real, reportable value > 100 %.
    """
    return _pct(kg_delivered, capacity_kg_dispatched)

def vehicle_fill_pct(stops_per_vehicle: Sequence[float] | None) -> float | None:
    """Mean stops per **used** vehicle ÷ stops of the fullest used vehicle × 100.

    Standard: fleet-utilisation metric (how evenly the delivery stops are
    spread over the deployed fleet; the fullest vehicle is the reference).
    Entries that are not positive (idle or un-planned vehicles) are dropped
    before the mean, so an idle vehicle can never drag the fill down — callers
    may hand over a whole fleet safely. ``None`` when nothing positive remains.
    """
    busy = [stops for stops in (stops_per_vehicle or []) if stops > 0]
    if not busy:
        return None
    mean_stops = sum(busy) / len(busy)
    return _pct(mean_stops, max(busy))

def otif_pct(on_time: int | None, orders: int | None) -> float | None:
    """(delivered AND within window_end) ÷ orders × 100.

    Standard: OTIF/DIFOT — the SCOR Perfect-Order family (on-time-in-full
    delivery share). Bounded to 0–100 %: more in-window deliveries than orders
    is a join error, not a 110 % service level, so an out-of-range pair yields
    ``None``. ``None`` also when either input is missing or ``orders == 0``.
    ``stops`` carry no delivered-at timestamp, so the delivered-in-window count
    cannot be measured and callers pass ``on_time=None``; the modelled
    late-risk share is exposed separately and labelled ``modelled``.
    """
    return _bounded_pct(on_time, orders)

def km_per_stop(km: float | None, stops: int | None) -> float | None:
    """Route km ÷ delivery stops.

    Standard: last-mile productivity set (distance per stop). ``None`` when
    either input is missing or ``stops == 0`` (no delivery ⇒ nothing to divide
    by).
    """
    return _ratio(km, stops)

def stops_per_hour(stops: int | None, hours: float | None) -> float | None:
    """Delivery stops ÷ route hours.

    Standard: last-mile productivity set (stops per vehicle-hour). ``None``
    when either input is missing or ``hours == 0``. No route start/end time is
    stored anywhere in the schema today, so ``hours`` is unavailable and
    callers pass ``None``.
    """
    return _ratio(stops, hours)

def cost_per_order(cost_vnd: float | None, routed_orders: int | None) -> float | None:
    """Transport cost (VND) ÷ **routed** orders.

    Standard: transport cost metric (cost per order carried). The denominator is
    the orders a route actually covers (delivery stops on a route), not every
    row in ``orders``: pending, un-routed orders carry no transport cost, and
    dividing by them would report a cost nobody paid. ``None`` when either
    input is missing, ``routed_orders == 0`` (nothing routed ⇒ no per-order
    cost to state, never 0 VND), or the cost is unknown — the fuel price is
    env-supplied (``ECOMILES_FUEL_PRICE_VND_PER_L``) and stays unset until an
    operator states it, so no price is ever invented here.
    """
    return _ratio(cost_vnd, routed_orders)

def cost_per_km(cost_vnd: float | None, km: float | None) -> float | None:
    """Transport cost (VND) ÷ km.

    Standard: transport cost metric (cost per vehicle-km). ``None`` when either
    input is missing, ``km == 0``, or the fuel price is unset (see
    :func:`cost_per_order`).
    """
    return _ratio(cost_vnd, km)

def g_co2e_per_tkm(
    kg_co2e: float | None, transport_work_tkm: float | None
) -> float | None:
    """kg CO2e × 1000 ÷ transport work (tonne-km) — grams CO2e per tonne-km.

    Standard: **GLEC Framework v3.2 / ISO 14083** functional unit
    (g CO2e / t·km); the boundary of ``kg_co2e`` must be labelled in the
    payload (TTW here).

    ``transport_work_tkm`` is the per-route work ``Σ_r (payload_r [t] × km_r)``,
    computed where the routes are known (``queries.py``) — it is deliberately
    not a (Σ payload) × (Σ km) product, which would over-state the denominator
    by roughly the number of routes. ``None`` when either input is missing or
    the work is 0 (no tonne-km moved ⇒ no intensity).
    """
    if kg_co2e is None:
        return None
    return _ratio(kg_co2e * 1000.0, transport_work_tkm)

def g_co2e_per_order(kg_co2e: float | None, routed_orders: int | None) -> float | None:
    """kg CO2e × 1000 ÷ **routed** orders — grams CO2e per order carried.

    Standard: derived from the GLEC v3.2 / ISO 14083 per-shipment intensity
    (same functional-unit family, per-order denominator). The denominator is
    the orders a route actually covers (delivery stops on a route): every kg of
    ``kg_co2e`` was burned carrying those orders, so dividing by un-routed
    orders would spread real emissions over orders that never moved. ``None``
    when either input is missing or nothing is routed (``routed_orders == 0``)
    — an empty plan must not read as "0 g per order".
    """
    if kg_co2e is None:
        return None
    return _ratio(kg_co2e * 1000.0, routed_orders)

def kg_co2e_wtw(
    kg_co2e_ttw: float | None, wtw_ttw_ratio: float | None
) -> float | None:
    """Tank-to-wheel kg CO2e × WTW/TTW factor = well-to-wheel kg CO2e.

    Standard: **GLEC Framework v3.2 / ISO 14083** well-to-wheel boundary; the
    WTW factor comes from ``apps/api/data/emission_factors.json``
    (diesel 3.24, petrol 2.82 kg CO2e/L). ``None`` when either input is missing.
    """
    if kg_co2e_ttw is None or wtw_ttw_ratio is None:
        return None
    return kg_co2e_ttw * wtw_ttw_ratio

def kg_co2e_wtw_from_fuel(
    litres_by_fuel: Sequence[tuple[float | None, float | None]] | None,
) -> float | None:
    """Sum of (litres × wtw_factor) across routed fuels.

    Standard: **GLEC Framework v3.2 / ISO 14083** well-to-wheel boundary.
    Returns None if litres_by_fuel is empty/None, if total litres is 0,
    or if any routed vehicle's WTW factor is missing.
    """
    if not litres_by_fuel:
        return None
    total = 0.0
    has_routed = False
    for litres, factor in litres_by_fuel:
        if litres is None or litres == 0:
            continue
        if factor is None:
            return None
        total += litres * factor
        has_routed = True
    return total if has_routed else None
