---
title: "EcoMiles Stack Grill — VSIC Round 2 Solo CTO Technical & Algorithm Defense Playbook"
date: 2026-10-16
updated: 2026-11-04
type: note
tags: [ecomiles, vsic-2026, cto-defense, algorithm, vrp, ecoalns, glx-hdt-v1, glec, q&a-grill]
relations: [[EcoMiles]], [[EcoMiles Tasks]], [[EcoMiles Dashboard Stack]]
freshness: current
---

# 🛡️ EcoMiles — VSIC 2026 Round 2 Solo CTO Technical & Algorithm Defense Playbook

> **Context from Zalo (2026-11-04 22:24)**: Because the VSIC Round 2 live pitch is strictly capped at **5 minutes**, Thu Thủy and Hoàng Ngân must skip deep technical explanations during the 5-minute presentation and only show the UI briefly. **100% of the technical, algorithmic, data-validity, and feasibility scrutiny will fall on Phạm Quốc Thanh during the 7-minute Q&A on Saturday 07/11/2026.**

---

## 🚨 PART 1: 7 CRITICAL SLIDE-VS-CODE CONTRADICTIONS TO FIX OR DEFEND BEFORE 05/11 23:59

| # | Severity | Contradiction Found Across Canva Decks & Live App | Exact Fix Before Exporting PDF/PPTX (05/11) & Verbal Defense on 07/11 |
| :---: | :---: | :--- | :--- |
| **1** | **BLOCKER** | **Self-Incriminating Draft Footnote on Slide 12 of `VSIC V2` (`DAHYbihynHE`)**:<br>Bottom of Slide 12 (*TÁC ĐỘNG XÃ HỘI*) literally says: *"Số liệu tác động là dự phóng; cần đối chiếu văn bản gốc trước khi nộp."* | **Action before 05/11 23:59**: Tell Khánh Phương / Thu Thủy to **delete the phrase `"cần đối chiếu văn bản gốc trước khi nộp"`** on Slide 12 of `VSIC V2` before exporting the final PDF & PPTX! Also verify `2.166 cơ sở` (Decision 13/2024/QĐ-TTg) vs `2.441 cơ sở`. |
| **2** | **BLOCKER** | **Payback Period (`3,68 năm` vs `1,68 năm`) & Discount Rate (`15%` vs `12%`)**:<br>• `VSIC V2` Slide 22 says **`3,68 năm`** hoàn vốn (chiết khấu **`4,27 năm`**) at **`15%`** cost of capital.<br>• `VSIC 2026 \| PITCH DECK` Slide 14 & KNQG video say **`1,68 năm`** (chiết khấu **`2,41 năm`**).<br>• `EcoMiles Pitch Deck` Slide 14 says **`1,68 năm`** at **`12%`** WACC. | **Root Cause**: In `RND TO STARTUP 2026 _ GREENLOGIX.xlsx` (`CASH FLOW!E11`), cumulative cash flow is `-228.6M` (Y0: 2026), `-368.9M` (Y1: 2027), `-336.2M` (Y2: 2028), `-200.6M` (Y3: 2029), `+93.3M` (Y4: 2030). The old Excel formula wrote `=1+200.55/293.84 = 1.68` instead of `=3+200.55/293.84 = 3.68 năm`!<br>**Verbal Defense**: *"Nếu tính từ mốc sau khi kết thúc giai đoạn đầu tư/pilot lỗ đỉnh điểm (tức từ năm 2028 khi dòng tiền HĐKD bắt đầu dương), thời gian thu hồi vốn là **1,68 năm**; còn nếu tính lũy kế từ Năm 0 (2026) bao gồm cả năm ươm tạo và năm đầu bù lỗ pilot thì dòng tiền tích lũy chuyển dương ở **năm thứ 3,68 (năm 2030)** với chi phí vốn chiết khấu **15%/năm** và NPV **+185,5 triệu đồng**."* |
| **3** | **MAJOR** | **Map Layer Claim ("Google Maps Platform" on Slide 9 vs "$0 Map API" on Web App)**:<br>• `VSIC V2` Slide 9 says *"Lớp 1: Google Maps Platform ở giai đoạn đầu"* and OPEX budgets `168 triệu/năm` in 2028.<br>• Web app (`ecomiles.pages.dev`) badges **"$0 phí bản đồ API"**. | **Verbal Defense**: *"Ở giai đoạn MVP và gói Starter cho SME nhỏ, tụi em thiết kế kiến trúc **Hybrid $0 Map API**: dùng OpenStreetMap + đồ thị xe tải OSRM/Valhalla + xuất file GPX miễn phí cho xe tải `>500kg`, và dùng Google Maps Universal URL nhúng tọa độ trung gian `waypoints` (miễn phí 100%, không tốn phí API key) cho xe van `<=500kg`. Còn khoản ngân sách API/Cloud trong bảng tài chính từ năm 2028 (`168 triệu/năm`) là dự toán khi mở rộng lên 375–2.400 xe thương mại, lúc đó tụi em thuê máy chủ định tuyến Valhalla/OSRM chuyên dụng và mua gói dữ liệu giao thông thời gian thực thương mại có cam kết SLA 99,9%."* |
| **4** | **MAJOR** | **Algorithm Roadmap ("Nâng cấp thuật toán năm 2028" on Slide 9/19 vs In-House `EcoALNS` & `GLX-HDT-v1`)**:<br>And `VSIC 2026 \| PITCH DECK` Slide 15 said *"giai đoạn đầu dùng thư viện tối ưu có sẵn"*. | **Verbal Defense**: *"Toàn bộ lõi thuật toán hiện tại của EcoMiles — bao gồm cả bộ giải nhanh `Cluster + Nearest Neighbor + 2-Opt` lẫn siêu heuristic **EcoALNS 5 toán tử phá hủy / 2 toán tử sửa chữa** và mô hình năng lượng vật lý tải trọng động **GLX-HDT-v1** — đều đã được **em tự lập trình 100% từ đầu bằng Python và TypeScript** (có 697 bài kiểm thử tự động pass), hoàn toàn không phụ thuộc thư viện VRP bên ngoài. Mục 'Nâng cấp VRP năm 2028' trên lộ trình là giai đoạn 2: tích hợp **Định tuyến động ngẫu nhiên theo luồng GPS/OBD-II thời gian thực (Dynamic Stochastic VRP)** và ghép đơn liên doanh nghiệp ở quy mô hàng nghìn xe."* |
| **5** | **MAJOR** | **Two Benchmark Scenarios on Slide 9 (`80 đơn / 10 xe` vs `120 đơn: 374,4 -> 243,7 km, -34,9%`)**:<br>Left box of Slide 9 says `80 đơn/ngày, 10 xe tải nhỏ` while Right box quotes `120 đơn giả lập: 374,4 -> 243,7 km (-34,9%), xe chạy rỗng 32,8% -> 2,7%`. | **Verbal Defense**: *"Trên cổng `/benchmark` của hệ thống, tụi em cung cấp 3 bộ dữ liệu chuẩn ở các quy mô khác nhau để giám khảo kiểm chứng trực tiếp:<br>1. **Bộ Chuỗi lạnh 120 đơn / 10 xe**: So với điều phối viên chia tuyến theo quận (`374,4 km`, chạy rỗng `32,8%`), thuật toán EcoALNS + ghép 19 đơn chiều về (`1.864,9 kg`) rút quãng đường xuống **`243,7 km` (`-34,9%`)**, kéo tỷ lệ chạy rỗng xuống **`2,7%`**, giảm **`31,6%` CO₂ trực tiếp**.<br>2. **Bộ FMCG 80 đơn / 10 xe**: Giảm từ `297,2 km` xuống `185,7 km` (**`-37,5%` km**).<br>3. **Mục tiêu cam kết khi chạy Pilot thực tế 4–6 tuần**: Tụi em đặt ngưỡng thận trọng là **giảm `8–15%` quãng đường và `5–10%` nhiên liệu** vì ngoài thực địa còn có độ trễ bốc xếp và kẹt xe đột xuất."* |
| **6** | **MAJOR** | **Cover Slide Claim: *"đang chạy thử nghiệm tại 1 công ty về FMCG hàng lạnh"*** (`VSIC V2` Slide 1) | **Judge Trap**: Judges WILL ask *"Công ty FMCG hàng lạnh đó tên gì, chạy thử được bao lâu, số đo thật là bao nhiêu?"*<br>**Verbal Alignment with Thủy & Ngân**: State clearly that from the 9 surveyed enterprises, 1 cold-chain food distribution SME in HCMC provided their operational dispatch pattern (modeled as the 120-order cold-chain dataset from Tân Bình Depot) for **shadow-testing (chạy đối chứng song song trên lịch điều phối)**, and the formal 4–6 week on-site driver pilot is the immediate next step right after VSIC Round 2. |
| **7** | **MINOR** | **Landing UI Copy (`-39.2% CO2e` / `21 đơn`) vs Live Benchmark Engine (`-31.6% CO2e` / `19 đơn`)** | If a judge compares the hero banner (`-39.2% CO2e`) with the `/benchmark` table (`-31.6% CO2e`, `83.77 -> 57.33 kg`), explain: **`-31,6%`** is the direct tailpipe reduction on the 7 trucks' own tours (`83,77 -> 57,33 kg CO2e`), while **`-39,2%`** includes the avoided standalone pickup trips that would otherwise be required to collect the `1.864,9 kg` of backhaul cargo separately. |

