# ECO MILES / GREENLOGIX — BRIEFING KỸ THUẬT CHO BUỔI TRAINING MVP

**Ngày lập:** 2026-10-18 (Asia/Ho_Chi_Minh)
**Người dùng:** Phạm Quốc Thanh (ShayNeeo) — người duy nhất lo phần tech
**Mục đích:** nắm toàn bộ plan, benchmark, dự định của dự án và tự trả lời mọi câu hỏi của diễn giả trong buổi training MVP development.
**Quy ước nhãn:** `[ĐO]` = tôi/CI đã chạy và có log · `[CAM KẾT]` = tài liệu nói, chưa có bằng chứng · `[MỤC TIÊU]` = roadmap, chưa làm.

---

## 0. Đọc 30 giây (nếu chỉ nhớ 1 khối)

- **Sản phẩm:** SaaS B2B tối ưu tuyến giao hàng đô thị cho SME vận tải nội thành HCMC + đo phát thải CO₂ trên cùng một nguồn dữ liệu vận hành.
- **Vòng lặp MVP (đã chạy thật):** Excel/seed → validate → tối ưu tuyến (cluster + NN + 2-opt) → bản đồ Leaflet OSM → publish → tài xế Flutter đọc tuyến + Chỉ đường (deep-link Google/Apple Maps) → đánh dấu đã giao + ảnh POD → dispatcher thấy trạng thái → báo cáo before/after km – lít – kg CO₂ + xuất xlsx.
- **Chi phí biên lên bản đồ/định tuyến/traffic API = 0 đồng.** Đây là ràng buộc kiến trúc, không phải sở thích kỹ thuật.
- **Con số trình diễn:** 80 đơn / 10 xe HCMC → 791.35 km (baseline zig-zag) → 94.74 km; CO₂ TTW 192.96 → 22.56 kg; xe 10 → 5. **Đây là benchmark mô phỏng trên dữ liệu, không phải kết quả hiện trường.**
- **Kỳ vọng thực địa:** 15–25% `[MỤC TIÊU – CẦN PILOT]`, phải đo bằng pilot 3–5 doanh nghiệp 30 ngày.
- **Trạng thái code hôm nay `[ĐO]`:** API Python 526 test pass (9.94s) · Flutter 15 test pass · Worker 16 test pass.
- **Điều tuyệt đối không được nói:** "ISO 14083 certified", "giảm 88% thực tế", "có backhaul matching", "đúng hẹn 98.8%", "API edge < 50 ms".

---

## 1. Dự án là gì — plan ở 3 tầng

### 1.1 Tầng sản phẩm (đã chốt)

| Hạng mục | Nội dung | Nguồn |
|---|---|---|
| Core value | Dispatcher nhập đơn → nhận tuyến thắng thứ tự cũ về km và CO₂ ước tính → tài xế thực thi bằng Maps deep-link, **0 đồng API bản đồ** | `.planning/PROJECT.md:9`; `.planning/STATE.md:18` |
| Khách hàng | SME vận tải/phân phối nội thành HCMC (food, FMCG, last-mile); người dùng: chủ DN, điều phối, tài xế | `.planning/PROJECT.md:13` |
| Giá trị kép | Tiết kiệm chi phí + số CO₂/đơn đọc được cho báo cáo ESG. **Cùng một nguồn dữ liệu vận hành** — đây là điểm giám khảo VSIC khen | `docs/contests/RND_2026/PROJECT_DESCRIPTION.md:286-289`; nhận xét VSIC 2026 (xem §7) |
| Doanh thu | SaaS theo Monthly Active Driver, pilot miễn phí 4–6 tuần; phí triển khai + báo cáo ESG để GĐ 4–6 | `.planning/PROJECT.md:14` |
| Định vị | **Không** là "Google Maps thứ hai". Lớp phòng thủ 7 tầng: place resolution → road graph OSM+Valhalla → ràng buộc xe tải → EcoRoute → EcoFleet → execution → evidence/audit | `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md:12-24` |
| Niche gốc | Tài xế **xe tải**, không phải xe máy; pain = Google Maps mở sai mode 2 bánh / không biết giờ cấm tải | `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md:26-51` |

### 1.2 Tầng thực thi `.planning` (4 phase)

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **1 — 72h Walking Skeleton** | Seed 80/10 → optimize → Leaflet OSM → publish → Flutter PIN 0000 → deep-link → status → before/after km/lít/TTW kg CO₂ | `[ĐO]` hoàn thành: thực thi 01-01 = 17 phút, 01-02 = 9 phút, 01-03 = 13 phút (`01-01-SUMMARY.md:125-126`) |
| **2 — MVP.xlsx phần bắt buộc còn lại** | Filter đơn + late-risk (haversine 30 km/h, không traffic API) + `report.xlsx` + badge late trên Flutter | `[ĐO]` có trong code: `GET /orders?q=&late=`, `GET /report.xlsx`, `late.py` |
| **3 — Pilot ops** | Một SME chạy 1 ngày không cần kỹ sư ngồi cạnh; PIN theo tài xế; deploy API | `[MỤC TIÊU]` một phần: PIN scoped `driver_<plate>` đã có; deploy API chưa |
| **4 — Paid maps chỉ khi có doanh thu** | Đổi haversine sang matrix thật sau khi có tiền thuê bao | `[MỤC TIÊU]`; interface `RoadBaseline` đã sẵn (`solver/road_baseline.py`) |

