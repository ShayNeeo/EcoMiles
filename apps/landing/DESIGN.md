---
name: EcoMiles B2B Logistics & Carbon SaaS
description: Editorial Daylight design system for Vietnamese urban fleet optimization and ISO 14083 carbon accounting.
colors:
  primary: "#14532d"
  primary-hover: "#0f3f22"
  accent-emerald: "#16a34a"
  accent-tint: "#eef7ee"
  info-blue: "#1971c2"
  warning-amber: "#d97706"
  danger-red: "#dc2626"
  canvas-alabaster: "#f8fafc"
  surface-paper: "#ffffff"
  surface-subtle: "#f1f5f9"
  ink-primary: "#0f172a"
  ink-secondary: "#334155"
  ink-muted: "#475569"
  border-hairline: "#e2e8f0"
  border-strong: "#cbd5e1"
typography:
  display:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.2vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.625rem, 2.8vw, 2.375rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Be Vietnam Pro, Inter, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "20px"
  lg: "32px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-paper}"
    rounded: "{rounded.md}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card-surface:
    backgroundColor: "{colors.surface-paper}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: EcoMiles B2B Logistics & Carbon SaaS

## Overview

**Creative North Star: "The Daylight Control Ledger"**

EcoMiles pairs the crisp legibility of a modern financial ledger with the spatial clarity of an urban cartographic atlas. Designed for logistics dispatchers working under bright warehouse/office lighting and enterprise executives evaluating Scope 3 carbon compliance, the interface favors daylight paper surfaces, decisive forest-emerald actions, and live operational proof over dark decorative chrome.

It explicitly rejects two anti-references identified during user testing: (1) dark neon "gym-membership" pricing cards with shouting all-caps headlines, and (2) developer-raw dark terminal layouts cluttered with inline code badges.

**Key Characteristics:**
- Daylight-first surfaces (`#f8fafc` alabaster ground with `#ffffff` crisp paper containers) ensuring effortless scanability during 12-hour dispatch shifts.
- Visual-first product proof: real HCMC street networks, time-window strips, and tabular ledgers replace verbose paragraphs.
- Tabular numeric discipline (`tabular-nums`) across every km, kg, VND, and `CO₂e` reading.

## Colors

High-contrast slate ink on warm-cool alabaster and pure paper, anchored by a single authoritative forest-emerald primary accent.

### Primary
- **Deep Forest Emerald** (`#14532d`): Primary CTA buttons, active workspace indicators, and verified carbon-reduction seals.
- **Forest Canopy Hover** (`#0f3f22`): Hover and active state for primary actions.

### Secondary
- **Operational Emerald** (`#16a34a`): Positive delta indicators, legal open-window strips, and completed stop markers.
- **Dispatch Maritime Blue** (`#1971c2`): Route polylines, analytical baseline series, and informational links.

### Tertiary
- **QĐ 23 Warning Amber** (`#d97706`): Staging/waiting states outside restricted inner-city gates (`06:00–09:00` & `16:00–20:00`).
- **Violation Crimson** (`#dc2626`): Baseline `QĐ 23/2018` truck-ban violations, wrong-password `401` alerts, and cross-tenant `403` denials.

### Neutral
- **Alabaster Ground** (`#f8fafc`): Page canvas and subtle alternating table bands.
- **Crisp Ledger Paper** (`#ffffff`): Elevated cards, structured pricing matrix, and modal dialogs.
- **Slate Ink Primary** (`#0f172a`): Headlines, primary figures, and table values (`>15:1` contrast on white).
- **Slate Body** (`#334155`) & **Muted Slate** (`#475569`): Supporting prose and column headers (`>7:1` contrast, exceeding WCAG AA `4.5:1`).
- **Hairline Slate** (`#e2e8f0`): 1px structural borders and table dividers.

### Named Rules
**The Anti-Gym Rule.** Never pair a near-black page background with neon lime/red bordered membership boxes on marketing or pricing surfaces; B2B logistics trust lives on crisp daylight paper.

**The Semantic Red-Amber-Green Rule.** Reserve crimson and amber strictly for `QĐ 23/2018` ban violations, SLA late risks, and authentication errors—never as decorative section accents.

## Typography

**Display Font:** Be Vietnam Pro (with Inter, system-ui fallback)
**Body Font:** Be Vietnam Pro (with Inter, system-ui fallback)
**Label/Mono Font:** JetBrains Mono (with ui-monospace fallback)

