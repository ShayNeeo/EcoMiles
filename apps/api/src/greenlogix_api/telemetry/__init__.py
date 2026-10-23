"""Telemetry observation ingest package (CR-14/CR-16 PARTIAL stub)."""

from greenlogix_api.telemetry.calibration import mae_mape
from greenlogix_api.telemetry.ingest import (
    FuelObs,
    append_obs,
    clear_obs,
    list_obs,
    load_obs,
    save_obs,
)

__all__ = [
    "FuelObs",
    "append_obs",
    "clear_obs",
    "list_obs",
    "load_obs",
    "mae_mape",
    "save_obs",
]
