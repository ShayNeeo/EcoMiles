#!/usr/bin/env python3
"""
EcoMiles Pitch Deck Generator for Olympic Khoi Nghiep 2026 (SO 2026)
Hosts: Dai hoc Kinh te Quoc dan (NEU) & Trung tam CICN

Strictly follows the visual styling principles, vibrant colors, cards, glows,
borders, typography, and layout of slides/Example_Slides.pptx while maintaining
the 10-slide narrative flow and verbatim presenter notes from Draft_1.

Key Upgrades:
    - Real OSRM turn-by-turn road network pathfinding screenshots from live edge app
    - Refined smartphone driver PWA device mockup with HCMC truck ban warning badges
    - Luminous ambient radial glow backdrops (amber, cyan, emerald, royal blue)
    - Vibrant high-contrast borders and container cards (#11C96B, #2BBBED, #F3740B, #FFDE59)
    - High-impact slide titles (28-34pt bold uppercase) matching Example_Slides
    - Signature 'KẾT LUẬN' conclusion containers with glowing gold borders (#FFDE59)
    - Inline colored run highlights for critical metrics and key takeaways
    - Compact, high-efficiency top header bar maximizing vertical space for content
    - 1:1 voiceover timing and verbatim presenter notes from Draft_1
"""

import os
import sys
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

from pptx import Presentation
from pptx.util import Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# -----------------------------------------------------------------------------
# Color Palette Constants (Vibrant Hierarchy from Example_Slides.pptx)
# -----------------------------------------------------------------------------
COLOR_BG = RGBColor(0x09, 0x0D, 0x16)           # #090D16 Deep void canvas
COLOR_CARD = RGBColor(0x13, 0x1B, 0x2A)         # #131B2A Elevated card surface
COLOR_CARD_ALT = RGBColor(0x0E, 0x14, 0x22)     # #0E1422 Deep container fill
COLOR_CARD_BORDER = RGBColor(0x1E, 0x2D, 0x42)  # #1E2D42 Subtle border

# Vibrant Accent Hierarchy (Directly matched to Example_Slides.pptx)
COLOR_EMERALD = RGBColor(0x11, 0xC9, 0x6B)      # #11C96B Neon mint emerald
COLOR_EMERALD_BG = RGBColor(0x0A, 0x26, 0x1A)   # Translucent emerald fill
COLOR_CYAN = RGBColor(0x2B, 0xBB, 0xED)         # #2BBBED Electric sky cyan
COLOR_CYAN_BG = RGBColor(0x0A, 0x22, 0x34)      # Translucent cyan fill
COLOR_AMBER = RGBColor(0xF3, 0x74, 0x0B)        # #F3740B Warm fiery amber
COLOR_AMBER_BG = RGBColor(0x2C, 0x16, 0x06)     # Translucent amber fill
COLOR_GOLD = RGBColor(0xFF, 0xDE, 0x59)         # #FFDE59 Glowing conclusion gold
COLOR_GOLD_BG = RGBColor(0x24, 0x1C, 0x06)      # Rich dark gold fill
COLOR_RED = RGBColor(0xEF, 0x44, 0x44)          # #EF4444 Alert red
COLOR_RED_BG = RGBColor(0x2E, 0x11, 0x14)       # Translucent red fill

# Typography Colors
COLOR_TEXT_PRIMARY = RGBColor(0xFC, 0xFF, 0xFF) # Crisp bright white
COLOR_TEXT_SECONDARY = RGBColor(0xCB, 0xD5, 0xE1) # Slate-300
COLOR_TEXT_MUTED = RGBColor(0x94, 0xA3, 0xB8)   # Slate-400
COLOR_TEXT_DIM = RGBColor(0x64, 0x74, 0x8B)     # Slate-500

FONT_MAIN = "Montserrat"

# -----------------------------------------------------------------------------
# Verbatim Presenter Notes Catalog (Draft_1 Timing & Voiceover Synchronization)
# -----------------------------------------------------------------------------
PRESENTER_NOTES = {
    1: '[~20s] “80 đơn hàng cần giao. 10 chiếc xe tải. Và công cụ điều phối duy nhất… là một file Excel. Bạn có thấy quen không? Đó là buổi sáng bình thường của rất nhiều doanh nghiệp vận tải Việt Nam — tuyến chồng chéo, xe chạy vòng, cuối ngày gần một phần ba số xe quay về tay không. Và đó chính là lý do EcoMiles ra đời — tối ưu vận chuyển, tiết kiệm chi phí, kiến tạo tương lai xanh!”',
    2: '[~12s] “Câu chuyện đó không phải cá biệt. Logistics Việt Nam đang tiêu tốn tới 17% GDP — gấp rưỡi mức bình quân thế giới — trong khi 80% phát thải CO2 ngành giao thông đến từ đường bộ, và có tới 30-35% xe chạy rỗng mỗi ngày.”',
    3: '[~10s] “Đứng sau bài toán đó là 5 sinh viên đa ngành — công nghệ, tài chính, kinh doanh — cùng chung một mục tiêu: xanh hoá logistics Việt Nam.”',
    4: '[~15s] “Với chúng tôi, logistics xanh không phải một lựa chọn xa xỉ, mà là con đường tất yếu để doanh nghiệp Việt Nam phát triển bền vững. Đó cũng là lý do EcoMiles hướng tới trở thành nền tảng quản trị vận tải và phát thải hàng đầu Việt Nam, đồng hành cùng mục tiêu Net Zero 2050.”',
    5: '[~20s] “Vậy EcoMiles giải quyết bài toán đó như thế nào? Nền tảng tự động sắp tuyến, chủ động cảnh báo lệch tuyến, ghép đơn chiều về để giảm xe chạy rỗng, và tự động đo lường — báo cáo CO2 theo chuẩn quốc tế GLEC và GHG Protocol — tất cả trên cùng một hệ thống.”',
    6: '[~15s] “Toàn bộ được quản lý qua một giao diện trực quan: người quản lý tải đơn hàng lên, hệ thống tự nhóm tuyến, theo dõi vị trí xe theo thời gian thực, và xuất báo cáo phát thải chỉ trong vài cú nhấp chuột.”',
    7: '[~15s] “Không chỉ vậy, khác với cách làm cũ vốn thủ công và không đo lường được phát thải, EcoMiles là nền tảng duy nhất kết hợp đồng thời tối ưu vận hành và đo lường CO2 minh bạch, truy vết đến từng đơn hàng cụ thể.”',
    8: '[~20s] “Quay lại với kho hàng 80 đơn hàng, 10 xe tải ở đầu video — đó chính là kịch bản thực tế mà EcoMiles đã mô phỏng thành công trên MVP tại ecomiles.w9.nu. Với thời gian hoàn vốn khoảng 1,68 năm, IRR 28%, và lợi nhuận dương từ năm thứ hai, đây là mô hình vừa khả thi, vừa bền vững.”',
    9: '[~20s] “Và hơn cả những con số, chúng tôi tin một tuyến đường không chạy rỗng cũng là một hơi thở trong lành hơn cho thành phố, một ngày làm việc nhẹ nhàng hơn cho người tài xế — nơi phát triển kinh tế và bảo vệ môi trường có thể song hành.”',
    10: '[~10s] “Tối ưu vận chuyển, tiết kiệm chi phí, kiến tạo tương lai xanh — đó là những gì EcoMiles mang lại. Cảm ơn bạn đã dành thời gian đồng hành cùng chúng tôi.”'
}

