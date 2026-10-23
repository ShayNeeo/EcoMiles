"""Minimal reference-solver benchmark harness (CR-11, T-LOOP-HARNESS).

Compares deterministic in-repo reference solvers on the same instance and
emits a results table with rows keyed exactly:
``solver | feasible | objective | gap | runtime_ms | seed``.

``gap`` is measured vs the best feasible reference in the table
(best-of-refs), NOT vs any proven optimum — no optimality claims are made.
Same ``seed`` always yields the same table (solvers deterministic, rows
sorted by solver name at collection and by (objective, solver) at output).
"""

from __future__ import annotations

import time
from collections.abc import Callable, Mapping, Sequence
from typing import Any

from greenlogix_api.benchmark.solvers_ref import REF_SOLVERS
from greenlogix_api.models import Order, Vehicle
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG

SolverFn = Callable[..., Any]

REQUIRED_COLS = ("solver", "feasible", "objective", "gap", "runtime_ms", "seed")

DEFAULT_DEPOT: tuple[float, float] = (DEPOT_LAT, DEPOT_LNG)


def _call_solver(
    fn: SolverFn,
    orders: Sequence[Order],
    vehicles: Sequence[Vehicle],
    depot: tuple[float, float],
    seed: int,
) -> tuple[float, bool]:
    try:
        out = fn(list(orders), list(vehicles), depot, seed)
    except TypeError:
        out = fn(list(orders), list(vehicles), depot)
    if isinstance(out, Mapping):
        return float(out["objective"]), bool(out["feasible"])
    objective, feasible = out  # tuple-style (objective, feasible)
    return float(objective), bool(feasible)


def run_comparison(
    orders: Sequence[Order],
    vehicles: Sequence[Vehicle],
    solvers: Mapping[str, SolverFn] | None = None,
    depot: tuple[float, float] = DEFAULT_DEPOT,
    seed: int = 0,
) -> list[dict[str, Any]]:
    """Run each solver once and return the comparison table.

    Args:
        orders: orders of the benchmark instance.
        vehicles: fleet of the benchmark instance.
        solvers: name -> solver fn mapping. Defaults to :data:`REF_SOLVERS`.
        depot: (lat, lng) depot point shared by all solvers.
        seed: recorded on every row; re-running with the same seed
            reproduces the same table.

    Returns:
        Rows with keys exactly ``solver, feasible, objective, gap,
        runtime_ms, seed`` sorted by ``(objective, solver)``. ``gap`` is
        ``(objective - best) / best`` vs the best *feasible* reference
        (``0.0`` for the best row itself); ``None`` for infeasible rows,
        or when no feasible row / best objective is ``<= 0``.
    """
    table: Mapping[str, SolverFn] = solvers or REF_SOLVERS
    rows: list[dict[str, Any]] = []
    for name in sorted(table):
        started = time.perf_counter()
        objective, feasible = _call_solver(table[name], orders, vehicles, depot, seed)
        runtime_ms = (time.perf_counter() - started) * 1000.0
        rows.append(
            {
                "solver": name,
                "feasible": feasible,
                "objective": objective,
                "gap": None,
                "runtime_ms": runtime_ms,
                "seed": seed,
            }
        )
    feasible_objs = [r["objective"] for r in rows if r["feasible"]]
    best = min(feasible_objs) if feasible_objs else None
    for row in rows:
        if row["feasible"] and best is not None and best > 0:
            row["gap"] = (row["objective"] - best) / best
        else:
            row["gap"] = 0.0 if (row["feasible"] and best == row["objective"]) else None
            if row["feasible"] and (best is None or best <= 0) and row["objective"] == 0:
                row["gap"] = 0.0
    rows.sort(key=lambda r: (r["objective"], r["solver"]))
    return rows
