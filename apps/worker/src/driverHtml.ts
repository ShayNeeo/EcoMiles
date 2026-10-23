export const DRIVER_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <title>EcoMiles — Ứng dụng tài xế (Driver PWA)</title>
  <script src="https://unpkg.com/lucide@0.475.0/dist/umd/lucide.min.js"></script>
  <style>
    :root {
      --bg: #070d0a;
      --card: #0e1713;
      --card-active: #15241e;
      --line: #1b2f25;
      --text: #e8f0e5;
      --mut: #8da496;
      --lime: #ffd400;
      --mint: #36d9a5;
      --danger: #ef4444;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; background: var(--bg); color: var(--text);
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
    }
    
    header {
      background: #09120e; border-bottom: 1px solid var(--line);
      padding: 12px 16px; position: sticky; top: 0; z-index: 30;
      display: flex; justify-content: space-between; align-items: center;
    }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand h1 { margin: 0; font-size: 1.05rem; font-weight: 800; letter-spacing: .02em; }
    .brand span { color: var(--lime); }
    .badge-driver {
      background: rgba(54, 217, 165, 0.12); color: var(--mint); border: 1px solid rgba(54, 217, 165, 0.3);
      font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 999px; text-transform: uppercase;
    }

    .vehicle-selector {
      background: var(--card); border: 1px solid var(--line); border-radius: 8px;
      color: var(--text); padding: 5px 10px; font-size: 13px; font-weight: 700; outline: none;
    }

    main { max-width: 540px; margin: 0 auto; padding: 14px 14px 80px; }
    
    /* Stats banner */
    .stats-bar {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px;
    }
    .stat-box {
      background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 10px;
      text-align: center;
    }
    .stat-box span { font-size: 11px; color: var(--mut); text-transform: uppercase; display: block; }
    .stat-box b { font-size: 1.25rem; color: var(--lime); line-height: 1.3; }

    /* Stops timeline */
    .stop-card {
      background: var(--card); border: 1px solid var(--line); border-radius: 12px;
      padding: 14px; margin-bottom: 10px; transition: all .15s ease;
      position: relative;
    }
    .stop-card.delivered { border-color: rgba(54, 217, 165, 0.4); opacity: 0.75; }
    .stop-card.arrived { border-color: rgba(255, 212, 0, 0.6); background: var(--card-active); }
    .stop-card.failed { border-color: rgba(239, 68, 68, 0.4); }

    .stop-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
    }
    .stop-seq {
      display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 13px;
    }
    .seq-num {
      width: 24px; height: 24px; border-radius: 50%; background: var(--line);
      display: flex; align-items: center; justify-content: center; font-size: 11.5px;
    }
    .status-tag {
      font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;
    }
    .tag-pending { background: #1e293b; color: #94a3b8; }
    .tag-arrived { background: #713f12; color: #fde047; }
    .tag-delivered { background: #064e3b; color: #6ee7b7; }
    .tag-failed { background: #7f1d1d; color: #fca5a5; }

    .stop-address { font-size: 14.5px; font-weight: 600; margin-bottom: 4px; }
    .stop-meta {
      display: flex; flex-wrap: wrap; gap: 12px; font-size: 12.5px; color: var(--mut); margin: 6px 0 12px;
    }
    .meta-item { display: inline-flex; align-items: center; gap: 4px; }
    .meta-item a { color: var(--mint); text-decoration: none; font-weight: 600; }
    
    .ban-alert {
      background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3);
      color: var(--amber); border-radius: 6px; padding: 4px 8px; font-size: 11.5px;
      margin-bottom: 10px; display: flex; align-items: center; gap: 6px; font-weight: 600;
    }

    /* Actions */
    .stop-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .btn-act {
      border: 0; border-radius: 8px; padding: 8px 6px; font-weight: 700; font-size: 12px;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;
      transition: all .15s ease;
    }
    .btn-arrived { background: #3b2805; color: #fde047; border: 1px solid #713f12; }
    .btn-delivered { background: #064e3b; color: #6ee7b7; border: 1px solid #047857; }
    .btn-failed { background: #450a0a; color: #fca5a5; border: 1px solid #991b1b; }
    .btn-act:hover { filter: brightness(1.2); }
    .btn-act:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-navig { background: #0f2744; color: #60a5fa; border: 1px solid #1e40af; text-decoration: none; width: 100%; box-sizing: border-box; }

    /* Empty state */
    .empty-card {
      background: var(--card); border: 1px dashed var(--line); border-radius: 12px;
      padding: 36px 20px; text-align: center; color: var(--mut);
    }

    /* Floating navigation */
    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0; background: #09120e;
      border-top: 1px solid var(--line); padding: 10px 16px; display: flex;
      justify-content: space-between; align-items: center; z-index: 30;
    }
    .btn-nav {
      background: transparent; border: 1px solid var(--line); color: var(--text);
      border-radius: 8px; padding: 7px 12px; font-size: 12.5px; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; gap: 6px; text-decoration: none;
    }
    .btn-nav:hover { background: var(--card); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <i data-lucide="truck" style="width:18px;height:18px;color:var(--lime)"></i>
      <h1>ECO<span>MILES</span></h1>
      <span class="badge-driver">Tài xế</span>
    </div>
    <select class="vehicle-selector" id="plate-select" onchange="loadDriverRoute()">
      <option value="51C-000.01">51C-000.01 (Tân Bình · Q3)</option>
      <option value="51C-000.02">51C-000.02 (Thủ Đức)</option>
      <option value="51C-000.03">51C-000.03 (Q7 · Nam Sài Gòn)</option>
      <option value="51C-000.04">51C-000.04 (Bình Thạnh)</option>
      <option value="51C-000.05">51C-000.05 (Phú Nhuận)</option>
    </select>
  </header>

  <main>
    <div class="stats-bar">
      <div class="stat-box">
        <span>Điểm dừng</span>
        <b id="stat-total">0</b>
      </div>
      <div class="stat-box">
        <span>Đã giao</span>
        <b id="stat-done" style="color:var(--mint)">0</b>
      </div>
      <div class="stat-box">
        <span>Khối lượng</span>
        <b id="stat-kg">0 kg</b>
      </div>
    </div>

    <div id="status-msg" style="color:var(--mint);font-size:12px;font-weight:600;margin-bottom:8px;"></div>

    <div id="stops-container">
      <div class="empty-card">
        <i data-lucide="loader-2" style="width:24px;height:24px;margin-bottom:8px;animation:spin 1s linear infinite"></i>
        <div>Đang tải lộ trình phân công...</div>
      </div>
    </div>
  </main>

  <div class="bottom-bar">
    <a href="/app" class="btn-nav">
      <i data-lucide="layout-dashboard" style="width:15px;height:15px"></i>
      <span>Bàn điều hành</span>
    </a>
    <button onclick="loadDriverRoute()" class="btn-nav" style="background:var(--lime);color:#080f0c;border:0;font-weight:700">
      <i data-lucide="rotate-cw" style="width:15px;height:15px"></i>
      <span>Đồng bộ</span>
    </button>
  </div>

  <script>
    const AUTH = { "Authorization": "Bearer DEMO", "X-Driver-Pin": "0000" };
    let currentStops = [];

    // Parse URL plate param if provided
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("plate")) {
      const p = urlParams.get("plate");
      const sel = document.getElementById("plate-select");
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === p) {
          sel.selectedIndex = i;
          break;
        }
      }
    }
    function esc(v) { return (v == null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

    function safeCreateIcons() {
      if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
        try { lucide.createIcons(); } catch (e) { console.warn("lucide error:", e); }
      }
    }

    function isHcmcTruckBan(start, end) {
      if (!start || !end) return false;
      const s = parseInt(start.split(":")[0], 10);
      const e = parseInt(end.split(":")[0], 10);
      return (s < 9 && e > 6) || (s < 20 && e > 16);
    }

    async function updateStop(stopId, status, reason = null) {
      const msg = document.getElementById("status-msg");
      msg.textContent = "Đang gửi cập nhật...";
      try {
        const res = await fetch("/api/stops/" + stopId + "/status", {
          method: "POST",
          headers: Object.assign({ "Content-Type": "application/json" }, AUTH),
          body: JSON.stringify({ status, reason })
        });
        if (!res.ok) throw new Error("Cập nhật thất bại (" + res.status + ")");
        msg.textContent = "Đã cập nhật trạng thái điểm #" + stopId + " thành: " + status;
        await loadDriverRoute();
      } catch (err) {
        msg.textContent = String(err);
      }
    }

    function onFailClick(stopId) {
      const reason = prompt("Nhập lý do giao không thành công:", "Khách vắng nhà / Không nghe máy");
      if (reason) {
        updateStop(stopId, "failed", reason);
      }
    }

    async function loadDriverRoute() {
      const plate = document.getElementById("plate-select").value;
      const container = document.getElementById("stops-container");
      try {
        const res = await fetch("/api/driver/route?plate=" + encodeURIComponent(plate), { headers: AUTH });
        if (!res.ok) throw new Error("Lỗi nạp lộ trình (" + res.status + ")");
        const data = await res.json();
        const route = (data.routes || [])[0] || null;
        
        if (!route || !route.stops || !route.stops.length) {
          container.innerHTML = '<div class="empty-card"><i data-lucide="inbox" style="width:32px;height:32px;margin-bottom:8px"></i><div>Chưa có lộ trình được xuất bản cho xe <b>' + esc(plate) + '</b>.<br/>Vui lòng liên hệ điều hành viên hoặc vào Bàn điều hành bấm <b>Publish tài xế</b>.</div></div>';
          document.getElementById("stat-total").textContent = "0";
          document.getElementById("stat-done").textContent = "0";
          document.getElementById("stat-kg").textContent = "0 kg";
          safeCreateIcons();
          return;
        }

        currentStops = route.stops;
        const totalStops = currentStops.filter(s => s.kind !== "depot").length;
        const doneStops = currentStops.filter(s => s.status === "delivered").length;
        const totalKg = currentStops.reduce((sum, s) => sum + (s.kg || 0), 0);

        document.getElementById("stat-total").textContent = totalStops;
        document.getElementById("stat-done").textContent = doneStops;
        document.getElementById("stat-kg").textContent = totalKg + " kg";

        container.innerHTML = "";
        currentStops.forEach((s, idx) => {
          const isDepot = s.kind === "depot";
          const card = document.createElement("div");
          card.className = "stop-card " + (s.status || "pending");
          
          const hasBan = isHcmcTruckBan(s.window_start, s.window_end);
          const banHtml = hasBan
            ? '<div class="ban-alert"><i data-lucide="shield-alert" style="width:14px;height:14px"></i><span>Giờ cấm tải TP.HCM (Quyết định 23/2018/QĐ-UBND)</span></div>'
            : '';

          const statusText = {
            pending: "Chờ giao",
            arrived: "Đã đến",
            delivered: "Đã giao",
            failed: "Thất bại"
          }[s.status || "pending"] || s.status;

          const mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(s.lat + ',' + s.lng) + '&travelmode=driving&dir_action=navigate';
          const actionsHtml = isDepot
            ? '<div style="font-size:12px;color:var(--mut)">Điểm xuất phát trung tâm / Depot Tân Bình</div>'
            : '<div style="display:flex;flex-direction:column;gap:6px">' +
                '<a href="' + mapsUrl + '" target="_blank" rel="noopener noreferrer" title="Google sẽ tính lại tuyến khi mở — không phải tuyến xe tải đã duyệt" class="btn-act btn-navig" style="padding:9px;font-size:12px;font-weight:700"><i data-lucide="navigation" style="width:13px;height:13px"></i>Chỉ đường (Google Maps · Ô tô)</a>' +
                '<div style="font-size:11px;color:var(--mut)">Google sẽ tính lại tuyến khi mở — đây là dẫn đường ô tô ngoài, không phải tuyến xe tải đã duyệt.</div>' +
                '<div class="stop-actions">' +
                  '<button class="btn-act btn-arrived" onclick="updateStop(' + s.id + ', \\'arrived\\')" ' + (s.status === "delivered" ? "disabled" : "") + '><i data-lucide="map-pin" style="width:13px;height:13px"></i>Đến nơi</button>' +
                  '<button class="btn-act btn-delivered" onclick="updateStop(' + s.id + ', \\'delivered\\')"><i data-lucide="check-circle" style="width:13px;height:13px"></i>Đã giao</button>' +
                  '<button class="btn-act btn-failed" onclick="onFailClick(' + s.id + ')"><i data-lucide="x-circle" style="width:13px;height:13px"></i>Báo hoãn</button>' +
                '</div>' +
              '</div>';

          card.innerHTML =
            '<div class="stop-header">' +
              '<div class="stop-seq">' +
                '<span class="seq-num">' + (isDepot ? '<i data-lucide="building-2" style="width:12px;height:12px"></i>' : idx) + '</span>' +
                '<span>' + (isDepot ? 'Kho xuất phát' : 'Điểm giao #' + idx) + '</span>' +
              '</div>' +
              '<span class="status-tag tag-' + (s.status || "pending") + '">' + esc(statusText) + '</span>' +
            '</div>' +
            '<div class="stop-address">' + esc(s.address) + '</div>' +
            '<div class="stop-meta">' +
              (s.phone ? '<span class="meta-item"><i data-lucide="phone" style="width:13px;height:13px"></i><a href="tel:' + encodeURIComponent(s.phone) + '">' + esc(s.phone) + '</a></span>' : '') +
              (s.window_start ? '<span class="meta-item"><i data-lucide="clock" style="width:13px;height:13px"></i>' + esc(s.window_start) + ' - ' + esc(s.window_end) + '</span>' : '') +
              (s.kg ? '<span class="meta-item"><i data-lucide="package" style="width:13px;height:13px"></i>' + s.kg + ' kg</span>' : '') +
            '</div>' +
            banHtml +
            actionsHtml;

          container.appendChild(card);
        });

        safeCreateIcons();
      } catch (err) {
        container.innerHTML = '<div class="empty-card" style="color:var(--danger)">' + String(err) + '</div>';
      }
    }

    loadDriverRoute();
  </script>
</body>
</html>
`;
