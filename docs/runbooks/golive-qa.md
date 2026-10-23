# Go-live QA — GreenLogix van routing

Contest demo for **vans / `xe_tai_nho`** (truck costing). Not motorcycles. Not a full ISO 14083 pack.

Live API: `https://greenlogix-api.9ez.workers.dev`  
Landing proxy: `https://ecomiles.pages.dev/app/`  
Custom hostname `greenlogix.w9.nu` may 404 if the Cloudflare API token lacks **Zone → Workers Routes**. `*.workers.dev` still serves the same Worker.

Auth: `Authorization: Bearer DEMO` (case-insensitive). `?token=DEMO` also works. Driver PIN: `X-Driver-Pin: 0000`.

## Production env (Worker `wrangler.jsonc`)

| Variable | Live value | CI |
|---|---|---|
| `ROAD_BASELINE` | `auto` (Valhalla → OSRM → circuity) | `circuity` |
| `ROAD_BASELINE_COSTING` | `truck` (`xe_tai_nho` envelope) | unused |
| `GREENLOGIX_ECO_WEIGHT` | `1` (sequence by TTW kg CO₂) | unset / `0` unless a test sets it |

Self-hosted OSM: set `VALHALLA_URL` or `OSRM_URL`. Do not scrape Google.

## 1. Optimize

```bash
curl -sS -X POST \
  -H 'Authorization: Bearer DEMO' \
  -H 'Content-Type: application/json' \
  -d '{"cluster_radius_km":3.0}' \
  https://greenlogix-api.9ez.workers.dev/optimize
```

Expect **200**. JSON must include:

- `totals.km` / `totals.kg_co2` — NN+2-opt plan
- `baseline.km` / `baseline.kg_co2` — spreadsheet-order zig-zag (same road provider)
- `distance_provider` — `valhalla`, `osrm`, or `circuity` (never `fallback`)
- `eco_weight` — `1` on the live Worker

`totals.km` should differ from `baseline.km`. Trailing slash `/optimize/` and `/api/optimize/` must also 200.

## 2. Driver

```bash
curl -sS -H 'X-Driver-Pin: 0000' \
  https://greenlogix-api.9ez.workers.dev/driver/route
```

Expect **200** and `routes[]` with stops after a published optimize. UI: `https://ecomiles.pages.dev/driver/` or `/driver` on the Worker.

## 3. Report

```bash
curl -sS -H 'Authorization: Bearer DEMO' \
  https://greenlogix-api.9ez.workers.dev/report
```

Expect **200** with `baseline`, `optimized`, `delta`, plus the same `distance_provider` and `eco_weight` labels. CSV: `GET /report.csv`.

## Offline CI

```bash
export PATH="$HOME/.local/bin:$PATH"
cd apps/api && uv sync --locked && uv run --locked pytest -q
pnpm --filter @greenlogix/worker run typecheck
pnpm --filter @greenlogix/worker run test
```

Pytest pins `ROAD_BASELINE=circuity` so CI never calls public OSM.
