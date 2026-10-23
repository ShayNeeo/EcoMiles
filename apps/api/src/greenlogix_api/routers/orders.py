"""Order import and CRUD."""

from __future__ import annotations

import logging
import math
import re
from typing import Annotated
from zipfile import BadZipFile

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from openpyxl.utils.exceptions import InvalidFileException
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from greenlogix_api.auth import require_dispatcher
from greenlogix_api.db import get_session
from greenlogix_api.generate_synthetic import discard_meta_unless_matches
from greenlogix_api.ingest_xlsx import IngestLimitError, IngestStream, resolve_limits
from greenlogix_api.late import matches_q
from greenlogix_api.models import Order, Route, Stop
from greenlogix_api.schemas import (
    CARGO_TYPES,
    LOCAL_TIME_PATTERN,
    ImportErrorItem,
    ImportLimits,
    ImportResult,
    IngestEventsIn,
    OrderOut,
    OrderPatch,
)
from greenlogix_api.serialize import order_out

log = logging.getLogger("greenlogix")

router = APIRouter(tags=["orders"])

# C-03: rows pushed to the session per batch inside the single import transaction.
IMPORT_BATCH_SIZE = 500


def _redact(value: str | None) -> str:
    """Log-safe search term: the dispatcher query is matched against ``phone``,
    so the full term must never reach the log (F3)."""
    if not value:
        return "-"
    return f"{value[:2]}***({len(value)})"


def _published_assignment(session: Session, order_id: int) -> bool:
    stops = session.exec(select(Stop).where(Stop.order_id == order_id)).all()
    for stop in stops:
        if stop.route_id is None:
            continue
        route = session.get(Route, stop.route_id)
        if route is not None and route.published:
            return True
    return False


def _reject_if_published(session: Session, order: Order) -> None:
    if order.id is not None and _published_assignment(session, order.id):
        raise HTTPException(status_code=409, detail="published")


@router.post("/orders/import", response_model=ImportResult)
def import_orders(
    file: UploadFile,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> ImportResult:
    name = (file.filename or "").lower()
    log.info("path=/orders/import")
    if not name.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="xlsx only")
    max_bytes, max_rows = resolve_limits()
    # Reject on the parsed part size before pulling bytes, then read bounded
    # (never an unbounded read() of an attacker-sized body).
    if file.size is not None and file.size > max_bytes:
        raise HTTPException(status_code=400, detail="file too large")
    raw = file.file.read(max_bytes + 1)
    if len(raw) > max_bytes:
        raise HTTPException(status_code=400, detail="file too large")

    def _known_ids() -> list[str | None]:
        # Only reached when the workbook actually carries an external_id column.
        return list(
            session.exec(select(Order.external_id).where(Order.external_id.is_not(None))).all()
        )

    stream = IngestStream(raw, max_rows=max_rows, load_known_ids=_known_ids)
    imported = 0
    try:
        batch: list[Order] = []
        for order in stream:
            batch.append(order)
            if len(batch) >= IMPORT_BATCH_SIZE:
                session.add_all(batch)
                session.flush()
                imported += len(batch)
                batch.clear()
                log.info(
                    "import progress imported=%s seen=%s skipped=%s",
                    imported,
                    stream.rows_seen,
                    stream.skipped_duplicates,
                )
        if batch:
            session.add_all(batch)
            imported += len(batch)
        session.commit()
    except IngestLimitError:
        session.rollback()
        raise HTTPException(status_code=400, detail="too many rows") from None
    except SQLAlchemyError:
        # A database failure is not a bad spreadsheet: roll back and surface 500
        # so the operator fixes the database instead of retrying the file.
        session.rollback()
        log.exception("path=/orders/import database failure")
        raise
    except (BadZipFile, InvalidFileException, KeyError, ValueError) as exc:
        session.rollback()
        log.info("path=/orders/import invalid xlsx exc=%s", type(exc).__name__)
        raise HTTPException(status_code=400, detail="invalid xlsx") from None
    discard_meta_unless_matches(raw)
    log.info(
        "imported=%s seen=%s skipped=%s errors=%s",
        imported,
        stream.rows_seen,
        stream.skipped_duplicates,
        len(stream.errors),
    )
    return ImportResult(
        imported=imported,
        errors=stream.errors,
        rows_seen=stream.rows_seen,
        rows_imported=imported,
        skipped_duplicates=stream.skipped_duplicates,
        rows_rejected=stream.rows_rejected,
        dedupe=stream.dedupe,
        limits=ImportLimits(max_upload_bytes=max_bytes, max_data_rows=max_rows),
    )

