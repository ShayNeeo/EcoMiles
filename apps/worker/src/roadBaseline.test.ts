import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HCMC_CIRCUITY, haversineKm, roadKm, runVrp } from "./solver.ts";
import {
  CircuityRoadBaseline,
  FallbackRoadBaseline,
  GoogleDirectionsBaseline,
  OsrmRoadBaseline,
  RoadBaselineNotConfigured,
  ValhallaRoadBaseline,
  clearMatrixCache,
  ecoLegCost,
  ecoWeightFromEnv,
  materializeMatrix,
  parseOsrmTable,
  parseValhallaMatrix,
  resolveRoadBaseline,
} from "./roadBaseline.ts";

describe("RoadBaseline", () => {
  it("circuity matches legacy roadKm", () => {
    const a: [number, number] = [10.776, 106.7];
    const b: [number, number] = [10.801, 106.661];
    const got = new CircuityRoadBaseline().pairKm(a[0], a[1], b[0], b[1]);
    assert.equal(got, roadKm(a[0], a[1], b[0], b[1]));
    assert.ok(Math.abs(got / haversineKm(a[0], a[1], b[0], b[1]) - HCMC_CIRCUITY) < 1e-12);
  });

  it("fallback uses circuity when OSM transport fails", async () => {
    const boom = {
      providerId: "boom",
      pairKm() {
        throw new Error("down");
      },
      async matrixKm() {
        throw new Error("down");
      },
    };
    const fb = new FallbackRoadBaseline(boom);
    const km = fb.pairKm(10.776, 106.7, 10.801, 106.661);
    assert.equal(km, roadKm(10.776, 106.7, 10.801, 106.661));
    assert.equal(fb.lastProviderId, "circuity");
  });

  it("parses OSRM meters and Valhalla kilometers", () => {
    const osrm = parseOsrmTable({ code: "Ok", distances: [[0, 13500], [13500, 0]] });
    assert.equal(osrm[0][1], 13.5);
    const val = parseValhallaMatrix({
      sources_to_targets: [[{ distance: 0 }, { distance: 7.2 }], [{ distance: 7.4 }, { distance: 0 }]],
    });
    assert.equal(val[0][1], 7.2);
  });

  it("OSRM and Valhalla use injected transport", async () => {
    const osrm = new OsrmRoadBaseline({
      transport: async (url, method) => {
        assert.equal(method, "GET");
        assert.match(url, /table\/v1\/driving/);
        return { code: "Ok", distances: [[0, 2000], [2100, 0]] };
      },
    });
    assert.equal(await osrm.pairKm(10.0, 106.7, 10.01, 106.71), 2.0);

    const valhalla = new ValhallaRoadBaseline({
      costing: "auto",
      transport: async (url, method) => {
        assert.equal(method, "POST");
        assert.match(url, /sources_to_targets$/);
        return {
          sources_to_targets: [[{ distance: 0 }, { distance: 4.5 }], [{ distance: 4.6 }, { distance: 0 }]],
        };
      },
    });
    assert.equal(await valhalla.pairKm(10.8, 106.66, 10.77, 106.7), 4.5);
  });

  it("Google stub refuses missing key", () => {
    assert.throws(() => new GoogleDirectionsBaseline(""), (err: unknown) => err instanceof RoadBaselineNotConfigured);
  });

  it("resolve google/auto uses Valhalla truck then OSRM", () => {
    const auto = resolveRoadBaseline({ ROAD_BASELINE: "auto" }) as FallbackRoadBaseline;
    assert.equal((auto as unknown as { primary: { providerId: string; opts: { costing?: string } } }).primary.providerId, "valhalla");
    const google = resolveRoadBaseline({ ROAD_BASELINE: "google" }) as FallbackRoadBaseline;
    assert.equal(google.providerId, "fallback");
  });

  it("rejects null OSRM cells", () => {
    assert.throws(() => parseOsrmTable({ code: "Ok", distances: [[0, null], [1, 0]] }));
  });

  it("TTL cache skips a second HTTP fetch", async () => {
    clearMatrixCache();
    let calls = 0;
    const provider = new OsrmRoadBaseline({
      transport: async () => {
        calls += 1;
        return { code: "Ok", distances: [[0, 4000], [4000, 0]] };
      },
    });
    const pts: [number, number][] = [
      [10.801, 106.661],
      [10.776, 106.7],
    ];
    const first = await materializeMatrix(provider, pts, 1_000);
    const second = await materializeMatrix(provider, pts, 2_000);
    assert.equal(first.providerId, "osrm");
    assert.equal(second.pairKm(10.801, 106.661, 10.776, 106.7), 4);
    assert.equal(calls, 1);
    clearMatrixCache();
  });

  it("materialize caches matrix and falls back", async () => {
    let calls = 0;
    const cached = await materializeMatrix(
      new OsrmRoadBaseline({
        transport: async () => {
          calls += 1;
          return { code: "Ok", distances: [[0, 8000], [8000, 0]] };
        },
      }),
      [
        [10.801, 106.661],
        [10.776, 106.7],
      ]
    );
    assert.equal(cached.providerId, "osrm");
    assert.equal(cached.pairKm(10.801, 106.661, 10.776, 106.7), 8);
    cached.pairKm(10.801, 106.661, 10.776, 106.7);
    assert.equal(calls, 1);

    const fallback = await materializeMatrix(
      {
        providerId: "boom",
        pairKm() {
          throw new Error("down");
        },
        async matrixKm() {
          throw new Error("down");
        },
      },
      [[10.801, 106.661]]
    );
    assert.equal(fallback.providerId, "circuity");
  });
});