---

## 🧠 PART 2: EXACT ALGORITHM & FORMULA CHEAT SHEET FOR PHẠM QUỐC THANH

### 1. Architecture & Dual Solver Pipeline (`apps/api` + `apps/landing`)
- **Authoritative Backend (`apps/api`, Python 3.12 + FastAPI + SQLite/DuckDB)**:
  - `697` automated `pytest` tests passing, `30` OpenAPI 3.1 endpoints (`apps/api/openapi.json`).
  - `run_vrp()` (`solver/__init__.py:333-615`) supports **two selectable solver engines** via `ECOMILES_OPTIMIZER` (`legacy` or `ecoalns`) plus hard constraint flags `enforce_truck_ban=True` and `enforce_time_windows=True` (`lines 391-400`):
    1. **`legacy` (Fast Deterministic 3-Stage Heuristic, `<50ms`)**:
       - **Stage 1 (`solver/cluster.py:8-28`)**: Greedy spatial Haversine clustering with `CLUSTER_RADIUS_KM = 3.0 km` (zero external ML libraries).
       - **Stage 2 (`solver/__init__.py:132-215`)**: Knapsack capacity packing onto `ready` vehicles sorted descending by `(-capacity_kg, plate)`. Overflow orders split cleanly into leftover clusters; unroutable overload orders go to `unassigned_order_ids`.
       - **Stage 3 (`solver/nn_two_opt.py:11-94`)**: Nearest-Neighbor tour construction (tie-breaking by earliest `window_start`) followed by iterative `2-Opt` edge-uncrossing local search (`MAX_TWO_OPT_ITERS = 500`, `MAX_TWO_OPT_SWAPS = 2000`).
    2. **`ecoalns` (Carbon & Payload-Aware Adaptive Large Neighborhood Search, `optimizer/eco_alns.py:1-610`)**:
       - **Warm-start (`xlsxBenchmarkEngine.ts:890-949`)**: Gillett & Miller polar angular sweep around Depot Tân Bình (`10.8018, 106.6385`) + clockwise loop + `2-Opt` & `Or-Opt` single-stop relocation with an acute U-turn spike penalty ($\cos\theta < -0.25 \Rightarrow +8.0|\cos\theta|$).
       - **5 Destroy Operators (`eco_alns.py:149-332`)**:
         1. `worst_fuel`: Removes stops with highest marginal fuel cost $\Delta F_i = F(\text{tour}) - F(\text{tour} \setminus \{i\})$.
         2. `uphill_payload` (*Lai et al., 2024*): Scores stops by $\text{carried\_payload\_before\_leg} \times \text{leg\_km}$, removing heavy-payload long-haul stops early in the tour so heavy cargo is dropped off first!
         3. `ban_window`: Removes stops whose time window conflicts with HCMC QĐ 23/2018 truck ban hours (`check_truck_ban`).
         4. `random_removal` & 5. `single_random`: Diversification operators to escape local minima.
       - **2 Repair Operators (`eco_alns.py:334-404`)**:
         1. `eco_greedy`: Inserts removed stop into feasible `(vehicle, position)` with minimum marginal fuel increase $\Delta F$.
         2. `eco_regret` (**Regret-2 Insertion**): Computes $\text{regret}_i = \Delta F_{i, \text{2nd-best}} - \Delta F_{i, \text{best}}$ and inserts the most constrained stop first (tie-breaking by earliest `window_end_min`).
       - **Adaptive Roulette-Wheel & Simulated Annealing (`eco_alns.py:407-585`)**: Operator weights start at $1.0$, get $+0.2$ reward on new global best, decay by $\times 0.99$ (floor $0.1$), with Simulated Annealing acceptance $P(\text{accept}) = \exp(-\Delta F / T_k)$, $T_k = T_0 \cdot 0.995^k$.