Nguồn: `.planning/ROADMAP.md:9-57`; `.planning/REQUIREMENTS.md:10-46` (18 yêu cầu v1: ORD/VEH/VRP/DSP/DRV/RPT/COST).

### 1.3 Tầng "frontier" (16 CR — nâng từ demo lên sản phẩm)

Chuỗi CR-01 → CR-16: freeze ground truth → Google handoff → GOFA Places → auth/RBAC → truck profile → self-host Valhalla → restriction overlay → admin boundary → Energy Model V1 → EcoPath Pareto → reference solvers + harness → EcoALNS v1 → EcoALNS v2 → Google DRIVE connector → evidence UI → telemetry/calibration (`GREENLOGIX_FRONTIER_PLAN_2026-09-1.md:1889-2265`).

Trạng thái audit mới nhất: **0/16 CR PASS đầy đủ, 16 PARTIAL, 0 NOT STARTED** (`FRONTIER_GAP_AUDIT_2026-09-28.md:7`). Nói cách khác: mọi tầng đều đã có code + test ở mức thư viện, nhưng chưa tầng nào đủ điều kiện đóng theo tiêu chí strict.

### 1.4 Tầng kinh doanh 7 giai đoạn `[MỤC TIÊU]`

GĐ1 MVP 2026 → GĐ2 pilot HCMC 2026–2027 → GĐ3 tối ưu công nghệ 2028 → GĐ4–5 mở Hà Nội/Bình Dương/Đà Nẵng/Đồng Nai 2028–2030 → GĐ6–7 tuần hoàn liên tỉnh/xuyên biên giới 2030–2032+ (`docs/contests/RND_2026/PROJECT_DESCRIPTION.md:313-318`).

### 1.5 Lịch cuộc thi đang chạy (từ Google Sheet tổng hợp của bạn)

| Cuộc thi | Mốc quan trọng | Trạng thái |
|---|---|---|
| **RnD to Startup 2026 (ĐHQGHN)** — đây là nơi có "**Workshop training 11/10 – 31/10**" | Vòng 2 nộp 1–8/11 · Mentoring 15/11 · Bán kết 16–22/11 · Chung kết 7–13/12 | Đã nộp Phiếu ĐK + Bản mô tả; Pitch Deck 12–15 slide còn `E7=True` (đã có); hồ sơ yêu cầu thêm **video giới thiệu ≤ 3 phút** |
| **VSIC 2026 (NEU/CICN)** | Vòng 2 nộp **05/11**, Pitching Day **07/11** (offline), chung kết miền 28/11, toàn quốc 12/12 | **TOP 12 miền Bắc**; đã có nhận xét chi tiết của BGK (xem §7) |
| **HITC Innostar 2026** | Deadline đăng ký **22/10** | Nộp Mẫu 01 + Mẫu 02 — còn 4 ngày |
| **Panasonic Đại sứ GEN G 2026** | Deadline 11/10 | Đã nộp |
| **Tuổi trẻ Startup Award** | Deadline 30/09; công bố kết quả dự kiến 25/10 | Đã nộp |
| **Chương trình Phát triển dự án khởi nghiệp quốc gia 2026** | Nộp vòng sơ loại **31/10** | Đã đăng ký |

Hồ sơ đội: 5 thành viên (Nguyễn Hồng Phúc – FPT HN, Phạm Quốc Thanh – ĐHQG-HCM, Nguyễn Ngọc Khánh Phương – Ngoại thương, Nguyễn Thu Thủy – NEU, Lê Thị Hoàng Ngân – NEU). Tên đề tài nộp: *"ECOMILES: Phần mềm tối ưu tuyến đường vận tải đô thị và đo lường phát thải CO₂"*.

---

## 2. Kiến trúc thật đang chạy

### 2.1 Có **hai** backend, cả hai đều thật

```
Excel/seed ──► apps/api  (FastAPI 3.12 + SQLite)   ← nguồn sự thật, 23 path, chạy local/VPS
                │
                ├── /dispatcher  (Jinja2 + Leaflet OSM)  → dispatcher web
                ├── /driver/*    (PIN 0000)              → Flutter app
                └── /report, /report.xlsx                 → báo cáo before/after

apps/landing (Vite+React 19) ──/api/*──► apps/worker (Cloudflare Worker + D1)
   ↑ landing live trên Cloudflare Pages        ↑ bản gọn đã deploy tại greenlogix.w9.nu
```

- **ADR 0001 (Accepted):** FastAPI là nguồn sự thật duy nhất; Cloudflare Worker chỉ CDN/proxy/BFF/auth edge — vì lý do solver cần CPU/RAM mà Worker bị giới hạn, và để tránh logic trùng lặp gây drift (`docs/adr/0001-authoritative-architecture.md:9-21`).
- Worker vẫn đang tồn tại song song (CORS `*`, eco weight mặc định 1, `/report.csv` thay `.xlsx`, đủ tốt cho demo edge) — `apps/worker/wrangler.jsonc:24`; trả lời thẳng khi được hỏi: **Worker là bản demo gọn, FastAPI mới là bản kỹ thuật.**

