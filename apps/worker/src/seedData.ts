/**
 * Seed data generator for EcoMiles HCMC 80 orders and 10 vehicles.
 */

import type { OrderRow, VehicleRow } from "./solver.ts";

export const DEPOT_LAT = 10.801;
export const DEPOT_LNG = 106.661;
export const DEPOT_NAME = "Tan Binh DC";

const DISTRICTS: [string, number, number][] = [
  ["Q1", 10.776, 106.700],
  ["Thu Duc", 10.850, 106.772],
  ["Q7", 10.729, 106.721],
  ["Binh Thanh", 10.810, 106.709],
  ["Phu Nhuan", 10.799, 106.675],
  ["Q3", 10.782, 106.686],
];

const CAPACITIES = [500, 800, 1000, 1500, 2000, 500, 800, 1000, 1500, 2000];
const LPK = [8, 9, 10, 11, 12, 13, 14, 8, 10, 12];

function jitter(i: number, axis: number): number {
  const raw = ((i * 37 + axis * 91) % 16000) / 1000.0;
  return (raw - 8.0) / 1000.0;
}

export function generateSeedOrders(): Omit<OrderRow, "id">[] {
  const orders: Omit<OrderRow, "id">[] = [];
  for (let i = 1; i <= 80; i++) {
    const [name, lat0, lng0] = DISTRICTS[(i - 1) % DISTRICTS.length];
    const startH = 8 + ((i - 1) % 8);
    const endH = startH + 2;

    orders.push({
      address: `${name} stop ${i.toString().padStart(2, "0")}`,
      lat: Number((lat0 + jitter(i, 0)).toFixed(6)),
      lng: Number((lng0 + jitter(i, 1)).toFixed(6)),
      receiver: `KH ${i.toString().padStart(2, "0")}`,
      phone: `09000000${i.toString().padStart(2, "0")}`,
      kg: Number((5 + ((i * 7) % 76)).toFixed(1)),
      window_start: `${startH.toString().padStart(2, "0")}:00`,
      window_end: `${endH.toString().padStart(2, "0")}:00`,
      cargo_type: "thuong",
      notes: i % 11 === 0 ? "goi truoc" : "",
      excel_row: i + 1,
      status: "pending",
      late_risk: 0,
    });
  }
  return orders;
}

export function generateSeedVehicles(): Omit<VehicleRow, "id">[] {
  const vehicles: Omit<VehicleRow, "id">[] = [];
  for (let i = 1; i <= 10; i++) {
    vehicles.push({
      plate: `51C-000.${i.toString().padStart(2, "0")}`,
      type: "xe_tai_nho",
      capacity_kg: CAPACITIES[i - 1],
      fuel: i % 2 === 1 ? "petrol" : "diesel",
      l_per_100km: LPK[i - 1],
      status: i === 10 ? "maintenance" : "ready",
    });
  }
  return vehicles;
}
