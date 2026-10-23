#!/usr/bin/env python3
"""
build_user_guide_pdf.py
Generates annotated application screenshots with arrows and bounding callouts,
then builds a professional PDF User Guide for EcoMiles via WeasyPrint.
"""

import os
import math
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = '/home/shayneeo/Downloads/Documents/Coding/RND_to_Startup'
ARTIFACTS_DIR = '/home/shayneeo/.gemini/antigravity/brain/47ac4c3b-046a-4ef5-b652-affbcd28853b'
OUTPUT_DIR = os.path.join(BASE_DIR, 'docs')
ASSETS_DIR = os.path.join(OUTPUT_DIR, 'assets', 'annotated')
os.makedirs(ASSETS_DIR, exist_ok=True)

# Fonts
FONT_BOLD_PATH = '/usr/share/fonts/noto/NotoSans-Bold.ttf'
FONT_REG_PATH = '/usr/share/fonts/noto/NotoSans-Regular.ttf'

def get_font(size, bold=True):
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    return ImageFont.truetype(path, size)

def draw_arrow(draw, start, end, color=(239, 68, 68), width=5, arrow_size=20):
    """Draw a directional arrow with arrowhead pointing at `end`."""
    draw.line([start, end], fill=(*color[:3], 255), width=width)
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    angle = math.atan2(dy, dx)
    p1 = (
        end[0] - arrow_size * math.cos(angle - math.pi / 6),
        end[1] - arrow_size * math.sin(angle - math.pi / 6)
    )
    p2 = (
        end[0] - arrow_size * math.cos(angle + math.pi / 6),
        end[1] - arrow_size * math.sin(angle + math.pi / 6)
    )
    draw.polygon([end, p1, p2], fill=(*color[:3], 255))

def draw_callout_box(draw, box, color=(239, 68, 68), width=4, corner_radius=12, fill_alpha=0.15):
    """Draw a glowing rounded bounding box with translucent fill."""
    x1, y1, x2, y2 = box
    r, g, b = color[:3]
    draw.rounded_rectangle([x1, y1, x2, y2], radius=corner_radius, fill=(r, g, b, int(255 * fill_alpha)))
    draw.rounded_rectangle([x1, y1, x2, y2], radius=corner_radius, outline=(r, g, b, 255), width=width)

def draw_badge(draw, center, num_str, bg_color=(239, 68, 68), text_color=(255, 255, 255), radius=22, font_size=22):
    """Draw a circular numbered badge with white border and shadow."""
    cx, cy = center
    font = get_font(font_size, bold=True)
    draw.ellipse([cx - radius + 2, cy - radius + 3, cx + radius + 2, cy + radius + 3], fill=(0, 0, 0, 160))
    draw.ellipse([cx - radius - 2, cy - radius - 2, cx + radius + 2, cy + radius + 2], fill=(255, 255, 255, 255))
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=(*bg_color[:3], 255))
    bbox = font.getbbox(num_str)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw / 2 - bbox[0]
    ty = cy - th / 2 - bbox[1]
    draw.text((tx, ty), num_str, fill=text_color, font=font)

