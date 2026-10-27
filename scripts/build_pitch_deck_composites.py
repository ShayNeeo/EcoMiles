#!/usr/bin/env python3
"""
Builds 4 Slide-Ready 16:9 (1920x1080) Multi-Device Framed Composites
from the 16 Retina Desktop (1440x900), Tablet (768x1024), and Mobile (390x844)
Pitch Deck Screenshots in docs/pitch-deck-screenshots/.
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


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


def paste_device_frame(
    canvas: Image.Image,
    img_path: str,
    box: tuple[int, int, int, int],
    device_kind: str,
    badge_text: str,
) -> None:
    """
    Draws a realistic hardware bezel (Desktop MacBook/Monitor, iPad Tablet, or iPhone Mobile)
    with soft drop-shadow, rounded screen corners, and a clean top label pill.
    """
    x, y, w, h = box
    src = Image.open(img_path).convert("RGBA")

    # Fit/crop image to target aspect ratio from top
    target_ratio = w / h
    src_w, src_h = src.size
    src_ratio = src_w / src_h
    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        src = src.crop((left, 0, left + new_w, src_h))
    else:
        new_h = int(src_w / target_ratio)
        src = src.crop((0, 0, src_w, min(src_h, new_h)))

    screen = src.resize((w, h), Image.Resampling.LANCZOS)

    bezel = 10 if device_kind == "desktop" else (12 if device_kind == "tablet" else 10)
    radius = 16 if device_kind == "desktop" else (24 if device_kind == "tablet" else 28)
    outer_w, outer_h = w + bezel * 2, h + bezel * 2 + (24 if device_kind == "desktop" else 0)

    # Drop shadow
    shadow = Image.new("RGBA", (outer_w + 48, outer_h + 48), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [24, 28, 24 + outer_w, 28 + outer_h],
        radius=radius + 6,
        fill=(9, 14, 24, 150),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow, (x - bezel - 24, y - bezel - 24))

    # Hardware chassis
    chassis = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(chassis)
    cd.rounded_rectangle(
        [0, 0, outer_w - 1, outer_h - 1],
        radius=radius + 4,
        fill=(24, 32, 46, 255),
        outline=(75, 85, 105, 255),
        width=2,
    )

    if device_kind == "desktop":
        # Browser/MacBook top bar with 3 window dots
        cd.rounded_rectangle(
            [bezel, bezel, bezel + w - 1, bezel + 24],
            radius=8,
            fill=(31, 41, 55, 255),
        )
        cd.ellipse([bezel + 10, bezel + 7, bezel + 18, bezel + 15], fill=(239, 68, 68, 255))
        cd.ellipse([bezel + 24, bezel + 7, bezel + 32, bezel + 15], fill=(245, 158, 11, 255))
        cd.ellipse([bezel + 38, bezel + 7, bezel + 46, bezel + 15], fill=(16, 185, 129, 255))
        f_url = get_font(False, 11)
        cd.text((bezel + 60, bezel + 5), "https://ecomiles.pages.dev", fill=(156, 163, 175, 255), font=f_url)
        screen_mask = rounded_mask((w, h), radius - 4)
        chassis.paste(screen, (bezel, bezel + 24), screen_mask)
    else:
        screen_mask = rounded_mask((w, h), radius - 4)
        chassis.paste(screen, (bezel, bezel), screen_mask)
        if device_kind == "mobile":
            # Subtle speaker notch pill
            notch_w = 64
            cd.rounded_rectangle(
                [(outer_w - notch_w) // 2, bezel + 5, (outer_w + notch_w) // 2, bezel + 12],
                radius=4,
                fill=(17, 24, 39, 230),
            )

    canvas.alpha_composite(chassis, (x - bezel, y - bezel))

    # Top floating badge label
    if badge_text:
        d = ImageDraw.Draw(canvas)
        f_badge = get_font(True, 13)
        tb = d.textbbox((0, 0), badge_text, font=f_badge)
        bw = (tb[2] - tb[0]) + 24
        bh = 28
        bx = x
        by = y - bezel - 38
        d.rounded_rectangle(
            [bx, by, bx + bw, by + bh],
            radius=8,
            fill=(20, 83, 45, 245),
            outline=(214, 246, 90, 220),
            width=2,
        )
        d.text((bx + 12, by + 5), badge_text, fill=(214, 246, 90, 255), font=f_badge)


def make_slide_canvas(title: str, subtitle: str, kpi_pill: str) -> Image.Image:
    canvas = Image.new("RGBA", (1920, 1080), (243, 244, 239, 255))
    d = ImageDraw.Draw(canvas)

    # Top enterprise header bar
    d.rectangle([0, 0, 1920, 104], fill=(17, 24, 39, 255))
    d.rectangle([0, 101, 1920, 104], fill=(214, 246, 90, 255))

    # Brand mark box
    d.rounded_rectangle([40, 22, 98, 80], radius=14, fill=(20, 83, 45, 255))
    d.text((52, 34), "EM", fill=(214, 246, 90, 255), font=get_font(True, 24))

    d.text((116, 22), title, fill=(255, 255, 255, 255), font=get_font(True, 26))
    d.text((116, 58), subtitle, fill=(209, 213, 219, 255), font=get_font(False, 16))

    # Right KPI pill
    f_kpi = get_font(True, 15)
    tb = d.textbbox((0, 0), kpi_pill, font=f_kpi)
    kw = (tb[2] - tb[0]) + 32
    kx = 1920 - 40 - kw
    d.rounded_rectangle([kx, 28, 1920 - 40, 76], radius=12, fill=(20, 83, 45, 255), outline=(214, 246, 90, 255), width=2)
    d.text((kx + 16, 41), kpi_pill, fill=(214, 246, 90, 255), font=f_kpi)

    # Bottom footer bar
    d.rectangle([0, 1042, 1920, 1080], fill=(17, 24, 39, 255))
    d.text(
        (40, 1051),
        "EcoMiles B2B Urban Logistics Optimization & ISO 14083 / GLEC v3.2 Carbon Accounting  ·  https://ecomiles.pages.dev",
        fill=(156, 163, 175, 255),
        font=get_font(False, 14),
    )
    d.text(
        (1470, 1051),
        "Zero-Cost Map Stack ($0 API) · Multi-Agent Verified",
        fill=(214, 246, 90, 255),
        font=get_font(True, 14),
    )
    return canvas


def build_all_composites() -> list[str]:
    built = []

    # 17. SLIDE HERO TRIO: Desktop (1440x900) + Tablet (768x1024) + Mobile (390x844)
    c1 = make_slide_canvas(
        "EcoMiles Multi-Device B2B Logistics Ecosystem (Desktop · Tablet · Mobile)",
        "Đồng bộ từ Trung tâm Điều phối Doanh nghiệp (Desktop) đến Máy tính bảng Kho vận (Tablet) và Điện thoại Tài xế (Mobile)",
        "-34.9% Km Lộ Trình  ·  -39.2% CO₂e  ·  0 Vi Phạm QĐ 23/2018",
    )
    paste_device_frame(
        c1,
        os.path.join(SHOT_DIR, "01_desktop_b2b_tms_fleet_overview.png"),
        (48, 175, 1020, 638),
        "desktop",
        "1. DESKTOP (1440x900) · Trung Tâm Điều Phối Đội Xe B2B CRM/TMS",
    )
    paste_device_frame(
        c1,
        os.path.join(SHOT_DIR, "11_tablet_maps_live_navigate_cockpit.png"),
        (1110, 175, 456, 608),
        "tablet",
        "2. TABLET (768x1024) · Bản Đồ Xe Tải (/maps)",
    )
    paste_device_frame(
        c1,
        os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"),
        (1605, 175, 270, 584),
        "mobile",
        "3. MOBILE (390x844) · App Tài Xế",
    )
    # Bottom summary cards on Slide 17
    d1 = ImageDraw.Draw(c1)
    cards = [
        ("VAI TRÒ 1 · ĐIỀU PHỐI VIÊN (DESKTOP)", "Nạp .XLSX 120 đơn · Tối ưu 7 xe trong 31ms · Xuất Báo cáo ESG 3 Sheet"),
        ("BẢN ĐỒ XE TẢI OPENTRUCK (TABLET)", "Hiển thị Vùng Cấm Tải QĐ 23/2018 (Đỏ), Giới hạn Cầu 13T & Dẫn đường Follow-Truck"),
        ("ỨNG DỤNG TÀI XẾ 2 CHẾ ĐỘ (MOBILE)", "Chặng Giữa (>500kg) + Chặng Cuối (<=500kg) khóa Waypoints Google Maps $0"),
    ]
    for idx, (ct, cs) in enumerate(cards):
        cx = 48 + idx * 616
        d1.rounded_rectangle([cx, 860, cx + 592, 1020], radius=14, fill=(255, 255, 255, 255), outline=(216, 207, 189, 255), width=2)
        d1.text((cx + 20, 880), ct, fill=(20, 83, 45, 255), font=get_font(True, 16))
        d1.text((cx + 20, 915), cs, fill=(55, 65, 81, 255), font=get_font(False, 14))
    p1 = os.path.join(SHOT_DIR, "17_slide_composite_all_devices_hero_trio.png")
    c1.convert("RGB").save(p1, quality=95)
    built.append(p1)

    # 18. SLIDE FIELD EXECUTION: Tablet /maps + 3 Mobile Views (Middle-Mile, Last-Mile, Live Nav)
    c2 = make_slide_canvas(
        "Field Execution Suite: Tablet Cockpit & Mobile 2-Tier Driver Navigation ($0 Map API)",
        "Tài xế Chặng Giữa (>500kg) né vùng cấm QĐ 23/2018 trên /maps · Tài xế Chặng Cuối (<=500kg) mở Google Maps khóa Waypoints",
        "100% Đường Phố Thật OSRM  ·  $0 Chi Phí Bản Đồ",
    )
    paste_device_frame(
        c2,
        os.path.join(SHOT_DIR, "11_tablet_maps_live_navigate_cockpit.png"),
        (52, 175, 585, 780),
        "tablet",
        "TABLET COCKPIT (768x1024) · Chế Độ Bắt Đầu (Follow-Truck)",
    )
    paste_device_frame(
        c2,
        os.path.join(SHOT_DIR, "13_mobile_driver_middle_mile_hud.png"),
        (690, 175, 360, 780),
        "mobile",
        "MOBILE 1 · Chặng Giữa (>500kg)",
    )
    paste_device_frame(
        c2,
        os.path.join(SHOT_DIR, "14_mobile_driver_last_mile_gmaps_waypoints.png"),
        (1100, 175, 360, 780),
        "mobile",
        "MOBILE 2 · Chặng Cuối (<=500kg)",
    )
    paste_device_frame(
        c2,
        os.path.join(SHOT_DIR, "15_mobile_maps_live_follow_truck_nav.png"),
        (1510, 175, 360, 780),
        "mobile",
        "MOBILE 3 · Dẫn Đường Trực Tiếp",
    )
    p2 = os.path.join(SHOT_DIR, "18_slide_composite_driver_and_maps_mobile_tablet.png")
    c2.convert("RGB").save(p2, quality=95)
    built.append(p2)

    # 19. SLIDE ALGORITHMIC PROOF: Desktop EVSIM Dual Simulator + Desktop /maps Overview + Tablet Benchmark
    c3 = make_slide_canvas(
        "Algorithmic Proof: EVSIM Dual Simulator & HCMC QĐ 23/2018 Street-Network Verification",
        "So sánh song song 100% cùng hàm khoảng cách OSRM: Điều phối Thủ công (374.4 km, 28 lỗi QĐ 23) vs EcoMiles (243.7 km, 0 lỗi)",
        "Chuẩn ISO 14083 / GLEC v3.2  ·  Tải Trọng Động GLX-HDT-v1",
    )
    paste_device_frame(
        c3,
        os.path.join(SHOT_DIR, "02_desktop_b2b_tms_evsim_dual_simulator.png"),
        (48, 175, 880, 550),
        "desktop",
        "1. DESKTOP · Buồng Kiểm Thử Đối Chứng 2 Bên EVSIM (374.4 km -> 243.7 km)",
    )
    paste_device_frame(
        c3,
        os.path.join(SHOT_DIR, "04_desktop_maps_overview_qd23_banned_zones.png"),
        (980, 175, 888, 550),
        "desktop",
        "2. DESKTOP · Bản Đồ Tổng Quan Vùng Cấm Tải QĐ 23/2018 & Giới Hạn Cầu 13T",
    )
    d3 = ImageDraw.Draw(c3)
    metrics_boxes = [
        ("BASELINE 1 · THEO THỨ TỰ ĐƠN (.XLSX)", "1,072.0 km · 255.48 kg CO₂e", "Chưa phân cụm quận/huyện (Worst-case)"),
        ("BASELINE 2 · ĐIỀU PHỐI THỦ CÔNG + GOOGLE MAPS", "374.4 km · 92.21 kg CO₂e · 28 lỗi QĐ 23", "Chia quận thủ công + chạy rỗng chiều về 32.8%"),
        ("THUẬT TOÁN ECOMILES (CARBON-AWARE ALNS)", "243.7 km (-34.9%) · 56.07 kg CO₂e (-39.2%)", "0 vi phạm QĐ 23/2018 · Ghép 21 đơn chiều về (2.7% rỗng)"),
    ]
    for idx, (mt, mv, ms) in enumerate(metrics_boxes):
        mx = 48 + idx * 616
        d3.rounded_rectangle([mx, 795, mx + 592, 1015], radius=14, fill=(255, 255, 255, 255), outline=(20, 83, 45, 255) if idx == 2 else (209, 213, 219, 255), width=3 if idx == 2 else 2)
        d3.text((mx + 22, 815), mt, fill=(20, 83, 45, 255) if idx == 2 else (107, 114, 128, 255), font=get_font(True, 15))
        d3.text((mx + 22, 855), mv, fill=(17, 24, 39, 255), font=get_font(True, 24))
        d3.text((mx + 22, 905), ms, fill=(75, 85, 99, 255), font=get_font(False, 15))
    p3 = os.path.join(SHOT_DIR, "19_slide_composite_dispatcher_and_evsim_benchmark.png")
    c3.convert("RGB").save(p3, quality=95)
    built.append(p3)

    # 20. SLIDE 4-ROLE ENTERPRISE ARCHITECTURE GRID (2x2 Desktop Quad)
    c4 = make_slide_canvas(
        "Role-Isolated B2B Enterprise Architecture: 4 Specialized Workspaces",
        "Mỗi vai trò có giao diện độc lập, phân quyền RBAC chặt chẽ và mã hóa Zero-Knowledge AES-256-GCM tuân thủ Nghị định 13/2023/NĐ-CP",
        "4 Vai Trò Độc Lập  ·  Zero-Knowledge AES-256-GCM",
    )
    quad = [
        ("01_desktop_b2b_tms_fleet_overview.png", (48, 165, 880, 390), "VAI TRÒ 1 (USER) · Điều Phối Viên Công Ty (B2B CRM/TMS + EVSIM)"),
        ("02_desktop_b2b_tms_evsim_dual_simulator.png", (992, 165, 880, 390), "VAI TRÒ 2 (TESTER) · Kiểm Định Viên Độc Lập (EVSIM Dual Simulator)"),
        ("06_desktop_driver_2tier_middle_and_last_mile.png", (48, 625, 880, 390), "VAI TRÒ 3 (DRIVER) · Tài Xế Giao Nhận 2 Chặng (Middle-Mile & Last-Mile)"),
        ("07_desktop_admin_zero_knowledge_audit.png", (992, 625, 880, 390), "VAI TRÒ 4 (ADMIN) · Giám Sát Hạ Tầng Zero-Knowledge (0% Quyền Giải Mã PII)"),
    ]
    for fname, qbox, qbadge in quad:
        paste_device_frame(c4, os.path.join(SHOT_DIR, fname), qbox, "desktop", qbadge)
    p4 = os.path.join(SHOT_DIR, "20_slide_composite_4role_enterprise_architecture.png")
    c4.convert("RGB").save(p4, quality=95)
    built.append(p4)

    # Sync all 20 PNGs to apps/landing/public/pitch-deck-screenshots/
    os.makedirs(PUBLIC_SHOT_DIR, exist_ok=True)
    for f in sorted(os.listdir(SHOT_DIR)):
        if f.endswith(".png"):
            shutil.copy2(os.path.join(SHOT_DIR, f), os.path.join(PUBLIC_SHOT_DIR, f))

    return built


if __name__ == "__main__":
    out = build_all_composites()
    for p in out:
        print(f"Built composite: {os.path.basename(p)} ({os.path.getsize(p) // 1024} KB)")
