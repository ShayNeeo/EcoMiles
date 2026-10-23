"""Analytics aggregation over the live SQLite DB (CR-20261018-001 C-01).

Primary reader is DuckDB (1.5.6) with the ``sqlite`` extension reading
``apps/api/data/greenlogix.db`` **in place** (``INSTALL sqlite; LOAD sqlite;`` +
``sqlite_scan('<db>', '<table>')``) — no copy, no second store. When the
extension cannot load (fresh machine, no extension cache, no network) the same
SQL runs through the SQLModel session instead, so the endpoints degrade to
plain SQLAlchemy reads rather than 500-ing offline.

The two backends are fed the *same* query body; only the ``WITH`` prelude that
binds the four table names differs (``sqlite_scan(...)`` vs ``main.<table>``).

Honesty rules enforced here (see ``metrics.py`` for the formulas):
  * ``km_empty`` / ``empty_running_pct`` are ``None``: routes are closed depot
    loops and no empty leg is recorded, so an empty share cannot be measured.
  * ``otif_pct`` / ``on_time`` are ``None``: stops carry no delivered-at
    timestamp. The modelled late-risk count (``late.py``) is exposed instead as
    ``late_orders``.
  * ``stops_per_hour`` is ``None``: no route duration is stored anywhere.
  * ``kg_co2e_wtw`` is computed from routed vehicles' fuel types and
    ``wtw_kg_co2_per_litre`` (diesel 3.24, petrol 2.82 per GLEC v3.2 / ISO 14083:2023).
  * transport work is per route: ``Σ_r (payload_r [t] × km_r)`` (SQL), never
    ``(Σ payload) × (Σ km)``.
  * per-order intensities divide by the orders a route actually covers; with
    nothing routed they are ``None``, not ``0``.
  * fleet utilisation uses per-dispatch capacity and is ``None`` for a vehicle
    with no routed work.
  * fuel price is env-supplied; unset ⇒ every VND cost field is ``None``.
  * ``seed/dataset_meta.json`` is only believed while it still describes this
    DB (see :data:`META_ROWS_KEYS`); a stale file is ignored and said so in
    ``dataset.label``.
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

import duckdb
from sqlalchemy import text
from sqlmodel import Session

from greenlogix_api import db as dbmod
from greenlogix_api.analytics import metrics
from greenlogix_api.carbon import EVIDENCE_CONFIDENCE, EVIDENCE_MODEL_VERSION
from greenlogix_api.late import late_risk

log = logging.getLogger("greenlogix")

TABLES = ("orders", "vehicles", "routes", "stops")
META_NAME = "dataset_meta.json"

# Keys a dataset_meta.json may declare its order count under (the ingest slice
# writes the file; analytics accepts any of these and believes a count that
# matches, ignoring the file when it does not).
META_ROWS_KEYS = ("rows", "n_orders", "order_count", "orders")

# Env override (ops + tests): "duckdb" | "sqlite". Default: try DuckDB, fall
# back on any extension/scan failure. Never crashes on a flag typo.
BACKEND_ENV = "ECOMILES_ANALYTICS_BACKEND"

# Fuel price is operator-supplied: unset ⇒ costs stay null (no invented price).
# Documented reference for a fleet that wants a default: HCMC diesel retail
# ≈ 20,000 VND/L in 2026-10 — set ECOMILES_FUEL_PRICE_VND_PER_L=20000.
FUEL_PRICE_ENV = "ECOMILES_FUEL_PRICE_VND_PER_L"

# duckdb's sqlite extension is per-installation; cache "already INSTALLed" and
# the "cannot be used here" verdict so a broken extension costs one attempt,
# not one per request.
_duck_installed = False
_duck_broken = False

MetricName = Literal["km", "litres", "kg_co2e", "orders", "otif_pct"]

def fuel_price_vnd_per_l() -> float | None:
    """``ECOMILES_FUEL_PRICE_VND_PER_L``, or ``None`` when unset/unparseable."""
    raw = (os.environ.get(FUEL_PRICE_ENV) or "").strip()
    if not raw:
        return None
    try:
        price = float(raw)
    except ValueError:
        log.warning("ECOMILES_FUEL_PRICE_VND_PER_L=%r is not a number; costs stay null", raw)
        return None
    if price <= 0:
        log.warning("ECOMILES_FUEL_PRICE_VND_PER_L=%r is not positive; costs stay null", raw)
        return None
    return price

def _db_path(session: Session) -> Path | None:
    """Path of the file the session is bound to; ``None`` for in-memory."""
    database = session.get_bind().url.database or ""
    path = Path(database)
    return path if path.is_file() else None

def _backend(db_path: Path | None) -> str:
    """``"duckdb"`` or ``"sqlite"`` for this request.

    An in-memory session has no file for DuckDB to scan, so it goes straight to
    the session path and never touches the process-wide verdict. An explicit
    ``ECOMILES_ANALYTICS_BACKEND`` wins over a remembered failure, so operators
    can retry the fast path after a transient problem.
    """
    if db_path is None:
        return "sqlite"
    choice = (os.environ.get(BACKEND_ENV) or "").strip().lower()
    if choice in {"duckdb", "sqlite"}:
        return choice
    return "sqlite" if _duck_broken else "duckdb"

def _table_ctes(backend: str, db_path: Path | None) -> tuple[str, ...]:
    if backend == "duckdb" and db_path is not None:
        literal = str(db_path).replace("'", "''")
        return tuple(
            f"{table} AS (SELECT * FROM sqlite_scan('{literal}', '{table}'))"
            for table in TABLES
        )
    # SQLite: qualify with main. so the CTE name does not shadow the table.
    return tuple(f"{table} AS (SELECT * FROM main.{table})" for table in TABLES)

def _build_sql(
    body: str,
    extra_ctes: Sequence[str] = (),
    *,
    backend: str,
    db_path: Path | None,
) -> str:
    ctes = (*_table_ctes(backend, db_path), *extra_ctes)
    return "WITH " + ",\n".join(ctes) + "\n" + body

class DuckExtensionError(RuntimeError):
    """The ``sqlite`` DuckDB extension could not be installed/loaded."""

def _duck_rows(sql: str) -> list[dict[str, Any]]:
    """Run ``sql`` on a fresh DuckDB connection reading the SQLite file.

    Only the extension load may raise :class:`DuckExtensionError`; a query
    error propagates untouched so the caller falls back for this request
    without condemning DuckDB for the rest of the process.
    """
    global _duck_installed
    con = duckdb.connect()
    try:
        try:
            if not _duck_installed:
                con.execute("INSTALL sqlite;")
            con.execute("LOAD sqlite;")
        except Exception as exc:
            raise DuckExtensionError(str(exc)) from exc
        _duck_installed = True
        cursor = con.execute(sql)
        columns = [column[0] for column in cursor.description]
        return [dict(zip(columns, row, strict=True)) for row in cursor.fetchall()]
    finally:
        con.close()

def _session_rows(sql: str, session: Session) -> list[dict[str, Any]]:
    result = session.connection().execute(text(sql))
    columns = list(result.keys())
    return [dict(zip(columns, row, strict=True)) for row in result.fetchall()]

def _rows(
    body: str,
    session: Session,
    extra_ctes: Sequence[str] = (),
) -> list[dict[str, Any]]:
    """Run one query body: DuckDB first, SQLModel session on any failure."""
    global _duck_broken
    db_path = _db_path(session)
    if _backend(db_path) == "duckdb":
        try:
            return _duck_rows(
                _build_sql(body, extra_ctes, backend="duckdb", db_path=db_path)
            )
        except DuckExtensionError:
            _duck_broken = True
            log.warning(
                "duckdb sqlite extension unavailable; using the SQLite session from now on",
                exc_info=True,
            )
        except Exception:
            # A query/scan error is not a verdict on the extension: fall back
            # for this request only and let the next one try DuckDB again.
            log.warning(
                "duckdb read failed; using the SQLite session for this request",
                exc_info=True,
            )
    return _session_rows(
        _build_sql(body, extra_ctes, backend="sqlite", db_path=db_path), session
    )

_TOTALS_BODY = """
SELECT
  (SELECT COUNT(*) FROM orders) AS orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS delivered,
  (SELECT COUNT(*) FROM orders WHERE status = 'failed') AS failed,
  (SELECT COUNT(*) FROM vehicles) AS vehicles,
  (SELECT COALESCE(SUM(km), 0) FROM routes) AS km_total,
  (SELECT COALESCE(SUM(litres), 0) FROM routes) AS fuel_litres,
  (SELECT COALESCE(SUM(kg_co2), 0) FROM routes) AS kg_co2e_ttw,
  (SELECT COUNT(*) FROM stops WHERE kind <> 'depot' AND route_id IS NOT NULL) AS stops,
  (SELECT COALESCE(SUM(kg), 0) FROM stops
     WHERE kind <> 'depot' AND route_id IS NOT NULL) AS kg_delivered,
  -- Transport work per route dispatch: Σ_r (payload_r [t] × km_r). One row per
  -- delivery stop, so a route's own km multiplies that route's own kg.
  (SELECT COALESCE(SUM(s.kg / 1000.0 * r.km), 0)
     FROM routes r JOIN stops s ON s.route_id = r.id
     WHERE s.kind <> 'depot') AS transport_work_tkm,
  -- Capacity offered, per dispatch: a vehicle on two routes counts twice, so
  -- the denominator matches the load it actually carried.
  (SELECT COALESCE(SUM(v.capacity_kg), 0)
     FROM routes r JOIN vehicles v ON v.id = r.vehicle_id) AS capacity_kg_dispatched
