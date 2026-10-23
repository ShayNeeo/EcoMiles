# GreenLogix Frontier Plan — Implementation Verification & Gap Audit (Post Deep-Batch)

**Plan:** `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (2026-09-21)
**Audit date:** 2026-09-22 (Asia/Ho_Chi_Minh)
**Branch:** `so2026`
**Method:** static code read + grep + `uv run pytest -q` (325 pass, up from 295). No live Valhalla / GOFA key / device test.
**Verdict:** 0/16 CRs fully pass. 11 PARTIAL, 5 NOT STARTED. Deep CR-01/04/06 batch landed groundwork; fail-closed publish + manifest propagation still unwired.

> Footnote: T-REVERIFY brief stated "0 PASS / 10 PARTIAL / 6 NOT STARTED" — miscount. Correct: PARTIAL = CR-01,02,03,04,05,06,07,08,09,10,12 (11); NOT STARTED = CR-11,13,14,15,16 (5).[^1]

---

## 0. Scoreboard

| CR | Title | Status | One-line reason | Evidence |
|----|-------|--------|-----------------|----------|
| CR-01 | Freeze ground truth + architecture | ⚠️ PARTIAL | `routing_quality` live; flags/CORS/eco-deprecation/fixtures done; publish guard + manifest wiring unwired | `schemas.py:128,185`; `solver/__init__.py:80`; `road_baseline.py:36,422`; `solver/flags.py`; `main.py:52`; `tests/test_routing_quality.py` (12 tests) |
| CR-02 | Google handoff fix | ⚠️ PARTIAL | Copy fixed to Ô tô + disclaimer; telemetry still missing | `apps/landing/public/driver/index.html:343`; `maps_link.dart` |
| CR-03 | GOFA Places adapter | ⚠️ PARTIAL | BLOCKED note added; still no route, no provenance | `places/gofa.py:25` BLOCKED note |
| CR-04 | Manager/Driver auth + RBAC | ⚠️ PARTIAL | Guards enforced in `driver.py`; tenant tables + lockout still missing | `routers/driver.py:45,52,82,110`; `tests/test_driver_authz.py` (9 tests) |
| CR-05 | Truck profile model | ⚠️ PARTIAL | Type + cache hash exist; Vehicle DB + `run_vrp` wiring missing | `geo/truck_profile.py`; `road_baseline.py:273-333` |
| CR-06 | Self-hosted Valhalla + versioning | ⚠️ PARTIAL | Manifest + ADR groundwork only; no Docker/tiles/propagation | `geo/road_graph.py`; `data/road_graph.json` (7 keys); `docs/adr/0002`; `tests/test_road_graph.py` (8 tests) |
| CR-07 | Restriction overlay | ⚠️ PARTIAL | Rule library done; not wired into solver | `geo/restrictions.py` |
| CR-08 | Admin boundary segmentation | ⚠️ PARTIAL | Centroid heuristic only; no PostGIS | `geo/admin_boundaries.py` |
| CR-09 | Energy Model V1 | ⚠️ PARTIAL | Physics + tests done; per-equation trace table missing | `energy/hdt_v1.py` |
| CR-10 | EcoPath Pareto | ⚠️ PARTIAL | Cards illustrative scalings, not Valhalla alternatives | `routing/pareto.py` |
| CR-11 | Reference solvers + harness | ❌ NOT STARTED | No PyVRP/OR-Tools/oracle | — |
| CR-12 | EcoALNS v1 | ⚠️ PARTIAL | Scaffold + evaluator + seed; 1 destroy + 1 repair only | `optimizer/eco_alns.py` |
| CR-13 | EcoALNS v2 operators | ❌ NOT STARTED | No uphill/restriction/ban operators | — |
| CR-14 | Google DRIVE connector | ❌ NOT STARTED | Stub raises correctly; no harness | `benchmark/google_drive.py` stub |
| CR-15 | Investor evidence UI | ❌ NOT STARTED | No audit drawer / baseline panel / C0–C4 ladder | — |
| CR-16 | Telemetry + calibration | ❌ NOT STARTED | No GPS/OBD ingest | — |

[^1]: Prior audit `FRONTIER_GAP_AUDIT_2026-09-21.md` (0/10/6 scoring) remains untouched; this file is the new dated revision.

---

## 1. Deep batch confirmation (CR-01/04/06)

### CR-01 — Freeze ground truth (§6 items 2,4,5)

| Item | State | Evidence |
|------|-------|----------|
| `routing_quality` on every optimize/report response | ✅ DONE | `schemas.py:128,185` default `DEGRADED`; `solver/__init__.py:80` `VrpResult.routing_quality`; `road_baseline.py:36` `quality_for_provider`, `:422` `materialize_matrix` 3-tuple; `routers/optimize.py:64,91,106`, `routers/report.py:38`, `carbon.py:82` propagation; `openapi.json:1256,1570` additive |
| Fail-closed publish flag | ⚠️ GAP (unwired) | `solver/flags.py:33` `publish_blocked_for_quality` exists; **never called** in `POST /routes/publish` — circuity routes still publishable |
| `GREENLOGIX_ECO_WEIGHT` deprecation | ✅ DONE | `solver/eco.py:3,30` deprecation + warning log; frozen for OpenAPI compat, not removed |
| CORS env allowlist | ✅ DONE | `main.py:52` `_cors_origins()` reads `GREENLOGIX_CORS_ORIGINS`; demo-only `*` fallback retained |
| Feature flags legacy/ecoalns | ✅ DONE | `solver/flags.py` `optimizer_from_env()`; legacy default, unknown → legacy |
| Frozen fixtures | ✅ DONE | `tests/fixtures/seed_snapshot.json` export |
| `tests/test_routing_quality.py` | ✅ DONE | 12 tests green |
| Manifest → response propagation | ⚠️ GAP (unwired) | `road_graph_audit_extra()` exported (`geo/__init__.py:9`) but **never called** in `persist_plan`/`save_report` — wiring TODO in `road_graph.py:13` |

### CR-04 — Driver horizontal guard (§6 item 3)

| Item | State | Evidence |
|------|-------|----------|
| `verify_driver_plate_access` in HTTP layer | ✅ DONE | `routers/driver.py:45` (GET route), `:52` (route.plate), `:82,110` (stop status) |
| A-vs-B HTTP tests | ✅ DONE | `tests/test_driver_authz.py` 9 tests green |
| Tenant tables / Argon2id / JWT / lockout / DISPATCHER role | ⚠️ GAP | `auth/service.py:38` global PIN `0000` still live demo path; single `org_demo`; no org/user/membership tables |

### CR-06 — Valhalla manifest groundwork (§6 item 7 follow-on)

| Item | State | Evidence |
|------|-------|----------|
| Version manifest file | ✅ DONE | `data/road_graph.json` 7 keys (`osm_snapshot_id`, `osm_timestamp`, `valhalla_version`, `tile_build_hash`, `elevation_dataset_version`, `restriction_overlay_version`, `cost_model_version`) |
| Manifest reader + health helper | ✅ DONE | `geo/road_graph.py:94` `road_graph_audit_extra()`; ADR `docs/adr/0002` |
| ADR §C update | ✅ DONE | `docs/adr/0001:31,53,62` quality enum + flags documented |
| Docker / tiles / elevation build | ❌ GAP | Not started — manifest is dev placeholders (`unpinned-dev`, `dev-2026-09-21`) |
| `/health` graph check | ❌ GAP | Helper exists, no endpoint wired |
| Audit propagation into responses | ❌ GAP | See CR-01 unwired `road_graph_audit_extra` |

### Other §6 items

| Item | State | Evidence |
|------|-------|----------|
| §6.1 PWA copy fix | ✅ DONE | `index.html:343` → `Chỉ đường (Google Maps · Ô tô)` + disclaimer div (Google recalculates; not approved truck route) |
| §6.6 GOFA honesty | ✅ DONE | `gofa.py:25` BLOCKED note; no schema claims |

---

## 2. Remaining gaps (smallest first)

1. **Wire fail-closed publish (30 min):** call `publish_blocked_for_quality()` in `POST /routes/publish`; 403 when `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` + quality ≠ VERIFIED_GRAPH. + test.
2. **Wire manifest propagation (30 min):** merge `road_graph_audit_extra()` into `extra` in `persist_plan`/`save_report`; + test asserting 7 keys present.
3. **CORS prod split (15 min):** set `GREENLOGIX_CORS_ORIGINS` in prod env; verify no `*` in prod config. Code done, ops pending.
4. **Remove demo PIN from prod path (1 h):** gate `0000` behind `GREENLOGIX_DEMO=1`; add lockout/rate-limit stub.
5. **GOFA endpoint + provenance (2–4 h, BLOCKED on sponsor docs):** `GET /v1/places/autocomplete`, detail route, Order provenance fields. Schema still BLOCKED — no guessing.
6. **Truck profile end-to-end (2–3 h):** `run_vrp` builds profile per vehicle; remove hard-coded 3.5t fallback (`road_baseline.py:284-287`); Vehicle migration fields.
7. **Full cache key P-04 (1 h):** add `road_graph_version / departure_bucket / restriction_overlay_version / traffic_snapshot / cost_model_version` to key (3/7 now).
8. **Restriction wiring (3–5 h):** call `geo/restrictions.py` from solver/Valhalla path; `restriction_coverage` label; feedback endpoint.
9. **PostGIS admin areas (1–2 d):** polygon intersection; `GET /v1/routes/{id}/admin-areas`; versioned NSO codes dataset.
10. **Energy spec trace table (2–3 h):** per-equation `paper+DOI / eq# / variable / unit / source / assumption / validity / symbol / test` rows; fix `P_AUX` 1200 vs 1500 W drift.
11. **Pareto rerank Stage-1 (1–2 d):** Valhalla alternatives → `hdt_v1` scoring → dominance filter; label current cards `candidate_pareto · illustrative` until then.
12. **PyVRP/OR-Tools harness CR-11 (3–5 d):** reference solvers + Solomon/CVRPLIB runner + `solver|feasible|objective|gap|runtime|seed` table. NOT STARTED.
13. **ALNS operators + v2 (1–2 w):** adaptive weights, SA acceptance, regret-k, TW/restriction-aware repair, ablation. NOT STARTED.
14. **Telemetry CR-16 + DRIVE harness CR-14 + evidence UI CR-15 (2–4 w):** GPS/OBD ingest, DRIVE connector, audit drawer. NOT STARTED.

