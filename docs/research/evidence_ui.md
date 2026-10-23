# Evidence & Audit Drawer UI Spec (CR-15 PARTIAL)

**Status:** PARTIAL — audit/confidence fields in report `extra` + this spec.
No frontend framework change. No new API paths (OpenAPI frozen).
**Date:** 2026-09-22
**Release confidence:** `C1-illustrative`

---

## 1. Purpose

Close CR-15 from NOT STARTED to PARTIAL with minimal honest evidence: every
savings/CO2 number in the dispatcher UI can open an audit drawer showing the
model version, the confidence level, and the exact ISO/GLEC wording. No number
is ever presented as audited or guaranteed.

## 2. Confidence ladder C0–C4 (normative)

| Level | Name | Meaning | UI badge |
|---|---|---|---|
| C0 | `C0-unmeasured` | No modeled estimate yet (empty/zero report). | "no estimate" |
| C1 | `C1-illustrative` | **Current release.** Modeled TTW estimate from circuity distances x in-repo emission factors; TTW estimate per GLEC-aligned factors, not certified; no OBD calibration; savings are illustrative only. | "illustrative estimate" |
| C2 | `C2-calibrated` | Future: fuel map calibrated against OBD trials. Still reported as TTW estimate per GLEC-aligned factors, not certified, until any independent review exists. | "calibrated estimate" |
| C3 | `C3-verified-graph` | Future: C2 plus verified road graph + restriction overlay. Still TTW estimate per GLEC-aligned factors, not certified, unless independent review is recorded. | "verified-graph estimate" |
| C4 | `C4-assured` | Future: independent third-party review recorded with report hash. Not reached — all current releases are TTW estimates per GLEC-aligned factors, not certified. | "independently reviewed" |

Rules:

- The ladder only moves up with recorded evidence (calibration trial id,
  graph manifest hash, review record). Never by assertion.
- The current release is **C1** (`C1-illustrative`). Any UI copy that implies
  C2 or above is a defect.
- Wherever the drawer names ISO 14083 or GLEC factors, the same string carries
  "not certified" (see section 5).

## 3. Evidence fields in report `extra` (code-level, additive)

Written by `carbon.save_report()` via `evidence_audit_extra()`; merged with
`setdefault` so caller values win and a failure never breaks the report write.
`persist_plan()` in `routers/optimize.py` merges the same dict explicitly.
No `schemas.py` change, no OpenAPI regen (frozen path set untouched).

| Key | Value (exact) | Source |
|---|---|---|
| `model_version` | `GLX-HDT-v1.0` | `carbon.EVIDENCE_MODEL_VERSION`; matches `geo/road_graph` `cost_model_version` and `energy/hdt_v1.HdtEnergyModelV1.version_name` |
| `confidence` | `C1-illustrative` | `carbon.EVIDENCE_CONFIDENCE`; ladder defined in section 2 |
| `iso_note` | `TTW estimate per GLEC-aligned factors, not certified` | `carbon.EVIDENCE_ISO_NOTE`; exact honest wording, contains "not certified" |

These ride alongside the 7 manifest keys from `road_graph_audit_extra()`
plus `distance_provider`, `routing_quality`, `eco_weight` in the stored
`last_report.json` payload.

## 4. Audit drawer spec (dispatcher page, no framework change)

- **Trigger:** a "Why this number?" toggle next to the existing TTW CO2 strip.
  Plain server-rendered `<details>` element (or minimal JS toggle) — no new
  frontend framework, no new route.
- **Drawer sections (in order):**
  1. `What this is` — one line: "Illustrative TTW CO2 estimate for this plan
     (model `GLX-HDT-v1.0`, confidence `C1-illustrative`)."
  2. `How it was computed` — distance provider + routing quality + fuel
     factors file: e.g. "circuity distances x emission_factors.json
     (DEGRADED graph)".
  3. `Confidence` — badge per section 2 plus one-line level meaning.
  4. `Standards note` — the exact `iso_note` string: "TTW estimate per
     GLEC-aligned factors, not certified".
  5. `Versions` — collapsible list of the stored manifest keys
     (`osm_snapshot_id`, `tile_build_hash`, `cost_model_version`, ...).
- **Copy constraints:** numbers are labeled "estimate" or "illustrative";
  never "guaranteed", never "truck-safe", never a bare percent without its
  denominator, model, and confidence beside it.

## 5. ISO/GLEC wording rule (normative)

- Every user-visible sentence that names ISO 14083 or GLEC factors must also
  contain the words "not certified" — for example, all GLEC-aligned factor
  mentions in this spec are written as TTW estimates per GLEC-aligned
  factors, not certified, and all ISO 14083 alignment mentions in this spec
  are written as reporting alignment with ISO 14083, not certified.
- Canonical strings: `iso_note` = "TTW estimate per GLEC-aligned factors, not certified". The dispatcher TTW strip keeps its existing label and the
  drawer adds this note verbatim.
- Rationale: GreenLogix reports modeled fuel and GLEC-aligned estimates with
  reporting alignment to ISO 14083, not certified, until empirical OBD
  calibration trials and any independent review are completed and recorded.

## 6. What is NOT claimed

- No third-party review is claimed; current releases are TTW estimates per
  GLEC-aligned factors, not certified.
- No truck-safe routing guarantee is claimed (circuity quality stays
  DEGRADED until a verified graph ships; publish gate stays fail-closed).
- No fixed savings percent is promised; deltas are computed per plan
  (optimized minus baseline) and labeled illustrative at C1.

## 7. Test trace

- `apps/api/tests/test_evidence.py::test_evidence_extra_fields_present`
- `apps/api/tests/test_evidence.py::test_iso_wording_exact_and_negated`
- `apps/api/tests/test_evidence.py::test_no_positive_claim_in_payload`
- `apps/api/tests/test_evidence.py::test_persist_plan_propagates_evidence`
- `apps/api/tests/test_evidence.py::test_confidence_ladder_current_is_c1`
- Contract guard: `tests/test_contract.py::test_frozen_openapi` stays green
  (no schema change — evidence lives in the report file `extra` dict).