"""

_FLEET_BODY = """
SELECT
  v.plate AS plate,
  COALESCE(ra.km, 0) AS km,
  COALESCE(ra.litres, 0) AS litres,
  COALESCE(ra.kg_co2, 0) AS kg_co2e,
  COALESCE(ra.dispatches, 0) AS dispatches,
  COALESCE(sa.n_orders, 0) AS orders,
  COALESCE(sa.kg, 0) AS kg_delivered,
  v.capacity_kg AS capacity_kg,
  v.fuel AS fuel,
  v.l_per_100km AS l_per_100km
FROM vehicles v
LEFT JOIN (
  SELECT vehicle_id, SUM(km) AS km, SUM(litres) AS litres, SUM(kg_co2) AS kg_co2,
         COUNT(*) AS dispatches
  FROM routes GROUP BY vehicle_id
) ra ON ra.vehicle_id = v.id
LEFT JOIN (
  SELECT r.vehicle_id AS vehicle_id, COUNT(*) AS n_orders, SUM(s.kg) AS kg
  FROM stops s JOIN routes r ON r.id = s.route_id
  WHERE s.kind <> 'depot'
  GROUP BY r.vehicle_id
) sa ON sa.vehicle_id = v.id
ORDER BY v.plate
"""

_LATE_BODY = "SELECT lat, lng, window_end, status FROM orders"
_HOURLY_BODY = """
SELECT
  CASE
    WHEN s.window_start IS NOT NULL AND LENGTH(TRIM(s.window_start)) >= 2
    THEN SUBSTR(TRIM(s.window_start), 1, 2) || ':00'
    ELSE '08:00'
  END AS hour_bucket,
  SUM(r.km * 1.0 / rc.stop_count) AS km,
  SUM(r.litres * 1.0 / rc.stop_count) AS litres,
  SUM(r.kg_co2 * 1.0 / rc.stop_count) AS kg_co2e,
  COUNT(*) AS orders