---

## 3. Demo honesty slice (24/09 — what can ship)

- **Routing label:** every route shows `routing_quality`: `VERIFIED_GRAPH` (Valhalla/OSRM) or **`DEGRADED` (circuity estimate — not truck-verified)**. Circuity fallback stays silent-code but labeled-response.
- **PWA button:** `Chỉ đường (Google Maps · Ô tô)` + footnote *"Google tự tính lại lộ trình ô tô; không thay thế kiểm soát tải trọng GreenLogix."* No `Xe tải` claims.
- **Fail-closed note:** publish guard exists as code but **not yet enforced** — say so on demo; do not claim circuity routes are blocked.
- **Eco metric:** show only as `Estimated fuel — Model GLX-HDT-v1, C1 physics, uncalibrated`. Pareto deltas are illustrative scalings.
- **Auth:** demo tokens (`Bearer DEMO`, PIN `0000`) labeled demo-tenant-only.
- **GOFA:** cut autocomplete from demo script (mock-only, no UI/endpoint). Valhalla self-host: manifest groundwork only, no tiles.
- **Mandatory honesty line:** *"Current release provides truck-aware routing and route/fleet optimization; the research eco-cost engine is being validated against peer-reviewed heavy-duty fuel models. Current CO₂ is an accounting estimate, not yet the optimization objective."*

