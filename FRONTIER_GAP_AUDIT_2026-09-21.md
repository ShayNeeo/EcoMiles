# GreenLogix Frontier Plan — Implementation Verification & Gap Audit

**Plan:** `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (2026-09-21)
**Audit date:** 2026-09-21 (Asia/Ho_Chi_Minh)
**Branch:** `so2026` @ `370900c` (`feat(frontier): implement GreenLogix Frontier engineering plan and 24/09 demo slice`)
**Method:** static code read + grep + `uv run pytest -q` (295 pass). No live Valhalla / GOFA key / device test.
**Verdict:** 0/16 CRs fully pass. 10 partial, 6 not started. Demo slice shippable only with honesty downgrades (§23).

---

## 0. Scoreboard

| CR | Title | Status | One-line reason |
|----|-------|--------|-----------------|
| CR-01 | Freeze ground truth + architecture | ❌ FAIL | `routing_quality` missing; `GREENLOGIX_ECO_WEIGHT` still live; worker dup live; CORS `*` |
| CR-02 | Google handoff fix | ⚠️ PARTIAL-PASS | `travelmode=driving` + `dir_action=navigate` done; copy violates §13.2; no telemetry |
| CR-03 | GOFA Places adapter | ⚠️ PARTIAL | Provider + cache + mock done; no API route, no Order provenance, GOFA schema invented (blocker violated) |
| CR-04 | Manager/Driver auth + RBAC | ⚠️ PARTIAL | Guards exist but never enforced in routers; no tenant tables; global PIN `0000` still live |
| CR-05 | Truck profile model | ⚠️ PARTIAL | `TruckProfile` + cache hash done; `Vehicle` table unchanged; hard-coded 3.5t fallback still in code; `run_vrp` never passes profile |
| CR-06 | Self-hosted Valhalla + versioning | ❌ NOT STARTED | No Docker/tiles/manifest/health; public endpoints still production path |
| CR-07 | Restriction overlay | ⚠️ PARTIAL | Rule library done; not wired into routing/solver; no PostGIS, no endpoint, no admin UI |
| CR-08 | Admin boundary segmentation | ⚠️ PARTIAL | Centroid heuristic + breadcrumb UI; not PostGIS polygon intersection; no `/admin-areas` |
| CR-09 | Energy Model V1 | ⚠️ PARTIAL | `hdt_v1.py` + monotonicity tests done; spec lacks mandatory per-equation table; constants drift from spec |
| CR-10 | EcoPath Pareto | ⚠️ PARTIAL-FAIL | 3 cards render; candidates are synthetic `×0.98/×0.96` scalings, not Valhalla alternatives scored by energy model |
| CR-11 | Reference solvers + harness | ❌ NOT STARTED | No PyVRP / OR-Tools / exact oracle / runner |
| CR-12 | EcoALNS v1 | ⚠️ PARTIAL | Scaffold + load-aware evaluator + seed; 1 destroy + 1 repair only; no adaptive/SA/budget/trace |
| CR-13 | EcoALNS v2 operators | ❌ NOT STARTED | No uphill/restriction/ban operators, no ablation |
| CR-14 | Google DRIVE connector | ❌ NOT STARTED | Stub raises `RoadBaselineNotConfigured` (correct); no harness |
| CR-15 | Investor evidence UI | ⚠️ PARTIAL | Policy cards + C1 badge render; no audit drawer, no baseline panel, no C0–C4 ladder |
| CR-16 | Telemetry + calibration | ❌ NOT STARTED | No GPS/OBD ingest, no fit/validate, no error report |

**P-code problems (§2):** P-01 open, P-02 open, P-03 partial, P-04 partial, P-05 open, P-06 open, P-07 partial, P-08 open, P-09 open, P-10 partial. Details in §2 below.

---

## 1. CR-by-CR evidence

### CR-01 — Freeze ground truth and architecture — ❌ FAIL

**Required:** pin branch/commit; ADRs; rename baselines; `routing_quality`; feature flags; frozen fixtures. Acceptance: contract tests pass + snapshot reproducible + no prod change.

| Check | Finding |
|-------|---------|
| ADR | PASS — `docs/adr/0001-authoritative-architecture.md` declares FastAPI authoritative, OSM/Valhalla substrate, PostGIS target, GOFA-Places-only. |
| `routing_quality` | **FAIL — zero hits.** `grep routing_quality\|VERIFIED_GRAPH apps/api/src apps/api/tests` → empty. ADR §C mandates `VERIFIED_GRAPH\|DEGRADED\|UNAVAILABLE` on every optimize response. `routers/optimize.py` returns `routes/totals/baseline/distance_provider/eco_weight` only. |
| Deprecate `GREENLOGIX_ECO_WEIGHT` | **FAIL.** Still live: `solver/eco.py` (`eco_weight_from_env`, `eco_leg_cost`), `solver/__init__.py` (weight plumbing), `schemas.py:128,184`, `routers/optimize.py:64,88,104`, `routers/report.py:38`, `carbon.py:82`. Plan P-01 says deprecate, do not tune. |
| Rename baselines (P-02) | **FAIL.** `RoadBaseline` (road provider) vs `baseline` (spreadsheet order) vs Google "baseline" still conflated. No `RoadGraphProvider` / `OperationalBaseline` / `ExternalBenchmarkRoute` / `ReferenceSolver` rename. |
| Feature flags legacy/new | **FAIL.** No flag. `solver/__init__.py:run_vrp` always runs legacy greedy+NN+2opt. `optimizer/eco_alns.py` is orphan (no caller). |
| Frozen fixtures | **FAIL.** No `fixtures/` snapshot export; reproducibility gate unprovable. |
| Worker freeze | **FAIL.** `apps/worker/src/solver.ts` (370 lines) + `roadBaseline.ts` (346 lines) still implement clustering/2-opt/eco logic. ADR says frozen/deprecated → proxy. Not done. |
| CORS | **FAIL (P-08).** `main.py:79-85` still `allow_origins=["*"]`, `allow_methods=["*"]`, `allow_headers=["*"]`. |

### CR-02 — Google handoff — ⚠️ PARTIAL-PASS (ship with 1-line copy fix)

| Check | Finding |
|-------|---------|
| Flutter | PASS — `apps/mobile-driver/lib/api/maps_link.dart:3-10` uses `Uri.https` with `api=1, destination, travelmode=driving, dir_action=navigate`. Test `test/maps_link_test.dart:8-11` asserts all three. |
| PWA | PASS — `apps/landing/public/driver/index.html:339` builds `.../maps/dir/?api=1&destination=...&travelmode=driving&dir_action=navigate`. |
| Telemetry (§13.4) | **MISSING.** No `navigation_launch_count / launch_to_driving_success / manual_mode_switch_count / handoff_abandon_count`. |
| Copy (§13.2) | **VIOLATION.** Button reads `Chỉ đường (Google Maps · Ô tô / Xe tải)` — implies truck-safe Google route. Plan mandates `Open Google Maps (Driving)` / `Mở Google Maps (Chế độ ô tô)` + disclaimer that Google recomputes its own DRIVE route and truck legality is not outsourced. |
| Device smoke | Unverified (no Android/iOS run in this audit). |

### CR-03 — GOFA Places — ⚠️ PARTIAL (blocker violated)

Done: `places/base.py` (Protocol + DTOs), `places/gofa.py` (quota counters, 1h TTL caches, mock fallback), `places/mock.py` (VN fuzzy search). Tests `test_places.py` mock-only.

| Required | Finding |
|----------|---------|
| Backend-only key | PASS in code (key in `os.getenv`, never in Flutter/bundle). |
| Debounce 250–350ms / min-3-chars / cancel stale / cap | **MISSING.** Provider min length is 2 (`gofa.py:59`), no debounce/cancel/cap — those live in UI layer which was never built. No manager autocomplete UI. |
| Detail only on select + cache by place ID | PASS in provider. |
| Provenance on orders + POI vs snap split (§5.3) | **FAIL.** `models.py:Order` still `address/lat/lng` only. No `place_provider / authoritative_place_id / normalized_address / confidence / admin codes / road snap` fields. |
| `GET /v1/places/autocomplete`, `GET /v1/places/{provider}/{place_id}` | **FAIL.** No places router; `grep places|autocomplete main.py/routers` → empty. Dead code from HTTP path. |
| **Blocker: do not invent GOFA schema** | **VIOLATED.** `gofa.py:76-107` assumes `Bearer` header, `/places/autocomplete?input=&location=&sessiontoken=`, `predictions[].structured_formatting.main_text`. Sponsor docs never supplied; plan §5.5 + CR-03 blocker + agent protocol rule #4 require `BLOCKED` note, not guessed schema. File contains no `BLOCKED` note. |

### CR-04 — Auth/RBAC (§12) — ⚠️ PARTIAL (unenforced)

Done: `auth/models.py` (`MANAGER/DRIVER/ADMIN`), `auth/service.py` (demo + `driver_<plate>` PIN), `auth/dependencies.py` (`require_manager_role`, `require_driver_role`, `verify_driver_plate_access` with dash/dot-insensitive compare), `test_rbac.py`.

| Required | Finding |
|----------|---------|
| Enforcement | **FAIL.** `routers/driver.py:35-81` uses legacy `require_driver`; never calls `verify_driver_plate_access`. `GET /driver/route?plate=` filters by query string — Driver A can pass Driver B's plate. `POST /stops/{id}/status` checks only `published`, never stop→plate ownership. Horizontal tests in `test_rbac.py` cover the helper, not the HTTP path. |
| Tenant tables (§12.1) | **FAIL.** No `organizations/users/memberships/sessions/driver_profiles/vehicle_assignments`. Single `org_demo` hard-coded. |
| Argon2id/JWT/refresh/rate-limit/lockout/audit (§12.3) | **FAIL.** `GREENLOGIX_DEMO=1` gate + `Bearer DEMO` + global PIN `0000` (`service.py:38-45`) remain the production path. |
| Cross-tenant + revoked-session tests (§12.4) | **FAIL.** No org-A vs org-B denial; no revocation test. |
| DISPATCHER role | **MISSING** from enum (only MANAGER/DRIVER/ADMIN). |

### CR-05 — Truck profile — ⚠️ PARTIAL

Done: `geo/truck_profile.py` (frozen dataclass, `to_valhalla_truck_options`, `profile_hash`, 3 VN presets), `road_baseline.py:273-333` (`valhalla_matrix_body(..., truck_profile)`, `ValhallaRoadBaseline.profile_hash`), `materialize_matrix:418` cache key includes `profile_id`.

| Required | Finding |
|----------|---------|
| Vehicle migration | **FAIL.** `models.py:Vehicle` still `plate/type/capacity_kg/fuel/l_per_100km/status`. None of the §2 minimum fields (height/width/length/GVW/empty/payload/axle/fuel/powertrain/rated-L/aero). |
| Per-vehicle Valhalla | **FAIL.** `run_vrp` never builds a profile per vehicle; `_osm_chain`/`resolve_road_baseline` construct `ValhallaRoadBaseline` without profile. Only manually-constructed providers carry one. |
| Remove hard-coded envelope | **FAIL.** `road_baseline.py:284-287` still sends `height 2.4 / width 2.0 / length 5.2 / weight 3.5` when profile is None. |
| Golden test (same OD × 2 profiles → distinct bodies) | PASS in `test_truck_profile.py` at unit level; not end-to-end through `run_vrp`. |
| Full cache key (P-04) | **PARTIAL.** Key = `provider|profile|coords`. Missing `road_graph_version / departure_bucket / restriction_overlay_version / traffic_snapshot / cost_model_version`. |

### CR-06 — Self-hosted Valhalla — ❌ NOT STARTED

No Dockerfile/compose, no OSM extract pin, no elevation tiles, no `/health` graph check, no build manifest, no audit propagation. Production still hits `https://valhalla1.openstreetmap.de` / public OSRM with silent circuity fallback (P-05 open).

