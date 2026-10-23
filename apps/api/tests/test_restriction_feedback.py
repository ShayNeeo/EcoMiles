"""Restriction feedback endpoint + verification queue (T-03, CR-20260923-001)."""

from __future__ import annotations

import pytest

from greenlogix_api.geo import restrictions as geomod

PLATE_A = "51C01"
PLATE_B = "51C02"
PAYLOAD_A = {
    "plate": PLATE_A,
    "lat": 10.776,
    "lng": 106.700,
    "issue_type": "road_closed",
    "notes": "barrier reported",
}


@pytest.fixture(autouse=True)
def clean_queue():
    geomod.clear_feedback_queue()
    yield
    geomod.clear_feedback_queue()


def test_submit_returns_201_pending(demo_client) -> None:
    res = demo_client.post(
        "/driver/restriction-feedback",
        json=PAYLOAD_A,
        headers={"X-Driver-Pin": "0000"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "pending_review"
    assert body["id"]
    assert len(geomod.list_pending()) == 1


def test_scoped_driver_cross_plate_403(demo_client) -> None:
    res = demo_client.post(
        "/driver/restriction-feedback",
        json={**PAYLOAD_A, "plate": PLATE_B},
        headers={"X-Driver-Pin": f"driver_{PLATE_A}"},
    )
    assert res.status_code == 403
    assert geomod.list_pending() == []


def test_scoped_driver_own_plate_201(demo_client) -> None:
    res = demo_client.post(
        "/driver/restriction-feedback",
        json=PAYLOAD_A,
        headers={"X-Driver-Pin": f"driver_{PLATE_A}"},
    )
    assert res.status_code == 201
    assert res.json()["status"] == "pending_review"


def test_unverified_does_not_alter_check_truck_ban(demo_client) -> None:
    before_rules = list(geomod.ACTIVE_RULES)
    before = geomod.check_truck_ban("10:00", "12:00", vehicle_class="xe_tai_nho")
    assert before.is_restricted is False
    res = demo_client.post(
        "/driver/restriction-feedback",
        json=PAYLOAD_A,
        headers={"X-Driver-Pin": "0000"},
    )
    assert res.status_code == 201
    after = geomod.check_truck_ban("10:00", "12:00", vehicle_class="xe_tai_nho")
    assert after.is_restricted is False
    assert before_rules == geomod.ACTIVE_RULES


def test_verify_queue_transition() -> None:
    entry = geomod.submit_feedback(
        driver_id="driver_demo_global",
        plate=PLATE_A,
        lat=10.776,
        lng=106.700,
        issue_type="height_barrier",
    )
    assert entry.status == "pending_review"
    assert entry in geomod.list_pending()
    verified = geomod.verify_feedback(entry.id, approved=True)
    assert verified.status == "verified"
    assert geomod.list_pending() == []

    entry2 = geomod.submit_feedback(
        driver_id="driver_demo_global",
        plate=PLATE_B,
        lat=10.777,
        lng=106.701,
        issue_type="weight_limit",
    )
    rejected = geomod.verify_feedback(entry2.id, approved=False)
    assert rejected.status == "rejected"
    assert geomod.list_pending() == []


def test_verify_unknown_id_raises() -> None:
    with pytest.raises(ValueError):
        geomod.verify_feedback("no-such-id", approved=True)


MANAGER = {"Authorization": "Bearer DEMO"}
SCOPED_A = {"X-Driver-Pin": f"driver_{PLATE_A}"}
GLOBAL_PIN = {"X-Driver-Pin": "0000"}


def _submit(demo_client) -> str:
    geomod.clear_feedback_queue()
    res = demo_client.post("/driver/restriction-feedback", json=PAYLOAD_A, headers=GLOBAL_PIN)
    assert res.status_code == 201
    return res.json()["id"]


def test_admin_lists_pending(demo_client) -> None:
    fid = _submit(demo_client)
    res = demo_client.get("/driver/restriction-feedback/pending", headers=MANAGER)
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 1
    assert body[0]["id"] == fid
    assert body[0]["plate"] == PLATE_A
    assert body[0]["status"] == "pending_review"
    assert body[0]["issue_type"] == "road_closed"


def test_admin_verify_flow_empties_queue(demo_client) -> None:
    before_rules = list(geomod.ACTIVE_RULES)
    fid = _submit(demo_client)
    res = demo_client.post(
        f"/driver/restriction-feedback/{fid}/verify",
        json={"approved": True},
        headers=MANAGER,
    )
    assert res.status_code == 200
    assert res.json() == {"id": fid, "status": "verified"}
    assert geomod.list_pending() == []
    assert before_rules == geomod.ACTIVE_RULES


def test_admin_endpoints_reject_scoped_driver(demo_client) -> None:
    _submit(demo_client)
    res = demo_client.get("/driver/restriction-feedback/pending", headers=SCOPED_A)
    assert res.status_code == 403
    res = demo_client.post(
        "/driver/restriction-feedback/no-id/verify",
        json={"approved": True},
        headers=SCOPED_A,
    )
    assert res.status_code == 403


def test_admin_verify_unknown_id_404(demo_client) -> None:
    res = demo_client.post(
        "/driver/restriction-feedback/no-such-id/verify",
        json={"approved": False},
        headers=MANAGER,
    )
    assert res.status_code == 404
    assert res.json() == {"detail": "unknown_feedback_id"}
