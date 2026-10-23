"""Analytics core: pure KPI formulas + DuckDB-over-SQLite aggregation (C-01).

``metrics`` holds the standards-cited pure formulas, ``queries`` the DB
aggregation and the CR §4.2–§4.4 payload builders, ``router`` the HTTP surface.
"""

from __future__ import annotations

from greenlogix_api.analytics.router import router

__all__ = ["router"]
