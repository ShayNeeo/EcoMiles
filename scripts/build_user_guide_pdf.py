#!/usr/bin/env python3
"""
build_user_guide_pdf.py
Rebuilds ALL EcoMiles User Guides (HTML, PDFs for Standard / Panasonic / HITC / VSIC, and DOCX)
using fresh 1920x1080 screenshots of the 4-Role Daylight Enterprise B2B Logistics Platform
and the dedicated `/maps` OpenTruck Navigator (Overview + Banned Truck Zones + Live Moving "Start" Mode),
complete with:
  - Numbered Indicators (1, 2, 3, 4) & Directional Arrows
  - Contextual Note Callout Pills (Zero Tofu Glyphs)
  - Simulated Cursor + Concentric Click-Ripple Rings
  - "Zoom-in Per Click" Magnifier Spotlight Inset Boxes (1.9x magnification)
"""

import math
import os
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "/home/shayneeo/Downloads/Documents/Coding/RND_to_Startup"
CAPTURES_DIR = "/tmp/ecomiles_guide_captures"
OUTPUT_DIR = os.path.join(BASE_DIR, "docs")
ASSETS_DIR = os.path.join(OUTPUT_DIR, "assets", "annotated")
PUBLIC_DIR = os.path.join(BASE_DIR, "apps", "landing", "public")
os.makedirs(ASSETS_DIR, exist_ok=True)

FONT_BOLD_PATH = "/usr/share/fonts/noto/NotoSans-Bold.ttf"
FONT_REG_PATH = "/usr/share/fonts/noto/NotoSans-Regular.ttf"


def get_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    return ImageFont.truetype(path, size)


def draw_arrow(draw: ImageDraw.ImageDraw, start, end, color=(225, 29, 72), width=5, arrow_size=18):
    """Draw a crisp directional arrow with arrowhead pointing at `end`."""
    draw.line([start, end], fill=(*color[:3], 255), width=width)
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    angle = math.atan2(dy, dx)
    p1 = (
        end[0] - arrow_size * math.cos(angle - math.pi / 6),
        end[1] - arrow_size * math.sin(angle - math.pi / 6),
    )
    p2 = (
        end[0] - arrow_size * math.cos(angle + math.pi / 6),
        end[1] - arrow_size * math.sin(angle + math.pi / 6),
    )
    draw.polygon([end, p1, p2], fill=(*color[:3], 255))


def draw_callout_box(draw: ImageDraw.ImageDraw, box, color=(225, 29, 72), width=4, corner_radius=12, fill_alpha=0.14):
    """Draw a rounded bounding box with translucent highlight fill."""
    x1, y1, x2, y2 = box
    r, g, b = color[:3]
    draw.rounded_rectangle(
        [x1, y1, x2, y2],
        radius=corner_radius,
        fill=(r, g, b, int(255 * fill_alpha)),
        outline=(r, g, b, 255),
        width=width,
    )


def draw_badge(draw: ImageDraw.ImageDraw, center, num_str, bg_color=(225, 29, 72), text_color=(255, 255, 255), radius=22, font_size=21):
    """Draw a circular numbered indicator badge with white border and drop shadow."""
    cx, cy = center
    font = get_font(font_size, bold=True)
    draw.ellipse([cx - radius + 2, cy - radius + 3, cx + radius + 2, cy + radius + 3], fill=(0, 0, 0, 170))
    draw.ellipse([cx - radius - 3, cy - radius - 3, cx + radius + 3, cy + radius + 3], fill=(255, 255, 255, 255))
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(*bg_color[:3], 255))
    bbox = font.getbbox(num_str)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1]
    draw.text((tx, ty), num_str, fill=text_color, font=font)


def draw_pill_label(draw: ImageDraw.ImageDraw, pos, text, bg_color=(17, 24, 39), text_color=(255, 255, 255), border_color=(225, 29, 72), font_size=14):
    """Draw an auto-sized pill note label with border."""
    x, y = pos
    font = get_font(font_size, bold=True)
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad_x, pad_y = 13, 8
    box = [x, y, x + tw + pad_x * 2, y + th + pad_y * 2]
    draw.rounded_rectangle([box[0] + 2, box[1] + 3, box[2] + 2, box[3] + 3], radius=9, fill=(0, 0, 0, 145))
    draw.rounded_rectangle(box, radius=9, fill=(*bg_color[:3], 242), outline=(*border_color[:3], 255), width=2)
    draw.text((x + pad_x, y + pad_y - bbox[1]), text, fill=text_color, font=font)
    return box


def draw_click_cursor_and_ripple(draw: ImageDraw.ImageDraw, cx: int, cy: int, color=(225, 29, 72)):
    """Draw concentric click-ripple rings + high-contrast pointer cursor at `(cx, cy)`."""
    r, g, b = color[:3]
    for rad, alpha, w in [(34, 95, 2), (23, 165, 3), (12, 235, 3)]:
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(r, g, b, alpha), width=w)
    draw.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(255, 212, 0, 255), outline=(17, 24, 39, 255), width=2)

    pts = [
        (cx, cy),
        (cx + 4, cy + 28),
        (cx + 11, cy + 21),
        (cx + 18, cy + 33),
        (cx + 23, cy + 30),
        (cx + 16, cy + 18),
        (cx + 25, cy + 17),
    ]
    shadow_pts = [(px + 2, py + 2) for px, py in pts]
    draw.polygon(shadow_pts, fill=(0, 0, 0, 180))
    draw.polygon(pts, fill=(255, 255, 255, 255), outline=(17, 24, 39, 255))