### CR-07 — Restriction overlay — ⚠️ PARTIAL (unevaluated library)

Done: `geo/restrictions.py` — Decision 23 light AM/PM + heavy day bans, `A/B/C/D` confidence types, `RestrictionCheckResult`, `DriverRestrictionFeedback(pending_review)` (correct: feedback ≠ production mutation).

**Not done:** never called by solver/Valhalla/evaluator; no PostGIS `restriction_rules` table; no geometry/edge refs (time windows only); no schedule parser beyond window overlap; no `POST /v1/driver/restriction-feedback`; no verification admin UI; no `restriction_coverage HIGH/MED/LOW` on routes; no time-dependent fixture through the real path (unit test only).

### CR-08 — Admin boundaries — ⚠️ PARTIAL (demo heuristic, not GIS)

Done: `geo/admin_boundaries.py` (`RouteAdminTraversal`, `district_breadcrumb`), driver PWA breadcrumb renders.

**Not done:** nearest-centroid lookup (`resolve_nearest_ward`), not PostGIS `LINESTRING × ward polygons`; 9 hard-coded HCMC centroids with pre-2025 district names (Tân Bình / Phú Nhuận / Quận 10 / Quận 3 / Quận 1…) — plan §6 requires versioned post-2025 NSO codes + `admin_boundary_version` on output (code has `VN-NSO-2026.09` constant but no dataset behind it); no `GET /v1/routes/{id}/admin-areas`; no deterministic golden-polyline test.

