# AUDIT: CÁC PHIÊN BẢN DỰ ÁN — NGUỒN DỮ LIỆU — CLAIM SAI & HALLUCINATION

**Ngày:** 2026-10-18 · **Người lập:** Phạm Quốc Thanh · **Phạm vi:** mọi giấy tờ đã nộp/đang nộp cho 6 cuộc thi + mọi con số dự án đã từng công bố.
**Cách làm:** tải trực tiếp toàn bộ file từ master sheet + VSIC tracker, trích text từng file, đối chiếu từng con số với (a) code trong repo, (b) nguồn gốc được viện dẫn (World Bank, IPCC, VLA, Google, Bộ Công Thương), (c) chạy lại test.

---

## 0. Kết luận trong 60 giây

| Câu hỏi | Trả lời |
|---|---|
| Đã tổng hợp hết tài liệu chưa? | **9/9 link công khai đã tải và đọc xong** (chi tiết §1). Còn **1 thư mục Drive của BTC VSIC** (`VSIC 2026 \| ECOMILES`) và 1 pitch deck template không public — cần bạn cấp quyền hoặc tự đọc. |
| Kiểm định lấy dữ liệu từ đâu? | **Toàn bộ số hiệu quả lấy từ dữ liệu tự sinh trong repo** (`seed.py`), không có một giờ dữ liệu khách hàng thật nào. Các con số "chuẩn ngành" phần lớn chép từ nguồn không kiểm lại. |
| Uy tín không? | **Có 2 tầng uy tín rất khác nhau:** (1) code/test/build/deploy — **tái lập được, đáng tin**; (2) mọi con số tiết kiệm/CO₂/tác động — **tự đo trên dữ liệu tự tạo, baseline tự chọn, chưa có bên thứ ba kiểm chứng**. |
| Audit có độc lập không? | **Không.** Toàn bộ `FRONTIER_GAP_AUDIT_*`, `PROPOSAL_ECOMILES_TECH_AUDIT`, `TEST_READY` do chính pipeline agent viết code tự sinh ra. Nguồn bên ngoài duy nhất từng đánh giá dự án là **nhận xét của BGK VSIC**. |
| Claim sai? | **12 claim sai/không nhất quán** (bị code hoặc bởi chính nguồn được viện dẫn bác bỏ) — §3. |
| Hallucination? | **Có, theo 4 cơ chế lặp lại** — §4. Nặng nhất: gán nhãn `[ĐÃ KIỂM CHỨNG]` cho tính năng chưa tồn tại, và bịa số liệu ngành kèm tên nguồn. |

---

## 1. ĐÃ TỔNG HỢP ĐƯỢC GÌ — các phiên bản dự án theo từng cuộc thi

### 1.1 Master sheet (nguồn tổng) — đã đọc cả 7 tab

`docs.google.com/spreadsheets/d/17O-V3fve35xHTNYRQUx1VtxA9bz9a7sIN2L9kdytxgY` → export XLSX, đọc 100% cell có dữ liệu:

| Tab | Nội dung |
|---|---|
| HITC INNOSTAR 2026 | link Mẫu 01 + Mẫu 02, timeline 22/9–22/10, địa điểm Hòa Lạc |
| Chương trình Phát triển dự án khởi nghiệp quốc gia 2026 | link điều lệ, form, format pitch deck, phiếu đăng ký; hạn sơ loại 31/10 |
| Thử thách Sáng tạo xã hội Việt Nam (VSIC) | link đăng ký, template slide, handbook, sheet thông tin đội, **nhận xét chi tiết vòng 1 của BGK**, link sheet Tracking Performance, link folder BTC |
| ĐẠI SỨ GEN G 2026 – Panasonic | hạn 11/10, thể lệ, cẩm nang, link đăng ký |
| Giải thưởng Tuổi trẻ Startup Award | link đăng ký, folder hồ sơ, hạn 30/09, kết quả dự kiến 25/10 |
| RnD – ĐHQGHN | timeline, form đăng ký, handbook, hồ sơ, đơn cam kết |
| Thông tin nhóm | 5 thành viên + trường + email + SĐT (PII) |

### 1.2 Các file đã tải & đọc (9/9 link công khai)

