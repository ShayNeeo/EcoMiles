# GreenLogix Frontier Plan — Implementation Verification & Gap Audit (CR-20260923-001 closures)

**Plan:** `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (2026-09-21)
**Audit date:** 2026-09-24 (Asia/Ho_Chi_Minh)
**Branch:** `so2026`
**Method:** static code read + grep + `uv run pytest -q` from `apps/api` (**425 passed**, up from 407). No live Valhalla tiles / GOFA key / device test / OBD trials.
**Verdict:** 0/16 CRs fully pass. **16 PARTIAL, 0 NOT STARTED.** CR-20260923-001 closed its four smallest-first gaps as DONE (T-01 lockout, T-02 vehicle envelope, T-03 feedback, C-05 optimizer audit) plus C-04 CORS verify; every CR still carries a named infra remainder, hence 16× PARTIAL under the strict rule.

> Strict PASS rule: PASS only on full acceptance (no named remainder). DONE = wired + tested at code level. SCAFFOLD = honest stub with BLOCKED/infra note. Footnote on counts: 09-23 was 0/16/0 (all former NOT STARTED scaffolded). This revision keeps 0/16/0 at CR level — four §2 items moved DONE but their parent CRs (CR-04, CR-05/07, CR-10/12) retain infra remainders (JWT/DB tables, PostGIS, Valhalla tiles, SA/budget/trace), so no CR flips to PASS.[^1]

[^1]: Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md`, `FRONTIER_GAP_AUDIT_2026-09-22.md`, `FRONTIER_GAP_AUDIT_2026-09-23.md` remain untouched; this is the new dated revision.

**Contract:** `apps/api/openapi.json` holds **19 paths** (was 18; `POST /driver/restriction-feedback` added, additive only; `FROZEN_METHODS` updated +1 in `tests/test_contract.py:12-29`). Banned-claims grep: no truck-safe guarantee, no ISO-certified wording — matches are negations/wording-contract only (`carbon.py:16-19`, `routers/optimize.py:176`, `solver/flags.py:9`, `solver/road_baseline.py:30`). `.opencode-state/betriebsrat/vetoes/` present, empty (2 entries: `.`/`..` only).

---

## 0. Scoreboard

