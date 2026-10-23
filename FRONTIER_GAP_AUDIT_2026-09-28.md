# GreenLogix Frontier Plan — Implementation Verification & Gap Audit (ban-window destroy op slice)

**Plan:** `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (2026-09-21)
**Audit date:** 2026-09-28 (Asia/Ho_Chi_Minh)
**Branch:** `so2026`
**Method:** static code read + grep + `uv run pytest` from `apps/api` (**442 passed**, up from 439). Read-only reviewer gate PASS. No live Valhalla tiles / GOFA key / device test / OBD trials.
**Verdict:** 0/16 CRs fully pass. **16 PARTIAL, 0 NOT STARTED.** This iteration closed the CR-12/CR-13 ban-window sub-slice (§11.3 destroy op 10, code-closable) at code level; parent CR-12/CR-13 keep remainders (payload-bin cache, restarts, full ablation), so no CR flips to PASS under the strict rule.

> Strict PASS rule: PASS only on full acceptance (no named remainder). DONE = wired + tested at code level. SCAFFOLD = honest stub with BLOCKED/infra note. Footnote on counts: 09-27 was 0/16/0 with Pareto epsilon-SLA slice DONE. This revision keeps 0/16/0 — one more §2 sub-slice moved DONE (T-BAN-WINDOW + T-BAN-TESTS) but parent CR-12/CR-13 retains named remainders.[^1]

[^1]: Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` / `2026-09-22.md` / `2026-09-23.md` / `2026-09-24.md` / `2026-09-25.md` / `2026-09-26.md` / `2026-09-27.md` remain untouched; this is the new dated revision.

**Contract:** `apps/api/openapi.json` holds **21 paths** (unchanged; this slice is library-level only, no router/schema edits; `test_frozen_openapi` green, 87 contract tests green). Banned-claims grep: 5 hits, all negations/wording-contract only (`carbon.py:16-19`, `routers/optimize.py:176`, `solver/flags.py:9`, `solver/road_baseline.py:30`). `.opencode-state/betriebsrat/vetoes/` empty.

---

## 0. Scoreboard

