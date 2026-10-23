"""PATCH/DELETE /orders/{id} (ORD-03) and POD photo (DRV-04)."""

from __future__ import annotations

from pathlib import Path
from uuid import UUID

from sqlmodel import Session

from greenlogix_api import db as dbmod
from greenlogix_api.models import Order
from greenlogix_api.routers.driver import MAX_PHOTO_BYTES

AUTH = {"Authorization": "Bearer DEMO"}
PIN = {"X-Driver-Pin": "0000"}

JPEG = bytes(
    [
        0xFF,
        0xD8,
        0xFF,
        0xE0,
        0x00,
        0x10,
        0x4A,
        0x46,
        0x49,
        0x46,
        0x00,
        0x01,
        0x01,
        0x00,
        0x00,
        0x01,
        0x00,
        0x01,
        0x00,
        0x00,
        0xFF,
        0xD9,
    ]
)


def _one_order() -> int:
    with Session(dbmod.engine) as session:
        row = Order(
            address="Q1 edit me",
            lat=10.776,
            lng=106.700,
            kg=5,
            excel_row=2,
            window_start="08:00",
            window_end="11:00",
            notes="n",
        )
        session.add(row)
        session.commit()
        session.refresh(row)
        assert row.id is not None
        return row.id


def _seed_optimize(demo_client) -> None:
    seeded = demo_client.post("/seed", headers=AUTH)
    assert seeded.status_code == 200
    optimized = demo_client.post(
        "/optimize",
        headers=AUTH,
        json={"cluster_radius_km": 3.0},
    )
    assert optimized.status_code == 200


def test_patch_then_get_updates_kg(demo_client) -> None:
    oid = _one_order()
    patched = demo_client.patch(
        f"/orders/{oid}",
        headers=AUTH,
        json={"kg": 12},
    )
    assert patched.status_code == 200
    assert patched.json()["kg"] == 12
    listed = demo_client.get("/orders", headers=AUTH)
    assert listed.status_code == 200
    match = next(o for o in listed.json() if o["id"] == oid)
    assert match["kg"] == 12
    got = demo_client.get(f"/orders/{oid}", headers=AUTH)
    assert got.status_code == 200
    assert got.json()["kg"] == 12


def test_delete_then_get_404(demo_client) -> None:
    oid = _one_order()
    deleted = demo_client.delete(f"/orders/{oid}", headers=AUTH)
    assert deleted.status_code == 200
    got = demo_client.get(f"/orders/{oid}", headers=AUTH)
    assert got.status_code == 404


def test_patch_and_delete_assigned_published_order_409(demo_client) -> None:
    _seed_optimize(demo_client)
    published = demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    assert published.status_code == 200
    routes = demo_client.get("/routes", headers=AUTH).json()
    order_id = next(
        s["order_id"]
        for r in routes
        for s in r["stops"]
        if s.get("kind") == "stop" and s.get("order_id") is not None
    )
    patched = demo_client.patch(
        f"/orders/{order_id}",
        headers=AUTH,
        json={"kg": 12},
    )
    assert patched.status_code == 409
    deleted = demo_client.delete(f"/orders/{order_id}", headers=AUTH)
    assert deleted.status_code == 409


def test_patch_delete_require_bearer(demo_client) -> None:
    oid = _one_order()
    assert demo_client.patch(f"/orders/{oid}", json={"kg": 12}).status_code == 401
    assert demo_client.delete(f"/orders/{oid}").status_code == 401


def test_photo_unpublished_404(demo_client) -> None:
    _seed_optimize(demo_client)
    routes = demo_client.get("/routes", headers=AUTH).json()
    stop = next(s for r in routes for s in r["stops"] if s.get("kind") == "stop")
    res = demo_client.post(
        f"/stops/{stop['id']}/photo",
        headers=PIN,
        files={"photo": ("pod.jpg", JPEG, "image/jpeg")},
    )
    assert res.status_code == 404


def test_photo_stores_uuid_under_uploads(demo_client, tmp_path, monkeypatch) -> None:
    uploads = tmp_path / "uploads"
    uploads.mkdir()
    monkeypatch.setattr(dbmod, "UPLOADS_DIR", uploads)
    _seed_optimize(demo_client)
    demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    routes = demo_client.get("/routes", headers=AUTH).json()
    stop = next(s for r in routes for s in r["stops"] if s.get("kind") == "stop")
    res = demo_client.post(
        f"/stops/{stop['id']}/photo",
        headers=PIN,
        files={"photo": ("../../evil.jpg", JPEG, "image/jpeg")},
    )
    assert res.status_code == 200
    files = list(uploads.iterdir())
    assert len(files) == 1
    name = files[0].name
    stem, suffix = Path(name).stem, Path(name).suffix.lower()
    UUID(stem)
    assert suffix in {".jpg", ".jpeg", ".png"}
    assert "evil" not in name


def test_photo_rejects_non_image(demo_client) -> None:
    _seed_optimize(demo_client)
    demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    routes = demo_client.get("/routes", headers=AUTH).json()
    stop = next(s for r in routes for s in r["stops"] if s.get("kind") == "stop")
    res = demo_client.post(
        f"/stops/{stop['id']}/photo",
        headers=PIN,
        files={"photo": ("notes.txt", b"not an image", "text/plain")},
    )
    assert res.status_code == 400


def test_photo_rejects_oversize_before_storing(demo_client, tmp_path, monkeypatch) -> None:
    """F2: the POD cap is checked before the body is pulled into RAM/disk."""
    uploads = tmp_path / "uploads"
    uploads.mkdir()
    monkeypatch.setattr(dbmod, "UPLOADS_DIR", uploads)
    _seed_optimize(demo_client)
    demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []})
    routes = demo_client.get("/routes", headers=AUTH).json()
    stop = next(s for r in routes for s in r["stops"] if s.get("kind") == "stop")
    oversize = JPEG + b"\x00" * MAX_PHOTO_BYTES
    res = demo_client.post(
        f"/stops/{stop['id']}/photo",
        headers=PIN,
        files={"photo": ("pod.jpg", oversize, "image/jpeg")},
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "invalid_image"
    assert list(uploads.iterdir()) == []
