import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { apiPath, isDemoDispatcher, judgeOptimizeFields } from "./http.ts";
import worker, { type Env } from "./index.ts";
import {
  runVrp,
  roadKm,
  PETROL_FACTOR,
  DIESEL_FACTOR,
  PETROL_WTW_FACTOR,
  DIESEL_WTW_FACTOR,
} from "./solver.ts";

describe("worker HTTP footguns", () => {
  it("strips trailing slashes and /api prefix", () => {
    assert.equal(apiPath("/optimize/"), "/optimize");
    assert.equal(apiPath("/api/optimize/"), "/optimize");
    assert.equal(apiPath("/report/"), "/report");
    assert.equal(apiPath("/api/driver/route/"), "/driver/route");
    assert.equal(apiPath("/app/"), "/app");
  });

  it("accepts Bearer DEMO case-insensitively and ?token=DEMO", () => {
    assert.equal(isDemoDispatcher(new Request("https://x/optimize", { headers: { Authorization: "Bearer DEMO" } })), true);
    assert.equal(isDemoDispatcher(new Request("https://x/optimize", { headers: { Authorization: "bearer demo" } })), true);
    assert.equal(isDemoDispatcher(new Request("https://x/optimize?token=DEMO")), true);
    assert.equal(isDemoDispatcher(new Request("https://x/optimize")), false);
    assert.equal(isDemoDispatcher(new Request("https://x/optimize", { headers: { Authorization: "Bearer WRONG" } })), false);
  });

  it("exposes baseline vs optimized plus fallback/eco labels for judges", () => {
    const fields = judgeOptimizeFields(
      {
        totals: { km: 80, litres: 9.6, kg_co2: 25.728 },
        baseline: { km: 100, litres: 12, kg_co2: 32.16 },
      },
      "circuity",
      1
    );
    assert.equal(fields.distance_provider, "circuity");
    assert.notEqual(fields.distance_provider, "fallback");
    assert.equal(fields.eco_weight, 1);
    assert.notEqual(fields.baseline.km, fields.totals.km);
    assert.notEqual(fields.baseline.kg_co2, fields.totals.kg_co2);
  });
});

describe("P-06 emission and transport-work accuracy", () => {
  it("enforces GLEC v3.2 / ISO 14083 emission factors for petrol and diesel", () => {
    assert.equal(PETROL_FACTOR, 2.31);
    assert.equal(DIESEL_FACTOR, 2.68);
    assert.equal(PETROL_WTW_FACTOR, 2.82);
    assert.equal(DIESEL_WTW_FACTOR, 3.24);
  });

  it("computes per-vehicle fuel, TTW, WTW and per-route transport work", () => {
    const orders = [
      { id: 1, address: "Loc 1", lat: 10.77, lng: 106.70, receiver: "C1", phone: "0901", kg: 200, window_start: "08:00", window_end: "10:00", cargo_type: "thuong" as const, notes: "", excel_row: 1, status: "pending" },
      { id: 2, address: "Loc 2", lat: 10.78, lng: 106.69, receiver: "C2", phone: "0902", kg: 300, window_start: "10:00", window_end: "12:00", cargo_type: "thuong" as const, notes: "", excel_row: 2, status: "pending" },
    ];
    const vehicles = [
      { id: 1, plate: "51D-001", type: "xe_tai_nho", capacity_kg: 1000, fuel: "diesel" as const, l_per_100km: 12, status: "ready" as const },
    ];

    const result = runVrp(orders, vehicles, [10.80, 106.66], "Depot", 10.0, roadKm, 0);
    assert.equal(result.routes.length, 1);
    const r = result.routes[0];

    const expectedLitres = (r.km * 12.0) / 100.0;
    const expectedTtw = expectedLitres * 2.68;
    const expectedWtw = expectedLitres * 3.24;
    const expectedWork = (500.0 / 1000.0) * r.km;

    assert.equal(Math.abs(r.litres - expectedLitres) < 1e-6, true);
    assert.equal(Math.abs(r.kg_co2 - expectedTtw) < 1e-6, true);
    assert.equal(Math.abs(r.kg_co2e_wtw - expectedWtw) < 1e-6, true);
    assert.equal(Math.abs(r.transport_work_tkm - expectedWork) < 1e-6, true);

    assert.equal(Math.abs(result.totals.kg_co2e_wtw! - expectedWtw) < 1e-6, true);
    assert.equal(Math.abs(result.totals.transport_work_tkm! - expectedWork) < 1e-6, true);
    assert.ok(result.decomposition);
    assert.equal(result.decomposition?.methodology, "GLEC v3.2 ASI / PVM decomposition (modelled)");
  });
});

