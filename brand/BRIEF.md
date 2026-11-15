# EcoMiles Brand Identity — Working Brief

Version: 0.1 (2026-11-16)
Owner: Phạm Quốc Thanh
Status: G1 signed (2026-11-16, Thanh); G2 system + G4 book in build; G3 CR rollout on dev only
Handoff: `HANDOFF-2026-11-16.md` in this folder — self-contained brief for another agent.
Rule: G1 signed 2026-11-16; G2 tokens/marks/book lock before G3 CR edits `apps/`.

## 1. Locked decisions (from the grilling session + G1 sign-off 2026-11-16)

| # | Decision | Choice |
|---|---|---|
| 1 | Deliverable depth | Full identity system + living brand book + G3 rollout (`apps/landing`, `apps/api`, `apps/mobile-driver`) on `dev` only |
| 2 | Naming | **EcoMiles only.** GreenLogix is deleted from every brand surface. No "Dặm Xanh" sub-name, no legacy descriptor. |
| 3 | Personality (exactly 2) | **Đường phố Việt** + **Nhà đầu tư sắc gọn** |
| 4 | Visual territory | **Đường về / vòng lặp tuyến** — dashed where empty, solid where loaded, stop dot |
| 5 | Anti-reference | Ban all four: generic eco leaf, dark crypto/neon, Grab/Be clone, SAP grey. Plus our own bans below. |
| 6 | G1 Mark | **A · Return M** (closed-loop M; holds at 16px favicon & 5s recall test) |
| 7 | G1 Typography | **A · Archivo (Display) + IBM Plex Sans (Body) + JetBrains Mono (Data)** |
| 8 | G1 Colour | **A · Asphalt & Paper** (`#F6F1E7` ground, `#101418` ink, `#1B45D7` route cobalt, `#0B7A3B` verified green) |
| 9 | G1 Tagline | **"Đường về không trống."** |
| 10 | Governance | Thanh holds sole brand veto; G3 edits flow via CR + worktree targeting `dev` only (never `stable`) |

Note on #2: brand-layer removal is a text/asset change. If any registration, contract or bank record still says GreenLogix, that is a legal procedure, not a design task. Code footprint today: 117 files, 517 occurrences (grep, 2026-11-16). Removal happens as a separate fenced slice after the identity gate.

## 2. Evidence audit (why a rebuild, not a polish)

1. `apps/landing/public/favicon.svg` is still the default Astro purple mark (`#863bff`, `#7e14ff`). The browser tab shows Astro, not EcoMiles.
2. `apps/landing/src/components/Navbar.tsx:97-108` — the current mark is a Lucide leaf inside a `#14532D` circle, with the words "Logistics Xanh B2B". Leaf-in-circle is the most used symbol in climate logistics. It cannot be drawn from memory in a way that distinguishes EcoMiles from 20 competitors.
3. Type is triple-sourced and inconsistent: `BaseLayout.astro:31` loads Barlow Condensed + Inter + JetBrains Mono + Plus Jakarta Sans; `index.css:31` sets Plus Jakarta Sans; `DESIGN.md` declares Be Vietnam Pro, which is not loaded at all.
4. `index.css:7-15` still names its tokens `--glx-*`. The code remembers the old company.
5. What is worth keeping: the Editorial Daylight discipline in `PRODUCT.md` / `DESIGN.md` — bright surfaces, proof over decoration, no dark gym-SaaS. That posture survives. The face does not.

## 3. Strategy

**Category:** B2B urban logistics optimization + auditable transport carbon (ISO 14083 / GLEC v3.2), built for Vietnamese SME fleets of 5-100 trucks.

**Primary buyer:** operations lead / fleet manager, 30-50, splits routes in Excel, loses hours to QĐ 23/2018 time windows, eats 30% empty return trips, is asked by a customer or bank for a carbon number he cannot produce.

**The tension the brand must resolve:** a street-level operator and an investor/ESG auditor must look at the same company and both believe it. Most brands pick one and fail the other.

