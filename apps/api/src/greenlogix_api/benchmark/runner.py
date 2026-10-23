"""Repeat-run benchmark runner for the C-05 instance formats.

Runs a mapping of ``name -> solver`` over one :class:`Instance` for ``repeats``
(default 3) executions each and returns one row per solver with the runtime
distribution and objective spread across repeats plus a per-instance
``summary``:

``solver | feasible | objective | objective_min | objective_max |
objective_cv | gap | runtime_ms | runtime_p50_ms | runtime_p95_ms |
runtime_min_ms | runtime_max_ms | feasible_repeats | seed | runtime_cv``

Gap — the honest definition
---------------------------
``gap`` is **never** called optimal. It is measured against the instance's
``best_known`` when the file (or caller) supplied one, otherwise against
**best-of-refs** — the best feasible objective among the solvers in this very
table. A published best-known value is an externally reported number, not a
proven optimum for our model, and best-of-refs is by construction only the best
of the solvers we ran. ``gap`` is ``None`` whenever there is no reference (no
feasible row, reference ``<= 0``) or the row is infeasible, and it is clamped to
``0.0`` — a negative gap would mean the solver beat the published best-known,
which indicates a different instance, cost convention or a bug rather than an
improvement (``summary["beats_best_known"]`` flags that case instead of hiding
it in a negative number).

Repeats and seeds
-----------------
Repeat ``r`` calls ``solver(instance, seed + r)`` — a stochastic solver really
varies across repeats (making ``runtime_cv`` meaningful), while a deterministic
one yields identical objectives; either way the table is reproducible because
the repeat index is scripted. ``seed`` on the row is the base seed.

Column definitions
------------------
``feasible`` = *every* repeat produced a feasible plan; ``feasible_repeats`` =
how many did, so a solver that is feasible on some repeats and not others shows
up as ``feasible=False`` with ``0 < feasible_repeats < repeats`` and is listed
in ``summary["mixed_feasibility_solvers"]`` instead of being silently marked
infeasible. ``objective``/``objective_min``/``objective_max`` bound the objective
over the **feasible repeats only** — an infeasible repeat is a rejected plan, so
its cost is not an objective and never sets one; when no repeat is feasible the
objective is ``None`` rather than a number that claims nothing.
``objective_cv`` = population standard deviation ÷ mean of the feasible-repeat
objectives (``None`` for fewer than two feasible repeats or a zero mean).
``runtime_ms`` = mean wall clock per repeat; ``runtime_p50_ms``/
``runtime_p95_ms``/``runtime_min_ms``/``runtime_max_ms`` = percentiles/limits of
the per-repeat wall clocks (linear interpolation, the numpy ``linear`` method);
``runtime_cv`` = population standard deviation ÷ mean (``None`` for a single
repeat or a zero mean).

Distance metric is Euclidean via :meth:`Instance.dist` (``nint`` for CVRPLIB) —
never haversine; see :mod:`greenlogix_api.benchmark.instances`.

The solver protocol is ``fn(instance, seed) -> {"objective": float, "feasible":
bool}`` (a ``(objective, feasible)`` tuple is also accepted). A solver raising an
exception is not swallowed — the run fails, since a crashed solver produces no
row.
"""

from __future__ import annotations

import csv
import json
import math
import statistics
import time
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from greenlogix_api.benchmark.instances import Instance

SolverFn = Callable[..., Any]
Clock = Callable[[], float]

DEFAULT_REPEATS = 3

ROW_COLS = (
    "solver",
    "feasible",
    "objective",
    "objective_min",
    "objective_max",
    "objective_cv",
    "gap",
    "runtime_ms",
    "runtime_p50_ms",
    "runtime_p95_ms",
    "runtime_min_ms",
    "runtime_max_ms",
    "feasible_repeats",
    "seed",
    "runtime_cv",
)

@dataclass(frozen=True)
class BenchmarkResult:
    """Rows for one instance plus its per-instance summary."""

    instance: str
    rows: tuple[dict[str, Any], ...]
    summary: dict[str, Any]

    def to_rows(self) -> list[dict[str, Any]]:
        return [dict(row) for row in self.rows]

