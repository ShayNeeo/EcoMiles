"""Dashboard page + vendored ECharts (C-02, CR-20261018-001 §4.5).

Offline by construction: every assertion here reads the repo or the mounted
StaticFiles — no network is used, so the "network cable pulled" requirement is
tested rather than asserted.

The page's data keys are the frozen §4.2–§4.4 keys; the HTML comment above the
script tag lists them, and the display labels are pinned below (metric + unit per
chart, the §4.5 footer block, and the null/n-a state).
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from fastapi.testclient import TestClient

from greenlogix_api.main import API_ROOT, app

AUTH = {"Authorization": "Bearer DEMO"}

VENDOR_DIR = API_ROOT / "static" / "vendor"
ECHARTS_PATH = VENDOR_DIR / "echarts.min.js"
LICENSE_PATH = VENDOR_DIR / "echarts.LICENSE.txt"

# CR §4.5: area, bar, donut, line, map, scatter, stacked.
CHART_IDS = ("c-area", "c-bar", "c-donut", "c-line", "c-map", "c-scatter", "c-stacked")
# Mandatory footer: dataset label + seed + factor set + boundary + routing_quality.
LABEL_IDS = ("lbl-dataset", "lbl-seed", "lbl-factors", "lbl-boundary", "lbl-routing")
ANALYTICS_CALLS = ("/analytics/kpis", "/analytics/timeseries", "/analytics/fleet")

MIN_BYTES = 500 * 1024

def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def test_dashboard_200_with_dispatcher_auth(demo_client) -> None:
    response = demo_client.get("/dashboard", headers=AUTH)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")

def test_dashboard_401_without_auth(monkeypatch) -> None:
    monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    with TestClient(app) as client:
        assert client.get("/dashboard").status_code == 401
        assert client.get("/dashboard", headers={"Authorization": "Bearer wrong"}).status_code == 401

def test_dashboard_401_with_wrong_bearer_when_demo_on(demo_client) -> None:
    assert demo_client.get("/dashboard", headers={"Authorization": "Bearer nope"}).status_code == 401

def test_page_loads_charts_from_the_local_script_and_no_remote_url(demo_client) -> None:
    html = demo_client.get("/dashboard", headers=AUTH).text
    assert '<script src="/static/vendor/echarts.min.js"></script>' in html
    lowered = html.lower()
    for host in ("cdn", "unpkg", "jsdelivr"):
        assert host not in lowered, f"dashboard.html must not reference {host}"
    # Only the vendored script may be loaded; nothing may be fetched cross-origin.
    assert re.findall(r"<script[^>]*src=[\"']([^\"']+)", html) == ["/static/vendor/echarts.min.js"]

def test_page_fetches_the_live_analytics_endpoints(demo_client) -> None:
    html = demo_client.get("/dashboard", headers=AUTH).text
    for path in ANALYTICS_CALLS:
        assert f'api("{path}' in html, f"dashboard must read live {path} JSON"
    assert 'Authorization": "Bearer DEMO' in html  # same dispatcher credential

def test_page_has_seven_chart_containers_and_the_footer_labels(demo_client) -> None:
    html = demo_client.get("/dashboard", headers=AUTH).text
    for chart_id in CHART_IDS:
        assert f'id="{chart_id}"' in html, f"missing chart container #{chart_id}"
    for label_id in LABEL_IDS:
        assert f'id="{label_id}"' in html, f"missing footer label #{label_id}"
    assert "modelled fuel, not measured" in html
    for field in ("factor_set", "boundary", "routing_quality", "seed"):
        assert field in html, f"footer must show {field}"

def test_page_labels_each_chart_with_metric_and_unit(demo_client) -> None:
    html = demo_client.get("/dashboard", headers=AUTH).text
    for unit in ("Đơn vị: km · L · kg CO₂e", "Đơn vị: km (trái) · L (phải)", "Đơn vị: L.",
                 "Đơn vị: %.", "Đơn vị: độ (lng/lat)", "Đơn vị: kg CO₂e."):
        assert unit in html, f"chart caption missing its unit: {unit}"

def test_page_has_png_csv_print_and_a_null_state(demo_client) -> None:
    html = demo_client.get("/dashboard", headers=AUTH).text
    assert "saveAsImage" in html  # ECharts toolbox PNG export
    assert 'id="btn-csv"' in html and 'id="btn-print"' in html  # Blob + window.print, no dependency
    assert "null-state" in html and "n/a — " in html  # null metrics are shown, never drawn as 0
    for note_id in ("note-stacked", "note-scatter"):  # partially-null charts say so per chart
        assert f'id="{note_id}"' in html
    assert "null" in html and "không bao giờ vẽ thành 0" in html

def test_vendored_echarts_is_large_enough_for_offline_use() -> None:
    assert ECHARTS_PATH.is_file(), f"missing vendored runtime: {ECHARTS_PATH}"
    size = ECHARTS_PATH.stat().st_size
    assert size > MIN_BYTES, f"echarts.min.js is {size} B, expected > {MIN_BYTES} B"
    # The UMD footer carries the version; the head is the Apache-2.0 banner.
    assert 'version="5.5.1"' in ECHARTS_PATH.read_text(encoding="utf-8")[-1000:]

def test_license_records_the_pinned_version_source_and_hash() -> None:
    record = LICENSE_PATH.read_text(encoding="utf-8")
    digest = _sha256(ECHARTS_PATH)
    assert "5.5.1" in record
    assert "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js" in record
    assert digest in record, "echarts.LICENSE.txt must record the sha256 of the shipped file"

def test_static_mount_serves_the_vendored_runtime_byte_for_byte(monkeypatch) -> None:
    """No network, no auth: the mounted file is the file on disk."""
    monkeypatch.delenv("GREENLOGIX_DEMO", raising=False)
    with TestClient(app) as client:
        response = client.get("/static/vendor/echarts.min.js")
    assert response.status_code == 200
    assert len(response.content) == ECHARTS_PATH.stat().st_size
    assert hashlib.sha256(response.content).hexdigest() == _sha256(ECHARTS_PATH)
