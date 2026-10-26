import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  Play,
  Pause,
  RotateCcw,
  Table2,
  X,
  CheckCircle2,
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
  computeHcmcStreetPath,
  interpolateAlongStreetPath,
  getOrFetchOsrmRouteGeometry,
  type LngLat,
} from '../utils/hcmcRoadGraph';

const DEPOT_COORD = { lat: 10.8018, lng: 106.6385, label: 'Kho Tân Bình (364 Cộng Hòa)' };


interface SimulatedTruckLeg {
  truckIdx: number;
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

interface SimulatedTimelineSide {
  strategy: StrategySummary;
  legs: SimulatedTruckLeg[];
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
  const stopEvents: SimulatedTimelineSide['stopEvents'] = [];

  strategy.routes.forEach((route: BenchmarkPlannedRoute, rIdx: number) => {
    const nonDepotStops = route.stops.filter((s) => s.kind === 'stop' || s.kind === 'backhaul');
    if (nonDepotStops.length === 0) return;

    const firstWinSec = parseTimeSec(nonDepotStops[0].window_start, 8 * 3600);
    let clockSec = isEcoMilesArm
      ? Math.max(7 * 3600 + 1800, Math.min(7 * 3600 + 2400, firstWinSec)) + (rIdx % 4) * 150
      : Math.max(7 * 3600 + 1800, Math.min(7 * 3600 + 2400, firstWinSec)) + (rIdx % 6) * 300;

    let curLat = DEPOT_COORD.lat;
    let curLng = DEPOT_COORD.lng;
    const totalStops = nonDepotStops.length;

    nonDepotStops.forEach((stop, sIdx) => {
      const streetSeg =
        stop.leg_path && stop.leg_path.length >= 2
          ? { path: stop.leg_path, distanceKm: Math.max(0.4, computeHcmcStreetPath(curLng, curLat, stop.lng, stop.lat).distanceKm) }
          : computeHcmcStreetPath(curLng, curLat, stop.lng, stop.lat);
      const legKm = streetSeg.distanceKm;
      const speedKmh = isEcoMilesArm ? 29.0 : 18.5;
      const travelSec = Math.max(120, Math.round((legKm / speedKmh) * 3600));
      const serviceSec = isEcoMilesArm ? 185 : 340;
      const t0 = clockSec;
      const t1 = t0 + travelSec;
      const isBh = stop.kind === 'backhaul';
      const loadStart = isBh ? 0.35 : Math.max(0.1, 1 - sIdx / totalStops);
      const loadEnd = isBh ? 0.55 : Math.max(0.05, 1 - (sIdx + 1) / totalStops);
      const inBanHour = !isEcoMilesArm && (stop.qd23_ban_conflict || isQd23PeakSec(t1));

      legs.push({
        truckIdx: rIdx,
        plate: route.plate,
        fuel: route.fuel,
        color: route.color,
        tStartSec: t0,
        tEndSec: t1,
        path: streetSeg.path,
        loadRatioStart: loadStart,
        loadRatioEnd: loadEnd,
        legKm,
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

      clockSec = t1 + serviceSec;
      curLat = stop.lat;
      curLng = stop.lng;
    });

    // Return leg to Kho Tân Bình DC along real HCMC street network
    const retDepotStop = route.stops[route.stops.length - 1];
    const retSeg =
      retDepotStop && retDepotStop.kind === 'depot' && retDepotStop.leg_path && retDepotStop.leg_path.length >= 2
        ? { path: retDepotStop.leg_path, distanceKm: computeHcmcStreetPath(curLng, curLat, DEPOT_COORD.lng, DEPOT_COORD.lat).distanceKm }
        : computeHcmcStreetPath(curLng, curLat, DEPOT_COORD.lng, DEPOT_COORD.lat);
    const retKm = retSeg.distanceKm;
    const retTravelSec = Math.max(240, Math.round((retKm / 28.0) * 3600));
    legs.push({
      truckIdx: rIdx,
      plate: route.plate,
      fuel: route.fuel,
      color: route.color,
      tStartSec: clockSec,
      tEndSec: clockSec + retTravelSec,
      path: retSeg.path,
      loadRatioStart: isEcoMilesArm && route.backhaul_orders_matched > 0 ? 0.55 : 0.0,
      loadRatioEnd: isEcoMilesArm && route.backhaul_orders_matched > 0 ? 0.55 : 0.0,
      legKm: retKm,
      isEmptyReturn: !isEcoMilesArm || route.backhaul_orders_matched === 0,
      isBackhaulPickup: isEcoMilesArm && route.backhaul_orders_matched > 0,
      violatesQd23: false,
      stopOrderId: null,
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
  const [speed, setSpeed] = useState<number>(120);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [showColumnModal, setShowColumnModal] = useState<boolean>(false);
  const [columnInspection, setColumnInspection] = useState<ColumnMappingInspection[]>([]);
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
    if (!result) {
      loadScenarioFile('EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx');
    }
  }, []);

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

    const drawMapCanvas = (
      canvas: HTMLCanvasElement | null,
      side: SimulatedTimelineSide,
      isRightEcoSide: boolean
    ) => {
      if (!canvas) return;
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

      // 2. Planned Route Polylines (crisp halo + route stroke on top of real HCMC streets)
      // 2. Planned Street-Following Route Polylines (uses OSRM full street GeoJSON when loaded, Dijkstra street graph while loading)
      for (const route of side.strategy.routes) {
        if (route.stops.length < 2) continue;
        const stopCoords: LngLat[] = route.stops.map((s) => [s.lng, s.lat]);
        const osrmGeom = getOrFetchOsrmRouteGeometry(stopCoords, () =>
          setTileTick((n) => (n + 1) % 10000)
        );

        ctx.beginPath();
        let started = false;
        if (osrmGeom && osrmGeom.length >= 2) {
          for (const [lng, lat] of osrmGeom) {
            const [x, y] = toXY(lng, lat);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        } else {
          for (const s of route.stops) {
            const pts = s.leg_path && s.leg_path.length > 0 ? s.leg_path : ([[s.lng, s.lat]] as LngLat[]);
            for (const [lng, lat] of pts) {
              const [x, y] = toXY(lng, lat);
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            }
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = route.color || (isRightEcoSide ? '#1971c2' : '#e03131');
        ctx.lineWidth = 2.3;
        ctx.stroke();
      }

      // 3. Customer Stop Dots + Merged Backhaul Pins + EVSIM Star Diffs (★)
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
            ctx.lineTo(Math.cos(((18 + i * 72) / 180) * Math.PI) * 7.5, -Math.sin(((18 + i * 72) / 180) * Math.PI) * 7.5);
            ctx.lineTo(Math.cos(((54 + i * 72) / 180) * Math.PI) * 3.5, -Math.sin(((54 + i * 72) / 180) * Math.PI) * 3.5);
          }
          ctx.closePath();
          ctx.fillStyle = isRightEcoSide ? '#12b886' : '#e03131';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        } else if (ev.kind === 'backhaul') {
          // Blue Backhaul Pickup Pin on Return Leg
          ctx.beginPath();
          ctx.arc(sx, sy, 4.8, 0, Math.PI * 2);
          ctx.fillStyle = delivered ? '#1971c2' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#1971c2';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, delivered ? 4.2 : 3.4, 0, Math.PI * 2);
          ctx.fillStyle = delivered ? '#2f9e44' : '#7048e8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
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

      // 5. Active Moving Trucks Interpolated Along Street Polylines (`leg.path`)
      for (const leg of side.legs) {
        if (timeSec < leg.tStartSec || timeSec > leg.tEndSec) continue;
        const frac = (timeSec - leg.tStartSec) / Math.max(1, leg.tEndSec - leg.tStartSec);
        const [curLng, curLat] = interpolateAlongStreetPath(leg.path, frac);
        const [tx, ty] = toXY(curLng, curLat);
        const loadNow = leg.loadRatioStart + (leg.loadRatioEnd - leg.loadRatioStart) * frac;

        const fillCol = leg.violatesQd23 || leg.isEmptyReturn
          ? '#e03131'
          : leg.isBackhaulPickup
          ? '#1971c2'
          : loadNow >= 0.55
          ? '#2f9e44'
          : loadNow >= 0.25
          ? '#f2c94c'
          : '#f08c00';

        ctx.beginPath();
        ctx.arc(tx, ty, 6.8, 0, Math.PI * 2);
        ctx.fillStyle = fillCol;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }

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

    drawMapCanvas(leftMapCanvasRef.current, leftSide, false);
    drawMapCanvas(rightMapCanvasRef.current, rightSide, true);
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
        </div>
      </div>

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
          Tải trung bình (25–55%)
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
          <span className="text-[#12b886] font-bold">★</span>
          Điểm giao EcoMiles cứu khỏi giờ cấm QĐ 23
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[#e03131] font-bold">★</span>
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
                className="px-2.5 py-1 rounded border border-white/40 text-white hover:bg-white/10 cursor-pointer"
              >
                ✕
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
                          <span className="text-[#2f9e44]">✓ Đã khớp tự động</span>
                        ) : (
                          <span className="text-[#1971c2]">⚡ Nội suy thông minh</span>
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
    </div>
  );
}
