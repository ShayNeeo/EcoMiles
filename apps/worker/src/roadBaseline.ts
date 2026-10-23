/**
 * Road-network distance providers (OSM now, Google Directions later).
 * Google-class baseline is Valhalla auto/truck or OSRM driving until a Google
 * Maps key is configured. Circuity fallback keeps the edge demo online without
 * a local OSM extract. Do not scrape Google.
 */

import { DIESEL_FACTOR, HCMC_CIRCUITY, PETROL_FACTOR, haversineKm, roadKm } from "./solver.ts";

export type LatLng = [number, number];
export type PairKm = (lat1: number, lng1: number, lat2: number, lng2: number) => number;
export type Transport = (url: string, method: string, body?: string) => Promise<unknown>;

export const DEFAULT_OSRM_URL = "https://router.project-osrm.org";
export const DEFAULT_VALHALLA_URL = "https://valhalla1.openstreetmap.de";
export const DEFAULT_TIMEOUT_MS = 2500;
export const DEFAULT_RETRIES = 2;
export const DEFAULT_CACHE_TTL_MS = 300_000;
export const DEFAULT_COSTING = "truck";

const matrixCache = new Map<string, { at: number; matrix: number[][]; name: string }>();

export function clearMatrixCache(): void {
  matrixCache.clear();
}

export function validateMatrixKm(matrix: number[][]): number[][] {
  if (!matrix.length) throw new RoadBaselineError("empty distance matrix");
  const n = matrix.length;
  for (let i = 0; i < n; i++) {
    if (!matrix[i] || matrix[i].length !== n) throw new RoadBaselineError("matrix must be square");
    for (let j = 0; j < n; j++) {
      const value = matrix[i][j];
      if (value == null || !Number.isFinite(value) || value < 0) {
        throw new RoadBaselineError(`invalid matrix cell at ${i},${j}`);
      }
    }
  }
  return matrix;
}

function usedProviderId(provider: RoadBaseline): string {
  return (provider as FallbackRoadBaseline).lastProviderId || provider.providerId;
}

export class RoadBaselineError extends Error {}
export class RoadBaselineNotConfigured extends RoadBaselineError {}

export interface RoadBaseline {
  providerId: string;
  pairKm(lat1: number, lng1: number, lat2: number, lng2: number): number | Promise<number>;
  matrixKm(points: LatLng[]): Promise<number[][]>;
}

function key(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

async function defaultTransport(url: string, method: string, body?: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      body,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new RoadBaselineError(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(tid);
  }
}

async function callTransport(
  transport: Transport | undefined,
  url: string,
  method: string,
  body?: string,
  retries = DEFAULT_RETRIES
): Promise<unknown> {
  let last: unknown;
  const attempts = Math.max(1, retries + 1);
  for (let i = 0; i < attempts; i++) {
    try {
      return await (transport ?? defaultTransport)(url, method, body);
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new RoadBaselineError(String(last));
}

export class CircuityRoadBaseline implements RoadBaseline {
  providerId = "circuity";

  pairKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return haversineKm(lat1, lng1, lat2, lng2) * HCMC_CIRCUITY;
  }

  async matrixKm(points: LatLng[]): Promise<number[][]> {
    return points.map((a) => points.map((b) => this.pairKm(a[0], a[1], b[0], b[1])));
  }
}

export class CachedMatrixBaseline implements RoadBaseline {
  providerId: string;
  private index = new Map<string, number>();
  private matrix: number[][];
  private fallback: RoadBaseline;

  constructor(
    points: LatLng[],
    matrix: number[][],
    providerId: string,
    fallback: RoadBaseline = new CircuityRoadBaseline()
  ) {
    this.providerId = providerId;
    this.matrix = matrix;
    this.fallback = fallback;
    points.forEach((pt, i) => this.index.set(key(pt[0], pt[1]), i));
  }

  pairKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const i = this.index.get(key(lat1, lng1));
    const j = this.index.get(key(lat2, lng2));
    if (i !== undefined && j !== undefined) return this.matrix[i][j];
    const fb = this.fallback.pairKm(lat1, lng1, lat2, lng2);
    return typeof fb === "number" ? fb : roadKm(lat1, lng1, lat2, lng2);
  }

  async matrixKm(points: LatLng[]): Promise<number[][]> {
    return points.map((a) => points.map((b) => this.pairKm(a[0], a[1], b[0], b[1])));
  }
}

export class FallbackRoadBaseline implements RoadBaseline {
  providerId = "fallback";
  lastProviderId = "circuity";
  private primary: RoadBaseline;
  private fallback: RoadBaseline;

  constructor(primary: RoadBaseline, fallback: RoadBaseline = new CircuityRoadBaseline()) {
    this.primary = primary;
    this.fallback = fallback;
  }

  pairKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    try {
      const km = this.primary.pairKm(lat1, lng1, lat2, lng2);
      if (typeof km !== "number") throw new Error("async pair");
      this.lastProviderId = this.primary.providerId;
      return km;
    } catch {
      this.lastProviderId = "circuity";
      return roadKm(lat1, lng1, lat2, lng2);
    }
  }

  async matrixKm(points: LatLng[]): Promise<number[][]> {
    try {
      const matrix = await this.primary.matrixKm(points);
      this.lastProviderId = this.primary.providerId;
      return matrix;
    } catch {
      const matrix = await this.fallback.matrixKm(points);
      this.lastProviderId = usedProviderId(this.fallback);
      return matrix;
    }
  }
}

