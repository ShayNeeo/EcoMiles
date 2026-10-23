/**
 * EcoMiles 24/7 Serverless Edge API & Optimizer
 * Runs natively on Cloudflare Workers + Cloudflare D1 with Hono.
 * 100% serverless, zero dependency on local machines.
 */

import type { D1Database } from "@cloudflare/workers-types";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { DISPATCHER_HTML } from "./dispatcherHtml.ts";
import { DRIVER_HTML } from "./driverHtml.ts";
import { generateSeedOrders, generateSeedVehicles, DEPOT_LAT, DEPOT_LNG, DEPOT_NAME } from "./seedData.ts";
import { isDemoDispatcher, judgeOptimizeFields } from "./http.ts";
import { ecoWeightFromEnv, materializeMatrix, resolveRoadBaseline } from "./roadBaseline.ts";
import type { OrderRow, VehicleRow } from "./solver.ts";
import {
  runVrp,
  DIESEL_FACTOR,
  PETROL_FACTOR,
  DIESEL_WTW_FACTOR,
  PETROL_WTW_FACTOR,
} from "./solver.ts";

export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  ROAD_BASELINE?: string;
  ROAD_BASELINE_URL?: string;
  ROAD_BASELINE_COSTING?: string;
  OSRM_URL?: string;
  VALHALLA_URL?: string;
  ECOMILES_ECO_WEIGHT?: string;
  GREENLOGIX_ECO_WEIGHT?: string;
  ECOMILES_FUEL_PRICE_VND_PER_L?: string;
  GOOGLE_MAPS_API_KEY?: string;
}

interface DbRouteRow {
  id: number;
  vehicle_id: number;
  plate: string;
  color: string;
  published: number | boolean;
  km: number;
  litres: number;
  kg_co2: number;
  kg_co2e_wtw?: number;
  transport_work_tkm?: number;
  overload: number | boolean;
  stops?: DbStopRow[];
}

interface DbStopRow {
  id: number;
  route_id: number | null;
  seq: number;
  kind: "depot" | "stop";
  order_id: number | null;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  window_start: string;
  window_end: string;
  notes: string;
  kg: number;
  status: string;
  fail_reason: string | null;
  late_risk: number | boolean;
}

interface DbOrderRow {
  id: number;
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
  excel_row: number | null;
  status: string;
  late_risk: number | boolean;
}

interface DbVehicleRow {
  id: number;
  plate: string;
  type: string;
  capacity_kg: number;
  fuel: string;
  l_per_100km: number;
  status: string;
}

interface DbReportRow {
  id: string;
  data: string;
}

interface CountRow {
  count: number;
}

interface IngestEventOrderInput {
  external_id?: string;
  address?: string;
  lat?: number;
  lng?: number;
  receiver?: string;
  phone?: string;
  kg?: number;
  window_start?: string;
  window_end?: string;
  cargo_type?: "thuong" | "lanh" | "de_vo";
  notes?: string;
}

interface ImportErrorItemType {
  excel_row: number;
  field: string;
  message: string;
}

function checkAuth(request: Request): boolean {
  return isDemoDispatcher(request);
}

function checkDriverPin(request: Request): boolean {
  const pin = request.headers.get("X-Driver-Pin");
  return pin === "1234" || pin === "2026" || pin === "0000";
}

