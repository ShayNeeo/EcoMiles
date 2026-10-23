"""Road-network distance providers (OSM now, Google Directions later).

Production path: Valhalla truck (xe_tai_nho) → OSRM driving → circuity.
HTTP is retried, matrices are TTL-cached, malformed cells fail that provider
and the next one runs. A Google Directions key can plug in later behind the
same interface. Do not scrape Google. CI sets ROAD_BASELINE=circuity.
"""

from __future__ import annotations

import json
import logging
import math
import os
import time
import urllib.error
import urllib.request
from collections.abc import Callable, Sequence
from typing import Any, Protocol

from greenlogix_api.geo.truck_profile import DEFAULT_TRUCK_PROFILE, TruckProfile
from greenlogix_api.solver.distance import HCMC_CIRCUITY, haversine_km

log = logging.getLogger("greenlogix")

LatLng = tuple[float, float]
Transport = Callable[[str, str, bytes | None], dict[str, Any]]
MatrixCache = dict[str, tuple[float, list[list[float]], str]]

# CR-01 routing-quality taxonomy (ADR 0001 §C). Circuity is never truck-safe.
ROUTING_QUALITY_VERIFIED = "VERIFIED_GRAPH"
ROUTING_QUALITY_DEGRADED = "DEGRADED"
ROUTING_QUALITY_UNAVAILABLE = "UNAVAILABLE"

# Providers whose matrix comes from a real road graph.
_VERIFIED_PROVIDERS = frozenset({"valhalla", "osrm", "matrix_cache", "google_directions"})


def quality_for_provider(provider_name: str) -> str:
    """Map a distance-provider name to its routing-quality label.

    VERIFIED_GRAPH: valhalla/osrm/matrix_cache hit (road-graph backed).
    DEGRADED: circuity fallback or any unknown/custom provider.
    UNAVAILABLE is only returned by materialize_matrix for empty inputs.
    """
    if (provider_name or "").strip().lower() in _VERIFIED_PROVIDERS:
        return ROUTING_QUALITY_VERIFIED
    return ROUTING_QUALITY_DEGRADED

DEFAULT_OSRM_URL = "https://router.project-osrm.org"
DEFAULT_VALHALLA_URL = "https://valhalla1.openstreetmap.de"
DEFAULT_TIMEOUT_S = 2.5
DEFAULT_RETRIES = 2
DEFAULT_CACHE_TTL_S = 300.0
DEFAULT_COSTING = "truck"

_MATRIX_CACHE: MatrixCache = {}


class RoadBaselineError(Exception):
    """OSM / Google provider failure."""


class RoadBaselineNotConfigured(RoadBaselineError):
    """Provider selected but credentials or client are missing."""


class RoadBaseline(Protocol):
    provider_id: str

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float: ...

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]: ...


def _key(lat: float, lng: float) -> tuple[float, float]:
    return (round(lat, 5), round(lng, 5))


def _points_key(points: Sequence[LatLng]) -> str:
    return ";".join(f"{lat:.5f},{lng:.5f}" for lat, lng in points)


def clear_matrix_cache() -> None:
    _MATRIX_CACHE.clear()


def validate_matrix_km(matrix: Sequence[Sequence[Any]], size: int | None = None) -> list[list[float]]:
    if not matrix:
        raise ValueError("empty distance matrix")
    n = size if size is not None else len(matrix)
    if len(matrix) != n:
        raise ValueError("matrix row count mismatch")
    out: list[list[float]] = []
    for i, row in enumerate(matrix):
        if not isinstance(row, (list, tuple)) or len(row) != n:
            raise ValueError("matrix must be square")
        parsed: list[float] = []
        for j, cell in enumerate(row):
            if cell is None:
                raise ValueError(f"null matrix cell at {i},{j}")
            try:
                value = float(cell)
            except (TypeError, ValueError) as exc:
                raise ValueError(f"non-numeric matrix cell at {i},{j}") from exc
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"invalid matrix cell at {i},{j}")
            parsed.append(value)
        out.append(parsed)
    return out


def _used_provider_id(provider: RoadBaseline) -> str:
    return getattr(provider, "last_provider_id", None) or provider.provider_id


