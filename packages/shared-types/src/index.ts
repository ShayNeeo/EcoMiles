/**
 * @ecomiles/shared-types
 * Strict TypeScript interfaces matching the frozen OpenAPI and CR-20261024-001 contracts.
 */

export type CargoType = "thuong" | "lanh" | "de_vo";
export type FuelType = "petrol" | "diesel";
export type VehicleStatus = "ready" | "maintenance";
export type StopStatus = "pending" | "arrived" | "delivered" | "failed";
export type DeliveryStatus = "arrived" | "delivered" | "failed";
export type FailureReason = "khach_vang" | "sai_dia_chi" | "hang_hong" | "tu_choi";
export type RoutingQuality = "VERIFIED_GRAPH" | "DEGRADED" | "UNAVAILABLE";

export interface OrderOut {
  id: number;
  address: string;
  lat: number;
  lng: number;
  receiver: string;
  phone: string;
  kg: number;
  window_start: string;
  window_end: string;
  cargo_type: CargoType;
  notes: string;
  excel_row: number | null;
  status: "pending" | "assigned" | "arrived" | "delivered" | "failed";
  late_risk?: boolean;
  place_id?: string | null;
  place_provider?: string | null;
  place_confidence?: number | null;
  geocode_at?: string | null;
}

export interface VehicleOut {
  id: number;
  plate: string;
  type: string;
  capacity_kg: number;
  fuel: FuelType;
  l_per_100km: number;
  status: VehicleStatus;
  height_m?: number | null;
  width_m?: number | null;
  length_m?: number | null;
  gvw_kg?: number | null;
  axle_load_t?: number | null;
  frontal_area_m2?: number | null;
  cd?: number | null;
}

export interface StopOut {
  id: number;
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
  status: StopStatus;
  fail_reason?: FailureReason | null;
  late_risk?: boolean;
}

export interface RouteOut {
  id: number;
  vehicle_id: number;
  plate: string;
  color: string;
  published: boolean;
  km: number;
  litres: number;
  kg_co2: number;
  overload: boolean;
  stops: StopOut[];
  kg_co2e_wtw?: number | null;
  transport_work_tkm?: number | null;
}

export interface OptimizeIn {
  cluster_radius_km?: number;
  optimizer?: "legacy" | "ecoalns" | null;
  enforce_time_windows?: boolean;
  enforce_truck_ban?: boolean;
}

export interface ReportTotals {
  km: number;
  litres: number;
  kg_co2: number;
  kg_co2e_wtw?: number | null;
  transport_work_tkm?: number | null;
}

export interface ReportDelta {
  km: number;
  litres: number;
  kg_co2: number;
  km_pct: number;
  litres_pct: number;
  kg_co2_pct: number;
  kg_co2e_wtw?: number | null;
  kg_co2e_wtw_pct?: number | null;
}

export interface CarbonDecomposition {
  baseline_kg_co2e: number;
  optimized_kg_co2e: number;
  delta_kg_co2e: number;
  distance_effect_kg: number;
  fleet_intensity_effect_kg: number;
  methodology: string;
}

export interface ReportMetrics {
  g_co2e_per_order?: number | null;
  g_co2e_per_tkm?: number | null;
  payload_utilisation_pct?: number | null;
  empty_running_pct?: number | null;
  otif_pct?: number | null;
  kg_co2e_wtw?: number | null;
  boundary?: string;
  factor_set?: string;
  factor_year?: number | null;
  confidence?: string;
  model_version?: string;
  decomposition?: CarbonDecomposition | null;
}

export interface ReportOut {
  baseline: ReportTotals;
  optimized: ReportTotals;
  delta: ReportDelta;
  distance_provider?: string;
  routing_quality?: RoutingQuality | string;
  eco_weight?: number;
  metrics?: ReportMetrics | null;
}

export interface OptimizeOut {
  routes: RouteOut[];
  unassigned_order_ids: number[];
  totals: ReportTotals;
  baseline: ReportTotals;
  distance_provider?: string;
  routing_quality?: RoutingQuality | string;
  eco_weight?: number;
  optimizer_used?: string;
  restriction_coverage?: string;
  ban_conflicts?: number;
  time_window_conflicts?: number;
}

export interface AnalyticsKpisOut {
  dataset: {
    label: string;
    kind: string;
    seed: number | null;
    generated_at: string | null;
    orders: number;
    vehicles: number;
  };
  period: {
    from: string | null;
    to: string | null;
  };
  distance: {
    km_total: number;
    km_empty: number | null;
    empty_running_pct: number | null;
    km_per_stop: number | null;
    stops_per_hour: number | null;
  };
  load: {
    kg_delivered: number;
    capacity_kg_used: number;
    transport_work_tkm: number;
    payload_utilisation_pct: number | null;
    vehicle_fill_pct: number | null;
  };
  service: {
    orders: number;
    delivered: number;
    failed: number;
    on_time: number | null;
    otif_pct: number | null;
    late_orders: number;
  };
  cost: {
    fuel_litres: number;
    fuel_cost_vnd: number | null;
    cost_per_order_vnd: number | null;
    cost_per_km_vnd: number | null;
  };
  carbon: {
    kg_co2e_ttw: number;
    kg_co2e_wtw: number | null;
    g_co2e_per_tkm: number | null;
    g_co2e_per_order: number | null;
    boundary: string;
    factor_set: string;
    confidence: string;
    model_version: string;
    decomposition?: CarbonDecomposition | null;
  };
  labels: {
    simulated: boolean;
    modelled_fuel: boolean;
    routing_quality: string;
  };
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  km: number;
  litres: number;
  kg_co2e: number;
  orders: number;
  otif_pct: number | null;
  kg_co2e_wtw?: number | null;
}

export interface AnalyticsTimeseriesOut {
  bucket: "day" | "hour";
  points: AnalyticsTimeseriesPoint[];
}

export interface AnalyticsFleetVehicle {
  plate: string;
  km: number;
  litres: number;
  kg_co2e: number;
  orders: number;
  kg_delivered: number;
  payload_utilisation_pct: number | null;
  capacity_kg: number;
  fuel: string;
  l_per_100km_spec: number;
  kg_co2e_wtw?: number | null;
}

export interface AnalyticsFleetOut {
  vehicles: AnalyticsFleetVehicle[];
}

export interface RouteAuditOut {
  route_id: number;
  plate: string;
  km: number;
  litres: number;
  kg_co2: number;
  stops: number;
  routing_quality: string;
  distance_provider: string;
  solver: string;
  model_version: string;
  restriction_overlay_version: string;
  road_graph_version: string;
  seed: number | null;
  created_at: string;
}

export interface IngestEventOrder {
  external_id?: string;
  address: string;
  lat: number;
  lng: number;
  receiver: string;
  phone: string;
  kg: number;
  window_start: string;
  window_end: string;
  cargo_type: CargoType;
  notes?: string;
}

export interface IngestEventsIn {
  dataset_label?: string;
  orders: IngestEventOrder[];
}

export interface ImportErrorItem {
  excel_row: number;
  field: string;
  message: string;
}

export interface ImportLimits {
  max_upload_bytes: number;
  max_data_rows: number;
}

export interface ImportResult {
  imported: number;
  errors: ImportErrorItem[];
  rows_seen: number;
  rows_imported: number;
  skipped_duplicates: number;
  rows_rejected: number;
  dedupe: boolean;
  limits: ImportLimits;
}