| # | Tài liệu | Loại | Trạng thái nội dung |
|---|---|---|---|
| 1 | HITC — Mẫu 01 Phiếu đăng ký | Google Doc | **Đã điền**: EcoMiles, đội ECOMILES, demo `ecomiles.pages.dev`, **"Giai đoạn hiện tại: Ý tưởng"**, địa bàn HCM + Hà Nội |
| 2 | HITC — Mẫu 02 Bản thuyết minh | Google Doc | **CÒN TRỐNG HOÀN TOÀN** (template). Hạn 22/10 → đây là việc chưa làm lớn nhất |
| 3 | Chương trình quốc gia — Phiếu đăng ký | Google Doc | Đã điền, **chứa số CCCD + ngày sinh + địa chỉ của cả 5 thành viên** (xem rủi ro §6) |
| 4 | Chương trình quốc gia — Format pitch deck | PDF 678 dòng | Cấu trúc "bài thuyết trình 10 điểm" (vấn đề → quy mô thị trường → công nghệ → kiểm chứng vấn đề → chiến lược → … → đội nhóm → số vốn) |
| 5 | RnD — Đơn cam kết thông tin đội | Google Doc | Đã điền, có CCCD, phân vai từng người |
| 6 | RnD — Handbook | PDF 555 dòng | **Tiêu chí + trọng số chấm điểm đầy đủ** (§5) |
| 7 | VSIC — Pitch Deck Handbook | PDF 693 dòng | Hướng dẫn 15 trang + **yêu cầu về nguồn dữ liệu** (§5) |
| 8 | Panasonic — Thể lệ | PDF 310 dòng | Tiêu chí chấm: chủ đề 30 / sáng tạo 25 / khả thi 20 / tác động 25 |
| 9 | VSIC — Nhận xét chi tiết vòng 1 (BGK) | PDF 1 trang | **Đánh giá độc lập duy nhất từng có về dự án** (§5) |

### 1.3 Tài liệu nội bộ đã có trong repo (không phải link ngoài)

| Nhóm | File |
|---|---|
| RnD | `docs/contests/RND_2026/PROJECT_DESCRIPTION.md` + `.docx` + `PROJECT_DESCRIPTION.xlsx` + 2 workbook tài chính (621 KB, 356 KB) |
| SO 2026 (nộp qua NEU) | `docs/contests/SO_2026/DE_AN_SO2026_VSIC_HOAN_THIEN.md` (28 KB) + bài dự thi `.docx` (1.05 MB) |
| Panasonic | `docs/contests/PANASONIC_2026/DE_AN_PANASONIC_GREEN_IMPACT_2026.md` (440+ dòng) + `GOI_Y_TECH_CHO_PLAN_PANASONIC.docx` |
| VSIC | `VSIC 2026 \| ECOMILES \| Tracking Performance.xlsx` (đã tải, đọc cả 4 tab) |
| Marketing/hướng dẫn | `docs/user_guide.html`, 2 PDF hướng dẫn sử dụng, `slides/GreenLogix_Pitch_Deck_SO2026.pptx` |
| Audit nội bộ | 8 file `FRONTIER_GAP_AUDIT_2026-09-21..28.md`, `docs/audit/PROPOSAL_ECOMILES_TECH_AUDIT.md`, `TEST_READY.md` |
| Phân tích công nghệ | `BAO_CAO_AUDIT_TECH_SLIDE_ECOMILES.docx`, `BAO_CAO_PHAN_TICH_CONG_NGHE_UPSIDES_DOWNSIDES_ECOMILES.docx` |

### 1.4 Chưa lấy được (cần bạn)

- `VSIC 2026 | ECOMILES` — folder BTC quản lý (id `1T65n41gw_cgIUMM5RSISeQh-8_xsRjp1`): bài dự thi vòng 2, slide pitching.
- `VSIC 2026 | TEMPLATE PITCH DECK.pptx` (id `1rbDJRG-_0HLajDJBgWS-d2CAsZ5_gs-t`) — template BTC, hữu ích để biết format bắt buộc.
- Folder ảnh/QR trong "Tuổi trẻ Startup Award" — chỉ là hồ sơ đã nộp.

### 1.5 Mâu thuẫn giữa các phiên bản (dễ bị bắt lỗi nhất)

