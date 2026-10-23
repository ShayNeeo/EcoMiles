"""Telemetry ingest roundtrip + MAE/MAPE math + DRIVE honest stub (T-LOOP-TELEMETRY).

Pure unit tests: no DB, no network, no invented vehicle data.
"""

from __future__ import annotations

import pytest

from greenlogix_api.benchmark import google_drive
from greenlogix_api.telemetry.calibration import mae_mape
from greenlogix_api.telemetry.ingest import (
    FuelObs,
    append_obs,
    clear_obs,
    list_obs,
    load_obs,
    save_obs,
)


@pytest.fixture(autouse=True)
def _clean_store():
    clear_obs()
    yield
    clear_obs()


def _obs(vehicle: str = "51C-12345", litres: float = 12.5, km: float = 100.0) -> FuelObs:
    return FuelObs(
        vehicle_id=vehicle,
        observed_at="2026-09-22T08:00:00+07:00",
        litres=litres,
        km=km,
        source="manual",
    )


def test_ingest_append_and_list_roundtrip() -> None:
    append_obs(_obs(litres=12.5))
    append_obs(_obs(vehicle="51C-99999", litres=8.0))
    assert len(list_obs()) == 2
    mine = list_obs(vehicle_id="51C-12345")
    assert len(mine) == 1
    assert mine[0].litres == pytest.approx(12.5)
    assert mine[0].source == "manual"


def test_ingest_rejects_negative_values() -> None:
    with pytest.raises(ValueError):
        append_obs(_obs(litres=-1.0))
    with pytest.raises(ValueError):
        append_obs(_obs(km=-5.0))
    with pytest.raises(ValueError):
        append_obs(FuelObs(vehicle_id="", observed_at="2026-09-22T08:00:00+07:00", litres=1.0, km=1.0))
    assert list_obs() == []


def test_ingest_json_file_roundtrip(tmp_path) -> None:
    append_obs(_obs(litres=12.5, km=100.0))
    append_obs(_obs(vehicle="51C-99999", litres=8.0, km=80.0))
    target = tmp_path / "fuel_obs.json"
    assert save_obs(target) == 2
    clear_obs()
    assert list_obs() == []
    assert load_obs(target) == 2
    rows = list_obs()
    assert {r.vehicle_id for r in rows} == {"51C-12345", "51C-99999"}


def test_mae_mape_math() -> None:
    predicted = [10.0, 20.0, 30.0]
    observed = [12.0, 18.0, 33.0]
    got = mae_mape(predicted, observed)
    assert got["n"] == 3.0
    assert got["mae"] == pytest.approx((2.0 + 2.0 + 3.0) / 3.0)
    assert got["mape_pct"] == pytest.approx((2 / 12 + 2 / 18 + 3 / 33) / 3 * 100.0)


def test_mae_mape_guards() -> None:
    with pytest.raises(ValueError):
        mae_mape([], [])
    with pytest.raises(ValueError):
        mae_mape([1.0, 2.0], [1.0])
    with pytest.raises(ValueError):
        mae_mape([1.0], [0.0])  # MAPE undefined at zero observed
    with pytest.raises(ValueError):
        mae_mape([float("nan")], [1.0])


def test_drive_stub_never_returns_fake_data() -> None:
    for call in (
        lambda: google_drive.fetch_route_file("abc123"),
        lambda: google_drive.upload_report("r.pdf", b"x"),
        lambda: google_drive.list_files("folder1"),
    ):
        with pytest.raises(NotImplementedError, match="BLOCKED"):
            call()
