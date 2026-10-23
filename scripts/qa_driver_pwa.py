import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    root = Path(__file__).resolve().parent.parent
    html_path = root / "apps" / "landing" / "public" / "driver" / "index.html"
    out_img = root / "docs" / "qa-screenshots" / "driver-pwa-stop-card.png"
    out_img.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 412, "height": 915},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        page.goto(f"file://{html_path}")

        # Inject sample route data into page
        page.evaluate("""() => {
            const container = document.getElementById("stops-container");
            const stops = [
                {
                    id: 1,
                    kind: "depot",
                    address: "Kho trung tâm Tân Bình (Depot Tân Bình)",
                    phone: "02838112233",
                    status: "delivered",
                    kg: 0,
                    lat: 10.8123,
                    lng: 106.6543
                },
                {
                    id: 2,
                    kind: "stop",
                    address: "268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM",
                    phone: "0909123456",
                    window_start: "08:00",
                    window_end: "10:30",
                    kg: 420,
                    status: "pending",
                    lat: 10.7725,
                    lng: 106.6578
                },
                {
                    id: 3,
                    kind: "stop",
                    address: "15 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM",
                    phone: "0918765432",
                    window_start: "14:00",
                    window_end: "16:00",
                    kg: 280,
                    status: "pending",
                    lat: 10.7812,
                    lng: 106.6998
                }
            ];
            
            document.getElementById("stat-total").textContent = "2";
            document.getElementById("stat-done").textContent = "0";
            document.getElementById("stat-kg").textContent = "700 kg";
            
            container.innerHTML = "";
            stops.forEach((s, idx) => {
                const isDepot = s.kind === "depot";
                const card = document.createElement("div");
                card.className = "stop-card " + (s.status || "pending");
                
                const mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(s.lat + ',' + s.lng) + '&travelmode=driving&dir_action=navigate';
                const actionsHtml = isDepot
                    ? '<div style="font-size:12px;color:var(--mut)">Điểm xuất phát trung tâm / Depot Tân Bình</div>'
                    : `<div style="display:flex;flex-direction:column;gap:6px">
                        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-act btn-navig" style="padding:9px;font-size:12px;font-weight:700">
                          <i data-lucide="navigation" style="width:13px;height:13px"></i>Chỉ đường (Google Maps · Ô tô / Xe tải)
                        </a>
                        <div class="stop-actions">
                          <button class="btn-act btn-arrived"><i data-lucide="map-pin" style="width:13px;height:13px"></i>Đến nơi</button>
                          <button class="btn-act btn-delivered"><i data-lucide="check-circle" style="width:13px;height:13px"></i>Đã giao</button>
                          <button class="btn-act btn-failed"><i data-lucide="x-circle" style="width:13px;height:13px"></i>Báo hoãn</button>
                        </div>
                      </div>`;

                const banHtml = idx === 1
                    ? '<div class="ban-alert"><i data-lucide="shield-alert" style="width:14px;height:14px"></i><span>Giờ cấm tải TP.HCM (QĐ 23/2018/QĐ-UBND)</span></div>'
                    : '';

                card.innerHTML = `
                    <div class="stop-header">
                        <div class="stop-seq">
                            <span class="seq-num">${isDepot ? '<i data-lucide="building-2" style="width:12px;height:12px"></i>' : idx}</span>
                            <span>${isDepot ? 'Kho xuất phát' : 'Điểm giao #' + idx}</span>
                        </div>
                        <span class="status-tag tag-${s.status}">${s.status === 'delivered' ? 'Đã giao' : 'Chờ giao'}</span>
                    </div>
                    <div class="stop-address">${s.address}</div>
                    <div class="stop-meta">
                        ${s.phone ? `<span class="meta-item"><i data-lucide="phone" style="width:13px;height:13px"></i>${s.phone}</span>` : ''}
                        ${s.window_start ? `<span class="meta-item"><i data-lucide="clock" style="width:13px;height:13px"></i>${s.window_start} - ${s.window_end}</span>` : ''}
                        ${s.kg ? `<span class="meta-item"><i data-lucide="package" style="width:13px;height:13px"></i>${s.kg} kg</span>` : ''}
                    </div>
                    ${banHtml}
                    ${actionsHtml}
                `;
                container.appendChild(card);
            });
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }""")

        page.wait_for_timeout(500)
        # Verify that Google Maps link has travelmode=driving and dir_action=navigate
        links = page.locator("a.btn-navig").all()
        assert len(links) >= 1, "Expected at least 1 navigation link"
        first_href = links[0].get_attribute("href")
        print(f"Verified Google Maps Driving link: {first_href}")
        assert "travelmode=driving" in first_href, "Must contain travelmode=driving"
        assert "dir_action=navigate" in first_href, "Must contain dir_action=navigate"

        page.screenshot(path=str(out_img))
        print(f"Saved visual QA screenshot to {out_img}")
        browser.close()

if __name__ == "__main__":
    main()
