"""Pre-existing SQLite files must be healed at startup, not at request time.

Regression guard: a ``greenlogix.db`` created before an additive column existed
used to make every ORM SELECT fail with ``no such column`` — observed as HTTP
500 on ``/seed`` and ``/optimize`` while ``/health`` stayed green, because the
old code healed one hard-coded column per helper.
"""

from __future__ import annotations

import sqlite3

from sqlmodel import Session, select

from greenlogix_api import db as dbmod
from greenlogix_api.models import Order, Stop, Vehicle


def _legacy_db(path) -> None:
    """Schema as it looked before route_id / envelope / provenance / external_id."""
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            address TEXT, lat FLOAT, lng FLOAT, receiver TEXT, phone TEXT,
            kg FLOAT, window_start TEXT, window_end TEXT, cargo_type TEXT,
            notes TEXT, excel_row INTEGER, status TEXT
        );
        CREATE TABLE stops (
            id INTEGER PRIMARY KEY,
            seq INTEGER, kind TEXT, order_id INTEGER, lat FLOAT, lng FLOAT,
            address TEXT, phone TEXT, window_start TEXT, window_end TEXT,
            notes TEXT, kg FLOAT, status TEXT, fail_reason TEXT
        );
        CREATE TABLE vehicles (
            id INTEGER PRIMARY KEY, plate TEXT, type TEXT, capacity_kg FLOAT,
            fuel TEXT, l_per_100km FLOAT, status TEXT
        );
        CREATE TABLE routes (
            id INTEGER PRIMARY KEY, vehicle_id INTEGER, plate TEXT, color TEXT,
            published BOOLEAN, km FLOAT, litres FLOAT, kg_co2 FLOAT, overload BOOLEAN
        );
        INSERT INTO orders (id, address, lat, lng, receiver, phone, kg,
                            window_start, window_end, cargo_type, notes, excel_row, status)
        VALUES (1, 'legacy row', 10.8, 106.6, 'r', '0900000000', 10.0,
                '08:00', '10:00', 'hang_kho', '', 1, 'pending');
        """
    )
    conn.commit()
    conn.close()


def test_legacy_database_gains_every_declared_column(tmp_path):
    db_path = tmp_path / "greenlogix.db"
    _legacy_db(db_path)

    dbmod.set_engine(f"sqlite:///{db_path}")

    conn = sqlite3.connect(db_path)
    live = {
        table: {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
        for table in ("orders", "stops", "vehicles")
    }
    conn.close()

    for table in ("orders", "stops", "vehicles"):
        declared = {c.name for c in dbmod.SQLModel.metadata.tables[table].columns}
        assert declared - live[table] == set(), f"{table} still missing columns"

    # the columns that actually broke the demo path
    assert {"place_id", "place_provider", "place_confidence", "geocode_at", "external_id"} <= live["orders"]
    assert "route_id" in live["stops"]
    assert {"height_m", "width_m", "length_m", "gvw_kg", "axle_load_t"} <= live["vehicles"]


def test_orm_select_survives_a_legacy_database(tmp_path):
    """The failure mode was a 500 on the first ORM SELECT, so assert the read."""
    db_path = tmp_path / "greenlogix.db"
    _legacy_db(db_path)
    engine = dbmod.set_engine(f"sqlite:///{db_path}")

    with Session(engine) as session:
        orders = session.exec(select(Order)).all()
        assert [o.id for o in orders] == [1]
        assert orders[0].address == "legacy row"
        assert orders[0].place_id is None
        assert session.exec(select(Stop)).all() == []
        assert session.exec(select(Vehicle)).all() == []


def test_migration_is_idempotent(tmp_path):
    db_path = tmp_path / "greenlogix.db"
    _legacy_db(db_path)
    dbmod.set_engine(f"sqlite:///{db_path}")
    dbmod._ensure_missing_columns(dbmod.engine)  # second run must be a no-op
    dbmod._ensure_missing_columns(dbmod.engine)

    conn = sqlite3.connect(db_path)
    cols = [row[1] for row in conn.execute("PRAGMA table_info(orders)")]
    conn.close()
    assert len(cols) == len(set(cols))
    assert cols.count("external_id") == 1


def test_not_null_column_with_scalar_default_is_added_with_default(tmp_path):
    """A NOT NULL model field with a scalar default must land in the table.

    Skipping it (the previous behaviour) produced a column that exists in the
    model but not in SQLite, so the first ORM SELECT raised `no such column`.
    """
    import sqlalchemy as sa

    db_path = tmp_path / "t.db"
    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE TABLE t (id INTEGER PRIMARY KEY)")
        conn.exec_driver_sql("INSERT INTO t (id) VALUES (1)")

    metadata = sa.MetaData()
    table = sa.Table(
        "t",
        metadata,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("flag", sa.Boolean, nullable=False, default=False),
        sa.Column("status", sa.String, nullable=False, default="pending"),
        sa.Column("note", sa.String, nullable=True),
    )

    with engine.connect() as conn:
        dbmod._add_missing_columns(conn, table)

    conn = sqlite3.connect(db_path)
    info = {row[1]: row for row in conn.execute("PRAGMA table_info(t)")}
    row = conn.execute("SELECT flag, status FROM t WHERE id = 1").fetchone()
    conn.close()

    assert {"flag", "status", "note"} <= set(info)
    assert info["flag"][3] == 1, "NOT NULL must be declared on flag"
    assert info["flag"][4] == "0", "scalar default must be carried into the DDL"
    assert row == (0, "pending"), "existing rows take the declared default"


def test_not_null_column_without_scalar_default_is_added_nullable(tmp_path, caplog):
    """No scalar default -> add it nullable rather than leaving it absent."""
    import logging

    import sqlalchemy as sa

    db_path = tmp_path / "t2.db"
    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE TABLE t2 (id INTEGER PRIMARY KEY)")
        conn.exec_driver_sql("INSERT INTO t2 (id) VALUES (1)")

    metadata = sa.MetaData()
    table = sa.Table(
        "t2",
        metadata,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("required", sa.String, nullable=False),
    )

    with caplog.at_level(logging.WARNING, logger="ecomiles"), engine.connect() as conn:
        dbmod._add_missing_columns(conn, table)

    conn = sqlite3.connect(db_path)
    cols = {row[1] for row in conn.execute("PRAGMA table_info(t2)")}
    conn.close()
    assert "required" in cols
    assert "db.migration.nullable_only" in caplog.text


def test_sqlite_literal_rendering():
    assert dbmod._sqlite_literal(True) == "1"
    assert dbmod._sqlite_literal(False) == "0"
    assert dbmod._sqlite_literal(7) == "7"
    assert dbmod._sqlite_literal(1.5) == "1.5"
    assert dbmod._sqlite_literal("o'brien") == "'o''brien'"
    assert dbmod._sqlite_literal(None) is None
    assert dbmod._sqlite_literal([1]) is None


def test_declared_index_is_created_on_a_pre_existing_table(tmp_path):
    """`create_all` skips indexes for tables it did not create, so an index added
    to a model later (the `orders.external_id` dedupe key) would never appear on
    an existing database file."""
    import sqlalchemy as sa

    db_path = tmp_path / "t3.db"
    engine = sa.create_engine(f"sqlite:///{db_path}")
    with engine.begin() as conn:
        conn.exec_driver_sql("CREATE TABLE t3 (id INTEGER PRIMARY KEY, external_id TEXT)")

    metadata = sa.MetaData()
    table = sa.Table(
        "t3",
        metadata,
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("external_id", sa.String, index=True),
    )

    with engine.connect() as conn:
        dbmod._ensure_indexes(conn, table)
        dbmod._ensure_indexes(conn, table)  # idempotent

    conn = sqlite3.connect(db_path)
    names = {row[1] for row in conn.execute("PRAGMA index_list(t3)")}
    conn.close()
    assert "ix_t3_external_id" in names


def test_orders_external_id_carries_an_index_in_the_model():
    """Guards the dedupe key against losing its index in a refactor."""
    indexed = {column.name for column in Order.__table__.columns if column.index}
    assert "external_id" in indexed