| Điểm | HITC Mẫu 01 | VSIC Snapshot | RnD / Bản mô tả | Panasonic |
|---|---|---|---|---|
| Giai đoạn | **"Ý tưởng"** | "MVP đã hoạt động (ecomiles.pages.dev)" | "MVP đã hoạt động" | "sản phẩm thử đã hoạt động" |
| % giảm | — | **15–20%** | 8–15% (KPI) / 15–25% (đề án) | 15–25% |
| CO₂ | — | "theo chuẩn GLEC 3.2 **và ISO 14083**" | "dựa trên nguyên lý GLEC 3.2 / ISO 14083" | "tham chiếu kỹ thuật, chưa chứng nhận" |
| Định vị | demo `ecomiles.pages.dev` | demo + pilot 3–5 DN | pilot 3–5 DN, 30–100 xe | pilot 30 ngày |

→ Không phải "nói dối", nhưng **4 hồ sơ đang mô tả 4 mức trưởng thành khác nhau của cùng một dự án**. Một giám khảo đọc chéo là hỏi được ngay.

---

## 2. NGUỒN DỮ LIỆU CỦA TỪNG "KIỂM ĐỊNH" — UY TÍN ĐẾN ĐÂU

### 2.1 Nguồn gốc dữ liệu (data provenance)

| Dữ liệu dùng | Nguồn thật | Có phải dữ liệu khách hàng? |
|---|---|---|
| 80 đơn / 10 xe HCMC | **Tự sinh** bằng `apps/api/src/greenlogix_api/seed.py` — vòng lặp `i in 1..80`, 6 quận + jitter tất định, kg `5 + (i*7) % 76`, giờ 8h–16h | **Không.** Dữ liệu tổng hợp do chính nhóm viết |
| 6 quận + depot Tân Bình `10.801, 106.661` | Toạ độ thật (OSM), nhưng phân bố điểm do code sinh | Không |
| Sức chứa xe 500–2000 kg, 8–14 L/100km | Giá trị hợp lý theo xe tải nhỏ VN, **do nhóm chọn, không có nguồn trích dẫn** | Không |
| Baseline đối chứng 791.35 km | **Do nhóm tự chọn kịch bản zig-zag** (giữ nguyên thứ tự file Excel, greedy fill) | Không |
| Khoảng cách OSRM/Valhalla | API công khai thật (đã gọi thử: OSRM ~6.3 km, Valhalla ~6.0 km cho một chặng) | Nguồn công khai, uy tín |
| Hệ số phát thải 2.31 / 2.68 kgCO₂/L | IPCC 2006 defaults (diesel 74,100 kg CO₂/TJ, NCV 43.0 TJ/Gg, ρ≈0.845 kg/L → 2.68) | **Chuẩn quốc tế, đúng** |
| Thời gian phản hồi, số test, kích thước build | Đo trong CI/máy dev | Tái lập được |
| Nghiên cứu nền của model năng lượng | Bektaş & Laporte 2011 (`10.1016/j.trb.2011.02.004`), Rakha 2017 (`10.1016/j.trd.2017.06.011`), Lai 2024 (`10.1016/j.cor.2024.106557`) — **DOI có thật, đúng chủ đề** | Uy tín học thuật |

### 2.2 Kiểm lại các con số "chuẩn ngành" (đã tra nguồn gốc)