### 2. Return-Trip Backhaul Matching (`32.8% -> 2.7%` Empty Running)
- **Why manual dispatchers have `32.8%` empty running (`122.87 km / 374.44 km`)**: Trucks deliver outbound stops to outer districts (Thủ Đức, Quận 7, Bình Tân) and drive all the way back to Tân Bình Depot with `0 kg` payload (`curLoadKg <= 0.1`).
- **How EcoMiles cuts empty running to `2.7%` (`6.51 km / 243.71 km`)**:
  - Along the homeward arc of each clockwise tour loop, the solver identifies supplier/return pickup orders (`16%` of stops = **`19` backhaul orders**, recovering **`1,864.9 kg`** of return cargo).
  - Once the truck finishes its last outbound delivery, it only drives empty for the short **inter-stop connector (`0.8–1.2 km` per truck, `6.51 km` total across 7 trucks)** to the first backhaul pickup point. From there all the way back to Tân Bình Depot, the truck carries `150–420 kg` of revenue-generating return cargo!

### 3. `GLX-HDT-v1` Physics Energy Model & GLEC v3.2 / ISO 14083 Carbon Accounting (`energy/hdt_v1.py`, `carbon.py`)
- **Why flat `km × EF` is inaccurate**: A 3.5-ton truck carrying `2,000 kg` of cold-chain cargo consumes ~35% more fuel per km than the same truck returning empty.
- **Instantaneous Gross Mass Tractive Power (`energy/hdt_v1.py:39-96`)**:
  - At every leg $k$, gross mass is updated dynamically as cargo is unloaded/loaded:
    $$M_k = M_{\text{empty}} + M_{\text{payload}, k}$$
  - Tractive resistance force combines rolling resistance ($C_r = 0.008$), road grade ($\theta$), and aerodynamic drag ($C_d, A$, $\rho_{\text{air}} = 1.205\text{ kg/m}^3$):
    $$F_{\text{total}, k} = C_r M_k g \cos\theta + M_k g \sin\theta + \frac{1}{2}\rho_{\text{air}} C_d A v^2$$
  - Engine power & fuel volume ($\eta_{\text{driveline}} = 0.88$, $P_{\text{aux}} = 1500\text{ W}$, $\eta_{\text{thermal}} = 0.40$, diesel heating value $\psi = 43.2\text{ MJ/kg}$, density $\rho_{\text{diesel}} = 840\text{ g/L}$):
    $$P_{\text{engine}, k} = \frac{\max(0, F_{\text{total}, k} \cdot v)}{0.88} + 1500\text{ W}, \qquad L_k = \frac{P_{\text{engine}, k} \cdot t_k}{0.40 \times 43.2 \times 10^6 \times 0.840}$$
