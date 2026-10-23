/** Path/auth helpers for the edge worker. Keep demo login footguns closed. */

export type JudgeTotals = { km: number; litres: number; kg_co2: number };

const DEMO_BEARER = /^bearer\s+demo$/i;

export function apiPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/api" || clean.startsWith("/api/")) {
    return clean.slice(4) || "/";
  }
  return clean;
}

export function isDemoDispatcher(request: Request): boolean {
  const url = new URL(request.url);
  if (url.searchParams.get("token") === "DEMO") return true;
  const auth = (request.headers.get("Authorization") ?? "").trim();
  return DEMO_BEARER.test(auth);
}

export function judgeOptimizeFields(
  vrp: { totals: JudgeTotals; baseline: JudgeTotals },
  providerId: string,
  ecoWeight: number
): {
  totals: JudgeTotals;
  baseline: JudgeTotals;
  distance_provider: string;
  eco_weight: number;
} {
  return {
    totals: vrp.totals,
    baseline: vrp.baseline,
    distance_provider: providerId,
    eco_weight: ecoWeight,
  };
}
