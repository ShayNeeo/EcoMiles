"""T-LOOP-MANIFEST: road-graph manifest versions propagate into extra dicts.

Audit §2.2: road_graph_audit_extra() was exported but never called — versions
absent from optimize/report responses. persist_plan + save_report now merge it
additively (7 MANIFEST_KEYS + derived road_graph_version). Code-level versions
only; frozen OpenAPI schemas untouched (D-LOOP3).
"""

from __future__ import annotations

import json
from types import SimpleNamespace

from sqlmodel import Session

from greenlogix_api import carbon
from greenlogix_api import db as dbmod
from greenlogix_api.geo.road_graph import MANIFEST_KEYS, road_graph_audit_extra
from greenlogix_api.routers.optimize import persist_plan
from greenlogix_api.schemas import TotalsOut

EXPECTED_SEVEN = {
    "osm_snapshot_id",
    "osm_timestamp",
    "valhalla_version",
    "tile_build_hash",
    "elevation_dataset_version",
    "restriction_overlay_version",
    "cost_model_version",
}


def _read_report_json() -> dict:
    return json.loads(dbmod.REPORT_PATH.read_text(encoding="utf-8"))


def test_audit_extra_carries_all_seven_keys() -> None:
    extra = road_graph_audit_extra()
    assert set(MANIFEST_KEYS) == EXPECTED_SEVEN
    for key in EXPECTED_SEVEN:
        assert key in extra, f"missing manifest key in audit extra: {key}"
    # Derived convenience key kept alongside the 7 contract keys.
    assert extra["road_graph_version"] == (
        f"{extra['osm_snapshot_id']}:{extra['tile_build_hash']}"
    )


def test_manifest_placeholders_labeled_no_invented_hashes() -> None:
    extra = road_graph_audit_extra()
    assert extra["restriction_overlay_version"] == "decision23-2018-v1"
    assert extra["cost_model_version"] == "GLX-HDT-v1.0"
    assert extra["osm_snapshot_id"] == "unpinned-dev"
    assert extra["tile_build_hash"] == "unpinned-dev"


def test_save_report_extra_has_seven_keys_and_preserves_caller() -> None:
    carbon.save_report(
        TotalsOut(km=10.0, litres=1.0, kg_co2=2.31),
        TotalsOut(km=8.0, litres=0.8, kg_co2=1.848),
        extra={
            "distance_provider": "circuity",
            "routing_quality": "DEGRADED",
            "eco_weight": 0.0,
        },
    )
    payload = _read_report_json()
    # Existing caller fields preserved (additive, nothing removed).
    assert payload["distance_provider"] == "circuity"
    assert payload["routing_quality"] == "DEGRADED"
    assert payload["eco_weight"] == 0.0
    assert payload["baseline"]["km"] == 10.0
    assert payload["optimized"]["km"] == 8.0
    for key in EXPECTED_SEVEN:
        assert key in payload, f"missing manifest key in report extra: {key}"


def test_save_report_caller_override_wins() -> None:
    carbon.save_report(
        TotalsOut(km=1.0, litres=0.1, kg_co2=0.231),
        TotalsOut(km=1.0, litres=0.1, kg_co2=0.231),
        extra={"osm_snapshot_id": "custom-override"},
    )
    assert _read_report_json()["osm_snapshot_id"] == "custom-override"


def test_persist_plan_optimize_path_propagates_manifest() -> None:
    result = SimpleNamespace(
        routes=[],
        unassigned_ids=[],
        baseline=TotalsOut(km=10.0, litres=1.0, kg_co2=2.31),
        totals=TotalsOut(km=8.0, litres=0.8, kg_co2=1.848),
        distance_provider="circuity",
        routing_quality="DEGRADED",
        eco_weight=0.0,
    )
    with Session(dbmod.engine) as session:
        assert persist_plan(session, result) == []
    payload = _read_report_json()
    assert payload["distance_provider"] == "circuity"
    assert payload["routing_quality"] == "DEGRADED"
    for key in EXPECTED_SEVEN:
        assert key in payload, f"missing manifest key in optimize extra: {key}"
    assert payload["restriction_overlay_version"] == "decision23-2018-v1"
    assert payload["cost_model_version"] == "GLX-HDT-v1.0"
