from greenlogix_api.geo.truck_profile import XE_TAI_NHO_1T5
from greenlogix_api.routing.pareto import evaluate_pareto_policies


def test_evaluate_pareto_policies_structure():
    candidates = evaluate_pareto_policies(base_km=30.0, profile=XE_TAI_NHO_1T5, payload_kg=600.0)
    assert len(candidates) == 3

    fastest, balanced, eco_max = candidates[0], candidates[1], candidates[2]

    assert fastest.policy == "FASTEST_LEGAL"
    assert balanced.policy == "ECO_BALANCED"
    assert eco_max.policy == "ECO_MAX"

    # Eco Balanced saves fuel with <= 5% time penalty
    assert balanced.fuel_litres < fastest.fuel_litres
    assert balanced.time_penalty_pct <= 5.5

    # Eco Max saves most fuel with <= 10% time penalty
    assert eco_max.fuel_litres < balanced.fuel_litres
    assert eco_max.time_penalty_pct <= 10.5
