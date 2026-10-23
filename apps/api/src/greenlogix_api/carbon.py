"""TTW kg CO₂ from in-repo emission_factors.json (D-09, RPT-01)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from greenlogix_api import db as dbmod
from greenlogix_api.schemas import ReportDelta, ReportOut, ReportTotals, TotalsOut

_cache: dict[str, Any] | None = None

# T-LOOP-EVIDENCE (CR-15 PARTIAL): honest audit/confidence fields carried in
# the report ``extra`` dict (code-level only, no schema/OpenAPI change).
# Wording contract: every ISO/GLEC mention carries "not certified".
EVIDENCE_MODEL_VERSION = "GLX-HDT-v1.0"
EVIDENCE_CONFIDENCE = "C1-illustrative"
EVIDENCE_ISO_NOTE = "TTW estimate per GLEC-aligned factors, not certified"


def evidence_audit_extra() -> dict[str, object]:
    """Additive evidence payload for the audit drawer (CR-15).

    Keys: ``model_version`` (GLX-HDT-v1.0, matches
    ``geo/road_graph.cost_model_version`` + ``energy/hdt_v1`` version_name),
    ``confidence`` (current release ``C1-illustrative``; full C0-C4 ladder in
    ``docs/research/evidence_ui.md``), ``iso_note`` (exact honest wording —
    TTW estimate per GLEC-aligned factors, not certified).
    """
    return {
        "model_version": EVIDENCE_MODEL_VERSION,
        "confidence": EVIDENCE_CONFIDENCE,
        "iso_note": EVIDENCE_ISO_NOTE,
    }


def load_factors(path: Path | None = None) -> dict[str, Any]:
    global _cache
    target = path or dbmod.FACTORS_PATH
    if _cache is not None and path is None:
        return _cache
    data = json.loads(target.read_text(encoding="utf-8"))
    if path is None:
        _cache = data
    return data


def kg_co2_per_litre(fuel: str, path: Path | None = None) -> float:
    data = load_factors(path)
    key = (fuel or "").strip().lower()
    fuels = data.get("fuels") or {}
    for name, spec in fuels.items():
        aliases = [str(name).lower()]
        aliases.extend(str(a).lower() for a in (spec.get("aliases") or []))
        if key in aliases:
            return float(spec["kg_co2_per_litre"])
    raise ValueError(f"unknown fuel {fuel!r}")


def wtw_kg_co2_per_litre(fuel: str, path: Path | None = None) -> float | None:
    data = load_factors(path)
    key = (fuel or "").strip().lower()
    fuels = data.get("fuels") or {}
    for name, spec in fuels.items():
        aliases = [str(name).lower()]
        aliases.extend(str(a).lower() for a in (spec.get("aliases") or []))
        if key in aliases:
            factor = spec.get("wtw_kg_co2_per_litre")
            return float(factor) if factor is not None else None
    return None

def litres_used(km: float, l_per_100km: float) -> float:
    return km * (l_per_100km / 100.0)


def factor_citation_year(path: Path | None = None) -> int | None:
    """Publication year the factor set cites for itself (C-04).

    Read out of the ``source`` strings in ``emission_factors.json`` rather than
    hard-coded — today the first year named is IPCC 2006 Vol.2, the origin of
    the TTW kg CO₂/litre values. ``None`` when the file names no year, so a
    report prints "n/a" instead of inventing a vintage.
    """
    fuels = load_factors(path).get("fuels") or {}
    for spec in fuels.values():
        match = re.search(r"\b(?:19|20)\d{2}\b", str(spec.get("source") or ""))
        if match:
            return int(match.group(0))
    return None


def kg_co2(km: float, l_per_100km: float, fuel: str, path: Path | None = None) -> float:
    return litres_used(km, l_per_100km) * kg_co2_per_litre(fuel, path)


def totals_from_legs(
    km: float, l_per_100km: float, fuel: str, path: Path | None = None
) -> TotalsOut:
    liq = litres_used(km, l_per_100km)
    return TotalsOut(km=km, litres=liq, kg_co2=liq * kg_co2_per_litre(fuel, path))


def save_report(
    baseline: TotalsOut,
    optimized: TotalsOut,
    path: Path | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    target = path or dbmod.REPORT_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "baseline": baseline.model_dump(),
        "optimized": optimized.model_dump(),
    }
    if extra:
        payload.update(extra)
    # T-LOOP-MANIFEST: persist 7 road-graph manifest keys additively so every
    # report carries model/data versions. Caller values win (setdefault); a
    # missing/unreadable manifest never fails the report write.
    try:
        from greenlogix_api.geo.road_graph import road_graph_audit_extra

        for _k, _v in road_graph_audit_extra().items():
            payload.setdefault(_k, _v)
    except Exception:  # noqa: S110
        pass
    # T-LOOP-EVIDENCE: honest confidence/ISO wording, additively.
    # Caller values win (setdefault); never fails the report write.
    for _k, _v in evidence_audit_extra().items():
        payload.setdefault(_k, _v)
    # C-05: optimizer + pareto_source audit labels, additively.
    # Caller values win (setdefault); never fails the report write.
    # pareto_source stays "illustrative" (circuity/Valhalla-unwired); verified
    # path lives library-level in routing/pareto.rerank_from_alternatives.
    try:
        from greenlogix_api.solver.flags import optimizer_name_for_audit

        for _k, _v in {
            "optimizer": optimizer_name_for_audit(),
            "pareto_source": "illustrative",
        }.items():
            payload.setdefault(_k, _v)
    except Exception:
        payload.setdefault("pareto_source", "illustrative")
    target.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def load_report(path: Path | None = None) -> ReportOut | None:
    target = path or dbmod.REPORT_PATH
    if not target.is_file():
        return None
    raw = json.loads(target.read_text(encoding="utf-8"))
    baseline = ReportTotals(**raw["baseline"])
    optimized = ReportTotals(**raw["optimized"])
    return ReportOut(
        baseline=baseline,
        optimized=optimized,
        delta=delta_from_totals(baseline, optimized),
        distance_provider=str(raw.get("distance_provider") or "circuity"),
        routing_quality=str(raw.get("routing_quality") or "DEGRADED"),
        eco_weight=float(raw.get("eco_weight") or 0.0),
    )


def delta_from_totals(baseline: ReportTotals, optimized: ReportTotals) -> ReportDelta:
    """delta.km = optimized.km - baseline.km (negative when the plan is shorter)."""
    dkm = optimized.km - baseline.km
    dlit = optimized.litres - baseline.litres
    dco2 = optimized.kg_co2 - baseline.kg_co2
    km_pct = (dkm / baseline.km * 100.0) if baseline.km else 0.0
    litres_pct = (dlit / baseline.litres * 100.0) if baseline.litres else 0.0
    kg_co2_pct = (dco2 / baseline.kg_co2 * 100.0) if baseline.kg_co2 else 0.0
    return ReportDelta(
        km=dkm,
        litres=dlit,
        kg_co2=dco2,
        km_pct=km_pct,
        litres_pct=litres_pct,
        kg_co2_pct=kg_co2_pct,
    )
