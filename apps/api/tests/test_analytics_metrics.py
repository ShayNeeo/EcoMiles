"""Hand-computed fixtures for the CR §4.1 metric formulas (C-01).

Every expected value below is arithmetic done by hand (or by an independent
one-liner in the test), not a copy of the implementation's own output.
"""

from __future__ import annotations

import pytest

from greenlogix_api.analytics import metrics


def test_empty_running_pct_matches_hand_computed_share():
    # 20 empty km of 100 total km = 20 % (Eurostat empty-running share).
    assert metrics.empty_running_pct(20.0, 100.0) == 20.0
    # A measured zero is a real answer: no empty km observed, share is 0 %.
    assert metrics.empty_running_pct(0.0, 100.0) == 0.0
    # No empty-leg data today -> None, never a fabricated 0 %.
    assert metrics.empty_running_pct(None, 100.0) is None
    assert metrics.empty_running_pct(20.0, None) is None
    assert metrics.empty_running_pct(20.0, 0.0) is None
    assert metrics.empty_running_pct(None, None) is None

def test_empty_running_pct_refuses_an_impossible_share():
    # 120 empty km out of 100 km cannot happen: a bad join, not a 120 % share.
    assert metrics.empty_running_pct(120.0, 100.0) is None
    assert metrics.empty_running_pct(-5.0, 100.0) is None
    # Exactly at the boundary is still a valid measurement.
    assert metrics.empty_running_pct(100.0, 100.0) == 100.0

def test_payload_utilisation_pct_matches_hand_computed_ratio():
    # 500 kg on 1000 kg of dispatched capacity = 50 %.
    assert metrics.payload_utilisation_pct(500.0, 1000.0) == 50.0
    assert metrics.payload_utilisation_pct(0.0, 1000.0) == 0.0
    assert metrics.payload_utilisation_pct(500.0, None) is None
    assert metrics.payload_utilisation_pct(None, 1000.0) is None
    # Nothing dispatched -> no utilisation to report.
    assert metrics.payload_utilisation_pct(500.0, 0.0) is None
    # An overloaded dispatch is a real value above 100 %, not clamped away.
    assert metrics.payload_utilisation_pct(1200.0, 1000.0) == 120.0

def test_vehicle_fill_pct_ignores_vehicles_without_routed_work():
    # stops per used vehicle 4, 4, 2 -> mean 10/3, fullest 4 -> 83.333… %
    assert metrics.vehicle_fill_pct([4, 4, 2]) == pytest.approx(83.3333333333)
    assert metrics.vehicle_fill_pct([5]) == 100.0
    # Idle vehicles are dropped before the mean: 4, 0, 0 -> 100 %, not 33.3 %.
    assert metrics.vehicle_fill_pct([4, 0, 0]) == 100.0
    assert metrics.vehicle_fill_pct([0, 0]) is None
    assert metrics.vehicle_fill_pct([]) is None
    assert metrics.vehicle_fill_pct(None) is None

def test_otif_pct_matches_hand_computed_share():
    # 8 of 10 orders on time in full = 80 %.
    assert metrics.otif_pct(8, 10) == 80.0
    assert metrics.otif_pct(0, 10) == 0.0
    assert metrics.otif_pct(10, 10) == 100.0
    assert metrics.otif_pct(None, 10) is None  # no delivered-at timestamp
    assert metrics.otif_pct(8, None) is None
    assert metrics.otif_pct(8, 0) is None

def test_otif_pct_refuses_an_impossible_share():
    # More in-window deliveries than orders is a join error, not 110 %.
    assert metrics.otif_pct(11, 10) is None
    assert metrics.otif_pct(-1, 10) is None

def test_km_per_stop_matches_hand_computed_ratio():
    # 120 km over 40 delivery stops = 3 km/stop.
    assert metrics.km_per_stop(120.0, 40) == 3.0
    assert metrics.km_per_stop(120.0, 0) is None
    assert metrics.km_per_stop(None, 40) is None
    assert metrics.km_per_stop(120.0, None) is None

def test_stops_per_hour_matches_hand_computed_ratio():
    # 40 stops in an 8 h shift = 5 stops/h.
    assert metrics.stops_per_hour(40, 8.0) == 5.0
    assert metrics.stops_per_hour(40, 0.0) is None
    # No route duration is stored -> caller passes None -> None.
    assert metrics.stops_per_hour(40, None) is None
    assert metrics.stops_per_hour(None, 8.0) is None

def test_cost_per_order_and_km_match_hand_computed_ratios():
    # 2,000,000 VND of fuel over 500 routed orders = 4,000 VND/order.
    assert metrics.cost_per_order(2_000_000.0, 500) == 4_000.0
    # Nothing routed -> None, never "0 VND per order".
    assert metrics.cost_per_order(2_000_000.0, 0) is None
    assert metrics.cost_per_order(0.0, 0) is None
    # Fuel price unset -> cost unknown -> None (never a guessed price).
    assert metrics.cost_per_order(None, 500) is None
    assert metrics.cost_per_order(2_000_000.0, None) is None
    # 2,000,000 VND over 1,000 km = 2,000 VND/km.
    assert metrics.cost_per_km(2_000_000.0, 1000.0) == 2_000.0
    assert metrics.cost_per_km(2_000_000.0, 0.0) is None
    assert metrics.cost_per_km(None, 1000.0) is None

def test_g_co2e_per_tkm_takes_transport_work_not_an_aggregate_product():
    # 100 kg CO2e over 250 t.km of work = 400 g/t.km.
    assert metrics.g_co2e_per_tkm(100.0, 250.0) == 400.0
    # Two routes: 0.3 t x 100 km + 0.45 t x 100 km = 75 t.km -> 100 kg / 75.
    work = 0.3 * 100 + 0.45 * 100
    assert metrics.g_co2e_per_tkm(100.0, work) == pytest.approx(1333.3333333333)
    # The (Σkg)(Σkm) reading would be 0.75 t x 200 km = 150 t.km — half the
    # intensity — which is exactly why the work is passed in, not multiplied.
    assert metrics.g_co2e_per_tkm(100.0, 150.0) == pytest.approx(666.6666666667)
    assert metrics.g_co2e_per_tkm(100.0, 0.0) is None  # no transport work
    assert metrics.g_co2e_per_tkm(100.0, None) is None
    assert metrics.g_co2e_per_tkm(None, 250.0) is None

def test_g_co2e_per_order_matches_hand_computed_ratio():
    # 100 kg CO2e over 50 routed orders = 2,000 g/order.
    assert metrics.g_co2e_per_order(100.0, 50) == 2_000.0
    # Nothing routed -> None, never 0 g per order.
    assert metrics.g_co2e_per_order(100.0, 0) is None
    assert metrics.g_co2e_per_order(0.0, 0) is None
    assert metrics.g_co2e_per_order(None, 50) is None
    assert metrics.g_co2e_per_order(100.0, None) is None

def test_kg_co2e_wtw_needs_the_wtw_ratio():
    # 100 kg TTW x 1.21 WTW/TTW = 121 kg WTW.
    assert metrics.kg_co2e_wtw(100.0, 1.21) == pytest.approx(121.0)
    # emission_factors.json carries no WTW/TTW ratio -> None, not a guess.
    assert metrics.kg_co2e_wtw(100.0, None) is None
    assert metrics.kg_co2e_wtw(None, 1.21) is None
