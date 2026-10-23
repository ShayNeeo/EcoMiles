"""Generate 3 near-real-world Vietnamese logistics .xlsx sample workbooks for customer & judge benchmarking."""

from __future__ import annotations

import json
import random
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill

from greenlogix_api.generate_synthetic import FIXED_MTIME, _pin_zip_timestamps

# Authentic HCMC distribution corridors with real street names & coordinates
HCMC_CORRIDORS: list[tuple[str, str, float, float]] = [
    ("Quận 1", "Nguyễn Huệ, P. Bến Nghé", 10.7738, 106.7037),
    ("Quận 1", "Lê Lợi, P. Bến Thành", 10.7721, 106.6983),
    ("Quận 1", "Hai Bà Trưng, P. Tân Định", 10.7892, 106.6914),
    ("Quận 3", "Võ Văn Tần, Phường 6", 10.7764, 106.6895),
    ("Quận 3", "Nam Kỳ Khởi Nghĩa, Phường 8", 10.7868, 106.6839),
    ("Quận 5", "Trần Hưng Đạo, Phường 7", 10.7548, 106.6725),
    ("Quận 5", "Nguyễn Trãi, Phường 11", 10.7532, 106.6634),
    ("Quận 7", "Nguyễn Thị Thập, P. Tân Phú", 10.7382, 106.7165),
    ("Quận 7", "Nguyễn Văn Linh, P. Tân Phong", 10.7295, 106.7088),
    ("Quận 10", "Sư Vạn Hạnh, Phường 12", 10.7712, 106.6678),
    ("Quận 10", "Ba Tháng Hai, Phường 11", 10.7705, 106.6732),
    ("Bình Thạnh", "Điện Biên Phủ, Phường 25", 10.8012, 106.7145),
    ("Bình Thạnh", "Phan Đăng Lưu, Phường 3", 10.8035, 106.6912),
    ("Phú Nhuận", "Phan Xích Long, Phường 2", 10.7995, 106.6848),
    ("Phú Nhuận", "Nguyễn Văn Trỗi, Phường 8", 10.7958, 106.6739),
    ("Tân Bình", "Cộng Hòa, Phường 13", 10.8021, 106.6472),
    ("Tân Bình", "Trường Chinh, Phường 15", 10.8185, 106.6318),
    ("TP. Thủ Đức", "Võ Văn Ngân, P. Linh Chiểu", 10.8505, 106.7642),
    ("TP. Thủ Đức", "Xa Lộ Hà Nội, P. An Phú", 10.8005, 106.7438),
    ("Gò Vấp", "Quang Trung, Phường 10", 10.8325, 106.6624),
]

STORE_CHAINS = [
    "Bách Hóa Xanh",
    "WinMart+",
    "Co.op Food",
    "GS25",
    "Circle K",
    "Siêu thị Ân Nam",
    "Nhà hàng Golden Gate",
    "Highlands Coffee",
    "Phúc Long Hub",
    "Đại lý Phân Phối Minh Phát",
]

HEADERS = [
    "external_id",
    "address",
    "lat",
    "lng",
    "receiver",
    "phone",
    "kg",
    "window_start",
    "window_end",
    "cargo_type",
    "notes",
]


