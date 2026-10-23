"""T-LOOP-EVIDENCE: honest audit/confidence fields in report extra (CR-15 PARTIAL).

CR-15 was NOT STARTED (no audit drawer / confidence ladder). Minimal honest
evidence fields in the report ``extra`` dict move it to PARTIAL:
``model_version=GLX-HDT-v1.0``, ``confidence=C1-illustrative``,
``iso_note="TTW estimate per GLEC-aligned factors, not certified"``.

Code-level ``extra`` dict only; ``schemas.py`` untouched so the frozen OpenAPI
path set is unchanged (D-LOOP3). Full C0-C4 ladder + drawer spec live in
``docs/research/evidence_ui.md``; current release is C1.
"""

from __future__ import annotations

import json
from types import SimpleNamespace

from sqlmodel import Session

from greenlogix_api import carbon
from greenlogix_api import db as dbmod
from greenlogix_api.carbon import evidence_audit_extra
from greenlogix_api.routers.optimize import persist_plan
from greenlogix_api.schemas import TotalsOut

EXPECTED_MODEL_VERSION = "GLX-HDT-v1.0"
EXPECTED_CONFIDENCE = "C1-illustrative"
EXPECTED_ISO_NOTE = "TTW estimate per GLEC-aligned factors, not certified"


def _read_report_json() -> dict:
    return json.loads(dbmod.REPORT_PATH.read_text(encoding="utf-8"))


def _all_strings(node: object) -> list[str]:
    found: list[str] = []
    if isinstance(node, str):
        found.append(node)
    elif isinstance(node, dict):
        for value in node.values():
            found.extend(_all_strings(value))
    elif isinstance(node, (list, tuple)):
        for value in node:
            found.extend(_all_strings(value))
    return found


def test_evidence_extra_fields_present() -> None:
    carbon.save_report(
        TotalsOut(km=10.0, litres=1.0, kg_co2=2.31),
        TotalsOut(km=8.0, litres=0.8, kg_co2=1.848),
        extra={
            "distance_provider": "circuity",
            "routing_quality": "DEGRADED",
            "eco_weight": 0.0,
        },
    )
    payload = _read_report_json()
    assert payload["model_version"] == EXPECTED_MODEL_VERSION
    assert payload["confidence"] == EXPECTED_CONFIDENCE
    assert payload["iso_note"] == EXPECTED_ISO_NOTE
    # Existing caller fields preserved (additive, nothing removed).
    assert payload["distance_provider"] == "circuity"
    assert payload["routing_quality"] == "DEGRADED"


def test_iso_wording_exact_and_negated() -> None:
    extra = evidence_audit_extra()
    assert extra["iso_note"] == EXPECTED_ISO_NOTE
    note = str(extra["iso_note"])
    assert "not certified" in note
    assert "GLEC" in note


def test_no_positive_claim_in_payload() -> None:
    carbon.save_report(
        TotalsOut(km=10.0, litres=1.0, kg_co2=2.31),
        TotalsOut(km=8.0, litres=0.8, kg_co2=1.848),
        extra={"distance_provider": "circuity"},
    )
    payload = _read_report_json()
    for text in _all_strings(payload):
        if "certified" in text.lower():
            assert "not certified" in text.lower(), (
                f"positive certified claim without negation: {text!r}"
            )


def test_persist_plan_propagates_evidence() -> None:
    result = SimpleNamespace(
        routes=[],
        unassigned_ids=[],
        baseline=TotalsOut(km=10.0, litres=1.0, kg_co2=2.31),
        totals=TotalsOut(km=8.0, litres=0.8, kg_co2=1.848),
        distance_provider="circuity",
        routing_quality="DEGRADED",
        eco_weight=0.0,
    )
    with Session(dbmod.engine) as session:
        assert persist_plan(session, result) == []
    payload = _read_report_json()
    assert payload["model_version"] == EXPECTED_MODEL_VERSION
    assert payload["confidence"] == EXPECTED_CONFIDENCE
    assert payload["iso_note"] == EXPECTED_ISO_NOTE


def test_confidence_ladder_current_is_c1() -> None:
    extra = evidence_audit_extra()
    assert extra["confidence"] == "C1-illustrative"
    assert str(extra["confidence"]).startswith("C1")
    assert extra["model_version"] == "GLX-HDT-v1.0"


def test_evidence_caller_override_wins() -> None:
    carbon.save_report(
        TotalsOut(km=1.0, litres=0.1, kg_co2=0.231),
        TotalsOut(km=1.0, litres=0.1, kg_co2=0.231),
        extra={"confidence": "C0-unmeasured"},
    )
    assert _read_report_json()["confidence"] == "C0-unmeasured"
