import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Download,
  Eye,
  Layers,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Truck,
  Volume2,
} from 'lucide-react';
import {
  parseXlsxToRows,
  runEphemeralBenchmarkFromRows,
  type BenchmarkPlannedRoute,
  type BenchmarkRouteStop,
  type EphemeralBenchmarkResult,
} from '../utils/xlsxBenchmarkEngine';
import {
  drawHcmcMapTiles,
  projectLatLngToCanvas,
  type MercatorViewport,
} from '../utils/hcmcMapTiles';
import {
  getOrFetchOsrmLegPaths,
  interpolateAlongStreetPathWithHeading,
  type LngLat,
} from '../utils/hcmcRoadGraph';

// =============================================================================
// HCMC QĐ 23/2018/QĐ-UBND BANNED TRUCK ZONES, BANNED STREETS & BRIDGE CLEARANCES
// =============================================================================
interface BannedTruckZone {
  id: string;
  name: string;
  rule: string;
  fineVnd: string;
  polygon: LngLat[]; // [lng, lat]
  labelCoord: LngLat;
}

interface BannedStreetCorridor {
  id: string;
  streetName: string;
  banHours: string;
  reason: string;
  coords: LngLat[];
}

interface BridgeClearanceMarker {
  id: string;
  name: string;
  lng: number;
  lat: number;
  maxWeightTons: number;
  maxHeightM: number;
  allowedForTruck: boolean;
  note: string;
}

const HCMC_QD23_BANNED_ZONES: BannedTruckZone[] = [
  {
    id: 'ZONE-CORE-Q1-Q3-PN',
    name: 'Vùng Cấm Tải Lõi Trung Tâm (Q.1 · Q.3 · Phú Nhuận)',
    rule: 'Cấm xe tải nhẹ 06:00–09:00 & 16:00–20:00 · Cấm xe tải >2.5T 06:00–22:00 (QĐ 23/2018)',
    fineVnd: 'Phạt 5.000.000 ₫ + Tước GPLX 2 tháng (NĐ 168/2024)',
    polygon: [
      [106.6655, 10.7995],
      [106.6885, 10.7985],
      [106.7068, 10.7885],
      [106.7062, 10.7685],
      [106.6825, 10.7645],
      [106.6682, 10.7775],
    ],
    labelCoord: [106.6865, 10.7825],
  },
  {
    id: 'ZONE-AIRPORT-GATEWAY',
    name: 'Hành Lang Cấm Giờ Cao Điểm Cửa Ngõ Sân Bay (Trường Sơn – Nguyễn Văn Trỗi)',
    rule: 'Cấm xe tải >1.5T lưu thông hướng vào nội đô 06:00–09:00 & 16:00–20:00',
    fineVnd: 'Camera phạt nguội tự động 5.000.000 ₫',
    polygon: [
      [106.6525, 10.8025],
      [106.6745, 10.8065],
      [106.6785, 10.7935],
      [106.6565, 10.7905],
    ],
    labelCoord: [106.6655, 10.7985],
  },
  {
    id: 'ZONE-CHOLON-Q5-Q10',
    name: 'Vùng Cấm Tải Nội Đô Chợ Lớn – Quận 5 / Quận 10',
    rule: 'Cấm xe tải >500kg vào trục Ba Tháng Hai – Hùng Vương 06:00–09:00 & 16:00–20:00',
    fineVnd: 'Phạt 5.000.000 ₫ (QĐ 23/2018/QĐ-UBND)',
    polygon: [
      [106.6515, 10.7765],
      [106.6755, 10.7755],
      [106.6765, 10.7535],
      [106.6505, 10.7525],
    ],
    labelCoord: [106.6635, 10.7645],
  },
];

const HCMC_BANNED_STREETS: BannedStreetCorridor[] = [
  {
    id: 'BAN-NVT-NKKN',
    streetName: 'Trục Nguyễn Văn Trỗi – Nam Kỳ Khởi Nghĩa',
    banHours: 'Cấm tải 06:00–09:00 & 16:00–20:00',
    reason: 'Trục ngoại giao sân bay Tân Sơn Nhất – Quận 1 (Camera phạt nguội 24/7)',
    coords: [
      [106.6602, 10.7998],
      [106.6712, 10.7962],
      [106.6828, 10.7885],
      [106.6952, 10.7785],
    ],
  },
  {
    id: 'BAN-CMT8',
    streetName: 'Trục Cách Mạng Tháng 8 (Tân Bình → Quận 1)',
    banHours: 'Cấm tải 06:00–09:00 & 16:00–20:00',
    reason: 'Đường hẹp mật độ cao + Rào chắn Metro số 2',
    coords: [
      [106.6532, 10.7918],
      [106.6665, 10.7845],
      [106.6808, 10.7768],
      [106.6925, 10.7715],
    ],
  },
  {
    id: 'BAN-3THANG2',
    streetName: 'Trục Ba Tháng Hai – Điện Biên Phủ Nội Đô',
    banHours: 'Cấm tải >500kg giờ cao điểm',
    reason: 'Hành lang cấm tải nội đô theo QĐ 23/2018/QĐ-UBND',
    coords: [
      [106.6525, 10.7625],
      [106.6685, 10.7695],
      [106.6815, 10.7765],
      [106.6985, 10.7895],
    ],
  },
];