### CR-09 — Energy V1 — ⚠️ PARTIAL

Done: `docs/research/energy_model_spec.md` (foundations table, tractive equations, TTW/WTW factors, monotonicity invariants), `energy/base.py` protocol, `energy/hdt_v1.py` (roll+grade+aero → traction → engine → fuel → CO2), `test_energy_model.py` (zero-distance, grade/payload monotonicity, factors).

| Required | Finding |
|----------|---------|
| Per-equation trace table (§9.3) | **FAIL.** No `paper+DOI / equation # / variable / unit / value-source / assumption / validity / code-symbol / unit-test` row per equation. Spec is narrative + 4-paper table; missing Wu 2025, 2026 model decision, license/assumption review. Implementation PR merged before review — protocol violation. |
| Constant drift | `P_AUX` 1200 W vs spec 1500 W; `THERMAL_EFFICIENCY` 0.40, `ROLLING_COEFF` 0.008 undocumented in spec table. Minor but breaks "every parameter sourced" rule. |
| Speed/grade/mass sensitivity | Only monotonicity asserts; no sensitivity sweep test. |
| V0 separation | PASS by convention (`carbon.py` accounting vs `energy/` optimization) but no explicit `constant_v0.py` + "not eco-routing" label. |

### CR-10 — EcoPath Pareto — ⚠️ PARTIAL-FAIL (numbers not routed)

