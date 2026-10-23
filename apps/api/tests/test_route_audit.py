"""``GET /routes/{id}/audit`` — route audit drawer (C-06, CR-20261018-001 §4.6).

Every value is pulled from the source that already owns it: quality/provider
from the stored report, solver from the optimizer flag, model version from the
carbon evidence constant, road-graph versions from the manifest helpers. The
tests pin that wiring (a hardcoded copy in the router would drift and fail
here) plus the honesty rules: 404 on an unknown route, ``seed: null``, and a
quality label that is never VERIFIED_GRAPH on the circuity path.
"""

from __future__ import annotations

from datetime import datetime

from greenlogix_api import db as dbmod
from greenlogix_api.carbon import EVIDENCE_MODEL_VERSION
from greenlogix_api.geo.road_graph import road_graph_audit_extra

AUTH = {"Authorization": "Bearer DEMO"}

AUDIT_KEYS = {
    "route_id",
    "plate",
    "km",
    "litres",
    "kg_co2",
    "stops",
    "routing_quality",
    "distance_provider",
    "solver",
    "model_version",
    "restriction_overlay_version",
    "road_graph_version",
    "seed",
    "created_at",
}


def _planned_route(client) -> tuple[dict, list[dict]]:
    assert client.post("/seed", headers=AUTH).status_code == 200
    res = client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0})
    assert res.status_code == 200
    routes = res.json()["routes"]
    assert routes
    return routes[0], routes


def _audit(client, route_id: int) -> dict:
    res = client.get(f"/routes/{route_id}/audit", headers=AUTH)
    assert res.status_code == 200
    return res.json()


def test_audit_returns_frozen_key_set(demo_client) -> None:
    route, _ = _planned_route(demo_client)
    body = _audit(demo_client, route["id"])
    assert set(body) == AUDIT_KEYS


def test_audit_echoes_the_stored_route_numbers(demo_client) -> None:
    route, _ = _planned_route(demo_client)
    body = _audit(demo_client, route["id"])
    assert body["route_id"] == route["id"]
    assert body["plate"] == route["plate"]
    assert body["km"] == route["km"]
    assert body["litres"] == route["litres"]
    assert body["kg_co2"] == route["kg_co2"]
    # stops counts delivery stops, the same way analytics counts vehicle stops.
    delivery = [s for s in route["stops"] if s["kind"] != "depot"]
    assert body["stops"] == len(delivery)


def test_audit_quality_and_provider_come_from_the_stored_report(demo_client) -> None:
    route, _ = _planned_route(demo_client)
    body = _audit(demo_client, route["id"])
    report = demo_client.get("/report", headers=AUTH)
    assert report.status_code == 200
    payload = report.json()
    assert body["distance_provider"] == payload["distance_provider"]
    assert body["routing_quality"] == payload["routing_quality"]
    # CI runs ROAD_BASELINE=circuity: never a verified claim.
    assert body["distance_provider"] == "circuity"
    assert body["routing_quality"] == "DEGRADED"


def test_audit_versions_come_from_the_manifest_helpers(demo_client) -> None:
    route, _ = _planned_route(demo_client)
    body = _audit(demo_client, route["id"])
    manifest = road_graph_audit_extra()
    assert body["road_graph_version"] == manifest["road_graph_version"]
    assert body["restriction_overlay_version"] == manifest["restriction_overlay_version"]
    assert body["restriction_overlay_version"] == "decision23-2018-v1"
    assert body["model_version"] == EVIDENCE_MODEL_VERSION
    assert body["model_version"] == "GLX-HDT-v1.0"


def test_audit_solver_label_follows_the_optimizer_flag(demo_client, monkeypatch) -> None:
    route, _ = _planned_route(demo_client)
    assert _audit(demo_client, route["id"])["solver"] == "legacy"
    monkeypatch.setenv("GREENLOGIX_OPTIMIZER", "ecoalns")
    assert _audit(demo_client, route["id"])["solver"] == "ecoalns"


def test_audit_seed_is_null_when_the_run_is_not_seeded(demo_client) -> None:
    route, _ = _planned_route(demo_client)
    # /optimize takes no seed and the heuristic is deterministic: there is no
    # run seed to report, so the field stays null rather than inventing one.
    assert _audit(demo_client, route["id"])["seed"] is None


def test_audit_created_at_is_the_report_run_stamp(demo_client) -> None:
    route, _ = _planned_route(demo_client)
    body = _audit(demo_client, route["id"])
    assert body["created_at"] is not None
    parsed = datetime.fromisoformat(body["created_at"])
    assert parsed.tzinfo is not None
    expected = datetime.fromtimestamp(dbmod.REPORT_PATH.stat().st_mtime).astimezone()
    assert abs((parsed - expected).total_seconds()) < 1.0


def test_audit_created_at_is_null_without_a_report(demo_client, tmp_path) -> None:
    route, _ = _planned_route(demo_client)
    moved = tmp_path / "last_report.json"
    dbmod.REPORT_PATH.rename(moved)
    try:
        body = _audit(demo_client, route["id"])
        assert body["created_at"] is None
        # No report => no run evidence; circuity stays the honest default.
        assert body["distance_provider"] == "circuity"
        assert body["routing_quality"] == "DEGRADED"
    finally:
        moved.rename(dbmod.REPORT_PATH)


def test_audit_unknown_route_is_404(demo_client) -> None:
    assert demo_client.post("/seed", headers=AUTH).status_code == 200
    assert demo_client.get("/routes/9999/audit", headers=AUTH).status_code == 404


def test_audit_requires_dispatcher_auth(demo_client) -> None:
    assert demo_client.get("/routes/1/audit").status_code == 401
