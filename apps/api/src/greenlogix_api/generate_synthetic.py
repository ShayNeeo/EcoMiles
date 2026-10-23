"""Deterministic synthetic order set for ingest demos (C-03).

Emits ``data/seed/synthetic_<rows>_orders.xlsx`` in the ``/orders/import``
template plus ``data/seed/dataset_meta.json``. lat/lng always land inside the
real inner-HCMC districts ``seed.py`` uses (never a fabricated address), so the
ingest path needs no geocoding, and ``kind`` is fixed to ``"simulated"`` so no
downstream surface can present the numbers as measured.

Same seed + same row count => byte-identical xlsx (core properties and zip
member timestamps are pinned), so the SHA-256 in the metadata is reproducible.

Usage: ``uv run python -m greenlogix_api.generate_synthetic --rows 80``
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import random
import re
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from openpyxl import Workbook

from greenlogix_api import db as dbmod
from greenlogix_api.schemas import CARGO_TYPES
from greenlogix_api.seed import DISTRICTS, ORDER_HEADERS

log = logging.getLogger("greenlogix")

DEFAULT_SEED = 20261018
DEFAULT_ROWS = 80
JITTER_DEG = 0.008  # ~0.9 km around the district centroid
CARGO_CHOICES = sorted(CARGO_TYPES)  # single source of truth: schemas.CargoType
META_NAME = dbmod.DATASET_META_NAME
FIXED_MTIME = datetime(1980, 1, 1)  # naive on purpose: xlsx/zip stamps have no tz
ZIP_EPOCH = (1980, 1, 1, 0, 0, 0)
FIXED_STAMP = "1980-01-01T00:00:00Z"
CORE_MODIFIED = re.compile(r"(<dcterms:modified[^>]*>)[^<]*(</dcterms:modified>)")

COLUMNS = ["external_id", *ORDER_HEADERS]


def order_rows(count: int, seed: int) -> list[list[object]]:
    """``count`` deterministic rows in the ingest template, keyed ``SIM-<seed>-<n>``."""
    rng = random.Random(seed)
    rows: list[list[object]] = []
    for i in range(1, count + 1):
        name, lat0, lng0 = DISTRICTS[(i - 1) % len(DISTRICTS)]
        start_h = 8 + (i - 1) % 8
        rows.append(
            [
                f"SIM-{seed}-{i:06d}",
                f"{name} stop {i:05d}",
                round(lat0 + rng.uniform(-JITTER_DEG, JITTER_DEG), 6),
                round(lng0 + rng.uniform(-JITTER_DEG, JITTER_DEG), 6),
                f"KH {i:05d}",
                f"09{rng.randrange(10**7):07d}",
                round(rng.uniform(1.0, 80.0), 1),
                f"{start_h:02d}:00",
                f"{start_h + 2:02d}:00",
                rng.choice(CARGO_CHOICES),
                "goi truoc" if i % 11 == 0 else "",
            ]
        )
    return rows


def xlsx_bytes(rows: list[list[object]]) -> bytes:
    """Workbook for ``rows`` as reproducible bytes (fixed stamps, stable order)."""
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "orders"
    ws.append(COLUMNS)
    for row in rows:
        ws.append(row)
    wb.properties.created = FIXED_MTIME
    wb.properties.modified = FIXED_MTIME
    buf = BytesIO()
    wb.save(buf)
    return _pin_zip_timestamps(buf.getvalue())


def _pin_zip_timestamps(blob: bytes) -> bytes:
    # openpyxl stamps zip members with the wall clock and re-stamps
    # docProps/core.xml ``modified`` at save time; pin both so the bytes are a
    # pure function of the row data.
    src = ZipFile(BytesIO(blob))
    out = BytesIO()
    with ZipFile(out, "w", ZIP_DEFLATED) as dst:
        for info in src.infolist():
            data = src.read(info.filename)
            if info.filename == "docProps/core.xml":
                core = data.decode("utf-8")
                data = CORE_MODIFIED.sub(rf"\g<1>{FIXED_STAMP}\g<2>", core).encode("utf-8")
            dst.writestr(ZipInfo(info.filename, date_time=ZIP_EPOCH), data)
    return out.getvalue()


def discard_meta_unless_matches(data: bytes) -> bool:
    """Drop ``dataset_meta.json`` unless ``data`` is the file that produced it (M-8).

    Any other import or reseed replaces the dataset, so a surviving synthetic
    ``label``/``seed``/``kind`` would misdescribe real customer rows. Returns
    True when the label was kept. The generator compares the recorded sha256, so
    re-importing its own workbook keeps the label.
    """
    meta_path = Path(dbmod.SEED_DIR) / META_NAME
    if not meta_path.exists():
        return False
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        meta = {}
    if isinstance(meta, dict) and meta.get("sha256") == hashlib.sha256(data).hexdigest():
        return True
    meta_path.unlink(missing_ok=True)
    log.info("discarded stale %s", META_NAME)
    return False


def generate(
    rows: int = DEFAULT_ROWS,
    *,
    seed: int = DEFAULT_SEED,
    out_dir: Path | None = None,
    generated_at: datetime | None = None,
) -> dict[str, object]:
    """Write the xlsx + ``dataset_meta.json`` under ``out_dir``; return the metadata."""
    target = Path(out_dir) if out_dir is not None else dbmod.SEED_DIR
    target.mkdir(parents=True, exist_ok=True)
    stamp = generated_at or datetime.now(UTC)
    data = xlsx_bytes(order_rows(rows, seed))
    xlsx_path = target / f"synthetic_{rows}_orders.xlsx"
    xlsx_path.write_bytes(data)
    meta: dict[str, object] = {
        "label": f"sim-hcmc-{rows}",
        "kind": "simulated",
        "seed": seed,
        "generated_at": stamp.replace(microsecond=0).isoformat(),
        "rows": rows,
        "columns": COLUMNS,
        "xlsx": xlsx_path.name,
        "sha256": hashlib.sha256(data).hexdigest(),
    }
    (target / META_NAME).write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return meta


def generate_dna_500(
    out_dir: Path | None = None,
    seed: int = DEFAULT_SEED,
) -> dict[str, object]:
    """Generate 500-order 7-day HCMC enterprise simulation dataset."""
    target = Path(out_dir) if out_dir is not None else dbmod.SEED_DIR
    target.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC)
    raw_rows = order_rows(500, seed)
    days = [f"2026-10-{18 + (idx % 7):02d}" for idx in range(len(raw_rows))]
    for idx, r in enumerate(raw_rows):
        day = days[idx]
        r[0] = f"DNA-{day}-{idx + 1:04d}"
        base_note = str(r[10] or "").strip()
        r[10] = f"date={day}" + (f"; {base_note}" if base_note else "")
    data = xlsx_bytes(raw_rows)
    xlsx_path = target / "dna_500_orders.xlsx"
    xlsx_path.write_bytes(data)
    meta: dict[str, object] = {
        "label": "dn-a-enterprise-sim-500",
        "kind": "simulated",
        "seed": seed,
        "days": 7,
        "date_range": ["2026-10-18", "2026-10-24"],
        "generated_at": stamp.replace(microsecond=0).isoformat(),
        "rows": 500,
        "columns": COLUMNS,
        "xlsx": xlsx_path.name,
        "sha256": hashlib.sha256(data).hexdigest(),
    }
    (target / "dna_500_meta.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return meta

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--rows", type=int, default=DEFAULT_ROWS)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--out-dir", type=Path, default=None, help="default: data/seed")
    parser.add_argument("--dna-500", action="store_true", help="generate dna_500_orders.xlsx")
    args = parser.parse_args(argv)
    if args.dna_500:
        meta = generate_dna_500(out_dir=args.out_dir, seed=args.seed)
    else:
        if args.rows <= 0:
            parser.error("--rows must be a positive integer")
        meta = generate(args.rows, seed=args.seed, out_dir=args.out_dir)
    print(json.dumps(meta, ensure_ascii=False))
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