### 2.2 Thành phần và số liệu vận hành `[ĐO]`

| Thành phần | Thực tế |
|---|---|
| API | Python 3.12, FastAPI ≥ 0.141.1, SQLModel, Jinja2, openpyxl; `OpenAPI` đóng băng trong repo (`apps/api/pyproject.toml:1-40`) |
| DB | SQLite `apps/api/data/greenlogix.db`, 4 bảng: `orders`, `vehicles`, `routes`, `stops`; không Alembic, patch schema thủ công 2 lần (`db.py:23-70`) |
| Điểm cuối | **23 path** công bố trong `apps/api/openapi.json`, ví dụ: `POST /orders/import`, `POST /optimize`, `POST /routes/publish`, `GET /report`, `GET /report.xlsx`, `GET /driver/route`, `POST /stops/{id}/status`, `GET /places/autocomplete` |
| Auth | Fail-closed: không có `GREENLOGIX_DEMO=1` thì 401. Dispatcher `Bearer DEMO`; driver PIN `0000` (toàn cục) hoặc `driver_<plate>` (scoped); lockout 20 lần/300 s (`auth/service.py:32-33,75-120`) |
| Bản đồ | Leaflet 1.9.4 CDN + `tile.openstreetmap.org`; **không token Mapbox/Google** |
| Driver app | Flutter, 3 màn hình: PIN → danh sách stop → chi tiết; `url_launcher` deep-link Google → Apple → `geo:` |
| Landing | Vite 8 + React 19 + TS + Tailwind; tĩnh + Pages Functions proxy `/api/*` sang Worker |
| Chưa có thật | `packages/shared-types` chỉ có README; `apps/web-portal` chỉ có README; không có trang `public/dispatcher/` trên Pages |

### 2.3 Luồng dữ liệu end-to-end (thuộc lòng khi bị hỏi)

1. `GREENLOGIX_DEMO=1 uv run python -m greenlogix_api.seed` → 80 đơn/10 xe vào SQLite + 2 file xlsx seed.
2. Dispatcher mở `http://127.0.0.1:8000/dispatcher` → Seed (nếu cần) → Optimize → thấy tuyến trên Leaflet → Publish.
3. Flutter: PIN `0000` → `GET /driver/route` (chỉ tuyến đã publish, nhóm theo biển số) → mở stop → **Chỉ đường** → đi.
4. Đánh dấu Đã giao (ảnh POD optional, camera bị từ chối vẫn lưu trạng thái) → `POST /stops/{id}/status`.
5. `GET /report` đọc `data/last_report.json` → before/after km, lít, kg CO₂, % delta.

---

## 3. Thuật toán — cái gì thật, cái gì chưa

### 3.1 Đường chạy thật của `POST /optimize` (legacy heuristic)

`run_vrp()` (`solver/__init__.py:324`):

1. **Cluster:** greedy radius, hạt giống = phần tử đầu, gom mọi điểm trong bán kính; mặc định `3.0 km`, override qua body (`solver/cluster.py:8-28`).
2. **Gán xe:** chỉ xe `ready`; sort giảm `capacity_kg` rồi `plate`; fill kiểu knapsack tham lam; dư → `unassigned_order_ids` (`__init__.py:138-168`).
3. **Sắp thứ tự:** `two_opt(nearest_neighbor(...))`; NN tie-break theo `window_start`; trần 2-opt 500 vòng / 2000 swap (`solver/nn_two_opt.py:10-11,48,91-96`).
4. **Đo:** `litres = km × (l_per_100km/100)`; `kg_co2 = litres × hệ số` (`carbon.py:61-66`).

### 3.2 Ràng buộc — nói chính xác, đây là chỗ dễ bị bắt lỗi nhất

| Ràng buộc | Thực tế | Nguồn |
|---|---|---|
| **Sức chứa (capacity_kg)** | **Cứng** — chỉ nhận nếu `kg + order.kg <= capacity_kg`; tràn thì bật cờ `overload`, không âm thầm nhét | `solver/__init__.py:143-147,152-154` |
| **Khung giờ giao (time window)** | **Không cứng** — chỉ dùng làm tie-break NN và copy vào stop; không có kiểm tra khả thi thời gian | `solver/nn_two_opt.py:48`; `solver/__init__.py` (không thấy check feasibility) |
| **Giờ cấm tải QĐ 23/2018** | **Không cứng** — chỉ *label* coverage (`checked:clear/restricted/unchecked`); kết quả không được ghi vào response `/optimize` | `solver/road_baseline.py:528-562` |
| **Envelope xe tải** (cao/rộng/dài/tải trục) | Đã có model `TruckProfile` 3 preset + override theo xe; dùng cho Valhalla `costing_options.truck` | `geo/truck_profile.py:55-100` |
| **Eco-weight** | Blend `(1-w)·km + w·kg CO₂` — **sai đơn vị, đã deprecate**, không xoá để giữ tương thích OpenAPI | `solver/eco.py:1-7,21-47`; `GREENLOGIX_FRONTIER_PLAN_2026-09-1.md:153-177` |