interface MockData {
  orders?: Record<string, unknown>[];
  vehicles?: Record<string, unknown>[];
  routes?: Record<string, unknown>[];
  stops?: Record<string, unknown>[];
  reports?: Record<string, string>;
}

function createMockEnv(initial: MockData = {}): Env {
  const tables: Record<string, Record<string, unknown>[]> = {
    orders: initial.orders ? [...initial.orders] : [],
    vehicles: initial.vehicles ? [...initial.vehicles] : [],
    routes: initial.routes ? [...initial.routes] : [],
    stops: initial.stops ? [...initial.stops] : [],
  };
  const reports: Record<string, string> = initial.reports ? { ...initial.reports } : {};

  function makeStmt(sql: string, binds: unknown[] = []) {
    return {
      bind(...newBinds: unknown[]) {
        return makeStmt(sql, newBinds);
      },
      async all() {
        const lower = sql.toLowerCase();
        if (lower.includes("from orders")) return { results: [...tables.orders] };
        if (lower.includes("from vehicles")) return { results: [...tables.vehicles] };
        if (lower.includes("from routes")) return { results: [...tables.routes] };
        if (lower.includes("from stops")) return { results: [...tables.stops] };
        return { results: [] };
      },
      async first() {
        const lower = sql.toLowerCase();
        if (lower.includes("from reports")) {
          const key = (binds[0] as string) || "latest";
          return reports[key] ? { id: key, data: reports[key] } : null;
        }
        if (lower.includes("from routes where id =")) {
          const id = Number(binds[0]);
          return tables.routes.find((r) => Number(r.id) === id) || null;
        }
        if (lower.includes("from stops where route_id =") && lower.includes("count(*)")) {
          const rid = Number(binds[0]);
          const count = tables.stops.filter((s) => Number(s.route_id) === rid && s.kind !== "depot").length;
          return { count };
        }
        if (lower.includes("from stops where id =")) {
          const id = Number(binds[0]);
          return tables.stops.find((s) => Number(s.id) === id) || null;
        }
        if (lower.includes("from orders where id =")) {
          const id = Number(binds[0]);
          return tables.orders.find((o) => Number(o.id) === id) || null;
        }
        return null;
      },
      async run() {
        const lower = sql.toLowerCase();
        if (lower.startsWith("insert into orders")) {
          const id = tables.orders.length + 1;
          tables.orders.push({
            id,
            address: binds[0],
            lat: binds[1],
            lng: binds[2],
            receiver: binds[3],
            phone: binds[4],
            kg: binds[5],
            window_start: binds[6],
            window_end: binds[7],
            cargo_type: binds[8],
            notes: binds[9],
            excel_row: binds[10],
            status: binds[11],
            late_risk: binds[12],
          });
          return { meta: { changes: 1, last_row_id: id } };
        }
        if (lower.startsWith("update routes set published = 1")) {
          for (const r of tables.routes) {
            r.published = 1;
          }
          return { meta: { changes: tables.routes.length, last_row_id: 1 } };
        }
        return { meta: { changes: 1, last_row_id: 1 } };
      },
    };
  }

  const mockDb = {
    prepare(sql: string) {
      return makeStmt(sql);
    },
    async batch(stmts: unknown[]) {
      for (const s of stmts) {
        await (s as { run: () => Promise<unknown> }).run();
      }
      return [];
    },
  };

  return {
    DB: mockDb as unknown as Env["DB"],
    ECOMILES_FUEL_PRICE_VND_PER_L: "20000",
  };
}