| CR | Title | Status | One-line reason | Evidence |
|----|-------|--------|-----------------|----------|
| CR-01 | Freeze ground truth + architecture | ⚠️ PARTIAL | Publish guard + manifest + CORS split + optimizer audit wired; manifest values still dev placeholders, no tiles | `routers/optimize.py:154-168`; `solver/flags.py:30-37`; `carbon.py:94-119`; `main.py:52-65,113-131`; `tests/test_publish_guard.py`, `test_manifest_propagation.py`, `tests/test_optimizer_audit.py` |
| CR-02 | Google handoff fix | ⚠️ PARTIAL | Ô tô copy + disclaimer done; navigation-launch telemetry still missing | `apps/landing/public/driver/index.html:343`; `maps_link.dart` |
| CR-03 | GOFA Places adapter | ⚠️ PARTIAL | BLOCKED note kept; additive provenance passthrough, no real contract/UI | `places/gofa.py:24-30`; `models.py:24-26`; `serialize.py:27`; `schemas.py:44`; `tests/test_places_provenance.py` |
| CR-04 | Manager/Driver auth + RBAC | ⚠️ PARTIAL | PIN gate + lockout enforced + tenant-plate guard; full JWT/Argon2id/DB tables missing | `auth/service.py:28-43,46-66,93,110-117`; `auth/legacy.py:5,17-21`; `auth/dependencies.py:40-68`; `auth/models.py:23-29`; `tests/test_auth_hardening.py` |
| CR-05 | Truck profile model | ⚠️ PARTIAL | Vehicle envelope migrated (additive nullable) + per-vehicle wiring + e2e; powertrain/emission-standard without routing consumer (documented) | `models.py:43-57`; `db.py:36-50,67,81`; `geo/truck_profile.py:102-160`; `solver/__init__.py:266-310`; `tests/test_truck_e2e.py`, `tests/test_truck_profile.py` |
| CR-06 | Self-hosted Valhalla + versioning | ⚠️ PARTIAL | Manifest + health versions + propagation; Docker/tiles/elevation NOT built | `geo/road_graph.py:94`; `data/road_graph.json` (7 keys); `main.py:113-131`; `schemas.py:23`; `docs/adr/0002`; `tests/test_road_graph.py`, `test_health_graph.py` |
| CR-07 | Restriction overlay | ⚠️ PARTIAL | Coverage label + feedback endpoint + queue + admin review endpoints (no auto-mutate); PostGIS `restriction_rules` table + promotion workflow missing | `solver/road_baseline.py:515-562`; `solver/__init__.py:89,340`; `geo/restrictions.py:16-51,128-186`; `routers/driver.py:132-203`; `schemas.py:199-228`; `tests/test_restriction_feedback.py` (10 tests) |
| CR-08 | Admin boundary segmentation | ⚠️ PARTIAL | Versioned `admin-areas` endpoint; centroid fallback only, no PostGIS polygons | `routers/optimize.py:181-201`; `geo/admin_boundaries.py:53-93`; `docs/research/admin_boundaries.md`; `tests/test_admin_areas.py` |
| CR-09 | Energy Model V1 | ⚠️ PARTIAL | Trace table + P_AUX single-value 1500 W fix; OBD calibration BLOCKED | `energy/hdt_v1.py:20-25,76`; `docs/research/energy_model_spec.md:100-109`; `tests/test_energy_trace.py` |
| CR-10 | EcoPath Pareto | ⚠️ PARTIAL | `source` label + C1 tier + audit label + epsilon-SLA selection + structured why-facts; candidates still illustrative scalings, no Valhalla alternatives | `routing/pareto.py:26-52,116-207,210-293,304-378`; `carbon.py:104-119`; `tests/test_pareto_rerank.py` (10 tests), `tests/test_optimizer_audit.py` |
| CR-11 | Reference solvers + harness | ⚠️ PARTIAL | Harness table + 2 ref solvers; no PyVRP/OR-Tools deps | `benchmark/harness.py:25,47`; `benchmark/solvers_ref.py:17,39`; `tests/test_harness.py` |
| CR-12 | EcoALNS v1 + v2 operators | ⚠️ PARTIAL | 5 destroy + 2 repair + adaptive weights + SA opt-in + budget + trace + optimizer audit label + **ban-window destroy op**; no PyVRP comparison, no payload-bin cache, no restarts, no full ablation | `optimizer/eco_alns.py:131-389,400-623`; `carbon.py:104-119`; `tests/test_eco_alns.py`, `test_alns_operators.py` (13 tests), `test_optimizer_audit.py` |
| CR-13 | (operators — merged w/ CR-12) | ⚠️ PARTIAL | worst-fuel + uphill-payload + **ban-window removal** DONE; payload-bin cache, restarts, full ablation missing | Same as CR-12 |
| CR-14 | Google DRIVE connector | ⚠️ PARTIAL | Stub raises `RoadBaselineNotConfigured` correctly; no harness/traffic wiring | `solver/road_baseline.py:64,375-386` |
| CR-15 | Investor evidence UI | ⚠️ PARTIAL | `C1-illustrative` payload + spec; no audit drawer / baseline panel / C0–C4 ladder | `carbon.py:18-28,102`; `docs/research/evidence_ui.md:47-83`; `tests/test_evidence.py` |
| CR-16 | Telemetry + calibration | ⚠️ PARTIAL | Fuel-obs ingest stub + `mae_mape`; no GPS/OBD live feed | `telemetry/ingest.py:18-90`; `telemetry/calibration.py:8`; `tests/test_telemetry.py` |