Thời gian chạy thật trên seed 80/10: cỡ **dưới 100 ms** `[CAM KẾT]` — chưa có log lưu trong repo (harness chỉ ghi cột `runtime_ms` khi chạy).

### 3.3 EcoALNS, Pareto, benchmark harness, telemetry — có code, **chưa có HTTP**

- `optimizer/eco_alns.py`: 5 destroy op (single_random, random_removal, worst_fuel, uphill_payload, ban_window) + 2 repair (eco_greedy, eco_regret), trọng số thích ứng roulette (+0.2 / decay 0.99 / floor 0.1), nhận `hillclimb` mặc định hoặc `sa`, có `time_budget_s` và `convergence_trace` (`:131-623`).
- Cảnh báo: ALNS dùng khoảng cách **riêng, hard-code** `haversine × 1.35` — không đi qua `RoadBaseline` (`eco_alns.py:81,97`).
- `GREENLOGIX_OPTIMIZER=ecoalns` hiện **chỉ đổi nhãn audit**, không đổi thuật toán (`solver/flags.py:29-41`; `run_vrp` không đọc cờ). **Nói đúng:** "ALNS đã viết và test ở mức thư viện, chưa nối vào endpoint."
- `routing/pareto.py`: 3 policy `FASTEST_LEGAL / ECO_BALANCED / ECO_MAX` với ε-SLA 0/5/10%, `filter_dominated`, `why_facts`; hệ số hiện là minh hoạ (`illustrative=True`), chưa phải tuyến Valhalla thật.
- `benchmark/harness.py`: xuất bảng `solver | feasible | objective | gap | runtime_ms | seed`; **gap đo so với best-of-refs, không claim tối ưu**; chỉ 2 reference solver in-repo, **không có PyVRP/OR-Tools**.
- `telemetry/`: ingest quan sát nhiên liệu in-memory + JSON, calibration MAE/MAPE; Google Drive connector là stub raise đúng cách.

---

## 4. Khoảng cách (distance) & CO₂ — hai model, đừng lẫn

### 4.1 Chuỗi khoảng cách

`Valhalla truck → OSRM driving → haversine × HCMC_CIRCUITY(1.35)` (`solver/road_baseline.py:389-399`).

- Valhalla POST `/sources_to_targets` với `costing_options.truck` từ `TruckProfile`; OSRM `/table/v1/driving`; cuối cùng haversine × 1.35.
- Cache matrix trong tiến trình: key ghép 8 phần (provider, profile hash, graph version, departure bucket, restriction overlay, traffic snapshot, cost model, toạ độ), TTL 300 s, retry 2, timeout 2.5 s (`road_baseline.py:50-55,481-513`).
- Mỗi response mang `routing_quality`: `VERIFIED_GRAPH` (valhalla/osrm/cache/google) | `DEGRADED` (circuity) | `UNAVAILABLE` (input rỗng). **Publish fail-closed**: `GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1` → tuyến DEGRADED bị 403 (`routers/optimize.py:166-182`).
- `GoogleDirectionsBaseline` là stub luôn raise — cố ý, không scrape Google (`road_baseline.py:368-387`).
- Manifest `apps/api/data/road_graph.json` 7 key nhưng 5 key còn placeholder `unpinned-dev`; chỉ `restriction_overlay_version="decision23-2018-v1"` và `cost_model_version="GLX-HDT-v1.0"` là thật.

### 4.2 Hai model phát thải

| Model | Dùng ở đâu | Đặc điểm |
|---|---|---|
| **Accounting TTW** (đang dùng cho `/optimize`, `/report`) | Mọi tuyến | `kg_co2 = road_km × (l_per_100km/100) × hệ số`; xăng 2.31, diesel 2.68 kg CO₂/L (IPCC 2006 × GLEC v3.2). Nhãn tự khai: `EVIDENCE_CONFIDENCE="C1-illustrative"`, `"TTW estimate per GLEC-aligned factors, not certified"` (`carbon.py:17-19`) |
| **Physics HDT-v1** (chỉ trong ALNS/Pareto) | Thư viện | Lực cản lăn + gradient + khí động, công suất → tiêu hao; hằng số `C_r=0.008`, `η_driveline=0.88`, `η_thermal=0.40`, `P_aux=1500 W`, ρ diesel 0.84 kg/L, ψ 43.2 MJ/kg, clamp tốc độ 5–90 km/h; **OBD calibration BLOCKED** (`docs/research/energy_model_spec.md:21-105`) |

**Câu honesty bắt buộc khi trình bày:** *"Bản hiện tại cung cấp định tuyến có nhận biết xe tải và tối ưu tuyến/đội xe; engine eco-cost đang được đối chiếu với mô hình nhiên liệu hạng nặng có phản biện. CO₂ hiện tại là ước tính kế toán, chưa phải hàm mục tiêu tối ưu."* (`FRONTIER_GAP_AUDIT_2026-09-28.md:80`)