`routing/pareto.py:evaluate_pareto_policies` returns FASTEST/ECO_BALANCED/ECO_MAX with SLA-labeled explanations and C1 tier. **But:** eco candidates are arithmetic fictions — `base_km×0.98/×0.96` with hand-picked `speed 33.6/32.2` + `grade 0.4/0.2` — not Valhalla alternate routes scored by `hdt_v1`. No dominance filtering, no `candidate_pareto` honesty label (Stage-1 limitation, §10), no structured "why" facts, no `epsilon=0` SLA invariant test, no determinism-under-pinned-inputs test. UI must label these **illustrative estimates**, not routed alternatives, until Stage 1 is really built.

### CR-11 — Benchmark harness — ❌ NOT STARTED

No `optimizer/pyvrp_reference.py`, `exact_oracle.py`, `benchmark/{datasets,runner,metrics,google_drive}.py`. No `solver | feasible | objective | gap | runtime | seed` table. No Solomon/CVRPLIB/PRP/exact-gold/VN-gold/address-gold/GOOGLE-DRIVE layers (§14).

### CR-12 — EcoALNS v1 — ⚠️ PARTIAL (scaffold)

Done: `optimizer/eco_alns.py` — `CustomerNode/VehicleTour/EcoSolution`, remaining-payload evaluator (correct per §11.5: full load → decrement per delivery, empty return leg), capacity-aware greedy seed, fixed-seed loop, `test_eco_alns.py` determinism.

