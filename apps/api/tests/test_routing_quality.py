"""CR-01: routing_quality taxonomy — circuity never masquerades as truck-safe.

- Circuity -> DEGRADED (explicit label, still optimizable).
- OSRM/Valhalla injected transport -> VERIFIED_GRAPH.
- Provider boom (OSM down) -> circuity fallback named "circuity", DEGRADED.
- materialize_matrix returns (baseline, name, quality); empty points -> UNAVAILABLE.
- /optimize + /report expose routing_quality; fail-closed publish guard helper.
- eco_weight>0 logs deprecation warning; CORS allowlist respected.
"""

from __future__ import annotations

import json
import logging

import pytest

from greenlogix_api.models import Order, Vehicle
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, DEPOT_NAME
from greenlogix_api.solver import run_vrp
from greenlogix_api.solver.flags import (
    OPTIMIZER_ECOALNS,
    OPTIMIZER_LEGACY,
    optimizer_from_env,
    publish_blocked_for_quality,
)
from greenlogix_api.solver.road_baseline import (
    CircuityRoadBaseline,
    OsrmRoadBaseline,
    ValhallaRoadBaseline,
    materialize_matrix,
    quality_for_provider,
)

AUTH = {"Authorization": "Bearer DEMO"}


def _order(oid: int, lat: float, lng: float) -> Order:
    return Order(
        id=oid,
        address=f"a{oid}",
        lat=lat,
        lng=lng,
        receiver="KH",
        phone="",
        kg=80,
        window_start="08:00",
        window_end="10:00",
        excel_row=oid,
    )


def _vehicle(vid: int = 1) -> Vehicle:
    return Vehicle(
        id=vid,
        plate="51C-000.01",
        type="xe_tai_nho",
        capacity_kg=2000,
        fuel="diesel",
        l_per_100km=12,
        status="ready",
    )


ORDERS = [
    _order(1, 10.776, 106.700),
    _order(2, 10.790, 106.680),
]
VEHICLES = [_vehicle()]


class _Boom:
    provider_id = "boom"

    def pair_km(self, *args: float) -> float:
        raise RuntimeError("osm down")

    def matrix_km(self, points):
        raise RuntimeError("osm down")


def test_quality_mapping() -> None:
    assert quality_for_provider("valhalla") == "VERIFIED_GRAPH"
    assert quality_for_provider("osrm") == "VERIFIED_GRAPH"
    assert quality_for_provider("matrix_cache") == "VERIFIED_GRAPH"
    assert quality_for_provider("circuity") == "DEGRADED"
    assert quality_for_provider("boom") == "DEGRADED"


def test_materialize_circuity_is_degraded() -> None:
    _, name, quality = materialize_matrix(
        CircuityRoadBaseline(), [(10.801, 106.661), (10.776, 106.700)]
    )
    assert name == "circuity"
    assert quality == "DEGRADED"


def test_materialize_osrm_valhalla_are_verified() -> None:
    def osrm_transport(url: str, method: str, body: bytes | None) -> dict:
        return {"code": "Ok", "distances": [[0, 2000], [2100, 0]]}

    def vh_transport(url: str, method: str, body: bytes | None) -> dict:
        return {
            "sources_to_targets": [
                [{"distance": 0.0}, {"distance": 4.5}],
                [{"distance": 4.6}, {"distance": 0.0}],
            ]
        }

    _, oname, oqual = materialize_matrix(
        OsrmRoadBaseline(transport=osrm_transport),
        [(10.801, 106.661), (10.776, 106.700)],
    )
    assert (oname, oqual) == ("osrm", "VERIFIED_GRAPH")
    _, vname, vqual = materialize_matrix(
        ValhallaRoadBaseline(transport=vh_transport, costing="auto"),
        [(10.801, 106.661), (10.776, 106.700)],
    )
    assert (vname, vqual) == ("valhalla", "VERIFIED_GRAPH")


def test_materialize_boom_falls_back_degraded_not_silent() -> None:
    _, name, quality = materialize_matrix(
        _Boom(), [(10.801, 106.661), (10.776, 106.700)]  # type: ignore[arg-type]
    )
    assert name == "circuity"
    assert quality == "DEGRADED"


def test_materialize_empty_points_is_unavailable() -> None:
    _, name, quality = materialize_matrix(CircuityRoadBaseline(), [])
    assert name == "circuity"
    assert quality == "UNAVAILABLE"


