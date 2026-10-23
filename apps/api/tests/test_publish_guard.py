"""CR-01 fail-closed publish guard (T-LOOP-PUBLISH, ADR 0001 §C).

POST /routes/publish returns 403 when GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1
and the stored report's routing_quality is not VERIFIED_GRAPH.
publish_blocked_for_quality() in solver/flags.py is the single decision point.
"""

from __future__ import annotations

import pytest
from sqlmodel import Session

from greenlogix_api import carbon
from greenlogix_api import db as dbmod
from greenlogix_api.models import Order, Vehicle

AUTH = {"Authorization": "Bearer DEMO"}


def _seed_tiny() -> None:
    with Session(dbmod.engine) as session:
        session.add(
            Vehicle(
                plate="51C-000.01",
                type="xe_tai_nho",
                capacity_kg=2000,
                fuel="diesel",
                l_per_100km=12,
                status="ready",
            )
        )
        for oid, (lat, lng) in enumerate([(10.776, 106.700), (10.790, 106.680)], start=1):
            session.add(
                Order(
                    address=f"a{oid}",
                    lat=lat,
                    lng=lng,
                    receiver="KH",
                    phone="",
                    kg=80,
                    window_start="08:00",
                    window_end="10:00",
                    excel_row=oid,
                )
            )
        session.commit()


def _optimize(demo_client) -> None:
    _seed_tiny()
    res = demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0})
    assert res.status_code == 200
    assert res.json()["routing_quality"] == "DEGRADED"  # CI circuity baseline


def _mark_report_verified() -> None:
    stored = carbon.load_report()
    assert stored is not None
    carbon.save_report(
        stored.baseline,
        stored.optimized,
        extra={
            "distance_provider": "osrm",
            "routing_quality": "VERIFIED_GRAPH",
            "eco_weight": 0.0,
        },
    )


def test_publish_blocked_degraded_with_flag(
    demo_client, monkeypatch: pytest.MonkeyPatch
) -> None:
    """403 when flag=1 and stored report quality is DEGRADED."""
    monkeypatch.setenv("GREENLOGIX_PUBLISH_REQUIRE_VERIFIED", "1")
    _optimize(demo_client)
    res = demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    assert res.status_code == 403
    assert "VERIFIED_GRAPH" in res.json()["detail"]
    assert "GREENLOGIX_PUBLISH_REQUIRE_VERIFIED" in res.json()["detail"]


def test_publish_allowed_verified_with_flag(
    demo_client, monkeypatch: pytest.MonkeyPatch
) -> None:
    """200 when flag=1 and stored report quality is VERIFIED_GRAPH."""
    monkeypatch.setenv("GREENLOGIX_PUBLISH_REQUIRE_VERIFIED", "1")
    _optimize(demo_client)
    _mark_report_verified()
    res = demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    assert res.status_code == 200


def test_publish_allowed_degraded_without_flag(
    demo_client, monkeypatch: pytest.MonkeyPatch
) -> None:
    """200 when flag is unset and quality is DEGRADED (existing behavior)."""
    monkeypatch.delenv("GREENLOGIX_PUBLISH_REQUIRE_VERIFIED", raising=False)
    _optimize(demo_client)
    res = demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    assert res.status_code == 200