**Promise:** the return trip stops being dead weight.

**Proof, not adjectives:** 374.4 km -> 243.7 km (-34.9%), 32.8% -> 2.7% empty running (6.5 km), 28 -> 0 QĐ 23/2018 violations, 83.57 -> 56.66 kg CO2e on the 120-order HCMC cold-chain dataset.

**Brand idea:** **Đường về không trống.** The return leg is the product. One continuous route line: dashed while empty, solid once matched, with a stop dot at each end. The idea is a mechanism, not a mood, so it survives translation into the mark, the charts, the driver screen and a 16px favicon.

**Tagline candidates (pick one at the gate):**
1. `Đường về không trống.` — sharpest, owns backhaul, memorable.
2. `Mỗi dặm đều có việc.` — broader, calmer, works for ESG buyers.
3. `Dặm ngắn hơn. Sổ sạch hơn.` — two-line, ledger-facing, weaker as a chant.

## 4. Verbal identity

- Vietnamese first. English only for standards and file formats (ISO 14083, GLEC v3.2, Excel, API).
- Numbers before adjectives. "Giảm 34.9% quãng đường" beats "tối ưu vượt trội".
- One name per metric, on every surface. Pick `quãng đường rỗng` once and never call it `chạy rỗng`, `empty running`, `return rỗng` in the same screen.
- No em dashes in UI copy. Use a full stop or `·`.
- Never open with the category ("trong bối cảnh logistics đang phát triển"). Open with the operator's Tuesday morning.
- Banned words: `giải pháp toàn diện`, `hệ sinh thái`, `đột phá`, `cách mạng 4.0`, `xanh hóa` as a verb.

## 5. Personality

**Đường phố Việt.** Knows the 6-9 and 16-20 window, the 51C plate, the reefer that cannot wait, the driver who naps 15 minutes. Speaks plainly, no MBA fog.

**Nhà đầu tư sắc gọn.** Calm, specific, evidence-first. Can walk into a fund and a competition judging room with the same deck. No hype, no begging.

**Shadow traits (what we are not):** not cute, not preachy, not a NGO, not a Silicon Valley import, not a truck-parts catalogue.

## 6. Visual system (proposal, exploration round 1)

**Mark logic.** A route that returns. Candidate family in `marks/`:
- `mark-return-m.svg` — an M whose baseline is the return leg, closed into a loop.
- `mark-route-stop.svg` — abstract two-stop route with a return arc and a stop dot.
- `mark-mile-post.svg` — roadside mile post with a return arrow; local, literal, strong as an app icon.

The leaf dies. No exceptions.

**Wordmark.** Upper-case `ECOMILES` with tight tracking and a square stop marker after the final S: `ECOMILES▪`. The square is the stop, not a period. Lower-case `ecomiles` stays as a secondary digital variant only if the gate prefers it.

**Colour.** Green is a result, not a decoration. Two directions in the specimen:
- A. Asphalt & Paper: warm paper `#F6F1E7`, ink `#101418`, route cobalt `#1B45D7`, verified green `#0B7A3B`.
- B. Signal Forest: paper `#F8FAF7`, ink `#0F172A`, forest `#14532D`, route blue `#1971C2`.
Semantic colours never decorate: amber = waiting at a QĐ 23 window, red = violation, green = a number that has been verified.

**Typography.** All candidates must ship Vietnamese. Verified against Google Fonts' Vietnamese subset (U+1EA0-1EF9) on 2026-11-16: Archivo, Be Vietnam Pro, Bricolage Grotesque, IBM Plex Sans, Manrope, Plus Jakarta Sans and Inter pass; **Sora fails** and is out.
- A. Archivo display + IBM Plex Sans text + JetBrains Mono data (investor-crisp, signage).
- B. Bricolage Grotesque display + Be Vietnam Pro text + JetBrains Mono data (street-editorial).
- C. Be Vietnam Pro only + JetBrains Mono (safe, local, least distinctive).

