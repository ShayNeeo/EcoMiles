"""Request-body ceiling: reject oversized bodies before they are read or spooled.

Starlette parses (and spools) a multipart body to ``$TMPDIR`` *before* any
dependency runs — ``require_dispatcher`` included — and no reverse proxy is
configured in-repo, so an unauthenticated oversized upload could fill the disk
before auth ever answered. This middleware is the app-level defence in depth:

* a declared ``Content-Length`` above the ceiling is answered with **413**
  before a single byte of the body is read;
* a body that lies (chunked, or under-declared) is cut off at the ceiling while
  it streams: the count is taken as the app pulls bytes, so the spool never
  grows past the ceiling, and the app's own answer to that truncated body is
  replaced by the same **413** (one contract, not one status per code path).

``ECOMILES_MAX_REQUEST_BYTES`` overrides the ceiling, read per request; invalid
or non-positive values fall back to the default with a warning. Default is
64 MB = **2 ×** the 32 MB import cap
(:data:`greenlogix_api.ingest_xlsx.DEFAULT_MAX_UPLOAD_BYTES`) — headroom for
multipart framing so the legitimate 32 MB import keeps working, while still
bounding any single request; the 5 MB photo upload sits far below it.
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Awaitable, Callable, Iterable
from typing import Any

log = logging.getLogger("greenlogix")

DEFAULT_MAX_REQUEST_BYTES = 67_108_864  # 64 MB

# No body to guard: GET/HEAD per RFC, OPTIONS is the CORS preflight.
_BODYLESS_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})

Receive = Callable[[], Awaitable[dict[str, Any]]]
Send = Callable[[dict[str, Any]], Awaitable[None]]
ASGIApp = Callable[[dict[str, Any], Receive, Send], Awaitable[None]]

_TRUNCATED = {"type": "http.request", "body": b"", "more_body": False}


def max_request_bytes() -> int:
    """Ceiling in bytes; env-overridable, read on every call."""
    raw = os.environ.get("ECOMILES_MAX_REQUEST_BYTES")
    if raw is None:
        return DEFAULT_MAX_REQUEST_BYTES
    try:
        value = int(raw)
    except ValueError:
        value = 0
    if value <= 0:
        log.warning("ignoring ECOMILES_MAX_REQUEST_BYTES=%r, not a positive integer", raw)
        return DEFAULT_MAX_REQUEST_BYTES
    return value


def declared_length(headers: Iterable[tuple[bytes, bytes]]) -> int | None:
    """``Content-Length`` as an int, or None when absent/unparseable."""
    for name, value in headers:
        if name.lower() == b"content-length":
            try:
                return int(value)
            except ValueError:
                return None
    return None


async def _reject(send: Send, limit: int) -> None:
    """Hand-built 413: raised here, outside the app's exception middleware."""
    body = json.dumps({"detail": f"request body exceeds {limit} bytes"}).encode("utf-8")
    await send(
        {
            "type": "http.response.start",
            "status": 413,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode("ascii")),
            ],
        }
    )
    await send({"type": "http.response.body", "body": body})


class MaxRequestBodyMiddleware:
    """Pure-ASGI body ceiling — never buffers, never reads the body early."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method", "GET") in _BODYLESS_METHODS:
            await self.app(scope, receive, send)
            return

        limit = max_request_bytes()
        declared = declared_length(scope.get("headers") or ())
        if declared is not None and declared > limit:
            log.info(
                "request rejected: declared body=%s > limit=%s path=%s",
                declared,
                limit,
                scope.get("path"),
            )
            await _reject(send, limit)
            return

        seen = 0
        cut = False
        answered = False

        async def _receive() -> dict[str, Any]:
            nonlocal seen, cut
            if cut:  # the rest of an oversized body is never delivered
                return _TRUNCATED
            message = await receive()
            if message["type"] == "http.request":
                seen += len(message.get("body") or b"")
                if seen > limit:
                    log.warning(
                        "request body cut off above limit=%s path=%s", limit, scope.get("path")
                    )
                    cut = True
                    return _TRUNCATED
            return message

        async def _send(message: dict[str, Any]) -> None:
            nonlocal answered
            if not cut:
                await send(message)
                return
            if answered:  # the app's own answer to the truncated body is dropped
                return
            if message["type"] == "http.response.start":
                answered = True
                await _reject(send, limit)

        await self.app(scope, _receive, _send)
