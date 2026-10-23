"""Deterministic heuristics over :class:`~...benchmark.instances.Instance` (C-05).

Two constructive solvers, no RNG, no dependencies — they exist so the C-05
results table is produced by real code paths rather than by fixtures. Both pack
customers into routes in a fixed sort order (capacity + time-window aware) and
sequence each route in insertion order, so the objective is the Euclidean tour
cost (or ``nint`` Euclidean for CVRPLIB) of a plan that actually satisfies
capacity, fleet size and due dates.

``feasible`` is the honest flag: ``False`` whenever any customer is left
unserved or any route violates a window under :func:`schedule_ok`. An
infeasible row keeps its objective (the cost of the partial plan) but carries no
gap — see :mod:`...benchmark.scorer`. ``Instance.vehicle_count`` of ``0`` is
honoured as an explicitly empty fleet (it means "no vehicles", never "unknown"),
so every customer is unserved and the run is infeasible; ``None`` falls back to
one route per customer.

Window handling uses the instance's own integer clock, including service times
and waiting (``arrival = max(ready, arrival) + service + travel``). Instances
without windows (CVRPLIB) skip the check entirely.

These are reference points for comparing the in-app solvers against public
instance *formats*; they compute no optimality claim and are never labelled
optimal.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence

from greenlogix_api.benchmark.instances import Customer, Instance


def schedule_ok(instance: Instance, sequence: Sequence[Customer]) -> bool:
    """True when the sequence visits every customer within its window.

    Returns ``True`` for instances without time windows (nothing is claimed
    vacuously — the loader sets ``time_windows=False`` for such formats).
    """
    if not instance.time_windows:
        return True
    clock = 0.0
    previous = instance.depot
    for customer in sequence:
        clock += instance.dist(previous, customer.point)
        if clock > customer.due:
            return False
        clock = max(clock, customer.ready) + customer.service
        previous = customer.point
    return True

def route_cost(instance: Instance, sequence: Sequence[Customer]) -> float:
    """Round-trip cost depot -> sequence -> depot under the instance metric."""
    total = 0.0
    previous = instance.depot
    for customer in sequence:
        total += instance.dist(previous, customer.point)
        previous = customer.point
    return total + instance.dist(previous, instance.depot)

def _fits(instance: Instance, route: list[Customer], customer: Customer) -> bool:
    load = sum(c.demand for c in route) + customer.demand
    if load > instance.capacity:
        return False
    return schedule_ok(instance, [*route, customer])

def _solve(instance: Instance, key: Callable[[Customer], object]) -> dict[str, object]:
    fleet = (
        instance.vehicle_count if instance.vehicle_count is not None else instance.n_customers
    )
    routes: list[list[Customer]] = []
    unserved: list[Customer] = []
    for customer in sorted(instance.customers, key=key):
        target = next((route for route in routes if _fits(instance, route, customer)), None)
        if target is not None:
            target.append(customer)
            continue
        if len(routes) < fleet and _fits(instance, [], customer):
            routes.append([customer])
            continue
        unserved.append(customer)
    objective = sum(route_cost(instance, route) for route in routes)
    return {
        "objective": float(objective),
        "feasible": not unserved,
        "routes": len(routes),
        "unserved": len(unserved),
    }

def solve_window_greedy(instance: Instance, seed: int = 0) -> dict[str, object]:
    """Earliest-due-first packing; deterministic, ignores ``seed``."""
    _ = seed
    return _solve(instance, key=lambda c: (c.due, c.ready, c.id))

def solve_demand_greedy(instance: Instance, seed: int = 0) -> dict[str, object]:
    """Largest-demand-first packing (fills big customers before small ones)."""
    _ = seed
    depot = instance.depot
    return _solve(
        instance,
        key=lambda c: (-c.demand, instance.dist(depot, c.point), c.id),
    )

INSTANCE_SOLVERS: dict[str, Callable[..., dict[str, object]]] = {
    "window_greedy": solve_window_greedy,
    "demand_greedy": solve_demand_greedy,
}
