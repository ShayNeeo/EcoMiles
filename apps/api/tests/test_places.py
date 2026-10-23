import pytest

from greenlogix_api.places.gofa import GofaPlaceProvider
from greenlogix_api.places.mock import MockPlaceProvider


@pytest.mark.anyio
async def test_mock_place_provider_autocomplete():
    provider = MockPlaceProvider()
    results = await provider.autocomplete("Lý Thường Kiệt")
    assert len(results) >= 1
    first = results[0]
    assert "268 Lý Thường Kiệt" in first.description
    assert first.place_id == "gofa_hcmc_ly_thuong_kiet"


@pytest.mark.anyio
async def test_mock_place_provider_unaccented_search():
    provider = MockPlaceProvider()
    results = await provider.autocomplete("ly thuong kiet")
    assert len(results) >= 1
    assert any("268 Lý Thường Kiệt" in r.description for r in results)


@pytest.mark.anyio
async def test_mock_place_provider_detail():
    provider = MockPlaceProvider()
    detail = await provider.detail("gofa_hcmc_depot_tanbinh")
    assert detail is not None
    assert "Tân Bình" in detail.formatted_address
    assert round(detail.point.lat, 4) == 10.8123
    assert round(detail.point.lng, 4) == 106.6543
    assert detail.district == "Tân Bình"
    assert detail.confidence == 1.0


@pytest.mark.anyio
async def test_gofa_place_provider_fallback_when_no_key():
    provider = GofaPlaceProvider(api_key="")
    # Should use fallback without throwing
    results = await provider.autocomplete("Lê Duẩn")
    assert len(results) >= 1
    assert "15 Lê Duẩn" in results[0].description

    detail = await provider.detail(results[0].place_id)
    assert detail is not None
    assert "Quận 1" in detail.district


@pytest.mark.anyio
async def test_gofa_caching_behavior():
    calls = []
    payload = {
        "predictions": [
            {
                "place_id": "gofa_place_1",
                "description": "Mock Landmark",
                "structured_formatting": {"main_text": "Mock Landmark"},
            }
        ]
    }

    def mock_transport(url, headers, timeout):
        calls.append(url)
        return 200, payload

    provider = GofaPlaceProvider(api_key="MOCK", transport=mock_transport)
    # First call
    res1 = await provider.autocomplete("landmark")
    assert len(res1) == 1
    assert res1[0].place_id == "gofa_place_1"
    assert len(calls) == 1
    assert provider.autocomplete_calls == 1

    # Second call should hit memory cache (calls does NOT increment)
    res2 = await provider.autocomplete("landmark")
    assert res1 == res2
    assert len(calls) == 1
    assert provider.autocomplete_calls == 1

    # Query under 3 chars returns empty without incrementing calls or transport
    res_short = await provider.autocomplete("la")
    assert res_short == []
    assert len(calls) == 1
    assert provider.autocomplete_calls == 1


@pytest.mark.anyio
async def test_gofa_detail_live_shape_and_cache():
    calls = []
    detail_payload = {
        "status": "OK",
        "result": {
            "place_id": "gofa_hcmc_landmark81",
            "name": "Landmark 81",
            "formatted_address": "720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
            "geometry": {"location": {"lat": 10.7951, "lng": 106.7218}},
            "compound": {
                "province": "TP. Hồ Chí Minh",
                "district": "Bình Thạnh",
                "commune": "Phường 22",
            },
        },
    }

    def mock_transport(url, headers, timeout):
        calls.append(url)
        return 200, detail_payload

    provider = GofaPlaceProvider(api_key="MOCK", transport=mock_transport)
    d1 = await provider.detail("gofa_hcmc_landmark81")
    assert d1 is not None
    assert d1.place_id == "gofa_hcmc_landmark81"
    assert d1.ward == "Phường 22"
    assert d1.district == "Bình Thạnh"
    assert d1.province == "TP. Hồ Chí Minh"
    assert d1.point.lat == 10.7951
    assert d1.point.lng == 106.7218
    assert len(calls) == 1
    assert provider.detail_calls == 1

    # Second call hits cache
    d2 = await provider.detail("gofa_hcmc_landmark81")
    assert d1 == d2
    assert len(calls) == 1
    assert provider.detail_calls == 1

    # Clear cache resets entries and counters
    provider.clear_cache()
    assert provider.autocomplete_calls == 0
    assert provider.detail_calls == 0


@pytest.mark.anyio
async def test_gofa_detail_status_not_ok_returns_none():
    def mock_transport(url, headers, timeout):
        return 200, {"status": "ZERO_RESULTS", "result": {}}

    provider = GofaPlaceProvider(api_key="MOCK", transport=mock_transport)
    res = await provider.detail("non_existent_id")
    assert res is None
