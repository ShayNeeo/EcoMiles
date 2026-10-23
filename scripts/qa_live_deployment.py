import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    root = Path(__file__).resolve().parent.parent
    qa_dir = root / "docs" / "qa-screenshots"
    qa_dir.mkdir(parents=True, exist_ok=True)

    urls = [
        ("landing-live.png", "https://main.cargox-group-3qm.pages.dev/", 1440, 900, False),
        ("dispatcher-live.png", "https://main.cargox-group-3qm.pages.dev/app/", 1280, 800, False),
        ("driver-live.png", "https://main.cargox-group-3qm.pages.dev/driver/", 412, 915, True),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for filename, url, w, h, is_mobile in urls:
            context = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2,
                is_mobile=is_mobile,
                has_touch=is_mobile,
            )
            page = context.new_page()
            print(f"Navigating to {url}...")
            response = page.goto(url, wait_until="networkidle", timeout=30000)
            status = response.status if response else "Unknown"
            print(f"  Status: {status}")
            assert status == 200, f"Expected 200 OK for {url}, got {status}"

            page.wait_for_timeout(1000)
            out_path = qa_dir / filename
            page.screenshot(path=str(out_path), full_page=False)
            print(f"  Screenshot saved to {out_path}")
            context.close()

        browser.close()
    print("All live deployment visual QA/QC checks passed successfully!")

if __name__ == "__main__":
    main()
