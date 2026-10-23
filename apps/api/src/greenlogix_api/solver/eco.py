"""Optional eco-weighted routing cost. TTW estimate, not ISO 14083.

DEPRECATED: GREENLOGIX_ECO_WEIGHT is frozen for OpenAPI compat only.
Prefer Pareto reporting (see tests/test_pareto.py). Weight > 0 still works
but logs a deprecation warning on every read.
"""

from __future__ import annotations

import logging
import os
from collections.abc import Callable

from greenlogix_api.carbon import kg_co2

log = logging.getLogger("greenlogix")

PairKm = Callable[[float, float, float, float], float]


def eco_weight_from_env() -> float:
    raw = (os.environ.get("GREENLOGIX_ECO_WEIGHT") or "").strip()
    if not raw:
        return 0.0
    try:
        weight = max(0.0, min(1.0, float(raw)))
    except ValueError:
        return 0.0
    if weight > 0:
        log.warning(
            "GREENLOGIX_ECO_WEIGHT is deprecated (value=%s); use Pareto reporting instead. "
            "Behavior unchanged for contract compat.",
            raw,
        )
    return weight


def eco_leg_cost(km: float, l_per_100km: float, fuel: str, eco_weight: float) -> float:
    """Blend physical km and estimated kg_co2. eco_weight=0 is pure km."""
    try:
        weight = float(eco_weight)
    except (TypeError, ValueError):
        weight = 0.0
    weight = max(0.0, min(1.0, weight))
    if weight <= 0.0:
        return km
    return (1.0 - weight) * km + weight * kg_co2(km, l_per_100km, fuel)


def make_eco_pair_km(
    pair_km: PairKm,
    l_per_100km: float,
    fuel: str,
    eco_weight: float,
) -> PairKm:
    def cost(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        return eco_leg_cost(pair_km(lat1, lng1, lat2, lng2), l_per_100km, fuel, eco_weight)

    return cost
