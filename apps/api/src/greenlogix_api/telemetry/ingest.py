"""Fuel-observation ingest stub (CR-14 PARTIAL).

No GPS/OBD live feed: observations are appended manually (driver log,
fuel receipt) or loaded from a JSON file. In-memory store + JSON file
persistence only — no DB migration, no new dependencies (stdlib only).
"""

from __future__ import annotations

import json
import threading
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class FuelObs:
    """One observed fuel-consumption record (no invented data)."""

    vehicle_id: str
    observed_at: str  # ISO-8601 timestamp, caller-provided
    litres: float
    km: float
    source: str = "manual"  # e.g. "manual" | "receipt" | "obd_csv"
    trip_id: str = ""
    meta: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> FuelObs:
        return cls(
            vehicle_id=str(data["vehicle_id"]),
            observed_at=str(data["observed_at"]),
            litres=float(data["litres"]),
            km=float(data["km"]),
            source=str(data.get("source", "manual")),
            trip_id=str(data.get("trip_id", "")),
            meta=dict(data.get("meta", {})),
        )


_lock = threading.Lock()
_store: list[FuelObs] = []


def _validate(obs: FuelObs) -> None:
    if not obs.vehicle_id:
        raise ValueError("vehicle_id is required")
    if not obs.observed_at:
        raise ValueError("observed_at is required")
    if obs.litres < 0:
        raise ValueError("litres must be >= 0")
    if obs.km < 0:
        raise ValueError("km must be >= 0")


def append_obs(obs: FuelObs) -> FuelObs:
    """Validate and append one observation to the in-memory store."""
    _validate(obs)
    with _lock:
        _store.append(obs)
    return obs


def list_obs(vehicle_id: str | None = None) -> list[FuelObs]:
    """Return stored observations, optionally filtered by vehicle."""
    with _lock:
        rows = list(_store)
    if vehicle_id is None:
        return rows
    return [o for o in rows if o.vehicle_id == vehicle_id]


def clear_obs() -> None:
    """Empty the in-memory store (tests / fresh import runs)."""
    with _lock:
        _store.clear()


def save_obs(path: str | Path) -> int:
    """Persist current store to a JSON file. Returns rows written."""
    rows = [o.to_dict() for o in list_obs()]
    Path(path).write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return len(rows)


def load_obs(path: str | Path) -> int:
    """Load observations from a JSON file into the store. Returns rows added."""
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("telemetry JSON must be a list of observations")  # noqa: TRY004
    count = 0
    for item in raw:
        append_obs(FuelObs.from_dict(item))
        count += 1
    return count
