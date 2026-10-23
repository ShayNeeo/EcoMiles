# ADR 0001: Authoritative Architecture & Foundation Freezing

**Status:** Accepted  
**Date:** 2026-09-21  
**Context:** GreenLogix / EcoMiles Vietnam Urban Truck Routing Platform (SO 2026 / Demo 24/09)

---

## 1. Decision Drivers
- Python ecosystem provides state-of-the-art Operations Research tools (PyVRP, OR-Tools, CP-SAT) and geospatial computation libraries needed for heavy-duty truck eco-routing.
- Cloudflare Workers have strict CPU and memory limits, making them unsuitable for complex VRP solvers, self-hosted graph engines, or heavy GIS matrix computations.
- Duplicate solver logic across FastAPI and Cloudflare Worker previously created behavioral drift (e.g. diverging emission factors, inconsistent fallback handling).
- Pure straight-line circuity distance without graph validation cannot be silently presented as a truck-feasible route.

---

## 2. Architectural Decisions

### A. FastAPI is Authoritative Source of Truth
- All routing optimization, fleet sequencing, energy models, restriction checks, and carbon accounting reside exclusively in `apps/api`.
- Cloudflare Worker functions as a static asset CDN, reverse proxy / BFF, and edge auth gateway. Domain optimization logic in the Worker is frozen/deprecated in favor of proxying to FastAPI.

### B. Routing Substrate: OpenStreetMap + Valhalla / OSRM
- OpenStreetMap (OSM) Vietnam extract provides the primary reproducible routing graph.
- Valhalla is the primary truck-aware matrix and routing provider, passing vehicle dimensions and weight.
- OSRM driving is secondary fallback.
- Circuity (Haversine $\times 1.35$) is strictly for test fixtures or explicitly labeled degraded mode.

### C. Explicit Routing Quality Classification
Every optimization response must expose `routing_quality`:
- `VERIFIED_GRAPH`: Matrix and route geometry computed via road graph (Valhalla/OSRM) matching truck profile.
- `DEGRADED`: Fallback provider or unverified road graph used; explicit warning attached.
- `UNAVAILABLE`: Routing service cannot compute feasible road paths.

### D. Address Resolution: GOFA Places Sponsored Entitlement
- Use the sponsored GOFA Places API (15k requests/month) for human place search, address normalization, and canonical coordinates.
- Maintain strict quota discipline: debouncing, caching by place ID, and separating POI coordinates from snapped truck road access points.

### E. Navigation Handoff Policy
- External navigation handoff to Google Maps must explicitly declare `travelmode=driving&dir_action=navigate` to eliminate the default two-wheeler / motorcycle mode switch UX bug in Vietnam.
- This handoff is labeled *External Navigation (Car Driving)* to maintain honesty about truck restriction awareness.

---

## 3. Consequences
- **Positive:** Single, testable codebase for all algorithms; verifiable model versioning; reproducible benchmarks.
- **Negative:** Requires Python runtime deployment (container/serverless) rather than pure Cloudflare edge workers for optimization.

---

## Amendment A1 — CR-01 Ground-Truth Freeze (2026-09-21)

- `routing_quality` (`VERIFIED_GRAPH` | `DEGRADED` | `UNAVAILABLE`) is exposed on
  `OptimizeOut` / `ReportOut` / `VrpResult` with default `DEGRADED`.
  `materialize_matrix` returns `(baseline, provider_name, routing_quality)`;
  circuity always maps to `DEGRADED`, empty inputs to `UNAVAILABLE`.
- `GREENLOGIX_ECO_WEIGHT` is **deprecated, not removed** (frozen OpenAPI compat);
  `weight > 0` logs a warning and callers should prefer Pareto reporting.
- CORS: `GREENLOGIX_CORS_ORIGINS` comma-separated allowlist; demo-only `*` when
  `GREENLOGIX_DEMO=1`, otherwise explicit list or deny.
- Optimizer selection: `GREENLOGIX_OPTIMIZER=legacy` (default NN+2-opt) |
  `ecoalns` (experimental); fail-closed publish via
  `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` (blocks DEGRADED/UNAVAILABLE publish).
- Frozen fixtures: deterministic seed snapshot (`order_rows`/`truck_rows`
  equality + `tests/fixtures/seed_snapshot.json` export).
