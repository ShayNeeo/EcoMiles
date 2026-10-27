#!/usr/bin/env python3
"""
build_3min_demo_video.py
Renders the 3-Minute (180.0s, 1920x1080 Full HD) EcoMiles Product Walkthrough & Demo Video
with Screen-Studio-style Spring Zoom-per-Click, Cursor Gliding, Concentric Click-Ripple Indicators,
Live Moving Truck Map Frames, Lower-Third Callout Notes, Vietnamese Neural TTS (vi-VN-HoaiMyNeural),
Clean No-Voice Master for custom voice/music editing, SRT Subtitles, and Timestamped Script (MD + DOCX).
"""

import asyncio
import glob
import math
import os
import shutil
import subprocess
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = "/home/shayneeo/Downloads/Documents/Coding/RND_to_Startup"
CAPTURES_DIR = "/tmp/ecomiles_guide_captures"
OUTPUT_DIR = os.path.join(BASE_DIR, "docs")
VIDEO_OUT_DIR = os.path.join(BASE_DIR, "docs", "video")
PUBLIC_VIDEO_DIR = os.path.join(BASE_DIR, "apps", "landing", "public", "video")
TMP_AUDIO_DIR = "/tmp/ecomiles_video_audio"

os.makedirs(VIDEO_OUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_VIDEO_DIR, exist_ok=True)
os.makedirs(TMP_AUDIO_DIR, exist_ok=True)

FONT_BOLD_PATH = "/usr/share/fonts/noto/NotoSans-Bold.ttf"
FONT_REG_PATH = "/usr/share/fonts/noto/NotoSans-Regular.ttf"

FPS = 20
WIDTH = 1920
HEIGHT = 1080
TOTAL_DURATION_SEC = 180.0
TOTAL_FRAMES = int(TOTAL_DURATION_SEC * FPS)


def get_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD_PATH if bold else FONT_REG_PATH, size)


