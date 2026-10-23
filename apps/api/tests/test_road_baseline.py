"""RoadBaseline: OSM adapters + circuity fallback. No Google scrape."""

from __future__ import annotations

import pytest

from greenlogix_api.models import Order, Vehicle
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, DEPOT_NAME
from greenlogix_api.solver import run_vrp
from greenlogix_api.solver.distance import HCMC_CIRCUITY, haversine_km, road_km
from greenlogix_api.solver.nn_two_opt import nearest_neighbor, tour_km
from greenlogix_api.solver.road_baseline import (
    CircuityRoadBaseline,
    FallbackRoadBaseline,
    GoogleDirectionsBaseline,
    OsrmRoadBaseline,
    RoadBaselineNotConfigured,
    ValhallaRoadBaseline,
    materialize_matrix,
    osrm_table_url,
    parse_osrm_table,
    parse_valhalla_matrix,
    resolve_road_baseline,
    valhalla_matrix_body,
    validate_matrix_km,
)


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


def _vehicle(vid: int = 1, plate: str = "51C-000.01") -> Vehicle:
    return Vehicle(
        id=vid,
        plate=plate,
        type="xe_tai_nho",
        capacity_kg=2000,
        fuel="diesel",
        l_per_100km=12,
        status="ready",
    )


class _BoomBaseline:
    provider_id = "boom"

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        raise RuntimeError("osm down")

    def matrix_km(self, points):
        raise RuntimeError("osm down")


class _Scale2Baseline(CircuityRoadBaseline):
    provider_id = "scale2"

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        return super().pair_km(lat1, lng1, lat2, lng2) * 2.0


def test_circuity_baseline_matches_legacy_road_km() -> None:
    a = (10.776, 106.700)
    b = (10.801, 106.661)
    got = CircuityRoadBaseline().pair_km(*a, *b)
    assert got == pytest.approx(road_km(*a, *b))
    assert got == pytest.approx(haversine_km(*a, *b) * HCMC_CIRCUITY)


def test_fallback_uses_primary_when_it_works() -> None:
    fb = FallbackRoadBaseline(_Scale2Baseline())
    a = (10.776, 106.700)
    b = (10.801, 106.661)
    assert fb.pair_km(*a, *b) == pytest.approx(road_km(*a, *b) * 2.0)
    assert fb.last_provider_id == "scale2"


def test_fallback_uses_circuity_when_primary_fails() -> None:
    fb = FallbackRoadBaseline(_BoomBaseline())
    a = (10.776, 106.700)
    b = (10.801, 106.661)
    assert fb.pair_km(*a, *b) == pytest.approx(road_km(*a, *b))
    assert fb.last_provider_id == "circuity"


def test_parse_osrm_table_converts_meters_to_km() -> None:
    matrix = parse_osrm_table({"code": "Ok", "distances": [[0, 13500], [13500, 0]]})
    assert matrix[0][1] == pytest.approx(13.5)
    assert matrix[1][0] == pytest.approx(13.5)


def test_parse_osrm_table_rejects_bad_code() -> None:
    with pytest.raises(ValueError):
        parse_osrm_table({"code": "NoRoute", "distances": []})


def test_parse_osrm_table_rejects_null_cell() -> None:
    with pytest.raises(ValueError):
        parse_osrm_table({"code": "Ok", "distances": [[0, None], [1, 0]]})


def test_parse_valhalla_rejects_missing_distance() -> None:
    with pytest.raises(ValueError):
        parse_valhalla_matrix({"sources_to_targets": [[{}, {"distance": 1.0}]]})


def test_validate_matrix_rejects_nonsquare_and_negative() -> None:
    with pytest.raises(ValueError):
        validate_matrix_km([[0.0, 1.0], [1.0]])
    with pytest.raises(ValueError):
        validate_matrix_km([[0.0, -1.0], [1.0, 0.0]])


def test_osrm_table_url_uses_driving_profile() -> None:
    url = osrm_table_url("https://router.project-osrm.org", [(10.801, 106.661), (10.776, 106.700)])
    assert "/table/v1/driving/" in url
    assert "106.661,10.801" in url
    assert "annotations=distance" in url


