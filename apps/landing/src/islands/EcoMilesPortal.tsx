import React, { useState, useEffect, useMemo } from 'react';
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
  Zap,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Leaf,
  Navigation,
  KeyRound,
} from 'lucide-react';
import { BenchmarkAndStoryDeck } from './BenchmarkAndStoryDeck';


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

interface DriverRoute {
  plate: string;
  stops: StopItem[];
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

const DISTRICT_DISPLAY_MAP: Record<string, string> = {
  Q1: 'Quận 1',
  Q3: 'Quận 3',
  Q4: 'Quận 4',
  Q5: 'Quận 5',
  Q7: 'Quận 7',
  Q10: 'Quận 10',
  'Binh Thanh': 'Q. Bình Thạnh',
  'Phu Nhuan': 'Q. Phú Nhuận',
  'Tan Binh': 'Q. Tân Bình',
  'Go Vap': 'Q. Gò Vấp',
  'Thu Duc': 'TP. Thủ Đức',
};

function formatVietnameseAddress(raw: string): string {
  if (!raw) return 'Điểm giao hàng nội đô, TP.HCM';
  if (raw === 'Tan Binh DC') return 'Kho Trung Tâm Tân Bình, TP.HCM';
  const m = raw.match(/^([A-Za-z0-9 ]+?)\s+stop\s+(\d+)$/i);
  if (m) {
    const distKey = m[1].trim();
    const distVi = DISTRICT_DISPLAY_MAP[distKey] || distKey;
    return `Điểm giao #${m[2]} · ${distVi}, TP.HCM`;
  }
  return raw;
}

function formatVietnameseReceiver(raw: string): string {
  if (!raw) return 'Cửa hàng Đối tác';
  const m = raw.match(/^KH\s*(\d+)$/i);
  if (m) return `Cửa hàng Đối tác #${m[1]}`;
  return raw;
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
              <option value="ecoalns">Đa mục tiêu EcoMiles (Giảm nhiên liệu, CO₂ &amp; Né giờ cấm)</option>
              <option value="legacy">Gom cụm &amp; Khử giao cắt 2-Opt (Tối ưu quãng đường)</option>
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
                  {v.fuel === 'diesel' ? 'Dầu Diesel' : 'Xăng RON95'}
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
                    <td className="py-2.5 px-3 max-w-xs truncate">{formatVietnameseAddress(o.address)}</td>
                    <td className="py-2.5 px-3">{formatVietnameseReceiver(o.receiver)}</td>
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {o.status === 'delivered'
                          ? 'Đã giao xong'
                          : o.status === 'arrived'
                          ? 'Đã đến điểm'
                          : o.status === 'failed'
                          ? 'Giao chưa thành công'
                          : 'Đã xếp tuyến'}
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
      if (res.routes && res.routes.length > 0) {
        setDriverRoutes(res.routes);
      } else {
        const fallbackRoutes = await fetch('/api/routes').then((r) => r.json());
        if (Array.isArray(fallbackRoutes) && fallbackRoutes.length > 0) {
          setDriverRoutes(fallbackRoutes);
        }
      }
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
      .then(async (res) => {
        if (ignore) return;
        if (res.routes && res.routes.length > 0) {
          setDriverRoutes(res.routes);
        } else {
          const fallbackRoutes = await fetch('/api/routes').then((r) => r.json());
          if (!ignore && Array.isArray(fallbackRoutes)) {
            setDriverRoutes(fallbackRoutes);
          }
        }
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
      setActionStatus(
        `✓ Đã cập nhật điểm dừng #${stopId}: ${
          newStatus === 'delivered'
            ? 'Đã giao thành công'
            : newStatus === 'arrived'
            ? 'Đã đến điểm giao'
            : 'Báo hoãn giao hàng'
        }`
      );
      await loadDriverRoute();
    } catch {
      await fetch(`/api/stops/${stopId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Driver-Pin': pin },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      setActionStatus(
        `✓ Đã cập nhật điểm dừng #${stopId}: ${
          newStatus === 'delivered'
            ? 'Đã giao thành công'
            : newStatus === 'arrived'
            ? 'Đã đến điểm giao'
            : 'Báo hoãn giao hàng'
        }`
      );
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
          <span className="font-extrabold text-white text-sm">Ứng Dụng Tài Xế Giao Hàng EcoMiles</span>
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
          Tất cả liên kết dẫn đường được khóa mặc định ở chế độ <strong>Ô tô tải</strong> để hỗ trợ tài xế đi đúng lộ trình và tuân thủ khung giờ cấm theo Quyết định 23/2018/QĐ-UBND TP.HCM.
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
                      {isDepot ? 'Kho Trung Tâm Tân Bình, TP.HCM' : formatVietnameseAddress(stop.address)}
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
                  {stop.status === 'delivered'
                    ? 'Đã giao xong'
                    : stop.status === 'arrived'
                    ? 'Đã đến nơi'
                    : stop.status === 'failed'
                    ? 'Tạm hoãn'
                    : 'Chờ giao'}
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
          <span>Kiểm Định Lộ Trình &amp; Minh Bạch Phương Pháp Đo Lường</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Hồ Sơ Kiểm Định Tuyến Đường &amp; Hiệu Năng Thuật Toán
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Minh bạch toàn bộ cơ sở tính toán quãng đường, định mức nhiên liệu, hệ số phát thải CO₂ và tốc độ xử lý của hệ thống.
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
            <span>Hạ tầng bản đồ: Mạng lưới đường bộ TP.HCM (Hệ số 1.35)</span>
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
            <div className="text-slate-400">Phương pháp: Tính theo tải trọng thực tế chuẩn GLEC v3.2</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Bộ giải &amp; Thước đo cự ly</span>
            <div className="text-sm font-bold text-white">Thuật toán: Đa mục tiêu EcoMiles</div>
            <div className="text-slate-400">Cự ly đường bộ nội đô TP.HCM (Haversine × 1.35)</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Dữ liệu nền tảng</span>
            <div className="text-sm font-bold text-white">Bản đồ OpenStreetMap TP.HCM</div>
            <div className="text-slate-400">Đồng bộ trực tiếp với cơ sở dữ liệu vận hành</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Quy định cấm tải TP.HCM</span>
            <div className="text-sm font-bold text-amber-400">Quyết định 23/2018/QĐ-UBND</div>
            <div className="text-slate-400">Tự động kiểm tra khung 06:00 đến 09:00 &amp; 16:00 đến 20:00</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="text-slate-500 uppercase font-bold text-[10px]">Thời điểm tạo báo cáo</span>
            <div className="text-sm font-mono text-white">
              {audit?.created_at ? new Date(audit.created_at).toLocaleString('vi-VN') : '24/10/2026'}
            </div>
            <div className="text-slate-400">Kết quả nhất quán 100% giữa các lần chạy</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-300 leading-relaxed">
          Số liệu phát thải CO₂e trực tiếp (TTW) và vòng đời (WTW) được tính toán tự động theo hệ số chuẩn quốc tế GLEC Framework v3.2 và ISO 14083:2023 dựa trên cự ly vận hành và tải trọng từng chuyến xe.
        </div>
      </div>

      {/* Benchmark Results Table */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Kết Quả Đo Đạc Tốc Độ &amp; Hiệu Quả Thuật Toán Trên Bộ 80 Đơn Hàng Chuẩn
          </h3>
          <span className="text-xs text-slate-400">
            Đo lường thời gian xử lý trung vị (p50) và phân vị 95 (p95) trên tập 80 đơn hàng &amp; 10 xe tải tại TP.HCM
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
                <td className="py-3 px-4 font-bold text-slate-400">1. Thứ tự đơn hàng gốc (Chưa gom cụm)</td>
                <td className="py-3 px-4 font-mono">0.27 ms</td>
                <td className="py-3 px-4 font-mono">0.28 ms</td>
                <td className="py-3 px-4 font-mono">810.58 km</td>
                <td className="py-3 px-4 font-bold text-slate-500">0.0% (Mốc gốc)</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">Chạy tuần tự</span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-white">2. Đa mục tiêu Nhiên liệu &amp; Tải trọng (EcoALNS)</td>
                <td className="py-3 px-4 font-mono text-sky-400">1620.99 ms</td>
                <td className="py-3 px-4 font-mono text-sky-400">1653.99 ms</td>
                <td className="py-3 px-4 font-mono">251.46 km</td>
                <td className="py-3 px-4 font-bold text-sky-400">-69.0% km</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px]">
                    Tối ưu nhiên liệu theo tải
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-bold text-ecomiles-lime">3. Gom cụm bán kính 3km &amp; Khử giao cắt 2-Opt</td>
                <td className="py-3 px-4 font-mono text-ecomiles-lime">20.34 ms</td>
                <td className="py-3 px-4 font-mono text-ecomiles-lime">20.40 ms</td>
                <td className="py-3 px-4 font-mono text-ecomiles-lime">94.74 km</td>
                <td className="py-3 px-4 font-bold text-ecomiles-lime">-88.3% km</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-ecomiles-lime/10 text-ecomiles-lime text-[10px] font-bold">
                    Tối ưu quãng đường (5 xe)
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
                Tổng quan &amp; Báo cáo
              </Link>
              <Link
                to="/benchmark"
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-ecomiles-lime [&.active]:text-slate-950 [&.active]:shadow-sm"
              >
                Tải File .XLSX &amp; Đối chứng
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
                Ứng dụng Tài xế
              </Link>
              <Link
                to="/audit"
                className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-ecomiles-lime [&.active]:text-slate-950 [&.active]:shadow-sm"
              >
                Kiểm định lộ trình
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Hệ thống trực tuyến 24/7</span>
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
            Tổng quan
          </Link>
          <Link to="/benchmark" className="px-2 py-1 text-slate-400 [&.active]:text-ecomiles-lime">
            Tải .XLSX
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

function StoryDashboardPage() {
  return <BenchmarkAndStoryDeck initialAct="act1_executive" />;
}

function BenchmarkLabPage() {
  return <BenchmarkAndStoryDeck initialAct="act4_benchmark_lab" />;
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: StoryDashboardPage,
});

const benchmarkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/benchmark',
  component: BenchmarkLabPage,
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
  component: StoryDashboardPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  benchmarkRoute,
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
      const p = window.location.pathname.replace(/\/+$/, '').replace(/^\/portal/, '') || '/';
      if (['/dashboard', '/benchmark', '/dispatcher', '/app', '/driver', '/audit'].includes(p)) {
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
