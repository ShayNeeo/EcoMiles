"""C-05 runner tests: runtime stats, gap honesty, CSV/Parquet, determinism."""

from __future__ import annotations

import csv
import importlib.util
import math
import statistics
from pathlib import Path

import pytest

from greenlogix_api.benchmark.instances import Customer, Instance, load_fixture
from greenlogix_api.benchmark.runner import (
    ROW_COLS,
    run_benchmark,
    write_csv,
    write_results,
)
from greenlogix_api.benchmark.solvers_instances import INSTANCE_SOLVERS

DUCKDB_AVAILABLE = importlib.util.find_spec("duckdb") is not None

def _instance(best_known: float | None = None) -> Instance:
    return Instance(
        name="unit",
        depot=(0.0, 0.0),
        customers=(
            Customer(id=1, x=1.0, y=0.0, demand=1.0),
            Customer(id=2, x=0.0, y=1.0, demand=1.0),
        ),
        capacity=2.0,
        vehicle_count=1,
        best_known=best_known,
    )

def _fixed_solver(objective: float, feasible: bool = True):
    def solver(instance: Instance, seed: int) -> dict[str, object]:
        _ = instance, seed
        return {"objective": objective, "feasible": feasible}

    return solver

def _scripted_clock(ticks: list[float]):
    state = {"index": 0}

    def clock() -> float:
        value = ticks[state["index"]]
        state["index"] += 1
        return value

    return clock

def test_row_cols_and_shapes() -> None:
    result = run_benchmark(_instance(), {"a": _fixed_solver(10.0)}, repeats=2)
    assert len(result.rows) == 1
    row = result.rows[0]
    assert tuple(row.keys()) == ROW_COLS
    assert row["solver"] == "a"
    assert row["feasible"] is True
    assert row["objective"] == 10.0
    assert row["seed"] == 0
    assert isinstance(row["runtime_cv"], float)
    assert result.summary["instance"] == "unit"
    assert set(result.summary) >= {
        "best_feasible",
        "best_known",
        "gap_vs_best_known",
        "reference",
        "reference_objective",
        "repeats",
        "seed",
    }

def test_percentiles_and_cv_math_from_injected_clock() -> None:
    # 3 repeats -> per-repeat wall clocks of 1.0, 5.0 and 10.0 ms.
    ticks = [0.0, 0.001, 10.0, 10.005, 20.0, 20.010]
    result = run_benchmark(
        _instance(), {"a": _fixed_solver(1.0)}, repeats=3, clock=_scripted_clock(ticks)
    )
    row = result.rows[0]
    assert row["runtime_ms"] == pytest.approx(16.0 / 3.0)
    assert row["runtime_p50_ms"] == pytest.approx(5.0)
    assert row["runtime_p95_ms"] == pytest.approx(9.5)  # linear interpolation
    assert row["runtime_min_ms"] == pytest.approx(1.0)
    assert row["runtime_max_ms"] == pytest.approx(10.0)
    expected_cv = math.sqrt(sum((v - 16.0 / 3.0) ** 2 for v in (1.0, 5.0, 10.0)) / 3)
    assert row["runtime_cv"] == pytest.approx(expected_cv / (16.0 / 3.0))

def test_single_repeat_has_no_cv() -> None:
    result = run_benchmark(
        _instance(), {"a": _fixed_solver(1.0)}, repeats=1, clock=_scripted_clock([0.0, 0.002])
    )
    assert result.rows[0]["runtime_cv"] is None
    assert result.rows[0]["runtime_p50_ms"] == result.rows[0]["runtime_p95_ms"]

def test_repeats_must_be_positive() -> None:
    with pytest.raises(ValueError, match="repeats must be >= 1"):
        run_benchmark(_instance(), {"a": _fixed_solver(1.0)}, repeats=0)

def test_runtime_distribution_is_monotone_from_injected_durations() -> None:
    """Percentile ordering and cross-solver comparison, no wall-clock dependency."""
    # Solvers run in sorted order, 2 clock reads per repeat: fast ×3, then slow ×3.
    fast = [0.0, 0.004, 10.0, 10.006, 20.0, 20.005]  # 4.0, 6.0, 5.0 ms
    slow = [100.0, 100.020, 200.0, 200.030, 300.0, 300.010]  # 20.0, 30.0, 10.0 ms
    result = run_benchmark(
        _instance(),
        {"fast": _fixed_solver(1.0), "slow": _fixed_solver(2.0)},
        repeats=3,
        clock=_scripted_clock(fast + slow),
    )
    by_name = {row["solver"]: row for row in result.rows}
    for row in result.rows:
        assert 0.0 < row["runtime_min_ms"] <= row["runtime_p50_ms"] <= row["runtime_p95_ms"]
        assert row["runtime_p95_ms"] <= row["runtime_max_ms"]
        assert row["runtime_cv"] >= 0.0
    assert by_name["fast"]["runtime_ms"] == pytest.approx(5.0)
    assert by_name["fast"]["runtime_p50_ms"] == pytest.approx(5.0)
    assert by_name["fast"]["runtime_p95_ms"] == pytest.approx(5.9)
    assert by_name["fast"]["runtime_min_ms"] == pytest.approx(4.0)
    assert by_name["fast"]["runtime_max_ms"] == pytest.approx(6.0)
    assert by_name["slow"]["runtime_ms"] == pytest.approx(20.0)
    assert by_name["fast"]["runtime_p50_ms"] < by_name["slow"]["runtime_p50_ms"]