# -----------------------------------------------------------------------------
# Asset Pre-processing with Pillow
# -----------------------------------------------------------------------------
def pre_process_assets():
    """Generates 1:1 circular avatars, ambient glows, phone mockup, and brand emblem."""
    os.makedirs(".build/team_avatars", exist_ok=True)
    os.makedirs("docs/assets/glows", exist_ok=True)
    os.makedirs("docs/assets/app_screenshots", exist_ok=True)

    # 1. Team portraits (1:1 antialiased circle with glowing emerald border)
    team_configs = [
        {"id": "thuy", "src": "docs/assets/team/thuy.jpg", "top_offset": 60, "dest": ".build/team_avatars/thuy_avatar.png"},
        {"id": "thanh", "src": "docs/assets/team/thanh.jpeg", "top_offset": 200, "dest": ".build/team_avatars/thanh_avatar.png"},
        {"id": "phuong", "src": "docs/assets/team/Phuong-member.jpg", "top_offset": 60, "dest": ".build/team_avatars/phuong_avatar.png"},
        {"id": "phuc", "src": "docs/assets/team/Phúc.jpg", "top_offset": 150, "dest": ".build/team_avatars/phuc_avatar.png"},
        {"id": "ngan", "src": "docs/assets/team/ngan.jpg", "top_offset": 60, "dest": ".build/team_avatars/ngan_avatar.png"}
    ]

    for m in team_configs:
        if not os.path.exists(m["src"]):
            continue
        im = Image.open(m["src"]).convert("RGB")
        w, h = im.size
        side = min(w, h)
        top = max(0, min(h - side, m["top_offset"]))
        crop = im.crop((0, top, side, top + side))

        res = 512
        crop = crop.resize((res, res), Image.Resampling.LANCZOS)

        scale = 4
        mask = Image.new("L", (res * scale, res * scale), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, res * scale, res * scale), fill=255)
        mask = mask.resize((res, res), Image.Resampling.LANCZOS)

        out = Image.new("RGBA", (res, res), (0, 0, 0, 0))
        out.paste(crop, (0, 0), mask)

        # Draw glowing emerald circular border
        draw_out = ImageDraw.Draw(out)
        for b in range(6):
            draw_out.ellipse((b, b, res - 1 - b, res - 1 - b), outline=(17, 201, 107, 255))

        out.save(m["dest"], "PNG")

    # 2. Ambient Radial Glow Textures (clean gaussian-like glow orbs)
    def make_radial_glow(color_rgb, size=1024, max_alpha=100):
        center = size / 2.0
        radius = size / 2.0
        r, g, b = color_rgb
        import numpy as np
        y, x = np.ogrid[:size, :size]
        dist = np.sqrt((x - center)**2 + (y - center)**2)
        norm_dist = np.clip(dist / radius, 0.0, 1.0)
        alpha = (np.cos(norm_dist * np.pi) * 0.5 + 0.5) * max_alpha
        alpha[dist > radius] = 0
        arr = np.zeros((size, size, 4), dtype=np.uint8)
        arr[:, :, 0] = r
        arr[:, :, 1] = g
        arr[:, :, 2] = b
        arr[:, :, 3] = alpha.astype(np.uint8)
        return Image.fromarray(arr, "RGBA")

    make_radial_glow((17, 201, 107), 1024, 85).save("docs/assets/glows/clean_glow_emerald.png")
    make_radial_glow((43, 187, 237), 1024, 85).save("docs/assets/glows/clean_glow_cyan.png")
    make_radial_glow((243, 116, 11), 1024, 75).save("docs/assets/glows/clean_glow_amber.png")
    make_radial_glow((30, 80, 220), 1024, 90).save("docs/assets/glows/clean_glow_blue.png")

    # 3. Smartphone Mockup for Driver PWA
    driver_ss = "docs/assets/app_screenshots/driver_real_latest.png"
    phone_mockup_path = "docs/assets/app_screenshots/driver_phone_mockup.png"
    if os.path.exists(driver_ss):
        screen = Image.open(driver_ss).convert("RGBA")
        sw, sh = screen.size
        target_sw = 390
        target_sh = int(sh * (target_sw / sw))
        screen = screen.resize((target_sw, target_sh), Image.Resampling.LANCZOS)
        
        status_bar_h = 32
        bezel = 12
        phone_w = target_sw + bezel * 2
        phone_h = target_sh + status_bar_h + bezel * 2
        corner_radius = 42
        screen_radius = 30
        scale = 4

        big_w = phone_w * scale
        big_h = phone_h * scale
        big = Image.new("RGBA", (big_w, big_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(big)
        draw.rounded_rectangle([0, 0, big_w - 1, big_h - 1], radius=corner_radius * scale, fill=(10, 15, 26, 255), outline=(17, 201, 107, 255), width=int(2.5 * scale))
        phone = big.resize((phone_w, phone_h), Image.Resampling.LANCZOS)

        total_screen_w = target_sw
        total_screen_h = status_bar_h + target_sh
        mask = Image.new("L", (total_screen_w * scale, total_screen_h * scale), 0)
        m_draw = ImageDraw.Draw(mask)
        m_draw.rounded_rectangle([0, 0, total_screen_w * scale - 1, total_screen_h * scale - 1], radius=screen_radius * scale, fill=255)
        mask = mask.resize((total_screen_w, total_screen_h), Image.Resampling.LANCZOS)

        screen_canvas = Image.new("RGBA", (total_screen_w, total_screen_h), (7, 17, 12, 255))
        screen_canvas.paste(screen, (0, status_bar_h))

        screen_cut = Image.new("RGBA", (total_screen_w, total_screen_h), (0, 0, 0, 0))
        screen_cut.paste(screen_canvas, (0, 0), mask)

        res_phone = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
        res_phone.paste(phone, (0, 0))
        res_phone.paste(screen_cut, (bezel, bezel), mask)

        # Dynamic island centered
        di_layer = Image.new("RGBA", (phone_w, phone_h), (0, 0, 0, 0))
        d_draw = ImageDraw.Draw(di_layer)
        d_draw.rounded_rectangle([(phone_w - 105) // 2, bezel + 5, (phone_w + 105) // 2, bezel + 5 + 20], radius=10, fill=(0, 0, 0, 255))
        res_phone.paste(di_layer, (0, 0), di_layer)

        res_phone.save(phone_mockup_path, "PNG")

    # 4. EcoMiles Leaf Emblem
    emblem_path = "docs/assets/logo_greenlogix_badge.png"
    if not os.path.exists(emblem_path):
        res = 512
        scale = 4
        big_res = res * scale
        big = Image.new("RGBA", (big_res, big_res), (0, 0, 0, 0))
        big_draw = ImageDraw.Draw(big)
        center = big_res // 2
        radius = int(big_res * 0.46)
        for r in range(radius, 0, -1):
            ratio = r / radius
            red = int(0 * ratio + 34 * (1 - ratio))
            green = int(208 * ratio + 235 * (1 - ratio))
            blue = int(132 * ratio + 160 * (1 - ratio))
            big_draw.ellipse((center - r, center - r, center + r, center + r), fill=(red, green, blue, 255))

        leaf_mask = Image.new("L", (big_res, big_res), 0)
        leaf_draw = ImageDraw.Draw(leaf_mask)
        p0 = (int(big_res * 0.30), int(big_res * 0.70))
        p1 = (int(big_res * 0.72), int(big_res * 0.28))
        points = []
        steps = 60
        for i in range(steps + 1):
            t = i / steps
            x = p0[0] + (p1[0] - p0[0]) * t
            y = p0[1] + (p1[1] - p0[1]) * t
            bulge = math.sin(t * math.pi) * (big_res * 0.26)
            points.append((x - bulge * 0.707, y - bulge * 0.707))
        for i in range(steps, -1, -1):
            t = i / steps
            x = p0[0] + (p1[0] - p0[0]) * t
            y = p0[1] + (p1[1] - p0[1]) * t
            bulge = math.sin(t * math.pi) * (big_res * 0.16)
            points.append((x + bulge * 0.707, y + bulge * 0.707))
        leaf_draw.polygon(points, fill=255)

        dark_leaf = Image.new("RGBA", (big_res, big_res), (9, 13, 22, 240))
        big.paste(dark_leaf, (0, 0), leaf_mask)
        badge = big.resize((res, res), Image.Resampling.LANCZOS)
        badge.save(emblem_path, "PNG")


# -----------------------------------------------------------------------------
# PPTX Layout Helpers & Styling Core
# -----------------------------------------------------------------------------
def add_solid_background(slide):
    """Guarantees deep dark background on all renderers."""
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(0), Pt(0), Pt(1440), Pt(810))
    bg.fill.solid()
    bg.fill.fore_color.rgb = COLOR_BG
    bg.line.fill.background()
    return bg

def add_ambient_glows(slide, top_right="amber", bottom_right="cyan", top_left="emerald"):
    """Adds luminous radial ambient glow backdrops inspired by Example_Slides.pptx."""
    glow_map = {
        "amber": "docs/assets/glows/clean_glow_amber.png",
        "cyan": "docs/assets/glows/clean_glow_cyan.png",
        "emerald": "docs/assets/glows/clean_glow_emerald.png",
        "blue": "docs/assets/glows/clean_glow_blue.png"
    }
    # Top-Right Glow
    if top_right in glow_map and os.path.exists(glow_map[top_right]):
        slide.shapes.add_picture(glow_map[top_right], Pt(950), Pt(-120), Pt(650), Pt(650))
    # Bottom-Right Glow
    if bottom_right in glow_map and os.path.exists(glow_map[bottom_right]):
        slide.shapes.add_picture(glow_map[bottom_right], Pt(980), Pt(380), Pt(620), Pt(550))
    # Top-Left Glow
    if top_left in glow_map and os.path.exists(glow_map[top_left]):
        slide.shapes.add_picture(glow_map[top_left], Pt(-120), Pt(-120), Pt(600), Pt(600))

def add_card(slide, left, top, width, height, bg_color=COLOR_CARD, border_color=COLOR_CARD_BORDER, border_width=Pt(1.5), roundness=0.04):
    """Creates a high-tech glassmorphism/card container with subtle rounded corners and vibrant border."""
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Pt(left), Pt(top), Pt(width), Pt(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = border_width
    else:
        shape.line.fill.background()
    if hasattr(shape, "adjustments") and len(shape.adjustments) > 0:
        shape.adjustments[0] = roundness
    return shape

def add_pill(slide, left, top, width, height, text, bg_color=COLOR_CARD_ALT, border_color=COLOR_CYAN, text_color=COLOR_TEXT_PRIMARY, font_size=11.5, bold=True, align=PP_ALIGN.CENTER, roundness=0.5):
    """Creates a rounded capsule badge."""
    pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Pt(left), Pt(top), Pt(width), Pt(height))
    pill.fill.solid()
    pill.fill.fore_color.rgb = bg_color
    if border_color:
        pill.line.color.rgb = border_color
        pill.line.width = Pt(1.2)
    else:
        pill.line.fill.background()
    if hasattr(pill, "adjustments") and len(pill.adjustments) > 0:
        pill.adjustments[0] = roundness
    tf = pill.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = text
    p.font.name = FONT_MAIN
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.color.rgb = text_color
    p.alignment = align
    return pill

def add_conclusion_card(slide, left, top, width, height, title="KẾT LUẬN", runs=None, bg_color=COLOR_GOLD_BG, border_color=COLOR_GOLD):
    """
    Creates the signature 'KẾT LUẬN' container from Example_Slides.pptx
    with glowing golden yellow border, gold header, and highlighted synthesis.
    """
    card = add_card(slide, left, top, width, height, bg_color=bg_color, border_color=border_color, border_width=Pt(1.8), roundness=0.035)
    tf = create_text_box(slide, left + 24, top + 14, width - 48, height - 28)
    p_h = tf.paragraphs[0]
    p_h.text = f"» {title} »"
    p_h.font.name = FONT_MAIN
    p_h.font.size = Pt(14)
    p_h.font.bold = True
    p_h.font.color.rgb = COLOR_GOLD
    p_h.space_after = Pt(6)

    if runs:
        add_para_runs(tf, runs, space_after=Pt(2))
    return card

def add_header(slide, subhead=None, title=None, subhead_color=COLOR_CYAN, title_color=COLOR_AMBER):
    """
    High-efficiency Top Header Bar for content slides (Slides 2 to 9):
    Maximizes vertical space for rich diagrammatic content inspired by Example_Slides.pptx:
      - Line 1 (y = 20 pt): Section capsule pill tag + Contest & Institutional badge logos
      - Line 2 (y = 52 pt): Main Slide Title (26-28pt bold uppercase in vibrant accent)
      - Line 3 (y = 96 pt): Thin horizontal divider rule (leaving y=110 to 780 for content!)
    """
    # 1. Left Section Category Pill
    if subhead:
        # Calculate width dynamically based on subhead length
        pill_w = max(260, min(560, len(subhead) * 8 + 36))
        add_pill(slide, 80, 20, pill_w, 26, f"» {subhead} »", bg_color=COLOR_CARD_ALT, border_color=subhead_color, text_color=subhead_color, font_size=10, bold=True, align=PP_ALIGN.CENTER, roundness=0.5)

    # 2. Right Contest & Institutional branding
    add_pill(slide, 1060, 20, 210, 26, "🏆 OLYMPIC KHỞI NGHIỆP 2026", bg_color=COLOR_CARD_ALT, border_color=COLOR_CARD_BORDER, text_color=COLOR_TEXT_MUTED, font_size=9.5, bold=True)

    neu_logo = "docs/assets/logo_neu_transparent.png"
    gl_emblem = "docs/assets/logo_greenlogix_badge.png"
    if os.path.exists(neu_logo):
        slide.shapes.add_picture(neu_logo, Pt(1282), Pt(16), Pt(32), Pt(32))
    if os.path.exists(gl_emblem):
        slide.shapes.add_picture(gl_emblem, Pt(1324), Pt(16), Pt(32), Pt(32))

    # 3. Main Slide Title (28pt Bold Uppercase, vibrant accent)
    if title:
        tf_title = create_text_box(slide, 80, 52, 1280, 38)
        add_para(tf_title, title, 26, True, title_color, space_after=Pt(0))

    # 4. Thin horizontal divider rule
    rule = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(80), Pt(94), Pt(1280), Pt(1.0))
    rule.fill.solid()
    rule.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule.line.fill.background()

def set_slide_notes(slide, slide_num):
    """Embeds verbatim voiceover presenter notes."""
    if slide_num in PRESENTER_NOTES:
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = PRESENTER_NOTES[slide_num]

def create_text_box(slide, left, top, width, height):
    txBox = slide.shapes.add_textbox(Pt(left), Pt(top), Pt(width), Pt(height))
    tf = txBox.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    return tf

def add_para(tf, text, font_size=14, bold=False, color=COLOR_TEXT_PRIMARY, align=PP_ALIGN.LEFT, space_after=Pt(4), space_before=Pt(0), italic=False):
    if len(tf.paragraphs) == 1 and tf.paragraphs[0].text == "":
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.text = text
    p.font.name = FONT_MAIN
    p.font.size = Pt(font_size)
    p.font.bold = bold
    p.font.italic = italic
    p.font.color.rgb = color
    p.alignment = align
    p.space_after = space_after
    p.space_before = space_before
    return p

def add_para_runs(tf, runs, align=PP_ALIGN.LEFT, space_after=Pt(4), space_before=Pt(0)):
    """runs = [(text, size, bold, color, italic), ...]"""
    if len(tf.paragraphs) == 1 and tf.paragraphs[0].text == "":
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.alignment = align
    p.space_after = space_after
    p.space_before = space_before
    for text, size, bold, color, italic in runs:
        run = p.add_run()
        run.text = text
        run.font.name = FONT_MAIN
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color
    return p


# -----------------------------------------------------------------------------
# Slide Builders (1 to 10)
# -----------------------------------------------------------------------------

def build_slide_1_cover(prs):
    """Slide 1: Cover / Hero Intro (Matching Example_Slides Slide 1 & 12 layout)"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="amber", bottom_right="cyan", top_left="emerald")
    set_slide_notes(slide, 1)

    # Top Header Banner
    add_pill(slide, 430, 28, 580, 38, "🏆 VÒNG 1: Ý TƯỞNG — OLYMPIC KHỞI NGHIỆP 2026", bg_color=COLOR_CARD, border_color=COLOR_CYAN, text_color=COLOR_TEXT_PRIMARY, font_size=12.5)
    tx_host = create_text_box(slide, 430, 72, 580, 20)
    add_para(tx_host, "Đơn vị tổ chức: Trường ĐH Kinh tế Quốc dân (NEU) & Trung tâm CICN", 11, False, COLOR_TEXT_MUTED, PP_ALIGN.CENTER)

    neu_logo = "docs/assets/logo_neu_transparent.png"
    gl_emblem = "docs/assets/logo_greenlogix_badge.png"
    if os.path.exists(neu_logo):
        slide.shapes.add_picture(neu_logo, Pt(360), Pt(24), Pt(46), Pt(46))
    if os.path.exists(gl_emblem):
        slide.shapes.add_picture(gl_emblem, Pt(1028), Pt(24), Pt(46), Pt(46))

    # Left Smartphone Mockup Showcase (Driver App PWA)
    mockup_path = "docs/assets/app_screenshots/driver_phone_mockup.png"
    if os.path.exists(mockup_path):
        slide.shapes.add_picture(mockup_path, Pt(80), Pt(112), Pt(300), Pt(645))

    # Right Hero Container Card
    right_x = 410
    right_w = 950
    add_card(slide, right_x, 112, right_w, 445, bg_color=COLOR_CARD, border_color=COLOR_CYAN, border_width=Pt(1.6), roundness=0.03)

    tf_hero = create_text_box(slide, right_x + 40, 132, right_w - 80, 405)
    add_para(tf_hero, "NỀN TẢNG ĐIỀU HÀNH VẬN TẢI XANH THÔNG MINH · CARGOX ENGINE", 11.5, True, COLOR_EMERALD, space_after=Pt(6))
    add_para_runs(tf_hero, [
        ("GREEN", 48, True, COLOR_TEXT_PRIMARY, False),
        ("LOGIX", 48, True, COLOR_EMERALD, False)
    ], space_after=Pt(10))

    # 3-line punchy slogan (Amber, Emerald, Cyan)
    add_para(tf_hero, "TỐI ƯU VẬN CHUYỂN", 32, True, COLOR_TEXT_PRIMARY, space_after=Pt(3))
    add_para(tf_hero, "TIẾT KIỆM CHI PHÍ", 32, True, COLOR_EMERALD, space_after=Pt(3))
    add_para(tf_hero, "KIẾN TẠO TƯƠNG LAI XANH", 32, True, COLOR_CYAN, space_after=Pt(12))

    add_para(tf_hero, "Phần mềm tối ưu tuyến đường vận tải đô thị & đo lường phát thải CO₂ theo chuẩn quốc tế", 15, False, COLOR_TEXT_SECONDARY, space_after=Pt(14))

    # Live MVP Pill
    add_pill(slide, right_x + 40, 430, 320, 38, "● LIVE DEMO: ecomiles.w9.nu", bg_color=COLOR_EMERALD_BG, border_color=COLOR_EMERALD, text_color=COLOR_TEXT_PRIMARY, font_size=13)

    # Team Member Capsules
    member_capsules = [
        ("Nguyễn Thu Thuỷ", "International Biz"),
        ("Phạm Quốc Thanh", "Tech/AI"),
        ("Nguyễn N. K. Phương", "ESG"),
        ("Nguyễn Hồng Phúc", "Finance"),
        ("Lê Thị Hoàng Ngân", "E-commerce")
    ]
    cap_x = right_x + 40
    cap_y = 485
    cap_w = 150
    cap_gap = 12
    for idx, (c_name, c_sub) in enumerate(member_capsules):
        cx = cap_x + idx * (cap_w + cap_gap)
        add_pill(slide, cx, cap_y, cap_w, 28, f"{c_name}", bg_color=COLOR_CARD_ALT, border_color=COLOR_CYAN, text_color=COLOR_TEXT_PRIMARY, font_size=9.5)

    # Bottom 3 Highlight Cards (under hero card)
    b_y = 575
    b_card_w = 300
    b_gap = 25

    # Box 1: Team
    add_card(slide, right_x, b_y, b_card_w, 180, bg_color=COLOR_CARD_ALT, border_color=COLOR_CYAN, border_width=Pt(1.4))
    tf_b1 = create_text_box(slide, right_x + 18, b_y + 14, b_card_w - 36, 152)
    add_para(tf_b1, "» ĐỘI THI ĐA NGÀNH »", 11, True, COLOR_CYAN, space_after=Pt(4))
    add_para(tf_b1, "5 thành viên liên ngành", 14, True, COLOR_TEXT_PRIMARY, space_after=Pt(6))
    add_para_runs(tf_b1, [
        ("UEH · IU-VNU · FTU2 · FPT · DUT\n", 11.5, False, COLOR_TEXT_SECONDARY, False),
        ("★ Đang bổ sung thành viên ĐH Kinh tế Quốc dân (NEU) trước 12/09 theo đúng điều lệ.", 10.5, True, COLOR_AMBER, False)
    ])

    # Box 2: Validation
    add_card(slide, right_x + b_card_w + b_gap, b_y, b_card_w, 180, bg_color=COLOR_CARD_ALT, border_color=COLOR_EMERALD, border_width=Pt(1.4))
    tf_b2 = create_text_box(slide, right_x + b_card_w + b_gap + 18, b_y + 14, b_card_w - 36, 152)
    add_para(tf_b2, "» THỰC NGHIỆM ĐÃ XÁC THỰC »", 11, True, COLOR_EMERALD, space_after=Pt(4))
    add_para(tf_b2, "80 đơn hàng trên 10 xe", 14, True, COLOR_TEXT_PRIMARY, space_after=Pt(6))
    add_para_runs(tf_b2, [
        ("Cắt giảm ", 11.5, False, COLOR_TEXT_SECONDARY, False),
        ("142,8 kg CO₂", 11.5, True, COLOR_EMERALD, False),
        (", rút ngắn ", 11.5, False, COLOR_TEXT_SECONDARY, False),
        ("80–90% thời gian", 11.5, True, COLOR_CYAN, False),
        (" điều phối và triệt tiêu ", 11.5, False, COLOR_TEXT_SECONDARY, False),
        ("30% xe chạy rỗng", 11.5, True, COLOR_EMERALD, False),
        (" chiều về.", 11.5, False, COLOR_TEXT_SECONDARY, False)
    ])

    # Box 3: ESG Standards
    add_card(slide, right_x + 2 * (b_card_w + b_gap), b_y, b_card_w, 180, bg_color=COLOR_CARD_ALT, border_color=COLOR_AMBER, border_width=Pt(1.4))
    tf_b3 = create_text_box(slide, right_x + 2 * (b_card_w + b_gap) + 18, b_y + 14, b_card_w - 36, 152)
    add_para(tf_b3, "» CHUẨN HÓA QUỐC TẾ »", 11, True, COLOR_AMBER, space_after=Pt(4))
    add_para(tf_b3, "GLEC Scope 3 & ISO 14064", 14, True, COLOR_TEXT_PRIMARY, space_after=Pt(6))
    add_para_runs(tf_b3, [
        ("Tự động hóa kiểm kê carbon sẵn sàng phục vụ ", 11.5, False, COLOR_TEXT_SECONDARY, False),
        ("Nghị định 06/2022/NĐ-CP", 11.5, True, COLOR_AMBER, False),
        (" và đáp ứng tiêu chuẩn báo cáo bền vững ", 11.5, False, COLOR_TEXT_SECONDARY, False),
        ("ESG / CBAM Châu Âu", 11.5, True, COLOR_GOLD, False),
        (".", 11.5, False, COLOR_TEXT_SECONDARY, False)
    ])


def build_slide_2_problem(prs):
    """Slide 2: Problem / Pain Points (Styled with Example_Slides Cards & Golden Conclusion)"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="amber", bottom_right="cyan", top_left="emerald")
    add_header(slide, subhead="VẤN ĐỀ THỰC TIỄN · NGHỊCH LÝ KÉP CỦA LOGISTICS ĐÔ THỊ VIỆT NAM", title="MỖI NGÀY, HÀNG NGHÌN CHUYẾN XE… CHẠY RỖNG", subhead_color=COLOR_CYAN, title_color=COLOR_AMBER)
    set_slide_notes(slide, 2)

    # 3 Large Metric Cards with vibrant glowing borders (Height maximized: 420pt)
    card_w = 400
    gap = 40
    start_x = 80
    c_y = 120
    c_h = 425

    # Card 1: 17% GDP
    add_card(slide, start_x, c_y, card_w, c_h, bg_color=COLOR_CARD, border_color=COLOR_RED, border_width=Pt(1.6))
    tf1 = create_text_box(slide, start_x + 24, c_y + 24, card_w - 48, c_h - 48)
    add_para(tf1, "» CHI PHÍ LOGISTICS VIỆT NAM »", 11.5, True, COLOR_RED, space_after=Pt(10))
    add_para(tf1, "17%", 68, True, COLOR_RED, space_after=Pt(6))
    add_para(tf1, "GDP dành cho chi phí vận tải & logistics", 17, True, COLOR_TEXT_PRIMARY, space_after=Pt(14))
    add_para_runs(tf1, [
        ("• ", 13, True, COLOR_RED, False),
        ("Gấp rưỡi mức bình quân thế giới ", 13.5, True, COLOR_TEXT_PRIMARY, False),
        ("(thế giới chỉ khoảng 10–12% GDP).\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Làm suy giảm mạnh ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("năng lực cạnh tranh quốc gia", 13.5, True, COLOR_AMBER, False),
        (" của hàng hoá xuất khẩu.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Gánh nặng đè nặng lên ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("34.000+ SME vận tải", 13.5, True, COLOR_CYAN, False),
        (" thiếu công cụ số hóa điều phối.", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ])

    # Card 2: 80% CO2
    add_card(slide, start_x + card_w + gap, c_y, card_w, c_h, bg_color=COLOR_CARD, border_color=COLOR_AMBER, border_width=Pt(1.6))
    tf2 = create_text_box(slide, start_x + card_w + gap + 24, c_y + 24, card_w - 48, c_h - 48)
    add_para(tf2, "» PHÁT THẢI GIAO THÔNG ĐÔ THỊ »", 11.5, True, COLOR_AMBER, space_after=Pt(10))
    add_para(tf2, "80%", 68, True, COLOR_AMBER, space_after=Pt(6))
    add_para(tf2, "phát thải CO₂ giao thông đến từ đường bộ", 17, True, COLOR_TEXT_PRIMARY, space_after=Pt(14))
    add_para_runs(tf2, [
        ("• Là tác nhân hàng đầu gây ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("ô nhiễm không khí & bụi mịn PM2.5", 13.5, True, COLOR_TEXT_PRIMARY, False),
        (" tại các đô thị lớn.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Sức ép pháp lý bắt buộc từ ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("Nghị định 06/2022/NĐ-CP", 13.5, True, COLOR_AMBER, False),
        (" và cam kết COP26 Net Zero 2050.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Doanh nghiệp ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("mù mờ dữ liệu phát thải Scope 3", 13.5, True, COLOR_RED, False),
        (", đối mặt rào cản thuế carbon CBAM.", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ])

    # Card 3: 30-35% Empty Return Trips
    add_card(slide, start_x + 2 * (card_w + gap), c_y, card_w, c_h, bg_color=COLOR_CARD, border_color=COLOR_CYAN, border_width=Pt(1.6))
    tf3 = create_text_box(slide, start_x + 2 * (card_w + gap) + 24, c_y + 24, card_w - 48, c_h - 48)
    add_para(tf3, "» LÃNG PHÍ HIỆU SUẤT ĐỘI XE »", 11.5, True, COLOR_CYAN, space_after=Pt(10))
    add_para(tf3, "30–35%", 68, True, COLOR_CYAN, space_after=Pt(6))
    add_para(tf3, "tỷ lệ xe tải chạy rỗng chiều về hiện nay", 17, True, COLOR_TEXT_PRIMARY, space_after=Pt(14))
    add_para_runs(tf3, [
        ("• Cứ ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("3 chuyến xe giao hàng thì 1 chuyến về không", 13.5, True, COLOR_TEXT_PRIMARY, False),
        (" do thiếu công cụ ghép đơn ngược chiều.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Lãng phí ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("hàng nghìn tỷ đồng nhiên liệu", 13.5, True, COLOR_AMBER, False),
        (" và hao mòn phương tiện mỗi năm.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Gia tăng ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("ùn tắc giao thông giờ cao điểm", 13.5, True, COLOR_RED, False),
        (" khi xe di chuyển lòng vòng không mục đích.", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ])

    # Bottom Signature Conclusion Card (Example_Slides style with glowing gold border)
    add_conclusion_card(slide, 80, 565, 1280, 145, title="KẾT LUẬN & SỨ MỆNH", runs=[
        ("EcoMiles sinh ra để giải quyết triệt để bài toán này: ", 15, False, COLOR_TEXT_PRIMARY, False),
        ("Tự động sắp tuyến (Smart VRP)", 15.5, True, COLOR_EMERALD, False),
        (" — ", 15, False, COLOR_TEXT_PRIMARY, False),
        ("Ghép đơn chiều về thông minh", 15.5, True, COLOR_CYAN, False),
        (" — ", 15, False, COLOR_TEXT_PRIMARY, False),
        ("Tự động đo lường & xuất báo cáo CO₂ chuẩn quốc tế (GLEC / GHG Protocol Scope 3)", 15.5, True, COLOR_GOLD, False),
        (", tất cả trên một nền tảng điện toán đám mây duy nhất.", 15, False, COLOR_TEXT_PRIMARY, False)
    ])


def build_slide_3_team(prs):
    """Slide 3: Team / Đội Ngũ Dự Thi (Glowing avatars + NEU addition banner)"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="cyan", bottom_right="emerald", top_left="amber")
    add_header(slide, subhead="ĐỘI THI DỰ THI · 5 THÀNH VIÊN ĐA NGÀNH", title="ĐỘI NGŨ ECOMILES: SỨC MẠNH LIÊN NGÀNH", subhead_color=COLOR_EMERALD, title_color=COLOR_CYAN)
    set_slide_notes(slide, 3)

    team_data = [
        {"id": "thuy", "name": "Nguyễn Thu Thuỷ", "role": "Kinh doanh Quốc tế", "focus": "Quản trị KDQT & Chiến lược", "school": "ĐH Kinh tế Quốc dân (NEU)", "avatar": ".build/team_avatars/thuy_avatar.png", "border": COLOR_EMERALD},
        {"id": "thanh", "name": "Phạm Quốc Thanh", "role": "Công nghệ", "focus": "CTO & Hệ thống AI / OSRM", "school": "IU - VNU-HCM (KT & TC)", "avatar": ".build/team_avatars/thanh_avatar.png", "border": COLOR_CYAN},
        {"id": "phuong", "name": "Nguyễn N. Khánh Phương", "role": "Kinh doanh", "focus": "Nghiên cứu Thị trường & ESG", "school": "FTU CS2 (Marketing & KD)", "avatar": ".build/team_avatars/phuong_avatar.png", "border": COLOR_AMBER},
        {"id": "phuc", "name": "Nguyễn Hồng Phúc", "role": "Tài chính", "focus": "Kế hoạch Vốn & Kiểm kê CO₂", "school": "FPT Hà Nội (Quản trị KD)", "avatar": ".build/team_avatars/phuc_avatar.png", "border": COLOR_GOLD},
        {"id": "ngan", "name": "Lê Thị Hoàng Ngân", "role": "TMĐT", "focus": "Thương Mại ĐT & Kênh Số", "school": "ĐH Kinh tế Quốc dân (NEU)", "avatar": ".build/team_avatars/ngan_avatar.png", "border": COLOR_CYAN}
    ]

    card_w = 236
    gap = 25
    start_x = 80
    c_y = 120
    c_h = 465

    for idx, m in enumerate(team_data):
        cur_x = start_x + idx * (card_w + gap)
        add_card(slide, cur_x, c_y, card_w, c_h, bg_color=COLOR_CARD, border_color=m["border"], border_width=Pt(1.5))

        avatar_w = 138
        avatar_x = cur_x + (card_w - avatar_w) / 2
        avatar_y = c_y + 26
        if os.path.exists(m["avatar"]):
            slide.shapes.add_picture(m["avatar"], Pt(avatar_x), Pt(avatar_y), Pt(avatar_w), Pt(avatar_w))

        # Index pill
        add_pill(slide, avatar_x + avatar_w - 32, avatar_y + avatar_w - 28, 40, 24, f"0{idx+1}", bg_color=COLOR_CARD_ALT, border_color=m["border"], text_color=m["border"], font_size=11)

        # Member Info
        tf_m = create_text_box(slide, cur_x + 12, c_y + 185, card_w - 24, 210)
        add_para(tf_m, m["name"], 17, True, COLOR_TEXT_PRIMARY, PP_ALIGN.CENTER, space_after=Pt(4))
        add_para(tf_m, m["role"], 13.5, True, m["border"], PP_ALIGN.CENTER, space_after=Pt(8))
        add_para(tf_m, m["focus"], 12, False, COLOR_TEXT_SECONDARY, PP_ALIGN.CENTER, space_after=Pt(14))

        # University Badge Pill
        add_pill(slide, cur_x + 16, c_y + 405, card_w - 32, 36, m["school"], bg_color=COLOR_CARD_ALT, border_color=COLOR_CARD_BORDER, text_color=COLOR_CYAN, font_size=11, roundness=0.4)

    # Bottom NEU Member Addition Banner (MANDATORY per SO 2026 rules)
    add_card(slide, 80, 605, 1280, 105, bg_color=COLOR_AMBER_BG, border_color=COLOR_AMBER, border_width=Pt(1.6))
    tf_neu = create_text_box(slide, 105, 618, 1230, 80)
    add_para(tf_neu, "★ ĐIỀU LỆ OLYMPIC KHỞI NGHIỆP 2026 (SO 2026):", 13, True, COLOR_AMBER, space_after=Pt(4))
    add_para_runs(tf_neu, [
        ("Đội ngũ sáng lập chính thức kết nạp ", 14, False, COLOR_TEXT_PRIMARY, False),
        ("2 thành viên nòng cốt từ Đại học Kinh tế Quốc dân (NEU)", 14, True, COLOR_GOLD, False),
        (": Nguyễn Thu Thuỷ (Quản trị Kinh doanh Quốc tế) & Lê Thị Hoàng Ngân (Thương Mại Điện Tử) đáp ứng xuất sắc điều lệ cuộc thi.", 14, False, COLOR_TEXT_PRIMARY, False)
    ])


def build_slide_4_vision(prs):
    """Slide 4: Purpose & Vision / Ý Nghĩa Dự Án"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="emerald", bottom_right="cyan", top_left="amber")
    add_header(slide, subhead="Ý NGHĨA DỰ ÁN & TẦM NHÌN CHIẾN LƯỢC", title="LOGISTICS XANH: CON ĐƯỜNG TẤT YẾU CHO DOANH NGHIỆP VIỆT NAM", subhead_color=COLOR_CYAN, title_color=COLOR_EMERALD)
    set_slide_notes(slide, 4)

    # Central Manifesto Quote Card
    add_card(slide, 80, 120, 1280, 240, bg_color=COLOR_EMERALD_BG, border_color=COLOR_EMERALD, border_width=Pt(1.8), roundness=0.03)

    tf_quote = create_text_box(slide, 120, 140, 1200, 200)
    add_para(tf_quote, "“ Logistics xanh không phải một lựa chọn xa xỉ — mà là con đường tất yếu để doanh nghiệp Việt Nam phát triển bền vững. ”", 25, True, COLOR_TEXT_PRIMARY, space_after=Pt(14), italic=True)

    rule_q = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(120), Pt(220), Pt(1200), Pt(1))
    rule_q.fill.solid()
    rule_q.fill.fore_color.rgb = COLOR_EMERALD
    rule_q.line.fill.background()

    tf_vis = create_text_box(slide, 120, 235, 1200, 105)
    add_para(tf_vis, "» TẦM NHÌN CHIẾN LƯỢC ĐẾN NĂM 2030 »", 13, True, COLOR_EMERALD, space_after=Pt(6))
    add_para_runs(tf_vis, [
        ("Trở thành ", 17, False, COLOR_TEXT_PRIMARY, False),
        ("nền tảng quản trị vận tải và phát thải hàng đầu", 17, True, COLOR_EMERALD, False),
        (" cho doanh nghiệp logistics vừa và nhỏ (SME) tại Việt Nam, đóng góp cụ thể và có thể đo đếm được vào mục tiêu ", 17, False, COLOR_TEXT_PRIMARY, False),
        ("Net Zero 2050", 17, True, COLOR_CYAN, False),
        (" của quốc gia.", 17, False, COLOR_TEXT_PRIMARY, False)
    ])

    # 3 Strategic Alignment Pillar Cards
    c_w = 400
    gap = 40
    start_x = 80
    r_y = 380
    r_h = 330

    # Pillar 1: Net Zero 2050
    add_card(slide, start_x, r_y, c_w, r_h, bg_color=COLOR_CARD, border_color=COLOR_CYAN, border_width=Pt(1.5))
    tf_p1 = create_text_box(slide, start_x + 24, r_y + 22, c_w - 48, r_h - 44)
    add_para(tf_p1, "» CAM KẾT COP26 & NET ZERO 2050 »", 12, True, COLOR_CYAN, space_after=Pt(8))
    add_para(tf_p1, "Tiên phong chuyển đổi xanh", 19, True, COLOR_TEXT_PRIMARY, space_after=Pt(12))
    add_para_runs(tf_p1, [
        ("• Việt Nam cam kết đạt ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("phát thải ròng bằng 0 vào năm 2050", 13.5, True, COLOR_CYAN, False),
        (".\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• EcoMiles giúp xanh hóa ngay trên ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("đội xe hiện hữu", 13.5, True, COLOR_EMERALD, False),
        (" mà không cần vốn đầu tư xe điện đắt đỏ.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Biến từng chuyến đi thành ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("ki-lô-mét xanh thực chất", 13.5, True, COLOR_TEXT_PRIMARY, False),
        (".", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ])

    # Pillar 2: Decree 06/2022/ND-CP
    add_card(slide, start_x + c_w + gap, r_y, c_w, r_h, bg_color=COLOR_CARD, border_color=COLOR_AMBER, border_width=Pt(1.5))
    tf_p2 = create_text_box(slide, start_x + c_w + gap + 24, r_y + 22, c_w - 48, r_h - 44)
    add_para(tf_p2, "» NGHỊ ĐỊNH 06/2022/NĐ-CP »", 12, True, COLOR_AMBER, space_after=Pt(8))
    add_para(tf_p2, "Tuân thủ lộ trình kiểm kê KNK", 19, True, COLOR_TEXT_PRIMARY, space_after=Pt(12))
    add_para_runs(tf_p2, [
        ("• Bắt buộc ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("kiểm kê khí nhà kính bắt buộc từ năm 2026", 13.5, True, COLOR_AMBER, False),
        (" đối với doanh nghiệp phát thải.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Cung cấp báo cáo phát thải CO₂ tự động chuẩn ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("GLEC Scope 3", 13.5, True, COLOR_GOLD, False),
        (" cho thanh tra môi trường.\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Giảm ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("100% thời gian tính toán thủ công", 13.5, True, COLOR_EMERALD, False),
        (".", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ])

    # Pillar 3: SME Empowerment
    add_card(slide, start_x + 2 * (c_w + gap), r_y, c_w, r_h, bg_color=COLOR_CARD, border_color=COLOR_EMERALD, border_width=Pt(1.5))
    tf_p3 = create_text_box(slide, start_x + 2 * (c_w + gap) + 24, r_y + 22, c_w - 48, r_h - 44)
    add_para(tf_p3, "» ĐỒNG HÀNH CÙNG 34.000+ SME »", 12, True, COLOR_EMERALD, space_after=Pt(8))
    add_para(tf_p3, "Bình đẳng hóa công nghệ logistics", 19, True, COLOR_TEXT_PRIMARY, space_after=Pt(12))
    add_para_runs(tf_p3, [
        ("• Mang thuật toán điều phối thông minh (VRP) đến SME với ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("chi phí SaaS cực thấp", 13.5, True, COLOR_EMERALD, False),
        (".\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Giúp SME đủ chuẩn tham gia ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("chuỗi cung ứng xuất khẩu xanh toàn cầu", 13.5, True, COLOR_CYAN, False),
        (" (ESG, CBAM).\n", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("• Nâng cao năng lực cạnh tranh bền vững cho nền kinh tế.", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ])


def build_slide_5_product(prs):
    """Slide 5: Product Features / Giải Pháp Sản Phẩm"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="amber", bottom_right="emerald", top_left="cyan")
    add_header(slide, subhead="GIẢI PHÁP CÔNG NGHỆ · NỀN TẢNG CARGOX ENGINE", title="4 CÁCH ECOMILES GIÚP VẬN HÀNH HIỆU QUẢ HƠN", subhead_color=COLOR_CYAN, title_color=COLOR_AMBER)
    set_slide_notes(slide, 5)

    card_w = 625
    card_h = 280
    gap_x = 30
    gap_y = 25
    x1 = 80
    x2 = x1 + card_w + gap_x
    y1 = 120
    y2 = y1 + card_h + gap_y

    features = [
        {
            "pos": (x1, y1),
            "num": "01",
            "tag": "THUẬT TOÁN TỐI ƯU TUYẾN ĐƯỜNG",
            "title": "Tự động sắp tuyến (Smart VRP)",
            "color": COLOR_EMERALD,
            "body": "Gom điểm giao gần nhau theo cụm địa lý, tự động cân đối tải trọng xe và khung giờ nhận hàng. Tạo lộ trình giao tối ưu cho toàn bộ đội xe chỉ trong 3–5 giây thay vì mất 2–3 tiếng làm thủ công trên Excel.",
            "kpi": "⚡ Rút ngắn 80–90% thời gian điều phối mỗi sáng"
        },
        {
            "pos": (x2, y1),
            "num": "02",
            "tag": "ĐIỀU HÀNH THỜI GIAN THỰC & GIỜ CẤM TẢI",
            "title": "Chủ động tránh giờ cấm tải (QĐ 23/2018/QĐ-UBND)",
            "color": COLOR_CYAN,
            "body": "Tích hợp bản đồ OSRM mạng lưới đường bộ thực tế và bộ lọc giờ cấm tải nội đô TP.HCM. Cảnh báo lệch tuyến tức thì và tự động định tuyến lại để tránh các điểm nghẽn và khung giờ cấm xe tải.",
            "kpi": "⏱ Nâng tỷ lệ giao hàng đúng hẹn lên tới 98,8%"
        },
        {
            "pos": (x1, y2),
            "num": "03",
            "tag": "MẠNG LƯỚI VẬN TẢI HAI CHIỀU",
            "title": "Ghép đơn chiều về (Backhaul Matching)",
            "color": COLOR_AMBER,
            "body": "Thuật toán tìm kiếm và ghép đơn hàng chiều về dọc theo hành trình xe quay lại kho xuất phát. Tận dụng tối đa tải trọng trống của phương tiện, biến chuyến xe chạy rỗng thành doanh thu thặng dư.",
            "kpi": "📉 Giảm tỷ lệ xe chạy rỗng từ 30–35% xuống chỉ còn 5–10%"
        },
        {
            "pos": (x2, y2),
            "num": "04",
            "tag": "KIỂM KÊ CARBON MINH BẠCH",
            "title": "Đo lường & báo cáo CO₂ (Carbon Accounting)",
            "color": COLOR_EMERALD,
            "body": "Tự động tính toán lượng phát thải khí nhà kính dựa trên ki-lô-mét thực tế và tải trọng theo chuẩn quốc tế GLEC Framework và GHG Protocol Scope 3. Xuất chứng chỉ báo cáo ESG chỉ với 1 cú nhấp chuột.",
            "kpi": "🌱 Chuẩn hóa quốc tế GLEC / GHG Protocol Scope 3"
        }
    ]

    for f in features:
        fx, fy = f["pos"]
        add_card(slide, fx, fy, card_w, card_h, bg_color=COLOR_CARD, border_color=f["color"], border_width=Pt(1.5))

        tf_f = create_text_box(slide, fx + 28, fy + 20, card_w - 56, card_h - 40)
        add_para_runs(tf_f, [
            (f"» {f['num']} / {f['tag']} »", 12, True, f["color"], False)
        ], space_after=Pt(6))
        add_para(tf_f, f["title"], 21, True, COLOR_TEXT_PRIMARY, space_after=Pt(10))
        add_para(tf_f, f["body"], 14, False, COLOR_TEXT_SECONDARY, space_after=Pt(14))

        add_pill(slide, fx + 28, fy + 224, card_w - 56, 36, f["kpi"], bg_color=COLOR_CARD_ALT, border_color=f["color"], text_color=COLOR_TEXT_PRIMARY, font_size=12, align=PP_ALIGN.LEFT, roundness=0.4)


def build_slide_6_demo(prs):
    """
    Slide 6: Product Demo / Giao Diện Điều Hành Trực Quan
    High-impact showcase: Large desktop console featuring genuine OSRM road paths
    alongside refined mobile driver smartphone mockup.
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="cyan", bottom_right="emerald", top_left="amber")
    add_header(slide, subhead="SẢN PHẨM THỰC TẾ · THUẬT TOÁN ĐỊNH TUYẾN ĐƯỜNG BỘ OSRM THỜI GIAN THỰC", title="GIAO DIỆN QUẢN LÝ TRỰC QUAN & ỨNG DỤNG DI ĐỘNG TÀI XẾ", subhead_color=COLOR_EMERALD, title_color=COLOR_CYAN)
    set_slide_notes(slide, 6)

    # Massive Desktop Console Showcase (w = 930 pt, h = 585 pt)
    desk_x = 80
    desk_y = 118
    desk_w = 930
    desk_h = 585

    add_card(slide, desk_x, desk_y, desk_w, desk_h, bg_color=COLOR_CARD_ALT, border_color=COLOR_CYAN, border_width=Pt(1.6), roundness=0.025)

    # Window Chrome Title Bar
    tf_win = create_text_box(slide, desk_x + 18, desk_y + 8, desk_w - 36, 24)
    add_para_runs(tf_win, [
        ("● ● ●   ", 11, True, COLOR_AMBER, False),
        ("console.ecomiles.vn/dispatcher — Bản đồ điều phối & mạng lưới đường bộ OSRM thực tế TP.HCM (80 đơn / 5 tuyến)", 11.5, False, COLOR_TEXT_MUTED, False)
    ])

    dispatcher_img = "docs/assets/app_screenshots/dispatcher_real_latest.png"
    if os.path.exists(dispatcher_img):
        slide.shapes.add_picture(dispatcher_img, Pt(desk_x + 6), Pt(desk_y + 36), Pt(desk_w - 12), Pt(desk_h - 44))

    # Right Column: Smartphone Driver Mockup & System Feature Badges
    right_x = 1035
    right_w = 325

    phone_mockup = "docs/assets/app_screenshots/driver_phone_mockup.png"
    if os.path.exists(phone_mockup):
        slide.shapes.add_picture(phone_mockup, Pt(right_x + 32), Pt(desk_y + 4), Pt(260), Pt(565))

    # Floating Callout Badges over the screen edges
    add_pill(slide, desk_x + 16, desk_y + desk_h - 52, 430, 36, "⚡ OSRM Road Pathfinding: 5/5 xe theo đường phố thực", bg_color=COLOR_CARD_ALT, border_color=COLOR_EMERALD, text_color=COLOR_EMERALD, font_size=11.5)
    add_pill(slide, desk_x + 460, desk_y + desk_h - 52, 450, 36, "🌱 -88.31% CO₂ TTW so với kịch bản chạy thủ công", bg_color=COLOR_CARD_ALT, border_color=COLOR_CYAN, text_color=COLOR_CYAN, font_size=11.5)


def build_slide_7_advantage(prs):
    """Slide 7: Competitive Advantage / So Sánh Hiệu Quả"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="emerald", bottom_right="cyan", top_left="amber")
    add_header(slide, subhead="LỢI THẾ CẠNH TRANH VƯỢT TRỘI · BẢO VỆ THỊ PHẦN", title="SO SÁNH HIỆU QUẢ: CÁCH LÀM CŨ VS. ECOMILES", subhead_color=COLOR_EMERALD, title_color=COLOR_AMBER)
    set_slide_notes(slide, 7)

    t_x = 80
    t_y = 120
    t_w = 1280
    t_h = 585
    add_card(slide, t_x, t_y, t_w, t_h, bg_color=COLOR_CARD, border_color=COLOR_CARD_BORDER, border_width=Pt(1.2))

    col3_x = t_x + 780
    col3_w = 480
    add_card(slide, col3_x, t_y + 10, col3_w, t_h - 75, bg_color=COLOR_EMERALD_BG, border_color=COLOR_EMERALD, border_width=Pt(1.8))

    header_y = t_y + 18
    tf_h1 = create_text_box(slide, t_x + 24, header_y, 280, 36)
    add_para(tf_h1, "» TIÊU CHÍ ĐÁNH GIÁ »", 13.5, True, COLOR_TEXT_MUTED)

    tf_h2 = create_text_box(slide, t_x + 320, header_y, 440, 36)
    add_para(tf_h2, "CÁCH LÀM CŨ (THỦ CÔNG / ERP TRUYỀN THỐNG)", 13.5, True, COLOR_RED)

    tf_h3 = create_text_box(slide, col3_x + 24, header_y, col3_w - 48, 36)
    add_para(tf_h3, "★ NỀN TẢNG ECOMILES (VƯỢT TRỘI)", 15, True, COLOR_EMERALD)

    rule_h = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(t_x + 16), Pt(header_y + 38), Pt(t_w - 32), Pt(1.2))
    rule_h.fill.solid()
    rule_h.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule_h.line.fill.background()

    rows_data = [
        {
            "criterion": "Tỷ lệ xe chạy rỗng chiều về",
            "old_stat": "✗  30–35% xe chạy rỗng sau khi giao",
            "old_desc": "Hoàn toàn không có công cụ tìm đơn ngược lại, lãng phí nhiên liệu và khấu hao xe.",
            "new_stat": "✓  Ghép đơn chiều về, giảm còn 5–10%",
            "new_desc": "Thuật toán tự động tìm và gợi ý đơn hàng chiều về, tận dụng tối đa tải trọng phương tiện."
        },
        {
            "criterion": "Đo lường phát thải CO₂",
            "old_stat": "✗  Không có dữ liệu / không tính được",
            "old_desc": "Hoàn toàn mù mờ về phát thải, không thể cung cấp báo cáo ESG và kiểm kê khí nhà kính.",
            "new_stat": "✓  Tự động theo chuẩn GLEC / GHG Protocol Scope 3",
            "new_desc": "Tự động tính toán lượng phát thải từng chuyến xe, xuất chứng chỉ báo cáo chuẩn quốc tế."
        },
        {
            "criterion": "Thời gian điều phối mỗi ngày",
            "old_stat": "✗  Thủ công trên bảng tính, mất 2–4 giờ",
            "old_desc": "Điều phối viên phải ngồi ghép tuyến trên Excel mỗi sáng, dễ sai sót và chồng chéo.",
            "new_stat": "✓  Tự động hoá OSRM, rút ngắn 80–90% thời gian",
            "new_desc": "Thuật toán VRP tự động phân bổ tuyến và giao việc xuống điện thoại tài xế trong vài giây."
        },
        {
            "criterion": "Cách nhập dữ liệu & triển khai",
            "old_stat": "✗  Cần tích hợp hệ thống ERP phức tạp",
            "old_desc": "Tốn kém hàng trăm triệu đồng, mất 3–6 tháng triển khai, rào cản quá lớn cho SME.",
            "new_stat": "✓  Đơn giản qua Excel / Google Sheets",
            "new_desc": "Sẵn sàng sử dụng ngay sau 5 phút tải file đơn hàng, giao diện thân thiện không cần đào tạo."
        }
    ]

    row_start_y = header_y + 48
    row_h = 104

    for r_idx, r in enumerate(rows_data):
        cur_ry = row_start_y + r_idx * row_h

        tf_c = create_text_box(slide, t_x + 24, cur_ry + 12, 280, row_h - 24)
        add_para(tf_c, r["criterion"], 14.5, True, COLOR_TEXT_PRIMARY)

        tf_o = create_text_box(slide, t_x + 320, cur_ry + 12, 440, row_h - 24)
        add_para(tf_o, r["old_stat"], 14, True, COLOR_RED, space_after=Pt(3))
        add_para(tf_o, r["old_desc"], 12, False, COLOR_TEXT_MUTED)

        tf_n = create_text_box(slide, col3_x + 24, cur_ry + 12, col3_w - 48, row_h - 24)
        add_para(tf_n, r["new_stat"], 14.5, True, COLOR_EMERALD, space_after=Pt(3))
        add_para(tf_n, r["new_desc"], 12.5, False, COLOR_TEXT_PRIMARY)

        if r_idx < 3:
            rule_r = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(t_x + 24), Pt(cur_ry + row_h), Pt(t_w - 48), Pt(0.8))
            rule_r.fill.solid()
            rule_r.fill.fore_color.rgb = COLOR_CARD_BORDER
            rule_r.line.fill.background()

    bot_y = t_y + t_h - 58
    tf_sum = create_text_box(slide, t_x + 24, bot_y, t_w - 48, 44)
    add_para_runs(tf_sum, [
        ("🏆 KẾT LUẬN: ", 13.5, True, COLOR_GOLD, False),
        ("Khác với cách làm cũ vốn thủ công và không đo lường được phát thải, EcoMiles là ", 13.5, False, COLOR_TEXT_SECONDARY, False),
        ("nền tảng duy nhất kết hợp đồng thời tối ưu vận hành và đo lường CO₂ minh bạch", 13.5, True, COLOR_CYAN, False),
        (", truy vết đến từng đơn hàng cụ thể.", 13.5, False, COLOR_TEXT_SECONDARY, False)
    ], align=PP_ALIGN.CENTER)


def build_slide_8_financials(prs):
    """Slide 8: Feasibility & Financials / Tính Khả Thi & Tài Chính"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="amber", bottom_right="cyan", top_left="emerald")
    add_header(slide, subhead="TÍNH KHẢ THI & KẾ HOẠCH TÀI CHÍNH · B2B SAAS", title="KHÔNG CHỈ LÀ Ý TƯỞNG — ĐÃ CÓ SẢN PHẨM THẬT & TÀI CHÍNH VỮNG CHẮC", subhead_color=COLOR_CYAN, title_color=COLOR_EMERALD)
    set_slide_notes(slide, 8)

    add_pill(slide, 80, 118, 460, 36, "● MVP ĐANG HOẠT ĐỘNG — ecomiles.w9.nu", bg_color=COLOR_EMERALD_BG, border_color=COLOR_EMERALD, text_color=COLOR_TEXT_PRIMARY, font_size=12.5)

    card_w = 305
    gap = 20
    start_x = 80
    f_y = 166
    f_h = 395

    fin_cards = [
        {
            "tag": "THỜI GIAN HOÀN VỐN",
            "stat": "1,68 năm",
            "title": "Thời gian hoàn vốn",
            "color": COLOR_EMERALD,
            "desc": "Thu hồi toàn bộ chi phí đầu tư ban đầu trong chưa đầy 20 tháng nhờ chi phí SaaS tinh gọn và tối ưu chi phí hạ tầng Cloud.",
            "note": "Điểm hòa vốn đạt được vào Quý 3 năm thứ 2 vận hành."
        },
        {
            "tag": "TỶ SUẤT NỘI BỘ",
            "stat": "28%",
            "title": "IRR — tỷ suất hoàn vốn nội bộ",
            "color": COLOR_EMERALD,
            "desc": "Tỷ suất hoàn vốn nội bộ hấp dẫn vượt trội so với lãi suất vốn vay ngân hàng (9–10%) và chi phí cơ hội bình quân (WACC 12%).",
            "note": "Dự phóng 5 năm với kịch bản tăng trưởng thận trọng."
        },
        {
            "tag": "GIÁ TRỊ HIỆN TẠI RÒNG",
            "stat": "185,5 tr ₫",
            "title": "NPV — giá trị hiện tại ròng",
            "color": COLOR_CYAN,
            "desc": "Giá trị hiện tại ròng dương khẳng định dự án có tính khả thi kinh tế độc lập ngay cả khi áp dụng tỷ lệ chiết khấu thận trọng 12%/năm.",
            "note": "Khẳng định hiệu quả đầu tư an toàn cho các quỹ khởi nghiệp."
        },
        {
            "tag": "QUY MÔ PILOT",
            "stat": "3–5 DN",
            "title": "Quy mô pilot (30–100 xe)",
            "color": COLOR_AMBER,
            "desc": "Giai đoạn thử nghiệm thực địa tập trung vào 3–5 doanh nghiệp vận tải đô thị tại TP.HCM để tinh chỉnh thuật toán và xác thực chỉ số.",
            "note": "Cam kết kiểm chứng thực tế trước khi thương mại hóa rộng rãi."
        }
    ]

    for idx, fc in enumerate(fin_cards):
        cx = start_x + idx * (card_w + gap)
        add_card(slide, cx, f_y, card_w, f_h, bg_color=COLOR_CARD, border_color=fc["color"], border_width=Pt(1.5))

        tf_fc = create_text_box(slide, cx + 22, f_y + 20, card_w - 44, f_h - 40)
        add_para(tf_fc, f"» {fc['tag']} »", 11.5, True, fc["color"], space_after=Pt(10))
        add_para(tf_fc, fc["stat"], 50, True, fc["color"], space_after=Pt(8))
        add_para(tf_fc, fc["title"], 16, True, COLOR_TEXT_PRIMARY, space_after=Pt(12))
        add_para(tf_fc, fc["desc"], 13, False, COLOR_TEXT_SECONDARY, space_after=Pt(14))
        add_para(tf_fc, f"• {fc['note']}", 11.5, False, COLOR_TEXT_MUTED)

    add_conclusion_card(slide, 80, 580, 1280, 130, title="ĐIỂM HÒA VỐN & HIỆU QUẢ TÀI CHÍNH", runs=[
        ("📈 LỢI NHUẬN TRƯỚC THUẾ CHUYỂN DƯƠNG TỪ NĂM THỨ 2 VẬN HÀNH: ", 15, True, COLOR_GOLD, False),
        ("Mô hình định giá SaaS theo quy mô đầu xe (", 14, False, COLOR_TEXT_PRIMARY, False),
        ("300.000 – 500.000 ₫/xe/tháng", 14, True, COLOR_EMERALD, False),
        (") mang lại dòng tiền đăng ký định kỳ ổn định, ", 14, False, COLOR_TEXT_PRIMARY, False),
        ("chi phí biên gần như bằng 0", 14, True, COLOR_CYAN, False),
        (" khi mở rộng quy mô đội xe, giúp EcoMiles vừa khả thi vừa bền vững.", 14, False, COLOR_TEXT_PRIMARY, False)
    ])


def build_slide_9_esg(prs):
    """Slide 9: Community & ESG Message / Thông Điệp Cộng Đồng & ESG"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="cyan", bottom_right="emerald", top_left="amber")
    add_header(slide, subhead="THÔNG ĐIỆP CỘNG ĐỒNG & TÁC ĐỘNG BỀN VỮNG ESG", title="THÔNG ĐIỆP CỘNG ĐỒNG: KHI KINH TẾ VÀ MÔI TRƯỜNG SONG HÀNH", subhead_color=COLOR_EMERALD, title_color=COLOR_CYAN)
    set_slide_notes(slide, 9)

    add_card(slide, 80, 118, 1280, 120, bg_color=COLOR_CARD_ALT, border_color=COLOR_EMERALD, border_width=Pt(1.5))
    tf_poem = create_text_box(slide, 110, 128, 1220, 100)
    add_para(tf_poem, "“ Một tuyến đường không chạy rỗng. ”", 20, True, COLOR_TEXT_PRIMARY, space_after=Pt(3))
    add_para(tf_poem, "“ Một đơn hàng được ghép tối ưu. ”", 20, True, COLOR_EMERALD, space_after=Pt(3))
    add_para(tf_poem, "“ Một hơi thở trong lành hơn cho thành phố. ”", 20, True, COLOR_CYAN)

    pillars = [
        {
            "tag": "ENVIRONMENT — MÔI TRƯỜNG",
            "title": "Xanh hóa phương tiện hiện hữu",
            "metric": "Giảm 20–30% CO₂",
            "color": COLOR_EMERALD,
            "points": [
                "Cắt giảm trực tiếp lượng phát thải khí nhà kính mà không cần chờ đợi thay thế toàn bộ sang xe điện đắt đỏ.",
                "Giảm áp lực ùn tắc giao thông đô thị giờ cao điểm bằng cách tối ưu hóa các cung đường ngắn nhất.",
                "Đóng góp trực tiếp vào mục tiêu Net Zero 2050 và Kế hoạch hành động tăng trưởng xanh của TP.HCM."
            ]
        },
        {
            "tag": "SOCIAL — XÃ HỘI & CON NGƯỜI",
            "title": "Nâng cao thu nhập người tài xế",
            "metric": "+15–20% thu nhập",
            "color": COLOR_CYAN,
            "points": [
                "Giảm thời gian lái xe căng thẳng lòng vòng tìm đơn, giúp người tài xế làm việc an toàn và nhẹ nhàng hơn.",
                "Tăng thu nhập thực nhận thông qua cơ chế chia sẻ doanh thu từ các đơn hàng ghép chiều về.",
                "Bảo vệ sức khỏe hô hấp cho cộng đồng đô thị nhờ giảm thiểu bụi mịn PM2.5 từ khói xe tải."
            ]
        },
        {
            "tag": "GOVERNANCE — QUẢN TRỊ MINH BẠCH",
            "title": "Số hóa & Tuân thủ pháp lý",
            "metric": "100% tuân thủ NĐ 06",
            "color": COLOR_AMBER,
            "points": [
                "Minh bạch hóa toàn bộ dữ liệu tiêu thụ nhiên liệu và phát thải carbon đến từng chuyến hàng cụ thể.",
                "Sẵn sàng đáp ứng đầy đủ lộ trình kiểm kê khí nhà kính bắt buộc theo Nghị định 06/2022/NĐ-CP.",
                "Tạo lợi thế cạnh tranh bền vững để doanh nghiệp Việt Nam tự tin tham gia chuỗi cung ứng toàn cầu."
            ]
        }
    ]

    card_w = 400
    gap = 40
    start_x = 80
    esg_y = 258
    esg_h = 425

    for idx, p in enumerate(pillars):
        px = start_x + idx * (card_w + gap)
        add_card(slide, px, esg_y, card_w, esg_h, bg_color=COLOR_CARD, border_color=p["color"], border_width=Pt(1.5))

        tf_p = create_text_box(slide, px + 24, esg_y + 20, card_w - 48, 120)
        add_para(tf_p, f"» {p['tag']} »", 11.5, True, p["color"], space_after=Pt(6))
        add_para(tf_p, p["metric"], 32, True, p["color"], space_after=Pt(6))
        add_para(tf_p, p["title"], 17, True, COLOR_TEXT_PRIMARY, space_after=Pt(10))

        rule_p = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(px + 20), Pt(esg_y + 130), Pt(card_w - 40), Pt(1))
        rule_p.fill.solid()
        rule_p.fill.fore_color.rgb = COLOR_CARD_BORDER
        rule_p.line.fill.background()

        tf_pts = create_text_box(slide, px + 24, esg_y + 146, card_w - 48, 260)
        for pt in p["points"]:
            add_para(tf_pts, f"• {pt}", 13, False, COLOR_TEXT_SECONDARY, space_after=Pt(10))

    tf_motto = create_text_box(slide, 80, 695, 1280, 25)
    add_para(tf_motto, "“ Nơi phát triển kinh tế và bảo vệ môi trường có thể song hành trên từng ki-lô-mét vận chuyển. ”", 14.5, True, COLOR_EMERALD, PP_ALIGN.CENTER, italic=True)


def build_slide_10_outro(prs):
    """Slide 10: Outro & Call to Action (Styled after Example_Slides Slide 12)"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_solid_background(slide)
    add_ambient_glows(slide, top_right="amber", bottom_right="cyan", top_left="emerald")
    set_slide_notes(slide, 10)

    add_card(slide, 140, 42, 1160, 725, bg_color=COLOR_CARD, border_color=COLOR_CYAN, border_width=Pt(1.6), roundness=0.04)

    tf_top = create_text_box(slide, 180, 62, 1080, 45)
    add_para(tf_top, "CUỘC THI OLYMPIC KHỞI NGHIỆP 2026 (SO 2026)", 13.5, True, COLOR_CYAN, PP_ALIGN.CENTER, space_after=Pt(2))
    add_para(tf_top, "Đơn vị tổ chức: Trường Đại học Kinh tế Quốc dân (NEU) & Trung tâm Đổi mới sáng tạo và Hướng nghiệp (CICN)", 11.5, False, COLOR_TEXT_MUTED, PP_ALIGN.CENTER)

    neu_logo = "docs/assets/logo_neu_transparent.png"
    gl_emblem = "docs/assets/logo_greenlogix_badge.png"
    if os.path.exists(neu_logo):
        slide.shapes.add_picture(neu_logo, Pt(670), Pt(118), Pt(58), Pt(58))
    if os.path.exists(gl_emblem):
        slide.shapes.add_picture(gl_emblem, Pt(745), Pt(118), Pt(58), Pt(58))

    tf_brand = create_text_box(slide, 180, 188, 1080, 55)
    add_para_runs(tf_brand, [
        ("GREEN", 46, True, COLOR_TEXT_PRIMARY, False),
        ("LOGIX", 46, True, COLOR_EMERALD, False)
    ], align=PP_ALIGN.CENTER)

    tf_ty = create_text_box(slide, 180, 242, 1080, 105)
    add_para(tf_ty, "THANK YOU", 76, True, COLOR_GOLD, PP_ALIGN.CENTER)

    tf_slogan = create_text_box(slide, 180, 356, 1080, 35)
    add_para(tf_slogan, "TỐI ƯU VẬN CHUYỂN · TIẾT KIỆM CHI PHÍ · KIẾN TẠO TƯƠNG LAI XANH", 18, True, COLOR_EMERALD, PP_ALIGN.CENTER)

    add_pill(slide, 430, 405, 580, 52, "🚀 TRẢI NGHIỆM TRỰC TIẾP DEMO: ecomiles.w9.nu", bg_color=COLOR_EMERALD_BG, border_color=COLOR_EMERALD, text_color=COLOR_TEXT_PRIMARY, font_size=16)

    tf_thanks = create_text_box(slide, 180, 478, 1080, 35)
    add_para(tf_thanks, "“ Cảm ơn Ban Giám Khảo và Quý Khán Giả đã dành thời gian đồng hành cùng EcoMiles! ”", 16.5, True, COLOR_CYAN, PP_ALIGN.CENTER, italic=True)

    rule_outro = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Pt(220), Pt(528), Pt(1000), Pt(1))
    rule_outro.fill.solid()
    rule_outro.fill.fore_color.rgb = COLOR_CARD_BORDER
    rule_outro.line.fill.background()

    tf_cred = create_text_box(slide, 180, 545, 1080, 140)
    add_para(tf_cred, "» ĐỘI NGŨ SÁNG LẬP DỰ THI ECOMILES »", 12, True, COLOR_TEXT_PRIMARY, PP_ALIGN.CENTER, space_after=Pt(6))
    add_para(tf_cred, "Nguyễn Thu Thuỷ (NEU)  ·  Phạm Quốc Thanh (IU - VNU)  ·  Nguyễn N. Khánh Phương (FTU2)\nNguyễn Hồng Phúc (FPT Hà Nội)  ·  Lê Thị Hoàng Ngân (NEU)", 13, False, COLOR_TEXT_SECONDARY, PP_ALIGN.CENTER, space_after=Pt(8))
    add_para(tf_cred, "EcoMiles — Nền tảng điều hành vận tải xanh & đo lường phát thải carbon đô thị · Powered by CargoX Engine", 10.5, False, COLOR_TEXT_DIM, PP_ALIGN.CENTER)



# -----------------------------------------------------------------------------
# Main Execution Pipeline
# -----------------------------------------------------------------------------
def main():
    print("=" * 70)
    print("EcoMiles Pitch Deck Programmatic Builder (SO 2026)")
    print("=" * 70)

    print("\n[Step 1/4] Pre-processing assets with Pillow...")
    pre_process_assets()

    print("\n[Step 2/4] Building 1440x810 pt High-Tech presentation...")
    prs = Presentation()
    prs.slide_width = Pt(1440)
    prs.slide_height = Pt(810)

    builders = [
        ("Slide 1: Cover", build_slide_1_cover),
        ("Slide 2: Problem", build_slide_2_problem),
        ("Slide 3: Team", build_slide_3_team),
        ("Slide 4: Vision & Purpose", build_slide_4_vision),
        ("Slide 5: Product Features", build_slide_5_product),
        ("Slide 6: Product Demo", build_slide_6_demo),
        ("Slide 7: Competitive Advantage", build_slide_7_advantage),
        ("Slide 8: Feasibility & Financials", build_slide_8_financials),
        ("Slide 9: Community & ESG", build_slide_9_esg),
        ("Slide 10: Outro & Attribution", build_slide_10_outro),
    ]

    for idx, (title, builder) in enumerate(builders, start=1):
        print(f"  -> Generating {title}...")
        builder(prs)

    output_pptx = "slides/EcoMiles_Pitch_Deck_SO2026.pptx"
    os.makedirs(os.path.dirname(output_pptx), exist_ok=True)
    prs.save(output_pptx)
    print(f"\nSuccessfully generated presentation: {output_pptx}")
    print(f"File size: {os.path.getsize(output_pptx):,} bytes")

    print("\n[Step 3/4] Exporting to PDF via headless LibreOffice...")
    cmd_pdf = ["soffice", "--headless", "--convert-to", "pdf", output_pptx, "--outdir", "slides"]
    res_pdf = subprocess.run(cmd_pdf, capture_output=True, text=True)
    if res_pdf.returncode != 0:
        print(f"Error during PDF export: {res_pdf.stderr}")
    else:
        output_pdf = "slides/EcoMiles_Pitch_Deck_SO2026.pdf"
        print(f"Successfully converted to PDF: {output_pdf}")
        if os.path.exists(output_pdf):
            print(f"PDF file size: {os.path.getsize(output_pdf):,} bytes")

    print("\n[Step 4/4] Rendering high-res slide preview images with pdftoppm...")
    os.makedirs("slides/previews", exist_ok=True)
    output_pdf = "slides/EcoMiles_Pitch_Deck_SO2026.pdf"
    if os.path.exists(output_pdf):
        cmd_png = ["pdftoppm", "-png", "-r", "150", output_pdf, "slides/previews/slide"]
        res_png = subprocess.run(cmd_png, capture_output=True, text=True)
        if res_png.returncode == 0:
            print("Successfully rendered PNG preview images:")
            for p in sorted(Path("slides/previews").glob("slide-*.png")):
                print(f"  - {p} ({p.stat().st_size:,} bytes)")
        else:
            print(f"pdftoppm error: {res_png.stderr}")

    print("\n" + "=" * 70)
    print("EcoMiles Deck Generation Complete!")
    print("=" * 70)

if __name__ == "__main__":
    main()
