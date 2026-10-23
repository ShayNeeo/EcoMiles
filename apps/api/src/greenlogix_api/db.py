"""SQLite engine at apps/api/data/greenlogix.db (D-11)."""

from __future__ import annotations

import logging
from collections.abc import Iterator
from pathlib import Path

from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

API_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = API_ROOT / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
SEED_DIR = DATA_DIR / "seed"
DB_PATH = DATA_DIR / "greenlogix.db"
REPORT_PATH = DATA_DIR / "last_report.json"
FACTORS_PATH = DATA_DIR / "emission_factors.json"
DATASET_META_NAME = "dataset_meta.json"

log = logging.getLogger("ecomiles")

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)


def _sqlite_literal(value: object) -> str | None:
    """Render a Python scalar as a SQLite literal, or None if it is not scalar."""
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return repr(value)
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    return None


def _add_missing_columns(conn, table) -> None:
    """Add every declared-but-absent column of one table (see caller for why)."""
    rows = conn.exec_driver_sql(f"PRAGMA table_info({table.name})").fetchall()
    if not rows:  # table not created yet
        return
    live = {row[1] for row in rows}
    for column in table.columns:
        if column.name in live:
            continue
        ddl = column.type.compile(dialect=conn.engine.dialect)
        clause = ""
        if not column.nullable:
            # SQLite refuses NOT NULL without a default on a populated table.
            # Use the declared scalar default when there is one; otherwise add
            # the column anyway (nullable in SQLite) so the ORM can read the
            # table instead of failing later with `no such column`.
            arg = getattr(column.default, "arg", None) if column.default is not None else None
            literal = _sqlite_literal(arg) if not callable(arg) else None
            if literal is not None:
                clause = f" NOT NULL DEFAULT {literal}"
            else:
                log.warning(
                    "db.migration.nullable_only table=%s column=%s "
                    "reason=not_null_without_scalar_default",
                    table.name,
                    column.name,
                )
        conn.exec_driver_sql(
            f"ALTER TABLE {table.name} ADD COLUMN {column.name} {ddl}{clause}"
        )
        conn.commit()


def _ensure_indexes(conn, table) -> None:  # Connection, Table
    """Create declared indexes that a pre-existing table is missing.

    ``create_all`` only creates indexes for tables it creates, so an index added
    to a model later (e.g. ``orders.external_id`` used as a dedupe key on every
    import) would never appear on an existing database. ``IF NOT EXISTS`` keeps
    this idempotent, and the declared name is reused so a fresh database and a
    healed one are indistinguishable.
    """
    for index in table.indexes:
        columns = ", ".join(column.name for column in index.columns)
        if not columns:
            continue
        conn.exec_driver_sql(
            f"CREATE INDEX IF NOT EXISTS {index.name} ON {table.name} ({columns})"
        )
        conn.commit()


def _ensure_missing_columns(eng: Engine) -> None:
    """Additively heal a pre-existing SQLite file: every column declared in the
    SQLModel metadata but absent from the live table is ALTERed in.

    Supersedes the per-column helpers this module used to carry
    (``_ensure_stop_route_id``, ``_ensure_vehicle_envelope``,
    ``_ensure_order_external_id``). Each of those healed exactly one column, so
    the next additive column silently broke every ORM SELECT against an older
    ``greenlogix.db`` — the failure surfaced as a 500 on ``/seed`` and
    ``/optimize``, not as a startup error.

    A ``NOT NULL`` column is added as ``NOT NULL DEFAULT <scalar>`` when the
    model declares a scalar default; without one it is added nullable and logged
    (``db.migration.nullable_only``), because the alternative is a column that
    exists in the model but not the table, which fails at query time.

    This adds columns only — it never drops or rewrites data, and index
    creation is out of scope (see the CR note on ``orders.external_id``).
    """
    with eng.connect() as conn:
        for table in SQLModel.metadata.sorted_tables:
            _add_missing_columns(conn, table)
            _ensure_indexes(conn, table)


def set_engine(url: str, *, recreate: bool = False) -> Engine:
    global engine
    engine = create_engine(url, connect_args={"check_same_thread": False})
    from greenlogix_api import models as _models  # noqa: F401

    if recreate:
        SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    _ensure_missing_columns(engine)
    return engine


def init_db(*, recreate: bool = False) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    SEED_DIR.mkdir(parents=True, exist_ok=True)
    from greenlogix_api import models as _models  # noqa: F401

    if recreate:
        SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    _ensure_missing_columns(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
