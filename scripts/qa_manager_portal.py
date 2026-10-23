from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    root = Path(__file__).resolve().parent.parent
    html_path = root / "apps" / "landing" / "public" / "app" / "index.html"
    out_img = root / "docs" / "qa-screenshots" / "dispatcher-portal-policy-cards.png"
    out_img.parent.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=1.5,
        )
        page = context.new_page()
        page.goto(f"file://{html_path}")

        # Inject sample data for visual verification
        page.evaluate("""() => {
            document.getElementById("status-text").textContent = "Đã kết nối OSM Valhalla Truck Engine (Đạt chuẩn GLEC 3.2)";
            document.getElementById("km").textContent = "142.6";
            document.getElementById("litres").textContent = "15.4";
            document.getElementById("kg_co2").textContent = "41.3";

            document.getElementById("base-km").textContent = "178.2";
            document.getElementById("base-litres").textContent = "19.6";
            document.getElementById("base-co2").textContent = "52.5";

            document.getElementById("opt-km").textContent = "142.6";
            document.getElementById("opt-litres").textContent = "15.4";
            document.getElementById("opt-co2").textContent = "41.3";

            document.getElementById("pct-km").textContent = "-20.0%";
            document.getElementById("pct-litres").textContent = "-21.4%";
            document.getElementById("pct-co2").textContent = "-21.3%";

            document.getElementById("route-count").textContent = "5";
            document.getElementById("stop-count").textContent = "80";
            document.getElementById("vehicle-count").textContent = "5";

            const rc = document.getElementById("routes-container");
            rc.innerHTML = `
                <div class="route-card" style="border-color:var(--mint);background:#102219">
                    <div class="route-header">
                        <span class="route-plate"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#36d9a5"></span>51C-000.01</span>
                        <span style="font-size:11px;color:var(--lime);font-weight:700">Tân Bình · Q10</span>
                    </div>
                    <div class="route-meta">16 điểm · 28.4 km · 3.1 L · 8.3 kg CO₂</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:78%"></div></div>
                </div>
                <div class="route-card">
                    <div class="route-header">
                        <span class="route-plate"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38bdf8"></span>51C-000.02</span>
                        <span style="font-size:11px;color:var(--mut)">Thủ Đức</span>
                    </div>
                    <div class="route-meta">18 điểm · 34.2 km · 3.8 L · 10.2 kg CO₂</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:85%"></div></div>
                </div>
            `;
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }""")

        page.wait_for_timeout(500)
        page.screenshot(path=str(out_img))
        print(f"Saved Dispatcher Portal QA screenshot to {out_img}")
        browser.close()

if __name__ == "__main__":
    main()