def draw_pill_label(draw, box, text, bg_color=(15, 23, 42), text_color=(255, 255, 255), border_color=(239, 68, 68), font_size=16):
    """Draw a compact pill card label."""
    font = get_font(font_size, bold=True)
    draw.rounded_rectangle(box, radius=8, fill=(*bg_color[:3], 240), outline=(*border_color[:3], 255), width=2)
    bbox = font.getbbox(text)
    ty = box[1] + (box[3] - box[1] - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((box[0] + 12, ty), text, fill=text_color, font=font)

# ==============================================================================
# 1. ANNOTATE FIGURE 1: ROLE PORTAL MODAL (2236x1252)
# ==============================================================================
def annotate_fig1_role_portal():
    src_path = os.path.join(ARTIFACTS_DIR, 'role-portal-modal.png')
    im = Image.open(src_path).convert('RGBA')

    # Rebrand modal title: Replace "GreenLogix" with "EcoMiles"
    base_draw = ImageDraw.Draw(im)
    bg_modal = (15, 23, 42, 255)
    base_draw.rectangle([1005, 270, 1205, 312], fill=bg_modal)
    title_font = ImageFont.truetype(FONT_BOLD_PATH, 31)
    base_draw.text((1008, 272), 'EcoMiles', fill=(255, 212, 0, 255), font=title_font)

    overlay = Image.new('RGBA', im.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay, 'RGBA')

    # Card 1: Dispatcher Web (x ~ 680..1060, y ~ 460..920)
    c1 = (225, 29, 72) # Rose Red
    draw_callout_box(draw, [685, 460, 1065, 920], color=c1, width=5, corner_radius=14, fill_alpha=0.15)
    draw_badge(draw, (875, 410), '1', bg_color=c1, radius=24, font_size=24)
    draw_arrow(draw, (875, 436), (875, 458), color=c1, width=5, arrow_size=18)
    draw_pill_label(draw, [700, 345, 1050, 385], '1. CỔNG ĐIỀU PHỐI VIÊN (WEB)', bg_color=(15, 23, 42), border_color=c1, font_size=15)

    # Card 2: Driver Mobile PWA (x ~ 1150..1530, y ~ 460..920)
    c2 = (14, 165, 233) # Sky Blue
    draw_callout_box(draw, [1150, 460, 1530, 920], color=c2, width=5, corner_radius=14, fill_alpha=0.15)
    draw_badge(draw, (1340, 410), '2', bg_color=c2, radius=24, font_size=24)
    draw_arrow(draw, (1340, 436), (1340, 458), color=c2, width=5, arrow_size=18)
    draw_pill_label(draw, [1180, 345, 1500, 385], '2. APP TÀI XẾ (DRIVER PWA)', bg_color=(15, 23, 42), border_color=c2, font_size=15)

    # Card 3: Cloudflare Edge badge (x ~ 665..1165, y ~ 208..252)
    c3 = (16, 185, 129) # Emerald Green
    draw_callout_box(draw, [665, 208, 1165, 252], color=c3, width=3, corner_radius=22, fill_alpha=0.15)
    draw_badge(draw, (915, 155), '3', bg_color=c3, radius=22, font_size=22)
    draw_arrow(draw, (915, 178), (915, 204), color=c3, width=4, arrow_size=16)
    draw_pill_label(draw, [710, 105, 1120, 145], '3. TRẢI NGHIỆM TRỰC TIẾP (CLOUDFLARE EDGE)', bg_color=(15, 23, 42), border_color=c3, font_size=13)

    # Card 4: Close / Exit button (x ~ 1540..1588, y ~ 195..238)
    c4 = (245, 158, 11) # Amber
    draw_callout_box(draw, [1540, 195, 1588, 238], color=c4, width=3, corner_radius=8, fill_alpha=0.25)
    draw_badge(draw, (1630, 215), '4', bg_color=c4, radius=20, font_size=20)
    draw_arrow(draw, (1605, 215), (1590, 215), color=c4, width=4, arrow_size=16)
    draw_pill_label(draw, [1660, 195, 1820, 235], '4. ĐÓNG / TRỞ VỀ', bg_color=(15, 23, 42), border_color=c4, font_size=14)

    out = Image.alpha_composite(im, overlay).convert('RGB')
    out_path = os.path.join(ASSETS_DIR, 'fig1_role_portal.png')
    out.save(out_path, quality=95)
    print(f'Saved: {out_path}')

# ==============================================================================
# 2. ANNOTATE FIGURE 2: DISPATCHER DASHBOARD (1920x1200)
# ==============================================================================
def annotate_fig2_dispatcher_dashboard():
    src_path = os.path.join(ARTIFACTS_DIR, 'dispatcher-portal-policy-cards.png')
    im = Image.open(src_path).convert('RGBA')
    overlay = Image.new('RGBA', im.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay, 'RGBA')

    # 1. Top button: "Seed 80/10" (x ~ 845..978, y ~ 18..50)
    c1 = (225, 29, 72) # Red
    draw_callout_box(draw, [845, 18, 978, 50], color=c1, width=4, corner_radius=8, fill_alpha=0.2)
    draw_badge(draw, (911, 88), '1', bg_color=c1, radius=22, font_size=22)
    draw_arrow(draw, (911, 64), (911, 52), color=c1, width=5, arrow_size=16)
    draw_pill_label(draw, [740, 115, 1080, 155], '1. NẠP DỮ LIỆU CHUẨN 80 ĐƠN & 10 XE', bg_color=(15, 23, 42), border_color=c1, font_size=14)

    # 2. Top button: "Tối ưu tuyến" (x ~ 990..1145, y ~ 18..50)
    c2 = (14, 165, 233) # Sky Blue
    draw_callout_box(draw, [990, 18, 1145, 50], color=c2, width=4, corner_radius=8, fill_alpha=0.2)
    draw_badge(draw, (1067, 88), '2', bg_color=c2, radius=22, font_size=22)
    draw_arrow(draw, (1067, 64), (1067, 52), color=c2, width=5, arrow_size=16)
    draw_pill_label(draw, [1110, 115, 1430, 155], '2. CHẠY THUẬT TOÁN VRP ĐA XE', bg_color=(15, 23, 42), border_color=c2, font_size=14)

    # 3. Policy cards (x ~ 85..320, y ~ 255..330)
    c3 = (16, 185, 129) # Emerald Green
    draw_callout_box(draw, [85, 255, 320, 330], color=c3, width=4, corner_radius=8, fill_alpha=0.18)
    draw_badge(draw, (370, 290), '3', bg_color=c3, radius=22, font_size=22)
    draw_arrow(draw, (346, 290), (324, 290), color=c3, width=5, arrow_size=18)
    draw_pill_label(draw, [405, 270, 750, 310], '3. CHÍNH SÁCH: NHANH / CÂN BẰNG / XANH', bg_color=(15, 23, 42), border_color=c3, font_size=14)

    # 4. KPIs & Benchmark Table (x ~ 85..320, y ~ 335..460)
    c4 = (245, 158, 11) # Amber
    draw_callout_box(draw, [85, 335, 320, 460], color=c4, width=4, corner_radius=8, fill_alpha=0.18)
    draw_badge(draw, (370, 400), '4', bg_color=c4, radius=22, font_size=22)
    draw_arrow(draw, (346, 400), (324, 400), color=c4, width=5, arrow_size=18)
    draw_pill_label(draw, [405, 380, 800, 420], '4. ĐO LƯỜNG TIẾT KIỆM KM & CO2E (GLEC)', bg_color=(15, 23, 42), border_color=c4, font_size=14)

    # 5. Vehicle filter chips (x ~ 390..1550, y ~ 90..138)
    c5 = (168, 85, 247) # Purple
    draw_callout_box(draw, [390, 90, 1550, 138], color=c5, width=4, corner_radius=8, fill_alpha=0.15)
    draw_badge(draw, (970, 175), '5', bg_color=c5, radius=22, font_size=22)
    draw_arrow(draw, (970, 150), (970, 140), color=c5, width=5, arrow_size=16)
    draw_pill_label(draw, [1005, 155, 1370, 195], '5. BỘ LỌC THEO BIỂN SỐ TỪNG XE', bg_color=(15, 23, 42), border_color=c5, font_size=14)

    # 6. Map area with Red Restriction Zones & Route lines (x ~ 600..1500, y ~ 280..920)
    c6 = (236, 72, 153) # Pink
    draw_callout_box(draw, [600, 280, 1500, 920], color=c6, width=4, corner_radius=14, fill_alpha=0.08)
    draw_badge(draw, (1050, 320), '6', bg_color=c6, radius=24, font_size=24)
    draw_pill_label(draw, [1085, 300, 1610, 340], '6. BẢN ĐỒ VÙNG CẤM TẢI QĐ 23 & LỘ TRÌNH VRP', bg_color=(15, 23, 42), border_color=c6, font_size=15)

    out = Image.alpha_composite(im, overlay).convert('RGB')
    out_path = os.path.join(ASSETS_DIR, 'fig2_dispatcher_dashboard.png')
    out.save(out_path, quality=95)
    print(f'Saved: {out_path}')

# ==============================================================================
# 3. ANNOTATE FIGURE 3: DISPATCHER ORDERS & BANS (2236x1252)
# ==============================================================================
def annotate_fig3_dispatcher_stops_bans():
    src_path = os.path.join(ARTIFACTS_DIR, 'greenlogix-stops-ban-tags.png')
    im = Image.open(src_path).convert('RGBA')

    # Rebrand top-left logo and table row from GreenLogix to EcoMiles
    base_draw = ImageDraw.Draw(im)
    # 1. Top-left logo: Replace GREENLOGIX with ECOMILES
    bg3_logo = (10, 20, 16, 255)
    base_draw.rectangle([25, 20, 210, 56], fill=bg3_logo)
    font3_logo = ImageFont.truetype(FONT_BOLD_PATH, 24)
    base_draw.text((26, 23), 'ECO', fill=(255, 255, 255, 255), font=font3_logo)
    bbox_eco = font3_logo.getbbox('ECO')
    w_eco = bbox_eco[2] - bbox_eco[0]
    base_draw.text((26 + w_eco + 2, 23), 'MILES', fill=(255, 212, 0, 255), font=font3_logo)

    # 2. Benchmark table row: Replace GreenLogix with EcoMiles
    bg3_row = (8, 15, 12, 255)
    base_draw.rectangle([32, 364, 130, 386], fill=bg3_row)
    font3_row = ImageFont.truetype(FONT_BOLD_PATH, 15)
    base_draw.text((34, 366), 'EcoMiles', fill=(167, 184, 176, 255), font=font3_row)

    overlay = Image.new('RGBA', im.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay, 'RGBA')

    # 1. Tab "Danh sách đơn (80)"
    c1 = (225, 29, 72)
    draw_callout_box(draw, [80, 470, 320, 525], color=c1, width=4, corner_radius=8, fill_alpha=0.2)
    draw_badge(draw, (370, 500), '1', bg_color=c1, radius=24, font_size=24)
    draw_arrow(draw, (344, 500), (324, 500), color=c1, width=5, arrow_size=18)
    draw_pill_label(draw, [405, 480, 780, 520], '1. TAB DANH SÁCH 80 ĐƠN HÀNG', bg_color=(15, 23, 42), border_color=c1, font_size=15)

    # 2. Ban warning tag in order cards
    c2 = (245, 158, 11) # Amber
    draw_callout_box(draw, [80, 350, 320, 430], color=c2, width=4, corner_radius=8, fill_alpha=0.2)
    draw_badge(draw, (370, 390), '2', bg_color=c2, radius=24, font_size=24)
    draw_arrow(draw, (344, 390), (324, 390), color=c2, width=5, arrow_size=18)
    draw_pill_label(draw, [405, 370, 875, 410], '2. THẺ CẢNH BÁO GIỜ CẤM TẢI (6H-9H, 16H-20H)', bg_color=(15, 23, 42), border_color=c2, font_size=15)

    # 3. Vehicle load distribution and route manifests
    c3 = (14, 165, 233) # Sky Blue
    draw_callout_box(draw, [80, 540, 320, 750], color=c3, width=4, corner_radius=8, fill_alpha=0.18)
    draw_badge(draw, (370, 640), '3', bg_color=c3, radius=24, font_size=24)
    draw_arrow(draw, (344, 640), (324, 640), color=c3, width=5, arrow_size=18)
    draw_pill_label(draw, [405, 620, 890, 660], '3. PHÂN BỔ TẢI TRỌNG XE (1.99T, 2.5T) VÀO TUYẾN', bg_color=(15, 23, 42), border_color=c3, font_size=15)

    # 4. Top action button "Xem app tài xế" & "CSV Báo cáo"
    c4 = (16, 185, 129) # Emerald
    draw_callout_box(draw, [1320, 18, 1720, 50], color=c4, width=4, corner_radius=8, fill_alpha=0.2)
    draw_badge(draw, (1270, 34), '4', bg_color=c4, radius=24, font_size=24)
    draw_arrow(draw, (1296, 34), (1318, 34), color=c4, width=5, arrow_size=18)
    draw_pill_label(draw, [880, 14, 1240, 54], '4. XEM APP TÀI XẾ & XUẤT CSV ESG', bg_color=(15, 23, 42), border_color=c4, font_size=15)

    out = Image.alpha_composite(im, overlay).convert('RGB')
    out_path = os.path.join(ASSETS_DIR, 'fig3_dispatcher_stops_bans.png')
    out.save(out_path, quality=95)
    print(f'Saved: {out_path}')

# ==============================================================================
# 4. ANNOTATE FIGURE 4: DRIVER MOBILE PWA
# ==============================================================================
def annotate_fig4_driver_mobile_pwa():
    src_path = os.path.join(ARTIFACTS_DIR, 'driver-pwa-stop-card.png')
    im4 = Image.open(src_path).convert('RGBA')
    phone = im4.crop((0, 0, 630, 1140))
    pw, ph = phone.size

    canvas_w = pw + 450
    canvas_h = ph
    canvas = Image.new('RGBA', (canvas_w, canvas_h), (9, 18, 14, 255))
    canvas.paste(phone, (0, 0))

    overlay = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, 'RGBA')

    # 1. Dropdown chọn xe
    c1 = (225, 29, 72)
    draw_callout_box(draw, [255, 15, 625, 65], color=c1, width=3)
    draw_badge(draw, (670, 40), '1', bg_color=c1, radius=22, font_size=20)
    draw_arrow(draw, (645, 40), (630, 40), color=c1, width=4)
    draw_pill_label(draw, [705, 20, 1030, 60], '1. CHỌN BIỂN SỐ XE TẢI', border_color=c1)

    # 2. Stats banner
    c2 = (245, 158, 11)
    draw_callout_box(draw, [20, 125, 600, 235], color=c2, width=3)
    draw_badge(draw, (670, 180), '2', bg_color=c2, radius=22, font_size=20)
    draw_arrow(draw, (645, 180), (605, 180), color=c2, width=4)
    draw_pill_label(draw, [705, 160, 1030, 200], '2. TIẾN ĐỘ CA GIAO HÀNG', border_color=c2)

    # 3. Address & details (y ~ 670..885)
    c3 = (14, 165, 233)
    draw_callout_box(draw, [25, 670, 605, 885], color=c3, width=3)
    draw_badge(draw, (670, 775), '3', bg_color=c3, radius=22, font_size=20)
    draw_arrow(draw, (645, 775), (610, 775), color=c3, width=4)
    draw_pill_label(draw, [705, 755, 1050, 795], '3. THẺ ĐIỂM GIAO & SĐT KHÁCH', border_color=c3)

    # 4. Ban alert (y ~ 900..960)
    c4 = (239, 68, 68)
    draw_callout_box(draw, [45, 900, 605, 960], color=c4, width=3)
    draw_badge(draw, (670, 930), '4', bg_color=c4, radius=22, font_size=20)
    draw_arrow(draw, (645, 930), (610, 930), color=c4, width=4)
    draw_pill_label(draw, [705, 910, 1060, 950], '4. CẢNH BÁO GIỜ CẤM TẢI QĐ 23', border_color=c4)

    # 5. Google Maps button (y ~ 975..1040)
    c5 = (16, 185, 129)
    draw_callout_box(draw, [45, 975, 605, 1040], color=c5, width=4)
    draw_badge(draw, (670, 1007), '5', bg_color=c5, radius=24, font_size=22)
    draw_arrow(draw, (645, 1007), (610, 1007), color=c5, width=5)
    draw_pill_label(draw, [705, 987, 1065, 1027], '5. GOOGLE MAPS Ô TÔ (DRIVING)', border_color=c5)

    # 6. Action buttons (y ~ 1050..1120)
    c6 = (168, 85, 247)
    draw_callout_box(draw, [45, 1050, 605, 1120], color=c6, width=3)
    draw_badge(draw, (670, 1085), '6', bg_color=c6, radius=22, font_size=20)
    draw_arrow(draw, (645, 1085), (610, 1085), color=c6, width=4)
    draw_pill_label(draw, [705, 1065, 1050, 1105], '6. CẬP NHẬT TRẠNG THÁI GIAO', border_color=c6)

    final_img = Image.alpha_composite(canvas, overlay)
    out_path = os.path.join(ASSETS_DIR, 'fig4_driver_mobile_pwa.png')
    final_img.convert('RGB').save(out_path, quality=95)
    print(f'Saved: {out_path}')