| CR | Title | Status | One-line reason | Evidence |
|----|-------|--------|-----------------|----------|
| CR-01 | Freeze ground truth + architecture | ⚠️ PARTIAL | Publish guard + manifest + CORS split + optimizer audit wired; manifest values still dev placeholders, no tiles | `routers/optimize.py:154-168`; `solver/flags.py:30-37`; `carbon.py:94-119`; `main.py:52-65,113-131`; `tests/test_publish_guard.py`, `test_manifest_propagation.py`, `test_optimizer_audit.py` |
| CR-02 | Google handoff fix | ⚠️ PARTIAL | Ô tô copy + disclaimer done; navigation-launch telemetry still missing | `apps/landing/public/driver/index.html:343`; `maps_link.dart` |
| CR-03 | GOFA Places adapter | ⚠️ PARTIAL | BLOCKED note kept; additive provenance passthrough, no real contract/UI | `places/gofa.py:24-30`; `models.py:24-26`; `serialize.py:27`; `schemas.py:44`; `tests/test_places_provenance.py` |
| CR-04 | Manager/Driver auth + RBAC | ⚠️ PARTIAL | PIN gate + **lockout enforced** + tenant-plate guard; full JWT/Argon2id/DB tables missing | `auth/service.py:28-43,46-66,93,110-117`; `auth/legacy.py:5,17-21`; `auth/dependencies.py:40-68`; `auth/models.py:23-29`; `tests/test_auth_hardening.py` (incl. `test_pin_lockout_triggers_after_n_rapid_failures`, `test_pin_lockout_resets_after_window`, `test_pin_lockout_demo_ok_path_unaffected`) |
| CR-05 | Truck profile model | ⚠️ PARTIAL | **Vehicle envelope migrated (additive nullable)** + per-vehicle wiring + e2e; powertrain/emission-standard without routing consumer (documented) | `models.py:43-57`; `db.py:36-50,67,81`; `geo/truck_profile.py:102-160`; `solver/__init__.py:266-310`; `tests/test_truck_e2e.py`, `tests/test_truck_profile.py` |
| CR-06 | Self-hosted Valhalla + versioning | ⚠️ PARTIAL | Manifest + health versions + propagation; Docker/tiles/elevation NOT built | `geo/road_graph.py:94`; `data/road_graph.json` (7 keys); `main.py:113-131`; `schemas.py:23`; `docs/adr/0002`; `tests/test_road_graph.py`, `test_health_graph.py` |
| CR-07 | Restriction overlay | ⚠️ PARTIAL | Coverage label + **feedback endpoint + verification queue (no auto-mutate)**; PostGIS `restriction_rules` table missing | `solver/road_baseline.py:515-562`; `solver/__init__.py:89,340`; `geo/restrictions.py:16-51,128-186`; `routers/driver.py:132-160`; `tests/test_restriction_feedback.py` (6 tests) |
| CR-08 | Admin boundary segmentation | ⚠️ PARTIAL | Versioned `admin-areas` endpoint; centroid fallback only, no PostGIS polygons | `routers/optimize.py:181-201`; `geo/admin_boundaries.py:53-93`; `docs/research/admin_boundaries.md`; `tests/test_admin_areas.py` |
| CR-09 | Energy Model V1 | ⚠️ PARTIAL | Trace table + P_AUX single-value 1500 W fix; OBD calibration BLOCKED | `energy/hdt_v1.py:20-25,76`; `docs/research/energy_model_spec.md:100-109`; `tests/test_energy_trace.py` |
| CR-10 | EcoPath Pareto | ⚠️ PARTIAL | `source` label (`verified`/`illustrative`) + C1 tier + **audit label in report extra**; candidates still illustrative scalings | `routing/pareto.py:26-52,146-168`; `carbon.py:104-119` (`pareto_source: illustrative`); `tests/test_pareto_rerank.py`, `tests/test_optimizer_audit.py` |
| CR-11 | Reference solvers + harness | ⚠️ PARTIAL | Harness table + 2 ref solvers; no PyVRP/OR-Tools deps | `benchmark/harness.py:25,47`; `benchmark/solvers_ref.py:17,39`; `tests/test_harness.py` |
| CR-12 | EcoALNS v1 + v2 operators | ⚠️ PARTIAL | 2 destroy + 2 repair + adaptive weights + **optimizer audit label**; hill-climb only, no SA/budget/trace/ablation | `optimizer/eco_alns.py:131-279,297-380`; `carbon.py:104-119` (`optimizer` from `optimizer_name_for_audit()`); `tests/test_eco_alns.py`, `test_alns_operators.py`, `test_optimizer_audit.py` (4 tests) |
| CR-13 | (operators — merged w/ CR-12) | ⚠️ PARTIAL | See CR-12 row | Same as CR-12 |
| CR-14 | Google DRIVE connector | ⚠️ PARTIAL | Stub raises `RoadBaselineNotConfigured` correctly; no harness/traffic wiring | `solver/road_baseline.py:64,375-386` |
| CR-15 | Investor evidence UI | ⚠️ PARTIAL | `C1-illustrative` payload + spec; no audit drawer / baseline panel / C0–C4 ladder | `carbon.py:18-28,102`; `docs/research/evidence_ui.md:47-83`; `tests/test_evidence.py` |
| CR-16 | Telemetry + calibration | ⚠️ PARTIAL | Fuel-obs ingest stub + `mae_mape`; no GPS/OBD live feed | `telemetry/ingest.py:18-90`; `telemetry/calibration.py:8`; `tests/test_telemetry.py` |

Strict rule applied: PASS only on full acceptance. Four CR-20260923-001 items closed at code level, but every parent CR retains a named infra remainder — hence still 16× PARTIAL. (CR-12/CR-13 share the EcoALNS row; counted separately in the 16.)

---

## 1. Loop confirmations (CR-20260923-001: T-01, T-02, T-03, C-05 + C-04)

