"""Analytics HTTP surface: KPIs, timeseries, per-vehicle fleet (CR §4.2–§4.4).

Response bodies are plain dicts, not Pydantic models: the shape *is* the frozen
contract in CR-20261018-001 §4.2–§4.4, and a second copy of it in a model would
be one more place to drift. Field-level keys are pinned by
``tests/test_analytics_api.py``.

All three routes require the dispatcher credential; nothing here bypasses
``require_dispatcher``.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from greenlogix_api.analytics import queries
from greenlogix_api.auth import require_dispatcher
from greenlogix_api.db import get_session

log = logging.getLogger("greenlogix")

router = APIRouter(tags=["analytics"])

@router.get("/analytics/kpis")
def kpis(
    session: Annotated[Session, Depends(get_session)],
    _: None = Depends(require_dispatcher),
) -> dict[str, Any]:
    """KPI roll-up for the whole dataset (CR §4.2).

    Metrics that cannot be measured from stored data are ``null`` (never 0) —
    see ``metrics.py`` for the per-metric reason and its standard.

    ``service.late_orders`` is the *modelled* late-risk count from ``late.py``
    (depot→stop ETA at 30 km/h vs ``window_end``), NOT a measured OTIF
    numerator: no delivered-at timestamp is stored, which is why
    ``service.on_time`` and ``service.otif_pct`` are ``null``. Charts must label
    it "modelled".
    """
    log.info("path=/analytics/kpis")
    return queries.kpis(session)

@router.get("/analytics/timeseries")
def timeseries(
    session: Annotated[Session, Depends(get_session)],
    metric: Annotated[queries.MetricName, Query()] = "km",
    bucket: Annotated[Literal["day", "hour"], Query()] = "day",
    _: None = Depends(require_dispatcher),
) -> dict[str, Any]:
    """Bucketed series (CR §4.3). ``metric`` names the series of interest; the
    payload keeps the frozen 5-metric point shape, ``otif_pct`` stays null
    because no delivered-at timestamp is stored."""
    log.info("path=/analytics/timeseries metric=%s bucket=%s", metric, bucket)
    return queries.timeseries(session, metric, bucket)

@router.get("/analytics/fleet")
def fleet(
    session: Annotated[Session, Depends(get_session)],
    _: None = Depends(require_dispatcher),
) -> dict[str, Any]:
    """Per-vehicle km, fuel, CO2e, load and utilisation (CR §4.4)."""
    log.info("path=/analytics/fleet")
    return queries.fleet(session)
