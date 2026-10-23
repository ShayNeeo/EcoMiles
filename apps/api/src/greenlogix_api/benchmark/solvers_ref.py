"""Reference solvers for the benchmark harness (CR-11, T-LOOP-HARNESS).

Wraps in-repo heuristics only — no new dependencies, no PyVRP/OR-Tools.
Both solvers are deterministic; ``seed`` is accepted and recorded so the
harness table is reproducible, but the heuristics themselves use no RNG
(NN tie-break is by window_start, then input order).
"""

from __future__ import annotations

from greenlogix_api.models import Order, Vehicle
from greenlogix_api.solver.baseline import baseline_fill
from greenlogix_api.solver.distance import road_km
from greenlogix_api.solver.nn_two_opt import tour_km


def solve_nn_two_opt(
    orders: list[Order],
    vehicles: list[Vehicle],
    depot: tuple[float, float],
    seed: int = 0,
) -> dict[str, object]:
    """Reference A: full cluster -> NN+2-opt pipeline (deterministic)."""
    from greenlogix_api.solver import run_vrp

    _ = seed  # recorded by harness; heuristic itself is deterministic
    result = run_vrp(
        orders,
        vehicles,
        depot=depot,
        depot_name="benchmark",
        pair_km=road_km,
        eco_weight=0.0,
    )
    feasible = not result.unassigned_ids and not any(r.overload for r in result.routes)
    return {"objective": float(result.totals.km), "feasible": bool(feasible)}


def solve_baseline_greedy(
    orders: list[Order],
    vehicles: list[Vehicle],
    depot: tuple[float, float],
    seed: int = 0,
) -> dict[str, object]:
    """Reference B: spreadsheet-order greedy fill, unsequenced tour km."""
    _ = seed  # recorded by harness; heuristic itself is deterministic
    assigned = baseline_fill(orders, vehicles)
    total = sum(tour_km(load, depot, pair_km=road_km) for _, load in assigned)
    assigned_ids = {o.id for _, load in assigned for o in load if o.id is not None}
    all_ids = {o.id for o in orders if o.id is not None}
    feasible = bool(all_ids) and assigned_ids >= all_ids
    return {"objective": float(total), "feasible": bool(feasible)}



def solve_eco_alns(
    orders: list[Order],
    vehicles: list[Vehicle],
    depot: tuple[float, float],
    seed: int = 0,
) -> dict[str, object]:
    """Reference C: EcoALNS heuristic."""
    from greenlogix_api.solver import run_vrp

    _ = seed
    result = run_vrp(
        orders,
        vehicles,
        depot=depot,
        depot_name="benchmark",
        pair_km=road_km,
        eco_weight=0.0,
        optimizer="ecoalns",
    )
    feasible = not result.unassigned_ids and not any(r.overload for r in result.routes)
    return {"objective": float(result.totals.km), "feasible": bool(feasible)}

REF_SOLVERS = {
    "refA_nn_two_opt": solve_nn_two_opt,
    "refB_baseline_greedy": solve_baseline_greedy,
}
