"""Endpoint shape + honesty tests for /analytics/{kpis,timeseries,fleet} (C-01).

Key sets are the frozen CR-20261018-001 §4.2–§4.4 shapes, spelled out
literally — a renamed or dropped key must fail here, not in the dashboard.

Values are cross-checked against the ORM (a different code path than DuckDB)
and against ``late.py`` recomputed in-test, so an invented number cannot pass.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import pytest
from sqlmodel import Session, select

from greenlogix_api import carbon
from greenlogix_api import db as dbmod
from greenlogix_api.analytics import queries
from greenlogix_api.late import late_risk
from greenlogix_api.models import Order, Route, Stop, Vehicle

AUTH = {"Authorization": "Bearer DEMO"}

KPIS_KEYS = {
    "dataset": {"label", "kind", "seed", "generated_at", "orders", "vehicles"},
    "period": {"from", "to"},
    "distance": {
        "km_total",
        "km_empty",
        "empty_running_pct",
        "km_per_stop",
        "stops_per_hour",
    },
    "load": {
        "kg_delivered",
        "capacity_kg_used",
        "transport_work_tkm",
        "payload_utilisation_pct",
        "vehicle_fill_pct",
    },
    "service": {"orders", "delivered", "failed", "on_time", "otif_pct", "late_orders"},
    "cost": {"fuel_litres", "fuel_cost_vnd", "cost_per_order_vnd", "cost_per_km_vnd"},
    "carbon": {
        "kg_co2e_ttw",
        "kg_co2e_wtw",
        "g_co2e_per_tkm",
        "g_co2e_per_order",
        "decomposition",
        "boundary",
        "factor_set",
        "confidence",
        "model_version",
    },
    "labels": {"simulated", "modelled_fuel", "routing_quality"},
}

TIMESERIES_KEYS = {"bucket", "points"}
POINT_KEYS = {"date", "km", "litres", "kg_co2e", "orders", "otif_pct"}
FLEET_KEYS = {"vehicles"}
VEHICLE_KEYS = {
    "plate",
    "km",
    "litres",
    "kg_co2e",
    "orders",
    "kg_delivered",
    "payload_utilisation_pct",
    "capacity_kg",
    "fuel",
    "l_per_100km_spec",
}

# Three routes over two seeded vehicles — vehicle 0 runs twice, which is what
# makes the per-dispatch denominators (transport work, capacity, utilisation)
# distinguishable from the buggy (Σ payload) x (Σ km) / one-capacity versions.
# Columns: vehicle index, km, litres, kg_co2, delivery stop kg.
PLAN = (
    (0, 100.0, 5.0, 15.0, (100.0, 200.0)),  # 300 kg over 100 km
    (0, 100.0, 5.0, 15.0, (150.0,)),  # 150 kg over 100 km
    (1, 100.0, 5.0, 15.0, (200.0, 250.0)),  # 450 kg over 100 km
)
PLAN_KM = 300.0
PLAN_LITRES = 15.0
PLAN_KG_CO2 = 45.0
PLAN_STOPS = 5
PLAN_KG_DELIVERED = 900.0
# Σ_r payload_r[t] x km_r = 0.3*100 + 0.15*100 + 0.45*100
PLAN_WORK_TKM = 90.0
# (Σ payload) x (Σ km) — the wrong denominator, 0.9 t x 300 km.
BUGGY_WORK_TKM = 270.0

@pytest.fixture(autouse=True)
def _reset_backend_state():
    """Module-level DuckDB verdicts must not leak between tests."""
    queries._duck_installed = False
    queries._duck_broken = False
    yield
    queries._duck_installed = False
    queries._duck_broken = False

@pytest.fixture
def seeded(demo_client, monkeypatch, tmp_path):
    """Demo client over a freshly seeded DB; seed artefacts stay in tmp."""
    monkeypatch.setattr(dbmod, "SEED_DIR", tmp_path / "seed")
    assert demo_client.post("/seed", headers=AUTH).status_code == 200
    return demo_client

def _insert_plan() -> None:
    with Session(dbmod.engine) as session:
        vehicles = list(session.exec(select(Vehicle).order_by(Vehicle.id)).all())
        for vehicle_index, km, litres, kg_co2, stop_kg in PLAN:
            vehicle = vehicles[vehicle_index]
            route = Route(
                vehicle_id=vehicle.id,
                plate=vehicle.plate,
                km=km,
                litres=litres,
                kg_co2=kg_co2,
            )
            session.add(route)
            session.commit()
            session.refresh(route)
            session.add(
                Stop(route_id=route.id, seq=0, kind="depot", lat=10.801, lng=106.661)
            )
            for seq, kg in enumerate(stop_kg, start=1):
                session.add(
                    Stop(
                        route_id=route.id,
                        seq=seq,
                        kind="stop",
                        lat=10.80 + seq / 100,
                        lng=106.66 + seq / 100,
                        kg=kg,
                        window_end="18:00",
                        status="pending",
                    )
                )
        # Orphan stop: never assigned to a route -> must not reach the KPIs.
        session.add(Stop(route_id=None, seq=9, kind="stop", kg=999.0))
        session.commit()

def _orm_routes() -> list[Route]:
    with Session(dbmod.engine) as session:
        return list(session.exec(select(Route)).all())

def _orm_all_stops() -> list[Stop]:
    with Session(dbmod.engine) as session:
        return list(session.exec(select(Stop)).all())

def _orm_routed_stops() -> list[Stop]:
    return [
        stop for stop in _orm_all_stops() if stop.route_id is not None and stop.kind != "depot"
    ]

def _orm_vehicles() -> list[Vehicle]:
    with Session(dbmod.engine) as session:
        return list(session.exec(select(Vehicle).order_by(Vehicle.id)).all())

def _orm_orders() -> list[Order]:
    with Session(dbmod.engine) as session:
        return list(session.exec(select(Order)).all())

def _orm_transport_work_tkm() -> float:
    """Σ_r (payload_r [t] x km_r), recomputed from ORM rows."""
    work = 0.0
    for route in _orm_routes():
        route_kg = sum(
            stop.kg for stop in _orm_all_stops() if stop.route_id == route.id and stop.kind != "depot"
        )
        work += route_kg / 1000.0 * route.km
    return work

def _modelled_late_orders() -> int:
    return sum(
        1
        for order in _orm_orders()
        if order.status not in {"delivered", "failed"}
        and late_risk(order.lat, order.lng, order.window_end)
    )

def _get(client, path: str, **params: Any) -> dict[str, Any]:
    response = client.get(path, headers=AUTH, params=params or None)
    assert response.status_code == 200, response.text
    body = response.json()
    assert isinstance(body, dict)
    return body

# ---------------------------------------------------------------- shape (CR §4.2-4.4)

def test_kpis_key_set_matches_cr_4_2(seeded):
    body = _get(seeded, "/analytics/kpis")
    assert {key: set(value) for key, value in body.items()} == KPIS_KEYS
    assert body["carbon"]["boundary"] == "TTW"
    assert body["carbon"]["confidence"] == "C1-illustrative"
    assert body["carbon"]["factor_set"] == "IPCC 2006 -> GLEC v3.2 cross-check"
    assert body["carbon"]["model_version"] == "GLX-HDT-v1.0"
    assert body["labels"]["modelled_fuel"] is True
    assert body["dataset"]["label"] == "greenlogix.db"
    assert body["dataset"]["kind"] == "simulated"
    assert body["dataset"]["orders"] == len(_orm_orders())
    assert body["dataset"]["vehicles"] == len(_orm_vehicles())
    assert body["labels"]["simulated"] is True

def test_timeseries_key_set_matches_cr_4_3(seeded):
    body = _get(seeded, "/analytics/timeseries", metric="km", bucket="day")
    assert set(body) == TIMESERIES_KEYS
    assert body["bucket"] == "day"
    assert len(body["points"]) == 1
    assert set(body["points"][0]) == POINT_KEYS

def test_fleet_key_set_matches_cr_4_4(seeded):
    body = _get(seeded, "/analytics/fleet")
    assert set(body) == FLEET_KEYS
    assert body["vehicles"]
    for vehicle in body["vehicles"]:
        assert set(vehicle) == VEHICLE_KEYS
    assert sorted(v["plate"] for v in body["vehicles"]) == sorted(
        v.plate for v in _orm_vehicles()
    )

@pytest.mark.parametrize("metric", ["km", "litres", "kg_co2e", "orders", "otif_pct"])
def test_timeseries_accepts_every_documented_metric(seeded, metric):
    assert _get(seeded, "/analytics/timeseries", metric=metric)["bucket"] == "day"

@pytest.mark.parametrize(
    ("path", "params"),
    [
        ("/analytics/kpis", {}),
        ("/analytics/timeseries", {}),
        ("/analytics/fleet", {}),
    ],
)
def test_requires_dispatcher_auth(seeded, path, params):
    assert seeded.get(path, params=params).status_code == 401

def test_unknown_metric_and_bucket_are_422(seeded):
    assert (
        seeded.get(
            "/analytics/timeseries", headers=AUTH, params={"metric": "banana"}
        ).status_code
        == 422
    )
    assert (
        seeded.get(
            "/analytics/timeseries", headers=AUTH, params={"bucket": "month"}
        ).status_code
        == 422
    )
    assert (
        seeded.get(
            "/analytics/timeseries", headers=AUTH, params={"bucket": "hour"}
        ).status_code
        == 200
    )

# ---------------------------------------------------------------- honesty: null, never 0

def test_unmeasured_metrics_are_null_never_zero(seeded):
    """Seeded DB has no plan: every unmeasurable metric must be null."""
    body = _get(seeded, "/analytics/kpis")
    assert body["distance"]["km_empty"] is None  # closed loops, no empty leg
    assert body["distance"]["empty_running_pct"] is None
    assert body["distance"]["stops_per_hour"] is None  # no route duration stored
    assert body["service"]["on_time"] is None  # no delivered-at timestamp
    assert body["service"]["otif_pct"] is None
    assert body["carbon"]["kg_co2e_wtw"] is None  # km_total == 0
    assert body["carbon"]["decomposition"] is None  # no plan stored
    # Nothing to divide by: no route km, no stops, nothing routed.
    assert body["distance"]["km_per_stop"] is None
    assert body["load"]["payload_utilisation_pct"] is None
    assert body["load"]["vehicle_fill_pct"] is None
    assert body["carbon"]["g_co2e_per_tkm"] is None
    assert body["carbon"]["g_co2e_per_order"] is None

def test_per_order_metrics_are_null_with_no_routed_work(seeded, monkeypatch):
    """80 pending orders and no routes must not read as 0 g / 0 VND per order."""
    monkeypatch.setenv(queries.FUEL_PRICE_ENV, "20000")
    body = _get(seeded, "/analytics/kpis")
    assert body["service"]["orders"] == 80
    assert body["carbon"]["g_co2e_per_order"] is None
    assert body["cost"]["cost_per_order_vnd"] is None

def test_fuel_costs_are_null_until_price_is_set(seeded, monkeypatch):
    monkeypatch.delenv(queries.FUEL_PRICE_ENV, raising=False)
    body = _get(seeded, "/analytics/kpis")
    assert body["cost"]["fuel_cost_vnd"] is None
    assert body["cost"]["cost_per_order_vnd"] is None
    assert body["cost"]["cost_per_km_vnd"] is None

def test_fuel_costs_follow_the_env_price(seeded, monkeypatch):
    _insert_plan()
    monkeypatch.setenv(queries.FUEL_PRICE_ENV, "20000")
    body = _get(seeded, "/analytics/kpis")
    assert body["cost"]["fuel_litres"] == pytest.approx(PLAN_LITRES)
    assert body["cost"]["fuel_cost_vnd"] == pytest.approx(PLAN_LITRES * 20000)

def test_unparseable_fuel_price_is_treated_as_unset(seeded, monkeypatch):
    monkeypatch.setenv(queries.FUEL_PRICE_ENV, "not-a-number")
    assert _get(seeded, "/analytics/kpis")["cost"]["fuel_cost_vnd"] is None

def test_modelled_late_orders_match_the_late_risk_scan(seeded):
    body = _get(seeded, "/analytics/kpis")
    assert body["service"]["late_orders"] == _modelled_late_orders()
    assert body["service"]["late_orders"] >= 0

# ---------------------------------------------------------------- values are measured

def test_multi_route_intensities_use_per_dispatch_denominators(seeded, monkeypatch):
    """B-2 / M-3 / M-5: three dispatches, hand-computed expectations.

    km_total 3 x 100 = 300 · litres 15 · kg CO2e 45 · stops 5 · kg delivered 900.
    Transport work is Σ_r payload_r[t] x km_r = 30 + 15 + 45 = 90 t·km — NOT
    (Σ payload) x (Σ km) = 0.9 x 300 = 270 t·km, which would understate the
    intensity ~3x (once per route). Capacity is per dispatch: 500 + 500 + 800 =
    1800 kg, so utilisation is 900 / 1800 = 50 %, not 900 / 1300 = 69.2 %.
    """
    _insert_plan()
    monkeypatch.setenv(queries.FUEL_PRICE_ENV, "20000")
    body = _get(seeded, "/analytics/kpis")

    assert body["distance"]["km_total"] == pytest.approx(PLAN_KM)
    assert body["cost"]["fuel_litres"] == pytest.approx(PLAN_LITRES)
    assert body["carbon"]["kg_co2e_ttw"] == pytest.approx(PLAN_KG_CO2)
    assert body["load"]["kg_delivered"] == pytest.approx(PLAN_KG_DELIVERED)
    assert body["load"]["capacity_kg_used"] == pytest.approx(1800.0)
    assert body["load"]["payload_utilisation_pct"] == pytest.approx(50.0)
    assert body["load"]["payload_utilisation_pct"] <= 100.0
    assert body["distance"]["km_per_stop"] == pytest.approx(PLAN_KM / PLAN_STOPS)
    # 45_000 g / 90 t.km = 500 g/t.km
    assert body["carbon"]["g_co2e_per_tkm"] == pytest.approx(500.0)
    # ... and not the (Σkg)(Σkm) reading: 45_000 / 270 = 166.67 g/t.km
    assert body["carbon"]["g_co2e_per_tkm"] != pytest.approx(
        PLAN_KG_CO2 * 1000.0 / BUGGY_WORK_TKM
    )
    # Per-order intensities divide by the 5 routed orders, not all 80 orders.
    assert body["carbon"]["g_co2e_per_order"] == pytest.approx(PLAN_KG_CO2 * 1000.0 / PLAN_STOPS)
    assert body["cost"]["cost_per_order_vnd"] == pytest.approx(
        PLAN_LITRES * 20000 / PLAN_STOPS
    )
    assert body["cost"]["cost_per_km_vnd"] == pytest.approx(PLAN_LITRES * 20000 / PLAN_KM)
    # Used vehicles only: 3 and 2 stops -> mean 2.5 / fullest 3 = 83.333 %.
    assert body["load"]["vehicle_fill_pct"] == pytest.approx(83.3333333333)

def test_values_match_independent_orm_aggregates(seeded):
    _insert_plan()
    body = _get(seeded, "/analytics/kpis")
    routes = _orm_routes()
    routed_stops = _orm_routed_stops()
    km_total = sum(route.km for route in routes)
    fuel_litres = sum(route.litres for route in routes)
    kg_co2e = sum(route.kg_co2 for route in routes)
    kg_delivered = sum(stop.kg for stop in routed_stops)
    work = _orm_transport_work_tkm()
    vehicles_by_id = {vehicle.id: vehicle for vehicle in _orm_vehicles()}
    capacity_dispatched = sum(
        vehicles_by_id[route.vehicle_id].capacity_kg for route in routes
    )

    assert body["distance"]["km_total"] == pytest.approx(km_total)
    assert body["cost"]["fuel_litres"] == pytest.approx(fuel_litres)
    assert body["carbon"]["kg_co2e_ttw"] == pytest.approx(kg_co2e)
    assert body["load"]["kg_delivered"] == pytest.approx(kg_delivered)
    assert body["load"]["capacity_kg_used"] == pytest.approx(capacity_dispatched)
    assert body["carbon"]["g_co2e_per_tkm"] == pytest.approx(kg_co2e * 1000.0 / work)
    assert body["carbon"]["g_co2e_per_order"] == pytest.approx(
        kg_co2e * 1000.0 / len(routed_stops)
    )
    # The orphan stop (999 kg) is not on a route and must not be counted.
    assert body["distance"]["km_per_stop"] == pytest.approx(km_total / len(routed_stops))

def test_fleet_rows_match_orm_aggregates(seeded):
    _insert_plan()
    body = _get(seeded, "/analytics/fleet")
    routes = _orm_routes()
    routed_stops = _orm_routed_stops()
    by_plate = {row["plate"]: row for row in body["vehicles"]}

    for plate in {route.plate for route in routes}:
        plate_routes = [route for route in routes if route.plate == plate]
        plate_stops = [
            stop for stop in routed_stops if stop.route_id in {r.id for r in plate_routes}
        ]
        row = by_plate[plate]
        assert row["km"] == pytest.approx(sum(route.km for route in plate_routes))
        assert row["litres"] == pytest.approx(sum(route.litres for route in plate_routes))
        assert row["kg_co2e"] == pytest.approx(sum(route.kg_co2 for route in plate_routes))
        assert row["orders"] == len(plate_stops)
        assert row["kg_delivered"] == pytest.approx(sum(s.kg for s in plate_stops))
        # Per dispatch: capacity x the number of routes this vehicle ran.
        assert row["payload_utilisation_pct"] == pytest.approx(
            sum(s.kg for s in plate_stops)
            / (row["capacity_kg"] * len(plate_routes))
            * 100.0
        )
        assert row["payload_utilisation_pct"] <= 100.0

    for row in body["vehicles"]:
        assert row["fuel"] in {"petrol", "diesel"}
        assert row["l_per_100km_spec"] >= 0.0
        if row["orders"] == 0:
            # No routed work: no utilisation to state (not 0 %).
            assert row["km"] == 0.0
            assert row["payload_utilisation_pct"] is None

def test_vehicle_on_two_partial_routes_stays_under_full(seeded):
    """M-5: one vehicle, two half-full dispatches -> 50 %, never 100 %."""
    _insert_plan()
    body = _get(seeded, "/analytics/fleet")
    plate = _orm_vehicles()[0].plate
    row = next(v for v in body["vehicles"] if v["plate"] == plate)
    assert row["orders"] == 3
    assert row["kg_delivered"] == pytest.approx(450.0)
    # 450 kg over two 500 kg dispatches = 45 % (was 90 % with one capacity).
    assert row["payload_utilisation_pct"] == pytest.approx(45.0)

def test_transport_work_metrics_on_an_empty_fleet(seeded):
    body = _get(seeded, "/analytics/kpis")
    # No route exists: no km, no transport work -> the intensities are
    # undefined and stay null, never 0.
    assert body["carbon"]["g_co2e_per_tkm"] is None
    assert body["carbon"]["g_co2e_per_order"] is None
    assert body["distance"]["km_total"] == 0.0
    assert body["load"]["kg_delivered"] == 0.0
    assert body["load"]["capacity_kg_used"] == 0.0
    assert body["service"]["orders"] == 80

def test_timeseries_point_equals_the_kpi_totals(seeded):
    _insert_plan()
    kpis = _get(seeded, "/analytics/kpis")
    point = _get(seeded, "/analytics/timeseries", metric="km")["points"][0]
    assert point["date"] == kpis["period"]["from"] == kpis["period"]["to"]
    assert point["km"] == pytest.approx(kpis["distance"]["km_total"])
    assert point["litres"] == pytest.approx(kpis["cost"]["fuel_litres"])
    assert point["kg_co2e"] == pytest.approx(kpis["carbon"]["kg_co2e_ttw"])
    assert point["orders"] == kpis["service"]["orders"]
    assert point["otif_pct"] is None  # no delivered-at timestamp exists

# ---------------------------------------------------------------- provenance

def test_generated_at_falls_back_to_db_file_mtime(seeded):
    body = _get(seeded, "/analytics/kpis")
    stamp = datetime.fromisoformat(body["dataset"]["generated_at"])
    assert stamp.tzinfo is not None
    assert stamp.date() == datetime.fromtimestamp(
        dbmod.DB_PATH.stat().st_mtime, tz=UTC
    ).date()
    assert body["period"] == {
        "from": body["dataset"]["generated_at"][:10],
        "to": body["dataset"]["generated_at"][:10],
    }
    assert body["dataset"]["seed"] is None  # no dataset_meta.json exists

def _write_meta(meta: dict[str, Any]) -> None:
    dbmod.SEED_DIR.mkdir(parents=True, exist_ok=True)
    (dbmod.SEED_DIR / "dataset_meta.json").write_text(json.dumps(meta), encoding="utf-8")

def test_dataset_meta_is_honoured_when_it_matches_the_db(seeded):
    meta = {
        "label": "Customer A — October upload",
        "kind": "customer",
        "seed": 42,
        "generated_at": "2026-10-18T09:30:00+07:00",
        "rows": 80,  # matches the 80 seeded orders
    }
    _write_meta(meta)
    body = _get(seeded, "/analytics/kpis")
    assert body["dataset"]["label"] == meta["label"]
    assert body["dataset"]["kind"] == "customer"
    assert body["dataset"]["seed"] == 42
    assert body["dataset"]["generated_at"] == meta["generated_at"]
    assert body["period"] == {"from": "2026-10-18", "to": "2026-10-18"}
    assert body["labels"]["simulated"] is False
    assert "stale" not in body["dataset"]["label"]

def test_stale_dataset_meta_is_ignored_and_said_so(seeded):
    """M-8: a generator's meta must not relabel a later, smaller DB."""
    _write_meta(
        {
            "label": "synthetic-1000",
            "kind": "simulated",
            "seed": 7,
            "generated_at": "2026-10-01T00:00:00+07:00",
            "rows": 1000,  # but this DB has 80 orders
        }
    )
    body = _get(seeded, "/analytics/kpis")
    assert body["dataset"]["seed"] is None
    assert body["dataset"]["label"].startswith("greenlogix.db")
    assert "stale" in body["dataset"]["label"]
    assert "declares 1000 rows" in body["dataset"]["label"]
    # The stale stamp is dropped too: the DB file is the source of truth.
    assert body["dataset"]["generated_at"] != "2026-10-01T00:00:00+07:00"
    assert body["period"] == {
        "from": body["dataset"]["generated_at"][:10],
        "to": body["dataset"]["generated_at"][:10],
    }