def default_transport(
    url: str,
    method: str,
    body: bytes | None,
    *,
    timeout_s: float = DEFAULT_TIMEOUT_S,
) -> dict[str, Any]:
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("User-Agent", "GreenLogix-RoadBaseline/1.0")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            if getattr(resp, "status", 200) >= 400:
                raise RoadBaselineError(f"HTTP {resp.status}")
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RoadBaselineError(str(exc)) from exc


def _call_transport(
    transport: Transport | None,
    url: str,
    method: str,
    body: bytes | None,
    *,
    timeout_s: float,
    retries: int = DEFAULT_RETRIES,
) -> dict[str, Any]:
    attempts = max(1, retries + 1)
    last: Exception | None = None
    for _ in range(attempts):
        try:
            if transport is not None:
                return transport(url, method, body)
            return default_transport(url, method, body, timeout_s=timeout_s)
        except Exception as exc:
            last = exc
    assert last is not None
    raise last


class CircuityRoadBaseline:
    """Always-available fallback: haversine × HCMC_CIRCUITY=1.35."""

    provider_id = "circuity"

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        return haversine_km(lat1, lng1, lat2, lng2) * HCMC_CIRCUITY

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]:
        return [[self.pair_km(a[0], a[1], b[0], b[1]) for b in points] for a in points]


class CachedMatrixBaseline:
    """O(1) pair lookups from a precomputed matrix; circuity on a miss."""

    def __init__(
        self,
        points: Sequence[LatLng],
        matrix: list[list[float]],
        fallback: RoadBaseline | None = None,
        provider_id: str = "matrix_cache",
    ) -> None:
        self.provider_id = provider_id
        self._index = {_key(*pt): i for i, pt in enumerate(points)}
        self._matrix = matrix
        self._fallback = fallback or CircuityRoadBaseline()

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        i = self._index.get(_key(lat1, lng1))
        j = self._index.get(_key(lat2, lng2))
        if i is not None and j is not None:
            return float(self._matrix[i][j])
        return self._fallback.pair_km(lat1, lng1, lat2, lng2)

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]:
        return [[self.pair_km(a[0], a[1], b[0], b[1]) for b in points] for a in points]


class FallbackRoadBaseline:
    """Try primary OSM; fall back to the next provider or circuity."""

    provider_id = "fallback"

    def __init__(self, primary: RoadBaseline, fallback: RoadBaseline | None = None) -> None:
        self.primary = primary
        self.fallback = fallback or CircuityRoadBaseline()
        self.last_provider_id = _used_provider_id(self.fallback)

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        try:
            km = self.primary.pair_km(lat1, lng1, lat2, lng2)
            self.last_provider_id = self.primary.provider_id
            return km
        except Exception:
            km = self.fallback.pair_km(lat1, lng1, lat2, lng2)
            self.last_provider_id = _used_provider_id(self.fallback)
            return km

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]:
        try:
            matrix = self.primary.matrix_km(points)
            self.last_provider_id = self.primary.provider_id
            return matrix
        except Exception:
            matrix = self.fallback.matrix_km(points)
            self.last_provider_id = _used_provider_id(self.fallback)
            return matrix

    @property
    def profile_hash(self) -> str:
        return getattr(self.primary, "profile_hash", "")


def parse_osrm_table(payload: dict[str, Any]) -> list[list[float]]:
    if payload.get("code") != "Ok":
        raise ValueError(f"OSRM table error: {payload.get('code')!r}")
    distances = payload.get("distances")
    if not isinstance(distances, list) or not distances:
        raise ValueError("OSRM table missing distances")
    return validate_matrix_km([[None if cell is None else float(cell) / 1000.0 for cell in row] for row in distances])


def osrm_table_url(base_url: str, points: Sequence[LatLng], profile: str = "driving") -> str:
    coords = ";".join(f"{lng},{lat}" for lat, lng in points)
    return f"{base_url.rstrip('/')}/table/v1/{profile}/{coords}?annotations=distance"


