"""Before/after km, litres, CO₂ from last optimize (RPT-02, C-04).

``/report`` carries the CR §4.1 metric dictionary under the additive ``metrics``
key — computed by the pure functions in ``analytics/metrics.py``, which are the
single source of truth for every formula (no second implementation lives here).
``/report.pdf`` renders the same payload with WeasyPrint, which needs system
pango/cairo and is therefore an **optional** dependency: absent it, the route
answers 501 naming the extra to install instead of 500-ing.
"""

from __future__ import annotations

import logging
from html import escape
from io import BytesIO
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from openpyxl import Workbook
from sqlmodel import Session

from greenlogix_api.analytics import metrics as metric_fns
from greenlogix_api.analytics.queries import kpis as analytics_kpis
from greenlogix_api.auth import require_dispatcher
from greenlogix_api.carbon import (
    EVIDENCE_ISO_NOTE,
    delta_from_totals,
    factor_citation_year,
    load_report,
)
from greenlogix_api.db import get_session
from greenlogix_api.schemas import (
    ZERO_DELTA,
    ZERO_REPORT_TOTALS,
    ReportMetrics,
    ReportOut,
    ReportTotals,
)

try:  # optional extra: needs system pango/cairo, so never a default dependency
    import weasyprint
except Exception:  # ImportError when absent; OSError when pango/cairo is missing
    weasyprint = None

log = logging.getLogger("greenlogix")

router = APIRouter(tags=["report"])

XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
PDF_TYPE = "application/pdf"
PDF_EXTRA_HINT = "uv sync --extra pdf"
PDF_UNAVAILABLE_DETAIL = (
    "PDF rendering needs the optional 'pdf' extra (WeasyPrint + system "
    f"pango/cairo), which is not installed. Install it with: {PDF_EXTRA_HINT}"
)


def standard_metric_block(optimized: ReportTotals, kpi: dict[str, Any]) -> ReportMetrics:
    """§4.1 dictionary for the optimized plan, via ``analytics.metrics``.

    Numerators are the stored plan's (the thing this report is about);
    denominators are the same DB aggregates ``/analytics/kpis`` publishes, so
    the two endpoints reconcile for one dataset. Two §4.1 metrics stay ``null``
    because the schema cannot support them — never because they are unused:
    ``empty_running_pct`` (routes are closed depot loops, no empty leg is
    recorded) and ``otif_pct`` (stops carry no delivered-at timestamp).
    """
    carbon = kpi.get("carbon") or {}
    load = kpi.get("load") or {}
    orders = (kpi.get("service") or {}).get("orders")
    kg_delivered = load.get("kg_delivered")
    return ReportMetrics(
        g_co2e_per_order=metric_fns.g_co2e_per_order(optimized.kg_co2, orders),
        g_co2e_per_tkm=metric_fns.g_co2e_per_tkm(
            optimized.kg_co2, load.get("transport_work_tkm")
        ),
        payload_utilisation_pct=metric_fns.payload_utilisation_pct(
            kg_delivered, load.get("capacity_kg_used")
        ),
        empty_running_pct=metric_fns.empty_running_pct(None, optimized.km),
        otif_pct=metric_fns.otif_pct(None, orders),
        kg_co2e_wtw=carbon.get("kg_co2e_wtw") if optimized.km > 0 else None,
        decomposition=carbon.get("decomposition"),
        # Provenance is read from the analytics payload, not re-spelled here, so
        # /report and /analytics/kpis can never disagree on the label.
        boundary=str(carbon.get("boundary") or "TTW"),
        factor_set=str(carbon.get("factor_set") or ""),
        factor_year=factor_citation_year(),
        confidence=str(carbon.get("confidence") or ""),
        model_version=str(carbon.get("model_version") or ""),
    )


def current_report(session: Session | None = None) -> ReportOut:
    """Stored plan + its §4.1 dictionary; zero payload when no plan is stored.

    ``session`` is optional so read-only callers that only need
    ``routing_quality`` (the publish gate) pay for no DB aggregate; without it
    the ``metrics`` block is left ``None`` rather than guessed.
    """
    stored = load_report()
    if stored is None:
        return ReportOut(
            baseline=ZERO_REPORT_TOTALS,
            optimized=ZERO_REPORT_TOTALS,
            delta=ZERO_DELTA,
        )
    # Recompute so km_pct is owned here, not a marketing constant (RPT-02).
    delta = delta_from_totals(stored.baseline, stored.optimized)
    return ReportOut(
        baseline=stored.baseline,
        optimized=stored.optimized,
        delta=delta,
        distance_provider=stored.distance_provider,
        routing_quality=stored.routing_quality,
        eco_weight=stored.eco_weight,
        metrics=(
            standard_metric_block(stored.optimized, analytics_kpis(session))
            if session is not None
            else None
        ),
    )


def report_workbook(payload: ReportOut) -> bytes:
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "report"
    ws.append(["metric", "baseline", "optimized", "delta", "delta_pct"])
    rows = (
        ("km", payload.baseline.km, payload.optimized.km, payload.delta.km, payload.delta.km_pct),
        (
            "litres",
            payload.baseline.litres,
            payload.optimized.litres,
            payload.delta.litres,
            payload.delta.litres_pct,
        ),
        (
            "kg_co2",
            payload.baseline.kg_co2,
            payload.optimized.kg_co2,
            payload.delta.kg_co2,
            payload.delta.kg_co2_pct,
        ),
    )
    for row in rows:
        ws.append(list(row))
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _num(value: float | None, digits: int = 2) -> str:
    return "n/a" if value is None else f"{value:,.{digits}f}"


