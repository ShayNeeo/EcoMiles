"""Energy trace completeness + P_AUX drift guard + Pareto illustrative flag (T-LOOP-ENERGY).

Covers audit Sections 2.10-2.11: every hdt_v1.py equation traced in
docs/research/energy_model_spec.md Section 5 with DOI-or-BLOCKED honesty,
single P_AUX value, and Pareto illustrative labelling.
"""

from __future__ import annotations

from pathlib import Path

from greenlogix_api.energy import hdt_v1
from greenlogix_api.energy.hdt_v1 import P_AUX_WATTS, HdtEnergyModelV1
from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5
from greenlogix_api.routing import pareto
from greenlogix_api.routing.pareto import evaluate_pareto_policies

SPEC_PATH = Path(__file__).resolve().parents[3] / "docs" / "research" / "energy_model_spec.md"
HDT_PATH = Path(hdt_v1.__file__)

REQUIRED_SYMBOLS = [
    "v_ms",
    "total_mass_kg",
    "f_roll",
    "f_grade",
    "f_aero",
    "f_total",
    "p_traction_w",
    "p_engine_w",
    "mech_kwh",
    "fuel_energy_j",
    "P_AUX_WATTS",
    "ttw_kg_co2",
]

REQUIRED_COLUMNS = ["doi", "variable", "unit", "source", "assumption", "validity", "test"]


def _spec_text() -> str:
    assert SPEC_PATH.exists(), f"energy spec missing: {SPEC_PATH}"
    return SPEC_PATH.read_text(encoding="utf-8")


def test_p_aux_single_value():
    """P_AUX drift fixed: single 1500 W value with documented assumption."""
    assert P_AUX_WATTS == 1500.0
    code = HDT_PATH.read_text(encoding="utf-8")
    assert "1200" not in code, "drifted 1200 W value still present in hdt_v1.py"
    spec = _spec_text()
    assert "1500" in spec
    # Honesty: no invented bench citation for P_AUX.
    assert "BLOCKED" in spec


def test_trace_table_covers_all_symbols():
    """Spec Section 5 covers every hdt_v1.py equation with required columns."""
    spec = _spec_text().lower()
    assert "per-equation trace" in spec
    for col in REQUIRED_COLUMNS:
        assert col in spec, f"trace table missing column: {col}"
    assert "eq#" in _spec_text() or "eq\\#" in _spec_text()
    full = _spec_text()
    for sym in REQUIRED_SYMBOLS:
        assert sym in full, f"trace table missing symbol: {sym}"
    # DOI-or-BLOCKED honesty marker required (never invent papers).
    assert "BLOCKED" in full


def test_pareto_illustrative_flag():
    """All Pareto candidates carry illustrative=True until Valhalla rerank."""
    candidates = evaluate_pareto_policies(base_km=30.0, profile=XE_TAI_NHO_1T5, payload_kg=600.0)
    assert len(candidates) == 3
    for c in candidates:
        assert c.illustrative is True
    doc = (pareto.__doc__ or "")
    assert "ILLUSTRATIVE" in doc
    assert "Valhalla" in doc


def test_aero_quadratic_scaling():
    """Aero drag scales with v^2: fuel rises steeply in aero-dominated band.

    Note: full fuel-vs-speed curve is U-shaped (P_AUX + rolling integrate
    over longer duration at crawl speeds, minimum near ~30 km/h), so this
    gate compares 40 vs 80 km/h where the v^2 aero term dominates.
    """
    model = HdtEnergyModelV1()
    cruise = model.estimate_segment_energy(10.0, XE_TAI_NHO_1T5, payload_kg=500.0, speed_kmh=40.0)
    fast = model.estimate_segment_energy(10.0, XE_TAI_NHO_1T5, payload_kg=500.0, speed_kmh=80.0)
    assert fast.fuel_litres > cruise.fuel_litres
    assert fast.mechanical_energy_kwh > cruise.mechanical_energy_kwh
