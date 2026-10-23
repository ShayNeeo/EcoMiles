"""Optional eco-cost hook: minimize blended km / kg_co2. Not ISO 14083."""

from __future__ import annotations

import pytest

from greenlogix_api.carbon import kg_co2
from greenlogix_api.models import Order, Vehicle
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, DEPOT_NAME
from greenlogix_api.solver import run_vrp
from greenlogix_api.solver.distance import road_km
from greenlogix_api.solver.eco import (
    eco_leg_cost,
    eco_weight_from_env,
    make_eco_pair_km,
)
from greenlogix_api.solver.nn_two_opt import nearest_neighbor
from greenlogix_api.solver.road_baseline import CircuityRoadBaseline


def _order(oid: int, lat: float, lng: float, kg: float, window: str = "08:00") -> Order:
    return Order(
        id=oid,
        address=f"a{oid}",
        lat=lat,
        lng=lng,
        receiver="KH",
        phone="",
        kg=kg,
        window_start=window,
        window_end="10:00",
        excel_row=oid,
    )


def test_eco_weight_zero_equals_km() -> None:
    assert eco_leg_cost(50.0, 12.0, "diesel", 0.0) == pytest.approx(50.0)


def test_eco_weight_one_equals_kg_co2() -> None:
    expected = kg_co2(50.0, 12.0, "diesel")
    assert eco_leg_cost(50.0, 12.0, "diesel", 1.0) == pytest.approx(expected)


def test_eco_weight_half_blends_km_and_kg_co2() -> None:
    km = 50.0
    kg = kg_co2(km, 12.0, "diesel")
    assert eco_leg_cost(km, 12.0, "diesel", 0.5) == pytest.approx(0.5 * km + 0.5 * kg)


def test_eco_weight_clamped_to_unit_interval() -> None:
    km = 20.0
    assert eco_leg_cost(km, 10.0, "petrol", -3.0) == pytest.approx(km)
    assert eco_leg_cost(km, 10.0, "petrol", 4.0) == pytest.approx(kg_co2(km, 10.0, "petrol"))


def test_make_eco_pair_km_wraps_physical_km() -> None:
    def pair(*_args: float) -> float:
        return 10.0

    cost0 = make_eco_pair_km(pair, l_per_100km=10.0, fuel="petrol", eco_weight=0.0)
    cost1 = make_eco_pair_km(pair, l_per_100km=10.0, fuel="petrol", eco_weight=1.0)
    assert cost0(0, 0, 0, 0) == pytest.approx(10.0)
    assert cost1(0, 0, 0, 0) == pytest.approx(kg_co2(10.0, 10.0, "petrol"))


def test_nn_follows_eco_cost_fn_when_not_proportional_to_km() -> None:
    depot = (10.0, 106.0)
    closer = _order(1, 10.01, 106.0, 10)
    farther = _order(2, 10.03, 106.0, 10)

    def eco_cost(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        if abs(lat2 - 10.03) < 1e-9:
            return 0.01
        return 9.0

    seq = nearest_neighbor([closer, farther], depot, pair_km=eco_cost)
    assert seq[0].id == 2
    assert road_km(depot[0], depot[1], closer.lat, closer.lng) < road_km(
        depot[0], depot[1], farther.lat, farther.lng
    )


def test_eco_weight_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GREENLOGIX_ECO_WEIGHT", raising=False)
    assert eco_weight_from_env() == 0.0
    monkeypatch.setenv("GREENLOGIX_ECO_WEIGHT", "0.25")
    assert eco_weight_from_env() == pytest.approx(0.25)
    monkeypatch.setenv("GREENLOGIX_ECO_WEIGHT", "nope")
    assert eco_weight_from_env() == 0.0


def test_run_vrp_with_eco_weight_keeps_baseline_different_and_ttw_km() -> None:
    orders = [
        _order(1, 10.776, 106.700, 80, "09:00"),
        _order(2, 10.790, 106.680, 80, "08:00"),
        _order(3, 10.760, 106.720, 80, "10:00"),
        _order(4, 10.810, 106.650, 80, "07:30"),
    ]
    vehicles = [
        Vehicle(
            id=1,
            plate="51C-000.01",
            type="xe_tai_nho",
            capacity_kg=2000,
            fuel="diesel",
            l_per_100km=12,
            status="ready",
        )
    ]
    result = run_vrp(
        orders,
        vehicles,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=50.0,
        road_baseline=CircuityRoadBaseline(),
        eco_weight=1.0,
    )
    assert result.totals.km != result.baseline.km
    assert result.totals.kg_co2 == pytest.approx(kg_co2(result.totals.km, 12.0, "diesel"))
    assert result.baseline.kg_co2 == pytest.approx(kg_co2(result.baseline.km, 12.0, "diesel"))
    assert result.distance_provider == "circuity"
    assert result.eco_weight == pytest.approx(1.0)


def test_eco_weight_assigns_lower_emission_vehicle() -> None:
    """Mixed xe_tai_nho fleet: eco_weight=1 prefers sipping petrol over thirsty diesel."""
    orders = [
        _order(1, 10.776, 106.700, 80, "09:00"),
        _order(2, 10.790, 106.680, 80, "08:00"),
    ]
    diesel = Vehicle(
        id=1,
        plate="51C-000.01",
        type="xe_tai_nho",
        capacity_kg=2000,
        fuel="diesel",
        l_per_100km=20,
        status="ready",
    )
    petrol = Vehicle(
        id=2,
        plate="51C-000.02",
        type="xe_tai_nho",
        capacity_kg=2000,
        fuel="petrol",
        l_per_100km=8,
        status="ready",
    )
    shared = {
        "orders": orders,
        "vehicles": [diesel, petrol],
        "depot": (DEPOT_LAT, DEPOT_LNG),
        "depot_name": DEPOT_NAME,
        "radius_km": 50.0,
        "road_baseline": CircuityRoadBaseline(),
    }
    km_first = run_vrp(**shared, eco_weight=0.0)
    eco_first = run_vrp(**shared, eco_weight=1.0)
    assert km_first.routes[0].vehicle.plate == "51C-000.01"
    assert eco_first.routes[0].vehicle.plate == "51C-000.02"
    assert eco_first.totals.kg_co2 < km_first.totals.kg_co2
