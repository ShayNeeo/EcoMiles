"""Auth hardening: prod PIN gate + CORS prod split (T-LOOP-AUTH).

PIN lockout (C-01): failed ``X-Driver-Pin`` attempts counted per client
IP + PIN; 429 once ``MAX_PIN_ATTEMPTS`` exceeded within
``PIN_LOCKOUT_SECONDS``. Successes never count (demo-OK unaffected).
"""

from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

from greenlogix_api.auth import service as auth_service
from greenlogix_api.main import app


@pytest.mark.parametrize("demo", [None, "0"])
def test_prod_global_pin_0000_rejected(monkeypatch, demo) -> None:
    if demo is None:
        monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    else:
        monkeypatch.setenv("GREENLOGIX_DEMO", demo)
    with TestClient(app) as client:
        res = client.get("/driver/route", headers={"X-Driver-Pin": "0000"})
    assert res.status_code == 401


@pytest.mark.parametrize("demo", [None, "0"])
def test_prod_scoped_driver_pin_rejected(monkeypatch, demo) -> None:
    if demo is None:
        monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    else:
        monkeypatch.setenv("GREENLOGIX_DEMO", demo)
    with TestClient(app) as client:
        res = client.get("/driver/route", headers={"X-Driver-Pin": "driver_51C01"})
    assert res.status_code == 401


@pytest.mark.parametrize("demo", [None, "0"])
def test_prod_bearer_demo_rejected(monkeypatch, demo) -> None:
    if demo is None:
        monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    else:
        monkeypatch.setenv("GREENLOGIX_DEMO", demo)
    with TestClient(app) as client:
        res = client.get("/orders", headers={"Authorization": "Bearer DEMO"})
    assert res.status_code == 401


def test_demo_global_pin_ok(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        res = client.get("/driver/route", headers={"X-Driver-Pin": "0000"})
    assert res.status_code != 401


def test_demo_scoped_pin_ok(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        res = client.get("/driver/route", headers={"X-Driver-Pin": "driver_51C01"})
    assert res.status_code == 200


def test_demo_bearer_ok(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        res = client.get("/orders", headers={"Authorization": "Bearer DEMO"})
    assert res.status_code != 401


def test_cors_prod_split_allowlist(monkeypatch) -> None:
    from greenlogix_api.main import _cors_origins

    # Demo with no explicit allowlist -> wildcard (demo only).
    monkeypatch.delenv("GREENLOGIX_CORS_ORIGINS", raising=False)
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    assert _cors_origins() == ["*"]
    # Prod with no allowlist -> deny cross-origin.
    monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    monkeypatch.delenv("GREENLOGIX_CORS_ORIGINS", raising=False)
    assert _cors_origins() == []
    monkeypatch.setenv("GREENLOGIX_DEMO", "0")
    monkeypatch.delenv("GREENLOGIX_CORS_ORIGINS", raising=False)
    assert _cors_origins() == []
    # Explicit allowlist wins in both modes (no "*" in prod).
    monkeypatch.setenv(
        "GREENLOGIX_CORS_ORIGINS", "https://fleet.example.vn, https://ops.example.vn"
    )
    assert _cors_origins() == ["https://fleet.example.vn", "https://ops.example.vn"]
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    assert _cors_origins() == ["https://fleet.example.vn", "https://ops.example.vn"]


def test_legacy_require_driver_prod_gate(monkeypatch) -> None:
    from fastapi import HTTPException

    from greenlogix_api.auth.legacy import require_driver

    monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    with pytest.raises(HTTPException):
        require_driver(x_driver_pin="0000")
    monkeypatch.setenv("GREENLOGIX_DEMO", "0")
    with pytest.raises(HTTPException):
        require_driver(x_driver_pin="0000")
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    assert require_driver(x_driver_pin="0000") is None


@pytest.fixture
def lockout_small_window(monkeypatch):
    """Shrink threshold/window for fast deterministic lockout tests."""
    auth_service._PIN_ATTEMPTS.clear()
    monkeypatch.setattr(auth_service, "MAX_PIN_ATTEMPTS", 3)
    monkeypatch.setattr(auth_service, "PIN_LOCKOUT_SECONDS", 60)
    yield
    auth_service._PIN_ATTEMPTS.clear()


def test_pin_lockout_triggers_after_n_rapid_failures(
    monkeypatch, lockout_small_window
) -> None:
    """C-01 AC-01: N rapid failures on same PIN -> 401s then 429 lockout."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    bad = {"X-Driver-Pin": "wrong-pin-xyz"}
    with TestClient(app) as client:
        assert client.get("/driver/route", headers=bad).status_code == 401
        assert client.get("/driver/route", headers=bad).status_code == 401
        res = client.get("/driver/route", headers=bad)
        assert res.status_code == 429
        assert "locked" in res.json()["detail"]
        # Still locked on the next attempt within the window.
        res = client.get("/driver/route", headers=bad)
        assert res.status_code == 429


def test_pin_lockout_resets_after_window(monkeypatch, lockout_small_window) -> None:
    """C-01: expired failures are pruned, so attempts return 401 again."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    bad = {"X-Driver-Pin": "wrong-pin-window"}
    with TestClient(app) as client:
        for _ in range(3):
            client.get("/driver/route", headers=bad)
        assert client.get("/driver/route", headers=bad).status_code == 429
        # Age all recorded failures past the window.
        old = time.monotonic() - auth_service.PIN_LOCKOUT_SECONDS - 1
        for key in list(auth_service._PIN_ATTEMPTS):
            auth_service._PIN_ATTEMPTS[key] = [old] * len(
                auth_service._PIN_ATTEMPTS[key]
            )
        res = client.get("/driver/route", headers=bad)
        assert res.status_code == 401


def test_pin_lockout_demo_ok_path_unaffected(
    monkeypatch, lockout_small_window
) -> None:
    """C-01: valid PINs and Bearer DEMO never count toward lockout."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        for _ in range(10):
            res = client.get("/driver/route", headers={"X-Driver-Pin": "0000"})
            assert res.status_code != 401
            res = client.get(
                "/driver/route", headers={"X-Driver-Pin": "driver_51C01"}
            )
            assert res.status_code == 200
            res = client.get("/orders", headers={"Authorization": "Bearer DEMO"})
            assert res.status_code != 401
        # Valid PINs still fine after many successes (no lockout triggered).
        assert (
            client.get("/driver/route", headers={"X-Driver-Pin": "0000"}).status_code
            != 401
        )
        assert auth_service._PIN_ATTEMPTS == {}
