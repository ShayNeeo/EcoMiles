"""Public health and OpenAPI docs URL."""

from fastapi.testclient import TestClient

from greenlogix_api.main import app


def test_health_ok() -> None:
    with TestClient(app) as client:
        res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"  # additive version fields allowed


def test_openapi_json_public() -> None:
    with TestClient(app) as client:
        res = client.get("/openapi.json")
    assert res.status_code == 200
    body = res.json()
    assert "paths" in body
    assert "/health" in body["paths"]


def test_api_prefix_routing() -> None:
    with TestClient(app) as client:
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        res_slash = client.get("/api/health/")
        assert res_slash.status_code == 200
        assert res_slash.json()["status"] == "ok"
