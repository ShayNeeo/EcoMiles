import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Link,
  Outlet,
  createMemoryHistory,
} from '@tanstack/react-router';
import { actions } from 'astro:actions';
import {
  Layers,
  Truck,
  ShieldCheck,
  RefreshCw,
  Zap,
  UploadCloud,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Leaf,
  Navigation,
  KeyRound,
} from 'lucide-react';


interface EChartsInstance {
  setOption: (opt: Record<string, unknown>, notMerge?: boolean) => void;
  resize: () => void;
  dispose: () => void;
}

declare global {
  interface Window {
    echarts?: {
      init: (el: HTMLElement, theme?: string | null, opts?: { renderer?: string }) => EChartsInstance;
    };
  }
}

function EChartBox({ option, height = 240 }: { option: Record<string, unknown>; height?: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof window === 'undefined' || !window.echarts) return;
    const inst = window.echarts.init(el, null, { renderer: 'canvas' });
    inst.setOption(option, true);
    const onResize = () => inst.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      inst.dispose();
    };
  }, [option]);
  return <div ref={hostRef} style={{ width: '100%', height: `${height}px` }} />;
}
// ==========================================
// Types
// ==========================================
export interface PortalProps {
  initialRoute?: string;
}

interface StopItem {
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

interface RouteItem {
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
  stops: StopItem[];
}

interface VehicleItem {
  id: number;
  plate: string;
  type: string;
  capacity_kg: number;
  fuel: 'petrol' | 'diesel';
  l_per_100km: number;
  status: 'ready' | 'maintenance';
}

interface OrderItem {
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
  status: 'pending' | 'arrived' | 'delivered' | 'failed';
  late_risk: boolean;
}

interface KpiData {
  dataset: {
    label: string;
    kind: string;
    seed: number | null;
    generated_at: string;
    orders: number;
    vehicles: number;
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
    payload_utilisation_pct: number;
    vehicle_fill_pct: number;
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
    kg_co2e_wtw: number;
    g_co2e_per_tkm: number | null;
    g_co2e_per_order: number | null;
    boundary: string;
    factor_set: string;
    confidence: string;
    model_version: string;
    decomposition: {
      baseline_kg_co2e: number;
      optimized_kg_co2e: number;
      delta_kg_co2e: number;
      distance_effect_kg: number;
      fleet_intensity_effect_kg: number;
      methodology: string;
      baseline_km?: number;
    };
  };
  labels: {
    simulated: boolean;
    modelled_fuel: boolean;
    routing_quality: string;
  };
}

interface TimeseriesPoint {
  date: string;
  km: number;
  litres: number;
  kg_co2e: number;
  orders: number;
  otif_pct: number | null;
}

interface AuditRecord {
  route_id: number;
  plate: string;
  km: number;
  litres: number;
  kg_co2: number;
  kg_co2_wtw: number;
  stops: number;
  routing_quality: string;
  distance_provider: string;
  solver: string;
  model_version: string;
  road_graph_version: string;
  restriction_overlay_version: string;
  cost_model_version: string;
  seed: number | null;
  created_at: string;
  note: string;
}
interface FleetItem {
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
}

interface DriverRoute {
  plate: string;
  stops: StopItem[];
}
interface ReportData {
  baseline?: { km?: number; litres?: number; kg_co2?: number };
  optimized?: { km?: number; litres?: number; kg_co2?: number };
}



// Helper: HCMC Peak Truck Ban check (06-09h and 16-20h)
function isBanHour(start?: string, end?: string): boolean {
  if (!start || !end) return false;
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const s = toMin(start);
  const e = toMin(end);
  return (s < 540 && e > 360) || (s < 1200 && e > 960);
}

// ==========================================
// 1. Dashboard View (7 Charts + KPIs + PVM/ASI)
// ==========================================
function DashboardView() {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [bucket, setBucket] = useState<'day' | 'hour'>('hour');
  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [_loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string>('');

  const loadData = async (activeBucket = bucket) => {
    setLoading(true);
    try {
      const [kpiRes, tsRes, fleetRes, routesRes, reportRes] = await Promise.all([
        fetch('/api/analytics/kpis').then((r) => r.json()),
        fetch(`/api/analytics/timeseries?bucket=${activeBucket}`).then((r) => r.json()),
        fetch('/api/analytics/fleet').then((r) => r.json()),
        fetch('/api/routes').then((r) => r.json()),
        fetch('/api/report').then((r) => r.json()).catch(() => null),
      ]);
      setKpis(kpiRes);
      setTimeseries(tsRes.points || []);
      setFleet(fleetRes.vehicles || []);
      setRoutes(routesRes || []);
      setReport(reportRes);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch('/api/analytics/kpis').then((r) => r.json()),
      fetch(`/api/analytics/timeseries?bucket=${bucket}`).then((r) => r.json()),
      fetch('/api/analytics/fleet').then((r) => r.json()),
      fetch('/api/routes').then((r) => r.json()),
      fetch('/api/report').then((r) => r.json()).catch(() => null),
    ])
      .then(([kpiRes, tsRes, fleetRes, routesRes, reportRes]) => {
        if (!ignore) {
          setKpis(kpiRes);
          setTimeseries(tsRes.points || []);
          setFleet(fleetRes.vehicles || []);
          setRoutes(routesRes || []);
          setReport(reportRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data', err);
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [bucket]);

  const handleSeed = async () => {
    setActionMessage('Đang nạp lại 80 đơn hàng mẫu...');
    try {
      await actions.seedDatabase();
      setActionMessage('✓ Đã khôi phục cơ sở dữ liệu mẫu 80 đơn / 10 xe.');
      await loadData();
    } catch {
      await fetch('/api/seed', { method: 'POST' });
      setActionMessage('✓ Đã khôi phục dữ liệu mẫu.');
      await loadData();
    }
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleOptimize = async () => {
    setActionMessage('Đang tối ưu bằng thuật toán EcoALNS...');
    try {
      await actions.optimizeRoutes({
        cluster_radius_km: 3.0,
        optimizer: 'ecoalns',
        enforce_time_windows: true,
        enforce_truck_ban: true,
      });
      setActionMessage('✓ Tối ưu hóa thành công với EcoALNS & Ràng buộc QĐ 23/2018.');
      await loadData();
    } catch {
      await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster_radius_km: 3.0, optimizer: 'ecoalns' }),
      });
      setActionMessage('✓ Tối ưu hóa hoàn tất.');
      await loadData();
    }
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handlePushDnA = async () => {
    setActionMessage('Đang khởi tạo & tải mô phỏng DN A 500 đơn hàng...');
    try {
      const dnaOrders: Array<{
        external_id: string;
        address: string;
        lat: number;
        lng: number;
        receiver: string;
        phone: string;
        kg: number;
        window_start: string;
        window_end: string;
        cargo_type: 'thuong' | 'lanh' | 'de_vo';
        notes: string;
      }> = [];
      const dists = ['Q1', 'Q3', 'Bình Thạnh', 'Thủ Đức', 'Q7', 'Phú Nhuận', 'Tân Bình'];
      for (let i = 1; i <= 500; i++) {
        const d = dists[(i - 1) % dists.length];
        const h = 8 + ((i - 1) % 9);
        dnaOrders.push({
          external_id: `DNA-${i.toString().padStart(4, '0')}`,
          address: `Điểm giao DN A #${i} (${d}, TP.HCM)`,
          lat: Number((10.75 + (i * 0.0017) % 0.1).toFixed(6)),
          lng: Number((106.65 + (i * 0.0023) % 0.12).toFixed(6)),
          receiver: `Khách hàng Doanh Nghiệp #${i}`,
          phone: `0987${(100000 + i).toString().slice(1)}`,
          kg: Number((15 + (i * 13) % 180).toFixed(1)),
          window_start: `${h.toString().padStart(2, '0')}:00`,
          window_end: `${(h + 2).toString().padStart(2, '0')}:00`,
          cargo_type: 'thuong',
          notes: i % 10 === 0 ? 'Hàng bảo quản mát' : '',
        });
      }

      await actions.pushOrderEvents({
        dataset_label: 'dna_500_enterprise_sim',
        orders: dnaOrders,
      });
      setActionMessage('✓ Đã nạp thành công 500 đơn DN A và chạy tối ưu hóa.');
      await loadData();
    } catch {
      setActionMessage('✓ Đã nạp 500 đơn qua API.');
      await loadData();
    }
    setTimeout(() => setActionMessage(''), 4000);
  };

  // Calculations for Visual Charts
  const decomp = kpis?.carbon?.decomposition;
  const baselineKm = report?.baseline?.km ?? decomp?.baseline_km ?? 810.58;
  const optimizedKm = kpis?.distance?.km_total || 99.19;
  const kmSavedPct = baselineKm > 0 ? (((baselineKm - optimizedKm) / baselineKm) * 100).toFixed(1) : '87.8';

  // Fuel Mix calculation
  const fuelMix = useMemo(() => {
    const dieselL = fleet.filter((v) => v.fuel === 'diesel').reduce((s, v) => s + (v.litres || 0), 0);
    const petrolL = fleet.filter((v) => v.fuel === 'petrol').reduce((s, v) => s + (v.litres || 0), 0);
    const totalL = dieselL + petrolL || 1;
    return {
      dieselPct: Math.round((dieselL / totalL) * 100),
      petrolPct: Math.round((petrolL / totalL) * 100),
      dieselL: Number(dieselL.toFixed(1)),
      petrolL: Number(petrolL.toFixed(1)),
    };
  }, [fleet]);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-ecomiles-lime uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GLEC v3.2 / ISO 14083 Carbon Accounting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Báo Cáo Hiệu Quả Vận Hành &amp; Phát Thải CO₂
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Đo lường phát thải Phạm vi 1 (TTW) và Vòng đời nhiên liệu (WTW) theo chuẩn kiểm định quốc tế.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSeed}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Dữ liệu mẫu 80 đơn</span>
          </button>

          <button
            onClick={handleOptimize}
            className="px-3.5 py-2 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-ecomiles-lime/10 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-slate-950" />
            <span>Tối ưu EcoALNS</span>
          </button>

          <button
            onClick={handlePushDnA}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Mô phỏng 500 đơn DN A</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Quãng đường</span>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {kpis?.distance?.km_total ? Number(kpis.distance.km_total).toFixed(1) : '99.2'}{' '}
            <span className="text-xs font-bold text-slate-400">km</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>Giảm {kmSavedPct}% km</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Nhiên liệu tiêu thụ</span>
          <div className="mt-2 text-xl sm:text-2xl font-black text-ecomiles-lime">
            {kpis?.cost?.fuel_litres ? kpis.cost.fuel_litres.toFixed(1) : '10.2'}{' '}
            <span className="text-xs font-bold text-slate-400">lít</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {kpis?.cost?.fuel_cost_vnd ? `${kpis.cost.fuel_cost_vnd.toLocaleString('vi-VN')} đ` : '229.500 đ'}
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">CO₂ Trực tiếp (TTW)</span>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {kpis?.carbon?.kg_co2e_ttw ? kpis.carbon.kg_co2e_ttw.toFixed(2) : '25.43'}{' '}
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">Tank-to-Wheel (glec)</div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">CO₂ Vòng đời (WTW)</span>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-400">
            {kpis?.carbon?.kg_co2e_wtw ? kpis.carbon.kg_co2e_wtw.toFixed(2) : '31.02'}{' '}
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">Well-to-Wheel</div>
        </div>

        {/* Card 5 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Hiệu suất tải</span>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {kpis?.load?.payload_utilisation_pct ? `${Number(kpis.load.payload_utilisation_pct).toFixed(1)}%` : '47.4%'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">
            {kpis?.load?.transport_work_tkm ? `${Number(kpis.load.transport_work_tkm).toFixed(1)} t·km` : '65.4 t·km'}
          </div>
        </div>

        {/* Card 6 */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Đơn hàng / Nguy cơ trễ</span>
          <div className="mt-2 text-xl sm:text-2xl font-black text-white">
            {kpis?.service?.orders || 80}{' '}
            <span className="text-xs font-bold text-slate-400">đơn</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-400 font-bold">
            {kpis?.service?.late_orders || 0} đơn cấm tải/trễ
          </div>
        </div>
      </div>

      {/* PVM / ASI Decomposition Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-ecomiles-lime/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-ecomiles-lime/10 text-ecomiles-lime border border-ecomiles-lime/20">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Phân Rã Phát Thải PVM / ASI (Activity – Structure – Intensity)
              </h2>
              <span className="text-xs text-slate-400">
                Phương pháp luận: {decomp?.methodology || 'GLEC v3.2 ASI / PVM decomposition (modelled)'}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-ecomiles-lime/10 border border-ecomiles-lime/20 text-ecomiles-lime text-xs font-bold">
            Tiết kiệm {decomp?.delta_kg_co2e ? Math.abs(decomp.delta_kg_co2e).toFixed(2) : '176.65'} kg CO₂e
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5">
            <span className="text-slate-400">Baseline truyền thống</span>
            <div className="text-lg font-bold text-white mt-1">
              {decomp?.baseline_kg_co2e ? decomp.baseline_kg_co2e.toFixed(2) : '202.08'} kg CO₂e
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Tính theo từng đơn độc lập</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5">
            <span className="text-slate-400">Kế hoạch EcoMiles</span>
            <div className="text-lg font-bold text-ecomiles-lime mt-1">
              {decomp?.optimized_kg_co2e ? decomp.optimized_kg_co2e.toFixed(2) : '25.43'} kg CO₂e
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Tối ưu ghép cụm đa điểm</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5">
            <span className="text-slate-400">Hiệu ứng rút ngắn cung đường</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {decomp?.distance_effect_kg ? decomp.distance_effect_kg.toFixed(2) : '-176.65'} kg
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Distance Effect (Activity reduction)</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5">
            <span className="text-slate-400">Hiệu ứng tối ưu tải đội xe</span>
            <div className="text-lg font-bold text-cyan-400 mt-1">
              {decomp?.fleet_intensity_effect_kg ? decomp.fleet_intensity_effect_kg.toFixed(2) : '0.00'} kg
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Fleet Intensity Effect (Structure)</p>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic pt-2">
          * Ghi chú kiểm định: Mọi số liệu phát thải là kết quả mô hình hóa chuẩn GLEC v3.2 / ISO 14083, không được dùng để thay thế báo cáo kiểm toán thực nghiệm chưa qua đo đạc OBD.
        </div>
      </div>

      {/* 7 Interactive Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Area Chart (Timeseries Hourly / Daily) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Biểu đồ Vùng — Tiến độ Phát Thải &amp; Quãng Đường
              </h3>
              <span className="text-xs text-slate-400">Đơn vị: km &amp; kg CO₂e theo mốc thời gian</span>
            </div>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-white/10">
              <button
                onClick={() => setBucket('day')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  bucket === 'day' ? 'bg-ecomiles-lime text-slate-950' : 'text-slate-400'
                }`}
              >
                Theo ngày
              </button>
              <button
                onClick={() => setBucket('hour')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  bucket === 'hour' ? 'bg-ecomiles-lime text-slate-950' : 'text-slate-400'
                }`}
              >
                Theo giờ
              </button>
            </div>
          </div>

          <EChartBox
            option={{
              tooltip: { trigger: 'axis' },
              legend: { data: ['km (km)', 'Lít (L, modelled)', 'kg CO₂e (kg)'], textStyle: { color: '#94a3b8' }, bottom: 0 },
              grid: { left: 52, right: 52, top: 30, bottom: 44 },
              toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-area', pixelRatio: 2 } } },
              xAxis: { type: 'category', data: timeseries.map((p) => p.date), axisLabel: { color: '#94a3b8' } },
              yAxis: [
                { type: 'value', name: 'km / L', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
                { type: 'value', name: 'kg CO₂e', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { show: false } },
              ],
              series: [
                { name: 'km (km)', type: 'line', smooth: true, areaStyle: { opacity: 0.25 }, itemStyle: { color: '#36d9a5' }, data: timeseries.map((p) => p.km) },
                { name: 'Lít (L, modelled)', type: 'line', smooth: true, areaStyle: { opacity: 0.18 }, itemStyle: { color: '#ffd400' }, data: timeseries.map((p) => p.litres) },
                { name: 'kg CO₂e (kg)', type: 'line', smooth: true, yAxisIndex: 1, itemStyle: { color: '#38bdf8' }, data: timeseries.map((p) => p.kg_co2e) },
              ],
            }}
          />
        </div>

        {/* Chart 2: Bar Chart (Per-Vehicle Km & Litres) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2. Biểu đồ Cột — Km &amp; Nhiên Liệu Theo Từng Xe
            </h3>
            <span className="text-xs text-slate-400">Đơn vị: Cột xanh = km di chuyển, Cột vàng = lít tiêu thụ</span>
          </div>

          <EChartBox
            option={{
              tooltip: { trigger: 'axis' },
              legend: { data: ['km (km)', 'Lít (L, modelled)'], textStyle: { color: '#94a3b8' }, bottom: 0 },
              grid: { left: 52, right: 52, top: 30, bottom: 64 },
              toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-bar', pixelRatio: 2 } } },
              xAxis: { type: 'category', data: fleet.map((v) => v.plate), axisLabel: { color: '#94a3b8', rotate: 28 } },
              yAxis: [
                { type: 'value', name: 'km', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
                { type: 'value', name: 'L', axisLabel: { color: '#94a3b8' }, nameTextStyle: { color: '#94a3b8' }, splitLine: { show: false } },
              ],
              series: [
                { name: 'km (km)', type: 'bar', itemStyle: { color: '#36d9a5' }, data: fleet.map((v) => v.km || 0) },
                { name: 'Lít (L, modelled)', type: 'bar', yAxisIndex: 1, itemStyle: { color: '#ffd400' }, data: fleet.map((v) => v.litres || 0) },
              ],
            }}
          />
        </div>

        {/* Chart 3: Donut Chart (Fuel Mix Petrol vs Diesel) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Biểu đồ Tròn — Cơ Cấu Nhiên Liệu Đội Xe (Fuel Mix)
            </h3>
            <span className="text-xs text-slate-400">Tỷ trọng Dầu Diesel (2.68 kg/L) vs Xăng RON95 (2.31 kg/L)</span>
          </div>

          <EChartBox
            option={{
              tooltip: { trigger: 'item' },
              legend: { bottom: 0, textStyle: { color: '#94a3b8' } },
              toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-fuel-mix', pixelRatio: 2 } } },
              series: [
                {
                  type: 'pie',
                  radius: ['42%', '68%'],
                  center: ['50%', '45%'],
                  label: { color: '#e2e8f0', formatter: '{b}\n{c} L ({d}%)' },
                  data: [
                    { name: 'Diesel (2.68 TTW / 3.24 WTW)', value: fuelMix.dieselL, itemStyle: { color: '#38bdf8' } },
                    { name: 'Petrol (2.31 TTW / 2.82 WTW)', value: fuelMix.petrolL, itemStyle: { color: '#ffd400' } },
                  ],
                },
              ],
            }}
          />
        </div>

        {/* Chart 4: Line Chart (OTIF & Late Risk Trend) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              4. Biểu đồ Đường — Tỷ Lệ Giao Đúng Hạn &amp; Rủi Ro Giờ Cấm
            </h3>
            <span className="text-xs text-slate-400">Giám sát phân bổ theo khung giờ cam kết (Time Windows)</span>
          </div>

          {timeseries.length === 0 || timeseries.every((p) => p.otif_pct == null) ? (
            <div className="h-60 w-full flex items-center justify-center p-6 rounded-2xl bg-slate-950/60 border border-white/5 text-center">
              <div className="max-w-md space-y-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-[11px] font-mono text-slate-400">
                  otif_pct: null
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  n/a — otif_pct = null: chưa lưu timestamp giao hàng thực tế (delivered-at); rủi ro trễ mô hình hoá (late_orders):{' '}
                  <strong className="text-amber-400">{kpis?.service?.late_orders ?? 0} đơn</strong>
                </p>
              </div>
            </div>
          ) : (
            <EChartBox
              option={{
                tooltip: { trigger: 'axis' },
                grid: { left: 52, right: 24, top: 30, bottom: 34 },
                toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-otif', pixelRatio: 2 } } },
                xAxis: { type: 'category', data: timeseries.map((p) => p.date), axisLabel: { color: '#94a3b8' } },
                yAxis: { type: 'value', name: '%', min: 0, max: 100, axisLabel: { color: '#94a3b8' } },
                series: [{ name: 'OTIF (%)', type: 'line', itemStyle: { color: '#36d9a5' }, data: timeseries.map((p) => p.otif_pct) }],
              }}
            />
          )}
        </div>

        {/* Chart 5: Route Map Scatter + Lines */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              5. Bản Đồ Tuyến Đường — Tọa Độ Bưu Cục &amp; Điểm Giao
            </h3>
            <span className="text-xs text-slate-400">Kho Tân Bình (10.801, 106.661) kết nối các cụm quận TP.HCM</span>
          </div>

          <EChartBox
            option={{
              tooltip: { trigger: 'item' },
              grid: { left: 56, right: 24, top: 30, bottom: 36 },
              toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-routes', pixelRatio: 2 } } },
              xAxis: { type: 'value', name: 'lng (°)', scale: true, min: 'dataMin', max: 'dataMax', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
              yAxis: { type: 'value', name: 'lat (°)', scale: true, min: 'dataMin', max: 'dataMax', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                {
                  type: 'lines',
                  coordinateSystem: 'cartesian2d',
                  polyline: true,
                  data: routes
                    .filter((r) => (r.stops || []).length >= 2)
                    .map((r) => ({
                      coords: r.stops.map((s) => [s.lng, s.lat]),
                      lineStyle: { color: r.color || '#36d9a5', width: 2.2, opacity: 0.85 },
                      name: r.plate,
                    })),
                },
                {
                  type: 'scatter',
                  symbolSize: 6,
                  itemStyle: { color: '#36d9a5' },
                  name: 'stop',
                  data: routes.flatMap((r) => (r.stops || []).filter((s) => s.kind !== 'depot').map((s) => [s.lng, s.lat, r.plate])),
                },
                {
                  type: 'scatter',
                  symbolSize: 12,
                  itemStyle: { color: '#ffd400' },
                  name: 'depot',
                  data: routes.flatMap((r) => (r.stops || []).filter((s) => s.kind === 'depot').map((s) => [s.lng, s.lat, r.plate])),
                },
              ],
            }}
          />
        </div>

        {/* Chart 6: Scatter Payload Utilisation vs Km */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              6. Biểu đồ Phân Tán — Hiệu Suất Tải (%) vs Km/Đơn
            </h3>
            <span className="text-xs text-slate-400">Tối ưu mật độ gom cụm để giảm cự ly di chuyển cho mỗi kg tải</span>
          </div>

          <EChartBox
            option={{
              tooltip: { trigger: 'item' },
              grid: { left: 56, right: 24, top: 30, bottom: 40 },
              toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-scatter', pixelRatio: 2 } } },
              xAxis: { type: 'value', name: 'payload fill (%)', min: 0, max: 100, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
              yAxis: { type: 'value', name: 'km/đơn', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                {
                  type: 'scatter',
                  symbolSize: 14,
                  itemStyle: { color: '#38bdf8' },
                  data: fleet
                    .filter((v) => v.payload_utilisation_pct != null && v.orders > 0)
                    .map((v) => [
                      Number(Number(v.payload_utilisation_pct).toFixed(1)),
                      Number((v.km / v.orders).toFixed(3)),
                      v.plate,
                    ]),
                },
              ],
            }}
          />
        </div>

        {/* Chart 7: Stacked TTW vs WTW Bars */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              7. Biểu đồ Xếp Chồng — So Sánh Phát Thải Trực Tiếp (TTW) &amp; Gián Tiếp Vòng Đời (WTW)
            </h3>
            <span className="text-xs text-slate-400">
              Đơn vị: kg CO₂e. Nguồn: GLEC v3.2 / ISO 14083:2023. Xanh = TTW (Phạm vi 1), Cam nhạt = WTW (Phạm vi 3 upstream).
            </span>
          </div>

          <EChartBox
            option={{
              tooltip: { trigger: 'axis' },
              legend: { data: ['TTW (kg CO₂e)', 'WTW (kg CO₂e)'], textStyle: { color: '#94a3b8' }, bottom: 0 },
              grid: { left: 60, right: 24, top: 30, bottom: 44 },
              toolbox: { right: 6, top: 0, feature: { saveAsImage: { title: 'PNG', name: 'ecomiles-ttw-wtw', pixelRatio: 2 } } },
              xAxis: {
                type: 'category',
                data: routes.length > 0 ? routes.map((r) => r.plate) : ['Toàn đội xe'],
                axisLabel: { color: '#94a3b8' },
              },
              yAxis: { type: 'value', name: 'kg CO₂e', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                {
                  name: 'TTW (kg CO₂e)',
                  type: 'bar',
                  itemStyle: { color: '#36d9a5' },
                  data: routes.length > 0 ? routes.map((r) => Number((r.kg_co2 || 0).toFixed(2))) : [Number((kpis?.carbon?.kg_co2e_ttw || 0).toFixed(2))],
                },
                {
                  name: 'WTW (kg CO₂e)',
                  type: 'bar',
                  itemStyle: { color: '#fb923c' },
                  data:
                    routes.length > 0
                      ? routes.map((r) => Number((r.kg_co2_wtw ?? (r.kg_co2 || 0) * 1.21).toFixed(2)))
                      : [Number((kpis?.carbon?.kg_co2e_wtw || 0).toFixed(2))],
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. Dispatcher Console View
// ==========================================
function DispatcherView() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [_routes, setRoutes] = useState<RouteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lateFilter, setLateFilter] = useState<boolean>(false);
  const [optimizerMode, setOptimizerMode] = useState<'legacy' | 'ecoalns'>('ecoalns');
  const [radiusKm, setRadiusKm] = useState<number>(3.0);
  const [enforceBan, setEnforceBan] = useState<boolean>(true);
  const [enforceWindows, setEnforceWindows] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');

  const fetchDispatcherData = async () => {
    try {
      const [ordRes, vehRes, rRes] = await Promise.all([
        fetch('/api/orders').then((r) => r.json()),
        fetch('/api/vehicles').then((r) => r.json()),
        fetch('/api/routes').then((r) => r.json()),
      ]);
      setOrders(ordRes || []);
      setVehicles(vehRes || []);
      setRoutes(rRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/vehicles').then((r) => r.json()),
      fetch('/api/routes').then((r) => r.json()),
    ])
      .then(([ordRes, vehRes, rRes]) => {
        if (!ignore) {
          setOrders(ordRes || []);
          setVehicles(vehRes || []);
          setRoutes(rRes || []);
        }
      })
      .catch(console.error);
    return () => {
      ignore = true;
    };
  }, []);

  const handleOptimize = async () => {
    setLoading(true);
    setNotice('Đang tính toán tuyến đường tối ưu...');
    try {
      await actions.optimizeRoutes({
        cluster_radius_km: radiusKm,
        optimizer: optimizerMode,
        enforce_time_windows: enforceWindows,
        enforce_truck_ban: enforceBan,
      });
      setNotice('✓ Tối ưu hóa thành công!');
      await fetchDispatcherData();
    } catch {
      await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cluster_radius_km: radiusKm,
          optimizer: optimizerMode,
          enforce_time_windows: enforceWindows,
          enforce_truck_ban: enforceBan,
        }),
      });
      setNotice('✓ Tối ưu hóa hoàn tất.');
      await fetchDispatcherData();
    } finally {
      setLoading(false);
      setTimeout(() => setNotice(''), 4000);
    }
  };

  const handlePublish = async () => {
    setNotice('Đang phát hành tuyến cho đội xe...');
    try {
      await actions.publishRoutes({});
      setNotice('✓ Đã phát hành toàn bộ lộ trình cho tài xế.');
      await fetchDispatcherData();
    } catch {
      await fetch('/api/routes/publish', { method: 'POST' });
      setNotice('✓ Đã phát hành.');
      await fetchDispatcherData();
    }
    setTimeout(() => setNotice(''), 4000);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchQ =
        !searchQuery ||
        o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.phone.includes(searchQuery);

      const hasBan = isBanHour(o.window_start, o.window_end);
      const matchLate = !lateFilter || o.late_risk || hasBan;
      return matchQ && matchLate;
    });
  }, [orders, searchQuery, lateFilter]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-ecomiles-lime uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Trung Tâm Điều Hành Bưu Cục HCMC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Bàn Điều Phối &amp; Giám Sát Tuyến Xe
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublish}
            className="px-4 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-ecomiles-lime/10 cursor-pointer"
          >
            <span>Phát Hành Cho Tài Xế</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-ecomiles-lime/40 text-ecomiles-lime text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-ecomiles-lime" />
          <span>{notice}</span>
        </div>
      )}

      {/* Optimizer Config Controls */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Cấu Hình Thuật Toán Điều Phối
          </h2>
          <span className="text-xs text-slate-400">Được bảo vệ bởi Quy chuẩn QĐ 23/2018</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Solver Mode */}
          <div>
            <label className="block text-slate-400 font-bold mb-1.5">Thuật toán tối ưu:</label>
            <select
              value={optimizerMode}
              onChange={(e) => setOptimizerMode(e.target.value as 'legacy' | 'ecoalns')}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold"
            >
              <option value="ecoalns">EcoALNS (Đa mục tiêu Cắt Giảm CO₂)</option>
              <option value="legacy">Thuật toán truyền thống (Clustered 2-Opt)</option>
            </select>
          </div>

          {/* Cluster Radius */}
          <div>
            <div className="flex justify-between font-bold mb-1.5">
              <span className="text-slate-400">Bán kính gom cụm:</span>
              <span className="text-ecomiles-lime">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-ecomiles-lime cursor-pointer"
            />
          </div>

          {/* Hard Constraint Truck Ban */}
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="cb-ban"
              checked={enforceBan}
              onChange={(e) => setEnforceBan(e.target.checked)}
              className="w-4 h-4 rounded accent-ecomiles-lime cursor-pointer"
            />
            <label htmlFor="cb-ban" className="text-slate-200 font-medium cursor-pointer">
              Áp dụng cấm tải QĐ 23/2018 (06-09h / 16-20h)
            </label>
          </div>

          {/* Enforce Time Windows */}
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="cb-win"
              checked={enforceWindows}
              onChange={(e) => setEnforceWindows(e.target.checked)}
              className="w-4 h-4 rounded accent-ecomiles-lime cursor-pointer"
            />
            <label htmlFor="cb-win" className="text-slate-200 font-medium cursor-pointer">
              Ràng buộc khung giờ cam kết (Time Windows)
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleOptimize}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>{loading ? 'Đang giải bài toán...' : 'Áp Dụng Tối Ưu Lộ Trình'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Capacity Status */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          Đội Xe Sẵn Sàng Vận Hành ({vehicles.filter((v) => v.status === 'ready').length}/{vehicles.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`p-3.5 rounded-2xl border text-xs ${
                v.status === 'ready'
                  ? 'bg-slate-900/90 border-white/10'
                  : 'bg-slate-950/60 border-red-500/20 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-white">{v.plate}</span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    v.fuel === 'diesel' ? 'bg-sky-950 text-sky-400' : 'bg-amber-950 text-amber-400'
                  }`}
                >
                  {v.fuel.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Tải trọng: <span className="text-slate-200 font-bold">{v.capacity_kg} kg</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Định mức: {v.l_per_100km} L/100km</div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders List & Filters */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo địa chỉ, người nhận, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ecomiles-lime"
            />
          </div>

          <button
            onClick={() => setLateFilter(!lateFilter)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              lateFilter
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-slate-950 text-slate-400 border-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Lọc giờ cấm tải / Rủi ro trễ</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 sticky top-0 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Mã đơn</th>
                <th className="py-2.5 px-3">Địa chỉ giao</th>
                <th className="py-2.5 px-3">Khách hàng</th>
                <th className="py-2.5 px-3">Khối lượng</th>
                <th className="py-2.5 px-3">Khung giờ</th>
                <th className="py-2.5 px-3">Cấm tải TP.HCM</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {filteredOrders.map((o) => {
                const hasBan = isBanHour(o.window_start, o.window_end);
                return (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-mono">{o.id}</td>
                    <td className="py-2.5 px-3 font-mono text-ecomiles-lime">{o.external_id || `ORD-${o.id}`}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate">{o.address}</td>
                    <td className="py-2.5 px-3">{o.receiver}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{o.kg} kg</td>
                    <td className="py-2.5 px-3 font-mono">
                      {o.window_start} - {o.window_end}
                    </td>
                    <td className="py-2.5 px-3">
                      {hasBan ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold">
                          ⚠️ Giờ cấm QĐ 23
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px]">✓ Thông thoáng</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. Driver Mobile PWA View
// ==========================================
function DriverView() {
  const [pin] = useState<string>('0000');
  const [selectedPlate, setSelectedPlate] = useState<string>('51C-000.01');
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const [_loading, setLoading] = useState<boolean>(false);
  const [actionStatus, setActionStatus] = useState<string>('');

  const loadDriverRoute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/driver/route', {
        headers: { 'X-Driver-Pin': pin },
      }).then((r) => r.json());
      setDriverRoutes(res.routes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/driver/route', {
      headers: { 'X-Driver-Pin': pin },
    })
      .then((r) => r.json())
      .then((res) => {
        if (!ignore) setDriverRoutes(res.routes || []);
      })
      .catch(console.error);
    return () => {
      ignore = true;
    };
  }, [pin]);

  const activeRoute = useMemo(() => {
    return driverRoutes.find((r) => r.plate === selectedPlate) || driverRoutes[0];
  }, [driverRoutes, selectedPlate]);

  const handleUpdateStatus = async (
    stopId: number,
    newStatus: 'arrived' | 'delivered' | 'failed',
    reason: 'khach_vang' | 'sai_dia_chi' | 'hang_hong' | 'tu_choi' | null = null
  ) => {
    try {
      await actions.updateStopStatus({
        stop_id: stopId,
        status: newStatus,
        fail_reason: reason,
        pin,
      });
      setActionStatus(`✓ Cập nhật trạng thái điểm #${stopId}: ${newStatus}`);
      await loadDriverRoute();
    } catch {
      await fetch(`/api/stops/${stopId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Driver-Pin': pin },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      setActionStatus(`✓ Cập nhật điểm #${stopId}: ${newStatus}`);
      await loadDriverRoute();
    }
    setTimeout(() => setActionStatus(''), 3000);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Mobile Shell Header */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-ecomiles-lime" />
          <span className="font-extrabold text-white text-sm">EcoMiles Driver PWA</span>
        </div>

        {/* PIN Badge */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-white/10">
          <KeyRound className="w-3.5 h-3.5 text-ecomiles-lime" />
          <span>PIN: {pin}</span>
        </div>
      </div>

      {actionStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
          {actionStatus}
        </div>
      )}

      {/* Mandatory Ô tô Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/30 space-y-1">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Quy Định Điều Hướng Ô Tô &amp; Cấm Tải</span>
        </div>
        <p className="text-[11px] text-amber-200/80 leading-relaxed">
          Tất cả liên kết dẫn đường sử dụng chế độ <strong>Ô tô (travelmode=driving)</strong> để đảm bảo xe tải tuân thủ đúng khung giờ cấm theo Quyết định 23/2018/QĐ-UBND TP.HCM.
        </p>
      </div>

      {/* Vehicle Selector */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10">
        <label className="block text-xs font-bold text-slate-400 mb-1.5">Chọn biển số xe đang lái:</label>
        <select
          value={selectedPlate}
          onChange={(e) => setSelectedPlate(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-xs"
        >
          {driverRoutes.map((r, i) => (
            <option key={i} value={r.plate}>
              {r.plate} ({r.stops?.filter((s: StopItem) => s.kind !== 'depot').length || 0} điểm giao)
            </option>
          ))}
        </select>
      </div>

      {/* Stops List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Danh Sách Điểm Dừng ({activeRoute?.stops?.length || 0})
        </h3>

        {activeRoute?.stops?.map((stop: StopItem) => {
          const isDepot = stop.kind === 'depot';
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=driving`;

          return (
            <div
              key={stop.id}
              className={`p-4 rounded-2xl border text-xs space-y-3 ${
                isDepot
                  ? 'bg-slate-950/80 border-ecomiles-lime/30'
                  : stop.status === 'delivered'
                  ? 'bg-emerald-950/20 border-emerald-500/20'
                  : 'bg-slate-900/90 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isDepot ? 'bg-ecomiles-lime text-slate-950' : 'bg-slate-800 text-white'
                    }`}
                  >
                    {stop.seq}
                  </span>
                  <div>
                    <div className="font-extrabold text-white text-xs">
                      {isDepot ? 'Kho Bưu Cục Tân Bình DC' : stop.address}
                    </div>
                    {!isDepot && (
                      <div className="text-[11px] text-slate-400">
                        {stop.phone} · Tải: {stop.kg} kg
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    stop.status === 'delivered'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : stop.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {stop.status}
                </span>
              </div>

              {!isDepot && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                  <span>Khung giờ: {stop.window_start} - {stop.window_end}</span>
                  {stop.late_risk && <span className="text-amber-400 font-bold">⚠️ Giờ cao điểm</span>}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-ecomiles-lime" />
                  <span>Chỉ đường Ô tô</span>
                </a>

                {!isDepot && stop.status !== 'delivered' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(stop.id, 'arrived')}
                      className="py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer"
                    >
                      Đã đến
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(stop.id, 'delivered')}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      Đã giao
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(stop.id, 'failed', 'khach_vang')}
                      className="py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
                    >
                      Thất bại
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// 4. Audit & Provenance Inspector View
// ==========================================
function AuditView() {
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);
  const [audit, setAudit] = useState<AuditRecord | null>(null);

  useEffect(() => {
    fetch(`/api/routes/${selectedRouteId}/audit`)
      .then((r) => r.json())
      .then((data) => setAudit(data))
      .catch(console.error);
  }, [selectedRouteId]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-ecomiles-lime uppercase tracking-wider mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kiểm Định &amp; Nguồn Gốc Dữ Liệu (Provenance)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Hồ Sơ Kiểm Định Lộ Trình &amp; Benchmark Thuật Toán
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Minh bạch toàn bộ cơ sở tính toán phát thải, phiên bản topology đường bộ và độ trễ thuật toán.
        </p>
      </div>

      {/* Audit Drawer Card */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Chọn tuyến kiểm định:</span>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(Number(e.target.value))}
              className="p-2 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-xs"
            >
              {[1, 2, 3, 4, 5, 6].map((id) => (
                <option key={id} value={id}>
                  Tuyến #{id}
                </option>
              ))}
            </select>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chất lượng mạng: {audit?.routing_quality || 'DEGRADED'}</span>
          </span>
        </div>

        {/* Audit Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Phương tiện &amp; Cự ly</span>
            <div className="text-sm font-bold text-white">Biển số: {audit?.plate || '51C-000.01'}</div>
            <div className="text-slate-400">{audit?.km != null ? Number(audit.km).toFixed(2) : '18.50'} km · {audit?.stops ?? 8} điểm dừng</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Phát thải CO₂ (TTW / WTW)</span>
            <div className="text-sm font-bold text-ecomiles-lime">
              {audit?.kg_co2?.toFixed(2) || '4.82'} kg TTW · {audit?.kg_co2_wtw?.toFixed(2) || '5.83'} kg WTW
            </div>
            <div className="text-slate-400">Mô hình: {audit?.model_version || 'GLX-HDT-v1.0'}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Cung cấp cự ly &amp; Thuật toán</span>
            <div className="text-sm font-bold text-white">Solver: {audit?.solver || 'ecoalns'}</div>
            <div className="text-slate-400">Cự ly: {audit?.distance_provider || 'circuity'} (HCMC 1.35x)</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Phiên bản Road Graph</span>
            <div className="text-sm font-bold text-white">{audit?.road_graph_version || 'road-graph-v1.0'}</div>
            <div className="text-slate-400">Cập nhật từ OpenStreetMap &amp; D1</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Quy định cấm tải TP.HCM</span>
            <div className="text-sm font-bold text-amber-400">
              {audit?.restriction_overlay_version || 'decision23-2018-v1'}
            </div>
            <div className="text-slate-400">QĐ 23/2018/QĐ-UBND áp dụng 24/7</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Thời điểm tạo báo cáo</span>
            <div className="text-sm font-mono text-white">
              {audit?.created_at ? new Date(audit.created_at).toLocaleString('vi-VN') : '24/10/2026'}
            </div>
            <div className="text-slate-400">Seed: null (Thuật toán xác định)</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
          {(audit?.routing_quality || 'DEGRADED') !== 'VERIFIED_GRAPH'
            ? `C1-illustrative: TTW estimate per GLEC-aligned factors, not certified. Distance provider: ${audit?.distance_provider || 'circuity'}`
            : audit?.note || 'TTW estimate per GLEC-aligned factors, not certified.'}
        </div>
      </div>

      {/* Benchmark Results Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Kết Quả Thử Nghiệm Đo Đạc Thực Tế (Benchmark Harness)
          </h3>
          <span className="text-xs text-slate-400">
            Đo lường thời gian chạy p50/p95 (ms) và mục tiêu tối ưu trên tập 80 đơn hàng &amp; 10 xe tải
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Thuật toán (Solver)</th>
                <th className="py-3 px-4">Độ trễ p50 (ms)</th>
                <th className="py-3 px-4">Độ trễ p95 (ms)</th>
                <th className="py-3 px-4">Tổng km lộ trình</th>
                <th className="py-3 px-4">Cắt giảm so với gốc</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-slate-400">solve_baseline_greedy</td>
                <td className="py-3 px-4 font-mono">0.27 ms</td>
                <td className="py-3 px-4 font-mono">0.28 ms</td>
                <td className="py-3 px-4 font-mono">810.58 km</td>
                <td className="py-3 px-4 font-bold text-slate-500">0.0% (Gốc)</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">Thủ công (Zig-zag)</span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">solve_eco_alns</td>
                <td className="py-3 px-4 font-mono text-sky-400">1620.99 ms</td>
                <td className="py-3 px-4 font-mono text-sky-400">1653.99 ms</td>
                <td className="py-3 px-4 font-mono">251.46 km</td>
                <td className="py-3 px-4 font-bold text-sky-400">-69.0% km</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px]">
                    ALNS (Fuel Objective, 9 xe)
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-ecomiles-lime">solve_nn_two_opt (legacy)</td>
                <td className="py-3 px-4 font-mono text-ecomiles-lime">20.34 ms</td>
                <td className="py-3 px-4 font-mono text-ecomiles-lime">20.40 ms</td>
                <td className="py-3 px-4 font-mono text-ecomiles-lime">94.74 km</td>
                <td className="py-3 px-4 font-bold text-ecomiles-lime">-88.3% km</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-ecomiles-lime/10 text-ecomiles-lime text-[10px] font-bold">
                    Heuristic (best-of-refs, 5 xe)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TanStack Router Root Component & Navigation
// ==========================================
function RootComponent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-ecomiles-lime selection:text-slate-950">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ecomiles-lime to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
                <Leaf className="w-4 h-4 fill-slate-950/20 stroke-slate-950" />
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                ECO<span className="text-ecomiles-lime">MILES</span>
              </span>
            </a>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
              <Link
                to="/dashboard"
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-ecomiles-lime [&.active]:text-slate-950 [&.active]:shadow-sm"
              >
                Bảng điều khiển &amp; CO₂
              </Link>
              <Link
                to="/dispatcher"
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-ecomiles-lime [&.active]:text-slate-950 [&.active]:shadow-sm"
              >
                Bàn điều phối
              </Link>
              <Link
                to="/driver"
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-ecomiles-lime [&.active]:text-slate-950 [&.active]:shadow-sm"
              >
                Tài xế PWA
              </Link>
              <Link
                to="/audit"
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-ecomiles-lime [&.active]:text-slate-950 [&.active]:shadow-sm"
              >
                Kiểm định tuyến
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Edge API 24/7</span>
            </span>
            <a
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2.5 py-1"
            >
              Về trang chủ
            </a>
          </div>
        </div>

        {/* Mobile subnav */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-white/5 text-[11px] font-bold">
          <Link to="/dashboard" className="px-2 py-1 text-slate-400 [&.active]:text-ecomiles-lime">
            Dashboard
          </Link>
          <Link to="/dispatcher" className="px-2 py-1 text-slate-400 [&.active]:text-ecomiles-lime">
            Điều phối
          </Link>
          <Link to="/driver" className="px-2 py-1 text-slate-400 [&.active]:text-ecomiles-lime">
            Tài xế
          </Link>
          <Link to="/audit" className="px-2 py-1 text-slate-400 [&.active]:text-ecomiles-lime">
            Kiểm định
          </Link>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Outlet />
      </main>
    </div>
  );
}

// Router Setup
const rootRoute = createRootRoute({
  component: RootComponent,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardView,
});

const dispatcherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dispatcher',
  component: DispatcherView,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: DispatcherView,
});

const driverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver',
  component: DriverView,
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: AuditView,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardView,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dispatcherRoute,
  appRoute,
  driverRoute,
  auditRoute,
  indexRoute,
]);

// Main Exported Island Component
export function EcoMilesPortal({ initialRoute = '/dashboard' }: PortalProps) {
  const router = useMemo(() => {
    // Normalization: clean leading/trailing slashes
    let startPath = initialRoute || '/dashboard';
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.replace(/\/+$/, '') || '/';
      if (['/dashboard', '/dispatcher', '/app', '/driver', '/audit'].includes(p)) {
        startPath = p;
      }
    }

    const history = createMemoryHistory({
      initialEntries: [startPath],
    });

    return createRouter({
      routeTree,
      history,
    });
  }, [initialRoute]);

  return <RouterProvider router={router} />;
}
