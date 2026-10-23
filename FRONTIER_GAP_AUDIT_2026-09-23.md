# GreenLogix Frontier Plan — Implementation Verification & Gap Audit (Loop-Final)

**Plan:** `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (2026-09-21)
**Audit date:** 2026-09-23 (Asia/Ho_Chi_Minh)
**Branch:** `so2026`
**Method:** static code read + grep + `uv run pytest -q` from `apps/api` (**407 passed**, up from 325). No live Valhalla tiles / GOFA key / device test / OBD trials.
**Verdict:** 0/16 CRs fully pass. **16 PARTIAL, 0 NOT STARTED.** All four loop batches wired (§1); every former NOT STARTED now has an honest scaffold with BLOCKED/infra notes (§2).

> Footnote on counts: 09-21 stated "0/10/6" (10 partial + 6 not-started = 16). 09-22 corrected the partition to 0/11/5 (CR-12 was PARTIAL, not NOT STARTED). This revision: the 5 former NOT STARTED (CR-11, 13, 14, 15, 16) each landed a scaffold — harness stub, ALNS operators, DRIVE stub raise, C1 evidence payload, telemetry ingest stub — so at CR level the honest partition is now **0/16/0**. Sub-item gaps that are still genuinely untouched (PostGIS polygons, Valhalla tiles/Docker build, full JWT/Argon2id) are recorded per-CR below, not as whole-CR NOT STARTED.[^1]

[^1]: Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` and `FRONTIER_GAP_AUDIT_2026-09-22.md` remain untouched; this is the new dated revision.

**Contract:** `apps/api/openapi.json` holds **18 paths** (was 17; `GET /routes/{id}/admin-areas` added, additive only). Banned-claims grep clean (no truck-safe guarantee, no ISO-certified wording — `carbon.py:16` wording contract enforced, every ISO/GLEC mention carries "not certified"). `.opencode-state/betriebsrat/vetoes/` empty.

---

## 0. Scoreboard

| CR | Title | Status | One-line reason | Evidence |
|----|-------|--------|-----------------|----------|
| CR-01 | Freeze ground truth + architecture | ⚠️ PARTIAL | Publish guard + manifest propagation + CORS split wired; manifest values still dev placeholders, no tiles | `routers/optimize.py:154-168`; `solver/flags.py:30-37`; `carbon.py:94-96`; `main.py:53-65,113-131`; `tests/test_publish_guard.py`, `test_manifest_propagation.py` |
| CR-02 | Google handoff fix | ⚠️ PARTIAL | Ô tô copy + disclaimer done; navigation-launch telemetry still missing | `apps/landing/public/driver/index.html:343`; `maps_link.dart` |
| CR-03 | GOFA Places adapter | ⚠️ PARTIAL | BLOCKED note kept; additive provenance passthrough, no real contract/UI | `places/gofa.py:24-30`; `models.py:24-26`; `serialize.py:27`; `schemas.py:44`; `tests/test_places_provenance.py` |
| CR-04 | Manager/Driver auth + RBAC | ⚠️ PARTIAL | PIN gate + lockout stub + tenant-plate guard; full JWT/Argon2id/DB tables missing | `auth/service.py:3-84`; `auth/legacy.py:1-21`; `auth/dependencies.py:40-68`; `auth/models.py:23-29`; `tests/test_auth_hardening.py`, `test_tenant_isolation.py`, `test_driver_authz.py` |
| CR-05 | Truck profile model | ⚠️ PARTIAL | Per-vehicle wiring + e2e test; Vehicle DB migration fields missing | `solver/__init__.py:266-310`; `geo/truck_profile.py:56-86`; `tests/test_truck_e2e.py`, `test_truck_profile.py` |
| CR-06 | Self-hosted Valhalla + versioning | ⚠️ PARTIAL | Manifest + health versions + propagation; Docker/tiles/elevation NOT built | `geo/road_graph.py:94`; `data/road_graph.json` (7 keys); `main.py:113-131`; `schemas.py:23`; `docs/adr/0002`; `tests/test_road_graph.py`, `test_health_graph.py` |
| CR-07 | Restriction overlay | ⚠️ PARTIAL | Coverage label wired into solver output; PostGIS table + feedback endpoint missing | `solver/road_baseline.py:515-562`; `solver/__init__.py:89,340`; `geo/restrictions.py:16-51` |
| CR-08 | Admin boundary segmentation | ⚠️ PARTIAL | Versioned `admin-areas` endpoint; centroid fallback only, no PostGIS polygons | `routers/optimize.py:181-201`; `geo/admin_boundaries.py:53-93`; `docs/research/admin_boundaries.md`; `tests/test_admin_areas.py` |
| CR-09 | Energy Model V1 | ⚠️ PARTIAL | Trace table + P_AUX single-value 1500 W fix; OBD calibration BLOCKED | `energy/hdt_v1.py:20-25,76`; `docs/research/energy_model_spec.md:100-109`; `tests/test_energy_trace.py` |
| CR-10 | EcoPath Pareto | ⚠️ PARTIAL | `source` label (`verified`/`illustrative`) + C1 tier; candidates still illustrative scalings | `routing/pareto.py:26-52,146-168`; `tests/test_pareto_rerank.py` |
| CR-11 | Reference solvers + harness | ⚠️ PARTIAL | Harness table (`solver\|feasible\|objective\|gap\|runtime\|seed`) + 2 ref solvers; no PyVRP/OR-Tools deps | `benchmark/harness.py:25,47`; `benchmark/solvers_ref.py:17,39`; `tests/test_harness.py` |
| CR-12 | EcoALNS v1 | ⚠️ PARTIAL | Scaffold + evaluator + seed + determinism; hill-climb only, no SA/budget/trace | `optimizer/eco_alns.py:297-338`; `tests/test_eco_alns.py` (prior) |
| CR-13 | EcoALNS v2 operators | ⚠️ PARTIAL | 2 destroy + 2 repair + adaptive weights; no uphill/restriction/ban ops, no ablation | `optimizer/eco_alns.py:131-279`; `tests/test_alns_operators.py` |
| CR-14 | Google DRIVE connector | ⚠️ PARTIAL | Stub raises `RoadBaselineNotConfigured` correctly; no harness/traffic wiring | `solver/road_baseline.py:64,375-386` |
| CR-15 | Investor evidence UI | ⚠️ PARTIAL | `C1-illustrative` payload + spec; no audit drawer / baseline panel / C0–C4 ladder | `carbon.py:18-28,102`; `docs/research/evidence_ui.md:47-83`; `tests/test_evidence.py` |
| CR-16 | Telemetry + calibration | ⚠️ PARTIAL | Fuel-obs ingest stub + `mae_mape`; no GPS/OBD live feed | `telemetry/ingest.py:18-90`; `telemetry/calibration.py:8`; `tests/test_telemetry.py` |