Strict rule applied: PASS only on full acceptance. One 09-27 §2 sub-slice closed at code level (ban-window destroy op), but CR-12/CR-13 retain named remainders — hence still 16× PARTIAL. (CR-12/CR-13 share the EcoALNS row; counted separately in the 16.)

---

## 1. Loop confirmations (09-28: T-BAN-WINDOW + T-BAN-TESTS, CR-20260923-003 scope on so2026)

| # | Item | State | Evidence |
|---|------|-------|----------|
| T-BAN-WINDOW | Ban-window conflict destroy op (lib + registration + weights) | ✅ DONE | `optimizer/eco_alns.py:284-334` `ban_window_removal_destroy` (Decision 23/2018 overlap via `check_truck_ban` read-only, per-tour `profile.vehicle_class`, binary restricted-first, seeded-rng exact-tie shuffle, descending-index pop); `:438-444` `DESTROY_OPS` registration; `:469-470` docstring operator list; `:524-530` adaptive `destroy_weights`; hill-climb default unchanged, legacy 3-arg dispatch untouched |
| T-BAN-TESTS | Tests + notes + CR closeout | ✅ DONE | `tests/test_alns_operators.py:180-213` 3 new tests (deterministic same-seed + restricted-first set assert, via-solver feasible `destroy_op="ban_window"`, registered + adaptive-selectable 20-row trace); `changes/CR-20260923-003.md` C-01/C-02 + AC-01..AC-03 checked, status review; `implementation-notes.md` 2026-09-23 section appended; read-only reviewer gate PASS (BanWindowReviewer, AC-01/02/03 all PASS) |

Test progression: 439 → **442 passed** (`apps/api`; +3 ban-window tests). Targeted run `test_alns_operators.py + test_eco_alns.py`: 14 passed. Contract run `test_contract.py`: 87 passed. Contract unchanged: **21 paths**; `test_frozen_openapi` green. No new deps. `ACTIVE_RULES` read-only (never assigned). Response wiring not applicable (optimizer library-level like prior ALNS slices — no HTTP exposure, avoids contract churn).

Branch note: loop runs on `so2026` (ALNS v2 code lives here); CR-20260923-003 stays in **review** until merge gate clears. No parallel agents used (sequential reviewer only, read-only).

---

## 2. Remaining gaps (smallest first — honest BLOCKED/infra)

1. **CORS prod value (ops, 15 min):** code split + docs + tests done; set real `GREENLOGIX_CORS_ORIGINS` per deploy, verify no `*` outside demo.
2. **GOFA real contract (BLOCKED on sponsor docs):** endpoint + UI + debounce/cancel/cap wait on official base URL/auth/schema. Provenance fields ready.
3. **Feedback promotion-to-rules workflow (half-day, narrowed):** queue + verify API + admin review endpoints exist; admin drawer UI + verified-to-`ACTIVE_RULES` promotion step missing (no auto-promotion path exists on purpose).
4. **ALNS remainder (code-closable, next slices):** route-level payload-bin cache, multiple restarts, full v1/v2 ablation benchmark rows. (Ban-window destroy op DONE this iteration.)
5. **Route audit drawer endpoint (code-closable):** OSM snapshot, restriction/model/solver versions, seed, profile, provider, place IDs, timestamp — additive GET, high enterprise-credibility value.
6. **PostGIS admin polygons (1–2 d, NOT STARTED at infra level):** `LINESTRING × ward polygons`, versioned NSO dataset; endpoint shape exists so swap is contained.
7. **Valhalla tiles/Docker/elevation (3–5 d, NOT STARTED at infra level):** manifest carries dev placeholders (`unpinned-dev`); snapshot pin + tile build + `/health` reachability flip to True.
8. **PyVRP/OR-Tools + Solomon/CVRPLIB (3–5 d, BLOCKED on new deps):** harness table ready; external solver deps + dataset runner missing (ponytail: no new deps without approval).
9. **Full JWT/Argon2id/tenant tables (1–2 w):** lockout + demo gate is correct fail-closed posture, but production auth is a rebuild; in-memory store needs Redis/shared store for multi-instance.
10. **Telemetry live + DRIVE + evidence UI panels (2–4 w):** GPS/OBD feed, GOOGLE-DRIVE benchmark layer, baseline panel / C0–C4 ladder.