| # | Item (CR-20260923-001) | State | Evidence |
|---|------------------------|-------|----------|
| T-01 | Lockout enforcement (C-01) | ✅ DONE | `auth/service.py:28-43` (`MAX_PIN_ATTEMPTS=20`, `PIN_LOCKOUT_SECONDS=300`, in-memory store, Redis note); `:46-66` `_lockout_key`/`_pin_lockout_active`/`_record_pin_attempt`; `:93` valid-PIN path never counted; `:110-117` unknown-PIN lockout check before 401 + re-check after record; `auth/legacy.py:5` enforcement note; 3 tests in `tests/test_auth_hardening.py` (`test_pin_lockout_triggers_after_n_rapid_failures`, `test_pin_lockout_resets_after_window`, `test_pin_lockout_demo_ok_path_unaffected`); targeted run: 96 selected passed |
| T-02 | Vehicle DB envelope (C-02) | ✅ DONE | `models.py:43-57` additive nullable envelope (`height_m/width_m/length_m/gvw_kg`) + axle/aero overrides (`axle_load_t/frontal_area_m2/cd`), rated-consumption/powertrain/emission-standard note (`l_per_100km`+`fuel` cover it); `db.py:36-50` `_ensure_vehicle_envelope` ALTER-TABLE path + `:67,81` call sites for pre-migration DBs; `geo/truck_profile.py:102-160` `get_profile_for_vehicle` measured-envelope override + derived axle/area/cd; `tests/test_truck_profile.py`, `tests/test_truck_e2e.py` green |
| T-03 | Restriction feedback + queue (C-03) | ✅ DONE | `routers/driver.py:132-160` `POST /driver/restriction-feedback` → 201 `FeedbackOut(id, status)`; plate-scoped auth (`verify_driver_plate_access`); no auto-mutate docstring; `geo/restrictions.py:128-186` `DriverRestrictionFeedback` (`pending_review` default), `_FEEDBACK_QUEUE`, `submit_feedback` / `pending_feedback` / `verify_feedback` (verified/rejected, never touches `ACTIVE_RULES`); 6 tests in `tests/test_restriction_feedback.py` (201 pending, cross-plate 403, own-plate 201, unverified-no-mutate, verify transition, unknown-id raises); 19th OpenAPI path + `FROZEN_METHODS` entry `tests/test_contract.py:29` |
| C-05 | Optimizer audit labels | ✅ DONE | `carbon.py:104-119` additive `optimizer` (from `optimizer_name_for_audit()`, caller-wins `setdefault`) + `pareto_source: "illustrative"` with verified-path comment (library-level `routing/pareto.rerank_from_alternatives`); never fails report write; 4 tests in `tests/test_optimizer_audit.py` (save-report labels, ecoalns-flag label, caller-override-wins, persist-plan propagation); no schema/OpenAPI change, no solver math, no optimality claims |
| C-04 | CORS prod ops verify | ✅ DONE (code+docs) | `main.py:52-65` `_cors_origins()` — demo-only `*` gated on `GREENLOGIX_DEMO=1` + empty allowlist; `.env.example:3-7` documents `GREENLOGIX_CORS_ORIGINS` + prod example line `GREENLOGIX_CORS_ORIGINS=https://fleet.example.vn,https://ops.example.vn` (comment) — **no edit needed, already present**; `tests/test_auth_hardening.py::test_cors_prod_split_allowlist` + `tests/test_routing_quality.py::test_cors_allowlist_env` + `tests/test_auth.py::test_cors_allows_auth_headers_without_credentials` green (3/3 cors-selected); per-deploy real value still ops-side |

Test progression: 407 → **425 passed** (`apps/api`, 46 test files incl. new `test_restriction_feedback.py`, `test_optimizer_audit.py`). New contract: 18 → **19 paths** (only addition `POST /driver/restriction-feedback`).

---

## 2. Remaining gaps (smallest first — honest BLOCKED/infra)

1. **CORS prod value (ops, 15 min):** code split + docs + tests done; set real `GREENLOGIX_CORS_ORIGINS` per deploy, verify no `*` outside demo.
2. **GOFA real contract (BLOCKED on sponsor docs):** endpoint + UI + debounce/cancel/cap wait on official base URL/auth/schema. Provenance fields ready.
3. **Feedback admin promotion UI (half-day):** queue + verify API exist; admin review drawer + promotion-to-`ACTIVE_RULES` workflow missing.
4. **PostGIS admin polygons (1–2 d, NOT STARTED at infra level):** `LINESTRING × ward polygons`, versioned NSO dataset; endpoint shape exists so swap is contained.
5. **Valhalla tiles/Docker/elevation (3–5 d, NOT STARTED at infra level):** manifest carries dev placeholders (`unpinned-dev`); snapshot pin + tile build + `/health` reachability flip to True.
6. **Pareto Valhalla rerank Stage-1 (1–2 d):** alternatives → `hdt_v1` scoring → dominance filter; `source="verified"` path defined, unreachable until tiles land.
7. **PyVRP/OR-Tools + Solomon/CVRPLIB (3–5 d):** harness table ready; external solver deps + dataset runner missing.
8. **ALNS v2 remainder (1–2 w):** SA/record-to-record acceptance, runtime budget + convergence trace, uphill/restriction/ban operators, ablation study.
9. **Full JWT/Argon2id/tenant tables (1–2 w):** lockout + demo gate is correct fail-closed posture, but production auth is a rebuild; in-memory store needs Redis/shared store for multi-instance.
10. **Telemetry live + DRIVE + evidence UI (2–4 w):** GPS/OBD feed, GOOGLE-DRIVE benchmark layer, audit drawer / baseline panel / C0–C4 ladder.

---

## 3. Demo honesty slice (24/09 — what can ship)

