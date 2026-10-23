"""F2: request-body ceiling — 413 before the body is read, legit uploads intact.

``MaxRequestBodyMiddleware`` has to reject an oversized upload *before* Starlette
spools it to ``$TMPDIR`` and before ``require_dispatcher`` runs, yet must not
disturb GET/HEAD, the OpenAPI schema route, the 32 MB import or the 5 MB photo
upload. The raw-ASGI tests drive the real app so the "body never read" claim is
observed (receive-call counter), not assumed.
"""

from __future__ import annotations

import asyncio
import json
from io import BytesIO

from openpyxl import Workbook

from greenlogix_api.http_limits import DEFAULT_MAX_REQUEST_BYTES, max_request_bytes
from greenlogix_api.ingest_xlsx import DEFAULT_MAX_UPLOAD_BYTES
from greenlogix_api.main import app
from greenlogix_api.routers.driver import MAX_PHOTO_BYTES

AUTH = {"Authorization": "Bearer DEMO"}
PIN = {"X-Driver-Pin": "0000"}
XLSX_CT = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

JPEG_HEAD = bytes(
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
    ]
)


def _xlsx(rows: list[list[object]]) -> bytes:
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.append(
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
        ]
    )
    for row in rows:
        ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _asgi(
    headers: list[tuple[bytes, bytes]],
    chunks: list[bytes] | None = None,
    *,
    path: str = "/orders/import",
    method: str = "POST",
) -> tuple[list[dict], int]:
    """Drive the real app; returns (sent messages, receive call count)."""
    inbox: list[dict] = [
        {"type": "http.request", "body": chunk, "more_body": True}
        for chunk in (chunks or [b""])
    ]
    inbox[-1]["more_body"] = False
    if not (chunks or []):  # no body declared: keep a single terminal message
        inbox[-1]["more_body"] = False
    sent: list[dict] = []
    calls = 0

    async def receive() -> dict:
        nonlocal calls
        calls += 1
        if inbox:
            return inbox.pop(0)
        return {"type": "http.disconnect"}

    async def send(message: dict) -> None:
        sent.append(message)

    scope = {
        "type": "http",
        "asgi": {"version": "3.0", "spec_version": "2.3"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": b"",
        "root_path": "",
        "headers": headers,
        "client": ("test", 1234),
        "server": ("test", 80),
    }
    asyncio.run(app(scope, receive, send))
    return sent, calls


def _status(sent: list[dict]) -> int:
    return next(m["status"] for m in sent if m["type"] == "http.response.start")


def _body(sent: list[dict]) -> bytes:
    return b"".join(m.get("body") or b"" for m in sent if m["type"] == "http.response.body")


def _seed_optimize(client) -> None:
    assert client.post("/seed", headers=AUTH).status_code == 200
    assert client.post("/optimize", headers=AUTH, json={"cluster_radius_km": 3.0}).status_code == 200


def test_declared_oversized_content_length_is_413_without_reading_the_body() -> None:
    oversize = DEFAULT_MAX_REQUEST_BYTES + 1
    sent, receive_calls = _asgi(
        [
            (b"content-length", str(oversize).encode()),
            (b"authorization", b"Bearer DEMO"),
        ]
    )
    assert _status(sent) == 413
    assert receive_calls == 0, "the body must not be read at all — no spool, no tmp file"
    assert str(DEFAULT_MAX_REQUEST_BYTES) in json.loads(_body(sent))["detail"]


def test_unauthenticated_oversized_request_is_rejected_before_auth() -> None:
    # The disk is protected even though no credential was presented: the
    # ceiling sits above require_dispatcher, hence the 413 (not a 401).
    sent, _ = _asgi([(b"content-length", str(DEFAULT_MAX_REQUEST_BYTES + 1).encode())])
    assert _status(sent) == 413


def test_streamed_body_over_ceiling_is_cut_off(monkeypatch) -> None:
    # Chunked/under-declared bodies bypass the header check, so the stream is
    # counted instead: no Content-Length header here. The multipart prefix keeps
    # the parser reading, so the over-limit second chunk is what stops it.
    monkeypatch.setenv("ECOMILES_MAX_REQUEST_BYTES", "1000")
    boundary = b"X" * 24
    prefix = (
        b"--"
        + boundary
        + b'\r\nContent-Disposition: form-data; name="file"; filename="big.xlsx"\r\n'
        + b"Content-Type: application/octet-stream\r\n\r\n"
    )
    sent, receive_calls = _asgi(
        [
            (b"authorization", b"Bearer DEMO"),
            (b"content-type", b"multipart/form-data; boundary=" + boundary),
        ],
        [prefix + b"z" * 800, b"z" * 800],
    )
    assert _status(sent) == 413
    assert receive_calls == 2


def test_body_within_ceiling_is_not_short_circuited(monkeypatch) -> None:
    # Guard against a ceiling that rejects everything: with the limit raised,
    # the same request reaches the router (401 = auth, not 413).
    monkeypatch.setenv("ECOMILES_MAX_REQUEST_BYTES", str(10 * 1024 * 1024))
    sent, _ = _asgi([], [b"x" * 500])
    assert _status(sent) == 401


def test_invalid_env_value_falls_back_to_the_default(monkeypatch) -> None:
    monkeypatch.setenv("ECOMILES_MAX_REQUEST_BYTES", "not-a-number")
    assert max_request_bytes() == DEFAULT_MAX_REQUEST_BYTES
    monkeypatch.setenv("ECOMILES_MAX_REQUEST_BYTES", "0")
    assert max_request_bytes() == DEFAULT_MAX_REQUEST_BYTES
    monkeypatch.delenv("ECOMILES_MAX_REQUEST_BYTES")
    assert max_request_bytes() == DEFAULT_MAX_REQUEST_BYTES


def test_ceiling_leaves_room_for_the_import_and_photo_caps() -> None:
    assert DEFAULT_MAX_REQUEST_BYTES >= 2 * DEFAULT_MAX_UPLOAD_BYTES
    assert DEFAULT_MAX_REQUEST_BYTES > MAX_PHOTO_BYTES


def test_normal_import_still_succeeds(demo_client) -> None:
    res = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={
            "file": (
                "orders.xlsx",
                _xlsx([["Q1 stop 01", 10.776, 106.700, "KH 01", "0900000001", 10, "08:00", "10:00", "thuong", ""]]),
                XLSX_CT,
            )
        },
    )
    assert res.status_code == 200
    assert res.json()["imported"] == 1