export function parseOsrmTable(payload: { code?: string; distances?: Array<Array<number | null>> }): number[][] {
  if (payload.code !== "Ok" || !payload.distances?.length) {
    throw new RoadBaselineError(`OSRM table error: ${payload.code ?? "missing"}`);
  }
  return validateMatrixKm(
    payload.distances.map((row) => row.map((cell) => (cell == null ? Number.NaN : cell / 1000)))
  );
}

export function osrmTableUrl(baseUrl: string, points: LatLng[], profile = "driving"): string {
  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(";");
  return `${baseUrl.replace(/\/$/, "")}/table/v1/${profile}/${coords}?annotations=distance`;
}

export class OsrmRoadBaseline implements RoadBaseline {
  providerId = "osrm";
  private opts: { baseUrl?: string; transport?: Transport; profile?: string };

  constructor(opts: { baseUrl?: string; transport?: Transport; profile?: string } = {}) {
    this.opts = opts;
  }

  async matrixKm(points: LatLng[]): Promise<number[][]> {
    if (points.length < 2) return points.map(() => points.map(() => 0));
    const payload = (await callTransport(
      this.opts.transport,
      osrmTableUrl(this.opts.baseUrl ?? DEFAULT_OSRM_URL, points, this.opts.profile ?? "driving"),
      "GET"
    )) as { code?: string; distances?: number[][] };
    return parseOsrmTable(payload);
  }

  async pairKm(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    return (await this.matrixKm([[lat1, lng1], [lat2, lng2]]))[0][1];
  }
}

export function parseValhallaMatrix(payload: { sources_to_targets?: Array<Array<{ distance?: number }>> }): number[][] {
  const rows = payload.sources_to_targets;
  if (!rows?.length) throw new RoadBaselineError("Valhalla matrix missing sources_to_targets");
  return validateMatrixKm(
    rows.map((row) =>
      row.map((cell) => {
        if (cell == null || cell.distance == null) throw new RoadBaselineError("Valhalla matrix cell missing distance");
        return Number(cell.distance);
      })
    )
  );
}

export function valhallaMatrixBody(points: LatLng[], costing = "auto"): Record<string, unknown> {
  const locs = points.map(([lat, lng]) => ({ lat, lon: lng }));
  const body: Record<string, unknown> = { sources: locs, targets: locs, costing };
  if (costing === "truck") {
    body.costing_options = { truck: { height: 2.4, width: 2.0, length: 5.2, weight: 3.5 } };
  }
  return body;
}

export class ValhallaRoadBaseline implements RoadBaseline {
  providerId = "valhalla";
  private opts: { baseUrl?: string; costing?: string; transport?: Transport };

  constructor(opts: { baseUrl?: string; costing?: string; transport?: Transport } = {}) {
    this.opts = opts;
  }

  async matrixKm(points: LatLng[]): Promise<number[][]> {
    if (points.length < 2) return points.map(() => points.map(() => 0));
    const payload = (await callTransport(
      this.opts.transport,
      `${(this.opts.baseUrl ?? DEFAULT_VALHALLA_URL).replace(/\/$/, "")}/sources_to_targets`,
      "POST",
      JSON.stringify(valhallaMatrixBody(points, this.opts.costing ?? DEFAULT_COSTING))
    )) as { sources_to_targets?: { distance: number }[][] };
    return parseValhallaMatrix(payload);
  }

