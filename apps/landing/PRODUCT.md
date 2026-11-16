# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **B2B Logistics Dispatchers & Fleet Managers (Primary)**: Operations leads at Vietnamese SME and mid-market distribution, beverage, grocery, cold-chain F&B, and retail companies (`5-100+` commercial vehicles) who currently split routes manually in Excel + Google Maps and lose hours daily to HCMC Decision `23/2018/QĐ-UBND` inner-city truck bans (`06:00-09:00` & `16:00-20:00`), Hanoi `QĐ 01/2026/QĐ-UBND` (`06:00-21:00` for `>=2T` converted vans inside Ring Road 3), and empty return backhauls.
2. **Commercial Truck & Van Drivers**: Field drivers needing a dedicated personal shift account (`Account riêng`) bound to their single assigned vehicle plate (`51C-000.09`, `51C-000.05`, `51C-000.02`), turn-by-turn truck-safe routing (`$0` map API cost via OSM/OSRM), and automatic compliance with Vietnam's 2024 Road Traffic Safety Law (`<= 4h00` continuous driving limit) and `QCVN 41:2024/BGTVT` (`<950 kg` van rules under `NĐ 168/2024`).
3. **Enterprise Supply-Chain & ESG Auditors**: Multinational shippers and `1,916` mandatory GHG-inventory manufacturing facilities (`QĐ 42/2026/QĐ-TTg`) requiring verifiable Scope 3 transport emissions data under `ISO 14083:2023`, `GLEC Framework v3.2`, and `QĐ 2626/QĐ-BTNMT`.

## Product Purpose

EcoMiles turns a raw ERP/Excel order sheet into conflict-free urban truck and `<950 kg` van routes, matches return-trip backhaul pickups to eliminate empty running, and automatically compiles audit-ready `ISO 14083 / GLEC v3.2` carbon ledgers in under 30 seconds without hardware installation or paid third-party map API fees.

## Positioning

Unlike enterprise TMS platforms (`25M-75M+ VND/month`, 1-3 month setup, no trip-level carbon engine) or per-seat foreign last-mile tools (`$39-$89/driver/month`, zero awareness of HCMC `QĐ 23/2018`, Hanoi `QĐ 01/2026`, or `QCVN 41:2024`), EcoMiles combines **30-second Excel-in dispatch**, **legal time-window & weight-class routing**, **load- and reefer-aware fuel physics (`GLX-HDT-v1`)**, and **multi-tenant Zero-Knowledge `AES-256-GCM` & `Nghị định 13/2023/NĐ-CP` data isolation** starting at `1.5-2.5M VND/month`.

## Operating Context

- **Dispatcher Office**: Desktop web browser (`1280px-1920px`) running interactive Dispatch & Portal workspaces (`Operate` mode) importing `.xlsx`/`.csv` files from SAP, KiotViet, Haravan, or accounting software and exporting 3-sheet Excel ESG ledgers.
- **Driver Cab**: Smartphone/tablet web & Flutter cockpit (`390px-768px`) mounted on a truck dashboard (`Operate` mode) with one-hand status updates and voice turn-by-turn navigation.
- **Public Evaluation, Brand Book & Pitching**: High-contrast editorial marketing site (`/`), flagship Behance-ready brand book (`/brand/`), and dual-map EVSIM simulator (`/benchmark`, `/dashboard`, `/maps`) evaluated by fleet owners, corporate partners, and contest judges.

## Capabilities and Constraints

- Zero third-party per-call Map API fee in MVP/Starter (`OpenStreetMap + OSRM/Valhalla` road graph + explicit weight/ban overlays).
- Empirical HCMC real-order pilot parity:
  - **Beverage 2.5T Truck (`500` orders / `88` days)**: `14,178 -> 9,857 km` (`-30.5%` vs Google Maps; `-22.3%` vs CSV), `543 -> 328` trips, `0` `QĐ 23/2018` breaches & `0` overload.
  - **Grocery `<950 kg` Van (`2,395` valid orders / `393` days / `91` stores)**: Store #01 `13,441 -> 6,611 km` (`-50.8%` vs Google Maps; `-26.0%` vs hourly fill); full 91-store network `46,376 -> 29,508 km` (`-36.4%` vs Google Maps; `-37.5%` vs chronological chain), saving `1,822 L` diesel & `4.88 t` TTW / `5.90 t` WTW GLEC CO₂e.
- Synthetic 120-order cold-chain demo & EVSIM sandbox math remains intact in `xlsxBenchmarkEngine.ts` (`374.4 km -> 243.7 km (-34.9%)`, `32.8% -> 2.7%` empty running, `28 -> 0` `QĐ 23/2018` breaches) with full provenance honesty (`otif_pct: null`, `Heuristic (best-of-refs)`, `modelled fuel, not measured`).
- Strict multi-tenant isolation: authenticated sessions bind to a single `tenant_id` (`NVC-COLD`, `BHX-HCM`, `WCM-ERP`) with HMAC-SHA256 tokens, WebCrypto `AES-256-GCM` keys, and `Nghị định 13/2023/NĐ-CP` PII policies.

## Brand Commitments

- **Language & Visual Density**: Clear, natural business Vietnamese free of raw code jargon on marketing surfaces; prose capped at `<= 30%` via colour-blocked SVG diagrams, bespoke pictograms, statutory ban strips, buttons, and banners.
- **Visual Stance**: Behance/Awwwards-tier **High-Contrast 5-Color Swiss Cartographic Editorial** alternating **Cosmos Blue `#003049`**, **Varden Cream `#FDF0D5`**, **Gochujang Red `#780000`**, **Crimson Blaze `#C1121F` / `#AE1F23`**, and **Blue Marble `#669BBC`** - zero legacy emerald-green or neon-dark bloat.

## Evidence on Hand

- Verified real-order pilot datasets (`500` beverage 2.5T orders + `2,395` valid grocery van orders across `91` stores), summarized empirically without fabrications.
- Live HCMC road-graph benchmark engine (`apps/landing/src/utils/xlsxBenchmarkEngine.ts`) and interactive brand identity showcase (`apps/landing/public/brand/index.html`).
- Python authoritative backend (`apps/api/`, `EcoALNS` + `GLX-HDT-v1`).
- Real product captures under `apps/landing/public/pitch-deck-screenshots/`.
