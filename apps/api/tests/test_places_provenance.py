"""T-LOOP-GOFA: Order provenance nullable fields + verified GOFA Places integration tests."""

import pytest
from fastapi.testclient import TestClient

from greenlogix_api.main import app
from greenlogix_api.models import Order
from greenlogix_api.places.gofa import GofaPlaceProvider
from greenlogix_api.routers import places as places_router
from greenlogix_api.serialize import order_out


def test_provenance_defaults_none():
    order = Order()
    assert order.place_id is None
    assert order.place_provider is None
    assert order.place_confidence is None
    assert order.geocode_at is None


def test_provenance_propagates_through_order_out():
    order = Order(
        window_start="08:00",
        window_end="17:00",
        place_id="gofa_hcmc_ly_thuong_kiet",
        place_provider="gofa",
        place_confidence=0.98,
        geocode_at="2026-09-22T00:00:00Z",
    )
    out = order_out(order)
    assert out.place_id == "gofa_hcmc_ly_thuong_kiet"
    assert out.place_provider == "gofa"
    assert out.place_confidence == 0.98
    assert out.geocode_at == "2026-09-22T00:00:00Z"


def test_provenance_defaults_propagate_as_none():
    out = order_out(Order(window_start="08:00", window_end="17:00"))
    assert out.place_id is None
    assert out.place_provider is None
    assert out.place_confidence is None
    assert out.geocode_at is None


AUTH_HEADER = {"Authorization": "Bearer DEMO"}


@pytest.fixture
def places_client(monkeypatch):
    """Test client with demo auth enabled."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    places_router.reset_places_provider()
    with TestClient(app) as client:
        yield client
    places_router.reset_places_provider()


def test_places_auth_fail_closed_without_credentials(monkeypatch):
    """Both places endpoints fail closed (401) without valid dispatcher credentials."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        # No auth header
        r1 = client.get("/places/autocomplete", params={"q": "Landmark 81"})
        assert r1.status_code == 401
        assert r1.json()["detail"] == "unauthorized"

        r2 = client.get("/places/detail/gofa_hcmc_landmark81")
        assert r2.status_code == 401
        assert r2.json()["detail"] == "unauthorized"

        # Invalid token
        bad_auth = {"Authorization": "Bearer INVALID_TOKEN"}
        r3 = client.get(
            "/places/autocomplete", params={"q": "Landmark 81"}, headers=bad_auth
        )
        assert r3.status_code == 401


def test_autocomplete_min_query_length_422(places_client):
    """Queries under 3 chars reject with 422 before invoking upstream transport."""
    for short_q in ("", "   ", "a", "ab", "  x "):
        resp = places_client.get(
            "/places/autocomplete", params={"q": short_q}, headers=AUTH_HEADER
        )
        assert resp.status_code == 422
        assert "min 3 chars" in resp.json()["detail"]


def test_places_unconfigured_returns_honest_503(places_client, monkeypatch):
    """When GOFA_API_KEY is not configured, endpoints return honest 503."""
    provider = GofaPlaceProvider(api_key="", fallback=None)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    r1 = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert r1.status_code == 503
    assert "unconfigured" in r1.json()["detail"]

    r2 = places_client.get("/places/detail/gofa_hcmc_123", headers=AUTH_HEADER)
    assert r2.status_code == 503
    assert "unconfigured" in r2.json()["detail"]


