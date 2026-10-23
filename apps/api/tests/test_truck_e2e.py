"""T-LOOP-ROUTING e2e: per-vehicle truck profile, no silent fallback,
full 7-key cache, restriction overlay wiring (CR-05/CR-06/CR-07)."""

from __future__ import annotations

import logging

from greenlogix_api.geo.truck_profile import (
    DEFAULT_TRUCK_PROFILE,
    XE_TAI_NANG_8T,
    XE_TAI_NHO_1T5,
    get_profile_for_vehicle,
    profile_for_vehicle_model,
)
from greenlogix_api.models import Order, Vehicle
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, DEPOT_NAME
from greenlogix_api.solver import (
    _inject_truck_profile,
    _primary_profile,
    profiles_for_vehicles,
    run_vrp,
)
from greenlogix_api.solver.road_baseline import (
    ValhallaRoadBaseline,
    build_matrix_cache_key,
    evaluate_restriction_coverage,
    materialize_matrix,
    restriction_coverage_label,
    valhalla_matrix_body,
)


def _order(oid: int, ws: str = "10:00", we: str = "12:00") -> Order:
    return Order(
        id=oid,
        address=f"a{oid}",
        lat=10.776 + oid * 0.01,
        lng=106.700 + oid * 0.01,
        receiver="KH",
        phone="",
        kg=80,
        window_start=ws,
        window_end=we,
        excel_row=oid,
    )


def _vehicle(vid: int, vtype: str, capacity: float, **kw) -> Vehicle:
    return Vehicle(
        id=vid,
        plate=f"51C-ROUT.{vid:02d}",
        type=vtype,
        capacity_kg=capacity,
        fuel="diesel",
        l_per_100km=12,
        status="ready",
        **kw,
    )


# --- 1. profile per vehicle ------------------------------------------------

def test_profiles_per_vehicle_distinct() -> None:
    vehicles = [
        _vehicle(1, "xe_tai_nho", 1500),
        _vehicle(2, "xe_tai_nang", 9000),
    ]
    profiles = profiles_for_vehicles(vehicles)
    assert set(profiles) == {1, 2}
    assert profiles[1].vehicle_class == "xe_tai_nho"
    assert profiles[2].vehicle_class == "xe_tai_nang"
    assert profiles[1].profile_hash() != profiles[2].profile_hash()


def test_profile_for_vehicle_model_uses_additive_fields() -> None:
    v = _vehicle(
        7, "xe_tai_nho", 1500,
        height_m=2.6, width_m=2.0, length_m=6.0, gvw_kg=4500,
    )
    profile = profile_for_vehicle_model(v)
    assert profile.vehicle_class == "xe_tai_nho"
    assert profile.height_m == 2.6
    assert profile.gross_vehicle_weight_t == 4.5


def test_vehicle_additive_fields_nullable_by_default() -> None:
    v = Vehicle(plate="51C-X", type="xe_tai_nho", capacity_kg=1500)
    assert v.height_m is None
    assert v.width_m is None
    assert v.length_m is None
    assert v.gvw_kg is None
    # T-02 C-02: axle/aero overrides also nullable by default.
    assert v.axle_load_t is None
    assert v.frontal_area_m2 is None
    assert v.cd is None


def test_profile_for_vehicle_model_axle_aero_overrides() -> None:
    # Measured envelope + explicit axle/aero overrides.
    v = _vehicle(
        8, "xe_tai_nho", 1500,
        height_m=2.6, width_m=2.0, length_m=6.0, gvw_kg=4500,
        axle_load_t=2.0, frontal_area_m2=5.1, cd=0.60,
    )
    profile = profile_for_vehicle_model(v)
    assert profile.height_m == 2.6
    assert profile.gross_vehicle_weight_t == 4.5
    assert profile.axle_load_t == 2.0
    assert profile.frontal_area_m2 == 5.1
    assert profile.cd == 0.60
    # Valhalla options carry the explicit axle (not gvw/2 fallback).
    assert profile.to_valhalla_truck_options()["axle_load"] == 2.0


def test_profile_for_vehicle_model_aero_override_without_dims() -> None:
    # Aero-only override still resolves (preset dims + override aero).
    v = _vehicle(9, "xe_tai_nho", 1500, cd=0.50)
    profile = profile_for_vehicle_model(v)
    assert profile.height_m == XE_TAI_NHO_1T5.height_m
    assert profile.cd == 0.50


