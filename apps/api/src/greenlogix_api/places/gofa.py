"""GOFA Places integration adapter with quota management and in-memory caching.

Real contract (verified 2026-09-24 against live API — probes against
``https://places-api.gofa.vn`` with the sponsored key):

- Base URL: ``https://places-api.gofa.vn`` (env ``GOFA_BASE_URL`` override).
- Auth: request header ``X-API-Key: <key>`` (missing key upstream answers
  ``{"error":"missing_api_key"}``). Key lives in ``apps/api/.env``
  (gitignored) server-side only — NEVER in browser bundles, logs, or git.
- AutoComplete: ``GET /v5/Place/AutoComplete?input=<text>`` answers
  ``{"predictions":[{"place_id","description","structured_formatting":
  {"main_text","secondary_text"},"compound":{...},...}]}``.
- Detail: ``GET /v5/Place/Detail?place_id=<id>`` answers
  ``{"result":{"place_id","formatted_address","geometry":{"location":
  {"lat","lng"}},"compound":{"province","district","commune"},"name",...},
  "status":"OK"}``. Ward maps from ``compound.commune``; ``status != OK``
  means no usable result.
- Quota: ``GET /Account/Quota`` answers
  ``{quota:{limit:15000,endpoints:[{code:"autocomplete",limit:10000,...},
  {code:"detail",limit:5000,...}]}}`` (live counting confirmed).

Quota discipline (plan §5.4): min 3 chars before any live call, short-TTL
caches (autocomplete 5 min, detail 1 h), detail only on explicit select,
warn-only local counters against ``GOFA_QUOTA_AUTOCOMPLETE`` /
``GOFA_QUOTA_DETAIL`` env knobs. Falls back to MockPlaceProvider when no
key is configured (offline/demo) — never fake live suggestions.
"""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any

from greenlogix_api.places.base import (
    GeoPoint,
    PlaceDetail,
    PlaceProvider,
    PlaceSuggestion,
)
from greenlogix_api.places.mock import MockPlaceProvider

logger = logging.getLogger(__name__)

GOFA_DEFAULT_BASE_URL = "https://places-api.gofa.vn"
GOFA_AUTOCOMPLETE_PATH = "/v5/Place/AutoComplete"
GOFA_DETAIL_PATH = "/v5/Place/Detail"
GOFA_MIN_QUERY_CHARS = 3
DEFAULT_AUTOCOMPLETE_TTL_SECONDS = 300  # 5 min (quota-safe, plan §5.4)
DEFAULT_CACHE_TTL_SECONDS = 3600  # 1 hour (detail cache)

# Sync transport: (url, headers, timeout) -> (status_code, parsed_json).
Transport = Callable[[str, dict[str, str], float], tuple[int, Any]]


def _urllib_transport(
    url: str, headers: dict[str, str], timeout: float
) -> tuple[int, Any]:
    """Default sync transport over urllib (stdlib only)."""
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return int(resp.status), json.loads(resp.read().decode("utf-8"))


_FALLBACK_DEFAULT = object()