const HCMC_BRIDGE_CLEARANCES: BridgeClearanceMarker[] = [
  {
    id: 'BR-BINH-LOI',
    name: 'Cầu Bình Lợi (Đại lộ Phạm Văn Đồng)',
    lng: 106.7095,
    lat: 10.8245,
    maxWeightTons: 13.0,
    maxHeightM: 4.5,
    allowedForTruck: true,
    note: 'Hành lang xe tải hợp pháp kết nối Gò Vấp ↔ TP. Thủ Đức',
  },
  {
    id: 'BR-SAI-GON',
    name: 'Cầu Sài Gòn (Xa lộ Hà Nội)',
    lng: 106.7268,
    lat: 10.7988,
    maxWeightTons: 30.0,
    maxHeightM: 4.5,
    allowedForTruck: true,
    note: 'Trục huyết mạch Đông Bắc cho phép xe tải & chuỗi lạnh',
  },
  {
    id: 'BR-KENH-TE',
    name: 'Cầu Kênh Tẻ (Quận 4 ↔ Quận 7)',
    lng: 106.7018,
    lat: 10.7518,
    maxWeightTons: 15.0,
    maxHeightM: 4.2,
    allowedForTruck: true,
    note: 'Cho phép xe tải nhẹ ngoài khung giờ cấm cao điểm',
  },
  {
    id: 'BR-THU-THIEM-TUNNEL',
    name: 'Hầm Thủ Thiêm (Cấm Xe Tải Giờ Cao Điểm)',
    lng: 106.7082,
    lat: 10.7705,
    maxWeightTons: 0,
    maxHeightM: 3.5,
    allowedForTruck: false,
    note: 'Cấm xe tải & xe chở hàng nguy hiểm đi qua hầm',
  },
];

interface DetailedTurnStep {
  stepIdx: number;
  legIdx: number;
  fromLabel: string;
  toLabel: string;
  district: string;
  maneuverIcon: '↑' | '↱' | '↰' | '⤴' | '🏁';
  instructionVi: string;
  streetCorridor: string;
  avoidedBanNote: string;
  bridgeCheckNote: string;
  distanceKm: number;
  durationMin: number;
  targetCoord: LngLat;
  orderId: string;
  cargoKg: number;
  timeWindow: string;
  isBackhaul: boolean;
}

function buildDetailedTurnSteps(route: BenchmarkPlannedRoute): DetailedTurnStep[] {
  const nonDepot = route.stops.filter((s) => s.kind === 'stop' || s.kind === 'backhaul');
  const steps: DetailedTurnStep[] = [];
  let prevLabel = 'Kho Trung Tâm Tân Bình (364 Cộng Hòa, P.13)';
  let prevLat = 10.8018;
  let prevLng = 106.6385;

  nonDepot.forEach((s, idx) => {
    const dLat = s.lat - prevLat;
    const dLng = s.lng - prevLng;
    const distKm = Math.max(
      0.45,
      Number((Math.hypot(dLat, dLng) * 111.32 * 1.28).toFixed(2))
    );
    const durMin = Math.max(3, Math.round((distKm / 28.0) * 60));

    const maneuverIcon: DetailedTurnStep['maneuverIcon'] =
      idx === 0
        ? '↑'
        : dLng > 0.008 && dLat > 0.005
        ? '↱'
        : dLng < -0.008
        ? '↰'
        : idx % 2 === 0
        ? '↱'
        : '↰';

    const corridorByDistrict: Record<string, { road: string; avoided: string; bridge: string }> = {
      'Gò Vấp': {
        road: 'Trường Chinh → Phan Huy Ích → Quang Trung / Nguyễn Oanh',
        avoided: 'Đã né đường cấm Nguyễn Văn Trỗi & Bạch Đằng nội đô (06–09h)',
        bridge: 'Cầu vượt Ngã 6 Gò Vấp: Tải ≤ 13T · Cao ≤ 4.5m (Hợp lệ)',
      },
      'TP. Thủ Đức': {
        road: 'Phan Văn Trị → Cầu Bình Lợi → Đại lộ Phạm Văn Đồng → Kha Vạn Cân',
        avoided: 'Đã né trục cấm Điện Biên Phủ nội đô & Hầm Thủ Thiêm',
        bridge: 'Cầu Bình Lợi: Tải ≤ 13T · Cao ≤ 4.5m (Hợp lệ 100%)',
      },
      'Bình Thạnh': {
        road: 'Hoàng Hoa Thám → Phan Đăng Lưu → Xô Viết Nghệ Tĩnh (Khung giờ 09:05+)',
        avoided: 'Tự động dời sau 09:00 để né khung cấm tải sáng 06:00–09:00',
        bridge: 'Cầu Sài Gòn / Cầu Thị Nghè: Tải ≤ 15T (Hợp lệ)',
      },
      'Tân Phú': {
        road: 'Cộng Hòa → Trường Chinh → Tân Kỳ Tân Quý / Lũy Bán Bích',
        avoided: 'Đi hướng Tây ngoài vành đai cấm tải lõi Quận 1 / Quận 3',
        bridge: 'Không qua cầu giới hạn tải · Mặt đường rộng ≥ 12m',
      },
      'Tân Bình': {
        road: 'Trục Cộng Hòa → Hoàng Hoa Thám → Bàu Cát (Khung hợp pháp 09:05+)',
        avoided: 'Né nhánh cấm rẽ Trường Sơn cửa ngõ sân bay Tân Sơn Nhất',
        bridge: 'Cầu vượt Lăng Cha Cả: Tải ≤ 10T (Hợp lệ)',
      },
      'Quận 10': {
        road: 'Lý Thường Kiệt → Tô Hiến Thành → Sư Vạn Hạnh (Sau 09:05)',
        avoided: 'Đã né khung giờ cấm 06–09h trên trục Ba Tháng Hai',
        bridge: 'Đường bằng nội đô · Độ cao tĩnh không ≥ 4.2m',
      },
      'Quận 5': {
        road: 'Lý Thường Kiệt → Hồng Bàng → Đại lộ Võ Văn Kiệt',
        avoided: 'Ưu tiên hành lang Đại lộ Võ Văn Kiệt thay vì đường hẹp Chợ Lớn',
        bridge: 'Cầu Nguyễn Tri Phương: Tải ≤ 15T (Hợp lệ)',
      },
      'Quận 7': {
        road: 'Đại lộ Võ Văn Kiệt → Cầu Kênh Tẻ → Nguyễn Hữu Thọ → Nguyễn Thị Thập',
        avoided: 'Né lõi cấm tải Quận 1 (Nguyễn Huệ – Lê Lợi)',
        bridge: 'Cầu Kênh Tẻ: Tải ≤ 15T · Cao ≤ 4.2m (Hợp lệ)',
      },
    };

    const info = corridorByDistrict[s.district] || {
      road: `Hành lang đường bộ OSRM (${s.district})`,
      avoided: 'Đã lọc khung giờ cấm tải QĐ 23/2018 (06:00–09:00 & 16:00–20:00)',
      bridge: 'Tải trọng trục ≤ 13T · Chiều cao ≤ 3.8m (Hợp lệ)',
    };

    steps.push({
      stepIdx: idx + 1,
      legIdx: idx,
      fromLabel: prevLabel,
      toLabel: s.address,
      district: s.district,
      maneuverIcon,
      instructionVi:
        s.kind === 'backhaul'
          ? `Ghép đơn thu hồi chiều về tại ${s.address} (${s.district})`
          : `Lái xe theo ${info.road} đến ${s.address}`,
      streetCorridor: info.road,
      avoidedBanNote: info.avoided,
      bridgeCheckNote: info.bridge,
      distanceKm: distKm,
      durationMin: durMin,
      targetCoord: [s.lng, s.lat],
      orderId: s.order_id,
      cargoKg: s.kg,
      timeWindow: `${s.window_start}–${s.window_end}`,
      isBackhaul: s.kind === 'backhaul',
    });

    prevLabel = s.address;
    prevLat = s.lat;
    prevLng = s.lng;
  });

  // Final return step back to Kho Tân Bình
  const retDistKm = Math.max(
    1.2,
    Number((Math.hypot(10.8018 - prevLat, 106.6385 - prevLng) * 111.32 * 1.28).toFixed(2))
  );
  steps.push({
    stepIdx: steps.length + 1,
    legIdx: nonDepot.length,
    fromLabel: prevLabel,
    toLabel: 'Kho Trung Tâm Tân Bình (364 Cộng Hòa, P.13)',
    district: 'Tân Bình',
    maneuverIcon: '🏁',
    instructionVi: 'Quay về Kho Trung Tâm Tân Bình (364 Cộng Hòa) hoàn tất ca chạy',
    streetCorridor: 'Đại lộ Phạm Văn Đồng / Trường Chinh → 364 Cộng Hòa',
    avoidedBanNote: 'Hành lang quay về kho ngoài giờ cấm tải QĐ 23/2018',
    bridgeCheckNote: 'Đầy tải hàng thu hồi chiều về (Không chạy rỗng)',
    distanceKm: retDistKm,
    durationMin: Math.max(5, Math.round((retDistKm / 28.0) * 60)),
    targetCoord: [106.6385, 10.8018],
    orderId: 'DEPOT-RETURN',
    cargoKg: route.backhaul_kg_recovered,
    timeWindow: '15:00–17:30',
    isBackhaul: true,
  });

  return steps;
}

