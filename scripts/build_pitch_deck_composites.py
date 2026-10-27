#!/usr/bin/env python3
"""
Builds the Complete EcoMiles Multi-Device Visual Asset Suite:
1. Master Cover Banner (`00_ecomiles_flagship_cover_banner.png`, 2400x1260):
   Panoramic studio showcase featuring all 7 flagship device families:
   - MacBook Pro 16" (Light macOS menu bar + top center black camera notch + square bottom lid corners)
   - Windows 11 Flagship Laptop (Dell XPS 16 · InfinityEdge + Windows 11 Taskbar)
   - Samsung Galaxy Z Fold (Unfolded 768x1024 Tablet + Center Crease)
   - iPad Pro M4 Tablet (768x1024 Symmetrical Bezel)
   - iPhone Duo (Dual-Screen Book-Fold: Left /driver + Right /maps Live)
   - iPhone 18 Pro Max (Concentric Titanium Frame + Dynamic Island at Top)
   - Samsung Galaxy S26 Ultra (Sharp Armor Titanium r=4 + Top Infinity-O Camera)
2. 4 Slide-Ready 16:9 (1920x1080) Pitch Deck Composites (`17`..`20`)
3. 7 Standalone Transparent-PNG Flagship Hardware Mockups (`21`..`27`)
"""

import os
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = "/home/shayneeo/Downloads/Documents/Coding/RND_to_Startup"
SHOT_DIR = os.path.join(BASE_DIR, "docs", "pitch-deck-screenshots")
PUBLIC_SHOT_DIR = os.path.join(BASE_DIR, "apps", "landing", "public", "pitch-deck-screenshots")

FONT_BOLD = "/usr/share/fonts/noto/NotoSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/noto/NotoSans-Regular.ttf"