def test_dataset_meta_without_a_row_count_is_believed(seeded):
    """A meta that declares no count cannot be falsified — documented ceiling."""
    _write_meta({"label": "labelled-by-generator", "kind": "reference"})
    body = _get(seeded, "/analytics/kpis")
    assert body["dataset"]["label"] == "labelled-by-generator"
    assert body["dataset"]["kind"] == "reference"

@pytest.mark.parametrize("key", queries.META_ROWS_KEYS)
def test_every_declared_row_count_key_is_honoured(seeded, key):
    _write_meta({"label": "counted", key: 80})
    assert _get(seeded, "/analytics/kpis")["dataset"]["label"] == "counted"
    _write_meta({"label": "counted", key: 79})
    assert "stale" in _get(seeded, "/analytics/kpis")["dataset"]["label"]

def test_routing_quality_follows_the_stored_report(seeded):
    assert _get(seeded, "/analytics/kpis")["labels"]["routing_quality"] == "DEGRADED"
    carbon.save_report(
        carbon.TotalsOut(km=10.0, litres=1.0, kg_co2=2.0),
        carbon.TotalsOut(km=8.0, litres=0.8, kg_co2=1.6),
        extra={"routing_quality": "VERIFIED_GRAPH"},
    )
    assert (
        _get(seeded, "/analytics/kpis")["labels"]["routing_quality"]
        == "VERIFIED_GRAPH"
    )

