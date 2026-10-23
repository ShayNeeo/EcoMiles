# Implementation Notes — PDF User Guide for EcoMiles App

### What changed
- Created `scripts/build_user_guide_pdf.py`: Python automation script leveraging Pillow and WeasyPrint to generate annotated UI screenshots with arrows, glowing bounding boxes, and numbered badges, then compile a 9-page PDF user manual.
- Generated 4 annotated high-resolution figures in `docs/assets/annotated/`:
  - `fig1_role_portal.png`: Annotated Role Portal Modal with 4 highlighted callouts and arrows.
  - `fig2_dispatcher_dashboard.png`: Annotated Dispatcher Web Portal with 6 callouts pointing to Seed Data, VRP Solver, Routing Policies, Benchmark KPIs, Vehicle Filters, and Map Restriction Zones.
  - `fig3_dispatcher_stops_bans.png`: Annotated Stop Management View highlighting 80-order list, HCMC truck ban warning tags, vehicle payload constraints, and ESG export buttons.
  - `fig4_driver_mobile_pwa.png`: Annotated Driver Mobile PWA with a 450px expanded side canvas providing an uncluttered margin for badges 1–6 and directional arrows targeting vehicle selection, shift progress, stop address, truck ban warnings, Google Maps driving mode navigation, and status updates.
- Generated `docs/user_guide.html`: Styled multi-page HTML source with dedicated print CSS rules (`@page`, page-break controls, custom color palette matching EcoMiles green/slate identity, tables with alternating row shading, warning callouts).
- Compiled final PDF:
  - `docs/ECOMILES_HUONG_DAN_SU_DUNG.pdf`
  - `ECOMILES_HUONG_DAN_SU_DUNG.pdf` (root workspace copy for immediate user access)

### Decisions / tradeoffs
- **Canvas expansion for Mobile PWA screenshot**: The Driver PWA mobile view is narrow (630px content width). Drawing large badges and callout pill labels directly on top of the cards would obscure crucial text (addresses, phone numbers, action buttons). We expanded the canvas by 450px on the right (`canvas_w = 1080px`) with the dark app theme (`#09120e`) and routed arrows from the right-hand column directly into each respective UI element.
- **Two-layer Alpha Compositing for Bounding Boxes**: Rather than drawing solid or opaque boxes that hide button labels, we drew translucent fills (alpha = 0.10–0.15) onto an RGBA overlay image before alpha-compositing onto the canvas, ensuring that underlying button text remains 100% legible while highlighted with neon borders.
- **Page-budgeting (9 Full Pages)**: Rather than letting tables accidentally spill 2–4 orphan lines onto blank overflow pages, Section 3 (Dispatcher) and Section 5 (Driver PWA) are formatted as 2-page spreads (Page 1: Overview + Annotated Figure; Page 2: Detailed Workflow Table + Technical Analysis). This resulted in exactly 9 fully utilized pages.

### Verification
- `uv run --with pillow --with weasyprint --with pypdf python3 scripts/build_user_guide_pdf.py`: Executed cleanly with exit code 0.
- `pdftoppm -png -r 150 docs/ECOMILES_HUONG_DAN_SU_DUNG.pdf /tmp/pdf_previews_ecomiles/page`: Rendered all 9 pages to PNG.
- Visual inspection via `view_file` on `page-1.png` through `page-9.png`:
  - Typography: Clean Vietnamese diacritic rendering with Noto Sans bold and regular glyphs.
  - Page breaks: No orphaned headings or tables; each section begins and concludes within its intended page boundaries.
  - Image scaling: High DPI images scale within page borders without clipping.

---

# Implementation Notes — Complete Monorepo Rebranding to EcoMiles

### What changed
- **Frontend Landing (`apps/landing`)**:
  - `tailwind.config.js`: Added complete `ecomiles` color tokens (`ink`, `surface`, `panel`, `lime`, `mint`, `sage`, `ivory`).
  - `apps/landing/src/`: Updated 13 components (`App.tsx`, `Navbar.tsx`, `Hero.tsx`, `Footer.tsx`, `DriverAndDispatcherShowcase.tsx`, `InteractiveSavingsCalculator.tsx`, `PilotModal.tsx`, `PitchDeckVoiceoverPage.tsx`, `PricingAndPilot.tsx`, `RolePortalModal.tsx`, `Solutions.tsx`, `Team.tsx`, `WorkflowShowcase.tsx`) replacing all `greenlogix-*` color classes with `ecomiles-*` and updating URLs (`console.greenlogix.vn` -> `console.ecomiles.vn`, `driver.greenlogix.vn` -> `driver.ecomiles.vn`, `greenlogix.w9.nu` -> `ecomiles.w9.nu`).
  - Verified landing build: `pnpm run build:landing` passes with zero errors (built in 688ms).
