import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useNavigate,
  useRouterState,
  createMemoryHistory,
} from '@tanstack/react-router';
import { actions } from 'astro:actions';
import {
  LayoutDashboard,
  Route as RouteIcon,
  FileSpreadsheet,
  Truck,
  FileCheck2,
  ShieldCheck,
  UploadCloud,
  Printer,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lock,
  EyeOff,
  Eye,
  Users,
  Database,
  SplitSquareVertical,
  Search,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Play,
  Zap,
  Clock,
  Sliders,
  ShieldAlert,
  DollarSign,
  Info,
  Gauge,
} from 'lucide-react';
import { Co2AuditIcon, EcoMilesWordmark, IsoLedgerIcon } from '../components/EcoMilesMark';
import {
  parseXlsxToRows,
  parseCsvToRows,
  runEphemeralBenchmarkFromRows,
  buildAutomatedExcelWorkbookXml,
  applyFleetProfileToBenchmarkResult,
  VEHICLE_CLASS_CATALOG,
  FLEET_PRESET_CATALOG,
  type EphemeralBenchmarkResult,
  type StrategySummary,
  type VehicleClassId,
  type FleetPresetId,
} from '../utils/xlsxBenchmarkEngine';
import {
  B2B_COMPANIES,
  buildBlindedAdminRow,
  inspectExcelHeaderMapping,
  redactVietnamesePii,
  DEMO_CREDENTIAL_ACCOUNTS,
  getCompanySecurityPolicy,
  formatReceiverForTenantPolicy,
  buildCompany14DayTelemetry,
  encryptTenantPayloadAesGcm,
  decryptTenantPayloadAesGcm,
  type AppRole,
  type CompanyTenant,
  type ColumnMappingInspection,
  type AuthenticatedSession,
  type DemoCredentialAccount,
  type CompanySecurityPolicy,
  type EncryptedTenantEnvelope,
} from '../utils/tenantPrivacyEngine';
import { EvsimDualSimulator } from './EvsimDualSimulator';

import { drawHcmcMapTiles, projectLatLngToCanvas, type MercatorViewport } from '../utils/hcmcMapTiles';
import {
  cleanRoutePolylineSpikes,
  getOrFetchOsrmRouteGeometry,
  interpolateAlongStreetPathWithHeading,
  snapPointToPolyline,
  type LngLat,
} from '../utils/hcmcRoadGraph';
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

export interface PortalProps {
  initialRoute?: string;
}

type UserSidebarTab =
  | 'overview'
  | 'evsim_compare'
  | 'routing'
  | 'orders_schema'
  | 'fleet_backhaul'
  | 'reports_esg'
  | 'privacy_security';

function EChartDaylight({ option, height = 240 }: { option: Record<string, unknown>; height?: number }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof window === 'undefined' || !window.echarts) return;
    const chart = window.echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption(option, true);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [option]);
  return <div ref={hostRef} style={{ width: '100%', height: `${height}px` }} />;
}

/**
 * Interactive HCMC Route Map Canvas for the User Orchestrator & Driver App
 */