---

## 5. BENCHMARK — đang làm thế nào và dự định làm thế nào

### 5.1 Cái đã đo (tái lập được) `[ĐO]`

| Chỉ số | Kết quả | Cách đo |
|---|---|---|
| Quãng đường (80 đơn/10 xe) | **791.35 km → 94.74 km (−88.03%)** | So với baseline D-17: giữ nguyên thứ tự file Excel, greedy fill theo `capacity_kg` |
| Nhiên liệu | **83.53 L → 9.05 L (−89.17%)** | `km × l_per_100km` diesel |
| CO₂ TTW | **192.96 → 22.56 kg (−88.31%)** | × hệ số 2.68 |
| Số xe dùng | **10 → 5 (−50%)** | Đếm tuyến có stop |
| Kích thước hiện vật | 5 route / 80 stop, 94.74 km | QA browser trên dispatcher |
| Test | **526 pass / 9.94 s** (API, tôi chạy 2026-10-18); Flutter 15 pass; Worker 16 pass | `uv run --locked pytest -q`; `flutter test`; `node --test` |
| Contract | 23 path OpenAPI, `test_frozen_openapi` green | `tests/test_contract.py` |
| Build landing | 1.74 s, JS 520.76 kB (gzip 147.84) | `pnpm run build:landing` |

**Diễn giải trung thực (giám khảo nào cũng sẽ hỏi):** baseline là kịch bản **zig-zag không gom cụm** — cực đoan có chủ đích. −88% **không phải** kết quả hiện trường. Kỳ vọng thực tế khi pilot: **15–25%** km, ghi rõ `[GIẢ ĐỊNH – CẦN PILOT]` (`DE_AN_PANASONIC_GREEN_IMPACT_2026.md:207-213`).

### 5.2 Tháp benchmark 7 tầng đã thiết kế `[MỤC TIÊU – chưa chạy]`

1. **Public VRP:** Solomon, Homberger & Gehring, CVRPLIB, PyVRP instances → feasible rate, số xe, objective, % gap so best-known, runtime p50/p95, memory, seed variance (`GREENLOGIX_FRONTIER_PLAN_2026-09-1.md:1275-1296`).
2. **PRP research instances** (pollution-routing).
3. **Exact small gold set** (5–12 stop, 1–3 xe): CI assert feasible, objective ≥ optimum, gap ≤ ngưỡng, deterministic.
4. **Vietnam Truck Golden Set:** 12 strata (HCMC/Hà Nội dày, cầu/chiều cao, hạn chế tải trọng, một chiều, cấm theo giờ, KCN…) + invariant: không đi cạnh bị cấm, không vượt chiều cao, không vi phạm khung giờ, đồ liên thông, snap endpoint, detour hợp lý, tái lập được.
5. **Address Golden Set:** 300–1000 case ẩn danh → Top-1/Top-3, sai số trung vị, P90, đúng đơn vị hành chính, no-result rate, tỷ lệ người dùng phải tự sửa.
6. **Google DRIVE benchmark:** chỉ so như **baseline xe con**, gắn nhãn `CAR_BASELINE_NOT_TRUCK_FEASIBLE` nếu vi phạm restriction. Không so "model CO₂ của mình với quãng đường Google".
7. **Fleet crossover trial (thật, trên xe):** L/100km, lít/tuyến, lít/đơn, kgCO₂e/đơn, km/đơn, thời gian/đơn, on-time rate, số phút trễ, giao thất bại, số lần phải điều tuyến lại, số lần tài xế phải đổi mode bản đồ. **"Cho tới khi trial này tồn tại, mọi tài liệu cho nhà đầu tư phải ghi *modeled savings*, không được ghi *measured savings*"** (`:1512`).

Kèm cơ chế chống overfit: split **60% dev / 20% validation / 20% sealed hidden**; metamorphic test (feasibility theo profile xe, capacity, ε-SLA, determinism cùng seed → cùng hash, dấu tiếng Việt, danh sách ward); failure corpus `fixtures/regressions/<case_id>.json`.

### 5.3 Benchmark harness đã có thật (mức thư viện)

- `benchmark/harness.py:run_comparison()` → bảng `solver | feasible | objective | gap | runtime_ms | seed`; **gap = (objective − best feasible ref) / best**, `None` nếu bất khả thi hoặc best ≤ 0. Bất biến: cùng seed → cùng bảng.
- Chỉ 2 reference solver in-repo (`solve_nn_two_opt`, `solve_baseline_greedy`), không thêm phụ thuộc PyVRP/OR-Tools (BLOCKED vì không thêm dependency khi chưa được duyệt).
- Nguyên tắc đã chốt: *"GreenLogix nên benchmark với PyVRP HGS, không được giả định solver tự viết thắng"* — và không bắt buộc phải thắng PyVRP ở bài VRPTW khoảng cách thuần (`GREENLOGIX_FRONTIER_PLAN_2026-09-1.md:955,2167`).

### 5.4 Number cần chuẩn hoá trước khi nói (mâu thuẫn trong tài liệu hiện có)

