"""Base energy and carbon emission model protocol."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable

from greenlogix_api.geo.truck_profile import TruckProfile


@dataclass(frozen=True)
class EnergyEstimate:
    """Estimated fuel, mechanical energy, and greenhouse gas emissions for a road segment."""

    fuel_litres: float
    duration_seconds: float
    mechanical_energy_kwh: float
    ttw_kg_co2: float
    wtw_kg_co2: float
    model_version: str = "GLX-HDT-v1"


@runtime_checkable
class EnergyModel(Protocol):
    """Protocol for road segment energy evaluation."""

    def estimate_segment_energy(
        self,
        length_km: float,
        profile: TruckProfile,
        payload_kg: float,
        speed_kmh: float = 32.0,
        grade_percent: float = 0.0,
    ) -> EnergyEstimate:
        """Estimate fuel and emissions taking into account truck dimensions, payload, and grade."""
        ...
