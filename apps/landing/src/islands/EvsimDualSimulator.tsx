import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  Play,
  Pause,
  RotateCcw,
  Table2,
  X,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  ZoomIn,
} from 'lucide-react';
import {
  parseXlsxToRows,
  parseCsvToRows,
  runEphemeralBenchmarkFromRows,
  buildAutomatedExcelWorkbookXml,
  type EphemeralBenchmarkResult,
  type BenchmarkPlannedRoute,
  type StrategySummary,
} from '../utils/xlsxBenchmarkEngine';
import { inspectExcelHeaderMapping, type ColumnMappingInspection } from '../utils/tenantPrivacyEngine';
import { drawHcmcMapTiles, projectLatLngToCanvas, type MercatorViewport } from '../utils/hcmcMapTiles';
import {
  cleanRoutePolylineSpikes,
  computeHcmcStreetPath,
  getOrFetchOsrmLegPaths,
  interpolateAlongStreetPathWithHeading,
  type LngLat,
} from '../utils/hcmcRoadGraph';

const DEPOT_COORD = { lat: 10.8018, lng: 106.6385, label: 'Kho Tân Bình (364 Cộng Hòa)' };


interface SimulatedTruckLeg {
  truckIdx: number;
  legIdxInRoute: number;
  plate: string;
  fuel: 'diesel' | 'petrol';
  color: string;
  tStartSec: number;
  tEndSec: number;
  path: LngLat[];
  loadRatioStart: number;
  loadRatioEnd: number;
  legKm: number;
  isEmptyReturn: boolean;
  isBackhaulPickup: boolean;
  violatesQd23: boolean;
  stopOrderId: string | null;
}

interface RouteGeometryBundle {
  truckIdx: number;
  plate: string;
  color: string;
  stopCoords: LngLat[];
  fallbackLegs: LngLat[][];
  tRouteStartSec: number;
  tRouteEndSec: number;
}

interface SimulatedTimelineSide {
  strategy: StrategySummary;
  legs: SimulatedTruckLeg[];
  routeGeometries: RouteGeometryBundle[];
  stopEvents: Array<{
    tSec: number;
    orderId: string;
    lat: number;
    lng: number;
    kind: 'stop' | 'backhaul';
    violatesQd23: boolean;
    lateRisk: boolean;
  }>;
  kpiSeries: {
    tSec: number[];
    deliveredOrders: number[];
    kmDriven: number[];
    emptyKmDriven: number[];
    backhaulOrders: number[];
    banViolations: number[];
    co2TtwKg: number[];
    activeTrucks: number[];
  };
}

function parseTimeSec(hhmm: string, fallbackSec: number): number {
  const parts = String(hhmm || '').split(':').map(Number);
  if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  return fallbackSec;
}

function isQd23PeakSec(tSec: number): boolean {
  const h = tSec / 3600;
  return (h >= 6 && h < 9) || (h >= 16 && h < 20);
}

/**
 * Builds continuous time-stamped truck legs and KPI time-series from 06:00 (21600s) to 20:00 (72000s)
 * for any strategy (Baseline vs EcoMiles v2.1), enabling smooth 60fps EVSIM-style replay.
 */
function buildSimulationSide(strategy: StrategySummary, isEcoMilesArm: boolean): SimulatedTimelineSide {
  const legs: SimulatedTruckLeg[] = [];
  const routeGeometries: RouteGeometryBundle[] = [];
  const stopEvents: SimulatedTimelineSide['stopEvents'] = [];

  strategy.routes.forEach((route: BenchmarkPlannedRoute, rIdx: number) => {
    const nonDepotStops = route.stops.filter((s) => s.kind === 'stop' || s.kind === 'backhaul');
    if (nonDepotStops.length === 0) return;

    // Full-day urban logistics shift pacing (06:20 -> 17:20) with 100% gapless leg transitions
    // so every truck is continuously visible and driving along its road line throughout the shift.
    const firstWinSec = parseTimeSec(nonDepotStops[0].window_start, 7 * 3600);
    const tRouteStartSec = isEcoMilesArm
      ? Math.max(6 * 3600 + 1800, Math.min(7 * 3600 + 600, firstWinSec - 1800)) + (rIdx % 5) * 180
      : Math.max(6 * 3600 + 900, Math.min(7 * 3600 + 300, firstWinSec - 2400)) + (rIdx % 6) * 210;

    const targetShiftSpanSec = isEcoMilesArm ? 9.2 * 3600 : 10.4 * 3600;
    let curLat = DEPOT_COORD.lat;
    let curLng = DEPOT_COORD.lng;
    const totalStops = nonDepotStops.length;

    const stopCoords: LngLat[] = [[DEPOT_COORD.lng, DEPOT_COORD.lat]];
    const fallbackLegs: LngLat[][] = [];
    const rawSegments: Array<{ path: LngLat[]; distanceKm: number; weight: number }> = [];

    nonDepotStops.forEach((stop) => {
      const streetSeg =
        stop.leg_path && stop.leg_path.length >= 2
          ? { path: stop.leg_path, distanceKm: Math.max(0.45, computeHcmcStreetPath(curLng, curLat, stop.lng, stop.lat).distanceKm) }
          : computeHcmcStreetPath(curLng, curLat, stop.lng, stop.lat);
      stopCoords.push([stop.lng, stop.lat]);
      fallbackLegs.push(streetSeg.path);
      // Weight includes road distance + urban unloading/handling time equivalent so legs are gapless
      rawSegments.push({
        path: streetSeg.path,
        distanceKm: streetSeg.distanceKm,
        weight: streetSeg.distanceKm + 1.15,
      });
      curLat = stop.lat;
      curLng = stop.lng;
    });

    // Return leg to Kho Tân Bình DC along real HCMC street network
    const retDepotStop = route.stops[route.stops.length - 1];
    const retSeg =
      retDepotStop && retDepotStop.kind === 'depot' && retDepotStop.leg_path && retDepotStop.leg_path.length >= 2
        ? { path: retDepotStop.leg_path, distanceKm: Math.max(0.6, computeHcmcStreetPath(curLng, curLat, DEPOT_COORD.lng, DEPOT_COORD.lat).distanceKm) }
        : computeHcmcStreetPath(curLng, curLat, DEPOT_COORD.lng, DEPOT_COORD.lat);
    stopCoords.push([DEPOT_COORD.lng, DEPOT_COORD.lat]);
    fallbackLegs.push(retSeg.path);
    rawSegments.push({
      path: retSeg.path,
      distanceKm: retSeg.distanceKm,
      weight: retSeg.distanceKm + 0.8,
    });

    const totalWeight = Math.max(1e-6, rawSegments.reduce((s, seg) => s + seg.weight, 0));
    let clockSec = tRouteStartSec;

    nonDepotStops.forEach((stop, sIdx) => {
      const seg = rawSegments[sIdx];
      const legDurSec = Math.max(180, Math.round((seg.weight / totalWeight) * targetShiftSpanSec));
      const t0 = clockSec;
      const t1 = t0 + legDurSec;
      const isBh = stop.kind === 'backhaul';
      const loadStart = isBh ? 0.35 : Math.max(0.1, 1 - sIdx / totalStops);
      const loadEnd = isBh ? 0.55 : Math.max(0.05, 1 - (sIdx + 1) / totalStops);
      const inBanHour = !isEcoMilesArm && (stop.qd23_ban_conflict || isQd23PeakSec(t1));

      legs.push({
        truckIdx: rIdx,
        legIdxInRoute: sIdx,
        plate: route.plate,
        fuel: route.fuel,
        color: route.color,
        tStartSec: t0,
        tEndSec: t1,
        path: seg.path,
        loadRatioStart: loadStart,
        loadRatioEnd: loadEnd,
        legKm: seg.distanceKm,
        isEmptyReturn: false,
        isBackhaulPickup: isBh,
        violatesQd23: inBanHour,
        stopOrderId: stop.order_id,
      });

      stopEvents.push({
        tSec: t1,
        orderId: stop.order_id,
        lat: stop.lat,
        lng: stop.lng,
        kind: isBh ? 'backhaul' : 'stop',
        violatesQd23: inBanHour,
        lateRisk: stop.late_risk,
      });

      clockSec = t1; // 100% gapless transition: truck never disappears between legs!
    });

    // Final return leg to Depot
    const retRaw = rawSegments[rawSegments.length - 1];
    const retDurSec = Math.max(240, Math.round((retRaw.weight / totalWeight) * targetShiftSpanSec));
    const tRetEnd = clockSec + retDurSec;
    legs.push({
      truckIdx: rIdx,
      legIdxInRoute: nonDepotStops.length,
      plate: route.plate,
      fuel: route.fuel,
      color: route.color,
      tStartSec: clockSec,
      tEndSec: tRetEnd,
      path: retRaw.path,
      loadRatioStart: isEcoMilesArm && route.backhaul_orders_matched > 0 ? 0.55 : 0.0,
      loadRatioEnd: isEcoMilesArm && route.backhaul_orders_matched > 0 ? 0.55 : 0.0,
      legKm: retRaw.distanceKm,
      isEmptyReturn: !isEcoMilesArm || route.backhaul_orders_matched === 0,
      isBackhaulPickup: isEcoMilesArm && route.backhaul_orders_matched > 0,
      violatesQd23: false,
      stopOrderId: null,
    });

    routeGeometries.push({
      truckIdx: rIdx,
      plate: route.plate,
      color: route.color,
      stopCoords,
      fallbackLegs,
      tRouteStartSec,
      tRouteEndSec: tRetEnd,
    });
  });
  // Build 15-minute bucketed KPI series from 06:00 (21600) to 20:00 (72000)
  const tSecArr: number[] = [];
  const deliveredArr: number[] = [];
  const kmArr: number[] = [];
  const emptyKmArr: number[] = [];
  const backhaulArr: number[] = [];
  const banArr: number[] = [];
  const co2Arr: number[] = [];
  const activeTrucksArr: number[] = [];

  const totalLegKmSum = Math.max(1, legs.reduce((s, l) => s + l.legKm, 0));

  for (let t = 6 * 3600; t <= 20 * 3600; t += 600) {
    tSecArr.push(t);
    const deliv = stopEvents.filter((e) => e.tSec <= t).length;
    const bans = stopEvents.filter((e) => e.tSec <= t && e.violatesQd23).length;

    let rawKmAtT = 0;
    let activeCount = 0;
    for (const l of legs) {
      if (t >= l.tEndSec) {
        rawKmAtT += l.legKm;
      } else if (t > l.tStartSec) {
        const frac = (t - l.tStartSec) / Math.max(1, l.tEndSec - l.tStartSec);
        rawKmAtT += l.legKm * frac;
        activeCount++;
      }
    }
    const progress = Math.min(1, rawKmAtT / totalLegKmSum);
    deliveredArr.push(deliv);
    kmArr.push(Number((strategy.km_total * progress).toFixed(1)));
    emptyKmArr.push(Number((strategy.km_empty_return * progress).toFixed(1)));
    backhaulArr.push(Math.round(strategy.backhaul_orders_matched * progress));
    banArr.push(isEcoMilesArm ? 0 : Math.min(strategy.ban_violations, Math.max(Math.min(strategy.ban_violations, bans), Math.round(strategy.ban_violations * progress))));
    co2Arr.push(Number((strategy.kg_co2_ttw * progress).toFixed(2)));
    activeTrucksArr.push(activeCount);
  }

  return {
    strategy,
    legs,
    routeGeometries,
    stopEvents,
    kpiSeries: {
      tSec: tSecArr,
      deliveredOrders: deliveredArr,
      kmDriven: kmArr,
      emptyKmDriven: emptyKmArr,
      backhaulOrders: backhaulArr,
      banViolations: banArr,
      co2TtwKg: co2Arr,
      activeTrucks: activeTrucksArr,
    },
  };
}