Strict rule applied: PASS only on full acceptance. Every CR has real wired evidence but also a named remainder, hence 16× PARTIAL.

---

## 1. Loop confirmations (what the 4 iterations closed)

| # | Gap from 09-22 §2 | State | Evidence |
|---|-------------------|-------|----------|
| 1 | Wire fail-closed publish | ✅ DONE | `routers/optimize.py:154-168` calls `publish_blocked_for_quality()`; 403 when `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` + quality ≠ `VERIFIED_GRAPH`; `solver/flags.py:30-37` single decision point; `tests/test_publish_guard.py` |
| 2 | Wire manifest propagation | ✅ DONE | `routers/optimize.py:62-64` merges `road_graph_audit_extra()` into persist path; `carbon.py:94-96` merges into report extra; 7 keys asserted in `tests/test_manifest_propagation.py` |
| 3 | CORS prod split | ✅ DONE (code) | `main.py:53-65` `_cors_origins()`; demo-only `*` gated on `GREENLOGIX_DEMO=1` + empty allowlist; `.env.example` documents prod `GREENLOGIX_CORS_ORIGINS`; ops value pending per-deploy |
| 4 | Demo PIN gate | ✅ DONE (code) | `auth/service.py:53` returns 401 unless `GREENLOGIX_DEMO=1`; `auth/legacy.py:17-21` PIN `0000` demo-only; `_pin_lockout_active` / `record_pin_attempt` stub `auth/service.py:21-43`; `tests/test_auth_hardening.py` |
| 5 | GOFA provenance | ✅ SCAFFOLD | `models.py:24-26` nullable provenance fields; `serialize.py:27` + `schemas.py:44` passthrough; `gofa.py:24-30` BLOCKED note retained — no invented schema |
| 6 | Truck profile e2e | ✅ DONE | `solver/__init__.py:266-277` `profiles_for_vehicles`, `:280-295` primary-profile selection, `:298-310` provider injection; `tests/test_truck_e2e.py` |
| 7 | Full cache key (7 components) | ✅ DONE | `solver/road_baseline.py:435-513` 6 version tokens + coords; manifest-backed with offline-safe fallbacks; env-bucketed departure/traffic for CI determinism |
| 8 | Restriction wiring | ✅ SCAFFOLD | `solver/road_baseline.py:515-562` coverage labeling; `solver/__init__.py:340` per-plan evaluation, `:89,405` output field; fail-open to `unchecked`, never raises |
| 9 | Energy trace + P_AUX | ✅ DONE | `energy/hdt_v1.py:20-25` single value 1500 W; spec trace rows E-05b/E-07 + drift-fix record `energy_model_spec.md:100-109`; `tests/test_energy_trace.py` |
| 10 | Pareto rerank label | ✅ DONE | `routing/pareto.py:26-52` `CandidateSource` verified/illustrative with `illustrative` auto-derived; circuity always illustrative; `tests/test_pareto_rerank.py` |
| 11 | Harness (CR-11) | ✅ SCAFFOLD | `benchmark/harness.py:25` required cols, `:47` `run_comparison`; `benchmark/solvers_ref.py:17,39` deterministic NN-2opt + greedy; `tests/test_harness.py` |
| 12 | Evidence C1 (CR-15) | ✅ SCAFFOLD | `carbon.py:18-28` `EVIDENCE_CONFIDENCE = "C1-illustrative"` + `EVIDENCE_ISO_NOTE` with "not certified"; `docs/research/evidence_ui.md`; `tests/test_evidence.py` |
| 13 | Telemetry (CR-16) | ✅ SCAFFOLD | `telemetry/ingest.py:18-90` FuelObs validate/append/list/save/load; `telemetry/calibration.py:8` mae_mape; `tests/test_telemetry.py` |
| 14 | DRIVE stub (CR-14) | ✅ SCAFFOLD | `solver/road_baseline.py:375-386` raises `RoadBaselineNotConfigured` (correct fail, no fake data) |
| 15 | Admin-areas endpoint (CR-08) | ✅ SCAFFOLD | `routers/optimize.py:181-201` (18th contract path); `geo/admin_boundaries.py:53-93` versioned lookup, centroid-fallback honesty note `:81`; `docs/research/admin_boundaries.md` |
| 16 | ALNS operators (CR-13) | ✅ SCAFFOLD | `optimizer/eco_alns.py:131-159` 2 destroy ops, `:171-248` greedy + regret-2 repair, `:265-279` adaptive weights; hill-climb acceptance documented `:304`; `tests/test_alns_operators.py` |
| 17 | Tenant isolation (CR-04) | ✅ SCAFFOLD | `auth/dependencies.py:40-68` org + tenant-plate guards; `auth/models.py:23-29` in-memory org scope with BLOCKED-DB note; `tests/test_tenant_isolation.py` |
| 18 | Health versions (CR-06) | ✅ DONE | `main.py:113-131` `/health` returns manifest versions + reachability probe, offline-safe 200; `schemas.py:23`; `tests/test_health_graph.py` |