**Missing vs §11.3:** destroy = random-index only (missing worst-cost/Shaw/cluster/TW-conflict/route/fuel/uphill/restriction/ban); repair = brute-force eco-insert only (missing regret-2/3/k, TW-aware, restriction-aware); no relocate/swap/2-opt/2-opt*/cross/merge-split; no adaptive weights; no SA/record-to-record acceptance (greedy-or-equal only); no runtime budget, convergence trace, `route_legs` payload-bin cache (§11.4). No CURRENT-vs-GLX vs PYVRP comparison; no "beats legacy on declared majority or documented tradeoff" evidence.

### CR-13 — EcoALNS v2 — ❌ NOT STARTED. CR-14 — Google DRIVE — ❌ NOT STARTED (stub correct). CR-16 — Telemetry — ❌ NOT STARTED.

---

## 2. Problem-code audit (§2: P-01…P-10)

| ID | Rule | Status |
|----|------|--------|
| P-01 | Deprecate `(1-w)*km + w*kgCO2` unit mix; Pareto/epsilon instead | **OPEN.** `solver/eco.py:32` still blends km + kgCO2. `pareto.py` adds SLA cards alongside, does not replace. `run_vrp` default path still optimizes the weak weight. |
| P-02 | Rename 4 baselines | **OPEN.** See CR-01. |
| P-03 | Per-vehicle `TruckProfile` | **PARTIAL.** Type exists; DB + request path don't. |
| P-04 | Structured cache key (7 fields) | **PARTIAL.** 3/7 present. |
| P-05 | `routing_quality` + fail-closed publish | **OPEN.** Silent circuity fallback in `materialize_matrix:430-431` returns `CircuityRoadBaseline,"circuity"` with no quality flag; publishable truck routes can be circuity-derived with no label. |
| P-06 | FastAPI authoritative; worker = proxy/BFF | **OPEN.** Duplicated solver + drift risk live. |
| P-07 | Real RBAC | **PARTIAL.** See CR-04. |
| P-08 | CORS allowlist | **OPEN.** `*` in `main.py:81`. |
| P-09 | VRPTW as first-class constraints | **OPEN.** Windows carried as strings on Order/Stop; solver ignores them (no TW check in `sequence_orders`/`tour_km`/ALNS). `CustomerNode` defaults 08:00–11:00 unused by ALNS. |
| P-10 | Optimization vs reporting model split | **PARTIAL.** Modules split; `run_vrp` still reports accounting litres as the optimized objective. No "Model V1 uncalibrated" label enforcement. |

---

## 3. Target-architecture decisions (§4 A–D)

| Decision | Status |
|----------|--------|
| A. FastAPI authoritative | Declared in ADR; violated in practice (worker solver live). |
| B. Postgres+PostGIS target, SQLite demo | SQLite only; no PostGIS migration, no `LINESTRING`/polygon queries. |
| C. Self-hosted Valhalla + pinned snapshot manifest | Not started; audit fields (`osm_snapshot_id/valhalla_version/tile_hash/elevation_version`) absent from all responses. |
| D. OSM substrate + GreenLogix restriction layer (not "OSM knows all") | Restriction type exists; integration absent. Copy risk: PWA "Xe tải" button overclaims. |

---

## 4. 24/09 demo slice (§23 P0 1–10)

| # | Demo function | Status |
|---|---------------|--------|
| 1–2 | Manager / Driver login | ⚠️ Demo tokens only (`Bearer DEMO`, PIN `0000`); acceptable for demo tenant, must be labeled as such. |
| 3 | GOFA autocomplete + detail in order UX | ❌ No UI, no endpoint; mock-only backend. **Cut or fake-data-label.** |
| 4 | Truck profile per vehicle | ⚠️ Presets exist; no vehicle UX/DB. Show as static envelope card, not per-vehicle routing. |
| 5 | Valhalla truck route labeled `Fastest Legal (OSM/Valhalla)` | ⚠️ Engine runs but response carries no quality/model label; circuity can masquerade. Add label + degraded banner before demo. |
| 6 | Route list per driver | ✅ Works (with plate-spoof caveat). |
| 7 | Ward list | ⚠️ Heuristic breadcrumb renders; speak "corridor estimate (centroid demo), not polygon GIS" or cut. |
| 8 | Google Driving handoff | ✅ Works; fix button copy per §13.2. |
| 9 | Benchmark page (manual vs DRIVE vs GLX truck) | ❌ No page; DRIVE unavailable in VN + no harness. Show operational-baseline vs GLX only. |
| 10 | Eco metric | ⚠️ Show **only** as `Estimated fuel — Model GLX-HDT-v1, C1 physics, uncalibrated` (§16.5). Current Pareto deltas are illustrative, not routed. |