def get_font(bold: bool, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD if bold else FONT_REG
    return ImageFont.truetype(path, size)


def rounded_mask(size: tuple[int, int], radius: int, square_bottom: bool = False, square_top: bool = False) -> Image.Image:
    w, h = size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    r = max(1, radius)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    if square_bottom:
        d.rectangle([0, h - r - 1, w - 1, h - 1], fill=255)
    if square_top:
        d.rectangle([0, 0, w - 1, r + 1], fill=255)
    return mask


def fit_screenshot(img_path: str, w: int, h: int) -> Image.Image:
    src = Image.open(img_path).convert("RGBA")
    src_w, src_h = src.size
    target_ratio = w / h
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        src = src.crop((left, 0, left + new_w, src_h))
    else:
        new_h = int(src_w / target_ratio)
        src = src.crop((0, 0, src_w, min(src_h, new_h)))
    return src.resize((w, h), Image.Resampling.LANCZOS)


def draw_status_bar_icons(d: ImageDraw.ImageDraw, x0: int, y0: int, w: int, h: int, dark_text: bool = True) -> None:
    fg = (17, 24, 39, 255) if dark_text else (255, 255, 255, 255)
    f_time = get_font(True, max(10, int(h * 0.42)))
    d.text((x0 + int(w * 0.065), y0 + int(h * 0.22)), "09:41", fill=fg, font=f_time)

    rx = x0 + w - int(w * 0.065)
    by = y0 + int(h * 0.30)
    bh = max(8, int(h * 0.38))
    bw = int(bh * 1.9)
    d.rounded_rectangle([rx - bw, by, rx - 3, by + bh], radius=2, outline=fg, width=1)
    d.rectangle([rx - bw + 2, by + 2, rx - 6, by + bh - 2], fill=(34, 197, 94, 255))
    d.rectangle([rx - 2, by + int(bh * 0.28), rx, by + int(bh * 0.72)], fill=fg)
    sx = rx - bw - 24
    for i in range(4):
        bar_h = int(bh * (0.4 + 0.2 * i))
        d.rectangle([sx + i * 5, by + bh - bar_h, sx + i * 5 + 3, by + bh], fill=fg)


def render_iphone_18_pro_max(img_path: str, screen_w: int, screen_h: int) -> Image.Image:
    status_h = max(24, int(screen_h * 0.044))
    inner_w = screen_w
    inner_h = status_h + screen_h

    glass_bezel = max(7, int(screen_w * 0.024))
    titanium_ring = 4
    pad = glass_bezel + titanium_ring
    btn_protrude = 3

    screen_r = max(22, int(screen_w * 0.095))
    glass_r = screen_r + glass_bezel
    outer_r = glass_r + titanium_ring

    total_w = inner_w + (pad + btn_protrude) * 2
    total_h = inner_h + pad * 2

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)

    fx0, fy0 = btn_protrude, 0
    fx1, fy1 = total_w - btn_protrude - 1, total_h - 1

    titan_btn = (186, 178, 166, 255)
    d.rounded_rectangle([0, int(total_h * 0.16), fx0 + 2, int(total_h * 0.20)], radius=2, fill=titan_btn)
    d.rounded_rectangle([0, int(total_h * 0.23), fx0 + 2, int(total_h * 0.30)], radius=2, fill=titan_btn)
    d.rounded_rectangle([0, int(total_h * 0.32), fx0 + 2, int(total_h * 0.39)], radius=2, fill=titan_btn)
    d.rounded_rectangle([fx1 - 2, int(total_h * 0.25), total_w - 1, int(total_h * 0.35)], radius=2, fill=titan_btn)

    d.rounded_rectangle(
        [fx0, fy0, fx1, fy1],
        radius=outer_r,
        fill=(196, 189, 178, 255),
        outline=(232, 227, 218, 255),
        width=2,
    )
    d.rounded_rectangle(
        [fx0 + 2, fy0 + 2, fx1 - 2, fy1 - 2],
        radius=outer_r - 2,
        outline=(120, 114, 105, 255),
        width=1,
    )

    gx0, gy0 = fx0 + titanium_ring, fy0 + titanium_ring
    gx1, gy1 = fx1 - titanium_ring, fy1 - titanium_ring
    d.rounded_rectangle([gx0, gy0, gx1, gy1], radius=glass_r, fill=(10, 12, 16, 255))

    sx0, sy0 = gx0 + glass_bezel, gy0 + glass_bezel
    display = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    dd = ImageDraw.Draw(display)

    dd.rectangle([0, 0, inner_w, status_h], fill=(255, 255, 255, 255))
    draw_status_bar_icons(dd, 0, 0, inner_w, status_h, dark_text=True)

    di_w = max(64, int(inner_w * 0.26))
    di_h = max(13, int(status_h * 0.60))
    di_x = (inner_w - di_w) // 2
    di_y = (status_h - di_h) // 2
    dd.rounded_rectangle([di_x, di_y, di_x + di_w, di_y + di_h], radius=di_h // 2, fill=(8, 10, 14, 255))
    lens_r = max(3, di_h // 4)
    dd.ellipse(
        [di_x + di_w - di_h // 2 - lens_r, di_y + di_h // 2 - lens_r, di_x + di_w - di_h // 2 + lens_r, di_y + di_h // 2 + lens_r],
        fill=(25, 38, 66, 255),
    )

    app_img = fit_screenshot(img_path, screen_w, screen_h)
    display.paste(app_img, (0, status_h))

    mask = rounded_mask((inner_w, inner_h), screen_r)
    out.paste(display, (sx0, sy0), mask)
    d.rounded_rectangle([sx0, sy0, sx0 + inner_w - 1, sy0 + inner_h - 1], radius=screen_r, outline=(45, 55, 72, 180), width=1)
    return out


def render_samsung_s26_ultra(img_path: str, screen_w: int, screen_h: int) -> Image.Image:
    status_h = max(22, int(screen_h * 0.04))
    inner_w = screen_w
    inner_h = status_h + screen_h

    glass_bezel = max(5, int(screen_w * 0.018))
    titanium_ring = 4
    pad = glass_bezel + titanium_ring
    btn_protrude = 3

    screen_r = 4
    glass_r = screen_r + glass_bezel
    outer_r = glass_r + titanium_ring

    total_w = inner_w + pad * 2 + btn_protrude
    total_h = inner_h + pad * 2

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)

    fx0, fy0 = 0, 0
    fx1, fy1 = total_w - btn_protrude - 1, total_h - 1

    s_titan = (148, 156, 168, 255)
    d.rounded_rectangle([fx1 - 1, int(total_h * 0.18), total_w - 1, int(total_h * 0.31)], radius=2, fill=s_titan)
    d.rounded_rectangle([fx1 - 1, int(total_h * 0.35), total_w - 1, int(total_h * 0.42)], radius=2, fill=s_titan)

    d.rounded_rectangle(
        [fx0, fy0, fx1, fy1],
        radius=outer_r,
        fill=(160, 168, 178, 255),
        outline=(215, 222, 230, 255),
        width=2,
    )
    gx0, gy0 = fx0 + titanium_ring, fy0 + titanium_ring
    gx1, gy1 = fx1 - titanium_ring, fy1 - titanium_ring
    d.rounded_rectangle([gx0, gy0, gx1, gy1], radius=glass_r, fill=(8, 10, 15, 255))

    sx0, sy0 = gx0 + glass_bezel, gy0 + glass_bezel
    display = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    dd = ImageDraw.Draw(display)

    dd.rectangle([0, 0, inner_w, status_h], fill=(255, 255, 255, 255))
    draw_status_bar_icons(dd, 0, 0, inner_w, status_h, dark_text=True)

    cam_r = max(4, int(status_h * 0.22))
    cx, cy = inner_w // 2, status_h // 2
    dd.ellipse([cx - cam_r, cy - cam_r, cx + cam_r, cy + cam_r], fill=(10, 12, 16, 255))
    dd.ellipse([cx - cam_r // 2, cy - cam_r // 2, cx + cam_r // 2, cy + cam_r // 2], fill=(28, 45, 78, 255))

    app_img = fit_screenshot(img_path, screen_w, screen_h)
    display.paste(app_img, (0, status_h))

    mask = rounded_mask((inner_w, inner_h), screen_r)
    out.paste(display, (sx0, sy0), mask)
    d.rounded_rectangle([sx0, sy0, sx0 + inner_w - 1, sy0 + inner_h - 1], radius=screen_r, outline=(45, 55, 72, 180), width=1)
    return out


def render_iphone_duo_dual_screen(left_img_path: str, right_img_path: str, pane_w: int, pane_h: int) -> Image.Image:
    status_h = max(22, int(pane_h * 0.042))
    hinge_w = 8
    inner_w = pane_w * 2 + hinge_w
    inner_h = status_h + pane_h

    glass_bezel = 7
    titanium_ring = 4
    pad = glass_bezel + titanium_ring

    pane_r = 18
    glass_r = pane_r + glass_bezel
    outer_r = glass_r + titanium_ring

    total_w = inner_w + pad * 2
    total_h = inner_h + pad * 2

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)

    d.rounded_rectangle(
        [0, 0, total_w - 1, total_h - 1],
        radius=outer_r,
        fill=(196, 189, 178, 255),
        outline=(232, 227, 218, 255),
        width=2,
    )
    d.rounded_rectangle(
        [titanium_ring, titanium_ring, total_w - titanium_ring - 1, total_h - titanium_ring - 1],
        radius=glass_r,
        fill=(10, 12, 16, 255),
    )

    def make_pane(path: str, has_island: bool) -> Image.Image:
        p = Image.new("RGBA", (pane_w, inner_h), (255, 255, 255, 255))
        pd = ImageDraw.Draw(p)
        pd.rectangle([0, 0, pane_w, status_h], fill=(255, 255, 255, 255))
        draw_status_bar_icons(pd, 0, 0, pane_w, status_h, dark_text=True)
        if has_island:
            di_w = max(56, int(pane_w * 0.25))
            di_h = max(12, int(status_h * 0.58))
            di_x = (pane_w - di_w) // 2
            di_y = (status_h - di_h) // 2
            pd.rounded_rectangle([di_x, di_y, di_x + di_w, di_y + di_h], radius=di_h // 2, fill=(10, 12, 16, 255))
        app = fit_screenshot(path, pane_w, pane_h)
        p.paste(app, (0, status_h))
        return p

    left_pane = make_pane(left_img_path, True)
    right_pane = make_pane(right_img_path, False)

    sx0, sy0 = pad, pad
    mask_pane = rounded_mask((pane_w, inner_h), pane_r)
    out.paste(left_pane, (sx0, sy0), mask_pane)
    out.paste(right_pane, (sx0 + pane_w + hinge_w, sy0), mask_pane)

    hx = sx0 + pane_w + 2
    d.line([(hx + 2, sy0 + 4), (hx + 2, sy0 + inner_h - 4)], fill=(75, 85, 99, 200), width=2)
    return out


def render_samsung_zfold_tablet(img_path: str, screen_w: int, screen_h: int) -> Image.Image:
    status_h = max(24, int(screen_h * 0.035))
    inner_w = screen_w
    inner_h = status_h + screen_h

    glass_bezel = 8
    metal_ring = 4
    pad = glass_bezel + metal_ring

    screen_r = 12
    glass_r = screen_r + glass_bezel
    outer_r = glass_r + metal_ring

    total_w = inner_w + pad * 2
    total_h = inner_h + pad * 2

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)

    d.rounded_rectangle(
        [0, 0, total_w - 1, total_h - 1],
        radius=outer_r,
        fill=(152, 160, 172, 255),
        outline=(212, 218, 226, 255),
        width=2,
    )
    d.rounded_rectangle(
        [metal_ring, metal_ring, total_w - metal_ring - 1, total_h - metal_ring - 1],
        radius=glass_r,
        fill=(10, 12, 18, 255),
    )

    sx0, sy0 = pad, pad
    display = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    dd = ImageDraw.Draw(display)

    dd.rectangle([0, 0, inner_w, status_h], fill=(255, 255, 255, 255))
    draw_status_bar_icons(dd, 0, 0, inner_w, status_h, dark_text=True)

    udc_x = int(inner_w * 0.75)
    udc_y = status_h // 2
    dd.ellipse([udc_x - 3, udc_y - 3, udc_x + 3, udc_y + 3], fill=(40, 48, 60, 150))

    app_img = fit_screenshot(img_path, screen_w, screen_h)
    display.paste(app_img, (0, status_h))

    crease = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(crease)
    mid_x = inner_w // 2
    cd.line([(mid_x - 1, 0), (mid_x - 1, inner_h)], fill=(255, 255, 255, 26), width=1)
    cd.line([(mid_x, 0), (mid_x, inner_h)], fill=(17, 24, 39, 16), width=1)
    display = Image.alpha_composite(display, crease)

    mask = rounded_mask((inner_w, inner_h), screen_r)
    out.paste(display, (sx0, sy0), mask)
    d.rounded_rectangle([sx0, sy0, sx0 + inner_w - 1, sy0 + inner_h - 1], radius=screen_r, outline=(55, 65, 81, 180), width=1)
    return out


def render_ipad_pro_tablet(img_path: str, screen_w: int, screen_h: int) -> Image.Image:
    status_h = max(22, int(screen_h * 0.032))
    inner_w = screen_w
    inner_h = status_h + screen_h

    glass_bezel = 10
    metal_ring = 4
    pad = glass_bezel + metal_ring

    screen_r = 16
    glass_r = screen_r + glass_bezel
    outer_r = glass_r + metal_ring

    total_w = inner_w + pad * 2
    total_h = inner_h + pad * 2

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)

    d.rounded_rectangle(
        [0, 0, total_w - 1, total_h - 1],
        radius=outer_r,
        fill=(182, 188, 198, 255),
        outline=(226, 232, 240, 255),
        width=2,
    )
    d.rounded_rectangle(
        [metal_ring, metal_ring, total_w - metal_ring - 1, total_h - metal_ring - 1],
        radius=glass_r,
        fill=(12, 14, 18, 255),
    )

    sx0, sy0 = pad, pad
    display = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    dd = ImageDraw.Draw(display)
    dd.rectangle([0, 0, inner_w, status_h], fill=(255, 255, 255, 255))
    draw_status_bar_icons(dd, 0, 0, inner_w, status_h, dark_text=True)

    app_img = fit_screenshot(img_path, screen_w, screen_h)
    display.paste(app_img, (0, status_h))

    mask = rounded_mask((inner_w, inner_h), screen_r)
    out.paste(display, (sx0, sy0), mask)
    d.rounded_rectangle([sx0, sy0, sx0 + inner_w - 1, sy0 + inner_h - 1], radius=screen_r, outline=(55, 65, 81, 180), width=1)
    return out


def render_macbook_pro_16(img_path: str, screen_w: int, screen_h: int) -> Image.Image:
    menubar_h = 24
    chin_h = 16
    base_h = 12
    inner_w = screen_w
    inner_h = menubar_h + screen_h

    bezel = 10
    lid_w = inner_w + bezel * 2
    lid_h = inner_h + bezel + chin_h
    base_extra = 14
    total_w = lid_w + base_extra * 2
    total_h = lid_h + base_h

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    lx0 = base_extra

    # 1. Outer Black Display Lid (Rounded TOP corners r=16, 100% SQUARE BOTTOM corners!)
    lid_mask = rounded_mask((lid_w, lid_h), 16, square_bottom=True)
    lid_layer = Image.new("RGBA", (lid_w, lid_h), (14, 17, 23, 255))
    ld = ImageDraw.Draw(lid_layer)
    ld.rounded_rectangle([0, 0, lid_w - 1, lid_h + 16], radius=16, outline=(156, 163, 175, 255), width=2)
    out.paste(lid_layer, (lx0, 0), lid_mask)

    # 2. Inner Display (Light macOS Menu Bar + Top Black Camera Notch + App Screenshot)
    sx0, sy0 = lx0 + bezel, bezel
    display = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    dd = ImageDraw.Draw(display)

    dd.rectangle([0, 0, inner_w, menubar_h], fill=(243, 244, 246, 255))
    dd.line([(0, menubar_h - 1), (inner_w, menubar_h - 1)], fill=(209, 213, 219, 255), width=1)

    dd.ellipse([12, 7, 21, 16], fill=(239, 68, 68, 255))
    dd.ellipse([26, 7, 35, 16], fill=(245, 158, 11, 255))
    dd.ellipse([40, 7, 49, 16], fill=(16, 185, 129, 255))
    dd.text((60, 4), "EcoMiles TMS  ·  ecomiles.pages.dev", fill=(17, 24, 39, 255), font=get_font(True, 11))
    dd.text((inner_w - 92, 4), "5G   100%   09:41", fill=(17, 24, 39, 255), font=get_font(True, 10))

    notch_w = max(96, int(inner_w * 0.13))
    nx0 = (inner_w - notch_w) // 2
    dd.rounded_rectangle([nx0, -8, nx0 + notch_w, menubar_h - 3], radius=7, fill=(14, 17, 23, 255))
    dd.ellipse([inner_w // 2 - 3, 5, inner_w // 2 + 3, 11], fill=(28, 48, 84, 255))
    dd.ellipse([inner_w // 2 + 12, 7, inner_w // 2 + 15, 10], fill=(34, 197, 94, 220))

    app_img = fit_screenshot(img_path, screen_w, screen_h)
    display.paste(app_img, (0, menubar_h))

    screen_mask = rounded_mask((inner_w, inner_h), 9, square_bottom=True)
    out.paste(display, (sx0, sy0), screen_mask)

    # 3. Bottom Chin
    d = ImageDraw.Draw(out)
    d.rectangle([lx0 + 2, sy0 + inner_h, lx0 + lid_w - 3, lid_h - 1], fill=(22, 27, 36, 255))
    d.text((total_w // 2 - 28, sy0 + inner_h + 1), "MacBook Pro", fill=(156, 163, 175, 210), font=get_font(True, 10))

    # 4. Sleek Silver Aluminum Base Deck (flat top, rounded bottom, NO dark bottom notch!)
    base_mask = rounded_mask((total_w, base_h), 8, square_top=True)
    base_layer = Image.new("RGBA", (total_w, base_h), (188, 195, 206, 255))
    bld = ImageDraw.Draw(base_layer)
    bld.line([(0, 0), (total_w - 1, 0)], fill=(235, 240, 246, 255), width=2)
    bld.line([(0, base_h - 1), (total_w - 1, base_h - 1)], fill=(120, 128, 140, 255), width=2)
    out.paste(base_layer, (0, lid_h), base_mask)
    return out


def render_windows_xps_laptop(img_path: str, screen_w: int, screen_h: int) -> Image.Image:
    taskbar_h = 24
    chin_h = 12
    base_h = 11
    inner_w = screen_w
    inner_h = screen_h + taskbar_h

    bezel = 7
    lid_w = inner_w + bezel * 2
    lid_h = inner_h + bezel + chin_h
    base_extra = 12
    total_w = lid_w + base_extra * 2
    total_h = lid_h + base_h

    out = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    lx0 = base_extra

    lid_mask = rounded_mask((lid_w, lid_h), 10, square_bottom=True)
    lid_layer = Image.new("RGBA", (lid_w, lid_h), (20, 24, 31, 255))
    ld = ImageDraw.Draw(lid_layer)
    ld.rounded_rectangle([0, 0, lid_w - 1, lid_h + 10], radius=10, outline=(175, 184, 196, 255), width=2)
    ld.ellipse([lid_w // 2 - 2, 2, lid_w // 2 + 2, 6], fill=(45, 65, 98, 255))
    out.paste(lid_layer, (lx0, 0), lid_mask)

    sx0, sy0 = lx0 + bezel, bezel
    display = Image.new("RGBA", (inner_w, inner_h), (255, 255, 255, 255))
    app_img = fit_screenshot(img_path, screen_w, screen_h)
    display.paste(app_img, (0, 0))

    dd = ImageDraw.Draw(display)
    ty0 = screen_h
    dd.rectangle([0, ty0, inner_w, inner_h], fill=(243, 244, 246, 248))
    dd.line([(0, ty0), (inner_w, ty0)], fill=(209, 213, 219, 255), width=1)
    cx = inner_w // 2 - 36
    cy = ty0 + 5
    dd.rectangle([cx, cy, cx + 5, cy + 5], fill=(0, 120, 212, 255))
    dd.rectangle([cx + 7, cy, cx + 12, cy + 5], fill=(0, 120, 212, 255))
    dd.rectangle([cx, cy + 7, cx + 5, cy + 12], fill=(0, 120, 212, 255))
    dd.rectangle([cx + 7, cy + 7, cx + 12, cy + 12], fill=(0, 120, 212, 255))
    dd.rounded_rectangle([cx + 22, cy - 1, cx + 36, cy + 13], radius=3, fill=(20, 83, 45, 255))
    dd.text((cx + 44, cy), "EcoMiles Windows 11 PWA", fill=(17, 24, 39, 255), font=get_font(True, 10))
    dd.text((inner_w - 75, cy), "09:41  VIE", fill=(55, 65, 81, 255), font=get_font(True, 10))

    screen_mask = rounded_mask((inner_w, inner_h), 5, square_bottom=True)
    out.paste(display, (sx0, sy0), screen_mask)

    d = ImageDraw.Draw(out)
    d.rectangle([lx0 + 2, sy0 + inner_h, lx0 + lid_w - 3, lid_h - 1], fill=(20, 24, 31, 255))
    d.text((total_w // 2 - 18, sy0 + inner_h), "XPS 16", fill=(156, 163, 175, 200), font=get_font(True, 9))

    base_mask = rounded_mask((total_w, base_h), 6, square_top=True)
    base_layer = Image.new("RGBA", (total_w, base_h), (198, 205, 214, 255))
    bld = ImageDraw.Draw(base_layer)
    bld.line([(0, 0), (total_w - 1, 0)], fill=(240, 244, 248, 255), width=2)
    out.paste(base_layer, (0, lid_h), base_mask)
    return out


def paste_with_shadow_and_badge(
    canvas: Image.Image,
    device_img: Image.Image,
    pos: tuple[int, int],
    badge_text: str,
    badge_pos: str = "top",
) -> None:
    x, y = pos
    w, h = device_img.size

    shadow = Image.new("RGBA", (w + 48, h + 48), (0, 0, 0, 0))
    alpha = device_img.getchannel("A")
    black_sil = Image.new("RGBA", (w, h), (9, 14, 24, 145))
    shadow.paste(black_sil, (24, 28), alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow, (x - 24, y - 24))

    canvas.alpha_composite(device_img, (x, y))

    if badge_text:
        d = ImageDraw.Draw(canvas)
        f_badge = get_font(True, 13)
        tb = d.textbbox((0, 0), badge_text, font=f_badge)
        bw = (tb[2] - tb[0]) + 22
        bh = 28
        bx = x + max(0, (w - bw) // 2)
        by = (y + h + 10) if badge_pos == "bottom" else (y - 36)
        d.rounded_rectangle(
            [bx, by, bx + bw, by + bh],
            radius=8,
            fill=(20, 83, 45, 248),
            outline=(214, 246, 90, 230),
            width=2,
        )
        d.text((bx + 11, by + 5), badge_text, fill=(214, 246, 90, 255), font=f_badge)


def make_slide_canvas(title: str, subtitle: str, kpi_pill: str) -> Image.Image:
    canvas = Image.new("RGBA", (1920, 1080), (243, 244, 239, 255))
    d = ImageDraw.Draw(canvas)

    d.rectangle([0, 0, 1920, 104], fill=(17, 24, 39, 255))
    d.rectangle([0, 101, 1920, 104], fill=(214, 246, 90, 255))

    d.rounded_rectangle([40, 22, 98, 80], radius=14, fill=(20, 83, 45, 255))
    d.text((52, 34), "EM", fill=(214, 246, 90, 255), font=get_font(True, 24))

    d.text((116, 23), title, fill=(255, 255, 255, 255), font=get_font(True, 23))
    d.text((116, 58), subtitle, fill=(209, 213, 219, 255), font=get_font(False, 15))

    f_kpi = get_font(True, 15)
    tb = d.textbbox((0, 0), kpi_pill, font=f_kpi)
    kw = (tb[2] - tb[0]) + 32
    kx = 1920 - 40 - kw
    d.rounded_rectangle([kx, 28, 1920 - 40, 76], radius=12, fill=(20, 83, 45, 255), outline=(214, 246, 90, 255), width=2)
    d.text((kx + 16, 41), kpi_pill, fill=(214, 246, 90, 255), font=f_kpi)

    d.rectangle([0, 1042, 1920, 1080], fill=(17, 24, 39, 255))
    d.text(
        (40, 1051),
        "EcoMiles B2B Urban Logistics Optimization & ISO 14083 / GLEC v3.2 Carbon Accounting  ·  https://ecomiles.pages.dev",
        fill=(156, 163, 175, 255),
        font=get_font(False, 14),
    )
    d.text(
        (1340, 1051),
        "MacBook Pro · Windows XPS · Z Fold · iPad · iPhone Duo · 18 Pro Max · S26 Ultra",
        fill=(214, 246, 90, 255),
        font=get_font(True, 13),
    )
    return canvas


def build_master_cover_banner() -> str:
    W, H = 2400, 1260
    banner = Image.new("RGBA", (W, H), (11, 17, 28, 255))

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([350, 120, 2050, 1080], fill=(20, 83, 45, 110))
    gd.ellipse([750, 260, 1650, 920], fill=(214, 246, 90, 38))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    banner = Image.alpha_composite(banner, glow)

    bd = ImageDraw.Draw(banner)
    bd.rectangle([0, 1055, W, H], fill=(8, 12, 20, 255))
    bd.line([(0, 1055), (W, 1055)], fill=(214, 246, 90, 95), width=2)

    bd.rounded_rectangle([60, 36, 440, 78], radius=21, fill=(20, 83, 45, 240), outline=(214, 246, 90, 220), width=2)
    bd.text((82, 46), "ECOMILES MULTI-DEVICE B2B PLATFORM", fill=(214, 246, 90, 255), font=get_font(True, 16))

    bd.text(
        (60, 92),
        "Một Nền Tảng Đồng Bộ Trên Mọi Thiết Bị Điều Phối & Buồng Lái Tài Xế",
        fill=(255, 255, 255, 255),
        font=get_font(True, 38),
    )
    bd.text(
        (60, 144),
        "MacBook Pro 16\"  ·  Windows 11 XPS  ·  Samsung Galaxy Z Fold  ·  iPad Pro  ·  iPhone Duo  ·  iPhone 18 Pro Max  ·  Galaxy S26 Ultra",
        fill=(156, 163, 175, 255),
        font=get_font(False, 19),
    )

    kpis = [
        ("-34.9%", "Quãng đường (243.7 vs 374.4 km)"),
        ("-39.2%", "Phát thải CO₂e (Chuẩn GLEC v3.2)"),
        ("0 Lỗi", "Vi phạm Cấm tải QĐ 23/2018"),
    ]
    for i, (kv, kl) in enumerate(kpis):
        kx = 1470 + i * 295
        bd.rounded_rectangle([kx, 48, kx + 280, 152], radius=16, fill=(17, 24, 39, 235), outline=(214, 246, 90, 160), width=2)
        bd.text((kx + 20, 60), kv, fill=(214, 246, 90, 255), font=get_font(True, 34))
        bd.text((kx + 20, 110), kl, fill=(209, 213, 219, 255), font=get_font(False, 14))

    mbp = render_macbook_pro_16(os.path.join(SHOT_DIR, "01_desktop_b2b_tms_fleet_overview.png"), 760, 475)
    xps = render_windows_xps_laptop(os.path.join(SHOT_DIR, "02_desktop_b2b_tms_evsim_dual_simulator.png"), 760, 475)
    paste_with_shadow_and_badge(banner, mbp, (310, 235), "MACBOOK PRO 16\" · Điều Phối Đội Xe B2B CRM/TMS", "top")
    paste_with_shadow_and_badge(banner, xps, (1280, 235), "WINDOWS 11 XPS 16 · Đối Chứng 2 Bên EVSIM", "top")

    zfold = render_samsung_zfold_tablet(os.path.join(SHOT_DIR, "11_tablet_maps_live_navigate_cockpit.png"), 390, 520)
    ipad = render_ipad_pro_tablet(os.path.join(SHOT_DIR, "09_tablet_b2b_tms_fleet_overview.png"), 390, 520)
    paste_with_shadow_and_badge(banner, zfold, (56, 440), "SAMSUNG GALAXY Z FOLD · Bản Đồ (/maps)", "bottom")
    paste_with_shadow_and_badge(banner, ipad, (1925, 440), "iPAD PRO TABLET · Quản Trị Đội Xe", "bottom")

    ip18 = render_iphone_18_pro_max(os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"), 235, 508)
    duo = render_iphone_duo_dual_screen(
        os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"),
        os.path.join(SHOT_DIR, "15_mobile_maps_live_follow_truck_nav.png"),
        235,
        508,
    )
    s26 = render_samsung_s26_ultra(os.path.join(SHOT_DIR, "14_mobile_driver_last_mile_gmaps_waypoints.png"), 235, 508)

    paste_with_shadow_and_badge(banner, ip18, (555, 460), "iPHONE 18 PRO MAX · Chặng Giữa (>500kg)", "bottom")
    paste_with_shadow_and_badge(banner, duo, (935, 460), "iPHONE DUO DUAL-SCREEN · /driver + /maps Live", "bottom")
    paste_with_shadow_and_badge(banner, s26, (1545, 460), "GALAXY S26 ULTRA · Chặng Cuối (<=500kg)", "bottom")
    bd = ImageDraw.Draw(banner)
    bd.text(
        (60, 1185),
        "EcoMiles Platform  ·  100% Đường Phố Thật OSRM TP.HCM ($0 Map API)  ·  Zero-Knowledge AES-256-GCM  ·  https://ecomiles.pages.dev",
        fill=(209, 213, 219, 255),
        font=get_font(True, 18),
    )

    p0 = os.path.join(SHOT_DIR, "00_ecomiles_flagship_cover_banner.png")
    banner.convert("RGB").save(p0, quality=95)
    return p0


def build_all() -> list[str]:
    built = []
    built.append(build_master_cover_banner())

    m_ip18 = render_iphone_18_pro_max(os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"), 390, 844)
    p21 = os.path.join(SHOT_DIR, "21_mockup_iphone_18_pro_max_driver.png")
    m_ip18.save(p21)
    built.append(p21)

    m_s26 = render_samsung_s26_ultra(os.path.join(SHOT_DIR, "15_mobile_maps_live_follow_truck_nav.png"), 390, 844)
    p22 = os.path.join(SHOT_DIR, "22_mockup_samsung_s26_ultra_maps_live.png")
    m_s26.save(p22)
    built.append(p22)

    m_duo = render_iphone_duo_dual_screen(
        os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"),
        os.path.join(SHOT_DIR, "15_mobile_maps_live_follow_truck_nav.png"),
        360,
        780,
    )
    p23 = os.path.join(SHOT_DIR, "23_mockup_iphone_duo_dual_screen.png")
    m_duo.save(p23)
    built.append(p23)

    m_zfold_nav = render_samsung_zfold_tablet(os.path.join(SHOT_DIR, "11_tablet_maps_live_navigate_cockpit.png"), 600, 800)
    p24 = os.path.join(SHOT_DIR, "24_mockup_samsung_zfold_tablet_cockpit.png")
    m_zfold_nav.save(p24)
    built.append(p24)

    m_ipad = render_ipad_pro_tablet(os.path.join(SHOT_DIR, "09_tablet_b2b_tms_fleet_overview.png"), 600, 800)
    p25 = os.path.join(SHOT_DIR, "25_mockup_ipad_pro_tablet_tms.png")
    m_ipad.save(p25)
    built.append(p25)

    m_mbp = render_macbook_pro_16(os.path.join(SHOT_DIR, "01_desktop_b2b_tms_fleet_overview.png"), 1120, 700)
    p26 = os.path.join(SHOT_DIR, "26_mockup_macbook_pro_16_b2b_tms.png")
    m_mbp.save(p26)
    built.append(p26)

    m_xps = render_windows_xps_laptop(os.path.join(SHOT_DIR, "02_desktop_b2b_tms_evsim_dual_simulator.png"), 1120, 700)
    p27 = os.path.join(SHOT_DIR, "27_mockup_windows_xps_16_evsim_dual.png")
    m_xps.save(p27)
    built.append(p27)

    c1 = make_slide_canvas(
        "EcoMiles Multi-Device Ecosystem (MacBook · Windows · Z Fold · iPhone · S26 Ultra)",
        "Đồng bộ thời gian thực từ Trung tâm Điều phối (MacBook/Windows) đến Buồng lái Z Fold và Điện thoại Tài xế (iPhone 18 Pro Max & S26 Ultra)",
        "-34.9% Km Lộ Trình  ·  -39.2% CO₂e  ·  0 Lỗi QĐ 23/2018",
    )
    mbp_s17 = render_macbook_pro_16(os.path.join(SHOT_DIR, "01_desktop_b2b_tms_fleet_overview.png"), 760, 475)
    zfold_s17 = render_samsung_zfold_tablet(os.path.join(SHOT_DIR, "11_tablet_maps_live_navigate_cockpit.png"), 384, 512)
    ip18_s17 = render_iphone_18_pro_max(os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"), 234, 506)
    s26_s17 = render_samsung_s26_ultra(os.path.join(SHOT_DIR, "14_mobile_driver_last_mile_gmaps_waypoints.png"), 234, 506)

    paste_with_shadow_and_badge(c1, mbp_s17, (38, 175), "1. MACBOOK PRO 16\" · Điều Phối B2B CRM/TMS")
    paste_with_shadow_and_badge(c1, zfold_s17, (890, 175), "2. SAMSUNG GALAXY Z FOLD · Bản Đồ (/maps)")
    paste_with_shadow_and_badge(c1, ip18_s17, (1345, 175), "3. iPHONE 18 PRO MAX")
    paste_with_shadow_and_badge(c1, s26_s17, (1630, 175), "4. GALAXY S26 ULTRA")

    d1 = ImageDraw.Draw(c1)
    cards = [
        ("MACBOOK PRO 16\" & WINDOWS XPS", "Nạp .XLSX 120 đơn · Tối ưu 7 xe trong 31ms · Xuất Báo cáo ESG 3 Sheet"),
        ("GALAXY Z FOLD & iPAD PRO (TABLET)", "Màn hình gập mở rộng 768x1024 hiển thị Vùng cấm QĐ 23/2018 & Cầu 13T"),
        ("iPHONE DUO, 18 PRO MAX & S26 ULTRA", "Chặng Giữa (>500kg) + Chặng Cuối (<=500kg) khóa Waypoints Google Maps $0"),
    ]
    for idx, (ct, cs) in enumerate(cards):
        cx = 40 + idx * 616
        d1.rounded_rectangle([cx, 845, cx + 592, 1015], radius=14, fill=(255, 255, 255, 255), outline=(216, 207, 189, 255), width=2)
        d1.text((cx + 20, 868), ct, fill=(20, 83, 45, 255), font=get_font(True, 16))
        d1.text((cx + 20, 905), cs, fill=(55, 65, 81, 255), font=get_font(False, 14))
    p17 = os.path.join(SHOT_DIR, "17_slide_composite_all_devices_hero_trio.png")
    c1.convert("RGB").save(p17, quality=95)
    built.append(p17)

    c2 = make_slide_canvas(
        "Flagship Mobile & Foldable Fleet Lineup: Z Fold · iPhone Duo · iPhone 18 Pro Max · Galaxy S26 Ultra",
        "Hỗ trợ toàn diện thiết bị màn hình gập (Galaxy Z Fold, iPhone Duo Dual-Screen) và điện thoại tài xế (iPhone 18 Pro Max, S26 Ultra)",
        "Concentric Bezels  ·  100% Đường Phố Thật OSRM",
    )
    zfold_s18 = render_samsung_zfold_tablet(os.path.join(SHOT_DIR, "11_tablet_maps_live_navigate_cockpit.png"), 450, 600)
    duo_s18 = render_iphone_duo_dual_screen(
        os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"),
        os.path.join(SHOT_DIR, "15_mobile_maps_live_follow_truck_nav.png"),
        270,
        585,
    )
    ip18_s18 = render_iphone_18_pro_max(os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"), 275, 595)
    s26_s18 = render_samsung_s26_ultra(os.path.join(SHOT_DIR, "14_mobile_driver_last_mile_gmaps_waypoints.png"), 275, 595)

    paste_with_shadow_and_badge(c2, zfold_s18, (40, 185), "SAMSUNG GALAXY Z FOLD (Unfolded 768x1024)")
    paste_with_shadow_and_badge(c2, duo_s18, (555, 185), "iPHONE DUO · Dual-Screen (Left: /driver · Right: /maps Live)")
    paste_with_shadow_and_badge(c2, ip18_s18, (1175, 185), "iPHONE 18 PRO MAX (Titanium)")
    paste_with_shadow_and_badge(c2, s26_s18, (1535, 185), "SAMSUNG GALAXY S26 ULTRA")
    p18 = os.path.join(SHOT_DIR, "18_slide_composite_driver_and_maps_mobile_tablet.png")
    c2.convert("RGB").save(p18, quality=95)
    built.append(p18)

    c3 = make_slide_canvas(
        "Cross-Platform Desktop Proof: MacBook Pro 16\" (macOS) & Dell XPS 16 (Windows 11)",
        "So sánh song song 100% cùng hàm khoảng cách OSRM: Điều phối Thủ công (374.4 km, 28 lỗi QĐ 23) vs EcoMiles (243.7 km, 0 lỗi)",
        "Chuẩn ISO 14083 / GLEC v3.2  ·  Tải Trọng Động GLX-HDT-v1",
    )
    mbp_s19a = render_macbook_pro_16(os.path.join(SHOT_DIR, "02_desktop_b2b_tms_evsim_dual_simulator.png"), 820, 512)
    xps_s19b = render_windows_xps_laptop(os.path.join(SHOT_DIR, "04_desktop_maps_overview_qd23_banned_zones.png"), 820, 512)
    paste_with_shadow_and_badge(c3, mbp_s19a, (48, 170), "1. MACBOOK PRO 16\" (macOS) · Buồng Kiểm Thử Đối Chứng 2 Bên EVSIM")
    paste_with_shadow_and_badge(c3, xps_s19b, (990, 170), "2. WINDOWS 11 LAPTOP (XPS 16) · Bản Đồ Vùng Cấm Tải QĐ 23/2018")

    d3 = ImageDraw.Draw(c3)
    metrics_boxes = [
        ("BASELINE 1 · THEO THỨ TỰ ĐƠN (.XLSX)", "1,072.0 km · 255.48 kg CO₂e", "Chưa phân cụm quận/huyện (Worst-case)"),
        ("BASELINE 2 · ĐIỀU PHỐI THỦ CÔNG + GOOGLE MAPS", "374.4 km · 92.21 kg CO₂e · 28 lỗi QĐ 23", "Chia quận thủ công + chạy rỗng chiều về 32.8%"),
        ("THUẬT TOÁN ECOMILES (CARBON-AWARE ALNS)", "243.7 km (-34.9%) · 56.07 kg CO₂e (-39.2%)", "0 vi phạm QĐ 23/2018 · Ghép 21 đơn chiều về (2.7% rỗng)"),
    ]
    for idx, (mt, mv, ms) in enumerate(metrics_boxes):
        mx = 48 + idx * 616
        d3.rounded_rectangle([mx, 800, mx + 592, 1015], radius=14, fill=(255, 255, 255, 255), outline=(20, 83, 45, 255) if idx == 2 else (209, 213, 219, 255), width=3 if idx == 2 else 2)
        d3.text((mx + 22, 820), mt, fill=(20, 83, 45, 255) if idx == 2 else (107, 114, 128, 255), font=get_font(True, 15))
        d3.text((mx + 22, 860), mv, fill=(17, 24, 39, 255), font=get_font(True, 24))
        d3.text((mx + 22, 910), ms, fill=(75, 85, 99, 255), font=get_font(False, 15))
    p19 = os.path.join(SHOT_DIR, "19_slide_composite_dispatcher_and_evsim_benchmark.png")
    c3.convert("RGB").save(p19, quality=95)
    built.append(p19)

    c4 = make_slide_canvas(
        "Role-Isolated B2B Enterprise Architecture: 4 Specialized Workspaces",
        "Mỗi vai trò có giao diện độc lập, phân quyền RBAC chặt chẽ và mã hóa Zero-Knowledge AES-256-GCM tuân thủ Nghị định 13/2023/NĐ-CP",
        "4 Vai Trò Độc Lập  ·  Zero-Knowledge AES-256-GCM",
    )
    q1 = render_macbook_pro_16(os.path.join(SHOT_DIR, "01_desktop_b2b_tms_fleet_overview.png"), 760, 345)
    q2 = render_windows_xps_laptop(os.path.join(SHOT_DIR, "02_desktop_b2b_tms_evsim_dual_simulator.png"), 760, 345)
    q3 = render_macbook_pro_16(os.path.join(SHOT_DIR, "06_desktop_driver_2tier_middle_and_last_mile.png"), 760, 345)
    q4 = render_windows_xps_laptop(os.path.join(SHOT_DIR, "07_desktop_admin_zero_knowledge_audit.png"), 760, 345)
    paste_with_shadow_and_badge(c4, q1, (65, 165), "VAI TRÒ 1 (USER · MacBook Pro) · Điều Phối Viên Công Ty")
    paste_with_shadow_and_badge(c4, q2, (1020, 165), "VAI TRÒ 2 (TESTER · Windows XPS) · Kiểm Định EVSIM")
    paste_with_shadow_and_badge(c4, q3, (65, 625), "VAI TRÒ 3 (DRIVER · 2 Chặng) · Tài Xế Giao Nhận")
    paste_with_shadow_and_badge(c4, q4, (1020, 625), "VAI TRÒ 4 (ADMIN · Zero-Knowledge) · 0% Quyền Giải Mã PII")
    p20 = os.path.join(SHOT_DIR, "20_slide_composite_4role_enterprise_architecture.png")
    c4.convert("RGB").save(p20, quality=95)
    built.append(p20)

    os.makedirs(PUBLIC_SHOT_DIR, exist_ok=True)
    for f in sorted(os.listdir(SHOT_DIR)):
        if f.endswith(".png"):
            shutil.copy2(os.path.join(SHOT_DIR, f), os.path.join(PUBLIC_SHOT_DIR, f))

    return built


if __name__ == "__main__":
    out = build_all()
    for p in out:
        print(f"Built: {os.path.basename(p)} ({os.path.getsize(p) // 1024} KB)")
