# Design System: EcoMiles (Vietnam Urban-Logistics & Scope 3 Telemetry)

<!-- impeccable:design-schema 2 -->

## Visual Stance & Concept

**Behance / Awwwards High-Contrast Swiss Cartographic Editorial** - alternating bold colour-blocked telemetry bands engineered for fleet dispatchers, truck drivers, enterprise ESG auditors, and startup judges.

Core rule: **Graphic-first (`<= 30%` prose)**. Communicate mechanics through bespoke geometric vector icons, proportional comparison bars, 24h legal ban strips, interactive telemetry decks, and sharp pill buttons rather than walls of text. Zero generic SaaS emerald greens, zero cobalt neon gradients, zero emoji icons, zero em/en dashes in UI copy.

## Palette (Pure 5-Color Core + Computed Structural Steps)

| Token | Name | Hex | Role |
|---|---|---|---|
| `--em-cosmos` | Cosmos Blue | `#003049` | Primary dark surface (Hero, Calculator, Pricing, Telemetry Cards), primary ink on light Varden/Blue Marble |
| `--em-cosmos-deep` | Cosmos Deep | `#002033` | Recessed well / dark table head / dialog backdrop inside Cosmos |
| `--em-cosmos-soft` | Cosmos Soft | `#004366` | Elevated Cosmos borders, focus depth & crisp divider ink |
| `--em-gochujang` | Gochujang Red | `#780000` | High-stakes alert & urgency bands (QĐ 23/2018 Ban Matrix, Highlighted Growth Tier) |
| `--em-crimson` | Crimson Blaze | `#C1121F` | Primary action CTA fill on light surfaces, curfew ban highlight, urgent badge fill |
| `--em-crimson-ink` | Crimson Label Ink | `#AE1F23` | High-contrast small red label ink on Varden (`6.16:1`) |
| `--em-varden` | Varden Cream | `#FDF0D5` | Primary warm light surface & high-contrast ink on dark Cosmos/Gochujang (`12.25:1` / `10.34:1`) |
| `--em-varden-card` | Varden Card | `#F8E7C4` | Elevated card tint within Varden sections |
| `--em-varden-deep` | Varden Deep | `#EED9AF` | Meter tracks, subtle inset fills on Varden |
| `--em-varden-line` | Varden Rule | `#D4BF94` | Crisp architectural borders & rules on Varden |
| `--em-marble` | Blue Marble | `#669BBC` | Open corridor accent, legal-pass fill, interactive telemetry highlight & button hover fill |
| `--em-marble-pale` | Blue Marble Wash | `#D7E6F0` | Subtle neutral-cool pill/badge surface with `#003049` ink |
| `--em-grid-cosmos` | Cosmos Grid Hairline | `rgba(253, 240, 213, 0.06)` | 48px architectural coordinate grid on Cosmos bands |
| `--em-grid-varden` | Varden Grid Hairline | `rgba(0, 48, 73, 0.055)` | 48px architectural coordinate grid on Varden bands |
| `--em-grid-marble` | Marble Focus Stroke | `rgba(102, 155, 188, 0.09)` | Subtle cyan overlay stroke inside dark grids |

### Strict WCAG AA/AAA Contrast Matrix
- **On Cosmos `#003049`**: use `#FDF0D5` (`12.25:1`) or `#669BBC` (`4.59:1`). Never place `#C1121F` text directly on Cosmos (`2.22:1` fail).
- **On Varden `#FDF0D5`**: use `#003049` (`12.25:1`), `#780000` (`10.34:1`), `#AE1F23` (`6.16:1`), or `#C1121F` (`5.51:1`). Never place `#669BBC` text directly on Varden (`2.67:1` fail - use `bg-[#669BBC]` pill with `#003049` ink instead).
- **On Blue Marble `#669BBC`**: always use `#003049` ink (`4.59:1`). Never place white `#FFFFFF` (`2.97:1`) or Varden `#FDF0D5` (`2.67:1`) text on `#669BBC`.
- **On Gochujang `#780000` & Crimson `#C1121F`**: always use `#FDF0D5` ink (`10.34:1` & `5.51:1`).

## Typography