def test_autocomplete_live_shape_mocked_transport(places_client, monkeypatch):
    """Autocomplete parses live upstream shape into SuggestionOut using mock transport."""
    upstream_payload = {
        "predictions": [
            {
                "place_id": "gofa_hcmc_landmark81",
                "description": "Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
                "structured_formatting": {
                    "main_text": "Vinhomes Central Park",
                    "secondary_text": "208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
                },
                "compound": {
                    "province": "TP. Hồ Chí Minh",
                    "district": "Bình Thạnh",
                    "commune": "Phường 22",
                },
            }
        ]
    }
    calls = []

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        calls.append({"url": url, "headers": headers, "timeout": timeout})
        return 200, upstream_payload

    provider = GofaPlaceProvider(api_key="TEST_MOCK_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert resp.status_code == 200
    suggestions = resp.json()
    assert len(suggestions) == 1
    s = suggestions[0]
    assert s["place_id"] == "gofa_hcmc_landmark81"
    assert s["main_text"] == "Vinhomes Central Park"
    assert (
        s["secondary_text"]
        == "208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh"
    )
    assert s["provider"] == "gofa"

    # Verify transport contract
    assert len(calls) == 1
    assert calls[0]["headers"]["X-API-Key"] == "TEST_MOCK_KEY"
    assert "Bearer" not in calls[0]["headers"].get("Authorization", "")
    assert "/v5/Place/AutoComplete" in calls[0]["url"]
    assert (
        "input=Landmark+81" in calls[0]["url"]
        or "input=Landmark%2081" in calls[0]["url"]
    )


def test_detail_live_shape_mocked_transport_admin_mapping(places_client, monkeypatch):
    """Detail endpoint maps compound.commune to ward and location to lat/lng."""
    upstream_payload = {
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
    calls = []

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        calls.append({"url": url, "headers": headers, "timeout": timeout})
        return 200, upstream_payload

    provider = GofaPlaceProvider(api_key="TEST_MOCK_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get("/places/detail/gofa_hcmc_landmark81", headers=AUTH_HEADER)
    assert resp.status_code == 200
    data = resp.json()
    assert data["place_id"] == "gofa_hcmc_landmark81"
    assert (
        data["formatted_address"]
        == "720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh"
    )
    assert data["lat"] == 10.7951
    assert data["lng"] == 106.7218
    assert data["province"] == "TP. Hồ Chí Minh"
    assert data["district"] == "Bình Thạnh"
    # CRITICAL: compound.commune -> ward
    assert data["ward"] == "Phường 22"
    assert data["confidence"] == 0.99
    assert data["provider"] == "gofa"

    assert len(calls) == 1
    assert "/v5/Place/Detail" in calls[0]["url"]
    assert "place_id=gofa_hcmc_landmark81" in calls[0]["url"]


def test_detail_not_found_on_empty_or_zero_results(places_client, monkeypatch):
    """Detail returns 404 on blank ID or when upstream status != OK."""
    # Blank ID
    r_empty = places_client.get("/places/detail/%20", headers=AUTH_HEADER)
    assert r_empty.status_code == 404

    # ZERO_RESULTS upstream
    def mock_not_found(url, headers, timeout):
        return 200, {"status": "ZERO_RESULTS", "result": {}}

    provider = GofaPlaceProvider(api_key="TEST_MOCK_KEY", transport=mock_not_found)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    r_missing = places_client.get(
        "/places/detail/unknown_place_id", headers=AUTH_HEADER
    )
    assert r_missing.status_code == 404
    assert r_missing.json()["detail"] == "not_found"


def test_places_error_masking_502_zero_key_leak(places_client, monkeypatch):
    """Upstream failure maps to 502 with zero secret leakage in payload or headers."""
    secret_key = "TOP_SECRET_GOFA_KEY_12345"

    def mock_failing_transport(url, headers, timeout):
        raise RuntimeError(
            f"Connection timeout to upstream GOFA with key={headers.get('X-API-Key')}"
        )

    provider = GofaPlaceProvider(api_key=secret_key, transport=mock_failing_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    # Autocomplete failure
    r_auto = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert r_auto.status_code == 502
    assert "upstream" in r_auto.json()["detail"].lower()
    assert secret_key not in r_auto.text
    for h, val in r_auto.headers.items():
        assert secret_key not in h and secret_key not in val

    # Detail failure
    r_det = places_client.get(
        "/places/detail/gofa_hcmc_landmark81", headers=AUTH_HEADER
    )
    assert r_det.status_code == 502
    assert "upstream" in r_det.json()["detail"].lower()
    assert secret_key not in r_det.text
    for h, val in r_det.headers.items():
        assert secret_key not in h and secret_key not in val


def test_gofa_provider_contract_docstring():
    """GofaPlaceProvider documents the verified real contract."""
    doc = (GofaPlaceProvider.__doc__ or "").lower()
    assert "real contract" in doc
