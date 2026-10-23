from greenlogix_api.energy.hdt_v1 import HdtEnergyModelV1
from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5, XE_TAI_TRUNG_3T5


def test_energy_zero_distance():
    model = HdtEnergyModelV1()
    est = model.estimate_segment_energy(0.0, XE_TAI_NHO_1T5, payload_kg=200.0)
    assert est.fuel_litres == 0.0
    assert est.ttw_kg_co2 == 0.0

def test_grade_monotonicity():
    model = HdtEnergyModelV1()
    flat = model.estimate_segment_energy(5.0, XE_TAI_NHO_1T5, payload_kg=500.0, grade_percent=0.0)
    uphill = model.estimate_segment_energy(5.0, XE_TAI_NHO_1T5, payload_kg=500.0, grade_percent=4.0)

    # Uphill must consume strictly more fuel and energy than flat road
    assert uphill.fuel_litres > flat.fuel_litres
    assert uphill.mechanical_energy_kwh > flat.mechanical_energy_kwh

def test_payload_monotonicity():
    model = HdtEnergyModelV1()
    empty = model.estimate_segment_energy(10.0, XE_TAI_TRUNG_3T5, payload_kg=0.0)
    loaded = model.estimate_segment_energy(10.0, XE_TAI_TRUNG_3T5, payload_kg=2500.0)

    # Heavier truck must consume strictly more fuel
    assert loaded.fuel_litres > empty.fuel_litres
    assert loaded.ttw_kg_co2 > empty.ttw_kg_co2

def test_emission_factors():
    model = HdtEnergyModelV1()
    est = model.estimate_segment_energy(10.0, XE_TAI_NHO_1T5, payload_kg=300.0)
    # Diesel TTW is 2.68 kg CO2 / Litre
    assert round(est.ttw_kg_co2 / est.fuel_litres, 2) == 2.68