---

## 4. Credit (genuinely done this batch)

- `routing_quality` threaded provider → `materialize_matrix` 3-tuple → `VrpResult` → optimize/report/carbon + additive OpenAPI (no frozen-contract break).
- Eco weight deprecated-with-warning; CORS allowlist; optimizer flag; frozen seed fixture.
- Driver horizontal guard enforced at HTTP layer + 9 A-vs-B tests.
- Valhalla manifest (7 keys) + reader + ADR 0001 §C / 0002 + 8 manifest tests.
- PWA Ô tô copy + disclaimer; GOFA BLOCKED note (blocker violation cleared).
- **325 pytest green** (was 295: +12 routing_quality, +9 driver_authz, +8 road_graph, +1 auth fix, minus overlaps).

---

## 5. Changed files

Tracked diff (`git diff --stat`, 19 files, +163/−29):

- `apps/api/openapi.json` (+10 additive `routing_quality`)
- `apps/api/src/greenlogix_api/schemas.py`, `carbon.py`, `main.py`
- `apps/api/src/greenlogix_api/auth/service.py`
- `apps/api/src/greenlogix_api/places/gofa.py` (BLOCKED note)
- `apps/api/src/greenlogix_api/routers/{driver,optimize,report}.py`
- `apps/api/src/greenlogix_api/solver/{__init__,eco,road_baseline}.py`
- `apps/api/tests/{test_auth,test_road_baseline,test_truck_profile}.py`
- `apps/landing/public/driver/index.html` (copy fix)
- `docs/adr/0001-authoritative-architecture.md` (§C)
- `apps/api/data/seed/{hcmc_10_trucks,hcmc_80_orders}.xlsx` (regen side-effect, reverted — not part of batch)

New files (untracked):

- `apps/api/data/road_graph.json` (manifest, 7 keys)
- `apps/api/src/greenlogix_api/geo/__init__.py`, `geo/road_graph.py`
- `apps/api/src/greenlogix_api/solver/flags.py`
- `apps/api/tests/test_routing_quality.py` (12), `test_driver_authz.py` (9), `test_road_graph.py` (8)
- `apps/api/tests/fixtures/seed_snapshot.json`
- `docs/adr/0002*` (road-graph manifest ADR)
- `FRONTIER_GAP_AUDIT_2026-09-21.md` (prior audit, untouched)

---

*End of audit 2026-09-22. Prior file `FRONTIER_GAP_AUDIT_2026-09-21.md` untouched. Next: wire items §2.1–2.2, then re-run gate.*

<!-- Actual Effort: Medium -->