def _styled_workbook(title: str, rows: list[list[object]]) -> bytes:
    from io import BytesIO

    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "orders"
    ws.append(HEADERS)

    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(bold=True, color="FFD400")
    for col_idx in range(1, len(HEADERS) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    for row in rows:
        ws.append(row)

    wb.properties.title = title
    wb.properties.created = FIXED_MTIME
    wb.properties.modified = FIXED_MTIME
    buf = BytesIO()
    wb.save(buf)
    return _pin_zip_timestamps(buf.getvalue())


def build_fmcg_80(seed: int = 202601) -> list[list[object]]:
    rng = random.Random(seed)
    rows: list[list[object]] = []
    windows = [
        ("09:00", "11:30"),
        ("09:30", "12:00"),
        ("10:00", "13:00"),
        ("13:00", "15:30"),
        ("13:30", "16:00"),
    ]
    for i in range(1, 81):
        # ERP export order: interleaves districts so unclustered sequence zig-zags across HCMC
        dist, street, lat0, lng0 = HCMC_CORRIDORS[(i * 7) % len(HCMC_CORRIDORS)]
        chain = STORE_CHAINS[(i * 3) % len(STORE_CHAINS)]
        lat = round(lat0 + rng.uniform(-0.0045, 0.0045), 6)
        lng = round(lng0 + rng.uniform(-0.0045, 0.0045), 6)
        w_start, w_end = windows[i % len(windows)]
        kg = round(rng.uniform(18.0, 145.0), 1)
        house_no = 10 + (i * 13) % 380
        rows.append(
            [
                f"FMCG-2026-{i:04d}",
                f"{house_no} {street}, {dist}, TP.HCM",
                lat,
                lng,
                f"{chain} - CN {dist} #{i:02d}",
                f"090{rng.randrange(10**7):07d}",
                kg,
                w_start,
                w_end,
                "thuong" if i % 4 != 0 else "de_vo",
                f"Kênh GT/MT {dist}; giao kiện tiêu chuẩn",
            ]
        )
    return rows


def build_coldchain_120_qd23(seed: int = 202602) -> list[list[object]]:
    rng = random.Random(seed)
    rows: list[list[object]] = []
    for i in range(1, 121):
        dist, street, lat0, lng0 = HCMC_CORRIDORS[(i * 5) % len(HCMC_CORRIDORS)]
        chain = STORE_CHAINS[(i * 5 + 1) % len(STORE_CHAINS)]
        lat = round(lat0 + rng.uniform(-0.005, 0.005), 6)
        lng = round(lng0 + rng.uniform(-0.005, 0.005), 6)
        # 28 orders intentionally scheduled inside QĐ 23/2018 truck ban windows (06:00-09:00 or 16:00-20:00)
        if i <= 16:
            w_start, w_end = "06:30", "08:30"
            note = "CẢNH BÁO QĐ 23/2018: Khung giờ cao điểm sáng (06:00-09:00); Hàng lạnh -18C"
        elif i <= 28:
            w_start, w_end = "16:30", "18:30"
            note = "CẢNH BÁO QĐ 23/2018: Khung giờ cao điểm chiều (16:00-20:00); Hàng tươi sống"
        elif i % 3 == 0:
            w_start, w_end = "09:15", "11:30"
            note = "Hàng lạnh 2-4C; ưu tiên dỡ hàng nhanh"
        else:
            w_start, w_end = "13:00", "15:45"
            note = "Chuỗi lạnh F&B; kiểm nhiệt độ khi nhận"
        kg = round(rng.uniform(22.0, 160.0), 1)
        house_no = 5 + (i * 17) % 420
        rows.append(
            [
                f"COLD-2026-{i:04d}",
                f"{house_no} {street}, {dist}, TP.HCM",
                lat,
                lng,
                f"{chain} ColdHub #{i:03d}",
                f"091{rng.randrange(10**7):07d}",
                kg,
                w_start,
                w_end,
                "lanh" if i % 5 != 0 else "de_vo",
                note,
            ]
        )
    return rows


def build_erp_500_multiday(seed: int = 202603) -> list[list[object]]:
    rng = random.Random(seed)
    rows: list[list[object]] = []
    days = [f"2026-10-{18 + d:02d}" for d in range(7)]
    windows = [
        ("07:30", "09:30"),
        ("09:00", "11:00"),
        ("10:00", "12:30"),
        ("13:00", "15:30"),
        ("14:00", "16:30"),
        ("16:30", "19:00"),
    ]
    for i in range(1, 501):
        day = days[(i - 1) % len(days)]
        dist, street, lat0, lng0 = HCMC_CORRIDORS[(i * 11) % len(HCMC_CORRIDORS)]
        chain = STORE_CHAINS[(i * 7) % len(STORE_CHAINS)]
        lat = round(lat0 + rng.uniform(-0.006, 0.006), 6)
        lng = round(lng0 + rng.uniform(-0.006, 0.006), 6)
        w_start, w_end = windows[(i - 1) % len(windows)]
        kg = round(rng.uniform(12.0, 175.0), 1)
        cargo = "lanh" if i % 4 == 0 else ("de_vo" if i % 7 == 0 else "thuong")
        house_no = 1 + (i * 19) % 500
        rows.append(
            [
                f"DNA-{day}-{i:04d}",
                f"{house_no} {street}, {dist}, TP.HCM",
                lat,
                lng,
                f"{chain} ({dist}) #{i:03d}",
                f"098{rng.randrange(10**7):07d}",
                kg,
                w_start,
                w_end,
                cargo,
                f"date={day}; ERP_BATCH=DN_A_W43; district={dist}",
            ]
        )
    return rows


def generate_all(out_dir: Path) -> dict[str, object]:
    out_dir.mkdir(parents=True, exist_ok=True)
    datasets = {
        "EcoMiles_Mau_FMCG_80_Don_TPHCM.xlsx": (
            "FMCG 80 đơn nội đô TP.HCM (Kịch bản điều phối thủ công vs EcoMiles)",
            build_fmcg_80(),
        ),
        "EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx": (
            "Cold-Chain 120 đơn F&B (28 đơn vi phạm giờ cấm tải QĐ 23/2018)",
            build_coldchain_120_qd23(),
        ),
        "EcoMiles_Mau_ERP_500_Don_7_Ngay.xlsx": (
            "ERP Doanh Nghiệp A — 500 đơn hàng đa ngày (7 ngày vận hành)",
            build_erp_500_multiday(),
        ),
    }
    manifest: dict[str, object] = {}
    for fname, (title, rows) in datasets.items():
        raw = _styled_workbook(title, rows)
        (out_dir / fname).write_bytes(raw)
        manifest[fname] = {"title": title, "rows": len(rows), "bytes": len(raw)}
    (out_dir / "samples_manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return manifest


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[4]
    m1 = generate_all(root / "apps" / "landing" / "public" / "samples")
    print(json.dumps(m1, indent=2, ensure_ascii=False))