FROM stops s
JOIN routes r ON r.id = s.route_id
JOIN (
  SELECT route_id, COUNT(*) AS stop_count
  FROM stops
  WHERE kind <> 'depot' AND route_id IS NOT NULL
  GROUP BY route_id
) rc ON rc.route_id = s.route_id
WHERE s.kind <> 'depot' AND s.route_id IS NOT NULL
GROUP BY hour_bucket
ORDER BY hour_bucket
"""


def _totals(session: Session) -> dict[str, Any]:
    rows = _rows(_TOTALS_BODY, session)
    return rows[0] if rows else {}

def _fleet_rows(session: Session) -> list[dict[str, Any]]:
    return _rows(_FLEET_BODY, session)

def _dataset_meta() -> dict[str, Any]:
    """``seed/dataset_meta.json`` when present (written by the generator)."""
    path = dbmod.SEED_DIR / META_NAME
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        log.warning("seed/%s unreadable; dataset provenance falls back to the DB file", META_NAME)
        return {}
    return data if isinstance(data, dict) else {}

def _meta_row_count(meta: dict[str, Any]) -> int | None:
    """Order count declared by the meta file, if it declares one."""
    for key in META_ROWS_KEYS:
        value = meta.get(key)
        if isinstance(value, int) and not isinstance(value, bool):
            return value
    return None

def _vetted_meta(order_count: int) -> tuple[dict[str, Any], str | None]:
    """The meta file if it still describes this DB, else ``({}, why not)``.

    ``dataset_meta.json`` outlives the data it describes: a generator run leaves
    it behind, and a later ``/seed`` or customer import replaces the rows. A
    declared row count that no longer matches ``orders`` means the provenance
    (label/seed/kind/generated_at) belongs to another dataset, so it is dropped
    and the caller says so in ``dataset.label``. A file that declares no count
    cannot be falsified and is believed as-is — that ceiling is why the ingest
    slice should write ``rows``.
    """
    meta = _dataset_meta()
    if not meta:
        return {}, None
    declared = _meta_row_count(meta)
    if declared is None or declared == order_count:
        return meta, None
    note = f"{META_NAME} stale: declares {declared} rows, DB has {order_count}"
    log.warning("ignoring %s", note)
    return {}, note

def _generated_at(db_path: Path | None, meta: dict[str, Any]) -> str | None:
    """ISO8601 stamp: vetted dataset_meta ``generated_at``, else DB file mtime."""
    stamp = meta.get("generated_at")
    if isinstance(stamp, str) and stamp.strip():
        return stamp.strip()
    if db_path is None:
        return None
    try:
        return datetime.fromtimestamp(db_path.stat().st_mtime, tz=UTC).isoformat()
    except OSError:
        return None

def _dataset(session: Session, totals: dict[str, Any]) -> dict[str, Any]:
    order_count = int(totals.get("orders") or 0)
    meta, stale_note = _vetted_meta(order_count)
    db_path = _db_path(session)
    label = meta.get("label")
    if not isinstance(label, str) or not label.strip():
        label = db_path.name if db_path is not None else "unknown"
    if stale_note:
        # The frozen shape has no "provenance note" key; the label is the one
        # string field an operator reads, so the reason travels there.
        label = f"{label} ({stale_note})"
    kind = meta.get("kind")
    if not isinstance(kind, str) or not kind.strip():
        # Routes are produced by the in-repo solver over the seeded synthetic
        # dataset; a customer upload would declare itself via dataset_meta.json.
        kind = "simulated"
    seed = meta.get("seed")
    return {
        "label": label,
        "kind": kind,
        "seed": seed if isinstance(seed, int) and not isinstance(seed, bool) else None,
        "generated_at": _generated_at(db_path, meta),
        "orders": order_count,
        "vehicles": int(totals.get("vehicles") or 0),
    }

def _period(generated_at: str | None) -> dict[str, str | None]:
    """Single-snapshot dataset: the only date the DB knows is ``generated_at``."""
    day = (generated_at or "")[:10] or None
    return {"from": day, "to": day}

def _routing_quality() -> str:
    """Last optimize run's stored label, else DEGRADED (circuity default).

    ``routes`` has no quality column, so the evidence comes from the stored
    report; without one, circuity is the honest default — this never claims
    VERIFIED_GRAPH.
    """
    from greenlogix_api.carbon import load_report

    stored = load_report()
    if stored is None or not str(stored.routing_quality or "").strip():
        return "DEGRADED"
    return str(stored.routing_quality).strip().upper()

def _late_orders(session: Session) -> int:
    """Orders whose depot→stop ETA would miss ``window_end`` (modelled, 30 km/h).

    Uses ``late.py`` unchanged. Zero delivered-at timestamps exist in the DB, so
    this is a *modelled* late-risk count, never the measured OTIF numerator.
    """
    count = 0
    for row in _rows(_LATE_BODY, session):
        if str(row.get("status") or "") in {"delivered", "failed"}:
            continue  # already closed out; the window is no longer at risk
        if late_risk(float(row.get("lat") or 0.0), float(row.get("lng") or 0.0), str(row.get("window_end") or "")):
            count += 1
    return count

def _fill_stops(fleet: list[dict[str, Any]]) -> list[float]:
    """Stops per **used** vehicle (a vehicle with routed stops only)."""
    return [float(row["orders"]) for row in fleet if float(row["orders"]) > 0]

def kpis(session: Session) -> dict[str, Any]:
    """``GET /analytics/kpis`` payload — CR §4.2 shape, key for key.

    Denominators are chosen so no intensity covers work that never happened:
    ``load.capacity_kg_used`` is the capacity **dispatched** (a vehicle on two
    routes counts twice, matching the load it carried), and the per-order cost
    and CO2e divide by the orders a route actually covers (``stops``), so an
    un-routed backlog cannot dilute them. With nothing routed those fields are
    ``None``, never 0.
    """
    totals = _totals(session)
    fleet = _fleet_rows(session)
    km_total = float(totals.get("km_total") or 0.0)
    stops = int(totals.get("stops") or 0)
    routed_orders = stops  # one delivery stop per order carried on a route
    orders = int(totals.get("orders") or 0)
    kg_delivered = float(totals.get("kg_delivered") or 0.0)
    capacity_dispatched = float(totals.get("capacity_kg_dispatched") or 0.0)
    transport_work_tkm = float(totals.get("transport_work_tkm") or 0.0)
    kg_co2e_ttw = float(totals.get("kg_co2e_ttw") or 0.0)
    fuel_litres = float(totals.get("fuel_litres") or 0.0)
    price = fuel_price_vnd_per_l()
    fuel_cost = fuel_litres * price if price is not None else None
    dataset = _dataset(session, totals)

    return {
        "dataset": dataset,
        "period": _period(dataset["generated_at"]),
        "distance": {
            "km_total": km_total,
            # Closed depot loops: no empty leg is recorded anywhere.
            "km_empty": None,
            "empty_running_pct": metrics.empty_running_pct(None, km_total),
            "km_per_stop": metrics.km_per_stop(km_total, stops),
            # No route start/end time exists in the schema.
            "stops_per_hour": metrics.stops_per_hour(stops, None),
        },
        "load": {
            "kg_delivered": kg_delivered,
            "capacity_kg_used": capacity_dispatched,
            # Denominator of the tonne-km intensity, published so /report can
            # reuse the same number instead of recomputing (sum kg_r x km_r, not
            # (sum kg) x (sum km) which over-states work by the route count).
            "transport_work_tkm": transport_work_tkm,
            "payload_utilisation_pct": metrics.payload_utilisation_pct(
                kg_delivered, capacity_dispatched
            ),
            "vehicle_fill_pct": metrics.vehicle_fill_pct(_fill_stops(fleet)),
        },
        "service": {
            "orders": orders,
            "delivered": int(totals.get("delivered") or 0),
            "failed": int(totals.get("failed") or 0),
            # Deliveries carry no timestamp ⇒ the in-window count is unmeasurable.
            "on_time": None,
            "otif_pct": metrics.otif_pct(None, orders),
            "late_orders": _late_orders(session),
        },
        "cost": {
            "fuel_litres": fuel_litres,
            "fuel_cost_vnd": fuel_cost,
            "cost_per_order_vnd": metrics.cost_per_order(fuel_cost, routed_orders),
            "cost_per_km_vnd": metrics.cost_per_km(fuel_cost, km_total),
        },
        "carbon": {
            "kg_co2e_ttw": kg_co2e_ttw,
            "kg_co2e_wtw": _compute_wtw_co2(fleet, km_total),
            "g_co2e_per_tkm": metrics.g_co2e_per_tkm(kg_co2e_ttw, transport_work_tkm),
            "g_co2e_per_order": metrics.g_co2e_per_order(kg_co2e_ttw, routed_orders),
            "decomposition": _carbon_decomposition(),
            "boundary": "TTW",
            "factor_set": "IPCC 2006 -> GLEC v3.2 cross-check",
            "confidence": EVIDENCE_CONFIDENCE,
            "model_version": EVIDENCE_MODEL_VERSION,
        },
        "labels": {
            "simulated": dataset["kind"] == "simulated",
            # Litres come from the rated l/100km spec, not from OBD telemetry.
            "modelled_fuel": True,
            "routing_quality": _routing_quality(),
        },
    }

def _compute_wtw_co2(fleet: list[dict[str, Any]], km_total: float) -> float | None:
    if km_total <= 0:
        return None
    from greenlogix_api.carbon import wtw_kg_co2_per_litre

    fuel_items: list[tuple[float | None, float | None]] = []
    for row in fleet:
        dispatches = float(row.get("dispatches") or 0.0)
        litres = float(row.get("litres") or 0.0)
        if dispatches <= 0 and litres <= 0:
            continue
        fuel = str(row.get("fuel") or "")
        factor = wtw_kg_co2_per_litre(fuel)
        fuel_items.append((litres, factor))
    return metrics.kg_co2e_wtw_from_fuel(fuel_items)

def _carbon_decomposition() -> dict[str, Any] | None:
    from greenlogix_api.carbon import load_report

    stored = load_report()
    if stored is None:
        return None
    b_km = stored.baseline.km
    o_km = stored.optimized.km
    b_co2 = round(stored.baseline.kg_co2, 2)
    o_co2 = round(stored.optimized.kg_co2, 2)
    d_co2 = round(o_co2 - b_co2, 2)
    dist_eff = round(b_co2 * ((o_km - b_km) / b_km), 2) if b_km > 0 else 0.0
    fleet_eff = round(d_co2 - dist_eff, 2)
    return {
        "baseline_kg_co2e": b_co2,
        "optimized_kg_co2e": o_co2,
        "delta_kg_co2e": d_co2,
        "distance_effect_kg": dist_eff,
        "fleet_intensity_effect_kg": fleet_eff,
        "methodology": "GLEC v3.2 ASI / PVM decomposition (modelled)",
    }

def timeseries(
    session: Session, metric: MetricName, bucket: Literal["day", "hour"]
) -> dict[str, Any]:
    """``GET /analytics/timeseries`` payload — CR §4.3 shape, key for key."""
    if bucket == "hour":
        rows = _rows(_HOURLY_BODY, session)
        points = [
            {
                "date": str(row["hour_bucket"]),
                "km": round(float(row["km"] or 0.0), 2),
                "litres": round(float(row["litres"] or 0.0), 2),
                "kg_co2e": round(float(row["kg_co2e"] or 0.0), 2),
                "orders": int(row["orders"] or 0),
                "otif_pct": None,
            }
            for row in rows
        ]
        return {"bucket": bucket, "points": points}

    totals = _totals(session)
    day = _period(_dataset(session, totals)["generated_at"])["from"]
    points = []
    if day is not None:
        orders = int(totals.get("orders") or 0)
        points.append(
            {
                "date": day,
                "km": float(totals.get("km_total") or 0.0),
                "litres": float(totals.get("fuel_litres") or 0.0),
                "kg_co2e": float(totals.get("kg_co2e_ttw") or 0.0),
                "orders": orders,
                # No delivered-at timestamp ⇒ no measured OTIF series.
                "otif_pct": metrics.otif_pct(None, orders),
            }
        )
    return {"bucket": bucket, "points": points}

def fleet(session: Session) -> dict[str, Any]:
    """``GET /analytics/fleet`` payload — CR §4.4 shape, key for key.

    Every vehicle in the DB appears, including idle ones: an unused vehicle
    reporting km 0.0 is a measurement, not a fabricated default. Utilisation is
    per dispatch — ``kg delivered ÷ (rated capacity × routes run)`` — so one
    vehicle on two half-full runs reads 50 %, not 100 %; a vehicle with no
    routed work reports ``None`` utilisation rather than a meaningless 0 %.
    """
    vehicles = []
    for row in _fleet_rows(session):
        km = float(row["km"] or 0.0)
        kg_delivered = float(row["kg_delivered"] or 0.0)
        capacity = float(row["capacity_kg"] or 0.0)
        dispatched = float(row["dispatches"] or 0.0)
        vehicles.append(
            {
                "plate": str(row["plate"] or ""),
                "km": km,
                "litres": float(row["litres"] or 0.0),
                "kg_co2e": float(row["kg_co2e"] or 0.0),
                "orders": int(row["orders"] or 0),
                "kg_delivered": kg_delivered,
                "payload_utilisation_pct": metrics.payload_utilisation_pct(
                    kg_delivered if dispatched else None, capacity * dispatched
                ),
                "capacity_kg": capacity,
                "fuel": str(row["fuel"] or ""),
                "l_per_100km_spec": float(row["l_per_100km"] or 0.0),
            }
        )
    return {"vehicles": vehicles}
