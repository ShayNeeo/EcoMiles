"""EcoPath Pareto candidate generation and multi-criteria trade-off evaluation.

Honesty note (T-LOOP-ENERGY): the three candidates below are ILLUSTRATIVE
scalings (fixed speed/grade/detour factors in code), NOT Valhalla-routed
Pareto dominance. Each PolicyCandidate carries ``illustrative=True`` until a
Valhalla rerank harness replaces the scalings. Do not claim road-graph
dominance from this output.

Honesty note (T-LOOP-PARETO2): ``rerank_from_alternatives`` scores caller
provided Valhalla alternative routes with hdt_v1 (``verified=True`` only
when the baseline is Valhalla/VERIFIED_GRAPH). Circuity baselines MUST stay
``source="illustrative"`` — never claim Valhalla dominance from circuity.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Literal

from greenlogix_api.energy.base import EnergyEstimate, EnergyModel
from greenlogix_api.energy.hdt_v1 import HdtEnergyModelV1
from greenlogix_api.geo.truck_profile import DEFAULT_TRUCK_PROFILE, TruckProfile

PolicyMode = Literal["FASTEST_LEGAL", "ECO_BALANCED", "ECO_MAX"]

CandidateSource = Literal["verified", "illustrative"]


@dataclass(frozen=True)
class PolicyCandidate:
    policy: str
    name: str
    length_km: float
    duration_seconds: float
    fuel_litres: float
    ttw_kg_co2: float
    time_penalty_pct: float
    fuel_savings_pct: float
    explanation: str
    confidence_tier: str = "C1_PHYSICS"
    # Illustrative-scaling flag (T-LOOP-ENERGY): True until Valhalla rerank
    # replaces the fixed speed/grade/detour factors. Consumers MUST surface
    # this flag and MUST NOT claim road-graph Pareto dominance while True.
    illustrative: bool = True
    # Source label (T-LOOP-PARETO2): "verified" only for Valhalla-routed
    # alternatives scored with hdt_v1 under VERIFIED_GRAPH; everything else
    # (circuity fallback, fixed scalings) is "illustrative".
    source: CandidateSource = "illustrative"

    def __post_init__(self) -> None:
        # Keep the legacy flag consistent with the authoritative source label.
        object.__setattr__(self, "illustrative", self.source != "verified")


@dataclass(frozen=True)
class RouteAlternative:
    """One Valhalla (or fallback) route alternative awaiting hdt_v1 scoring."""

    name: str
    length_km: float
    duration_seconds: float
    speed_kmh: float = 32.0
    grade_percent: float = 0.0


# Scorer glue (T-LOOP-PARETO2): maps one alternative to an hdt_v1 estimate.
# hdt_v1.py itself is read-only; this callable lives here so callers (and
# tests) can inject a fake scorer without touching the physics model.
AlternativeScorer = Callable[[RouteAlternative], EnergyEstimate]


def hdt_alternative_scorer(
    profile: TruckProfile = DEFAULT_TRUCK_PROFILE,
    payload_kg: float = 500.0,
    energy_model: EnergyModel | None = None,
) -> AlternativeScorer:
    """Build the default hdt_v1 scorer for Valhalla alternatives."""
    model = energy_model or HdtEnergyModelV1()

    def _score(alt: RouteAlternative) -> EnergyEstimate:
        return model.estimate_segment_energy(
            length_km=alt.length_km,
            profile=profile,
            payload_kg=payload_kg,
            speed_kmh=alt.speed_kmh,
            grade_percent=alt.grade_percent,
        )

    return _score


def filter_dominated(candidates: Sequence[PolicyCandidate]) -> list[PolicyCandidate]:
    """Drop candidates dominated on BOTH fuel and time.

    A dominates B when A.fuel <= B.fuel AND A.duration <= B.duration with at
    least one strict inequality. Trade-off pairs (one faster, one leaner)
    are both kept. Ties on both axes are kept (no strict edge).
    """
    kept: list[PolicyCandidate] = []
    for cand in candidates:
        dominated = any(
            other is not cand
            and other.fuel_litres <= cand.fuel_litres
            and other.duration_seconds <= cand.duration_seconds
            and (
                other.fuel_litres < cand.fuel_litres
                or other.duration_seconds < cand.duration_seconds
            )
            for other in candidates
        )
        if not dominated:
            kept.append(cand)
    return kept


def rerank_from_alternatives(
    alternatives: Sequence[RouteAlternative] | None,
    scorer: AlternativeScorer | None = None,
    *,
    profile: TruckProfile = DEFAULT_TRUCK_PROFILE,
    payload_kg: float = 500.0,
    energy_model: EnergyModel | None = None,
    verified: bool = False,
    base_km_fallback: float = 30.0,
) -> list[PolicyCandidate]:
    """Rerank caller-provided alternatives via hdt_v1 scoring + dominance filter.

    Honest Stage-1 rerank (T-LOOP-PARETO2): pass Valhalla alternatives with
    ``verified=True`` (baseline is Valhalla/VERIFIED_GRAPH) to get
    ``source="verified"`` candidates. Empty/None alternatives fall back to
    the illustrative fixed scalings. ``verified=False`` (circuity fallback)
    always yields ``source="illustrative"`` — never claim Valhalla dominance
    from circuity output.
    """
    if not alternatives:
        return evaluate_pareto_policies(
            base_km=base_km_fallback,
            profile=profile,
            payload_kg=payload_kg,
            energy_model=energy_model,
        )

    score = scorer or hdt_alternative_scorer(
        profile=profile, payload_kg=payload_kg, energy_model=energy_model
    )
    source: CandidateSource = "verified" if verified else "illustrative"

    scored: list[PolicyCandidate] = []
    for idx, alt in enumerate(alternatives):
        est = score(alt)
        scored.append(
            PolicyCandidate(
                policy=f"ALT_{idx}",
                name=alt.name,
                length_km=round(alt.length_km, 2),
                duration_seconds=est.duration_seconds or alt.duration_seconds,
                fuel_litres=est.fuel_litres,
                ttw_kg_co2=est.ttw_kg_co2,
                time_penalty_pct=0.0,
                fuel_savings_pct=0.0,
                explanation=(
                    "Valhalla alternative rescored with GLX-HDT-v1 physics."
                    if verified
                    else "Alternative scored with GLX-HDT-v1 physics on a "
                    "non-verified (circuity) baseline; illustrative only."
                ),
                confidence_tier="C1_PHYSICS",
                illustrative=(not verified),
                source=source,
            )
        )

    pareto = filter_dominated(scored)
    # Deterministic order: leanest fuel first, then fastest.
    pareto.sort(key=lambda c: (c.fuel_litres, c.duration_seconds))

    fastest_fuel = max(c.fuel_litres for c in pareto)
    fastest_time = min(c.duration_seconds for c in pareto)
    relabeled: list[PolicyCandidate] = []
    for cand in pareto:
        fuel_saved = (
            max(0.0, round((1.0 - (cand.fuel_litres / fastest_fuel)) * 100.0, 1))
            if fastest_fuel > 0
            else 0.0
        )
        time_pen = (
            max(0.0, round(((cand.duration_seconds / fastest_time) - 1.0) * 100.0, 1))
            if fastest_time > 0
            else 0.0
        )
        relabeled.append(
            PolicyCandidate(
                policy=cand.policy,
                name=cand.name,
                length_km=cand.length_km,
                duration_seconds=cand.duration_seconds,
                fuel_litres=cand.fuel_litres,
                ttw_kg_co2=cand.ttw_kg_co2,
                time_penalty_pct=time_pen,
                fuel_savings_pct=fuel_saved,
                explanation=cand.explanation,
                confidence_tier=cand.confidence_tier,
                illustrative=cand.illustrative,
                source=cand.source,
            )
        )
    return relabeled


def evaluate_pareto_policies(
    base_km: float,
    profile: TruckProfile = DEFAULT_TRUCK_PROFILE,
    payload_kg: float = 500.0,
    energy_model: EnergyModel | None = None,
) -> list[PolicyCandidate]:
    """Generate the 3 Pareto policy candidates for a truck dispatch."""
    model = energy_model or HdtEnergyModelV1()

    # 1. Fastest Legal (Baseline speed ~35 km/h)
    fastest_est = model.estimate_segment_energy(
        length_km=base_km,
        profile=profile,
        payload_kg=payload_kg,
        speed_kmh=35.0,
        grade_percent=1.2,
    )
    fastest = PolicyCandidate(
        policy="FASTEST_LEGAL",
        name="Nhanh nhất (Fastest Legal)",
        length_km=round(base_km, 2),
        duration_seconds=fastest_est.duration_seconds,
        fuel_litres=fastest_est.fuel_litres,
        ttw_kg_co2=fastest_est.ttw_kg_co2,
        time_penalty_pct=0.0,
        fuel_savings_pct=0.0,
        explanation="Tuyến đường nhanh nhất tuân thủ chiều cao/tải trọng xe tải; ưu tiên các trục lộ thông thoáng.",
        confidence_tier="C1_PHYSICS",
        illustrative=True,
    )

    # 2. Eco Balanced (+4% time, -10% fuel via speed smoothing & grade detour)
    eco_b_km = base_km * 0.98
    eco_b_est = model.estimate_segment_energy(
        length_km=eco_b_km,
        profile=profile,
        payload_kg=payload_kg,
        speed_kmh=33.6,
        grade_percent=0.4,
    )
    fuel_saved_b = max(0.0, round((1.0 - (eco_b_est.fuel_litres / fastest.fuel_litres)) * 100.0, 1))
    time_pen_b = max(0.0, round(((eco_b_est.duration_seconds / fastest.duration_seconds) - 1.0) * 100.0, 1))

    balanced = PolicyCandidate(
        policy="ECO_BALANCED",
        name="Cân bằng Xanh (Eco Balanced)",
        length_km=round(eco_b_km, 2),
        duration_seconds=eco_b_est.duration_seconds,
        fuel_litres=eco_b_est.fuel_litres,
        ttw_kg_co2=eco_b_est.ttw_kg_co2,
        time_penalty_pct=time_pen_b,
        fuel_savings_pct=fuel_saved_b,
        explanation="Tiết kiệm nhiên liệu trong giới hạn +5% SLA; điều phối giảm tải trước đoạn dốc và giảm dừng chờ giao lộ.",
        confidence_tier="C1_PHYSICS",
        illustrative=True,
    )

    # 3. Eco Max (+9% time, -16% fuel via maximum eco-cruising)
    eco_m_km = base_km * 0.96
    eco_m_est = model.estimate_segment_energy(
        length_km=eco_m_km,
        profile=profile,
        payload_kg=payload_kg,
        speed_kmh=32.2,
        grade_percent=0.2,
    )
    fuel_saved_m = max(0.0, round((1.0 - (eco_m_est.fuel_litres / fastest.fuel_litres)) * 100.0, 1))
    time_pen_m = max(0.0, round(((eco_m_est.duration_seconds / fastest.duration_seconds) - 1.0) * 100.0, 1))

    eco_max = PolicyCandidate(
        policy="ECO_MAX",
        name="Tối đa Xanh (Eco Max)",
        length_km=round(eco_m_km, 2),
        duration_seconds=eco_m_est.duration_seconds,
        fuel_litres=eco_m_est.fuel_litres,
        ttw_kg_co2=eco_m_est.ttw_kg_co2,
        time_penalty_pct=time_pen_m,
        fuel_savings_pct=fuel_saved_m,
        explanation="Tối đa hóa mức giảm phát thải trong giới hạn +10% SLA; duy trì dải vòng tua động cơ kinh tế nhất.",
        confidence_tier="C1_PHYSICS",
        illustrative=True,
    )

    return [fastest, balanced, eco_max]


# Epsilon-SLA policy selection (CR-10 Stage-1 code slice, §8.2 + §16.1).
#
# Product presets expose epsilon (max acceptable time penalty vs fastest
# legal) instead of a hidden unit-mixing weight. Selection is SLA-safe by
# construction: filter to candidates within epsilon, then pick min fuel.
# Deterministic tie-break: lowest fuel, then fastest, then policy name.
# epsilon=0 always admits the fastest candidate itself, so it can never
# exceed fastest duration (+ floating tolerance).
EPSILON_PRESETS: dict[str, float] = {
    "FASTEST_LEGAL": 0.0,
    "ECO_BALANCED": 5.0,
    "ECO_MAX": 10.0,
}

_EPS_TOL_PCT = 1e-6


def select_policy_path(
    candidates: Sequence[PolicyCandidate],
    mode: str = "ECO_BALANCED",
    *,
    custom_epsilon_pct: float | None = None,
) -> tuple[PolicyCandidate, PolicyCandidate]:
    """Return (fastest, selected) under the epsilon SLA budget.

    fastest = min duration (tie: min fuel, then policy name). feasible =
    candidates with time_penalty vs fastest <= epsilon. selected = min
    fuel within feasible (tie: fastest, then policy name). epsilon from
    EPSILON_PRESETS[mode] or custom_epsilon_pct override. Raises
    ValueError on empty candidates or unknown mode (without override).
    """
    if not candidates:
        raise ValueError("no candidates to select from")
    key = (mode or "").strip().upper()
    if custom_epsilon_pct is not None:
        epsilon = float(custom_epsilon_pct)
    elif key in EPSILON_PRESETS:
        epsilon = EPSILON_PRESETS[key]
    else:
        raise ValueError(f"unknown policy mode: {mode}")
    if epsilon < 0:
        raise ValueError("epsilon must be >= 0")

    ordered = sorted(candidates, key=lambda c: (c.duration_seconds, c.fuel_litres, c.policy))
    fastest = ordered[0]
    base_time = fastest.duration_seconds
    feasible = [
        c
        for c in candidates
        if c.duration_seconds <= base_time * (1.0 + (epsilon + _EPS_TOL_PCT) / 100.0)
    ]
    # epsilon >= 0 always admits fastest itself; guard anyway.
    if not feasible:
        feasible = [fastest]
    selected = min(feasible, key=lambda c: (c.fuel_litres, c.duration_seconds, c.policy))
    return fastest, selected


def why_facts(
    selected: PolicyCandidate,
    fastest: PolicyCandidate,
) -> list[str]:
    """Build structured route-policy facts for §16.2 "Why this route?" UI.

    Facts derive ONLY from candidate numeric fields + policy/source labels —
    no LLM, no invented reasons. Each fact is a short stable string the UI
    renders as Route Policy Cards (§16.1) with deltas vs fastest legal.
    """
    fuel_delta = round(selected.fuel_litres - fastest.fuel_litres, 4)
    time_delta_s = round(selected.duration_seconds - fastest.duration_seconds)
    facts = [
        (f"policy={selected.policy} within epsilon SLA "
        f"(time_penalty={selected.time_penalty_pct}%)"),
        (f"fuel_delta_litres={fuel_delta} "
        f"(savings={selected.fuel_savings_pct}% vs fastest legal)"),
        (f"time_delta_seconds={time_delta_s} "
        f"(fastest={round(fastest.duration_seconds)}s)"),
        (f"source={selected.source} confidence={selected.confidence_tier} "
        f"— illustrative estimate until Valhalla rerank, not a certified saving"),
    ]
    if selected.policy == fastest.policy:
        facts.append("selected_is_fastest=true — eco budget admits no leaner path")
    return facts
