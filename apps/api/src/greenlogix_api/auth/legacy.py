"""Legacy demo auth gated by GREENLOGIX_DEMO=1 (D-19).

PROD GATE (T-LOOP-AUTH): ``require_dispatcher`` / ``require_driver`` return
401 unless GREENLOGIX_DEMO=1. Global PIN ``0000`` never authenticates in
prod. Rate-limit/lockout (C-01) is enforced in
:mod:`greenlogix_api.auth.service` on the ``X-Driver-Pin`` failure path
(per client IP + PIN, failures only, 429 when ``MAX_PIN_ATTEMPTS``
exceeded within ``PIN_LOCKOUT_SECONDS``); this legacy module has no
``Request`` object so it keeps no separate counter and stays fail-closed.
"""

from __future__ import annotations

import os
import re

from fastapi import Header, HTTPException, Request

_DEMO_BEARER = re.compile(r"^bearer\s+demo$", re.IGNORECASE)
_DEMO_PIN = "0000"


def demo_enabled() -> bool:
    return os.environ.get("GREENLOGIX_DEMO") == "1"


def require_dispatcher(
    request: Request,
    authorization: str | None = Header(default=None),
) -> None:
    if not demo_enabled():
        raise HTTPException(status_code=401, detail="unauthorized")
    auth = (authorization or "").strip()
    if _DEMO_BEARER.match(auth) or request.query_params.get("token") == "DEMO":
        return
    raise HTTPException(status_code=401, detail="unauthorized")


def require_driver(
    x_driver_pin: str | None = Header(default=None, alias="X-Driver-Pin"),
) -> None:
    if not demo_enabled() or x_driver_pin != _DEMO_PIN:
        raise HTTPException(status_code=401, detail="unauthorized")
