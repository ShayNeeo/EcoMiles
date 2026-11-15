# EcoMiles Taste

Version: 0.1 (2026-11-16)
Scope: every EcoMiles surface — landing, dashboard, driver app, deck, docs, social.
Rule: taste is what we refuse, not what we like. Each rule carries its reason and its test.

## 1. One idea, drawn once

The route line is the whole system: dashed while empty, solid once matched, a stop dot at the end.
Everything else is derived from it — bars, dividers, progress, maps, charts, section rules.
Test: if an element cannot be traced back to the route, the stop, or the mile post, it does not ship.

## 2. Green certifies, never decorates

Green appears only on a number that has been verified, a trip that has been matched, a document that has been issued.
Test: pretend the number is unverified. If the green would still be there, remove it.

Amber = waiting at a QĐ 23 window. Red = violation. Blue = baseline. One accent per screen.

## 3. Numbers before adjectives

Every claim carries a dataset, a date, and a denominator. "34.9% shorter" is design; "tối ưu vượt trội" is wallpaper.
Test: delete every adjective in a headline. If the sentence still persuades, it was never needed.

## 4. Dense, not busy

Operators read tables all day. Density is a feature; decoration is a cost. Give data air, not ornament.
Test: at 100% zoom, count the elements that do no work. More than two, cut.

## 5. Street truth

Real Vietnamese plates, real time windows, real warehouses, morning light, a driver who naps 15 minutes.
No AI people, no fake 3D trucks, no handshake stock, no "team high-five".
Test: could this photo have been taken on Nguyễn Văn Linh at 06:40? If not, it is set dressing.

## 6. Type is signage

The display face must survive: Vietnamese diacritics, 16px, sunlight, a cracked phone screen.
The data face is monospaced because plates, distances and kg must align in a column.
Test: shrink the wordmark to 16px and read it at arm's length. If it blurs, it is a poster, not a brand.

## 7. Motion is a route being drawn

600ms, ease-out, once. The line draws, the stop lands last. No bounce, no parallax, no confetti.
Test: if the motion would look wrong on a dispatch screen at 2am, it is wrong everywhere.

## 8. The five-second test

Show the mark for five seconds, take it away, ask someone to draw it.
Pass: a line that turns, with a dot. Fail: a leaf, a circle, a globe, a truck, a letter in a box.
A leaf fails because twenty competitors pass the same test with the same drawing.

## 9. Bans

| Banned | Why |
|---|---|
| Leaf, globe, handshake | Category wallpaper; proves nothing, distinguishes nothing. |
| Green circle around anything | The universal climate-startup badge; reads as stock. |
| AI purple gradients | Says "generated", not "operated". |
| Glassmorphism cards | Low contrast on cheap phones in daylight; costs legibility for fashion. |
| Fake 3D isometric trucks | Illustration that pretends to be data. |
| Neon dark dashboards | Reads crypto, not logistics; fails the 2am dispatch test. |
| Grab / Be clone | We are the backhaul layer, not a ride-hailing app. |
| SAP grey enterprise | Loses the street; the buyer is a fleet manager, not a procurement portal. |

## 10. Voice

Vietnamese first. One name per metric on every surface. No em dashes in UI copy: a full stop or `·`.
Open with the operator's Tuesday morning, never with "trong bối cảnh logistics đang phát triển".
Banned: `giải pháp toàn diện`, `hệ sinh thái`, `đột phá`, `cách mạng 4.0`, `xanh hóa` as a verb.

## 11. What we borrow

Structure, not skins: Swiss timetables (density under pressure), shipping manifests (mono columns, plate-first),
Vietnamese street signage (contrast at distance), ISO documents (authority without ornament).
Borrow the discipline; never borrow the look.

## 12. Decision log

- 2026-11-16 — Q5 answered "our own taste, choose all": all four anti-references banned, plus the bans in §9.
- 2026-11-16 — leaf mark killed; favicon still Astro purple until the fenced code slice after G2.
- 2026-11-16 — Gate G1 signed by Thanh: Mark `A · Return M`, Type `A · Archivo + IBM Plex Sans + JetBrains Mono`, Colour `A · Asphalt & Paper`, Tagline `"Đường về không trống."`. Scope locked for G2+G4 and CR-gated G3 rollout (`apps/landing`, `apps/api`, `apps/mobile-driver`) on `dev` only.