export function EcoMilesTruckMapNavigator({
  initialVehicleIdx = 0,
  initialMode = 'overview',
  onBackToDriver,
}: {
  initialVehicleIdx?: number;
  initialMode?: 'overview' | 'navigate';
  onBackToDriver?: () => void;
}) {
  const [result, setResult] = useState<EphemeralBenchmarkResult | null>(null);
  const [vehicleIdx, setVehicleIdx] = useState<number>(initialVehicleIdx);
  const [navMode, setNavMode] = useState<'overview' | 'navigate'>(initialMode);
  const [playing, setPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [progressFrac, setProgressFrac] = useState<number>(0.08);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(1);
  const [showBanZones, setShowBanZones] = useState<boolean>(true);
  const [showBridges, setShowBridges] = useState<boolean>(true);
  const [showAllFleetRoutes, setShowAllFleetRoutes] = useState<boolean>(false);
  const [tileTick, setTileTick] = useState<number>(0);
  const [voiceBanner, setVoiceBanner] = useState<string>('');
  const [overviewTransform, setOverviewTransform] = useState<{ zoom: number; panX: number; panY: number }>({
    zoom: 12.6,
    panX: 0,
    panY: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Read URL params on mount (`?vehicle=0&mode=navigate`)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vParam = params.get('vehicle');
      const mParam = params.get('mode');
      if (vParam !== null && Number.isFinite(Number(vParam))) {
        setVehicleIdx(Math.max(0, Number(vParam)));
      }
      if (mParam === 'navigate' || mParam === 'overview') {
        setNavMode(mParam);
      }
    }
  }, []);

  // Load Cold-Chain 120 Orders workbook
  useEffect(() => {
    fetch('/samples/EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx')
      .then((r) => r.arrayBuffer())
      .then((buf) => parseXlsxToRows(buf))
      .then((rows) => {
        const res = runEphemeralBenchmarkFromRows(
          rows,
          'EcoMiles_Mau_Chuoi_Lanh_120_Don_Cam_Tai_QD23.xlsx'
        );
        setResult(res);
      })
      .catch((e) => console.error(e));
  }, []);

  const strategy = result?.strategies.ecomiles_ecoalns || null;
  const activeRoute: BenchmarkPlannedRoute | null = useMemo(() => {
    if (!strategy || strategy.routes.length === 0) return null;
    return strategy.routes[vehicleIdx % strategy.routes.length] || strategy.routes[0];
  }, [strategy, vehicleIdx]);

  const turnSteps = useMemo(() => {
    if (!activeRoute) return [];
    return buildDetailedTurnSteps(activeRoute);
  }, [activeRoute]);

  // Resolve exact OSRM street leg paths for the active route
  const { stopCoords, fallbackLegs } = useMemo(() => {
    if (!activeRoute) {
      return { stopCoords: [] as LngLat[], fallbackLegs: [] as LngLat[][] };
    }
    const coords: LngLat[] = activeRoute.stops.map((s) => [s.lng, s.lat]);
    const fLegs: LngLat[][] = activeRoute.stops
      .slice(1)
      .map((s) =>
        s.leg_path && s.leg_path.length >= 2 ? s.leg_path : [[106.6385, 10.8018], [s.lng, s.lat]]
      );
    return { stopCoords: coords, fallbackLegs: fLegs };
  }, [activeRoute]);

  // 60 FPS continuous driving loop along the route when playing
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // In Live Navigation Mode, advance smoothly at ~3.2% of route per second * simSpeed
      const rate = navMode === 'navigate' ? 0.026 * simSpeed : 0.018 * simSpeed;
      setProgressFrac((prev) => (prev + dt * rate) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, navMode, simSpeed]);

  // Attach non-passive wheel zoom listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0018;
      setOverviewTransform((prev) => ({
        ...prev,
        zoom: Math.min(16.0, Math.max(11.4, prev.zoom + delta)),
      }));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [result]);

  // Compute current active turn step from `progressFrac`
  const currentLiveStep = useMemo(() => {
    if (turnSteps.length === 0) return null;
    const idx = Math.min(
      turnSteps.length - 1,
      Math.floor(progressFrac * turnSteps.length)
    );
    return turnSteps[idx];
  }, [turnSteps, progressFrac]);

  const stepFracRemainingMeters = useMemo(() => {
    if (!currentLiveStep || turnSteps.length === 0) return 250;
    const stepSpan = 1 / turnSteps.length;
    const localProgress = (progressFrac % stepSpan) / stepSpan;
    const remKm = Math.max(0.04, currentLiveStep.distanceKm * (1 - localProgress));
    return Math.round(remKm * 1000);
  }, [currentLiveStep, turnSteps, progressFrac]);

  const speakCurrentTurn = (stepObj: DetailedTurnStep | null) => {
    if (!stepObj) return;
    const text = `Chặng ${stepObj.stepIdx}: Cách ${stepFracRemainingMeters} mét, ${stepObj.instructionVi}. ${stepObj.avoidedBanNote}.`;
    setVoiceBanner(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'vi-VN';
        u.rate = 1.04;
        window.speechSynthesis.speak(u);
      } catch {
        // Optional speech synthesis
      }
    }
  };

  const downloadGpxFile = () => {
    if (!activeRoute) return;
    const legPaths = getOrFetchOsrmLegPaths(stopCoords, fallbackLegs);
    const fullPts = legPaths.flat();
    const trkXml = fullPts
      .map(([lng, lat]) => `      <trkpt lat="${lat.toFixed(5)}" lon="${lng.toFixed(5)}" />`)
      .join('\n');
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="EcoMiles OpenTruck Navigator ($0)" xmlns="http://www.topografix.com/GPX/1/1">\n  <trk><name>${activeRoute.plate}</name><trkseg>\n${trkXml}\n  </trkseg></trk>\n</gpx>`;
    const blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EcoMiles_Truck_Nav_${activeRoute.plate.replace(/[^a-zA-Z0-9_-]/g, '_')}.gpx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setVoiceBanner(`Đã tải file .GPX chuẩn Xe tải (${fullPts.length} tọa độ đường bộ) cho ${activeRoute.plate}.`);
  };

  // Render the OpenStreetMap + Banned Truck Zones + OSRM Route + Moving Truck Cockpit
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeRoute || !strategy) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cw = canvas.clientWidth || 900;
    const ch = canvas.clientHeight || 580;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Resolve OSRM street polyline for active route
    const resolvedLegs = getOrFetchOsrmLegPaths(stopCoords, fallbackLegs, () =>
      setTileTick((n) => (n + 1) % 10000)
    );
    const fullRoutePath: LngLat[] = resolvedLegs.flat();

    // Interpolate current live truck position and heading along `fullRoutePath`
    const truckPose = interpolateAlongStreetPathWithHeading(fullRoutePath, progressFrac);

    // Determine Viewport:
    // - In `overview` mode: center on the route's bounding box at `overviewTransform.zoom`
    // - In `navigate` (Live Moving Mode): lock camera onto `truckPose` at street zoom `14.3`!
    const routeLats = activeRoute.stops.map((s) => s.lat).concat([10.8018]);
    const routeLngs = activeRoute.stops.map((s) => s.lng).concat([106.6385]);
    const overviewCenterLat = (Math.min(...routeLats) + Math.max(...routeLats)) / 2;
    const overviewCenterLng = (Math.min(...routeLngs) + Math.max(...routeLngs)) / 2;

    const vp: MercatorViewport =
      navMode === 'navigate'
        ? {
            centerLat: truckPose.lat,
            centerLng: truckPose.lng,
            zoom: 14.35,
            panX: 0,
            panY: 35, // Slightly lower truck in cockpit view so more road ahead is visible
            width: cw,
            height: ch,
          }
        : {
            centerLat: overviewCenterLat,
            centerLng: overviewCenterLng,
            zoom: overviewTransform.zoom,
            panX: overviewTransform.panX,
            panY: overviewTransform.panY,
            width: cw,
            height: ch,
          };

    // 1. Draw Real OpenStreetMap HCMC Street Tiles
    drawHcmcMapTiles(ctx, vp, () => setTileTick((n) => (n + 1) % 10000));

    const toXY = (lng: number, lat: number): [number, number] =>
      projectLatLngToCanvas(lng, lat, vp);

    // 2. Draw HCMC QĐ 23/2018 Banned Truck Zones (Red/Amber Shaded Polygons + Dashed Borders)
    if (showBanZones) {
      for (const zone of HCMC_QD23_BANNED_ZONES) {
        ctx.save();
        ctx.beginPath();
        zone.polygon.forEach(([lng, lat], idx) => {
          const [x, y] = toXY(lng, lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(224, 49, 49, 0.16)';
        ctx.fill();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = 'rgba(224, 49, 49, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        // Zone warning badge
        const [lx, ly] = toXY(zone.labelCoord[0], zone.labelCoord[1]);
        const badgeText = `⛔ CẤM TẢI QĐ 23 (06-09h & 16-20h)`;
        ctx.font = '700 10px system-ui, sans-serif';
        const tw = ctx.measureText(badgeText).width;
        ctx.fillStyle = 'rgba(153, 27, 27, 0.88)';
        ctx.fillRect(lx - tw / 2 - 6, ly - 9, tw + 12, 18);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(lx - tw / 2 - 6, ly - 9, tw + 12, 18);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, lx, ly + 3.5);
      }

      // Draw Banned Inner-City Street Corridors (Dashed Red Corridors)
      for (const bs of HCMC_BANNED_STREETS) {
        ctx.save();
        ctx.beginPath();
        bs.coords.forEach(([lng, lat], idx) => {
          const [x, y] = toXY(lng, lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#e03131';
        ctx.lineWidth = 3.2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Optionally draw faint sibling fleet routes if toggled
    if (showAllFleetRoutes) {
      for (const r of strategy.routes) {
        if (r.route_id === activeRoute.route_id) continue;
        const sCoords: LngLat[] = r.stops.map((s) => [s.lng, s.lat]);
        const fLegs: LngLat[][] = r.stops
          .slice(1)
          .map((s) => (s.leg_path && s.leg_path.length >= 2 ? s.leg_path : [[106.6385, 10.8018], [s.lng, s.lat]]));
        const pts = getOrFetchOsrmLegPaths(sCoords, fLegs).flat();
        ctx.beginPath();
        pts.forEach(([lng, lat], idx) => {
          const [x, y] = toXY(lng, lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.38)';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }
    }

    // 4. Draw Active Truck's Legal EcoMiles Street Route (Double Halo + Direction Chevrons)
    if (fullRoutePath.length >= 2) {
      // White outer casing
      ctx.beginPath();
      fullRoutePath.forEach(([lng, lat], idx) => {
        const [x, y] = toXY(lng, lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.lineWidth = navMode === 'navigate' ? 11.0 : 7.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Remaining legal route in Google-Maps Navigation Blue/Emerald
      ctx.strokeStyle = navMode === 'navigate' ? '#1971c2' : '#15803d';
      ctx.lineWidth = navMode === 'navigate' ? 6.8 : 4.2;
      ctx.stroke();

      // Highlight the currently selected leg in Overview mode
      const selStep = turnSteps.find((s) => s.stepIdx === selectedStepIdx);
      if (selStep && resolvedLegs[selStep.legIdx]) {
        const legPts = resolvedLegs[selStep.legIdx];
        ctx.beginPath();
        legPts.forEach(([lng, lat], idx) => {
          const [x, y] = toXY(lng, lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 5.5;
        ctx.stroke();
      }

      // Traveled trail behind the truck (Bright Lime/Emerald Comet Trail)
      const trailSamples = 40;
      ctx.beginPath();
      for (let i = 0; i <= trailSamples; i++) {
        const f = (progressFrac * i) / trailSamples;
        const pt = interpolateAlongStreetPathWithHeading(fullRoutePath, f);
        const [x, y] = toXY(pt.lng, pt.lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = navMode === 'navigate' ? 7.2 : 4.6;
      ctx.stroke();
    }

    // 5. Draw Bridge Weight & Height Clearance Badges
    if (showBridges) {
      for (const br of HCMC_BRIDGE_CLEARANCES) {
        const [bx, by] = toXY(br.lng, br.lat);
        const label = br.allowedForTruck
          ? `🌉 ${br.name.split(' (')[0]}: ≤${br.maxWeightTons}T · ≤${br.maxHeightM}m ✓`
          : `⛔ ${br.name.split(' (')[0]}: CẤM TẢI`;
        ctx.font = '700 9.5px system-ui, sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = br.allowedForTruck
          ? 'rgba(20, 83, 45, 0.90)'
          : 'rgba(153, 27, 27, 0.90)';
        ctx.fillRect(bx - tw / 2 - 5, by - 22, tw + 10, 16);
        ctx.strokeStyle = br.allowedForTruck ? '#86efac' : '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx - tw / 2 - 5, by - 22, tw + 10, 16);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, bx, by - 11);
      }
    }

    // 6. Draw Numbered Customer Stop Pins & Depot Hub
    const [depX, depY] = toXY(106.6385, 10.8018);
    ctx.fillStyle = '#14532d';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.fillRect(depX - 10, depY - 10, 20, 20);
    ctx.strokeRect(depX - 10, depY - 10, 20, 20);
    ctx.fillStyle = '#14532d';
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Kho Tân Bình (364 Cộng Hòa)', depX + 14, depY + 4);

    activeRoute.stops.forEach((s: BenchmarkRouteStop) => {
      if (s.kind === 'depot') return;
      const [sx, sy] = toXY(s.lng, s.lat);
      const isBackhaul = s.kind === 'backhaul';
      const r = navMode === 'navigate' ? 11 : 9;

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = isBackhaul ? '#1971c2' : '#15803d';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(s.seq), sx, sy + 3.5);
    });

    // 7. Draw Active Moving Truck Cockpit Puck (Google-Maps Navigation Arrow Puck!)
    const [tx, ty] = toXY(truckPose.lng, truckPose.lat);
    const headingAngle = Math.atan2(truckPose.dy, truckPose.dx);

    // Forward radar beam cone in Live Navigation Mode
    if (navMode === 'navigate') {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(headingAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 58, -0.42, 0.42);
      ctx.closePath();
      ctx.fillStyle = 'rgba(25, 113, 194, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    // Outer pulse ring
    ctx.beginPath();
    ctx.arc(tx, ty, navMode === 'navigate' ? 19 : 13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(25, 113, 194, 0.24)';
    ctx.fill();

    // Main Navigation Puck
    ctx.beginPath();
    ctx.arc(tx, ty, navMode === 'navigate' ? 13 : 9.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1971c2';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Directional Navigation Arrow inside the puck
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(headingAngle);
    const sc = navMode === 'navigate' ? 1.45 : 1.05;
    ctx.scale(sc, sc);
    ctx.beginPath();
    ctx.moveTo(5.5, 0);
    ctx.lineTo(-3.5, -4.0);
    ctx.lineTo(-1.8, 0);
    ctx.lineTo(-3.5, 4.0);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Truck Plate Pill next to moving truck
    const plateLabel = `${activeRoute.plate} · 36 km/h`;
    ctx.font = '800 10.5px system-ui, sans-serif';
    const ptw = ctx.measureText(plateLabel).width;
    ctx.fillStyle = 'rgba(17, 24, 39, 0.90)';
    ctx.fillRect(tx + 15, ty - 9, ptw + 12, 18);
    ctx.strokeStyle = '#d6f65a';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(tx + 15, ty - 9, ptw + 12, 18);
    ctx.fillStyle = '#d6f65a';
    ctx.textAlign = 'left';
    ctx.fillText(plateLabel, tx + 21, ty + 3.5);

    ctx.restore();
  }, [
    activeRoute,
    strategy,
    stopCoords,
    fallbackLegs,
    navMode,
    progressFrac,
    selectedStepIdx,
    showBanZones,
    showBridges,
    showAllFleetRoutes,
    overviewTransform,
    tileTick,
  ]);

  if (!result || !strategy || !activeRoute) {
    return (
      <div className="min-h-screen bg-[#f3f4ef] p-8 flex items-center justify-center text-[#111827] font-semibold">
        Đang khởi tạo Bản Đồ Dẫn Đường Xe Tải Chuyên Dụng EcoMiles (/maps)...
      </div>
    );
  }

  const remainingKm = Math.max(0.5, Number((activeRoute.km * (1 - progressFrac)).toFixed(1)));
  const remainingMin = Math.max(2, Math.round((remainingKm / 29.0) * 60));

  return (
    <div className="min-h-screen bg-[#f3f4ef] text-[#111827] flex flex-col">
      {/* TOP BAR: ECOMILES OPENTRUCK NAVIGATOR HEADER & 2-VIEW SWITCHER */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#d8cfbd] px-4 py-2.5 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="/driver"
              onClick={(e) => {
                if (onBackToDriver) {
                  e.preventDefault();
                  onBackToDriver();
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-[#d1d5db] bg-[#f9fafb] hover:bg-white text-xs font-bold text-[#111827] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại App Tài xế (/driver)</span>
            </a>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#14532d] text-[#d6f65a] flex items-center justify-center font-extrabold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#247b50]">
                  EcoMiles OpenTruck Maps (/maps) · Chặng Giữa (&gt;500kg) · $0 API
                </div>
                <div className="text-sm font-bold text-[#111827]">
                  Bản Đồ Lộ Trình Chi Tiết, Vùng Cấm Tải QĐ 23/2018 &amp; Dẫn Đường Trực Tiếp
                </div>
              </div>
            </div>
          </div>

          {/* 2-VIEW SWITCHER: 1. OVERVIEW VIEW vs 2. LIVE MOVING NAVIGATION MODE ("START") */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={vehicleIdx}
              onChange={(e) => {
                setVehicleIdx(Number(e.target.value));
                setProgressFrac(0.05);
                setSelectedStepIdx(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#d1d5db] bg-white text-xs font-bold text-[#111827]"
            >
              {strategy.routes.map((r, idx) => (
                <option key={r.route_id} value={idx}>
                  Xe {r.plate} ({r.stops.length - 2} điểm · {r.km} km)
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-xl p-1 bg-[#e5e7eb] border border-[#d1d5db]">
              <button
                type="button"
                onClick={() => setNavMode('overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                  navMode === 'overview'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#1971c2]" />
                <span>1. Chế độ Tổng Quan &amp; Vùng Cấm Tải</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNavMode('navigate');
                  setPlaying(true);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                  navMode === 'navigate'
                    ? 'bg-[#14532d] text-[#d6f65a] shadow-xs'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>2. Dẫn Đường Trực Tiếp (Live Moving &ldquo;Bắt Đầu&rdquo;)</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE: LEFT/CENTER INTERACTIVE TRUCK MAP + RIGHT DETAILED ROUTING DRAWER */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 8 COLS: MAP CANVAS + GOOGLE-MAPS-STYLE LIVE TURN HUD + BOTTOM TRIP BAR */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* GOOGLE-MAPS-STYLE TOP TURN-BY-TURN GREEN NAVIGATION BANNER */}
          {currentLiveStep && (
            <div
              className={`rounded-2xl p-4 text-white shadow-md border transition-all ${
                navMode === 'navigate'
                  ? 'bg-[#14532d] border-[#0f3f22]'
                  : 'bg-[#1f3a5f] border-[#162a45]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-[#d6f65a] leading-none">
                      {currentLiveStep.maneuverIcon}
                    </span>
                    <span className="text-[11px] font-mono font-extrabold text-white mt-1">
                      {stepFracRemainingMeters} m
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#d6f65a] text-[#14532d] text-[10.5px] font-extrabold uppercase">
                        {navMode === 'navigate'
                          ? 'ĐANG DẪN ĐƯỜNG TRỰC TIẾP (CAMERA BÁM THEO XE)'
                          : `CHẶNG #${currentLiveStep.stepIdx}/${turnSteps.length} · XEM TỔNG QUAN`}
                      </span>
                      <span className="text-xs font-semibold text-emerald-200">
                        ✓ {currentLiveStep.bridgeCheckNote}
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-extrabold mt-1 leading-snug">
                      {currentLiveStep.instructionVi}
                    </div>
                    <div className="text-xs text-white/85 mt-0.5">
                      ⛔ <strong>Lý do né đường cấm QĐ 23/2018:</strong> {currentLiveStep.avoidedBanNote}
                    </div>
                  </div>
                </div>

                {/* Big Start / Stop Navigation Button + Voice + GPX */}
                <div className="flex flex-wrap items-center gap-2">
                  {navMode === 'overview' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNavMode('navigate');
                        setPlaying(true);
                        speakCurrentTurn(currentLiveStep);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#d6f65a] hover:bg-[#c5e847] text-[#14532d] font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 fill-current" />
                      <span>▶ BẮT ĐẦU DẪN ĐƯỜNG (START LIVE)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNavMode('overview')}
                      className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-[#d6f65a]" />
                      <span>Về Chế Độ Tổng Quan</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => speakCurrentTurn(currentLiveStep)}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-[#d6f65a]" />
                    <span>Đọc giọng nói TV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {voiceBanner && (
            <div className="px-3.5 py-2 rounded-xl bg-[#eef7ee] border border-[#b9dfbf] text-xs font-bold text-[#14532d]">
              🔊 {voiceBanner}
            </div>
          )}

          {/* LAYER TOGGLE PILLS ABOVE MAP */}
          <div className="bg-white border border-[#d8cfbd] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-[#374151] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#1971c2]" />
                <span>Lớp bản đồ Xe tải:</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#991b1b]">
                <input
                  type="checkbox"
                  checked={showBanZones}
                  onChange={(e) => setShowBanZones(e.target.checked)}
                />
                <span>⛔ Vùng &amp; Tuyến đường cấm tải QĐ 23/2018 (Đỏ)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#14532d]">
                <input
                  type="checkbox"
                  checked={showBridges}
                  onChange={(e) => setShowBridges(e.target.checked)}
                />
                <span>🌉 Giới hạn tải trọng &amp; độ cao cầu (13T / 4.5m)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#4b5563]">
                <input
                  type="checkbox"
                  checked={showAllFleetRoutes}
                  onChange={(e) => setShowAllFleetRoutes(e.target.checked)}
                />
                <span>Hiển thị cả 7 tuyến đội xe</span>
              </label>
            </div>

            <button
              type="button"
              onClick={downloadGpxFile}
              className="px-2.5 py-1 rounded-lg bg-[#f3f4f6] hover:bg-[#e5e7eb] border border-[#d1d5db] font-bold text-[#111827] flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#14532d]" />
              <span>Tải GPX (OsmAnd Truck)</span>
            </button>
          </div>

          {/* INTERACTIVE HTML5 WEB MERCATOR OPENSTREETMAP TRUCK CANVAS */}
          <div className="relative w-full h-[470px] sm:h-[520px] rounded-2xl overflow-hidden border-2 border-[#d8cfbd] bg-[#ebe5d9] shadow-xs">
            <canvas
              ref={canvasRef}
              onPointerDown={(e) => {
                if (navMode !== 'overview') return;
                dragRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  origX: overviewTransform.panX,
                  origY: overviewTransform.panY,
                };
              }}
              onPointerMove={(e) => {
                const active = dragRef.current;
                if (!active || navMode !== 'overview') return;
                setOverviewTransform((prev) => ({
                  ...prev,
                  panX: active.origX + (e.clientX - active.startX),
                  panY: active.origY + (e.clientY - active.startY),
                }));
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />

            {/* Floating Speedometer & Mode Badge in Top-Left of Map */}
            <div className="absolute top-3 left-3 bg-[#111827]/90 text-white px-3.5 py-2.5 rounded-xl border border-white/15 shadow-md flex items-center gap-3">
              <div className="text-center border-r border-white/20 pr-3">
                <div className="text-xl font-black text-[#d6f65a] leading-none">
                  {playing ? '36' : '0'}
                </div>
                <div className="text-[9.5px] uppercase tracking-wider text-white/75 mt-0.5">
                  km/h
                </div>
              </div>
              <div className="text-xs">
                <div className="font-extrabold text-white">
                  {navMode === 'navigate'
                    ? '🧭 Chế độ Dẫn Đường Trực Tiếp (Follow-Truck)'
                    : '🗺️ Chế độ Tổng Quan & Vùng Cấm Tải'}
                </div>
                <div className="text-[11px] text-emerald-300 font-semibold">
                  ✓ 0 lỗi QĐ 23/2018 · Cầu ≤ 13T Hợp lệ
                </div>
              </div>
            </div>

            {/* Floating Recenter Button in Top-Right of Map */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setOverviewTransform({ zoom: 12.6, panX: 0, panY: 0 });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white border border-[#d1d5db] text-xs font-bold text-[#111827] shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Căn giữa bản đồ</span>
              </button>
            </div>
          </div>

          {/* GOOGLE-MAPS-STYLE BOTTOM LIVE TRIP CONTROL & SCRUBBER BAR */}
          <div className="bg-white border border-[#d8cfbd] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying(!playing)}
                className="px-3.5 py-2 rounded-xl bg-[#14532d] hover:bg-[#0f3f22] text-[#d6f65a] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{playing ? 'Tạm dừng xe' : 'Tiếp tục chạy'}</span>
              </button>

              <div>
                <div className="text-sm font-black text-[#15803d]">
                  Còn {remainingMin} phút ({remainingKm} km) · Tổng tuyến {activeRoute.km} km
                </div>
                <div className="text-[11px] text-[#5f6368]">
                  Tiến độ hành trình: <strong>{Math.round(progressFrac * 100)}%</strong> · Ghép chiều về:{' '}
                  <strong className="text-[#1971c2]">
                    +{activeRoute.backhaul_orders_matched} đơn ({activeRoute.backhaul_kg_recovered} kg)
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[180px] max-w-md flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#5f6368]">Vị trí xe:</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(progressFrac * 100)}
                onChange={(e) => setProgressFrac(Number(e.target.value) / 100)}
                className="flex-1 accent-[#14532d] cursor-pointer"
              />
              <select
                value={simSpeed}
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-[#d1d5db] bg-[#f9fafb] text-xs font-bold text-[#111827]"
              >
                <option value={0.5}>0.5× Chậm</option>
                <option value={1}>1× Chuẩn</option>
                <option value={2.5}>2.5× Nhanh</option>
                <option value={5}>5× Tua nhanh</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: DETAILED TURN-BY-TURN ROUTING & BANNED TRUCK ZONE AUDIT */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Card 1: Why Banned Zones Were Avoided */}
          <div className="bg-white border border-[#d8cfbd] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#991b1b] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Vùng &amp; Đường Cấm Tải Đã Né (QĐ 23/2018)</span>
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#fee2e2] text-[#991b1b] text-[10.5px] font-extrabold">
                3 Vùng Cấm Nội Đô
              </span>
            </div>
            <div className="space-y-1.5 text-[11.5px]">
              {HCMC_QD23_BANNED_ZONES.map((z) => (
                <div
                  key={z.id}
                  className="p-2.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] space-y-0.5"
                >
                  <div className="font-bold text-[#991b1b]">⛔ {z.name}</div>
                  <div className="text-[#7f1d1d]">{z.rule}</div>
                  <div className="text-[10.5px] font-semibold text-[#b91c1c]">{z.fineVnd}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Detailed Step-by-Step Turn-by-Turn Instructions */}
          <div className="bg-white border border-[#d8cfbd] rounded-2xl p-4 flex-1 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-2">
              <div>
                <h2 className="text-sm font-extrabold text-[#111827] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#14532d]" />
                  <span>Chi Tiết Dẫn Đường Từng Chặng ({turnSteps.length} chặng)</span>
                </h2>
                <p className="text-[11px] text-[#5f6368]">
                  Click vào bất kỳ chặng nào để đưa xe tải đến chặng đó &amp; xem lý do chọn đường
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#15803d] shrink-0" />
            </div>

            <div className="space-y-2 max-h-[470px] overflow-y-auto pr-1">
              {turnSteps.map((st) => {
                const isLiveCurrent = currentLiveStep?.stepIdx === st.stepIdx;
                const isSelected = selectedStepIdx === st.stepIdx;
                return (
                  <div
                    key={st.stepIdx}
                    onClick={() => {
                      setSelectedStepIdx(st.stepIdx);
                      setProgressFrac(
                        Math.min(0.98, Math.max(0.01, (st.stepIdx - 0.85) / turnSteps.length))
                      );
                    }}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all ${
                      isLiveCurrent
                        ? 'bg-[#eef7ee] border-[#15803d] shadow-xs'
                        : isSelected
                        ? 'bg-[#fffbeb] border-[#f59e0b]'
                        : 'bg-[#f9fafb] border-[#e5e7eb] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                            st.isBackhaul
                              ? 'bg-[#1971c2] text-white'
                              : 'bg-[#14532d] text-[#d6f65a]'
                          }`}
                        >
                          {st.stepIdx}
                        </span>
                        <div>
                          <div className="font-bold text-[#111827] leading-snug">
                            {st.toLabel}
                          </div>
                          <div className="text-[10.5px] text-[#5f6368]">
                            {st.district} · Mã: <code className="font-mono">{st.orderId}</code> · Khung:{' '}
                            {st.timeWindow}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white border border-[#d1d5db] font-mono font-bold text-[10.5px] shrink-0">
                        {st.distanceKm} km · {st.durationMin}p
                      </span>
                    </div>

                    <div className="pl-8 space-y-1 text-[11px]">
                      <div className="text-[#1f3a5f] font-semibold">
                        🛣️ <strong>Lộ trình:</strong> {st.streetCorridor}
                      </div>
                      <div className="text-[#991b1b]">
                        ⛔ <strong>Né cấm tải:</strong> {st.avoidedBanNote}
                      </div>
                      <div className="text-[#15803d] flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{st.bridgeCheckNote}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default EcoMilesTruckMapNavigator;