def _percentile(values: Sequence[float], q: float) -> float:
    """Percentile with linear interpolation (numpy default ``linear`` method)."""
    xs = sorted(values)
    if not xs:
        return 0.0
    if len(xs) == 1:
        return xs[0]
    position = (len(xs) - 1) * q / 100.0
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return xs[int(position)]
    return xs[lower] + (xs[upper] - xs[lower]) * (position - lower)

def _call_solver(fn: SolverFn, instance: Instance, seed: int) -> tuple[float, bool]:
    out = fn(instance, seed)
    if isinstance(out, Mapping):
        return float(out["objective"]), bool(out["feasible"])
    objective, feasible = out
    return float(objective), bool(feasible)

def run_benchmark(
    instance: Instance,
    solvers: Mapping[str, SolverFn],
    *,
    repeats: int = DEFAULT_REPEATS,
    seed: int = 0,
    clock: Clock = time.perf_counter,
) -> BenchmarkResult:
    """Run every solver on ``instance`` ``repeats`` times and build the table.

    ``clock`` is a monotonic seconds source; inject a fake in tests to assert the
    percentile/CV arithmetic exactly.
    """
    if repeats < 1:
        raise ValueError("repeats must be >= 1")

    rows: list[dict[str, Any]] = []
    for name in sorted(solvers):
        objectives: list[float] = []
        flags: list[bool] = []
        runtimes: list[float] = []
        for repeat in range(repeats):
            started = clock()
            objective, feasible = _call_solver(solvers[name], instance, seed + repeat)
            runtimes.append((clock() - started) * 1000.0)
            objectives.append(objective)
            flags.append(feasible)
        mean_ms = statistics.fmean(runtimes)
        cv = (
            statistics.pstdev(runtimes) / mean_ms
            if len(runtimes) > 1 and mean_ms > 0
            else None
        )
        # Objectives come from feasible repeats only: an infeasible repeat is a
        # rejected plan, so its cost is not an objective and must not set one.
        feasible_objs = [obj for obj, ok in zip(objectives, flags, strict=True) if ok]
        objective = min(feasible_objs) if feasible_objs else None
        obj_mean = statistics.fmean(feasible_objs) if feasible_objs else 0.0
        rows.append(
            {
                "solver": name,
                "feasible": all(flags),
                "objective": objective,
                "objective_min": objective,
                "objective_max": max(feasible_objs) if feasible_objs else None,
                "objective_cv": (
                    statistics.pstdev(feasible_objs) / obj_mean
                    if len(feasible_objs) > 1 and obj_mean > 0
                    else None
                ),
                "gap": None,
                "runtime_ms": mean_ms,
                "runtime_p50_ms": _percentile(runtimes, 50),
                "runtime_p95_ms": _percentile(runtimes, 95),
                "runtime_min_ms": min(runtimes),
                "runtime_max_ms": max(runtimes),
                "feasible_repeats": len(feasible_objs),
                "seed": seed,
                "runtime_cv": cv,
            }
        )

    feasible_rows = [row for row in rows if row["feasible"]]
    best_feasible = min(
        (row["objective"] for row in feasible_rows if row["objective"] is not None),
        default=None,
    )
    best_known = instance.best_known
    if best_known is not None:
        reference, reference_kind = best_known, "best_known"
    elif best_feasible is not None:
        reference, reference_kind = best_feasible, "best_of_refs"
    else:
        reference, reference_kind = None, "none"

    beats_best_known = False
    for row in rows:
        objective = row["objective"]
        if not row["feasible"] or reference is None or reference <= 0 or objective is None:
            row["gap"] = None
            continue
        raw = (objective - reference) / reference
        if raw < 0:
            beats_best_known = True
            raw = 0.0
        row["gap"] = raw

    rows.sort(
        key=lambda r: (
            not r["feasible"],
            r["objective"] if r["objective"] is not None else math.inf,
            r["solver"],
        )
    )
    summary: dict[str, Any] = {
        "instance": instance.name,
        "source_format": instance.source_format,
        "distance_metric": instance.distance_metric,
        "n_customers": instance.n_customers,
        "capacity": instance.capacity,
        "vehicle_count": instance.vehicle_count,
        "time_windows": instance.time_windows,
        "solvers": len(rows),
        "repeats": repeats,
        "seed": seed,
        "best_feasible": best_feasible,
        "best_known": best_known,
        "gap_vs_best_known": (
            round(max(0.0, (best_feasible - best_known) / best_known), 6)
            if best_known is not None and best_known > 0 and best_feasible is not None
            else None
        ),
        "reference": reference_kind,
        "reference_objective": reference,
        "beats_best_known": beats_best_known,
        "feasible_solvers": tuple(row["solver"] for row in feasible_rows),
        "infeasible_solvers": tuple(row["solver"] for row in rows if not row["feasible"]),
        "mixed_feasibility_solvers": tuple(
            row["solver"]
            for row in rows
            if 0 < row["feasible_repeats"] < repeats
        ),
    }
    return BenchmarkResult(instance=instance.name, rows=tuple(rows), summary=summary)

