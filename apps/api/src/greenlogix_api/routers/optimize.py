"""Optimize / publish. Cluster + NN + 2-opt, OSM consumer of /routes."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from greenlogix_api import db as dbmod
from greenlogix_api.auth import require_dispatcher
from greenlogix_api.carbon import EVIDENCE_MODEL_VERSION, save_report
from greenlogix_api.db import get_session
from greenlogix_api.models import Order, Route, Stop, Vehicle
from greenlogix_api.routers.report import current_report
from greenlogix_api.schemas import OptimizeIn, OptimizeOut, PublishIn, RouteOut
from greenlogix_api.seed import DEPOT_LAT, DEPOT_LNG, DEPOT_NAME
from greenlogix_api.serialize import planned_to_stop_models, route_out
from greenlogix_api.solver import run_vrp
from greenlogix_api.solver.cluster import CLUSTER_RADIUS_KM
from greenlogix_api.solver.flags import (
    optimizer_name_for_audit,
    publish_blocked_for_quality,
)
from greenlogix_api.solver.road_baseline import quality_for_provider

log = logging.getLogger("greenlogix")

router = APIRouter(tags=["optimize"])


def _load_stops(session: Session, route_id: int) -> list[Stop]:
    return list(session.exec(select(Stop).where(Stop.route_id == route_id)).all())


def persist_plan(session: Session, result, *, wipe: bool = True) -> list[Route]:
    if wipe:
        for stop in session.exec(select(Stop)).all():
            session.delete(stop)
        for route in session.exec(select(Route)).all():
            session.delete(route)
        session.commit()

    stored: list[Route] = []
    for planned in result.routes:
        vehicle = planned.vehicle
        route = Route(
            vehicle_id=vehicle.id or 0,
            plate=vehicle.plate,
            color=planned.color,
            published=False,
            km=planned.km,
            litres=planned.litres,
            kg_co2=planned.kg_co2,
            overload=planned.overload,
        )
        session.add(route)
        session.commit()
        session.refresh(route)
        rid = route.id or 0
        for stop in planned_to_stop_models(rid, planned):
            session.add(stop)
        session.commit()
        stored.append(route)
        log.info("persist route_id=%s vehicle_id=%s stops=%s", rid, route.vehicle_id, len(planned.stops))
    try:  # T-LOOP-MANIFEST: audit versions flow additively; never fail optimize
        from greenlogix_api.geo.road_graph import road_graph_audit_extra

        _manifest_extra: dict[str, object] = road_graph_audit_extra()
    except Exception:
        log.warning("road_graph manifest unavailable; continuing without audit extra")
        _manifest_extra = {}
    try:  # T-LOOP-EVIDENCE: honest confidence/ISO wording; never fail optimize
        from greenlogix_api.carbon import evidence_audit_extra

        _evidence_extra: dict[str, object] = evidence_audit_extra()
    except Exception:
        log.warning("evidence audit extra unavailable; continuing without it")
        _evidence_extra = {}
    try:  # T-LOOP-GEO: pin admin boundary dataset version; never fail optimize
        from greenlogix_api.geo.admin_boundaries import admin_boundary_audit_extra

        _admin_extra: dict[str, object] = admin_boundary_audit_extra()
    except Exception:
        log.warning("admin boundary extra unavailable; continuing without it")
        _admin_extra = {}
    try:  # C-05: optimizer + pareto_source audit labels; never fail optimize
        from greenlogix_api.solver.flags import optimizer_name_for_audit

        _opt_name = getattr(result, "optimizer_used", None) or optimizer_name_for_audit()
        _restr_cov = getattr(result, "restriction_coverage", "decision23-2018-v1:unchecked")
        _optimizer_extra: dict[str, object] = {
            "optimizer": _opt_name,
            "restriction_coverage": _restr_cov,
        }
    except Exception:
        log.warning("optimizer audit extra unavailable; continuing without it")
        _optimizer_extra = {}
    # C-05: pareto_source stays "illustrative" (circuity/Valhalla-unwired).
    # Verified path lives library-level in routing/pareto.rerank_from_alternatives
    # (verified=True); router only records the source label, no dominance math.
    _pareto_extra: dict[str, object] = {"pareto_source": "illustrative"}
    save_report(
        result.baseline,
        result.totals,
        extra={
            "distance_provider": getattr(result, "distance_provider", "circuity"),
            "routing_quality": getattr(result, "routing_quality", "DEGRADED"),
            "eco_weight": getattr(result, "eco_weight", 0.0),
            **_manifest_extra,
            **_evidence_extra,
            **_admin_extra,
            **_optimizer_extra,
            **_pareto_extra,
        },
    )
    return stored


@router.post("/optimize", response_model=OptimizeOut)
def optimize(
    body: OptimizeIn,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> OptimizeOut:
    radius = body.cluster_radius_km if body.cluster_radius_km else CLUSTER_RADIUS_KM
    orders = list(session.exec(select(Order)).all())
    vehicles = list(session.exec(select(Vehicle)).all())
    log.info("path=/optimize orders=%s vehicles=%s radius=%s", [o.id for o in orders], len(vehicles), radius)
    result = run_vrp(
        orders,
        vehicles,
        depot=(DEPOT_LAT, DEPOT_LNG),
        depot_name=DEPOT_NAME,
        radius_km=radius,
        optimizer=body.optimizer,
        enforce_time_windows=body.enforce_time_windows,
        enforce_truck_ban=body.enforce_truck_ban,
    )
    log.info(
        "path=/optimize provider=%s quality=%s eco_weight=%s km=%s kg_co2=%s",
        getattr(result, "distance_provider", "circuity"),
        getattr(result, "routing_quality", "DEGRADED"),
        getattr(result, "eco_weight", 0.0),
        result.totals.km,
        result.totals.kg_co2,
    )
    stored = persist_plan(session, result)
    outs: list[RouteOut] = []
    for route in stored:
        outs.append(route_out(route, _load_stops(session, route.id or 0)))
    return OptimizeOut(
        routes=outs,
        unassigned_order_ids=result.unassigned_ids,
        totals=result.totals,
        baseline=result.baseline,
        distance_provider=getattr(result, "distance_provider", "circuity"),
        routing_quality=getattr(result, "routing_quality", "DEGRADED"),
        eco_weight=getattr(result, "eco_weight", 0.0),
        optimizer_used=result.optimizer_used,
        restriction_coverage=result.restriction_coverage,
        ban_conflicts=result.ban_conflicts,
        time_window_conflicts=result.time_window_conflicts,
    )

@router.get("/routes", response_model=list[RouteOut])
def list_routes(
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> list[RouteOut]:
    log.info("path=/routes")
    routes = list(session.exec(select(Route)).all())
    return [route_out(r, _load_stops(session, r.id or 0)) for r in routes]


@router.post("/routes/publish", response_model=list[RouteOut])
def publish_routes(
    body: PublishIn,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> list[RouteOut]:
    log.info("path=/routes/publish")
    # CR-01 fail-closed gate (ADR 0001 §C): publish_blocked_for_quality() is the
    # single decision point — no duplicated quality logic here.
    quality = current_report().routing_quality
    if publish_blocked_for_quality(quality):
        raise HTTPException(
            status_code=403,
            detail=(
                f"Publish blocked: routing_quality={quality!r} is not VERIFIED_GRAPH "
                "while GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1. "
                "Circuity-derived routes must not ship as truck-safe; "
                "re-optimize against a verified graph provider first."
            ),
        )
    all_routes = list(session.exec(select(Route)).all())
    if body.route_ids:
        wanted = set(body.route_ids)
        routes = [r for r in all_routes if r.id in wanted]
    else:
        routes = [r for r in all_routes if not r.published]
    for route in routes:
        route.published = True
        session.add(route)
    session.commit()
    published = [r for r in session.exec(select(Route)).all() if r.published]
    return [route_out(r, _load_stops(session, r.id or 0)) for r in published]


@router.get("/routes/{id}/admin-areas")
def route_admin_areas(
    id: int,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> dict:
    """Versioned admin-area corridor for one route (T-LOOP-GEO, CR-08).

    Centroid fallback labeled ``nso-2024-v1-centroid-fallback``; never claims
    polygon intersection. Root-mounted prefix matches existing ``/routes``
    style (no ``/v1`` prefix anywhere in this API).
    """
    from greenlogix_api.geo.admin_boundaries import lookup_admin_areas_versioned

    log.info("path=/routes/%s/admin-areas", id)
    route = session.get(Route, id)
    if route is None:
        raise HTTPException(status_code=404, detail="not_found")
    stops = sorted(_load_stops(session, id), key=lambda s: s.seq)
    payload = [{"id": s.id or 0, "lat": s.lat, "lng": s.lng} for s in stops]
    return lookup_admin_areas_versioned(payload, route_id=id)


def _run_created_at() -> str | None:
    """ISO8601 stamp of the optimize run that wrote the stored routes.

    ``routes`` carries no timestamp column; the stored report is written by
    ``persist_plan`` at the end of that same run, so its mtime is the run
    stamp. ``None`` when no report exists — never a fabricated timestamp.
    """
    try:
        stamp = dbmod.REPORT_PATH.stat().st_mtime
    except OSError:
        return None
    return datetime.fromtimestamp(stamp, tz=UTC).isoformat()


def _manifest_versions() -> dict[str, str]:
    """Road-graph audit versions from the existing manifest helpers.

    ``geo/road_graph.road_graph_audit_extra`` is the single source; the
    ``solver/road_baseline`` id wrappers (offline-safe, never raising) cover a
    missing/unreadable manifest. No constant is re-declared here.
    """
    from greenlogix_api.geo.road_graph import road_graph_audit_extra
    from greenlogix_api.solver.road_baseline import (
        restriction_overlay_id,
        road_graph_version_id,
    )

    try:
        extra = road_graph_audit_extra()
    except Exception:
        log.warning("road_graph manifest unavailable; audit falls back to id wrappers")
        extra = {}
    return {
        "road_graph_version": str(extra.get("road_graph_version") or road_graph_version_id()),
        "restriction_overlay_version": str(
            extra.get("restriction_overlay_version") or restriction_overlay_id()
        ),
    }


@router.get("/routes/{id}/audit")
def route_audit(
    id: int,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> dict:
    """Route audit drawer (C-06, CR §4.6).

    Evidence only — no metric is recomputed and no key is invented:

    * ``routing_quality`` / ``distance_provider`` come from the stored report
      (the run that produced these routes); with no report they fall back to
      ``quality_for_provider`` on the circuity default, which is DEGRADED —
      never VERIFIED_GRAPH.
    * ``solver`` is ``optimizer_name_for_audit()``, ``model_version`` the
      carbon evidence constant, both versions the manifest helpers.
    * ``seed`` is ``None``: ``/optimize`` runs the deterministic heuristic and
      carries no seed, so there is no run seed to report (inventing one would
      be a fabricated provenance claim). ``dataset``-level provenance lives in
      ``/analytics/kpis``.
    * ``created_at`` is the stored report's mtime — see ``_run_created_at``.
    """
    route = session.get(Route, id)
    if route is None:
        raise HTTPException(status_code=404, detail="not_found")
    log.info("path=/routes/%s/audit", id)
    report = current_report()
    provider = report.distance_provider or "circuity"
    quality = report.routing_quality or quality_for_provider(provider)
    stops = [s for s in _load_stops(session, id) if s.kind != "depot"]
    return {
        "route_id": route.id or 0,
        "plate": route.plate,
        "km": route.km,
        "litres": route.litres,
        "kg_co2": route.kg_co2,
        "stops": len(stops),
        "routing_quality": quality,
        "distance_provider": provider,
        "solver": optimizer_name_for_audit(),
        "model_version": EVIDENCE_MODEL_VERSION,
        **_manifest_versions(),
        "seed": None,
        "created_at": _run_created_at(),
    }
