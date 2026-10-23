"""Heavy-Duty Truck Physics Energy Model V1 (GLX-HDT-v1).

Formulated from Bektaş & Laporte (2011) PRP tractive equations, Rakha (2017)
convex diesel model, and Scora et al. (2015) truck eco-routing.
"""

from __future__ import annotations

import math

from greenlogix_api.energy.base import EnergyEstimate, EnergyModel
from greenlogix_api.geo.truck_profile import TruckProfile

GRAVITY = 9.80665
AIR_DENSITY = 1.205  # kg/m^3 at sea level, 25C
ROLLING_COEFF = 0.008
DRIVELINE_EFFICIENCY = 0.88
THERMAL_EFFICIENCY = 0.40
DIESEL_HEATING_VALUE_J_KG = 43.2e6
DIESEL_DENSITY_G_L = 840.0
# P_AUX fixed at 1500 W (single source of truth, matches spec Section 2.2).
# Measured engineering assumption for HCMC tropical ops (alternator + power
# steering + AC/air compression, conservative upper bound). External bench
# source: BLOCKED (pending OBD calibration) — do not cite a paper/DOI here.
# See docs/research/energy_model_spec.md Section 5 trace row E-07.
P_AUX_WATTS = 1500.0

# GLEC 3.2 / ISO 14083 factors (kg CO2e per Litre)
DIESEL_TTW_FACTOR = 2.68
DIESEL_WTW_FACTOR = 3.24
PETROL_TTW_FACTOR = 2.31
PETROL_WTW_FACTOR = 2.82


class HdtEnergyModelV1(EnergyModel):
    """Heavy-Duty Diesel Commercial Vehicle Physics Energy Model."""

    def __init__(self, version_name: str = "GLX-HDT-v1.0") -> None:
        self.version_name = version_name

    def estimate_segment_energy(
        self,
        length_km: float,
        profile: TruckProfile,
        payload_kg: float,
        speed_kmh: float = 32.0,
        grade_percent: float = 0.0,
    ) -> EnergyEstimate:
        if length_km <= 0.0:
            return EnergyEstimate(
                fuel_litres=0.0,
                duration_seconds=0.0,
                mechanical_energy_kwh=0.0,
                ttw_kg_co2=0.0,
                wtw_kg_co2=0.0,
                model_version=self.version_name,
            )

        # 1. Kinematics
        v_ms = max(5.0, min(speed_kmh, 90.0) / 3.6)
        dist_m = length_km * 1000.0
        duration_s = dist_m / v_ms

        # 2. Total Vehicle Mass
        total_mass_kg = profile.empty_weight_kg + max(0.0, min(payload_kg, profile.max_payload_kg))

        # 3. Forces (N)
        theta_rad = math.atan(grade_percent / 100.0)
        f_roll = ROLLING_COEFF * total_mass_kg * GRAVITY * math.cos(theta_rad)
        f_grade = total_mass_kg * GRAVITY * math.sin(theta_rad)
        f_aero = 0.5 * AIR_DENSITY * profile.cd * profile.frontal_area_m2 * (v_ms**2)

        f_total = f_roll + f_grade + f_aero

        # 4. Power & Mechanical Energy
        p_traction_w = max(0.0, f_total * v_ms)
        p_engine_w = (p_traction_w / DRIVELINE_EFFICIENCY) + P_AUX_WATTS
        mech_kwh = (p_engine_w * duration_s) / 3.6e6

        # 5. Fuel Consumption (Litres)
        # Total fuel energy needed (Joules)
        fuel_energy_j = (p_engine_w / THERMAL_EFFICIENCY) * duration_s
        fuel_mass_g = (fuel_energy_j / DIESEL_HEATING_VALUE_J_KG) * 1000.0
        litres = max(0.001, fuel_mass_g / DIESEL_DENSITY_G_L)

        # 6. Carbon Emissions (kg CO2e)
        is_petrol = profile.fuel_type == "petrol"
        ttw_factor = PETROL_TTW_FACTOR if is_petrol else DIESEL_TTW_FACTOR
        wtw_factor = PETROL_WTW_FACTOR if is_petrol else DIESEL_WTW_FACTOR

        ttw_co2 = litres * ttw_factor
        wtw_co2 = litres * wtw_factor

        return EnergyEstimate(
            fuel_litres=round(litres, 4),
            duration_seconds=round(duration_s, 1),
            mechanical_energy_kwh=round(mech_kwh, 4),
            ttw_kg_co2=round(ttw_co2, 4),
            wtw_kg_co2=round(wtw_co2, 4),
            model_version=self.version_name,
        )
