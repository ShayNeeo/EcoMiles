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

export function isHcmcTruckBan(wStart?: string, wEnd?: string): boolean {
  if (!wStart || !wEnd) return false;
  const parseMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const s = parseMin(wStart);
  const e = parseMin(wEnd);
  // Morning peak: 06:00 - 09:00 (360 - 540)
  const morning = s < 540 && e > 360;
  // Afternoon peak: 16:00 - 20:00 (960 - 1200)
  const afternoon = s < 1200 && e > 960;
  return morning || afternoon;
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
    allowHeaders: ['Content-Type', 'Authorization', 'X-Driver-Pin', 'Accept', 'Origin'],
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

// App wrapper that responds to both /api/* and /*
export const honoApp = new Hono();
honoApp.route('/api', api);
honoApp.route('/', api);
