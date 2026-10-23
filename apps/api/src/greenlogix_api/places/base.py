"""Place provider protocol and data structures for Vietnam place resolution."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(frozen=True)
class GeoPoint:
    lat: float
    lng: float


@dataclass(frozen=True)
class PlaceSuggestion:
    place_id: str
    description: str
    main_text: str
    secondary_text: str = ""
    provider: str = "gofa"


@dataclass(frozen=True)
class PlaceDetail:
    place_id: str
    formatted_address: str
    point: GeoPoint
    provider: str = "gofa"
    province: str | None = None
    district: str | None = None
    ward: str | None = None
    postal_code: str | None = None
    confidence: float = 1.0


@runtime_checkable
class PlaceProvider(Protocol):
    """Protocol for address geocoding and autocomplete providers."""

    async def autocomplete(
        self,
        query: str,
        *,
        bias: GeoPoint | None = None,
        session_token: str | None = None,
    ) -> list[PlaceSuggestion]:
        """Return autocomplete suggestions for human-entered query."""
        ...

    async def detail(self, place_id: str) -> PlaceDetail | None:
        """Resolve full canonical address and coordinates for a place ID."""
        ...
