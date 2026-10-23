# GreenLogix Energy Model V1 Specification (GLX-HDT-v1)

**Version:** 1.0.0 (Research Specification)  
**Date:** 2026-09-21  
**Author:** GreenLogix Core Systems Team  
**Scope:** Heavy-duty and medium diesel commercial vehicle energy & fuel consumption estimation for Vietnam urban freight operations.

---

## 1. Scientific Foundations & Canonical Literature

| Foundation | Canonical Reference | DOI / Source | Role in GreenLogix |
|---|---|---|---|
| **Pollution-Routing Problem (PRP)** | Bektaş & Laporte (2011), *Transp. Res. Part B* 45(8):1232–1250 | `10.1016/j.trb.2011.02.004` | Theoretical formulation relating payload, speed, and grade to mechanical power. |
| **Heavy-Duty Truck Eco-Routing** | Scora, Boriboonsomsin & Barth (2015), *Res. Transp. Econ.* 52:3–14 | `10.1016/j.retrec.2015.10.002` | Practical multi-criteria fuel/time Pareto trade-off for urban and arterial road freight. |
| **Convex HDT Fuel Model** | Rakha et al. (2017), *Transp. Res. Part D* 55:127–141 | `10.1016/j.trd.2017.06.011` | Tractable convex fuel rate calculation calibrated across diesel truck weight classes. |
| **Uneven Topography PRP** | Lai et al. (2024), *Comput. Oper. Res.* 164:106557 | `10.1016/j.cor.2024.106557` | Load-dependent sequence ordering: dropping heavy cargo before steep gradients. |

---

## 2. Mechanical Equations & Governing Physics

For a road segment of length $d$ (meters) traversed at average speed $v$ ($m/s$) on road angle $\theta$ (radians) with vehicle total mass $M = M_{\text{empty}} + M_{\text{payload}}$ ($kg$):

### 2.1 Total Resistant Force ($F_{\text{total}}$)

$$F_{\text{total}} = F_{\text{roll}} + F_{\text{grade}} + F_{\text{aero}}$$

Where:
- **Rolling resistance:** $F_{\text{roll}} = C_r \cdot M \cdot g \cdot \cos(\theta)$
- **Gravitational gradient force:** $F_{\text{grade}} = M \cdot g \cdot \sin(\theta)$
- **Aerodynamic drag:** $F_{\text{aero}} = \frac{1}{2} \cdot \rho_{\text{air}} \cdot C_d \cdot A \cdot v^2$

### 2.2 Tractive Power Demand ($P_{\text{traction}}$)

$$P_{\text{traction}} = \max\left(0, F_{\text{total}} \cdot v\right)$$

Total engine brake power:
$$P_{\text{engine}} = \frac{P_{\text{traction}}}{\eta_{\text{driveline}}} + P_{\text{aux}}$$

Where:
- $\eta_{\text{driveline}} \approx 0.88$ (mechanical transmission efficiency).
- $P_{\text{aux}} \approx 1500\text{ W}$ (alternator, power steering, climate/air compression).

### 2.3 Fuel Consumption Rate ($\dot{m}_f$)

Fuel mass flow rate in $g/s$:
$$\dot{m}_f = \frac{\xi}{\kappa \cdot \psi} \cdot \left(k \cdot N \cdot V_{\text{disp}} + \frac{P_{\text{engine}}}{\eta_{\text{thermal}}}\right)$$

For operational simulation over segment of duration $t = d / v$ (seconds):
$$\text{Litres consumed} = \frac{\dot{m}_f \cdot t}{\rho_{\text{diesel}} \cdot 1000}$$

Where:
- $\rho_{\text{diesel}} \approx 0.84\text{ kg/L}$.
- Heating value $\psi \approx 43.2\text{ MJ/kg}$.
- Engine friction factor $k \approx 0.20\text{ kJ/(rev}\cdot\text{L)}$.
- Engine speed $N \approx 28\text{ rev/s}$ (1680 RPM).

---

## 3. Physical Monotonicity Invariants (Mandatory Test Gates)

1. **Grade Monotonicity:**  
   $$\frac{\partial \text{Fuel}}{\partial \theta} > 0 \quad (\text{uphill segment consumes strictly more fuel than identical flat segment}).$$
2. **Payload Monotonicity:**  
   $$\frac{\partial \text{Fuel}}{\partial M_{\text{payload}}} > 0 \quad (\text{heavier truck load consumes strictly more fuel in identical driving conditions}).$$