  async pairKm(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    return (await this.matrixKm([[lat1, lng1], [lat2, lng2]]))[0][1];
  }
}

export class GoogleDirectionsBaseline implements RoadBaseline {
  providerId = "google_directions";

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new RoadBaselineNotConfigured(
        "GOOGLE_MAPS_API_KEY not set; Google-class baseline is OSM (Valhalla/OSRM)"
      );
    }
    throw new RoadBaselineNotConfigured(
      "Google Directions client is not wired yet; keep using OSM RoadBaseline"
    );
  }

  pairKm(): number {
    throw new RoadBaselineNotConfigured("Google Directions client is not wired yet");
  }

  async matrixKm(): Promise<number[][]> {
    throw new RoadBaselineNotConfigured("Google Directions client is not wired yet");
  }
}

export async function materializeMatrix(
  provider: RoadBaseline,
  points: LatLng[],
  nowMs = Date.now(),
  ttlMs = DEFAULT_CACHE_TTL_MS
): Promise<CachedMatrixBaseline | CircuityRoadBaseline> {
  const key = `${provider.providerId}|${points.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join(";")}`;
  const hit = matrixCache.get(key);
  if (hit && nowMs - hit.at < ttlMs) {
    return new CachedMatrixBaseline(points, hit.matrix, hit.name);
  }
  try {
    const matrix = validateMatrixKm(await provider.matrixKm(points));
    const name = usedProviderId(provider);
    if (name !== "circuity") matrixCache.set(key, { at: nowMs, matrix, name });
    return new CachedMatrixBaseline(points, matrix, name);
  } catch {
    return new CircuityRoadBaseline();
  }
}

export function resolveRoadBaseline(env: {
  ROAD_BASELINE?: string;
  ROAD_BASELINE_URL?: string;
  ROAD_BASELINE_COSTING?: string;
  OSRM_URL?: string;
  VALHALLA_URL?: string;
  GOOGLE_MAPS_API_KEY?: string;
} = {}): RoadBaseline {
  let choice = (env.ROAD_BASELINE || "auto").trim().toLowerCase();
  if (choice === "google" || choice === "google_directions") choice = "auto";
  const costing = (env.ROAD_BASELINE_COSTING || DEFAULT_COSTING).trim().toLowerCase();
  const shared = (env.ROAD_BASELINE_URL || "").trim();
  const osrmUrl = env.OSRM_URL || (choice === "osrm" ? shared : "") || DEFAULT_OSRM_URL;
  const valhallaUrl = env.VALHALLA_URL || (choice === "valhalla" ? shared : "") || DEFAULT_VALHALLA_URL;
  if (choice === "circuity" || choice === "haversine") return new CircuityRoadBaseline();
  if (choice === "osrm") return new FallbackRoadBaseline(new OsrmRoadBaseline({ baseUrl: osrmUrl }));
  if (choice === "valhalla") {
    return new FallbackRoadBaseline(new ValhallaRoadBaseline({ baseUrl: valhallaUrl, costing }));
  }
  return new FallbackRoadBaseline(
    new ValhallaRoadBaseline({ baseUrl: valhallaUrl, costing }),
    new FallbackRoadBaseline(new OsrmRoadBaseline({ baseUrl: osrmUrl }))
  );
}

export function ecoLegCost(km: number, lPer100km: number, fuel: string, ecoWeight: number): number {
  const w = Math.max(0, Math.min(1, Number(ecoWeight) || 0));
  if (w <= 0) return km;
  const factor = fuel === "diesel" ? DIESEL_FACTOR : PETROL_FACTOR;
  const kg = km * (lPer100km / 100) * factor;
  return (1 - w) * km + w * kg;
}

export function ecoWeightFromEnv(raw?: string): number {
  const envObj = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const fromProcess = envObj?.ECOMILES_ECO_WEIGHT ?? envObj?.GREENLOGIX_ECO_WEIGHT;
  const text = (raw ?? fromProcess ?? "").trim();
  if (!text) return 0;
  const n = Number(text);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function makeEcoPairKm(pairKm: PairKm, lPer100km: number, fuel: string, ecoWeight: number): PairKm {
  return (lat1, lng1, lat2, lng2) => ecoLegCost(pairKm(lat1, lng1, lat2, lng2), lPer100km, fuel, ecoWeight);
}