| Vấn đề | Số trong tài liệu | Số đúng hiện tại |
|---|---|---|
| Số test | 268 unit + 16 integration (`DE_AN_SO2026_VSIC_HOAN_THIEN.md:357`); 442 (audit 09-28 nhánh `so2026`) | **526** API (đo 2026-10-18) + 15 Flutter + 16 Worker |
| OpenAPI path | 21 (nhánh `so2026`) | **23** |
| KPI km | 8–15% (`BRAINSTORM_IDEA.md:197`) và 15–25% (`DE_AN_PANASONIC...:367`) | Chốt **15–25%**, nêu rõ là khoảng mục tiêu |
| "Solver < 5 giây" / "< 100 ms" | có trong pitch, không kèm log | Có thể nói "dưới 1 giây trên mẫu 80/10 ở máy dev" — hoặc chạy lại và lưu log trước khi nói |

---

## 6. Đang làm gì tiếp (10 gap còn lại, xếp từ nhỏ)

| # | Việc | Ước lượng | Trạng thái chặn |
|---|---|---|---|
| 1 | Set `GREENLOGIX_CORS_ORIGINS` thật cho prod | 15 phút | không |
| 2 | GOFA Places: UI + debounce/cancel/cap quota (đã có contract thật `places-api.gofa.vn`, quota 15.000 req/tháng) | 1–2 h | sponsor docs cho phần còn thiếu |
| 3 | UI admin drawer + bước promote feedback đã verify → `ACTIVE_RULES` (cố ý không auto-promote) | nửa ngày | không |
| 4 | ALNS: payload-bin cache, nhiều restart, bảng ablation đầy đủ v1/v2 | code được | không |
| 5 | Endpoint route audit drawer (snapshot OSM, version restriction/model/solver, seed, provider, place IDs) | code được | không |
| 6 | PostGIS polygon admin boundary (hiện chỉ centroid) | 1–2 ngày | hạ tầng |
| 7 | Valhalla self-host: Docker + tile + elevation; manifest hiện toàn `unpinned-dev` | 3–5 ngày | hạ tầng |
| 8 | PyVRP/OR-Tools + Solomon/CVRPLIB runner | 3–5 ngày | phụ thuộc mới |
| 9 | JWT/Argon2id/tenant tables; store chia sẻ cho multi-instance | 1–2 tuần | không |
| 10 | Telemetry live (GPS/OBD) + Google DRIVE connector + panel bằng chứng C0–C4 | 2–4 tuần | dữ liệu thật |

Nguồn: `FRONTIER_GAP_AUDIT_2026-09-28.md:57-66`.

---

## 7. Nhận xét của giám khảo VSIC (đọc kỹ — đây là khuôn câu hỏi của diễn giả)

**Điểm đáng ghi nhận:** *"Giá trị kinh doanh và tác động môi trường dùng chung một nguồn dữ liệu vận hành; đây là điểm mạnh lớn của mô hình. Sản phẩm thử đã hoạt động, kế hoạch tài chính năm năm và chiến lược thử nghiệm với doanh nghiệp được xây khá chặt."*

**Điểm cần làm rõ:** *"Các mục tiêu giảm quãng đường, nhiên liệu, xe chạy rỗng và phát thải vẫn là mục tiêu thử nghiệm, chưa phải kết quả trên dữ liệu vận hành doanh nghiệp thật. Những ràng buộc ngoài đời có thể làm hiệu quả thuật toán giảm đáng kể."*

**Gợi ý bước tiếp theo:** *"Thử nghiệm với 3–5 doanh nghiệp, xác lập đường cơ sở và công bố cả các tuyến thuật toán đề xuất nhưng điều phối viên từ chối, kèm nguyên nhân. Từ đó mới lượng hóa hiệu quả thật."*

**Câu hỏi phản biện (phải trả lời được):** *"Nếu thuật toán tối ưu trên dữ liệu nhưng điều phối viên hoặc tài xế không chấp nhận tuyến đề xuất, EcoMiles sẽ coi đó là lỗi thuật toán hay vấn đề thay đổi hành vi?"*

Trả lời mẫu (dùng được ngay): *"Không phải lỗi thuật toán và cũng chưa phải vấn đề hành vi — mà là **thiếu ràng buộc chưa được mô hình hoá**. Nghiệm của bài toán hiện chỉ cứng ở sức chứa; khung giờ và giờ cấm tải mới ở mức nhãn cảnh báo. Khi điều phối viên từ chối một tuyến, chúng tôi ghi lại tuyến đề xuất, tuyến họ chọn, và lý do (5 lý do thất bại đã có enum sẵn trong API: khách vắng/sai địa chỉ/hàng hỏng/từ chối…). Tập 'tuyến bị từ chối' đó chính là dữ liệu để biến ràng buộc ngầm thành ràng buộc tường minh. Chấp nhận là một chỉ số sản phẩm, đo được — không phải lý do để biện hộ cho thuật toán."*

---

## 8. Ngân hàng câu hỏi — trả lời sẵn

