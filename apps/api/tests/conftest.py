"""Shared API test helpers. Isolated SQLite per test that needs the DB."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from greenlogix_api import carbon
from greenlogix_api import db as dbmod

AUTH = {"Authorization": "Bearer DEMO"}
PIN = {"X-Driver-Pin": "0000"}


@pytest.fixture(autouse=True)
def road_baseline_offline(monkeypatch):
    """CI stays on circuity; production defaults to OSM auto/truck."""
    monkeypatch.setenv("ROAD_BASELINE", "circuity")
    from greenlogix_api.solver.road_baseline import clear_matrix_cache

    clear_matrix_cache()
    yield
    clear_matrix_cache()


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    db_path = data_dir / "greenlogix.db"
    report_path = data_dir / "last_report.json"
    uploads_dir = data_dir / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr(dbmod, "DATA_DIR", data_dir)
    monkeypatch.setattr(dbmod, "UPLOADS_DIR", uploads_dir)
    monkeypatch.setattr(dbmod, "DB_PATH", db_path)
    monkeypatch.setattr(dbmod, "REPORT_PATH", report_path)
    # Without this, /seed-running tests rewrite the tracked demo workbooks in
    # apps/api/data/seed/ (found during CR-20261018-001 hardening).
    monkeypatch.setattr(dbmod, "SEED_DIR", data_dir / "seed")
    dbmod.set_engine(f"sqlite:///{db_path}", recreate=True)
    carbon._cache = None
    yield


@pytest.fixture
def demo_client(monkeypatch):
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    from greenlogix_api.main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture(autouse=True)
def block_live_gofa_network_calls(monkeypatch):
    """Guarantees tests never consume the 15,000 sponsored GOFA call quota."""

    def _forbidden_urllib(url: str, headers: dict[str, str], timeout: float):
        raise RuntimeError(
            f"FORBIDDEN: Unmocked live call to GOFA API ({url}) attempted during test suite! "
            "All tests must use an explicit mock transport."
        )

    monkeypatch.setattr(
        "greenlogix_api.places.gofa._urllib_transport", _forbidden_urllib
    )
