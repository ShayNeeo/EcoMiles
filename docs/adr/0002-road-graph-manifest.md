# ADR 0002: Valhalla Road-Graph Manifest Groundwork (T-CR06)

**Status:** Accepted (groundwork only — no tiles, no Docker)
**Date:** 2026-09-21
**Refs:** ADR 0001 §B/C, Plan §4C + §16.4, HCMC Decision 23/2018/QD-UBND

## Decision

- Version manifest lives at `apps/api/data/road_graph.json` with 7 keys:
  `osm_snapshot_id`, `osm_timestamp`, `valhalla_version`, `tile_build_hash`,
  `elevation_dataset_version`, `restriction_overlay_version`, `cost_model_version`.
- Values are clearly-labeled dev placeholders (`unpinned-dev`, `dev-2026-09-21`)
  except `restriction_overlay_version="decision23-2018-v1"` (legal overlay,
  see `geo/restrictions.py`) and `cost_model_version="GLX-HDT-v1.0"`.
- Reader module: `src/greenlogix_api/geo/road_graph.py`
  (`get_road_graph_manifest`, `get_restriction_overlay_version`,
  `get_cost_model_version`, `health_check`, `road_graph_audit_extra`).
- `health_check` is offline-safe: no live HTTP unless a `transport` is
  injected; never raises (unreachable → `reachable=False`).

## Wiring (T-CR01 owns schemas/routers — additive only)

In `routers/optimize.persist_plan` / `carbon.save_report`, merge:

```python
from greenlogix_api.geo.road_graph import road_graph_audit_extra
extra = {**(extra or {}), **road_graph_audit_extra()}
```

This flows `road_graph_version` + `restriction_overlay_version` (+
`cost_model_version`) into optimize/report `extra` without touching the
frozen OpenAPI path set. Standalone module test passes without the hook.

## Non-goals

No tile build, no Docker self-host, no endpoint change, no GOFA schema.
