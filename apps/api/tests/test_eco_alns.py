from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5
from greenlogix_api.optimizer.eco_alns import (
    CustomerNode,
    VehicleTour,
    solve_eco_alns,
)


def test_solve_eco_alns_deterministic():
    depot_lat, depot_lng = 10.8123, 106.6543
    customers = [
        CustomerNode(order_id=1, lat=10.7725, lng=106.6578, kg=300),
        CustomerNode(order_id=2, lat=10.7812, lng=106.6998, kg=250),
        CustomerNode(order_id=3, lat=10.7951, lng=106.7218, kg=400),
        CustomerNode(order_id=4, lat=10.7940, lng=106.6730, kg=200),
    ]
    vehicles = [
        VehicleTour(vehicle_id=1, plate="51C-000.01", capacity_kg=800, profile=XE_TAI_NHO_1T5),
        VehicleTour(vehicle_id=2, plate="51C-000.02", capacity_kg=800, profile=XE_TAI_NHO_1T5),
    ]

    sol1 = solve_eco_alns(customers, vehicles, depot_lat, depot_lng, iterations=15, seed=123)
    sol2 = solve_eco_alns(customers, vehicles, depot_lat, depot_lng, iterations=15, seed=123)

    assert sol1.total_km == sol2.total_km
    assert sol1.total_fuel_litres == sol2.total_fuel_litres
    assert len(sol1.unassigned) == 0

    # Ensure capacity constraints respected
    for tour in sol1.tours:
        assert sum(s.kg for s in tour.stops) <= tour.capacity_kg


def test_solve_eco_alns_enforce_constraints():
    depot_lat, depot_lng = 10.8123, 106.6543
    # Order 1: within 06:00-09:00 truck ban
    # Order 2: normal window 10:00-12:00 (600..720 min)
    customers = [
        CustomerNode(order_id=1, lat=10.7725, lng=106.6578, kg=100, window_start_min=420, window_end_min=480),
        CustomerNode(order_id=2, lat=10.7812, lng=106.6998, kg=100, window_start_min=600, window_end_min=720),
    ]
    vehicles = [
        VehicleTour(vehicle_id=1, plate="51C-000.01", capacity_kg=800, profile=XE_TAI_NHO_1T5),
    ]
    sol = solve_eco_alns(
        customers,
        vehicles,
        depot_lat,
        depot_lng,
        iterations=5,
        seed=42,
        enforce_truck_ban=True,
    )
    # Order 1 must be unassigned due to truck ban
    unassigned_ids = [c.order_id for c in sol.unassigned]
    assert 1 in unassigned_ids
    assigned_ids = [s.order_id for t in sol.tours for s in t.stops]
    assert 1 not in assigned_ids
    assert 2 in assigned_ids