def test_real_clock_runtime_is_reported_in_milliseconds() -> None:
    """Guards the ms unit conversion of the default wall clock (no magnitude claim)."""
    result = run_benchmark(_instance(), {"a": _fixed_solver(1.0)}, repeats=1)
    row = result.rows[0]
    assert 0.0 <= row["runtime_ms"] < 1000.0
    assert row["runtime_min_ms"] == row["runtime_ms"] == row["runtime_max_ms"]

def test_seed_ramps_per_repeat_but_row_reports_base_seed() -> None:
    seen: list[int] = []

    def recorder(instance: Instance, seed: int) -> dict[str, object]:
        _ = instance
        seen.append(seed)
        return {"objective": 1.0, "feasible": True}

    result = run_benchmark(_instance(), {"a": recorder}, repeats=3, seed=7)
    assert seen == [7, 8, 9]
    assert result.rows[0]["seed"] == 7
    assert result.summary["seed"] == 7

def test_infeasible_solver_has_no_gap_and_sorts_last() -> None:
    result = run_benchmark(
        _instance(),
        {"bad": _fixed_solver(1.0, feasible=False), "good": _fixed_solver(4.0)},
    )
    good, bad = result.rows[0], result.rows[1]
    assert (good["solver"], bad["solver"]) == ("good", "bad")
    assert bad["feasible"] is False
    assert bad["gap"] is None
    # A fully infeasible solver has no feasible repeat -> no objective at all.
    assert bad["objective"] is None
    assert bad["objective_min"] is None and bad["objective_max"] is None
    assert bad["objective_cv"] is None
    assert bad["feasible_repeats"] == 0
    assert good["gap"] == 0.0
    assert good["feasible_repeats"] == 3
    assert result.summary["best_feasible"] == 4.0
    assert result.summary["infeasible_solvers"] == ("bad",)
    assert result.summary["feasible_solvers"] == ("good",)
    assert result.summary["mixed_feasibility_solvers"] == ()

def test_mixed_feasibility_uses_feasible_repeats_only() -> None:
    """Infeasible repeats must not supply the objective, and the mix is visible."""

    def flaky(instance: Instance, seed: int) -> dict[str, object]:
        _ = instance
        # Repeat 0 (seed 5) is infeasible *and* has the lowest cost: it must not win.
        if seed == 5:
            return {"objective": 1.0, "feasible": False}
        return {"objective": 10.0 + seed, "feasible": True}

    result = run_benchmark(_instance(), {"flaky": flaky}, repeats=3, seed=5)
    row = result.rows[0]
    assert row["feasible"] is False
    assert row["feasible_repeats"] == 2
    assert row["objective"] == 16.0  # seeds 6 and 7 only, never the rejected 1.0
    assert row["objective_min"] == 16.0
    assert row["objective_max"] == 17.0
    assert row["objective_cv"] == pytest.approx(
        statistics.pstdev([16.0, 17.0]) / statistics.fmean([16.0, 17.0])
    )
    assert row["gap"] is None
    assert result.summary["mixed_feasibility_solvers"] == ("flaky",)
    assert result.summary["best_feasible"] is None

def test_gap_is_vs_best_of_refs_by_default() -> None:
    result = run_benchmark(
        _instance(), {"a": _fixed_solver(100.0), "b": _fixed_solver(120.0)}
    )
    gaps = {row["solver"]: row["gap"] for row in result.rows}
    assert gaps == pytest.approx({"a": 0.0, "b": 0.2})
    assert result.summary["reference"] == "best_of_refs"
    assert result.summary["reference_objective"] == 100.0
    assert result.summary["gap_vs_best_known"] is None

def test_gap_is_vs_best_known_when_supplied() -> None:
    result = run_benchmark(_instance(best_known=50.0), {"a": _fixed_solver(60.0)})
    assert result.rows[0]["gap"] == pytest.approx(0.2)
    assert result.summary["reference"] == "best_known"
    assert result.summary["gap_vs_best_known"] == pytest.approx(0.2)
    assert result.summary["beats_best_known"] is False

def test_gap_never_negative_and_flags_beating_best_known() -> None:
    result = run_benchmark(_instance(best_known=500.0), {"a": _fixed_solver(400.0)})
    assert result.rows[0]["gap"] == 0.0
    assert result.summary["gap_vs_best_known"] == 0.0
    assert result.summary["beats_best_known"] is True

def test_all_infeasible_leaves_no_reference() -> None:
    result = run_benchmark(_instance(), {"a": _fixed_solver(3.0, feasible=False)})
    assert result.rows[0]["gap"] is None
    assert result.summary["best_feasible"] is None
    assert result.summary["reference"] == "none"
    assert result.summary["gap_vs_best_known"] is None