3. **Zero Movement Boundary:**  
   $$\lim_{d \to 0} \text{Movement Fuel}(d) = 0.$$
4. **Speed Non-Linearity:**  
   Aerodynamic drag scales quadratically with speed ($v^2$); excessive urban acceleration incurs steep fuel penalties.

---

## 4. Carbon Accounting Methodology (ISO 14083 / GLEC 3.2 Alignment)

- **TTW (Tank-to-Wheel) Emission Factor:**
  - Diesel: $2.68\text{ kg CO}_2\text{e} / \text{Litre}$.
  - Petrol: $2.31\text{ kg CO}_2\text{e} / \text{Litre}$.
- **WTW (Well-to-Wheel) Full Lifecycle Factor:**
  - Diesel: $3.24\text{ kg CO}_2\text{e} / \text{Litre}$.
  - Petrol: $2.82\text{ kg CO}_2\text{e} / \text{Litre}$.
- **Safe Claim Guard:** GreenLogix reports modeled fuel and GLEC-aligned estimates, never asserting certified third-party audit status until empirical OBD calibration trials are completed.

---

## 5. Per-Equation Trace Table (T-LOOP-ENERGY, Audit §2.10)

Every computation in `apps/api/src/greenlogix_api/energy/hdt_v1.py` traced below. Paper eq# values are `BLOCKED` unless the exact paper equation number has been verified against the source text — internal `GLX §ref` gives the operative definition. No new papers/DOIs introduced here; `BLOCKED` means missing, never guessed.