- **Mobile Driver App (`apps/mobile-driver`)**:
  - `lib/main.dart`: Rebranded `GreenLogixDriverApp` to `EcoMilesDriverApp` and title to `EcoMiles Driver`.
  - `lib/screens/pin_screen.dart`: Updated AppBar title to `EcoMiles tài xế`.
  - `test/widget_test.dart`: Updated widget test to pump `EcoMilesDriverApp`.
  - `README.md`: Updated app documentation, test instructions, and demo env var to `ECOMILES_DEMO=1`.
- **Serverless Cloudflare Worker (`apps/worker`)**:
  - `src/index.ts`: Updated header description, added `ECOMILES_ECO_WEIGHT` with backward-compatible fallback to `GREENLOGIX_ECO_WEIGHT`.
  - `src/roadBaseline.ts`: Updated `ecoWeightFromEnv` to support `ECOMILES_ECO_WEIGHT`.
  - `src/dispatcherHtml.ts`: Updated help note to reference `ECOMILES_ECO_WEIGHT`.
  - `src/seedData.ts` & `src/solver.ts`: Updated header comments to EcoMiles.
  - Verified worker tests: `pnpm run test:worker` passes all 16/16 tests.
- **Backend API (`apps/api`)**:
  - `src/greenlogix_api/main.py`: Rebranded OpenAPI title to `EcoMiles API`, logger to `ecomiles`, and added support for `ECOMILES_DEMO` / `ECOMILES_CORS_ORIGINS`.
  - `openapi.json`: Updated contract title to `EcoMiles API`.
  - `templates/dispatcher.html`: Rebranded title and table row labels to `EcoMiles`.
  - `README.md`: Updated title and demo quickstart commands to `ECOMILES_DEMO=1`.
  - Verified test suite: `uv run pytest` passes all 526/526 tests in 6.77s.
- **Documentation & Scripts**:
  - `README.md` & `AGENTS.md`: Rebranded root platform identity to `EcoMiles`.
  - `package.json`: Rebranded monorepo name to `ecomiles-monorepo`.
  - `packages/shared-types/README.md`: Updated package heading and description to `EcoMiles`.
  - `scripts/build_user_guide_pdf.py` & `docs/user_guide.html`: Updated PDF cover title from `ECOMILES (GREENLOGIX)` to `ECOMILES` and re-compiled `ECOMILES_HUONG_DAN_SU_DUNG.pdf`.
  - `docs/contests/SO_2026/DE_AN_SO2026_VSIC_HOAN_THIEN.md`: Updated project brand name and perceptual map label to `ECOMILES`.
  - `docs/contests/RND_2026/PROJECT_DESCRIPTION.md`: Updated project name and team name to `ECOMILES`.
  - `scripts/generate_pitch_deck.py`: Rebranded voiceover scripts and slide headings to `EcoMiles`.

### Decisions / tradeoffs
- **Preserved `GLX-HDT-v1.0` Cost Model Identifier**: The formal physics energy consumption model tag `GLX-HDT-v1.0` is an algorithmic version constant asserted across 15+ contract tests (`test_evidence.py`, `test_manifest_propagation.py`, `test_road_graph.py`). Modifying this algorithmic version constant would break cross-version test invariants without adding user-facing brand value.
- **Dual-environment Variable Support**: API and Worker check `ECOMILES_DEMO` and `ECOMILES_CORS_ORIGINS` / `ECOMILES_ECO_WEIGHT` first while retaining fallback to legacy `GREENLOGIX_*` flags, ensuring zero disruption to existing local run scripts or deployed staging environments.

### Verification
- `pnpm run build:landing`: Passed (Vite built in 688ms, zero TypeScript or CSS errors).
- `pnpm run test:worker`: Passed (16/16 tests passing in 370ms).
- `uv run --with pillow --with weasyprint scripts/build_user_guide_pdf.py`: Passed (Clean 9-page PDF generated with `ECOMILES` cover title).

---

# Implementation Notes — Panasonic GREEN IMPACT Deliverables (Zero VSIC)

### What changed
- **Technical Guidance DOCX (`GOI_Y_TECH_CHO_PLAN_PANASONIC.docx`)**:
  - Created `scripts/create_tech_inputs_panasonic_docx.py` producing a customized Word manual for members preparing business plans and pitch slides tailored to the **Panasonic GREEN IMPACT 2026** program.
  - Omitted all occurrences of "VSIC".
  - Retained all 6 essential strategic pillars:
    1. 5 Whys Root Cause Analysis & 2 qualitative personas (Dispatcher & Truck Driver).
    2. Competitor matrix & Innovation Gap (dual integration of route optimization + GLEC/ISO 14083 carbon reporting with zero hardware investment).
    3. Target breakdown: Customers vs. Users vs. Beneficiaries & Overlap Rate.
    4. Impact-driven Business Model linking fuel economy, SaaS revenue, and Scope 3 carbon reduction.
    5. Perceptual Map & formal international Positioning Statement.
    6. Transparent 3-tier data provenance labeling (`[ĐÃ KIỂM CHỨNG]`, `[BENCHMARK NGÀNH]`, `[GIẢ ĐỊNH – CẦN PILOT]`).
  - Saved to both `docs/contests/PANASONIC_2026/GOI_Y_TECH_CHO_PLAN_PANASONIC.docx` and `GOI_Y_TECH_CHO_PLAN_PANASONIC.docx` (workspace root).
