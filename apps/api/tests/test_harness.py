"""Harness tests (T-LOOP-HARNESS): required cols, deterministic seed, gap math."""

from __future__ import annotations

import json
from pathlib import Path

from greenlogix_api.benchmark.harness import REQUIRED_COLS, run_comparison
from greenlogix_api.models import Order, Vehicle

FIXTURE = Path(__file__).parent / "fixtures" / "solomon_tiny.json"


def _load_instance() -> tuple[list[Order], list[Vehicle], tuple[float, float]]:
    data = json.loads(FIXTURE.read_text())
    orders = [
        Order(
            id=o["id"],
            address=o["address"],
            lat=o["lat"],
            lng=o["lng"],
            receiver=o["receiver"],
            phone=o["phone"],
            kg=o["kg"],
            window_start=o["window_start"],
            window_end=o["window_end"],
            excel_row=o["excel_row"],
        )
        for o in data["orders"]
    ]
    vehicles = [
        Vehicle(
            id=v["id"],
            plate=v["plate"],
            type=v["type"],
            capacity_kg=v["capacity_kg"],
            fuel=v["fuel"],
            l_per_100km=v["l_per_100km"],
            status=v["status"],
        )
        for v in data["vehicles"]
    ]
    depot = (data["depot"]["lat"], data["depot"]["lng"])
    return orders, vehicles, depot


def test_table_has_required_cols() -> None:
    orders, vehicles, depot = _load_instance()
    rows = run_comparison(orders, vehicles, depot=depot, seed=7)
    assert len(rows) == 2
    for row in rows:
        assert tuple(row.keys()) == REQUIRED_COLS
        assert isinstance(row["solver"], str)
        assert isinstance(row["feasible"], bool)
        assert isinstance(row["objective"], float) and row["objective"] > 0
        assert isinstance(row["runtime_ms"], float) and row["runtime_ms"] >= 0
        assert row["seed"] == 7
    assert {r["solver"] for r in rows} == {"refA_nn_two_opt", "refB_baseline_greedy"}


def _rows_equal(a: list[dict], b: list[dict]) -> bool:
    strip = lambda rows: [{k: v for k, v in r.items() if k != "runtime_ms"} for r in rows]
    return strip(a) == strip(b)


def test_deterministic_same_seed() -> None:
    orders, vehicles, depot = _load_instance()
    first = run_comparison(orders, vehicles, depot=depot, seed=42)
    second = run_comparison(orders, vehicles, depot=depot, seed=42)
    assert _rows_equal(first, second)


def test_gap_calc_correct_vs_best_of_refs() -> None:
    orders, vehicles, depot = _load_instance()
    rows = run_comparison(orders, vehicles, depot=depot, seed=42)
    feasible = [r for r in rows if r["feasible"]]
    assert feasible, "fixture must be feasible for both refs"
    best = min(r["objective"] for r in feasible)
    best_rows = [r for r in feasible if r["objective"] == best]
    assert all(r["gap"] == 0.0 for r in best_rows)
    for row in feasible:
        assert row["gap"] == (row["objective"] - best) / best
