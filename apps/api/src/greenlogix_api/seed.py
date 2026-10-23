"""80 inner-HCMC orders + 10 trucks (ORD-02, VEH-01, D-18)."""

from __future__ import annotations

import logging
from pathlib import Path

from openpyxl import Workbook
from sqlmodel import Session, select

from greenlogix_api import db as dbmod
from greenlogix_api.models import Order, Route, Stop, Vehicle
from greenlogix_api.schemas import DepotOut, SeedOut

log = logging.getLogger("greenlogix")

DEPOT_LAT = 10.801
DEPOT_LNG = 106.661
DEPOT_NAME = "Tan Binh DC"

DISTRICTS: list[tuple[str, float, float]] = [
    ("Q1", 10.776, 106.700),
    ("Thu Duc", 10.850, 106.772),
    ("Q7", 10.729, 106.721),
    ("Binh Thanh", 10.810, 106.709),
    ("Phu Nhuan", 10.799, 106.675),
    ("Q3", 10.782, 106.686),
]

ORDER_HEADERS = [
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
TRUCK_HEADERS = ["plate", "type", "capacity_kg", "fuel", "l_per_100km", "status"]
CAPACITIES = [500, 800, 1000, 1500, 2000, 500, 800, 1000, 1500, 2000]
LPK = [8, 9, 10, 11, 12, 13, 14, 8, 10, 12]


def _jitter(i: int, axis: int) -> float:
    raw = ((i * 37 + axis * 91) % 16000) / 1000.0
    return (raw - 8.0) / 1000.0


def order_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for i in range(1, 81):
        name, lat0, lng0 = DISTRICTS[(i - 1) % len(DISTRICTS)]
        start_h = 8 + ((i - 1) % 8)
        rows.append(
            {
                "address": f"{name} stop {i:02d}",
                "lat": round(lat0 + _jitter(i, 0), 6),
                "lng": round(lng0 + _jitter(i, 1), 6),
                "receiver": f"KH {i:02d}",
                "phone": f"09000000{i:02d}",
                "kg": float(5 + ((i * 7) % 76)),
                "window_start": f"{start_h:02d}:00",
                "window_end": f"{start_h + 2:02d}:00",
                "cargo_type": "thuong",
                "notes": "goi truoc" if i % 11 == 0 else "",
                "excel_row": i + 1,
            }
        )
    return rows


def truck_rows() -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for i in range(1, 11):
        rows.append(
            {
                "plate": f"51C-000.{i:02d}",
                "type": "xe_tai_nho",
                "capacity_kg": float(CAPACITIES[i - 1]),
                "fuel": "petrol" if i % 2 else "diesel",
                "l_per_100km": float(LPK[i - 1]),
                "status": "maintenance" if i == 10 else "ready",
            }
        )
    return rows


def write_seed_xlsx(seed_dir: Path | None = None) -> tuple[Path, Path]:
    target = seed_dir or dbmod.SEED_DIR
    target.mkdir(parents=True, exist_ok=True)
    orders_path = target / "hcmc_80_orders.xlsx"
    trucks_path = target / "hcmc_10_trucks.xlsx"

    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "orders"
    ws.append(ORDER_HEADERS)
    for row in order_rows():
        ws.append([row[h] for h in ORDER_HEADERS])
    wb.save(orders_path)

    tw = Workbook()
    ts = tw.active
    assert ts is not None
    ts.title = "trucks"
    ts.append(TRUCK_HEADERS)
    for row in truck_rows():
        ts.append([row[h] for h in TRUCK_HEADERS])
    tw.save(trucks_path)
    return orders_path, trucks_path


def _clear(session: Session) -> None:
    for stop in session.exec(select(Stop)).all():
        session.delete(stop)
    for route in session.exec(select(Route)).all():
        session.delete(route)
    for order in session.exec(select(Order)).all():
        session.delete(order)
    for vehicle in session.exec(select(Vehicle)).all():
        session.delete(vehicle)
    session.commit()


def seed_database(session: Session) -> SeedOut:
    write_seed_xlsx()
    # M-8: the demo seed replaces the dataset, so any synthetic label written by
    # generate_synthetic no longer describes what is in the database.
    (dbmod.SEED_DIR / dbmod.DATASET_META_NAME).unlink(missing_ok=True)
    _clear(session)
    n_orders = 0
    for row in order_rows():
        session.add(
            Order(
                address=str(row["address"]),
                lat=float(row["lat"]),  # type: ignore[arg-type]
                lng=float(row["lng"]),  # type: ignore[arg-type]
                receiver=str(row["receiver"]),
                phone=str(row["phone"]),
                kg=float(row["kg"]),  # type: ignore[arg-type]
                window_start=str(row["window_start"]),
                window_end=str(row["window_end"]),
                cargo_type=str(row["cargo_type"]),
                notes=str(row["notes"]),
                excel_row=int(row["excel_row"]),  # type: ignore[arg-type]
                status="pending",
            )
        )
        n_orders += 1
    n_vehicles = 0
    for row in truck_rows():
        session.add(
            Vehicle(
                plate=str(row["plate"]),
                type=str(row["type"]),
                capacity_kg=float(row["capacity_kg"]),  # type: ignore[arg-type]
                fuel=str(row["fuel"]),
                l_per_100km=float(row["l_per_100km"]),  # type: ignore[arg-type]
                status=str(row["status"]),
            )
        )
        n_vehicles += 1
    session.commit()
    log.info("seeded orders=%s vehicles=%s depot=%s", n_orders, n_vehicles, DEPOT_NAME)
    return SeedOut(
        orders=n_orders,
        vehicles=n_vehicles,
        depot=DepotOut(lat=DEPOT_LAT, lng=DEPOT_LNG, name=DEPOT_NAME),
    )


def main() -> SeedOut:
    dbmod.init_db(recreate=True)
    with Session(dbmod.engine) as session:
        result = seed_database(session)
    print(f"seeded orders={result.orders} vehicles={result.vehicles} depot={result.depot.name}")
    return result


if __name__ == "__main__":
    main()
