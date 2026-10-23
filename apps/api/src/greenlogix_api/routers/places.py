"""Places autocomplete + detail over the verified GOFA contract (CR-20260924-001).

Real contract (verified 2026-09-24 against live API):
``GET /places/autocomplete?q=`` proxies GOFA ``/v5/Place/AutoComplete``;
``GET /places/detail/{place_id}`` proxies GOFA ``/v5/Place/Detail``.
Backend-only credential: the GOFA key is read from env server-side
(``GOFA_API_KEY`` in gitignored ``apps/api/.env``) — NEVER exposed to
browsers, logs, or responses.

Quota discipline (plan §5.4): min 3 chars (422 below), no live call
without a key (503 honest), upstream failure (502, no key leak), detail
only on explicit select. Never returns fake suggestions.
"""

from __future__ import annotations

import asyncio
import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from greenlogix_api.auth import require_dispatcher
from greenlogix_api.places.base import PlaceDetail
from greenlogix_api.places.gofa import GOFA_MIN_QUERY_CHARS, GofaPlaceProvider

log = logging.getLogger("greenlogix")

router = APIRouter(tags=["places"])


class SuggestionOut(BaseModel):
    place_id: str
    description: str
    main_text: str
    secondary_text: str = ""
    provider: str = "gofa"


class DetailOut(BaseModel):
    place_id: str
    formatted_address: str
    lat: float
    lng: float
    provider: str = "gofa"
    province: str | None = None
    district: str | None = None
    ward: str | None = None
    confidence: float = 1.0


_provider_instance: GofaPlaceProvider | None = None


def get_places_provider() -> GofaPlaceProvider:
    """Process-level cached provider dependency so in-memory caches persist across HTTP requests."""
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = GofaPlaceProvider()
    return _provider_instance


def reset_places_provider() -> None:
    """Reset the process-level provider singleton (for test isolation)."""
    global _provider_instance
    _provider_instance = None


def _provider() -> GofaPlaceProvider:
    return get_places_provider()


def _detail_out(detail: PlaceDetail) -> DetailOut:
    return DetailOut(
        place_id=detail.place_id,
        formatted_address=detail.formatted_address,
        lat=detail.point.lat,
        lng=detail.point.lng,
        provider=detail.provider,
        province=detail.province,
        district=detail.district,
        ward=detail.ward,
        confidence=detail.confidence,
    )


@router.get("/places/autocomplete", response_model=list[SuggestionOut])
def places_autocomplete(
    q: str = Query(default="", description="Free-text place query (min 3 chars)."),
    _: None = Depends(require_dispatcher),
) -> list[SuggestionOut]:
    """Autocomplete via GOFA (or mock fallback when no key configured)."""
    query = (q or "").strip()
    if len(query) < GOFA_MIN_QUERY_CHARS:
        raise HTTPException(
            status_code=422,
            detail=f"query too short: min {GOFA_MIN_QUERY_CHARS} chars",
        )
    provider = _provider()
    if not provider.api_key:
        if (
            os.getenv("GOFA_ALLOW_FALLBACK", "0") == "1"
            and provider.fallback is not None
        ):
            log.info("path=/places/autocomplete fallback q=%s", query[:32])
        else:
            raise HTTPException(
                status_code=503,
                detail="places service unconfigured: GOFA_API_KEY missing",
            )
    try:
        suggestions = asyncio.run(provider.autocomplete(query))
    except Exception:
        log.warning("path=/places/autocomplete upstream failure", exc_info=True)
        raise HTTPException(
            status_code=502, detail="Upstream places provider error"
        ) from None
    return [
        SuggestionOut(
            place_id=s.place_id,
            description=s.description,
            main_text=s.main_text,
            secondary_text=s.secondary_text,
            provider=s.provider,
        )
        for s in suggestions
    ]


@router.get("/places/detail/{place_id}", response_model=DetailOut)
def places_detail(
    place_id: str,
    _: None = Depends(require_dispatcher),
) -> DetailOut:
    """Place detail via GOFA (or mock fallback when no key configured)."""
    pid = (place_id or "").strip()
    if not pid:
        raise HTTPException(status_code=404, detail="not_found")
    provider = _provider()
    if not provider.api_key:
        if (
            os.getenv("GOFA_ALLOW_FALLBACK", "0") == "1"
            and provider.fallback is not None
        ):
            log.info("path=/places/detail fallback pid=%s", pid[:32])
        else:
            raise HTTPException(
                status_code=503,
                detail="places service unconfigured: GOFA_API_KEY missing",
            )
    try:
        detail = asyncio.run(provider.detail(pid))
    except Exception:
        log.warning("path=/places/detail upstream failure", exc_info=True)
        raise HTTPException(
            status_code=502, detail="Upstream places provider error"
        ) from None
    if detail is None:
        raise HTTPException(status_code=404, detail="not_found")
    return _detail_out(detail)