Test progression across the loop: 325 → 333 → 360 → 375 → 390 → **407 passed** (`apps/api`, 42 test files). New files this loop include `benchmark/`, `telemetry/`, `geo/road_graph.py`, `solver/flags.py`, and 15+ `test_*.py` gates.

---

## 2. Remaining gaps (smallest first — honest BLOCKED/infra)

1. **CORS prod value (ops, 15 min):** code split done; set real `GREENLOGIX_CORS_ORIGINS` per deploy, verify no `*` outside demo.
2. **Lockout enforcement (1–2 h):** PIN-attempt recording stub exists; add threshold response + tests before any Cloud demo with strangers.
3. **GOFA real contract (BLOCKED on sponsor docs):** endpoint + UI + debounce/cancel/cap all wait on official base URL/auth/schema. Provenance fields ready to receive it.
4. **Vehicle DB migration (2–3 h):** envelope fields (height/width/length/GVW/axle/powertrain/rated-L/aero) still not on `Vehicle`; per-vehicle wiring consumes them once migrated.
5. **Restriction feedback endpoint (3–5 h):** `POST /v1/driver/restriction-feedback` + verification queue + PostGIS `restriction_rules` table.
6. **PostGIS admin polygons (1–2 d, NOT STARTED at infra level):** `LINESTRING × ward polygons`, versioned NSO dataset; endpoint shape already exists so the swap is contained.
7. **Valhalla tiles/Docker/elevation (3–5 d, NOT STARTED at infra level):** manifest carries dev placeholders (`unpinned-dev`); snapshot pin + tile build + `/health` reachability flip to True.
8. **Pareto Valhalla rerank Stage-1 (1–2 d):** alternatives → `hdt_v1` scoring → dominance filter; `source="verified"` path already defined, unreachable until tiles land.
9. **PyVRP/OR-Tools + Solomon/CVRPLIB (3–5 d):** harness table ready; external solver deps + dataset runner missing.
10. **ALNS v2 remainder (1–2 w):** SA/record-to-record acceptance, runtime budget + convergence trace, uphill/restriction/ban operators, ablation study.
11. **Full JWT/Argon2id/tenant tables (1–2 w):** demo gate is correct fail-closed posture, but production auth is a rebuild, not a tweak.
12. **Telemetry live + DRIVE + evidence UI (2–4 w):** GPS/OBD feed, GOOGLE-DRIVE benchmark layer, audit drawer / baseline panel / C0–C4 ladder.

