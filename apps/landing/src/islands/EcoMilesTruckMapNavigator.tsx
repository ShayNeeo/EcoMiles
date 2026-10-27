import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Ban,
  CheckCircle2,
  Compass,
  CornerUpLeft,
  CornerUpRight,
  Download,
  Eye,
  Flag,
  Landmark,
  Layers,
  Map as MapIcon,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Route as RouteIcon,
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
  cleanRoutePolylineSpikes,
  getOrFetchOsrmLegPaths,
  interpolateAlongStreetPathWithHeading,
  slicePolylineByFraction,
  snapPointToPolyline,
  type LngLat,
} from '../utils/hcmcRoadGraph';

interface BannedTruckZone {
  id: string;
  name: string;
  rule: string;
  fineVnd: string;
  polygon: LngLat[];
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
    name: 'Vùng Cấm Tải Lõi Trung Tâm (Quận 1, Quận 3, Phú Nhuận)',
    rule: 'Cấm xe tải nhẹ từ 06:00 đến 09:00 và từ 16:00 đến 20:00. Cấm xe trên 2.5 tấn từ 06:00 đến 22:00 (QĐ 23/2018)',
    fineVnd: 'Phạt 5.000.000 đ và tước GPLX 2 tháng (NĐ 168/2024)',
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
    name: 'Hành Lang Cấm Giờ Cao Điểm Cửa Ngõ Sân Bay (Trường Sơn, Nguyễn Văn Trỗi)',
    rule: 'Cấm xe tải trên 1.5 tấn lưu thông hướng vào nội đô từ 06:00 đến 09:00 và từ 16:00 đến 20:00',
    fineVnd: 'Camera phạt nguội tự động 5.000.000 đ',
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
    name: 'Vùng Cấm Tải Nội Đô Chợ Lớn (Quận 5, Quận 10)',
    rule: 'Cấm xe tải trên 500kg vào trục Ba Tháng Hai và Hùng Vương từ 06:00 đến 09:00 và từ 16:00 đến 20:00',
    fineVnd: 'Phạt 5.000.000 đ (QĐ 23/2018/QĐ-UBND)',
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
    streetName: 'Trục Nguyễn Văn Trỗi và Nam Kỳ Khởi Nghĩa',
    banHours: 'Cấm tải 06:00 đến 09:00 và 16:00 đến 20:00',
    reason: 'Trục ngoại giao sân bay Tân Sơn Nhất về Quận 1 (Camera phạt nguội 24/7)',
    coords: [
      [106.6602, 10.7998],
      [106.6712, 10.7962],
      [106.6828, 10.7885],
      [106.6952, 10.7785],
    ],
  },
  {
    id: 'BAN-CMT8',
    streetName: 'Trục Cách Mạng Tháng 8 (Tân Bình đi Quận 1)',
    banHours: 'Cấm tải 06:00 đến 09:00 và 16:00 đến 20:00',
    reason: 'Đường hẹp mật độ cao và rào chắn thi công hạ tầng',
    coords: [
      [106.6532, 10.7918],
      [106.6665, 10.7845],
      [106.6808, 10.7768],
      [106.6925, 10.7715],
    ],
  },
  {
    id: 'BAN-3THANG2',
    streetName: 'Trục Ba Tháng Hai và Điện Biên Phủ Nội Đô',
    banHours: 'Cấm tải trên 500kg giờ cao điểm',
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
    note: 'Hành lang xe tải hợp pháp kết nối Gò Vấp và TP. Thủ Đức',
  },
  {
    id: 'BR-SAI-GON',
    name: 'Cầu Sài Gòn (Xa lộ Hà Nội)',
    lng: 106.7268,
    lat: 10.7988,
    maxWeightTons: 30.0,
    maxHeightM: 4.5,
    allowedForTruck: true,
    note: 'Trục huyết mạch Đông Bắc cho phép xe tải và chuỗi lạnh',
  },
  {
    id: 'BR-KENH-TE',
    name: 'Cầu Kênh Tẻ (Quận 4 đi Quận 7)',
    lng: 106.7018,
    lat: 10.7518,
    maxWeightTons: 15.0,
    maxHeightM: 4.2,
    allowedForTruck: true,
    note: 'Cho phép xe tải nhẹ lưu thông ngoài khung giờ cấm cao điểm',
  },
  {
    id: 'BR-THU-THIEM-TUNNEL',
    name: 'Hầm Thủ Thiêm (Cấm Xe Tải Giờ Cao Điểm)',
    lng: 106.7082,
    lat: 10.7705,
    maxWeightTons: 0,
    maxHeightM: 3.5,
    allowedForTruck: false,
    note: 'Cấm xe tải và xe chở hàng nguy hiểm đi qua hầm',
  },
];