**Q1. MVP này làm trong bao lâu, thật không?**
Phase 1 thiết kế 72 giờ wall-clock; thực thi thực tế 3 plan chạy liên tiếp hết 17 + 9 + 13 phút sau khi Wave-0 (freeze OpenAPI + worktree) xong. Trả lời trung thực: **72h là ngân sách thiết kế; phần code chạy nhanh vì contract và seed đã chốt trước, và heuristic được chọn vì giải thích được.**

**Q2. Vì sao không dùng OR-Tools/PyVRP mà tự viết heuristic?**
Ba lý do: (1) 0 đồng và không thêm phụ thuộc; (2) heuristic tham lam + 2-opt giải thích được cho điều phối viên trong 1 phút, đủ cho 30–100 đơn/ngày; (3) đã có sẵn `benchmark/harness.py` để so công bằng với solver tham chiếu — và nguyên tắc đã ghi là **không giả định solver tự viết thắng PyVRP HGS**, chỉ cần thắng solver cũ trên đa số instance nội bộ hoặc ghi rõ tradeoff.

**Q3. Ràng buộc nào là cứng?**
Chỉ **sức chứa** và (một phần) trạng thái xe `ready`. Khung giờ và giờ cấm tải **chưa** là ràng buộc khả thi — hiện là tie-break và nhãn cảnh báo. Đây là gap đã ghi trong audit (P-09).

**Q4. CO₂ tính thế nào, có theo ISO 14083 không?**
`km × lít/100km × hệ số` với hệ số TTW xăng 2.31 / diesel 2.68 kg CO₂/L (nguồn IPCC 2006 Vol.2 × đối chiếu GLEC v3.2). **Không** phải báo cáo kiểm kê ISO 14083; chính code tự gắn nhãn `C1-illustrative` và `not certified`. Muốn lên chuẩn thì phải có: biên hệ thống đầy đủ (WTW), dữ liệu hoạt động thật, và kiểm chứng bên thứ ba — đang ở giai đoạn ước tính kế toán.

**Q5. −88% CO₂ nghe vô lý?**
Đúng, nếu hiểu là kết quả hiện trường. Đây là so sánh với baseline **zig-zag không gom cụm** trên mẫu 80/10 — chứng minh *thuật toán gom cụm có tác dụng*, không chứng minh *khách hàng tiết kiệm 88%*. Kỳ vọng thực địa ghi rõ 15–25%, phải đo bằng pilot.

**Q6. Làm sao biết sản phẩm thật sự giảm chi phí?**
Thiết kế đã có: pilot 3–5 DN, 4–6 tuần, lấy baseline 30 ngày từ dữ liệu lịch sử của khách, rồi crossover trial đo L/100km, lít/tuyến, lít/đơn, kgCO₂e/đơn, km/đơn, on-time, số lần phải điều tuyến lại. Chỉ sau đó mới được đổi chữ "modeled" thành "measured".

**Q7. Test/QA thế nào?**
API 526 test pass (pytest, chặn mạng thật trong conftest: ép `ROAD_BASELINE=circuity`, cấm gọi GOFA), 87 test contract so OpenAPI đóng băng, Flutter 15 test, Worker 16 test. CI GitHub chỉ chạy landing build + pytest + ruff — **chưa có flutter test và worker test trong CI** (đây là việc cần bổ sung). Bốn tầng verify được ghi trong `TEST_READY.md`.

**Q8. Hạ tầng tốn bao nhiêu?**
Biên = 0 đồng cho bản đồ/định tuyến/traffic API (đã từ chối gói 5M + 2.5M VND/tháng). Landing + Worker chạy Cloudflare Pages/Workers. Places dùng GOFA quota 15.000 req/tháng. Chi phí thật còn lại là thời gian người và (khi pilot) một VPS/container cho FastAPI + SQLite.

**Q9. SQLite chịu được bao nhiêu? Khi nào đổi?**
MVP và pilot nhỏ thì đủ (80 đơn/ngày, 4 bảng, không migration tool). Đổi sang PostgreSQL/PostGIS khi cần: polygon ward thật, quy tắc cấm tải dạng bảng, multi-tenant, chạy nhiều instance. Ngưỡng đã ghi trong roadmap gap #6/#9.

**Q10. Auth đã an toàn chưa?**
**Chưa — và nói thẳng như vậy.** Hiện là auth thi đấu: `Bearer DEMO`, PIN `0000`, fail-closed khi tắt `GREENLOGIX_DEMO`, lockout 20/300 s, plate-scope. Không có bảng user/org, RBAC multi-tenant là no-op. README ghi rõ "không được expose tiến trình này ra internet".

**Q11. Dữ liệu cá nhân (Nghị định 13/2023)?**
Có PII thật trong luồng: số điện thoại người nhận, ảnh POD, vị trí điểm giao. Hiện cắt giảm: log không ghi phone, ảnh đặt tên uuid, giới hạn 5 MB, không dùng ảnh chuỗi gốc từ client. Những việc chưa làm phải nói rõ: mã hoá at-rest, retention policy, thoả thuận xử lý dữ liệu với khách.

