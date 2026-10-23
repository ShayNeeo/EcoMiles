"""Pareto rerank Stage-1 honesty tests (T-LOOP-PARETO2) + epsilon-SLA selection (CR-10 slice).

Covers: dominance math, illustrative fallback on empty alternatives,
verified path with fake alternatives + fake scorer, and the circuity guard
(no Valhalla dominance claim when the baseline is circuity). SLA slice
covers §8.2 presets, §15.2 Eco SLA metamorphic properties, and §16.2
structured why-facts (no LLM, no invented reasons).
"""

from __future__ import annotations

from greenlogix_api.energy.base import EnergyEstimate
from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5
from greenlogix_api.routing.pareto import (
    PolicyCandidate,
    RouteAlternative,
    evaluate_pareto_policies,
    filter_dominated,
    rerank_from_alternatives,
    select_policy_path,
    why_facts,
)


def _cand(
    name: str,
    fuel: float,
    seconds: float,
    source: str = "illustrative",
) -> PolicyCandidate:
    return PolicyCandidate(
        policy="TEST",
        name=name,
        length_km=10.0,
        duration_seconds=seconds,
        fuel_litres=fuel,
        ttw_kg_co2=round(fuel * 2.68, 4),
        time_penalty_pct=0.0,
        fuel_savings_pct=0.0,
        explanation="test fixture",
        source=source,  # type: ignore[arg-type]
    )


def test_dominance_filter_removes_dominated():
    """Higher fuel AND longer time -> dominated -> removed."""
    lean_fast = _cand("lean-fast", fuel=5.0, seconds=1000.0)
    dominated = _cand("dominated", fuel=7.0, seconds=1200.0)
    kept = filter_dominated([lean_fast, dominated])
    assert [c.name for c in kept] == ["lean-fast"]


def test_dominance_filter_keeps_tradeoffs():
    """One faster + one leaner: both non-dominated, both kept."""
    faster = _cand("faster", fuel=7.0, seconds=900.0)
    leaner = _cand("leaner", fuel=5.0, seconds=1100.0)
    kept = filter_dominated([faster, leaner])
    assert {c.name for c in kept} == {"faster", "leaner"}


def test_dominance_filter_keeps_ties():
    """Identical fuel+time: no strict edge, both kept."""
    kept = filter_dominated([_cand("a", 5.0, 1000.0), _cand("b", 5.0, 1000.0)])
    assert len(kept) == 2


def test_rerank_empty_fallback_is_illustrative():
    """Empty/None alternatives fall back to illustrative fixed scalings."""
    for alts in ([], None):
        candidates = rerank_from_alternatives(
            alts,  # type: ignore[arg-type]
            profile=XE_TAI_NHO_1T5,
            payload_kg=600.0,
            verified=True,  # even verified flag cannot invent routes
        )
        assert len(candidates) == 3
        for c in candidates:
            assert c.source == "illustrative"
            assert c.illustrative is True


def _fake_scorer_by_name(table: dict[str, tuple[float, float]]):
    """Fake scorer: name -> (fuel_litres, duration_seconds)."""

    def _score(alt: RouteAlternative) -> EnergyEstimate:
        fuel, seconds = table[alt.name]
        return EnergyEstimate(
            fuel_litres=fuel,
            duration_seconds=seconds,
            mechanical_energy_kwh=1.0,
            ttw_kg_co2=round(fuel * 2.68, 4),
            wtw_kg_co2=round(fuel * 3.24, 4),
            model_version="FAKE",
        )

    return _score


def test_rerank_verified_path_with_fake_alternatives():
    """Valhalla alternatives + verified baseline -> verified + dominance cut."""
    alts = [
        RouteAlternative(name="route-a", length_km=10.0, duration_seconds=1000.0),
        RouteAlternative(name="route-b", length_km=11.0, duration_seconds=1200.0),
        RouteAlternative(name="route-c", length_km=9.0, duration_seconds=1100.0),
    ]
    table = {
        "route-a": (5.0, 1000.0),  # non-dominated
        "route-b": (7.0, 1200.0),  # dominated by route-a -> cut
        "route-c": (4.0, 1100.0),  # leaner but slower -> kept (trade-off)
    }
    ranked = rerank_from_alternatives(
        alts, scorer=_fake_scorer_by_name(table), verified=True
    )
    assert {c.name for c in ranked} == {"route-a", "route-c"}
    for c in ranked:
        assert c.source == "verified"
        assert c.illustrative is False


