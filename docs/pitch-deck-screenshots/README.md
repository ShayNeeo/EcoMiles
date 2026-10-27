# EcoMiles Pitch Deck Screenshot Suite (Desktop · Tablet · Mobile · 16:9 Slide Composites)

Generated and verified via the **Oh My Pi ReAct Thought-Action-Observation Loop** (`Planner` $\rightarrow$ `Orchestrator` $\rightarrow$ `Worker` $\rightarrow$ `Auditor` / `Reviewer` / `Security-Reviewer`) across **Desktop (`1440×900`)**, **Tablet (`iPad 768×1024`)**, and **Mobile (`iPhone 390×844`)**, plus **4 Slide-Ready 16:9 (`1920×1080`) Framed Multi-Device Composites**.

All 20 PNG assets are stored in:
- Local folder: `docs/pitch-deck-screenshots/`
- Live CDN URL prefix: `https://ecomiles.pages.dev/pitch-deck-screenshots/<filename>`

---

## 1. Slide-Ready 16:9 (`1920×1080`) Multi-Device Framed Composites (Drop Directly into Pitch Deck Slides)

| # | File | Recommended Pitch Deck Slide (`pitch-deck-playbook`) | Devices Shown |
|---|---|---|---|
| **17** | [`17_slide_composite_all_devices_hero_trio.png`](17_slide_composite_all_devices_hero_trio.png) | **Slide 3 — Product Reveal ("Proof of Existence")** | Desktop (`1440×900` B2B CRM/TMS) + Tablet (`768×1024` `/maps` Cockpit) + Mobile (`390×844` Driver App) |
| **18** | [`18_slide_composite_driver_and_maps_mobile_tablet.png`](18_slide_composite_driver_and_maps_mobile_tablet.png) | **Slide 5 — Field Execution & $0 Map API Architecture** | Tablet Cockpit (`/maps?mode=navigate`) + 3 Mobile Views (`Middle-Mile >500kg`, `Last-Mile ≤500kg`, `Live Turn-by-Turn`) |
| **19** | [`19_slide_composite_dispatcher_and_evsim_benchmark.png`](19_slide_composite_dispatcher_and_evsim_benchmark.png) | **Slide 6 — Algorithmic Proof & Benchmark (`-34.9% km`, `-39.2% CO₂e`)** | Desktop EVSIM Dual Simulator (`374.4 km` vs `243.7 km`) + Desktop `/maps` QĐ 23/2018 Banned Zones Overview |
| **20** | [`20_slide_composite_4role_enterprise_architecture.png`](20_slide_composite_4role_enterprise_architecture.png) | **Slide 8 — Enterprise RBAC & Zero-Knowledge Security (`AES-256-GCM`)** | 2×2 Desktop Quad across all 4 isolated roles (`User`, `Tester`, `Driver`, `Zero-Knowledge Admin`) |

---

## 2. Desktop Suite (`1440×900` Viewport)

| # | File | Role / Route | Key Proof Shown |
|---|---|---|---|
| **01** | [`01_desktop_b2b_tms_fleet_overview.png`](01_desktop_b2b_tms_fleet_overview.png) | Role 1 (`User`) · `/dashboard` | Single-row role-isolated header, B2B Company Switcher, 6-Cell Hairline KPI Strip (`94/120 đơn`, `7/10 xe`, `243.7 km (-34.9%)`, `2.7% chạy rỗng`), Fleet Execution Table |
| **02** | [`02_desktop_b2b_tms_evsim_dual_simulator.png`](02_desktop_b2b_tms_evsim_dual_simulator.png) | Role 1 (`User`) / Role 2 (`Tester`) | Embedded EVSIM Dual Simulator inside CRM/TMS (`374.4 km / 28 lỗi QĐ 23` vs `243.7 km / 0 lỗi QĐ 23`) |
| **03** | [`03_desktop_b2b_tms_routing_qd23_ban_guard.png`](03_desktop_b2b_tms_routing_qd23_ban_guard.png) | Role 1 (`User`) · `Điều phối & Thuật toán` | Multi-Constraint VRPTW + QĐ 23/2018 Banned Truck Zone Guard + Interactive Route Canvas |
| **04** | [`04_desktop_maps_overview_qd23_banned_zones.png`](04_desktop_maps_overview_qd23_banned_zones.png) | `/maps?mode=overview` | View 1: HCMC QĐ 23/2018 Red Banned Corridors, 13T Bridge Clearances, and 7-Stop Street Breakdown |
| **05** | [`05_desktop_maps_live_navigate_follow_truck.png`](05_desktop_maps_live_navigate_follow_truck.png) | `/maps?mode=navigate` | View 2: Google-Maps-style "Start" Live Follow-Truck Cockpit (`36 km/h`, green traveled trail, blue ahead route, Vietnamese TTS) |
| **06** | [`06_desktop_driver_2tier_middle_and_last_mile.png`](06_desktop_driver_2tier_middle_and_last_mile.png) | Role 3 (`Driver`) · `/driver` | 2-Tier Driver App (`1. Chặng Giữa >500kg` OpenTruck `/maps` + `2. Chặng Cuối ≤500kg` Google Maps `?api=1` Waypoints) |
| **07** | [`07_desktop_admin_zero_knowledge_audit.png`](07_desktop_admin_zero_knowledge_audit.png) | Role 4 (`Admin`) · `/dashboard` | Zero-Knowledge AES-256-GCM Blinded Multi-Tenant Monitor (`admin_can_decrypt = false`, `0%` PII decryption) |
| **08** | [`08_desktop_public_landing_hero.png`](08_desktop_public_landing_hero.png) | Public Landing · `/` | B2B SaaS Hero & Value Proposition |