def report_html(payload: ReportOut) -> str:
    """Self-contained HTML for the PDF (inline CSS, no external asset)."""
    totals = "".join(
        f"<tr><td>{label}</td><td>{_num(base)}</td><td>{_num(opt)}</td>"
        f"<td>{_num(delta)}</td><td>{_num(pct)}%</td></tr>"
        for label, base, opt, delta, pct in (
            ("km", payload.baseline.km, payload.optimized.km, payload.delta.km, payload.delta.km_pct),
            (
                "litres",
                payload.baseline.litres,
                payload.optimized.litres,
                payload.delta.litres,
                payload.delta.litres_pct,
            ),
            (
                "kg CO₂e (TTW)",
                payload.baseline.kg_co2,
                payload.optimized.kg_co2,
                payload.delta.kg_co2,
                payload.delta.kg_co2_pct,
            ),
        )
    )
    block = payload.metrics
    if block is None:
        metrics = '<tr><td colspan="2">no plan stored yet — metric dictionary unavailable</td></tr>'
    else:
        metrics = "".join(
            f"<tr><td>{escape(label)}</td><td>{_num(value)}</td></tr>"
            for label, value in (
                ("g CO₂e / order", block.g_co2e_per_order),
                ("g CO₂e / tonne-km (GLEC v3.2 / ISO 14083)", block.g_co2e_per_tkm),
                ("Payload utilisation %", block.payload_utilisation_pct),
                ("Empty running % (unmeasurable: no empty leg stored)", block.empty_running_pct),
                ("OTIF % (unmeasurable: no delivered-at timestamp)", block.otif_pct),
            )
        )
    year = block.factor_year if block is not None else None
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>EcoMiles CO₂ report</title>
<style>
body {{ font-family: sans-serif; font-size: 11px; margin: 24px; }}
h1 {{ font-size: 16px; margin: 0 0 12px; }}
h2 {{ font-size: 12px; margin: 18px 0 6px; }}
table {{ border-collapse: collapse; width: 100%; }}
td, th {{ border: 1px solid #999; padding: 3px 6px; text-align: left; }}
.foot {{ margin-top: 18px; color: #444; }}
</style></head><body>
<h1>EcoMiles — before/after CO₂ report</h1>
<h2>Totals</h2>
<table><tr><th>metric</th><th>baseline</th><th>optimized</th><th>delta</th><th>delta %</th></tr>
{totals}</table>
<h2>Standard-based metrics (optimized plan)</h2>
<table><tr><th>metric</th><th>value</th></tr>{metrics}</table>
<h2>Boundary &amp; factors</h2>
<table>
<tr><td>Boundary</td><td>{escape(str(block.boundary if block else "TTW"))}</td></tr>
<tr><td>Factor set</td><td>{escape(str(block.factor_set if block else ""))}</td></tr>
<tr><td>Factor year</td><td>{escape(str(year)) if year is not None else "n/a"}</td></tr>
<tr><td>Confidence</td><td>{escape(str(block.confidence if block else ""))}</td></tr>
<tr><td>Model version</td><td>{escape(str(block.model_version if block else ""))}</td></tr>
<tr><td>Distance provider</td><td>{escape(str(payload.distance_provider))}</td></tr>
<tr><td>Routing quality</td><td>{escape(str(payload.routing_quality))}</td></tr>
</table>
<p class="foot">{escape(EVIDENCE_ISO_NOTE)}. Fuel is modelled from the rated
litres/100 km spec — not measured by OBD telemetry.</p>
</body></html>"""


def report_pdf(payload: ReportOut) -> bytes:
    """Render ``payload`` to PDF bytes (WeasyPrint); the one place HTML → PDF.

    Tests call this directly; the route only adds the availability guard.
    """
    return weasyprint.HTML(string=report_html(payload)).write_pdf()


@router.get("/report", response_model=ReportOut)
def report(
    session: Annotated[Session, Depends(get_session)],
    _: None = Depends(require_dispatcher),
) -> ReportOut:
    log.info("path=/report")
    payload = current_report(session)
    log.info("km_pct=%s", payload.delta.km_pct)
    return payload


@router.get("/report.xlsx")
def report_xlsx(
    session: Annotated[Session, Depends(get_session)],
    _: None = Depends(require_dispatcher),
) -> Response:
    log.info("path=/report.xlsx")
    body = report_workbook(current_report(session))
    return Response(
        content=body,
        media_type=XLSX_TYPE,
        headers={"Content-Disposition": "attachment; filename=report.xlsx"},
    )


@router.get("/report.pdf", responses={501: {"description": PDF_UNAVAILABLE_DETAIL}})
def report_pdf_route(
    session: Annotated[Session, Depends(get_session)],
    _: None = Depends(require_dispatcher),
) -> Response:
    log.info("path=/report.pdf available=%s", weasyprint is not None)
    if weasyprint is None:
        # Optional dependency, not a server fault: name the extra to install.
        raise HTTPException(status_code=501, detail=PDF_UNAVAILABLE_DETAIL)
    body = report_pdf(current_report(session))
    return Response(
        content=body,
        media_type=PDF_TYPE,
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )
