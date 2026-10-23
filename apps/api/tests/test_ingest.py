from __future__ import annotations

from datetime import datetime, time
from io import BytesIO

from openpyxl import Workbook

AUTH = {"Authorization": "Bearer DEMO"}

XLSX_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _xlsx(headers: list[str], rows: list[list[object]]) -> bytes:
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def test_non_xlsx_returns_400(demo_client) -> None:
    res = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={"file": ("orders.csv", b"address,lat\n", "text/csv")},
    )
    assert res.status_code == 400


def test_missing_lat_appends_error_and_skips_row(demo_client) -> None:
    payload = _xlsx(
        ["address", "lat", "lng", "receiver", "phone", "kg", "window_start", "window_end", "cargo_type", "notes"],
        [
            ["ok", 10.776, 106.700, "A", "0900000001", 10, "08:00", "10:00", "thuong", ""],
            ["bad", None, 106.700, "B", "0900000002", 10, "08:00", "10:00", "thuong", ""],
        ],
    )
    res = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={"file": ("orders.xlsx", payload, XLSX_CT)},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["imported"] == 1
    assert any(e["field"] == "lat" for e in body["errors"])
    listed = demo_client.get("/orders", headers=AUTH)
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_bilingual_headers_and_time_cells(demo_client) -> None:
    payload = _xlsx(
        ["địa chỉ", "vĩ độ", "kinh độ", "người nhận", "SĐT", "khối lượng", "giờ bắt đầu", "giờ kết thúc", "loại hàng", "ghi chú"],
        [
            [
                "Q1",
                10.776,
                106.700,
                "KH",
                "0900000003",
                12,
                time(8, 30),
                datetime(1899, 12, 30, 11, 0),
                "thuong",
                "ghi",
            ]
        ],
    )
    res = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={"file": ("don.xlsx", payload, XLSX_CT)},
    )
    assert res.status_code == 200
    assert res.json()["imported"] == 1
    order = demo_client.get("/orders", headers=AUTH).json()[0]
    assert order["address"] == "Q1"
    assert order["window_start"] == "08:30"
    assert order["window_end"] == "11:00"
    assert "1899" not in order["window_end"]


def test_reject_over_upload_bytes_and_row_cap(demo_client, monkeypatch) -> None:
    """C-03: the caps stay enforced but are env-overridable (raised defaults)."""
    monkeypatch.setenv("ECOMILES_MAX_UPLOAD_BYTES", "5000000")
    huge = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={"file": ("big.xlsx", b"a" * 5_000_001, XLSX_CT)},
    )
    assert huge.status_code == 400
    monkeypatch.setenv("ECOMILES_MAX_DATA_ROWS", "500")
    rows = [["Q1", 10.776, 106.7, "KH", "0900000004", 5, "08:00", "09:00", "thuong", ""] for _ in range(501)]
    payload = _xlsx(
        ["address", "lat", "lng", "receiver", "phone", "kg", "window_start", "window_end", "cargo_type", "notes"],
        rows,
    )
    many = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={"file": ("many.xlsx", payload, XLSX_CT)},
    )
    assert many.status_code == 400
    assert many.json()["detail"] == "too many rows"


def test_vehicles_get_and_patch_maintenance_unused(demo_client) -> None:
    seeded = demo_client.post("/seed", headers=AUTH)
    assert seeded.status_code == 200
    vehicles = demo_client.get("/vehicles", headers=AUTH)
    assert vehicles.status_code == 200
    rows = vehicles.json()
    assert rows
    sample = rows[0]
    assert "capacity_kg" in sample
    assert "status" in sample
    ready = next(v for v in rows if v["status"] == "ready")
    patched = demo_client.patch(
        f"/vehicles/{ready['id']}",
        headers=AUTH,
        json={"status": "maintenance"},
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "maintenance"
    plan = demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0})
    assert plan.status_code == 200
    plates = {r["plate"] for r in plan.json()["routes"]}
    assert ready["plate"] not in plates


def test_ingest_events_push_api_and_idempotency(demo_client) -> None:
    payload = {
        "dataset_label": "dn-a-erp-sync",
        "orders": [
            {
                "external_id": "DNA-0001",
                "address": "12 Nguyen Hue, Q1",
                "lat": 10.775,
                "lng": 106.703,
                "receiver": "CoopMart Q1",
                "phone": "0901000001",
                "kg": 45.0,
                "window_start": "08:00",
                "window_end": "10:00",
                "cargo_type": "thuong",
                "notes": "",
            },
            {
                "external_id": "DNA-0002",
                "address": "45 Le Loi, Q1",
                "lat": 10.772,
                "lng": 106.701,
                "receiver": "Shop Q1",
                "phone": "0901000002",
                "kg": 15.0,
                "window_start": "09:00",
                "window_end": "11:00",
                "cargo_type": "lanh",
                "notes": "",
            },
            # Duplicate external_id in the same batch
            {
                "external_id": "DNA-0001",
                "address": "12 Nguyen Hue duplicate",
                "lat": 10.775,
                "lng": 106.703,
                "receiver": "CoopMart Q1",
                "phone": "0901000001",
                "kg": 45.0,
                "window_start": "08:00",
                "window_end": "10:00",
                "cargo_type": "thuong",
                "notes": "",
            },
            # Invalid cargo_type
            {
                "external_id": "DNA-0003",
                "address": "Invalid Cargo",
                "lat": 10.775,
                "lng": 106.703,
                "receiver": "Bad",
                "phone": "0901000003",
                "kg": 10.0,
                "window_start": "08:00",
                "window_end": "10:00",
                "cargo_type": "radioactive",
                "notes": "",
            },
        ],
    }
    res = demo_client.post("/ingest/events", headers=AUTH, json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["rows_seen"] == 4
    assert body["rows_imported"] == 2
    assert body["skipped_duplicates"] == 1
    assert body["rows_rejected"] == 1
    assert body["dedupe"] is True
    assert len(body["errors"]) == 1
    assert body["errors"][0]["field"] == "cargo_type"


def test_ingest_events_coordinate_bounds_and_label_length(demo_client) -> None:
    # 1. Out of range lat (> 90.0)
    payload = {
        "dataset_label": "valid-label",
        "orders": [
            {
                "external_id": "DNA-9999",
                "address": "North Pole Beyond",
                "lat": 95.0,
                "lng": 106.703,
                "receiver": "Invalid",
                "phone": "0901000099",
                "kg": 10.0,
                "window_start": "08:00",
                "window_end": "10:00",
                "cargo_type": "thuong",
            }
        ],
    }
    res = demo_client.post("/ingest/events", headers=AUTH, json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["rows_rejected"] == 1
    assert body["errors"][0]["field"] == "lat/lng"

    # 2. Dataset label exceeding 128 chars is 422
    long_payload = {
        "dataset_label": "a" * 129,
        "orders": [],
    }
    res_long = demo_client.post("/ingest/events", headers=AUTH, json=long_payload)
    assert res_long.status_code == 422
