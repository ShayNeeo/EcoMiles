"""C-05: optimizer + pareto_source audit labels in report extra (CR-20260923-001).

Scope: additive ``extra`` dict only, no schema/OpenAPI change, no solver math.
``optimizer`` = optimizer_from_env() ("legacy" default, "ecoalns" when flag set;
ALNS stays hill-climb documented, flag only recorded). ``pareto_source`` is
always "illustrative" for now (circuity/Valhalla-unwired); the verified path
stays library-level in routing/pareto.rerank_from_alternatives (verified=True),
router only records the source label. No optimality claims.
"""

from __future__ import annotations

import json
from types import SimpleNamespace

from sqlmodel import Session

from greenlogix_api import carbon
from greenlogix_api import db as dbmod
from greenlogix_api.routers.optimize import persist_plan
from greenlogix_api.schemas import TotalsOut
from greenlogix_api.solver.flags import optimizer_name_for_audit


def _read_report_json() -> dict:
    return json.loads(dbmod.REPORT_PATH.read_text(encoding="utf-8"))


def _totals(km: float = 10.0) -> TotalsOut:
    return TotalsOut(km=km, litres=1.0, kg_co2=2.31)


def _result() -> SimpleNamespace:
    return SimpleNamespace(
        routes=[],
        unassigned_ids=[],
        baseline=_totals(10.0),
        totals=_totals(8.0),
        distance_provider="circuity",
        routing_quality="DEGRADED",
        eco_weight=0.0,
    )


def test_save_report_carries_optimizer_and_pareto_source(monkeypatch) -> None:
    """Default flag -> optimizer=legacy, pareto_source=illustrative."""
    monkeypatch.delenv("GREENLOGIX_OPTIMIZER", raising=False)
    carbon.save_report(
        _totals(10.0),
        _totals(8.0),
        extra={"distance_provider": "circuity", "routing_quality": "DEGRADED"},
    )
    payload = _read_report_json()
    assert payload["optimizer"] == "legacy"
    assert payload["pareto_source"] == "illustrative"
    # Existing caller fields preserved (additive, nothing removed).
    assert payload["distance_provider"] == "circuity"
    assert payload["routing_quality"] == "DEGRADED"


def test_ecoalns_flag_does_not_crash_and_records_label(monkeypatch) -> None:
    """GREENLOGIX_OPTIMIZER=ecoalns -> optimizer=ecoalns, no crash."""
    monkeypatch.setenv("GREENLOGIX_OPTIMIZER", "ecoalns")
    assert optimizer_name_for_audit() == "ecoalns"
    carbon.save_report(_totals(10.0), _totals(8.0), extra={})
    payload = _read_report_json()
    assert payload["optimizer"] == "ecoalns"
    assert payload["pareto_source"] == "illustrative"


def test_caller_override_wins(monkeypatch) -> None:
    """Caller-supplied optimizer/pareto_source win via setdefault."""
    monkeypatch.delenv("GREENLOGIX_OPTIMIZER", raising=False)
    carbon.save_report(
        _totals(1.0),
        _totals(1.0),
        extra={"optimizer": "custom", "pareto_source": "custom-src"},
    )
    payload = _read_report_json()
    assert payload["optimizer"] == "custom"
    assert payload["pareto_source"] == "custom-src"


def test_persist_plan_propagates_optimizer_audit(monkeypatch) -> None:
    """Optimize path (persist_plan) carries both keys; flag typo never fails."""
    monkeypatch.setenv("GREENLOGIX_OPTIMIZER", "typo-value")
    with Session(dbmod.engine) as session:
        assert persist_plan(session, _result()) == []
    payload = _read_report_json()
    assert payload["optimizer"] == "legacy"
    assert payload["pareto_source"] == "illustrative"


def test_ecomiles_optimizer_env_takes_precedence(monkeypatch) -> None:
    monkeypatch.setenv("ECOMILES_OPTIMIZER", "ecoalns")
    monkeypatch.setenv("GREENLOGIX_OPTIMIZER", "legacy")
    assert optimizer_name_for_audit() == "ecoalns"


def test_optimize_endpoint_with_constraints_and_ecoalns(demo_client) -> None:
    auth = {"Authorization": "Bearer DEMO"}
    assert demo_client.post("/seed", headers=auth).status_code == 200
    res = demo_client.post(
        "/optimize",
        headers=auth,
        json={
            "optimizer": "ecoalns",
            "enforce_time_windows": True,
            "enforce_truck_ban": True,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["optimizer_used"] == "ecoalns"
    assert data["ban_conflicts"] == 0
    assert data["time_window_conflicts"] == 0
    assert "decision23-2018-v1:checked" in data["restriction_coverage"]