def test_osrm_baseline_uses_injected_transport() -> None:
    def transport(url: str, method: str, body: bytes | None) -> dict:
        assert method == "GET"
        assert "table/v1/driving" in url
        return {"code": "Ok", "distances": [[0, 2000], [2100, 0]]}

    baseline = OsrmRoadBaseline(transport=transport)
    assert baseline.pair_km(10.0, 106.7, 10.01, 106.71) == pytest.approx(2.0)
    assert baseline.provider_id == "osrm"


def test_parse_valhalla_matrix_uses_kilometers() -> None:
    payload = {
        "sources_to_targets": [
            [{"distance": 0.0}, {"distance": 7.2}],
            [{"distance": 7.4}, {"distance": 0.0}],
        ]
    }
    matrix = parse_valhalla_matrix(payload)
    assert matrix[0][1] == pytest.approx(7.2)
    assert matrix[1][0] == pytest.approx(7.4)


def test_valhalla_body_can_request_truck_costing() -> None:
    body = valhalla_matrix_body([(10.801, 106.661)], costing="truck")
    assert body["costing"] == "truck"
    assert body["sources"][0]["lat"] == pytest.approx(10.801)
    assert body["sources"][0]["lon"] == pytest.approx(106.661)


def test_valhalla_baseline_uses_injected_transport() -> None:
    def transport(url: str, method: str, body: bytes | None) -> dict:
        assert method == "POST"
        assert url.endswith("/sources_to_targets")
        assert body is not None
        return {
            "sources_to_targets": [
                [{"distance": 0.0}, {"distance": 4.5}],
                [{"distance": 4.6}, {"distance": 0.0}],
            ]
        }

    baseline = ValhallaRoadBaseline(transport=transport, costing="auto")
    assert baseline.pair_km(10.8, 106.66, 10.77, 106.70) == pytest.approx(4.5)
    assert baseline.provider_id == "valhalla"


def test_google_directions_without_key_is_not_configured() -> None:
    with pytest.raises(RoadBaselineNotConfigured):
        GoogleDirectionsBaseline(api_key="")