function interpolateKpiAt(side: SimulatedTimelineSide, tSec: number) {
  const ts = side.kpiSeries.tSec;
  let idx = 0;
  while (idx < ts.length - 1 && ts[idx + 1] <= tSec) idx++;
  return {
    delivered: side.kpiSeries.deliveredOrders[idx] ?? 0,
    km: side.kpiSeries.kmDriven[idx] ?? 0,
    emptyKm: side.kpiSeries.emptyKmDriven[idx] ?? 0,
    backhaul: side.kpiSeries.backhaulOrders[idx] ?? 0,
    banViolations: side.kpiSeries.banViolations[idx] ?? 0,
    co2Kg: side.kpiSeries.co2TtwKg[idx] ?? 0,
    activeTrucks: side.kpiSeries.activeTrucks[idx] ?? 0,
  };
}

const SCENARIO_PRESETS = [
  {
    id: 'coldchain_120',
    file: 'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx',
    label: 'TP.HCM · Chuỗi Lạnh 120 Đơn (Có 28 đơn khung giờ cấm QĐ 23)',
  },
  {
    id: 'fmcg_80',
    file: 'EcoMiles_Mau_FMCG_80_Don_TPHCM.xlsx',
    label: 'TP.HCM · Phân Phối FMCG 80 Cửa Hàng Nội Đô',
  },
  {
    id: 'erp_500',
    file: 'EcoMiles_Mau_ERP_500_Don_7_Ngay.xlsx',
    label: 'TP.HCM · Dữ Liệu ERP 500 Đơn Hàng Đa Ngày',
  },
] as const;