**Q12. Khác gì Abivin / SmartLog / Google Maps?**
Google Maps không có định tuyến xe tải lớn và tuyến tiết kiệm nhiên liệu ở Việt Nam (đã ghi trong phân tích); TMS lớn bán gói doanh nghiệp nặng. Lợi thế đang có: lớp ràng buộc Việt Nam (QĐ 23/2018, envelope xe tải, ward) + đo CO₂ trên cùng dữ liệu vận hành + chi phí biên 0 cho API bản đồ. **Nhưng** phần lớn lớp ràng buộc đó mới ở mức label/thư viện — phải nói đúng mức.

**Q13. Vì sao có 2 backend?**
Worker là bản demo edge đã deploy (nhẹ, CORS mở, `/report.csv`); FastAPI là nguồn sự thật theo ADR 0001. Trùng logic solver từng gây drift (Worker dùng L/100km trung bình rồi áp hệ số xăng dù đội xe có diesel) — ADR chốt chỉ FastAPI được triển khai solver.

**Q14. Time window có được tôn trọng?**
Chưa phải ràng buộc. Hiện chỉ tie-break và nhãn late-risk bằng ETA depot→stop giả định 30 km/h. Muốn thành ràng buộc thật cần ma trận thời gian thực + dịch vụ theo stop.

**Q15. Nếu thuật toán và điều phối viên bất đồng?** → xem §7.

**Q16. Chỉ số nào bạn tự hào nhất và chỉ số nào còn yếu nhất?**
Mạnh nhất: **vòng lặp chạy được thật + hợp đồng OpenAPI đóng băng + 526 test** — nghĩa là sản phẩm thử, không phải slide. Yếu nhất: **chưa có một giờ dữ liệu vận hành thật của khách** — nên mọi con số hiệu quả đều là modeled.

**Q17. Nếu có thêm 4 tuần thì làm gì?**
Theo thứ tự: (1) 3–5 pilot, lấy baseline 30 ngày + log tuyến bị từ chối; (2) biến time window và giờ cấm tải thành ràng buộc cứng; (3) nối ALNS vào endpoint và chạy bảng ablation; (4) đưa flutter/worker test vào CI; (5) auth thật + deploy.

**Q18. Sản phẩm hiện vật cho Pitching Day là gì?**
Dispatcher local (`uvicorn` + `/dispatcher`), Flutter app trên máy tài xế, và bản deploy edge `greenlogix.w9.nu`. Chuẩn bị: seed sẵn, PIN 0000, một tuyến đã publish, và mở `/report` để chiếu before/after.

**Q19. Điểm nào trong pitch đang sai và phải sửa trước khi nói?**
Danh sách do chính repo tự audit: "triệt tiêu 30% xe chạy rỗng", "nâng đúng hẹn 98.8%", "100% tuân thủ NĐ 06", "Backhaul Matching đang hoạt động", "ISO 14083 certified", "API edge < 50 ms", "142.8 kg CO₂ tiết kiệm" không nhãn nguồn (`docs/audit/PROPOSAL_ECOMILES_TECH_AUDIT.md:26-31,95-98`).

**Q20. Nhãn dữ liệu 3 tầng dùng thế nào?**
Mọi số phải gắn một trong ba: `[ĐÃ KIỂM CHỨNG]` (có thể tái lập bằng lệnh trong repo), `[BENCHMARK NGÀNH]` (trích báo cáo có nguồn), `[GIẢ ĐỊNH – CẦN PILOT]` (dự phóng). Đây là cách giữ uy tín khi bị hỏi xoáy.

---

## 9. Ba điều tuyệt đối nhớ khi bị hỏi khó

1. **Phân biệt "chạy được" và "đã đo".** Có code + test ≠ có bằng chứng hiệu quả. Mọi con số hiệu quả hiện là mô phỏng trên mẫu 80/10.
2. **Nói đúng mức của ràng buộc.** Cứng: sức chứa. Chưa cứng: khung giờ, giờ cấm tải. Chưa nối HTTP: ALNS, Pareto, telemetry, harness.
3. **Không bao giờ claim chứng nhận.** GLEC/ISO 14083 là *tham chiếu kỹ thuật*; sản phẩm chưa phải tổ chức cấp chứng chỉ và chưa có báo cáo kiểm kê đạt chuẩn.

---

*Nguồn số liệu: chạy trực tiếp ngày 2026-10-18 (`pytest -q` = 526 passed/9.94s; `flutter test` = 15 passed; worker `node --test` = 16/16) + đọc code trong `apps/api/src`, `apps/worker/src`, `apps/mobile-driver/lib`, `apps/landing/src` + `.planning/**`, `docs/**`, `FRONTIER_GAP_AUDIT_2026-09-28.md`, `implementation-notes.md`, `TEST_READY.md` + Google Sheet tổng hợp tài liệu dự án (7 sheet: HITC Innostar, Chương trình Phát triển dự án KNQG, VSIC, Panasonic GEN G, Tuổi trẻ Startup Award, RnD-ĐHQGHN, Thông tin nhóm) + PDF nhận xét chi tiết BGK VSIC cho đội ECOMILES.*