def test_env_ceiling_below_the_import_body_is_413(demo_client, monkeypatch) -> None:
    monkeypatch.setenv("ECOMILES_MAX_REQUEST_BYTES", "64")
    res = demo_client.post(
        "/orders/import",
        headers=AUTH,
        files={"file": ("orders.xlsx", _xlsx([]), XLSX_CT)},
    )
    assert res.status_code == 413


def test_photo_upload_under_the_ceiling_succeeds(demo_client, tmp_path, monkeypatch) -> None:
    from greenlogix_api import db as dbmod

    uploads = tmp_path / "uploads"
    uploads.mkdir()
    monkeypatch.setattr(dbmod, "UPLOADS_DIR", uploads)
    _seed_optimize(demo_client)
    assert demo_client.post("/routes/publish", headers=AUTH, json={"route_ids": []}).status_code == 200
    routes = demo_client.get("/routes", headers=AUTH).json()
    stop = next(s for r in routes for s in r["stops"] if s.get("kind") == "stop")
    photo = JPEG_HEAD + b"\x00" * (4 * 1024 * 1024)  # 4 MB, under the 5 MB cap
    res = demo_client.post(
        f"/stops/{stop['id']}/photo",
        headers=PIN,
        files={"photo": ("pod.jpg", photo, "image/jpeg")},
    )
    assert res.status_code == 200


def test_get_and_head_are_untouched(demo_client) -> None:
    assert demo_client.get("/openapi.json").status_code == 200
    assert demo_client.get("/health", headers=AUTH).status_code == 200
    # FastAPI registers GET routes without HEAD (pre-existing: 405, not 413) —
    # the ceiling must not turn a body-less method into a rejection.
    assert demo_client.head("/health", headers=AUTH).status_code == 405