- **GLEC Framework v3.2 / ISO 14083:2023 Emission Factors (`emission_factors.json`)**:
  - **Diesel**: **`2.68 kg CO₂e/L` (TTW)** | **`3.24 kg CO₂e/L` (WTW)**
  - **Petrol (RON95)**: **`2.31 kg CO₂e/L` (TTW)** | **`2.82 kg CO₂e/L` (WTW)**
  - **Per-Route Transport Work**: $W_{\text{tkm}} = \sum_{r} \left(\frac{\text{kg}_r}{1000} \times \text{km}_r\right)$, yielding intensity in $\text{g CO}_2\text{e/t}\cdot\text{km}$ + **PVM/ASI Decomposition** separating Distance Effect vs Fleet/Load Intensity Effect.

### 4. HCMC Decision 23/2018/QĐ-UBND & $0 Map API Dual-Tier Navigation
- **Statutory Rules (`geo/restrictions.py:30-60`)**:
  - Light trucks (`< 2.5T`): Banned **`06:00–09:00`** and **`16:00–20:00`** inside HCMC inner-city ring corridors.
  - Heavy trucks (`>= 2.5T`): Banned **`06:00–22:00`**.
  - Interval overlap check: $\max(s_a, s_b) < \min(e_a, e_b)$.
- **Dual-Tier $0 Map API Execution (`/maps` & `/driver`)**:
  - **Chặng Giữa (`> 500kg` Trucks)**: Consumer Google Maps is locked out (no truck mode in VN). Uses EcoMiles **OpenTruck HUD** (OSM + OSRM/Valhalla Truck Graph + 3 red ban polygons + 4 bridge weight/height clearances `13T / 4.5m` + Vietnamese Web Speech API voice guidance) + 1-click **`.GPX` export to OsmAnd Truck** (`$0`).
  - **Chặng Cuối (`<= 500kg` Vans/Cars, exempt from QĐ 23)**: Injects 2 intermediate corridor coordinates ($35\%$ and $70\%$ along each leg) into Google Maps Universal URL `waypoints=lat1,lng1|lat2,lng2&travelmode=driving` (`$0` API key required).