---

## 3. Demo honesty slice (24/09 — what can ship)

- **Routing label:** every route shows `routing_quality`: `VERIFIED_GRAPH` or **`DEGRADED` (circuity estimate — not truck-verified)**. Fail-closed publish now enforced when `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` — circuity routes get 403, say so.
- **PWA button:** `Chỉ đường (Google Maps · Ô tô)` + footnote *"Google tự tính lại lộ trình ô tô; không thay thế kiểm soát tải trọng GreenLogix."* No `Xe tải` claims.
- **Eco metric:** show only as `Estimated fuel — Model GLX-HDT-v1, C1 physics, uncalibrated`. Pareto cards carry `source="illustrative"` until Valhalla rerank.
- **Auth:** demo tokens (`Bearer DEMO`, PIN `0000`) labeled demo-tenant-only; 401 outside `GREENLOGIX_DEMO=1`.
- **GOFA:** cut autocomplete from demo script (mock-only, no UI/endpoint). Valhalla self-host: manifest + health versions only, no tiles.
- **Wards:** `admin-areas` endpoint renders corridor estimate (centroid demo), not polygon GIS — say so or cut.
- **Mandatory honesty line:** *"Current release provides truck-aware routing and route/fleet optimization; the research eco-cost engine is being validated against peer-reviewed heavy-duty fuel models. Current CO₂ is an accounting estimate, not yet the optimization objective."*

---

## 4. Credit (genuinely done this loop)

- Fail-closed publish gate wired + tested (the highest-severity 09-22 gap).
- Manifest propagation into optimize + report paths, 7 keys asserted.
- CORS allowlist split + PIN prod gate + lockout stub + tenant-plate guards.
- Per-vehicle truck profiles end-to-end; 7-component cache key; restriction coverage on every plan.
- Energy single-value fix (1500 W) with spec trace rows; Pareto source labeling; C1 evidence payload with ISO wording contract.
- Benchmark harness + reference solvers; telemetry ingest + calibration; ALNS regret-2 + adaptive weights; versioned admin-areas endpoint.
- **407 pytest green** (was 325: +82 across publish, manifest, auth-hardening, tenant, truck-e2e, energy-trace, pareto, harness, evidence, telemetry, admin-areas, alns-operators, places-provenance, health-graph, routing-quality gates).
- Banned-claims clean; contract additive-only (17 → 18 paths); vetoes empty.

---

## 5. Changed files

Tracked diff (`git diff --stat`, 35 files, +1391/−92):

- `apps/api/openapi.json` (+159, additive: `admin-areas`, quality/manifest fields)
- `apps/api/src/greenlogix_api/{main,schemas,models,serialize,carbon}.py`
- `apps/api/src/greenlogix_api/auth/{__init__,dependencies,legacy,models,service}.py`
- `apps/api/src/greenlogix_api/{geo/admin_boundaries,geo/truck_profile,energy/hdt_v1,places/gofa,routing/pareto}.py`
- `apps/api/src/greenlogix_api/{routers/driver,routers/optimize,routers/report,solver/__init__,solver/eco,solver/road_baseline,optimizer/eco_alns}.py`
- `apps/api/tests/{test_auth,test_contract,test_health,test_road_baseline,test_truck_profile}.py`
- `apps/api/.env.example` (CORS/prod notes)
- `apps/api/data/seed/{hcmc_10_trucks,hcmc_80_orders}.xlsx` (regen side-effect)
- `apps/landing/public/driver/index.html` (copy tweak)
- `docs/adr/0001-authoritative-architecture.md`, `docs/research/energy_model_spec.md`
- `implementation-notes.md`

New files (untracked) this loop:

- `apps/api/src/greenlogix_api/{benchmark/{__init__,harness,solvers_ref},telemetry/{__init__,ingest,calibration},geo/{__init__,road_graph},solver/flags,routers/places}.py`
- `apps/api/data/road_graph.json` (7-key manifest)
- `apps/api/tests/{test_publish_guard,test_manifest_propagation,test_auth_hardening,test_tenant_isolation,test_truck_e2e,test_energy_trace,test_pareto_rerank,test_harness,test_evidence,test_telemetry,test_admin_areas,test_alns_operators,test_places_provenance,test_health_graph,test_routing_quality,test_driver_authz,test_road_graph}.py`
- `apps/api/tests/fixtures/` (seed snapshot)
- `docs/adr/0002-road-graph-manifest.md`, `docs/research/{admin_boundaries,evidence_ui}.md`
- `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (plan, untouched), prior audits (untouched)

---

*End of audit 2026-09-23. Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` / `2026-09-22.md` untouched. Next: §2 infra items (tiles, PostGIS, JWT) or freeze the §3 honesty slice for demo.*

<!-- Actual Effort: Medium -->