class OsrmRoadBaseline:
    """OSRM `/table/v1/driving` — Google Distance Matrix can replace this later."""

    provider_id = "osrm"

    def __init__(
        self,
        base_url: str = DEFAULT_OSRM_URL,
        *,
        timeout_s: float = DEFAULT_TIMEOUT_S,
        transport: Transport | None = None,
        profile: str = "driving",
        retries: int = DEFAULT_RETRIES,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s
        self.transport = transport
        self.profile = profile
        self.retries = retries

    def _fetch(self, url: str, method: str, body: bytes | None) -> dict[str, Any]:
        return _call_transport(
            self.transport, url, method, body, timeout_s=self.timeout_s, retries=self.retries
        )

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]:
        if len(points) < 2:
            return [[0.0] * len(points) for _ in points]
        payload = self._fetch(osrm_table_url(self.base_url, points, self.profile), "GET", None)
        return parse_osrm_table(payload)

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        return self.matrix_km([(lat1, lng1), (lat2, lng2)])[0][1]


def parse_valhalla_matrix(payload: dict[str, Any]) -> list[list[float]]:
    rows = payload.get("sources_to_targets")
    if not isinstance(rows, list) or not rows:
        raise ValueError("Valhalla matrix missing sources_to_targets")
    raw: list[list[Any]] = []
    for row in rows:
        parsed_row: list[Any] = []
        for cell in row:
            if not isinstance(cell, dict) or "distance" not in cell:
                raise ValueError("Valhalla matrix cell missing distance")
            parsed_row.append(cell["distance"])
        raw.append(parsed_row)
    return validate_matrix_km(raw)


def valhalla_matrix_body(
    points: Sequence[LatLng],
    costing: str = "auto",
    truck_profile: TruckProfile | None = None,
) -> dict[str, Any]:
    locs = [{"lat": lat, "lon": lng} for lat, lng in points]
    body: dict[str, Any] = {"sources": locs, "targets": locs, "costing": costing}
    if costing == "truck":
        # T-LOOP-ROUTING: no silent 3.5t fallback. A missing profile logs a
        # warning and uses the explicit DEFAULT_TRUCK_PROFILE envelope so the
        # request body and the matrix cache key always agree on one profile.
        profile = truck_profile
        if profile is None:
            log.warning(
                "valhalla truck costing without explicit TruckProfile; "
                "using explicit DEFAULT_TRUCK_PROFILE=%s (never silent)",
                DEFAULT_TRUCK_PROFILE.name,
            )
            profile = DEFAULT_TRUCK_PROFILE
        body["costing_options"] = {"truck": profile.to_valhalla_truck_options()}
    return body


class ValhallaRoadBaseline:
    """Valhalla `/sources_to_targets` with auto or truck costing."""

    provider_id = "valhalla"

    def __init__(
        self,
        base_url: str = DEFAULT_VALHALLA_URL,
        *,
        costing: str = DEFAULT_COSTING,
        timeout_s: float = DEFAULT_TIMEOUT_S,
        transport: Transport | None = None,
        retries: int = DEFAULT_RETRIES,
        truck_profile: TruckProfile | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.costing = costing
        self.timeout_s = timeout_s
        self.transport = transport
        self.retries = retries
        self.truck_profile = truck_profile

    @property
    def profile_hash(self) -> str:
        # T-LOOP-ROUTING: explicit default hash (never the opaque
        # "default_truck") so cache keys stay comparable across providers.
        if self.truck_profile is not None:
            return self.truck_profile.profile_hash()
        return DEFAULT_TRUCK_PROFILE.profile_hash()

    def _fetch(self, url: str, method: str, body: bytes | None) -> dict[str, Any]:
        return _call_transport(
            self.transport, url, method, body, timeout_s=self.timeout_s, retries=self.retries
        )

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]:
        if len(points) < 2:
            return [[0.0] * len(points) for _ in points]
        payload = self._fetch(
            f"{self.base_url}/sources_to_targets",
            "POST",
            json.dumps(valhalla_matrix_body(points, self.costing, self.truck_profile)).encode("utf-8"),
        )
        return parse_valhalla_matrix(payload)

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        return self.matrix_km([(lat1, lng1), (lat2, lng2)])[0][1]


