"""C-05 scorer tests: DIMACS-style ordering, gap vs best-known vs best-of-refs."""

from __future__ import annotations

import pytest

from greenlogix_api.benchmark.instances import load_fixture
from greenlogix_api.benchmark.runner import run_benchmark
from greenlogix_api.benchmark.scorer import (
    SCORE_COLS,
    format_table,
    leaderboard,
    score_result,
    score_rows,
)
from greenlogix_api.benchmark.solvers_instances import INSTANCE_SOLVERS


def _row(solver: str, objective: float | None, feasible: bool = True, runtime_ms: float = 1.0):
    return {
        "solver": solver,
        "feasible": feasible,
        "objective": objective,
        "gap": None,
        "runtime_ms": runtime_ms,
    }

def test_score_cols_and_order() -> None:
    scored = score_rows([_row("a", 10.0)], instance="i1")
    assert tuple(scored[0].keys()) == SCORE_COLS
    assert scored[0]["rank"] == 1
    assert scored[0]["instance"] == "i1"
    assert scored[0]["status"] == "feasible"
    assert scored[0]["reference"] == "best_of_refs"

def test_gap_vs_best_of_refs() -> None:
    scored = score_rows([_row("a", 100.0), _row("b", 125.0)])
    assert {r["solver"]: r["gap"] for r in scored} == pytest.approx({"a": 0.0, "b": 0.25})
    assert all(r["reference"] == "best_of_refs" for r in scored)

def test_gap_vs_best_known_wins_over_best_of_refs() -> None:
    # Best-of-refs would be 250 -> gaps 0.0 / 0.2; the supplied best-known wins.
    scored = score_rows([_row("a", 250.0), _row("b", 300.0)], best_known=200.0)
    assert {r["solver"]: r["gap"] for r in scored} == pytest.approx({"a": 0.25, "b": 0.5})
    assert all(r["reference"] == "best_known" for r in scored)

def test_gap_is_never_negative() -> None:
    scored = score_rows([_row("fast", 40.0)], best_known=100.0)
    assert scored[0]["gap"] == 0.0

def test_infeasible_row_has_no_gap_and_ranks_last() -> None:
    scored = score_rows(
        [_row("bad", 5.0, feasible=False), _row("good", 90.0)],
        best_known=100.0,
    )
    assert [r["solver"] for r in scored] == ["good", "bad"]
    assert [r["rank"] for r in scored] == [1, 2]
    assert scored[1]["status"] == "infeasible"
    assert scored[1]["gap"] is None
    assert scored[1]["objective"] == 5.0  # kept, but never scored

def test_missing_objective_and_no_reference_give_none_gap() -> None:
    scored = score_rows([_row("a", None)])
    assert scored[0]["gap"] is None
    assert scored[0]["objective"] is None
    assert scored[0]["reference"] == "none"
    assert score_rows([_row("a", 10.0, feasible=False)])[0]["gap"] is None

def test_row_gap_is_recomputed_not_reused() -> None:
    """A stale best-of-refs row gap must not survive a best_known override."""
    rows = [_row("a", 10.0), {**_row("b", 20.0), "gap": 0.0}]
    scored = {r["solver"]: r for r in score_rows(rows, best_known=10.0)}
    assert scored["a"]["gap"] == 0.0
    assert scored["b"]["gap"] == 1.0
    assert scored["b"]["reference"] == "best_known"

def test_row_gap_is_only_a_fallback_without_objective() -> None:
    rows = [
        {**_row("noobj", None), "gap": 0.25},
        {**_row("stale", None), "gap": -0.5},
    ]
    scored = {r["solver"]: r for r in score_rows(rows, best_known=10.0)}
    assert scored["noobj"]["gap"] == 0.25
    assert scored["stale"]["gap"] == 0.0  # clamped, never negative

def test_sorting_is_total_and_deterministic() -> None:
    rows = [
        _row("z", 10.0, runtime_ms=5.0),
        _row("y", 10.0, runtime_ms=1.0),
        _row("x", 10.0, runtime_ms=1.0),
    ]
    first = [r["solver"] for r in score_rows(rows)]
    second = [r["solver"] for r in score_rows(list(reversed(rows)))]
    assert first == second == ["x", "y", "z"]

def test_score_result_and_leaderboard_restart_ranks_per_instance() -> None:
    instance = load_fixture("fixture-cvrplib-e5-k2.txt")
    result = run_benchmark(instance, INSTANCE_SOLVERS, repeats=1)
    scored = score_result(result)
    assert {r["instance"] for r in scored} == {instance.name}
    assert all(r["reference"] == "best_known" for r in scored)
    assert [r["rank"] for r in scored] == [1, 2]

    other = run_benchmark(load_fixture("fixture-solomon-c1-5.txt"), INSTANCE_SOLVERS, repeats=1)
    table = leaderboard([result, other])
    assert len(table) == 4
    assert [r["rank"] for r in table] == [1, 2, 1, 2]
    assert [r["instance"] for r in table][:2] == [instance.name, instance.name]
    assert table[2]["reference"] == "best_of_refs"

def test_leaderboard_best_known_override() -> None:
    other = run_benchmark(load_fixture("fixture-solomon-c1-5.txt"), INSTANCE_SOLVERS, repeats=1)
    table = leaderboard([other], best_known={other.instance: 10.0})
    assert all(r["reference"] == "best_known" for r in table)
    assert all(r["beats_reference"] is False for r in table)
    # Override better than every row -> every gap strictly positive and recomputed.
    for row in table:
        assert row["gap"] == pytest.approx(row["objective"] / 10.0 - 1.0)
        assert row["gap"] > 0.0
    assert [r["rank"] for r in table] == [1, 2]

def test_override_worse_than_every_row_clamps_and_flags() -> None:
    other = run_benchmark(load_fixture("fixture-solomon-c1-5.txt"), INSTANCE_SOLVERS, repeats=1)
    table = leaderboard([other], best_known={other.instance: 1_000.0})
    assert all(r["gap"] == 0.0 for r in table)
    assert all(r["beats_reference"] is True for r in table)
    assert all(r["reference"] == "best_known" for r in table)
    assert score_result(other, 1_000.0)[0]["beats_reference"] is True

def test_override_beats_reference_is_false_for_best_of_refs_winner() -> None:
    scored = score_rows([_row("a", 100.0), _row("b", 120.0)])
    assert [r["beats_reference"] for r in scored] == [False, False]

def test_format_table_renders_headers_and_missing_values() -> None:
    scored = score_rows([_row("a", 10.0), _row("bad", 5.0, feasible=False)], instance="i1")
    lines = format_table(scored).splitlines()
    assert lines[0].split() == list(SCORE_COLS)
    assert set(lines[1]) == {"-", " "}
    assert set(lines[1].replace(" ", "")) == {"-"}
    cells = [line.split() for line in lines[2:]]
    assert cells[0] == [
        "1", "i1", "a", "yes", "feasible", "10.000", "0.000", "no", "1.000", "best_of_refs",
    ]
    assert cells[1] == [
        "2", "i1", "bad", "no", "infeasible", "5.000", "-", "no", "1.000", "best_of_refs",
    ]