| Con số dự án đang dùng | Dự án ghi nguồn | Sự thật kiểm được | Kết luận |
|---|---|---|---|
| Chi phí logistics **16,8–17% GDP** | "Báo cáo Logistics Việt Nam 2023–2024, Bộ Công Thương" | Đúng và phổ biến — VLA và Bộ Công Thương đều công bố 16,8–17%; WB blog khác lại nêu **21% GDP (2019)** | ✅ Dùng được, nhưng nên ghi **"theo VLA / Báo cáo Logistics Việt Nam"** và nêu năm |
| **30–35%** xe tải chạy rỗng | "World Bank & Hiệp hội VLA" | **World Bank 2019 "Strengthening Vietnam's Trucking Sector" nói 50–70%** (nhà vận tải tới 70%, LSP/shipper tới 50%) | ❌ **Sai số + sai nguồn.** Trích đúng WB là 50–70% (số liệu 2019) |
| Giao thông phát thải **>57 triệu tấn CO₂/năm**, đường bộ **>80%** | "Bộ GTVT & World Bank" | Số liệu công bố: **2014: 33,2 Mt; 2023: 39,3 Mt** (toàn ngành GTVT, 11% phát thải quốc gia); nguồn khác: ~30 Mt/năm với **đường bộ ~85%** | ❌ **57 Mt không có cơ sở trong các nguồn tra được.** Sửa thành "toàn ngành GTVT khoảng 33–40 triệu tấn CO₂/năm (2014–2023), đường bộ chiếm ~80–85%" |
| Hệ số **2,68 diesel / 2,31 xăng** (TTW) | "IPCC 2006 Vol.2 Table 1.4 × Table 1.2 NCV; GLEC v3.2" | Chuẩn IPCC 2006: diesel 74.100 kgCO₂/TJ × NCV 43,0 TJ/Gg × ρ 0,845 → **2,68–2,69**; xăng tương tự → 2,29–2,31 | ✅ **Đúng**, dẫn nguồn hợp lệ |
| "Google **không có** định tuyến xe tải ở VN" | `GREENLOGIX_FRONTIER_PLAN` | Google Routes API có Large Vehicle Routing nhưng **"available to a limited set of customers"**; **VIETMAP Map API đã hỗ trợ profile `truck`/`container` cho VN**, Openmap.vn có `car/bike/moto` | ⚠️ **Nói quá.** Sửa: "Google large-vehicle routing chỉ mở cho số ít khách hàng; tại VN đã có nhà cung cấp hỗ trợ profile xe tải (VIETMAP, Openmap) — khác biệt của EcoMiles là lớp ràng buộc QĐ 23/2018 + đo CO₂ trên cùng dữ liệu, không phải 'không ai làm được'" |
| **VLA có trên 30.000 hội viên** | VSIC Snapshot C22 | Danh bạ VLA 2019 ghi **"over 400 members"** (133 trang PDF) | ❌ **Sai khoảng 75 lần.** Nhiều khả năng lẫn với "cả nước có ~30.000 doanh nghiệp logistics" |
| **~70% doanh nghiệp logistics ở TP.HCM** | VSIC Snapshot E22 | Không tìm được nguồn cho con số 70% | ⚠️ **Chưa kiểm chứng.** Hoặc bỏ, hoặc dẫn nguồn cụ thể |
| 25 tỷ USD thị trường TMĐT 2024, tăng 20%/năm | Cục TMĐT | Hợp lý, phù hợp các báo cáo công bố | ✅ Dùng được |

### 2.3 "Kiểm định" nào đáng tin, kiểm định nào là tự công bố

| Hạng mục | Ai đo | Tái lập được? | Mức tin cậy |
|---|---|---|---|
| **526 test API** (tôi chạy lại 2026-10-18: 526 passed/9.94s) + 15 Flutter + 16 Worker | Nhóm (CI + máy dev) | **Có** — 1 lệnh | **CAO** |
| OpenAPI 23 path đóng băng, `test_frozen_openapi` green | Nhóm | Có | **CAO** |
| Build landing 1,74 s / JS 520 kB; deploy Worker + Pages có version ID | Nhóm | Có | **CAO** |
| Ảnh QA live (Playwright assert HTTP 200) | Nhóm tự viết script | Có | TRUNG BÌNH (tự QA) |
| **791,35 → 94,74 km / −88%** | Nhóm, trên dữ liệu tự sinh, so baseline tự chọn | Có về mặt kỹ thuật, nhưng **không phải hiệu quả thực địa** | THẤP cho mục đích "chứng minh tiết kiệm" |
| "< 100 ms", "solver < 5 s", "API edge < 50 ms" | Không có log nào trong repo | Không | **RẤT THẤP** (claim) |
| "98,8% đúng hẹn", "triệt tiêu 30% xe rỗng", "100% tuân thủ NĐ 06", "backhaul matching đang chạy" | Không nguồn | Không | **PHANTOM** — chính repo tự audit đánh dấu phải gỡ |
| Model năng lượng GLX-HDT-v1 | Nhóm, neo vào 4 paper có DOI thật | Code chạy + test, **nhưng chưa hiệu chuẩn OBD** | TRUNG BÌNH về phương pháp, THẤP về độ chính xác |
| 8 audit `FRONTIER_GAP_AUDIT_*`, `TEST_READY`, `PROPOSAL_ECOMILES_TECH_AUDIT` | **Chính pipeline AI viết code** ("read-only reviewer gate PASS", "banned-claims grep") | Có | Trung thực như **tự kiểm**, **không phải audit độc lập** |
| Nhận xét BGK VSIC vòng 1 | **Bên thứ ba thật** | — | **CAO — nguồn đánh giá ngoài duy nhất** |
| Tài chính: NPV 185.535.919đ, IRR 28%, hoàn vốn 1,68 năm | Nhóm, mô hình Excel tự dựng | Nội bộ nhất quán | TRUNG BÌNH (giả định tự chọn, chưa có doanh thu thật) |