**Mandatory demo honesty line (§23):** *"Current release provides truck-aware routing and route/fleet optimization; the research eco-cost engine is being validated against peer-reviewed heavy-duty fuel models. Current CO₂ is an accounting estimate, not yet the optimization objective."* — keep this on every savings slide until CR-09 review + CR-10 reranking land.

---

## 5. Gaps that must be fixed before any "better / truck-safe / ISO" claim (§25)

1. `routing_quality` + fail-closed publish (P-05) — else circuity routes present as truck-safe.
2. Enforce `verify_driver_plate_access` in `driver.py` or remove plate query param — horizontal spoof today.
3. CORS allowlist + demo-vs-prod config split (P-08).
4. GOFA: replace invented schema with sponsor docs or file `BLOCKED` note; add endpoint + provenance fields before claiming "resolved through GOFA".
5. Pareto: wire Valhalla alternatives → `hdt_v1` scoring → dominance filter; label current cards illustrative.
6. Never say ISO certified / truck-safe guarantee / % savings without denominator + model + confidence + measured-vs-estimated (§16, §25).

---

## 6. Recommended next diffs (smallest first)

1. **Copy (5 min):** PWA button → `Chỉ đường (Google Maps · Ô tô)` + footnote *"Google tự tính lại lộ trình ô tô; không thay thế kiểm soát tải trọng GreenLogix."*
2. **`routing_quality` (1–2 h):** thread provider name through `materialize_matrix`; return `VERIFIED_GRAPH` (valhalla/osrm) vs `DEGRADED` (circuity) vs `UNAVAILABLE`; banner in dispatcher/driver UI; fail-closed publish flag.
3. **Driver horizontal guard (1 h):** call `verify_driver_plate_access` in `GET /driver/route` + `POST /stops/{id}/status` (resolve stop→route→plate); add HTTP-level A-vs-B tests.
4. **CORS (15 min):** env allowlist (`GREENLOGIX_CORS_ORIGINS`), demo-only `*`.
5. **Eco honesty (30 min):** deprecate `GREENLOGIX_ECO_WEIGHT` in docs/logs (warn when >0); label Pareto UI `candidate_pareto · illustrative`.
6. **GOFA honesty (30 min):** add `BLOCKED: actual Places base URL/auth/schema/ToS` note in `places/gofa.py` + `docs/research/gofa-blocked.md`; cut GOFA claims from demo script until docs arrive.
7. Then: Valhalla manifest → PostGIS → VRPTW → PyVRP harness → ALNS operators → telemetry (plan order CR-06 → CR-16).

---

## 7. What is genuinely done (credit)

- Google handoff params (Flutter + PWA) + regression test.
- `PlaceProvider` seam + quota-aware client + mock + tests.
- `TruckProfile` physics envelope + Valhalla mapping + partial cache key.
- Scoped driver identity + plate guard helper + RBAC tests (needs wiring).
- Decision-23 rule encode + feedback pending-review discipline.
- Admin breadcrumb UX concept.
- GLX-HDT-v1 tractive physics + monotonicity gates + TTW/WTW factors.
- Pareto 3-policy UX shape + C1 badge concept.
- EcoALNS scaffold with correct remaining-payload evaluator + determinism.
- 295 pytest green; Flutter `maps_link` green; landing builds; Playwright screenshots exist.

---

*End of audit. Raw grep/read log available on request. Next step: approve §6 order or re-scope 24/09 demo to the honesty slice in §4.*