def write_csv(rows: Sequence[Mapping[str, Any]], path: str | Path) -> Path:
    """Write the table to CSV with the fixed :data:`ROW_COLS` column order."""
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(ROW_COLS), extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    return out

def write_results(
    results: BenchmarkResult | Sequence[BenchmarkResult],
    csv_path: str | Path,
    parquet_path: str | Path | None = None,
) -> dict[str, Any]:
    """Write CSV always; Parquet only when ``duckdb`` is importable.

    Parquet is produced with DuckDB's ``COPY (...) TO ... (FORMAT PARQUET)``
    reading the CSV we just wrote, so no extra dependency is added. Without
    ``duckdb`` the Parquet step prints a note and is skipped — CSV remains the
    source of truth. Returns ``{"csv", "parquet", "note", "rows"}``.
    """
    batch = [results] if isinstance(results, BenchmarkResult) else list(results)
    rows = [row for result in batch for row in result.to_rows()]
    csv_file = write_csv(rows, csv_path)
    info: dict[str, Any] = {"csv": csv_file, "parquet": None, "note": None, "rows": len(rows)}

    if parquet_path is None:
        return info
    parquet_file = Path(parquet_path)
    try:
        import duckdb
    except ImportError:
        info["note"] = (
            "duckdb not importable - Parquet skipped, CSV only at "
            f"{csv_file} (install the analytics dependency group to enable)"
        )
        print(f"[benchmark] {info['note']}")
        return info

    parquet_file.parent.mkdir(parents=True, exist_ok=True)
    connection = duckdb.connect()
    try:
        connection.execute(
            f"COPY (SELECT * FROM read_csv_auto('{_sql_str(csv_file)}')) "
            f"TO '{_sql_str(parquet_file)}' (FORMAT PARQUET)"
        )
    finally:
        connection.close()
    info["parquet"] = parquet_file
    return info

def _sql_str(path: Path) -> str:
    """Escape a path for a single-quoted DuckDB SQL literal (Windows-safe)."""
    return str(path).replace("'", "''")