describe("eco-cost", () => {
  it("blends km and kg_co2", () => {
    assert.equal(ecoLegCost(50, 12, "diesel", 0), 50);
    assert.equal(ecoLegCost(50, 12, "diesel", 1), 50 * 0.12 * 2.68);
    assert.equal(ecoLegCost(50, 12, "diesel", 0.5), 0.5 * 50 + 0.5 * 50 * 0.12 * 2.68);
  });

  it("baseline vs optimized still differ on road km", () => {
    const orders = [
      { id: 1, address: "a", lat: 10.776, lng: 106.7, receiver: "KH", phone: "", kg: 80, window_start: "09:00", window_end: "10:00", cargo_type: "thuong", notes: "", excel_row: 1, status: "pending" },
      { id: 2, address: "b", lat: 10.79, lng: 106.68, receiver: "KH", phone: "", kg: 80, window_start: "08:00", window_end: "10:00", cargo_type: "thuong", notes: "", excel_row: 2, status: "pending" },
      { id: 3, address: "c", lat: 10.76, lng: 106.72, receiver: "KH", phone: "", kg: 80, window_start: "10:00", window_end: "12:00", cargo_type: "thuong", notes: "", excel_row: 3, status: "pending" },
    ];
    const vehicles = [
      { id: 1, plate: "51C-000.01", type: "xe_tai_nho", capacity_kg: 2000, fuel: "diesel" as const, l_per_100km: 12, status: "ready" as const },
    ];
    const result = runVrp(orders, vehicles, [10.801, 106.661], "Tan Binh DC", 50, roadKm, 0);
    assert.ok(result.baseline.km > 0);
    assert.ok(result.totals.km > 0);
    assert.notEqual(result.totals.km, result.baseline.km);
  });

  it("reads GREENLOGIX_ECO_WEIGHT", () => {
    const prev = process.env.GREENLOGIX_ECO_WEIGHT;
    delete process.env.GREENLOGIX_ECO_WEIGHT;
    assert.equal(ecoWeightFromEnv(), 0);
    process.env.GREENLOGIX_ECO_WEIGHT = "0.25";
    assert.equal(ecoWeightFromEnv(), 0.25);
    if (prev === undefined) delete process.env.GREENLOGIX_ECO_WEIGHT;
    else process.env.GREENLOGIX_ECO_WEIGHT = prev;
  });

  it("eco_weight=1 plus failed OSM reports circuity not fallback", async () => {
    const boom = {
      providerId: "boom",
      pairKm() {
        throw new Error("down");
      },
      async matrixKm() {
        throw new Error("down");
      },
    };
    const cached = await materializeMatrix(new FallbackRoadBaseline(boom), [
      [10.801, 106.661],
      [10.776, 106.7],
    ]);
    assert.equal(cached.providerId, "circuity");
    assert.notEqual(cached.providerId, "fallback");
    assert.equal(ecoWeightFromEnv("1"), 1);

    const orders = [
      { id: 1, address: "a", lat: 10.776, lng: 106.7, receiver: "KH", phone: "", kg: 80, window_start: "09:00", window_end: "10:00", cargo_type: "thuong", notes: "", excel_row: 1, status: "pending" },
      { id: 2, address: "b", lat: 10.79, lng: 106.68, receiver: "KH", phone: "", kg: 80, window_start: "08:00", window_end: "10:00", cargo_type: "thuong", notes: "", excel_row: 2, status: "pending" },
      { id: 3, address: "c", lat: 10.76, lng: 106.72, receiver: "KH", phone: "", kg: 80, window_start: "10:00", window_end: "12:00", cargo_type: "thuong", notes: "", excel_row: 3, status: "pending" },
    ];
    const vehicles = [
      { id: 1, plate: "51C-000.01", type: "xe_tai_nho", capacity_kg: 2000, fuel: "diesel" as const, l_per_100km: 12, status: "ready" as const },
    ];
    const result = runVrp(orders, vehicles, [10.801, 106.661], "Tan Binh DC", 50, (lat1, lng1, lat2, lng2) => cached.pairKm(lat1, lng1, lat2, lng2) as number, 1);
    assert.notEqual(result.totals.km, result.baseline.km);
    assert.ok(result.baseline.kg_co2 > 0);
    assert.ok(result.totals.kg_co2 > 0);
  });
});