**Graphic device.** The return line at three scales: hero (full-bleed route), section (a 1px rule that becomes dashed then solid), component (progress and comparison bars). One line language across marketing and product.

**Motion.** Draw-on, 600ms, ease-out, once. No bounce, no parallax, no confetti. The dot lands last.

**Imagery.** Real Vietnamese streets, real trucks, real plates, real warehouses, morning light. No AI people, no fake 3D trucks, no stock handshake.

## 7. UX/UI principles per surface

- Landing (Persuade): proof in the first viewport. A real HCMC route, a real number, one CTA. No feature wall.
- Dashboard (Operate): density with air. Tabular numbers, one alert colour, time-window strips always visible, no decorative green.
- Driver (Operate, one hand, sunlight): 48px targets, 4-state shift control, offline banner that tells the truth, plate and route always on screen.

## 8. Own anti-references (beyond the four banned)

AI purple-gradient SaaS, glassmorphism cards, fake 3D isometric trucks, leaf/globe/handshake iconography, stock "team high-five", dark mode as a default personality.

## 9. Deliverables and gates

| Gate | Artifact | Signed by |
|---|---|---|
| G1 Territory | This brief + 3 mark candidates + 2 palettes + 3 type directions, rendered | Thanh |
| G2 System | Final mark family, wordmark, scale, tokens, icons, motion, data-viz | Thanh |
| G3 Application | Landing, dashboard, driver, deck, social, favicon/app icon, name card | Thanh |
| G4 Book | `brand/index.html` living book + PDF + token JSON | Thanh |

No product code is edited before G2. Removal of GreenLogix and the Astro favicon happens in a separate fenced slice after G2.

## 10. Open questions

1. Is there any printed collateral in the next 6 months (name card, folder, standee, truck decal)? Decides CMYK/Pantone work.
2. Who holds veto besides Thanh?
3. Does the team have any emotional attachment to forest green or the daylight look?

## 11. Gate G1 render + measured checks (2026-11-16)

Artifact: `brand/specimen.html`, self-contained except Google Fonts, desktop 1440px.
Taste doctrine: `brand/TASTE.md` (the rules we refuse to break, each with its test).

- Rendered in Chromium at 1440 x 4168. No horizontal overflow (`scrollWidth == clientWidth == 1425`).
- All five families report loaded at the requested weights via `document.fonts.check` (Archivo 800, Bricolage Grotesque 800, Be Vietnam Pro 800, IBM Plex Sans 600, JetBrains Mono 700). The three display samples measure 528 / 534 / 544 px at 52px, so each is a real face, not a fallback.
- Diacritics: no collision between the two 112px headline lines; route labels clear the line.
- Small-size geometry at 16px: A stroke 2.5px, holds. B's dashed return arc becomes 1px dashes with 1px gaps, collapses. C's bowl counter is 4px with a 2px arrow inside, closes.
- Recommendation: **A · Return M** as the system mark. B and C remain alt lockups only.
- Served-surface check (2026-11-16), three viewports: 1440x1000, 768x1024, 390x844. No horizontal overflow at any width (`scrollWidth == clientWidth`), no clipped boxes, no overlapping siblings, captions inside their rows.
- Mobile defect found and fixed: the stacked card put the paragraph in the 120px mark column. Grid areas now place title and body in column 2; at 390px the paragraph is 222px / 3 lines, all three cards 136px and equal.
- Interaction: 0 links, buttons, inputs or tabbable elements; 0 scripts. The board is static by design. The landing CTA and driver button are visual samples, not controls.
- Contrast on paper: body 11.97:1, muted 5.70:1, green 4.83:1, amber 5.14:1.
- Evidence shots: `~/.hermes/cache/scratch/ecomiles-desktop-1440.png` (1440x4168), `ecomiles-mobile-390.png` (780x11150 @2x), `m3-marks.png`, `m3-hero.png`.
- No product code touched. Nothing in `brand/` imports into `apps/`.

