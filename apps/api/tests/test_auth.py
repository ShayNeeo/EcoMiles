"""GREENLOGIX_DEMO gate for dispatcher Bearer and driver PIN (D-19)."""

import pytest
from fastapi.testclient import TestClient

from greenlogix_api.main import app

PROTECTED_OPERATIONS = [
    ("GET", "/dispatcher", "dispatcher", None, None, 200),
    ("POST", "/seed", "dispatcher", None, None, 200),
    ("POST", "/orders/import", "dispatcher", None, "file", 400),
    ("GET", "/orders", "dispatcher", None, None, 200),
    ("PATCH", "/orders/1", "dispatcher", {"kg": 12}, None, 404),
    ("DELETE", "/orders/1", "dispatcher", None, None, 404),
    ("GET", "/vehicles", "dispatcher", None, None, 200),
    ("PATCH", "/vehicles/1", "dispatcher", {"status": "ready"}, None, 404),
    ("POST", "/optimize", "dispatcher", {}, None, 200),
    ("GET", "/routes", "dispatcher", None, None, 200),
    ("POST", "/routes/publish", "dispatcher", {"route_ids": []}, None, 200),
    ("GET", "/report", "dispatcher", None, None, 200),
    ("GET", "/driver/route", "driver", None, None, 200),
    ("POST", "/stops/1/status", "driver", {"status": "arrived"}, None, 404),
    ("POST", "/stops/1/photo", "driver", None, "photo", 404),
]


@pytest.mark.parametrize(
    ("method", "path", "role", "body", "upload", "success"), PROTECTED_OPERATIONS
)
@pytest.mark.parametrize(
    ("demo", "credential"),
    [
        (None, "valid"),
        ("0", "valid"),
        ("1", "missing"),
        ("1", "invalid"),
        ("1", "other_role"),
        ("1", "valid"),
    ],
)
def test_protected_operations(
    monkeypatch, method, path, role, body, upload, success, demo, credential
):
    if demo is None:
        monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    else:
        monkeypatch.setenv("GREENLOGIX_DEMO", demo)
    credentials = {
        "dispatcher": {"Authorization": "Bearer DEMO"},
        "driver": {"X-Driver-Pin": "0000"},
    }
    headers = credentials[role]
    if credential == "missing":
        headers = {}
    elif credential == "invalid":
        headers = {header: "wrong" for header in headers}
    elif credential == "other_role":
        headers = credentials["driver" if role == "dispatcher" else "dispatcher"]
    files = {upload: ("sample.xlsx", b"stub upload")} if upload else None
    with TestClient(app) as client:
        response = client.request(method, path, json=body, files=files, headers=headers)
    assert response.status_code == (
        success
        if demo == "1"
        and (
            credential == "valid"
            or (credential == "other_role" and role == "driver")
        )
        else 401
    )


@pytest.mark.parametrize("demo", [None, "0", "1"])
@pytest.mark.parametrize("path", ["/health", "/openapi.json"])
def test_public_routes_ignore_credentials(monkeypatch, demo, path):
    if demo is not None:
        monkeypatch.setenv("GREENLOGIX_DEMO", demo)
    with TestClient(app) as client:
        response = client.get(
            path, headers={"Authorization": "wrong", "X-Driver-Pin": "wrong"}
        )
    assert response.status_code == 200


def test_cors_allows_auth_headers_without_credentials():
    with TestClient(app) as client:
        response = client.options(
            "/orders",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization,X-Driver-Pin",
            },
        )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
    assert "access-control-allow-credentials" not in response.headers
    assert "authorization" in response.headers["access-control-allow-headers"].lower()
    assert "x-driver-pin" in response.headers["access-control-allow-headers"].lower()


def test_orders_401_when_demo_unset(monkeypatch) -> None:
    monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    with TestClient(app) as client:
        res = client.get("/orders")
    assert res.status_code == 401


def test_orders_401_when_demo_zero(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "0")
    with TestClient(app) as client:
        res = client.get(
            "/orders",
            headers={"Authorization": "Bearer DEMO"},
        )
    assert res.status_code == 401


def test_orders_not_401_when_demo_and_bearer(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        res = client.get(
            "/orders",
            headers={"Authorization": "Bearer DEMO"},
        )
    assert res.status_code in (200, 503)
    assert res.status_code != 401


def test_driver_route_401_without_pin(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        res = client.get("/driver/route")
    assert res.status_code == 401


def test_driver_route_ok_with_pin(monkeypatch) -> None:
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        res = client.get(
            "/driver/route",
            headers={"X-Driver-Pin": "0000"},
        )
    assert res.status_code in (200, 503)
    assert res.status_code != 401
