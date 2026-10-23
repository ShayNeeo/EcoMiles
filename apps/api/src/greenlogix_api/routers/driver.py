"""Driver route + stop writeback. PIN via X-Driver-Pin (D-19)."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from greenlogix_api import db as dbmod
from greenlogix_api.auth import (
    AuthContext,
    get_current_auth,
    require_manager_role,
    verify_driver_plate_access,
)
from greenlogix_api.geo import restrictions as geomod
from greenlogix_api.models import Order, Route, Stop
from greenlogix_api.schemas import (
    DriverRouteList,
    DriverRouteOut,
    FeedbackIn,
    FeedbackItemOut,
    FeedbackOut,
    FeedbackVerifyIn,
    StatusIn,
    StatusOut,
)
from greenlogix_api.serialize import stop_out

log = logging.getLogger("greenlogix")

router = APIRouter(tags=["driver"])

MAX_PHOTO_BYTES = 5 * 1024 * 1024
_JPEG_MAGIC = b"\xff\xd8\xff"
_PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


def _photo_suffix(content_type: str | None, head: bytes) -> str | None:
    mime = (content_type or "").split(";")[0].strip().lower()
    if mime == "image/jpeg" and head.startswith(_JPEG_MAGIC):
        return ".jpg"
    if mime == "image/png" and head.startswith(_PNG_MAGIC):
        return ".png"
    return None


@router.get("/driver/route", response_model=DriverRouteList)
def driver_route(
    plate: str | None = None,
    session: Session = Depends(dbmod.get_session),
    auth: AuthContext = Depends(get_current_auth),
) -> DriverRouteList:
    log.info("path=/driver/route")
    routes = [r for r in session.exec(select(Route)).all() if r.published]
    if plate is not None:
        # Scoped driver asking for another plate -> 403; manager/global -> filter only.
        verify_driver_plate_access(auth, plate)
        routes = [r for r in routes if r.plate == plate]
    elif not auth.is_manager and auth.assigned_plate is not None:
        # Scoped driver with no plate param sees only own plate.
        kept: list[Route] = []
        for route in routes:
            try:
                verify_driver_plate_access(auth, route.plate)
            except HTTPException:
                continue
            kept.append(route)
        routes = kept
    out: list[DriverRouteOut] = []
    for route in routes:
        stops = [
            s
            for s in session.exec(select(Stop).where(Stop.route_id == route.id)).all()
        ]
        stops.sort(key=lambda s: s.seq)
        out.append(DriverRouteOut(plate=route.plate, stops=[stop_out(s) for s in stops]))
    return DriverRouteList(routes=out)


@router.post("/stops/{id}/status", response_model=StatusOut)
def stop_status(
    id: int,
    body: StatusIn,
    session: Session = Depends(dbmod.get_session),
    auth: AuthContext = Depends(get_current_auth),
) -> StatusOut:
    log.info("path=/stops/%s/status", id)
    stop = session.get(Stop, id)
    if stop is None:
        raise HTTPException(status_code=404, detail="not_found")
    route = session.get(Route, stop.route_id) if stop.route_id is not None else None
    if route is None or not route.published:
        raise HTTPException(status_code=404, detail="not_found")
    verify_driver_plate_access(auth, route.plate)
    stop.status = body.status
    stop.fail_reason = body.reason if body.status == "failed" else None
    session.add(stop)
    if stop.kind == "stop" and body.status in ("delivered", "failed") and stop.order_id is not None:
        order = session.get(Order, stop.order_id)
        if order is not None:
            order.status = body.status
            session.add(order)
    session.commit()
    session.refresh(stop)
    return StatusOut(id=stop.id or 0, status=stop.status, reason=stop.fail_reason)


@router.post("/stops/{id}/photo", response_model=StatusOut)
def stop_photo(
    id: int,
    photo: UploadFile = File(...),
    session: Session = Depends(dbmod.get_session),
    auth: AuthContext = Depends(get_current_auth),
) -> StatusOut:
    log.info("path=/stops/%s/photo", id)
    stop = session.get(Stop, id)
    if stop is None:
        raise HTTPException(status_code=404, detail="not_found")
    route = session.get(Route, stop.route_id) if stop.route_id is not None else None
    if route is None or not route.published:
        raise HTTPException(status_code=404, detail="not_found")
    verify_driver_plate_access(auth, route.plate)
    if photo.size is not None and photo.size > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="invalid_image")
    raw = photo.file.read(MAX_PHOTO_BYTES + 1)
    if not raw or len(raw) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="invalid_image")
    suffix = _photo_suffix(photo.content_type, raw[:16])
    if suffix is None:
        raise HTTPException(status_code=400, detail="invalid_image")
    uploads = dbmod.UPLOADS_DIR
    uploads.mkdir(parents=True, exist_ok=True)
    dest = uploads / f"{uuid.uuid4()}{suffix}"
    dest.write_bytes(raw)
    return StatusOut(id=stop.id or 0, status=stop.status, reason=stop.fail_reason)


@router.post("/driver/restriction-feedback", response_model=FeedbackOut, status_code=201)
def restriction_feedback(
    body: FeedbackIn,
    auth: AuthContext = Depends(get_current_auth),
) -> FeedbackOut:
    """Queue a driver restriction report for admin review (T-03).

    Feedback NEVER auto-mutates ACTIVE_RULES; verified entries require a
    separate admin promotion step (no auto-promotion path exists).
    """
    log.info("path=/driver/restriction-feedback")
    verify_driver_plate_access(auth, body.plate)
    entry = geomod.submit_feedback(
        driver_id=auth.user_id,
        plate=body.plate,
        lat=body.lat,
        lng=body.lng,
        issue_type=body.issue_type,
        notes=body.notes,
    )
    return FeedbackOut(id=entry.id, status=entry.status)


@router.get("/driver/restriction-feedback/pending", response_model=list[FeedbackItemOut])
def restriction_feedback_pending(
    auth: AuthContext = Depends(require_manager_role),
) -> list[FeedbackItemOut]:
    """List queued driver restriction reports awaiting review (admin only).

    Read-only over the in-memory queue. Never touches ACTIVE_RULES.
    """
    log.info("path=/driver/restriction-feedback/pending")
    return [
        FeedbackItemOut(
            id=entry.id,
            driver_id=entry.driver_id,
            plate=entry.plate,
            lat=entry.lat,
            lng=entry.lng,
            issue_type=entry.issue_type,
            notes=entry.notes,
            status=entry.status,
        )
        for entry in geomod.list_pending()
    ]


@router.post("/driver/restriction-feedback/{feedback_id}/verify", response_model=FeedbackOut)
def restriction_feedback_verify(
    feedback_id: str,
    body: FeedbackVerifyIn,
    auth: AuthContext = Depends(require_manager_role),
) -> FeedbackOut:
    """Verify or reject one queued report (admin only).

    Calls verify_feedback only; never touches ACTIVE_RULES — admin
    promotion to routing rules is a separate manual step (no path exists).
    Unknown id returns 404.
    """
    log.info("path=/driver/restriction-feedback/%s/verify", feedback_id)
    try:
        entry = geomod.verify_feedback(feedback_id, approved=body.approved)
    except ValueError:
        raise HTTPException(status_code=404, detail="unknown_feedback_id") from None
    return FeedbackOut(id=entry.id, status=entry.status)
