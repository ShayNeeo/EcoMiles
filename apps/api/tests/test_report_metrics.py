"""C-04: /report carries the §4.1 metric dictionary + /report.pdf (WeasyPrint).

Three honesty properties are pinned here:
  1. reconciliation — the stored plan's totals equal what /analytics/kpis
     aggregates from the same DB (km, litres, kg CO₂e), and the two metric
     blocks agree wherever both are computable;
  2. the §4.1 keys exist and are ``null`` exactly where the schema cannot
     support them (empty running, OTIF) — never a fabricated 0;
  3. the PDF route answers 501 naming the optional extra when WeasyPrint is
     absent, and real PDF bytes when it is installed.
"""

from __future__ import annotations

import pytest

from greenlogix_api import db as dbmod
from greenlogix_api.analytics import queries
from greenlogix_api.routers import report as report_router
from greenlogix_api.schemas import ZERO_DELTA, ZERO_REPORT_TOTALS, ReportOut

AUTH = {"Authorization": "Bearer DEMO"}

# The additive block, exactly (CR §4.1 names + the factor provenance).
METRIC_KEYS = {
    "g_co2e_per_order",
    "g_co2e_per_tkm",
    "payload_utilisation_pct",
    "empty_running_pct",
    "otif_pct",
    "kg_co2e_wtw",
    "decomposition",
    "boundary",
    "factor_set",
    "factor_year",
    "confidence",
    "model_version",
}
REPORT_KEYS = {
    "baseline",
    "optimized",
    "delta",
    "distance_provider",
    "routing_quality",
    "eco_weight",
    "metrics",
}

requires_pdf = pytest.mark.skipif(
    report_router.weasyprint is None,
    reason="optional 'pdf' extra not installed (uv sync --extra pdf)",
)


@pytest.fixture(autouse=True)
def _reset_backend_state():
    """Module-level DuckDB verdicts must not leak between tests."""
    queries._duck_installed = False
    queries._duck_broken = False
    yield
    queries._duck_installed = False
    queries._duck_broken = False


@pytest.fixture
def planned(demo_client, monkeypatch, tmp_path):
    """A seeded DB with a stored plan — the state both endpoints report on."""
    monkeypatch.setattr(dbmod, "SEED_DIR", tmp_path / "seed")
    assert demo_client.post("/seed", headers=AUTH).status_code == 200
    optimized = demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0})
    assert optimized.status_code == 200
    return demo_client


def _get(client, path: str) -> dict:
    res = client.get(path, headers=AUTH)
    assert res.status_code == 200
    return res.json()


def test_report_totals_reconcile_with_analytics_kpis(planned) -> None:
    """One dataset, one set of totals: report optimized == the analytics sums."""
    body = _get(planned, "/report")
    kpis = _get(planned, "/analytics/kpis")
    optimized = body["optimized"]
    assert optimized["km"] == pytest.approx(kpis["distance"]["km_total"])
    assert optimized["litres"] == pytest.approx(kpis["cost"]["fuel_litres"])
    assert optimized["kg_co2"] == pytest.approx(kpis["carbon"]["kg_co2e_ttw"])
    # Same formulas, same denominators ⇒ the two blocks agree where computable.
    block = body["metrics"]
    assert block["g_co2e_per_order"] == pytest.approx(kpis["carbon"]["g_co2e_per_order"])
    assert block["g_co2e_per_tkm"] == pytest.approx(kpis["carbon"]["g_co2e_per_tkm"])
    assert block["payload_utilisation_pct"] == pytest.approx(
        kpis["load"]["payload_utilisation_pct"]
    )
    assert block["kg_co2e_wtw"] == pytest.approx(kpis["carbon"]["kg_co2e_wtw"])
    assert block["decomposition"] == kpis["carbon"]["decomposition"]

def test_report_metric_block_keys_and_documented_nulls(planned) -> None:
    body = _get(planned, "/report")
    assert set(body) == REPORT_KEYS
    assert set(body["baseline"]) == {"km", "litres", "kg_co2"}
    block = body["metrics"]
    assert set(block) == METRIC_KEYS
    # Unmeasurable from the stored schema — null, not 0.
    assert block["empty_running_pct"] is None
    assert block["otif_pct"] is None
    # Measurable from the stored plan + DB aggregates.
    assert block["payload_utilisation_pct"] > 0
    assert block["g_co2e_per_order"] > 0
    assert block["g_co2e_per_tkm"] > 0
    assert block["kg_co2e_wtw"] > 0
    assert block["decomposition"] is not None
    assert block["decomposition"]["methodology"] == "GLEC v3.2 ASI / PVM decomposition (modelled)"
    # Provenance: factor set + its citation year + the boundary, never invented.
    assert block["boundary"] == "TTW"
    assert block["factor_set"] == "IPCC 2006 -> GLEC v3.2 cross-check"
    assert block["factor_year"] == 2006
    assert block["confidence"] == "C1-illustrative"
    assert block["model_version"] == "GLX-HDT-v1.0"


def test_report_metric_block_absent_without_a_stored_plan(demo_client) -> None:
    """No plan stored ⇒ no dictionary. Guessing zeros per order would be a lie."""
    body = _get(demo_client, "/report")
    assert body["metrics"] is None
    assert body["optimized"] == {"km": 0.0, "litres": 0.0, "kg_co2": 0.0}


def test_report_pdf_501_names_the_pdf_extra(planned, monkeypatch) -> None:
    monkeypatch.setattr(report_router, "weasyprint", None)
    res = planned.get("/report.pdf", headers=AUTH)
    assert res.status_code == 501
    assert "uv sync --extra pdf" in res.json()["detail"]


def test_report_pdf_requires_bearer(demo_client) -> None:
    assert demo_client.get("/report.pdf").status_code == 401


@requires_pdf
def test_report_pdf_function_renders_a_pdf() -> None:
    """The factored render function is callable on its own (no HTTP, no DB)."""
    payload = ReportOut(
        baseline=ZERO_REPORT_TOTALS, optimized=ZERO_REPORT_TOTALS, delta=ZERO_DELTA
    )
    assert report_router.report_pdf(payload).startswith(b"%PDF")


@requires_pdf
def test_report_pdf_route_returns_pdf_bytes(planned) -> None:
    res = planned.get("/report.pdf", headers=AUTH)
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("application/pdf")
    assert res.content.startswith(b"%PDF")