# ==============================================================================
# 5. GENERATE HTML USER GUIDE WITH CSS PRINT STYLES
# ==============================================================================
def generate_user_guide_html():
    fig1_path = os.path.join(ASSETS_DIR, 'fig1_role_portal.png')
    fig2_path = os.path.join(ASSETS_DIR, 'fig2_dispatcher_dashboard.png')
    fig3_path = os.path.join(ASSETS_DIR, 'fig3_dispatcher_stops_bans.png')
    fig4_path = os.path.join(ASSETS_DIR, 'fig4_driver_mobile_pwa.png')

    html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Sổ Tay Hướng Dẫn Sử Dụng Hệ Thống EcoMiles</title>
  <style>
    @page {{
      size: A4 portrait;
      margin: 16mm 14mm 18mm 14mm;
      @bottom-left {{
        content: "EcoMiles";
        font-family: "Noto Sans", sans-serif;
        font-size: 8pt;
        color: #64748b;
      }}
      @bottom-right {{
        content: "Trang " counter(page) " / " counter(pages);
        font-family: "Noto Sans", sans-serif;
        font-size: 8pt;
        font-weight: bold;
        color: #0f172a;
      }}
      @top-right {{
        content: "Tài liệu Hướng dẫn Vận hành v1.0";
        font-family: "Noto Sans", sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }}
    }}

    body {{
      font-family: "Noto Sans", "Segoe UI", Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }}

    .page-break {{
      page-break-before: always;
    }}

    /* Cover Page */
    .cover-container {{
      height: 940px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #059669;
      border-radius: 12px;
      padding: 40px 35px;
      box-sizing: border-box;
      background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 40%, #f8fafc 100%);
    }}
    .cover-badge {{
      display: inline-block;
      background: #059669;
      color: #ffffff;
      font-weight: 800;
      font-size: 9.5pt;
      letter-spacing: 0.08em;
      padding: 5px 14px;
      border-radius: 999px;
      text-transform: uppercase;
    }}
    .cover-title {{
      font-size: 26pt;
      font-weight: 900;
      color: #064e3b;
      line-height: 1.25;
      margin: 20px 0 10px;
    }}
    .cover-subtitle {{
      font-size: 13pt;
      font-weight: 700;
      color: #047857;
      line-height: 1.45;
      margin-bottom: 25px;
    }}
    .cover-desc {{
      font-size: 10pt;
      color: #334155;
      line-height: 1.6;
      background: #ffffff;
      border-left: 4px solid #059669;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }}
    .cover-meta {{
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      border-top: 1px solid #cbd5e1;
      padding-top: 20px;
    }}
    .meta-box {{
      font-size: 9pt;
    }}
    .meta-label {{
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      font-size: 8pt;
      letter-spacing: 0.05em;
    }}
    .meta-val {{
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }}

    /* Headers */
    h1 {{
      font-size: 15pt;
      font-weight: 800;
      color: #064e3b;
      border-bottom: 2px solid #10b981;
      padding-bottom: 5px;
      margin-top: 0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    h2 {{
      font-size: 11.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 14px;
      margin-bottom: 6px;
    }}
    h3 {{
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 10px;
      margin-bottom: 4px;
    }}

    /* Callout & notes */
    .note-box {{
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      border-radius: 0 6px 6px 0;
      padding: 8px 12px;
      margin: 10px 0;
      font-size: 9pt;
      color: #065f46;
    }}
    .warn-box {{
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 0 6px 6px 0;
      padding: 8px 12px;
      margin: 10px 0;
      font-size: 9pt;
      color: #991b1b;
    }}
    .tip-box {{
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 0 6px 6px 0;
      padding: 8px 12px;
      margin: 10px 0;
      font-size: 9pt;
      color: #1e40af;
    }}

    /* Images */
    .fig-container {{
      text-align: center;
      margin: 10px 0 8px;
      background: #09120e;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px;
      box-shadow: 0 3px 8px rgba(0,0,0,0.08);
    }}
    .fig-img {{
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      display: block;
      margin: 0 auto;
    }}
    .fig-caption {{
      font-size: 8.5pt;
      font-style: italic;
      color: #64748b;
      margin-top: 5px;
      text-align: center;
    }}

    /* Tables */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 12px;
      font-size: 8.5pt;
      background: #ffffff;
    }}
    th, td {{
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
      vertical-align: top;
    }}
    th {{
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }}
    tr:nth-child(even) td {{
      background: #f8fafc;
    }}

    /* Badges in text */
    .badge-num {{
      display: inline-block;
      width: 18px;
      height: 18px;
      line-height: 18px;
      border-radius: 50%;
      text-align: center;
      font-weight: 800;
      font-size: 8.5pt;
      color: #ffffff;
      margin-right: 4px;
    }}
    .b-red {{ background: #e11d48; }}
    .b-blue {{ background: #0284c7; }}
    .b-green {{ background: #059669; }}
    .b-amber {{ background: #d97706; }}
    .b-purple {{ background: #7c3aed; }}
    .b-pink {{ background: #db2777; }}

    /* Key step box */
    .step-card {{
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: #ffffff;
    }}
    .step-header {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 9.5pt;
      color: #0f172a;
      margin-bottom: 3px;
    }}
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER PAGE ==================== -->
  <div class="cover-container">
    <div>
      <span class="cover-badge">Tài Liệu Hướng Dẫn Kỹ Thuật & Vận Hành</span>
      <div class="cover-title">ECOMILES</div>
      <div class="cover-subtitle">SỔ TAY HƯỚNG DẪN SỬ DỤNG TRỌN BỘ CỔNG ĐIỀU HÀNH & ỨNG DỤNG TÀI XẾ</div>
      <div class="cover-desc">
        Tài liệu cung cấp hướng dẫn thao tác chi tiết từng bước, kèm hình ảnh minh họa có <b>mũi tên chỉ dẫn và khoanh vùng chú thích (visual callouts)</b> cho toàn bộ hệ thống EcoMiles:
        <ul style="margin: 6px 0 0; padding-left: 20px;">
          <li><b>Cổng Phân Quyền (Role Selection Portal):</b> Điều hướng người dùng theo vai trò.</li>
          <li><b>Cổng Điều Phối Tuyến (Dispatcher Web Portal):</b> Tối ưu hóa lộ trình xe tải đa điểm (VRP), tích hợp khung giờ cấm tải TP.HCM (QĐ 23/2018), kiểm kê phát thải CO2e chuẩn quốc tế GLEC Framework 3.2 & ISO 14083.</li>
          <li><b>Ứng Dụng Tài Xế (Driver Mobile PWA):</b> Nhận lệnh giao, xem cảnh báo an toàn giờ cấm, kích hoạt dẫn đường Google Maps chuẩn Ô tô (travelmode=driving) và cập nhật tiến độ.</li>
        </ul>
      </div>
    </div>

    <div class="cover-meta">
      <div class="meta-box">
        <div class="meta-label">DỰ ÁN KHỞI NGHIỆP</div>
        <div class="meta-val">EcoMiles — Logistics Xanh Nội Đô</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">CUỘC THI / ĐỀ ÁN</div>
        <div class="meta-val">CUỘC THI KHỞI NGHIỆP ĐỔI MỚI SÁNG TẠO HITC INNOSTAR 2026</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">PHIÊN BẢN HỆ THỐNG</div>
        <div class="meta-val">v1.0 (Edge Production Cloudflare 24/7)</div>
      </div>
      <div class="meta-box">
        <div class="meta-label">BỘ DỮ LIỆU CHUẨN THỬ NGHIỆM</div>
        <div class="meta-val">80 Điểm Giao & Đội 10 Xe Tải TP.HCM</div>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2: MỤC LỤC & TỔNG QUAN KIẾN TRÚC ==================== -->
  <div class="page-break"></div>
  <h1>1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG</h1>
  
  <p>Hệ thống EcoMiles giải quyết đồng thời hai bài toán cốt lõi trong giao hàng nội đô TP.HCM: <b>Tuân thủ tuyệt đối quy định cấm xe tải theo Quyết định 23/2018/QĐ-UBND</b> và <b>Tối ưu hóa quãng đường, giảm chi phí nhiên liệu và phát thải CO2e theo chuẩn ESG quốc tế (GLEC 3.2 / ISO 14083)</b>.</p>

  <div class="tip-box">
    <b>Kiến trúc phân hệ khép kín (End-to-End Workflow):</b><br>
    Điều phối viên (Dispatcher) nạp đơn hàng và chạy thuật toán VRP trên Web Portal → Lộ trình được công bố tự động lên hệ sinh thái Cloudflare Edge → Tài xế xe tải nhận danh sách điểm giao trên Driver Mobile PWA → Dẫn đường chính xác qua Google Maps chế độ lái xe ô tô.
  </div>

  <h2>Mục lục nội dung tài liệu</h2>
  <table>
    <tr>
      <th style="width: 12%;">Phần</th>
      <th style="width: 40%;">Tiêu đề nội dung</th>
      <th style="width: 33%;">Đối tượng sử dụng</th>
      <th style="width: 15%;">Vị trí</th>
    </tr>
    <tr>
      <td><b>Phần 1</b></td>
      <td>Tổng quan Kiến trúc & Cổng phân quyền truy cập</td>
      <td>Tất cả người dùng</td>
      <td>Trang 2–3</td>
    </tr>
    <tr>
      <td><b>Phần 2</b></td>
      <td>Cổng Điều phối viên (Dispatcher Web Portal)</td>
      <td>Nhà quản lý đội xe, Điều phối viên</td>
      <td>Trang 4–5</td>
    </tr>
    <tr>
      <td><b>Phần 3</b></td>
      <td>Quản lý Đơn hàng & Giám sát Vi phạm cấm tải QĐ 23</td>
      <td>Điều phối viên, Chuyên viên ESG</td>
      <td>Trang 6</td>
    </tr>
    <tr>
      <td><b>Phần 4</b></td>
      <td>Ứng dụng Tài xế giao hàng (Driver Mobile PWA)</td>
      <td>Tài xế xe tải thực địa</td>
      <td>Trang 7–8</td>
    </tr>
    <tr>
      <td><b>Phần 5</b></td>
      <td>Xử lý ngoại lệ, Sự cố thực địa & Báo cáo số liệu</td>
      <td>Đội ngũ Vận hành & Hội đồng Cố vấn HITC INNOSTAR</td>
      <td>Trang 9</td>
    </tr>
  </table>

  <h2>Nguyên tắc gắn nhãn số liệu theo quy chuẩn HITC INNOSTAR 2026</h2>
  <p>Toàn bộ số liệu và bằng chứng trong tài liệu này được phân định minh bạch theo 3 trạng thái:</p>
  <ul>
    <li><b>[ĐÃ KIỂM CHỨNG]:</b> Các tính năng phần mềm đã chạy thực tế trên môi trường Cloudflare Edge và vượt qua 295 bài kiểm thử tự động.</li>
    <li><b>[BENCHMARK KỸ THUẬT]:</b> Kết quả đo lường trên bộ dữ liệu chuẩn 80 đơn hàng & 10 xe tải thực tế tại TP.HCM.</li>
    <li><b>[GIẢ ĐỊNH – CẦN PILOT]:</b> Các tỷ lệ tiết kiệm chi phí/phát thải thực địa cần được kiểm chứng trong chương trình thử nghiệm Pilot Vòng 2.</li>
  </ul>

  <!-- ==================== PAGE 3: CỔNG PHÂN QUYỀN ==================== -->
  <div class="page-break"></div>
  <h1>2. CỔNG PHÂN QUYỀN TRUY CẬP (ROLE SELECTION PORTAL)</h1>
  <p>Khi truy cập vào đường dẫn ứng dụng, cửa sổ phân quyền sẽ hiển thị để người dùng chọn đúng giao diện tương ứng với vai trò của mình.</p>

  <div class="fig-container">
    <img src="{fig1_path}" class="fig-img" style="max-height: 400px; width: auto;" alt="Cổng phân quyền truy cập EcoMiles"/>
    <div class="fig-caption">Hình 1: Cổng phân quyền truy cập EcoMiles với 4 vùng tính năng được đánh số</div>
  </div>

  <table>
    <tr>
      <th style="width: 8%;">Số</th>
      <th style="width: 28%;">Thành phần trên màn hình</th>
      <th style="width: 44%;">Chức năng & Nghiệp vụ chi tiết</th>
      <th style="width: 20%;">Đối tượng</th>
    </tr>
    <tr>
      <td><span class="badge-num b-red">1</span></td>
      <td><b>Điều hành tuyến (Dispatcher Web)</b></td>
      <td>Truy cập bảng điều khiển trung tâm dành cho người quản lý: lập kế hoạch tuyến, chạy giải thuật VRP cho 10 xe tải, theo dõi bản đồ vùng cấm và xuất báo cáo phát thải.</td>
      <td>Điều phối viên / Admin</td>
    </tr>
    <tr>
      <td><span class="badge-num b-blue">2</span></td>
      <td><b>Tài xế giao hàng (Driver Mobile PWA)</b></td>
      <td>Giao diện tối ưu hóa cho điện thoại thông minh: chọn biển số xe tải được bàn giao, xem lộ trình từng chặng, gọi điện khách hàng và bật Google Maps dẫn đường.</td>
      <td>Tài xế giao hàng</td>
    </tr>
    <tr>
      <td><span class="badge-num b-green">3</span></td>
      <td><b>Trải nghiệm tức thì (Zero-Setup Edge)</b></td>
      <td>Hệ thống vận hành 24/7 trên Cloudflare Edge toàn cầu; phiên demo được tự động cấp quyền mà không cần tạo tài khoản hay cài đặt môi trường.</td>
      <td>Ban Giám Khảo, Khách trải nghiệm</td>
    </tr>
    <tr>
      <td><span class="badge-num b-amber">4</span></td>
      <td><b>Nút Đóng / Trở về</b></td>
      <td>Đóng bảng chọn vai trò để quay trở về trang chủ giới thiệu tổng quan (Landing Page).</td>
      <td>Khách truy cập</td>
    </tr>
  </table>

  <!-- ==================== PAGE 4: CỔNG ĐIỀU PHỐI VIÊN - HÌNH ẢNH ==================== -->
  <div class="page-break"></div>
  <h1>3. CỔNG ĐIỀU PHỐI VIÊN (DISPATCHER WEB PORTAL)</h1>
  <p>Cổng điều phối viên là trung tâm đầu não của EcoMiles, cho phép nạp dữ liệu đơn hàng, cấu hình chính sách giao hàng và trực quan hóa phân bổ đội xe tải.</p>

  <div class="fig-container">
    <img src="{fig2_path}" class="fig-img" style="max-height: 520px; width: auto;" alt="Bảng điều khiển Dispatcher Portal"/>
    <div class="fig-caption">Hình 2: Màn hình Cổng điều phối viên với 6 khu vực chức năng trọng yếu được đánh số</div>
  </div>

  <div class="tip-box">
    <b>Hướng dẫn bắt đầu nhanh (Quickstart for Dispatcher):</b><br>
    Bấm <b>[1] Nạp dữ liệu chuẩn 80 đơn</b> → Chọn <b>[3] Chính sách Cân bằng hoặc Xanh</b> → Bấm <b>[2] Tối ưu lại lộ trình</b> → Quan sát số liệu tiết kiệm tại <b>[4] Bảng KPIs</b> → Bấm <b>Publish tài xế</b> để đồng bộ xuống điện thoại các bác tài.
  </div>

  <!-- ==================== PAGE 5: BẢNG CHI TIẾT CỔNG ĐIỀU PHỐI ==================== -->
  <div class="page-break"></div>
  <h1>3. CHI TIẾT BẢNG ĐIỀU KHIỂN & PHÂN TÍCH KỸ THUẬT</h1>

  <h2>Giải thích chi tiết 6 khu vực chức năng trên Bảng điều phối</h2>
  <table>
    <tr>
      <th style="width: 8%;">Vùng</th>
      <th style="width: 27%;">Tên thành phần</th>
      <th style="width: 45%;">Mô tả thao tác & Ý nghĩa nghiệp vụ</th>
      <th style="width: 20%;">Lưu ý vận hành</th>
    </tr>
    <tr>
      <td><span class="badge-num b-red">1</span></td>
      <td><b>Nạp dữ liệu chuẩn 80 đơn</b></td>
      <td>Nhấn nút màu vàng để tải nhanh bộ dữ liệu thực nghiệm tiêu chuẩn gồm <b>80 điểm giao hàng thực tế</b> phân bổ tại các quận trung tâm TP.HCM và <b>đội 10 xe tải</b> tải trọng từ 1.5 đến 2.5 tấn.</td>
      <td>Nên nạp khi bắt đầu phiên làm việc mới.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-blue">2</span></td>
      <td><b>Tối ưu lại lộ trình (VRP)</b></td>
      <td>Kích hoạt thuật toán VRP (Vehicle Routing Problem) tích hợp công nghệ ALNS (Adaptive Large Neighborhood Search) giải bài toán định tuyến đa xe trong vòng 1–2 giây.</td>
      <td>Tự động tránh các tuyến phố cấm xe tải theo giờ.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-green">3</span></td>
      <td><b>Chính sách định tuyến (Policies)</b></td>
      <td>Cho phép điều phối viên chọn 1 trong 3 chiến lược:
        <br>• <b>Nhanh nhất (Fastest):</b> Ưu tiên thời gian giao ngắn nhất.
        <br>• <b>Cân bằng (Balanced):</b> Hài hòa giữa chi phí xăng xe và tiến độ.
        <br>• <b>Xanh nhất (Eco-mode):</b> Cắt giảm tối đa lượng phát thải CO2e.
      </td>
      <td>Mặc định hệ thống đề xuất chế độ <i>Cân bằng</i>.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-amber">4</span></td>
      <td><b>Bảng KPIs & Benchmark</b></td>
      <td>Hiển thị đối chứng minh bạch: Quãng đường (Km), Nhiên liệu tiêu thụ (Lít), và Lượng khí CO2e (kg TTW). Tính toán trực tiếp tỷ lệ phần trăm tiết kiệm (Δ %) so với cách điều phối thủ công.</td>
      <td>Dữ liệu tính theo chuẩn GLEC 3.2 / ISO 14083.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-purple">5</span></td>
      <td><b>Bộ lọc theo biển số xe</b></td>
      <td>Thanh chip điều hướng cho phép chọn xem riêng lộ trình của từng xe (ví dụ: 51C-123.45) hoặc hiển thị đồng thời toàn bộ 10 xe trên bản đồ.</td>
      <td>Mỗi xe có mã màu polyline riêng biệt.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-pink">6</span></td>
      <td><b>Bản đồ & Vùng cấm tải QĐ 23</b></td>
      <td>Trực quan hóa khu vực nội đô bị giới hạn tải trọng (vùng tô màu đỏ nhạt). Hiển thị các điểm giao hàng (Stop pins) được đánh số thứ tự di chuyển và đường nối tuyến đường thực tế.</td>
      <td>Click vào từng điểm pin để xem chi tiết đơn.</td>
    </tr>
  </table>

  <h2>Mô hình tính toán phát thải GLX-HDT-v1 (GLEC & ISO 14083)</h2>
  <p>Hệ thống tích hợp công thức tiêu hao nhiên liệu theo tải trọng tức thời và độ dốc đường đô thị Việt Nam:</p>
  <div class="note-box">
    <b>Công thức phát thải Well-to-Wheel (WTW):</b><br>
    <code>CO2e (kg) = Quãng đường (km) × [ Tiêu hao cơ sở (L/km) + Hệ số tải trọng × Trọng lượng hàng (tấn) ] × Hệ số phát thải Diesel (3.18 kg CO2e/L)</code><br>
    Được thẩm định theo tài liệu hướng dẫn của Smart Freight Centre (SFC) và tiêu chuẩn ISO 14083:2023.
  </div>

  <!-- ==================== PAGE 6: QUẢN LÝ ĐƠN HÀNG & CẤM TẢI ==================== -->
  <div class="page-break"></div>
  <h1>4. QUẢN LÝ ĐƠN HÀNG & GIÁM SÁT VI PHẠM CẤM TẢI</h1>
  <p>EcoMiles tự động phát hiện và cảnh báo các đơn hàng nằm trong khung giờ giới hạn lưu thông của xe tải theo <b>Quyết định 23/2018/QĐ-UBND của UBND TP.HCM</b> (cấm xe tải nhẹ 6h00–9h00 và 16h00–20h00 vào nội đô).</p>

  <div class="fig-container">
    <img src="{fig3_path}" class="fig-img" style="max-height: 310px; width: auto;" alt="Danh sách đơn hàng và cảnh báo cấm tải"/>
    <div class="fig-caption">Hình 3: Giao diện quản lý danh sách đơn hàng và gắn thẻ cảnh báo vi phạm tải trọng</div>
  </div>

  <table>
    <tr>
      <th style="width: 8%;">Vùng</th>
      <th style="width: 27%;">Tên thành phần</th>
      <th style="width: 45%;">Mô tả chi tiết & Cách thức vận hành</th>
      <th style="width: 20%;">Ý nghĩa nghiệp vụ</th>
    </tr>
    <tr>
      <td><span class="badge-num b-red">1</span></td>
      <td><b>Tab Danh sách đơn hàng</b></td>
      <td>Chuyển đổi giữa 3 tab: <i>Lộ trình xe</i> (Route manifests), <i>Danh sách 80 đơn</i> (Stops list), và <i>Quy định cấm tải</i> (Restrictions). Tab danh sách đơn cho phép tra cứu nhanh từng bưu phẩm.</td>
      <td>Kiểm tra toàn diện 80 đơn giao trong ngày.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-amber">2</span></td>
      <td><b>Thẻ cảnh báo cấm tải</b></td>
      <td>Hệ thống tự động phân tích tọa độ địa lý và thời gian giao dự kiến. Nếu điểm giao nằm trong vành đai cấm tải, thẻ màu cam cảnh báo sẽ hiển thị rõ: <i>"Cấm xe tải: 6h-9h & 16h-20h"</i>.</td>
      <td>Giúp điều phối viên không phân đơn nhầm vào giờ cấm.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-blue">3</span></td>
      <td><b>Phân bổ tải trọng xe</b></td>
      <td>Thuật toán tự động đối chiếu tải trọng xe tải được giao (ví dụ xe 1.99 tấn hoặc 2.5 tấn) với khối lượng đơn hàng để bảo đảm không vượt quá dung tích thùng xe và tải trọng cầu đường.</td>
      <td>Ngăn ngừa chở quá tải và bị phạt hành chính.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-green">4</span></td>
      <td><b>Xuất Excel & Báo cáo ESG</b></td>
      <td>Nút chức năng cho phép tải file Excel bảng kê chi tiết toàn bộ chuyến xe, lượng nhiên liệu và chứng thư phát thải CO2e phục vụ lưu trữ nội bộ và nộp báo cáo kiểm toán Net Zero.</td>
      <td>Sẵn sàng cho kiểm toán độc lập của doanh nghiệp.</td>
    </tr>
  </table>

  <div class="warn-box">
    <b>Quy định pháp lý quan trọng:</b><br>
    Theo Quyết định số 23/2018/QĐ-UBND, xe tải nhẹ (dưới 2.500 kg) bị cấm lưu thông trong khu vực nội đô TP.HCM (giới hạn bởi các tuyến đường vành đai: Quốc lộ 1A — Xa lộ Hà Nội — Mai Chí Thọ — Võ Chí Công — Cầu Phú Mỹ — Nguyễn Văn Linh) từ <b>06h00 đến 09h00</b> và từ <b>16h00 đến 20h00</b> hàng ngày. EcoMiles được lập trình để tự động dời thời gian giao của các điểm nằm trong vùng này ra ngoài khung giờ cấm.
  </div>

  <!-- ==================== PAGE 7: ỨNG DỤNG TÀI XẾ - HÌNH ẢNH ==================== -->
  <div class="page-break"></div>
  <h1>5. HƯỚNG DẪN ỨNG DỤNG TÀI XẾ (DRIVER MOBILE PWA)</h1>
  <p>Ứng dụng tài xế được thiết kế dưới dạng PWA (Progressive Web App) gọn nhẹ, chạy trực tiếp trên trình duyệt điện thoại (iOS Safari / Android Chrome) mà không cần cài đặt qua App Store.</p>

  <div class="fig-container" style="max-width: 440px; margin: 10px auto;">
    <img src="{fig4_path}" class="fig-img" style="max-height: 520px; width: auto;" alt="Ứng dụng tài xế Driver PWA"/>
    <div class="fig-caption">Hình 4: Giao diện Ứng dụng Tài xế với 6 cụm điều khiển và nút dẫn đường ô tô</div>
  </div>

  <div class="tip-box">
    <b>Điểm vượt trội về trải nghiệm tài xế:</b><br>
    Giao diện Dark Mode tương phản cao, phông chữ lớn, nút bấm kích thước tối thiểu 48px phù hợp thao tác một tay trên giá đỡ điện thoại của xe tải khi dừng đỗ.
  </div>

  <!-- ==================== PAGE 8: HƯỚNG DẪN THAO TÁC TÀI XẾ ==================== -->
  <div class="page-break"></div>
  <h1>5. HƯỚNG DẪN THAO TÁC THỰC ĐỊA CHO TÀI XẾ</h1>

  <h2>Quy trình 6 bước giao hàng thực tế cho tài xế</h2>
  <table>
    <tr>
      <th style="width: 8%;">Số</th>
      <th style="width: 27%;">Thao tác tài xế</th>
      <th style="width: 45%;">Hướng dẫn chi tiết từng bước</th>
      <th style="width: 20%;">Kết quả mong đợi</th>
    </tr>
    <tr>
      <td><span class="badge-num b-red">1</span></td>
      <td><b>Chọn biển số xe tải</b></td>
      <td>Tại góc trên cùng bên phải màn hình, chạm vào ô chọn và chọn đúng <b>Biển số xe</b> được quản lý phân công hôm nay (ví dụ: <i>51C-123.45</i>).</td>
      <td>Hệ thống ngay lập tức nạp danh sách các điểm giao của riêng xe đó.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-amber">2</span></td>
      <td><b>Xem tiến độ ca làm việc</b></td>
      <td>Quan sát 3 ô thống kê: <b>Tổng điểm</b> (số đơn cần giao), <b>Đã giao</b> (số đơn hoàn tất), và <b>Còn lại</b>.</td>
      <td>Nắm bắt khối lượng công việc còn lại trong ca.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-blue">3</span></td>
      <td><b>Kiểm tra thông tin điểm dừng</b></td>
      <td>Mỗi thẻ điểm dừng hiển thị: Số thứ tự giao tối ưu (①, ②, ③...), Tên khách hàng, Địa chỉ giao và <b>Số điện thoại</b> (chạm vào số điện thoại để gọi trực tiếp).</td>
      <td>Liên hệ khách hàng hẹn trước thời gian nhận hàng.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-red">4</span></td>
      <td><b>Đọc cảnh báo giờ cấm tải</b></td>
      <td>Nếu điểm giao có khung giờ cấm, ứng dụng sẽ hiện thanh cảnh báo màu vàng viền đỏ. Tài xế cần kiểm tra đồng hồ trước khi di chuyển vào tuyến đường này.</td>
      <td>Tránh vi phạm luật giao thông và bị giữ phương tiện.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-green">5</span></td>
      <td><b>Bật dẫn đường Google Maps</b></td>
      <td>Chạm vào nút xanh lá cây <b>"Chỉ đường (Google Maps - Ô tô)"</b>. Ứng dụng sẽ kích hoạt app Google Maps với tham số bắt buộc <code>travelmode=driving</code> (chế độ xe hơi/xe tải).</td>
      <td><b>Đặc biệt quan trọng:</b> Ngăn chặn Google Maps tự chuyển sang đường hẻm xe máy cấm ô tô.</td>
    </tr>
    <tr>
      <td><span class="badge-num b-purple">6</span></td>
      <td><b>Cập nhật trạng thái giao hàng</b></td>
      <td>
        • Khi tới địa chỉ: Bấm nút <b>"Đã đến nơi"</b>.<br>
        • Khách ký nhận xong: Bấm nút <b>"Giao thành công"</b> để thẻ chuyển sang màu xanh và điểm dừng tiếp theo tự kích hoạt.<br>
        • Nếu khách vắng mặt/không liên lạc được: Bấm <b>"Báo sự cố"</b>.
      </td>
      <td>Dữ liệu được đồng bộ ngay tức thì về máy tính của Điều phối viên.</td>
    </tr>
  </table>

  <div class="note-box">
    <b>Khắc phục lỗi điều hướng xe máy phổ biến:</b><br>
    Trong giao hàng đô thị tại Việt Nam, các ứng dụng thông thường khi bấm link Google Maps thường tự động chọn lộ trình xe 2 bánh, dẫn xe tải vào các ngõ hẻm chật hẹp cấm ô tô. EcoMiles cưỡng chế tham số chuẩn đường bộ ô tô, đảm bảo tuyệt đối an toàn cho tài xế.
  </div>

  <!-- ==================== PAGE 9: XỬ LÝ NGOẠI LỆ & BÁO CÁO KỸ THUẬT ==================== -->
  <div class="page-break"></div>
  <h1>6. QUY TRÌNH XỬ LÝ NGOẠI LỆ & BÁO CÁO KỸ THUẬT</h1>
  
  <div class="step-card">
    <div class="step-header">
      <span class="badge-num b-red">!</span> Tình huống 1: Tài xế gặp ùn tắc cục bộ hoặc công trường đóng đường
    </div>
    <p><b>Quy trình xử lý:</b></p>
    <ol style="margin: 2px 0 0; padding-left: 20px;">
      <li>Tài xế bấm nút <b>"Báo sự cố"</b> trên thẻ điểm dừng tương ứng, ghi chú lý do <i>"Kẹt xe / Đường sửa"</i>.</li>
      <li>Điều phối viên tại văn phòng kiểm tra trên Cổng Dispatcher Web, xem xét vị trí hiện tại của xe trên bản đồ.</li>
      <li>Điều phối viên bấm nút <b>"Tối ưu lại lộ trình (VRP)"</b>. Hệ thống sẽ giữ nguyên các đơn đã giao thành công và tự động tính toán lại thứ tự các đơn còn lại để xe chuyển hướng sang nhánh đường phụ thoáng hơn.</li>
    </ol>
  </div>

  <div class="step-card">
    <div class="step-header">
      <span class="badge-num b-amber">!</span> Tình huống 2: Khách hàng hẹn lại giờ giao khác khung giờ ban đầu
    </div>
    <p><b>Quy trình xử lý:</b></p>
    <ol style="margin: 2px 0 0; padding-left: 20px;">
      <li>Tài xế chuyển trạng thái đơn sang <i>"Hẹn lại giờ"</i>.</li>
      <li>Thuật toán tự động hoán đổi điểm dừng này xuống cuối ca làm việc (sau 20h00 nếu điểm giao thuộc vùng cấm tải nội đô).</li>
      <li>Tài xế tiếp tục đi đến điểm giao tiếp theo theo thứ tự được cập nhật tự động trên màn hình.</li>
    </ol>
  </div>

  <h2>Bảng tổng hợp chỉ số kỹ thuật & quy chuẩn hệ thống</h2>
  <table>
    <tr>
      <th style="width: 25%;">Chỉ tiêu kỹ thuật</th>
      <th style="width: 35%;">Thông số hệ thống EcoMiles</th>
      <th style="width: 40%;">Cơ sở pháp lý / Chuẩn đo lường</th>
    </tr>
    <tr>
      <td><b>Ràng buộc cấm tải</b></td>
      <td>Cấm xe tải nhẹ: 06h00–09h00 & 16h00–20h00</td>
      <td>Quyết định 23/2018/QĐ-UBND TP.HCM</td>
    </tr>
    <tr>
      <td><b>Đo lường phát thải CO2e</b></td>
      <td>Mô hình tiêu hao GLX-HDT-v1 (Hệ số diesel TTW)</td>
      <td>ISO 14083 & GLEC Framework Version 3.2</td>
    </tr>
    <tr>
      <td><b>Thuật toán định tuyến</b></td>
      <td>Hybrid ALNS (Adaptive Large Neighborhood Search)</td>
      <td>Tối ưu VRP đa ràng buộc thời gian (VRPTW)</td>
    </tr>
    <tr>
      <td><b>Dẫn đường thực địa</b></td>
      <td>Google Maps Navigation (travelmode=driving)</td>
      <td>Google Maps Directions API Standard</td>
    </tr>
    <tr>
      <td><b>Hạ tầng đám mây</b></td>
      <td>Cloudflare Pages & Edge API Worker (24/7 uptime)</td>
      <td>Kiến trúc Serverless Edge Computing</td>
    </tr>
  </table>

  <div class="note-box" style="margin-top: 15px; text-align: center;">
    <b>ECOMILES — GIẢI PHÁP LOGISTICS XANH THÔNG MINH CHO ĐÔ THỊ VIỆT NAM</b><br>
    Hỗ trợ kỹ thuật: support@ecomiles.vn | Phiên bản tài liệu: 1.0 (10/2026) | Dự án tham gia CUỘC THI KHỞI NGHIỆP ĐỔI MỚI SÁNG TẠO HITC INNOSTAR 2026
  </div>

</body>
</html>
"""
    html_path = os.path.join(OUTPUT_DIR, 'user_guide_hitc.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f'Saved HTML user guide: {html_path}')
    return html_path

# ==============================================================================
# 6. RENDER PDF VIA WEASYPRINT
# ==============================================================================
def render_pdf(html_path):
    import weasyprint
    pdf_path = os.path.join(OUTPUT_DIR, 'ECOMILES_HUONG_DAN_SU_DUNG_HITC_INNOSTAR.pdf')
    root_pdf_path = os.path.join(BASE_DIR, 'ECOMILES_HUONG_DAN_SU_DUNG_HITC_INNOSTAR.pdf')
    hitc_contest_pdf = os.path.join(BASE_DIR, 'docs', 'contests', 'HITC_INNOSTAR_2026', 'ECOMILES_HUONG_DAN_SU_DUNG_HITC_INNOSTAR.pdf')
    
    print(f'Rendering PDF from {html_path}...')
    doc = weasyprint.HTML(filename=html_path)
    doc.write_pdf(pdf_path)
    print(f'Successfully rendered PDF: {pdf_path}')
    
    shutil.copyfile(pdf_path, root_pdf_path)
    os.makedirs(os.path.dirname(hitc_contest_pdf), exist_ok=True)
    shutil.copyfile(pdf_path, hitc_contest_pdf)
    print(f'Copied PDF to HITC paths:\n- {root_pdf_path}\n- {pdf_path}\n- {hitc_contest_pdf}')
    return pdf_path

# ==============================================================================
# 7. GENERATE PREVIEWS (VISUAL SELF-CHECK)
# ==============================================================================
def generate_previews(pdf_path):
    preview_dir = '/tmp/pdf_previews_ecomiles'
    os.makedirs(preview_dir, exist_ok=True)
    cmd = ['pdftoppm', '-png', '-r', '150', pdf_path, f'{preview_dir}/page']
    try:
        subprocess.run(cmd, check=True)
        previews = sorted([os.path.join(preview_dir, f) for f in os.listdir(preview_dir) if f.endswith('.png')])
        print(f'Generated {len(previews)} preview pages in {preview_dir}')
        return previews
    except Exception as e:
        print(f'Warning: Could not run pdftoppm: {e}')
        return []

def main():
    print('Step 1: Checking annotated screenshots...')
    src_fig1 = os.path.join(ARTIFACTS_DIR, 'role-portal-modal.png')
    if os.path.exists(src_fig1):
        annotate_fig1_role_portal()
        annotate_fig2_dispatcher_dashboard()
        annotate_fig3_dispatcher_stops_bans()
        annotate_fig4_driver_mobile_pwa()
    else:
        print('Raw artifacts not found in conversation dir; reusing existing annotated figures in docs/assets/annotated/')

    print('Step 2: Generating HTML user guide...')
    html_path = generate_user_guide_html()

    print('Step 3: Rendering PDF via WeasyPrint...')
    pdf_path = render_pdf(html_path)

    print('Step 4: Generating PNG preview pages for visual inspection...')
    previews = generate_previews(pdf_path)

    print('Done! PDF generated successfully.')

if __name__ == '__main__':
    main()
