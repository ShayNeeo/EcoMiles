import json

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import inspect

from greenlogix_api import db as dbmod
from greenlogix_api.main import OPENAPI_PATH, app
from greenlogix_api.schemas import OptimizeIn, OrderPatch, VehiclePatch

FROZEN_METHODS = {
    "/health": {"get"},
    "/favicon.ico": {"get"},
    "/dispatcher": {"get"},
    "/seed": {"post"},
    "/orders/import": {"post"},
    "/orders": {"get"},
    "/orders/{id}": {"get", "patch", "delete"},
    "/vehicles": {"get"},
    "/vehicles/{id}": {"patch"},
    "/optimize": {"post"},
    "/routes": {"get"},
    "/routes/{id}/admin-areas": {"get"},
    "/routes/publish": {"post"},
    "/report": {"get"},
    "/report.xlsx": {"get"},
    "/driver/route": {"get"},
    "/driver/restriction-feedback": {"post"},
    "/driver/restriction-feedback/pending": {"get"},
    "/driver/restriction-feedback/{feedback_id}/verify": {"post"},
    "/stops/{id}/status": {"post"},
    "/stops/{id}/photo": {"post"},
    "/places/autocomplete": {"get"},
    "/places/detail/{place_id}": {"get"},
    "/analytics/kpis": {"get"},
    "/analytics/timeseries": {"get"},
    "/analytics/fleet": {"get"},
    "/dashboard": {"get"},
    "/report.pdf": {"get"},
    "/routes/{id}/audit": {"get"},
    "/ingest/events": {"post"},
}


def test_frozen_openapi():
    saved = json.loads(OPENAPI_PATH.read_text(encoding="utf-8"))
    assert saved == app.openapi()
    assert {
        path: set(methods) for path, methods in saved["paths"].items()
    } == FROZEN_METHODS


@pytest.mark.parametrize(
    ("path", "field"), [("/orders/import", "file"), ("/stops/{id}/photo", "photo")]
)
def test_multipart_contract(path, field):
    schema = app.openapi()
    body = schema["paths"][path]["post"]["requestBody"]
    reference = body["content"]["multipart/form-data"]["schema"]["$ref"]
    upload = schema["components"]["schemas"][reference.rsplit("/", 1)[1]]
    assert upload["required"] == [field]
    assert set(upload["properties"]) == {field}


@pytest.mark.parametrize(
    ("model", "field", "expected"),
    [
        ("OrderOut", "cargo_type", ["thuong", "lanh", "de_vo"]),
        ("OrderPatch", "cargo_type", ["thuong", "lanh", "de_vo"]),
        (
            "OrderOut",
            "status",
            ["pending", "assigned", "arrived", "delivered", "failed"],
        ),
        ("VehicleOut", "fuel", ["petrol", "diesel"]),
        ("VehiclePatch", "fuel", ["petrol", "diesel"]),
        ("VehicleOut", "status", ["ready", "maintenance"]),
        ("VehiclePatch", "status", ["ready", "maintenance"]),
        ("StopOut", "kind", ["depot", "stop"]),
        ("StopOut", "status", ["pending", "arrived", "delivered", "failed"]),
        ("StatusIn", "status", ["arrived", "delivered", "failed"]),
        ("StatusOut", "status", ["pending", "arrived", "delivered", "failed"]),
        ("StatusIn", "reason", ["khach_vang", "sai_dia_chi", "hang_hong", "tu_choi"]),
        ("StatusOut", "reason", ["khach_vang", "sai_dia_chi", "hang_hong", "tu_choi"]),
        (
            "StopOut",
            "fail_reason",
            ["khach_vang", "sai_dia_chi", "hang_hong", "tu_choi"],
        ),
    ],
)
def test_schema_enums(model, field, expected):
    schema = app.openapi()["components"]["schemas"][model]["properties"][field]
    variants = schema.get("anyOf", [schema])
    assert (
        next(variant["enum"] for variant in variants if "enum" in variant) == expected
    )


def test_startup_creates_tables():
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        assert set(inspect(dbmod.engine).get_table_names()) == {
            "orders",
            "vehicles",
            "routes",
            "stops",
        }