@router.post("/ingest/events", response_model=ImportResult)
def ingest_events(
    body: IngestEventsIn,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> ImportResult:
    sanitized_label = re.sub(r"[\r\n\t]", "_", body.dataset_label)[:64]
    log.info("path=/ingest/events dataset_label=%s orders=%s", sanitized_label, len(body.orders))
    max_bytes, max_rows = resolve_limits()
    if len(body.orders) > max_rows:
        raise HTTPException(status_code=400, detail="too many rows")

    known: set[str] = {
        eid
        for eid in session.exec(select(Order.external_id).where(Order.external_id.is_not(None))).all()
        if eid
    }
    imported = 0
    skipped_duplicates = 0
    errors: list[ImportErrorItem] = []
    batch: list[Order] = []

    for idx, item in enumerate(body.orders, start=1):
        if not (
            math.isfinite(item.lat)
            and math.isfinite(item.lng)
            and -90.0 <= item.lat <= 90.0
            and -180.0 <= item.lng <= 180.0
        ):
            errors.append(
                ImportErrorItem(
                    excel_row=idx, field="lat/lng", message="coordinates must be finite and within range"
                )
            )
            continue
        if item.kg < 0 or not math.isfinite(item.kg):
            errors.append(
                ImportErrorItem(excel_row=idx, field="kg", message="kg must be non-negative")
            )
            continue
        ws = item.window_start.strip()
        we = item.window_end.strip()
        if not re.match(LOCAL_TIME_PATTERN, ws):
            errors.append(
                ImportErrorItem(
                    excel_row=idx, field="window_start", message="invalid window_start format (HH:MM)"
                )
            )
            continue
        if not re.match(LOCAL_TIME_PATTERN, we):
            errors.append(
                ImportErrorItem(
                    excel_row=idx, field="window_end", message="invalid window_end format (HH:MM)"
                )
            )
            continue
        ct = (item.cargo_type or "").strip() or "thuong"
        if ct not in CARGO_TYPES:
            errors.append(
                ImportErrorItem(excel_row=idx, field="cargo_type", message="unknown cargo_type")
            )
            continue
        eid = (item.external_id or "").strip() or None
        if eid is not None:
            if eid in known:
                skipped_duplicates += 1
                continue
            known.add(eid)

        order = Order(
            address=item.address.strip(),
            lat=item.lat,
            lng=item.lng,
            receiver=item.receiver.strip(),
            phone=item.phone.strip(),
            kg=item.kg,
            window_start=ws,
            window_end=we,
            cargo_type=ct,
            notes=item.notes.strip(),
            external_id=eid,
            status="pending",
        )
        batch.append(order)
        if len(batch) >= IMPORT_BATCH_SIZE:
            session.add_all(batch)
            session.flush()
            imported += len(batch)
            batch.clear()

    if batch:
        session.add_all(batch)
        imported += len(batch)
    session.commit()

    return ImportResult(
        imported=imported,
        errors=errors,
        rows_seen=len(body.orders),
        rows_imported=imported,
        skipped_duplicates=skipped_duplicates,
        rows_rejected=len(errors),
        dedupe=True,
        limits=ImportLimits(max_upload_bytes=max_bytes, max_data_rows=max_rows),
    )


@router.get("/orders", response_model=list[OrderOut])
def list_orders(
    q: Annotated[str | None, Query()] = None,
    late: Annotated[int | None, Query()] = None,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> list[OrderOut]:
    log.info("path=/orders q=%s late=%s", _redact(q), late)
    rows = list(session.exec(select(Order)).all())
    out = [order_out(o) for o in rows]
    out = [o for o in out if matches_q(o.address, o.phone, o.receiver, q)]
    if late == 1:
        out = [o for o in out if o.late_risk]
    return out


@router.get("/orders/{id}", response_model=OrderOut)
def get_order(
    id: int,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> OrderOut:
    log.info("path=/orders/%s", id)
    order = session.get(Order, id)
    if order is None:
        raise HTTPException(status_code=404, detail="not_found")
    return order_out(order)


@router.patch("/orders/{id}", response_model=OrderOut)
def patch_order(
    id: int,
    body: OrderPatch,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> OrderOut:
    log.info("path=/orders/%s", id)
    order = session.get(Order, id)
    if order is None:
        raise HTTPException(status_code=404, detail="not_found")
    _reject_if_published(session, order)
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(order, key, value)
    session.add(order)
    session.commit()
    session.refresh(order)
    return order_out(order)


@router.delete("/orders/{id}")
def delete_order(
    id: int,
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> dict[str, int]:
    log.info("path=/orders/%s", id)
    order = session.get(Order, id)
    if order is None:
        raise HTTPException(status_code=404, detail="not_found")
    _reject_if_published(session, order)
    session.delete(order)
    session.commit()
    return {"id": id}
