"""ALNS operator tests: determinism, improvement, ablation (T-LOOP-ALNS)."""

from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5
from greenlogix_api.optimizer.eco_alns import (
    DESTROY_OPS,
    CustomerNode,
    VehicleTour,
    ban_window_removal_destroy,
    eco_regret_repair,
    random_removal_destroy,
    solve_eco_alns,
    uphill_payload_removal_destroy,
    worst_fuel_removal_destroy,
)

DEPOT = (10.8123, 106.6543)


def _fixture(n: int = 8):
    base_lat, base_lng = 10.7725, 106.6578
    customers = [
        CustomerNode(
            order_id=i + 1,
            lat=base_lat + 0.008 * i,
            lng=base_lng + 0.006 * (i % 3),
            kg=150 + 50 * (i % 4),
        )
        for i in range(n)
    ]
    vehicles = [
        VehicleTour(vehicle_id=1, plate="51C-000.01", capacity_kg=1200, profile=XE_TAI_NHO_1T5),
        VehicleTour(vehicle_id=2, plate="51C-000.02", capacity_kg=1200, profile=XE_TAI_NHO_1T5),
    ]
    return customers, vehicles


def _sig(sol):
    return (
        sol.total_fuel_litres,
        sol.total_km,
        tuple(sorted(s.order_id for t in sol.tours for s in t.stops)),
        len(sol.unassigned),
    )


def test_alns_deterministic_same_seed():
    customers, vehicles = _fixture()
    s1 = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42)
    s2 = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42)
    assert _sig(s1) == _sig(s2)


def test_alns_improvement_or_equal_vs_baseline():
    customers, vehicles = _fixture()
    base = solve_eco_alns(customers, vehicles, *DEPOT, iterations=0, seed=42)
    tuned = solve_eco_alns(customers, vehicles, *DEPOT, iterations=30, seed=42)
    assert tuned.total_fuel_litres <= base.total_fuel_litres
    assert len(tuned.unassigned) <= len(base.unassigned)
    for tour in tuned.tours:
        assert sum(s.kg for s in tour.stops) <= tour.capacity_kg


def test_alns_ablation_destroy_off():
    """Adaptive ALNS must not be worse than destroy-off (no-op) baseline."""
    customers, vehicles = _fixture()
    off = solve_eco_alns(
        customers, vehicles, *DEPOT, iterations=30, seed=42, destroy_op="none"
    )
    on = solve_eco_alns(customers, vehicles, *DEPOT, iterations=30, seed=42)
    assert on.total_fuel_litres <= off.total_fuel_litres
    assert len(on.unassigned) <= len(off.unassigned)


def test_random_removal_and_regret_operators_seeded():
    import random

    customers, vehicles = _fixture()
    sol = solve_eco_alns(customers, vehicles, *DEPOT, iterations=0, seed=7)
    rng1 = random.Random(99)
    tours1 = [VehicleTour(t.vehicle_id, t.plate, t.capacity_kg, t.profile, list(t.stops)) for t in sol.tours]
    rng2 = random.Random(99)
    tours2 = [VehicleTour(t.vehicle_id, t.plate, t.capacity_kg, t.profile, list(t.stops)) for t in sol.tours]
    r1 = random_removal_destroy(tours1, 2, rng1)
    r2 = random_removal_destroy(tours2, 2, rng2)
    assert [c.order_id for c in r1] == [c.order_id for c in r2]

    # regret repair reinserts everything feasibly and deterministically
    failed1 = eco_regret_repair(list(r1), tours1, *DEPOT)
    assert failed1 == []
    assert sum(len(t.stops) for t in tours1) == sum(len(t.stops) for t in sol.tours)


TRACE_KEYS = (
    "iteration",
    "fuel",
    "unassigned",
    "accepted",
    "destroy_op",
    "repair_op",
    "temperature",
)


def test_sa_acceptance_deterministic_same_seed():
    customers, vehicles = _fixture()
    s1 = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42, acceptance="sa")
    s2 = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42, acceptance="sa")
    assert s1.total_fuel_litres == s2.total_fuel_litres
    assert s1.convergence_trace == s2.convergence_trace
    assert [r["temperature"] for r in s1.convergence_trace] == sorted(
        [r["temperature"] for r in s1.convergence_trace], reverse=True
    )


def test_sa_no_worse_unassigned_than_hillclimb():
    customers, vehicles = _fixture()
    hill = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42)
    sa = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42, acceptance="sa")
    assert len(sa.unassigned) <= len(hill.unassigned)
    for tour in sa.tours:
        assert sum(s.kg for s in tour.stops) <= tour.capacity_kg


def test_time_budget_returns_best_so_far_with_short_trace():
    customers, vehicles = _fixture()
    full = solve_eco_alns(customers, vehicles, *DEPOT, iterations=200, seed=42)
    budgeted = solve_eco_alns(
        customers, vehicles, *DEPOT, iterations=200, seed=42, time_budget_s=0.0
    )
    assert len(budgeted.convergence_trace) <= len(full.convergence_trace)
    assert budgeted.total_fuel_litres >= full.total_fuel_litres
    assert all(set(r) == set(TRACE_KEYS) for r in full.convergence_trace)