def draw_zoom_per_click_inset(
    base_img: Image.Image,
    overlay: Image.Image,
    src_center: tuple[int, int],
    src_size: tuple[int, int],
    dst_box: list[int],
    title: str,
    subtitle: str,
    border_color=(225, 29, 72),
):
    """
    Crops `src_size` around `src_center` from `base_img`, scales it up into `dst_box` (~1.9x zoom),
    draws leader lines from the click point to the zoom-in inset, and adds a header & footer note.
    """
    draw = ImageDraw.Draw(overlay, "RGBA")
    cx, cy = src_center
    sw, sh = src_size
    x1 = max(0, cx - sw // 2)
    y1 = max(0, cy - sh // 2)
    x2 = min(base_img.width, x1 + sw)
    y2 = min(base_img.height, y1 + sh)

    dx1, dy1, dx2, dy2 = dst_box
    dw = dx2 - dx1
    dh = dy2 - dy1

    # Leader lines from source crop box to zoomed inset box
    draw.rounded_rectangle([x1, y1, x2, y2], radius=8, outline=(*border_color[:3], 255), width=3)
    draw.line(
        [(cx, y1 if dy2 < cy else y2), ((dx1 + dx2) // 2, dy2 if dy2 < cy else dy1)],
        fill=(*border_color[:3], 215),
        width=3,
    )

    # Drop shadow behind zoom card
    draw.rounded_rectangle([dx1 - 4, dy1 - 36, dx2 + 6, dy2 + 34], radius=14, fill=(0, 0, 0, 175))
    draw.rounded_rectangle(
        [dx1 - 2, dy1 - 34, dx2 + 2, dy2 + 30],
        radius=12,
        fill=(17, 24, 39, 250),
        outline=(*border_color[:3], 255),
        width=4,
    )

    # Header bar with vector magnifier icon (zero emoji tofu)
    font_h = get_font(13, bold=True)
    draw.ellipse([dx1 + 10, dy1 - 26, dx1 + 22, dy1 - 14], outline=(255, 212, 0, 255), width=2)
    draw.line([(dx1 + 20, dy1 - 15), (dx1 + 26, dy1 - 9)], fill=(255, 212, 0, 255), width=3)
    draw.text((dx1 + 32, dy1 - 26), f"PHÓNG TO KHI CLICK (1.9x): {title}", fill=(255, 212, 0, 255), font=font_h)

    crop = base_img.crop((x1, y1, x2, y2)).resize((dw, dh), Image.Resampling.LANCZOS).convert("RGBA")
    crop_draw = ImageDraw.Draw(crop, "RGBA")
    draw_click_cursor_and_ripple(crop_draw, dw // 2, dh // 2, color=border_color)
    overlay.alpha_composite(crop, (dx1, dy1))

    font_s = get_font(12, bold=False)
    draw.text((dx1 + 10, dy2 + 6), subtitle, fill=(226, 232, 240, 255), font=font_s)


def annotate_all_figures() -> dict[str, str]:
    paths: dict[str, str] = {}
    c1 = (25, 113, 194)
    c2 = (47, 158, 68)
    c3 = (230, 119, 0)
    c4 = (225, 29, 72)

    # 1. FIG 1: 4-ROLE FAST-LOGIN GATE
    im1 = Image.open(os.path.join(CAPTURES_DIR, "01_fast_login_modal.png")).convert("RGBA")
    ov1 = Image.new("RGBA", im1.size, (0, 0, 0, 0))
    d1 = ImageDraw.Draw(ov1, "RGBA")

    draw_callout_box(d1, [475, 190, 950, 540], color=c1, width=4)
    draw_badge(d1, (475, 190), "1", bg_color=c1)
    draw_pill_label(d1, (485, 138), "[1] VAI TRÒ 1: ĐIỀU PHỐI VIÊN CÔNG TY (CRM / TMS)", border_color=c1)
    draw_click_cursor_and_ripple(d1, 713, 503, color=c1)

    draw_callout_box(d1, [970, 190, 1445, 540], color=c2, width=4)
    draw_badge(d1, (1445, 190), "2", bg_color=c2)
    draw_pill_label(d1, (980, 138), "[2] VAI TRÒ 2: KIỂM THỬ ĐỐI CHỨNG EVSIM 2 BÊN", border_color=c2)

    draw_callout_box(d1, [475, 555, 950, 885], color=c3, width=4)
    draw_badge(d1, (475, 885), "3", bg_color=c3)
    draw_pill_label(d1, (30, 700), "[3] VAI TRÒ 3: APP TÀI XẾ (PIN 0000)", border_color=c3)
    draw_arrow(d1, (415, 720), (470, 720), color=c3)

    draw_callout_box(d1, [970, 555, 1445, 885], color=c4, width=4)
    draw_badge(d1, (1445, 885), "4", bg_color=c4)
    draw_pill_label(d1, (1480, 700), "[4] VAI TRÒ 4: ADMIN MÙ (ZERO-KNOWLEDGE)", border_color=c4)
    draw_arrow(d1, (1475, 720), (1450, 720), color=c4)

    draw_zoom_per_click_inset(
        im1,
        ov1,
        src_center=(713, 470),
        src_size=(340, 130),
        dst_box=[25, 210, 445, 390],
        title="ĐĂNG NHẬP NHANH 1 CHẠM",
        subtitle="Điền sẵn Bearer Token & KMS Công ty (Không cần mật khẩu)",
        border_color=c1,
    )
    out1 = os.path.join(ASSETS_DIR, "fig1_role_portal.png")
    Image.alpha_composite(im1, ov1).convert("RGB").save(out1, quality=95)
    paths["fig1"] = out1

    # 2. FIG 2: B2B CRM OVERVIEW
    im2 = Image.open(os.path.join(CAPTURES_DIR, "02_role1_crm_overview.png")).convert("RGBA")
    ov2 = Image.new("RGBA", im2.size, (0, 0, 0, 0))
    d2 = ImageDraw.Draw(ov2, "RGBA")

    draw_callout_box(d2, [310, 6, 785, 48], color=c1, width=3)
    draw_badge(d2, (290, 27), "1", bg_color=c1, radius=18, font_size=18)

    draw_callout_box(d2, [190, 325, 435, 760], color=c2, width=4)
    draw_badge(d2, (190, 325), "2", bg_color=c2)
    draw_pill_label(d2, (18, 265), "[2] THANH ĐIỀU HƯỚNG 6 PHÂN HỆ CRM/TMS", border_color=c2)

    draw_callout_box(d2, [450, 290, 1725, 415], color=c3, width=4)
    draw_badge(d2, (450, 290), "3", bg_color=c3)
    draw_pill_label(d2, (1120, 232), "[3] DẢI 5 CHỈ SỐ KPI: GIẢM 44.1% KM & CỨU 28 ĐƠN CẤM TẢI", border_color=c3)

    draw_callout_box(d2, [450, 435, 1725, 920], color=c4, width=4)
    draw_badge(d2, (450, 435), "4", bg_color=c4)
    draw_click_cursor_and_ripple(d2, 1650, 663, color=c4)

    draw_zoom_per_click_inset(
        im2,
        ov2,
        src_center=(1490, 663),
        src_size=(340, 130),
        dst_box=[1330, 740, 1890, 960],
        title="GHÉP ĐƠN CHIỀU VỀ & MỞ APP XE",
        subtitle="Click 'Mở App xe này' để chuyển thẳng sang màn hình Tài xế",
        border_color=c4,
    )
    out2 = os.path.join(ASSETS_DIR, "fig2_dispatcher_dashboard.png")
    Image.alpha_composite(im2, ov2).convert("RGB").save(out2, quality=95)
    paths["fig2"] = out2

    # 3. FIG 3: DISPATCHER ROUTING WORKBENCH
    im3 = Image.open(os.path.join(CAPTURES_DIR, "03_role1_routing_workbench.png")).convert("RGBA")
    ov3 = Image.new("RGBA", im3.size, (0, 0, 0, 0))
    d3 = ImageDraw.Draw(ov3, "RGBA")

    draw_callout_box(d3, [450, 200, 1730, 405], color=c2, width=4)
    draw_badge(d3, (450, 200), "1", bg_color=c2)
    draw_click_cursor_and_ripple(d3, 1576, 248, color=c2)

    draw_callout_box(d3, [450, 425, 1185, 860], color=c1, width=4)
    draw_badge(d3, (450, 425), "2", bg_color=c1)
    draw_pill_label(d3, (465, 875), "[2] BẢN ĐỒ TP.HCM THỰC TẾ: XE TẢI CHẠY BÁM ĐƯỜNG BỘ OSRM", border_color=c1)

    draw_callout_box(d3, [1205, 425, 1730, 860], color=c4, width=4)
    draw_badge(d3, (1205, 425), "3", bg_color=c4)
    draw_pill_label(d3, (1210, 875), "[3] NHẬT KÝ TỰ ĐỘNG DỜI KHUNG GIỜ CẤM QĐ 23/2018", border_color=c4)

    draw_zoom_per_click_inset(
        im3,
        ov3,
        src_center=(820, 680),
        src_size=(320, 150),
        dst_box=[20, 740, 435, 965],
        title="XE TẢI BÁM ĐƯỜNG BỘ OSRM (60 FPS)",
        subtitle="Mũi tên hướng di chuyển & đuôi sáng bám sát đường OpenStreetMap",
        border_color=c1,
    )
    out3 = os.path.join(ASSETS_DIR, "fig3_dispatcher_stops_bans.png")
    Image.alpha_composite(im3, ov3).convert("RGB").save(out3, quality=95)
    paths["fig3"] = out3

    # 4. FIG 4: EVSIM DUAL SIMULATOR
    im4 = Image.open(os.path.join(CAPTURES_DIR, "06_role2_evsim_dual_simulator.png")).convert("RGBA")
    ov4 = Image.new("RGBA", im4.size, (0, 0, 0, 0))
    d4 = ImageDraw.Draw(ov4, "RGBA")

    draw_callout_box(d4, [185, 165, 1735, 325], color=c2, width=4)
    draw_badge(d4, (185, 165), "1", bg_color=c2)
    draw_click_cursor_and_ripple(d4, 1655, 294, color=c1)

    draw_callout_box(d4, [195, 340, 955, 765], color=c4, width=4)
    draw_badge(d4, (195, 340), "2", bg_color=c4)
    draw_pill_label(d4, (205, 775), "[2] BÊN TRÁI (BASELINE): 12 XE · 32.8% RỖNG · 28 LỖI CẤM TẢI", border_color=c4)

    draw_callout_box(d4, [965, 340, 1725, 765], color=c2, width=4)
    draw_badge(d4, (1725, 340), "3", bg_color=c2)
    draw_pill_label(d4, (970, 775), "[3] BÊN PHẢI (ECOMILES): 7 XE · 5.4% RỖNG · +19 ĐƠN VỀ · 0 LỖI", border_color=c2)

    draw_zoom_per_click_inset(
        im4,
        ov4,
        src_center=(1410, 560),
        src_size=(300, 145),
        dst_box=[1415, 815, 1895, 1020],
        title="ĐỐI CHỨNG TRỰC QUAN 2 BÊN",
        subtitle="Phóng to cầu Sài Gòn & Bình Thạnh: Xe 3, Xe 4 chạy đúng lộ trình OSRM",
        border_color=c2,
    )
    out4 = os.path.join(ASSETS_DIR, "fig5_evsim_dual_simulator.png")
    Image.alpha_composite(im4, ov4).convert("RGB").save(out4, quality=95)
    paths["fig5"] = out4

    # 5. FIG 5: DRIVER APP MIDDLE-MILE TRUCK MODE
    im5 = Image.open(os.path.join(CAPTURES_DIR, "08_role3_driver_middle_mile_truck.png")).convert("RGBA")
    ov5 = Image.new("RGBA", im5.size, (0, 0, 0, 0))
    d5 = ImageDraw.Draw(ov5, "RGBA")

    draw_callout_box(d5, [490, 304, 956, 452], color=c2, width=4)
    draw_badge(d5, (490, 304), "1", bg_color=c2)
    draw_pill_label(d5, (30, 340), "[1] CHẶNG GIỮA: XE TẢI >500KG ($0)", border_color=c2)
    draw_arrow(d5, (405, 360), (485, 360), color=c2)

    draw_callout_box(d5, [490, 495, 945, 735], color=c3, width=4)
    draw_badge(d5, (490, 495), "2", bg_color=c3)
    draw_click_cursor_and_ripple(d5, 723, 574, color=c3)

    draw_callout_box(d5, [975, 495, 1430, 960], color=c1, width=4)
    draw_badge(d5, (1430, 495), "3", bg_color=c1)

    draw_zoom_per_click_inset(
        im5,
        ov5,
        src_center=(680, 580),
        src_size=(340, 140),
        dst_box=[20, 520, 465, 730],
        title="BUỒNG LÁI XE TẢI MỞ & XUẤT GPX",
        subtitle="Cầu tối đa 13T, Cao 3.8m, Giọng nói TV & Mở Bản đồ /maps ($0)",
        border_color=c3,
    )
    out5 = os.path.join(ASSETS_DIR, "fig4_driver_mobile_pwa.png")
    Image.alpha_composite(im5, ov5).convert("RGB").save(out5, quality=95)
    paths["fig4"] = out5

    # 6. FIG 6: /MAPS VIEW 1 — OVERVIEW & BANNED TRUCK ZONES (11_maps_overview_banned_zones.png)
    im6 = Image.open(os.path.join(CAPTURES_DIR, "11_maps_overview_banned_zones.png")).convert("RGBA")
    ov6 = Image.new("RGBA", im6.size, (0, 0, 0, 0))
    d6 = ImageDraw.Draw(ov6, "RGBA")

    draw_callout_box(d6, [450, 48, 1060, 95], color=c1, width=4)
    draw_badge(d6, (440, 72), "1", bg_color=c1)

    draw_callout_box(d6, [180, 125, 1185, 315], color=c2, width=4)
    draw_badge(d6, (180, 125), "2", bg_color=c2)
    draw_click_cursor_and_ripple(d6, 330, 275, color=c2)

    draw_callout_box(d6, [180, 395, 1185, 895], color=c4, width=4)
    draw_badge(d6, (180, 395), "3", bg_color=c4)
    draw_pill_label(d6, (195, 905), "[3] VÙNG ĐỎ CẤM TẢI QĐ 23/2018 & CẦU BÌNH LỢI CHO PHÉP 13 TẤN", border_color=c4)

    draw_callout_box(d6, [1205, 455, 1735, 960], color=c3, width=4)
    draw_badge(d6, (1735, 455), "4", bg_color=c3)

    draw_zoom_per_click_inset(
        im6,
        ov6,
        src_center=(590, 710),
        src_size=(340, 155),
        dst_box=[720, 700, 1175, 925],
        title="BẢN ĐỒ VÙNG CẤM TẢI (/MAPS)",
        subtitle="Hiển thị rõ vùng cấm QĐ 23 (Đỏ) & Tuyến xe tải hợp pháp (Xanh)",
        border_color=c4,
    )
    out6 = os.path.join(ASSETS_DIR, "fig9_maps_overview_banned_zones.png")
    Image.alpha_composite(im6, ov6).convert("RGB").save(out6, quality=95)
    paths["fig9"] = out6

    # 7. FIG 7: /MAPS VIEW 2 — LIVE MOVING NAVIGATION MODE ("START") (12_maps_live_navigation.png)
    im7 = Image.open(os.path.join(CAPTURES_DIR, "12_maps_live_navigation.png")).convert("RGBA")
    ov7 = Image.new("RGBA", im7.size, (0, 0, 0, 0))
    d7 = ImageDraw.Draw(ov7, "RGBA")

    draw_callout_box(d7, [715, 48, 1060, 95], color=c2, width=4)
    draw_badge(d7, (1070, 72), "1", bg_color=c2)

    draw_callout_box(d7, [180, 125, 1185, 305], color=c2, width=4)
    draw_badge(d7, (180, 125), "2", bg_color=c2)

    draw_callout_box(d7, [180, 425, 1185, 910], color=c1, width=4)
    draw_badge(d7, (180, 425), "3", bg_color=c1)
    draw_click_cursor_and_ripple(d7, 680, 680, color=c1)

    draw_zoom_per_click_inset(
        im7,
        ov7,
        src_center=(685, 685),
        src_size=(320, 150),
        dst_box=[720, 710, 1175, 935],
        title="CHẾ ĐỘ DẪN ĐƯỜNG TRỰC TIẾP (START)",
        subtitle="Camera bám theo xe 51C-000.08 (36 km/h) + Chùm tia định hướng",
        border_color=c1,
    )
    out7 = os.path.join(ASSETS_DIR, "fig10_maps_live_navigation.png")
    Image.alpha_composite(im7, ov7).convert("RGB").save(out7, quality=95)
    paths["fig10"] = out7

    # 8. FIG 8: ADMIN ZERO-KNOWLEDGE MONITOR ROOM
    im8 = Image.open(os.path.join(CAPTURES_DIR, "10_role4_admin_zero_knowledge.png")).convert("RGBA")
    ov8 = Image.new("RGBA", im8.size, (0, 0, 0, 0))
    d8 = ImageDraw.Draw(ov8, "RGBA")

    draw_callout_box(d8, [185, 160, 1735, 310], color=c4, width=4)
    draw_badge(d8, (185, 160), "1", bg_color=c4)

    draw_callout_box(d8, [810, 460, 1735, 920], color=c1, width=4)
    draw_badge(d8, (810, 460), "2", bg_color=c1)
    draw_click_cursor_and_ripple(d8, 1280, 640, color=c1)

    draw_zoom_per_click_inset(
        im8,
        ov8,
        src_center=(1320, 640),
        src_size=(380, 140),
        dst_box=[195, 760, 770, 980],
        title="BẢN GHI MÃ HÓA MÙ AES-256-GCM",
        subtitle="Admin EcoMiles chỉ thấy chuỗi aes256gcm$iv=... (Không thể đọc SĐT/Địa chỉ)",
        border_color=c1,
    )
    out8 = os.path.join(ASSETS_DIR, "fig8_admin_zero_knowledge.png")
    Image.alpha_composite(im8, ov8).convert("RGB").save(out8, quality=95)
    paths["fig8"] = out8

    print("Successfully generated all 8 zero-tofu annotated zoom-per-click figures (including /maps)!")
    return paths


def build_html_guide(paths: dict[str, str], contest_title: str, out_html_name: str) -> str:
    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Tài Liệu Hướng Dẫn Sử Dụng Toàn Diện — EcoMiles B2B TMS &amp; OpenTruck Maps ({contest_title})</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 13mm 13mm 15mm 13mm;
      @bottom-right {{
        content: "Trang " counter(page) " / " counter(pages);
        font-family: 'Noto Sans', sans-serif;
        font-size: 8.5pt;
        color: #64748b;
      }}
      @bottom-left {{
        content: "EcoMiles B2B Logistics TMS, EVSIM & OpenTruck Maps (/maps) · ({contest_title})";
        font-family: 'Noto Sans', sans-serif;
        font-size: 8.5pt;
        color: #64748b;
      }}
    }}
    body {{
      font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #111827;
      line-height: 1.46;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }}
    .page-break {{ page-break-before: always; }}
    .cover-banner {{
      background: linear-gradient(135deg, #14532d 0%, #0f3f22 65%, #1e3a8a 100%);
      color: #ffffff;
      padding: 22px 24px;
      border-radius: 14px;
      margin-bottom: 14px;
    }}
    .cover-tag {{
      display: inline-block;
      background: #d6f65a;
      color: #14532d;
      font-weight: 800;
      font-size: 8.5pt;
      padding: 3px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    h1 {{
      font-size: 14.5pt;
      color: #14532d;
      border-bottom: 2.5px solid #247b50;
      padding-bottom: 4px;
      margin: 10px 0 8px 0;
    }}
    h2 {{
      font-size: 11pt;
      color: #1f3a5f;
      margin: 8px 0 5px 0;
    }}
    .fig-card {{
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      background: #f8fafc;
      padding: 7px;
      margin: 6px 0 10px 0;
      text-align: center;
    }}
    .fig-img {{
      width: 100%;
      max-height: 315px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }}
    .fig-caption {{
      font-size: 8.3pt;
      color: #475569;
      margin-top: 4px;
      font-weight: 600;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 10px 0;
      font-size: 8.8pt;
    }}
    th {{
      background: #14532d;
      color: #ffffff;
      text-align: left;
      padding: 5px 7px;
      font-weight: 700;
    }}
    td {{
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      vertical-align: top;
    }}
    tr:nth-child(even) td {{ background: #f8fafc; }}
    .badge-num {{
      display: inline-block;
      width: 17px;
      height: 17px;
      line-height: 17px;
      text-align: center;
      border-radius: 50%;
      color: #fff;
      font-weight: 800;
      font-size: 8pt;
      margin-right: 4px;
    }}
    .b-blue {{ background: #1971c2; }}
    .b-green {{ background: #2f9e44; }}
    .b-amber {{ background: #e67700; }}
    .b-red {{ background: #e11d48; }}
    .zoom-note {{
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 7px 11px;
      border-radius: 6px;
      font-size: 8.8pt;
      margin: 6px 0;
    }}
    .tech-note {{
      background: #eef7ee;
      border-left: 4px solid #2f9e44;
      padding: 7px 11px;
      border-radius: 6px;
      font-size: 8.8pt;
      margin: 6px 0;
    }}
  </style>
</head>
<body>

  <!-- PAGE 1: COVER & 4-ROLE FAST-LOGIN GATE -->
  <div class="cover-banner">
    <span class="cover-tag">HƯỚNG DẪN SỬ DỤNG TRỰC QUAN · KÈM CHỈ BÁO &amp; PHÓNG TO ĐIỂM BẤM (1.9× ZOOM)</span>
    <h1 style="color:#ffffff; border:none; font-size:19pt; margin:7px 0 4px 0;">HỆ THỐNG QUẢN TRỊ VẬN TẢI ĐÔ THỊ B2B ECOMILES</h1>
    <div style="font-size:10pt; color:#d6f65a; font-weight:700;">
      4 Vai Trò B2B · Mô Phỏng Đối Chứng EVSIM 2 Bên · Bản Đồ Dẫn Đường Xe Tải &amp; Vùng Cấm Tải (/maps) · Báo Cáo CO₂e ISO 14083
    </div>
    <div style="font-size:8.5pt; color:#e2e8f0; margin-top:5px;">
      Dashboard: <b>https://ecomiles.pages.dev/dashboard</b> &nbsp;|&nbsp; EVSIM: <b>https://ecomiles.pages.dev/benchmark</b> &nbsp;|&nbsp; Bản đồ Xe tải: <b>https://ecomiles.pages.dev/maps</b>
    </div>
  </div>

  <h1>1. CỔNG ĐĂNG NHẬP NHANH 4 VAI TRÒ (FAST-LOGIN MVP GATE)</h1>
  <div class="fig-card">
    <img src="{paths['fig1']}" class="fig-img" alt="Cổng đăng nhập nhanh 4 vai trò EcoMiles" />
    <div class="fig-caption">Hình 1: Cổng Đăng Nhập Nhanh 4 Vai Trò kèm hộp kính lúp phóng to (1.9× Zoom) tại nút bấm thực thi API.</div>
  </div>

  <table>
    <tr>
      <th style="width:18%;">Chỉ báo</th>
      <th style="width:28%;">Vai trò &amp; Nút thao tác</th>
      <th style="width:54%;">Hiệu ứng khi Click &amp; Xác thực API thực tế</th>
    </tr>
    <tr>
      <td><span class="badge-num b-blue">1</span> <b>Vai trò 1 (User)</b></td>
      <td><b>Điều Phối Viên Công Ty (CRM / TMS)</b></td>
      <td>Chọn doanh nghiệp B2B (Chuỗi Lạnh Nam Việt, Bách Hóa Xanh, WinCommerce), gọi <code>GET /api/vehicles</code> và mở Bàn điều phối 6 phân hệ.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-green">2</span> <b>Vai trò 2 (Tester)</b></td>
      <td><b>Mô Phỏng Đối Chứng EVSIM 2 Bên</b></td>
      <td>Gọi <code>GET /api/report</code> và mở Buồng mô phỏng song song 2 bản đồ TP.HCM (Baseline vs. EcoMiles v2.1) chạy theo thời gian thực 60 FPS.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-amber">3</span> <b>Vai trò 3 (Driver)</b></td>
      <td><b>Ứng Dụng Tài Xế Giao Hàng</b></td>
      <td>Điền sẵn biển số xe (<code>51C-000.08</code>) + mã <code>PIN: 0000</code>, mở giao diện Dẫn đường 2 chế độ: <b>Chặng Giữa (&gt;500kg)</b> và <b>Chặng Cuối (≤500kg)</b>.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-red">4</span> <b>Vai trò 4 (Admin)</b></td>
      <td><b>Phòng Giám Sát Hạ Tầng (Zero-Knowledge)</b></td>
      <td>Kiểm tra độ trễ máy chủ, cấp phát khóa KMS khách hàng và chứng minh cơ chế <b>Mã hóa mù AES-256-GCM</b> (<code>admin_can_decrypt = false</code>).</td>
    </tr>
  </table>

  <!-- PAGE 2: ROLE 1 OVERVIEW & ROUTING WORKBENCH -->
  <div class="page-break"></div>
  <h1>2. VAI TRÒ 1: QUẢN LÝ ĐIỀU PHỐI DOANH NGHIỆP (B2B CRM / TMS)</h1>
  <div class="fig-card">
    <img src="{paths['fig2']}" class="fig-img" alt="Tổng quan đội xe B2B CRM/TMS" />
    <div class="fig-caption">Hình 2: Giao diện Quản lý Điều phối B2B (Ban ngày) với thanh điều hướng trái 6 phân hệ và kính lúp phóng to nút Mở App Tài xế.</div>
  </div>

  <div class="fig-card">
    <img src="{paths['fig3']}" class="fig-img" alt="Bàn điều phối tuyến xe và nhật ký QĐ 23/2018" />
    <div class="fig-caption">Hình 3: Bản đồ đường bộ TP.HCM (OpenStreetMap + OSRM) với xe tải di chuyển bám sát mặt đường và Nhật ký dời giờ cấm QĐ 23/2018.</div>
  </div>

  <div class="zoom-note">
    <b>Phóng to Điểm bấm (Hình 2 &amp; Hình 3):</b> Nút <b>"Chạy Tối Ưu &amp; Phát Hành Xuống Tài Xế"</b> kích hoạt thuật toán Gillett-Miller Angular Sweep + Carbon-Aware ALNS để phân vùng địa lý không chồng chéo và tự động dời các đơn vi phạm khung giờ cấm tải QĐ 23/2018 (06:00–09:00 &amp; 16:00–20:00) sang khung giờ hợp pháp.
  </div>

  <!-- PAGE 3: ROLE 2 EVSIM DUAL SIMULATOR & DRIVER APP -->
  <div class="page-break"></div>
  <h1>3. VAI TRÒ 2: MÔ PHỎNG ĐỐI CHỨNG 2 BÊN (EVSIM DUAL SIMULATOR)</h1>
  <div class="fig-card">
    <img src="{paths['fig5']}" class="fig-img" alt="Mô phỏng đối chứng 2 bên EVSIM Dual Simulator" />
    <div class="fig-caption">Hình 4: Buồng mô phỏng đối chứng song song 2 bản đồ TP.HCM (Baseline vs. EcoMiles v2.1) với đồng hồ thời gian thực 06:00–20:00.</div>
  </div>

  <h1>4. VAI TRÒ 3: ỨNG DỤNG TÀI XẾ 2 CHẾ ĐỘ (CHẶNG GIỮA XE TẢI &amp; CHẶNG CUỐI Ô TÔ — $0 API)</h1>
  <div class="fig-card">
    <img src="{paths['fig4']}" class="fig-img" alt="Ứng dụng Tài xế Chặng giữa Xe tải (>500kg)" />
    <div class="fig-caption">Hình 5: Ứng dụng Tài xế (/driver) phân tách rõ Chặng Giữa (Xe tải &gt;500kg mở thẳng sang /maps) và Chặng Cuối (Ô tô ≤500kg khóa Waypoints Google Maps).</div>
  </div>

  <!-- PAGE 4: DEDICATED /MAPS OPENTRUCK NAVIGATOR (2 VIEWS: OVERVIEW + BANNED ZONES vs LIVE MOVING START) -->
  <div class="page-break"></div>
  <h1>5. BẢN ĐỒ DẪN ĐƯỜNG XE TẢI CHUYÊN DỤNG (/MAPS): 2 CHẾ ĐỘ XEM</h1>
  <p>
    Khi tài xế xe tải chặng giữa (&gt;500kg) bấm nút <b>"Mở Bản Đồ Vùng Cấm (/maps)"</b> hoặc <b>"▶ Bắt Đầu Lái (/maps Live)"</b> trên màn hình Tài xế, hệ thống mở phân hệ <b>EcoMiles OpenTruck Maps (https://ecomiles.pages.dev/maps)</b> gồm 2 chế độ:
  </p>

  <div class="fig-card">
    <img src="{paths['fig9']}" class="fig-img" alt="/maps Chế độ 1: Tổng quan lộ trình & Vùng cấm tải QĐ 23/2018" />
    <div class="fig-caption">Hình 6: Chế độ 1 (/maps?mode=overview) — Hiển thị toàn cảnh các Vùng Đỏ Cấm Tải QĐ 23/2018, giới hạn cầu (≤13T / ≤4.5m) và lý do chọn đường từng chặng.</div>
  </div>

  <div class="fig-card">
    <img src="{paths['fig10']}" class="fig-img" alt="/maps Chế độ 2: Dẫn đường trực tiếp (Live Moving Start Mode)" />
    <div class="fig-caption">Hình 7: Chế độ 2 (/maps?mode=navigate) — Sau khi bấm "▶ BẮT ĐẦU DẪN ĐƯỜNG (START LIVE)", camera bám sát theo xe tải 36 km/h kèm bảng chỉ hướng từng mét như Google Maps.</div>
  </div>

  <!-- PAGE 5: ADMIN ZERO-KNOWLEDGE MONITOR ROOM -->
  <div class="page-break"></div>
  <h1>6. VAI TRÒ 4: PHÒNG GIÁM SÁT HẠ TẦNG &amp; BẢO MẬT MÙ ZERO-KNOWLEDGE (AES-256-GCM)</h1>
  <div class="fig-card">
    <img src="{paths['fig8']}" class="fig-img" alt="Phòng giám sát Admin Zero-Knowledge" />
    <div class="fig-caption">Hình 8: Phòng Giám sát Hệ thống (Admin) chứng minh quyền giải mã dữ liệu doanh nghiệp = 0% (Chỉ thấy bản mã aes256gcm$iv=...).</div>
  </div>

  <div class="tech-note">
    <b>Cam kết Bảo mật Đa Doanh nghiệp (Zero-Knowledge &amp; Nghị định 13/2023/NĐ-CP):</b> Mỗi công ty vận tải sở hữu khóa KMS riêng. Quản trị viên EcoMiles hoàn toàn không thể xem danh sách khách hàng, số điện thoại hay tọa độ giao hàng của doanh nghiệp.
  </div>

</body>
</html>
"""
    out_path = os.path.join(OUTPUT_DIR, out_html_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Saved HTML guide: {out_path}")
    return out_path


def render_all_pdfs(paths: dict[str, str]):
    import weasyprint

    editions = [
        ("PANASONIC GREEN IMPACT 2026", "user_guide.html", [
            os.path.join(OUTPUT_DIR, "ECOMILES_HUONG_DAN_SU_DUNG.pdf"),
            os.path.join(BASE_DIR, "ECOMILES_HUONG_DAN_SU_DUNG.pdf"),
            os.path.join(OUTPUT_DIR, "ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf"),
            os.path.join(BASE_DIR, "ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf"),
            os.path.join(OUTPUT_DIR, "contests", "PANASONIC_2026", "ECOMILES_HUONG_DAN_SU_DUNG_PANASONIC.pdf"),
            os.path.join(PUBLIC_DIR, "ECOMILES_HUONG_DAN_SU_DUNG.pdf"),
        ]),
        ("HITC INNOSTAR 2026", "user_guide_hitc.html", [
            os.path.join(OUTPUT_DIR, "ECOMILES_HUONG_DAN_SU_DUNG_HITC_INNOSTAR.pdf"),
            os.path.join(BASE_DIR, "ECOMILES_HUONG_DAN_SU_DUNG_HITC_INNOSTAR.pdf"),
            os.path.join(OUTPUT_DIR, "contests", "HITC_INNOSTAR_2026", "ECOMILES_HUONG_DAN_SU_DUNG_HITC_INNOSTAR.pdf"),
        ]),
        ("OLYMPIC KHỞI NGHIỆP VSIC 2026", "user_guide_vsic.html", [
            os.path.join(OUTPUT_DIR, "ECOMILES_HUONG_DAN_SU_DUNG_VSIC.pdf"),
            os.path.join(BASE_DIR, "ECOMILES_HUONG_DAN_SU_DUNG_VSIC.pdf"),
            os.path.join(OUTPUT_DIR, "contests", "SO_2026", "ECOMILES_HUONG_DAN_SU_DUNG_VSIC.pdf"),
        ]),
    ]

    for title, html_name, pdf_targets in editions:
        html_path = build_html_guide(paths, title, html_name)
        primary_pdf = pdf_targets[0]
        os.makedirs(os.path.dirname(primary_pdf), exist_ok=True)
        weasyprint.HTML(filename=html_path).write_pdf(primary_pdf)
        print(f"Rendered PDF: {primary_pdf}")
        for dest in pdf_targets[1:]:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copyfile(primary_pdf, dest)
            print(f"  Copied -> {dest}")


def build_docx_user_guide(paths: dict[str, str]):
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor

    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Noto Sans"
    style.font.size = Pt(10.5)

    h = doc.add_heading("TÀI LIỆU HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN — ECOMILES B2B TMS, EVSIM & OPENTRUCK MAPS (/MAPS)", level=0)
    for run in h.runs:
        run.font.color.rgb = RGBColor(20, 83, 45)

    doc.add_paragraph(
        "Phiên bản v2.1 (10/2026) — Bao gồm chỉ báo đánh số ([1]–[4]), ghi chú nghiệp vụ và hộp kính lúp phóng to điểm bấm (1.9× Zoom-per-Click) cho cả 4 vai trò cùng Bản đồ Dẫn đường Xe tải Chuyên dụng (/maps) với 2 chế độ: Tổng quan Vùng cấm tải QĐ 23/2018 và Dẫn đường Trực tiếp (Live Moving Start Mode)."
    )

    sections = [
        ("1. Cổng Đăng Nhập Nhanh 4 Vai Trò (Fast-Login MVP Gate)", paths["fig1"], "Truy cập https://ecomiles.pages.dev/dashboard để chọn nhanh 1 trong 4 vai trò đã điền sẵn thông tin xác thực API."),
        ("2. Vai Trò 1: Quản Lý Điều Phối Doanh Nghiệp (B2B CRM / TMS)", paths["fig2"], "Theo dõi 5 chỉ số KPI đội xe, tỷ lệ chạy rỗng, đơn ghép chiều về và mở nhanh ứng dụng của từng xe."),
        ("3. Bàn Điều Phối Tuyến Xe & Nhật Ký Né Giờ Cấm QĐ 23/2018", paths["fig3"], "Bản đồ đường bộ TP.HCM (OpenStreetMap + OSRM) với xe tải di chuyển 60 FPS và nhật ký tự động dời giờ cấm."),
        ("4. Vai Trò 2: Mô Phỏng Đối Chứng 2 Bên Kiểu EVSIM (Baseline vs. EcoMiles)", paths["fig5"], "Chứng minh trực quan mức giảm 44.1% km, giảm chạy rỗng từ 32.8% xuống 5.4% và cứu 28/28 đơn giờ cấm."),
        ("5. Vai Trò 3: Ứng Dụng Tài Xế 2 Chế Độ (Chặng Giữa Xe Tải >500kg & Chặng Cuối Ô Tô ≤500kg)", paths["fig4"], "Chặng giữa (>500kg) kết nối thẳng sang Bản đồ Xe tải Mở (/maps) và xuất GPX OsmAnd; Chặng cuối (≤500kg) khóa tọa độ trung gian waypoints=via: vào Google Maps."),
        ("6. Bản Đồ Xe Tải (/maps) — Chế Độ 1: Tổng Quan Lộ Trình & Vùng Cấm Tải QĐ 23/2018", paths["fig9"], "Hiển thị trực quan 3 vùng đỏ cấm tải nội đô TP.HCM, các tuyến đường cấm giờ cao điểm, giới hạn tải trọng cầu (Cầu Bình Lợi 13T, Cầu Sài Gòn 30T) và lộ trình chi tiết từng chặng."),
        ("7. Bản Đồ Xe Tải (/maps) — Chế Độ 2: Dẫn Đường Trực Tiếp (Live Moving 'Bắt Đầu' Mode)", paths["fig10"], "Khi bấm 'Bắt đầu Dẫn đường (Start Live)', camera tự động phóng to cấp độ mặt đường và bám sát theo xe tải đang di chuyển 36 km/h kèm bảng chỉ hướng từng mét như Google Maps."),
        ("8. Vai Trò 4: Phòng Giám Sát Hạ Tầng & Bảo Mật Mù Zero-Knowledge (AES-256-GCM)", paths["fig8"], "Chứng minh quyền giải mã dữ liệu khách hàng = 0% (Admin chỉ thấy bản mã aes256gcm$iv=...)."),
    ]

    for heading_text, img_path, desc in sections:
        doc.add_heading(heading_text, level=1)
        doc.add_paragraph(desc)
        doc.add_picture(img_path, width=Inches(6.2))

    docx_root = os.path.join(BASE_DIR, "ECOMILES_HUONG_DAN_SU_DUNG.docx")
    docx_docs = os.path.join(OUTPUT_DIR, "ECOMILES_HUONG_DAN_SU_DUNG.docx")
    doc.save(docx_root)
    shutil.copyfile(docx_root, docx_docs)
    print(f"Saved DOCX guides: {docx_root} & {docx_docs}")


def main():
    paths = annotate_all_figures()
    render_all_pdfs(paths)
    build_docx_user_guide(paths)


if __name__ == "__main__":
    main()
