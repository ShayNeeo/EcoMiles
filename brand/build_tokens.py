"""Generate CSS, TypeScript, and Dart brand token files from brand/tokens.json."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TOKENS_PATH = ROOT / "tokens.json"
DIST_DIR = ROOT / "dist"


def hex_to_dart(hex_color: str) -> str:
    clean = hex_color.lstrip("#").upper()
    return f"Color(0xFF{clean})"


def build() -> None:
    data = json.loads(TOKENS_PATH.read_text(encoding="utf-8"))
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    c = data["color"]
    t = data["typography"]
    s = data["spacing"]
    r = data["radius"]
    m = data["motion"]

    css_lines = [
        "/* Generated from brand/tokens.json — do not edit by hand. */",
        ":root {",
        f"  --em-paper: {c['surface']['paper']['value']};",
        f"  --em-paper-card: {c['surface']['paperCard']['value']};",
        f"  --em-paper-pure: {c['surface']['paperPure']['value']};",
        f"  --em-paper-sunken: {c['surface']['paperSunken']['value']};",
        f"  --em-ink: {c['ink']['primary']['value']};",
        f"  --em-ink-body: {c['ink']['body']['value']};",
        f"  --em-ink-muted: {c['ink']['muted']['value']};",
        f"  --em-ink-inverse: {c['ink']['inverse']['value']};",
        f"  --em-ink-inverse-muted: {c['ink']['inverseMuted']['value']};",
        f"  --em-line: {c['border']['hairline']['value']};",
        f"  --em-line-strong: {c['border']['strong']['value']};",
        f"  --em-route: {c['semantic']['routeCobalt']['value']};",
        f"  --em-route-tint: {c['semantic']['routeCobaltTint']['value']};",
        f"  --em-green: {c['semantic']['verifiedGreen']['value']};",
        f"  --em-green-tint: {c['semantic']['verifiedGreenTint']['value']};",
        f"  --em-amber: {c['semantic']['windowAmber']['value']};",
        f"  --em-amber-tint: {c['semantic']['windowAmberTint']['value']};",
        f"  --em-red: {c['semantic']['violationRed']['value']};",
        f"  --em-red-tint: {c['semantic']['violationRedTint']['value']};",
        f"  --em-font-display: {t['fontFamily']['display']};",
        f"  --em-font-body: {t['fontFamily']['body']};",
        f"  --em-font-mono: {t['fontFamily']['mono']};",
        f"  --em-radius-none: {r['none']};",
        f"  --em-radius-xs: {r['xs']};",
        f"  --em-radius-sm: {r['sm']};",
        f"  --em-radius-driver: {r['driver']};",
        f"  --em-motion-draw: {m['drawDurationMs']}ms;",
        f"  --em-motion-ease: {m['easing']};",
        "}",
        "",
    ]
    (DIST_DIR / "tokens.css").write_text("\n".join(css_lines), encoding="utf-8")

    ts_lines = [
        "// Generated from brand/tokens.json — do not edit by hand.",
        "export const ECOMILES_TOKENS = " + json.dumps(data, ensure_ascii=False, indent=2) + " as const;",
        "",
    ]
    (DIST_DIR / "tokens.ts").write_text("\n".join(ts_lines), encoding="utf-8")

    dart_lines = [
        "// Generated from brand/tokens.json — do not edit by hand.",
        "import 'package:flutter/material.dart';",
        "",
        "class EcoMilesBrandColors {",
        "  EcoMilesBrandColors._();",
        f"  static const Color paper = {hex_to_dart(c['surface']['paper']['value'])};",
        f"  static const Color paperCard = {hex_to_dart(c['surface']['paperCard']['value'])};",
        f"  static const Color paperPure = {hex_to_dart(c['surface']['paperPure']['value'])};",
        f"  static const Color paperSunken = {hex_to_dart(c['surface']['paperSunken']['value'])};",
        f"  static const Color ink = {hex_to_dart(c['ink']['primary']['value'])};",
        f"  static const Color inkBody = {hex_to_dart(c['ink']['body']['value'])};",
        f"  static const Color inkMuted = {hex_to_dart(c['ink']['muted']['value'])};",
        f"  static const Color inkInverse = {hex_to_dart(c['ink']['inverse']['value'])};",
        f"  static const Color inkInverseMuted = {hex_to_dart(c['ink']['inverseMuted']['value'])};",
        f"  static const Color line = {hex_to_dart(c['border']['hairline']['value'])};",
        f"  static const Color lineStrong = {hex_to_dart(c['border']['strong']['value'])};",
        f"  static const Color routeCobalt = {hex_to_dart(c['semantic']['routeCobalt']['value'])};",
        f"  static const Color routeCobaltTint = {hex_to_dart(c['semantic']['routeCobaltTint']['value'])};",
        f"  static const Color verifiedGreen = {hex_to_dart(c['semantic']['verifiedGreen']['value'])};",
        f"  static const Color verifiedGreenTint = {hex_to_dart(c['semantic']['verifiedGreenTint']['value'])};",
        f"  static const Color windowAmber = {hex_to_dart(c['semantic']['windowAmber']['value'])};",
        f"  static const Color windowAmberTint = {hex_to_dart(c['semantic']['windowAmberTint']['value'])};",
        f"  static const Color violationRed = {hex_to_dart(c['semantic']['violationRed']['value'])};",
        f"  static const Color violationRedTint = {hex_to_dart(c['semantic']['violationRedTint']['value'])};",
        "}",
        "",
        "class EcoMilesBrandMetrics {",
        "  EcoMilesBrandMetrics._();",
        f"  static const double spacingBase = {int(s['4'].rstrip('px'))}.0;",
        "  static const double driverRadius = 8.0;",
        "  static const double ledgerRadius = 4.0;",
        "  static const int drawMotionMs = 600;",
        "}",
        "",
    ]
    (DIST_DIR / "ecomiles_brand_tokens.dart").write_text("\n".join(dart_lines), encoding="utf-8")


if __name__ == "__main__":
    build()
