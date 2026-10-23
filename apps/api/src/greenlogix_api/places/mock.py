"""Deterministic mock place provider for Vietnam urban logistics test cases."""

from __future__ import annotations

import unicodedata

from greenlogix_api.places.base import (
    GeoPoint,
    PlaceDetail,
    PlaceProvider,
    PlaceSuggestion,
)

# Canonical reference locations across HCMC and Hanoi
CANONICAL_PLACES: list[PlaceDetail] = [
    PlaceDetail(
        place_id="gofa_hcmc_depot_tanbinh",
        formatted_address="Kho trung tâm Tân Bình, 108 Bạch Đằng, Phường 2, Tân Bình, TP. Hồ Chí Minh",
        point=GeoPoint(lat=10.8123, lng=106.6543),
        province="TP. Hồ Chí Minh",
        district="Tân Bình",
        ward="Phường 2",
        confidence=1.0,
    ),
    PlaceDetail(
        place_id="gofa_hcmc_ly_thuong_kiet",
        formatted_address="268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh",
        point=GeoPoint(lat=10.7725, lng=106.6578),
        province="TP. Hồ Chí Minh",
        district="Quận 10",
        ward="Phường 14",
        confidence=0.98,
    ),
    PlaceDetail(
        place_id="gofa_hcmc_le_duan",
        formatted_address="15 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        point=GeoPoint(lat=10.7812, lng=106.6998),
        province="TP. Hồ Chí Minh",
        district="Quận 1",
        ward="Phường Bến Nghé",
        confidence=0.99,
    ),
    PlaceDetail(
        place_id="gofa_hcmc_landmark81",
        formatted_address="Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Bình Thạnh, TP. Hồ Chí Minh",
        point=GeoPoint(lat=10.7951, lng=106.7218),
        province="TP. Hồ Chí Minh",
        district="Bình Thạnh",
        ward="Phường 22",
        confidence=0.95,
    ),
    PlaceDetail(
        place_id="gofa_hn_hoan_kiem",
        formatted_address="1 Tràng Tiền, Phường Phan Chu Trinh, Hoàn Kiếm, Hà Nội",
        point=GeoPoint(lat=21.0245, lng=105.8572),
        province="Hà Nội",
        district="Hoàn Kiếm",
        ward="Phường Phan Chu Trinh",
        confidence=0.99,
    ),
    PlaceDetail(
        place_id="gofa_hn_cau_giay",
        formatted_address="144 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
        point=GeoPoint(lat=21.0371, lng=105.7824),
        province="Hà Nội",
        district="Cầu Giấy",
        ward="Dịch Vọng Hậu",
        confidence=0.97,
    ),
]


def _normalize(text: str) -> str:
    """Strip accents and lowercase for robust fuzzy matching."""
    text = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return stripped.lower().strip()


class MockPlaceProvider(PlaceProvider):
    """Deterministic, quota-free provider for testing and offline development."""

    def __init__(self, places: list[PlaceDetail] | None = None) -> None:
        self._places = places or CANONICAL_PLACES
        self._by_id = {p.place_id: p for p in self._places}

    async def autocomplete(
        self,
        query: str,
        *,
        bias: GeoPoint | None = None,
        session_token: str | None = None,
    ) -> list[PlaceSuggestion]:
        q_norm = _normalize(query)
        if len(q_norm) < 2:
            return []

        matches: list[PlaceSuggestion] = []
        for p in self._places:
            addr_norm = _normalize(p.formatted_address)
            id_norm = _normalize(p.place_id)
            if q_norm in addr_norm or q_norm in id_norm:
                parts = p.formatted_address.split(",", 1)
                main = parts[0].strip()
                sec = parts[1].strip() if len(parts) > 1 else ""
                matches.append(
                    PlaceSuggestion(
                        place_id=p.place_id,
                        description=p.formatted_address,
                        main_text=main,
                        secondary_text=sec,
                        provider="mock",
                    )
                )
        return matches[:5]

    async def detail(self, place_id: str) -> PlaceDetail | None:
        return self._by_id.get(place_id)
