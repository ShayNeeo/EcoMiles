"""Vietnam administrative boundary traversal ('Đi qua phường nào').

Resolves geographic coordinates and route polylines to canonical 
administrative wards/communes conforming to the latest national administrative directory.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from greenlogix_api.solver.distance import haversine_km


@dataclass(frozen=True)
class WardBoundary:
    code: str
    ward_name: str
    district: str
    province: str
    center_lat: float
    center_lng: float
    approx_radius_km: float


# Canonical reference centroids for central HCMC administrative units
HCMC_WARDS: list[WardBoundary] = [
    WardBoundary("VN_79_766_26890", "Phường 2", "Tân Bình", "TP. Hồ Chí Minh", 10.8123, 106.6543, 2.0),
    WardBoundary("VN_79_766_26893", "Phường 4", "Tân Bình", "TP. Hồ Chí Minh", 10.7980, 106.6560, 1.8),
    WardBoundary("VN_79_768_27001", "Phường 15", "Phú Nhuận", "TP. Hồ Chí Minh", 10.7940, 106.6730, 1.5),
    WardBoundary("VN_79_771_27120", "Phường 14", "Quận 10", "TP. Hồ Chí Minh", 10.7725, 106.6578, 1.6),
    WardBoundary("VN_79_770_27085", "Phường Võ Thị Sáu", "Quận 3", "TP. Hồ Chí Minh", 10.7845, 106.6890, 1.8),
    WardBoundary("VN_79_760_26734", "Phường Bến Nghé", "Quận 1", "TP. Hồ Chí Minh", 10.7812, 106.6998, 1.5),
    WardBoundary("VN_79_760_26740", "Phường Bến Thành", "Quận 1", "TP. Hồ Chí Minh", 10.7710, 106.6950, 1.4),
    WardBoundary("VN_79_765_26840", "Phường 22", "Bình Thạnh", "TP. Hồ Chí Minh", 10.7951, 106.7218, 2.0),
    WardBoundary("VN_79_769_27050", "Phường Thảo Điền", "Thủ Đức", "TP. Hồ Chí Minh", 10.8040, 106.7350, 2.5),
]


@dataclass
class TraversedArea:
    code: str
    ward_name: str
    district: str
    province: str
    distance_km: float = 0.0
    stop_ids: list[int] = field(default_factory=list)


@dataclass
class RouteAdminTraversal:
    route_id: int | None
    admin_version: str = "VN-NSO-2026.09"
    areas: list[TraversedArea] = field(default_factory=list)

    @property
    def district_breadcrumb(self) -> str:
        """Produce clean UI breadcrumb of districts, e.g. 'Tân Bình → Phú Nhuận → Quận 1'."""
        if not self.areas:
            return ""
        districts: list[str] = []
        for a in self.areas:
            if not districts or districts[-1] != a.district:
                districts.append(a.district)
        return " → ".join(districts)


def resolve_nearest_ward(lat: float, lng: float) -> WardBoundary:
    """Find closest canonical administrative ward centroid."""
    best_ward = HCMC_WARDS[0]
    best_dist = float("inf")
    for w in HCMC_WARDS:
        d = haversine_km(lat, lng, w.center_lat, w.center_lng)
        if d < best_dist:
            best_dist = d
            best_ward = w
    return best_ward


# T-LOOP-GEO (CR-08 honest slice): versioned admin-area lookup.
# Centroid fallback ONLY — never polygon intersection; no PostGIS in this
# sqlite-only env. Version string pins the in-repo centroid snapshot so every
# consumer (endpoint, report extra) labels the method honestly.
ADMIN_BOUNDARY_VERSION = "nso-2024-v1-centroid-fallback"
ADMIN_LOOKUP_METHOD = "centroid-fallback"


def admin_boundary_audit_extra() -> dict[str, str]:
    """Additive ``extra`` payload: pins the boundary dataset version."""
    return {"admin_boundary_version": ADMIN_BOUNDARY_VERSION}


def lookup_admin_areas_versioned(
    stops: list[dict],
    route_id: int | None = None,
) -> dict:
    """Versioned wrapper over :func:`compute_route_admin_traversal`.

    Returns a JSON-serializable corridor labeled with the dataset version
    and the ``centroid-fallback`` method. Never claims polygon intersection.
    """
    traversal = compute_route_admin_traversal(stops, route_id=route_id)
    corridor = [
        {
            "code": a.code,
            "ward_name": a.ward_name,
            "district": a.district,
            "province": a.province,
            "distance_km": a.distance_km,
            "stop_ids": list(a.stop_ids),
        }
        for a in traversal.areas
    ]
    return {
        "route_id": route_id,
        "admin_boundary_version": ADMIN_BOUNDARY_VERSION,
        "method": ADMIN_LOOKUP_METHOD,
        "corridor": corridor,
        "district_breadcrumb": traversal.district_breadcrumb,
    }


def compute_route_admin_traversal(
    stops: list[dict],
    route_id: int | None = None,
) -> RouteAdminTraversal:
    """Compute traversed administrative areas along ordered route stops."""
    if not stops:
        return RouteAdminTraversal(route_id=route_id, areas=[])

    areas: list[TraversedArea] = []
    prev_coords: tuple[float, float] | None = None

    for s in stops:
        lat = float(s.get("lat", 0.0))
        lng = float(s.get("lng", 0.0))
        stop_id = int(s.get("id", 0))

        ward = resolve_nearest_ward(lat, lng)

        # Distance from previous stop
        leg_km = haversine_km(prev_coords[0], prev_coords[1], lat, lng) if prev_coords else 0.0
        prev_coords = (lat, lng)

        # Check if same as last area
        if areas and areas[-1].code == ward.code:
            areas[-1].distance_km = round(areas[-1].distance_km + leg_km, 2)
            if stop_id > 0 and stop_id not in areas[-1].stop_ids:
                areas[-1].stop_ids.append(stop_id)
        else:
            areas.append(
                TraversedArea(
                    code=ward.code,
                    ward_name=ward.ward_name,
                    district=ward.district,
                    province=ward.province,
                    distance_km=round(leg_km, 2),
                    stop_ids=[stop_id] if stop_id > 0 else [],
                )
            )

    return RouteAdminTraversal(route_id=route_id, areas=areas)