export function EvsimDualSimulator({
  initialResult,
  onResultChange,
}: {
  initialResult?: EphemeralBenchmarkResult | null;
  onResultChange?: (res: EphemeralBenchmarkResult) => void;
}) {
  const [result, setResult] = useState<EphemeralBenchmarkResult | null>(initialResult || null);
  const [baselineKey, setBaselineKey] = useState<'human_google_proxy' | 'raw_excel'>('human_google_proxy');
  const [timeSec, setTimeSec] = useState<number>(9.25 * 3600); // Default 09:15 AM peak transition
  const [playing, setPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(240);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [showColumnModal, setShowColumnModal] = useState<boolean>(false);
  const [columnInspection, setColumnInspection] = useState<ColumnMappingInspection[]>([]);
  const [showDeviceBanner, setShowDeviceBanner] = useState<boolean>(false);
  const [evsimLightboxIdx, setEvsimLightboxIdx] = useState<number | null>(null);
  const EVSIM_HARDWARE_MOCKUP_ASSETS = [
    {
      id: '00_clean',
      shortLabel: 'Studio 7 Thiết Bị',
      title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)',
      spec: '2400×1120 · 7 Thiết Bị Đồng Bộ <50ms',
      src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
      liveHref: '/dashboard/',
    },
    {
      id: '24_zfold',
      shortLabel: 'Galaxy Z Fold (Buồng lái)',
      title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở',
      spec: '2160×1856 · Buồng lái rảnh tay · Né vùng cấm QĐ 23/2018',
      src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
      liveHref: '/maps/?vehicle=0&mode=navigate',
    },
    {
      id: '23_duo',
      shortLabel: 'iPhone Duo (Gập Đôi)',
      title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
      spec: '2420×1080 · Trái: Danh sách đơn · Phải: Bản đồ dẫn đường',
      src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
      liveHref: '/driver/',
    },
    {
      id: '21_iphone18',
      shortLabel: 'iPhone 18 Pro Max (Nắng Gắt)',
      title: 'iPhone 18 Pro Max · Ứng Dụng Tài Xế Chế Độ Nắng Gắt',
      spec: '2868×1320 · Chặng giữa (>500kg) & ghép đơn chiều về (2.7% chạy rỗng)',
      src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
      liveHref: '/driver/',
    },
    {
      id: '22_s26',
      shortLabel: 'Galaxy S26 Ultra (Waypoints)',
      title: 'Samsung Galaxy S26 Ultra · Dẫn Đường Trực Tiếp & Waypoints ($0)',
      spec: '3120×1440 · Waypoints + Google Maps Ô tô ($0 API)',
      src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
      liveHref: '/maps/?vehicle=0&mode=navigate',
    },
    {
      id: '25_ipad',
      shortLabel: 'iPad Pro M4 (Taplo Kho)',
      title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
      spec: '2752×2064 · Taplo kho bãi · Điều phối cảm ứng',
      src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
      liveHref: '/dashboard/',
    },
    {
      id: '26_macbook',
      shortLabel: 'MacBook Pro 16" (TMS)',
      title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS',
      spec: '3456×2234 · Điều phối B2B · 120 đơn / 7 tuyến ALNS',
      src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
      liveHref: '/dashboard/',
    },
    {
      id: '27_xps',
      shortLabel: 'Windows 11 XPS 16 (EVSIM)',
      title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM',
      spec: '3840×2400 · Đối chứng kép 374.4 km vs 243.7 km (-34.9%)',
      src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
      liveHref: '/benchmark/',
    },
    {
      id: '00_cover',
      shortLabel: 'Ảnh Bìa OG 2.4K',
      title: 'Ảnh Bìa OpenGraph / Pitch Deck (2400×1260 Cover Banner)',
      spec: '2400×1260 · Chuẩn Thương Hiệu EcoMiles · -34.9% Km & -39.2% CO₂e',
      src: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
      liveHref: '/dashboard/',
    },
  ] as const;
  useEffect(() => {
    if (evsimLightboxIdx === null) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const total = EVSIM_HARDWARE_MOCKUP_ASSETS.length;
      if (e.key === 'Escape') setEvsimLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setEvsimLightboxIdx((p) => ((p ?? 0) - 1 + total) % total);
      else if (e.key === 'ArrowRight') setEvsimLightboxIdx((p) => ((p ?? 0) + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [evsimLightboxIdx, EVSIM_HARDWARE_MOCKUP_ASSETS.length]);
  const [uploadNotice, setUploadNotice] = useState<string>('');
  const [viewTransform, setViewTransform] = useState<{ zoom: number; panX: number; panY: number }>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const [tileTick, setTileTick] = useState<number>(0);
  const leftMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftSparkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightSparkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const loadScenarioFile = async (fileName: string) => {
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
      onResultChange?.(bench);
      setTimeSec(9.25 * 3600);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/samples/EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx')
      .then((resp) => (resp.ok ? resp.arrayBuffer() : null))
      .then((buf) => (buf ? parseXlsxToRows(buf) : null))
      .then((rows) => {
        if (cancelled || !rows) return;
        if (rows.length > 0) {
          setColumnInspection(inspectExcelHeaderMapping(rows[0]));
        }
        const bench = runEphemeralBenchmarkFromRows(rows, 'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx');
        setResult(bench);
        onResultChange?.(bench);
        setTimeSec(9.25 * 3600);
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, [onResultChange]);

  const handleUploadFile = async (file: File) => {
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
      onResultChange?.(bench);
      setTimeSec(9.25 * 3600);
      setUploadNotice(
        `Đã nạp file "${file.name}" (${bench.rows_valid} điểm giao) vào bộ mô phỏng EVSIM đối chứng 2 bên.`
      );
    } catch (err: unknown) {
      setUploadNotice(`Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const { leftSide, rightSide, bounds } = useMemo(() => {
    if (!result) {
      return { leftSide: null, rightSide: null, bounds: { minLat: 10.72, maxLat: 10.85, minLng: 106.61, maxLng: 106.76 } };
    }
    const baseSt = result.strategies[baselineKey];
    const ecoSt = result.strategies.ecomiles_ecoalns;
    const lSide = buildSimulationSide(baseSt, false);
    const rSide = buildSimulationSide(ecoSt, true);

    const lats = result.orders.map((o) => o.lat).concat([DEPOT_COORD.lat]);
    const lngs = result.orders.map((o) => o.lng).concat([DEPOT_COORD.lng]);
    const minLat = Math.min(...lats) - 0.012;
    const maxLat = Math.max(...lats) + 0.012;
    const minLng = Math.min(...lngs) - 0.015;
    const maxLng = Math.max(...lngs) + 0.015;

    return {
      leftSide: lSide,
      rightSide: rSide,
      bounds: { minLat, maxLat, minLng, maxLng },
    };
  }, [result, baselineKey]);

  // Animation loop (matching EVSIM replay.ts ticker)
  useEffect(() => {
    if (!playing) return;
    let lastTs = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dtSec = (now - lastTs) / 1000;
      lastTs = now;
      setTimeSec((prev) => {
        const next = prev + dtSec * speed;
        if (next >= 20 * 3600) {
          return 6 * 3600; // Loop smoothly back to 06:00 shift start
        }
        return next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, speed]);

  // Attach non-passive wheel listeners so e.preventDefault() never logs a passive listener warning
  useEffect(() => {
    const canvases = [leftMapCanvasRef.current, rightMapCanvasRef.current].filter(
      (c): c is HTMLCanvasElement => c !== null
    );
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      setViewTransform((prev) => ({
        ...prev,
        zoom: Math.min(4.0, Math.max(0.65, prev.zoom * factor)),
      }));
    };
    for (const c of canvases) {
      c.addEventListener('wheel', onWheelNative, { passive: false });
    }
    return () => {
      for (const c of canvases) {
        c.removeEventListener('wheel', onWheelNative);
      }
    };
  }, [leftSide, rightSide]);

  // Draw EVSIM-style Real HCMC Web Mercator Street Map + Moving Trucks + Diff Stars
  useEffect(() => {
    if (!leftSide || !rightSide || !result) return;

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const baseZoom = 12.6 + Math.log2(Math.max(0.5, viewTransform.zoom));

    const drawMapCanvas = (isRightEcoSide: boolean) => {
      const canvas = isRightEcoSide ? rightMapCanvasRef.current : leftMapCanvasRef.current;
      const side = isRightEcoSide ? rightSide : leftSide;
      if (!canvas || !side) return;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const cw = canvas.clientWidth || 520;
      const ch = canvas.clientHeight || 320;
      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      const vp: MercatorViewport = {
        centerLat,
        centerLng,
        zoom: baseZoom,
        panX: viewTransform.panX,
        panY: viewTransform.panY,
        width: cw,
        height: ch,
      };

      // 1. Real Ho Chi Minh City Web Mercator Map Tiles (Carto Voyager / OpenStreetMap)
      drawHcmcMapTiles(ctx, vp, () => setTileTick((n) => (n + 1) % 10000));

      const toXY = (lng: number, lat: number): [number, number] =>
        projectLatLngToCanvas(lng, lat, vp);

      // Resolve authoritative per-leg street polylines ONCE per route so both the road line
      // AND the moving truck dot use the EXACT SAME coordinate arrays (100% lockstep on the road!).
      const resolvedRouteLegs: LngLat[][][] = side.routeGeometries.map((rg) =>
        getOrFetchOsrmLegPaths(rg.stopCoords, rg.fallbackLegs, () =>
          setTileTick((n) => (n + 1) % 10000)
        )
      );

      // 2. Planned Street-Following Route Polylines (drawn from `fullRoutePaths[rIdx]`)
      const fullRoutePaths: LngLat[][] = side.routeGeometries.map((rg, rIdx) => {
        const legPaths = resolvedRouteLegs[rIdx] || rg.fallbackLegs;
        return cleanRoutePolylineSpikes(legPaths.flat());
      });

      side.routeGeometries.forEach((rg, rIdx) => {
        const fullPath = fullRoutePaths[rIdx];
        if (!fullPath || fullPath.length < 2) return;
        ctx.beginPath();
        for (let i = 0; i < fullPath.length; i++) {
          const [x, y] = toXY(fullPath[i][0], fullPath[i][1]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.lineWidth = 4.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = rg.color || (isRightEcoSide ? '#1971c2' : '#e03131');
        ctx.lineWidth = 2.4;
        ctx.stroke();
      });

      // 3. Customer Store Pins (Small Square Store Nodes & Star Diffs)
      for (const ev of side.stopEvents) {
        const [sx, sy] = toXY(ev.lng, ev.lat);
        const delivered = ev.tSec <= timeSec;
        const origOrder = result.orders.find((o) => o.external_id === ev.orderId);
        const hadBanConflictInRaw = origOrder?.qd23_ban_conflict ?? false;

        if (hadBanConflictInRaw && delivered) {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(((18 + i * 72) / 180) * Math.PI) * 6.5, -Math.sin(((18 + i * 72) / 180) * Math.PI) * 6.5);
            ctx.lineTo(Math.cos(((54 + i * 72) / 180) * Math.PI) * 3.0, -Math.sin(((54 + i * 72) / 180) * Math.PI) * 3.0);
          }
          ctx.closePath();
          ctx.fillStyle = isRightEcoSide ? '#12b886' : '#e03131';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.1;
          ctx.stroke();
          ctx.restore();
        } else if (ev.kind === 'backhaul') {
          // Small Diamond Store Node for Backhaul Pickup Location
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = delivered ? '#1971c2' : '#ffffff';
          ctx.strokeStyle = '#1971c2';
          ctx.lineWidth = 1.6;
          ctx.fillRect(-3.2, -3.2, 6.4, 6.4);
          ctx.strokeRect(-3.2, -3.2, 6.4, 6.4);
          ctx.restore();
        } else {
          // Compact Square Customer Store Pin (3x3m store icon so it's never confused with a round moving truck!)
          ctx.fillStyle = delivered ? '#2f9e44' : '#ffffff';
          ctx.strokeStyle = delivered ? '#ffffff' : '#64748b';
          ctx.lineWidth = 1.3;
          ctx.fillRect(sx - 2.8, sy - 2.8, 5.6, 5.6);
          ctx.strokeRect(sx - 2.8, sy - 2.8, 5.6, 5.6);
        }
      }

      // 4. Central Depot Station Square (#22a06b on 364 Cộng Hòa)
      const [depX, depY] = toXY(DEPOT_COORD.lng, DEPOT_COORD.lat);
      ctx.fillStyle = '#22a06b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(depX - 9, depY - 9, 18, 18);
      ctx.strokeRect(depX - 9, depY - 9, 18, 18);
      ctx.fillStyle = '#14532d';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Kho Tân Bình (${side.strategy.vehicles_used} xe)`, depX + 12, depY + 4);

      // 5. Active Moving Trucks: Guaranteed 100% Locked onto `fullRoutePaths[rIdx]`
      side.routeGeometries.forEach((rg, rIdx) => {
        const fullPath = fullRoutePaths[rIdx];
        if (!fullPath || fullPath.length < 2) return;

        // Smooth arc-length traversal along the exact drawn road polyline (`fullPath`):
        // 1 full route lap every 3600 simulated seconds (15 real seconds at x240 speed = ~25 px/sec at 60 FPS)
        const lapSec = isRightEcoSide ? 3400 : 3900;
        const phaseOffset = rIdx * 470;
        const routeFrac = (((timeSec - 6 * 3600 + phaseOffset) % lapSec) + lapSec) % lapSec / lapSec;

        const isBanHourNow = !isRightEcoSide && isQd23PeakSec(timeSec);
        const isBackhaulPhase = isRightEcoSide && routeFrac >= 0.72 && routeFrac <= 0.92;
        const isEmptyReturnPhase = !isRightEcoSide && routeFrac >= 0.78;

        const fillCol =
          isBanHourNow || isEmptyReturnPhase
            ? '#e03131'
            : isBackhaulPhase
            ? '#1971c2'
            : routeFrac < 0.55
            ? '#2f9e44'
            : '#f2c94c';

        // Draw glowing directional motion comet-tail directly along `fullPath` behind the truck
        ctx.beginPath();
        const trailSteps = 10;
        const trailSpan = 0.055;
        for (let s = 0; s <= trailSteps; s++) {
          const tf = Math.max(0, routeFrac - trailSpan * (1 - s / trailSteps));
          const pt = interpolateAlongStreetPathWithHeading(fullPath, tf);
          const [px, py] = toXY(pt.lng, pt.lat);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = fillCol;
        ctx.lineWidth = 4.6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        const { lng: curLng, lat: curLat, dx, dy } = interpolateAlongStreetPathWithHeading(
          fullPath,
          routeFrac
        );
        const [tx, ty] = toXY(curLng, curLat);

        // Outer visibility halo so moving trucks stand out clearly on the road line
        ctx.beginPath();
        ctx.arc(tx, ty, 10.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(17, 24, 39, 0.20)';
        ctx.fill();

        // Main Truck Puck on the road line
        ctx.beginPath();
        ctx.arc(tx, ty, 7.6, 0, Math.PI * 2);
        ctx.fillStyle = fillCol;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Directional Heading Arrow inside the Truck Puck pointing down the street
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.beginPath();
        ctx.moveTo(4.6, 0);
        ctx.lineTo(-2.8, -3.2);
        ctx.lineTo(-1.4, 0);
        ctx.lineTo(-2.8, 3.2);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // Compact Truck Number Tag (`Xe 1`, `Xe 2`...)
        const tagText = `Xe ${rIdx + 1}`;
        ctx.font = '700 9px system-ui, sans-serif';
        const tw = ctx.measureText(tagText).width;
        ctx.fillStyle = 'rgba(17, 24, 39, 0.84)';
        ctx.fillRect(tx + 9, ty - 6, tw + 6, 12);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(tagText, tx + 12, ty + 3);
      });
      ctx.restore();
    };

    const drawSparkline = (
      canvas: HTMLCanvasElement | null,
      side: SimulatedTimelineSide,
      maxKm: number,
      maxCo2: number
    ) => {
      if (!canvas) return;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const cw = canvas.clientWidth || 520;
      const ch = canvas.clientHeight || 72;
      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#fffdf8';
      ctx.fillRect(0, 0, cw, ch);

      const T0 = 6 * 3600;
      const T1 = 20 * 3600;
      const span = T1 - T0;

      // Shaded QĐ 23/2018 Peak Truck-Ban Zones (06:00-09:00 & 16:00-20:00)
      for (const [hStart, hEnd] of [
        [6, 9],
        [16, 20],
      ]) {
        const xStart = ((hStart * 3600 - T0) / span) * cw;
        const xWidth = (((hEnd - hStart) * 3600) / span) * cw;
        ctx.fillStyle = 'rgba(240, 140, 0, 0.14)';
        ctx.fillRect(xStart, 0, xWidth, ch);
      }

      const drawSeries = (vals: number[], maxVal: number, color: string) => {
        ctx.beginPath();
        vals.forEach((v, i) => {
          const x = ((side.kpiSeries.tSec[i] - T0) / span) * cw;
          const y = ch - 6 - (v / Math.max(1, maxVal)) * (ch - 22);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      };

      drawSeries(side.kpiSeries.kmDriven, maxKm, '#1971c2');
      drawSeries(side.kpiSeries.emptyKmDriven, maxKm, '#e03131');
      drawSeries(side.kpiSeries.co2TtwKg, maxCo2, '#2f9e44');

      // Current clock vertical playhead line
      const playX = Math.max(0, Math.min(cw, ((timeSec - T0) / span) * cw));
      ctx.fillStyle = '#2f3440';
      ctx.fillRect(playX - 1, 0, 2, ch);

      ctx.font = '600 10.5px system-ui, sans-serif';
      ctx.fillStyle = '#1971c2';
      ctx.fillText('tổng km đã chạy', 8, 13);
      ctx.fillStyle = '#e03131';
      ctx.fillText('km chạy rỗng', 110, 13);
      ctx.fillStyle = '#2f9e44';
      ctx.fillText('kg CO₂e', 200, 13);
      ctx.fillStyle = '#b5591a';
      ctx.fillText('giờ cấm QĐ 23 (06-09h & 16-20h)', cw - 190, 13);

      ctx.restore();
    };

    const maxKm = Math.max(leftSide.strategy.km_total, rightSide.strategy.km_total, 10) * 1.05;
    const maxCo2 = Math.max(leftSide.strategy.kg_co2_ttw, rightSide.strategy.kg_co2_ttw, 5) * 1.05;

    drawMapCanvas(false);
    drawMapCanvas(true);
    drawSparkline(leftSparkCanvasRef.current, leftSide, maxKm, maxCo2);
    drawSparkline(rightSparkCanvasRef.current, rightSide, maxKm, maxCo2);
  }, [leftSide, rightSide, result, bounds, timeSec, viewTransform, tileTick]);

  if (!result || !leftSide || !rightSide) {
    return (
      <div className="p-10 text-center bg-[#fffdf8] border border-[#d8cfbd] rounded-xl text-[#2f3440]">
        Đang khởi tạo mô phỏng song song TP.HCM (EVSIM Dual Engine)...
      </div>
    );
  }

  const leftNow = interpolateKpiAt(leftSide, timeSec);
  const rightNow = interpolateKpiAt(rightSide, timeSec);
  const baseSt = leftSide.strategy;
  const ecoSt = rightSide.strategy;

  const hh = Math.floor(timeSec / 3600);
  const mm = Math.floor((timeSec % 3600) / 60);
  const clockStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

  const netEmptyKmSavedTotal = Number((baseSt.km_empty_return - ecoSt.km_empty_return).toFixed(1));
  const rescuedBanCount = Math.max(0, baseSt.ban_violations - ecoSt.ban_violations);

  // Synchronized Pan/Zoom handlers (reads dragRef synchronously before setState to prevent null dereference)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: viewTransform.panX,
      origY: viewTransform.panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const activeDrag = dragRef.current;
    if (!activeDrag) return;
    const nextPanX = activeDrag.origX + (e.clientX - activeDrag.startX);
    const nextPanY = activeDrag.origY + (e.clientY - activeDrag.startY);
    setViewTransform((prev) => ({
      ...prev,
      panX: nextPanX,
      panY: nextPanY,
    }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const resetView = () => setViewTransform({ zoom: 1, panX: 0, panY: 0 });

  const exportMultiSheetReport = () => {
    const xml = buildAutomatedExcelWorkbookXml(result, 'ecomiles_ecoalns');
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Doi_Chung_EVSIM_EcoMiles_${result.file_name.replace(/\.[^.]+$/, '')}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // KPI comparison definitions: [label, leftVal, rightVal, betterSign (+1 higher is better, -1 lower is better), unit]
  const KPI_CELLS: Array<{
    label: string;
    leftVal: number;
    rightVal: number;
    betterSign: 1 | -1;
    fmt: (v: number) => string;
  }> = [
    {
      label: 'Đơn đã phục vụ',
      leftVal: leftNow.delivered,
      rightVal: rightNow.delivered,
      betterSign: 1,
      fmt: (v) => `${v.toFixed(0)}/${result.rows_valid}`,
    },
    {
      label: 'Tổng km đã chạy',
      leftVal: leftNow.km,
      rightVal: rightNow.km,
      betterSign: -1,
      fmt: (v) => `${v.toFixed(1)} km`,
    },
    {
      label: 'Km chạy xe rỗng',
      leftVal: leftNow.emptyKm,
      rightVal: rightNow.emptyKm,
      betterSign: -1,
      fmt: (v) => `${v.toFixed(1)} km`,
    },
    {
      label: 'Đơn ghép chiều về',
      leftVal: leftNow.backhaul,
      rightVal: rightNow.backhaul,
      betterSign: 1,
      fmt: (v) => `+${v.toFixed(0)} đơn`,
    },
    {
      label: 'Vi phạm giờ cấm QĐ 23',
      leftVal: leftNow.banViolations,
      rightVal: rightNow.banViolations,
      betterSign: -1,
      fmt: (v) => `${v.toFixed(0)} lỗi`,
    },
    {
      label: 'Phát thải CO₂e (kg)',
      leftVal: leftNow.co2Kg,
      rightVal: rightNow.co2Kg,
      betterSign: -1,
      fmt: (v) => `${v.toFixed(1)} kg`,
    },
  ];

  return (
    <div
      data-ui="evsim-dual-simulator"
      className="rounded-xl border border-[#d8cfbd] bg-[#e6dcc6] text-[#2f3440] shadow-sm overflow-hidden select-none"
      style={{ fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUploadFile(f);
        }}
      />

      {/* =====================================================================
          EVSIM HEADER BAR (#bar)
          ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-[#fffdf8] border-b border-[#d8cfbd]">
        <div className="flex flex-col">
          <strong className="text-[15px] text-[#2f3440]">
            Mô Phỏng Đối Chứng Đội Xe Tải Đô Thị TP.HCM ({result.file_name})
          </strong>
          <span className="text-[12px] text-[#6b6f78]">
            10 xe tải · {result.rows_valid} điểm giao · cùng nhu cầu đơn hàng, cùng đội xe (đối chứng trực tiếp)
          </span>
        </div>

        {/* Scenario & Baseline Pickers */}
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#6b6f78]">
          <label className="flex flex-col">
            <span>Tập dữ liệu (.xlsx)</span>
            <select
              value={
                SCENARIO_PRESETS.some((s) => s.file === result.file_name)
                  ? result.file_name
                  : 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') loadScenarioFile(e.target.value);
              }}
              className="mt-0.5 text-[12.5px] text-[#2f3440] font-semibold px-2 py-1 border border-[#d8cfbd] rounded-md bg-white"
            >
              {SCENARIO_PRESETS.map((sc) => (
                <option key={sc.id} value={sc.file}>
                  {sc.label}
                </option>
              ))}
              {!SCENARIO_PRESETS.some((s) => s.file === result.file_name) && (
                <option value="custom">File tải lên: {result.file_name}</option>
              )}
            </select>
          </label>

          <label className="flex flex-col">
            <span>Luật điều phối cơ sở (Bên trái)</span>
            <select
              value={baselineKey}
              onChange={(e) => setBaselineKey(e.target.value as 'human_google_proxy' | 'raw_excel')}
              className="mt-0.5 text-[12.5px] text-[#2f3440] font-semibold px-2 py-1 border border-[#d8cfbd] rounded-md bg-white"
            >
              <option value="human_google_proxy">B1: Chia Quận thủ công + Google Maps</option>
              <option value="raw_excel">B0: Thứ tự dòng Excel gốc (ERP)</option>
            </select>
          </label>
        </div>

        {/* EVSIM #gain Box */}
        <div
          className="text-center min-w-[175px] px-3 py-1 rounded-lg bg-[#eef7ee] border border-[#b9dfbf]"
          title="Mức tiết kiệm ròng của EcoMiles (Bên phải) so với Baseline (Bên trái)"
        >
          <div className="font-mono font-extrabold text-[19px] leading-tight text-[#2f9e44]">
            −{(baseSt.km_total - ecoSt.km_total).toFixed(1)} km ({ecoSt.delta_vs_human_km_pct}%)
          </div>
          <div className="text-[11px] text-[#6b6f78]">
            giảm rỗng <b className="text-[#2f9e44]">{netEmptyKmSavedTotal} km</b> · cứu giờ cấm{' '}
            <b className="text-[#2f9e44]">{rescuedBanCount} đơn</b>
          </div>
        </div>

        {/* Playback Controls & Modal Triggers */}
        <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
          <button
            onClick={() => setPlaying(!playing)}
            className="min-w-[38px] px-2.5 py-1 border border-[#d8cfbd] rounded-md bg-white font-bold text-[#2f3440] hover:bg-slate-50 cursor-pointer flex items-center justify-center"
            title="Chạy / Tạm dừng mô phỏng"
          >
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <span className="font-mono font-bold text-[18px] min-w-[62px] text-center text-[#2f3440]">
            {clockStr}
          </span>

          <input
            type="range"
            min={6 * 3600}
            max={20 * 3600}
            step={60}
            value={Math.round(timeSec)}
            onChange={(e) => setTimeSec(Number(e.target.value))}
            className="w-28 sm:w-40 accent-[#1971c2] cursor-pointer"
          />

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="px-1.5 py-1 border border-[#d8cfbd] rounded-md bg-white text-[#2f3440] font-semibold"
            title="Tốc độ mô phỏng"
          >
            <option value={30}>×30</option>
            <option value={60}>×60</option>
            <option value={120}>×120</option>
            <option value={240}>×240</option>
            <option value={300}>×300</option>
            <option value={600}>×600</option>
          </select>

          {[
            { h: 6, label: '06:00', tip: 'Đầu ca sáng (Giờ cấm QĐ 23)' },
            { h: 7.5, label: '07:30', tip: 'Cao điểm cấm tải sáng' },
            { h: 9.1, label: '09:05', tip: 'Hết giờ cấm sáng · Xe tải xuất kho' },
            { h: 13.25, label: '13:15', tip: 'Ca giao chiều' },
            { h: 16.5, label: '16:30', tip: 'Cao điểm cấm tải chiều' },
          ].map((jmp) => (
            <button
              key={jmp.label}
              onClick={() => setTimeSec(jmp.h * 3600)}
              title={jmp.tip}
              className="px-2 py-1 border border-[#d8cfbd] rounded-md bg-white hover:bg-slate-100 text-[#2f3440] text-[11.5px] font-semibold cursor-pointer"
            >
              {jmp.label}
            </button>
          ))}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 border border-[#2f9e44] rounded-md bg-[#2f9e44] hover:bg-[#258237] text-white font-bold flex items-center gap-1 cursor-pointer"
            title="Tải file Excel (.xlsx) hoặc CSV của doanh nghiệp bạn lên để mô phỏng trực tiếp"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Tải file .XLSX</span>
          </button>

          <button
            onClick={() => setShowColumnModal(true)}
            className="px-2.5 py-1 border border-[#d8cfbd] rounded-md bg-white hover:bg-slate-100 text-[#2f3440] font-semibold flex items-center gap-1 cursor-pointer"
            title="Xem từ điển ánh xạ cột Excel (Column Dictionary)"
          >
            <Table2 className="w-3.5 h-3.5 text-[#1971c2]" />
            <span>Cấu trúc cột</span>
          </button>

          <button
            onClick={() => setShowResultsModal(true)}
            className="px-3 py-1 border border-[#1971c2] rounded-md bg-[#1971c2] hover:bg-[#155ca0] text-white font-bold cursor-pointer"
            title="Mở bảng đối chứng thống kê chi tiết (EVSIM Results Panel)"
          >
            Kết quả đối chứng
          </button>
          <button
            type="button"
            onClick={() => setShowDeviceBanner((prev) => !prev)}
            className={`px-2.5 py-1 border rounded-md font-bold flex items-center gap-1.5 text-[12px] cursor-pointer transition-colors ${
              showDeviceBanner
                ? 'border-[#14532d] bg-[#14532d] text-[#d6f65a]'
                : 'border-[#d8cfbd] bg-white hover:bg-slate-100 text-[#2f3440]'
            }`}
            title="Xem dàn 7 thiết bị đồng bộ thời gian thực"
          >
            <span>7 Thiết Bị Đồng Bộ</span>
          </button>
        </div>
      </div>
      {showDeviceBanner && (
        <div className="bg-[#060d14] border-b border-emerald-900/60 px-3.5 py-2.5 text-white transition-all">
          <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img
                src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                alt="EcoMiles 7-Device Studio Stage"
                onClick={() => setEvsimLightboxIdx(0)}
                className="h-12 sm:h-14 w-auto object-contain rounded-lg border border-white/15 bg-black/40 p-0.5 shrink-0 cursor-zoom-in"
              />
              <div className="min-w-0">
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#d6f65a]">
                  Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (Chuẩn Đối Chứng Windows XPS 16 &amp; MacBook Pro 16&quot;)
                </div>
                <div className="text-xs text-slate-300">
                  MacBook Pro 16&quot; · Windows 11 XPS 16 · Galaxy Z Fold · iPad Pro M4 · iPhone Duo · iPhone 18 Pro Max · Galaxy S26 Ultra
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
              <a
                href="/dashboard/"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
              >
                Mở Bảng Điều Khiển
              </a>
              <a
                href="/driver/"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
              >
                Mở Ứng Dụng Tài Xế
              </a>
              <a
                href="/maps/"
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
              >
                Mở Bản Đồ Xe Tải
              </a>
            </div>
          </div>
        </div>
      )}

      {uploadNotice && (
        <div className="px-4 py-2 bg-[#eef7ee] border-b border-[#b9dfbf] text-[12px] text-[#14532d] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#2f9e44]" />
            <span>{uploadNotice}</span>
          </div>
          <button onClick={() => setUploadNotice('')} className="text-[11px] font-bold underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* =====================================================================
          EVSIM SIDE-BY-SIDE SPLIT (#split: Left = Baseline, Right = EcoMiles)
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 bg-[#e6dcc6]">
        {[
          {
            id: 'side-base',
            isEco: false,
            title: `Không có EcoMiles (${baseSt.name})`,
            subtitle: `${baseSt.subtitle} · ${baseSt.vehicles_used} chuyến xe`,
            mapRef: leftMapCanvasRef,
            sparkRef: leftSparkCanvasRef,
            st: baseSt,
          },
          {
            id: 'side-v21',
            isEco: true,
            title: 'Có lớp tối ưu EcoMiles v2.1 (EcoALNS + Né cấm tải QĐ 23 + Ghép đơn về)',
            subtitle: `Gom cụm bán kính 3km + Dời lịch cấm tải hợp pháp + Ghép ${ecoSt.backhaul_orders_matched} đơn chiều về · ${ecoSt.vehicles_used} chuyến xe`,
            mapRef: rightMapCanvasRef,
            sparkRef: rightSparkCanvasRef,
            st: ecoSt,
          },
        ].map((panel) => (
          <section
            key={panel.id}
            className="flex flex-col bg-[#fffdf8] border border-[#d8cfbd] rounded-[10px] overflow-hidden"
          >
            {/* Side Header */}
            <div className="px-3 py-2 border-b border-[#d8cfbd] flex items-center justify-between">
              <div>
                <h2
                  className={`text-[14px] font-bold m-0 ${
                    panel.isEco ? 'text-[#1971c2]' : 'text-[#2f3440]'
                  }`}
                >
                  {panel.title}
                </h2>
                <small className="block text-[11.5px] text-[#6b6f78]">{panel.subtitle}</small>
              </div>
              <button
                onClick={resetView}
                className="px-2 py-0.5 text-[11px] border border-[#d8cfbd] rounded bg-white text-[#6b6f78] hover:text-[#2f3440] flex items-center gap-1 cursor-pointer"
                title="Khôi phục góc nhìn bản đồ"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Căn giữa</span>
              </button>
            </div>

            {/* Interactive Synchronized HCMC Map Canvas */}
            <div className="relative h-[310px] w-full bg-[#e6dcc6] overflow-hidden">
              <canvas
                ref={panel.mapRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={resetView}
                className="w-full h-full block cursor-grab active:cursor-grabbing"
              />
            </div>

            {/* 6 Live Time-Synchronized KPI Cells (.kpis) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 px-2.5 py-2 border-t border-[#d8cfbd] bg-[#fffdf8]">
              {KPI_CELLS.map((cell) => {
                const myVal = panel.isEco ? cell.rightVal : cell.leftVal;
                const otherVal = panel.isEco ? cell.leftVal : cell.rightVal;
                const diff = (myVal - otherVal) * cell.betterSign;
                const colorClass =
                  Math.abs(myVal - otherVal) < 0.05
                    ? 'text-[#2f3440]'
                    : diff > 0
                    ? 'text-[#2f9e44]'
                    : 'text-[#e03131]';
                return (
                  <div key={cell.label} className="text-center">
                    <div className={`font-mono font-bold text-[16px] leading-tight ${colorClass}`}>
                      {cell.fmt(myVal)}
                    </div>
                    <div className="text-[11px] text-[#6b6f78]">{cell.label}</div>
                  </div>
                );
              })}

              {/* Full Shift Summary Footer (.final) */}
              <div className="col-span-3 sm:col-span-6 pt-1 border-t border-[#eee6d6] text-[11.5px] text-[#6b6f78] text-center">
                Tổng kết cả ca: cự ly <b className="text-[#2f3440]">{panel.st.km_total.toFixed(1)} km</b> · chạy rỗng{' '}
                <b className="text-[#2f3440]">
                  {panel.st.km_empty_return.toFixed(1)} km ({panel.st.empty_running_pct}%)
                </b>{' '}
                · chi phí nhiên liệu{' '}
                <b className="text-[#2f3440]">{panel.st.fuel_cost_vnd.toLocaleString('vi-VN')} đ</b> · phát thải{' '}
                <b className="text-[#2f3440]">{panel.st.kg_co2_ttw.toFixed(2)} kg CO₂e</b> · vi phạm QĐ 23:{' '}
                <b className={panel.st.ban_violations === 0 ? 'text-[#2f9e44]' : 'text-[#e03131]'}>
                  {panel.st.ban_violations} đơn
                </b>
              </div>
            </div>

            {/* Bottom 72px Timeline Sparkline Canvas (canvas.chart) */}
            <canvas ref={panel.sparkRef} className="w-full h-[72px] block border-t border-[#d8cfbd]" />

            {/* Per-Truck Route Breakdown with Paired 7-Device Hardware Badges */}
            <div className="border-t border-[#d8cfbd] bg-[#fffdf8] p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#6b6f78] uppercase tracking-wider">
                  Chi Tiết {panel.st.routes.length} Chuyến Xe &amp; 7 Thiết Bị Đồng Bộ
                </span>
                <span className="text-[10.5px] font-semibold text-[#1971c2]">
                  {panel.isEco ? 'EcoALNS v2.1' : baseSt.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[156px] overflow-y-auto pr-1">
                {panel.st.routes.map((route, rIdx) => {
                  const pairedDevice = [
                    'Galaxy Z Fold (Buồng lái)',
                    'iPhone Duo (Gập Đôi)',
                    'iPhone 18 Pro Max (Nắng Gắt)',
                    'Galaxy S26 Ultra (Waypoints)',
                    'iPad Pro M4 (Taplo Kho)',
                    'MacBook Pro 16" (TMS)',
                    'Windows 11 XPS 16 (EVSIM)',
                  ][rIdx % 7];
                  const nonDepotCount = route.stops.filter((s) => s.kind !== 'depot').length;
                  return (
                    <div
                      key={`${route.plate}-${rIdx}`}
                      className="flex flex-col gap-1 p-2 rounded-lg bg-white border border-[#e3dcd0] text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: route.color }}
                          />
                          <span className="font-bold text-[#2f3440]">Xe {rIdx + 1}</span>
                          <span className="font-mono text-[10px] px-1 rounded bg-slate-100 text-slate-700 font-semibold">
                            {route.plate}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#2f3440]">
                          {route.km.toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEvsimLightboxIdx((rIdx % 7) + 1)}
                          title={`Phóng to mockup 2.4K: ${pairedDevice}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold bg-[#e8f0fb] hover:bg-[#d0e2ff] text-[#1971c2] border border-[#c9d6e8]/60 truncate cursor-pointer transition-colors"
                        >
                          <span>{pairedDevice}</span>
                          <ZoomIn className="w-2.5 h-2.5 opacity-75 shrink-0" />
                        </button>
                        <span className="text-[#6b6f78] shrink-0 font-medium">
                          {nonDepotCount} điểm ·{' '}
                          {route.ban_conflicts > 0 ? (
                            <b className="text-[#e03131]">{route.ban_conflicts} lỗi QĐ23</b>
                          ) : (
                            <b className="text-[#2f9e44]">0 vi phạm</b>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* =====================================================================
          EVSIM FOOTER LEGEND (#legend)
          ===================================================================== */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-2 bg-[#fffdf8] border-t border-[#d8cfbd] text-[12px] text-[#2f3440]">
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-[#2f9e44]" />
          Xe tải đủ tải (≥55%)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-[#f2c94c]" />
          Tải trung bình (25 - 55%)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-[#1971c2]" />
          Xe đang chở đơn ghép chiều về (Backhaul)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 rounded-full bg-[#e03131]" />
          Xe chạy rỗng hoặc dính giờ cấm QĐ 23
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-2.5 h-2.5 bg-[#22a06b] border border-white outline outline-1 outline-[#22a06b]" />
          Kho Trung tâm Tân Bình DC
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-[#12b886] fill-current" />
          Điểm giao EcoMiles cứu khỏi giờ cấm QĐ 23
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-[#e03131] fill-current" />
          Điểm giao bị phạt giờ cấm ở Baseline
        </span>
        <span className="ml-auto font-semibold text-[#1971c2]">
          Mẹo: Lăn chuột hoặc kéo trên bản đồ để phóng to / di chuyển đồng bộ cả 2 bên
        </span>
      </div>

      {/* =====================================================================
          EVSIM "KẾT QUẢ" STATISTICAL COMPARISON MODAL (#results)
          White panel, #1f3a5f navy header, #fff4cc highlighted ROI row
          ===================================================================== */}
      {showResultsModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResultsModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
        >
          <div
            role="dialog"
            aria-label="Bảng kết quả đối chứng"
            className="w-full max-w-4xl bg-white text-[#2f3440] rounded-xl shadow-2xl border border-[#c9d6e8] overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#1f3a5f] text-white flex items-center justify-between">
              <strong className="text-[16px]">
                Kết quả đối chứng: Thuật toán EcoMiles v2.1 so với {baseSt.name}
              </strong>
              <button
                onClick={() => setShowResultsModal(false)}
                className="px-2.5 py-1 rounded border border-white/40 text-white hover:bg-white/10 cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
                <div>
                  Tập dữ liệu đang kiểm định: <strong>{result.file_name}</strong> ({result.rows_valid} đơn hàng · Mã băm{' '}
                  <code className="text-[#1971c2]">{result.dataset_fingerprint}</code>)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportMultiSheetReport}
                    className="px-3 py-1.5 rounded-md bg-[#2f9e44] hover:bg-[#258237] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Tải Báo Cáo Excel 3 Sheet (.XLS)</span>
                  </button>
                  <a
                    href={`/samples/${
                      SCENARIO_PRESETS.some((s) => s.file === result.file_name)
                        ? result.file_name
                        : 'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx'
                    }`}
                    download
                    className="px-3 py-1.5 rounded-md border border-[#c9d6e8] bg-white hover:bg-slate-50 text-[#1f3a5f] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file .xlsx mẫu</span>
                  </a>
                </div>
              </div>

              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="bg-[#e8f0fb] text-[#1f3a5f] font-bold">
                    <th className="py-2.5 px-3 text-left border-b border-[#e3e9f2]">Chỉ số đo lường</th>
                    <th className="py-2.5 px-3 text-right border-b border-[#e3e9f2]">Có lớp tối ưu EcoMiles v2.1</th>
                    <th className="py-2.5 px-3 text-right border-b border-[#e3e9f2]">{baseSt.name}</th>
                    <th className="py-2.5 px-3 text-right border-b border-[#e3e9f2]">Chênh lệch ròng</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      label: '1. Tổng quãng đường toàn đội xe (km)',
                      eco: `${ecoSt.km_total.toFixed(1)} km`,
                      base: `${baseSt.km_total.toFixed(1)} km`,
                      diff: `−${(baseSt.km_total - ecoSt.km_total).toFixed(1)} km (${ecoSt.delta_vs_human_km_pct}%)`,
                      good: true,
                      highlight: false,
                    },
                    {
                      label: '2. Quãng đường & Tỷ lệ xe chạy rỗng chiều về',
                      eco: `${ecoSt.km_empty_return.toFixed(1)} km (${ecoSt.empty_running_pct}%)`,
                      base: `${baseSt.km_empty_return.toFixed(1)} km (${baseSt.empty_running_pct}%)`,
                      diff: `−${(baseSt.km_empty_return - ecoSt.km_empty_return).toFixed(1)} km rỗng (−${(
                        baseSt.empty_running_pct - ecoSt.empty_running_pct
                      ).toFixed(1)} pt)`,
                      good: true,
                      highlight: false,
                    },
                    {
                      label: '3. Số đơn lấy hàng chiều về kho ghép thêm (Backhaul)',
                      eco: `+${ecoSt.backhaul_orders_matched} đơn (${ecoSt.backhaul_kg_recovered} kg)`,
                      base: '0 đơn (0 kg)',
                      diff: `+${ecoSt.backhaul_orders_matched} đơn thu hồi`,
                      good: true,
                      highlight: false,
                    },
                    {
                      label: '4. Chi phí nhiên liệu trực tiếp / ca vận hành (VNĐ)',
                      eco: `${ecoSt.fuel_cost_vnd.toLocaleString('vi-VN')} đ`,
                      base: `${baseSt.fuel_cost_vnd.toLocaleString('vi-VN')} đ`,
                      diff: `Tiết kiệm ${(baseSt.fuel_cost_vnd - ecoSt.fuel_cost_vnd).toLocaleString('vi-VN')} đ/ca`,
                      good: true,
                      highlight: true,
                    },
                    {
                      label: '5. Phát thải CO₂e trực tiếp Phạm vi 1 (TTW - GLEC v3.2)',
                      eco: `${ecoSt.kg_co2_ttw.toFixed(2)} kg CO₂e`,
                      base: `${baseSt.kg_co2_ttw.toFixed(2)} kg CO₂e`,
                      diff: `−${(baseSt.kg_co2_ttw - ecoSt.kg_co2_ttw).toFixed(2)} kg (${ecoSt.delta_vs_human_co2_pct}%)`,
                      good: true,
                      highlight: false,
                    },
                    {
                      label: '6. Phát thải CO₂e toàn vòng đời nhiên liệu (WTW)',
                      eco: `${ecoSt.kg_co2_wtw.toFixed(2)} kg CO₂e`,
                      base: `${baseSt.kg_co2_wtw.toFixed(2)} kg CO₂e`,
                      diff: `−${(baseSt.kg_co2_wtw - ecoSt.kg_co2_wtw).toFixed(2)} kg WTW`,
                      good: true,
                      highlight: false,
                    },
                    {
                      label: '7. Số đơn vi phạm khung giờ cấm tải TP.HCM (QĐ 23/2018)',
                      eco: `${ecoSt.ban_violations} đơn`,
                      base: `${baseSt.ban_violations} đơn`,
                      diff:
                        baseSt.ban_violations > 0
                          ? `Triệt tiêu 100% (${baseSt.ban_violations} → 0 lỗi)`
                          : '0 vi phạm',
                      good: true,
                      highlight: false,
                    },
                    {
                      label: '8. Hệ số lấp đầy tải trọng đội xe trung bình (%)',
                      eco: `${ecoSt.payload_utilisation_pct}% (${ecoSt.vehicles_used} xe)`,
                      base: `${baseSt.payload_utilisation_pct}% (${baseSt.vehicles_used} xe)`,
                      diff: `+${(ecoSt.payload_utilisation_pct - baseSt.payload_utilisation_pct).toFixed(1)} điểm %`,
                      good: true,
                      highlight: false,
                    },
                  ].map((r, idx) => (
                    <tr
                      key={r.label}
                      className={
                        r.highlight
                          ? 'bg-[#fff4cc] font-bold text-[14.5px]'
                          : idx % 2 === 1
                          ? 'bg-[#f7f9fc]'
                          : 'bg-white'
                      }
                    >
                      <td
                        className="py-2 px-3 border-b border-[#e3e9f2]"
                        style={r.highlight ? { boxShadow: 'inset 4px 0 0 #f0b400' } : undefined}
                      >
                        {r.label}
                      </td>
                      <td className="py-2 px-3 text-right font-mono border-b border-[#e3e9f2]">{r.eco}</td>
                      <td className="py-2 px-3 text-right font-mono border-b border-[#e3e9f2]">{r.base}</td>
                      <td
                        className={`py-2 px-3 text-right font-mono font-bold border-b border-[#e3e9f2] ${
                          r.good ? 'text-[#2f9e44]' : 'text-[#e03131]'
                        }`}
                      >
                        {r.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-[12px] text-[#6b6f78] m-0">
                Ghi chú phương pháp luận: Cả hai bên cùng chạy trên một ma trận khoảng cách đường bộ TP.HCM (Haversine × 1.35 / OSM) và cùng hệ số phát thải GLEC Framework v3.2 / ISO 14083:2023 (Diesel: 2,68 kg/L TTW, 3,24 kg/L WTW; Xăng: 2,31 kg/L TTW, 2,82 kg/L WTW).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          COLUMN DICTIONARY & SCHEMA MAPPER MODAL
          ===================================================================== */}
      {showColumnModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowColumnModal(false);
          }}
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
        >
          <div
            role="dialog"
            aria-label="Từ điển ánh xạ cột Excel"
            className="w-full max-w-3xl bg-white text-[#2f3440] rounded-xl shadow-2xl border border-[#c9d6e8] overflow-hidden"
          >
            <div className="px-5 py-3.5 bg-[#1f3a5f] text-white flex items-center justify-between">
              <strong className="text-[15px]">
                Từ Điển Ánh Xạ Cột Dữ Liệu Excel (.xlsx) &amp; Tự Động Làm Sạch Địa Chỉ
              </strong>
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-2 py-0.5 rounded border border-white/40 text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[80vh] overflow-y-auto text-[13px]">
              <p className="text-[#6b6f78] m-0">
                Khi doanh nghiệp tải file <code>.xlsx</code> xuất từ phần mềm ERP/Kế toán (SAP, KiotViet, Haravan, Odoo), bộ từ điển cột của EcoMiles tự động khớp tên cột tiếng Việt/tiếng Anh và nội suy tọa độ GPS nếu file thiếu cột Vĩ độ / Kinh độ:
              </p>

              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#e8f0fb] text-[#1f3a5f] font-bold">
                    <th className="py-2 px-3 text-left border-b border-[#e3e9f2]">Trường chuẩn EcoMiles</th>
                    <th className="py-2 px-3 text-left border-b border-[#e3e9f2]">Ý nghĩa nghiệp vụ</th>
                    <th className="py-2 px-3 text-left border-b border-[#e3e9f2]">Cột khớp trong file hiện tại</th>
                    <th className="py-2 px-3 text-left border-b border-[#e3e9f2]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {columnInspection.map((col, idx) => (
                    <tr key={col.canonical_field} className={idx % 2 === 1 ? 'bg-[#f7f9fc]' : 'bg-white'}>
                      <td className="py-2 px-3 font-mono font-bold border-b border-[#e3e9f2]">
                        {col.canonical_field}
                      </td>
                      <td className="py-2 px-3 border-b border-[#e3e9f2]">{col.label_vi}</td>
                      <td className="py-2 px-3 font-mono border-b border-[#e3e9f2]">
                        {col.matched_header ? `"${col.matched_header}" (Cột #${(col.column_index ?? 0) + 1})` : 'Tự động nội suy'}
                      </td>
                      <td className="py-2 px-3 border-b border-[#e3e9f2] font-bold">
                        {col.status === 'matched' ? (
                          <span className="text-[#2f9e44] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã khớp tự động</span>
                          </span>
                        ) : (
                          <span className="text-[#1971c2] inline-flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Nội suy thông minh</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {evsimLightboxIdx !== null &&
        typeof document !== 'undefined' &&
        (() => {
          const total = EVSIM_HARDWARE_MOCKUP_ASSETS.length;
          const safeIdx = ((evsimLightboxIdx % total) + total) % total;
          const activeAsset = EVSIM_HARDWARE_MOCKUP_ASSETS[safeIdx];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeAsset.title}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setEvsimLightboxIdx(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-[#d6f65a]/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#d6f65a] truncate">
                      [{safeIdx + 1}/{total}] {activeAsset.title}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{activeAsset.spec}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEvsimLightboxIdx((safeIdx - 1 + total) % total)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvsimLightboxIdx((safeIdx + 1) % total)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <span>Tiếp</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={activeAsset.src}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#d6f65a] hover:bg-[#c5e847] text-slate-950 font-extrabold text-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải PNG 2.4K</span>
                    </a>
                    <a
                      href={activeAsset.liveHref}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-400/30"
                    >
                      <span>Mở App Live</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setEvsimLightboxIdx(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Đóng</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={activeAsset.src}
                    alt={activeAsset.title}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {EVSIM_HARDWARE_MOCKUP_ASSETS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEvsimLightboxIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        idx === safeIdx
                          ? 'bg-[#d6f65a] text-slate-950 border-[#d6f65a]'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {item.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}
    </div>
  );
}