def test_worst_fuel_destroy_deterministic_and_feasible():
    import random

    customers, vehicles = _fixture()
    sol = solve_eco_alns(customers, vehicles, *DEPOT, iterations=0, seed=7)
    tours1 = [VehicleTour(t.vehicle_id, t.plate, t.capacity_kg, t.profile, list(t.stops)) for t in sol.tours]
    tours2 = [VehicleTour(t.vehicle_id, t.plate, t.capacity_kg, t.profile, list(t.stops)) for t in sol.tours]
    r1 = worst_fuel_removal_destroy(tours1, 2, random.Random(99), *DEPOT)
    r2 = worst_fuel_removal_destroy(tours2, 2, random.Random(99), *DEPOT)
    assert [c.order_id for c in r1] == [c.order_id for c in r2]
    assert len(r1) == 2
    via_solver = solve_eco_alns(
        customers, vehicles, *DEPOT, iterations=20, seed=42, destroy_op="worst_fuel"
    )
    assert len(via_solver.unassigned) == 0
    for tour in via_solver.tours:
        assert sum(s.kg for s in tour.stops) <= tour.capacity_kg


def test_uphill_payload_destroy_deterministic_and_feasible():
    import random

    customers, vehicles = _fixture()
    sol = solve_eco_alns(customers, vehicles, *DEPOT, iterations=0, seed=7)
    tours1 = [VehicleTour(t.vehicle_id, t.plate, t.capacity_kg, t.profile, list(t.stops)) for t in sol.tours]
    tours2 = [VehicleTour(t.vehicle_id, t.plate, t.capacity_kg, t.profile, list(t.stops)) for t in sol.tours]
    r1 = uphill_payload_removal_destroy(tours1, 2, random.Random(99), *DEPOT)
    r2 = uphill_payload_removal_destroy(tours2, 2, random.Random(99), *DEPOT)
    assert [c.order_id for c in r1] == [c.order_id for c in r2]
    assert len(r1) == 2
    via_solver = solve_eco_alns(
        customers, vehicles, *DEPOT, iterations=20, seed=42, destroy_op="uphill_payload"
    )
    assert len(via_solver.unassigned) == 0


def test_new_ops_registered_and_adaptive_selectable():
    assert {"worst_fuel", "uphill_payload"} <= set(DESTROY_OPS)
    customers, vehicles = _fixture()
    adaptive = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42)
    ops_used = {r["destroy_op"] for r in adaptive.convergence_trace}
    assert ops_used <= set(DESTROY_OPS) | {"none"}
    assert len(adaptive.convergence_trace) == 20


def test_ban_window_destroy_deterministic_and_restricted_first():
    import random

    restricted = [
        CustomerNode(order_id=1, lat=10.7750, lng=106.6600, kg=200, window_start_min=450, window_end_min=510),
        CustomerNode(order_id=2, lat=10.7800, lng=106.6650, kg=200, window_start_min=460, window_end_min=520),
    ]
    clear = [
        CustomerNode(order_id=3, lat=10.7900, lng=106.6700, kg=200, window_start_min=600, window_end_min=720),
        CustomerNode(order_id=4, lat=10.7950, lng=106.6750, kg=200, window_start_min=660, window_end_min=780),
    ]
    tours1 = [VehicleTour(vehicle_id=1, plate="51C-000.01", capacity_kg=1200, profile=XE_TAI_NHO_1T5, stops=list(restricted + clear))]
    tours2 = [VehicleTour(vehicle_id=1, plate="51C-000.01", capacity_kg=1200, profile=XE_TAI_NHO_1T5, stops=list(restricted + clear))]
    r1 = ban_window_removal_destroy(tours1, 2, random.Random(99), *DEPOT)
    r2 = ban_window_removal_destroy(tours2, 2, random.Random(99), *DEPOT)
    assert [c.order_id for c in r1] == [c.order_id for c in r2]
    assert {c.order_id for c in r1} == {1, 2}


def test_ban_window_via_solver_feasible():
    customers, vehicles = _fixture()
    sol = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42, destroy_op="ban_window")
    assert len(sol.unassigned) == 0
    for tour in sol.tours:
        assert sum(s.kg for s in tour.stops) <= tour.capacity_kg


def test_ban_window_registered_and_adaptive_selectable():
    assert "ban_window" in DESTROY_OPS
    customers, vehicles = _fixture()
    adaptive = solve_eco_alns(customers, vehicles, *DEPOT, iterations=20, seed=42)
    ops_used = {r["destroy_op"] for r in adaptive.convergence_trace}
    assert ops_used <= set(DESTROY_OPS) | {"none"}
    assert len(adaptive.convergence_trace) == 20