def test_profile_for_vehicle_model_pre_migration_row() -> None:
    # Row created before the additive migration: no envelope attrs at all.
    class LegacyVehicle:
        type = "xe_tai_trung"
        capacity_kg = 3500
        fuel = "diesel"
        l_per_100km = 0.0

    profile = profile_for_vehicle_model(LegacyVehicle())
    assert profile.vehicle_class == "xe_tai_trung"
    assert profile.height_m == XE_TAI_NHO_1T5.height_m or profile.height_m == 2.8


# --- 2. no silent 3.5t fallback --------------------------------------------

def test_truck_body_without_profile_warns_and_uses_explicit_default(caplog) -> None:
    points = [(10.8123, 106.6543), (10.7725, 106.6578)]
    with caplog.at_level(logging.WARNING, logger="greenlogix"):
        body = valhalla_matrix_body(points, costing="truck")
    assert any("explicit" in r.message for r in caplog.records)
    assert body["costing_options"]["truck"] == DEFAULT_TRUCK_PROFILE.to_valhalla_truck_options()
    # Explicit default is the xe_tai_nho envelope (3.2t), never bare 3.5.
    assert body["costing_options"]["truck"]["weight"] == DEFAULT_TRUCK_PROFILE.gross_vehicle_weight_t


def test_unknown_vehicle_warns_and_uses_explicit_default(caplog) -> None:
    with caplog.at_level(logging.WARNING, logger="greenlogix"):
        profile = get_profile_for_vehicle("", 0.0)
    assert profile == DEFAULT_TRUCK_PROFILE
    assert any("explicit" in r.message for r in caplog.records)


# --- 3. full 7-key cache ----------------------------------------------------

def test_cache_key_has_all_seven_components() -> None:
    points = [(10.801, 106.661), (10.776, 106.700)]
    key = build_matrix_cache_key("valhalla", XE_TAI_NHO_1T5.profile_hash(), points)
    parts = key.split("|")
    assert len(parts) == 8  # provider + 6 versions + coords
    profile_hash, rgv, bucket, overlay, snapshot, cost, coords = parts[1:]
    assert profile_hash == XE_TAI_NHO_1T5.profile_hash()
    assert rgv  # road_graph_version
    assert bucket  # departure_bucket
    assert overlay == "decision23-2018-v1"
    assert snapshot  # traffic_snapshot
    assert cost == "GLX-HDT-v1.0"
    assert coords == "10.80100,106.66100;10.77600,106.70000"


def test_cache_key_varies_per_version_component() -> None:
    points = [(10.801, 106.661), (10.776, 106.700)]
    base = build_matrix_cache_key("valhalla", XE_TAI_NHO_1T5.profile_hash(), points)
    variants = [
        build_matrix_cache_key("valhalla", XE_TAI_NANG_8T.profile_hash(), points),
        build_matrix_cache_key(
            "valhalla", XE_TAI_NHO_1T5.profile_hash(), points,
            road_graph_version="other:hash",
        ),
        build_matrix_cache_key(
            "valhalla", XE_TAI_NHO_1T5.profile_hash(), points,
            departure_bucket="peak-am",
        ),
        build_matrix_cache_key(
            "valhalla", XE_TAI_NHO_1T5.profile_hash(), points,
            restriction_overlay_version="decision23-2018-v2",
        ),
        build_matrix_cache_key(
            "valhalla", XE_TAI_NHO_1T5.profile_hash(), points,
            traffic_snapshot="congested",
        ),
        build_matrix_cache_key(
            "valhalla", XE_TAI_NHO_1T5.profile_hash(), points,
            cost_model_version="GLX-HDT-v2.0",
        ),
        build_matrix_cache_key(
            "valhalla", XE_TAI_NHO_1T5.profile_hash(),
            [(10.801, 106.661), (10.790, 106.680)],
        ),
    ]
    assert len(set(variants) | {base}) == 8