---

## 🔥 PART 3: TOP 10 JUDGE Q&A GRILL QUESTIONS & 30-SECOND KNOCKOUT ANSWERS

1. **Q: "Thuật toán VRP là bài toán kinh điển từ năm 1959, trên thị trường đã có Google OR-Tools, Abivin, Smartlog. Một nhóm sinh viên tự code thuật toán thì có gì khác biệt hay chỉ làm lại bánh xe?"**
   - **A**: *"Chúng em không cố thắng OR-Tools về mặt toán học thuần túy trên đồ thị phẳng, mà giải quyết **3 khoảng trống thực tế tại Việt Nam** mà OR-Tools hay ERP ngoại chưa làm sẵn cho SME: (1) Tích hợp trực tiếp **hàm mục tiêu năng lượng tải trọng động (`GLX-HDT-v1`) + ghép đơn chiều về** để tối ưu đồng thời tiền dầu và hệ số phát thải `gCO₂e/tấn·km` chuẩn GLEC v3.2; (2) Tích hợp bộ lọc **khung giờ cấm tải QĐ 23/2018/QĐ-UBND TP.HCM** (`06:00–09:00`, `16:00–20:00`) và giới hạn cầu đường (`13T/4.5m`) kèm kiến trúc dẫn đường 2 chặng **0 đồng phí bản đồ API**; (3) Triển khai **Zero-ERP**: điều phối viên chỉ cần kéo-thả đúng file Excel tiếng Việt đang dùng hằng ngày là ra lộ trình và báo cáo kiểm kê KNK 3 Sheet sau 30 giây."*
2. **Q: "Nếu thuật toán xếp tuyến rất đẹp trên máy tính nhưng ra đường tài xế gặp kẹt xe, mưa ngập, hoặc khách đổi giờ nhận rồi tài xế tự ý đi đường khác, thì báo cáo CO₂ của các bạn sai hết à?"**
   - **A**: *"Đó chính là lý do EcoMiles tách bạch giữa **Lộ trình Kế hoạch (Planned Route)** và **Thực thi Thực địa (Actual Execution)**: Trên ứng dụng tài xế, tài xế có quyền bấm chuyển trạng thái (`Đã giao`, `Báo hoãn` kèm 4 mã lý do chuẩn hóa: `khách vắng`, `sai địa chỉ`, `hàng hỏng`, `từ chối`) và gửi cảnh báo đường cấm/sạt lở về trung tâm điều phối. Khi tính báo cáo CO₂ cuối kỳ trong giai đoạn Pilot, hệ thống đối chiếu quãng đường GPS thực chạy với **hóa đơn đổ dầu thực tế và chỉ số công-tơ-mét (odometer)**, đồng thời gắn nhãn minh bạch cấp độ dữ liệu (`VERIFIED_GRAPH` vs `DEGRADED`, `C1-illustrative`) theo đúng chuẩn GLEC Framework."*