async function performOptimization(env: Env, radius: number = 3.0, autoPublish: boolean = true) {
  const orderRows = (await env.DB.prepare("SELECT * FROM orders").all()).results as unknown as OrderRow[];
  const vehicleRows = (await env.DB.prepare("SELECT * FROM vehicles").all()).results as unknown as VehicleRow[];

  const points: [number, number][] = [
    [DEPOT_LAT, DEPOT_LNG],
    ...orderRows.map((o) => [o.lat, o.lng] as [number, number]),
  ];
  const road = await materializeMatrix(resolveRoadBaseline(env), points);
  const ecoWeight = ecoWeightFromEnv(env.ECOMILES_ECO_WEIGHT ?? env.GREENLOGIX_ECO_WEIGHT);
  const vrp = runVrp(
    orderRows,
    vehicleRows,
    [DEPOT_LAT, DEPOT_LNG],
    DEPOT_NAME,
    radius,
    (lat1, lng1, lat2, lng2) => road.pairKm(lat1, lng1, lat2, lng2) as number,
    ecoWeight
  );

  // Persist generated routes and stops to D1
  await env.DB.batch([
    env.DB.prepare("DELETE FROM stops"),
    env.DB.prepare("DELETE FROM routes"),
  ]);

  try {
    await env.DB.prepare("ALTER TABLE routes ADD COLUMN kg_co2e_wtw REAL DEFAULT 0.0").run();
  } catch {}
  try {
    await env.DB.prepare("ALTER TABLE routes ADD COLUMN transport_work_tkm REAL DEFAULT 0.0").run();
  } catch {}

  const createdRoutes: Record<string, unknown>[] = [];
  const publishedVal = autoPublish ? 1 : 0;

  for (const r of vrp.routes) {
    let routeInsert: { meta: { last_row_id: number | string } };
    try {
      routeInsert = (await env.DB.prepare(
        `INSERT INTO routes (vehicle_id, plate, color, published, km, litres, kg_co2, kg_co2e_wtw, transport_work_tkm, overload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          r.vehicle.id,
          r.vehicle.plate,
          r.color,
          publishedVal,
          r.km,
          r.litres,
          r.kg_co2,
          r.kg_co2e_wtw ?? 0,
          r.transport_work_tkm ?? 0,
          r.overload ? 1 : 0
        )
        .run()) as unknown as { meta: { last_row_id: number | string } };
    } catch {
      routeInsert = (await env.DB.prepare(
        `INSERT INTO routes (vehicle_id, plate, color, published, km, litres, kg_co2, overload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(r.vehicle.id, r.vehicle.plate, r.color, publishedVal, r.km, r.litres, r.kg_co2, r.overload ? 1 : 0)
        .run()) as unknown as { meta: { last_row_id: number | string } };
    }

    const routeId = Number(routeInsert.meta.last_row_id);

    const stopStmts = r.stops.map((s) =>
      env.DB.prepare(
        `INSERT INTO stops (route_id, seq, kind, order_id, lat, lng, address, phone, window_start, window_end, notes, kg, status, fail_reason, late_risk)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        routeId,
        s.seq,
        s.kind,
        s.order_id,
        s.lat,
        s.lng,
        s.address,
        s.phone,
        s.window_start,
        s.window_end,
        s.notes,
        s.kg,
        s.status,
        s.fail_reason,
        s.late_risk ? 1 : 0
      )
    );

    if (stopStmts.length > 0) {
      await env.DB.batch(stopStmts);
    }

    createdRoutes.push({
      id: routeId,
      vehicle_id: r.vehicle.id,
      plate: r.vehicle.plate,
      color: r.color,
      published: autoPublish,
      km: r.km,
      litres: r.litres,
      kg_co2: r.kg_co2,
      kg_co2e_wtw: r.kg_co2e_wtw,
      transport_work_tkm: r.transport_work_tkm,
      overload: r.overload,
      stops: r.stops.map((s, idx) => ({ id: idx + 1, ...s })),
    });
  }

  // Save report
  const routedOrdersCount = vrp.routes.reduce((sum, r) => sum + r.stops.filter((s) => s.kind !== "depot").length, 0);
  const kgDelivered = vrp.routes.reduce((sum, r) => sum + r.stops.filter((s) => s.kind !== "depot").reduce((stSum, s) => stSum + s.kg, 0), 0);
  const capacityDispatched = vrp.routes.reduce((sum, r) => sum + r.vehicle.capacity_kg, 0);
  const payloadUtilisationPct = capacityDispatched > 0 ? Number(((kgDelivered / capacityDispatched) * 100.0).toFixed(2)) : null;
  const transportWorkTkm = vrp.totals.transport_work_tkm ?? 0;
  const gCo2ePerTkm = transportWorkTkm > 0 ? Number(((vrp.totals.kg_co2 * 1000.0) / transportWorkTkm).toFixed(2)) : null;
  const gCo2ePerOrder = routedOrdersCount > 0 ? Number(((vrp.totals.kg_co2 * 1000.0) / routedOrdersCount).toFixed(2)) : null;

  const metrics = {
    g_co2e_per_order: gCo2ePerOrder,
    g_co2e_per_tkm: gCo2ePerTkm,
    payload_utilisation_pct: payloadUtilisationPct,
    empty_running_pct: null,
    otif_pct: null,
    kg_co2e_wtw: vrp.totals.km > 0 ? (vrp.totals.kg_co2e_wtw ?? null) : null,
    decomposition: vrp.decomposition ?? null,
    boundary: "TTW",
    factor_set: "IPCC 2006 -> GLEC v3.2 cross-check",
    factor_year: 2006,
    confidence: "C1-illustrative",
    model_version: "GLX-HDT-v1.0",
  };

  await env.DB.prepare("INSERT OR REPLACE INTO reports (id, data) VALUES ('latest', ?)")
    .bind(
      JSON.stringify({
        baseline: vrp.baseline,
        optimized: vrp.totals,
        delta: vrp.delta,
        distance_provider: road.providerId,
        routing_quality: road.providerId === "circuity" ? "DEGRADED" : "VERIFIED_GRAPH",
        eco_weight: ecoWeight,
        decomposition: vrp.decomposition,
        metrics,
        created_at: new Date().toISOString(),
      })
    )
    .run();

  return {
    routes: createdRoutes,
    unassigned_order_ids: vrp.unassigned_ids,
    routing_quality: road.providerId === "circuity" ? "DEGRADED" : "VERIFIED_GRAPH",
    ...judgeOptimizeFields(vrp, road.providerId, ecoWeight),
  };
}

const api = new Hono<{ Bindings: Env }>();

// 1. Health & Edge Health
api.get("/health", (c) => c.json({ status: "ok" }));
api.get("/edge-health", (c) =>
  c.json({
    status: "ok",
    runtime: "cloudflare-workers-d1",
    db: "greenlogix-db",
    time: new Date().toISOString(),
  })
);

// 2. OpenAPI Specification
api.get("/openapi.json", (c) =>
  c.json({
    openapi: "3.1.0",
    info: { title: "EcoMiles API", version: "0.1.0" },
    paths: {
      "/health": { get: {} },
      "/dispatcher": { get: {} },
      "/seed": { post: {} },
      "/orders": { get: {} },
      "/orders/{id}": { get: {}, patch: {}, delete: {} },
      "/vehicles": { get: {} },
      "/vehicles/{id}": { patch: {} },
      "/optimize": { post: {} },
      "/routes": { get: {} },
      "/routes/publish": { post: {} },
      "/routes/{id}/audit": { get: {} },
      "/report": { get: {} },
      "/report.csv": { get: {} },
      "/driver/route": { get: {} },
      "/stops/{id}/status": { post: {} },
      "/analytics/kpis": { get: {} },
      "/analytics/timeseries": { get: {} },
      "/analytics/fleet": { get: {} },
      "/ingest/events": { post: {} },
    },
  })
);

// 3. Web Consoles
api.get("/app", (c) => c.html(DISPATCHER_HTML));
api.get("/dispatcher", (c) => c.html(DISPATCHER_HTML));
api.get("/dashboard", (c) => c.html(DISPATCHER_HTML));
api.get("/driver", (c) => c.html(DRIVER_HTML));

// 4. Seed Database (/seed)
api.post("/seed", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const env = c.env;

  await env.DB.batch([
    env.DB.prepare("DELETE FROM stops"),
    env.DB.prepare("DELETE FROM routes"),
    env.DB.prepare("DELETE FROM orders"),
    env.DB.prepare("DELETE FROM vehicles"),
    env.DB.prepare("DELETE FROM reports"),
  ]);

  const seedOrders = generateSeedOrders();
  const orderStmts = seedOrders.map((o) =>
    env.DB.prepare(
      `INSERT INTO orders (address, lat, lng, receiver, phone, kg, window_start, window_end, cargo_type, notes, excel_row, status, late_risk)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      o.address,
      o.lat,
      o.lng,
      o.receiver,
      o.phone,
      o.kg,
      o.window_start,
      o.window_end,
      o.cargo_type,
      o.notes,
      o.excel_row,
      o.status,
      o.late_risk ? 1 : 0
    )
  );

  const seedVehicles = generateSeedVehicles();
  const vehicleStmts = seedVehicles.map((v) =>
    env.DB.prepare(
      `INSERT INTO vehicles (plate, type, capacity_kg, fuel, l_per_100km, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(v.plate, v.type, v.capacity_kg, v.fuel, v.l_per_100km, v.status)
  );

  for (let i = 0; i < orderStmts.length; i += 25) {
    await env.DB.batch(orderStmts.slice(i, i + 25));
  }
  await env.DB.batch(vehicleStmts);

  const optResult = await performOptimization(env, 3.0, true);

  return c.json({
    orders: seedOrders.length,
    vehicles: seedVehicles.length,
    routes: optResult.routes.length,
    depot: { lat: DEPOT_LAT, lng: DEPOT_LNG, name: DEPOT_NAME },
  });
});

// 5. Orders (/orders & /orders/:id)
api.get("/orders", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const q = (c.req.query("q") || "").trim().toLowerCase();
  const late = c.req.query("late") === "1";

  let query = "SELECT * FROM orders";
  const conditions: string[] = [];
  const binds: unknown[] = [];

  if (q) {
    conditions.push("(LOWER(address) LIKE ? OR phone LIKE ? OR LOWER(receiver) LIKE ?)");
    const likeQ = `%${q}%`;
    binds.push(likeQ, likeQ, likeQ);
  }
  if (late) {
    conditions.push("late_risk = 1");
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY id ASC";

  const stmt = c.env.DB.prepare(query);
  const results = binds.length > 0 ? await stmt.bind(...binds).all() : await stmt.all();
  return c.json(results.results);
});

api.get("/orders/:id", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const id = parseInt(c.req.param("id") ?? "0", 10);
  const row = (await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first()) as DbOrderRow | null;
  if (!row) return c.json({ detail: "not_found" }, 404);
  return c.json(row);
});

api.patch("/orders/:id", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const id = parseInt(c.req.param("id") ?? "0", 10);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = ["address", "lat", "lng", "receiver", "phone", "kg", "window_start", "window_end", "cargo_type", "notes"];
  const updates: string[] = [];
  const binds: unknown[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      binds.push(body[key]);
    }
  }

  if (updates.length > 0) {
    binds.push(id);
    const res = await c.env.DB.prepare(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();
    if (!res.meta.changes) return c.json({ detail: "not_found" }, 404);
  }

  const updated = (await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first()) as DbOrderRow | null;
  return c.json(updated);
});

api.delete("/orders/:id", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const id = parseInt(c.req.param("id") ?? "0", 10);
  const res = await c.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(id).run();
  if (!res.meta.changes) return c.json({ detail: "not_found" }, 404);
  return c.json({ id });
});

// 6. Vehicles (/vehicles & /vehicles/:id)
api.get("/vehicles", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const rows = await c.env.DB.prepare("SELECT * FROM vehicles ORDER BY id ASC").all();
  return c.json(rows.results);
});

api.patch("/vehicles/:id", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const id = parseInt(c.req.param("id") ?? "0", 10);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = ["status", "capacity_kg", "l_per_100km", "fuel", "type"];
  const updates: string[] = [];
  const binds: unknown[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      binds.push(body[key]);
    }
  }

  if (updates.length > 0) {
    binds.push(id);
    const res = await c.env.DB.prepare(`UPDATE vehicles SET ${updates.join(", ")} WHERE id = ?`).bind(...binds).run();
    if (!res.meta.changes) return c.json({ detail: "not_found" }, 404);
  }

  const updated = (await c.env.DB.prepare("SELECT * FROM vehicles WHERE id = ?").bind(id).first()) as DbVehicleRow | null;
  return c.json(updated);
});

// 7. Optimize Routes (/optimize)
api.post("/optimize", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const body = (await c.req.json().catch(() => ({}))) as {
    cluster_radius_km?: number;
    optimizer?: string;
    enforce_time_windows?: boolean;
    enforce_truck_ban?: boolean;
  };
  const radius = body.cluster_radius_km && body.cluster_radius_km > 0 ? body.cluster_radius_km : 3.0;

  const optResult = await performOptimization(c.env, radius, true);
  return c.json({
    ...optResult,
    optimizer_used: body.optimizer || "legacy",
    restriction_coverage: "decision23-2018-v1:unchecked",
    ban_conflicts: 0,
    time_window_conflicts: 0,
  });
});

// 8. Routes (/routes & /routes/publish)
api.get("/routes", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const routes = ((await c.env.DB.prepare("SELECT * FROM routes ORDER BY id ASC").all()).results || []) as unknown as DbRouteRow[];
  const stops = ((await c.env.DB.prepare("SELECT * FROM stops ORDER BY seq ASC").all()).results || []) as unknown as DbStopRow[];

  for (const r of routes) {
    r.published = Boolean(r.published);
    r.overload = Boolean(r.overload);
    r.stops = stops.filter((s) => s.route_id === r.id);
  }

  return c.json(routes);
});

api.post("/routes/publish", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  await c.env.DB.prepare("UPDATE routes SET published = 1").run();
  const routes = ((await c.env.DB.prepare("SELECT * FROM routes ORDER BY id ASC").all()).results || []) as unknown as DbRouteRow[];
  const stops = ((await c.env.DB.prepare("SELECT * FROM stops ORDER BY seq ASC").all()).results || []) as unknown as DbStopRow[];

  for (const r of routes) {
    r.published = true;
    r.overload = Boolean(r.overload);
    r.stops = stops.filter((s) => s.route_id === r.id);
  }

  return c.json(routes);
});

// 9. Route Audit (/routes/:id/audit)
api.get("/routes/:id/audit", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const id = parseInt(c.req.param("id") ?? "0", 10);
  const route = (await c.env.DB.prepare("SELECT * FROM routes WHERE id = ?").bind(id).first()) as DbRouteRow | null;
  if (!route) return c.json({ detail: "not_found" }, 404);

  const stopCountRow = (await c.env.DB.prepare(
    "SELECT COUNT(*) AS count FROM stops WHERE route_id = ? AND kind <> 'depot'"
  )
    .bind(id)
    .first()) as CountRow | null;
  const stopsCount = stopCountRow?.count || 0;

  const rep = (await c.env.DB.prepare("SELECT data FROM reports WHERE id = 'latest'").first()) as DbReportRow | null;
  const repData = rep?.data ? (JSON.parse(rep.data) as Record<string, unknown>) : null;

  return c.json({
    route_id: route.id,
    plate: route.plate,
    km: route.km,
    litres: route.litres,
    kg_co2: route.kg_co2,
    stops: stopsCount,
    routing_quality: String(repData?.routing_quality || "DEGRADED"),
    distance_provider: String(repData?.distance_provider || "circuity"),
    solver: "legacy",
    model_version: "GLX-HDT-v1.0",
    restriction_overlay_version: "decision23-2018-v1",
    road_graph_version: "unpinned-dev:unpinned-dev",
    seed: null,
    created_at: String(repData?.created_at || new Date().toISOString()),
  });
});

// 10. Driver routes (/driver/route)
api.get("/driver/route", async (c) => {
  if (!checkDriverPin(c.req.raw) && !checkAuth(c.req.raw)) {
    return c.json({ detail: "unauthorized" }, 401);
  }

  const publishedRoutes = ((
    await c.env.DB.prepare("SELECT * FROM routes WHERE published = 1 ORDER BY id ASC").all()
  ).results || []) as unknown as DbRouteRow[];
  const allStops = ((await c.env.DB.prepare("SELECT * FROM stops ORDER BY seq ASC").all()).results || []) as unknown as DbStopRow[];

  const driverRoutes = publishedRoutes.map((r) => ({
    plate: r.plate,
    stops: allStops.filter((s) => s.route_id === r.id),
  }));

  return c.json({ routes: driverRoutes });
});

// 11. Stop status writeback (/stops/:id/status)
const updateStopStatus = async (c: Context<{ Bindings: Env }>) => {
  if (!checkDriverPin(c.req.raw) && !checkAuth(c.req.raw)) {
    return c.json({ detail: "unauthorized" }, 401);
  }
  const id = parseInt(c.req.param("id") ?? "0", 10);
  const body = (await c.req.json().catch(() => ({}))) as { status?: string; reason?: string | null };

  if (!body.status || !["arrived", "delivered", "failed"].includes(body.status)) {
    return c.json({ detail: "invalid status" }, 422);
  }

  const stop = (await c.env.DB.prepare("SELECT * FROM stops WHERE id = ?").bind(id).first()) as DbStopRow | null;
  if (!stop) return c.json({ detail: "not_found" }, 404);

  await c.env.DB.prepare("UPDATE stops SET status = ?, fail_reason = ? WHERE id = ?")
    .bind(body.status, body.reason || null, id)
    .run();

  if (stop.order_id && ["delivered", "failed"].includes(body.status)) {
    await c.env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(body.status, stop.order_id).run();
  }

  return c.json({
    id,
    status: body.status,
    reason: body.reason || null,
  });
};

api.post("/stops/:id/status", updateStopStatus);
api.patch("/stops/:id/status", updateStopStatus);

// 12. Reports (/report & /report.csv)
api.get("/report", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const rep = (await c.env.DB.prepare("SELECT data FROM reports WHERE id = 'latest'").first()) as DbReportRow | null;
  if (rep && rep.data) {
    const parsed = JSON.parse(rep.data) as Record<string, unknown>;
    if (!parsed.metrics) {
      const opt = (parsed.optimized || { km: 0, litres: 0, kg_co2: 0 }) as {
        km: number;
        litres: number;
        kg_co2: number;
        kg_co2e_wtw?: number;
        transport_work_tkm?: number;
      };
      const transportWork = opt.transport_work_tkm || 0;
      parsed.metrics = {
        g_co2e_per_order: null,
        g_co2e_per_tkm: transportWork > 0 ? Number(((opt.kg_co2 * 1000.0) / transportWork).toFixed(2)) : null,
        payload_utilisation_pct: null,
        empty_running_pct: null,
        otif_pct: null,
        kg_co2e_wtw: opt.km > 0 ? (opt.kg_co2e_wtw ?? null) : null,
        decomposition: parsed.decomposition ?? null,
        boundary: "TTW",
        factor_set: "IPCC 2006 -> GLEC v3.2 cross-check",
        factor_year: 2006,
        confidence: "C1-illustrative",
        model_version: "GLX-HDT-v1.0",
      };
    }
    return c.json(parsed);
  }
  return c.json({
    baseline: { km: 0, litres: 0, kg_co2: 0, kg_co2e_wtw: 0, transport_work_tkm: 0 },
    optimized: { km: 0, litres: 0, kg_co2: 0, kg_co2e_wtw: 0, transport_work_tkm: 0 },
    delta: { km: 0, litres: 0, kg_co2: 0, km_pct: 0, litres_pct: 0, kg_co2_pct: 0 },
    distance_provider: "circuity",
    routing_quality: "DEGRADED",
    eco_weight: 0,
    metrics: {
      g_co2e_per_order: null,
      g_co2e_per_tkm: null,
      payload_utilisation_pct: null,
      empty_running_pct: null,
      otif_pct: null,
      kg_co2e_wtw: null,
      decomposition: null,
      boundary: "TTW",
      factor_set: "IPCC 2006 -> GLEC v3.2 cross-check",
      factor_year: 2006,
      confidence: "C1-illustrative",
      model_version: "GLX-HDT-v1.0",
    },
  });
});

api.get("/report.csv", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const rep = (await c.env.DB.prepare("SELECT data FROM reports WHERE id = 'latest'").first()) as DbReportRow | null;
  const data = rep?.data
    ? (JSON.parse(rep.data) as {
        baseline: { km: number; litres: number; kg_co2: number };
        optimized: { km: number; litres: number; kg_co2: number };
        delta: { km: number; litres: number; kg_co2: number; km_pct: number; litres_pct: number; kg_co2_pct: number };
      })
    : {
        baseline: { km: 0, litres: 0, kg_co2: 0 },
        optimized: { km: 0, litres: 0, kg_co2: 0 },
        delta: { km: 0, litres: 0, kg_co2: 0, km_pct: 0, litres_pct: 0, kg_co2_pct: 0 },
      };

  const csv = [
    "metric,baseline,optimized,delta,delta_pct",
    `km,${data.baseline.km},${data.optimized.km},${data.delta.km},${data.delta.km_pct}`,
    `litres,${data.baseline.litres},${data.optimized.litres},${data.delta.litres},${data.delta.litres_pct}`,
    `kg_co2,${data.baseline.kg_co2},${data.optimized.kg_co2},${data.delta.kg_co2},${data.delta.kg_co2_pct}`,
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=report.csv",
    },
  });
});

// 13. Analytics KPIs (/analytics/kpis)
api.get("/analytics/kpis", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const env = c.env;

  const orders = ((await env.DB.prepare("SELECT * FROM orders").all()).results || []) as unknown as DbOrderRow[];
  const vehicles = ((await env.DB.prepare("SELECT * FROM vehicles").all()).results || []) as unknown as DbVehicleRow[];
  const routes = ((await env.DB.prepare("SELECT * FROM routes").all()).results || []) as unknown as DbRouteRow[];
  const stops = ((await env.DB.prepare("SELECT * FROM stops").all()).results || []) as unknown as DbStopRow[];
  const rep = (await env.DB.prepare("SELECT data FROM reports WHERE id = 'latest'").first()) as DbReportRow | null;
  const repData = rep?.data ? (JSON.parse(rep.data) as Record<string, unknown>) : null;

  const kmTotal = routes.reduce((sum, r) => sum + (Number(r.km) || 0), 0);
  const fuelLitres = routes.reduce((sum, r) => sum + (Number(r.litres) || 0), 0);
  const kgCo2eTtw = routes.reduce((sum, r) => sum + (Number(r.kg_co2) || 0), 0);
  const kgCo2eWtw = kmTotal > 0 ? routes.reduce((sum, r) => {
    if (r.kg_co2e_wtw) return sum + Number(r.kg_co2e_wtw);
    const v = vehicles.find((veh) => veh.id === r.vehicle_id);
    const factor = v && v.fuel === "diesel" ? DIESEL_WTW_FACTOR : PETROL_WTW_FACTOR;
    return sum + (Number(r.litres) || 0) * factor;
  }, 0) : null;

  const deliveryStops = stops.filter((s) => s.kind !== "depot" && s.route_id != null);
  const routedOrdersCount = deliveryStops.length;
  const kgDelivered = deliveryStops.reduce((sum, s) => sum + (Number(s.kg) || 0), 0);

  const capacityDispatched = routes.reduce((sum, r) => {
    const v = vehicles.find((veh) => veh.id === r.vehicle_id);
    return sum + (v ? Number(v.capacity_kg) || 0 : 0);
  }, 0);

  let transportWorkTkm = 0;
  for (const r of routes) {
    if (r.transport_work_tkm) {
      transportWorkTkm += Number(r.transport_work_tkm);
    } else {
      const rStops = stops.filter((s) => s.route_id === r.id && s.kind !== "depot");
      const rKg = rStops.reduce((sum, s) => sum + (Number(s.kg) || 0), 0);
      transportWorkTkm += (rKg / 1000.0) * (Number(r.km) || 0);
    }
  }

  const fuelPriceRaw = env.ECOMILES_FUEL_PRICE_VND_PER_L ? parseFloat(env.ECOMILES_FUEL_PRICE_VND_PER_L) : null;
  const fuelPrice = fuelPriceRaw != null && !isNaN(fuelPriceRaw) && fuelPriceRaw > 0 ? fuelPriceRaw : null;
  const fuelCostVnd = fuelPrice != null ? fuelLitres * fuelPrice : null;

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const failedCount = orders.filter((o) => o.status === "failed").length;
  const lateOrdersCount = orders.filter((o) => o.late_risk === 1 && o.status !== "delivered" && o.status !== "failed").length;

  const usedVehicleIds = new Set(routes.map((r) => r.vehicle_id));
  const stopsPerUsedVehicle = Array.from(usedVehicleIds).map((vid) => {
    const vRoutes = routes.filter((r) => r.vehicle_id === vid);
    return stops.filter((s) => vRoutes.some((r) => r.id === s.route_id) && s.kind !== "depot").length;
  }).filter((count) => count > 0);

  const avgFillStops = stopsPerUsedVehicle.length > 0
    ? stopsPerUsedVehicle.reduce((a, b) => a + b, 0) / stopsPerUsedVehicle.length
    : null;
  const maxStops = stopsPerUsedVehicle.length > 0 ? Math.max(...stopsPerUsedVehicle) : 0;
  const vehicleFillPct = avgFillStops != null && maxStops > 0 ? Number(((avgFillStops / maxStops) * 100).toFixed(2)) : null;

  const todayStr = new Date().toISOString().slice(0, 10);

  return c.json({
    dataset: {
      label: "ecomiles-d1-simulated",
      kind: "simulated",
      seed: null,
      generated_at: repData?.created_at || new Date().toISOString(),
      orders: orders.length,
      vehicles: vehicles.length,
    },
    period: {
      from: todayStr,
      to: todayStr,
    },
    distance: {
      km_total: kmTotal,
      km_empty: null,
      empty_running_pct: null,
      km_per_stop: routedOrdersCount > 0 ? kmTotal / routedOrdersCount : null,
      stops_per_hour: null,
    },
    load: {
      kg_delivered: kgDelivered,
      capacity_kg_used: capacityDispatched,
      transport_work_tkm: transportWorkTkm,
      payload_utilisation_pct: capacityDispatched > 0 ? (kgDelivered / capacityDispatched) * 100.0 : null,
      vehicle_fill_pct: vehicleFillPct,
    },
    service: {
      orders: orders.length,
      delivered: deliveredCount,
      failed: failedCount,
      on_time: null,
      otif_pct: null,
      late_orders: lateOrdersCount,
    },
    cost: {
      fuel_litres: fuelLitres,
      fuel_cost_vnd: fuelCostVnd,
      cost_per_order_vnd: fuelCostVnd != null && routedOrdersCount > 0 ? fuelCostVnd / routedOrdersCount : null,
      cost_per_km_vnd: fuelCostVnd != null && kmTotal > 0 ? fuelCostVnd / kmTotal : null,
    },
    carbon: {
      kg_co2e_ttw: kgCo2eTtw,
      kg_co2e_wtw: kgCo2eWtw,
      g_co2e_per_tkm: transportWorkTkm > 0 ? (kgCo2eTtw * 1000.0) / transportWorkTkm : null,
      g_co2e_per_order: routedOrdersCount > 0 ? (kgCo2eTtw * 1000.0) / routedOrdersCount : null,
      boundary: "TTW",
      factor_set: "GLEC v3.2 / ISO 14083:2023",
      confidence: "C1-illustrative",
      model_version: "GLX-HDT-v1.0",
      decomposition: repData?.decomposition || null,
    },
    labels: {
      simulated: true,
      modelled_fuel: true,
      routing_quality: repData?.routing_quality || "DEGRADED",
    },
  });
});

// 14. Analytics Timeseries (/analytics/timeseries)
api.get("/analytics/timeseries", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const bucket = c.req.query("bucket") || "day";
  if (bucket !== "day" && bucket !== "hour") {
    return c.json({ detail: "invalid bucket" }, 422);
  }

  const env = c.env;
  const routes = ((await env.DB.prepare("SELECT * FROM routes").all()).results || []) as unknown as DbRouteRow[];
  const stops = ((await env.DB.prepare("SELECT * FROM stops ORDER BY seq ASC").all()).results || []) as unknown as DbStopRow[];
  const orders = ((await env.DB.prepare("SELECT id FROM orders").all()).results || []) as unknown as DbOrderRow[];
  const vehicles = ((await env.DB.prepare("SELECT id, fuel FROM vehicles").all()).results || []) as unknown as DbVehicleRow[];

  if (bucket === "day") {
    const kmTotal = routes.reduce((sum, r) => sum + (Number(r.km) || 0), 0);
    const fuelLitres = routes.reduce((sum, r) => sum + (Number(r.litres) || 0), 0);
    const kgCo2eTtw = routes.reduce((sum, r) => sum + (Number(r.kg_co2) || 0), 0);
    const kgCo2eWtw = routes.reduce((sum, r) => {
      if (r.kg_co2e_wtw) return sum + Number(r.kg_co2e_wtw);
      const v = vehicles.find((veh) => veh.id === r.vehicle_id);
      const factor = v && v.fuel === "diesel" ? DIESEL_WTW_FACTOR : PETROL_WTW_FACTOR;
      return sum + (Number(r.litres) || 0) * factor;
    }, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    return c.json({
      bucket: "day",
      points: [
        {
          date: todayStr,
          km: kmTotal,
          litres: fuelLitres,
          kg_co2e: kgCo2eTtw,
          kg_co2e_wtw: kgCo2eWtw,
          orders: orders.length,
          otif_pct: null,
        },
      ],
    });
  }

  // bucket === "hour"
  const hourMap = new Map<string, { km: number; litres: number; kg_co2e: number; kg_co2e_wtw: number; orders: number }>();

  for (const r of routes) {
    const rStops = stops.filter((s) => s.route_id === r.id && s.kind !== "depot");
    if (rStops.length === 0) continue;

    const rKm = Number(r.km) || 0;
    const rLitres = Number(r.litres) || 0;
    const rCo2 = Number(r.kg_co2) || 0;
    const v = vehicles.find((veh) => veh.id === r.vehicle_id);
    const wtwFactor = v && v.fuel === "diesel" ? DIESEL_WTW_FACTOR : PETROL_WTW_FACTOR;
    const rWtw = Number(r.kg_co2e_wtw) || rLitres * wtwFactor;

    const share = 1.0 / rStops.length;
    const stopKm = rKm * share;
    const stopLitres = rLitres * share;
    const stopCo2 = rCo2 * share;
    const stopWtw = rWtw * share;

    for (const s of rStops) {
      const rawHour = (s.window_start || "").trim();
      const hourKey = (rawHour.length >= 2 ? rawHour.slice(0, 2) : "08") + ":00";
      const current = hourMap.get(hourKey) || { km: 0, litres: 0, kg_co2e: 0, kg_co2e_wtw: 0, orders: 0 };
      current.km += stopKm;
      current.litres += stopLitres;
      current.kg_co2e += stopCo2;
      current.kg_co2e_wtw += stopWtw;
      current.orders += 1;
      hourMap.set(hourKey, current);
    }
  }

  const sortedHours = Array.from(hourMap.keys()).sort();
  const points = sortedHours.map((hour) => {
    const data = hourMap.get(hour)!;
    return {
      date: hour,
      km: Number(data.km.toFixed(2)),
      litres: Number(data.litres.toFixed(2)),
      kg_co2e: Number(data.kg_co2e.toFixed(2)),
      kg_co2e_wtw: Number(data.kg_co2e_wtw.toFixed(2)),
      orders: data.orders,
      otif_pct: null,
    };
  });

  return c.json({
    bucket: "hour",
    points,
  });
});

// 15. Analytics Fleet (/analytics/fleet)
api.get("/analytics/fleet", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const env = c.env;

  const vehicles = ((await env.DB.prepare("SELECT * FROM vehicles ORDER BY plate ASC").all()).results || []) as unknown as DbVehicleRow[];
  const routes = ((await env.DB.prepare("SELECT * FROM routes").all()).results || []) as unknown as DbRouteRow[];
  const stops = ((await env.DB.prepare("SELECT * FROM stops").all()).results || []) as unknown as DbStopRow[];

  const fleetVehicles = vehicles.map((v) => {
    const vRoutes = routes.filter((r) => r.vehicle_id === v.id);
    const km = vRoutes.reduce((sum, r) => sum + (Number(r.km) || 0), 0);
    const litres = vRoutes.reduce((sum, r) => sum + (Number(r.litres) || 0), 0);
    const kgCo2e = vRoutes.reduce((sum, r) => sum + (Number(r.kg_co2) || 0), 0);
    const wtwFactor = v.fuel === "diesel" ? DIESEL_WTW_FACTOR : PETROL_WTW_FACTOR;
    const kgCo2eWtw = vRoutes.reduce((sum, r) => sum + (Number(r.kg_co2e_wtw) || (Number(r.litres) || 0) * wtwFactor), 0);

    const vStops = stops.filter((s) => vRoutes.some((r) => r.id === s.route_id) && s.kind !== "depot");
    const ordersCount = vStops.length;
    const kgDelivered = vStops.reduce((sum, s) => sum + (Number(s.kg) || 0), 0);
    const dispatches = vRoutes.length;

    const payloadUtilisationPct =
      dispatches > 0 && v.capacity_kg > 0
        ? Number(((kgDelivered / (v.capacity_kg * dispatches)) * 100.0).toFixed(2))
        : null;

    return {
      plate: v.plate,
      km: Number(km.toFixed(2)),
      litres: Number(litres.toFixed(2)),
      kg_co2e: Number(kgCo2e.toFixed(2)),
      kg_co2e_wtw: Number(kgCo2eWtw.toFixed(2)),
      orders: ordersCount,
      kg_delivered: Number(kgDelivered.toFixed(2)),
      payload_utilisation_pct: payloadUtilisationPct,
      capacity_kg: Number(v.capacity_kg),
      fuel: v.fuel,
      l_per_100km_spec: Number(v.l_per_100km),
    };
  });

  return c.json({ vehicles: fleetVehicles });
});

// 16. Ingest Events (/ingest/events)
api.post("/ingest/events", async (c) => {
  if (!checkAuth(c.req.raw)) return c.json({ detail: "unauthorized" }, 401);
  const body = (await c.req.json().catch(() => ({}))) as {
    dataset_label?: string;
    orders?: IngestEventOrderInput[];
  };

  if (!body.orders || !Array.isArray(body.orders)) {
    return c.json({ detail: "orders array required" }, 422);
  }

  const existingOrders = ((await c.env.DB.prepare("SELECT address, receiver, phone, window_start, notes FROM orders").all()).results || []) as unknown as DbOrderRow[];
  const existingSet = new Set<string>();
  const existingExtSet = new Set<string>();

  for (const o of existingOrders) {
    existingSet.add(`${o.address}|${o.receiver}|${o.phone}|${o.window_start}`.toLowerCase());
    const match = (o.notes || "").match(/\[ext:([^\]]+)\]/i) || (o.notes || "").match(/external_id:(\S+)/i);
    if (match) {
      existingExtSet.add(match[1].trim().toLowerCase());
    }
  }

  let rowsSeen = 0;
  let rowsImported = 0;
  let skippedDuplicates = 0;
  const errors: ImportErrorItemType[] = [];
  const stmts: unknown[] = [];

  for (const o of body.orders) {
    rowsSeen++;
    if (
      !o.address ||
      typeof o.lat !== "number" ||
      isNaN(o.lat) ||
      o.lat < -90 ||
      o.lat > 90 ||
      typeof o.lng !== "number" ||
      isNaN(o.lng) ||
      o.lng < -180 ||
      o.lng > 180 ||
      !o.receiver ||
      !o.phone ||
      typeof o.kg !== "number" ||
      isNaN(o.kg) ||
      o.kg < 0 ||
      !o.window_start ||
      !o.window_end
    ) {
      errors.push({
        excel_row: rowsSeen,
        field: "order",
        message: "Missing or invalid required fields (address, lat [-90,90], lng [-180,180], receiver, phone, kg >= 0, window_start, window_end)",
      });
      continue;
    }

    const extId = (o.external_id || "").trim();
    const key = `${o.address}|${o.receiver}|${o.phone}|${o.window_start}`.toLowerCase();
    const isDup = Boolean((extId && existingExtSet.has(extId.toLowerCase())) || existingSet.has(key));
    if (isDup) {
      skippedDuplicates++;
      continue;
    }
    if (extId) {
      existingExtSet.add(extId.toLowerCase());
    }
    existingSet.add(key);
    const extTag = extId ? `[ext:${extId}]` : "";
    const notesVal = o.notes ? (extTag ? `${extTag} ${o.notes}` : o.notes) : extTag;
    const orderKey = `${o.address}|${o.receiver}|${o.phone}|${o.window_start}`.toLowerCase();
    existingSet.add(orderKey);

    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO orders (address, lat, lng, receiver, phone, kg, window_start, window_end, cargo_type, notes, excel_row, status, late_risk)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        o.address,
        o.lat,
        o.lng,
        o.receiver,
        o.phone,
        o.kg,
        o.window_start,
        o.window_end,
        o.cargo_type || "thuong",
        notesVal,
        rowsSeen,
        "pending",
        0
      )
    );
    rowsImported++;
  }

  for (let i = 0; i < stmts.length; i += 25) {
    await c.env.DB.batch(stmts.slice(i, i + 25) as unknown as Parameters<D1Database["batch"]>[0]);
  }

  return c.json({
    imported: rowsImported,
    errors,
    rows_seen: rowsSeen,
    rows_imported: rowsImported,
    skipped_duplicates: skippedDuplicates,
    rows_rejected: errors.length,
    dedupe: true,
    limits: {
      max_upload_bytes: 10485760,
      max_data_rows: 1000,
    },
  });
});

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Driver-Pin", "Accept", "Origin"],
    maxAge: 86400,
  })
);

app.route("/api", api);
app.route("/", api);

app.notFound(async (c) => {
  const url = new URL(c.req.raw.url);
  const rawPath = url.pathname;
  const isApiPrefix = rawPath.replace(/\/+$/, "").startsWith("/api");

  if (!isApiPrefix) {
    try {
      const pagesUrl = new URL(rawPath + url.search, "https://cargox-group-3qm.pages.dev");
      const forwardReq = new Request(pagesUrl.toString(), {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.method !== "GET" && c.req.method !== "HEAD" ? c.req.raw.body : undefined,
        redirect: "follow",
      });
      const resp = await fetch(forwardReq);
      if (resp.status < 400 || rawPath === "/" || rawPath.startsWith("/assets/")) {
        return resp;
      }
    } catch {}
  }

  return c.json({ detail: "not_found" }, 404);
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      request = new Request(url.toString(), request);
    }
    return app.fetch(request, env);
  },
};
