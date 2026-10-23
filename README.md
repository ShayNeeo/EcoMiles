# 🚛 EcoMiles Platform

> **B2B SaaS Urban Logistics Optimization & ISO 14083 / GLEC Carbon Accounting**  
> Giải pháp tối ưu tuyến đường giao nhận đa ràng buộc (VRPTW) kết hợp kiểm kê và báo cáo phát thải CO₂ tự động cho bưu cục và doanh nghiệp vận tải đô thị.

[![Live Landing Page](https://img.shields.io/badge/Live_Demo-cargox--group.pages.dev-FFDA00?style=for-the-badge&logo=cloudflare&logoColor=black)](https://cargox-group-3qm.pages.dev)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Cloudflare_Pages-F38020?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/ShayNeeo/RND_to_Startup_2026/actions)

---

## 🏛️ Kiến Trúc Hệ Thống Monorepo (`pnpm-workspace`)

```text
.
├── AGENTS.md                 # Entry for every coding agent
├── rules/                    # Branching, CR, PR, QA, ownership (source of truth)
├── changes/                  # Filled change requests (feature → dev)
├── apps/
│   ├── landing/              # Marketing site (live)
│   ├── api/                  # FastAPI dispatcher + VRP (Phase 1)
│   ├── web-portal/           # Placeholder — do not invent Next.js without a CR
│   └── mobile-driver/        # Flutter driver (Phase 1)
├── packages/shared-types/
├── docs/
│   ├── contest/              # RND to Startup packet
│   └── planning/             # MVP, finance, brainstorm
├── .github/
│   ├── PULL_REQUEST_TEMPLATE/
│   ├── CODEOWNERS
│   └── workflows/            # CI on dev; landing verify on stable
├── pnpm-workspace.yaml
└── package.json
```

**Git:** `feature/*` or `cr/*` → **`dev`** (Change Request + PR) → QA → **`stable`** (production). Details: [`rules/branching.md`](rules/branching.md). Humans and agents: [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## 🛠️ Hướng Dẫn Phát Triển Local

### Yêu Cầu Cài Đặt
- **Node.js**: `>= 20.x`
- **pnpm**: `>= 10.x`

### Các Lệnh Thao Tác Cơ Bản
```bash
# 1. Cài đặt toàn bộ dependencies cho monorepo
pnpm install

# 2. Khởi chạy môi trường Dev cho Landing Page
pnpm run dev:landing

# 3. Build kiểm tra Landing Page
pnpm run build:landing

# 4. Preview bản build
pnpm run preview:landing
```

---

## 🚀 Hướng Dẫn Kích Hoạt CI/CD Tự Động (Cloudflare Pages)

Landing CI/verify runs on **`stable`** (production). Pull requests target **`dev`**. Promotion is `dev` → `stable` after QA (`rules/qa.md`). Do not push features to `main` (legacy alias of `stable`).

Để workflow hoạt động thành công, bạn chỉ cần thêm **2 Secret** vào GitHub Repository:

### 1. Lấy thông tin từ Cloudflare Dashboard:
1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Lấy `CLOUDFLARE_ACCOUNT_ID`**:
   - Chọn mục **Workers & Pages** ở thanh điều hướng bên trái.
   - Nhìn sang cột bên phải màn hình, copy chuỗi **Account ID** (dài 32 ký tự).
3. **Tạo `CLOUDFLARE_API_TOKEN`**:
   - Truy cập vào: [My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens).
   - Nhấn **Create Token** > Chọn template **Edit Cloudflare Workers** (hoặc Custom Token cấp quyền `Account > Cloudflare Pages > Edit`).
   - Nhấn **Continue to summary** > **Create Token** và copy mã token vừa sinh ra.

### 2. Thêm vào GitHub Repository Secrets:
1. Truy cập Repository trên GitHub: `https://github.com/ShayNeeo/RND_to_Startup_2026/settings/secrets/actions`.
2. Nhấn **New repository secret** và thêm 2 biến:
   - Tên: `CLOUDFLARE_ACCOUNT_ID` — Giá trị: *[Dán Account ID của bạn]*
   - Tên: `CLOUDFLARE_API_TOKEN` — Giá trị: *[Dán API Token của bạn]*
3. Nhấn **Add secret** để lưu.

Từ nay, mọi commit hoặc pull request merge vào `main` sẽ tự động cập nhật lên [https://cargox-group-3qm.pages.dev](https://cargox-group-3qm.pages.dev).

---

## 📜 Căn Cứ Pháp Lý & Định Hướng Phát Triển
- **Quyết định 2229/QĐ-TTg**: Kế hoạch phát triển dịch vụ logistics Việt Nam đến năm 2030, tầm nhìn 2050 (Ưu tiên chuyển đổi số & logistics xanh).
- **Quyết định 876/QĐ-TTg**: Chương trình chuyển đổi năng lượng xanh, giảm phát thải khí carbon ngành Giao thông vận tải đến Net Zero 2050.
- **Tiêu chuẩn ISO 14083 / GLEC Framework**: Phương pháp luận quốc tế về định lượng và báo cáo phát thải khí nhà kính trong chuỗi vận tải.
- **Nghị định 13/2023/NĐ-CP**: Tuân thủ tuyệt đối quy định bảo vệ dữ liệu cá nhân của tài xế và khách hàng.

---

## EcoMiles 72h contest demo

Contest loop on the HCMC 80/10 sample. Cold start needs **only** `ECOMILES_DEMO=1` (or `GREENLOGIX_DEMO=1`, optional `TZ=Asia/Ho_Chi_Minh`). No Mapbox, Goong, Google Maps, HERE, or OpenRouteService keys. Nominatim is **not** on this path — `apps/api/data/seed/hcmc_80_orders.xlsx` already has lat/lng.

**Auth (localhost-only, D-19):** dispatcher `Authorization: Bearer DEMO`, driver PIN `0000`. Do not expose this process on the public internet.

**Depot:** Tân Bình DC `10.801, 106.661`.

**Distance:** Google-class road km uses the `RoadBaseline` interface. Production default is Valhalla **truck** (xe_tai_nho envelope) → OSRM `driving` → haversine × `HCMC_CIRCUITY=1.35`, with retries and a 5-minute matrix cache. Spreadsheet-order baseline and clustered NN+2-opt share the same provider (that comparison is **not** Google). A Google Directions key can plug in later behind the same interface; `ROAD_BASELINE=google` without a key stays on OSM. Do not scrape Google. `ECOMILES_ECO_WEIGHT` in `[0,1]` (live worker: `1`) assigns lower-TTW trucks first and blends kg CO₂ into NN+2-opt; reported totals stay physical TTW km.

**CO₂ (TTW estimate, not an ISO 14083 pack):** `kg_co2 = road_km × (l_per_100km/100) × kg_co2_per_litre` from `apps/api/data/emission_factors.json` — petrol **2.31**, diesel **2.68** (IPCC 2006 Vol.2 Table 1.4 × Table 1.2 NCV; GLEC v3.2 Europe TTW cross-check).

### Jury click path

```bash
# 1. Python 3.12 API
cd apps/api
uv python pin 3.12 && uv sync

# 2. Seed 80 orders + 10 trucks into SQLite
ECOMILES_DEMO=1 uv run python -m greenlogix_api.seed

# 3. Bind 0.0.0.0 so emulator 10.0.2.2 and phones on LAN can reach the API
ECOMILES_DEMO=1 uv run uvicorn greenlogix_api.main:app --host 0.0.0.0 --port 8000
```

4. Open http://127.0.0.1:8000/dispatcher — Seed (if needed), Optimize, see Leaflet OSM routes, Publish.
5. Flutter driver (`flutter devices` first):

```bash
cd apps/mobile-driver
# Linux desktop
flutter run --dart-define=API_BASE=http://127.0.0.1:8000 -d linux
# Android emulator (host loopback is the AVD itself)
flutter run --dart-define=API_BASE=http://10.0.2.2:8000
# Physical phone: host LAN IP, API still bound 0.0.0.0
flutter run --dart-define=API_BASE=http://192.168.1.10:8000
```

6. PIN **0000**, open a stop, **Chỉ đường**, mark **Đã giao** (photo optional — status still saves if the camera is denied), refresh dispatcher.
7. Open http://127.0.0.1:8000/report and read before/after km, litres, kg CO₂ (and percent deltas). Same numbers appear on the dispatcher TTW strip.

```bash
curl -H 'Authorization: Bearer DEMO' http://127.0.0.1:8000/report
```

Seed workbook: `apps/api/data/seed/hcmc_80_orders.xlsx` (trucks: `apps/api/data/seed/hcmc_10_trucks.xlsx`). SQLite file `apps/api/data/greenlogix.db` and POD photos under `apps/api/data/uploads/` are gitignored.

People split: Thanh owns `apps/mobile-driver`; Chiến owns `apps/api` and this demo section.