def test_zero_vehicle_count_is_not_treated_as_absent() -> None:
    """vehicle_count=0 is an explicit fleet of zero, not a missing value."""
    instance = Instance(
        name="no-fleet",
        depot=(0.0, 0.0),
        customers=(Customer(id=1, x=1.0, y=0.0, demand=1.0),),
        capacity=10.0,
        vehicle_count=0,
    )
    result = run_benchmark(instance, INSTANCE_SOLVERS, repeats=1)
    for row in result.rows:
        assert row["feasible"] is False
        assert row["feasible_repeats"] == 0
        assert row["objective"] is None
    assert result.summary["best_feasible"] is None
    assert result.summary["reference"] == "none"

    served = run_benchmark(
        Instance(
            name="one-truck",
            depot=instance.depot,
            customers=instance.customers,
            capacity=10.0,
            vehicle_count=1,
        ),
        INSTANCE_SOLVERS,
        repeats=1,
    )
    assert all(row["feasible"] for row in served.rows)
    assert all(row["objective"] == 2.0 for row in served.rows)

def test_deterministic_same_seed_and_seed_sensitivity() -> None:
    """A seed-sensitive solver must reproduce its table and move with the seed."""

    def seeded(instance: Instance, seed: int) -> dict[str, object]:
        _ = instance
        return {"objective": 10.0 + seed, "feasible": True}

    def strip(rows):
        return [
            {k: v for k, v in row.items() if not k.startswith("runtime_")} for row in rows
        ]

    solvers = {"seeded": seeded, "other": _fixed_solver(12.0, feasible=False)}
    first = run_benchmark(_instance(), solvers, seed=42)
    second = run_benchmark(_instance(), solvers, seed=42)
    third = run_benchmark(_instance(), solvers, seed=43)
    assert strip(first.rows) == strip(second.rows)
    seeded_row = first.rows[0]
    assert seeded_row["objective"] == 52.0  # min over seeds 42, 43, 44 (+10 offset)
    assert seeded_row["objective_max"] == 54.0
    assert seeded_row["objective_cv"] == pytest.approx(
        statistics.pstdev([52.0, 53.0, 54.0]) / statistics.fmean([52.0, 53.0, 54.0])
    )
    assert strip(first.rows) != strip(third.rows)
    assert third.rows[0]["objective"] == 53.0
    assert third.rows[0]["objective_max"] == 55.0

def test_csv_written_with_fixed_columns(tmp_path: Path) -> None:
    result = run_benchmark(_instance(), {"a": _fixed_solver(10.0)})
    out = write_csv(result.to_rows(), tmp_path / "nested" / "table.csv")
    rows = list(csv.DictReader(out.open(encoding="utf-8")))
    assert list(rows[0].keys()) == list(ROW_COLS)
    assert rows[0]["solver"] == "a"

def test_write_results_parquet_only_when_duckdb_present(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    result = run_benchmark(_instance(), {"a": _fixed_solver(10.0)})
    info = write_results(result, tmp_path / "table.csv", tmp_path / "table.parquet")
    assert Path(info["csv"]).exists()
    assert info["rows"] == 1
    if DUCKDB_AVAILABLE:
        assert info["parquet"] is not None and Path(info["parquet"]).exists()
        assert info["note"] is None
    else:
        assert info["parquet"] is None
        assert "duckdb not importable" in info["note"]
        assert "duckdb not importable" in capsys.readouterr().out
        assert not (tmp_path / "table.parquet").exists()

def test_write_results_without_parquet_path_writes_csv_only(tmp_path: Path) -> None:
    result = run_benchmark(_instance(), {"a": _fixed_solver(10.0)})
    info = write_results([result], tmp_path / "table.csv")
    assert info["parquet"] is None and info["note"] is None
    assert Path(info["csv"]).exists()

def test_instance_solvers_run_on_fixture_table() -> None:
    instance = load_fixture("fixture-solomon-c1-5.txt")
    result = run_benchmark(instance, INSTANCE_SOLVERS, repeats=2)
    assert len(result.rows) == 2
    for row in result.rows:
        assert tuple(row.keys()) == ROW_COLS
        assert row["feasible"] is True
        assert row["objective"] > 0.0
        assert row["gap"] is not None and row["gap"] >= 0.0
    assert result.summary["reference"] == "best_of_refs"
    assert result.summary["distance_metric"] == "EUCLIDEAN"

def test_instance_solvers_on_cvrplib_use_nint_metric() -> None:
    instance = load_fixture("fixture-cvrplib-e5-k2.txt")
    result = run_benchmark(instance, INSTANCE_SOLVERS, repeats=1)
    assert result.summary["distance_metric"] == "EUC_2D"
    assert result.summary["best_known"] == 46.0
    assert result.summary["reference"] == "best_known"
    for row in result.rows:
        assert row["objective"] == pytest.approx(round(row["objective"]))