def test_materialize_cache_varies_by_departure_bucket(monkeypatch) -> None:
    def transport(url: str, method: str, body: bytes | None) -> dict:
        return {
            "sources_to_targets": [
                [{"distance": 0.0}, {"distance": 4.0}],
                [{"distance": 4.1}, {"distance": 0.0}],
            ]
        }

    points = [(10.801, 106.661), (10.776, 106.700)]
    store: dict = {}
    monkeypatch.setenv("ROUTING_DEPARTURE_BUCKET", "off-peak")
    _, _, q1 = materialize_matrix(
        ValhallaRoadBaseline(transport=transport, truck_profile=XE_TAI_NHO_1T5),
        points, cache=store,
    )
    monkeypatch.setenv("ROUTING_DEPARTURE_BUCKET", "peak-am")
    _, _, q2 = materialize_matrix(
        ValhallaRoadBaseline(transport=transport, truck_profile=XE_TAI_NHO_1T5),
        points, cache=store,
    )
    assert (q1, q2) == ("VERIFIED_GRAPH", "VERIFIED_GRAPH")
    assert len(store) == 2


# --- 4. restriction wiring ---------------------------------------------------

def test_restriction_coverage_labels() -> None:
    banned = evaluate_restriction_coverage([_order(1, "07:00", "08:00")], "xe_tai_nho")
    assert banned.startswith("decision23-2018-v1:checked")
    assert banned.endswith(":restricted")

    clear = evaluate_restriction_coverage([_order(1, "10:00", "12:00")], "xe_tai_nho")
    assert clear == "decision23-2018-v1:checked:clear"

    assert evaluate_restriction_coverage([], "xe_tai_nho").endswith(":unchecked")
    assert restriction_coverage_label(False).endswith(":unchecked")


def test_run_vrp_threads_heaviest_profile_and_coverage() -> None:
    seen: dict = {}

    def transport(url: str, method: str, body: bytes | None) -> dict:
        import json as _json

        seen.update(_json.loads(body.decode("utf-8"))["costing_options"]["truck"])
        n = 3  # depot + 2 orders
        return {
            "sources_to_targets": [
                [{"distance": 0.0 if i == j else 4.0} for j in range(n)] for i in range(n)
            ]
        }

    vehicles = [_vehicle(1, "xe_tai_nho", 1500), _vehicle(2, "xe_tai_nang", 9000)]
    orders = [_order(1, "10:00", "12:00"), _order(2, "10:30", "12:30")]
    result = run_vrp(
        orders, vehicles,
        depot=(DEPOT_LAT, DEPOT_LNG), depot_name=DEPOT_NAME, radius_km=50.0,
        road_baseline=ValhallaRoadBaseline(transport=transport, costing="truck"),
    )
    assert result.routing_quality == "VERIFIED_GRAPH"
    # Heaviest ready vehicle (xe_tai_nang 8T) drives the shared matrix.
    assert seen["height"] == XE_TAI_NANG_8T.height_m
    assert seen["weight"] == XE_TAI_NANG_8T.gross_vehicle_weight_t
    # Primary is xe_tai_nang: 10:00-12:00 falls in the heavy day ban
    # (06:00-22:00), proving coverage uses the per-fleet primary class.
    assert result.restriction_coverage == "decision23-2018-v1:checked:restricted"


def test_run_vrp_ban_window_marks_restricted() -> None:
    def transport(url: str, method: str, body: bytes | None) -> dict:
        n = 2  # depot + 1 order
        return {
            "sources_to_targets": [
                [{"distance": 0.0 if i == j else 4.0} for j in range(n)] for i in range(n)
            ]
        }

    result = run_vrp(
        [_order(1, "07:00", "08:00")], [_vehicle(1, "xe_tai_nho", 1500)],
        depot=(DEPOT_LAT, DEPOT_LNG), depot_name=DEPOT_NAME, radius_km=50.0,
        road_baseline=ValhallaRoadBaseline(transport=transport, costing="truck"),
    )
    assert result.restriction_coverage.endswith(":checked:restricted")


def test_inject_truck_profile_leaves_circuity_alone() -> None:
    from greenlogix_api.solver.road_baseline import CircuityRoadBaseline

    circuity = CircuityRoadBaseline()
    assert _inject_truck_profile(circuity, XE_TAI_NANG_8T) is circuity
    assert not hasattr(circuity, "truck_profile")
    assert _primary_profile([]) is None
