"""T-LOOP-GEO (CR-08 honest slice): versioned admin-areas endpoint + fallback label.

Covers: version const present, corridor non-empty, method labeled
``centroid-fallback`` (never polygon intersection), 404 on unknown route,
and ``admin_boundary_version`` propagation into report ``extra``.
"""

from __future__ import annotations

import json
from types import SimpleNamespace

from sqlmodel import Session

from greenlogix_api import db as dbmod
from greenlogix_api.geo.admin_boundaries import (
    ADMIN_BOUNDARY_VERSION,
    ADMIN_LOOKUP_METHOD,
    admin_boundary_audit_extra,
    lookup_admin_areas_versioned,
)
from greenlogix_api.routers.optimize import persist_plan
from greenlogix_api.schemas import TotalsOut

AUTH = {"Authorization": "Bearer DEMO"}


def _seed_optimize(demo_client) -> list[dict]:
    seeded = demo_client.post("/seed", headers=AUTH)
    assert seeded.status_code == 200
    optimized = demo_client.post(
        "/optimize", headers=AUTH, json={"cluster_radius_km": 3.0}
    )
    assert optimized.status_code == 200
    routes = demo_client.get("/routes", headers=AUTH)
    assert routes.status_code == 200
    assert routes.json(), "expected at least one route after seed+optimize"
    return routes.json()


def test_lookup_versioned_labels_fallback() -> None:
    stops = [
        {"id": 1, "lat": 10.8123, "lng": 106.6543},
        {"id": 2, "lat": 10.7812, "lng": 106.6998},
    ]
    out = lookup_admin_areas_versioned(stops, route_id=7)
    assert out["route_id"] == 7
    assert out["admin_boundary_version"] == ADMIN_BOUNDARY_VERSION
    assert out["admin_boundary_version"] == "nso-2024-v1-centroid-fallback"
    assert out["method"] == ADMIN_LOOKUP_METHOD == "centroid-fallback"
    assert out["corridor"], "corridor must be non-empty"
    assert out["district_breadcrumb"]
    for area in out["corridor"]:
        assert {"code", "ward_name", "district", "province"} <= set(area)
    # Honest labeling: never claims polygon intersection anywhere.
    assert "polygon" not in json.dumps(out).lower()


def test_admin_boundary_audit_extra_pins_version() -> None:
    assert admin_boundary_audit_extra() == {
        "admin_boundary_version": "nso-2024-v1-centroid-fallback"
    }


def test_endpoint_returns_versioned_corridor(demo_client) -> None:
    routes = _seed_optimize(demo_client)
    route_id = routes[0]["id"]
    res = demo_client.get(f"/routes/{route_id}/admin-areas", headers=AUTH)
    assert res.status_code == 200
    body = res.json()
    assert body["route_id"] == route_id
    assert body["admin_boundary_version"] == "nso-2024-v1-centroid-fallback"
    assert body["method"] == "centroid-fallback"
    assert body["corridor"], "corridor must be non-empty"
    assert body["district_breadcrumb"]
    assert "polygon" not in json.dumps(body).lower()


def test_endpoint_unknown_route_returns_404(demo_client) -> None:
    res = demo_client.get("/routes/999999/admin-areas", headers=AUTH)
    assert res.status_code == 404
    assert res.json() == {"detail": "not_found"}


def test_persist_plan_extra_carries_admin_version() -> None:
    result = SimpleNamespace(
        routes=[],
        unassigned_ids=[],
        baseline=TotalsOut(km=10.0, litres=1.0, kg_co2=2.31),
        totals=TotalsOut(km=8.0, litres=0.8, kg_co2=1.848),
        distance_provider="circuity",
        routing_quality="DEGRADED",
        eco_weight=0.0,
    )
    with Session(dbmod.engine) as session:
        assert persist_plan(session, result) == []
    payload = json.loads(dbmod.REPORT_PATH.read_text(encoding="utf-8"))
    assert payload["admin_boundary_version"] == "nso-2024-v1-centroid-fallback"
