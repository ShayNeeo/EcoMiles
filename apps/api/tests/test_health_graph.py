"""GET /health wires road-graph versions, offline-safe (T-LOOP-RBAC-HEALTH / CR-06).

- /health stays 200 offline; ``status`` shape unchanged (additive fields only).
- Versions come from the road-graph manifest readers (no invented hashes).
- Manifest unreadable -> still 200 with ``status == "ok"`` (fields None).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from greenlogix_api.main import app


def test_health_200_with_graph_versions_offline() -> None:
    with TestClient(app) as client:
        res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["road_graph_version"] == "unpinned-dev:unpinned-dev"
    assert body["restriction_overlay_version"] == "decision23-2018-v1"
    assert body["cost_model_version"] == "GLX-HDT-v1.0"
    # No live probe without transport -> explicit False, never raises.
    assert body["road_graph_reachable"] is False


def test_health_api_prefix_has_versions() -> None:
    with TestClient(app) as client:
        res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["road_graph_version"] == "unpinned-dev:unpinned-dev"
    assert body["restriction_overlay_version"] == "decision23-2018-v1"


def test_health_stays_200_when_manifest_unreadable(monkeypatch) -> None:
    monkeypatch.setenv("ROAD_GRAPH_MANIFEST_PATH", "/nonexistent/road_graph.json")
    from greenlogix_api.geo import road_graph

    road_graph.clear_manifest_cache()
    try:
        with TestClient(app) as client:
            res = client.get("/health")
    finally:
        road_graph.clear_manifest_cache()
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
