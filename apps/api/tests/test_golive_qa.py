"""Go-live QA: judge-visible optimize/report labels + slash/auth footguns.

CI stays offline via ROAD_BASELINE=circuity (conftest autouse).
"""

from __future__ import annotations

import pytest

from greenlogix_api.models import Order, Vehicle
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, DEPOT_NAME
from greenlogix_api.solver import run_vrp
from greenlogix_api.solver.road_baseline import (
    CircuityRoadBaseline,
    FallbackRoadBaseline,
)

AUTH = {"Authorization": "Bearer DEMO"}


def _tiny_fleet(session_add) -> None:
    session_add(
        Vehicle(
            plate="51C-000.01",
            type="xe_tai_nho",
            capacity_kg=2000,
            fuel="diesel",
            l_per_100km=12.0,
            status="ready",
        )
    )
    for i, (lat, lng, row) in enumerate(
        (
            (10.81, 106.661, 2),
            (10.70, 106.80, 3),
            (10.82, 106.661, 4),
        ),
        start=1,
    ):
        session_add(
            Order(
                address=f"stop-{i}",
                lat=lat,
                lng=lng,
                kg=80,
                excel_row=row,
                window_start="08:00",
                window_end="12:00",
            )
        )


def _seed_tiny(demo_client) -> None:
    from sqlmodel import Session

    from greenlogix_api import db as dbmod

    with Session(dbmod.engine) as session:
        _tiny_fleet(session.add)
        session.commit()


def test_optimize_exposes_baseline_vs_optimized_and_labels(demo_client, monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_ECO_WEIGHT", "1")
    _seed_tiny(demo_client)
    res = demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0})
    assert res.status_code == 200
    body = res.json()
    assert body["distance_provider"] == "circuity"
    assert body["eco_weight"] == pytest.approx(1.0)
    assert body["baseline"]["km"] > 0
    assert body["totals"]["km"] > 0
    assert body["baseline"]["km"] != body["totals"]["km"]
    assert body["baseline"]["kg_co2"] > 0
    assert body["totals"]["kg_co2"] > 0
    assert body["baseline"]["kg_co2"] != body["totals"]["kg_co2"]


def test_report_keeps_provider_and_eco_weight_labels(demo_client, monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_ECO_WEIGHT", "1")
    _seed_tiny(demo_client)
    assert demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0}).status_code == 200
    report = demo_client.get("/report", headers=AUTH)
    assert report.status_code == 200
    body = report.json()
    assert body["distance_provider"] == "circuity"
    assert body["eco_weight"] == pytest.approx(1.0)
    assert body["baseline"]["km"] != body["optimized"]["km"]
    assert body["baseline"]["kg_co2"] != body["optimized"]["kg_co2"]


def test_optimize_trailing_slash_and_case_insensitive_bearer(demo_client) -> None:
    _seed_tiny(demo_client)
    slashed = demo_client.post(
        "/optimize/",
        headers={"Authorization": "bearer demo"},
        json={"cluster_radius_km": 3.0},
    )
    assert slashed.status_code == 200, slashed.text
    assert slashed.json()["distance_provider"] == "circuity"

    tokened = demo_client.post(
        "/optimize/?token=DEMO",
        json={"cluster_radius_km": 3.0},
    )
    assert tokened.status_code == 200


def test_driver_and_report_trailing_slash(demo_client) -> None:
    _seed_tiny(demo_client)
    assert demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0}).status_code == 200
    report = demo_client.get("/report/", headers=AUTH)
    assert report.status_code == 200
    driver = demo_client.get("/driver/route/", headers={"X-Driver-Pin": "0000"})
    assert driver.status_code == 200


def test_run_vrp_fallback_label_is_circuity_not_fallback() -> None:
    class Boom:
        provider_id = "boom"

        def pair_km(self, *args: float) -> float:
            raise RuntimeError("osm down")

        def matrix_km(self, points):
            raise RuntimeError("osm down")

    orders = [
        Order(id=1, address="a", lat=10.776, lng=106.700, kg=80, excel_row=2, window_start="09:00", window_end="10:00"),
        Order(id=2, address="b", lat=10.790, lng=106.680, kg=80, excel_row=3, window_start="08:00", window_end="10:00"),
        Order(id=3, address="c", lat=10.760, lng=106.720, kg=80, excel_row=4, window_start="10:00", window_end="12:00"),
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
        road_baseline=FallbackRoadBaseline(Boom()),
        eco_weight=1.0,
    )
    assert result.distance_provider == "circuity"
    assert result.distance_provider != "fallback"
    assert result.eco_weight == pytest.approx(1.0)
    assert result.totals.km != result.baseline.km
    assert isinstance(FallbackRoadBaseline(CircuityRoadBaseline()).primary, CircuityRoadBaseline)