---

## 3. CLAIM SAI — 12 chỗ phải sửa (bị code hoặc chính nguồn viện dẫn bác bỏ)

| # | Claim nguyên văn | Nơi ghi | Sự thật | Mức |
|---|---|---|---|---|
| 1 | `[ĐÃ KIỂM CHỨNG]` … "tích hợp **đầy đủ khung giờ** và tuyến đường cấm tải trọng TP.HCM (QĐ 23/2018)" | VSIC Snapshot E19 | Khung giờ **không phải ràng buộc** trong solver (chỉ tie-break); giờ cấm tải chỉ là **nhãn coverage**, và nhãn đó còn **không được trả về** trong response `/optimize` | **NẶNG** |
| 2 | `[ĐÃ KIỂM CHỨNG]` "engine tính CO₂e … theo chuẩn quốc tế **GLEC Framework 3.2 và ISO 14083**" | VSIC Snapshot E19 | Code tự gắn nhãn `EVIDENCE_CONFIDENCE="C1-illustrative"`, `"TTW estimate … not certified"`; README ghi rõ "not a full ISO 14083 audit report" | **NẶNG (rủi ro pháp lý)** |
| 3 | "Driver Mobile PWA … **dẫn đường Google Maps xe tải**" | VSIC Snapshot E19 | UI thật ghi "Chỉ đường (Google Maps · **Ô tô**)"; Google truck routing không cấp đại trà; chính audit bắt buộc ghi `Ô tô` + disclaimer | **NẶNG** |
| 4 | "**30–35%** xe tải chạy rỗng (World Bank & VLA)" | đề án SO/Panasonic | WB 2019: **50–70%** | NẶNG (sai nguồn) |
| 5 | "giao thông phát thải **>57 triệu tấn CO₂**, đường bộ >80%" | đề án SO/Panasonic | 2014: 33,2 Mt · 2023: 39,3 Mt (toàn ngành) | NẶNG (số không có cơ sở) |
| 6 | "**VLA có trên 30.000 hội viên**" | VSIC Snapshot C22 | Danh bạ VLA 2019: **over 400 members** | NẶNG |
| 7 | "**−88,31% CO₂**" không kèm chú thích | Slide 06/07 pitch deck | Chính repo audit: "synthetic unclustered zig-zag benchmark … **physically impossible in actual operations**" | NẶNG nếu không gắn nhãn mô phỏng |
| 8 | "Rút ngắn **80–90%** thời gian điều phối … **98,8%** đúng hẹn" | slide cũ | "Numbers presented as historical facts **without pilot citation**" (audit nội bộ) | NẶNG |
| 9 | "**Triệt tiêu 30%** xe chạy rỗng chiều về / giảm 35%→5–10%" | slide 02/06 | Backhaul matching là **GĐ 4–6**; MVP không có | NẶNG (phantom feature) |
| 10 | "**100% tuân thủ NĐ 06**" / "chuẩn hóa GLEC Scope 3 & ISO 14064" | slide 02/05 | Không phải tổ chức cấp chứng nhận; nhãn "ISO certified" là **nguy hiểm pháp lý** | NẶNG |
| 11 | Giai đoạn dự án: HITC ghi **"Ý tưởng"** vs VSIC/RnD ghi **"MVP đã hoạt động"** | 2 hồ sơ | Mâu thuẫn nội bộ giữa các hồ sơ | TRUNG BÌNH |
| 12 | Ba bộ KPI khác nhau: **8–15%** / **15–20%** / **15–25%** km | `.planning`, VSIC snapshot, đề án Panasonic | Ba tài liệu cùng nhóm nói ba khoảng khác nhau | TRUNG BÌNH (mất điểm "dữ liệu có nguồn, thời điểm rõ ràng") |