def record_standard_benchmarks(data_dir: Path | None = None) -> tuple[Path, Path]:
    """Run benchmark across Solomon/CVRPLIB fixtures and HCMC 80-order seed."""
    from greenlogix_api.benchmark.instances import load_fixture
    from greenlogix_api.benchmark.solvers_instances import INSTANCE_SOLVERS
    from greenlogix_api.benchmark.solvers_ref import (
        solve_baseline_greedy,
        solve_eco_alns,
        solve_nn_two_opt,
    )
    from greenlogix_api.models import Order, Vehicle
    from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, order_rows, truck_rows

    target_dir = Path(data_dir) if data_dir is not None else Path(__file__).resolve().parents[3] / "data"
    target_dir.mkdir(parents=True, exist_ok=True)

    all_rows: list[dict[str, Any]] = []
    instances_summary: list[dict[str, Any]] = []

    # 1. Solomon fixture
    sol_inst = load_fixture("fixture-solomon-c1-5.txt")
    sol_res = run_benchmark(sol_inst, INSTANCE_SOLVERS, repeats=3, seed=42)
    instances_summary.append({"instance": sol_inst.name, "summary": sol_res.summary})
    for r in sol_res.rows:
        row_dict = dict(r)
        row_dict["instance"] = sol_inst.name
        all_rows.append(row_dict)

    # 2. CVRPLIB fixture
    cvrp_inst = load_fixture("fixture-cvrplib-e5-k2.txt")
    cvrp_res = run_benchmark(cvrp_inst, INSTANCE_SOLVERS, repeats=3, seed=42)
    instances_summary.append({"instance": cvrp_inst.name, "summary": cvrp_res.summary})
    for r in cvrp_res.rows:
        row_dict = dict(r)
        row_dict["instance"] = cvrp_inst.name
        all_rows.append(row_dict)

    # 3. 80-order HCMC seed
    orders = [
        Order(
            id=i,
            address=str(row["address"]),
            lat=float(row["lat"]),
            lng=float(row["lng"]),
            receiver=str(row["receiver"]),
            phone=str(row["phone"]),
            kg=float(row["kg"]),
            window_start=str(row["window_start"]),
            window_end=str(row["window_end"]),
            cargo_type=str(row["cargo_type"]),
            notes=str(row["notes"]),
            excel_row=int(row["excel_row"]),
            status="pending",
        )
        for i, row in enumerate(order_rows(), start=1)
    ]
    vehicles = [
        Vehicle(
            id=i,
            plate=str(row["plate"]),
            type=str(row["type"]),
            capacity_kg=float(row["capacity_kg"]),
            fuel=str(row["fuel"]),
            l_per_100km=float(row["l_per_100km"]),
            status=str(row["status"]),
        )
        for i, row in enumerate(truck_rows(), start=1)
    ]
    depot = (DEPOT_LAT, DEPOT_LNG)

    hcmc_solvers = {
        "solve_baseline_greedy": solve_baseline_greedy,
        "solve_eco_alns": solve_eco_alns,
        "solve_nn_two_opt": solve_nn_two_opt,
    }

    hcmc_rows = []
    repeats = 3
    seed = 42

    for name, s_fn in sorted(hcmc_solvers.items()):
        runtimes = []
        objectives = []
        flags = []
        for r in range(repeats):
            t0 = time.perf_counter()
            out = s_fn(orders, vehicles, depot, seed=seed + r)
            runtimes.append((time.perf_counter() - t0) * 1000.0)
            objectives.append(float(out["objective"]))
            flags.append(bool(out["feasible"]))

        mean_ms = statistics.fmean(runtimes)
        cv = statistics.pstdev(runtimes) / mean_ms if len(runtimes) > 1 and mean_ms > 0 else None
        feasible_objs = [obj for obj, ok in zip(objectives, flags, strict=True) if ok]
        obj = min(feasible_objs) if feasible_objs else None
        obj_mean = statistics.fmean(feasible_objs) if feasible_objs else 0.0
        hcmc_rows.append({
            "instance": "hcmc-80-orders",
            "solver": name,
            "feasible": all(flags),
            "objective": obj,
            "objective_min": obj,
            "objective_max": max(feasible_objs) if feasible_objs else None,
            "objective_cv": (statistics.pstdev(feasible_objs) / obj_mean) if len(feasible_objs) > 1 and obj_mean > 0 else None,
            "gap": None,
            "runtime_ms": round(mean_ms, 3),
            "runtime_p50_ms": round(_percentile(runtimes, 50), 3),
            "runtime_p95_ms": round(_percentile(runtimes, 95), 3),
            "runtime_min_ms": round(min(runtimes), 3),
            "runtime_max_ms": round(max(runtimes), 3),
            "feasible_repeats": len(feasible_objs),
            "seed": seed,
            "runtime_cv": round(cv, 4) if cv is not None else None,
        })

    feasible_rows = [r for r in hcmc_rows if r["feasible"]]
    if feasible_rows:
        best_obj = min(r["objective"] for r in feasible_rows if r["objective"] is not None)
        for r in hcmc_rows:
            if r["feasible"] and r["objective"] is not None:
                r["gap"] = round(max(0.0, (r["objective"] - best_obj) / best_obj), 6)

    instances_summary.append({
        "instance": "hcmc-80-orders",
        "summary": {
            "instance": "hcmc-80-orders",
            "n_customers": len(orders),
            "solvers": len(hcmc_rows),
            "repeats": repeats,
            "seed": seed,
        },
    })
    all_rows.extend(hcmc_rows)

    json_path = target_dir / "benchmark_results.json"
    json_payload = {
        "instances": instances_summary,
        "rows": all_rows,
    }
    json_path.write_text(json.dumps(json_payload, indent=2) + "\n", encoding="utf-8")

    csv_path = target_dir / "benchmark_results.csv"
    cols = ["instance", *ROW_COLS]
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=cols, extrasaction="ignore")
        writer.writeheader()
        for row in all_rows:
            writer.writerow(row)

    return json_path, csv_path
