from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5, XE_VAN_945KG
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


def test_solve_eco_alns_outer_ring_trimmed_window_and_van_exempt():
    depot_lat, depot_lng = 10.8753, 106.6476  # District 12 outer ring depot
    customers = [
        # Outer ring 07:30-08:30 (legal for xe_tai_nho outside ring)
        CustomerNode(order_id=1, lat=10.8700, lng=106.6400, kg=100, window_start_min=450, window_end_min=510),
        # Inner city 08:00-10:30 (trimmed legally to 09:00-10:30 for xe_tai_nho)
        CustomerNode(order_id=2, lat=10.7765, lng=106.7008, kg=100, window_start_min=480, window_end_min=630),
        # Inner city 07:30-08:30 (only legal for <950kg xe_van)
        CustomerNode(order_id=3, lat=10.7780, lng=106.7010, kg=50, window_start_min=450, window_end_min=510),
    ]
    truck = [VehicleTour(vehicle_id=1, plate="51C-2T5", capacity_kg=2500, profile=XE_TAI_NHO_1T5)]
    sol_truck = solve_eco_alns(
        customers,
        truck,
        depot_lat,
        depot_lng,
        iterations=10,
        seed=42,
        enforce_truck_ban=True,
        pair_km=lambda a, b, c, d: 2.0,
    )
    truck_assigned = {s.order_id for t in sol_truck.tours for s in t.stops}
    assert truck_assigned == {1, 2}
    assert [u.order_id for u in sol_truck.unassigned] == [3]

    van = [VehicleTour(vehicle_id=2, plate="51B-VAN", capacity_kg=945, profile=XE_VAN_945KG)]
    sol_van = solve_eco_alns(
        customers,
        van,
        depot_lat,
        depot_lng,
        iterations=10,
        seed=42,
        enforce_truck_ban=True,
        pair_km=lambda a, b, c, d: 2.0,
    )
    assert sol_van.unassigned == []
    assert sol_van.total_km > 0