def test_run_vrp_threads_quality() -> None:
    circ = run_vrp(
        ORDERS,
        VEHICLES,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=50.0,
        road_baseline=CircuityRoadBaseline(),
    )
    assert circ.distance_provider == "circuity"
    assert circ.routing_quality == "DEGRADED"

    def vh_transport(url: str, method: str, body: bytes | None) -> dict:
        n = 3  # depot + 2 orders
        return {
            "sources_to_targets": [
                [{"distance": 0.0 if i == j else 4.0} for j in range(n)] for i in range(n)
            ]
        }

    verified = run_vrp(
        ORDERS,
        VEHICLES,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=50.0,
        road_baseline=ValhallaRoadBaseline(transport=vh_transport, costing="auto"),
    )
    assert verified.routing_quality == "VERIFIED_GRAPH"

    boom = run_vrp(
        ORDERS,
        VEHICLES,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=50.0,
        road_baseline=_Boom(),  # type: ignore[arg-type]
    )
    assert boom.distance_provider == "circuity"
    assert boom.routing_quality == "DEGRADED"


def test_optimizer_flag(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GREENLOGIX_OPTIMIZER", raising=False)
    assert optimizer_from_env() == OPTIMIZER_LEGACY
    monkeypatch.setenv("GREENLOGIX_OPTIMIZER", "ecoalns")
    assert optimizer_from_env() == OPTIMIZER_ECOALNS
    monkeypatch.setenv("GREENLOGIX_OPTIMIZER", "typo-value")
    assert optimizer_from_env() == OPTIMIZER_LEGACY


def test_fail_closed_publish_guard(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GREENLOGIX_PUBLISH_REQUIRE_VERIFIED", raising=False)
    assert publish_blocked_for_quality("DEGRADED") is False
    monkeypatch.setenv("GREENLOGIX_PUBLISH_REQUIRE_VERIFIED", "1")
    assert publish_blocked_for_quality("DEGRADED") is True
    assert publish_blocked_for_quality("UNAVAILABLE") is True
    assert publish_blocked_for_quality("VERIFIED_GRAPH") is False


def test_eco_weight_deprecation_warning(monkeypatch: pytest.MonkeyPatch, caplog) -> None:
    from greenlogix_api.solver.eco import eco_weight_from_env

    monkeypatch.setenv("GREENLOGIX_ECO_WEIGHT", "1")
    with caplog.at_level(logging.WARNING, logger="greenlogix"):
        assert eco_weight_from_env() == pytest.approx(1.0)
    assert any("deprecated" in r.message.lower() for r in caplog.records)


def _seed_tiny(demo_client) -> None:
    from sqlmodel import Session

    from greenlogix_api import db as dbmod

    with Session(dbmod.engine) as session:
        session.add(_vehicle())
        for o in ORDERS:
            session.add(
                Order(
                    address=o.address,
                    lat=o.lat,
                    lng=o.lng,
                    kg=o.kg,
                    excel_row=o.excel_row,
                    window_start="08:00",
                    window_end="12:00",
                )
            )
        session.commit()


def test_http_optimize_and_report_expose_quality(demo_client) -> None:
    _seed_tiny(demo_client)
    res = demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0})
    assert res.status_code == 200
    body = res.json()
    assert body["distance_provider"] == "circuity"
    assert body["routing_quality"] == "DEGRADED"
    report = demo_client.get("/report", headers=AUTH)
    assert report.status_code == 200
    assert report.json()["routing_quality"] == "DEGRADED"


def test_cors_allowlist_env(monkeypatch: pytest.MonkeyPatch) -> None:
    from greenlogix_api.main import _cors_origins

    monkeypatch.delenv("GREENLOGIX_CORS_ORIGINS", raising=False)
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    assert _cors_origins() == ["*"]
    monkeypatch.setenv(
        "GREENLOGIX_CORS_ORIGINS", "https://fleet.example.vn, https://ops.example.vn"
    )
    assert _cors_origins() == ["https://fleet.example.vn", "https://ops.example.vn"]
    monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    monkeypatch.delenv("GREENLOGIX_CORS_ORIGINS", raising=False)
    assert _cors_origins() == []


def test_frozen_seed_snapshot(tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Deterministic seed snapshot export for frozen fixtures (CR-01)."""
    from greenlogix_api.seed import order_rows, truck_rows

    orders_first = order_rows()
    orders_second = order_rows()
    assert orders_first == orders_second
    assert len(orders_first) == 80
    assert len(truck_rows()) == 10
    snap = tmp_path / "seed_snapshot.json"
    snap.write_text(
        json.dumps(
            {"orders": orders_first, "trucks": truck_rows(), "depot": DEPOT_NAME},
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )
    assert json.loads(snap.read_text(encoding="utf-8"))["orders"] == orders_first
    dest = tmp_path / "fixtures_check.json"
    dest.write_text(snap.read_text(encoding="utf-8"), encoding="utf-8")
    assert dest.is_file()