| Trace | Code symbol | Equation / variable | Unit | Paper + DOI | Eq# | Source | Assumption | Validity | Test |
|---|---|---|---|---|---|---|---|---|---|
| E-01 | `v_ms` | Speed clamp `max(5, min(speed_kmh,90))/3.6` (§2, kinematics) | m/s | BLOCKED | BLOCKED | GLX §2 engineering clamp | Urban truck cruise band; avoids divide-by-zero and aero blowup | 5–90 km/h only; outside band clamped, not modeled | `test_energy_trace.py::test_trace_table_covers_all_symbols` (symbol present) |
| E-02 | `dist_m`, `duration_s` | `dist_m = length_km*1000`; `duration_s = dist_m/v_ms` | m; s | Bektaş & Laporte (2011) `10.1016/j.trb.2011.02.004` | BLOCKED | PRP time = distance/speed definition | Constant average speed per segment; no accel/decel profile | Flat constant-speed segments; HCMC urban blocks | `test_energy_model.py::test_energy_zero_distance` |
| E-03 | `total_mass_kg` | `M = M_empty + clamp(payload,0,max_payload)` | kg | Bektaş & Laporte (2011) `10.1016/j.trb.2011.02.004` | BLOCKED | PRP mass-dependent load term | Payload capped at rated max; overload not modeled | 0 ≤ payload ≤ rated max | `test_energy_model.py::test_payload_monotonicity` |
| E-04a | `f_roll` | `F_roll = C_r·M·g·cos θ` | N | Bektaş & Laporte (2011) `10.1016/j.trb.2011.02.004` | BLOCKED | PRP rolling resistance | `C_r = 0.008` truck-tyre asphalt constant (see E-08) | Dry asphalt, steady roll; wet/off-road excluded | `test_energy_model.py::test_payload_monotonicity` |
| E-04b | `f_grade` | `F_grade = M·g·sin θ`, `θ = atan(grade%/100)` | N; rad | Lai et al. (2024) `10.1016/j.cor.2024.106557` | BLOCKED | Grade force from road angle | Small-angle road grade; grade% input from router | −15%…+15% grade; beyond that unvalidated | `test_energy_model.py::test_grade_monotonicity` |
| E-04c | `f_aero` | `F_aero = ½·ρ·C_d·A·v²` | N | Scora et al. (2015) `10.1016/j.retrec.2015.10.002` | BLOCKED | Standard aerodynamic drag | `ρ = 1.205 kg/m³` (25 °C sea level); `C_d`, `A` per truck profile | Urban speeds; crosswind ignored | `test_energy_trace.py::test_aero_quadratic_scaling` |
| E-04d | `f_total` | `F_total = F_roll + F_grade + F_aero` | N | Bektaş & Laporte (2011) `10.1016/j.trb.2011.02.004` | BLOCKED | PRP tractive-force sum | Superposition; no tyre-slip/transient terms | Same limits as E-04a–c | `test_energy_model.py::test_grade_monotonicity` |
| E-05a | `p_traction_w` | `P_traction = max(0, F_total·v)` | W | Bektaş & Laporte (2011) `10.1016/j.trb.2011.02.004` | BLOCKED | Power = force × velocity; downhill regen clipped to 0 (no regen for diesel) | No regenerative braking; engine braking dissipates | Diesel only; downhill coasting fuel floor via E-06 `max(0.001,…)` | `test_energy_model.py::test_grade_monotonicity` |
| E-05b | `p_engine_w` | `P_engine = P_traction/η_driveline + P_aux` | W | Rakha et al. (2017) `10.1016/j.trd.2017.06.011` | BLOCKED | Driveline loss + auxiliary load | `η_driveline = 0.88`; `P_aux = 1500 W` (see E-07) | Steady cruise; transient accessory spikes excluded | `test_energy_trace.py::test_p_aux_single_value` |
| E-05c | `mech_kwh` | `mech = P_engine·duration/3.6e6` | kWh | BLOCKED | BLOCKED | GLX §2.2 energy integration | Constant power over segment | Same as E-02 | `test_energy_model.py::test_grade_monotonicity` |
| E-06a | `fuel_energy_j` | `E_fuel = (P_engine/η_thermal)·duration` | J | Rakha et al. (2017) `10.1016/j.trd.2017.06.011` | BLOCKED | Convex diesel fuel-rate, thermal efficiency form | `η_thermal = 0.40` modern diesel peak; part-load curve flattened | Cruise load; idle/part-load map uncalibrated | `test_energy_model.py::test_emission_factors` |
| E-06b | `fuel_mass_g`, `litres` | `m = E_fuel/ψ·1000`; `L = max(0.001, m/840)` | g; L | BLOCKED | BLOCKED | GLX §2.3 diesel conversion | `ψ = 43.2 MJ/kg`; `ρ_diesel = 840 g/L`; 0.001 L floor avoids zero-division | Diesel EN 590 approx; biodiesel blends excluded | `test_energy_model.py::test_emission_factors` |
| E-07 | `P_AUX_WATTS` | Auxiliary load, single value **1500 W** | W | BLOCKED | BLOCKED | Measured engineering assumption (HCMC tropical: alternator + power steering + AC/air compression, conservative upper bound); pending OBD calibration | Replaces drifted 1200 W code / 1500 W spec pair (T-LOOP-ENERGY D1); code + spec now both 1500 W | HCMC truck AC-on ops; AC-off overestimates ~300 W — flagged, not modeled | `test_energy_trace.py::test_p_aux_single_value` |
| E-08 | `GRAVITY`, `AIR_DENSITY`, `ROLLING_COEFF`, `DRIVELINE_EFFICIENCY`, `THERMAL_EFFICIENCY`, `DIESEL_*` | Physical constants table (code lines 13–19) | mixed | BLOCKED | BLOCKED | Standard constants + GLX assumptions (`g = 9.80665`; `ρ_air = 1.205`; `C_r = 0.008`; `η` per E-05/E-06) | Sea-level 25 °C air; asphalt tyres; modern diesel | Vietnam lowland urban; highland cold air unadjusted | `test_energy_trace.py::test_trace_table_covers_all_symbols` |
| E-09 | `ttw_kg_co2`, `wtw_kg_co2` | `TTW = L·2.68`; `WTW = L·3.24` (petrol 2.31/2.82) | kg CO₂e | GLEC 3.2 / ISO 14083 (reporting alignment, no cert claim) | BLOCKED | GLEC factors §4 | Factors are reporting estimates; **never certified** until OBD trials | Diesel/petrol litres only; electric excluded | `test_energy_model.py::test_emission_factors` |
| E-10 | Pareto scalings | `ECO_BALANCED 0.98 km @33.6 km/h g0.4%`; `ECO_MAX 0.96 km @32.2 km/h g0.2%` vs `FASTEST 35 km/h g1.2%` | mixed | BLOCKED | BLOCKED | `routing/pareto.py` fixed illustrative factors | **Illustrative only** (`illustrative=True`); no Valhalla dominance claim until rerank harness | Do not use for customer savings guarantees | `test_energy_trace.py::test_pareto_illustrative_flag` |

**Drift fix record (D1):** `P_AUX` was 1200 W in code vs 1500 W in spec §2.2. Fixed to single value **1500 W** in both (`hdt_v1.py:P_AUX_WATTS`, spec §2.2). Basis: conservative HCMC AC-on assumption; external bench citation BLOCKED pending OBD trials. Monotonicity tests unaffected (additive constant).