**Ghi chú tích cực:** code **không** hề nói dối. Mọi con số sai đều nằm ở **tài liệu trình bày**, không nằm trong phần mềm. Repo tự gắn nhãn `C1-illustrative`, tự đặt cổng `publish fail-closed`, tự ghi "not certified". Vấn đề là bước **chuyển từ code sang slide** đã nâng nhãn lên.

---

## 4. HALLUCINATION — 4 cơ chế và bằng chứng

### Cơ chế 1: Số liệu ngành chép kèm tên nguồn không được kiểm
- `30–35% xe chạy rỗng (World Bank & VLA)` → WB thật nói 50–70%.
- `>57 triệu tấn CO₂` → không nguồn nào nói vậy.
- `VLA >30.000 hội viên` → thật là 400+.
- **Nhận dạng:** số "tròn trịa, hợp lý, có tên tổ chức uy tín" nhưng không ai mở nguồn ra đọc.

### Cơ chế 2: Nhãn trạng thái bị nâng cấp khi viết tài liệu
- Mẫu của BTC có ô "kết quả đạt được" → điền `[ĐÃ KIỂM CHỨNG]` cho tính năng đang ở mức thư viện (ALNS, Pareto, telemetry, cấm tải).
- **Nhận dạng:** cùng một sự thật, trong code ghi "library-only, no HTTP route", trên slide thành "đã tích hợp".

### Cơ chế 3: Viết từ tài liệu thiết kế thay vì từ code
- EcoALNS / Pareto ε-SLA / benchmark harness / telemetry **có code + test nhưng không có endpoint**; cờ `GREENLOGIX_OPTIMIZER=ecoalns` chỉ đổi **nhãn audit**.
- **Nhận dạng:** feature có thật trong repo nhưng không có đường người dùng chạm tới.

### Cơ chế 4: Số không đo được nhưng vẫn ghi như số đo
- `< 100 ms`, `solver < 5 s`, `API edge < 50 ms`, `142,8 kg CO₂ tiết kiệm` (không nhãn nguồn).
- **Nhận dạng:** không có file log/artifact nào chứa con số, tái lập không được.

### Điểm cần nói rõ khi bị chất vấn
> "Dự án được xây dựng với trợ lý AI, và chúng tôi đã tự soát lại: phần **mã nguồn và kiểm thử** thì chính xác và tái lập được; phần **số liệu trình bày** có những chỗ bị nâng nhãn và hai số liệu ngành bị dẫn sai nguồn. Chúng tôi đã sửa và gỡ các claim không có nguồn — đây là bản audit do chính chúng tôi thực hiện."

Đây là câu trả lời **mạnh**, không phải yếu: nó cho thấy nhóm tự kiểm soát được chất lượng bằng chứng — đúng thứ giám khảo chấm.

---

## 5. TIÊU CHÍ CỦA TỪNG CUỘC THI (đọc từ rulebook thật) → claim nào đang vi phạm

### RnD to Startup 2026 — trọng số chấm 100 điểm
| Tiêu chí | Tỷ trọng | Claim hiện tại có khớp? |
|---|---|---|
| Vấn đề & nhu cầu thị trường | **20%** | Có 5 Whys + persona; **chưa có số cuộc phỏng vấn** (Snapshot tự ghi `[CHƯA CÓ]`) |
| Tính đổi mới sáng tạo / R&D | **25%** | Có paper + model vật lý; nhưng ALNS chưa nối endpoint |
| Khả năng triển khai & sản phẩm/thử nghiệm | **20%** | MVP chạy thật — đây là điểm mạnh nhất |
| Mô hình kinh doanh & tác động | 15% | Có BMC + doanh thu; tác động CO₂ còn là giả định |
| Đội ngũ & năng lực thực thi | 10% | Mạnh (6 thành viên, có kinh nghiệm vận hành/logistics) |
| Kỹ năng trình bày & phản biện | **10%** | **Đây là chỗ buổi training nhắm vào** |

