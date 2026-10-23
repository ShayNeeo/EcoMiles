"""Optimizer selection + fail-closed publish guard (CR-01, ADR 0001 §C).

GREENLOGIX_OPTIMIZER=legacy (default, NN+2-opt heuristic in solver/) or
ecoalns (experimental EcoALNS in optimizer/eco_alns.py). Unknown values fall
back to legacy — never crash an optimize call on a flag typo.

GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1 blocks /routes/publish when the stored
report's routing_quality is DEGRADED/UNAVAILABLE (fail-closed: circuity-derived
routes must not ship as truck-safe without an explicit label).
"""

from __future__ import annotations

import os

OPTIMIZER_LEGACY = "legacy"
OPTIMIZER_ECOALNS = "ecoalns"


def optimizer_from_env() -> str:
    raw = (
        os.environ.get("ECOMILES_OPTIMIZER")
        or os.environ.get("GREENLOGIX_OPTIMIZER")
        or OPTIMIZER_LEGACY
    ).strip().lower()
    if raw in {OPTIMIZER_LEGACY, "heuristic", "nn2opt", ""}:
        return OPTIMIZER_LEGACY
    if raw in {OPTIMIZER_ECOALNS, "eco_alns", "alns"}:
        return OPTIMIZER_ECOALNS
    return OPTIMIZER_LEGACY


def optimizer_name_for_audit() -> str:
    """Trivial audit alias for optimizer_from_env (C-05, additive only).

    Returns "legacy" default or "ecoalns" when the flag is set. Never
    raises — falls back to legacy on any unexpected error so optimize
    and report writes never fail on a flag typo. Records the flag only;
    ALNS stays hill-climb documented, not a full domain swap.
    """
    try:
        return optimizer_from_env()
    except Exception:
        return OPTIMIZER_LEGACY


def publish_require_verified_from_env() -> bool:
    return (os.environ.get("GREENLOGIX_PUBLISH_REQUIRE_VERIFIED") or "").strip() == "1"


def publish_blocked_for_quality(routing_quality: str | None) -> bool:
    """True when fail-closed is on and quality is not VERIFIED_GRAPH."""
    if not publish_require_verified_from_env():
        return False
    return (routing_quality or "DEGRADED").strip().upper() != "VERIFIED_GRAPH"