# =============================================================================
# 10 CHAPTERS FOR THE 3-MINUTE (180s) WALKTHROUGH VIDEO & VOICEOVER SCRIPT
# =============================================================================
CHAPTERS = [
    {
        "id": 1,
        "start_sec": 0.0,
        "end_sec": 18.0,
        "time_range_str": "00:00 – 00:18",
        "title": "CHƯƠNG 1: CỔNG ĐĂNG NHẬP NHANH 4 VAI TRÒ (FAST-LOGIN MVP GATE)",
        "note": "Điền sẵn Bearer Token, khóa KMS cách ly doanh nghiệp & mã PIN 0000 — Trải nghiệm 1 chạm không cần mật khẩu",
        "voice_vi": (
            "Chào mừng bạn đến với EcoMiles, hệ thống quản trị vận tải đô thị B2B và kiểm kê phát thải các-bon tự động. "
            "Ngay khi truy cập, Cổng đăng nhập nhanh bốn vai trò đã điền sẵn khóa xác thực A-P-I và tài khoản mẫu. "
            "Chỉ với một cú click vào vai trò Điều phối viên, hệ thống tự động kết nối máy chủ trong mười lăm mili-giây."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/01_fast_login_modal.png",
        "cursor_start": (960, 260),
        "click_target": (713, 503),
        "click_sec_offset": 4.5,
        "zoom_keyframes": [
            # (local_sec, zoom_factor, center_x, center_y)
            (0.0, 1.0, 960, 540),
            (3.5, 1.0, 960, 540),
            (5.2, 1.68, 713, 470),
            (11.0, 1.68, 713, 470),
            (13.0, 1.55, 1208, 470),
            (16.2, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 2,
        "start_sec": 18.0,
        "end_sec": 36.0,
        "time_range_str": "00:18 – 00:36",
        "title": "CHƯƠNG 2: QUẢN LÝ ĐIỀU PHỐI DOANH NGHIỆP (B2B CRM / TMS OVERVIEW)",
        "note": "Theo dõi 5 chỉ số KPI đội xe, tỷ lệ chạy rỗng 5.4%, +19 đơn ghép chiều về & chuyển nhanh sang App từng xe",
        "voice_vi": (
            "Tại không gian Quản lý điều phối doanh nghiệp của Chuỗi Lạnh Nam Việt, thanh điều hướng bên trái tách biệt sáu phân hệ nghiệp vụ. "
            "Dải năm chỉ số K-P-I trung tâm hiển thị rõ bảy xe đang hoạt động, giảm bốn mươi bốn phẩy một phần trăm tổng quãng đường, "
            "hạ tỷ lệ chạy rỗng từ ba mươi hai phẩy tám phần trăm xuống chỉ còn năm phẩy bốn phần trăm nhờ mười chín đơn hàng ghép chiều về."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/02_role1_crm_overview.png",
        "cursor_start": (520, 180),
        "click_target": (1110, 355),
        "click_sec_offset": 4.0,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (3.0, 1.0, 960, 540),
            (4.8, 1.65, 1180, 355),
            (10.5, 1.65, 1450, 355),
            (12.8, 1.60, 1520, 660),
            (16.2, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 3,
        "start_sec": 36.0,
        "end_sec": 54.0,
        "time_range_str": "00:36 – 00:54",
        "title": "CHƯƠNG 3: BÀN ĐIỀU PHỐI TUYẾN & NHẬT KÝ NÉ GIỜ CẤM QĐ 23/2018",
        "note": "Bản đồ đường bộ TP.HCM (OpenStreetMap + OSRM 60 FPS) + Tự động dời 28 đơn vi phạm giờ cấm 06–09h & 16–20h",
        "voice_vi": (
            "Chuyển sang phân hệ Điều phối và Thuật toán, khi bấm nút Chạy tối ưu và Phát hành xuống tài xế, "
            "thuật toán phân vùng cánh cung Gillett Miller và A-L-N-S lập tức chia bảy lộ trình không chồng chéo trên đường bộ Thành phố Hồ Chí Minh. "
            "Bảng nhật ký bên phải tự động dời hai mươi tám đơn vi phạm khung giờ cấm tải Quyết định hai mươi ba sang khung giờ hợp pháp."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/03_role1_routing_workbench_f*.png",
        "cursor_start": (312, 426),
        "click_target": (1576, 248),
        "click_sec_offset": 3.2,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (2.4, 1.0, 960, 540),
            (4.0, 1.68, 1420, 260),
            (7.5, 1.62, 820, 640),
            (12.5, 1.62, 1440, 640),
            (16.2, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 4,
        "start_sec": 54.0,
        "end_sec": 70.0,
        "time_range_str": "00:54 – 01:10",
        "title": "CHƯƠNG 4: ÁNH XẠ CỘT EXCEL TỰ ĐỘNG & CHE DỮ LIỆU CÁ NHÂN NĐ 13/2023",
        "note": "Tự động nhận diện tiêu đề cột bảng tính E-R-P bất kỳ & ẩn danh số điện thoại người nhận theo Nghị định 13",
        "voice_vi": (
            "Ở phân hệ Đơn hàng và Cột Excel, bộ giải mã thông minh tự động nhận diện mọi tên cột tiếng Việt hoặc tiếng Anh từ file E-R-P của doanh nghiệp. "
            "Chế độ bảo vệ dữ liệu cá nhân theo Nghị định mười ba tự động che số điện thoại và tên người nhận ngay trên giao diện."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/04_role1_excel_column_mapper.png",
        "cursor_start": (312, 485),
        "click_target": (1540, 240),
        "click_sec_offset": 3.5,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (2.8, 1.0, 960, 540),
            (4.3, 1.62, 1080, 320),
            (10.5, 1.62, 1080, 580),
            (14.2, 1.0, 960, 540),
            (16.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 5,
        "start_sec": 70.0,
        "end_sec": 88.0,
        "time_range_str": "01:10 – 01:28",
        "title": "CHƯƠNG 5: XUẤT BÁO CÁO KIỂM TOÁN ESG TỰ ĐỘNG (EXCEL 3 SHEET & PDF ISO 14083)",
        "note": "1 chạm xuất sổ cái Excel 3 Sheet (.XLS), CSV & Chứng thư PDF kèm mã băm SHA-256 chuẩn GLEC v3.2 / ISO 14083",
        "voice_vi": (
            "Tại mục Báo cáo E-S-G tự động, doanh nghiệp không còn mất hàng giờ nhập liệu thủ công. "
            "Chỉ với một cú click vào nút Xuất Báo Cáo Excel Ba Sheet, hệ thống lập tức đóng gói sổ cái phát thải C-O-2 theo chuẩn quốc tế I-S-O một bốn không tám ba "
            "và khung G-L-E-C ba chấm hai kèm chữ ký kiểm toán S-H-A hai năm sáu."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/05_role1_esg_report_export.png",
        "cursor_start": (312, 602),
        "click_target": (1230, 258),
        "click_sec_offset": 3.8,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (3.0, 1.0, 960, 540),
            (4.5, 1.72, 1380, 260),
            (10.0, 1.55, 1080, 560),
            (16.0, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 6,
        "start_sec": 88.0,
        "end_sec": 112.0,
        "time_range_str": "01:28 – 01:52",
        "title": "CHƯƠNG 6: MÔ PHỎNG ĐỐI CHỨNG 2 BÊN KIỂU EVSIM (BASELINE vs. ECOMILES v2.1)",
        "note": "Chạy song song 2 bản đồ TP.HCM thực tế: Bên trái (374.4 km, 28 lỗi QĐ 23) vs Bên phải EcoMiles (209.3 km, 0 lỗi, +19 đơn về)",
        "voice_vi": (
            "Tiếp theo là Buồng mô phỏng đối chứng hai bên kiểu E-V-S-I-M dành cho giám khảo và khách hàng kiểm thử. "
            "Khi nạp file Excel thực tế, hai bản đồ Thành phố Hồ Chí Minh chạy song song từ sáu giờ sáng đến hai mươi giờ tối. "
            "Bên trái là cách chia tuyến thủ công bị phạt hai mươi tám lỗi giờ cấm và chạy rỗng hơn ba mươi hai phần trăm. "
            "Bên phải, các xe tải EcoMiles bám sát đường bộ OpenStreetMap, ghép mười chín đơn hàng chiều về, tiết kiệm một trăm sáu mươi lăm ki-lô-mét và không có bất kỳ lỗi giờ cấm nào."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/06_role2_evsim_dual_f*.png",
        "cursor_start": (450, 70),
        "click_target": (1340, 560),
        "click_sec_offset": 5.0,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (4.0, 1.0, 960, 540),
            (6.0, 1.62, 580, 580),
            (12.0, 1.68, 1350, 580),
            (18.5, 1.55, 1350, 260),
            (22.0, 1.0, 960, 540),
            (24.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 7,
        "start_sec": 112.0,
        "end_sec": 130.0,
        "time_range_str": "01:52 – 02:10",
        "title": "CHƯƠNG 7: ỨNG DỤNG TÀI XẾ 2 CHẾ ĐỘ (CHẶNG GIỮA XE TẢI >500KG & CHẶNG CUỐI Ô TÔ ≤500KG)",
        "note": "Phân tách Chặng giữa (Xe tải >500kg: Khóa Google Maps, dùng Bản đồ Mở + GPX $0) và Chặng cuối (Ô tô ≤500kg: Khóa Waypoints $0)",
        "voice_vi": (
            "Chuyển sang Vai trò ba, Ứng dụng Tài xế được thiết kế hai chế độ dẫn đường hoàn toàn miễn phí A-P-I. "
            "Với xe tải chặng giữa trên năm trăm ki-lô-gam, hệ thống khóa Google Maps vì Google không có chế độ xe tải và đẩy xe vào đường cấm. "
            "Ngược lại, với ô tô van chặng cuối dưới năm trăm ki-lô-gam, hệ thống nhúng tọa độ trung gian Waypoints thẳng vào Google Maps miễn phí để ép đi đúng lộ trình tối ưu."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/08_role3_driver_middle_mile_f*.png",
        "cursor_start": (724, 377),
        "click_target": (723, 574),
        "click_sec_offset": 4.2,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (3.2, 1.0, 960, 540),
            (4.8, 1.68, 720, 520),
            (11.5, 1.65, 1180, 620),
            (16.0, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 8,
        "start_sec": 130.0,
        "end_sec": 148.0,
        "time_range_str": "02:10 – 02:28",
        "title": "CHƯƠNG 8: BẢN ĐỒ XE TẢI (/MAPS) — CHẾ ĐỘ 1: TỔNG QUAN & VÙNG CẤM TẢI QĐ 23/2018",
        "note": "Hiển thị trực quan 3 Vùng đỏ cấm tải nội đô TP.HCM, giới hạn tải trọng cầu (Cầu Bình Lợi ≤13T) & lý do chọn đường từng chặng",
        "voice_vi": (
            "Khi tài xế xe tải chặng giữa bấm Mở Bản Đồ Vùng Cấm xuyệt maps, chế độ Tổng quan hiển thị trực quan các vùng đỏ cấm tải theo Quyết định hai mươi ba tại lõi Quận một, Quận ba, Phú Nhuận và cửa ngõ sân bay. "
            "Tuyến đường màu xanh của EcoMiles vòng qua đường Trường Chinh và Cầu Bình Lợi cho phép mười ba tấn, kèm giải thích chi tiết lý do né đường cấm ở từng chặng."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/11_maps_overview_banned_zones.png",
        "cursor_start": (640, 280),
        "click_target": (330, 275),
        "click_sec_offset": 4.5,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (3.2, 1.0, 960, 540),
            (5.0, 1.68, 620, 660),
            (11.0, 1.65, 1460, 660),
            (16.0, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 9,
        "start_sec": 148.0,
        "end_sec": 166.0,
        "time_range_str": "02:28 – 02:46",
        "title": "CHƯƠNG 9: BẢN ĐỒ XE TẢI (/MAPS) — CHẾ ĐỘ 2: DẪN ĐƯỜNG TRỰC TIẾP (LIVE MOVING 'BẮT ĐẦU')",
        "note": "Bấm '▶ BẮT ĐẦU DẪN ĐƯỜNG': Camera phóng to bám sát theo xe 36 km/h, chùm tia định hướng & đếm ngược từng mét như Google Maps",
        "voice_vi": (
            "Ngay khi tài xế bấm nút Bắt đầu dẫn đường trực tiếp giống như nút Start trên Google Maps, "
            "camera tự động phóng to cấp độ mặt đường và khóa tâm bám sát theo xe tải đang di chuyển ba mươi sáu ki-lô-mét trên giờ. "
            "Thanh điều hướng màu xanh phía trên đếm ngược từng mét đến ngã rẽ tiếp theo và phát giọng nói tiếng Việt dẫn đường an toàn tuyệt đối."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/12_maps_live_nav_f*.png",
        "cursor_start": (330, 275),
        "click_target": (680, 680),
        "click_sec_offset": 3.5,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (2.5, 1.0, 960, 540),
            (4.2, 1.65, 640, 220),
            (9.0, 1.72, 680, 660),
            (15.5, 1.0, 960, 540),
            (18.0, 1.0, 960, 540),
        ],
    },
    {
        "id": 10,
        "start_sec": 166.0,
        "end_sec": 180.0,
        "time_range_str": "02:46 – 03:00",
        "title": "CHƯƠNG 10: PHÒNG GIÁM SÁT HẠ TẦNG & BẢO MẬT MÙ ZERO-KNOWLEDGE (AES-256-GCM)",
        "note": "Cách ly dữ liệu đa công ty (Multi-Tenant Isolation) · Admin EcoMiles chỉ thấy chuỗi mã hóa mù aes256gcm$iv=... (0% quyền giải mã)",
        "voice_vi": (
            "Cuối cùng, tại Phòng giám sát hệ thống của Quản trị viên EcoMiles, toàn bộ dữ liệu đơn hàng của từng công ty đều được mã hóa mù A-E-S hai năm sáu G-C-M bằng khóa riêng của khách hàng. "
            "EcoMiles sẵn sàng đồng hành cùng doanh nghiệp vận tải Việt Nam tối ưu chi phí và chuyển đổi xanh bền vững."
        ),
        "frames_pattern": f"{CAPTURES_DIR}/10_role4_admin_zero_knowledge.png",
        "cursor_start": (980, 70),
        "click_target": (1280, 640),
        "click_sec_offset": 3.5,
        "zoom_keyframes": [
            (0.0, 1.0, 960, 540),
            (2.5, 1.0, 960, 540),
            (4.2, 1.68, 1280, 640),
            (10.5, 1.68, 1280, 640),
            (12.8, 1.0, 960, 540),
            (14.0, 1.0, 960, 540),
        ],
    },
]


async def synthesize_tts_clips():
    from gtts import gTTS

    for ch in CHAPTERS:
        mp3_path = os.path.join(TMP_AUDIO_DIR, f"ch_{ch['id']:02d}.mp3")
        wav_path = os.path.join(TMP_AUDIO_DIR, f"ch_{ch['id']:02d}.wav")
        tts = gTTS(ch["voice_vi"], lang="vi")
        tts.save(mp3_path)
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-af", "atempo=1.18", "-ar", "44100", "-ac", "2", wav_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        ch["wav_path"] = wav_path
    print("Synthesized all 10 Vietnamese TTS voiceover clips!")

def build_master_audio_wav() -> str:
    """Builds a 180.0s stereo 44.1kHz WAV combining soft ambient pad, click chimes, and TTS voiceover."""
    sr = 44100
    total_samples = int(TOTAL_DURATION_SEC * sr)
    t = np.linspace(0, TOTAL_DURATION_SEC, total_samples, endpoint=False, dtype=np.float32)

    # Gentle warm ambient C-major9 harmonic bed at -25 dB
    pad = (
        0.025 * np.sin(2 * np.pi * 130.81 * t)
        + 0.018 * np.sin(2 * np.pi * 196.00 * t)
        + 0.014 * np.sin(2 * np.pi * 246.94 * t)
        + 0.012 * np.sin(2 * np.pi * 293.66 * t)
    )
    envelope = np.ones_like(t)
    fade_samples = int(2.5 * sr)
    envelope[:fade_samples] = np.linspace(0, 1, fade_samples)
    envelope[-fade_samples:] = np.linspace(1, 0, fade_samples)
    pad *= envelope

    mix_l = pad.copy()
    mix_r = pad.copy()

    for ch in CHAPTERS:
        # Add subtle UI click chime at click_sec_offset
        click_t = ch["start_sec"] + ch["click_sec_offset"]
        c_idx = int(click_t * sr)
        chime_len = int(0.12 * sr)
        if c_idx + chime_len < total_samples:
            ct = np.linspace(0, 0.12, chime_len, endpoint=False, dtype=np.float32)
            chime = 0.12 * np.sin(2 * np.pi * 880.0 * ct) * np.exp(-32.0 * ct)
            mix_l[c_idx : c_idx + chime_len] += chime
            mix_r[c_idx : c_idx + chime_len] += chime

        # Mix TTS WAV starting at ch['start_sec'] + 0.35s
        with wave.open(ch["wav_path"], "rb") as wf:
            n_frames = wf.getnframes()
            raw_bytes = wf.readframes(n_frames)
            samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            if wf.getnchannels() == 2:
                samples = samples.reshape(-1, 2)
                s_l, s_r = samples[:, 0], samples[:, 1]
            else:
                s_l = s_r = samples

            start_idx = int((ch["start_sec"] + 0.35) * sr)
            max_len = min(len(s_l), int((ch["end_sec"] - ch["start_sec"] - 0.5) * sr), total_samples - start_idx)
            if max_len > 0:
                mix_l[start_idx : start_idx + max_len] += s_l[:max_len] * 0.92
                mix_r[start_idx : start_idx + max_len] += s_r[:max_len] * 0.92

    stereo = np.stack([np.clip(mix_l, -0.98, 0.98), np.clip(mix_r, -0.98, 0.98)], axis=1)
    pcm16 = (stereo * 32767.0).astype(np.int16)

    master_wav = os.path.join(TMP_AUDIO_DIR, "master_180s.wav")
    with wave.open(master_wav, "wb") as out_wf:
        out_wf.setnchannels(2)
        out_wf.setsampwidth(2)
        out_wf.setframerate(sr)
        out_wf.writeframes(pcm16.tobytes())

    print(f"Built 180.0s master audio track: {master_wav}")
    return master_wav


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    if edge1 <= edge0:
        return 1.0
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def interpolate_zoom_keyframes(keyframes, local_sec: float) -> tuple[float, float, float]:
    if local_sec <= keyframes[0][0]:
        return keyframes[0][1], keyframes[0][2], keyframes[0][3]
    for i in range(len(keyframes) - 1):
        t0, z0, x0, y0 = keyframes[i]
        t1, z1, x1, y1 = keyframes[i + 1]
        if local_sec <= t1:
            u = smoothstep(t0, t1, local_sec)
            return (
                z0 + (z1 - z0) * u,
                x0 + (x1 - x0) * u,
                y0 + (y1 - y0) * u,
            )
    last = keyframes[-1]
    return last[1], last[2], last[3]


def render_3min_video(master_wav: str):
    font_chapter = get_font(15, bold=True)
    font_note = get_font(17, bold=True)
    font_sub = get_font(15, bold=False)

    # Pre-load image sequences for each chapter
    chapter_images: dict[int, list[Image.Image]] = {}
    for ch in CHAPTERS:
        matched = sorted(glob.glob(ch["frames_pattern"]))
        if not matched:
            raise FileNotFoundError(f"No frames for pattern: {ch['frames_pattern']}")
        chapter_images[ch["id"]] = [Image.open(p).convert("RGB") for p in matched]

    no_voice_mp4 = os.path.join(VIDEO_OUT_DIR, "ECOMILES_DEMO_3MIN_NO_VOICE_FOR_EDITING.mp4")
    voiced_mp4 = os.path.join(VIDEO_OUT_DIR, "ECOMILES_DEMO_3MIN_WITH_AI_VOICE.mp4")

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-s",
        f"{WIDTH}x{HEIGHT}",
        "-pix_fmt",
        "rgb24",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        no_voice_mp4,
    ]

    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    assert proc.stdin is not None

    for frame_idx in range(TOTAL_FRAMES):
        sec = frame_idx / FPS
        # Find active chapter
        ch = CHAPTERS[-1]
        for cand in CHAPTERS:
            if cand["start_sec"] <= sec < cand["end_sec"]:
                ch = cand
                break

        local_sec = sec - ch["start_sec"]
        ch_dur = ch["end_sec"] - ch["start_sec"]
        imgs = chapter_images[ch["id"]]
        # Cycle smoothly through multi-frame captures so trucks visibly move on the roads!
        base_im = imgs[frame_idx % len(imgs)].copy()
        draw_base = ImageDraw.Draw(base_im, "RGBA")

        # Cursor interpolation from cursor_start to click_target
        sx, sy = ch["cursor_start"]
        tx, ty = ch["click_target"]
        click_t = ch["click_sec_offset"]
        move_u = smoothstep(max(0.0, click_t - 1.6), click_t, local_sec)
        cur_x = int(sx + (tx - sx) * move_u)
        cur_y = int(sy + (ty - sy) * move_u)

        # Draw expanding click-ripple rings right after click_t
        dt_click = local_sec - click_t
        if -0.15 <= dt_click <= 2.4:
            pulse = max(0.0, dt_click)
            r1 = int(14 + pulse * 48)
            r2 = int(8 + pulse * 28)
            alpha = int(max(0, 235 * (1.0 - pulse / 2.4)))
            draw_base.ellipse(
                [tx - r1, ty - r1, tx + r1, ty + r1],
                outline=(225, 29, 72, alpha),
                width=4,
            )
            draw_base.ellipse(
                [tx - r2, ty - r2, tx + r2, ty + r2],
                outline=(255, 212, 0, alpha),
                width=3,
            )

        # Draw high-contrast pointer cursor
        pts = [
            (cur_x, cur_y),
            (cur_x + 5, cur_y + 30),
            (cur_x + 12, cur_y + 23),
            (cur_x + 19, cur_y + 35),
            (cur_x + 25, cur_y + 32),
            (cur_x + 17, cur_y + 19),
            (cur_x + 27, cur_y + 18),
        ]
        draw_base.polygon([(px + 2, py + 2) for px, py in pts], fill=(0, 0, 0, 180))
        draw_base.polygon(pts, fill=(255, 255, 255, 255), outline=(17, 24, 39, 255))
        draw_base.ellipse([cur_x - 5, cur_y - 5, cur_x + 5, cur_y + 5], fill=(255, 212, 0, 255))

        # Apply Screen-Studio Spring Camera Zoom-per-Click
        zoom, zcx, zcy = interpolate_zoom_keyframes(ch["zoom_keyframes"], local_sec)
        if zoom > 1.005:
            crop_w = int(WIDTH / zoom)
            crop_h = int(HEIGHT / zoom)
            x1 = int(max(0, min(WIDTH - crop_w, zcx - crop_w / 2)))
            y1 = int(max(0, min(HEIGHT - crop_h, zcy - crop_h / 2)))
            frame_im = base_im.crop((x1, y1, x1 + crop_w, y1 + crop_h)).resize(
                (WIDTH, HEIGHT), Image.Resampling.BILINEAR
            )
        else:
            frame_im = base_im

        # Draw HUD Overlays (Top Chapter Pill + Zoom Badge + Bottom Lower-Third Note Banner + Timeline Bar)
        hud = ImageDraw.Draw(frame_im, "RGBA")

        # Top-Left Chapter Badge + Zoom Indicator
        zoom_badge_str = f"ZOOM {zoom:.2f}x" if zoom > 1.05 else "TOÀN MÀN HÌNH 1.0x"
        hud.rounded_rectangle([24, 16, 780, 56], radius=10, fill=(17, 24, 39, 228), outline=(214, 246, 90, 255), width=2)
        hud.text((38, 25), f"{ch['time_range_str']}  |  {ch['title']}", fill=(214, 246, 90, 255), font=font_chapter)

        hud.rounded_rectangle([792, 16, 975, 56], radius=10, fill=(20, 83, 45, 235), outline=(255, 255, 255, 200), width=2)
        hud.text((808, 25), zoom_badge_str, fill=(255, 255, 255, 255), font=font_chapter)

        # Bottom Lower-Third Callout Note Banner
        hud.rounded_rectangle([140, 972, 1780, 1058], radius=14, fill=(17, 24, 39, 232), outline=(47, 158, 68, 255), width=2)
        hud.text((165, 982), f"GHI CHÚ ĐIỂM BẤM: {ch['note']}", fill=(255, 212, 0, 255), font=font_note)
        # Voiceover subtitle snippet
        words = ch["voice_vi"].split()
        mid = len(words) // 2
        sub_line = " ".join(words[:mid]) if local_sec < ch_dur / 2 else " ".join(words[mid:])
        hud.text((165, 1016), f"Thuyết minh: \"{sub_line}\"", fill=(241, 245, 249, 255), font=font_sub)

        # Bottom-most Progress Bar (00:00 -> 03:00)
        prog_w = int((sec / TOTAL_DURATION_SEC) * WIDTH)
        hud.rectangle([0, 1072, WIDTH, 1080], fill=(30, 41, 59, 220))
        hud.rectangle([0, 1072, prog_w, 1080], fill=(214, 246, 90, 255))

        proc.stdin.write(frame_im.tobytes())

    proc.stdin.close()
    proc.wait()
    print(f"Rendered clean no-voice master MP4: {no_voice_mp4}")

    # Combine with master_wav to produce the AI-voiced 3-minute MP4
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            no_voice_mp4,
            "-i",
            master_wav,
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            voiced_mp4,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"Rendered AI-voiced 3-minute MP4: {voiced_mp4}")

    # Copy to root and public/video/
    shutil.copyfile(voiced_mp4, os.path.join(BASE_DIR, "ECOMILES_DEMO_3MIN_WITH_AI_VOICE.mp4"))
    shutil.copyfile(no_voice_mp4, os.path.join(BASE_DIR, "ECOMILES_DEMO_3MIN_NO_VOICE_FOR_EDITING.mp4"))
    shutil.copyfile(voiced_mp4, os.path.join(PUBLIC_VIDEO_DIR, "ecomiles_demo_3min.mp4"))


def write_srt_and_scripts():
    def fmt_srt_time(s: float) -> str:
        mm = int(s // 60)
        ss = int(s % 60)
        ms = int((s - int(s)) * 1000)
        return f"00:{mm:02d}:{ss:02d},{ms:03d}"

    srt_lines = []
    for ch in CHAPTERS:
        srt_lines.append(str(ch["id"]))
        srt_lines.append(f"{fmt_srt_time(ch['start_sec'])} --> {fmt_srt_time(ch['end_sec'])}")
        srt_lines.append(ch["voice_vi"])
        srt_lines.append("")

    srt_path = os.path.join(VIDEO_OUT_DIR, "ECOMILES_DEMO_3MIN.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))
    shutil.copyfile(srt_path, os.path.join(BASE_DIR, "ECOMILES_DEMO_3MIN.srt"))

    # Write Markdown Timestamped Voiceover & Editing Script
    md_lines = [
        "# KỊCH BẢN THUYẾT MINH & DỰNG VIDEO DEMO 3 PHÚT (00:00 – 03:00) — ECOMILES B2B TMS, EVSIM & OPENTRUCK MAPS (/MAPS)",
        "",
        "- **Thời lượng chuẩn:** `03:00` (`180.0 giây`, `1920×1080 Full HD`, hiệu ứng **Screen-Studio Spring Zoom-per-Click 1.65×–1.72×** + Vòng tròn sóng Click + Xe tải di chuyển 60 FPS trên mặt đường thực tế).",
        "- **File Video 1 (Đã lồng tiếng AI Neural TV `vi-VN-HoaiMyNeural` + Nhạc nền Ambient + Hiệu ứng Click):** `ECOMILES_DEMO_3MIN_WITH_AI_VOICE.mp4` (`docs/video/ECOMILES_DEMO_3MIN_WITH_AI_VOICE.mp4`)",
        "- **File Video 2 (Bản Sạch Không Giọng Đọc — Dành để tự thu âm giọng thật & ghép nhạc trên CapCut / Premiere):** `ECOMILES_DEMO_3MIN_NO_VOICE_FOR_EDITING.mp4` (`docs/video/ECOMILES_DEMO_3MIN_NO_VOICE_FOR_EDITING.mp4`)",
        "- **File Phụ đề chuẩn SRT:** `ECOMILES_DEMO_3MIN.srt` (`docs/video/ECOMILES_DEMO_3MIN.srt`)",
        "",
        "---",
        "",
        "## BẢNG PHÂN CẢNH CHI TIẾT (TIMESTAMPS, ĐIỂM CLICK, HIỆU ỨNG ZOOM & LỜI THOẠI)",
        "",
        "| Chương | Mốc Thời Gian | Màn Hình & Thao Tác Click | Hiệu Ứng Zoom-Per-Click | Lời Thoại Thuyết Minh Chuẩn (Đọc vừa khít thời lượng) |",
        "|---|---|---|---|---|",
    ]

    for ch in CHAPTERS:
        md_lines.append(
            f"| **Chương {ch['id']}** | `{ch['time_range_str']}` | **{ch['title']}**<br/>_{ch['note']}_ | Phóng to `1.68×` vào tọa độ `{ch['click_target']}` tại giây `+{ch['click_sec_offset']}s` | \"{ch['voice_vi']}\" |"
        )

    md_path = os.path.join(OUTPUT_DIR, "ECOMILES_VIDEO_SCRIPT_3MIN_TIMESTAMPED.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines) + "\n")
    shutil.copyfile(md_path, os.path.join(BASE_DIR, "ECOMILES_VIDEO_SCRIPT_3MIN_TIMESTAMPED.md"))

    # Also build DOCX script
    from docx import Document

    doc = Document()
    doc.add_heading("KỊCH BẢN THUYẾT MINH & DỰNG VIDEO 3 PHÚT (00:00 – 03:00) — ECOMILES", level=0)
    doc.add_paragraph(
        "Sử dụng trực tiếp file ECOMILES_DEMO_3MIN_WITH_AI_VOICE.mp4 (đã có giọng đọc AI tiếng Việt) hoặc đưa file ECOMILES_DEMO_3MIN_NO_VOICE_FOR_EDITING.mp4 kèm phụ đề ECOMILES_DEMO_3MIN.srt vào CapCut / Premiere để lồng giọng thật và nhạc nền theo đúng 10 mốc thời gian dưới đây:"
    )
    for ch in CHAPTERS:
        doc.add_heading(f"[{ch['time_range_str']}] {ch['title']}", level=1)
        doc.add_paragraph(f"• Ghi chú điểm bấm & Hiệu ứng Zoom: {ch['note']} (Zoom 1.68x tại giây +{ch['click_sec_offset']}s vào tọa độ {ch['click_target']}).")
        doc.add_paragraph(f"• Lời thoại thuyết minh: \"{ch['voice_vi']}\"")

    docx_script = os.path.join(BASE_DIR, "ECOMILES_VIDEO_SCRIPT_3MIN_TIMESTAMPED.docx")
    doc.save(docx_script)
    shutil.copyfile(docx_script, os.path.join(OUTPUT_DIR, "ECOMILES_VIDEO_SCRIPT_3MIN_TIMESTAMPED.docx"))
    print(f"Saved SRT, Markdown, and DOCX timestamped video scripts: {md_path} & {docx_script}")


async def main():
    await synthesize_tts_clips()
    master_wav = build_master_audio_wav()
    render_3min_video(master_wav)
    write_srt_and_scripts()


if __name__ == "__main__":
    asyncio.run(main())
