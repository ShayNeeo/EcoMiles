"""Deterministic reference-solver benchmark package (CR-11, C-05).

Two layers live here and share nothing mutable:

* ``harness`` / ``solvers_ref`` (CR-11) — in-app ``Order``/``Vehicle`` rows and
  the frozen 6-key comparison table.
* ``instances`` / ``runner`` / ``scorer`` / ``solvers_instances`` (C-05) —
  published instance *formats* (Solomon, CVRPLIB) with Euclidean distance,
  repeat-run runtime statistics and a DIMACS-style leaderboard.

Neither layer claims optimality: every gap is measured against a supplied
best-known value or against best-of-refs.
"""

from greenlogix_api.benchmark.harness import REQUIRED_COLS, run_comparison
from greenlogix_api.benchmark.instances import (
    FIXTURE_DIR,
    Customer,
    Instance,
    load_fixture,
    load_instance,
    parse_cvrplib,
    parse_solomon,
)
from greenlogix_api.benchmark.runner import (
    ROW_COLS,
    BenchmarkResult,
    record_standard_benchmarks,
    run_benchmark,
    write_results,
)
from greenlogix_api.benchmark.scorer import leaderboard, score_result, score_rows
from greenlogix_api.benchmark.solvers_instances import INSTANCE_SOLVERS

__all__ = [
    "FIXTURE_DIR",
    "INSTANCE_SOLVERS",
    "REQUIRED_COLS",
    "ROW_COLS",
    "BenchmarkResult",
    "Customer",
    "Instance",
    "leaderboard",
    "load_fixture",
    "load_instance",
    "parse_cvrplib",
    "parse_solomon",
    "record_standard_benchmarks",
    "run_benchmark",
    "run_comparison",
    "score_result",
    "score_rows",
    "write_results",
]