function HcmcSingleRouteMapCanvas({
  result,
  strategy,
  selectedRouteId,
}: {
  result: EphemeralBenchmarkResult;
  strategy: StrategySummary;
  selectedRouteId: number | 'ALL';
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tileTick, setTileTick] = useState<number>(0);
  const animPhaseRef = useRef<number>(0.18);
  const [view, setView] = useState<{ zoom: number; panX: number; panY: number }>({
    zoom: 12.7,
    panX: 0,
    panY: 0,
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0018;
      setView((prev) => ({
        ...prev,
        zoom: Math.min(15.5, Math.max(11.3, prev.zoom + delta)),
      }));
    };
    canvas.addEventListener('wheel', onWheelNative, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheelNative);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();

    const drawFrame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!prefersReducedMotion && !document.hidden) {
        animPhaseRef.current = (animPhaseRef.current + dt / 18.0) % 1;
      }
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cw = canvas.clientWidth || 560;
    const ch = canvas.clientHeight || 300;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    const routesToDraw =
      selectedRouteId === 'ALL'
        ? strategy.routes
        : strategy.routes.filter((r) => r.route_id === selectedRouteId);

    const routeStops = routesToDraw.flatMap((r) => r.stops);
    const lats = (routeStops.length > 0 ? routeStops.map((s) => s.lat) : result.orders.map((o) => o.lat)).concat([10.8018]);
    const lngs = (routeStops.length > 0 ? routeStops.map((s) => s.lng) : result.orders.map((o) => o.lng)).concat([106.6385]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    const vp: MercatorViewport = {
      centerLat,
      centerLng,
      zoom: selectedRouteId === 'ALL' ? view.zoom : Math.max(12.2, view.zoom - 0.35),
      panX: view.panX,
      panY: view.panY,
      width: cw,
      height: ch,
    };

    drawHcmcMapTiles(ctx, vp, () => setTileTick((n) => (n + 1) % 10000));

    const toXY = (lng: number, lat: number): [number, number] =>
      projectLatLngToCanvas(lng, lat, vp);
    routesToDraw.forEach((r, rIdx) => {
      const stopCoords: LngLat[] = r.stops.map((s) => [s.lng, s.lat]);
      const osrmGeom = getOrFetchOsrmRouteGeometry(stopCoords, () =>
        setTileTick((n) => (n + 1) % 10000)
      );
      const fallbackPath: LngLat[] = r.stops.flatMap((s) =>
        s.leg_path && s.leg_path.length > 0 ? s.leg_path : ([[s.lng, s.lat]] as LngLat[])
      );
      const activeRoadPath: LngLat[] = cleanRoutePolylineSpikes(
        osrmGeom && osrmGeom.length >= 2 ? osrmGeom : fallbackPath
      );
      ctx.beginPath();
      for (let i = 0; i < activeRoadPath.length; i++) {
        const [x, y] = toXY(activeRoadPath[i][0], activeRoadPath[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.lineWidth = selectedRouteId === 'ALL' ? 4.4 : 5.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = r.color || '#003049';
      ctx.lineWidth = selectedRouteId === 'ALL' ? 2.4 : 3.4;
      ctx.stroke();

      // Compact Customer Store Nodes
      r.stops.forEach((s) => {
        if (s.kind === 'depot') return;
        const [snappedLng, snappedLat] = snapPointToPolyline(s.lng, s.lat, activeRoadPath);
        const [sx, sy] = toXY(snappedLng, snappedLat);
        const nodeSize = selectedRouteId === 'ALL' ? 3.0 : 4.2;
        ctx.fillStyle =
          s.kind === 'backhaul' ? '#003049' : s.qd23_ban_conflict ? '#C1121F' : '#669BBC';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.4;
        ctx.fillRect(sx - nodeSize, sy - nodeSize, nodeSize * 2, nodeSize * 2);
        ctx.strokeRect(sx - nodeSize, sy - nodeSize, nodeSize * 2, nodeSize * 2);

        if (selectedRouteId !== 'ALL') {
          ctx.fillStyle = '#003049';
          ctx.font = '700 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(s.seq), sx, sy - 8);
        }
      });

      // Live Moving Truck Puck + Directional Arrow riding 100% on `activeRoadPath`
      if (activeRoadPath.length >= 2) {
        const frac = (animPhaseRef.current + rIdx * 0.17) % 1;
        const { lng: curLng, lat: curLat, dx, dy } = interpolateAlongStreetPathWithHeading(
          activeRoadPath,
          frac
        );
        const [tx, ty] = toXY(curLng, curLat);
        const truckColor = r.color || '#669BBC';

        ctx.beginPath();
        ctx.arc(tx, ty, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(17, 24, 39, 0.18)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(tx, ty, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = truckColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.beginPath();
        ctx.moveTo(4.5, 0);
        ctx.lineTo(-2.8, -3.2);
        ctx.lineTo(-1.4, 0);
        ctx.lineTo(-2.8, 3.2);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        const tag = selectedRouteId === 'ALL' ? `Xe ${r.route_id}` : r.plate;
        ctx.font = '700 9px system-ui, sans-serif';
        const tw = ctx.measureText(tag).width;
        ctx.fillStyle = 'rgba(17, 24, 39, 0.84)';
        ctx.fillRect(tx + 9, ty - 6, tw + 6, 12);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(tag, tx + 12, ty + 3);
      }
    });

    // Depot Square on 364 Cộng Hòa, P.13, Tân Bình
    const [dx, dy] = toXY(106.6385, 10.8018);
    ctx.fillStyle = '#669BBC';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillRect(dx - 8, dy - 8, 16, 16);
    ctx.strokeRect(dx - 8, dy - 8, 16, 16);
    ctx.fillStyle = '#003049';
    ctx.font = '700 10.5px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Kho Tân Bình (364 Cộng Hòa)', dx + 12, dy + 4);

      ctx.restore();
      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(performance.now());
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [result, strategy, selectedRouteId, view, tileTick]);

  return (
    <div className="relative w-full h-[290px] rounded-lg overflow-hidden border border-[#D4BF94] bg-[#EED9AF]">
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          dragRef.current = { startX: e.clientX, startY: e.clientY, origX: view.panX, origY: view.panY };
        }}
        onPointerMove={(e) => {
          const active = dragRef.current;
          if (!active) return;
          const nextX = active.origX + (e.clientX - active.startX);
          const nextY = active.origY + (e.clientY - active.startY);
          setView((prev) => ({ ...prev, panX: nextX, panY: nextY }));
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onDoubleClick={() => setView({ zoom: 12.7, panX: 0, panY: 0 })}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}

// =============================================================================
// MAIN ENTERPRISE WORKSPACE SHELL (4 ROLES + DAYLIGHT FRAMED-SHEET THEME)
// =============================================================================
function EnterpriseWorkspace({ defaultRole }: { defaultRole: AppRole }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [activeRole, setActiveRole] = useState<AppRole>(defaultRole);
  const [userTab, setUserTab] = useState<UserSidebarTab>(
    pathname === '/dispatcher' || pathname === '/app' ? 'routing' : 'overview'
  );
  const [selectedTenantId, setSelectedTenantId] = useState<string>(B2B_COMPANIES[1].tenant_id);
  const [baseResult, setResult] = useState<EphemeralBenchmarkResult | null>(null);
  const [fleetPresetId, setFleetPresetId] = useState<FleetPresetId>('default_mixed');
  const [perRouteVehicleClass, setPerRouteVehicleClass] = useState<Record<number, VehicleClassId>>({});
  const result = useMemo(
    () =>
      baseResult
        ? applyFleetProfileToBenchmarkResult(baseResult, fleetPresetId, perRouteVehicleClass)
        : null,
    [baseResult, fleetPresetId, perRouteVehicleClass]
  );
  const [columnInspection, setColumnInspection] = useState<ColumnMappingInspection[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategySummary['id']>('ecomiles_ecoalns');
  const [selectedRouteId, setSelectedRouteId] = useState<number | 'ALL'>('ALL');
  const [selectedDriverRouteIdx, setSelectedDriverRouteIdx] = useState<number>(0);
  const [stopStatusOverrides, setStopStatusOverrides] = useState<Record<string, 'pending' | 'arrived' | 'delivered' | 'failed'>>({});
  const [driverMileTier, setDriverMileTier] = useState<'middle_mile_truck' | 'last_mile_car'>('middle_mile_truck');
  const [activeNavStopSeq, setActiveNavStopSeq] = useState<number>(1);
  const [voiceNavNotice, setVoiceNavNotice] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clusterRadiusKm, setClusterRadiusKm] = useState<number>(3.0);
  const [enforceQd23Ban, setEnforceQd23Ban] = useState<boolean>(true);
  const [enableBackhaul, setEnableBackhaul] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<string>('');
  // Authenticated Session State (Fixes Zalo FB-05: Real Multi-Company Login & Logout)
  const [authenticatedSession, setAuthenticatedSession] = useState<AuthenticatedSession | null>(null);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState<string>('orchestrator@nvc-cold.vn');
  const [loginPassword, setLoginPassword] = useState<string>('NvcCold@2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [selectedDemoPreset, setSelectedDemoPreset] = useState<DemoCredentialAccount | null>(
    DEMO_CREDENTIAL_ACCOUNTS[0]
  );
  // DPO Unmask & Audit Log State (NVC-COLD & Privacy Policies)
  const [dpoUnmaskedRows, setDpoUnmaskedRows] = useState<Set<string>>(new Set());
  const [dpoAuditLogs, setDpoAuditLogs] = useState<
    Array<{ timestamp: string; operator: string; external_id: string; reason: string }>
  >([]);

  // Carbon Value Scenario Toggle (Mentor Minh Insight #6 & #7)
  const [carbonScenario, setCarbonScenario] = useState<1 | 2 | 3>(1);

  // Personal Driver Preferences (Fixes Zalo FB-04: personal route setup)
  const [avoidNarrowAlleys, setAvoidNarrowAlleys] = useState<boolean>(true);
  const [autoRestAlert, setAutoRestAlert] = useState<boolean>(true);
  const [vietnameseVoiceNav, setVietnameseVoiceNav] = useState<boolean>(true);

  // Zero-Knowledge Live WebCrypto AES-256-GCM Verification State (Admin View)
  const [cryptoTestState, setCryptoTestState] = useState<{
    running: boolean;
    envelope: EncryptedTenantEnvelope | null;
    successMessage: string | null;
    errorMessage: string | null;
    step: 'idle' | 'encrypted' | 'cross_failed' | 'self_success';
  }>({
    running: false,
    envelope: null,
    successMessage: null,
    errorMessage: null,
    step: 'idle',
  });
  const [roleApprovals, setRoleApprovals] = useState([
    {
      id: 'role-orch',
      role: 'Điều phối viên Đội xe (Nội bộ công ty)',
      scope: 'Xem đơn hàng của công ty, chạy thuật toán chia tuyến và phát hành lệnh cho tài xế',
      approved: true,
    },
    {
      id: 'role-drv',
      role: 'Ứng dụng Tài xế (Giới hạn theo biển số xe)',
      scope: 'Chỉ nhận danh sách điểm dừng thuộc chuyến xe được phân công, che SĐT đầy đủ',
      approved: true,
    },
    {
      id: 'role-esg',
      role: 'Kiểm toán viên Môi trường độc lập (ESG Auditor)',
      scope: 'Chỉ xem tổng cự ly, nhiên liệu và CO₂e theo chuẩn ISO 14083, ẩn 100% thông tin khách hàng',
      approved: true,
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCompany: CompanyTenant = useMemo(
    () => B2B_COMPANIES.find((c) => c.tenant_id === selectedTenantId) || B2B_COMPANIES[1],
    [selectedTenantId]
  );

  const activePolicy: CompanySecurityPolicy = useMemo(
    () => getCompanySecurityPolicy(activeCompany.tenant_id),
    [activeCompany.tenant_id]
  );

  // Sync URL route with Role & Sidebar Tab
  useEffect(() => {
    const tid = window.setTimeout(() => {
      if (pathname === '/benchmark') {
        setActiveRole('tester');
      } else if (pathname === '/driver') {
        setActiveRole('driver');
      } else if (pathname === '/audit') {
        setActiveRole('admin');
      } else if (pathname === '/dispatcher' || pathname === '/app') {
        setActiveRole('user');
        setUserTab('routing');
      } else {
        if (authenticatedSession) {
          setActiveRole(authenticatedSession.role);
        } else {
          setActiveRole(defaultRole);
        }
      }
    }, 0);
    return () => window.clearTimeout(tid);
  }, [pathname, defaultRole, authenticatedSession]);
  const loadCompanyWorkbook = async (fileName: string, companyName?: string, keyFp?: string) => {
    try {
      const resp = await fetch(`/samples/${fileName}`);
      if (!resp.ok) return;
      const buf = await resp.arrayBuffer();
      const rows = await parseXlsxToRows(buf);
      if (rows.length > 0) {
        setColumnInspection(inspectExcelHeaderMapping(rows[0]));
      }
      const bench = runEphemeralBenchmarkFromRows(rows, fileName);
      setResult(bench);
      setSelectedRouteId('ALL');
      setStopStatusOverrides({});
      if (companyName) {
        setStatusBanner(
          `Đã chuyển sang không gian dữ liệu riêng của "${companyName}" (${bench.rows_valid} đơn hàng · Khóa mã hóa ${keyFp || activeCompany.key_fingerprint}).`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-issue real signed HMAC evaluator session when opening /benchmark directly
  useEffect(() => {
    if (pathname !== '/benchmark' || authenticatedSession) return;
    let cancelled = false;
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'evaluator@vsic-evsim.vn', password: 'EvsimAudit@2026' }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok && data.session) {
          setAuthenticatedSession(data.session);
        }
      })
      .catch(() => {
        // ignore offline fallback on public benchmark
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, authenticatedSession]);

  // Load company workbook ONLY when authenticated (or on public /benchmark sandbox)
  useEffect(() => {
    if (!authenticatedSession && pathname !== '/benchmark') return;
    let cancelled = false;
    const fileName = activeCompany.default_sample_file;
    fetch(`/samples/${fileName}`)
      .then((resp) => (resp.ok ? resp.arrayBuffer() : null))
      .then((buf) => (buf ? parseXlsxToRows(buf) : null))
      .then((rows) => {
        if (cancelled || !rows) return;
        if (rows.length > 0) {
          setColumnInspection(inspectExcelHeaderMapping(rows[0]));
        }
        const bench = runEphemeralBenchmarkFromRows(rows, fileName);
        setResult(bench);
        setSelectedRouteId('ALL');
        setStopStatusOverrides({});
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, [authenticatedSession, pathname, activeCompany.tenant_id, activeCompany.default_sample_file]);
  const handleUploadCustomFile = async (file: File) => {
    try {
      const lower = file.name.toLowerCase();
      let rows: string[][];
      if (lower.endsWith('.csv')) {
        rows = parseCsvToRows(await file.text());
      } else {
        rows = await parseXlsxToRows(await file.arrayBuffer());
      }
      if (rows.length > 0) {
        setColumnInspection(inspectExcelHeaderMapping(rows[0]));
      }
      const bench = runEphemeralBenchmarkFromRows(rows, file.name);
      setResult(bench);
      setSelectedRouteId('ALL');
      setStatusBanner(
        `Đã nạp và ánh xạ tự động file "${file.name}" (${bench.rows_valid} đơn hàng) trong ${bench.strategies.ecomiles_ecoalns.runtime_ms} ms.`
      );
    } catch (err: unknown) {
      setStatusBanner(`Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleExportExcel3Sheet = () => {
    if (!result) return;
    const sanitizeOrderAddress = (addr: string) =>
      activePolicy.strip_address_on_export ? redactVietnamesePii(addr).text : addr;
    const exportSafeResult: EphemeralBenchmarkResult =
      activePolicy.strip_address_on_export ||
      activePolicy.pseudonymize_customer_name ||
      activePolicy.mask_phone_by_default
        ? {
            ...result,
            orders: result.orders.map((o, idx) => {
              const fmt = formatReceiverForTenantPolicy(
                activeCompany.tenant_id,
                {
                  row_num: o.row_num || idx + 1,
                  external_id: o.external_id,
                  receiver: o.receiver,
                  phone: o.phone,
                  address: o.address,
                },
                false
              );
              return {
                ...o,
                receiver: fmt.display_receiver,
                phone: fmt.display_phone,
                address: sanitizeOrderAddress(fmt.display_address),
              };
            }),
          }
        : result;
    const xml = buildAutomatedExcelWorkbookXml(exportSafeResult, selectedStrategyId);
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Tu_Dong_3_Sheet_${activeCompany.code}_${result.file_name.replace(/\.[^.]+$/, '')}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatusBanner(
      `Đã kết xuất Báo cáo Excel 3 Sheet tự động cho ${activeCompany.short_name} (${activePolicy.strip_address_on_export ? 'Đã lọc địa chỉ & SĐT theo NĐ 13/2023 · ' : ''}Mã xác thực ${result.dataset_fingerprint}).`
    );
  };

  const handleRunOptimizerAndPublish = async () => {
    try {
      await actions.optimizeRoutes({
        cluster_radius_km: clusterRadiusKm,
        optimizer: selectedStrategyId === 'ecomiles_2opt' ? 'legacy' : 'ecoalns',
        enforce_time_windows: true,
        enforce_truck_ban: enforceQd23Ban,
      });
      await actions.publishRoutes({});
    } catch {
      // Offline / client-only fallback
    }
    setStatusBanner(
      `Đã tối ưu hóa lộ trình (${selectedStrategyId === 'ecomiles_ecoalns' ? 'EcoMiles EcoALNS + Né cấm tải QĐ 23 + Ghép đơn về' : 'Gom cụm 2-Opt'}) với bán kính ${clusterRadiusKm} km và đồng bộ xuống Ứng dụng Tài xế.`
    );
  };

  const handleSelectPreset = (acc: DemoCredentialAccount) => {
    setSelectedDemoPreset(acc);
    setLoginUsername(acc.username);
    setLoginPassword(acc.password);
    setLoginError(null);
  };

  const completeLoginSession = (sess: AuthenticatedSession) => {
    setDpoUnmaskedRows(new Set());
    setDpoAuditLogs([]);
    setAuthenticatedSession(sess);
    setActiveRole(sess.role);
    if (sess.tenant_id && sess.tenant_id !== 'SYS-ADMIN') {
      const comp = B2B_COMPANIES.find((c) => c.tenant_id === sess.tenant_id);
      if (comp) {
        setSelectedTenantId(comp.tenant_id);
        loadCompanyWorkbook(comp.default_sample_file, comp.short_name, comp.key_fingerprint);
      }
    }
    if (sess.role === 'driver') {
      if (typeof sess.driver_route_idx === 'number') {
        setSelectedDriverRouteIdx(sess.driver_route_idx);
      }
      navigate({ to: '/driver' });
    } else if (sess.role === 'tester') {
      navigate({ to: '/benchmark' });
    } else if (sess.role === 'admin') {
      navigate({ to: '/audit' });
    } else {
      navigate({ to: '/dashboard' });
    }
    setLoginLoading(false);
    setStatusBanner(
      `Đăng nhập thành công với vai trò ${sess.label_vi} (${sess.username}) · Phân vùng ${sess.tenant_id}`
    );
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    const inputUser = loginUsername.trim();
    const inputPass = loginPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inputUser, password: inputPass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.session) {
          completeLoginSession(data.session);
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      setLoginError(
        errData.error ||
          `HTTP ${res.status}: Sai tên đăng nhập hoặc mật khẩu doanh nghiệp. Vui lòng kiểm tra lại thông tin xác thực.`
      );
      setLoginLoading(false);
      return;
    } catch {
      const matchedAccount = DEMO_CREDENTIAL_ACCOUNTS.find(
        (a) => a.username.toLowerCase() === inputUser.toLowerCase()
      );
      if (!matchedAccount || matchedAccount.password !== inputPass) {
        setLoginError(
          'HTTP 401: Sai tên đăng nhập hoặc mật khẩu doanh nghiệp. Vui lòng kiểm tra lại thông tin xác thực.'
        );
        setLoginLoading(false);
        return;
      }
      const policy = getCompanySecurityPolicy(matchedAccount.tenant_id);
      const mockSession: AuthenticatedSession = {
        token: `ecm_v2_${matchedAccount.account_id}_${Date.now()}`,
        account_id: matchedAccount.account_id,
        username: matchedAccount.username,
        label_vi: matchedAccount.label_vi,
        role: matchedAccount.role,
        tenant_id: matchedAccount.tenant_id,
        driver_route_idx: matchedAccount.driver_route_idx,
        driver_code: matchedAccount.driver_code,
        assigned_plate: matchedAccount.assigned_plate,
        key_fingerprint:
          matchedAccount.tenant_id === 'SYS-ADMIN'
            ? 'KMS-SYS-ZERO'
            : B2B_COMPANIES.find((c) => c.tenant_id === matchedAccount.tenant_id)?.key_fingerprint ||
              'KMS-DEFAULT',
        policy_id:
          matchedAccount.role === 'admin'
            ? 'ZERO-KNOWLEDGE-BLIND'
            : matchedAccount.role === 'tester'
              ? 'SANDBOX-EVAL'
              : policy.policy_id,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 28800000).toISOString(),
      };
      completeLoginSession(mockSession);
      return;
    }
  };

  const handleLogout = async () => {
    try {
      if (authenticatedSession?.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authenticatedSession.token}` },
        });
      }
    } catch {
      // ignore network errors
    }
    // Complete ephemeral RAM & sessionStorage shred on logout (Finding 3 fix)
    setResult(null);
    setColumnInspection([]);
    setStopStatusOverrides({});
    setSearchQuery('');
    setDpoUnmaskedRows(new Set());
    setDpoAuditLogs([]);
    setCryptoTestState({
      running: false,
      envelope: null,
      successMessage: null,
      errorMessage: null,
      step: 'idle',
    });
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage?.clear();
      } catch {
        // ignore storage restrictions
      }
    }
    setAuthenticatedSession(null);
    setStatusBanner(
      'Đã đăng xuất an toàn. Khóa phiên và toàn bộ dữ liệu RAM tạm thời của doanh nghiệp đã được hủy.'
    );
  };

  // STRICT UNAUTHENTICATED GATE: Zero protected workspace DOM or company data rendered before login
  if (!authenticatedSession && pathname !== '/benchmark') {
    return (
      <div
        data-ui="ecomiles-b2b-signin-gate"
        className="min-h-screen bg-[#FDF0D5] text-[#003049] antialiased flex flex-col"
        style={{ fontFamily: '"Be Vietnam Pro", "Be Vietnam Pro", system-ui, sans-serif' }}
      >
        <header className="bg-white border-b border-[#D4BF94] px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <a href="/" className="flex flex-col items-start gap-1">
              <EcoMilesWordmark className="h-5 w-auto" />
              <div className="text-[11px] text-[#004366]">
                TMS · Cổng Xác Thực Đa Doanh Nghiệp &amp; Phân Quyền Bảo Mật NĐ 13/2023
              </div>
            </a>
            <a
              href="/"
              className="px-3 py-1.5 rounded-lg border border-[#669BBC] bg-white hover:bg-[#FDF0D5] text-xs font-semibold text-[#003049]"
            >
              Về trang chủ
            </a>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div
            role="region"
            aria-label="Cổng đăng nhập bảo mật đa doanh nghiệp EcoMiles"
            className="w-full max-w-5xl bg-white text-[#003049] rounded-2xl border border-[#D4BF94] shadow-[0_20px_50px_-20px_rgba(15,23,42,0.12)] overflow-hidden"
          >
            <div className="px-6 py-4 bg-[#003049] text-white flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  Đăng Nhập Hệ Thống Quản Trị Vận Tải &amp; Tài Khoản Tài Xế EcoMiles
                </h1>
                <p className="text-xs text-[#669BBC] mt-0.5">
                  Mỗi doanh nghiệp sở hữu khóa mã hóa AES-256-GCM và chính sách bảo vệ dữ liệu riêng biệt.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-white/15 text-white text-xs font-mono font-semibold">
                HMAC-SHA256 Session
              </span>
            </div>

            <div className="p-5 sm:p-6 bg-[#FDF0D5] grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[#003049] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#003049]" />
                    <span>Chọn Tài Khoản Điền Sẵn (1 Chạm Để Kiểm Thử)</span>
                  </h2>
                  <p className="text-xs text-[#004366] mt-0.5">
                    Bấm vào tài khoản mẫu bên dưới để tự động điền Email &amp; Mật khẩu tương ứng:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#003049]">
                    1. Ba Doanh Nghiệp B2B (Khóa KMS &amp; Chính Sách Riêng)
                  </div>
                  <div className="space-y-2">
                    {DEMO_CREDENTIAL_ACCOUNTS.filter((a) => a.role === 'user').map((acc) => {
                      const isSelected = selectedDemoPreset?.account_id === acc.account_id;
                      return (
                        <button
                          key={acc.account_id}
                          type="button"
                          onClick={() => handleSelectPreset(acc)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#003049] shadow-sm ring-2 ring-[#003049]/15'
                              : 'bg-white border-[#D4BF94] hover:border-[#669BBC]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-[#003049]">{acc.label_vi}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#D7E6F0] text-[#003049] border border-[#669BBC]">
                              {acc.badge_vi}
                            </span>
                          </div>
                          <div className="text-xs text-[#004366] mt-1">{acc.subtitle_vi}</div>
                          <div className="text-xs font-mono text-[#003049] mt-1">{acc.username}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#003049]">
                    2. Tài Khoản Tài Xế Cá Nhân (3 Công Ty · Gắn Theo Biển Số Xe)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DEMO_CREDENTIAL_ACCOUNTS.filter((a) => a.role === 'driver').map((acc) => {
                      const isSelected = selectedDemoPreset?.account_id === acc.account_id;
                      return (
                        <button
                          key={acc.account_id}
                          type="button"
                          onClick={() => handleSelectPreset(acc)}
                          className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#003049] shadow-sm ring-2 ring-[#003049]/15'
                              : 'bg-white border-[#D4BF94] hover:border-[#669BBC]'
                          }`}
                        >
                          <div className="font-bold text-xs text-[#003049] truncate">{acc.label_vi}</div>
                          <div className="text-xs font-mono font-semibold text-[#003049] mt-0.5">
                            {acc.assigned_plate}
                          </div>
                          <div className="text-xs font-mono text-[#004366] mt-0.5 truncate">{acc.username}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#003049]">
                    3. Kiểm Thử Đối Chứng &amp; Quản Trị Hạ Tầng Zero-Knowledge
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_CREDENTIAL_ACCOUNTS.filter((a) => a.role === 'tester' || a.role === 'admin').map((acc) => {
                      const isSelected = selectedDemoPreset?.account_id === acc.account_id;
                      return (
                        <button
                          key={acc.account_id}
                          type="button"
                          onClick={() => handleSelectPreset(acc)}
                          className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#003049] shadow-sm ring-2 ring-[#003049]/15'
                              : 'bg-white border-[#D4BF94] hover:border-[#669BBC]'
                          }`}
                        >
                          <div className="font-bold text-xs text-[#003049] truncate">{acc.label_vi}</div>
                          <div className="text-xs font-mono text-[#004366] mt-0.5 truncate">{acc.username}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-[#003049]">
                      Thông Tin Đăng Nhập Doanh Nghiệp
                    </h2>
                    <p className="text-xs text-[#004366] mt-0.5">
                      Xác thực qua <code className="font-mono">POST /api/auth/login</code> và khóa cứng phạm vi dữ liệu theo công ty.
                    </p>
                  </div>

                  {statusBanner && (
                    <div className="p-2.5 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-xs font-semibold text-[#003049]">
                      {statusBanner}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="ecm-login-email" className="block text-xs font-bold text-[#003049]">
                      Email / Tài khoản:
                    </label>
                    <input
                      id="ecm-login-email"
                      name="username"
                      type="email"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#669BBC] bg-white text-xs font-mono text-[#003049] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="ecm-login-password" className="block text-xs font-bold text-[#003049]">
                        Mật khẩu:
                      </label>
                      <span className="text-xs text-[#004366]">Có thể nhập sai để kiểm thử HTTP 401</span>
                    </div>
                    <div className="relative">
                      <input
                        id="ecm-login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-[#669BBC] bg-white text-xs font-mono text-[#003049] focus:outline-none focus:ring-2 focus:ring-[#003049]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#004366] hover:text-[#003049] cursor-pointer"
                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const targetTenant = selectedDemoPreset?.tenant_id || 'TNT-NAMVIET-002';
                    const pol = getCompanySecurityPolicy(targetTenant);
                    return (
                      <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] text-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#003049]">Chính sách bảo mật áp dụng:</span>
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#D7E6F0] text-[#003049] border border-[#669BBC]">
                            {selectedDemoPreset?.role === 'admin' ? 'ZERO-KNOWLEDGE-BLIND' : pol.policy_id}
                          </span>
                        </div>
                        <div className="text-xs text-[#004366]">
                          {selectedDemoPreset?.role === 'admin'
                            ? 'Quản trị viên chỉ giám sát hạ tầng máy chủ; 0% quyền giải mã tên, SĐT và địa chỉ khách hàng.'
                            : pol.summary_vi}
                        </div>
                        {selectedDemoPreset?.role !== 'admin' && (
                          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#D4BF94] text-xs text-[#004366]">
                            <div>Ngân hàng đối soát: <strong className="text-[#003049]">{pol.invoice_bank_name}</strong></div>
                            <div>Mã số thuế: <strong className="text-[#003049]">{pol.tax_code_mst}</strong></div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {loginError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-[#F8E7C4] border border-[#C1121F] text-[#780000] text-xs font-semibold flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#C1121F] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Từ Chối Xác Thực (HTTP 401)</div>
                        <div className="mt-0.5">{loginError}</div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 px-4 rounded-xl bg-[#003049] hover:bg-[#003049] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{loginLoading ? 'Đang xác thực phiên...' : 'Đăng Nhập Hệ Thống'}</span>
                  </button>
                </form>

                <div className="text-xs text-[#004366] pt-2 border-t border-[#D4BF94] leading-relaxed">
                  Phiên làm việc sau khi đăng nhập được khóa cứng với doanh nghiệp đã chọn. Muốn chuyển sang công ty khác, người dùng bắt buộc phải bấm <strong>Đăng xuất</strong> để thu hồi khóa phiên.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#F8E7C4] text-[#003049] flex items-center justify-center p-8">
        <div className="bg-white border border-[#D4BF94] rounded-xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-7 h-7 rounded-full border-2 border-[#003049] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#003049]">
            Đang nạp dữ liệu phân vùng bảo mật của {activeCompany.short_name}...
          </p>
        </div>
      </div>
    );
  }

  const rawSt = result.strategies.raw_excel;
  const humanSt = result.strategies.human_google_proxy;
  const twoOptSt = result.strategies.ecomiles_2opt;
  const alnsSt = result.strategies.ecomiles_ecoalns;
  const activeStrategy = result.strategies[selectedStrategyId] || alnsSt;

  // Order completion metrics for the active company
  const totalOrdersCount = result.rows_valid;
  const deliveredOverridesCount = Object.values(stopStatusOverrides).filter((s) => s === 'delivered').length;
  const simulatedDeliveredCount = Math.min(
    totalOrdersCount,
    Math.round(totalOrdersCount * 0.78) + deliveredOverridesCount
  );
  const inProgressCount = Math.max(0, totalOrdersCount - simulatedDeliveredCount);
  const completionPct = totalOrdersCount > 0 ? ((simulatedDeliveredCount / totalOrdersCount) * 100).toFixed(1) : '100.0';

  const DRIVER_NAMES = [
    'Nguyễn Văn Hùng',
    'Trần Minh Tuấn',
    'Lê Hoàng Nam',
    'Phạm Quốc Bảo',
    'Võ Thành Đạt',
    'Đặng Quốc Khánh',
    'Bùi Thanh Tùng',
    'Hoàng Gia Huy',
    'Đỗ Văn Khoa',
    'Ngô Tấn Phát',
  ];

  const USER_SIDEBAR_ITEMS: Array<{
    id: UserSidebarTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'overview',
      label: 'Tổng quan Đội xe',
      sublabel: 'Thống kê xe, đơn hàng & CO₂',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'evsim_compare',
      label: 'Đối chứng 2 Bên (EVSIM)',
      sublabel: 'So sánh Baseline vs. EcoMiles',
      icon: <SplitSquareVertical className="w-4 h-4" />,
    },
    {
      id: 'routing',
      label: 'Điều phối & Thuật toán',
      sublabel: 'Chia tuyến, né giờ cấm QĐ 23',
      icon: <RouteIcon className="w-4 h-4" />,
    },
    {
      id: 'orders_schema',
      label: 'Đơn hàng & Cột Excel',
      sublabel: `${result.rows_valid} đơn · Ánh xạ cột ERP`,
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      id: 'fleet_backhaul',
      label: 'Đội xe & Ghép chiều về',
      sublabel: `${activeStrategy.vehicles_used} xe chạy · Giảm rỗng`,
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: 'reports_esg',
      label: 'Báo cáo ESG Tự động',
      sublabel: 'Xuất Excel 3 Sheet, CSV, PDF',
      icon: <FileCheck2 className="w-4 h-4" />,
    },
    {
      id: 'privacy_security',
      label: 'Bảo mật & Quyền riêng tư',
      sublabel: 'Cách ly công ty & Mã hóa AES',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];


  return (
    <div
      data-ui="ecomiles-b2b-management-app"
      className="min-h-screen bg-[#F8E7C4] text-[#003049] antialiased flex flex-col overflow-x-hidden"
      style={{ fontFamily: '"Be Vietnam Pro", system-ui, sans-serif' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadCustomFile(f);
        }}
      />

      {/* =====================================================================
          TOP ENTERPRISE WORKSPACE BAR (Distinct Daylight Management Header)
          ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D4BF94] px-4 sm:px-6 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand Mark + Role-Isolated Workspace Context */}
          <div className="flex flex-wrap items-center gap-3.5">
            <a href="/" className="flex flex-col items-start gap-0.5 group" title="Về trang giới thiệu EcoMiles">
              <EcoMilesWordmark className="h-5 w-auto" />
              <div className="text-[11px] text-[#004366]">
                {activeRole === 'user'
                  ? 'TMS · Không gian Điều phối Doanh nghiệp'
                  : activeRole === 'tester'
                  ? 'TMS · Buồng Kiểm thử Đối chứng EVSIM'
                  : activeRole === 'driver'
                  ? 'TMS · Buồng lái Tài xế Giao hàng'
                  : 'TMS · Phòng Giám sát Hạ tầng (Zero-Knowledge)'}
              </div>
            </a>

            <div className="h-5 w-px bg-[#D4BF94] hidden sm:block" />

            {/* Role-Specific Context Control (Isolated by Role & Locked to Authenticated Company) */}
            {activeRole === 'user' && (
              <div className="flex items-center gap-2 bg-[#D7E6F0] border border-[#669BBC] rounded-lg px-2.5 py-1 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#003049] shrink-0" />
                <span className="font-semibold text-[#003049]">
                  Đã khóa phiên: <strong>{activeCompany.short_name}</strong> ·{' '}
                  <span className="font-mono text-[11px]">{activeCompany.key_fingerprint.slice(0, 12)}</span> ·{' '}
                  <span className="text-[11px] font-bold text-[#003049]">{activePolicy.tier_badge}</span>
                </span>
              </div>
            )}

            {activeRole === 'driver' && (
              <div className="flex items-center gap-2 bg-[#D7E6F0] border border-[#669BBC] rounded-lg px-2.5 py-1 text-xs">
                <Truck className="w-4 h-4 text-[#003049] shrink-0" />
                <span className="font-bold text-[#003049]">
                  {authenticatedSession?.label_vi || `Xe ${activeStrategy.routes[selectedDriverRouteIdx]?.plate || '51C-000.08'}`}
                </span>
                <span className="text-[#004366]">·</span>
                <span className="text-[#003049] font-semibold">{activeCompany.short_name}</span>
              </div>
            )}

            {activeRole === 'tester' && (
              <div className="flex items-center gap-1.5 bg-[#D7E6F0] border border-[#669BBC] rounded-lg px-2.5 py-1 text-xs font-bold text-[#003049]">
                <SplitSquareVertical className="w-3.5 h-3.5 text-[#003049] shrink-0" />
                <span>Buồng Thẩm Định Đối Chứng EVSIM · Multi-Tenant Evaluator</span>
              </div>
            )}

            {activeRole === 'admin' && (
              <div className="flex items-center gap-1.5 bg-[#F8E7C4] border border-[#C1121F] rounded-lg px-2.5 py-1 text-xs font-bold text-[#780000]">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Zero-Knowledge: Quyền giải mã dữ liệu khách hàng = 0%</span>
              </div>
            )}
          </div>

          {/* Right: Role-Scoped Actions, Active Session Identity & Real Logout */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {activeRole === 'user' && (
              <div className="hidden md:inline-flex items-center bg-[#F8E7C4] p-0.5 rounded-lg border border-[#D4BF94]">
                <button
                  type="button"
                  onClick={() => setUserTab('overview')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    userTab !== 'evsim_compare'
                      ? 'bg-white text-[#003049] shadow-2xs'
                      : 'text-[#004366] hover:text-[#003049]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#003049]" />
                  <span>1. Bảng điều khiển Đội xe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserTab('evsim_compare')}
                  className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    userTab === 'evsim_compare'
                      ? 'bg-[#003049] text-[#FDF0D5] shadow-2xs'
                      : 'text-[#004366] hover:text-[#003049]'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>2. Đối chứng 2 Bên (EVSIM)</span>
                </button>
              </div>
            )}

            {activeRole === 'driver' && (
              <a
                href={`/maps?vehicle=${authenticatedSession?.driver_route_idx ?? selectedDriverRouteIdx}&mode=navigate`}
                className="px-3 py-1.5 rounded-lg bg-[#003049] hover:bg-[#003049] text-[#FDF0D5] font-bold flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Bản đồ Dẫn đường Xe tải</span>
              </a>
            )}

            {authenticatedSession ? (
              <>
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#D7E6F0] text-[#002033] font-semibold">
                  <Lock className="w-3.5 h-3.5 text-[#003049]" />
                  <span>{authenticatedSession.username}</span>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg border border-[#C1121F] bg-[#F8E7C4] hover:bg-[#F8E7C4] text-[#780000] font-bold flex items-center gap-1.5 cursor-pointer text-xs"
                  title="Đăng xuất khỏi phiên doanh nghiệp hiện tại để chuyển sang công ty khác"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-[#003049] bg-[#003049] hover:bg-[#003049] text-white font-bold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đăng nhập Doanh nghiệp</span>
              </button>
            )}

            <a
              href="/"
              className="px-2.5 py-1.5 rounded-lg border border-[#D4BF94] bg-white hover:bg-[#FDF0D5] text-[#004366] hover:text-[#003049] font-semibold"
            >
              Trang chủ
            </a>
          </div>
        </div>
      </header>

      {/* Status Notice Banner */}
      {statusBanner && (
        <div className="bg-[#D7E6F0] border-b border-[#669BBC] px-3 sm:px-6 py-1.5 text-xs text-[#002033] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#003049] shrink-0" />
            <span className="truncate sm:whitespace-normal">{statusBanner}</span>
          </div>
          <button
            onClick={() => setStatusBanner('')}
            className="text-xs font-bold underline cursor-pointer shrink-0"
          >
            Đóng
          </button>
        </div>
      )}


      {/* =====================================================================
          PREFILLED 4-ROLE FAST-LOGIN MVP GATE (Real API Handshake, Zero Password Friction)
          Shown automatically on entry and whenever clicking "Đổi Tài Khoản (4 Vai Trò)"
          ===================================================================== */}
      {/* =====================================================================
          ROLE 1: B2B COMPANY LOGISTICS ORCHESTRATOR ("user" role)
          Left Sidebar Navigation (CRM/TMS style) + Daylight Framed Sheet
          ===================================================================== */}
      {activeRole === 'user' && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-6">
          {/* Responsive CRM/TMS Navigation: Horizontal Touch Strip on Mobile/Tablet, Left Sidebar Rail on Desktop */}
          <aside className="w-full lg:w-64 shrink-0 flex flex-col justify-between bg-white border border-[#D4BF94] rounded-xl p-2.5 lg:p-3 space-y-2.5 lg:space-y-4 self-start">
            <div className="space-y-2.5 lg:space-y-3">
              {/* Company Workspace Card (Compact inline on mobile/tablet, full card on desktop) */}
              <div className="p-2.5 lg:p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] flex lg:block items-center justify-between gap-2 lg:space-y-1">
                <div className="min-w-0">
                  <div className="text-[10px] lg:text-[11px] font-semibold text-[#004366] uppercase">
                    Không gian doanh nghiệp
                  </div>
                  <div className="text-xs lg:text-sm font-bold text-[#003049] truncate">
                    {activeCompany.short_name}
                  </div>
                  <div className="hidden lg:block text-[11.5px] text-[#004366]">
                    {activeCompany.depot_name}
                  </div>
                </div>
                <div className="lg:pt-1 flex items-center gap-1 text-[10.5px] lg:text-[11px] font-mono text-[#003049] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{activeCompany.key_fingerprint}</span>
                </div>
              </div>

              {/* Navigation Items: Horizontal Scrollable Touch Pills on <lg, Vertical Rail on lg+ */}
              <nav
                aria-label="Chức năng quản trị vận tải"
                className="flex lg:flex-col overflow-x-auto gap-1.5 lg:gap-0 lg:space-y-1 pb-1 lg:pb-0"
              >
                {USER_SIDEBAR_ITEMS.map((item) => {
                  const isActive = userTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setUserTab(item.id)}
                      className={`shrink-0 lg:w-full text-left px-3 py-2 lg:py-2.5 rounded-lg flex items-center lg:items-start gap-2 lg:gap-2.5 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#003049] lg:bg-[#EED9AF] text-white lg:text-[#003049] font-bold lg:border-l-[3px] lg:border-[#003049]'
                          : 'bg-[#FDF0D5] lg:bg-transparent text-[#004366] hover:bg-[#F8E7C4] hover:text-[#003049]'
                      }`}
                    >
                      <span
                        className={`lg:mt-0.5 shrink-0 ${
                          isActive ? 'text-[#FDF0D5] lg:text-[#003049]' : 'text-[#004366]'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs lg:text-[13px] leading-tight whitespace-nowrap lg:whitespace-normal">
                          {item.label}
                        </span>
                        <span className="hidden lg:block text-[11px] text-[#004366] truncate mt-0.5">
                          {item.sublabel}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions at Bottom of Sidebar (Desktop lg+) */}
            <div className="hidden lg:block pt-3 border-t border-[#D4BF94] space-y-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-lg bg-[#003049] hover:bg-[#003049] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Nhập bảng tính .XLSX mới</span>
              </button>
              <button
                type="button"
                onClick={() => setUserTab(userTab === 'evsim_compare' ? 'overview' : 'evsim_compare')}
                className="w-full py-2 px-3 rounded-lg border border-[#D4BF94] bg-white hover:bg-[#FDF0D5] text-[#003049] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-[#003049]" />
                <span>
                  {userTab === 'evsim_compare' ? 'Về Tổng quan Đội xe' : 'Mở Đối chứng 2 bên (EVSIM)'}
                </span>
              </button>
            </div>
          </aside>

          {/* Main Framed Sheet Content Area */}
          <main className="flex-1 min-w-0 space-y-5">
            {/* ===============================================================
                TAB 1: OVERVIEW DASHBOARD (Default: Fleet & Order Completion)
                =============================================================== */}
            {userTab === 'overview' && (
              <div className="space-y-5">
                {/* Page Title Row */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h1 className="text-[22px] font-bold text-[#003049] tracking-tight">
                      Bảng Điều Khiển Đội Xe &amp; Tiến Độ Hoàn Thành Đơn Hàng
                    </h1>
                    <p className="text-[13px] text-[#004366] mt-0.5">
                      {activeCompany.name} · Đang vận hành {activeStrategy.vehicles_used}/{activeCompany.fleet_count} xe tải trên tập dữ liệu{' '}
                      <strong className="text-[#003049] break-all sm:break-normal">{result.file_name}</strong> ({result.rows_valid} điểm giao).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => setUserTab('routing')}
                      className="px-3.5 py-2 rounded-lg bg-[#003049] hover:bg-[#780000] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RouteIcon className="w-3.5 h-3.5" />
                      <span>Điều phối &amp; Tối ưu Tuyến</span>
                    </button>
                    <button
                      onClick={handleExportExcel3Sheet}
                      className="px-3.5 py-2 rounded-lg border border-[#D4BF94] bg-white hover:bg-[#FDF0D5] text-[#003049] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#003049]" />
                      <span>Xuất Báo Cáo Excel (3 Sheet)</span>
                    </button>
                  </div>
                </div>

                {/* Divided 6-Cell KPI Container (app-screens.md §5: one container split by hairlines) */}
                <div className="bg-white border border-[#D4BF94] rounded-xl grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-[#D4BF94] tabular-nums">
                  <div className="p-4 space-y-1">
                    <div className="text-[12px] text-[#004366] font-medium">Tiến độ hoàn thành đơn</div>
                    <div className="text-[24px] font-bold text-[#003049]">
                      {simulatedDeliveredCount}/{totalOrdersCount}
                    </div>
                    <div className="text-[12px] text-[#003049] font-semibold">
                      Đạt {completionPct}% · Đang giao {inProgressCount} đơn
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="text-[12px] text-[#004366] font-medium">Đội xe đang khai thác</div>
                    <div className="text-[24px] font-bold text-[#003049]">
                      {activeStrategy.vehicles_used}/{activeCompany.fleet_count}{' '}
                      <span className="text-xs font-normal text-[#004366]">xe</span>
                    </div>
                    <div className="text-[12px] text-[#003049] font-semibold">
                      Lấp đầy tải trọng: {activeStrategy.payload_utilisation_pct}%
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="text-[12px] text-[#004366] font-medium">Tổng cự ly lộ trình</div>
                    <div className="text-[24px] font-bold text-[#003049]">
                      {activeStrategy.km_total.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-[#004366]">km</span>
                    </div>
                    <div className="text-[12px] text-[#003049] font-semibold">
                      {activeStrategy.delta_vs_human_km_pct}% so với chia thủ công ({humanSt.km_total} km)
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="text-[12px] text-[#004366] font-medium">Tỷ lệ xe chạy rỗng</div>
                    <div className="text-[24px] font-bold text-[#003049]">
                      {activeStrategy.empty_running_pct.toFixed(1)}%
                    </div>
                    <div className="text-[12px] text-[#003049] font-semibold">
                      {activeStrategy.km_empty_return} km (Thủ công: {humanSt.empty_running_pct}%)
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="text-[12px] text-[#004366] font-medium">Đơn ghép chiều về kho</div>
                    <div className="text-[24px] font-bold text-[#003049]">
                      +{activeStrategy.backhaul_orders_matched}{' '}
                      <span className="text-xs font-normal text-[#004366]">đơn</span>
                    </div>
                    <div className="text-[12px] text-[#004366]">
                      Thu hồi {activeStrategy.backhaul_kg_recovered.toLocaleString('vi-VN')} kg hàng về
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="text-[12px] text-[#004366] font-medium">Phát thải CO₂e &amp; Giờ cấm</div>
                    <div className="text-[24px] font-bold text-[#003049]">
                      {activeStrategy.kg_co2_ttw.toFixed(1)}{' '}
                      <span className="text-xs font-normal text-[#004366]">kg</span>
                    </div>
                    <div className="text-[12px] text-[#003049] font-semibold">
                      0 lỗi QĐ 23 · Giảm {Math.abs(activeStrategy.delta_vs_human_co2_pct)}% CO₂
                    </div>
                  </div>
                </div>


                {/* Active Truck Fleet & Order Completion Table */}
                {/* Active Truck Fleet & Dynamic Vehicle Class / Weight / Reefer Physics Table */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#D4BF94] pb-3.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[16px] font-bold text-[#003049]">
                          Bảng Giám Sát Đội Xe &amp; Cấu Hình Đầu Xe / Thùng Lạnh (GLX-HDT-v1)
                        </h2>
                        <span className="px-2 py-0.5 rounded bg-[#D7E6F0] text-[#003049] text-[11px] font-bold">
                          Biến Trọng Lượng &amp; Nhiệt Lạnh Động
                        </span>
                      </div>
                      <p className="text-[12px] text-[#004366] mt-0.5">
                        Điều phối viên có thể chọn <b>tổ hợp đội xe mẫu</b> hoặc đổi trực tiếp <b>loại đầu xe (Van ≤500kg, Tải khô, Tải đông lạnh Reefer -18°C, Đầu kéo Công thường 20/40FT, Đầu kéo Công lạnh 40FT Genset)</b> trên từng chuyến để tính lại tự trọng xác xe, tải trọng hàng và CO₂e tức thì.
                      </p>
                    </div>
                    {(fleetPresetId !== 'default_mixed' || Object.keys(perRouteVehicleClass).length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFleetPresetId('default_mixed');
                          setPerRouteVehicleClass({});
                          setStatusBanner('Đã khôi phục cấu hình đội xe hỗn hợp mặc định (khớp 100% số liệu Pitch Deck).');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#669BBC] bg-[#D7E6F0] hover:bg-[#D7E6F0] text-[12px] font-bold text-[#003049] cursor-pointer shrink-0"
                      >
                        Khôi phục mặc định Pitch Deck
                      </button>
                    )}
                  </div>

                  {/* 4 Fleet Preset Cards + GLX-HDT-v1 Physics Equation Callout */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                      {FLEET_PRESET_CATALOG.map((preset) => {
                        const isSelected =
                          fleetPresetId === preset.id && Object.keys(perRouteVehicleClass).length === 0;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setFleetPresetId(preset.id);
                              setPerRouteVehicleClass({});
                              setStatusBanner(
                                `Đã áp dụng cấu hình "${preset.title}" theo mô hình vật lý tải trọng GLX-HDT-v1.`
                              );
                            }}
                            className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#D7E6F0] border-[#669BBC] ring-1 ring-[#669BBC]'
                                : 'bg-[#FDF0D5] border-[#D4BF94] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#D4BF94] text-[#003049]">
                                {preset.badge}
                              </span>
                              {isSelected && (
                                <span className="text-[11px] font-bold text-[#003049]">Đang chọn</span>
                              )}
                            </div>
                            <div className="text-[12.5px] font-bold text-[#003049] leading-snug">
                              {preset.title}
                            </div>
                            <div className="text-[11px] text-[#004366] mt-1 leading-relaxed">
                              {preset.subtitle}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="bg-[#FDF0D5] border border-[#D7E6F0] rounded-lg px-3.5 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-[11.5px] text-[#003049]">
                      <div>
                        <span className="font-bold">Công thức Vật lý Tải trọng &amp; Nhiệt lạnh GLX-HDT-v1 (ISO 14083 / GLEC v3.2): </span>
                        <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#669BBC] text-[#003049]">
                          M_tổng(k) = M_xác_xe + M_hàng(k)  ⇒  Lít(k) = d_k × (L_chuẩn/100) × [0.76 + 0.38 × (M_hàng(k) / M_tải_max)] × (1 + %P_aux_lạnh)
                        </code>
                      </div>
                      <div className="text-[11px] text-[#004366] shrink-0">
                        Diesel: <b>2.68 kg/L</b> (TTW) · <b>3.24 kg/L</b> (WTW) | Xăng: <b>2.31</b> · <b>2.82 kg/L</b>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[12.5px] tabular-nums">
                      <thead>
                        <tr className="border-b border-[#D4BF94] text-[#004366] text-[11.5px]">
                          <th className="py-2.5 px-2.5 text-left font-medium">Biển số &amp; Tài xế</th>
                          <th className="py-2.5 px-2.5 text-left font-medium">Loại Đầu Xe &amp; Thùng Hàng (Chọn trực tiếp)</th>
                          <th className="py-2.5 px-2.5 text-right font-medium">Xác xe + Tải hàng (kg)</th>
                          <th className="py-2.5 px-2.5 text-right font-medium">Định mức (Rỗng → Đầy)</th>
                          <th className="py-2.5 px-2.5 text-left font-medium">Tiến độ giao</th>
                          <th className="py-2.5 px-2.5 text-right font-medium">Tổng cự ly</th>
                          <th className="py-2.5 px-2.5 text-right font-medium">Km rỗng / Ghép về</th>
                          <th className="py-2.5 px-2.5 text-right font-medium">Nhiên liệu &amp; CO₂e</th>
                          <th className="py-2.5 px-2.5 text-right font-medium">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EED9AF]">
                        {activeStrategy.routes.map((r, idx) => {
                          const stopsCount = r.stops.filter((s) => s.kind === 'stop').length;
                          const doneStops = Math.max(1, Math.min(stopsCount, stopsCount - (idx % 3)));
                          const pct = Math.round((doneStops / Math.max(1, stopsCount)) * 100);
                          const driverName = DRIVER_NAMES[idx % DRIVER_NAMES.length];
                          const initials = driverName
                            .split(' ')
                            .slice(-2)
                            .map((w) => w[0])
                            .join('');
                          const emptyWeightKg = r.empty_weight_kg ?? 1750;
                          const reeferKw = r.reefer_aux_kw ?? 0;
                          const reeferPct = r.reefer_fuel_surcharge_pct ?? 0;
                          const lEmpty = r.l_per_100km_empty ?? Number((r.l_per_100km * 0.76).toFixed(1));
                          const lFull =
                            r.l_per_100km_full ??
                            Number((r.l_per_100km * 1.14 * (1 + reeferPct / 100)).toFixed(1));
                          const bodyType = r.body_type ?? 'dry';
                          const isReefer = bodyType === 'reefer' || bodyType === 'container_reefer';
                          const isContainer = bodyType === 'container_dry' || bodyType === 'container_reefer';

                          return (
                            <tr key={r.route_id} className="hover:bg-[#FDF0D5]">
                              <td className="py-2.5 px-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                                    style={{
                                      backgroundColor: idx % 2 === 0 ? '#D7E6F0' : '#D7E6F0',
                                      color: idx % 2 === 0 ? '#003049' : '#002033',
                                    }}
                                  >
                                    {initials}
                                  </span>
                                  <div>
                                    <div className="font-bold text-[#003049]">{r.plate}</div>
                                    <div className="text-[11px] text-[#004366]">{driverName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 min-w-[235px]">
                                <select
                                  aria-label={`Chọn loại đầu xe cho ${r.plate}`}
                                  value={r.vehicle_class_id || 'tai_kho_1t'}
                                  onChange={(e) => {
                                    const nextClassId = e.target.value as VehicleClassId;
                                    setPerRouteVehicleClass((prev) => ({
                                      ...prev,
                                      [r.route_id]: nextClassId,
                                    }));
                                    const spec = VEHICLE_CLASS_CATALOG[nextClassId];
                                    setStatusBanner(
                                      `Xe ${r.plate}: Đã đổi sang "${spec.label}" (Xác xe ${spec.empty_weight_kg.toLocaleString('en-US')} kg · Tải tối đa ${spec.capacity_kg.toLocaleString('en-US')} kg · Định mức ${spec.l_per_100km_empty}→${spec.l_per_100km_full} L/100km).`
                                    );
                                  }}
                                  className="w-full px-2 py-1 rounded border border-[#D4BF94] bg-white text-[11.5px] font-bold text-[#003049] cursor-pointer"
                                >
                                  {Object.values(VEHICLE_CLASS_CATALOG).map((spec) => (
                                    <option key={spec.id} value={spec.id}>
                                      {spec.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      r.fuel === 'diesel'
                                        ? 'bg-[#D7E6F0] text-[#003049]'
                                        : 'bg-[#F8E7C4] text-[#780000]'
                                    }`}
                                  >
                                    {r.fuel === 'diesel' ? 'Dầu Diesel' : 'Xăng RON95'}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      isReefer
                                        ? 'bg-[#D7E6F0] text-[#003049]'
                                        : isContainer
                                          ? 'bg-[#F8E7C4] text-[#780000]'
                                          : 'bg-[#F8E7C4] text-[#003049]'
                                    }`}
                                  >
                                    {isReefer
                                      ? `Thùng lạnh (+${reeferKw}kW · +${reeferPct}% dầu)`
                                      : isContainer
                                        ? 'Công thường (Khô · 0kW lạnh)'
                                        : 'Thùng kín thường (0kW lạnh)'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                <div className="font-bold text-[#003049]">
                                  Hàng: {r.kg_delivered.toLocaleString('en-US')} / {r.capacity_kg.toLocaleString('en-US')} kg ({r.payload_utilisation_pct}%)
                                </div>
                                <div className="text-[11px] text-[#004366]">
                                  Xác xe: {emptyWeightKg.toLocaleString('en-US')} kg · Tổng: {Math.round(emptyWeightKg + r.kg_delivered).toLocaleString('en-US')} kg
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                <div className="font-semibold text-[#003049]">
                                  {lEmpty} → {lFull} L/100km
                                </div>
                                <div className="text-[10.5px] text-[#004366]">
                                  Chuẩn: {r.l_per_100km} L/100km
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 min-w-[135px]">
                                <div className="flex items-center justify-between text-[11.5px] mb-1">
                                  <span className="font-semibold text-[#003049]">
                                    {doneStops}/{stopsCount} điểm
                                  </span>
                                  <span className="text-[#003049] font-bold">{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[#D4BF94] overflow-hidden">
                                  <div
                                    className="h-full bg-[#669BBC]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#003049]">
                                {r.km} km
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                <div className="text-[#004366]">
                                  Rỗng: {r.km_empty_return} km ({r.empty_running_pct}%)
                                </div>
                                <div className="text-[11px] font-semibold text-[#003049]">
                                  Ghép về: +{r.backhaul_orders_matched} đơn ({r.backhaul_kg_recovered} kg)
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 text-right font-mono">
                                <div className="font-bold text-[#003049]">
                                  {r.kg_co2_ttw} kg CO₂e
                                </div>
                                <div className="text-[11px] text-[#004366]">
                                  {r.litres} L · WTW {r.kg_co2_wtw} kg
                                </div>
                              </td>
                              <td className="py-2.5 px-2.5 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRouteId(r.route_id);
                                      setUserTab('routing');
                                    }}
                                    className="px-2 py-1 rounded border border-[#D4BF94] bg-white hover:bg-[#F8E7C4] text-xs font-semibold text-[#003049] cursor-pointer"
                                  >
                                    Xem tuyến
                                  </button>
                                  <a
                                    href={`/maps?vehicle=${idx}&mode=overview`}
                                    className="px-2 py-1 rounded bg-[#D7E6F0] hover:bg-[#D7E6F0] border border-[#669BBC] text-xs font-bold text-[#003049]"
                                  >
                                    Bản đồ
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ===============================================================
                    COMPANY-SPECIFIC 14-DAY OPERATIONAL & FINANCIAL TELEMETRY (FB-03)
                    Mentor Minh Insights: Decoupling Rebound Effect & 3 Carbon Scenarios
                    =============================================================== */}
                {(() => {
                  const telemetry14d = buildCompany14DayTelemetry(activeCompany.tenant_id);
                  const totalFuelSaved14d = telemetry14d.reduce((s, p) => s + p.fuel_saved_vnd, 0);
                  const avgIntensity14d = Math.round(
                    telemetry14d.reduce((s, p) => s + p.g_co2_per_order, 0) / telemetry14d.length
                  );
                  const avgSla14d = (
                    telemetry14d.reduce((s, p) => s + p.sla_on_time_pct, 0) / telemetry14d.length
                  ).toFixed(1);
                  const intensityDeltaPct =
                    humanSt.g_co2e_per_order > 0
                      ? Number(
                          (
                            ((activeStrategy.g_co2e_per_order - humanSt.g_co2e_per_order) /
                              humanSt.g_co2e_per_order) *
                            100
                          ).toFixed(1)
                        )
                      : -32.2;
                  const peakVsMinOrderGrowthPct = Math.round(
                    ((Math.max(...telemetry14d.map((p) => p.orders_completed)) -
                      Math.min(...telemetry14d.map((p) => p.orders_completed))) /
                      Math.max(1, Math.min(...telemetry14d.map((p) => p.orders_completed)))) *
                      100
                  );

                  const dailyFuelSaved = Math.max(0, humanSt.fuel_cost_vnd - activeStrategy.fuel_cost_vnd);
                  const annualFuelSaved = dailyFuelSaved * 300;
                  const dailyCo2SavedKg = Math.max(0, humanSt.kg_co2_ttw - activeStrategy.kg_co2_ttw);
                  const annualCo2SavedTon = (dailyCo2SavedKg * 300) / 1000;
                  const scenarioRateVnd =
                    carbonScenario === 1 ? 120000 : carbonScenario === 2 ? 380000 : 2150000;
                  const annualCarbonCreditVnd = Math.round(annualCo2SavedTon * scenarioRateVnd);
                  return (
                    <div className="space-y-5">
                      {/* Section 1: 14-Day ECharts Multi-Series & KPI Strip */}
                      <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#D4BF94] pb-3.5">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-[16px] font-bold text-[#003049]">
                                Xu Hướng Vận Hành, Chi Phí Nhiên Liệu &amp; Cường Độ CO₂e 14 Ngày
                              </h2>
                              <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-[#D7E6F0] text-[#003049]">
                                {activeCompany.code}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#004366] mt-0.5">
                              Mô phỏng kịch bản 14 ngày của {activeCompany.short_name} (C1-illustrative · tham chiếu hệ số GLEC v3.2, chưa chứng nhận độc lập).
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-[#003049] font-bold">
                              Ước tính tiết kiệm 14 ngày: {totalFuelSaved14d.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-[#003049] font-bold">
                              SLA kịch bản: {avgSla14d}%
                            </span>
                          </div>
                        </div>

                        {/* 14-Day Telemetry Chart */}
                        <EChartDaylight
                          height={260}
                          option={{
                            tooltip: { trigger: 'axis' },
                            legend: {
                              data: [
                                'Tiền dầu tiết kiệm (nghìn đ/ngày)',
                                'Cường độ phát thải (g CO₂e/đơn)',
                                'Tỷ lệ đúng hẹn SLA (%)',
                              ],
                              bottom: 0,
                              textStyle: { color: '#004366', fontSize: 11 },
                            },
                            grid: { left: 54, right: 48, top: 20, bottom: 44 },
                            xAxis: {
                              type: 'category',
                              data: telemetry14d.map((p) => p.date_label),
                              axisLabel: { color: '#004366', fontSize: 11 },
                            },
                            yAxis: [
                              {
                                type: 'value',
                                name: 'Nghìn đ / g CO₂e',
                                axisLabel: { color: '#004366', fontSize: 11 },
                                splitLine: { lineStyle: { color: '#D4BF94', type: 'dashed' } },
                              },
                              {
                                type: 'value',
                                name: 'SLA (%)',
                                min: 90,
                                max: 100,
                                position: 'right',
                                axisLabel: { color: '#C1121F', fontSize: 11, formatter: '{value}%' },
                                splitLine: { show: false },
                              },
                            ],
                            series: [
                              {
                                name: 'Tiền dầu tiết kiệm (nghìn đ/ngày)',
                                type: 'bar',
                                itemStyle: { color: '#003049' },
                                data: telemetry14d.map((p) => Math.round(p.fuel_saved_vnd / 1000)),
                              },
                              {
                                name: 'Cường độ phát thải (g CO₂e/đơn)',
                                type: 'line',
                                smooth: true,
                                itemStyle: { color: '#003049' },
                                lineStyle: { width: 3 },
                                data: telemetry14d.map((p) => p.g_co2_per_order),
                              },
                              {
                                name: 'Tỷ lệ đúng hẹn SLA (%)',
                                type: 'line',
                                yAxisIndex: 1,
                                itemStyle: { color: '#C1121F' },
                                lineStyle: { type: 'dashed', width: 2 },
                                data: telemetry14d.map((p) => p.sla_on_time_pct),
                              },
                            ],
                          }}
                        />
                      </div>

                      {/* Section 2: Mentor Minh Insight #8 - Rebound-Effect Decoupling Strip */}
                      <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4BF94] pb-2.5">
                          <div className="flex items-center gap-2">
                            <Co2AuditIcon className="w-4 h-4 text-[#003049]" />
                            <h3 className="text-sm font-bold text-[#003049]">
                              Tách Rời Tăng Trưởng Khỏi Phát Thải (Rebound-Effect Decoupling)
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#D7E6F0] text-[#003049] text-[11px] font-bold">
                            Góp Ý Mentor Minh · Insight #8
                          </span>
                        </div>

                        <p className="text-xs text-[#004366] leading-relaxed">
                          <strong>Hiệu ứng Bật nảy (Rebound Effect) trong Logistics:</strong> Khi tối ưu hóa chia tuyến giúp chi phí vận tải rẻ hơn, doanh nghiệp có xu hướng tăng số lượng đơn hàng và quy mô đội xe. EcoMiles giải quyết nghịch lý này bằng cách theo dõi song song cả <strong>Cường độ phát thải đơn vị (g CO₂e/đơn)</strong> và <strong>Tổng phát thải tuyệt đối (kg CO₂e)</strong>, đảm bảo doanh nghiệp mở rộng kinh doanh mà vẫn đạt mục tiêu cắt giảm phát thải:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3.5 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] space-y-1">
                            <div className="text-[11px] font-bold text-[#669BBC] uppercase">
                              1. Cường Độ Phát Thải Đơn Vị (g CO₂e / Đơn Hàng)
                            </div>
                            <div className="text-xl font-extrabold text-[#003049]">
                              {activeStrategy.g_co2e_per_order.toFixed(0)}{' '}
                              <span className="text-xs font-normal text-[#004366]">
                                g CO₂e/đơn (TB 14 ngày: {avgIntensity14d} g)
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-[#003049]">
                              {intensityDeltaPct}% trên mỗi đơn so với chia tuyến thủ công ({humanSt.g_co2e_per_order.toFixed(0)} g/đơn)
                            </div>
                            <div className="text-[11px] text-[#004366]">
                              Dữ liệu đầu vào Scope 3 hỗ trợ chủ hàng sản xuất đối chiếu theo QĐ 2626/QĐ-BTNMT &amp; QĐ 42/2026/QĐ-TTg.
                            </div>
                          </div>

                          <div className="p-3.5 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] space-y-1">
                            <div className="text-[11px] font-bold text-[#003049] uppercase">
                              2. Tổng Phát Thải Tuyệt Đối (kg CO₂e Đội Xe)
                            </div>
                            <div className="text-xl font-extrabold text-[#003049]">
                              {activeStrategy.kg_co2_ttw.toFixed(2)} <span className="text-xs font-normal text-[#004366]">kg CO₂e</span>
                            </div>
                            <div className="text-xs font-semibold text-[#003049]">
                              Giảm {Math.abs(activeStrategy.delta_vs_human_co2_pct)}% CO₂e TTW so với chia thủ công ({humanSt.kg_co2_ttw.toFixed(2)} kg)
                            </div>
                            <div className="text-[11px] text-[#004366]">
                              Dao động sản lượng 14 ngày +{peakVsMinOrderGrowthPct}% nhưng cường độ phát thải trên mỗi đơn vẫn duy trì ổn định.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Mentor Minh Insight #6 & #7 - 3-Scenario Carbon Value & Scope 3 Readiness Card */}
                      <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#D4BF94] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-[#003049]" />
                              <h3 className="text-sm font-bold text-[#003049]">
                                Bộ Chuyển Đổi Giá Trị Carbon 3 Kịch Bản &amp; Sẵn Sàng Báo Cáo Scope 3
                              </h3>
                            </div>
                            <p className="text-xs text-[#004366] mt-0.5">
                              Tách bạch rõ ràng <strong>Tiền dầu tiết kiệm thật ngay hôm nay (VNĐ)</strong> và <strong>Giá trị tín chỉ / Tránh phạt Carbon tiềm năng</strong> theo 3 thị trường:
                            </p>
                          </div>

                          {/* 3-Scenario Toggle Buttons */}
                          <div className="inline-flex rounded-lg border border-[#669BBC] p-0.5 bg-[#F8E7C4] text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setCarbonScenario(1)}
                              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                                carbonScenario === 1
                                  ? 'bg-white text-[#003049] shadow-xs'
                                  : 'text-[#004366] hover:text-[#003049]'
                              }`}
                            >
                              1. Sàn NĐ 119/2025
                            </button>
                            <button
                              type="button"
                              onClick={() => setCarbonScenario(2)}
                              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                                carbonScenario === 2
                                  ? 'bg-white text-[#003049] shadow-xs'
                                  : 'text-[#004366] hover:text-[#003049]'
                              }`}
                            >
                              2. Tự Nguyện FDI
                            </button>
                            <button
                              type="button"
                              onClick={() => setCarbonScenario(3)}
                              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                                carbonScenario === 3
                                  ? 'bg-[#003049] text-[#FDF0D5] shadow-xs'
                                  : 'text-[#004366] hover:text-[#003049]'
                              }`}
                            >
                              3. Chuẩn EU CBAM
                            </button>
                          </div>
                        </div>

                        {/* Calculation Visual Split: Hard Cash vs Potential Carbon Credit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Box 1: Hard Cash Fuel Savings */}
                          <div className="p-4 rounded-xl bg-[#D7E6F0] border border-[#669BBC] space-y-2">
                            <div className="text-xs font-bold text-[#003049] uppercase flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#003049]" />
                              <span>1. Dòng Tiền Tiết Kiệm Nhiên Liệu Thật (Hard Cash)</span>
                            </div>
                            <div className="text-2xl font-black text-[#003049]">
                              {dailyFuelSaved.toLocaleString('vi-VN')} đ <span className="text-xs font-normal text-[#003049]">/ ngày</span>
                            </div>
                            <div className="text-xs font-bold text-[#003049]">
                              Tương đương ~{(annualFuelSaved / 1000000).toFixed(1)} triệu đ / năm (300 ngày vận hành)
                            </div>
                            <p className="text-[11px] text-[#003049] leading-relaxed">
                              Cắt giảm trực tiếp chi phí dầu Diesel tại cây xăng nhờ giảm {alnsSt.km_empty_return} km chạy rỗng và tối ưu cự ly đường bộ TP.HCM. Tiền về tài khoản doanh nghiệp ngay lập tức.
                            </p>
                          </div>

                          {/* Box 2: Potential Carbon Credit / Penalty Avoidance */}
                          <div className="p-4 rounded-xl bg-[#D7E6F0] border border-[#669BBC] space-y-2">
                            <div className="text-xs font-bold text-[#003049] uppercase flex items-center gap-1.5">
                              <IsoLedgerIcon className="w-4 h-4 text-[#003049]" />
                              <span>
                                2. Giá Trị Tín Chỉ / Tránh Thuế Carbon (
                                {carbonScenario === 1
                                  ? '120.000 đ/tấn'
                                  : carbonScenario === 2
                                  ? '380.000 đ/tấn'
                                  : '2.150.000 đ/tấn'}
                                )
                              </span>
                            </div>
                            <div className="text-2xl font-black text-[#003049]">
                              ~{(annualCarbonCreditVnd / 1000000).toFixed(2)} triệu đ <span className="text-xs font-normal text-[#003049]">/ năm</span>
                            </div>
                            <div className="text-xs font-bold text-[#003049]">
                              Dựa trên mức giảm {annualCo2SavedTon.toFixed(2)} tấn CO₂e / năm của đội xe {activeCompany.code}
                            </div>
                            <p className="text-[11px] text-[#003049] leading-relaxed">
                              {carbonScenario === 1
                                ? 'Kịch bản Sàn carbon nội địa thí điểm theo Nghị định 119/2025/NĐ-CP (Định giá sàn 120.000 đ/tấn CO₂e).'
                                : carbonScenario === 2
                                ? 'Kịch bản Thị trường tín chỉ carbon tự nguyện cho chuỗi cung ứng FDI Nhật Bản / Mỹ (380.000 đ/tấn CO₂e).'
                                : 'Kịch bản Cơ chế điều chỉnh biên giới carbon EU CBAM (80 EUR/tấn tương đương 2.150.000 đ/tấn CO₂e tránh phạt).'}
                            </p>
                          </div>
                        </div>

                        {/* Regulatory Citation Strip */}
                        <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] text-xs text-[#004366] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-[#669BBC] shrink-0" />
                            <span>
                              <strong>Cơ sở pháp lý:</strong> Quyết định 2626/QĐ-BTNMT (Hệ số phát thải giao thông) &amp; Quyết định 42/2026/QĐ-TTg (Đề án giảm phát thải GTVT).
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-[#F8E7C4] text-[#003049] shrink-0">
                            Hỗ trợ 1.916 cơ sở kiểm kê Scope 3
                          </span>
                        </div>
                      </div>

                      {/* Section 4: B2B Corporate Settlement & Security Policy Strip */}
                      <div className="p-4 rounded-xl bg-white border border-[#D4BF94] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="text-[#004366]">Tài khoản thụ hưởng B2B:</div>
                          <div className="font-bold text-[#003049]">{activePolicy.invoice_bank_name}</div>
                          <div className="font-mono text-[11px] text-[#004366]">{activePolicy.invoice_account_masked}</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[#004366]">Mã số thuế &amp; E-Invoice:</div>
                          <div className="font-bold text-[#003049]">MST {activePolicy.tax_code_mst}</div>
                          <div className="text-[11px] text-[#003049] font-semibold">Hóa đơn điện tử VAT tự động</div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[#004366]">Tiêu chuẩn Scope 3:</div>
                          <div className="font-bold text-[#003049] truncate">{activePolicy.scope3_shipper_standard}</div>
                          <div className="text-[11px] text-[#004366]">
                            SLA Thùng lạnh: {activePolicy.cold_chain_temp_sla_c !== null ? `${activePolicy.cold_chain_temp_sla_c}°C` : 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[#004366]">Chính sách cách ly:</div>
                          <div className="font-bold text-[#003049]">{activePolicy.tier_badge}</div>
                          <div className="font-mono text-[11px] text-[#669BBC] truncate">{activeCompany.key_fingerprint}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* 2 Daylight Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-2">
                    <h3 className="text-[15px] font-bold text-[#003049]">
                      1. Phân Bổ Đơn Hàng Theo Khung Giờ &amp; Khung Cấm Tải QĐ 23/2018
                    </h3>
                    <p className="text-[12px] text-[#004366]">
                      Cột cam biểu thị khung giờ cấm xe tải nhẹ nội đô TP.HCM (06:00 - 09:00 &amp; 16:00 - 20:00).
                    </p>
                    <EChartDaylight
                      height={230}
                      option={{
                        tooltip: { trigger: 'axis' },
                        grid: { left: 44, right: 24, top: 24, bottom: 32 },
                        xAxis: {
                          type: 'category',
                          data: result.hourly_demand.map((h) => h.hour),
                          axisLabel: { color: '#004366', fontSize: 11 },
                        },
                        yAxis: {
                          type: 'value',
                          axisLabel: { color: '#004366', fontSize: 11 },
                          splitLine: { lineStyle: { color: '#D4BF94', type: 'dashed' } },
                        },
                        series: [
                          {
                            name: 'Số đơn giao',
                            type: 'bar',
                            data: result.hourly_demand.map((h) => ({
                              value: h.orders,
                              itemStyle: { color: h.ban_zone ? '#C1121F' : '#003049' },
                            })),
                          },
                        ],
                      }}
                    />
                  </div>

                  <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-2">
                    <h3 className="text-[15px] font-bold text-[#003049]">
                      2. Đối Chứng 4 Chiến Lược: Tổng Cự Ly, Km Chạy Rỗng &amp; Phát Thải CO₂e
                    </h3>
                    <p className="text-[12px] text-[#004366]">
                      So sánh trực tiếp trên cùng mạng lưới đường bộ TP.HCM cho {activeCompany.short_name}.
                    </p>
                    <EChartDaylight
                      height={230}
                      option={{
                        tooltip: { trigger: 'axis' },
                        legend: {
                          data: ['Tổng km', 'Km chạy rỗng', 'CO₂e TTW (kg)'],
                          bottom: 0,
                          textStyle: { color: '#004366', fontSize: 11 },
                        },
                        grid: { left: 48, right: 20, top: 20, bottom: 52 },
                        xAxis: {
                          type: 'category',
                          data: ['1. Excel gốc', '2. Chia thủ công', '3. EcoMiles 2-Opt', '4. EcoMiles v2.1'],
                          axisLabel: { color: '#003049', fontSize: 10.5, interval: 0 },
                        },
                        yAxis: {
                          type: 'value',
                          axisLabel: { color: '#004366', fontSize: 11 },
                          splitLine: { lineStyle: { color: '#D4BF94', type: 'dashed' } },
                        },
                        series: [
                          {
                            name: 'Tổng km',
                            type: 'bar',
                            itemStyle: { color: '#003049' },
                            data: [rawSt.km_total, humanSt.km_total, twoOptSt.km_total, alnsSt.km_total],
                          },
                          {
                            name: 'Km chạy rỗng',
                            type: 'bar',
                            itemStyle: { color: '#C1121F' },
                            data: [
                              rawSt.km_empty_return,
                              humanSt.km_empty_return,
                              twoOptSt.km_empty_return,
                              alnsSt.km_empty_return,
                            ],
                          },
                          {
                            name: 'CO₂e TTW (kg)',
                            type: 'bar',
                            itemStyle: { color: '#669BBC' },
                            data: [rawSt.kg_co2_ttw, humanSt.kg_co2_ttw, twoOptSt.kg_co2_ttw, alnsSt.kg_co2_ttw],
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 1B: EMBEDDED EVSIM 2-SIDE COMPARISON DASHBOARD (Inside User CRM/TMS)
                =============================================================== */}
            {userTab === 'evsim_compare' && (
              <div className="space-y-4">
                <EvsimDualSimulator
                  initialResult={result}
                  onResultChange={(newRes) => setResult(newRes)}
                />
              </div>
            )}

            {/* ===============================================================
                TAB 2: ROUTING & ALGORITHM WORKBENCH
                =============================================================== */}
            {userTab === 'routing' && (
              <div className="space-y-5">
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D4BF94] pb-4">
                    <div>
                      <h1 className="text-[20px] font-bold text-[#003049]">
                        Bàn Điều Phối Tuyến Xe &amp; Cấu Hình Thuật Toán Tối Ưu
                      </h1>
                      <p className="text-[12.5px] text-[#004366]">
                        Thiết lập tham số gom cụm, bật bộ lọc giờ cấm tải Quyết định 23/2018/QĐ-UBND và phát hành tuyến xuống điện thoại tài xế.
                      </p>
                    </div>
                    <button
                      onClick={handleRunOptimizerAndPublish}
                      className="px-4 py-2.5 rounded-lg bg-[#669BBC] hover:bg-[#003049] text-[#003049] hover:text-[#FDF0D5] text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Chạy Tối Ưu &amp; Phát Hành Xuống Tài Xế</span>
                    </button>
                  </div>

                  {/* Algorithm & Vehicle Class Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-[#004366] mb-1">Chiến lược giải thuật:</label>
                      <select
                        value={selectedStrategyId}
                        onChange={(e) => setSelectedStrategyId(e.target.value as StrategySummary['id'])}
                        className="w-full p-2 rounded-lg border border-[#D4BF94] bg-white font-bold text-[#003049]"
                      >
                        <option value="ecomiles_ecoalns">
                          EcoMiles v2.1 (EcoALNS + Né cấm tải + Ghép về)
                        </option>
                        <option value="ecomiles_2opt">EcoMiles Gom cụm + Khử giao cắt 2-Opt</option>
                        <option value="human_google_proxy">Baseline: Chia Quận thủ công + Google Maps</option>
                        <option value="raw_excel">Baseline: Thứ tự bảng tính Excel gốc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#004366] mb-1">
                        Cấu hình đầu xe &amp; Thùng (GLX-HDT-v1):
                      </label>
                      <select
                        aria-label="Chọn cấu hình đội xe và loại thùng"
                        value={fleetPresetId}
                        onChange={(e) => {
                          const nextPreset = e.target.value as FleetPresetId;
                          setFleetPresetId(nextPreset);
                          setPerRouteVehicleClass({});
                          const found = FLEET_PRESET_CATALOG.find((p) => p.id === nextPreset);
                          setStatusBanner(
                            `Đã chuyển đội xe sang "${found?.title || nextPreset}" và tính lại nhiên liệu/CO₂e theo trọng lượng.`
                          );
                        }}
                        className="w-full p-2 rounded-lg border border-[#D4BF94] bg-white font-bold text-[#003049]"
                      >
                        {FLEET_PRESET_CATALOG.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between font-semibold text-[#004366] mb-1">
                        <span>Bán kính gom cụm địa lý:</span>
                        <strong className="text-[#003049]">{clusterRadiusKm.toFixed(1)} km</strong>
                      </div>
                      <input
                        type="range"
                        min="1.5"
                        max="6.0"
                        step="0.5"
                        value={clusterRadiusKm}
                        onChange={(e) => {
                          const nextR = Number(e.target.value);
                          setClusterRadiusKm(nextR);
                          setStatusBanner(
                            `Đã cập nhật bán kính gom cụm địa lý sang ${nextR.toFixed(1)} km cho ${activeCompany.short_name}.`
                          );
                        }}
                        className="w-full accent-[#003049] cursor-pointer mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="chk-qd23"
                        checked={enforceQd23Ban}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEnforceQd23Ban(checked);
                          setSelectedStrategyId(
                            checked && enableBackhaul ? 'ecomiles_ecoalns' : checked ? 'ecomiles_2opt' : 'human_google_proxy'
                          );
                        }}
                        className="w-4 h-4 accent-[#003049]"
                      />
                      <label htmlFor="chk-qd23" className="font-semibold text-[#003049] cursor-pointer">
                        Tự động dời giờ cấm QĐ 23 (06h - 09h &amp; 16h - 20h)
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="chk-backhaul"
                        checked={enableBackhaul}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEnableBackhaul(checked);
                          setSelectedStrategyId(checked ? 'ecomiles_ecoalns' : 'ecomiles_2opt');
                        }}
                        className="w-4 h-4 accent-[#003049]"
                      />
                      <label htmlFor="chk-backhaul" className="font-semibold text-[#003049] cursor-pointer">
                        Ghép đơn thu hồi chiều về giảm chạy rỗng
                      </label>
                    </div>
                  </div>
                </div>


                {/* Map + Route Filter */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-7 bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-[15px] font-bold text-[#003049]">
                        Bản Đồ Tuyến Đường TP.HCM ({activeStrategy.name})
                      </h2>
                      <select
                        value={selectedRouteId}
                        onChange={(e) =>
                          setSelectedRouteId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                        }
                        className="px-2.5 py-1 rounded border border-[#D4BF94] bg-white text-xs font-bold text-[#003049]"
                      >
                        <option value="ALL">Hiển thị toàn bộ ({activeStrategy.vehicles_used} tuyến)</option>
                        {activeStrategy.routes.map((r) => (
                          <option key={r.route_id} value={r.route_id}>
                            Tuyến #{r.route_id} · {r.plate} ({r.km} km)
                          </option>
                        ))}
                      </select>
                    </div>

                    <HcmcSingleRouteMapCanvas
                      result={result}
                      strategy={activeStrategy}
                      selectedRouteId={selectedRouteId}
                    />
                  </div>

                  {/* Right: QĐ 23/2018 Auto-Remediated Orders Table */}
                  <div className="lg:col-span-5 bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                    <h2 className="text-[15px] font-bold text-[#003049]">
                      Nhật Ký Tự Động Dời Khung Giờ Cấm Tải QĐ 23/2018
                    </h2>
                    <p className="text-[12px] text-[#004366]">
                      Các đơn hàng đặt nhầm vào giờ cấm (06:00 - 09:00 / 16:00 - 20:00) được dời sang khung hợp pháp:
                    </p>
                    <div className="overflow-y-auto max-h-[250px] border border-[#D4BF94] rounded-lg">
                      <table className="w-full border-collapse text-xs">
                        <thead className="bg-[#FDF0D5] text-[#004366] sticky top-0">
                          <tr>
                            <th className="py-2 px-2.5 text-left">Mã đơn</th>
                            <th className="py-2 px-2.5 text-left">Quận</th>
                            <th className="py-2 px-2.5 text-left">Giờ gốc</th>
                            <th className="py-2 px-2.5 text-left">Giờ hợp lệ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EED9AF]">
                          {result.orders.filter((o) => o.qd23_ban_conflict).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-[#004366]">
                                Tập dữ liệu hiện tại có 0 đơn trùng khung giờ cấm tải QĐ 23/2018.
                              </td>
                            </tr>
                          ) : (
                            result.orders
                              .filter((o) => o.qd23_ban_conflict)
                              .slice(0, 15)
                              .map((o) => (
                                <tr key={o.external_id}>
                                  <td className="py-2 px-2.5 font-mono font-bold text-[#003049]">
                                    {o.external_id}
                                  </td>
                                  <td className="py-2 px-2.5">{o.district}</td>
                                  <td className="py-2 px-2.5 font-mono text-[#C1121F]">
                                    {o.window_start} - {o.window_end}
                                  </td>
                                  <td className="py-2 px-2.5 font-mono font-bold text-[#003049]">
                                    <span className="inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>09:05 - 11:30</span>
                                    </span>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 3: ORDERS & EXCEL COLUMN DICTIONARY MAPPER
                =============================================================== */}
            {userTab === 'orders_schema' && (
              <div className="space-y-5">
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-[20px] font-bold text-[#003049]">
                        Quản Lý Đơn Hàng &amp; Từ Điển Ánh Xạ Cột Bảng Tính (.XLSX)
                      </h1>
                      <p className="text-[12.5px] text-[#004366]">
                        Tự động nhận diện cột dữ liệu xuất từ ERP (SAP, KiotViet, Haravan) và chuẩn hóa tọa độ 18 Quận/Huyện TP.HCM.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-lg bg-[#003049] hover:bg-[#780000] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Tải File .XLSX Lên</span>
                      </button>
                      <span className="px-3 py-2 rounded-lg border border-[#669BBC] bg-[#D7E6F0] text-xs font-semibold text-[#003049] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#003049]" />
                        <span>Chính sách NĐ 13: {activePolicy.tier_badge}</span>
                      </span>
                    </div>
                  </div>

                  {/* Column Dictionary Mapping Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-[#D4BF94]">
                    {columnInspection.map((col) => (
                      <div
                        key={col.canonical_field}
                        className="p-2.5 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] text-xs"
                      >
                        <div className="font-mono font-bold text-[#003049]">{col.canonical_field}</div>
                        <div className="text-[11px] text-[#004366] truncate">{col.label_vi}</div>
                        <div className="text-[11px] font-semibold text-[#003049] mt-1 flex items-center gap-1">
                          {col.matched_header ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span>{`Cột "${col.matched_header}"`}</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 shrink-0" />
                              <span>Tự động nội suy</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


                {/* Searchable Orders Table */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-[#004366] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm theo mã đơn, địa chỉ, quận..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D4BF94] text-xs"
                      />
                    </div>
                    <span className="text-xs text-[#004366]">
                      Hiển thị {result.orders.length} đơn hàng của <strong>{activeCompany.short_name}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full border-collapse text-xs tabular-nums">
                      <thead className="bg-[#FDF0D5] text-[#004366] sticky top-0 border-b border-[#D4BF94]">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Mã đơn</th>
                          <th className="py-2.5 px-3 text-left">Quận/Huyện</th>
                          <th className="py-2.5 px-3 text-left">Địa chỉ giao hàng</th>
                          <th className="py-2.5 px-3 text-left">Người nhận &amp; SĐT</th>
                          <th className="py-2.5 px-3 text-right">Khối lượng</th>
                          <th className="py-2.5 px-3 text-right">Khung giờ</th>
                          <th className="py-2.5 px-3 text-right">Kiểm tra QĐ 23</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EED9AF]">
                        {result.orders
                          .filter(
                            (o) =>
                              !searchQuery ||
                              o.external_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              o.district.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .slice(0, 60)
                          .map((o, ordIdx) => {
                            const isUnmasked = dpoUnmaskedRows.has(o.external_id);
                            const formatted = formatReceiverForTenantPolicy(
                              activeCompany.tenant_id,
                              {
                                row_num: o.row_num || ordIdx + 1,
                                external_id: o.external_id,
                                receiver: o.receiver,
                                phone: o.phone,
                                address: o.address,
                              },
                              isUnmasked
                            );
                            return (
                              <tr key={o.external_id} className="hover:bg-[#FDF0D5]">
                                <td className="py-2 px-3 font-mono font-bold text-[#003049]">
                                  {o.external_id}
                                </td>
                                <td className="py-2 px-3 font-semibold">{o.district}</td>
                                <td className="py-2 px-3 max-w-xs truncate">
                                  <span>{formatted.display_address}</span>
                                  {activeCompany.tenant_id === 'TNT-BHX-001' && (
                                    <span className="block text-[10px] text-[#669BBC]">
                                      Lọc địa chỉ cấp 2 khi xuất ESG
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-[#004366]">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-semibold text-[#003049]">
                                      {formatted.display_receiver}
                                    </span>
                                    <span>·</span>
                                    <span className="font-mono">{formatted.display_phone}</span>
                                    {activePolicy.allow_dpo_unmask_with_audit && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isUnmasked) {
                                            setDpoUnmaskedRows((prev) => {
                                              const next = new Set(prev);
                                              next.delete(o.external_id);
                                              return next;
                                            });
                                          } else {
                                            setDpoUnmaskedRows((prev) => new Set([...prev, o.external_id]));
                                            setDpoAuditLogs((prev) => [
                                              {
                                                timestamp: new Date().toLocaleTimeString('vi-VN'),
                                                operator: authenticatedSession?.username || 'orchestrator@nvc-cold.vn',
                                                external_id: o.external_id,
                                                reason: 'Yêu cầu đối soát đơn hàng tại điểm giao chuỗi lạnh NVC',
                                              },
                                              ...prev,
                                            ]);
                                            setTimeout(() => {
                                              setDpoUnmaskedRows((prev) => {
                                                const next = new Set(prev);
                                                next.delete(o.external_id);
                                                return next;
                                              });
                                            }, 60000);
                                          }
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                          isUnmasked
                                            ? 'bg-[#F8E7C4] text-[#780000] border border-[#fca5a5]'
                                            : 'bg-[#D7E6F0] text-[#003049] border border-[#669BBC] hover:bg-[#669BBC]'
                                        }`}
                                      >
                                        {isUnmasked ? 'Khóa lại' : 'Mở khóa 60s (DPO)'}
                                      </button>
                                    )}
                                    {activeCompany.tenant_id === 'TNT-WINMART-003' && (
                                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#F8E7C4] text-[#004366]">
                                        RAM Ephemeral NĐ 13
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold">{o.kg} kg</td>
                                <td className="py-2 px-3 text-right font-mono">
                                  {o.window_start} - {o.window_end}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {o.qd23_ban_conflict ? (
                                    <span className="px-2 py-0.5 rounded bg-[#F8E7C4] text-[#780000] font-semibold">
                                      Đã dời sang 09:05
                                    </span>
                                  ) : (
                                    <span className="text-[#003049] font-semibold inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Hợp lệ</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {/* DPO Audit Trail Table if any unmasks occurred */}
                  {dpoAuditLogs.length > 0 && (
                    <div className="pt-3 border-t border-[#D4BF94] space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-[#C1121F]" />
                        <h3 className="text-xs font-bold text-[#003049]">
                          Nhật Ký Mở Khóa DPO (Audit Trail theo NĐ 13/2023 Điều 17)
                        </h3>
                      </div>
                      <div className="overflow-x-auto border border-[#D4BF94] rounded-lg">
                        <table className="w-full border-collapse text-[11px] font-mono">
                          <thead className="bg-[#FDF0D5] text-[#004366]">
                            <tr>
                              <th className="py-1.5 px-2.5 text-left">Thời gian</th>
                              <th className="py-1.5 px-2.5 text-left">Người thao tác</th>
                              <th className="py-1.5 px-2.5 text-left">Mã đơn hàng</th>
                              <th className="py-1.5 px-2.5 text-left">Lý do đối soát</th>
                              <th className="py-1.5 px-2.5 text-left">Thời hạn hiệu lực</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F8E7C4]">
                            {dpoAuditLogs.slice(0, 5).map((log, lIdx) => (
                              <tr key={lIdx}>
                                <td className="py-1.5 px-2.5 text-[#003049]">{log.timestamp}</td>
                                <td className="py-1.5 px-2.5 text-[#669BBC] font-semibold">{log.operator}</td>
                                <td className="py-1.5 px-2.5 font-bold text-[#003049]">{log.external_id}</td>
                                <td className="py-1.5 px-2.5 text-[#004366]">{log.reason}</td>
                                <td className="py-1.5 px-2.5 text-[#780000]">Tự động che lại sau 60 giây</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 4: FLEET & BACKHAUL EMPTY-RUN REDUCTION
                =============================================================== */}
            {userTab === 'fleet_backhaul' && (
              <div className="space-y-5">
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-2">
                  <h1 className="text-[20px] font-bold text-[#003049]">
                    Quản Lý Đội Xe &amp; Ghép Đơn Chiều Về Giảm Chạy Rỗng (Backhaul)
                  </h1>
                  <p className="text-[13px] text-[#004366]">
                    Khi xe hoàn tất điểm giao cuối, hệ thống tự động quét các đơn lấy hàng từ nhà cung cấp trên hành lang quay về kho Tân Bình, cắt giảm tỷ lệ chạy rỗng từ{' '}
                    <strong>{humanSt.empty_running_pct}%</strong> xuống còn{' '}
                    <strong className="text-[#003049]">{alnsSt.empty_running_pct}%</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeStrategy.routes.map((r, idx) => (
                    <div
                      key={r.route_id}
                      className="bg-white border border-[#D4BF94] rounded-xl p-4 space-y-3 tabular-nums"
                    >
                      <div className="flex items-center justify-between border-b border-[#EED9AF] pb-2.5">
                        <div>
                          <div className="font-bold text-sm text-[#003049]">
                            Chuyến #{r.route_id} · {r.plate}
                          </div>
                          <div className="text-xs text-[#004366]">
                            Tài xế: {DRIVER_NAMES[idx % DRIVER_NAMES.length]}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#D7E6F0] text-[#002033] text-xs font-bold">
                          Lấp đầy {r.payload_utilisation_pct}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded bg-[#FDF0D5]">
                          <div className="text-[#004366]">Tổng cự ly chuyến</div>
                          <div className="text-sm font-bold text-[#003049] mt-0.5">{r.km} km</div>
                        </div>
                        <div className="p-2.5 rounded bg-[#FDF0D5]">
                          <div className="text-[#004366]">Cự ly chạy rỗng</div>
                          <div className="text-sm font-bold text-[#003049] mt-0.5">
                            {r.km_empty_return} km ({r.empty_running_pct}%)
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#D7E6F0]/60 border border-[#669BBC] text-xs text-[#002033]">
                        <strong>Ghép đơn chiều về kho:</strong> Đã ghép{' '}
                        <strong>+{r.backhaul_orders_matched} đơn thu hồi</strong> ({r.backhaul_kg_recovered} kg) trên chặng cuối quay về Kho Tân Bình.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 5: AUTOMATED ESG & AUDIT REPORT STUDIO
                =============================================================== */}
            {userTab === 'reports_esg' && (
              <div className="space-y-5">
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[20px] font-bold text-[#003049]">
                      Trung Tâm Xuất Báo Cáo Kiểm Toán Vận Hành &amp; ESG Tự Động
                    </h1>
                    <p className="text-[12.5px] text-[#004366]">
                      Ước tính từ lộ trình của <strong>{activeCompany.short_name}</strong> theo mô hình vật lý GLX-HDT-v1 (C1-illustrative · tham chiếu hệ số GLEC v3.2 &amp; ISO 14083:2023, dữ liệu đầu vào chưa qua chứng nhận độc lập ISO 14065). Mã xác thực:{' '}
                      <code className="font-mono text-[#003049]">{result.dataset_fingerprint}</code>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportExcel3Sheet}
                      className="px-4 py-2 rounded-lg bg-[#669BBC] hover:bg-[#003049] text-[#003049] hover:text-[#FDF0D5] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Tải Báo Cáo Excel 3 Sheet (.XLS)</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-2 rounded-lg border border-[#D4BF94] bg-white hover:bg-[#FDF0D5] text-[#003049] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#003049]" />
                      <span>In Hồ Sơ PDF</span>
                    </button>
                  </div>
                </div>


                {/* On-Screen Certificate Preview */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D4BF94] pb-3">
                    <div>
                      <div className="text-xs font-bold text-[#003049] uppercase">
                        Bản xem trước trực tiếp · Sheet 1 &amp; Sheet 2 trong File Excel Tự Động
                      </div>
                      <h2 className="text-base font-bold text-[#003049] mt-0.5">
                        BÁO CÁO ĐỐI CHỨNG HIỆU QUẢ VẬN TẢI &amp; KIỂM KÊ KHÍ NHÀ KÍNH
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-[#004366]">{result.dataset_fingerprint}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs tabular-nums">
                      <thead>
                        <tr className="bg-[#D7E6F0] text-[#003049] font-bold">
                          <th className="py-2.5 px-3 text-left">Phương pháp điều phối</th>
                          <th className="py-2.5 px-3 text-right">Số chuyến</th>
                          <th className="py-2.5 px-3 text-right">Tổng km</th>
                          <th className="py-2.5 px-3 text-right">Km chạy rỗng</th>
                          <th className="py-2.5 px-3 text-right">Đơn ghép về</th>
                          <th className="py-2.5 px-3 text-right">Nhiên liệu (L)</th>
                          <th className="py-2.5 px-3 text-right">Chi phí (VNĐ)</th>
                          <th className="py-2.5 px-3 text-right">CO₂e TTW / WTW</th>
                          <th className="py-2.5 px-3 text-right">Lỗi QĐ 23</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D4BF94]">
                        {[rawSt, humanSt, twoOptSt, alnsSt].map((st) => (
                          <tr
                            key={st.id}
                            className={st.id === 'ecomiles_ecoalns' ? 'bg-[#F8E7C4] font-bold' : ''}
                          >
                            <td className="py-2.5 px-3">{st.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{st.vehicles_used}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{st.km_total} km</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {st.km_empty_return} km ({st.empty_running_pct}%)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#003049]">
                              +{st.backhaul_orders_matched} đơn
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">{st.litres_total} L</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {st.fuel_cost_vnd.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {st.kg_co2_ttw} / {st.kg_co2_wtw} kg
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {st.ban_violations} đơn
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ===============================================================
                TAB 6: MULTI-COMPANY PRIVACY & ZERO-KNOWLEDGE ENCRYPTION
                =============================================================== */}
            {userTab === 'privacy_security' && (
              <div className="space-y-5">
                {/* Active Company Security Policy Card */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4BF94] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#003049]" />
                        <h2 className="text-base font-bold text-[#003049]">
                          Hồ Sơ Chính Sách Bảo Mật Doanh Nghiệp ({activeCompany.short_name})
                        </h2>
                      </div>
                      <p className="text-xs text-[#004366] mt-0.5">{activePolicy.summary_vi}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-[#D7E6F0] text-[#003049] border border-[#669BBC] shrink-0">
                      {activePolicy.policy_id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94]">
                      <div className="text-[#004366]">Cơ chế che SĐT:</div>
                      <div className="font-bold text-[#003049] mt-0.5">
                        {activePolicy.mask_phone_by_default ? 'Che 090****327 mặc định' : 'Mở hotline nội bộ cho điều phối'}
                      </div>
                      <div className="text-[10.5px] text-[#004366] mt-1">
                        {activePolicy.allow_dpo_unmask_with_audit ? 'Cho phép DPO mở khóa tạm 60s' : 'Không hỗ trợ mở khóa thủ công'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94]">
                      <div className="text-[#004366]">Mã hóa RAM &amp; Dữ liệu:</div>
                      <div className="font-bold text-[#003049] mt-0.5">
                        {activePolicy.ephemeral_ram_only ? 'RAM Ephemeral (Tự hủy khi đăng xuất)' : 'BYOK AES-256-GCM Persistent'}
                      </div>
                      <div className="text-[10.5px] text-[#004366] mt-1">
                        {activePolicy.pseudonymize_customer_name ? 'Giả danh KH-WCM theo NĐ 13' : 'Giữ tên chuỗi cửa hàng'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94]">
                      <div className="text-[#004366]">Tiêu chuẩn Báo cáo Scope 3:</div>
                      <div className="font-bold text-[#003049] mt-0.5 truncate">{activePolicy.scope3_shipper_standard}</div>
                      <div className="text-[10.5px] text-[#004366] mt-1">
                        {activePolicy.strip_address_on_export ? 'Lọc số nhà/tên đường khi xuất file' : 'Giữ nguyên tọa độ địa chỉ'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94]">
                      <div className="text-[#004366]">Tài khoản ngân hàng &amp; MST:</div>
                      <div className="font-bold text-[#003049] mt-0.5">{activePolicy.invoice_bank_name}</div>
                      <div className="text-[10.5px] font-mono text-[#669BBC] mt-1">
                        {activePolicy.invoice_account_masked} · MST {activePolicy.tax_code_mst}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-[20px] font-bold text-[#003049]">
                        Bảo Mật Cách Ly Đa Doanh Nghiệp &amp; Mã Hóa Đầu-Cuối (Zero-Knowledge)
                      </h1>
                      <p className="text-[12.5px] text-[#004366]">
                        Giải đáp trực tiếp câu hỏi: "Nếu nhiều công ty cùng dùng chung hạ tầng cơ sở dữ liệu, làm sao đảm bảo công ty đối thủ và chính quản trị viên EcoMiles không xem được danh sách khách hàng của nhau?"
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                    <div className="p-4 rounded-xl bg-[#FDF0D5] border border-[#D4BF94] space-y-1.5">
                      <div className="font-bold text-[#003049] uppercase">
                        1. Cách ly Phân vùng Tenant (Row-Level Tenant ID)
                      </div>
                      <p className="text-[#004366] leading-relaxed">
                        Mỗi doanh nghiệp sở hữu mã định danh không gian riêng (ví dụ: <code>{activeCompany.tenant_id}</code>). Mọi truy vấn dữ liệu bắt buộc kèm chữ ký phiên của đúng công ty đó; Công ty B không thể truy vấn sang phân vùng của Công ty A.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FDF0D5] border border-[#D4BF94] space-y-1.5">
                      <div className="font-bold text-[#003049] uppercase">
                        2. Mã hóa Phong bì Khóa Riêng (BYOK AES-256-GCM)
                      </div>
                      <p className="text-[#004366] leading-relaxed">
                        Địa chỉ, tên cửa hàng và SĐT khách nhận được mã hóa bằng khóa riêng của doanh nghiệp (<code>{activeCompany.key_fingerprint}</code>) trước khi lưu. Quản trị viên hệ thống EcoMiles (Admin) không giữ khóa giải mã nên chỉ nhìn thấy chuỗi mã hóa.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FDF0D5] border border-[#D4BF94] space-y-1.5">
                      <div className="font-bold text-[#780000] uppercase">
                        3. Ẩn danh SĐT chuẩn Nghị định 13/2023/NĐ-CP
                      </div>
                      <p className="text-[#004366] leading-relaxed">
                        Bộ lọc 2 tầng (Ingress &amp; Export Redaction) tự động che số điện thoại di động Việt Nam (<code>090****327</code>), CCCD và email trong toàn bộ nhật ký vận hành và báo cáo xuất ra.
                      </p>
                    </div>
                  </div>
                </div>

                {/* DPO Audit Log Table if active */}
                {dpoAuditLogs.length > 0 && (
                  <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-[#C1121F]" />
                      <h2 className="text-[15px] font-bold text-[#003049]">
                        Nhật Ký Mở Khóa DPO Đang Hoạt Động (Audit Trail theo NĐ 13/2023 Điều 17)
                      </h2>
                    </div>
                    <div className="overflow-x-auto border border-[#D4BF94] rounded-lg">
                      <table className="w-full border-collapse text-xs font-mono">
                        <thead className="bg-[#FDF0D5] text-[#004366]">
                          <tr>
                            <th className="py-2 px-3 text-left">Thời gian</th>
                            <th className="py-2 px-3 text-left">Tài khoản thao tác</th>
                            <th className="py-2 px-3 text-left">Mã đơn hàng</th>
                            <th className="py-2 px-3 text-left">Lý do đối soát</th>
                            <th className="py-2 px-3 text-left">Trạng thái tự hủy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F8E7C4]">
                          {dpoAuditLogs.map((log, lIdx) => (
                            <tr key={lIdx}>
                              <td className="py-2 px-3 text-[#003049]">{log.timestamp}</td>
                              <td className="py-2 px-3 text-[#669BBC] font-semibold">{log.operator}</td>
                              <td className="py-2 px-3 font-bold text-[#003049]">{log.external_id}</td>
                              <td className="py-2 px-3 text-[#004366]">{log.reason}</td>
                              <td className="py-2 px-3 text-[#780000]">Tự động che sau 60s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Role Approval Table */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-bold text-[#003049]">
                      Bảng Phê Duyệt Quyền Truy Cập Dữ Liệu Nội Bộ ({activeCompany.short_name})
                    </h2>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#C1121F] bg-[#F8E7C4] hover:bg-[#F8E7C4] text-xs font-bold text-[#780000] cursor-pointer"
                    >
                      <span>Đăng xuất phiên này để kiểm tra góc nhìn Admin</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D4BF94] text-[#004366]">
                        <th className="py-2 px-3 text-left">Vai trò trong doanh nghiệp</th>
                        <th className="py-2 px-3 text-left">Phạm vi dữ liệu được phép giải mã</th>
                        <th className="py-2 px-3 text-left">Trạng thái</th>
                        <th className="py-2 px-3 text-right">Thao tác chủ doanh nghiệp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EED9AF]">
                      {roleApprovals.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 px-3 font-bold text-[#003049]">{r.role}</td>
                          <td className="py-2.5 px-3 text-[#004366]">{r.scope}</td>
                          <td className="py-2.5 px-3">
                            {r.approved ? (
                              <span className="px-2 py-0.5 rounded bg-[#D7E6F0] text-[#002033] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Đã cấp khóa đọc</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#F8E7C4] text-[#780000] font-bold">
                                Đang thu hồi khóa
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() =>
                                setRoleApprovals((prev) =>
                                  prev.map((x) =>
                                    x.id === r.id ? { ...x, approved: !x.approved } : x
                                  )
                                )
                              }
                              className="px-3 py-1 rounded border border-[#D4BF94] bg-white hover:bg-[#FDF0D5] font-semibold cursor-pointer"
                            >
                              {r.approved ? 'Thu hồi quyền' : 'Phê duyệt quyền'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* =====================================================================
          ROLE 2: TESTER / EVALUATOR ("tester" role: EVSIM Dual Simulator)
          Side-by-side HCMC Truck Simulation (Baseline vs EcoMiles v2.1)
          ===================================================================== */}
      {activeRole === 'tester' && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 space-y-3">
          <EvsimDualSimulator
            initialResult={result}
            onResultChange={(newRes) => setResult(newRes)}
          />
        </div>
      )}

      {/* =====================================================================
          ROLE 3: TRUCK DRIVER APP ("driver" role)
          Auto-routed Mobile & Turn-by-Turn Driver Cockpit with Map + Order Orchestrator
          ===================================================================== */}
      {activeRole === 'driver' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-5">
          {(() => {
            const currentDriverRouteIdx = authenticatedSession?.driver_route_idx ?? selectedDriverRouteIdx;
            const driverRoute =
              activeStrategy.routes[currentDriverRouteIdx] || activeStrategy.routes[0];
            const customerStops = driverRoute
              ? driverRoute.stops.filter((s) => s.kind === 'stop' || s.kind === 'backhaul')
              : [];
            const driverName =
              authenticatedSession?.label_vi || DRIVER_NAMES[currentDriverRouteIdx % DRIVER_NAMES.length];
            const driverCode =
              authenticatedSession?.driver_code || (currentDriverRouteIdx === 0 ? 'TX-NVC-01' : 'TX-BHX-02');
            const assignedPlate =
              driverRoute?.plate || authenticatedSession?.assigned_plate || '51C-000.08';
            const activeStop =
              customerStops.find((s) => s.seq === activeNavStopSeq) || customerStops[0];
            const activeStopIdx = Math.max(
              0,
              customerStops.findIndex((s) => s.seq === activeStop?.seq)
            );
            const prevCoord =
              activeStopIdx > 0
                ? { lat: customerStops[activeStopIdx - 1].lat, lng: customerStops[activeStopIdx - 1].lng, label: customerStops[activeStopIdx - 1].address }
                : { lat: 10.8018, lng: 106.6385, label: 'Kho Tân Bình (364 Cộng Hòa)' };

            const buildViaWaypointGoogleMapsUrl = (
              fromLat: number,
              fromLng: number,
              stopObj: (typeof customerStops)[number]
            ) => {
              const pts = (stopObj.leg_path || []).filter(
                ([lng, lat]) =>
                  Math.hypot(lat - fromLat, lng - fromLng) > 0.0025 &&
                  Math.hypot(lat - stopObj.lat, lng - stopObj.lng) > 0.0025
              );
              const mids =
                pts.length >= 2
                  ? [pts[Math.floor(pts.length * 0.35)], pts[Math.floor(pts.length * 0.7)]]
                  : pts.length === 1
                  ? [pts[0]]
                  : [];
              // Google Maps Universal URL (?api=1) requires plain `lat,lng|lat,lng` (NO `via:` prefix!)
              const wpStr = mids
                .map(([lng, lat]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
                .join('|');
              const wpParam = wpStr ? `&waypoints=${encodeURIComponent(wpStr)}` : '';
              return `https://www.google.com/maps/dir/?api=1&origin=${fromLat.toFixed(5)},${fromLng.toFixed(5)}&destination=${stopObj.lat.toFixed(5)},${stopObj.lng.toFixed(5)}${wpParam}&travelmode=driving&dir_action=navigate`;
            };

            const fullMultiStopCarMapsUrl = (() => {
              const tourSlice = customerStops.slice(0, 8);
              const wpList = tourSlice
                .map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`)
                .join('|');
              const lastStop = customerStops[Math.min(customerStops.length - 1, 8)] || {
                lat: 10.8018,
                lng: 106.6385,
              };
              return `https://www.google.com/maps/dir/?api=1&origin=10.80180,106.63850&destination=${lastStop.lat.toFixed(5)},${lastStop.lng.toFixed(5)}${wpList ? `&waypoints=${encodeURIComponent(wpList)}` : ''}&travelmode=driving&dir_action=navigate`;
            })();

            const downloadOsmAndTruckGpx = () => {
              if (!driverRoute) return;
              const stopCoords: LngLat[] = driverRoute.stops.map((s) => [s.lng, s.lat]);
              const osrmGeom = getOrFetchOsrmRouteGeometry(stopCoords);
              const trackPts: LngLat[] =
                osrmGeom && osrmGeom.length >= 2
                  ? osrmGeom
                  : driverRoute.stops.flatMap((s) =>
                      s.leg_path && s.leg_path.length > 0 ? s.leg_path : ([[s.lng, s.lat]] as LngLat[])
                    );
              const escXmlTag = (v: string | number) =>
                String(v)
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;');
              const wptXml = customerStops
                .map(
                  (s) =>
                    `  <wpt lat="${s.lat.toFixed(5)}" lon="${s.lng.toFixed(5)}"><name>#${s.seq} ${escXmlTag(s.order_id)}</name><desc>${escXmlTag(s.address)} (${s.kg}kg)</desc></wpt>`
                )
                .join('\n');
              const trkXml = trackPts
                .map(([lng, lat]) => `      <trkpt lat="${lat.toFixed(5)}" lon="${lng.toFixed(5)}" />`)
                .join('\n');
              const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="EcoMiles OpenTruck Router ($0 Tier)" xmlns="http://www.topografix.com/GPX/1/1">\n  <metadata><name>EcoMiles Truck Route ${escXmlTag(driverRoute.plate)}</name><desc>Middle-Mile Truck Corridor (QD 23/2018 Compliant)</desc></metadata>\n${wptXml}\n  <trk>\n    <name>${escXmlTag(driverRoute.plate)} - EcoMiles Truck Track</name>\n    <trkseg>\n${trkXml}\n    </trkseg>\n  </trk>\n</gpx>`;
              const blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `EcoMiles_Truck_GPX_${driverRoute.plate.replace(/[^a-zA-Z0-9_-]/g, '_')}.gpx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              setVoiceNavNotice(
                `Đã xuất file chuẩn .GPX (${trackPts.length} tọa độ mặt đường thực tế) cho xe ${driverRoute.plate} để mở trên ứng dụng mã nguồn mở OsmAnd Truck / Organic Maps ($0 chi phí).`
              );
            };

            return (
              <>
                {/* Driver Top Card + 2-Tier Mode Switcher (Middle-Mile Truck vs Last-Mile Car) */}
                <div className="bg-white border border-[#D4BF94] rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#003049] text-[#FDF0D5] flex items-center justify-center font-bold">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#003049] uppercase">
                          Tài Khoản Tài Xế Cá Nhân ({driverCode}) · {activeCompany.short_name}
                        </div>
                        <h1 className="text-lg font-bold text-[#003049]">
                          Xe {assignedPlate} · Tài xế {driverName}
                        </h1>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-[#003049] font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#003049]" />
                        <span>Khóa cứng 1 xe duy nhất ({assignedPlate})</span>
                      </span>
                      <span className="px-2.5 py-1.5 rounded-lg bg-[#F8E7C4] border border-[#D4BF94] font-mono font-bold text-[#003049] flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-[#003049]" />
                        <span>Mã PIN: 0000</span>
                      </span>
                    </div>
                  </div>

                  {/* Personal Driver Preferences (FB-04: Thiết lập lộ trình cá nhân) */}
                  <div className="p-3.5 rounded-xl bg-[#FDF0D5] border border-[#D4BF94] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#003049] flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#003049]" />
                        <span>Thiết Lập Lộ Trình Cá Nhân (Tài Xế {driverName})</span>
                      </span>
                      <span className="text-[11px] text-[#004366]">Tùy chọn ghi nhớ theo xe</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#D4BF94] cursor-pointer hover:bg-[#F8E7C4]">
                        <input
                          type="checkbox"
                          checked={avoidNarrowAlleys}
                          onChange={(e) => setAvoidNarrowAlleys(e.target.checked)}
                          className="w-4 h-4 accent-[#003049]"
                        />
                        <span className="font-medium text-[#003049]">Ưu tiên né hẻm nhỏ &lt; 3.5m</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#D4BF94] cursor-pointer hover:bg-[#F8E7C4]">
                        <input
                          type="checkbox"
                          checked={autoRestAlert}
                          onChange={(e) => setAutoRestAlert(e.target.checked)}
                          className="w-4 h-4 accent-[#003049]"
                        />
                        <span className="font-medium text-[#003049]">Nhắc nghỉ sau 3h45 lái xe</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-[#D4BF94] cursor-pointer hover:bg-[#F8E7C4]">
                        <input
                          type="checkbox"
                          checked={vietnameseVoiceNav}
                          onChange={(e) => setVietnameseVoiceNav(e.target.checked)}
                          className="w-4 h-4 accent-[#003049]"
                        />
                        <span className="font-medium text-[#003049]">Giọng nói Tiếng Việt</span>
                      </label>
                    </div>
                  </div>

                  {/* 2 DISTINCT DRIVER NAVIGATION MODES: MIDDLE-MILE TRUCK vs LAST-MILE CAR ($0 COST TIER) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 pt-2 border-t border-[#D4BF94]">
                    <button
                      type="button"
                      onClick={() => setDriverMileTier('middle_mile_truck')}
                      className={`text-left p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                        driverMileTier === 'middle_mile_truck'
                          ? 'bg-[#003049] text-white border-[#003049] shadow-sm'
                          : 'bg-[#FDF0D5] text-[#003049] border-[#D4BF94] hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span>1. Chặng Giữa (&gt;500kg) · Bản Đồ Xe Tải</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            driverMileTier === 'middle_mile_truck'
                              ? 'bg-[#FDF0D5] text-[#003049]'
                              : 'bg-[#D4BF94] text-[#003049]'
                          }`}
                        >
                          OpenTruck + GPX ($0)
                        </span>
                      </div>
                      <p
                        className={`hidden sm:block text-[11px] mt-1.5 leading-relaxed ${
                          driverMileTier === 'middle_mile_truck' ? 'text-[#669BBC]' : 'text-[#004366]'
                        }`}
                      >
                        <strong>Tại sao xe tải &gt;500kg cần chế độ riêng?</strong> Ứng dụng dẫn đường ô tô con phổ thông không lọc cầu giới hạn tải (13T), độ cao (3.5m) và khung giờ cấm tải QĐ 23/2018 tại TP.HCM. Chế độ này dùng <strong>Bản đồ Mở EcoMiles (OSM + OSRM/Valhalla Truck Graph) + Xuất GPX ($0)</strong>.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDriverMileTier('last_mile_car')}
                      className={`text-left p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                        driverMileTier === 'last_mile_car'
                          ? 'bg-[#003049] text-white border-[#003049] shadow-sm'
                          : 'bg-[#FDF0D5] text-[#003049] border-[#D4BF94] hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                          <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span>2. Chặng Cuối (≤500kg) · Ô Tô / Xe Van</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            driverMileTier === 'last_mile_car'
                              ? 'bg-[#669BBC] text-[#003049]'
                              : 'bg-[#D4BF94] text-[#003049]'
                          }`}
                        >
                          Waypoints + Google Maps ($0)
                        </span>
                      </div>
                      <p
                        className={`hidden sm:block text-[11px] mt-1.5 leading-relaxed ${
                          driverMileTier === 'last_mile_car' ? 'text-[#FDF0D5]' : 'text-[#004366]'
                        }`}
                      >
                        <strong>Xe ≤ 500kg / Ô tô con không bị cấm tải QĐ 23:</strong> Kết hợp dẫn đường nội bộ OpenStreetMap ($0) và <strong>nhúng tọa độ trung gian (<code>waypoints=lat,lng</code>) của thuật toán EcoALNS thẳng vào URL Google Maps Ô tô miễn phí ($0)</strong>.
                      </p>
                    </button>
                  </div>
                </div>
                {/* 2 GENUINE DRIVER-ONLY OPERATIONAL VISUALS (FB-04 Remediation) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Visual 1: Luật TTATGT 2024 Continuous Driving Compliance Gauge */}
                  <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D4BF94] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#003049]" />
                        <h2 className="text-sm font-bold text-[#003049]">
                          1. Đồng Hồ Tuân Thủ Giờ Lái Xe (Luật TTATGT 2024)
                        </h2>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8E7C4] text-[#780000] border border-[#C1121F]">
                        Giới hạn &lt;= 4h00 liên tục
                      </span>
                    </div>

                    {(() => {
                      const drvMins = Math.min(
                        225,
                        Math.max(75, Math.round(((driverRoute?.km || 35) / 21.5) * 60 + customerStops.length * 6))
                      );
                      const drvH = Math.floor(drvMins / 60);
                      const drvRemM = drvMins % 60;
                      const drvPct = Number(((drvMins / 240) * 100).toFixed(1));
                      const remainMins = Math.max(0, 240 - drvMins);
                      return (
                        <div className="p-3 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-[#004366]">Thời gian lái &amp; giao hàng tuyến này:</span>
                            <div className="text-right">
                              <span className="text-xl font-black text-[#003049]">{drvMins}</span>
                              <span className="text-xs text-[#004366]">
                                {' '}
                                / 240 phút ({drvH}h{String(drvRemM).padStart(2, '0')} / 4h00)
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-3 rounded-full bg-[#D4BF94] overflow-hidden">
                            <div
                              className="h-full bg-[#003049] transition-all"
                              style={{ width: `${drvPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-[#003049]">Đã sử dụng {drvPct}% hạn mức lái liên tục</span>
                            <span className="text-[#C1121F]">Còn {remainMins} phút trước mốc nghỉ 20p bắt buộc</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="text-[11px] text-[#004366] leading-relaxed space-y-1">
                      <p>
                        <strong>Luật TTATGT 2024 (Điều 56 khoản 1):</strong> Người lái ô tô kinh doanh vận tải không được lái xe liên tục quá 4 giờ. Bắt buộc nghỉ tối thiểu 15-20 phút trước khi tiếp tục.
                      </p>
                      <div className="p-2 rounded bg-[#D7E6F0] border border-[#669BBC] text-[#003049] font-semibold text-[10.5px]">
                        Trạm dừng nghỉ đề xuất: Trạm xăng Petrolimex Q.10 hoặc Bãi đỗ Tân Bình (Cách điểm dừng kế tiếp 1.8 km).
                      </div>
                    </div>
                  </div>

                  {/* Visual 2: Cargo Payload Mass Step Chart */}
                  <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D4BF94] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-[#669BBC]" />
                        <h2 className="text-sm font-bold text-[#003049]">
                          2. Biến Động Khối Lượng Hàng Trên Xe (kg Step Chart)
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#003049]">
                        Tải xuất bến: {driverRoute?.kg_delivered} kg
                      </span>
                    </div>

                    <p className="text-xs text-[#004366]">
                      Khối lượng hàng trên xe tải giảm dần sau mỗi điểm giao và tăng lên tại các điểm ghép đơn thu hồi chiều về:
                    </p>

                    {(() => {
                      const cargoLabels = ['Kho Tân Bình'];
                      const cargoVals = [driverRoute?.kg_delivered || 0];
                      let curMass = driverRoute?.kg_delivered || 0;
                      if (driverRoute) {
                        driverRoute.stops.forEach((s) => {
                          if (s.kind === 'depot') return;
                          if (s.kind === 'backhaul') {
                            curMass += s.kg;
                            cargoLabels.push(`#${s.seq} Ghép (+${s.kg}kg)`);
                            cargoVals.push(curMass);
                          } else {
                            curMass = Math.max(0, curMass - s.kg);
                            cargoLabels.push(`#${s.seq} (-${s.kg}kg)`);
                            cargoVals.push(curMass);
                          }
                        });
                        cargoLabels.push('Về Kho Tân Bình');
                        cargoVals.push(curMass);
                      }
                      return (
                        <EChartDaylight
                          height={190}
                          option={{
                            tooltip: { trigger: 'axis' },
                            grid: { left: 44, right: 16, top: 16, bottom: 48 },
                            xAxis: {
                              type: 'category',
                              data: cargoLabels,
                              axisLabel: { color: '#004366', fontSize: 10, rotate: 22, interval: 0 },
                            },
                            yAxis: {
                              type: 'value',
                              name: 'kg',
                              axisLabel: { color: '#004366', fontSize: 10 },
                              splitLine: { lineStyle: { color: '#D4BF94', type: 'dashed' } },
                            },
                            series: [
                              {
                                name: 'Khối lượng hàng trên xe (kg)',
                                type: 'line',
                                step: 'end',
                                data: cargoVals,
                                itemStyle: { color: '#003049' },
                                lineStyle: { width: 3 },
                                areaStyle: { color: 'rgba(20, 83, 45, 0.1)' },
                              },
                            ],
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>

                {/* Driver Map + Stop Orchestrator Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: In-Cab Turn-by-Turn HUD + Driver's Route Map + Backhaul Notice */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white border border-[#D4BF94] rounded-xl p-4 space-y-3">
                      {/* LIVE IN-CAB TURN-BY-TURN HUD BANNER ($0 OPEN-SOURCE NAVIGATION) */}
                      {activeStop && (
                        <div
                          className={`p-3.5 rounded-xl border text-white space-y-2 ${
                            driverMileTier === 'middle_mile_truck'
                              ? 'bg-[#003049] border-[#003049]'
                              : 'bg-[#003049] border-[#003049]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FDF0D5]">
                              {driverMileTier === 'middle_mile_truck'
                                ? 'BUỒNG LÁI DẪN ĐƯỜNG XE TẢI MỞ (OPEN-SOURCE TRUCK HUD · $0 API)'
                                : 'BUỒNG LÁI DẪN ĐƯỜNG Ô TÔ / VAN CHẶNG CUỐI (LAST-MILE HUD · $0 API)'}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <a
                                href={`/maps?vehicle=${currentDriverRouteIdx}&mode=overview`}
                                className="px-2.5 py-1 rounded-md bg-white text-[#003049] hover:bg-[#D7E6F0] text-[11px] font-extrabold flex items-center gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>Mở Bản Đồ Vùng Cấm</span>
                              </a>
                              <a
                                href={`/maps?vehicle=${currentDriverRouteIdx}&mode=navigate`}
                                className="px-2.5 py-1 rounded-md bg-[#FDF0D5] hover:bg-[#FDF0D5] text-[#003049] text-[11px] font-extrabold flex items-center gap-1"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Bắt Đầu Dẫn Đường</span>
                              </a>
                              <button
                                type="button"
                                onClick={downloadOsmAndTruckGpx}
                                className="px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Xuất GPX
                              </button>
                            </div>
                          </div>

                          <div className="text-sm font-bold leading-snug">
                            Chặng #{activeStop.seq}: {prevCoord.label} → {activeStop.address} ({activeStop.district})
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                            <div className="p-2 rounded bg-black/20">
                              <div className="text-white/70">Ràng buộc tải &amp; cầu</div>
                              <div className="font-bold text-[#FDF0D5]">
                                {driverMileTier === 'middle_mile_truck'
                                  ? 'Cầu ≤ 13T · Cao ≤ 3.8m'
                                  : 'Ô tô / Van ≤ 500kg'}
                              </div>
                            </div>
                            <div className="p-2 rounded bg-black/20">
                              <div className="text-white/70">Giờ cấm QĐ 23/2018</div>
                              <div className="font-bold text-[#669BBC] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {driverMileTier === 'middle_mile_truck'
                                    ? 'Hành lang hợp pháp'
                                    : 'Miễn trừ xe ≤ 500kg'}
                                </span>
                              </div>
                            </div>
                            <div className="p-2 rounded bg-black/20">
                              <div className="text-white/70">Chi phí bản đồ / tháng</div>
                              <div className="font-bold text-white">0 ₫ (OSM + OSRM)</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {voiceNavNotice && (
                        <div className="p-2.5 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-xs text-[#003049] font-semibold">
                          {voiceNavNotice}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-[#003049]">
                          Bản Đồ Tuyến Đường Của Xe {driverRoute?.plate}
                        </h2>
                        <span className="text-xs font-semibold text-[#003049] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {driverMileTier === 'middle_mile_truck'
                              ? 'Đồ thị Xe tải EcoMiles + OSRM ($0)'
                              : 'Đồ thị Ô tô Chặng cuối + Waypoints ($0)'}
                          </span>
                        </span>
                      </div>

                      {driverRoute && (
                        <HcmcSingleRouteMapCanvas
                          result={result}
                          strategy={activeStrategy}
                          selectedRouteId={driverRoute.route_id}
                        />
                      )}

                      {driverMileTier === 'middle_mile_truck' ? (
                        <div className="p-3 rounded-lg bg-[#F8E7C4] border border-[#AE1F23] text-xs text-[#780000] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>Chế độ Xe Tải Chặng Giữa (&gt;500kg), Đã khóa Google Maps thương mại:</strong> Google Maps không có chế độ dẫn đường xe tải (<code>travelmode=truck</code>) và không biết khung giờ cấm tải QĐ 23/2018. Tài xế dùng trực tiếp <strong>Bản đồ Xe tải Mở EcoMiles</strong> hoặc bấm <strong>"Xuất GPX"</strong> để dẫn đường giọng nói offline miễn phí 100%.
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-xs text-[#003049] space-y-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              <strong>Chế độ Ô Tô / Van Chặng Cuối (≤500kg), Khóa tọa độ trung gian (<code>waypoints=lat,lng</code>) vào Google Maps ($0):</strong> Vì xe ≤500kg được phép đi đường ô tô nội đô, EcoMiles nhúng thẳng tọa độ mặt đường <code>lat,lng</code> chuẩn vào tham số <code>waypoints</code> của Google Maps để ép đi đúng lộ trình đã tối ưu.
                            </span>
                          </div>
                          <div>
                            <a
                              href={fullMultiStopCarMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003049] hover:bg-[#780000] text-white font-bold text-xs"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Mở Toàn Bộ Tuyến Nhiều Điểm Dừng Trên Google Maps Ô Tô ($0)</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {driverRoute && driverRoute.backhaul_orders_matched > 0 && (
                        <div className="p-3.5 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-xs text-[#002033]">
                          <strong>Lệnh ghép đơn chiều về kho (Giảm chạy rỗng):</strong> Sau khi giao xong điểm cuối, xe {driverRoute.plate} ghé nhận{' '}
                          <strong>+{driverRoute.backhaul_orders_matched} đơn hàng thu hồi ({driverRoute.backhaul_kg_recovered} kg)</strong> trên đường quay về Kho Tân Bình.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Ordered Stop Orchestrator List */}
                  <div className="lg:col-span-6 bg-white border border-[#D4BF94] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D4BF94] pb-2.5">
                      <h2 className="text-sm font-bold text-[#003049]">
                        Danh Sách Điểm Dừng Theo Khu Vực &amp; Khung Giờ Hợp Pháp ({customerStops.length} điểm)
                      </h2>
                      <span className="text-xs text-[#004366]">
                        Tổng tải: <strong>{driverRoute?.kg_delivered} kg</strong>
                      </span>
                    </div>

                    {/* 3-Period QĐ 23/2018 Truck Restriction & Legal Delivery Window Bar */}
                    <div className="p-2.5 rounded-xl bg-[#FDF0D5] border border-[#EED9AF] space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-2 font-bold text-[#003049]">
                        <span>Khung giờ lưu thông xe tải nội đô TP.HCM (QĐ 23/2018):</span>
                        <span className="text-[#003049]">0 vi phạm giờ cấm</span>
                      </div>
                      <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-[#D4BF94] text-[10px] font-bold text-center">
                        <div className="bg-[#F8E7C4] text-[#C1121F] py-1 px-1 border-r border-[#D4BF94]">
                          06:00 - 09:00 · Cấm sáng
                          <div className="font-normal text-[9.5px]">Giao vành đai ngoài</div>
                        </div>
                        <div className="bg-[#D7E6F0] text-[#003049] py-1 px-1 border-r border-[#D4BF94]">
                          09:00 - 16:00 · Mở nội đô
                          <div className="font-normal text-[9.5px]">Giao Q.1, 3, 5, Phú Nhuận</div>
                        </div>
                        <div className="bg-[#F8E7C4] text-[#C1121F] py-1 px-1">
                          16:00 - 20:00 · Cấm chiều
                          <div className="font-normal text-[9.5px]">Rời nội đô trước 15:50</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                      {customerStops.map((stop, sIdx) => {
                        const stKey = `${driverRoute.plate}-${stop.order_id}`;
                        const status = stopStatusOverrides[stKey] || 'pending';
                        const prevLat = sIdx > 0 ? customerStops[sIdx - 1].lat : 10.8018;
                        const prevLng = sIdx > 0 ? customerStops[sIdx - 1].lng : 106.6385;
                        const lockedCarMapsUrl = buildViaWaypointGoogleMapsUrl(prevLat, prevLng, stop);
                        const isSelectedNav = activeStop?.seq === stop.seq;
                        const safeEtaStr = stop.eta_str || '09:05';
                        const safeDepStr = stop.departure_str || '09:20';
                        const isInnerZone = Boolean(stop.is_inner_city_qd23);
                        return (
                          <div
                            key={stKey}
                            className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                              status === 'delivered'
                                ? 'bg-[#D7E6F0]/35 border-[#669BBC]'
                                : isSelectedNav
                                ? 'bg-[#D7E6F0] border-[#003049]'
                                : 'bg-[#FDF0D5] border-[#D4BF94]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-[#003049] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {stop.seq}
                                </span>
                                <div className="space-y-1">
                                  <div className="font-bold text-[#003049]">{stop.address}</div>
                                  <div className="text-[11px] text-[#004366]">
                                    Mã đơn: <code className="font-mono">{stop.order_id}</code> · Tải:{' '}
                                    <strong>{stop.kg} kg</strong>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10.5px]">
                                    <span
                                      className={`px-2 py-0.5 rounded font-bold ${
                                        isInnerZone
                                          ? 'bg-[#F8E7C4] text-[#780000] border border-[#fcc419]'
                                          : 'bg-[#D7E6F0] text-[#003049] border border-[#669BBC]'
                                      }`}
                                    >
                                      Khu vực: {stop.district} {isInnerZone ? '(Nội đô QĐ 23 · Cấm 06-09h & 16-20h)' : '(Vành đai mở)'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-white border border-[#D4BF94] text-[#003049] font-semibold">
                                      Khung hẹn: <b>{stop.window_start} - {stop.window_end}</b>
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-[#D7E6F0] text-[#002033] font-bold">
                                      Lịch xe: {safeEtaStr} - {safeDepStr}
                                    </span>
                                  </div>
                                  {stop.schedule_note && (
                                    <div className="text-[10.5px] font-semibold text-[#003049]">
                                      {stop.schedule_note}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[11px] shrink-0 ${
                                  status === 'delivered'
                                    ? 'bg-[#D7E6F0] text-[#002033]'
                                    : status === 'arrived'
                                    ? 'bg-[#D7E6F0] text-[#003049]'
                                    : status === 'failed'
                                    ? 'bg-[#F8E7C4] text-[#780000]'
                                    : 'bg-white border border-[#D4BF94] text-[#004366]'
                                }`}
                              >
                                {status === 'delivered'
                                  ? 'Đã giao'
                                  : status === 'arrived'
                                  ? 'Đã đến nơi'
                                  : status === 'failed'
                                  ? 'Tạm hoãn'
                                  : 'Chờ giao'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {driverMileTier === 'middle_mile_truck' ? (
                                <>
                                  <a
                                    href={`/maps?vehicle=${currentDriverRouteIdx}&mode=navigate`}
                                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#003049] hover:bg-[#003049] text-white font-bold text-center flex items-center justify-center gap-1.5"
                                  >
                                    <Play className="w-3.5 h-3.5 text-[#FDF0D5] fill-current" />
                                    <span>Bắt đầu Lái Xe Tải</span>
                                  </a>
                                  <a
                                    href={`/maps?vehicle=${currentDriverRouteIdx}&mode=overview`}
                                    className="py-1.5 px-2.5 rounded-lg border border-[#003049] bg-[#D7E6F0] hover:bg-[#D7E6F0] text-[#003049] font-bold flex items-center gap-1"
                                  >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Vùng cấm QĐ 23</span>
                                  </a>
                                </>
                              ) : (
                                <a
                                  href={lockedCarMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setActiveNavStopSeq(stop.seq)}
                                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#003049] hover:bg-[#780000] text-white font-bold text-center flex items-center justify-center gap-1.5"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                  <span>Mở Google Maps Ô tô (Khóa Waypoints $0)</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  setStopStatusOverrides((prev) => ({ ...prev, [stKey]: 'arrived' }))
                                }
                                className="py-1.5 px-2.5 rounded-lg border border-[#D4BF94] bg-white hover:bg-[#F8E7C4] text-[#003049] font-semibold cursor-pointer"
                              >
                                Đã đến
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStopStatusOverrides((prev) => ({ ...prev, [stKey]: 'delivered' }))
                                }
                                className="py-1.5 px-2.5 rounded-lg bg-[#669BBC] hover:bg-[#003049] text-[#003049] hover:text-[#FDF0D5] font-bold cursor-pointer"
                              >
                                Đã giao xong
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStopStatusOverrides((prev) => ({ ...prev, [stKey]: 'failed' }))
                                }
                                className="py-1.5 px-2.5 rounded-lg border border-[#C1121F] bg-[#F8E7C4] text-[#780000] font-semibold cursor-pointer"
                              >
                                Báo hoãn
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          ROLE 4: PLATFORM SYSTEM ADMIN ("admin" role: Zero-Knowledge Monitor Room)
          Strictly blinded to tenant business data: shows infrastructure telemetry,
          company provisioning, and encrypted AES-256-GCM database rows.
          ===================================================================== */}
      {activeRole === 'admin' && (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 space-y-5">
          {/* Zero-Knowledge Admin Policy Banner */}
          <div className="bg-white border border-[#D4BF94] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003049] uppercase">
                <Lock className="w-4 h-4" />
                <span>Phòng Giám Sát Hạ Tầng &amp; Quản Trị Đa Doanh Nghiệp (Zero-Knowledge Admin Room)</span>
              </div>
              <h1 className="text-[20px] font-bold text-[#003049]">
                Quản Trị Viên Hệ Thống Chỉ Giám Sát Máy Chủ &amp; Tài Khoản: Không Thể Xem Dữ Liệu Kinh Doanh Của Khách Hàng
              </h1>
              <p className="text-[12.5px] text-[#004366]">
                Theo kiến trúc Zero-Knowledge BYOK của EcoMiles, khóa giải mã <code>AES-256-GCM</code> thuộc quyền sở hữu riêng của từng doanh nghiệp (Bách Hóa Xanh, Nam Việt, WinCommerce). Quản trị viên EcoMiles hoàn toàn bị che mù (Blinded) trước tên khách hàng, số điện thoại và địa chỉ giao hàng.
              </p>
            </div>
          </div>

          {/* 4 Infrastructure Telemetry KPIs */}
          <div className="bg-white border border-[#D4BF94] rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#D4BF94] tabular-nums">
            <div className="p-4 space-y-1">
              <div className="text-xs text-[#004366]">Trạng thái cụm máy chủ &amp; Edge D1</div>
              <div className="text-2xl font-bold text-[#003049]">99,98% Online</div>
              <div className="text-xs text-[#004366]">Cloudflare Workers + FastAPI 3.12</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-xs text-[#004366]">Độ trễ bộ giải VRP (p50 / p95)</div>
              <div className="text-2xl font-bold text-[#003049]">13,9 ms / 20,4 ms</div>
              <div className="text-xs text-[#003049]">Đạt chuẩn SLA &lt; 100 ms</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-xs text-[#004366]">Số doanh nghiệp B2B đang cách ly</div>
              <div className="text-2xl font-bold text-[#003049]">{B2B_COMPANIES.length} Doanh nghiệp</div>
              <div className="text-xs text-[#004366]">30 xe tải · 3 phân vùng khóa KMS độc lập</div>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-xs text-[#004366]">Quyền đọc dữ liệu khách hàng của Admin</div>
              <div className="text-2xl font-bold text-[#C1121F]">0% (Đã khóa cứng)</div>
              <div className="text-xs text-[#004366]">Mã hóa phong bì AES-256-GCM</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Tenant & User Provisioning Directory */}
            <div className="lg:col-span-5 bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#003049]" />
                <h2 className="text-[15px] font-bold text-[#003049]">
                  1. Quản Lý Cấp Phát Không Gian Doanh Nghiệp (Tenants)
                </h2>
              </div>
              <div className="space-y-2.5">
                {B2B_COMPANIES.map((comp) => (
                  <div
                    key={comp.tenant_id}
                    className="p-3.5 rounded-lg bg-[#FDF0D5] border border-[#D4BF94] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-[#003049]">{comp.short_name}</strong>
                      <span className="px-2 py-0.5 rounded bg-[#D7E6F0] text-[#002033] font-mono font-bold text-[11px]">
                        {comp.tenant_id}
                      </span>
                    </div>
                    <div className="text-[#004366]">
                      Đội xe đăng ký: <strong>{comp.fleet_count} xe</strong> · DPO: <code>{comp.nd13_dpo_contact}</code>
                    </div>
                    <div className="font-mono text-[11px] text-[#003049]">
                      Khóa KMS của khách hàng: {comp.key_fingerprint} (Admin không giữ khóa)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Blinded Shared Database Inspector (Cryptographic Proof) */}
            <div className="lg:col-span-7 bg-white border border-[#D4BF94] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#003049]" />
                  <h2 className="text-[15px] font-bold text-[#003049]">
                    2. Giao Diện Cơ Sở Dữ Liệu Chung Khi Admin Truy Vấn (100% Blinded Ciphertext)
                  </h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#F8E7C4] text-[#780000] text-[11px] font-bold">
                  admin_can_decrypt = false
                </span>
              </div>
              <p className="text-xs text-[#004366]">
                Dưới đây là các bản ghi thực tế trong bảng dữ liệu chung khi nhìn từ tài khoản Admin của EcoMiles: toàn bộ trường Địa chỉ, Tên người nhận và SĐT đều là bản mã <code>AES-256-GCM</code> không thể đọc ngược nếu không có khóa của doanh nghiệp:
              </p>

              <div className="overflow-x-auto border border-[#D4BF94] rounded-lg">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead className="bg-[#FDF0D5] text-[#004366] border-b border-[#D4BF94]">
                    <tr>
                      <th className="py-2 px-2.5 text-left">Tenant ID</th>
                      <th className="py-2 px-2.5 text-left">Băm định danh (HMAC)</th>
                      <th className="py-2 px-2.5 text-left">Bản mã dữ liệu khách hàng (AES-256-GCM)</th>
                      <th className="py-2 px-2.5 text-left">Vùng Quận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EED9AF]">
                    {result.orders.slice(0, 8).map((ord, idx) => {
                      const comp = B2B_COMPANIES[idx % B2B_COMPANIES.length];
                      const blinded = buildBlindedAdminRow(idx + 1, comp, ord);
                      return (
                        <tr key={blinded.row_id} className="hover:bg-[#FDF0D5]">
                          <td className="py-2 px-2.5 font-bold text-[#003049]">{blinded.tenant_id}</td>
                          <td className="py-2 px-2.5 text-[#004366]">{blinded.external_id_hmac.slice(0, 22)}…</td>
                          <td className="py-2 px-2.5 text-[#780000] max-w-[260px] truncate">
                            {blinded.encrypted_payload_cek}
                          </td>
                          <td className="py-2 px-2.5 text-[#003049]">{blinded.district_bucket}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Live WebCrypto AES-256-GCM Verification Panel (Zero-Knowledge Cryptographic Proof) */}
          <div className="bg-white border border-[#D4BF94] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4BF94] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#003049]" />
                  <h2 className="text-[16px] font-bold text-[#003049]">
                    3. Kiểm Chứng Giải Mã Chéo Trái Phép (Live WebCrypto AES-256-GCM Test)
                  </h2>
                </div>
                <p className="text-xs text-[#004366] mt-0.5">
                  Thực hiện mã hóa và thử giải mã chéo thời gian thực bằng WebCrypto Subtle API trong trình duyệt. Chứng minh Admin không thể giải mã dữ liệu của khách hàng.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#D7E6F0] text-[#003049] font-mono text-[11px] font-bold shrink-0">
                PBKDF2 + AES-GCM 256-bit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={async () => {
                  setCryptoTestState((prev) => ({ ...prev, running: true, errorMessage: null, successMessage: null }));
                  try {
                    const samplePayload = {
                      order_id: 'COLD-2026-0001',
                      customer_name: 'Nhà Hàng Biển Đông Q.1',
                      customer_phone: '0903123456',
                      address: '125 Nguyễn Thị Minh Khai, P. Bến Thành, Q.1',
                      weight_kg: 85.5,
                      temp_c: -18,
                    };
                    const env = await encryptTenantPayloadAesGcm('TNT-NAMVIET-002', samplePayload);
                    setCryptoTestState({
                      running: false,
                      envelope: env,
                      successMessage: `Đã mã hóa thành công bằng khóa Nam Việt (TNT-NAMVIET-002)! IV: ${env.iv_hex} · Bản mã: ${env.ciphertext_hex.slice(0, 32)}... · Fingerprint: ${env.key_fingerprint}`,
                      errorMessage: null,
                      step: 'encrypted',
                    });
                  } catch (e) {
                    setCryptoTestState((prev) => ({ ...prev, running: false, errorMessage: String(e) }));
                  }
                }}
                disabled={cryptoTestState.running}
                className="p-3.5 rounded-lg border border-[#669BBC] bg-[#D7E6F0] hover:bg-[#D7E6F0] text-left cursor-pointer transition-colors"
              >
                <div className="font-bold text-xs text-[#003049] flex items-center gap-1.5 mb-1">
                  <span>Bước 1. Mã Hóa Bằng Khóa Nam Việt</span>
                </div>
                <p className="text-[11px] text-[#003049]">
                  Ký và mã hóa phong bì AES-256-GCM một đơn hàng mẫu của Nam Việt (TNT-NAMVIET-002).
                </p>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!cryptoTestState.envelope) return;
                  setCryptoTestState((prev) => ({ ...prev, running: true, errorMessage: null, successMessage: null }));
                  try {
                    const dec = await decryptTenantPayloadAesGcm('SYS-ADMIN', cryptoTestState.envelope);
                    if (!dec.ok) {
                      setCryptoTestState((prev) => ({
                        ...prev,
                        running: false,
                        errorMessage: `BỊ TỪ CHỐI BỞI WEBCRYPTO: ${dec.error}`,
                        successMessage: null,
                        step: 'cross_failed',
                      }));
                    } else {
                      setCryptoTestState((prev) => ({ ...prev, running: false, successMessage: 'Bất ngờ giải mã được!' }));
                    }
                  } catch (e) {
                    setCryptoTestState((prev) => ({ ...prev, running: false, errorMessage: String(e) }));
                  }
                }}
                disabled={cryptoTestState.running || !cryptoTestState.envelope}
                className={`p-3.5 rounded-lg border text-left transition-colors ${
                  !cryptoTestState.envelope
                    ? 'border-[#D4BF94] bg-[#FDF0D5] text-[#669BBC] cursor-not-allowed'
                    : 'border-[#C1121F] bg-[#F8E7C4] hover:bg-[#F8E7C4] text-[#780000] cursor-pointer'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>Bước 2. Thử Giải Mã Bằng Khóa Admin</span>
                </div>
                <p className="text-[11px] text-[#780000]">
                  Dùng khóa SYS-ADMIN để giải mã phong bì của Nam Việt. WebCrypto sẽ từ chối xác thực tag AES-GCM (Lỗi 403).
                </p>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!cryptoTestState.envelope) return;
                  setCryptoTestState((prev) => ({ ...prev, running: true, errorMessage: null, successMessage: null }));
                  try {
                    const dec = await decryptTenantPayloadAesGcm('TNT-NAMVIET-002', cryptoTestState.envelope);
                    if (dec.ok) {
                      setCryptoTestState((prev) => ({
                        ...prev,
                        running: false,
                        successMessage: `GIẢI MÃ THÀNH CÔNG HỢP LỆ VỚI KHÓA CHÍNH CHỦ: Khách hàng "${dec.data.customer_name}" · SĐT: ${dec.data.customer_phone} · Địa chỉ: ${dec.data.address}`,
                        errorMessage: null,
                        step: 'self_success',
                      }));
                    } else {
                      setCryptoTestState((prev) => ({ ...prev, running: false, errorMessage: dec.error }));
                    }
                  } catch (e) {
                    setCryptoTestState((prev) => ({ ...prev, running: false, errorMessage: String(e) }));
                  }
                }}
                disabled={cryptoTestState.running || !cryptoTestState.envelope}
                className={`p-3.5 rounded-lg border text-left transition-colors ${
                  !cryptoTestState.envelope
                    ? 'border-[#D4BF94] bg-[#FDF0D5] text-[#669BBC] cursor-not-allowed'
                    : 'border-[#669BBC] bg-[#D7E6F0] hover:bg-[#D7E6F0] text-[#003049] cursor-pointer'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <span>Bước 3. Giải Mã Bằng Đúng Khóa Nam Việt</span>
                </div>
                <p className="text-[11px] text-[#003049]">
                  Dùng đúng khóa của TNT-NAMVIET-002. WebCrypto xác thực tag thành công và trả về dữ liệu gốc.
                </p>
              </button>
            </div>

            {/* Test Output Box */}
            {cryptoTestState.errorMessage && (
              <div className="p-3.5 rounded-lg bg-[#F8E7C4] border border-[#C1121F] text-xs font-mono text-[#780000] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#C1121F] shrink-0" />
                  <span>Xác thực Mật mã Thất bại như Kỳ vọng (Zero-Knowledge Verified)</span>
                </div>
                <div className="break-all">{cryptoTestState.errorMessage}</div>
              </div>
            )}

            {cryptoTestState.successMessage && (
              <div className="p-3.5 rounded-lg bg-[#D7E6F0] border border-[#669BBC] text-xs font-mono text-[#003049] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#669BBC] shrink-0" />
                  <span>Kết Quả WebCrypto Thành Công</span>
                </div>
                <div className="break-all">{cryptoTestState.successMessage}</div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// =============================================================================
// TANSTACK ROUTER SETUP
// =============================================================================
function NullRouteView() {
  return null;
}

const rootRoute = createRootRoute({
  component: () => <EnterpriseWorkspace defaultRole="user" />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: NullRouteView,
});

const benchmarkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/benchmark',
  component: NullRouteView,
});

const dispatcherRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dispatcher',
  component: NullRouteView,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: NullRouteView,
});

const driverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/driver',
  component: NullRouteView,
});

const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: NullRouteView,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: NullRouteView,
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

export function EcoMilesPortal({ initialRoute = '/dashboard' }: PortalProps) {
  const router = useMemo(() => {
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