Ngoài ra handbook ghi: *"BTC có quyền yêu cầu các đội thi **giải trình hoặc cung cấp minh chứng** về tính nguyên bản, dữ liệu khảo sát, kết quả nghiên cứu và prototype khi cần thiết."* → phải chuẩn bị sẵn file minh chứng cho mọi con số.

### VSIC 2026 — handbook yêu cầu gì về dữ liệu
- *"Củng cố bằng dữ liệu: ưu tiên số liệu cụ thể, **có nguồn và thời điểm thống kê rõ ràng**."* → 3 con số ở §3 mục 4/5/6 **đang vi phạm trực tiếp** yêu cầu này.
- Trọng số vòng 2: Training 15% + Mentoring 15% + Pitching Day 70%; trong quá trình, thái độ 5% (tham gia 40 / tương tác 30 / hoàn thiện bài tập 30) — theo Tracking sheet, tuần 12/10–18/10 đã có Mentoring 02, 03, Training 1 diễn ra 19h–22h ngày 10/10.
- BGK vòng 1 đã hỏi thẳng: *"Nếu thuật toán tối ưu trên dữ liệu nhưng điều phối viên hoặc tài xế không chấp nhận tuyến, EcoMiles coi đó là lỗi thuật toán hay vấn đề thay đổi hành vi?"* → xem §7 câu trả lời.

### Panasonic Đại sứ GEN G 2026
Chủ đề 30 · Mới/sáng tạo 25 · Khả thi 20 · Tác động cộng đồng & môi trường 25 → 2 claim "ISO 14083" và "−88%" **trực tiếp đe doạ** phần Tác động + Khả thi.

### Chương trình Phát triển dự án khởi nghiệp quốc gia 2026
Format pitch 10 điểm có mục **"4. Kiểm chứng vấn đề — số liệu khảo sát, phỏng vấn, kiểm chứng thị trường"** → đây chính là chỗ dự án **yếu nhất và đang trống** (Snapshot tự khai chưa có số cuộc phỏng vấn). Hạn nộp sơ loại 31/10.

### HITC Innostar 2026 (hạn 22/10)
Mẫu 02 **còn trống**; Mẫu 01 khai "Giai đoạn hiện tại: **Ý tưởng**" trong khi nơi khác khai MVP đã chạy → phải thống nhất trước khi nộp.

---

## 6. RỦI RO PHÁT SINH KHI TỔNG HỢP

1. **PII nặng trong link công khai:** Phiếu đăng ký chương trình quốc gia (`docs.google.com/document/d/1lHAfzac…`) chứa **số CCCD, ngày cấp, nơi cấp, ngày sinh, địa chỉ** của 5 thành viên. Link này nằm trong master sheet. Nếu sheet được chia sẻ rộng, đây là rò rỉ dữ liệu cá nhân theo NĐ 13/2023. **Đề xuất:** chuyển sang chế độ "bất kỳ ai có link đều xem" → chỉ người có quyền, hoặc xoá ảnh CCCD khỏi bản chia sẻ.
2. **Ba bộ KPI khác nhau** sẽ bị hỏi ngay khi 2 giám khảo đọc chéo hồ sơ.
3. **Nhãn `[ĐÃ KIỂM CHỨNG]` dùng sai chỗ** làm mất giá trị của những nhãn dùng đúng (test, build, deploy).

---

## 7. VIỆC PHẢI SỬA (theo thứ tự)

| # | Việc | Ở đâu | Thời lượng |
|---|---|---|---|
| 1 | Gỡ/thay 6 claim ở §3 (mục 1,2,3,4,5,6) | VSIC Snapshot, đề án SO/Panasonic, slide | 60 phút |
| 2 | Thống nhất **một** bộ KPI: `15–25% km / 5–12% CO₂ – [GIẢ ĐỊNH – CẦN PILOT]` | mọi tài liệu | 30 phút |
| 3 | Thống nhất giai đoạn dự án giữa HITC ↔ VSIC ↔ RnD | 3 hồ sơ | 20 phút |
| 4 | Điền **HITC Mẫu 02** (đang trống, hạn 22/10) | Google Doc | 2 giờ |
| 5 | Bổ sung cột "Nguồn + thời điểm" cho mọi số liệu ngành (yêu cầu của VSIC) | pitch deck | 45 phút |
| 6 | Chuẩn bị bộ minh chứng tải sẵn: log pytest, ảnh QA, version deploy, `emission_factors.json`, WB 2019 trang empty backhaul | 1 folder | 1 giờ |
| 7 | Siết quyền chia sẻ file có CCCD | Drive | 10 phút |