| Role | Font Family | Source | Notes |
|---|---|---|---|
| Display / Editorial Headings | `Bricolage Grotesque`, `Be Vietnam Pro`, sans-serif | Google Fonts | Tight tracking (`-0.02em`), heavy sculptural uppercase/headline contrast |
| Body / UI / Vietnamese Copy | `Be Vietnam Pro`, system-ui, sans-serif | Google Fonts | Optimized diacritic legibility across all scales |
| Telemetry / Legal Codes / Numbers | `JetBrains Mono`, monospace | Google Fonts | Paired with `font-variant-numeric: tabular-nums` on every metric, km, VND & CO2e figure |

### Type Scale (`px` tokens in addition to Tailwind `text-xs`..`text-7xl`)
- Micro telemetry badges & legal timestamps: `9px`, `9.5px`, `10px`, `10.5px`, `11px` (`JetBrains Mono` bold uppercase)
- Compact dense portal controls & table cells: `13px`, `13.5px`, `14px`, `14.5px`, `16px`
- Feature card titles & section counters: `19px`, `20px`, `22px`, `24px` (`clamp(...)` up to `68px` hero display)

## Surface Shapes, Radii & Elevation

- Crisp Swiss architectural corners: standard `2px`, `3px`, `5px`, `6px`, `8px` (`rounded-lg`), `12px` (`rounded-xl`), `16px` (`rounded-2xl`), `24px` (`rounded-3xl`), plus notched corner SVG plaques in `/brand/`.
- Structural 2px hard architectural borders (`#003049` on Varden, `#669BBC` or `#FDF0D5` on Cosmos) prioritized over blurry ambient shadows.

## Vector Brand & Custom Pictogram Registry (`src/components/EcoMilesMark.tsx`)

- **Logomark**: `ReturnMMark` - interlocking Cosmos/Varden outer frame, inverted return-leg notched bridge (`#669BBC` / `#003049`), and directional Crimson stop anchor (`#C1121F`).
- **Wordmark**: `EcoMilesWordmark` (`dark?: boolean`)
- **Custom Geometric Icons (Zero Emojis)**:
  - `BackhaulMatchIcon` - Outbound-plus-return vector loop
  - `Qd23WindowIcon` - 24h peak-ban clock shield
  - `VanExemptIcon` - `<950 kg` van exemption gauge (`QCVN 41:2024`)
  - `TruckWeightIcon` - 2.5T axle load indicator (`QĐ 23/2018`)
  - `HanoiRingIcon` - Ring Road 3 daytime geofence (`QĐ 01/2026`)
  - `IsoLedgerIcon` - 3-sheet automated ISO 14083 / GLEC v3.2 ledger
  - `Co2AuditIcon` - Carbon intensity ring badge
  - `FuelPhysicsIcon` - `GLX-HDT-v1` Diesel vs EV telemetry drop
  - `ZeroKnowledgeIcon` - `AES-256-GCM` & `NĐ 13/2023` lock seal
  - `RouteLoopDivider` - Architectural dotted section separator

## Flagship Pages & Interactive Proof

- `/brand/` (`public/brand/index.html`): Behance-tier interactive Identity Book (Motion Return-M anatomy, 5-color ratio bars + 1-click hex/css copy, contrast matrix, 30 notched SVG pictograms, Halftone SVG/2x-PNG Studio, token copy tabs).
- `/` (`App.tsx` landing sections): Alternates Cosmos Hero (live 3-pilot switcher: `500` beverage `2.5T`, `Store #01` `<950 kg` van, `91` stores) -> Varden Solutions (4 colour-blocked visual cards) -> Cosmos Savings Calculator (`15-51%` range + presets) -> Varden 4-Step Workflow & Benchmark Table -> Gochujang `QĐ 23/2018` + `QĐ 01/2026` 24h Ban Matrix -> Varden Team -> Cosmos Pricing & Pilot -> Varden Footer.
- `/dashboard`, `/benchmark`, `/dispatcher`, `/driver`, `/maps`, `/app`, `/portal`: Pure 5-color migration with preserved empirical & synthetic EVSIM math, `NĐ 13/2023` PII redaction, and Hindsight Honesty invariants.
