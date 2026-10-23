"""DIMACS-style per-instance scoring and leaderboard (C-05).

Mirrors the DIMACS VRPTW challenge reporting convention: a solver run is
reported as a triple *(feasible, objective = total route cost, wall clock)*.
An infeasible run ranks after every feasible run and carries neither objective
nor gap. Scores are computed **per instance** — never aggregated into a single
cross-instance number, because instance cost scales are not comparable — and
the output is a stable, sorted list of plain dicts so it can be rendered as a
leaderboard table or dumped straight to JSON/CSV.

``gap`` follows the runner's contract: measured against the instance's
``best_known`` when one was supplied, otherwise against **best-of-refs** (best
feasible objective of the rows being scored); ``None`` when infeasible or when
no reference exists; clamped at ``0.0`` so it is never negative (see
:mod:`greenlogix_api.benchmark.runner` — beating a published best-known means a
convention or instance mismatch, not an improvement). ``score_rows`` always
**recomputes** the gap from the objective against the active reference, so a
``best_known`` override can never inherit a stale best-of-refs number from the
runner's row; ``beats_reference`` marks the clamped case. Gap is never described
as optimality.

Sorting is total and deterministic: feasible first, then lowest objective, then
fastest wall clock, then solver name — so the same input always yields the same
table and rank numbers are stable.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from greenlogix_api.benchmark.runner import BenchmarkResult

STATUS_FEASIBLE = "feasible"
STATUS_INFEASIBLE = "infeasible"

SCORE_COLS = (
    "rank",
    "instance",
    "solver",
    "feasible",
    "status",
    "objective",
    "gap",
    "beats_reference",
    "runtime_ms",
    "reference",
)

def score_rows(
    rows: Sequence[Mapping[str, Any]],
    *,
    instance: str = "",
    best_known: float | None = None,
) -> list[dict[str, Any]]:
    """Score one instance's runner rows into a sorted leaderboard.

    Gap is **always recomputed** from the objective against the active
    reference (``best_known`` override when given, else best-of-refs) — the
    runner's stored best-of-refs ``gap`` is only a fallback for rows without an
    objective, because keeping it would label a row ``best_known`` while
    carrying a best-of-refs number. ``beats_reference`` records the case where
    the objective is below the reference: the gap is clamped to ``0.0`` (never
    negative — beating a published best-known means a convention or instance
    mismatch, not an improvement) and the flag names what happened. A missing
    objective on an infeasible row leaves its gap ``None``. No row is ever
    described as optimal.
    """
    feasible_objs = [
        float(row["objective"])
        for row in rows
        if row.get("feasible") and row.get("objective") is not None
    ]
    if best_known is not None:
        reference, reference_kind = float(best_known), "best_known"
    elif feasible_objs:
        reference, reference_kind = min(feasible_objs), "best_of_refs"
    else:
        reference, reference_kind = None, "none"

    scored: list[dict[str, Any]] = []
    has_reference = reference is not None and reference > 0
    for row in rows:
        feasible = bool(row.get("feasible"))
        objective = row.get("objective")
        beats_reference = False
        if not feasible:
            gap = None
        elif objective is not None and has_reference:
            raw = (float(objective) - reference) / reference
            beats_reference = raw < 0
            gap = max(0.0, raw)
        else:
            fallback = row.get("gap")
            gap = max(0.0, float(fallback)) if fallback is not None else None
        scored.append(
            {
                "rank": 0,
                "instance": instance,
                "solver": str(row.get("solver", "")),
                "feasible": feasible,
                "status": STATUS_FEASIBLE if feasible else STATUS_INFEASIBLE,
                "objective": float(objective) if objective is not None else None,
                "gap": gap,
                "beats_reference": beats_reference,
                "runtime_ms": float(row.get("runtime_ms") or 0.0),
                "reference": reference_kind,
            }
        )

    scored.sort(
        key=lambda r: (
            not r["feasible"],
            r["objective"] if r["objective"] is not None else float("inf"),
            r["runtime_ms"],
            r["solver"],
        )
    )
    for position, row in enumerate(scored, start=1):
        row["rank"] = position
    return scored

def score_result(result: BenchmarkResult, best_known: float | None = None) -> list[dict[str, Any]]:
    """Score a :class:`BenchmarkResult` (its summary fills instance + best_known)."""
    known = best_known if best_known is not None else result.summary.get("best_known")
    return score_rows(result.to_rows(), instance=result.instance, best_known=known)

def leaderboard(
    results: BenchmarkResult | Sequence[BenchmarkResult],
    *,
    best_known: Mapping[str, float] | None = None,
) -> list[dict[str, Any]]:
    """Score several instances; ranks restart per instance.

    ``best_known`` optionally overrides the per-instance reference by instance
    name (useful when the value comes from a published table rather than the
    file's ``COMMENT``).
    """
    batch = [results] if isinstance(results, BenchmarkResult) else list(results)
    table: list[dict[str, Any]] = []
    for result in batch:
        known = (best_known or {}).get(result.instance)
        table.extend(score_result(result, known))
    return table

def format_table(rows: Sequence[Mapping[str, Any]]) -> str:
    """Render scored rows as a fixed-width text table (headers from SCORE_COLS)."""
    def cell(value: Any) -> str:
        if value is None or value == "":
            return "-"
        if isinstance(value, bool):
            return "yes" if value else "no"
        if isinstance(value, float):
            return f"{value:.3f}"
        return str(value)

    body = [[cell(row.get(col)) for col in SCORE_COLS] for row in rows]
    widths = [
        max(len(col), *(len(line[idx]) for line in body)) if body else len(col)
        for idx, col in enumerate(SCORE_COLS)
    ]
    lines = [
        "  ".join(col.ljust(widths[idx]) for idx, col in enumerate(SCORE_COLS)),
        "  ".join("-" * width for width in widths),
    ]
    lines.extend(
        "  ".join(value.ljust(widths[idx]) for idx, value in enumerate(line)) for line in body
    )
    return "\n".join(lines)