**Character:** Clean geometric Vietnamese legibility with crisp diacritics at small table sizes; monospace is reserved strictly for license plates, cryptographic fingerprints, and aligned numeric measurements.

### Hierarchy
- **Display** (800, `clamp(2.25rem, 4.2vw, 3.75rem)`, `1.08`): Hero thesis statement only, sentence case (never shouting all-caps).
- **Headline** (800, `clamp(1.625rem, 2.8vw, 2.375rem)`, `1.15`): Section headings without eyebrow kickers above them.
- **Title** (700, `1.125rem`, `1.35`): Workspace panel titles and pricing tier headers.
- **Body** (400, `0.95rem`, `1.6`): Concise Vietnamese explanations capped at `65–72ch`.
- **Label** (600, `0.75rem`, `0.01em`): License plates (`51C-000.08`), KMS fingerprints, and tabular metrics.

### Named Rules
**The Zero-Kicker Rule.** Never place an uppercase pill or eyebrow kicker above `<h1>` or `<h2>` headings; let the heading carry its own hierarchy.

**The Monospace Restraint Rule.** Use monospace only for genuine identifiers (license plates, SHA-256/KMS hashes, numeric cells), never as a "tech costume" on marketing copy.

## Layout

- **Marketing Container**: `max-w-7xl` (`1280px`) with generous vertical section rhythm (`py-20` to `py-24`) and visual-first 2-column splits.
- **Workspace Container**: `max-w-[1600px]` fluid multi-pane grid (`Operate` mode) keeping KPIs, fleet configuration, and charts scannable without horizontal overflow from `390px` mobile to `1920px` desktop.

## Elevation & Depth

Tonal layering (`#f8fafc` ground vs. `#ffffff` cards with `1px solid #e2e8f0` hairlines) carries 90% of structural separation, supported by soft downward ambient shadows only on interactive focal frames.

### Shadow Vocabulary
- **Focal Frame Shadow** (`box-shadow: 0 16px 40px -16px rgba(15, 23, 42, 0.10)`): Hero product showcase frame and modal dialogs.
- **Interactive Lift** (`box-shadow: 0 8px 24px -12px rgba(15, 23, 42, 0.08)`): Highlighted SaaS tier column and hover states.

## Shapes

- **Smooth Structural Corners**: `12px` (`rounded-xl`) on buttons and inputs, `16px`–`20px` (`rounded-2xl`) on primary containers, and `1px` crisp hairlines (never thick `4px` left-border callout stripes).

## Components

### Buttons
- **Shape:** Smooth rounded rectangle (`12px` radius).
- **Primary:** Deep Forest Emerald (`#14532d`) fill with white bold text (`12px 22px` padding), shifting to `#0f3f22` on hover.
- **Secondary:** Crisp white (`#ffffff`) with `#cbd5e1` border and `#0f172a` text, shifting to `#f8fafc` on hover.

### Cards / Containers
- **Corner Style:** `16px` radius on marketing modules, `12px` radius on dense TMS workspace panels.
- **Background:** Crisp Ledger Paper (`#ffffff`) over Alabaster Ground (`#f8fafc`).
- **Border:** `1px solid #e2e8f0`.

### Inputs / Fields
- **Style:** `1px solid #cbd5e1` on `#ffffff` background (`10px`–`12px` radius) with `#0f172a` text.
- **Focus:** `2px` offset focus ring in `#14532d` (`outline-offset: 2px`).
- **Error:** `#dc2626` border with `#fef2f2` surface banner naming the exact recovery step.

### Navigation
- **Marketing Navbar:** Translucent white sticky bar (`rgba(255,255,255,0.92)` with `backdrop-filter: blur(12px)`) and hairline bottom rule.
- **Workspace Topbar:** Sticky white operational bar displaying the locked authenticated company badge, KMS security tier pill, and explicit `Đăng xuất` button.

## Do's and Don'ts

### Do:
- **Do** keep public landing copy concise (1 short sentence under headings) and pair every claim with a real product visual or interactive control.
- **Do** enforce `font-variant-numeric: tabular-nums` on every numeric KPI, table column, timer, and price.
- **Do** require explicit `Đăng xuất` before switching between B2B company tenants so multi-tenant security is tangible.

### Don't:
- **Don't** use dark gym-card pricing blocks, neon yellow full-bleed fills, or gradient text.
- **Don't** place eyebrow kickers above section headings or use thick `border-l-4` stripes.
- **Don't** expose developer acronyms (`JSON`, `Bearer DEMO`, raw `<code>` tags) on public marketing sections.