- **Routing label:** every route shows `routing_quality`: `VERIFIED_GRAPH` or **`DEGRADED` (circuity estimate — not truck-verified)**. Fail-closed publish enforced when `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` — circuity routes get 403, say so.
- **PWA button:** `Chỉ đường (Google Maps · Ô tô)` + footnote *"Google tự tính lại lộ trình ô tô; không thay thế kiểm soát tải trọng GreenLogix."* No `Xe tải` claims.
- **Eco metric:** show only as `Estimated fuel — Model GLX-HDT-v1, C1 physics, uncalibrated`. Pareto cards carry `source="illustrative"` until Valhalla rerank (report extra now records `optimizer` + `pareto_source` audit labels).
- **Auth:** demo tokens (`Bearer DEMO`, PIN `0000`) labeled demo-tenant-only; 401 outside `GREENLOGIX_DEMO=1`; rapid PIN guessing now locks out (20/300 s window, in-memory).
- **Feedback:** driver restriction reports queue as `pending_review`, never auto-mutate routing — say so or cut from demo script.
- **GOFA:** cut autocomplete from demo script (mock-only, no UI/endpoint). Valhalla self-host: manifest + health versions only, no tiles.
- **Wards:** `admin-areas` endpoint renders corridor estimate (centroid demo), not polygon GIS — say so or cut.
- **Mandatory honesty line:** *"Current release provides truck-aware routing and route/fleet optimization; the research eco-cost engine is being validated against peer-reviewed heavy-duty fuel models. Current CO₂ is an accounting estimate, not yet the optimization objective."*

---

## 4. Credit (genuinely done in CR-20260923-001)

- Lockout enforced (threshold + window + tests, demo-OK path unaffected) — highest-severity 09-23 §2 item closed.
- Vehicle envelope migrated additively (nullable columns + pre-migration ALTER path + per-vehicle override consumption).
- Restriction feedback endpoint + verification queue, 19th contract path additive-only.
- Optimizer + pareto_source audit labels in report extra (caller-wins, additive, no schema change).
- CORS prod split re-verified (code + `.env.example` prod line already present + 3 cors tests green); no src behavior edit needed.
- **425 pytest green** (was 407: +18 across lockout, restriction-feedback, optimizer-audit gates).
- Banned-claims clean (negations/wording-contract only); contract additive-only (18 → 19 paths); vetoes empty.

---

## 5. Changed files

Tracked diff vs base (`git diff --stat`, 37 files, +1991/−97 on `so2026` working tree):

- `apps/api/openapi.json` (+446, additive: `restriction-feedback` path, quality/manifest/optimizer-audit fields)
- `apps/api/src/greenlogix_api/{main,schemas,models,serialize,carbon,db}.py`
- `apps/api/src/greenlogix_api/auth/{__init__,dependencies,legacy,models,service}.py`
- `apps/api/src/greenlogix_api/{geo/admin_boundaries,geo/truck_profile,energy/hdt_v1,places/gofa,routing/pareto}.py`
- `apps/api/src/greenlogix_api/{routers/driver,routers/optimize,routers/report,solver/__init__,solver/eco,solver/road_baseline,optimizer/eco_alns}.py`
- `apps/api/tests/{test_auth,test_contract,test_health,test_road_baseline,test_truck_profile}.py`
- `apps/api/.env.example` (CORS/prod notes, pre-existing)
- `apps/api/data/seed/{hcmc_10_trucks,hcmc_80_orders}.xlsx` (regen side-effect)
- `apps/landing/public/driver/index.html` (copy tweak)
- `docs/adr/0001-authoritative-architecture.md`, `docs/research/energy_model_spec.md`
- `implementation-notes.md`

New files (untracked) incl. this loop:

- `apps/api/src/greenlogix_api/{benchmark/{__init__,harness,solvers_ref},telemetry/{__init__,ingest,calibration},geo/{__init__,road_graph},solver/flags,routers/places}.py`
- `apps/api/data/road_graph.json` (7-key manifest)
- `apps/api/tests/{test_publish_guard,test_manifest_propagation,test_auth_hardening,test_tenant_isolation,test_truck_e2e,test_energy_trace,test_pareto_rerank,test_harness,test_evidence,test_telemetry,test_admin_areas,test_alns_operators,test_places_provenance,test_health_graph,test_routing_quality,test_driver_authz,test_road_graph,test_restriction_feedback,test_optimizer_audit}.py`
- `apps/api/tests/fixtures/` (seed snapshot)
- `docs/adr/0002-road-graph-manifest.md`, `docs/research/{admin_boundaries,evidence_ui}.md`
- `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (plan, untouched), prior audits (untouched)

---

*End of audit 2026-09-24. Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` / `2026-09-22.md` / `2026-09-23.md` untouched. Next: §2 infra items (tiles, PostGIS, JWT) or freeze the §3 honesty slice for demo.*

<!-- Actual Effort: Medium -->