# ---------------------------------------------------------------- backend

def test_duckdb_backend_is_the_one_actually_used(seeded, monkeypatch):
    monkeypatch.delenv(queries.BACKEND_ENV, raising=False)
    _get(seeded, "/analytics/kpis")
    assert queries._duck_installed is True
    assert queries._duck_broken is False

def test_in_memory_session_uses_the_session_path(monkeypatch):
    """M-6: an in-memory DB has no file for DuckDB — and must not break it."""
    monkeypatch.setenv("GREENLOGIX_DEMO", "1")
    monkeypatch.delenv(queries.BACKEND_ENV, raising=False)
    monkeypatch.setattr(dbmod, "SEED_DIR", dbmod.DATA_DIR / "seed")
    dbmod.set_engine("sqlite://", recreate=True)
    from greenlogix_api.seed import seed_database

    with Session(dbmod.engine) as session:
        seed_database(session)
        body = queries.kpis(session)
    assert body["dataset"]["orders"] == 80
    assert body["service"]["orders"] == 80
    assert body["distance"]["km_total"] == 0.0
    # No file to scan -> never candidate for DuckDB, so no false failure.
    assert queries._duck_broken is False
    assert queries._backend(None) == "sqlite"

def test_duckdb_extension_failure_falls_back_for_the_process(seeded, monkeypatch):
    """Extension genuinely unavailable (no cache, no network): stay 200."""
    _insert_plan()
    expected = _get(seeded, "/analytics/kpis")

    def _no_extension(_sql: str):
        raise queries.DuckExtensionError("sqlite extension unavailable")

    monkeypatch.setattr(queries, "_duck_rows", _no_extension)
    monkeypatch.delenv(queries.BACKEND_ENV, raising=False)
    body = _get(seeded, "/analytics/kpis")
    assert body == expected
    assert queries._duck_broken is True
    # Subsequent calls skip DuckDB entirely and still answer.
    assert _get(seeded, "/analytics/fleet")["vehicles"]
    assert _get(seeded, "/analytics/timeseries", metric="km")["points"][0][
        "km"
    ] == pytest.approx(body["distance"]["km_total"])
    # ... but an explicit operator override still retries the fast path, and
    # without the override the remembered verdict keeps the session path.
    monkeypatch.setenv(queries.BACKEND_ENV, "duckdb")
    assert queries._backend(dbmod.DB_PATH) == "duckdb"
    monkeypatch.delenv(queries.BACKEND_ENV, raising=False)
    assert queries._backend(dbmod.DB_PATH) == "sqlite"

def test_transient_duckdb_error_does_not_condemn_the_backend(seeded, monkeypatch):
    _insert_plan()
    expected = _get(seeded, "/analytics/kpis")

    def _transient(_sql: str):
        raise RuntimeError("database is locked")

    monkeypatch.setattr(queries, "_duck_rows", _transient)
    monkeypatch.delenv(queries.BACKEND_ENV, raising=False)
    assert _get(seeded, "/analytics/kpis") == expected  # served by the session
    assert queries._duck_broken is False
    assert queries._backend(dbmod.DB_PATH) == "duckdb"

def test_sqlite_fallback_returns_the_same_payload(seeded, monkeypatch):
    _insert_plan()
    duckdb_body = _get(seeded, "/analytics/kpis")
    fleet_duckdb = _get(seeded, "/analytics/fleet")
    series_duckdb = _get(seeded, "/analytics/timeseries", metric="km")

    monkeypatch.setenv(queries.BACKEND_ENV, "sqlite")
    assert _get(seeded, "/analytics/kpis") == duckdb_body
    assert _get(seeded, "/analytics/fleet") == fleet_duckdb
    assert _get(seeded, "/analytics/timeseries", metric="km") == series_duckdb
