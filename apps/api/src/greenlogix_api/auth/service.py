"""Authentication service and token/PIN verification.

PROD GATE (T-LOOP-AUTH): global PIN ``0000``, ``driver_<plate>`` PINs, and
``Bearer DEMO`` are demo-only. They are accepted ONLY when
``GREENLOGIX_DEMO=1``; any other value (including unset) returns 401.
No routing changes; no frozen-path changes.

PIN lockout (C-01, enforced): failed ``X-Driver-Pin`` attempts are counted
in-memory per client IP + PIN within ``PIN_LOCKOUT_SECONDS``; once
``MAX_PIN_ATTEMPTS`` is reached the key returns 429 until the window
expires. Successful authentications are never counted, so the demo-OK path
is unaffected. Production must replace the dict with a shared store
(e.g. Redis); the fail-closed DEMO gate above stays authoritative.
"""

from __future__ import annotations

import os
import re
import time

from fastapi import Header, HTTPException, Request

from greenlogix_api.auth.models import AuthContext, UserRole

_BEARER_DEMO = re.compile(r"^bearer\s+demo$", re.IGNORECASE)
_DRIVER_PIN_PATTERN = re.compile(r"^driver_([a-zA-Z0-9_\-.]+)$")

# Rate-limit / lockout (C-01, enforced in-memory demo).
# Production must use a shared store (e.g. Redis) keyed by client IP + PIN.
# Only FAILED X-Driver-Pin attempts are counted; successes never count,
# so the demo-OK path is unaffected. Bearer DEMO path bypasses lockout.
MAX_PIN_ATTEMPTS = 20
PIN_LOCKOUT_SECONDS = 300
_PIN_ATTEMPTS: dict[str, list[float]] = {}


def _client_ip(request: Request | None) -> str:
    try:
        if request is not None and request.client is not None:
            return request.client.host or "unknown"
    except Exception:  # noqa: S110
        pass
    return "unknown"


def _lockout_key(request: Request | None, pin: str) -> str:
    return f"{_client_ip(request)}|{pin}"


def _pin_lockout_active(key: str) -> bool:
    """Report whether *key* is currently locked out.

    Prunes attempts older than ``PIN_LOCKOUT_SECONDS``; locked when
    ``MAX_PIN_ATTEMPTS`` or more failures remain in the window. Callers
    must keep the fail-closed DEMO gate as the authoritative check.
    """
    attempts = _PIN_ATTEMPTS.get(key, [])
    now = time.monotonic()
    recent = [t for t in attempts if now - t < PIN_LOCKOUT_SECONDS]
    _PIN_ATTEMPTS[key] = recent
    return len(recent) >= MAX_PIN_ATTEMPTS


def _record_pin_attempt(key: str) -> None:
    """Record one FAILED PIN attempt for lockout accounting."""
    _PIN_ATTEMPTS.setdefault(key, []).append(time.monotonic())


def resolve_auth_context(
    request: Request,
    authorization: str | None = Header(default=None, include_in_schema=False),
    x_driver_pin: str | None = Header(default=None, alias="X-Driver-Pin"),
) -> AuthContext:
    """Resolve caller identity and role from headers or query token."""
    if os.environ.get("GREENLOGIX_DEMO") != "1":
        raise HTTPException(status_code=401, detail="unauthorized")

    auth = (authorization or "").strip()
    query_token = request.query_params.get("token")

    # Manager / Dispatcher check
    if _BEARER_DEMO.match(auth) or query_token == "DEMO":
        return AuthContext(
            user_id="user_manager_demo",
            role=UserRole.MANAGER,
            organization_id="org_demo",
        )

    # Scoped Driver check
    if x_driver_pin:
        pin = x_driver_pin.strip()
        if pin == "0000":
            # Global demo driver (valid PIN: never counted toward lockout)
            return AuthContext(
                user_id="driver_demo_global",
                role=UserRole.DRIVER,
                organization_id="org_demo",
                assigned_plate=None,
            )
        # Format driver_<plate_safe> e.g. driver_51C01
        m = _DRIVER_PIN_PATTERN.match(pin)
        if m:
            plate_sub = m.group(1).upper()
            return AuthContext(
                user_id=f"driver_{plate_sub}",
                role=UserRole.DRIVER,
                organization_id="org_demo",
                assigned_plate=plate_sub,
            )
        # Unknown PIN format: enforce per-IP+PIN lockout before the 401.
        key = _lockout_key(request, pin)
        if _pin_lockout_active(key):
            raise HTTPException(
                status_code=429, detail="pin_locked_out: too many failed attempts"
            )
        _record_pin_attempt(key)
        if _pin_lockout_active(key):
            raise HTTPException(
                status_code=429, detail="pin_locked_out: too many failed attempts"
            )

    raise HTTPException(status_code=401, detail="unauthorized")