def test_resolve_google_without_key_uses_osm_chain(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GOOGLE_MAPS_API_KEY", raising=False)
    monkeypatch.delenv("ROAD_BASELINE_COSTING", raising=False)
    resolved = resolve_road_baseline("google")
    assert isinstance(resolved, FallbackRoadBaseline)
    assert resolved.primary.provider_id == "valhalla"
    assert resolved.primary.costing == "truck"


def test_resolve_auto_defaults_to_valhalla_truck(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ROAD_BASELINE", raising=False)
    monkeypatch.delenv("ROAD_BASELINE_COSTING", raising=False)
    resolved = resolve_road_baseline("auto")
    assert isinstance(resolved, FallbackRoadBaseline)
    assert resolved.primary.provider_id == "valhalla"
    assert resolved.primary.costing == "truck"


def test_resolve_circuity_skips_http() -> None:
    assert resolve_road_baseline("circuity").provider_id == "circuity"


def test_materialize_falls_back_when_matrix_fails() -> None:
    cached, name, quality = materialize_matrix(_BoomBaseline(), [(10.801, 106.661), (10.776, 106.700)])
    assert name == "circuity"
    assert quality == "DEGRADED"
    assert cached.pair_km(10.801, 106.661, 10.776, 106.700) == pytest.approx(
        road_km(10.801, 106.661, 10.776, 106.700)
    )


def test_nested_fallback_reports_osrm_not_fallback_id() -> None:
    def transport(url: str, method: str, body: bytes | None) -> dict:
        return {"code": "Ok", "distances": [[0, 3000], [3000, 0]]}

    chain = FallbackRoadBaseline(
        _BoomBaseline(),
        FallbackRoadBaseline(OsrmRoadBaseline(transport=transport)),
    )
    pts = [(10.801, 106.661), (10.776, 106.700)]
    matrix = chain.matrix_km(pts)
    assert matrix[0][1] == pytest.approx(3.0)
    assert chain.last_provider_id == "osrm"


def test_materialize_ttl_cache_skips_second_http() -> None:
    calls = {"n": 0}

    def transport(url: str, method: str, body: bytes | None) -> dict:
        calls["n"] += 1
        return {"code": "Ok", "distances": [[0, 5000], [5000, 0]]}

    store: dict = {}
    pts = [(10.801, 106.661), (10.776, 106.700)]
    first, name1, quality1 = materialize_matrix(
        OsrmRoadBaseline(transport=transport), pts, cache=store, now=10.0
    )
    second, name2, quality2 = materialize_matrix(
        OsrmRoadBaseline(transport=transport), pts, cache=store, now=20.0
    )
    assert name1 == name2 == "osrm"
    assert quality1 == quality2 == "VERIFIED_GRAPH"
    assert first.pair_km(*pts[0], *pts[1]) == pytest.approx(5.0)
    assert second.pair_km(*pts[0], *pts[1]) == pytest.approx(5.0)
    assert calls["n"] == 1


def test_osrm_retries_then_succeeds() -> None:
    calls = {"n": 0}

    def transport(url: str, method: str, body: bytes | None) -> dict:
        calls["n"] += 1
        if calls["n"] < 3:
            raise RuntimeError("transient")
        return {"code": "Ok", "distances": [[0, 1000], [1000, 0]]}

    baseline = OsrmRoadBaseline(transport=transport)
    assert baseline.pair_km(10.0, 106.7, 10.01, 106.71) == pytest.approx(1.0)
    assert calls["n"] == 3


def test_materialize_caches_osrm_matrix() -> None:
    calls = {"n": 0}

    def transport(url: str, method: str, body: bytes | None) -> dict:
        calls["n"] += 1
        return {"code": "Ok", "distances": [[0, 8000], [8000, 0]]}

    cached, name, quality = materialize_matrix(
        OsrmRoadBaseline(transport=transport),
        [(10.801, 106.661), (10.776, 106.700)],
    )
    assert name == "osrm"
    assert quality == "VERIFIED_GRAPH"
    assert cached.pair_km(10.801, 106.661, 10.776, 106.700) == pytest.approx(8.0)
    assert cached.pair_km(10.776, 106.700, 10.801, 106.661) == pytest.approx(8.0)
    first_calls = calls["n"]
    cached.pair_km(10.801, 106.661, 10.776, 106.700)
    assert calls["n"] == first_calls


def test_nn_uses_injected_pair_km_not_haversine() -> None:
    depot = (10.0, 106.0)
    near = _order(1, 10.01, 106.0, 10)
    far = _order(2, 10.05, 106.0, 10)

    def invert(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        return 0.1 if abs(lat2 - 10.05) < 1e-9 else 10.0

    seq = nearest_neighbor([near, far], depot, pair_km=invert)
    assert seq[0].id == 2


def test_tour_km_uses_injected_pair_km() -> None:
    orders = [_order(1, 10.01, 106.0, 10)]

    def stub(*_args: float) -> float:
        return 3.5

    assert tour_km(orders, (10.0, 106.0), pair_km=stub) == pytest.approx(7.0)


def test_baseline_vs_optimized_still_differ_on_road_matrix() -> None:
    orders = [
        _order(1, 10.776, 106.700, 80, "09:00"),
        _order(2, 10.790, 106.680, 80, "08:00"),
        _order(3, 10.760, 106.720, 80, "10:00"),
        _order(4, 10.810, 106.650, 80, "07:30"),
    ]
    vehicles = [_vehicle(1), _vehicle(2, "51C-000.02")]
    result = run_vrp(
        orders,
        vehicles,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=3.0,
        road_baseline=_Scale2Baseline(),
    )
    assert result.baseline.km > 0
    assert result.totals.km > 0
    assert result.totals.km != result.baseline.km
    circuity = run_vrp(
        orders,
        vehicles,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=3.0,
        road_baseline=CircuityRoadBaseline(),
    )
    assert result.totals.km == pytest.approx(circuity.totals.km * 2.0)
    assert result.baseline.km == pytest.approx(circuity.baseline.km * 2.0)