def test_rerank_circuity_never_claims_verified():
    """Same alternatives on a circuity baseline stay illustrative."""
    alts = [
        RouteAlternative(name="route-a", length_km=10.0, duration_seconds=1000.0),
        RouteAlternative(name="route-c", length_km=9.0, duration_seconds=1100.0),
    ]
    table = {"route-a": (5.0, 1000.0), "route-c": (4.0, 1100.0)}
    ranked = rerank_from_alternatives(
        alts, scorer=_fake_scorer_by_name(table), verified=False
    )
    assert len(ranked) == 2
    for c in ranked:
        assert c.source == "illustrative"
        assert c.illustrative is True


def _sla_cands() -> list:
    return evaluate_pareto_policies(30.0, profile=XE_TAI_NHO_1T5, payload_kg=600.0)


def test_sla_epsilon_zero_within_fastest_tolerance():
    """§15.2 Eco SLA: epsilon=0 must not exceed fastest legal duration."""
    cands = _sla_cands()
    fastest, selected = select_policy_path(cands, "FASTEST_LEGAL")
    assert selected.policy == "FASTEST_LEGAL"
    assert selected.duration_seconds <= fastest.duration_seconds + 1e-6


def test_sla_epsilon_growth_never_shrinks_feasible_set():
    """§15.2 Eco SLA: increasing epsilon may expand, never reduce, the set."""
    cands = _sla_cands()
    fastest_time = min(c.duration_seconds for c in cands)
    counts = []
    for eps in (0.0, 5.0, 10.0, 50.0):
        feasible = [
            c
            for c in cands
            if c.duration_seconds <= fastest_time * (1.0 + eps / 100.0) + 1e-9
        ]
        counts.append(len(feasible))
    assert counts == sorted(counts)
    assert counts[0] >= 1


def test_sla_selection_min_fuel_within_budget():
    """Selected path is min-fuel within epsilon; unknown mode/custom noted."""
    from greenlogix_api.routing.pareto import EPSILON_PRESETS

    cands = _sla_cands()
    assert EPSILON_PRESETS == {"FASTEST_LEGAL": 0.0, "ECO_BALANCED": 5.0, "ECO_MAX": 10.0}
    fastest, selected = select_policy_path(cands, "ECO_BALANCED")
    eps = EPSILON_PRESETS["ECO_BALANCED"]
    assert selected.duration_seconds <= fastest.duration_seconds * (1.0 + eps / 100.0) + 1e-6
    feasible_fuel = min(
        c.fuel_litres
        for c in cands
        if c.duration_seconds <= fastest.duration_seconds * (1.0 + eps / 100.0) + 1e-6
    )
    assert selected.fuel_litres == feasible_fuel
    import pytest as _pytest

    with _pytest.raises(ValueError):
        select_policy_path(cands, "NO_SUCH_MODE")
    with _pytest.raises(ValueError):
        select_policy_path([], "ECO_BALANCED")
    _f2, s2 = select_policy_path(cands, "ECO_BALANCED", custom_epsilon_pct=0.0)
    assert s2.policy == "FASTEST_LEGAL"


def test_why_facts_from_structured_fields_only():
    """§16.2 why-facts carry deltas + policy + source; illustrative-labeled."""
    cands = _sla_cands()
    fastest, selected = select_policy_path(cands, "ECO_BALANCED")
    facts = why_facts(selected, fastest)
    assert len(facts) == 4
    assert facts[0].startswith(f"policy={selected.policy}")
    assert "savings=" in facts[1] and "fuel_delta_litres=" in facts[1]
    assert "time_delta_seconds=" in facts[2]
    assert "source=illustrative" in facts[3] and "not a certified saving" in facts[3]
    # Deterministic: same inputs -> same facts.
    assert why_facts(selected, fastest) == facts
