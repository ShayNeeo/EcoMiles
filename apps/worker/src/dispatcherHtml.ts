export const DISPATCHER_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>EcoMiles — Điều hành tuyến (Cloudflare 24/7)</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin=""/>
  <script src="https://unpkg.com/lucide@0.475.0/dist/umd/lucide.min.js"></script>
  <style>
    :root {
      --ink: #080f0c;
      --panel: #0e1a14;
      --panel-hover: #14261d;
      --line: #1c3629;
      --line-subtle: #12241b;
      --text: #eaf2e7;
      --mut: #8da697;
      --lime: #ffd400;
      --mint: #36d9a5;
      --danger: #ef4444;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; background: var(--ink); color: var(--text); font: 13.5px/1.45 "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif; }
    
    header {
      display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;
      padding: 12px 18px; border-bottom: 1px solid var(--line); background: #0a1410;
      position: sticky; top: 0; z-index: 20;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand h1 { margin: 0; font-size: 1.15rem; letter-spacing: .02em; }
    .brand span { color: var(--lime); }
    .badge-edge {
      background: rgba(54, 217, 165, 0.12); color: var(--mint); border: 1px solid rgba(54, 217, 165, 0.3);
      font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; text-transform: uppercase;
    }
    
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    button, a.btn-link {
      background: var(--lime); color: #080f0c; border: 0; border-radius: 999px;
      padding: 7px 14px; font-weight: 700; cursor: pointer; transition: all .15s ease;
      display: inline-flex; align-items: center; gap: 6px; font-size: 13px; text-decoration: none;
    }
    button.ghost, a.btn-link.ghost { background: transparent; color: var(--text); border: 1px solid var(--line); }
    button:hover, a.btn-link:hover { filter: brightness(1.1); transform: translateY(-1px); }
    button:active, a.btn-link:active { transform: translateY(0); }
    
    #status {
      color: var(--mint); font-weight: 600; margin: 0 0 10px; font-size: 12.5px;
      display: flex; align-items: center; gap: 6px;
    }
    
    main { display: grid; grid-template-columns: 380px 1fr; height: calc(100dvh - 59px); overflow: hidden; }
    @media (max-width: 960px) { main { grid-template-columns: 1fr; height: auto; overflow: visible; } }
    
    aside {
      padding: 14px; border-right: 1px solid var(--line); background: var(--panel);
      display: flex; flex-direction: column; overflow-y: auto; gap: 12px;
    }
    
    .kpis { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .kpi {
      background: #080f0c; border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px;
      display: flex; flex-direction: column;
    }
    .kpi span { color: var(--mut); font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; }
    .kpi b { font-size: 1.25rem; color: var(--lime); line-height: 1.2; margin-top: 2px; }
    
    .benchmark-table {
      width: 100%; border-collapse: collapse; font-size: 12px; background: #080f0c;
      border: 1px solid var(--line); border-radius: 10px; overflow: hidden;
    }
    .benchmark-table th, .benchmark-table td { padding: 6px 8px; border-bottom: 1px solid var(--line-subtle); text-align: left; }
    .benchmark-table th { color: var(--mut); font-size: 11px; }
    .delta { color: var(--mint); font-weight: 700; }
    
    /* Tabs */
    .tabs { display: flex; border-bottom: 1px solid var(--line); gap: 4px; margin-top: 4px; }
    .tab-btn {
      background: transparent; color: var(--mut); border: 0; border-radius: 6px 6px 0 0;
      padding: 6px 12px; cursor: pointer; font-weight: 600; font-size: 12.5px;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .tab-btn.active { color: var(--lime); background: #080f0c; border: 1px solid var(--line); border-bottom-color: #080f0c; }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* Vehicle chips filter */
    .filter-bar {
      position: absolute; top: 12px; left: 60px; z-index: 1000;
      background: rgba(14, 26, 20, 0.88); backdrop-filter: blur(8px);
      border: 1px solid var(--line); border-radius: 999px; padding: 4px 8px;
      display: flex; gap: 6px; align-items: center; max-width: calc(100% - 80px); overflow-x: auto;
    }
    .chip {
      background: #080f0c; color: var(--text); border: 1px solid var(--line); border-radius: 999px;
      padding: 3px 10px; font-size: 11.5px; cursor: pointer; white-space: nowrap; transition: all .15s ease;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .chip.active { background: var(--lime); color: #080f0c; font-weight: 700; border-color: var(--lime); }
    .chip-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* Map container */
    #map-wrapper { position: relative; width: 100%; height: 100%; }
    #map { width: 100%; height: 100%; min-height: 480px; }
    
    /* Route Cards */
    .route-card {
      background: #080f0c; border: 1px solid var(--line); border-radius: 8px; padding: 10px;
      margin-bottom: 8px; cursor: pointer; transition: all .15s ease;
    }
    .route-card:hover { border-color: var(--mint); background: var(--panel-hover); }
    .route-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .route-plate { font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px; }
    .route-meta { font-size: 11.5px; color: var(--mut); }
    .progress-bar { height: 5px; background: var(--line); border-radius: 3px; overflow: hidden; margin-top: 6px; }
    .progress-fill { height: 100%; background: var(--mint); border-radius: 3px; }
    .progress-fill.overload { background: var(--danger); }
    
    /* Stop items */
    .stop-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .stop-item {
      background: #080f0c; border: 1px solid var(--line-subtle); border-radius: 6px; padding: 6px 8px;
      display: flex; justify-content: space-between; align-items: center; font-size: 12px;
    }
    .stop-left { display: flex; align-items: center; gap: 6px; overflow: hidden; }
    .stop-seq {
      width: 20px; height: 20px; border-radius: 50%; background: var(--line);
      color: var(--text); font-size: 10.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stop-address { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .badge-status {
      font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
    }
    .badge-pending { background: #1e293b; color: #94a3b8; }
    .badge-arrived { background: #713f12; color: #fde047; }
    .badge-delivered { background: #064e3b; color: #6ee7b7; }
    .badge-failed { background: #7f1d1d; color: #fca5a5; }
    .badge-ban {
      background: #7c2d12; color: #fdba74; font-size: 9.5px; padding: 2px 5px; border-radius: 3px;
      margin-left: 4px; display: inline-flex; align-items: center; gap: 3px; font-weight: 700;
    }

    /* Custom Leaflet Markers */
    .leaflet-container { background: #080f0c; }
    .leaflet-popup-content-wrapper { background: #0e1a14; color: #eaf2e7; border: 1px solid var(--line); border-radius: 8px; }
    .leaflet-popup-tip { background: #0e1a14; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <i data-lucide="layers" style="width:20px;height:20px;color:var(--lime)"></i>
      <h1>ECO<span>MILES</span></h1>
      <span class="badge-edge">Cloudflare 24/7</span>
    </div>
    <div class="row">
      <button id="btn-seed" type="button">
        <i data-lucide="database" style="width:14px;height:14px"></i>
        <span>Seed 80/10</span>
      </button>
      <button id="btn-optimize" type="button">
        <i data-lucide="zap" style="width:14px;height:14px"></i>
        <span>Tối ưu tuyến</span>
      </button>
      <button id="btn-publish" type="button">
        <i data-lucide="send" style="width:14px;height:14px"></i>
        <span>Publish tài xế</span>
      </button>
      <a href="/driver" class="btn-link ghost">
        <i data-lucide="smartphone" style="width:14px;height:14px;color:var(--mint)"></i>
        <span>App tài xế</span>
      </a>
      <button id="btn-refresh" class="ghost" type="button" title="Làm mới">
        <i data-lucide="rotate-cw" style="width:14px;height:14px"></i>
      </button>
      <button id="btn-xlsx" class="ghost" type="button">
        <i data-lucide="file-spreadsheet" style="width:14px;height:14px"></i>
        <span>CSV Báo cáo</span>
      </button>
    </div>
  </header>

  <main>
    <aside>
      <div id="status">
        <i data-lucide="check-circle-2" style="width:15px;height:15px;color:var(--mint)"></i>
        <span id="status-text">Đang kết nối Cloudflare Edge...</span>
      </div>

      <div class="kpis">
        <div class="kpi"><span>Km tối ưu</span><b id="km">0</b></div>
        <div class="kpi"><span>Nhiên liệu (L)</span><b id="litres">0</b></div>
        <div class="kpi"><span>CO₂ (TTW kg)</span><b id="kg_co2">0</b></div>
      </div>

      <table class="benchmark-table">
        <thead>
          <tr><th>Đối chuẩn</th><th>km</th><th>lít</th><th>kg CO₂</th></tr>
        </thead>
        <tbody>
          <tr><th>Zig-zag cơ sở</th><td id="base-km">0</td><td id="base-litres">0</td><td id="base-co2">0</td></tr>
          <tr><th>EcoMiles</th><td id="opt-km">0</td><td id="opt-litres">0</td><td id="opt-co2">0</td></tr>
          <tr><th>Hiệu quả Δ %</th><td id="pct-km" class="delta">0%</td><td id="pct-litres" class="delta">0%</td><td id="pct-co2" class="delta">0%</td></tr>
        </tbody>
      </table>
      <p class="note" id="road-baseline-note" style="font-size:11px;color:var(--mut);line-height:1.45;margin:8px 0 4px">
        Google-class road km = OSM network (Valhalla auto/truck, else OSRM driving) for now — not a Google key.
        Zig-zag cơ sở is Excel stop order vs NN+2-opt, not Google. Fallback: haversine × 1.35.
        CO₂ TTW: km × (L/100km) × kg/L. Optional eco-cost: ECOMILES_ECO_WEIGHT.
      </p>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('routes')">
          <i data-lucide="route" style="width:13px;height:13px"></i>
          <span>Tuyến xe (<span id="route-count">0</span>)</span>
        </button>
        <button class="tab-btn" onclick="switchTab('stops')">
          <i data-lucide="map-pin" style="width:13px;height:13px"></i>
          <span>Điểm dừng (<span id="stop-count">0</span>)</span>
        </button>
        <button class="tab-btn" onclick="switchTab('vehicles')">
          <i data-lucide="truck" style="width:13px;height:13px"></i>
          <span>Đội xe (<span id="vehicle-count">0</span>)</span>
        </button>
      </div>

      <div id="tab-routes" class="tab-pane active">
        <div id="routes-container" style="display:flex;flex-direction:column;gap:6px;margin-top:6px;"></div>
      </div>

      <div id="tab-stops" class="tab-pane">
        <div class="row" style="margin:8px 0">
          <input id="q" type="search" placeholder="Tìm địa chỉ, SĐT..." style="flex:1;background:#080f0c;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px 8px;font-size:12.5px;"/>
          <label style="font-size:11.5px;display:flex;align-items:center;gap:4px;"><input id="late" type="checkbox"/> Cận giờ</label>
        </div>
        <ul id="stop-items" class="stop-list"></ul>
      </div>

      <div id="tab-vehicles" class="tab-pane">
        <div id="vehicles-container" style="display:flex;flex-direction:column;gap:6px;margin-top:6px;"></div>
      </div>
    </aside>

    <div id="map-wrapper">
      <div class="filter-bar" id="filter-bar">
        <span style="font-size:11px;color:var(--mut);margin-right:2px;">Lọc xe:</span>
        <div class="chip active" onclick="filterVehicle('all')">Tất cả xe</div>
        <div id="vehicle-chips" style="display:inline-flex;gap:4px;"></div>
      </div>
      <div id="map" aria-label="Bản đồ định tuyến đường bộ OSM"></div>
    </div>
  </main>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""></script>
  <script>
    const AUTH = { "Authorization": "Bearer DEMO" };
    let activeVehicleId = 'all';
    let globalRoutes = [];
    let polylines = [];
    let markers = [];
    const geomCache = new Map();

    function safeCreateIcons() {
      if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
        try { lucide.createIcons(); } catch (e) { console.warn("lucide error:", e); }
      }
    }

    let map = null;
    if (typeof L !== 'undefined') {
      try {
        map = L.map("map", { zoomControl: false }).setView([10.776, 106.700], 12);
        L.control.zoom({ position: "bottomright" }).addTo(map);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
      } catch (e) {
        console.error("Map init error:", e);
      }
    } else {
      console.warn("Leaflet library is not available");
    }

    function setStatus(text) {
      const el = document.getElementById("status-text");
      if (el) el.textContent = text;
      safeCreateIcons();
    }
    function num(v) { return Number(v || 0).toFixed(2); }
    function esc(v) { return (v == null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
      safeCreateIcons();
    }

    // HCMC Truck Ban Rules (Quy định 23/2018/QĐ-UBND)
    function isHcmcTruckBan(windowStart, windowEnd) {
      if (!windowStart || !windowEnd) return false;
      const s = parseInt(windowStart.split(":")[0], 10);
      const e = parseInt(windowEnd.split(":")[0], 10);
      return (s < 9 && e > 6) || (s < 20 && e > 16);
    }

    async function api(path, opts) {
      const target = path.startsWith('/api') ? path : ('/api' + (path.startsWith('/') ? path : '/' + path));
      const res = await fetch(target, Object.assign({ headers: Object.assign({ "Content-Type": "application/json" }, AUTH) }, opts || {}));
      if (!res.ok) throw new Error(target + " " + res.status);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) return res.json();
      return res.text();
    }

    // Micro-routing Turn-by-Turn Pathfinding via OSRM with local cache & fallback
    async function fetchRoadGeometry(stops) {
      if (!stops || stops.length < 2) return stops.map(s => [s.lat, s.lng]);
      const coordStr = stops.map(s => s.lng.toFixed(5) + "," + s.lat.toFixed(5)).join(";");
      if (geomCache.has(coordStr)) return geomCache.get(coordStr);

      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch("https://router.project-osrm.org/route/v1/driving/" + coordStr + "?overview=full&geometries=geojson", { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          if (data.code === "Ok" && data.routes && data.routes[0] && data.routes[0].geometry) {
            const roadLatLngs = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            geomCache.set(coordStr, roadLatLngs);
            return roadLatLngs;
          }
        }
      } catch (err) {
        // Fallback to straight lines
      }
      return stops.map(s => [s.lat, s.lng]);
    }

    function createMarkerIcon(seq, color, isDepot, status) {
      if (isDepot) {
        return L.divIcon({
          className: "depot-marker",
          html: '<div style="background:#ffd400;color:#07110c;font-size:12px;font-weight:900;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px #ffd400;border:2px solid #fff">DC</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
      }
      const borderColor = status === 'delivered' ? '#36d9a5' : (status === 'failed' ? '#ef4444' : '#fff');
      return L.divIcon({
        className: "stop-icon",
        html: '<div style="background:' + color + ';color:#07110c;font-weight:800;font-size:10.5px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.5);border:2px solid ' + borderColor + '">' + seq + '</div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    }

    async function drawRoutes(routes) {
      if (!map) return;
      polylines.forEach(p => map.removeLayer(p));
      markers.forEach(m => map.removeLayer(m));
      polylines = [];
      markers = [];
      const bounds = [];

      const filteredRoutes = activeVehicleId === 'all'
        ? routes
        : routes.filter(r => String(r.vehicle_id) === String(activeVehicleId));

      for (const route of filteredRoutes) {
        const stops = (route.stops || []).filter(s => s.lat != null && s.lng != null);
        if (!stops.length) continue;

        // Draw initial straight line for 0ms instant feedback
        const rawCoords = stops.map(s => [s.lat, s.lng]);
        const line = L.polyline(rawCoords, { color: route.color || "#36d9a5", weight: 3.5, opacity: 0.85 }).addTo(map);
        polylines.push(line);
        rawCoords.forEach(ll => bounds.push(ll));

        // Asynchronously snap to real road network geometry
        fetchRoadGeometry(stops).then(roadCoords => {
          if (roadCoords && roadCoords.length > 2) {
            line.setLatLngs(roadCoords);
          }
        });

        // Add markers
        stops.forEach((stop, idx) => {
          const isDepot = stop.kind === "depot";
          const icon = createMarkerIcon(idx, route.color || "#36d9a5", isDepot, stop.status);
          const banNotice = isHcmcTruckBan(stop.window_start, stop.window_end)
            ? '<span style="color:#f59e0b;font-weight:700">⚠️ Giờ cấm tải TP.HCM (06-09h / 16-20h)</span><br/>'
            : '';
          const m = L.marker([stop.lat, stop.lng], { icon })
            .bindPopup('<b>' + (isDepot ? 'Kho Tân Bình DC' : 'Điểm #' + idx + ': ' + esc(stop.address)) + '</b><br/>' +
                       'Xe: ' + esc(route.plate) + '<br/>' +
                       'Tải: ' + stop.kg + ' kg (' + esc(stop.window_start || '') + ' - ' + esc(stop.window_end || '') + ')<br/>' +
                       banNotice +
                       'Trạng thái: <b>' + esc(stop.status || 'pending') + '</b>')
            .addTo(map);
          markers.push(m);
        });
      }

      if (bounds.length) map.fitBounds(bounds, { padding: [30, 30] });
    }

    function renderVehicleChips(routes) {
      const c = document.getElementById("vehicle-chips");
      c.innerHTML = "";
      for (const r of routes || []) {
        const div = document.createElement("div");
        div.className = "chip" + (String(activeVehicleId) === String(r.vehicle_id) ? " active" : "");
        div.innerHTML = '<span class="chip-dot" style="background:' + r.color + '"></span>' + esc(r.plate);
        div.onclick = () => filterVehicle(r.vehicle_id);
        c.appendChild(div);
      }
    }

    function filterVehicle(vid) {
      activeVehicleId = vid;
      document.querySelectorAll(".chip").forEach(el => el.classList.remove("active"));
      if (vid === 'all') {
        document.querySelector(".chip").classList.add("active");
      }
      renderVehicleChips(globalRoutes);
      drawRoutes(globalRoutes);
    }

    function renderRouteCards(routes) {
      const container = document.getElementById("routes-container");
      container.innerHTML = "";
      document.getElementById("route-count").textContent = (routes || []).length;
      
      let totalStops = 0;
      for (const r of routes || []) {
        const stopsCount = (r.stops || []).filter(s => s.kind !== 'depot').length;
        totalStops += stopsCount;
        const totalKg = (r.stops || []).reduce((acc, s) => acc + (s.kg || 0), 0);
        
        const card = document.createElement("div");
        card.className = "route-card";
        card.innerHTML =
          '<div class="route-header">' +
            '<span class="route-plate"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + r.color + '"></span>' + esc(r.plate) + '</span>' +
            '<span class="badge-status ' + (r.published ? 'badge-delivered' : 'badge-pending') + '">' + (r.published ? 'ĐÃ PHÁT' : 'CHỜ DUYỆT') + '</span>' +
          '</div>' +
          '<div class="route-meta">' +
            num(r.km) + ' km · ' + num(r.litres) + ' L · ' + num(r.kg_co2) + ' kg CO₂ · ' + stopsCount + ' điểm' +
          '</div>' +
          '<div class="progress-bar">' +
            '<div class="progress-fill ' + (r.overload ? 'overload' : '') + '" style="width:' + Math.min(100, (totalKg / 1000) * 100) + '%"></div>' +
          '</div>';
        card.onclick = () => filterVehicle(r.vehicle_id);
        container.appendChild(card);
      }
      document.getElementById("stop-count").textContent = totalStops;
    }

    async function refreshReport() {
      const r = await api("/report");
      const b = r.baseline || {};
      const o = r.optimized || {};
      const d = r.delta || {};
      document.getElementById("base-km").textContent = num(b.km);
      document.getElementById("base-litres").textContent = num(b.litres);
      document.getElementById("base-co2").textContent = num(b.kg_co2);
      document.getElementById("opt-km").textContent = num(o.km);
      document.getElementById("opt-litres").textContent = num(o.litres);
      document.getElementById("opt-co2").textContent = num(o.kg_co2);
      document.getElementById("pct-km").textContent = num(d.km_pct) + "%";
      document.getElementById("pct-litres").textContent = num(d.litres_pct) + "%";
      document.getElementById("pct-co2").textContent = num(d.kg_co2_pct) + "%";
      document.getElementById("km").textContent = num(o.km);
      document.getElementById("litres").textContent = num(o.litres);
      document.getElementById("kg_co2").textContent = num(o.kg_co2);
      const note = document.getElementById("road-baseline-note");
      if (note) {
        const provider = r.distance_provider || "circuity";
        const eco = r.eco_weight == null ? "0" : String(r.eco_weight);
        note.textContent =
          "Live road km: " + provider +
          " (Valhalla truck / OSRM driving, circuity fallback). Google Directions key later, same RoadBaseline." +
          " Zig-zag cơ sở is Excel order vs NN+2-opt, not Google. Eco-weight " + eco +
          " (TTW kg CO₂).";
      }
    }

    async function refreshRoutes() {
      const routes = await api("/routes");
      globalRoutes = routes || [];
      renderVehicleChips(globalRoutes);
      renderRouteCards(globalRoutes);
      drawRoutes(globalRoutes);
      renderStopsList(globalRoutes);
      return routes;
    }

    function renderStopsList(routes) {
      const ul = document.getElementById("stop-items");
      ul.innerHTML = "";
      for (const r of routes || []) {
        for (const s of r.stops || []) {
          if (s.kind === 'depot') continue;
          const li = document.createElement("li");
          li.className = "stop-item";
          const hasBan = isHcmcTruckBan(s.window_start, s.window_end);
          li.innerHTML =
            '<div class="stop-left">' +
              '<span class="stop-seq" style="background:' + r.color + ';color:#000">' + s.seq + '</span>' +
              '<div style="display:flex;flex-direction:column">' +
                '<span class="stop-address" title="' + esc(s.address) + '">' + esc(s.address) + '</span>' +
                '<span style="font-size:10px;color:var(--mut)">' + esc(r.plate) + ' · ' + esc(s.window_start || '') + '-' + esc(s.window_end || '') + (hasBan ? '<span class="badge-ban"><i data-lucide="shield-alert" style="width:10px;height:10px"></i> Cấm tải</span>' : '') + '</span>' +
              '</div>' +
            '</div>' +
            '<span class="badge-status badge-' + esc(s.status || 'pending') + '">' + esc(s.status || 'pending') + '</span>';
          ul.appendChild(li);
        }
      }
      safeCreateIcons();
    }

    async function refreshVehicles() {
      const vehicles = await api("/vehicles");
      document.getElementById("vehicle-count").textContent = (vehicles || []).length;
      const c = document.getElementById("vehicles-container");
      c.innerHTML = "";
      for (const v of vehicles || []) {
        const item = document.createElement("div");
        item.className = "stop-item";
        item.innerHTML =
          '<div><b>' + esc(v.plate) + '</b> <span style="color:var(--mut)">(' + v.capacity_kg + ' kg' + (v.type ? ' · ' + esc(v.type) : '') + ')</span></div>' +
          '<span class="badge-status ' + (v.status === 'ready' ? 'badge-delivered' : 'badge-failed') + '">' + esc(v.status) + '</span>';
        c.appendChild(item);
      }
    }

    // Action handlers
    document.getElementById("btn-seed").onclick = async () => {
      try {
        setStatus("Đang nạp 80 đơn hàng chuẩn & tối ưu tuyến trên Cloudflare D1...");
        const body = await api("/seed", { method: "POST" });
        await Promise.all([refreshRoutes(), refreshReport(), refreshVehicles()]);
        setStatus("Đã nạp dữ liệu & tối ưu thành công " + (body.orders || 80) + " đơn hàng trên " + (body.routes || 5) + " tuyến xe tải!");
      } catch (err) { setStatus(String(err)); }
    };

    document.getElementById("btn-optimize").onclick = async () => {
      try {
        setStatus("Đang chạy thuật toán VRPTW 2-Opt...");
        const body = await api("/optimize", { method: "POST", body: JSON.stringify({ cluster_radius_km: 3.0 }) });
        await Promise.all([refreshRoutes(), refreshReport()]);
        setStatus("Đã hoàn thành tối ưu " + (body.routes || []).length + " tuyến với VRPTW 2-Opt");
      } catch (err) { setStatus(String(err)); }
    };

    document.getElementById("btn-publish").onclick = async () => {
      try {
        const body = await api("/routes/publish", { method: "POST", body: JSON.stringify({ route_ids: [] }) });
        setStatus("Đã xuất bản " + (body || []).length + " tuyến cho ứng dụng tài xế");
        await refreshRoutes();
      } catch (err) { setStatus(String(err)); }
    };

    document.getElementById("btn-refresh").onclick = async () => {
      try {
        await Promise.all([refreshRoutes(), refreshReport(), refreshVehicles()]);
        setStatus("Đã đồng bộ dữ liệu thời gian thực từ Cloudflare D1");
      } catch (err) { setStatus(String(err)); }
    };

    document.getElementById("btn-xlsx").onclick = async () => {
      try {
        const res = await fetch("/api/report.csv", { headers: AUTH });
        if (!res.ok) throw new Error("/api/report.csv " + res.status);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ecomiles_co2_report.csv";
        a.click();
        URL.revokeObjectURL(url);
        setStatus("Đã tải tệp báo cáo phát thải ecomiles_co2_report.csv");
      } catch (err) { setStatus(String(err)); }
    };

    // Initial load
    Promise.all([refreshRoutes(), refreshReport(), refreshVehicles()]).then(async () => {
      const countEl = document.getElementById("route-count");
      if (countEl && (countEl.textContent === "0" || countEl.textContent === "")) {
        setStatus("Đang tự động nạp 80 đơn hàng & tối ưu tuyến ban đầu...");
        try {
          const body = await api("/seed", { method: "POST" });
          await Promise.all([refreshRoutes(), refreshReport(), refreshVehicles()]);
        } catch (e) {
          console.warn("Auto-seed error:", e);
        }
      }
      setStatus("Hệ thống sẵn sàng trên Cloudflare Edge 24/7");
      safeCreateIcons();
    }).catch(err => {
      console.error("Initial load error:", err);
      setStatus("Lỗi kết nối: " + (err.message || err));
      safeCreateIcons();
    });
  </script>
</body>
</html>
`;