---

## 3. Demo honesty slice (28/09 — what can ship)

- **Routing label:** every route shows `routing_quality`: `VERIFIED_GRAPH` or **`DEGRADED` (circuity estimate — not truck-verified)**. Fail-closed publish enforced when `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` — circuity routes get 403, say so.
- **PWA button:** `Chỉ đường (Google Maps · Ô tô)` + footnote *"Google tự tính lại lộ trình ô tô; không thay thế kiểm soát tải trọng GreenLogix."* No `Xe tải` claims.
- **Eco metric:** show only as `Estimated fuel — Model GLX-HDT-v1, C1 physics, uncalibrated`. Pareto policy cards carry `source="illustrative"` + SLA epsilon + structured why-facts until Valhalla rerank (report extra records `optimizer` + `pareto_source` audit labels).
- **Auth:** demo tokens (`Bearer DEMO`, PIN `0000`) labeled demo-tenant-only; 401 outside `GREENLOGIX_DEMO=1`; rapid PIN guessing locks out (20/300 s window, in-memory).
- **Feedback:** driver restriction reports queue as `pending_review`, manager reviews via pending/verify endpoints, never auto-mutate routing — say so or cut from demo script.
- **Optimizer:** EcoALNS runs hill-climb default with 5 destroy ops (incl. ban-window conflict removal); SA/budget/trace available opt-in — label all savings modeled, never optimal.
- **GOFA:** cut autocomplete from demo script (mock-only, no UI/endpoint). Valhalla self-host: manifest + health versions only, no tiles.
- **Wards:** `admin-areas` endpoint renders corridor estimate (centroid demo), not polygon GIS — say so or cut.
- **Mandatory honesty line:** *"Current release provides truck-aware routing and route/fleet optimization; the research eco-cost engine is being validated against peer-reviewed heavy-duty fuel models. Current CO₂ is an accounting estimate, not yet the optimization objective."*

---

## 4. Credit (genuinely done 09-28)

- Ban-window conflict destroy op wired (Decision 23/2018 overlap read-only, per-tour vehicle class, restricted-first, deterministic).
- 3 deterministic tests (same-seed order equality, restricted-first set, via-solver feasibility, registration/adaptive bound).
- CR-20260923-003 fenced + closed to review with completion block (SHA placeholder, files, tests, remaining risks).
- **442 pytest green** (was 439: +3 ban-window tests); contract unchanged (21 paths); banned-claims clean; vetoes empty; sequential-only.

---

## 5. Changed files

New this iteration (working tree on `so2026`):

- `apps/api/src/greenlogix_api/optimizer/eco_alns.py` (+~56: ban-window op, registration, weights, docstring)
- `apps/api/tests/test_alns_operators.py` (+3 tests, 10 → 13)
- `changes/CR-20260923-003.md` (new: fence + closeout, status review)
- `implementation-notes.md` (2026-09-23 section appended)
- `FRONTIER_GAP_AUDIT_2026-09-28.md` (this file, new)

Cumulative tracked diff vs base (37+ files on `so2026` working tree) includes prior loop batches — see 09-27 audit §5 for full list. Uncommitted, not merged to dev, no PR opened.

---

*End of audit 2026-09-28. Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` / `2026-09-22.md` / `2026-09-23.md` / `2026-09-24.md` / `2026-09-25.md` / `2026-09-26.md` / `2026-09-27.md` untouched. Next: §2 item 4 (payload-bin cache + restarts + ablation rows) or item 5 (route audit drawer endpoint).*

<!-- Actual Effort: Low -->
