"""PII guard: order phone numbers and addresses never reach a log record (C-06).

Runs the three paths that touch order PII end to end — ``/seed`` (80 synthetic
orders), ``/optimize`` (stops copied into the plan) and ``/orders/import`` (a
canary row whose phone/address are unique strings) — with ``caplog`` capturing
every record from the root logger, then asserts:

* no 10-digit phone starting with ``0`` appears in any rendered record
  (message, formatted args, exception text), and
* no order address string appears either.

The canary makes the guard falsifiable: the phone/address below exist only in
this test, so a failure here means a logger call really is echoing the row.
"""

from __future__ import annotations

import logging
import re
from io import BytesIO

from openpyxl import Workbook

AUTH = {"Authorization": "Bearer DEMO"}

XLSX_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# Canary only in this test — the seeded phones are 09000000NN / "Q1 stop NN".
CANARY_PHONE = "0987654321"
CANARY_ADDRESS = "CANARY-ADDRESS-Q1-42"

SEEDED_PHONE = "0900000001"
SEEDED_ADDRESS = "Q1 stop 01"

PHONE_10 = re.compile(r"\b0\d{9}\b")


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


def _records_text(caplog) -> str:
    chunks: list[str] = []
    for record in caplog.records:
        chunks.append(record.getMessage())
        chunks.append(str(record.args))
        if record.exc_text:
            chunks.append(record.exc_text)
    return "\n".join(chunks)


def test_seed_optimize_import_log_no_order_pii(demo_client, caplog) -> None:
    payload = _xlsx(
        [
            "address",
            "lat",
            "lng",
            "receiver",
            "phone",
            "kg",
            "window_start",
            "window_end",
            "cargo_type",
            "notes",
        ],
        [[CANARY_ADDRESS, 10.776, 106.700, "KH canary", CANARY_PHONE, 10, "08:00", "10:00", "thuong", ""]],
    )

    with caplog.at_level(logging.INFO):
        assert demo_client.post("/seed", headers=AUTH).status_code == 200
        assert demo_client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0}).status_code == 200
        imported = demo_client.post(
            "/orders/import", headers=AUTH, files={"file": ("orders.xlsx", payload, XLSX_CT)}
        )
        assert imported.status_code == 200
        assert imported.json()["imported"] == 1

    assert caplog.records, "no log records captured — the guard would be vacuous"
    text = _records_text(caplog)
    for secret in (CANARY_PHONE, SEEDED_PHONE, CANARY_ADDRESS, SEEDED_ADDRESS):
        assert secret not in text, f"PII {secret!r} leaked into a log record"
    match = PHONE_10.search(text)
    assert match is None, f"phone-shaped value {match.group(0)!r} leaked into a log record"
