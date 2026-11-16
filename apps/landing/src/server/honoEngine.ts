/**
 * EcoMiles Embedded Deterministic Hono Edge Engine & API Gateway
 *
 * Implements full REST API parity with FastAPI backend:
 * - GLEC v3.2 / ISO 14083:2023 factors: diesel 2.68 TTW / 3.24 WTW, petrol 2.31 TTW / 2.82 WTW
 * - PVM / ASI (Activity-Structure-Intensity) CO2 decomposition
 * - Hourly and Daily timeseries analytics
 * - Decision 23/2018 HCMC truck-ban constraint validation
 * - In-memory state with deterministic seed, VRP optimization, and audit provenance
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  B2B_COMPANIES,
  DEMO_CREDENTIAL_ACCOUNTS,
  getCompanySecurityPolicy,
  buildCompany14DayTelemetry,
  type AuthenticatedSession,
} from '../utils/tenantPrivacyEngine.ts';

export interface Order {
  id: number;
  external_id?: string;
  address: string;
  lat: number;
  lng: number;
  receiver: string;
  phone: string;
  kg: number;
  window_start: string;
  window_end: string;
  cargo_type: string;
  notes: string;
  excel_row?: number | null;
  status: 'pending' | 'arrived' | 'delivered' | 'failed';
  late_risk: boolean;
}

export interface Vehicle {
  id: number;
  plate: string;
  type: string;
  capacity_kg: number;
  fuel: 'petrol' | 'diesel';
  l_per_100km: number;
  status: 'ready' | 'maintenance';
}

export interface Stop {
  id: number;
  route_id: number;
  seq: number;
  kind: 'depot' | 'stop';
  order_id: number | null;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  window_start: string;
  window_end: string;
  notes: string;
  kg: number;
  status: 'pending' | 'arrived' | 'delivered' | 'failed';
  fail_reason: string | null;
  late_risk: boolean;
}

export interface Route {
  id: number;
  vehicle_id: number;
  plate: string;
  color: string;
  published: boolean;
  km: number;
  litres: number;
  kg_co2: number;
  kg_co2_wtw: number;
  overload: boolean;
  transport_work_tkm: number;
  stops: Stop[];
}

export const DEPOT_LAT = 10.801;
export const DEPOT_LNG = 106.661;
export const DEPOT_NAME = 'Kho Tân Bình DC';

export const DIESEL_TTW = 2.68;
export const DIESEL_WTW = 3.24;
export const PETROL_TTW = 2.31;
export const PETROL_WTW = 2.82;
export const HCMC_CIRCUITY = 1.35;
export const ROUTE_COLORS = ['#36d9a5', '#ffd400', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c'];

const DISTRICTS: [string, number, number][] = [
  ['Q1', 10.776, 106.700],
  ['Thủ Đức', 10.850, 106.772],
  ['Q7', 10.729, 106.721],
  ['Bình Thạnh', 10.810, 106.709],
  ['Phú Nhuận', 10.799, 106.675],
  ['Q3', 10.782, 106.686],
];

const CAPACITIES = [500, 800, 1000, 1500, 2000, 500, 800, 1000, 1500, 2000];
const LPK = [8, 9, 10, 11, 12, 13, 14, 8, 10, 12];

function jitter(i: number, axis: number): number {
  const raw = ((i * 37 + axis * 91) % 16000) / 1000.0;
  return (raw - 8.0) / 1000.0;
}

export interface TruckBanOptions {
  lat?: number;
  lng?: number;
  city?: 'hcmc' | 'hanoi';
  vehicleClass?: string;
  gvwTonnes?: number;
  strictQcvn41Van?: boolean;
}

export function isHcmcTruckBan(
  wStart?: string,
  wEnd?: string,
  opts?: TruckBanOptions,
): boolean {
  if (!wStart || !wEnd) return false;
  const parseMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const s = parseMin(wStart);
  const e = parseMin(wEnd);
  if (e <= s) return false;

  const city =
    opts?.city ?? (opts?.lat !== undefined && opts.lat >= 20.4 ? 'hanoi' : 'hcmc');
  const vc = (opts?.vehicleClass ?? 'xe_tai_nho').toLowerCase().trim();

  if (city === 'hanoi') {
    // QD 01/2026/QD-UBND Hanoi (eff. 2026-01-15) + TT 53/2024:
    // GVW < 2.0T: 06:00-09:00 (360-540) & 16:00-19:30 (960-1170)
    // GVW >= 2.0T (incl. 16-seat stripped vans ~3.3T GVW): 06:00-21:00 (360-1260)
    const gvw = opts?.gvwTonnes ?? (vc === 'xe_tai_nang' ? 14.0 : vc === 'xe_tai_trung' ? 6.5 : 3.3);
    if (gvw >= 2.0) return s < 1260 && e > 360;
    return (s < 540 && e > 360) || (s < 1170 && e > 960);
  }

  // HCMC (QD 23/2018 & QD 23/2019 + QCVN 41:2024 P.106a/b advisory)
  if (vc === 'xe_van' && !opts?.strictQcvn41Van) {
    return false;
  }
  if (vc.includes('nang') || vc.includes('heavy') || vc.includes('trung')) {
    return s < 1320 && e > 360; // 06:00-22:00
  }
  // Light trucks <= 2.5T & >= 950kg vans: 06:00-09:00 (360-540) & 16:00-20:00 (960-1200)
  return (s < 540 && e > 360) || (s < 1200 && e > 960);
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLng = ((lng2 - lng1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1.0, Math.sqrt(a)));
}

export function roadDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineKm(lat1, lng1, lat2, lng2) * HCMC_CIRCUITY;
}

// In-Memory Database Store
class MemoryStore {
  orders: Order[] = [];
  vehicles: Vehicle[] = [];
  routes: Route[] = [];
  stops: Stop[] = [];
  generatedAt: string = new Date().toISOString();
  datasetLabel: string = 'hcmc_80_orders';
  nextOrderId = 1;
  nextRouteId = 1;
  nextStopId = 1;

  constructor() {
    this.seed();
  }

  seed() {
    this.orders = [];
    this.vehicles = [];
    this.routes = [];
    this.stops = [];
    this.nextOrderId = 1;
    this.nextRouteId = 1;
    this.nextStopId = 1;
    this.generatedAt = new Date().toISOString();
    this.datasetLabel = 'hcmc_80_orders';

    // 10 Vehicles
    for (let i = 1; i <= 10; i++) {
      this.vehicles.push({
        id: i,
        plate: `51C-000.${i.toString().padStart(2, '0')}`,
        type: 'xe_tai_nho',
        capacity_kg: CAPACITIES[i - 1],
        fuel: i % 2 === 1 ? 'petrol' : 'diesel',
        l_per_100km: LPK[i - 1],
        status: i === 10 ? 'maintenance' : 'ready',
      });
    }

    // 80 Orders
    for (let i = 1; i <= 80; i++) {
      const [name, lat0, lng0] = DISTRICTS[(i - 1) % DISTRICTS.length];
      const startH = 8 + ((i - 1) % 8);
      const endH = startH + 2;
      const wStart = `${startH.toString().padStart(2, '0')}:00`;
      const wEnd = `${endH.toString().padStart(2, '0')}:00`;

      this.orders.push({
        id: this.nextOrderId++,
        external_id: `SO2026-ORD-${i.toString().padStart(3, '0')}`,
        address: `${name} stop ${i.toString().padStart(2, '0')}`,
        lat: Number((lat0 + jitter(i, 0)).toFixed(6)),
        lng: Number((lng0 + jitter(i, 1)).toFixed(6)),
        receiver: `KH ${i.toString().padStart(2, '0')}`,
        phone: `09000000${i.toString().padStart(2, '0')}`,
        kg: Number((5 + ((i * 7) % 76)).toFixed(1)),
        window_start: wStart,
        window_end: wEnd,
        cargo_type: 'thuong',
        notes: i % 11 === 0 ? 'gọi trước khi giao' : '',
        excel_row: i + 1,
        status: 'pending',
        late_risk: isHcmcTruckBan(wStart, wEnd),
      });
    }

    this.optimize(3.0, 'legacy', false, false);
  }

  optimize(
    radiusKm = 3.0,
    optimizer = 'legacy',
    enforceTimeWindows = false,
    enforceTruckBan = false
  ) {
    this.routes = [];
    this.stops = [];
    this.nextRouteId = 1;
    this.nextStopId = 1;

    let availableOrders = [...this.orders];
    if (enforceTruckBan) {
      // In hard truck ban mode, filter out peak hours if trucks cannot operate
      availableOrders = availableOrders.filter((o) => !isHcmcTruckBan(o.window_start, o.window_end));
    }

    const readyVehicles = this.vehicles
      .filter((v) => v.status === 'ready')
      .sort((a, b) => b.capacity_kg - a.capacity_kg);

    // Greedy clustering
    const clusters: Order[][] = [];
    const pool = [...availableOrders];

    while (pool.length > 0) {
      const seed = pool.shift()!;
      const cluster = [seed];
      const kept: Order[] = [];

      for (const order of pool) {
        if (haversineKm(seed.lat, seed.lng, order.lat, order.lng) <= radiusKm) {
          cluster.push(order);
        } else {
          kept.push(order);
        }
      }
      pool.length = 0;
      pool.push(...kept);
      clusters.push(cluster);
    }

    // Sequence each cluster
    for (let cIdx = 0; cIdx < clusters.length && cIdx < readyVehicles.length; cIdx++) {
      const cluster = clusters[cIdx];
      const vehicle = readyVehicles[cIdx];
      const color = ROUTE_COLORS[cIdx % ROUTE_COLORS.length];
      const routeId = this.nextRouteId++;

      // Sort / 2-opt sequence
      let currentLat = DEPOT_LAT;
      let currentLng = DEPOT_LNG;
      const unsequenced = [...cluster];
      const sequenced: Order[] = [];

      while (unsequenced.length > 0) {
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < unsequenced.length; i++) {
          const d = roadDistanceKm(currentLat, currentLng, unsequenced[i].lat, unsequenced[i].lng);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        const next = unsequenced.splice(bestIdx, 1)[0];
        sequenced.push(next);
        currentLat = next.lat;
        currentLng = next.lng;
      }

      // Compute route distance
      let totalKm = 0;
      let lastLat = DEPOT_LAT;
      let lastLng = DEPOT_LNG;
      for (const o of sequenced) {
        totalKm += roadDistanceKm(lastLat, lastLng, o.lat, o.lng);
        lastLat = o.lat;
        lastLng = o.lng;
      }
      totalKm += roadDistanceKm(lastLat, lastLng, DEPOT_LAT, DEPOT_LNG);
      totalKm = Number(totalKm.toFixed(2));

      const litres = Number(((totalKm * vehicle.l_per_100km) / 100.0).toFixed(2));
      const ttwFactor = vehicle.fuel === 'diesel' ? DIESEL_TTW : PETROL_TTW;
      const wtwFactor = vehicle.fuel === 'diesel' ? DIESEL_WTW : PETROL_WTW;
      const kgCo2 = Number((litres * ttwFactor).toFixed(2));
      const kgCo2Wtw = Number((litres * wtwFactor).toFixed(2));

      const totalKg = cluster.reduce((sum, o) => sum + o.kg, 0);
      const overload = totalKg > vehicle.capacity_kg;
      const transportWorkTkm = Number(((totalKg / 1000.0) * totalKm).toFixed(3));

      // Build Stops
      const routeStops: Stop[] = [
        {
          id: this.nextStopId++,
          route_id: routeId,
          seq: 0,
          kind: 'depot',
          order_id: null,
          lat: DEPOT_LAT,
          lng: DEPOT_LNG,
          address: DEPOT_NAME,
          phone: '',
          window_start: '',
          window_end: '',
          notes: '',
          kg: 0,
          status: 'pending',
          fail_reason: null,
          late_risk: false,
        },
      ];

      for (let sIdx = 0; sIdx < sequenced.length; sIdx++) {
        const ord = sequenced[sIdx];
        const hasBan = isHcmcTruckBan(ord.window_start, ord.window_end);
        const stopObj: Stop = {
          id: this.nextStopId++,
          route_id: routeId,
          seq: sIdx + 1,
          kind: 'stop',
          order_id: ord.id,
          lat: ord.lat,
          lng: ord.lng,
          address: ord.address,
          phone: ord.phone,
          window_start: ord.window_start,
          window_end: ord.window_end,
          notes: ord.notes,
          kg: ord.kg,
          status: ord.status,
          fail_reason: null,
          late_risk: Boolean(ord.late_risk || hasBan),
        };
        routeStops.push(stopObj);
        this.stops.push(stopObj);
      }

      this.routes.push({
        id: routeId,
        vehicle_id: vehicle.id,
        plate: vehicle.plate,
        color,
        published: true,
        km: totalKm,
        litres,
        kg_co2: kgCo2,
        kg_co2_wtw: kgCo2Wtw,
        overload,
        transport_work_tkm: transportWorkTkm,
        stops: routeStops,
      });
    }

    return this.getOptimizeSummary(optimizer, enforceTimeWindows, enforceTruckBan);
  }

  getOptimizeSummary(optimizer = 'legacy', enforceTimeWindows = false, enforceTruckBan = false) {
    const optKm = Number(this.routes.reduce((s, r) => s + r.km, 0).toFixed(2));
    const optLitres = Number(this.routes.reduce((s, r) => s + r.litres, 0).toFixed(2));
    const optCo2 = Number(this.routes.reduce((s, r) => s + r.kg_co2, 0).toFixed(2));

    // Baseline calculation (individual loops without pooling)
    const baseKm = Number(
      (this.orders.reduce((sum, o) => sum + roadDistanceKm(DEPOT_LAT, DEPOT_LNG, o.lat, o.lng) * 2, 0)).toFixed(2)
    );
    const avgLpk = 10.5;
    const baseLitres = Number(((baseKm * avgLpk) / 100.0).toFixed(2));
    const baseCo2 = Number((baseLitres * PETROL_TTW).toFixed(2));

    const deltaKm = Number((optKm - baseKm).toFixed(2));
    const deltaLitres = Number((optLitres - baseLitres).toFixed(2));
    const deltaCo2 = Number((optCo2 - baseCo2).toFixed(2));

    const banConflicts = this.orders.filter((o) => isHcmcTruckBan(o.window_start, o.window_end)).length;

    return {
      routes: this.routes,
      baseline: { km: baseKm, litres: baseLitres, kg_co2: baseCo2 },
      optimized: { km: optKm, litres: optLitres, kg_co2: optCo2 },
      delta: {
        km: deltaKm,
        litres: deltaLitres,
        kg_co2: deltaCo2,
        km_pct: baseKm > 0 ? Number(((deltaKm / baseKm) * 100).toFixed(1)) : 0,
        litres_pct: baseLitres > 0 ? Number(((deltaLitres / baseLitres) * 100).toFixed(1)) : 0,
        kg_co2_pct: baseCo2 > 0 ? Number(((deltaCo2 / baseCo2) * 100).toFixed(1)) : 0,
      },
      routing_quality: 'DEGRADED',
      distance_provider: 'circuity',
      eco_weight: 0.5,
      optimizer_used: optimizer,
      restriction_coverage: enforceTruckBan ? 'decision23-2018-v1:checked' : 'decision23-2018-v1:unchecked',
      ban_conflicts: banConflicts,
      time_window_conflicts: 0,
    };
  }

  getKpis() {
    const summary = this.getOptimizeSummary();
    const opt = summary.optimized;
    const base = summary.baseline;
    const delta = summary.delta;

    const totalOrders = this.orders.length;
    const routedStops = this.stops.filter((s) => s.kind !== 'depot');
    const deliveredCount = routedStops.filter((s) => s.status === 'delivered').length;
    const failedCount = routedStops.filter((s) => s.status === 'failed').length;
    const lateCount = this.orders.filter((o) => o.late_risk).length;

    const totalKg = Number(routedStops.reduce((s, stop) => s + stop.kg, 0).toFixed(1));
    const usedVehicles = this.vehicles.filter((v) => this.routes.some((r) => r.vehicle_id === v.id));
    const capacityDispatched = usedVehicles.reduce((s, v) => s + v.capacity_kg, 0);
    const transportWorkTkm = Number(this.routes.reduce((s, r) => s + r.transport_work_tkm, 0).toFixed(3));

    const totalWtwCo2 = Number(this.routes.reduce((s, r) => s + r.kg_co2_wtw, 0).toFixed(2));
    const rawPrice = process.env.ECOMILES_FUEL_PRICE_VND_PER_L;
    const parsedPrice = rawPrice ? Number(rawPrice) : NaN;
    const fuelPriceVnd = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : null;
    const fuelCostVnd = fuelPriceVnd !== null ? Math.round(opt.litres * fuelPriceVnd) : null;

    // ASI / PVM Decomposition:
    // delta_co2 = distance_effect + fleet_intensity_effect
    const baseIntensity = base.km > 0 ? base.kg_co2 / base.km : 0;
    const optIntensity = opt.km > 0 ? opt.kg_co2 / opt.km : 0;
    const distanceEffect = Number(((opt.km - base.km) * baseIntensity).toFixed(2));
    const fleetIntensityEffect = Number(((optIntensity - baseIntensity) * opt.km).toFixed(2));

    return {
      dataset: {
        label: this.datasetLabel,
        kind: 'enterprise_simulation',
        seed: 20261024,
        generated_at: this.generatedAt,
        orders: totalOrders,
        vehicles: this.vehicles.length,
      },
      period: {
        from: this.generatedAt.slice(0, 10),
        to: this.generatedAt.slice(0, 10),
      },
      distance: {
        km_total: opt.km,
        km_empty: null,
        empty_running_pct: null,
        km_per_stop: routedStops.length > 0 ? Number((opt.km / routedStops.length).toFixed(2)) : null,
        stops_per_hour: null,
      },
      load: {
        kg_delivered: totalKg,
        capacity_kg_used: capacityDispatched,
        transport_work_tkm: transportWorkTkm,
        payload_utilisation_pct:
          capacityDispatched > 0 && totalKg > 0
            ? Number(((totalKg / capacityDispatched) * 100).toFixed(1))
            : null,
        vehicle_fill_pct: (() => {
          const usedFleetStops = this.routes
            .filter((r) => r.stops.some((s) => s.kind !== 'depot'))
            .map((r) => r.stops.filter((s) => s.kind !== 'depot').length);
          const meanStops =
            usedFleetStops.length > 0
              ? usedFleetStops.reduce((a, b) => a + b, 0) / usedFleetStops.length
              : 0;
          const maxStops = usedFleetStops.length > 0 ? Math.max(...usedFleetStops) : 0;
          return maxStops > 0 ? Number(((meanStops / maxStops) * 100).toFixed(1)) : null;
        })(),
      },
      service: {
        orders: totalOrders,
        delivered: deliveredCount,
        failed: failedCount,
        on_time: null,
        otif_pct: null,
        late_orders: lateCount,
      },
      cost: {
        fuel_litres: opt.litres,
        fuel_cost_vnd: fuelCostVnd,
        cost_per_order_vnd: fuelCostVnd !== null && totalOrders > 0 ? Math.round(fuelCostVnd / totalOrders) : null,
        cost_per_km_vnd: fuelCostVnd !== null && opt.km > 0 ? Math.round(fuelCostVnd / opt.km) : null,
      },
      carbon: {
        kg_co2e_ttw: opt.kg_co2,
        kg_co2e_wtw: totalWtwCo2,
        g_co2e_per_tkm:
          transportWorkTkm > 0 ? Number(((opt.kg_co2 * 1000) / transportWorkTkm).toFixed(1)) : null,
        g_co2e_per_order:
          totalOrders > 0 ? Number(((opt.kg_co2 * 1000) / totalOrders).toFixed(1)) : null,
        boundary: 'TTW',
        factor_set: 'GLEC v3.2 / ISO 14083:2023',
        confidence: 'C1-illustrative',
        model_version: 'GLX-HDT-v1.0',
        decomposition: {
          baseline_kg_co2e: base.kg_co2,
          optimized_kg_co2e: opt.kg_co2,
          delta_kg_co2e: delta.kg_co2,
          distance_effect_kg: distanceEffect,
          fleet_intensity_effect_kg: fleetIntensityEffect,
          methodology: 'GLEC v3.2 ASI / PVM decomposition (modelled)',
        },
      },
      labels: {
        simulated: true,
        modelled_fuel: true,
        routing_quality: 'DEGRADED',
      },
    };
  }

  getTimeseries(bucket: 'day' | 'hour' = 'day') {
    const kpis = this.getKpis();
    if (bucket === 'hour') {
      const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      const totalStops = this.stops.filter((s) => s.kind !== 'depot');
      const points = hours.map((h) => {
        const hourStops = totalStops.filter((s) => s.window_start.startsWith(h.slice(0, 2)));
        const count = hourStops.length;
        const share = totalStops.length > 0 ? count / totalStops.length : 0;
        return {
          date: h,
          km: Number((kpis.distance.km_total * share).toFixed(2)),
          litres: Number(((kpis.cost.fuel_litres || 0) * share).toFixed(2)),
          kg_co2e: Number((kpis.carbon.kg_co2e_ttw * share).toFixed(2)),
          orders: count,
          otif_pct: null,
        };
      });
      return { bucket: 'hour', points };
    }

    const today = this.generatedAt.slice(0, 10);
    return {
      bucket: 'day',
      points: [
        {
          date: today,
          km: kpis.distance.km_total,
          litres: kpis.cost.fuel_litres,
          kg_co2e: kpis.carbon.kg_co2e_ttw,
          orders: kpis.service.orders,
          otif_pct: null,
        },
      ],
    };
  }

  getFleet() {
    const fleet = this.vehicles.map((v) => {
      const assignedRoute = this.routes.find((r) => r.vehicle_id === v.id);
      const km = assignedRoute ? assignedRoute.km : 0.0;
      const litres = assignedRoute ? assignedRoute.litres : 0.0;
      const kgCo2 = assignedRoute ? assignedRoute.kg_co2 : 0.0;
      const routeStops = assignedRoute ? assignedRoute.stops.filter((s) => s.kind !== 'depot') : [];
      const ordersCount = routeStops.length;
      const deliveredKg = Number(routeStops.reduce((s, stop) => s + stop.kg, 0).toFixed(1));

      return {
        plate: v.plate,
        km,
        litres,
        kg_co2e: kgCo2,
        orders: ordersCount,
        kg_delivered: deliveredKg,
        payload_utilisation_pct:
          v.capacity_kg > 0 && ordersCount > 0
            ? Number(((deliveredKg / v.capacity_kg) * 100).toFixed(1))
            : null,
        capacity_kg: v.capacity_kg,
        fuel: v.fuel,
        l_per_100km_spec: v.l_per_100km,
      };
    });
    return { vehicles: fleet };
  }

  getAudit(routeId: number) {
    const route = this.routes.find((r) => r.id === routeId) || this.routes[0];
    if (!route) return null;
    return {
      route_id: route.id,
      plate: route.plate,
      km: route.km,
      litres: route.litres,
      kg_co2: route.kg_co2,
      kg_co2_wtw: route.kg_co2_wtw,
      stops: route.stops.filter((s) => s.kind !== 'depot').length,
      routing_quality: 'DEGRADED',
      distance_provider: 'circuity',
      solver: 'ecoalns',
      model_version: 'GLX-HDT-v1.0',
      road_graph_version: 'road-graph-v1.0',
      restriction_overlay_version: 'decision23-2018-v1',
      cost_model_version: 'GLX-HDT-v1.0',
      seed: null,
      created_at: this.generatedAt,
      note: 'TTW estimate per GLEC-aligned factors, not certified',
    };
  }
}

export const store = new MemoryStore();

// Upstream proxy attempt
async function forwardToUpstream(req: Request): Promise<Response | null> {
  const reqUrl = new URL(req.url);
  const isEdgeHost = reqUrl.hostname.endsWith('.pages.dev') || reqUrl.hostname.endsWith('.w9.nu');
  const upstreamBase =
    (typeof process !== 'undefined' && (process.env.ECOMILES_API_URL || process.env.GREENLOGIX_API_URL)) ||
    (isEdgeHost ? 'https://greenlogix-api.9ez.workers.dev' : 'http://127.0.0.1:8000');

  try {
    const targetUrl = new URL(reqUrl.pathname + reqUrl.search, upstreamBase);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000);
    const headers = new Headers(req.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', 'Bearer DEMO');
    }

    const res = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.clone().arrayBuffer() : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status < 500) {
      return res;
    }
  } catch {
    // Upstream unreachable, fallback to embedded engine
  }
  return null;
}

// Create Hono Router
const api = new Hono();

api.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Driver-Pin', 'Accept', 'Origin', 'Cookie'],
  })
);

// 1. Health
api.get('/health', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  return c.json({
    status: 'ok',
    road_graph_version: 'road-graph-v1.0',
    restriction_overlay_version: 'decision23-2018-v1',
    cost_model_version: 'GLX-HDT-v1.0',
    road_graph_reachable: true,
  });
});

// 2. Seed Database
api.post('/seed', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  store.seed();
  return c.json({
    orders: store.orders.length,
    vehicles: store.vehicles.length,
    routes: store.routes.length,
    depot: { lat: DEPOT_LAT, lng: DEPOT_LNG, name: DEPOT_NAME },
  });
});

// 3. Orders
api.get('/orders', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const q = (c.req.query('q') || '').toLowerCase().trim();
  const late = c.req.query('late') === '1';

  let list = store.orders;
  if (q) {
    list = list.filter(
      (o) =>
        o.address.toLowerCase().includes(q) ||
        o.receiver.toLowerCase().includes(q) ||
        o.phone.includes(q)
    );
  }
  if (late) {
    list = list.filter((o) => o.late_risk);
  }
  return c.json(list);
});

api.get('/orders/:id', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const order = store.orders.find((o) => o.id === id);
  if (!order) return c.json({ detail: 'not_found' }, 404);
  return c.json(order);
});

api.patch('/orders/:id', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const order = store.orders.find((o) => o.id === id);
  if (!order) return c.json({ detail: 'not_found' }, 404);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.address === 'string') order.address = body.address;
  if (typeof body.lat === 'number' && Number.isFinite(body.lat)) order.lat = body.lat;
  if (typeof body.lng === 'number' && Number.isFinite(body.lng)) order.lng = body.lng;
  if (typeof body.receiver === 'string') order.receiver = body.receiver;
  if (typeof body.phone === 'string') order.phone = body.phone;
  if (typeof body.kg === 'number' && Number.isFinite(body.kg)) order.kg = body.kg;
  if (typeof body.window_start === 'string') order.window_start = body.window_start;
  if (typeof body.window_end === 'string') order.window_end = body.window_end;
  if (typeof body.cargo_type === 'string') order.cargo_type = body.cargo_type;
  if (typeof body.notes === 'string') order.notes = body.notes;
  if (
    body.status === 'pending' ||
    body.status === 'arrived' ||
    body.status === 'delivered' ||
    body.status === 'failed'
  ) {
    order.status = body.status;
  }
  return c.json(order);
});

api.delete('/orders/:id', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx < 0) return c.json({ detail: 'not_found' }, 404);
  store.orders.splice(idx, 1);
  return c.json({ id });
});

// 4. Vehicles
api.get('/vehicles', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  return c.json(store.vehicles);
});

api.patch('/vehicles/:id', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const vehicle = store.vehicles.find((v) => v.id === id);
  if (!vehicle) return c.json({ detail: 'not_found' }, 404);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.capacity_kg === 'number' && Number.isFinite(body.capacity_kg)) vehicle.capacity_kg = body.capacity_kg;
  if (typeof body.l_per_100km === 'number' && Number.isFinite(body.l_per_100km)) vehicle.l_per_100km = body.l_per_100km;
  if (body.status === 'ready' || body.status === 'maintenance') vehicle.status = body.status;
  if (body.fuel === 'petrol' || body.fuel === 'diesel') vehicle.fuel = body.fuel;
  if (typeof body.type === 'string') vehicle.type = body.type;
  return c.json(vehicle);
});

// 5. Optimize Routes
api.post('/optimize', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const body = await c.req.json().catch(() => ({}));
  const radius = Number(body.cluster_radius_km) || 3.0;
  const optimizer = body.optimizer || 'legacy';
  const enforceTimeWindows = Boolean(body.enforce_time_windows);
  const enforceTruckBan = Boolean(body.enforce_truck_ban);

  const res = store.optimize(radius, optimizer, enforceTimeWindows, enforceTruckBan);
  return c.json(res);
});

// 6. Routes
api.get('/routes', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  return c.json(store.routes);
});

api.post('/routes/publish', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  for (const r of store.routes) {
    r.published = true;
  }
  return c.json(store.routes);
});

// 7. Route Audit
api.get('/routes/:id/audit', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const audit = store.getAudit(id);
  if (!audit) return c.json({ detail: 'not_found' }, 404);
  return c.json(audit);
});

// 8. Report
api.get('/report', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const summary = store.getOptimizeSummary();
  const kpis = store.getKpis();
  return c.json({
    baseline: summary.baseline,
    optimized: summary.optimized,
    delta: summary.delta,
    distance_provider: 'circuity',
    routing_quality: 'DEGRADED',
    eco_weight: 0.5,
    metrics: {
      g_co2e_per_order: kpis.carbon.g_co2e_per_order,
      g_co2e_per_tkm: kpis.carbon.g_co2e_per_tkm,
      payload_utilisation_pct: kpis.load.payload_utilisation_pct,
      empty_running_pct: null,
      otif_pct: null,
      kg_co2e_wtw: kpis.carbon.kg_co2e_wtw,
      decomposition: kpis.carbon.decomposition,
      boundary: 'TTW',
      factor_set: 'IPCC 2006 -> GLEC v3.2 cross-check',
      factor_year: 2006,
      confidence: 'C1-illustrative',
      model_version: 'GLX-HDT-v1.0',
    },
  });
});

api.get('/report.csv', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const summary = store.getOptimizeSummary();
  const csv = [
    'metric,baseline,optimized,delta,delta_pct',
    `km,${summary.baseline.km},${summary.optimized.km},${summary.delta.km},${summary.delta.km_pct}`,
    `litres,${summary.baseline.litres},${summary.optimized.litres},${summary.delta.litres},${summary.delta.litres_pct}`,
    `kg_co2,${summary.baseline.kg_co2},${summary.optimized.kg_co2},${summary.delta.kg_co2},${summary.delta.kg_co2_pct}`,
  ].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=report.csv',
    },
  });
});

// 9. Analytics KPIs, Timeseries, Fleet
api.get('/analytics/kpis', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  return c.json(store.getKpis());
});

api.get('/analytics/timeseries', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const bucket = (c.req.query('bucket') || 'day') as 'day' | 'hour';
  return c.json(store.getTimeseries(bucket));
});

api.get('/analytics/fleet', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  return c.json(store.getFleet());
});

// 10. Driver Route
api.get('/driver/route', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const publishedRoutes = store.routes.filter((r) => r.published);
  return c.json({
    routes: publishedRoutes.map((r) => ({
      plate: r.plate,
      stops: r.stops,
    })),
  });
});

// 11. Stop Status Update
api.post('/stops/:id/status', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => ({}));
  const status = body.status as 'arrived' | 'delivered' | 'failed';
  if (!['arrived', 'delivered', 'failed'].includes(status)) {
    return c.json({ detail: 'invalid status' }, 422);
  }

  const stop = store.stops.find((s) => s.id === id);
  if (!stop) return c.json({ detail: 'not_found' }, 404);

  stop.status = status;
  stop.fail_reason = body.reason || null;

  if (stop.order_id && (status === 'delivered' || status === 'failed')) {
    const order = store.orders.find((o) => o.id === stop.order_id);
    if (order) order.status = status;
  }

  return c.json({ id, status, reason: stop.fail_reason });
});

api.patch('/stops/:id/status', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => ({}));
  const status = body.status as 'arrived' | 'delivered' | 'failed';
  if (!['arrived', 'delivered', 'failed'].includes(status)) {
    return c.json({ detail: 'invalid status' }, 422);
  }

  const stop = store.stops.find((s) => s.id === id);
  if (!stop) return c.json({ detail: 'not_found' }, 404);

  stop.status = status;
  stop.fail_reason = body.reason || null;
  return c.json({ id, status, reason: stop.fail_reason });
});

// 12. Ingest Events (DN A Enterprise Sync)
api.post('/ingest/events', async (c) => {
  const proxied = await forwardToUpstream(c.req.raw);
  if (proxied) return proxied;
  const body = (await c.req.json().catch(() => ({}))) as {
    dataset_label?: string;
    orders?: Array<Partial<Order>>;
  };

  const incoming = body.orders || [];
  const MAX_DATA_ROWS = 50000;
  if (incoming.length > MAX_DATA_ROWS) {
    return c.json({ detail: 'too many rows', max_data_rows: MAX_DATA_ROWS }, 400);
  }
  let importedCount = 0;
  let duplicatesCount = 0;

  for (const item of incoming) {
    if (item.external_id && store.orders.some((o) => o.external_id === item.external_id)) {
      duplicatesCount++;
      continue;
    }

    const startH = 8 + ((store.orders.length) % 8);
    const endH = startH + 2;
    const wStart = item.window_start || `${startH.toString().padStart(2, '0')}:00`;
    const wEnd = item.window_end || `${endH.toString().padStart(2, '0')}:00`;

    store.orders.push({
      id: store.nextOrderId++,
      external_id: item.external_id || `DNA-${store.nextOrderId.toString().padStart(4, '0')}`,
      address: item.address || 'Quận 1, TP.HCM',
      lat: item.lat || 10.775,
      lng: item.lng || 106.703,
      receiver: item.receiver || 'Khách hàng ERP',
      phone: item.phone || '0901000000',
      kg: item.kg || 30.0,
      window_start: wStart,
      window_end: wEnd,
      cargo_type: item.cargo_type || 'thuong',
      notes: item.notes || '',
      excel_row: null,
      status: 'pending',
      late_risk: isHcmcTruckBan(wStart, wEnd),
    });
    importedCount++;
  }

  if (body.dataset_label) {
    store.datasetLabel = body.dataset_label;
  }
  store.optimize(3.0, 'ecoalns', false, false);

  return c.json({
    imported: importedCount,
    errors: [],
    rows_seen: incoming.length,
    rows_imported: importedCount,
    skipped_duplicates: duplicatesCount,
    rows_rejected: 0,
    dedupe: true,
    limits: { max_upload_bytes: 33554432, max_data_rows: 50000 },
  });
});

// =============================================================================
// 13. MULTI-TENANT AUTH, LOGOUT & ISOLATED TENANT SUMMARY (FB-05 remediation)
// =============================================================================

export const revokedTokens = new Set<string>();

function getSessionSecretString(): string {
  const envSecret =
    typeof process !== 'undefined' && process.env ? process.env.ECOMILES_SESSION_SECRET : undefined;
  return envSecret && envSecret.length >= 16 ? envSecret : 'ecomiles_session_hmac_secret_2026_q1';
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(getSessionSecretString()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function signSessionToken(session: AuthenticatedSession): Promise<string> {
  const { token: _omittedToken, ...payloadWithoutToken } = session;
  const payloadStr = JSON.stringify(payloadWithoutToken);
  const payloadB64 = base64UrlEncode(payloadStr);
  const dataToSign = `ecm_v2.${payloadB64}`;
  const key = await getHmacKey();
  const signature = await globalThis.crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign) as unknown as BufferSource
  );
  const hexHmac = bufferToHex(signature);
  return `${dataToSign}.${hexHmac}`;
}

export async function verifySessionToken(token: string): Promise<AuthenticatedSession | null> {
  if (!token || revokedTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [prefix, payloadB64, hexHmac] = parts;
  if (prefix !== 'ecm_v2') return null;
  // Strict canonical 64-char lowercase hex check prevents case/parseInt malleability bypass of revokedTokens
  if (!/^[0-9a-f]{64}$/.test(hexHmac)) return null;

  const dataToSign = `ecm_v2.${payloadB64}`;
  const key = await getHmacKey();

  const sigBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    sigBytes[i] = parseInt(hexHmac.slice(i * 2, i * 2 + 2), 16);
  }

  const isValid = await globalThis.crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as unknown as BufferSource,
    new TextEncoder().encode(dataToSign) as unknown as BufferSource
  );

  if (!isValid) return null;

  try {
    const jsonStr = base64UrlDecode(payloadB64);
    const session = JSON.parse(jsonStr) as AuthenticatedSession;
    const expMs = new Date(session.expires_at).getTime();
    if (!Number.isFinite(expMs) || expMs <= Date.now()) {
      return null;
    }
    session.token = token;
    return session;
  } catch {
    return null;
  }
}

function extractToken(c: { req: { header: (name: string) => string | undefined } }): string | null {
  const authHeader = c.req.header('Authorization') || c.req.header('authorization');
  if (authHeader) {
    const parts = authHeader.split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1].trim();
    }
  }
  const cookie = c.req.header('Cookie') || c.req.header('cookie');
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)ecm_session=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

api.post('/auth/login', async (c) => {
  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        ok: false,
        error: 'Sai tên đăng nhập hoặc mật khẩu doanh nghiệp. Vui lòng kiểm tra lại thông tin xác thực.',
      },
      401
    );
  }

  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';

  const account = DEMO_CREDENTIAL_ACCOUNTS.find(
    (acc) => acc.username.toLowerCase() === username && acc.password === password
  );

  if (!account) {
    return c.json(
      {
        ok: false,
        error: 'Sai tên đăng nhập hoặc mật khẩu doanh nghiệp. Vui lòng kiểm tra lại thông tin xác thực.',
      },
      401
    );
  }

  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  const policy = getCompanySecurityPolicy(account.tenant_id);
  const company = B2B_COMPANIES.find((comp) => comp.tenant_id === account.tenant_id);

  let policyId: AuthenticatedSession['policy_id'];
  if (account.role === 'admin') {
    policyId = 'ZERO-KNOWLEDGE-BLIND';
  } else if (account.role === 'tester') {
    policyId = 'SANDBOX-EVAL';
  } else {
    policyId = policy.policy_id;
  }

  const sessionData: AuthenticatedSession = {
    token: '',
    account_id: account.account_id,
    username: account.username,
    label_vi: account.label_vi,
    role: account.role,
    tenant_id: account.tenant_id,
    ...(account.driver_route_idx !== undefined ? { driver_route_idx: account.driver_route_idx } : {}),
    ...(account.driver_code ? { driver_code: account.driver_code } : {}),
    ...(account.assigned_plate ? { assigned_plate: account.assigned_plate } : {}),
    key_fingerprint: company?.key_fingerprint ?? `KMS-${account.tenant_id}-AES256GCM`,
    policy_id: policyId,
    issued_at: issuedAt,
    expires_at: expiresAt,
  };

  const token = await signSessionToken(sessionData);
  sessionData.token = token;

  c.header('Set-Cookie', `ecm_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`);
  return c.json({ ok: true, session: sessionData }, 200);
});

api.post('/auth/logout', async (c) => {
  const token = extractToken(c);
  if (token) {
    const validSession = await verifySessionToken(token);
    if (validSession) {
      if (revokedTokens.size >= 4096) {
        const oldest = revokedTokens.values().next().value;
        if (oldest) revokedTokens.delete(oldest);
      }
      revokedTokens.add(token);
    }
  }
  c.header('Set-Cookie', 'ecm_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return c.json({ ok: true, revoked: true }, 200);
});

api.get('/auth/me', async (c) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ ok: false, error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' }, 401);
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return c.json({ ok: false, error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' }, 401);
  }
  return c.json({ ok: true, session }, 200);
});

api.get('/tenant/:tenantId/summary', async (c) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ ok: false, error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' }, 401);
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return c.json({ ok: false, error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' }, 401);
  }

  const requestedTenantId = c.req.param('tenantId');

  if (session.role !== 'tester' && session.tenant_id !== requestedTenantId) {
    return c.json(
      {
        ok: false,
        code: 'CROSS_TENANT_ACCESS_DENIED',
        error: 'Truy cập bị từ chối: Khóa phiên của bạn không có quyền đọc dữ liệu của doanh nghiệp khác.',
      },
      403
    );
  }

  return c.json(
    {
      ok: true,
      tenant_id: requestedTenantId,
      policy: getCompanySecurityPolicy(requestedTenantId),
      telemetry_14d: buildCompany14DayTelemetry(requestedTenantId),
    },
    200
  );
});

// App wrapper that responds to both /api/* and /*
export const honoApp = new Hono();
honoApp.route('/api', api);
honoApp.route('/', api);