describe("Hono Edge API analytics and ingest endpoints", () => {
  const sampleVehicles = [
    { id: 1, plate: "51C-12345", type: "xe_tai_nho", capacity_kg: 1500, fuel: "diesel", l_per_100km: 11, status: "ready" },
  ];
  const sampleRoutes = [
    {
      id: 1,
      vehicle_id: 1,
      plate: "51C-12345",
      color: "#36d9a5",
      published: 1,
      km: 40.0,
      litres: 4.4,
      kg_co2: 11.792,
      kg_co2e_wtw: 14.256,
      transport_work_tkm: 12.0,
      overload: 0,
    },
  ];
  const sampleStops = [
    { id: 1, route_id: 1, seq: 0, kind: "depot", order_id: null, lat: 10.8, lng: 106.6, address: "Depot", phone: "", window_start: "", window_end: "", notes: "", kg: 0, status: "pending", fail_reason: null, late_risk: 0 },
    { id: 2, route_id: 1, seq: 1, kind: "stop", order_id: 1, lat: 10.77, lng: 106.7, address: "Stop 1", phone: "0901", window_start: "08:30", window_end: "10:00", notes: "", kg: 300, status: "pending", fail_reason: null, late_risk: 0 },
  ];
  const sampleOrders = [
    { id: 1, address: "Stop 1", lat: 10.77, lng: 106.7, receiver: "Rec 1", phone: "0901", kg: 300, window_start: "08:30", window_end: "10:00", cargo_type: "thuong", notes: "", excel_row: 1, status: "assigned", late_risk: 0 },
  ];
  const sampleReport = JSON.stringify({
    baseline: { km: 60.0, litres: 6.6, kg_co2: 17.688 },
    optimized: { km: 40.0, litres: 4.4, kg_co2: 11.792 },
    delta: { km: -20.0, litres: -2.2, kg_co2: -5.896, km_pct: -33.3, litres_pct: -33.3, kg_co2_pct: -33.3 },
    distance_provider: "circuity",
    routing_quality: "DEGRADED",
    eco_weight: 0,
    created_at: "2026-10-24T12:00:00Z",
    decomposition: {
      baseline_kg_co2e: 17.69,
      optimized_kg_co2e: 11.79,
      delta_kg_co2e: -5.9,
      distance_effect_kg: -5.9,
      fleet_intensity_effect_kg: 0.0,
      methodology: "GLEC v3.2 ASI / PVM decomposition (modelled)",
    },
  });

  it("serves GET /analytics/kpis with full GLEC / ISO 14083 contract", async () => {
    const env = createMockEnv({
      orders: sampleOrders,
      vehicles: sampleVehicles,
      routes: sampleRoutes,
      stops: sampleStops,
      reports: { latest: sampleReport },
    });
    const req = new Request("https://worker/analytics/kpis", {
      headers: { Authorization: "Bearer DEMO" },
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      distance: { km_total: number; km_empty: null; empty_running_pct: null };
      service: { orders: number; otif_pct: null; on_time: null };
      load: { kg_delivered: number; capacity_kg_used: number; transport_work_tkm: number };
      cost: { fuel_litres: number; fuel_cost_vnd: number | null };
      carbon: { kg_co2e_ttw: number; kg_co2e_wtw: number; factor_set: string; confidence: string };
      labels: { simulated: boolean; modelled_fuel: boolean };
    };

    assert.equal(body.distance.km_total, 40.0);
    assert.equal(body.distance.km_empty, null);
    assert.equal(body.distance.empty_running_pct, null);
    assert.equal(body.service.otif_pct, null);
    assert.equal(body.service.on_time, null);
    assert.equal(body.load.kg_delivered, 300);
    assert.equal(body.load.capacity_kg_used, 1500);
    assert.equal(body.load.transport_work_tkm, 12.0);
    assert.equal(body.cost.fuel_litres, 4.4);
    assert.equal(body.cost.fuel_cost_vnd, 4.4 * 20000);
    assert.equal(body.carbon.kg_co2e_ttw, 11.792);
    assert.equal(body.carbon.kg_co2e_wtw, 14.256);
    assert.ok(body.carbon.factor_set.includes("GLEC"));
    assert.equal(body.carbon.confidence, "C1-illustrative");
    assert.equal(body.labels.simulated, true);
    assert.equal(body.labels.modelled_fuel, true);
  });

  it("serves GET /analytics/timeseries with bucket=hour and bucket=day", async () => {
    const env = createMockEnv({
      orders: sampleOrders,
      vehicles: sampleVehicles,
      routes: sampleRoutes,
      stops: sampleStops,
      reports: { latest: sampleReport },
    });

    // bucket=hour
    const hourReq = new Request("https://worker/analytics/timeseries?bucket=hour", {
      headers: { Authorization: "Bearer DEMO" },
    });
    const hourRes = await worker.fetch(hourReq, env);
    assert.equal(hourRes.status, 200);
    const hourBody = (await hourRes.json()) as {
      bucket: string;
      points: { date: string; km: number; litres: number; kg_co2e: number; orders: number; otif_pct: null }[];
    };
    assert.equal(hourBody.bucket, "hour");
    assert.equal(hourBody.points.length, 1);
    assert.equal(hourBody.points[0].date, "08:00");
    assert.equal(hourBody.points[0].orders, 1);
    assert.equal(hourBody.points[0].otif_pct, null);

    // bucket=day
    const dayReq = new Request("https://worker/analytics/timeseries?bucket=day", {
      headers: { Authorization: "Bearer DEMO" },
    });
    const dayRes = await worker.fetch(dayReq, env);
    assert.equal(dayRes.status, 200);
    const dayBody = (await dayRes.json()) as { bucket: string; points: unknown[] };
    assert.equal(dayBody.bucket, "day");
    assert.equal(dayBody.points.length, 1);
  });

  it("serves GET /analytics/fleet", async () => {
    const env = createMockEnv({
      orders: sampleOrders,
      vehicles: sampleVehicles,
      routes: sampleRoutes,
      stops: sampleStops,
      reports: { latest: sampleReport },
    });
    const req = new Request("https://worker/analytics/fleet", {
      headers: { Authorization: "Bearer DEMO" },
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      vehicles: { plate: string; km: number; litres: number; kg_co2e: number; kg_co2e_wtw: number; payload_utilisation_pct: number | null }[];
    };
    assert.equal(body.vehicles.length, 1);
    const v = body.vehicles[0];
    assert.equal(v.plate, "51C-12345");
    assert.equal(v.km, 40.0);
    assert.equal(v.litres, 4.4);
    assert.equal(v.payload_utilisation_pct, 20); // 300 / 1500 = 20%
  });

  it("serves GET /routes/:id/audit with frozen C-06 audit keys", async () => {
    const env = createMockEnv({
      orders: sampleOrders,
      vehicles: sampleVehicles,
      routes: sampleRoutes,
      stops: sampleStops,
      reports: { latest: sampleReport },
    });
    const req = new Request("https://worker/routes/1/audit", {
      headers: { Authorization: "Bearer DEMO" },
    });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      route_id: number;
      plate: string;
      stops: number;
      routing_quality: string;
      distance_provider: string;
      solver: string;
      model_version: string;
      restriction_overlay_version: string;
      road_graph_version: string;
      seed: null;
      created_at: string;
    };
    assert.equal(body.route_id, 1);
    assert.equal(body.plate, "51C-12345");
    assert.equal(body.stops, 1);
    assert.equal(body.routing_quality, "DEGRADED");
    assert.equal(body.distance_provider, "circuity");
    assert.equal(body.solver, "legacy");
    assert.equal(body.model_version, "GLX-HDT-v1.0");
    assert.equal(body.restriction_overlay_version, "decision23-2018-v1");
    assert.equal(body.road_graph_version, "unpinned-dev:unpinned-dev");
    assert.equal(body.seed, null);
    assert.ok(body.created_at);
  });

  it("serves POST /ingest/events with batch deduplication and limits", async () => {
    const env = createMockEnv({
      orders: sampleOrders,
      vehicles: sampleVehicles,
    });
    const req = new Request("https://worker/ingest/events", {
      method: "POST",
      headers: {
        Authorization: "Bearer DEMO",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dataset_label: "test-dna",
        orders: [
          // Order 1: Duplicate of sampleOrders[0]
          {
            external_id: "EXT-1",
            address: "Stop 1",
            lat: 10.77,
            lng: 106.7,
            receiver: "Rec 1",
            phone: "0901",
            kg: 300,
            window_start: "08:30",
            window_end: "10:00",
            cargo_type: "thuong",
          },
          // Order 2: New valid order
          {
            external_id: "EXT-2",
            address: "New Address",
            lat: 10.79,
            lng: 106.68,
            receiver: "Rec 2",
            phone: "0902",
            kg: 150,
            window_start: "09:00",
            window_end: "11:00",
            cargo_type: "lanh",
          },
        ],
      }),
    });

    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      imported: number;
      rows_seen: number;
      rows_imported: number;
      skipped_duplicates: number;
      rows_rejected: number;
      dedupe: boolean;
      limits: { max_upload_bytes: number; max_data_rows: number };
    };
    assert.equal(body.rows_seen, 2);
    assert.equal(body.rows_imported, 1);
    assert.equal(body.skipped_duplicates, 1);
    assert.equal(body.rows_rejected, 0);
    assert.equal(body.dedupe, true);
    assert.equal(body.limits.max_upload_bytes, 10485760);
    assert.equal(body.limits.max_data_rows, 1000);

    // Re-uploading with the same external_id EXT-2 even with varied address/receiver
    const reUploadReq = new Request("https://worker/ingest/events", {
      method: "POST",
      headers: { Authorization: "Bearer DEMO", "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: [
          { external_id: "EXT-2", address: "Different Address", lat: 10.8, lng: 106.6, receiver: "Diff", phone: "0999", kg: 10, window_start: "08:00", window_end: "09:00" },
          { external_id: "EXT-3", address: "Bad Coords", lat: 95.0, lng: 106.6, receiver: "Bad", phone: "0998", kg: 10, window_start: "08:00", window_end: "09:00" },
        ],
      }),
    });
    const reRes = await worker.fetch(reUploadReq, env);
    assert.equal(reRes.status, 200);
    const reBody = (await reRes.json()) as { skipped_duplicates: number; rows_rejected: number; errors: { message: string }[] };
    assert.equal(reBody.skipped_duplicates, 1);
    assert.equal(reBody.rows_rejected, 1);
    assert.ok(reBody.errors[0].message.includes("[-90,90]"));
  });

  it("serves GET /report with complete metrics block matching ReportOut", async () => {
    const env = createMockEnv({
      orders: sampleOrders,
      vehicles: sampleVehicles,
      routes: sampleRoutes,
      stops: sampleStops,
      reports: { latest: sampleReport },
    });
    const req = new Request("https://worker/report", { headers: { Authorization: "Bearer DEMO" } });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      baseline: unknown;
      optimized: unknown;
      delta: unknown;
      metrics?: {
        g_co2e_per_tkm: number | null;
        kg_co2e_wtw: number | null;
        boundary: string;
        factor_set: string;
        confidence: string;
        model_version: string;
      };
    };
    assert.ok(body.metrics);
    assert.equal(body.metrics?.boundary, "TTW");
    assert.equal(body.metrics?.confidence, "C1-illustrative");
    assert.equal(body.metrics?.model_version, "GLX-HDT-v1.0");
  });

  it("returns null for kg_co2e_wtw in /analytics/kpis when kmTotal is zero", async () => {
    const env = createMockEnv({
      orders: [],
      vehicles: sampleVehicles,
      routes: [],
      stops: [],
    });
    const req = new Request("https://worker/analytics/kpis", { headers: { Authorization: "Bearer DEMO" } });
    const res = await worker.fetch(req, env);
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      distance: { km_total: number };
      carbon: { kg_co2e_wtw: number | null };
      load: { vehicle_fill_pct: number | null };
    };
    assert.equal(body.distance.km_total, 0);
    assert.equal(body.carbon.kg_co2e_wtw, null);
    assert.equal(body.load.vehicle_fill_pct, null);
  });
});