@pytest.mark.parametrize(
    ("path", "body"),
    [
        ("/orders/1", {"cargo_type": "invalid"}),
        ("/orders/1", {"lat": 90.01}),
        ("/orders/1", {"lat": -90.01}),
        ("/orders/1", {"lng": 180.01}),
        ("/orders/1", {"lng": -180.01}),
        ("/orders/1", {"kg": -1}),
        ("/orders/1", {"window_start": "24:00"}),
        ("/orders/1", {"window_end": "12:60"}),
        ("/orders/1", {"window_start": "8:00"}),
        ("/orders/1", {"window_end": "2026-09-06T08:00:00"}),
        ("/vehicles/1", {"fuel": "invalid"}),
        ("/vehicles/1", {"status": "invalid"}),
        ("/vehicles/1", {"capacity_kg": 0}),
        ("/vehicles/1", {"capacity_kg": -1}),
        ("/vehicles/1", {"l_per_100km": 0}),
        ("/vehicles/1", {"l_per_100km": -1}),
    ],
)
def test_invalid_patch_returns_422(monkeypatch, path, body):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.patch(
            path, json=body, headers={"Authorization": "Bearer DEMO"}
        )
    assert response.status_code == 422


@pytest.mark.parametrize("radius", [0, -1])
def test_invalid_radius_returns_422(monkeypatch, radius):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.post(
            "/optimize",
            json={"cluster_radius_km": radius},
            headers={"Authorization": "Bearer DEMO"},
        )
    assert response.status_code == 422


@pytest.mark.parametrize(
    ("model", "field"),
    [
        (OrderPatch, "lat"),
        (OrderPatch, "lng"),
        (OrderPatch, "kg"),
        (VehiclePatch, "capacity_kg"),
        (VehiclePatch, "l_per_100km"),
        (OptimizeIn, "cluster_radius_km"),
    ],
)
@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf")])
def test_nonfinite_input_rejected(model, field, value):
    with pytest.raises(ValidationError):
        model.model_validate({field: value})


@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity", "1e999", '"NaN"'])
@pytest.mark.parametrize(
    ("method", "path", "field"),
    [
        ("PATCH", "/orders/1", "lat"),
        ("PATCH", "/vehicles/1", "capacity_kg"),
        ("POST", "/optimize", "cluster_radius_km"),
    ],
)
def test_nonfinite_http_input_returns_422(monkeypatch, method, path, field, value):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.request(
            method,
            path,
            content='{"' + field + '":' + value + "}",
            headers={
                "Authorization": "Bearer DEMO",
                "Content-Type": "application/json",
            },
        )
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", field]


@pytest.mark.parametrize(
    ("path", "body"),
    [
        ("/orders/1", {}),
        ("/orders/1", {"lat": -90, "lng": -180, "kg": 0, "window_start": "00:00"}),
        (
            "/orders/1",
            {"lat": 90, "lng": 180, "window_end": "23:59", "cargo_type": "lanh"},
        ),
        (
            "/vehicles/1",
            {"capacity_kg": 500, "fuel": "diesel", "l_per_100km": 8, "status": "ready"},
        ),
    ],
)
def test_valid_patch_reaches_handler(monkeypatch, path, body):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.patch(
            path, json=body, headers={"Authorization": "Bearer DEMO"}
        )
    assert response.status_code == 404
    assert response.json() == {"detail": "not_found"}


@pytest.mark.parametrize(
    "body",
    [
        {"status": "pending"},
        {"status": "invalid"},
        {"status": "failed"},
        {"status": "failed", "reason": None},
        {"status": "failed", "reason": "invalid"},
        {"status": "delivered", "reason": "invalid"},
    ],
)
def test_invalid_status_returns_422(monkeypatch, body):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.post(
            "/stops/1/status", json=body, headers={"X-Driver-Pin": "0000"}
        )
    assert response.status_code == 422


@pytest.mark.parametrize(
    "body",
    [{"status": "arrived"}, {"status": "delivered", "reason": None}]
    + [
        {"status": "failed", "reason": reason}
        for reason in ("khach_vang", "sai_dia_chi", "hang_hong", "tu_choi")
    ],
)
def test_valid_status_reaches_handler(monkeypatch, body):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.post(
            "/stops/1/status", json=body, headers={"X-Driver-Pin": "0000"}
        )
    assert response.status_code == 404
    assert response.json() == {"detail": "not_found"}


@pytest.mark.parametrize(("field", "expected"), [("photo", 404), ("file", 422)])
def test_photo_field(monkeypatch, field, expected):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    with TestClient(app) as client:
        response = client.post(
            "/stops/1/photo",
            files={field: ("proof.jpg", b"\xff\xd8\xff\xe0testjpeg", "image/jpeg")},
            headers={"X-Driver-Pin": "0000"},
        )
    assert response.status_code == expected