class GoogleDirectionsBaseline:
    """Reserved adapter. Instantiating without a wired client is not configured."""

    provider_id = "google_directions"

    def __init__(self, api_key: str | None = None) -> None:
        if not api_key:
            raise RoadBaselineNotConfigured(
                "GOOGLE_MAPS_API_KEY not set; Google-class baseline is OSM (Valhalla/OSRM)"
            )
        raise RoadBaselineNotConfigured(
            "Google Directions client is not wired yet; keep using OSM RoadBaseline"
        )

    def pair_km(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        raise RoadBaselineNotConfigured("Google Directions client is not wired yet")

    def matrix_km(self, points: Sequence[LatLng]) -> list[list[float]]:
        raise RoadBaselineNotConfigured("Google Directions client is not wired yet")


def _osm_chain(
    *,
    osrm: str,
    valhalla: str,
    costing: str,
    transport: Transport | None,
) -> FallbackRoadBaseline:
    return FallbackRoadBaseline(
        ValhallaRoadBaseline(valhalla, costing=costing, transport=transport),
        FallbackRoadBaseline(OsrmRoadBaseline(osrm, transport=transport)),
    )


def resolve_road_baseline(
    name: str | None = None,
    *,
    osrm_url: str | None = None,
    valhalla_url: str | None = None,
    costing: str | None = None,
    transport: Transport | None = None,
) -> RoadBaseline:
    choice = (name or os.environ.get("ROAD_BASELINE") or "auto").strip().lower()
    costing_name = (costing or os.environ.get("ROAD_BASELINE_COSTING") or DEFAULT_COSTING).strip().lower()
    shared = os.environ.get("ROAD_BASELINE_URL", "").strip()
    osrm = osrm_url or os.environ.get("OSRM_URL") or (shared if choice == "osrm" else "") or DEFAULT_OSRM_URL
    valhalla = (
        valhalla_url
        or os.environ.get("VALHALLA_URL")
        or (shared if choice == "valhalla" else "")
        or DEFAULT_VALHALLA_URL
    )
    if choice in {"google", "google_directions"}:
        # No key / no client yet — same OSM chain the live worker deploys.
        choice = "auto"
    if choice in {"circuity", "haversine"}:
        return CircuityRoadBaseline()
    if choice == "osrm":
        return FallbackRoadBaseline(OsrmRoadBaseline(osrm, transport=transport))
    if choice == "valhalla":
        return FallbackRoadBaseline(
            ValhallaRoadBaseline(valhalla, costing=costing_name, transport=transport)
        )
    return _osm_chain(osrm=osrm, valhalla=valhalla, costing=costing_name, transport=transport)


# --- T-LOOP-ROUTING: full 7-key matrix cache identity -----------------------
# Cache key = profile_hash + road_graph_version + departure_bucket +
# restriction_overlay_version + traffic_snapshot + cost_model_version +
# coords (7 components). Versions resolve from the road-graph manifest
# with offline-safe fallbacks; buckets/snapshots resolve from env so CI
# stays deterministic while production can vary them per deploy.

def road_graph_version_id() -> str:
    """``osm_snapshot_id:tile_build_hash``; dev placeholder offline."""
    try:
        from greenlogix_api.geo.road_graph import get_road_graph_version

        return get_road_graph_version()
    except Exception:
        return "unpinned-dev:unpinned-dev"


def restriction_overlay_id() -> str:
    """Restriction overlay version (HCMC Decision 23/2018)."""
    try:
        from greenlogix_api.geo.road_graph import get_restriction_overlay_version

        return get_restriction_overlay_version()
    except Exception:
        return "decision23-2018-v1"


def cost_model_id() -> str:
    """Truck cost-model version."""
    try:
        from greenlogix_api.geo.road_graph import get_cost_model_version

        return get_cost_model_version()
    except Exception:
        return "GLX-HDT-v1.0"


def departure_bucket_id() -> str:
    """Departure-time bucket for the matrix (env override, CI-stable)."""
    return os.environ.get("ROUTING_DEPARTURE_BUCKET", "static").strip() or "static"


def traffic_snapshot_id() -> str:
    """Traffic snapshot id for the matrix (env override, CI-stable)."""
    return os.environ.get("TRAFFIC_SNAPSHOT_VERSION", "free-flow").strip() or "free-flow"


def build_matrix_cache_key(
    provider_id: str,
    profile_hash: str,
    points: Sequence[LatLng],
    *,
    road_graph_version: str | None = None,
    departure_bucket: str | None = None,
    restriction_overlay_version: str | None = None,
    traffic_snapshot: str | None = None,
    cost_model_version: str | None = None,
) -> str:
    """Full 7-component cache key: 6 version tokens + coords.

    Any single component change (truck envelope, tiles, departure bucket,
    restriction overlay, traffic snapshot, cost model, geometry) yields a
    distinct key — no stale cross-profile reuse.
    """
    return "|".join(
        [
            provider_id or "circuity",
            profile_hash or DEFAULT_TRUCK_PROFILE.profile_hash(),
            road_graph_version or road_graph_version_id(),
            departure_bucket or departure_bucket_id(),
            restriction_overlay_version or restriction_overlay_id(),
            traffic_snapshot or traffic_snapshot_id(),
            cost_model_version or cost_model_id(),
            _points_key(points),
        ]
    )


# --- T-LOOP-ROUTING: restriction wiring -------------------------------------
# Every matrix evaluation labels which restriction overlay was enforced.

def restriction_coverage_label(
    checked: bool,
    restricted: bool = False,
    overlay_version: str | None = None,
) -> str:
    """``<overlay>:checked[:restricted|:clear]`` or ``<overlay>:unchecked``."""
    overlay = overlay_version or restriction_overlay_id()
    if not checked:
        return f"{overlay}:unchecked"
    suffix = ":restricted" if restricted else ":clear"
    return f"{overlay}:checked{suffix}"


def evaluate_restriction_coverage(
    orders: Sequence[Any],
    vehicle_class: str = "xe_tai_nho",
    *,
    in_inner_city: bool = True,
    overlay_version: str | None = None,
) -> str:
    """Call ``geo.restrictions.check_truck_ban`` per order window.

    Returns a ``restriction_coverage`` label; never raises (fail-open to
    ``unchecked`` with a warning so routing still works offline).
    """
    from greenlogix_api.geo.restrictions import check_truck_ban

    overlay = overlay_version or restriction_overlay_id()
    try:
        items = list(orders or [])
    except TypeError:
        return restriction_coverage_label(False, overlay_version=overlay)
    if not items:
        return restriction_coverage_label(False, overlay_version=overlay)
    try:
        for order in items:
            result = check_truck_ban(
                getattr(order, "window_start", "") or "",
                getattr(order, "window_end", "") or "",
                vehicle_class,
                in_inner_city=in_inner_city,
            )
            if result.is_restricted:
                return restriction_coverage_label(True, True, overlay)
    except Exception:
        log.warning("restriction overlay check failed; marking coverage unchecked")
        return restriction_coverage_label(False, overlay_version=overlay)
    return restriction_coverage_label(True, False, overlay)


def materialize_matrix(
    provider: RoadBaseline,
    points: Sequence[LatLng],
    *,
    cache: MatrixCache | None = None,
    now: float | None = None,
    ttl_s: float = DEFAULT_CACHE_TTL_S,
) -> tuple[RoadBaseline, str, str]:
    """Build a cached matrix once per optimize; fall back to circuity on failure.

    Returns (baseline, provider_name, routing_quality). All callers unpack 3.
    """
    store = _MATRIX_CACHE if cache is None else cache
    clock = time.monotonic() if now is None else now
    if not points:
        return CircuityRoadBaseline(), "circuity", ROUTING_QUALITY_UNAVAILABLE
    profile_id = getattr(provider, "profile_hash", "") or (
        provider.truck_profile.profile_hash()
        if hasattr(provider, "truck_profile") and getattr(provider, "truck_profile", None)
        else DEFAULT_TRUCK_PROFILE.profile_hash()
    )
    key = build_matrix_cache_key(provider.provider_id, profile_id, points)
    hit = store.get(key)
    if hit and clock - hit[0] < ttl_s:
        matrix, name = hit[1], hit[2]
        cached = CachedMatrixBaseline(points, matrix, CircuityRoadBaseline(), name)
        return cached, name, quality_for_provider(name)
    try:
        matrix = validate_matrix_km(provider.matrix_km(points), size=len(points) or None)
        name = _used_provider_id(provider)
        cached = CachedMatrixBaseline(points, matrix, CircuityRoadBaseline(), name)
        if name != "circuity":
            store[key] = (clock, matrix, name)
        return cached, name, quality_for_provider(name)
    except Exception:
        return CircuityRoadBaseline(), "circuity", ROUTING_QUALITY_DEGRADED