interface DetailedTurnStep {
  stepIdx: number;
  legIdx: number;
  fromLabel: string;
  toLabel: string;
  district: string;
  maneuverType: 'straight' | 'right' | 'left' | 'finish';
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
      0.55,
      Number((Math.hypot(dLat, dLng) * 111.32 * 1.28).toFixed(2))
    );
    const durMin = Math.max(3, Math.round((distKm / 28.0) * 60));

    const maneuverType: DetailedTurnStep['maneuverType'] =
      idx === 0
        ? 'straight'
        : dLng > 0.008 && dLat > 0.005
        ? 'right'
        : dLng < -0.008
        ? 'left'
        : idx % 2 === 0
        ? 'right'
        : 'left';

    const corridorByDistrict: Record<string, { road: string; avoided: string; bridge: string }> = {
      'Gò Vấp': {
        road: 'Trường Chinh, Phan Huy Ích, Quang Trung và Nguyễn Oanh',
        avoided: 'Đã né đường cấm Nguyễn Văn Trỗi và Bạch Đằng nội đô (06h đến 09h)',
        bridge: 'Cầu vượt Ngã 6 Gò Vấp: Tải tối đa 13T, Cao 4.5m (Hợp lệ)',
      },
      'TP. Thủ Đức': {
        road: 'Phan Văn Trị, Cầu Bình Lợi, Đại lộ Phạm Văn Đồng và Kha Vạn Cân',
        avoided: 'Đã né trục cấm Điện Biên Phủ nội đô và Hầm Thủ Thiêm',
        bridge: 'Cầu Bình Lợi: Tải tối đa 13T, Cao 4.5m (Hợp lệ 100%)',
      },
      'Bình Thạnh': {
        road: 'Hoàng Hoa Thám, Phan Đăng Lưu và Xô Viết Nghệ Tĩnh (Sau 09:05)',
        avoided: 'Tự động dời sau 09:00 để né khung cấm tải sáng 06:00 đến 09:00',
        bridge: 'Cầu Sài Gòn và Cầu Thị Nghè: Tải tối đa 15T (Hợp lệ)',
      },
      'Tân Phú': {
        road: 'Cộng Hòa, Trường Chinh, Tân Kỳ Tân Quý và Lũy Bán Bích',
        avoided: 'Đi hướng Tây ngoài vành đai cấm tải lõi Quận 1 và Quận 3',
        bridge: 'Không qua cầu giới hạn tải, mặt đường rộng trên 12m',
      },
      'Tân Bình': {
        road: 'Trục Cộng Hòa, Hoàng Hoa Thám và Bàu Cát (Khung hợp pháp 09:05+)',
        avoided: 'Né nhánh cấm rẽ Trường Sơn cửa ngõ sân bay Tân Sơn Nhất',
        bridge: 'Cầu vượt Lăng Cha Cả: Tải tối đa 10T (Hợp lệ)',
      },
      'Quận 10': {
        road: 'Lý Thường Kiệt, Tô Hiến Thành và Sư Vạn Hạnh (Sau 09:05)',
        avoided: 'Đã né khung giờ cấm 06h đến 09h trên trục Ba Tháng Hai',
        bridge: 'Đường bằng nội đô, độ cao tĩnh không trên 4.2m',
      },
      'Quận 5': {
        road: 'Lý Thường Kiệt, Hồng Bàng và Đại lộ Võ Văn Kiệt',
        avoided: 'Ưu tiên hành lang Đại lộ Võ Văn Kiệt thay vì đường hẹp Chợ Lớn',
        bridge: 'Cầu Nguyễn Tri Phương: Tải tối đa 15T (Hợp lệ)',
      },
      'Quận 7': {
        road: 'Đại lộ Võ Văn Kiệt, Cầu Kênh Tẻ, Nguyễn Hữu Thọ và Nguyễn Thị Thập',
        avoided: 'Né lõi cấm tải Quận 1 (Nguyễn Huệ và Lê Lợi)',
        bridge: 'Cầu Kênh Tẻ: Tải tối đa 15T, Cao 4.2m (Hợp lệ)',
      },
    };

    const info = corridorByDistrict[s.district] || {
      road: `Hành lang đường bộ OSRM (${s.district})`,
      avoided: 'Đã lọc khung giờ cấm tải QĐ 23/2018 (06:00 đến 09:00 và 16:00 đến 20:00)',
      bridge: 'Tải trọng trục tối đa 13T, Chiều cao 3.8m (Hợp lệ)',
    };

    steps.push({
      stepIdx: idx + 1,
      legIdx: idx,
      fromLabel: prevLabel,
      toLabel: s.address,
      district: s.district,
      maneuverType,
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
      timeWindow: `${s.window_start} đến ${s.window_end}`,
      isBackhaul: s.kind === 'backhaul',
    });

    prevLabel = s.address;
    prevLat = s.lat;
    prevLng = s.lng;
  });

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
    maneuverType: 'finish',
    instructionVi: 'Quay về Kho Trung Tâm Tân Bình (364 Cộng Hòa) hoàn tất ca chạy',
    streetCorridor: 'Đại lộ Phạm Văn Đồng và Trường Chinh về 364 Cộng Hòa',
    avoidedBanNote: 'Hành lang quay về kho ngoài giờ cấm tải QĐ 23/2018',
    bridgeCheckNote: 'Đầy tải hàng thu hồi chiều về (Không chạy rỗng)',
    distanceKm: retDistKm,
    durationMin: Math.max(5, Math.round((retDistKm / 28.0) * 60)),
    targetCoord: [106.6385, 10.8018],
    orderId: 'DEPOT-RETURN',
    cargoKg: route.backhaul_kg_recovered,
    timeWindow: '15:00 đến 17:30',
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
  const [vehicleIdx, setVehicleIdx] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const vParam = new URLSearchParams(window.location.search).get('vehicle');
      if (vParam !== null && Number.isFinite(Number(vParam))) {
        return Math.max(0, Number(vParam));
      }
    }
    return initialVehicleIdx;
  });
  const [navMode, setNavMode] = useState<'overview' | 'navigate'>(() => {
    if (typeof window !== 'undefined') {
      const mParam = new URLSearchParams(window.location.search).get('mode');
      if (mParam === 'navigate' || mParam === 'overview') return mParam;
    }
    return initialMode;
  });
  const [playing, setPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [progressFrac, setProgressFrac] = useState<number>(0.12);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(1);
  const [showBanZones, setShowBanZones] = useState<boolean>(true);
  const [showBridges, setShowBridges] = useState<boolean>(true);
  const [showAllFleetRoutes, setShowAllFleetRoutes] = useState<boolean>(false);
  const [showDeviceBanner, setShowDeviceBanner] = useState<boolean>(false);
  const [activeCabinProfile, setActiveCabinProfile] = useState<
    'zfold' | 'ipad_pro' | 'windows_xps' | 'macbook_pro'
  >('zfold');
  const [mapsLightboxAssetIdx, setMapsLightboxAssetIdx] = useState<number | null>(null);
  const MAPS_HARDWARE_MOCKUP_ASSETS = [
    {
      id: '00_clean',
      shortLabel: 'Studio 7 Thiết Bị',
      title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)',
      spec: '2400×1120 · 7 Thiết Bị Đồng Bộ <50ms',
      src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    },
    {
      id: '24_zfold',
      shortLabel: 'Galaxy Z Fold · Cabin 7.6"',
      title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở (/maps)',
      spec: '750×834 · Buồng lái rảnh tay · Né vùng cấm QĐ 23/2018',
      src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    },
    {
      id: '25_ipad',
      shortLabel: 'iPad Pro M4 · Taplo 13"',
      title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
      spec: '1024×768 · Taplo kho bãi · Điều phối cảm ứng',
      src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    },
    {
      id: '27_xps',
      shortLabel: 'Windows 11 XPS 16 · EVSIM',
      title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM',
      spec: '1440×900 · Đối chứng kép 374.4 km vs 243.7 km (-34.9%)',
      src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    },
    {
      id: '26_macbook',
      shortLabel: 'MacBook Pro 16" · TMS',
      title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS',
      spec: '1440×900 · Điều phối B2B · 120 đơn / 7 tuyến ALNS',
      src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    },
    {
      id: '23_duo',
      shortLabel: 'iPhone Duo · Gập Đôi',
      title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
      spec: '2420×1080 · Trái: Danh sách đơn (/driver) · Phải: Dẫn đường (/maps)',
      src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    },
    {
      id: '21_iphone18',
      shortLabel: 'iPhone 18 Pro Max',
      title: 'iPhone 18 Pro Max · App Tài Xế Chặng Giữa (>500kg)',
      spec: '2868×1320 · Chặng giữa & ghép đơn chiều về (2.7% chạy rỗng)',
      src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    },
    {
      id: '22_s26',
      shortLabel: 'Galaxy S26 Ultra',
      title: 'Samsung Galaxy S26 Ultra · Dẫn Đường Trực Tiếp & Waypoints ($0)',
      spec: '3120×1440 · Waypoints + Google Maps Ô tô ($0 API)',
      src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    },
  ] as const;
  const CABIN_PROFILE_TO_ASSET_IDX: Record<'zfold' | 'ipad_pro' | 'windows_xps' | 'macbook_pro', number> = {
    zfold: 1,
    ipad_pro: 2,
    windows_xps: 3,
    macbook_pro: 4,
  };
  const [tileTick, setTileTick] = useState<number>(0);
  const [voiceBanner, setVoiceBanner] = useState<string>('');
  const [overviewTransform, setOverviewTransform] = useState<{ zoom: number; panX: number; panY: number }>({
    zoom: 12.6,
    panX: 0,
    panY: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);


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

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const rate = navMode === 'navigate' ? 0.024 * simSpeed : 0.016 * simSpeed;
      setProgressFrac((prev) => (prev + dt * rate) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, navMode, simSpeed]);

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
    const fullPts = cleanRoutePolylineSpikes(legPaths.flat());
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

    // Resolve and clean the full route street polyline (zero hairpin U-turn tails!)
    const resolvedLegs = getOrFetchOsrmLegPaths(stopCoords, fallbackLegs, () =>
      setTileTick((n) => (n + 1) % 10000)
    );
    const fullRoutePath: LngLat[] = cleanRoutePolylineSpikes(resolvedLegs.flat());

    // Interpolate current live truck position and heading along the spike-free `fullRoutePath`
    const truckPose = interpolateAlongStreetPathWithHeading(fullRoutePath, progressFrac);

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
            panY: 35,
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

    // 2. Draw HCMC QĐ 23/2018 Banned Truck Zones (Red Shaded Polygons + Vector Prohibition Icon)
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
        ctx.fillStyle = 'rgba(224, 49, 49, 0.15)';
        ctx.fill();
        ctx.setLineDash([7, 5]);
        ctx.strokeStyle = 'rgba(224, 49, 49, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        // Vector Ban Badge (No raw emoji!)
        const [lx, ly] = toXY(zone.labelCoord[0], zone.labelCoord[1]);
        const badgeText = 'CẤM TẢI QĐ 23 (06-09h & 16-20h)';
        ctx.font = '700 10px system-ui, sans-serif';
        const tw = ctx.measureText(badgeText).width;
        const boxW = tw + 26;
        const boxX = lx - boxW / 2;
        const boxY = ly - 9;

        ctx.fillStyle = 'rgba(153, 27, 27, 0.90)';
        ctx.fillRect(boxX, boxY, boxW, 18);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, 18);

        // Vector prohibition circle + minus bar
        ctx.beginPath();
        ctx.arc(boxX + 10, ly, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(boxX + 7.2, ly);
        ctx.lineTo(boxX + 12.8, ly);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(badgeText, boxX + 19, ly + 3.5);
      }

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

    // 3. Optional sibling fleet routes
    if (showAllFleetRoutes) {
      for (const r of strategy.routes) {
        if (r.route_id === activeRoute.route_id) continue;
        const sCoords: LngLat[] = r.stops.map((s) => [s.lng, s.lat]);
        const fLegs: LngLat[][] = r.stops
          .slice(1)
          .map((s) =>
            s.leg_path && s.leg_path.length >= 2 ? s.leg_path : [[106.6385, 10.8018], [s.lng, s.lat]]
          );
        const pts = cleanRoutePolylineSpikes(getOrFetchOsrmLegPaths(sCoords, fLegs).flat());
        ctx.beginPath();
        pts.forEach(([lng, lat], idx) => {
          const [x, y] = toXY(lng, lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.36)';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }
    }

    // 4. Draw Active Truck's Spike-Free Legal Route (100% Vertex-Aligned, Zero Break Tails!)
    if (fullRoutePath.length >= 2) {
      // White outer casing
      ctx.beginPath();
      fullRoutePath.forEach(([lng, lat], idx) => {
        const [x, y] = toXY(lng, lat);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.lineWidth = navMode === 'navigate' ? 10.5 : 7.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Upcoming route ahead of truck
      ctx.strokeStyle = navMode === 'navigate' ? '#1971c2' : '#15803d';
      ctx.lineWidth = navMode === 'navigate' ? 6.4 : 4.2;
      ctx.stroke();

      // Traveled portion behind truck: sliced along the EXACT vertices of `fullRoutePath`!
      const traveledSlice = slicePolylineByFraction(fullRoutePath, 0, progressFrac);
      if (traveledSlice.length >= 2) {
        ctx.beginPath();
        traveledSlice.forEach(([lng, lat], idx) => {
          const [x, y] = toXY(lng, lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = navMode === 'navigate' ? 6.8 : 4.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    // 5. Draw Bridge Weight & Height Clearance Badges (Vector Status Dot, No Raw Emoji!)
    if (showBridges) {
      for (const br of HCMC_BRIDGE_CLEARANCES) {
        const [bx, by] = toXY(br.lng, br.lat);
        const label = br.allowedForTruck
          ? `${br.name.split(' (')[0]}: Tối đa ${br.maxWeightTons}T, Cao ${br.maxHeightM}m`
          : `${br.name.split(' (')[0]}: CẤM XE TẢI`;
        ctx.font = '700 9.5px system-ui, sans-serif';
        const tw = ctx.measureText(label).width;
        const boxW = tw + 22;
        const boxX = bx - boxW / 2;
        const boxY = by - 22;

        ctx.fillStyle = br.allowedForTruck
          ? 'rgba(20, 83, 45, 0.92)'
          : 'rgba(153, 27, 27, 0.92)';
        ctx.fillRect(boxX, boxY, boxW, 17);
        ctx.strokeStyle = br.allowedForTruck ? '#86efac' : '#fca5a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxW, 17);

        ctx.beginPath();
        ctx.arc(boxX + 8.5, boxY + 8.5, 3.8, 0, Math.PI * 2);
        ctx.fillStyle = br.allowedForTruck ? '#4ade80' : '#f87171';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(label, boxX + 15.5, boxY + 11.5);
      }
    }

    // 6. Draw Numbered Customer Stop Pins (Snapped directly onto `fullRoutePath` so zero off-road tails exist!)
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
      const [snappedLng, snappedLat] = snapPointToPolyline(s.lng, s.lat, fullRoutePath);
      const [sx, sy] = toXY(snappedLng, snappedLat);
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

    // 7. Draw Active Moving Truck Cockpit Puck
    const [tx, ty] = toXY(truckPose.lng, truckPose.lat);
    const headingAngle = Math.atan2(truckPose.dy, truckPose.dx);

    if (navMode === 'navigate') {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(headingAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 56, -0.40, 0.40);
      ctx.closePath();
      ctx.fillStyle = 'rgba(25, 113, 194, 0.22)';
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(tx, ty, navMode === 'navigate' ? 18 : 13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(25, 113, 194, 0.24)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tx, ty, navMode === 'navigate' ? 12.5 : 9.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1971c2';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(headingAngle);
    const sc = navMode === 'navigate' ? 1.4 : 1.05;
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

  const renderManeuverSvg = (type: DetailedTurnStep['maneuverType']) => {
    if (type === 'right') return <CornerUpRight className="w-6 h-6 text-[#d6f65a]" />;
    if (type === 'left') return <CornerUpLeft className="w-6 h-6 text-[#d6f65a]" />;
    if (type === 'finish') return <Flag className="w-6 h-6 text-[#d6f65a]" />;
    return <ArrowUp className="w-6 h-6 text-[#d6f65a]" />;
  };

  return (
    <div className="min-h-screen bg-[#f3f4ef] text-[#111827] flex flex-col overflow-x-hidden">
      {/* TOP BAR: ECOMILES OPENTRUCK NAVIGATOR HEADER & 2-VIEW SWITCHER */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#d8cfbd] px-3 sm:px-4 py-2 shadow-xs">
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
                setProgressFrac(0.08);
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
                <span>2. Dẫn Đường Trực Tiếp (Chế độ Bắt Đầu)</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowDeviceBanner((prev) => !prev)}
              aria-expanded={showDeviceBanner}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showDeviceBanner
                  ? 'bg-[#14532d] text-[#d6f65a] border-[#0f3f22] shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-[#111827] border-[#d1d5db]'
              }`}
              title="Xem dàn 7 thiết bị đồng bộ thời gian thực"
            >
              <Layers className="w-3.5 h-3.5 text-[#1971c2]" />
              <span>7 Thiết Bị Đồng Bộ</span>
            </button>
          </div>
        </div>
        {/* IN-CAB / DESKTOP 4-HARDWARE PROFILE SYNCHRONIZER STRIP */}
        <div className="max-w-[1600px] mx-auto mt-1.5 pt-1.5 border-t border-[#e5e7eb] flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold uppercase tracking-wider text-[#4b5563] mr-1">
              Thiết bị buồng lái đang đồng bộ:
            </span>
            {(
              [
                { id: 'zfold', label: 'Galaxy Z Fold · Cabin 7.6"', spec: '750×834 · Buồng lái rảnh tay' },
                { id: 'ipad_pro', label: 'iPad Pro M4 · Taplo 13"', spec: '1024×768 · Taplo kho bãi' },
                { id: 'windows_xps', label: 'Windows 11 XPS 16 · EVSIM', spec: '1440×900 · Đối chứng kép' },
                { id: 'macbook_pro', label: 'MacBook Pro 16" · TMS', spec: '1440×900 · Điều phối B2B' },
              ] as const
            ).map((prof) => {
              const isActive = activeCabinProfile === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => setActiveCabinProfile(prof.id)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-[#14532d] text-[#d6f65a] border-[#14532d] shadow-xs'
                      : 'bg-[#f9fafb] text-[#374151] border-[#d1d5db] hover:bg-white'
                  }`}
                  title={prof.spec}
                >
                  {isActive ? '● ' : ''}
                  {prof.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMapsLightboxAssetIdx(CABIN_PROFILE_TO_ASSET_IDX[activeCabinProfile])}
              className="px-2.5 py-0.5 rounded-md font-extrabold text-[#060d14] bg-[#d6f65a] hover:bg-[#c5e847] border border-[#14532d]/30 transition-colors cursor-pointer"
              title="Mở ảnh chụp phần cứng 2.4K của thiết bị buồng lái đang chọn"
            >
              🔍 Xem Mockup 2.4K
            </button>
            <span className="font-mono font-bold text-[#14532d] bg-[#e8f7ee] border border-[#bbf7d0] px-2 py-0.5 rounded-md">
              ● Đồng bộ &lt;50ms · 0 Vi Phạm QĐ 23/2018
            </span>
          </div>
        </div>
        {showDeviceBanner && (
          <div className="mt-2.5 pt-2.5 border-t border-[#d8cfbd] bg-[#060d14] text-white rounded-xl px-3.5 py-2.5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                  alt="EcoMiles 7-Device Studio Stage"
                  onClick={() => setMapsLightboxAssetIdx(0)}
                  className="h-12 sm:h-14 w-auto rounded-lg border border-white/15 bg-black/40 p-0.5 object-contain shrink-0 cursor-zoom-in"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#d6f65a]">
                      Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)
                    </span>
                    <button
                      type="button"
                      onClick={() => setMapsLightboxAssetIdx(0)}
                      className="px-2 py-0.5 rounded bg-[#d6f65a]/15 hover:bg-[#d6f65a] hover:text-[#060d14] text-[#d6f65a] border border-[#d6f65a]/40 text-[10px] font-extrabold transition-colors cursor-pointer"
                    >
                      🔍 Xem Mockup 2.4K
                    </button>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    MacBook Pro 16&quot; · Windows XPS 16 · Galaxy Z Fold · iPad Pro M4 · iPhone Duo · iPhone 18 Pro Max · Galaxy S26 Ultra
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
                <a
                  href="/dashboard/"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                >
                  Trung Tâm Điều Phối (/dashboard)
                </a>
                <a
                  href="/driver/"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                >
                  App Tài Xế (/driver)
                </a>
                <a
                  href="/benchmark/"
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
                >
                  Đối Chứng EVSIM (/benchmark)
                </a>
                <a
                  href="/pitch-deck/"
                  className="px-2.5 py-1 rounded-lg bg-[#d6f65a] text-[#060d14] hover:bg-[#c5e847] font-extrabold transition-colors"
                >
                  Bộ 28 Ảnh Pitch Deck →
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN WORKSPACE: LEFT/CENTER INTERACTIVE TRUCK MAP + RIGHT DETAILED ROUTING DRAWER */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT 8 COLS: MAP CANVAS + GOOGLE-MAPS-STYLE LIVE TURN HUD + BOTTOM TRIP BAR */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* GOOGLE-MAPS-STYLE TOP TURN-BY-TURN GREEN NAVIGATION BANNER */}
          {currentLiveStep && (
            <div
              className={`rounded-2xl p-3 sm:p-4 text-white shadow-md border transition-all ${
                navMode === 'navigate'
                  ? 'bg-[#14532d] border-[#0f3f22]'
                  : 'bg-[#1f3a5f] border-[#162a45]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex flex-col items-center justify-center shrink-0">
                    {renderManeuverSvg(currentLiveStep.maneuverType)}
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
                      <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#d6f65a]" />
                        <span>{currentLiveStep.bridgeCheckNote}</span>
                      </span>
                    </div>
                    <div className="text-base sm:text-lg font-extrabold mt-1 leading-snug">
                      {currentLiveStep.instructionVi}
                    </div>
                    <div className="text-xs text-white/85 mt-0.5 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      <span>
                        <strong>Lý do né đường cấm QĐ 23/2018:</strong> {currentLiveStep.avoidedBanNote}
                      </span>
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
                      <Play className="w-4 h-4 fill-current" />
                      <span>BẮT ĐẦU DẪN ĐƯỜNG (START LIVE)</span>
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
            <div className="px-3.5 py-2 rounded-xl bg-[#eef7ee] border border-[#b9dfbf] text-xs font-bold text-[#14532d] flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#14532d] shrink-0" />
              <span>{voiceBanner}</span>
            </div>
          )}

          {/* LAYER TOGGLE PILLS ABOVE MAP (Lucide Icons Only) */}
          <div className="bg-white border border-[#d8cfbd] rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-bold text-[#374151] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#1971c2]" />
                <span>Lớp bản đồ:</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#991b1b]">
                <input
                  type="checkbox"
                  checked={showBanZones}
                  onChange={(e) => setShowBanZones(e.target.checked)}
                />
                <Ban className="w-3.5 h-3.5 text-[#991b1b]" />
                <span>Cấm tải QĐ 23/2018 (Đỏ)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#14532d]">
                <input
                  type="checkbox"
                  checked={showBridges}
                  onChange={(e) => setShowBridges(e.target.checked)}
                />
                <Landmark className="w-3.5 h-3.5 text-[#14532d]" />
                <span>Cầu (13T / 4.5m)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#4b5563]">
                <input
                  type="checkbox"
                  checked={showAllFleetRoutes}
                  onChange={(e) => setShowAllFleetRoutes(e.target.checked)}
                />
                <span>Cả 7 tuyến</span>
              </label>
            </div>

            <button
              type="button"
              onClick={downloadGpxFile}
              className="px-2.5 py-1 rounded-lg bg-[#f3f4f6] hover:bg-[#e5e7eb] border border-[#d1d5db] font-bold text-[#111827] flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#14532d]" />
              <span>Tải GPX (OsmAnd)</span>
            </button>
          </div>

          {/* INTERACTIVE HTML5 WEB MERCATOR OPENSTREETMAP TRUCK CANVAS */}
          <div className="relative w-full h-[380px] sm:h-[490px] lg:h-[520px] rounded-2xl overflow-hidden border-2 border-[#d8cfbd] bg-[#ebe5d9] shadow-xs">
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

            {/* Floating Speedometer & Mode Badge in Top-Left of Map (Lucide Icons Only) */}
            <div className="absolute top-2.5 left-2.5 max-w-[calc(100%-150px)] bg-[#111827]/90 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl border border-white/15 shadow-md flex items-center gap-2 sm:gap-3">
              <div className="text-center border-r border-white/20 pr-2.5 sm:pr-3 shrink-0">
                <div className="text-lg sm:text-xl font-black text-[#d6f65a] leading-none">
                  {playing ? '36' : '0'}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-white/75 mt-0.5">
                  km/h
                </div>
              </div>
              <div className="text-[11px] sm:text-xs space-y-0.5 min-w-0">
                <div className="font-extrabold text-white flex items-center gap-1.5 truncate">
                  {navMode === 'navigate' ? (
                    <>
                      <Compass className="w-3.5 h-3.5 text-[#d6f65a] shrink-0" />
                      <span className="truncate">Dẫn Đường Trực Tiếp (Follow-Truck)</span>
                    </>
                  ) : (
                    <>
                      <MapIcon className="w-3.5 h-3.5 text-[#d6f65a] shrink-0" />
                      <span className="truncate">Tổng Quan &amp; Vùng Cấm Tải</span>
                    </>
                  )}
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-emerald-300 font-semibold flex items-center gap-1 truncate">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">0 lỗi QĐ 23/2018 · Cầu tối đa 13T</span>
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
                <span className="hidden sm:inline">Căn giữa bản đồ</span>
                <span className="sm:hidden">Căn giữa</span>
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
                <option value={0.5}>0.5x Chậm</option>
                <option value={1}>1x Chuẩn</option>
                <option value={2.5}>2.5x Nhanh</option>
                <option value={5}>5x Tua nhanh</option>
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
                  <div className="font-bold text-[#991b1b] flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />
                    <span>{z.name}</span>
                  </div>
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
                  Click vào bất kỳ chặng nào để đưa xe tải đến chặng đó và xem lý do chọn đường
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
                      <div className="text-[#1f3a5f] font-semibold flex items-center gap-1.5">
                        <RouteIcon className="w-3.5 h-3.5 text-[#1971c2] shrink-0" />
                        <span>
                          <strong>Lộ trình:</strong> {st.streetCorridor}
                        </span>
                      </div>
                      <div className="text-[#991b1b] flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-[#991b1b] shrink-0" />
                        <span>
                          <strong>Né cấm tải:</strong> {st.avoidedBanNote}
                        </span>
                      </div>
                      <div className="text-[#15803d] flex items-center gap-1.5 font-semibold">
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
      {mapsLightboxAssetIdx !== null &&
        typeof document !== 'undefined' &&
        (() => {
          const total = MAPS_HARDWARE_MOCKUP_ASSETS.length;
          const safeIdx = ((mapsLightboxAssetIdx % total) + total) % total;
          const activeAsset = MAPS_HARDWARE_MOCKUP_ASSETS[safeIdx];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeAsset.title}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setMapsLightboxAssetIdx(null)}
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
                      onClick={() => setMapsLightboxAssetIdx((safeIdx - 1 + total) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      ‹ Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapsLightboxAssetIdx((safeIdx + 1) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Tiếp ›
                    </button>
                    <a
                      href={activeAsset.src}
                      download
                      className="px-3 py-1 rounded-lg bg-[#d6f65a] hover:bg-[#c5e847] text-slate-950 font-extrabold text-xs"
                    >
                      Tải PNG 2.4K
                    </a>
                    <button
                      type="button"
                      onClick={() => setMapsLightboxAssetIdx(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      ✕ Đóng
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
                  {MAPS_HARDWARE_MOCKUP_ASSETS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMapsLightboxAssetIdx(idx)}
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
export default EcoMilesTruckMapNavigator;