---

## 3. Tablet Suite (`iPad Portrait 768×1024` Viewport)

| # | File | Role / Route | Key Proof Shown |
|---|---|---|---|
| **09** | [`09_tablet_b2b_tms_fleet_overview.png`](09_tablet_b2b_tms_fleet_overview.png) | Role 1 (`User`) · `/dashboard` | Responsive horizontal touch pill navigation (`<aside>` height reduced from `650px` to `110px`), above-the-fold KPI grid |
| **10** | [`10_tablet_evsim_dual_simulator.png`](10_tablet_evsim_dual_simulator.png) | Role 2 (`Tester`) · `/benchmark` | Tablet Judge Workbench comparing Manual Dispatch (`374.4 km`) vs EcoMiles (`243.7 km`) |
| **11** | [`11_tablet_maps_live_navigate_cockpit.png`](11_tablet_maps_live_navigate_cockpit.png) | `/maps?mode=navigate` | Cab-Mounted Tablet Truck Navigation Cockpit (`36 km/h`, QĐ 23/2018 compliance banner, HCMC street map) |
| **12** | [`12_tablet_driver_middle_mile_manifest.png`](12_tablet_driver_middle_mile_manifest.png) | Role 3 (`Driver`) · `/driver` | Warehouse & Cab Tablet Driver Manifest with Backhaul Matchmaking (`+2 đơn chiều về · 159.1 kg`) |

---

## 4. Mobile Suite (`iPhone 15 Pro 390×844` Viewport)

| # | File | Role / Route | Key Proof Shown |
|---|---|---|---|
| **13** | [`13_mobile_driver_middle_mile_hud.png`](13_mobile_driver_middle_mile_hud.png) | Role 3 (`Driver`) · `/driver` (`>500kg`) | Mobile In-Cab Dark-Green OpenTruck HUD (`Mở Bản Đồ Vùng Cấm (/maps)` + `Bắt Đầu Lái (/maps Live)`) |
| **14** | [`14_mobile_driver_last_mile_gmaps_waypoints.png`](14_mobile_driver_last_mile_gmaps_waypoints.png) | Role 3 (`Driver`) · `/driver` (`≤500kg`) | Mobile Last-Mile Car/Van HUD with Locked Google Maps `?api=1` Waypoints (`lat,lng|lat,lng`) |
| **15** | [`15_mobile_maps_live_follow_truck_nav.png`](15_mobile_maps_live_follow_truck_nav.png) | `/maps?mode=navigate` | Mobile Turn-by-Turn Follow-Truck Navigation with non-overlapping speedometer (`36 km/h`) and recenter badge (`Căn giữa`) |
| **16** | [`16_mobile_b2b_tms_executive_kpi.png`](16_mobile_b2b_tms_executive_kpi.png) | Role 1 (`User`) · `/dashboard` | Zero-overflow (`390px === 390px`) Mobile Executive KPI Dashboard (`94/120`, `7/10 xe`, `243.7 km`, `2.7% chạy rỗng`) |