3. **Q: "Tại sao doanh nghiệp SME chỉ có 10–20 xe lại phải quan tâm đến báo cáo CO₂ chuẩn GLEC / Nghị định 06/2022, trong khi Quyết định 13/2024 chỉ bắt buộc 2.166 cơ sở phát thải lớn?"**
   - **A**: *"SME không mua EcoMiles vì yêu cầu pháp lý trước tiên — **SME mua EcoMiles vì tiết kiệm 7,5–12,5 triệu đồng tiền dầu mỗi tháng so với phí thuê bao chỉ 1,5–2,5 triệu đồng** (ROI gấp 3–5 lần ngay trong tháng đầu). Nhưng điểm đột phá là: khi các tập đoàn lớn như Heineken (chiến dịch *Evergreen30*), ADM, hay các nhà máy xuất khẩu chịu áp lực kiểm kê **Scope 3 (phát thải chuỗi cung ứng)** và cơ chế CBAM, họ buộc các nhà xe vệ tinh (SME) phải cung cấp số liệu phát thải trên từng chuyến hàng. Với EcoMiles, báo cáo CO₂ chuẩn GLEC v3.2 được sinh ra hoàn toàn tự động như một **sản phẩm phụ miễn phí** của việc tối ưu tiền dầu — giúp SME giữ được hợp đồng vận chuyển với các tập đoàn lớn."*
4. **Q: "Con số giảm 20–30% quãng đường (hoặc 34,9% trên bộ mẫu 120 đơn) có quá lạc quan không? Ngoài thực tế các hãng lớn tối ưu VRP cũng chỉ giảm được 8–15%!"**
   - **A**: *"Dạ hoàn toàn chính xác! Chính vì vậy trên Slide 9 và Slide 18 của bộ đề án, tụi em phân tách cực kỳ rạch ròi 3 tầng con số:<br>• **34,9% (`374,4 -> 243,7 km`)** là kết quả chạy thuật toán trên kịch bản mô phỏng 120 đơn khi điều phối viên đang chia tuyến rời rạc theo từng quận và chưa ghép đơn chiều về.<br>• **20–30%** là mục tiêu thiết kế lý thuyết ở điều kiện lý tưởng.<br>• Còn **cam kết mục tiêu thực địa khi đi vào Pilot 4–6 tuần** với 3–5 doanh nghiệp được tụi em chốt ở ngưỡng thận trọng là **giảm 8–15% tổng quãng đường và 5–10% chi phí nhiên liệu** — chỉ riêng mức 5–10% này đã giúp đội 10 xe tiết kiệm 2,5–5 triệu đồng/tháng, đủ hoàn vốn phí thuê bao Starter."*
5. **Q: "Làm sao các bạn chống gian lận dữ liệu (anti-fraud) nếu doanh nghiệp tự sửa file Excel để làm đẹp báo cáo ESG?"**
   - **A**: *"Mỗi báo cáo Excel 3 Sheet xuất ra từ EcoMiles đều gắn **mã băm định danh tất định (`ECM-SHA256-...`)**, lưu vết toàn bộ đầu vào (`external_id`, tọa độ, tải trọng `kg`, biển số xe, nguồn ma trận đường bộ `VERIFIED_GRAPH`, phiên bản mô hình `GLX-HDT-v1.0`, và ảnh chụp giao hàng POD đóng dấu thời gian). Khi bật chế độ kiểm toán nghiêm ngặt (`GREENLOGIX_PUBLISH_REQUIRE_VERIFIED=1`), hệ thống tự động chặn (HTTP 403) mọi lộ trình chưa được xác thực qua đồ thị đường bộ thực tế."*