- **Proposal Document (`docs/contests/PANASONIC_2026/DE_AN_PANASONIC_GREEN_IMPACT_2026.md`)**:
  - Created complete 440+ line detailed project proposal structured around Panasonic's Net Zero value chain commitment and corporate ESG logistics.
  - Completely purged all mentions of "VSIC".
- **Tracking Performance Workbook (`PANASONIC 2026 _ ECOMILES _ Tracking Performance.xlsx`)**:
  - Created clean Panasonic tracking spreadsheet in workspace root and `docs/contests/PANASONIC_2026/`, eliminating all references to "VSIC".

### Decisions / tradeoffs
- **Corporate Green Supply Chain Orientation**: Re-aligned tone from student contest judging to corporate innovation and decarbonization criteria (Panasonic GREEN IMPACT goals: Scope 3 supply chain reduction, ESG reporting compliance, circular economy).
- **Zero Omission of Core Technical Reality**: Kept the exact same verified algorithmic achievements (HCMC 80-order / 10-truck VRP benchmark, sub-second latency, QĐ 23/2018 truck restriction engine) while ensuring complete removal of VSIC branding.

### Verification
- `rtk uv run --with python-docx --with openpyxl python -c "..."`: Asserted 0 occurrences of "vsic" (case-insensitive) across:
  - `GOI_Y_TECH_CHO_PLAN_PANASONIC.docx`
  - `PANASONIC 2026 _ ECOMILES _ Tracking Performance.xlsx`
  - All files generated and validated with exit code 0.

---

# Implementation Notes — PDF User Guide for Panasonic GREEN IMPACT (Zero VSIC)

### What changed
- **Screenshot Annotation Script (`scripts/build_user_guide_pdf.py`)**:
  - Re-annotated Figure 1 (`fig1_role_portal.png`): Updated label 3 from `3. XEM PITCH DECK & ĐỀ ÁN VSIC` to `3. XEM PITCH DECK & ĐỀ ÁN PANASONIC`.
  - Updated cover page meta: Changed contest identifier from `VSIC 2026 (Social Innovation Challenge)` to `Panasonic GREEN IMPACT 2026`.
  - Updated footer string across all 9 pages: From `EcoMiles — Green Logistics Platform (VSIC 2026)` to `EcoMiles — Green Logistics Platform (Panasonic 2026)`.
  - Updated Section 5 table and technical heading: Replaced `Cố vấn VSIC` and `quy chuẩn VSIC` with `Hội đồng Cố vấn Panasonic` and `quy chuẩn Panasonic GREEN IMPACT`.
  - Updated back cover metadata box: Replaced `Dự án dự thi VSIC 2026` with `Dự án tham gia Panasonic GREEN IMPACT 2026`.
- **Generated PDF Documents**:
  - Generated [ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf](file:///home/shayneeo/Downloads/Documents/Coding/RND_to_Startup/ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf) (workspace root).
  - Synchronized copies to:
    - `docs/ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf`
    - `docs/contests/PANASONIC_2026/ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf`
    - `ECOMILES_HUONG_DAN_SU_DUNG.pdf` (workspace root)
    - `docs/ECOMILES_HUONG_DAN_SU_DUNG.pdf`

### Decisions / tradeoffs
- **Clean In-Place Rendering**: Instead of maintaining two divergent HTML files, updated the core PDF rendering pipeline to target Panasonic GREEN IMPACT directly and output clean PDF artifacts to both Panasonic-specific and standard manual paths.
- **Graphic Assets Re-rendered**: Re-executed Pillow drawing code to ensure that even the pixel content inside `fig1_role_portal.png` (the annotated image embedded on Page 3) carries zero traces of "VSIC".

### Verification
- `rtk grep -i "vsic" docs/user_guide.html scripts/build_user_guide_pdf.py`: Returncode 1 (0 matches).
- `pdftotext ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf - | grep -i "vsic"`: Returncode 1 (0 matches).
- `pdftotext ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf - | grep -i "panasonic"`: Matched all expected headers, footnotes, and metadata.
- All 9 pages compiled cleanly with zero overflow.
