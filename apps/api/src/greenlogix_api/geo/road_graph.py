"""Valhalla road-graph version manifest groundwork (T-CR06).

Self-host not built yet: no tiles, no Docker. This module pins the
audit-trail versions that every optimization result must record, and
provides an offline-safe health helper for the Valhalla endpoint.

Dev placeholders are clearly labeled ("unpinned-dev", "dev-2026-09-21")
except restriction_overlay_version="decision23-2018-v1" (HCMC Decision
23/2018/QD-UBND, see geo/restrictions.py) and
cost_model_version="GLX-HDT-v1.0" (heavy-duty truck cost model).

Wired (T-LOOP-MANIFEST): ``routers/optimize.persist_plan`` and
``carbon.save_report`` merge ``road_graph_audit_extra()`` into ``extra``
additively so the versions flow into optimize/report responses.
"""

from __future__ import annotations

import json
import os
from collections.abc import Callable
from pathlib import Path
from typing import Any

Transport = Callable[[str, str, bytes | None], dict[str, Any]]

API_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MANIFEST_PATH = API_ROOT / "data" / "road_graph.json"

MANIFEST_KEYS: tuple[str, ...] = (
    "osm_snapshot_id",
    "osm_timestamp",
    "valhalla_version",
    "tile_build_hash",
    "elevation_dataset_version",
    "restriction_overlay_version",
    "cost_model_version",
)

_cache: dict[str, Any] | None = None
_cache_path: Path | None = None


def _resolve_manifest_path(path: Path | str | None = None) -> Path:
    override = os.environ.get("ROAD_GRAPH_MANIFEST_PATH")
    if path is not None:
        return Path(path)
    if override:
        return Path(override)
    return DEFAULT_MANIFEST_PATH


def clear_manifest_cache() -> None:
    """Reset cached manifest (tests)."""
    global _cache, _cache_path
    _cache = None
    _cache_path = None


def get_road_graph_manifest(path: Path | str | None = None) -> dict[str, Any]:
    """Read road-graph manifest JSON (cached, deterministic)."""
    global _cache, _cache_path
    target = _resolve_manifest_path(path)
    if _cache is not None and _cache_path == target and path is None:
        return dict(_cache)
    raw: dict[str, Any] = json.loads(target.read_text(encoding="utf-8"))
    missing = [k for k in MANIFEST_KEYS if k not in raw]
    if missing:
        raise KeyError(f"road_graph manifest missing keys: {missing}")
    data = {k: raw[k] for k in MANIFEST_KEYS}
    if path is None:
        _cache = data
        _cache_path = target
    return dict(data)


def get_road_graph_version(path: Path | str | None = None) -> str:
    """Compact audit version: ``osm_snapshot_id:tile_build_hash``."""
    manifest = get_road_graph_manifest(path)
    return f"{manifest['osm_snapshot_id']}:{manifest['tile_build_hash']}"


def get_restriction_overlay_version(path: Path | str | None = None) -> str:
    """Restriction overlay version (Decision 23/2018)."""
    return str(get_road_graph_manifest(path)["restriction_overlay_version"])


def get_cost_model_version(path: Path | str | None = None) -> str:
    """Truck cost-model version."""
    return str(get_road_graph_manifest(path)["cost_model_version"])


def road_graph_audit_extra(path: Path | str | None = None) -> dict[str, str]:
    """Additive ``extra`` payload for optimize/report audit trail.

    Returns all 7 manifest keys (``MANIFEST_KEYS``) plus the derived
    ``road_graph_version`` (``osm_snapshot_id:tile_build_hash``) for
    convenience. Merge pattern::

        extra = {**(extra or {}), **road_graph_audit_extra()}

    Uses string values only; never changes frozen schema. Values come from
    ``get_road_graph_manifest()`` — dev placeholders (``unpinned-dev``)
    except ``restriction_overlay_version="decision23-2018-v1"`` and
    ``cost_model_version="GLX-HDT-v1.0"``. No invented tile hashes.
    """
    manifest = get_road_graph_manifest(path)
    extra: dict[str, str] = {k: str(manifest[k]) for k in MANIFEST_KEYS}
    extra["road_graph_version"] = f"{manifest['osm_snapshot_id']}:{manifest['tile_build_hash']}"
    extra["restriction_overlay_version"] = str(manifest["restriction_overlay_version"])
    extra["cost_model_version"] = str(manifest["cost_model_version"])
    return extra


def _default_base_url() -> str:
    try:  # lazy import avoids any solver<->geo cycle
        from greenlogix_api.solver.road_baseline import DEFAULT_VALHALLA_URL

        fallback = DEFAULT_VALHALLA_URL
    except Exception:
        fallback = "https://valhalla1.openstreetmap.de"
    return os.environ.get("VALHALLA_URL", fallback)


def health_check(
    base_url: str | None = None,
    costing: str = "truck",
    transport: Transport | None = None,
) -> dict[str, Any]:
    """Offline-safe Valhalla health probe.

    No live HTTP when ``transport`` is None (returns ``reachable=False``).
    With injected ``transport``, performs ``GET {url}/status`` once; any
    exception means ``reachable=False`` — never raises.
    """
    url = (base_url or _default_base_url()).rstrip("/")
    configured = bool(url)
    if transport is None:
        return {"configured": configured, "url": url, "costing": costing, "reachable": False}
    try:
        transport(f"{url}/status", "GET", None)
    except Exception:
        return {"configured": configured, "url": url, "costing": costing, "reachable": False}
    return {"configured": configured, "url": url, "costing": costing, "reachable": True}
