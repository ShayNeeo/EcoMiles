# GreenLogix Frontier Plan — Implementation Verification & Gap Audit (feedback admin review loop closure)

**Plan:** `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md` (2026-09-21)
**Audit date:** 2026-09-25 (Asia/Ho_Chi_Minh)
**Branch:** `so2026`
**Method:** static code read + grep + `uv run pytest` from `apps/api` (**429 passed**, up from 425). Read-only reviewer gate PASS. No live Valhalla tiles / GOFA key / device test / OBD trials.
**Verdict:** 0/16 CRs fully pass. **16 PARTIAL, 0 NOT STARTED.** This iteration closed FRONTIER_GAP_AUDIT_2026-09-24.md §2 item 3 at code level on the loop branch (admin review endpoints wired + tested); parent CR-07 retains its infra remainder (PostGIS table + promotion-to-rules workflow), so no CR flips to PASS under the strict rule.

> Strict PASS rule: PASS only on full acceptance (no named remainder). DONE = wired + tested at code level. SCAFFOLD = honest stub with BLOCKED/infra note. Footnote on counts: 09-24 was 0/16/0 with four CR-001 items DONE. This revision keeps 0/16/0 — one §2 item moved DONE (§1 T-ADMIN-API + T-CONTRACT-TESTS) but parent CR-07 keeps PostGIS/promotion remainders.[^1]

