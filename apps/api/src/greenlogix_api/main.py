"""EcoMiles API — CORS, lifespan, frozen routes, demo flag (D-19)."""

from __future__ import annotations

import json
import logging
import math
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import Session

from greenlogix_api.analytics import router as analytics_router
from greenlogix_api.auth import require_dispatcher
from greenlogix_api.db import DATA_DIR, get_session, init_db
from greenlogix_api.http_limits import MaxRequestBodyMiddleware
from greenlogix_api.routers import driver, optimize, orders, places, report, vehicles
from greenlogix_api.schemas import HealthOut, SeedOut
from greenlogix_api.seed import seed_database

log = logging.getLogger("ecomiles")

API_ROOT = Path(__file__).resolve().parents[2]
OPENAPI_PATH = API_ROOT / "openapi.json"
templates = Jinja2Templates(directory=str(API_ROOT / "templates"))

# Load local .env defaults (e.g. ECOMILES_DEMO=1 or GREENLOGIX_DEMO=1) if present
_env_file = API_ROOT / ".env"
if _env_file.exists():
    import os

    for _line in _env_file.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    init_db()
    yield


def _cors_origins() -> list[str]:
    """CORS allowlist (P-08). Demo-only `*` when ECOMILES_DEMO=1 or GREENLOGIX_DEMO=1 and no
    explicit ECOMILES_CORS_ORIGINS; otherwise parse the comma-separated
    allowlist. Empty list = deny cross-origin (tests rely on same-origin).

    PROD (T-LOOP-AUTH): never use `*` in production. Set
    ECOMILES_CORS_ORIGINS=https://fleet.example.vn,https://ops.example.vn
    and ECOMILES_DEMO=0 (or unset). Explicit allowlist always wins over
    the demo wildcard. Evaluated once at import; restart after env change.
    """
    raw = (os.environ.get("ECOMILES_CORS_ORIGINS") or os.environ.get("GREENLOGIX_CORS_ORIGINS") or "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    if os.environ.get("ECOMILES_DEMO") == "1" or os.environ.get("GREENLOGIX_DEMO") == "1":
        return ["*"]
    return []


app = FastAPI(title="EcoMiles API", lifespan=lifespan, redirect_slashes=False)


@app.middleware("http")
async def normalize_path(request: Request, call_next):
    path = request.scope.get("path", "")
    if path.startswith("/api/") or path == "/api":
        path = path[4:] or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/") or "/"
    request.scope["path"] = path
    request.scope["raw_path"] = path.encode("ascii")
    return await call_next(request)


@app.exception_handler(RequestValidationError)
async def validation_error(
    _request: Request, error: RequestValidationError
) -> JSONResponse:
    errors = jsonable_encoder(
        error.errors(),
        custom_encoder={
            float: lambda value: value if math.isfinite(value) else str(value)
        },
    )
    return JSONResponse(status_code=422, content={"detail": errors})


# Body ceiling first so CORS stays outermost: a 413 must still carry CORS headers.
app.add_middleware(MaxRequestBodyMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(vehicles.router)
app.include_router(optimize.router)
app.include_router(driver.router)
app.include_router(report.router)
app.include_router(places.router)
app.include_router(analytics_router)


app.mount("/static", StaticFiles(directory=str(API_ROOT / "static")), name="static")

@app.get("/health", response_model=HealthOut)
def health() -> HealthOut:
    log.info("path=/health")
    try:  # offline-safe: manifest unreadable -> bare ok, still 200
        from greenlogix_api.geo import road_graph as _road_graph

        extra = _road_graph.road_graph_audit_extra()
        probe = _road_graph.health_check()  # no transport -> reachable False
        return HealthOut(
            status="ok",
            road_graph_version=extra.get("road_graph_version"),
            restriction_overlay_version=extra.get("restriction_overlay_version"),
            cost_model_version=extra.get("cost_model_version"),
            road_graph_reachable=bool(probe.get("reachable", False)),
        )
    except Exception:
        log.warning("path=/health road_graph manifest unavailable", exc_info=True)
        return HealthOut(status="ok")


@app.get("/favicon.ico")
def favicon() -> Response:
    return Response(status_code=204)


@app.get("/dispatcher", response_class=HTMLResponse)
def dispatcher(request: Request, _: None = Depends(require_dispatcher)) -> HTMLResponse:
    log.info("path=/dispatcher")
    return templates.TemplateResponse(request, "dispatcher.html")


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request, _: None = Depends(require_dispatcher)) -> HTMLResponse:
    log.info("path=/dashboard")
    return templates.TemplateResponse(request, "dashboard.html")

@app.post("/seed", response_model=SeedOut)
def seed(
    session: Session = Depends(get_session),
    _: None = Depends(require_dispatcher),
) -> SeedOut:
    log.info("path=/seed")
    return seed_database(session)


def dump_openapi(path: Path = OPENAPI_PATH) -> None:
    path.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
