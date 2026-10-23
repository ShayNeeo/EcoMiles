"""T-CR06: Valhalla road-graph manifest groundwork. Offline-safe, no live HTTP."""

from __future__ import annotations

import json

from greenlogix_api.geo import road_graph
from greenlogix_api.geo.road_graph import (
    MANIFEST_KEYS,
    get_cost_model_version,
    get_restriction_overlay_version,
    get_road_graph_manifest,
    get_road_graph_version,
    health_check,
    road_graph_audit_extra,
)


def test_manifest_has_all_seven_keys():
    manifest = get_road_graph_manifest()
    for key in MANIFEST_KEYS:
        assert key in manifest, f"missing manifest key: {key}"
    assert set(MANIFEST_KEYS) == {
        "osm_snapshot_id",
        "osm_timestamp",
        "valhalla_version",
        "tile_build_hash",
        "elevation_dataset_version",
        "restriction_overlay_version",
        "cost_model_version",
    }


def test_manifest_pinned_values():
    manifest = get_road_graph_manifest()
    assert manifest["restriction_overlay_version"] == "decision23-2018-v1"
    assert manifest["cost_model_version"] == "GLX-HDT-v1.0"
    assert manifest["osm_snapshot_id"] == "unpinned-dev"
    assert manifest["tile_build_hash"] == "unpinned-dev"


def test_manifest_deterministic_and_cached(tmp_path):
    first = get_road_graph_manifest()
    second = get_road_graph_manifest()
    assert first == second
    assert first is not second  # defensive copy
    # Custom path read bypasses cache but returns same content
    alt = tmp_path / "road_graph.json"
    alt.write_text(json.dumps(first), encoding="utf-8")
    assert get_road_graph_manifest(alt) == first
    road_graph.clear_manifest_cache()
    assert get_road_graph_manifest() == first


def test_version_helpers():
    assert get_restriction_overlay_version() == "decision23-2018-v1"
    assert get_cost_model_version() == "GLX-HDT-v1.0"
    version = get_road_graph_version()
    assert version == "unpinned-dev:unpinned-dev"


def test_audit_extra_additive():
    extra = road_graph_audit_extra()
    assert extra["road_graph_version"] == "unpinned-dev:unpinned-dev"
    assert extra["restriction_overlay_version"] == "decision23-2018-v1"
    assert extra["cost_model_version"] == "GLX-HDT-v1.0"
    # Additive merge pattern T-CR01 must use in persist_plan/save_report:
    base = {"distance_provider": "circuity", "eco_weight": 0.0}
    merged = {**base, **extra}
    assert merged["distance_provider"] == "circuity"
    assert merged["road_graph_version"] == "unpinned-dev:unpinned-dev"


def test_health_check_offline_safe_no_transport():
    res = health_check()
    assert res["configured"] is True
    assert res["url"].startswith("http")
    assert res["costing"] == "truck"
    assert res["reachable"] is False  # no live HTTP without transport


def test_health_check_custom_url_and_costing():
    res = health_check(base_url="http://localhost:8002/", costing="auto")
    assert res["url"] == "http://localhost:8002"
    assert res["costing"] == "auto"
    assert res["reachable"] is False


def test_health_check_injected_transport_success():
    def ok_transport(url, method, body):
        assert url.endswith("/status")
        assert method == "GET"
        return {"version": "dev"}

    res = health_check(base_url="http://tiles.internal", transport=ok_transport)
    assert res == {
        "configured": True,
        "url": "http://tiles.internal",
        "costing": "truck",
        "reachable": True,
    }


def test_health_check_injected_transport_failure_never_raises():
    def bad_transport(url, method, body):
        raise ConnectionError("offline")

    res = health_check(base_url="http://tiles.internal", transport=bad_transport)
    assert res["reachable"] is False
    assert res["configured"] is True