[^1]: Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` / `2026-09-22.md` / `2026-09-23.md` / `2026-09-24.md` remain untouched; this is the new dated revision.

**Contract:** `apps/api/openapi.json` holds **21 paths** (was 19; `GET /driver/restriction-feedback/pending` + `POST /driver/restriction-feedback/{feedback_id}/verify` added, additive only; `FROZEN_METHODS` updated +2 in `tests/test_contract.py:29-31`). Banned-claims grep: no truck-safe guarantee, no ISO-certified wording — matches are negations/wording-contract only (`carbon.py:16-19`, `routers/optimize.py:176`, `solver/flags.py:9`, `solver/road_baseline.py:30`). `.opencode-state/betriebsrat/vetoes/` empty.

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
| CR-07 | Restriction overlay | ⚠️ PARTIAL | Coverage label + feedback endpoint + verification queue + **admin review endpoints (no auto-mutate)**; PostGIS `restriction_rules` table + promotion workflow missing | `solver/road_baseline.py:515-562`; `solver/__init__.py:89,340`; `geo/restrictions.py:16-51,128-186`; `routers/driver.py:132-203`; `schemas.py:199-228`; `tests/test_restriction_feedback.py` (10 tests) |
| CR-08 | Admin boundary segmentation | ⚠️ PARTIAL | Versioned `admin-areas` endpoint; centroid fallback only, no PostGIS polygons | `routers/optimize.py:181-201`; `geo/admin_boundaries.py:53-93`; `docs/research/admin_boundaries.md`; `tests/test_admin_areas.py` |
| CR-09 | Energy Model V1 | ⚠️ PARTIAL | Trace table + P_AUX single-value 1500 W fix; OBD calibration BLOCKED | `energy/hdt_v1.py:20-25,76`; `docs/research/energy_model_spec.md:100-109`; `tests/test_energy_trace.py` |
| CR-10 | EcoPath Pareto | ⚠️ PARTIAL | `source` label (`verified`/`illustrative`) + C1 tier + audit label in report extra; candidates still illustrative scalings | `routing/pareto.py:26-52,146-168`; `carbon.py:104-119` (`pareto_source: illustrative`); `tests/test_pareto_rerank.py`, `tests/test_optimizer_audit.py` |
| CR-11 | Reference solvers + harness | ⚠️ PARTIAL | Harness table + 2 ref solvers; no PyVRP/OR-Tools deps | `benchmark/harness.py:25,47`; `benchmark/solvers_ref.py:17,39`; `tests/test_harness.py` |
| CR-12 | EcoALNS v1 + v2 operators | ⚠️ PARTIAL | 2 destroy + 2 repair + adaptive weights + optimizer audit label; hill-climb only, no SA/budget/trace/ablation | `optimizer/eco_alns.py:131-279,297-380`; `carbon.py:104-119`; `tests/test_eco_alns.py`, `test_alns_operators.py`, `test_optimizer_audit.py` (4 tests) |
| CR-13 | (operators — merged w/ CR-12) | ⚠️ PARTIAL | See CR-12 row | Same as CR-12 |
| CR-14 | Google DRIVE connector | ⚠️ PARTIAL | Stub raises `RoadBaselineNotConfigured` correctly; no harness/traffic wiring | `solver/road_baseline.py:64,375-386` |
| CR-15 | Investor evidence UI | ⚠️ PARTIAL | `C1-illustrative` payload + spec; no audit drawer / baseline panel / C0–C4 ladder | `carbon.py:18-28,102`; `docs/research/evidence_ui.md:47-83`; `tests/test_evidence.py` |
| CR-16 | Telemetry + calibration | ⚠️ PARTIAL | Fuel-obs ingest stub + `mae_mape`; no GPS/OBD live feed | `telemetry/ingest.py:18-90`; `telemetry/calibration.py:8`; `tests/test_telemetry.py` |

Strict rule applied: PASS only on full acceptance. One 09-24 §2 item closed at code level (admin review), but CR-07 retains named infra remainders — hence still 16× PARTIAL. (CR-12/CR-13 share the EcoALNS row; counted separately in the 16.)

---

## 1. Loop confirmations (09-25: T-ADMIN-API + T-CONTRACT-TESTS, CR-20260923-002 scope on so2026)

| # | Item | State | Evidence |
|---|------|-------|----------|
| T-ADMIN-API | Admin review endpoints (list + verify, manager-only) | ✅ DONE | `routers/driver.py:162-203` `GET /driver/restriction-feedback/pending` + `POST /driver/restriction-feedback/{feedback_id}/verify`, both `Depends(require_manager_role)`; unknown id 404 `unknown_feedback_id`; docstrings state never touches `ACTIVE_RULES` (calls `list_pending`/`verify_feedback` only); `schemas.py:212-228` additive `FeedbackItemOut` (8 fields) + `FeedbackVerifyIn{approved:bool}`, `FeedbackOut` untouched |
| T-CONTRACT-TESTS | Contract regen + targeted tests + notes | ✅ DONE | `openapi.json` regen 19 → **21 paths** (only additions); `tests/test_contract.py:29-31` `FROZEN_METHODS` +2, `test_frozen_openapi` green; `tests/test_restriction_feedback.py` 10 tests (6 base + 4 admin: list-pending, verify-flow-empties-queue + `ACTIVE_RULES` identical, scoped-driver 403 both endpoints, unknown-id 404); `implementation-notes.md` 2026-09-25 section appended; read-only reviewer gate PASS |

Test progression: 425 → **429 passed** (`apps/api`; +4 admin tests). Targeted run `test_restriction_feedback.py + test_contract.py`: 97 passed. New contract: 19 → **21 paths** (only additions `pending` + `{feedback_id}/verify`).

Branch note: user required fresh `cr/002-feedback-admin` from `origin/dev`, but queue code lives only on `so2026` — fresh worktree (17 paths, no queue) kept empty per rules. This closure runs on `so2026`; CR-20260923-002 stays **blocked** on the fresh-branch path until CR-001 lands to dev, then rebase. No parallel agents used (sequential reviewer only, read-only).

---

## 2. Remaining gaps (smallest first — honest BLOCKED/infra)

1. **CORS prod value (ops, 15 min):** code split + docs + tests done; set real `GREENLOGIX_CORS_ORIGINS` per deploy, verify no `*` outside demo.
2. **GOFA real contract (BLOCKED on sponsor docs):** endpoint + UI + debounce/cancel/cap wait on official base URL/auth/schema. Provenance fields ready.
3. **Feedback promotion-to-rules workflow (half-day, narrowed):** queue + verify API + admin review endpoints exist; admin review drawer UI + verified-to-`ACTIVE_RULES` promotion step missing (no auto-promotion path exists on purpose).
4. **PostGIS admin polygons (1–2 d, NOT STARTED at infra level):** `LINESTRING × ward polygons`, versioned NSO dataset; endpoint shape exists so swap is contained.
5. **Valhalla tiles/Docker/elevation (3–5 d, NOT STARTED at infra level):** manifest carries dev placeholders (`unpinned-dev`); snapshot pin + tile build + `/health` reachability flip to True.
6. **Pareto Valhalla rerank Stage-1 (1–2 d):** alternatives → `hdt_v1` scoring → dominance filter; `source="verified"` path defined, unreachable until tiles land.
7. **PyVRP/OR-Tools + Solomon/CVRPLIB (3–5 d):** harness table ready; external solver deps + dataset runner missing.
8. **ALNS v2 remainder (1–2 w):** SA/record-to-record acceptance, runtime budget + convergence trace, uphill/restriction/ban operators, ablation study.
9. **Full JWT/Argon2id/tenant tables (1–2 w):** lockout + demo gate is correct fail-closed posture, but production auth is a rebuild; in-memory store needs Redis/shared store for multi-instance.
10. **Telemetry live + DRIVE + evidence UI (2–4 w):** GPS/OBD feed, GOOGLE-DRIVE benchmark layer, audit drawer / baseline panel / C0–C4 ladder.

---

## 3. Demo honesty slice (25/09 — what can ship)

- **Routing label:** every route shows `routing_quality`: `VERIFIED_GRAPH` or **`DEGRADED` (circuity estimate — not truck-verified)**. Fail-closed publish enforced when `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` — circuity routes get 403, say so.
- **PWA button:** `Chỉ đường (Google Maps · Ô tô)` + footnote *"Google tự tính lại lộ trình ô tô; không thay thế kiểm soát tải trọng GreenLogix."* No `Xe tải` claims.
- **Eco metric:** show only as `Estimated fuel — Model GLX-HDT-v1, C1 physics, uncalibrated`. Pareto cards carry `source="illustrative"` until Valhalla rerank (report extra now records `optimizer` + `pareto_source` audit labels).
- **Auth:** demo tokens (`Bearer DEMO`, PIN `0000`) labeled demo-tenant-only; 401 outside `GREENLOGIX_DEMO=1`; rapid PIN guessing locks out (20/300 s window, in-memory).
- **Feedback:** driver restriction reports queue as `pending_review`, manager reviews via pending/verify endpoints, never auto-mutate routing — say so or cut from demo script.
- **GOFA:** cut autocomplete from demo script (mock-only, no UI/endpoint). Valhalla self-host: manifest + health versions only, no tiles.
- **Wards:** `admin-areas` endpoint renders corridor estimate (centroid demo), not polygon GIS — say so or cut.
- **Mandatory honesty line:** *"Current release provides truck-aware routing and route/fleet optimization; the research eco-cost engine is being validated against peer-reviewed heavy-duty fuel models. Current CO₂ is an accounting estimate, not yet the optimization objective."*

---

## 4. Credit (genuinely done 09-25)

- Admin review endpoints wired manager-only (list pending + verify, 404 unknown, 403 scoped driver) — smallest 09-24 §2 code-closable gap closed.
- Contract additive-only (19 → 21 paths) with frozen-method entries + reviewer PASS.
- **429 pytest green** (was 425: +4 admin review tests).
- Banned-claims clean (negations/wording-contract only); vetoes empty; no parallel-agent violation.

---

## 5. Changed files

New this iteration (working tree on `so2026`):

- `apps/api/src/greenlogix_api/routers/driver.py` (+42: pending + verify endpoints)
- `apps/api/src/greenlogix_api/schemas.py` (+19: `FeedbackItemOut` + `FeedbackVerifyIn`)
- `apps/api/openapi.json` (regen 19 → 21 paths, additive only)
- `apps/api/tests/test_contract.py` (`FROZEN_METHODS` +2)
- `apps/api/tests/test_restriction_feedback.py` (+4 admin tests, 6 → 10)
- `implementation-notes.md` (2026-09-25 section appended)
- `FRONTIER_GAP_AUDIT_2026-09-25.md` (this file, new)

Cumulative tracked diff vs base (`git diff --stat`, 37 files on `so2026` working tree) includes prior loop batches (auth, carbon, db, energy, geo, optimizer, places, routers, solver, tests, landing copy, ADR 0001, energy spec) — see 09-24 audit §5 for full list. Uncommitted, not merged to dev, no PR opened.

---

*End of audit 2026-09-25. Prior files `FRONTIER_GAP_AUDIT_2026-09-21.md` / `2026-09-22.md` / `2026-09-23.md` / `2026-09-24.md` untouched. Next: §2 infra items (tiles, PostGIS, JWT) or land CR-001 to dev to unblock CR-002 rebase.*

<!-- Actual Effort: Low -->