### Câu chữ thay thế đã kiểm chứng
| Thay vì | Viết |
|---|---|
| "tích hợp đầy đủ khung giờ và cấm tải" | "hiện áp dụng sức chứa là ràng buộc cứng; giờ cấm tải và khung giờ đang ở mức cảnh báo, sẽ chuyển thành ràng buộc cứng sau pilot" |
| "engine CO₂ theo GLEC 3.2 / ISO 14083" | "ước tính TTW theo hệ số IPCC 2006 (diesel 2,68 / xăng 2,31 kgCO₂/L), tham chiếu GLEC v3.2; chưa phải báo cáo kiểm kê ISO 14083 và chưa được kiểm chứng độc lập" |
| "−88% CO₂" | "trên bộ dữ liệu mô phỏng 80 đơn/10 xe, so với kịch bản chạy không gom cụm: −88% `[MÔ PHỎNG]`; kỳ vọng thực địa 15–25% `[CẦN PILOT]`" |
| "dẫn đường Google Maps xe tải" | "mở Google Maps ở chế độ ô tô kèm cảnh báo; tài xế vẫn phải tuân thủ quy định tải trọng và giờ cấm tải của EcoMiles" |
| "30–35% xe chạy rỗng" | "khảo sát của Ngân hàng Thế giới (2019) tại Việt Nam ghi nhận tỷ lệ chạy rỗng 50–70%" |
| ">57 triệu tấn CO₂" | "phát thải toàn ngành GTVT khoảng 33–40 triệu tấn CO₂ giai đoạn 2014–2023, đường bộ chiếm phần lớn" |
| "VLA 30.000 hội viên" | "VLA là hiệp hội logistics lớn nhất Việt Nam (danh bạ hội viên 2019: hơn 400 doanh nghiệp)" |

---

## 8. Đối phó với câu hỏi "số này lấy từ đâu?"

Trả lời theo 3 tầng, luôn theo thứ tự này:

1. **Đo được trong repo** → "Tái lập được bằng một lệnh: `uv run pytest -q` ra 526; seed 80/10 và so baseline cho ra 791,35 → 94,74 km" — mở máy chạy luôn nếu được yêu cầu.
2. **Tự dựng, chưa có thật** → "Đây là mô hình, không phải kết quả: dữ liệu mô phỏng, baseline tự chọn, chưa có khách hàng thật" — luôn kèm nhãn.
3. **Nguồn ngoài** → nêu **tên tổ chức + năm + số trang** ("World Bank 2019, *Strengthening Vietnam's Trucking Sector*, phần Operations, tr. ~60: empty backhaul 50–70%").

Quy tắc vàng: **nếu không nêu được nguồn + năm trong 5 giây, không được đưa con số đó vào slide.**

---

*Nguồn đã kiểm cho tài liệu này: master sheet (7 tab) và VSIC Tracking Performance (4 tab) export XLSX; PDF/Google Docs tải trực tiếp: HITC Mẫu 01 & 02, Phiếu ĐK chương trình quốc gia, RnD handbook, RnD đơn cam kết, VSIC Pitch Deck Handbook, Panasonic thể lệ, VSIC nhận xét BGK; World Bank 2019 *Strengthening Vietnam's Trucking Sector* (PDF gốc, grep "empty backhaul"); World Bank *Pathway to Low-Carbon Transport* (33,2 Mt 2014 → 89,1 Mt 2030); mae.gov.vn (39,3 Mt, 2023, 11% quốc gia); logistics.gov.vn & VLA (16,8–17% GDP); vla.com.vn danh bạ 2019 ("over 400 members"); IPCC 2006 Vol.2 Ch.1 (NCV + EF); developers.google.com/routes (LVR limited availability); maps.vietmap.vn (truck/container profile); repo: `apps/api/src/greenlogix_api/**`, `FRONTIER_GAP_AUDIT_2026-09-28.md`, `docs/audit/PROPOSAL_ECOMILES_TECH_AUDIT.md`, `TEST_READY.md`; và test tự chạy 2026-10-18 (526 + 15 + 16).*
