# EcoMiles API

Python **3.12** FastAPI backend for the EcoMiles Web MVP. No commercial map, routing, traffic, or carbon API keys required.

## Run

```bash
cd apps/api
uv python pin 3.12 && uv sync
GREENLOGIX_DEMO=1 uv run python -m greenlogix_api.seed
GREENLOGIX_DEMO=1 uv run uvicorn greenlogix_api.main:app --host 127.0.0.1 --port 8000
```

Public health check:

```bash
curl http://127.0.0.1:8000/health
# {"status":"ok"}
```

## Demo Auth (Localhost / Protected Demo)

Env `GREENLOGIX_DEMO=1` is required. Without it, every protected data route returns 401.

| Role | Header |
|------|--------|
| Dispatcher | `Authorization: Bearer DEMO` |
| Driver | `X-Driver-Pin: 0000` |

This is a contest demo authentication mechanism, not a production public identity provider.

## Contract & Validation

Checked-in [`openapi.json`](./openapi.json) is the frozen contract. `GET /openapi.json` is public.

- Paths, HTTP methods and response keys match OpenAPI. Enumerated values are strictly validated (cargo type, fuel, vehicle/order/stop status, fail reason and stop kind).
- Order patches validate finite latitude `[-90, 90]`, longitude `[-180, 180]`, nonnegative kg and local `HH:MM` times (`00:00`–`23:59`).
- Vehicle patches require finite positive capacity and L/100km; optimize requires a finite positive radius (default `3.0` km).
- Stop status accepts `arrived`, `delivered` or `failed`. `failed` requires a non-null reason: `khach_vang`, `sai_dia_chi`, `hang_hong` or `tu_choi`. Invalid payloads return `422`.
- Multipart photo upload uses field **`photo`**; Excel import uses **`file`**.

Regenerate the snapshot from `apps/api`:

```bash
uv run --locked python -c 'from greenlogix_api.main import dump_openapi; dump_openapi()'
```

## Distances & Emissions

- Road km goes through `RoadBaseline` (`greenlogix_api.solver.road_baseline`). Production default is Valhalla **truck** → OSRM driving → haversine × `HCMC_CIRCUITY` **1.35**, with two retries and a 5-minute matrix cache. Same provider on the spreadsheet-order baseline and the clustered NN+2-opt plan (not a Google comparison). `ROAD_BASELINE=google` without a key stays on OSM. Pytest pins `ROAD_BASELINE=circuity`. Times are naive local `HH:MM` (`TZ=Asia/Ho_Chi_Minh`).
- Eco-cost: `GREENLOGIX_ECO_WEIGHT` in `[0,1]` (live worker defaults to `1`) assigns the lower-TTW `xe_tai_nho` first and blends kg CO₂ into NN+2-opt. Reported km / litres / kg CO₂ stay tank-to-wheel physical units.
- CO₂ is tank-to-wheel: `kg_co2 = road_km * (l_per_100km/100) * kg_co2_per_litre` from `data/emission_factors.json` (petrol 2.31, diesel 2.68). This is a contest TTW estimate, not a full ISO 14083 audit report.

## Seed & Dispatcher

```bash
cd apps/api
GREENLOGIX_DEMO=1 uv run python -m greenlogix_api.seed
```

Writes 80 inner-HCMC orders + 10 trucks (one `maintenance`) into `data/greenlogix.db` and refreshes `apps/api/data/seed/hcmc_80_orders.xlsx`. Depot: Tân Bình DC `10.801, 106.661`.

Dispatcher (OSM tiles): Open `http://127.0.0.1:8000/dispatcher` in browser (or behind Cloudflare Pages / reverse proxy). Seed → Optimize → Leaflet OSM route map → Publish → Export `report.xlsx`.

## Tests

```bash
cd apps/api
uv sync --locked
uv run --locked pytest -q
uv run --locked ruff check src tests
```
