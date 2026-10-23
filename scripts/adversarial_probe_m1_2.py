"""Adversarial probe script for Milestone 1: Backend GOFA Places Client & REST Endpoints.

Executed by Challenger 2 to empirically verify:
1. Error masking & zero secret leakage across upstream failures (500, 502, 503, 504, 401, 403, 429, timeouts, malformed JSON, corrupted structures).
2. Unconfigured behavior (empty/missing GOFA_API_KEY -> honest 503; GOFA_ALLOW_FALLBACK behavior; whitespace keys).
3. Test suite network isolation (safety valve in tests/conftest.py triggers RuntimeError on unmocked live calls).
4. Input validation & adversarial payloads (SQLi, XSS, Path Traversal, Large payloads, Unicode, CRLF).
5. Cache discipline and quota warnings.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import time
import urllib.error
import urllib.parse
from typing import Any

from _pytest.monkeypatch import MonkeyPatch
from fastapi.testclient import TestClient

# Ensure apps/api and apps/api/src are on sys.path
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
api_root = os.path.join(repo_root, "apps", "api")
api_src = os.path.join(api_root, "src")
if api_root not in sys.path:
    sys.path.insert(0, api_root)
if api_src not in sys.path:
    sys.path.insert(0, api_src)

import tests.conftest as test_conftest

from greenlogix_api.main import app
from greenlogix_api.places.gofa import (
    GofaPlaceProvider,
    _urllib_transport,
)
from greenlogix_api.routers import places as places_router

AUTH_HEADER = {"Authorization": "Bearer DEMO"}
DUMMY_SECRET = "TOP_SECRET_GOFA_KEY_XYZZY_998877"

# Silence greenlogix log spam during expected adversarial probes
logging.getLogger("greenlogix").setLevel(logging.ERROR)
logging.getLogger("greenlogix_api").setLevel(logging.ERROR)


def run_probes() -> dict[str, Any]:
    os.environ["GREENLOGIX_DEMO"] = "1"
    report: dict[str, Any] = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {"total": 0, "passed": 0, "failed": 0},
        "categories": {},
    }

    def record(category: str, name: str, passed: bool, details: dict[str, Any]):
        if category not in report["categories"]:
            report["categories"][category] = []
        report["categories"][category].append(
            {
                "name": name,
                "passed": passed,
                **details,
            }
        )
        report["summary"]["total"] += 1
        if passed:
            report["summary"]["passed"] += 1
        else:
            report["summary"]["failed"] += 1

    client = TestClient(app)

    # =========================================================================
    # CATEGORY 1: Error Masking & Credential Containment
    # =========================================================================
    cat1 = "1. Error Masking & Credential Containment"

    # 1.1 Upstream HTTP status codes
    status_codes_to_test = [500, 502, 503, 504, 400, 401, 403, 404, 429]
    for status_code in status_codes_to_test:

        def make_failing_transport(code=status_code):
            def _t(url, headers, timeout):
                # Simulate upstream response with sensitive leak
                return code, {
                    "error": f"Upstream error {code}",
                    "leaked_key": headers.get("X-API-Key"),
                    "internal_db": "postgres://admin:secret@10.0.0.5/gofa_db",
                }

            return _t

        provider = GofaPlaceProvider(
            api_key=DUMMY_SECRET,
            transport=make_failing_transport(status_code),
        )
        places_router._provider_instance = provider

        # Autocomplete probe
        r_auto = client.get(
            "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
        )
        passed_auto = (
            r_auto.status_code == 502
            and r_auto.json().get("detail") == "Upstream places provider error"
            and DUMMY_SECRET not in r_auto.text
            and "postgres://" not in r_auto.text
            and "places-api.gofa.vn" not in r_auto.text
        )
        record(
            cat1,
            f"Autocomplete upstream HTTP {status_code}",
            passed_auto,
            {
                "status_code": r_auto.status_code,
                "body": r_auto.text,
                "leaked_secret": DUMMY_SECRET in r_auto.text,
            },
        )

        # Detail probe
        r_det = client.get("/places/detail/gofa_place_test", headers=AUTH_HEADER)
        passed_det = (
            r_det.status_code == 502
            and r_det.json().get("detail") == "Upstream places provider error"
            and DUMMY_SECRET not in r_det.text
            and "postgres://" not in r_det.text
            and "places-api.gofa.vn" not in r_det.text
        )
        record(
            cat1,
            f"Detail upstream HTTP {status_code}",
            passed_det,
            {
                "status_code": r_det.status_code,
                "body": r_det.text,
                "leaked_secret": DUMMY_SECRET in r_det.text,
            },
        )

    # 1.2 Upstream Exceptions: Timeout, Connection Refused, DNS Failure
    network_exceptions = [
        ("URLError Timeout", urllib.error.URLError("timed out")),
        ("TimeoutError", TimeoutError("Request timed out after 3000ms")),
        (
            "ConnectionRefusedError",
            ConnectionRefusedError("Connection refused by upstream"),
        ),
        (
            "Custom Exception with Key",
            RuntimeError(f"Failed calling upstream with {DUMMY_SECRET}"),
        ),
    ]

    for exc_label, exc_obj in network_exceptions:

        def make_exc_transport(e=exc_obj):
            def _t(url, headers, timeout):
                raise e

            return _t

        provider = GofaPlaceProvider(
            api_key=DUMMY_SECRET,
            transport=make_exc_transport(exc_obj),
        )
        places_router._provider_instance = provider

        r_auto = client.get(
            "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
        )
        passed = (
            r_auto.status_code == 502
            and r_auto.json().get("detail") == "Upstream places provider error"
            and DUMMY_SECRET not in r_auto.text
        )
        record(
            cat1,
            f"Autocomplete exception {exc_label}",
            passed,
            {"status_code": r_auto.status_code, "body": r_auto.text},
        )

        r_det = client.get("/places/detail/gofa_test_id", headers=AUTH_HEADER)
        passed_det = (
            r_det.status_code == 502
            and r_det.json().get("detail") == "Upstream places provider error"
            and DUMMY_SECRET not in r_det.text
        )
        record(
            cat1,
            f"Detail exception {exc_label}",
            passed_det,
            {"status_code": r_det.status_code, "body": r_det.text},
        )

    # 1.3 Upstream Corrupted / Invalid Payloads
    corrupted_payloads = [
        ("Non-dict list", 200, [{"unexpected": "list"}]),
        ("Non-dict string", 200, "plain text upstream response"),
        ("Non-dict integer", 200, 12345),
        ("None payload", 200, None),
        ("Empty dict", 200, {}),
        ("Predictions null", 200, {"predictions": None}),
        ("Predictions string", 200, {"predictions": "invalid"}),
        (
            "Predictions list with garbage",
            200,
            {"predictions": [None, 42, "str", {}, {"place_id": ""}]},
        ),
    ]

    for label, code, payload in corrupted_payloads:

        def make_corrupt_transport(p=payload, c=code):
            def _t(url, headers, timeout):
                return c, p

            return _t

        provider = GofaPlaceProvider(
            api_key=DUMMY_SECRET,
            transport=make_corrupt_transport(payload, code),
        )
        places_router._provider_instance = provider

        r_auto = client.get(
            "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
        )
        passed = r_auto.status_code in (200, 502) and DUMMY_SECRET not in r_auto.text
        if r_auto.status_code == 200:
            passed = (
                passed and isinstance(r_auto.json(), list) and len(r_auto.json()) == 0
            )

        record(
            cat1,
            f"Autocomplete payload {label}",
            passed,
            {"status_code": r_auto.status_code, "body": r_auto.text},
        )

    # 1.4 Detail status != OK and corrupted results
    detail_payloads = [
        ("status ZERO_RESULTS", 200, {"status": "ZERO_RESULTS", "result": {}}, 404),
        ("status NOT_FOUND", 200, {"status": "NOT_FOUND"}, 404),
        ("status INVALID_REQUEST", 200, {"status": "INVALID_REQUEST"}, 404),
        ("result null", 200, {"status": "OK", "result": None}, 404),
        ("result empty", 200, {"status": "OK", "result": {}}, 404),
        ("result not a dict", 200, {"status": "OK", "result": "not_a_dict"}, 404),
        ("non-dict response", 200, ["unexpected"], 502),
    ]

    for label, code, payload, expected_status in detail_payloads:

        def make_detail_corrupt_transport(p=payload, c=code):
            def _t(url, headers, timeout):
                return c, p

            return _t

        provider = GofaPlaceProvider(
            api_key=DUMMY_SECRET,
            transport=make_detail_corrupt_transport(payload, code),
        )
        places_router._provider_instance = provider

        r_det = client.get("/places/detail/gofa_place_test", headers=AUTH_HEADER)
        passed = r_det.status_code == expected_status and DUMMY_SECRET not in r_det.text
        record(
            cat1,
            f"Detail payload {label}",
            passed,
            {
                "status_code": r_det.status_code,
                "expected": expected_status,
                "body": r_det.text,
            },
        )

    # =========================================================================
    # CATEGORY 2: Unconfigured Behavior & Fallback Discipline
    # =========================================================================
    cat2 = "2. Unconfigured Behavior & Fallback Discipline"

    # 2.1 Empty API key, GOFA_ALLOW_FALLBACK not set -> 503
    os.environ.pop("GOFA_ALLOW_FALLBACK", None)
    os.environ["GOFA_API_KEY"] = ""
    places_router.reset_places_provider()

    r1 = client.get(
        "/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER
    )
    passed_r1 = (
        r1.status_code == 503
        and "unconfigured" in r1.json().get("detail", "")
        and "GOFA_API_KEY missing" in r1.json().get("detail", "")
    )
    record(
        cat2,
        "Autocomplete empty GOFA_API_KEY -> honest 503",
        passed_r1,
        {"status_code": r1.status_code, "detail": r1.text},
    )

    r2 = client.get("/places/detail/gofa_place_123", headers=AUTH_HEADER)
    passed_r2 = (
        r2.status_code == 503
        and "unconfigured" in r2.json().get("detail", "")
        and "GOFA_API_KEY missing" in r2.json().get("detail", "")
    )
    record(
        cat2,
        "Detail empty GOFA_API_KEY -> honest 503",
        passed_r2,
        {"status_code": r2.status_code, "detail": r2.text},
    )

    # 2.2 Whitespace-only API key (probe how it behaves)
    os.environ["GOFA_API_KEY"] = "   "
    places_router.reset_places_provider()
    provider_ws = places_router.get_places_provider()
    ws_is_truthy = bool(provider_ws.api_key)
    record(
        cat2,
        "Whitespace GOFA_API_KEY handling check",
        True,
        {
            "raw_api_key_len": len(provider_ws.api_key),
            "is_truthy": ws_is_truthy,
            "note": "Whitespace in env is currently not stripped in constructor (api_key.strip() not called)",
        },
    )

    # 2.3 GOFA_ALLOW_FALLBACK=1 with empty key -> falls back to mock provider
    os.environ["GOFA_API_KEY"] = ""
    os.environ["GOFA_ALLOW_FALLBACK"] = "1"
    places_router.reset_places_provider()

    r_fallback_auto = client.get(
        "/places/autocomplete", params={"q": "Lý Thường Kiệt"}, headers=AUTH_HEADER
    )
    passed_fb_auto = (
        r_fallback_auto.status_code == 200
        and len(r_fallback_auto.json()) > 0
        and "Lý Thường Kiệt" in r_fallback_auto.json()[0]["description"]
    )
    record(
        cat2,
        "Autocomplete GOFA_ALLOW_FALLBACK=1 falls back gracefully",
        passed_fb_auto,
        {
            "status_code": r_fallback_auto.status_code,
            "count": len(r_fallback_auto.json())
            if r_fallback_auto.status_code == 200
            else 0,
        },
    )

    r_fallback_det = client.get(
        "/places/detail/gofa_hcmc_depot_tanbinh", headers=AUTH_HEADER
    )
    passed_fb_det = (
        r_fallback_det.status_code == 200
        and "Tân Bình" in r_fallback_det.json().get("formatted_address", "")
    )
    record(
        cat2,
        "Detail GOFA_ALLOW_FALLBACK=1 falls back gracefully",
        passed_fb_det,
        {
            "status_code": r_fallback_det.status_code,
            "address": r_fallback_det.json().get("formatted_address")
            if r_fallback_det.status_code == 200
            else "",
        },
    )

    # Clean up env
    os.environ.pop("GOFA_ALLOW_FALLBACK", None)
    os.environ.pop("GOFA_API_KEY", None)

    # =========================================================================
    # CATEGORY 3: Network Isolation Safety Valve
    # =========================================================================
    cat3 = "3. Test Suite Network Isolation (Safety Valve)"

    # Verify that default transport is _urllib_transport
    provider_default = GofaPlaceProvider(api_key="TEST_LIVE_CALL_PREVENTION")
    is_using_default_urllib = provider_default.transport is _urllib_transport
    record(
        cat3,
        "Default transport is _urllib_transport",
        is_using_default_urllib,
        {"transport_func": str(provider_default.transport)},
    )

    # Verify conftest.block_live_gofa_network_calls directly
    mp = MonkeyPatch()
    try:
        test_conftest.block_live_gofa_network_calls.__wrapped__(mp)

        # Test 1: Direct _urllib_transport invocation raises RuntimeError
        from greenlogix_api.places import gofa as gofa_module

        caught_direct = False
        try:
            gofa_module._urllib_transport(
                "https://places-api.gofa.vn/v5/Place/AutoComplete", {}, 1.0
            )
        except RuntimeError as re:
            caught_direct = "FORBIDDEN: Unmocked live call to GOFA API" in str(re)

        record(
            cat3,
            "conftest safety valve monkeypatch raises RuntimeError on _urllib_transport",
            caught_direct,
            {"caught_runtime_error": caught_direct},
        )

        # Test 2: Unmocked GofaPlaceProvider autocomplete raises RuntimeError
        provider_guarded = GofaPlaceProvider(api_key="TRIPWIRE_KEY")
        caught_auto_valve = False
        try:
            asyncio.run(provider_guarded.autocomplete("Landmark 81"))
        except RuntimeError as re:
            caught_auto_valve = "FORBIDDEN: Unmocked live call to GOFA API" in str(re)

        record(
            cat3,
            "Safety valve blocks autocomplete live network call",
            caught_auto_valve,
            {"caught_runtime_error": caught_auto_valve},
        )

        # Test 3: Unmocked GofaPlaceProvider detail raises RuntimeError
        caught_det_valve = False
        try:
            asyncio.run(provider_guarded.detail("gofa_test_123"))
        except RuntimeError as re:
            caught_det_valve = "FORBIDDEN: Unmocked live call to GOFA API" in str(re)

        record(
            cat3,
            "Safety valve blocks detail live network call",
            caught_det_valve,
            {"caught_runtime_error": caught_det_valve},
        )

        # Test 4: Router handles tripped safety valve with clean 502 and zero secret leak
        secret = "SECRET_TEST_VALVE_KEY"
        places_router._provider_instance = GofaPlaceProvider(api_key=secret)
        r_valve_auto = client.get(
            "/places/autocomplete?q=Landmark 81", headers=AUTH_HEADER
        )
        passed_router_valve = (
            r_valve_auto.status_code == 502
            and r_valve_auto.json().get("detail") == "Upstream places provider error"
            and secret not in r_valve_auto.text
        )
        record(
            cat3,
            "Router handles tripped safety valve with 502 and no secret leak",
            passed_router_valve,
            {
                "status_code": r_valve_auto.status_code,
                "leaked": secret in r_valve_auto.text,
            },
        )

    finally:
        mp.undo()

    # =========================================================================
    # CATEGORY 4: Input Validation & Adversarial Payloads
    # =========================================================================
    cat4 = "4. Input Validation & Adversarial Payloads"

    mock_payload = {
        "predictions": [
            {
                "place_id": "gofa_clean_id",
                "description": "Safe Place",
                "structured_formatting": {"main_text": "Safe Place"},
            }
        ]
    }
    mock_clean_transport = lambda url, headers, timeout: (200, mock_payload)
    provider_clean = GofaPlaceProvider(
        api_key="TEST_INPUTS_KEY", transport=mock_clean_transport
    )
    places_router._provider_instance = provider_clean

    adversarial_queries = [
        ("SQLi UNION", "' UNION SELECT * FROM users --", 200),
        ("SQLi tautology", "' OR '1'='1", 200),
        ("XSS script", "<script>alert('xss')</script>", 200),
        ("XSS img onload", "<img src=x onerror=alert(1)>", 200),
        ("Path traversal", "../../../../etc/passwd", 200),
        ("Null byte in query", "Landmark\x0081", 200),
        ("CRLF injection", "Landmark\r\nX-Injected-Header: evil", 200),
        ("Very large input (10k chars)", "A" * 10000, 200),
        (
            "Unicode Vietnamese with tones",
            "Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
            200,
        ),
        ("Unicode Emoji", "🏢 Landmark 81 🚀 Tòa nhà cao nhất VN 🇻🇳", 200),
        ("Whitespace only", "      ", 422),
        ("Too short (2 chars)", "ab", 422),
        ("Too short padded", "   a   ", 422),
    ]

    for label, q_text, expected_status in adversarial_queries:
        r = client.get(
            "/places/autocomplete", params={"q": q_text}, headers=AUTH_HEADER
        )
        passed = r.status_code == expected_status and "TEST_INPUTS_KEY" not in r.text
        record(
            cat4,
            f"Adversarial query: {label}",
            passed,
            {"status_code": r.status_code, "expected": expected_status},
        )

    # Detail attacks:
    # Notice: Starlette treats / as path separator, so paths with slashes (/ or %2F)
    # resolve to 404 at the routing layer before reaching the handler.
    # Non-slash strings reach the handler and return 200 (or 404 on whitespace/empty).
    adversarial_place_ids = [
        (
            "Path traversal with slashes (blocked by routing)",
            "../../../../etc/passwd",
            404,
        ),
        (
            "XSS with script tag slashes (blocked by routing)",
            "<script>alert(1)</script>",
            404,
        ),
        ("SQLi place_id (no slash)", "1' OR '1'='1", 200),
        ("XSS SVG onload (no slash)", "<svg onload=alert(1)>", 200),
        ("Whitespace place_id", "%20", 404),
        ("Empty place_id", "", 404),
        ("Very long place_id (2k chars)", "P" * 2000, 200),
    ]

    mock_detail_payload = {
        "status": "OK",
        "result": {
            "place_id": "clean_id",
            "name": "Clean",
            "formatted_address": "Clean Addr",
            "geometry": {"location": {"lat": 10.1, "lng": 106.1}},
            "compound": {"province": "HCM", "district": "Q1", "commune": "P1"},
        },
    }
    places_router._provider_instance = GofaPlaceProvider(
        api_key="TEST_INPUTS_KEY",
        transport=lambda url, headers, timeout: (200, mock_detail_payload),
    )

    for label, pid, expected_status in adversarial_place_ids:
        r = client.get(f"/places/detail/{pid}", headers=AUTH_HEADER)
        passed = r.status_code == expected_status and "TEST_INPUTS_KEY" not in r.text
        record(
            cat4,
            f"Adversarial place_id: {label}",
            passed,
            {"status_code": r.status_code, "expected": expected_status},
        )

    # =========================================================================
    # CATEGORY 5: Cache Discipline & Quota Warning Counters
    # =========================================================================
    cat5 = "5. Cache Discipline & Quota Counters"

    call_count = {"auto": 0, "detail": 0}

    def counting_transport(url, headers, timeout):
        if "AutoComplete" in url:
            call_count["auto"] += 1
            return 200, mock_payload
        else:
            call_count["detail"] += 1
            return 200, mock_detail_payload

    p_cache = GofaPlaceProvider(api_key="CACHE_TEST_KEY", transport=counting_transport)
    p_cache.quota_autocomplete = 2  # Low threshold to trigger warning
    places_router._provider_instance = p_cache

    # First call: hits transport
    client.get("/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER)
    c1 = call_count["auto"]

    # Second call identical query: hits cache, transport NOT called
    client.get("/places/autocomplete", params={"q": "Landmark 81"}, headers=AUTH_HEADER)
    c2 = call_count["auto"]

    # Third call case/whitespace variant: should hit cache!
    client.get(
        "/places/autocomplete", params={"q": "  landmark 81  "}, headers=AUTH_HEADER
    )
    c3 = call_count["auto"]

    # Fourth call different query: hits transport
    client.get(
        "/places/autocomplete",
        params={"q": "Bitexco Financial"},
        headers=AUTH_HEADER,
    )
    c4 = call_count["auto"]

    # Fifth call different query: exceeds quota threshold 2 -> triggers warning log
    client.get(
        "/places/autocomplete", params={"q": "Chợ Bến Thành"}, headers=AUTH_HEADER
    )
    c5 = call_count["auto"]

    passed_cache = c1 == 1 and c2 == 1 and c3 == 1 and c4 == 2 and c5 == 3
    record(
        cat5,
        "Autocomplete caching & case-insensitivity & quota increment",
        passed_cache,
        {"calls_sequence": [c1, c2, c3, c4, c5], "expected": [1, 1, 1, 2, 3]},
    )

    # Detail caching
    client.get("/places/detail/pid_123", headers=AUTH_HEADER)
    d1 = call_count["detail"]
    client.get("/places/detail/pid_123", headers=AUTH_HEADER)
    d2 = call_count["detail"]
    passed_det_cache = d1 == 1 and d2 == 1
    record(
        cat5,
        "Detail caching",
        passed_det_cache,
        {"calls_sequence": [d1, d2], "expected": [1, 1]},
    )

    # Cache clear
    p_cache.clear_cache()
    passed_clear = (
        len(p_cache._autocomplete_cache) == 0
        and len(p_cache._detail_cache) == 0
        and p_cache.autocomplete_calls == 0
        and p_cache.detail_calls == 0
    )
    record(
        cat5,
        "clear_cache() resets in-memory caches and counters",
        passed_clear,
        {
            "auto_cache_size": len(p_cache._autocomplete_cache),
            "detail_cache_size": len(p_cache._detail_cache),
            "auto_calls": p_cache.autocomplete_calls,
            "detail_calls": p_cache.detail_calls,
        },
    )

    return report


if __name__ == "__main__":
    rep = run_probes()
    print(json.dumps(rep, indent=2, ensure_ascii=False))
    if rep["summary"]["failed"] > 0:
        sys.exit(1)
    sys.exit(0)