class GofaPlaceProvider(PlaceProvider):
    """Adapter for GOFA Places AutoComplete and Place Detail API (real contract).

    Adheres strictly to the sponsored monthly quota (15k total calls:
    10k autocomplete + 5k detail). Falls back gracefully to
    MockPlaceProvider when running offline or when no API key is provided.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        *,
        fallback: PlaceProvider | None | object = _FALLBACK_DEFAULT,
        timeout_seconds: float = 3.0,
        transport: Transport | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.getenv("GOFA_API_KEY", "")
        self.base_url = (
            base_url or os.getenv("GOFA_BASE_URL", GOFA_DEFAULT_BASE_URL)
        ).rstrip("/")
        if fallback is _FALLBACK_DEFAULT:
            self.fallback: PlaceProvider | None = MockPlaceProvider()
        else:
            self.fallback = fallback  # type: ignore[assignment]
        self.timeout_seconds = timeout_seconds
        # Injectable sync transport for tests: tests pass a fake so no live
        # network happens in CI; production uses _urllib_transport.
        self.transport: Transport = transport or _urllib_transport

        # Quota usage tracking (warn-only local counters; the server-side
        # truth is GET /Account/Quota — this client never claims authority).
        self.quota_autocomplete = int(os.getenv("GOFA_QUOTA_AUTOCOMPLETE", "10000"))
        self.quota_detail = int(os.getenv("GOFA_QUOTA_DETAIL", "5000"))
        self.autocomplete_calls: int = 0
        self.detail_calls: int = 0

        # Memory caches: key -> (timestamp, data)
        self._autocomplete_cache: dict[str, tuple[float, list[PlaceSuggestion]]] = {}
        self._detail_cache: dict[str, tuple[float, PlaceDetail]] = {}

    def clear_cache(self) -> None:
        """Clear in-memory caches and reset call counters."""
        self._autocomplete_cache.clear()
        self._detail_cache.clear()
        self.autocomplete_calls = 0
        self.detail_calls = 0

    async def autocomplete(
        self,
        query: str,
        *,
        bias: GeoPoint | None = None,
        session_token: str | None = None,
    ) -> list[PlaceSuggestion]:
        query_clean = query.strip()
        if len(query_clean) < GOFA_MIN_QUERY_CHARS:
            return []

        # Check cache
        cache_key = f"{query_clean.lower()}_{bias.lat if bias else ''}_{bias.lng if bias else ''}"
        now = time.time()
        if cache_key in self._autocomplete_cache:
            ts, cached = self._autocomplete_cache[cache_key]
            if now - ts < DEFAULT_AUTOCOMPLETE_TTL_SECONDS:
                return cached

        # If no key, delegate to mock fallback (offline/demo) — never fake live.
        if not self.api_key:
            if self.fallback is not None:
                results = await self.fallback.autocomplete(
                    query, bias=bias, session_token=session_token
                )
                self._autocomplete_cache[cache_key] = (now, results)
                return results
            return []

        # Live call to GOFA Places API (real contract 2026-09-24).
        self.autocomplete_calls += 1
        if self.autocomplete_calls > self.quota_autocomplete:
            logger.warning(
                "GOFA autocomplete calls %d exceeded quota threshold %d",
                self.autocomplete_calls,
                self.quota_autocomplete,
            )
        headers = {"X-API-Key": self.api_key, "Accept": "application/json"}
        params: dict[str, Any] = {"input": query_clean}

        try:
            query_str = urllib.parse.urlencode(params)
            url = f"{self.base_url}{GOFA_AUTOCOMPLETE_PATH}?{query_str}"
            status, data = self.transport(url, headers, self.timeout_seconds)
            if status != 200:
                raise RuntimeError(f"GOFA upstream error status {status}")
            if isinstance(data, dict):
                suggestions: list[PlaceSuggestion] = []
                for item in data.get("predictions", []) or []:
                    if not isinstance(item, dict) or not item.get("place_id"):
                        continue
                    fmt = item.get("structured_formatting", {}) or {}
                    suggestions.append(
                        PlaceSuggestion(
                            place_id=str(item.get("place_id", "")),
                            description=str(item.get("description", "")),
                            main_text=str(
                                fmt.get("main_text", "") or item.get("description", "")
                            ),
                            secondary_text=str(fmt.get("secondary_text", "") or ""),
                            provider="gofa",
                        )
                    )
                self._autocomplete_cache[cache_key] = (now, suggestions)
                return suggestions
            raise RuntimeError("Invalid GOFA response payload: expected JSON dict")
        except Exception as exc:
            logger.warning("GOFA autocomplete upstream error: %s", exc)
            raise

    async def detail(self, place_id: str) -> PlaceDetail | None:
        place_id_clean = place_id.strip()
        if not place_id_clean:
            return None

        # Check cache
        now = time.time()
        if place_id_clean in self._detail_cache:
            ts, cached = self._detail_cache[place_id_clean]
            if now - ts < DEFAULT_CACHE_TTL_SECONDS:
                return cached

        # If no key, delegate to fallback (offline/demo).
        if not self.api_key:
            if self.fallback is not None:
                detail = await self.fallback.detail(place_id_clean)
                if detail:
                    self._detail_cache[place_id_clean] = (now, detail)
                return detail
            return None

        # Live call to GOFA Place Detail API (real contract 2026-09-24).
        self.detail_calls += 1
        if self.detail_calls > self.quota_detail:
            logger.warning(
                "GOFA detail calls %d exceeded quota threshold %d",
                self.detail_calls,
                self.quota_detail,
            )
        headers = {"X-API-Key": self.api_key, "Accept": "application/json"}
        params = {"place_id": place_id_clean}

        try:
            query_str = urllib.parse.urlencode(params)
            url = f"{self.base_url}{GOFA_DETAIL_PATH}?{query_str}"
            status, data = self.transport(url, headers, self.timeout_seconds)
            if status != 200:
                raise RuntimeError(f"GOFA upstream error status {status}")
            if isinstance(data, dict):
                if data.get("status") != "OK":
                    return None
                result = data.get("result", {}) or {}
                if not isinstance(result, dict) or not result:
                    return None
                geom = (result.get("geometry", {}) or {}).get("location", {}) or {}
                compound = result.get("compound", {}) or {}
                detail = PlaceDetail(
                    place_id=str(result.get("place_id", place_id_clean)),
                    formatted_address=str(result.get("formatted_address", "")),
                    point=GeoPoint(
                        lat=float(geom.get("lat", 0.0)), lng=float(geom.get("lng", 0.0))
                    ),
                    provider="gofa",
                    province=compound.get("province"),
                    district=compound.get("district"),
                    ward=compound.get("commune"),
                    confidence=0.99,
                )
                self._detail_cache[place_id_clean] = (now, detail)
                return detail
            raise RuntimeError("Invalid GOFA response payload: expected JSON dict")
        except Exception as exc:
            logger.warning("GOFA detail upstream error: %s", exc)
            raise
