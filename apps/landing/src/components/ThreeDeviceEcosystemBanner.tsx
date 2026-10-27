import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import gsap from 'gsap';

export type DeviceBannerFocusId =
  | 'all_banner'
  | 'macbook_pro'
  | 'windows_xps'
  | 'galaxy_zfold'
  | 'ipad_pro'
  | 'iphone_duo'
  | 'iphone_18_pro_max'
  | 'galaxy_s26_ultra';

interface ThreeDeviceNodeSpec {
  id: Exclude<DeviceBannerFocusId, 'all_banner'>;
  textureUrl: string;
  width: number;
  height: number;
  pos: [number, number, number];
  rotY: number;
  camPos: [number, number, number];
  lookAt: [number, number, number];
}

const DEVICE_3D_SPECS: ThreeDeviceNodeSpec[] = [
  {
    id: 'macbook_pro',
    textureUrl: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    width: 3.1,
    height: 2.02,
    pos: [-1.95, 2.05, -1.15],
    rotY: 0.16,
    camPos: [-1.75, 2.05, 1.95],
    lookAt: [-1.95, 2.05, -1.15],
  },
  {
    id: 'windows_xps',
    textureUrl: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    width: 3.1,
    height: 2.02,
    pos: [1.95, 2.05, -1.15],
    rotY: -0.16,
    camPos: [1.75, 2.05, 1.95],
    lookAt: [1.95, 2.05, -1.15],
  },
  {
    id: 'galaxy_zfold',
    textureUrl: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    width: 1.42,
    height: 1.94,
    pos: [-3.75, 1.25, 0.15],
    rotY: 0.34,
    camPos: [-2.95, 1.25, 2.55],
    lookAt: [-3.75, 1.25, 0.15],
  },
  {
    id: 'ipad_pro',
    textureUrl: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    width: 1.42,
    height: 1.94,
    pos: [3.75, 1.25, 0.15],
    rotY: -0.34,
    camPos: [2.95, 1.25, 2.55],
    lookAt: [3.75, 1.25, 0.15],
  },
  {
    id: 'iphone_18_pro_max',
    textureUrl: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    width: 0.88,
    height: 1.88,
    pos: [-1.75, 0.96, 1.05],
    rotY: 0.18,
    camPos: [-1.55, 0.96, 3.05],
    lookAt: [-1.75, 0.96, 1.05],
  },
  {
    id: 'iphone_duo',
    textureUrl: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    width: 1.68,
    height: 1.86,
    pos: [0, 0.98, 1.25],
    rotY: 0,
    camPos: [0, 0.98, 3.25],
    lookAt: [0, 0.98, 1.25],
  },
  {
    id: 'galaxy_s26_ultra',
    textureUrl: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    width: 0.88,
    height: 1.88,
    pos: [1.75, 0.96, 1.05],
    rotY: -0.18,
    camPos: [1.55, 0.96, 3.05],
    lookAt: [1.75, 0.96, 1.05],
  },
];

// 3D Data-Sync Arcs connecting Office Laptops (MacBook/XPS) to Tablets & Driver Phones
const SYNC_ARCS: Array<Array<[number, number, number]>> = [
  [
    [-1.95, 1.6, -1.1],
    [-2.85, 2.15, -0.4],
    [-3.75, 1.25, 0.15],
  ],
  [
    [-1.95, 1.6, -1.1],
    [-1.85, 1.85, 0.0],
    [-1.75, 0.96, 1.05],
  ],
  [
    [-1.2, 1.6, -1.1],
    [-0.4, 1.95, 0.1],
    [0, 0.98, 1.25],
  ],
  [
    [1.2, 1.6, -1.1],
    [0.4, 1.95, 0.1],
    [0, 0.98, 1.25],
  ],
  [
    [1.95, 1.6, -1.1],
    [1.85, 1.85, 0.0],
    [1.75, 0.96, 1.05],
  ],
  [
    [1.95, 1.6, -1.1],
    [2.85, 2.15, -0.4],
    [3.75, 1.25, 0.15],
  ],
];

const ARC_ENDPOINTS: ReadonlyArray<
  readonly [Exclude<DeviceBannerFocusId, 'all_banner'>, Exclude<DeviceBannerFocusId, 'all_banner'>]
> = [
  ['macbook_pro', 'galaxy_zfold'],
  ['macbook_pro', 'iphone_18_pro_max'],
  ['macbook_pro', 'iphone_duo'],
  ['windows_xps', 'iphone_duo'],
  ['windows_xps', 'galaxy_s26_ultra'],
  ['windows_xps', 'ipad_pro'],
];

interface ThreeDeviceEcosystemBannerProps {
  selectedDeviceId: DeviceBannerFocusId;
  onSelectDevice: (id: DeviceBannerFocusId) => void;
}

type ClusterPresetId = 'none' | 'office' | 'tablet' | 'field';

const CLUSTER_MEMBERS: Record<Exclude<ClusterPresetId, 'none'>, DeviceBannerFocusId[]> = {
  office: ['macbook_pro', 'windows_xps'],
  tablet: ['galaxy_zfold', 'ipad_pro'],
  field: ['iphone_18_pro_max', 'iphone_duo', 'galaxy_s26_ultra'],
};

const DIRECT_JUMP_DEVICES: ReadonlyArray<{
  id: Exclude<DeviceBannerFocusId, 'all_banner'>;
  shortLabel: string;
}> = [
  { id: 'macbook_pro', shortLabel: '1. MacBook' },
  { id: 'windows_xps', shortLabel: '2. XPS 16' },
  { id: 'galaxy_zfold', shortLabel: '3. Z Fold' },
  { id: 'iphone_18_pro_max', shortLabel: '4. 18 Pro Max' },
  { id: 'iphone_duo', shortLabel: '5. iPhone Duo' },
  { id: 'galaxy_s26_ultra', shortLabel: '6. S26 Ultra' },
  { id: 'ipad_pro', shortLabel: '7. iPad Pro' },
];

const DEVICE_LABELS: Record<Exclude<DeviceBannerFocusId, 'all_banner'>, string> = {
  macbook_pro: 'MacBook Pro 16" (Trung Tâm Điều Phối B2B)',
  windows_xps: 'Windows 11 XPS 16 (Đối Chứng EVSIM)',
  galaxy_zfold: 'Samsung Galaxy Z Fold (Buồng Lái Xe Tải)',
  ipad_pro: 'iPad Pro M4 (Bảng Điều Khiển Kho Vận)',
  iphone_18_pro_max: 'iPhone 18 Pro Max (Chặng Giữa >500kg)',
  iphone_duo: 'iPhone Duo Gập Đôi (Đa Nhiệm 2 Màn Hình)',
  galaxy_s26_ultra: 'Samsung Galaxy S26 Ultra (Dẫn Đường /maps)',
};

const DEVICE_LIVE_ROUTES: Record<
  DeviceBannerFocusId,
  { href: string; label: string }
> = {
  all_banner: { href: '/dashboard/', label: 'Mở Trung Tâm B2B (/dashboard) ↗' },
  macbook_pro: { href: '/dashboard/', label: 'Mở Trung Tâm B2B (/dashboard) ↗' },
  windows_xps: { href: '/benchmark/', label: 'Mở Phòng Đối Chứng (/benchmark) ↗' },
  galaxy_zfold: { href: '/maps/?vehicle=0&mode=navigate', label: 'Mở Bản Đồ Xe Tải (/maps) ↗' },
  ipad_pro: { href: '/dispatcher/', label: 'Mở Giao Diện Kho Vận (/dispatcher) ↗' },
  iphone_18_pro_max: { href: '/driver/', label: 'Mở App Tài Xế Chặng Giữa (/driver) ↗' },
  iphone_duo: { href: '/driver/', label: 'Mở Đa Nhiệm 2 Màn Hình (/driver) ↗' },
  galaxy_s26_ultra: { href: '/maps/?vehicle=1&mode=navigate', label: 'Mở Dẫn Đường Trực Tiếp (/maps) ↗' },
};

const DEVICE_2D_MOCKUPS: Record<
  DeviceBannerFocusId,
  { src: string; title: string; subtitle: string; resolution: string }
> = {
  all_banner: {
    src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    title: 'Sân Khấu 7 Thiết Bị EcoMiles · Studio 2.4K',
    subtitle: 'Toàn Cảnh 7 Thiết Bị Đồng Bộ Thời Gian Thực (<50ms)',
    resolution: '2400 × 1120 (Ultra-Wide High-DPI Stage)',
  },
  macbook_pro: {
    src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    title: 'MacBook Pro 16" · M3 Max',
    subtitle: 'Trung Tâm Điều Phối B2B Fleet TMS',
    resolution: '3456 × 2234 (Liquid Retina XDR)',
  },
  windows_xps: {
    src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    title: 'Dell Windows 11 XPS 16',
    subtitle: 'Đối Chứng EVSIM & Mô Phỏng 2 Bên',
    resolution: '3840 × 2400 (4K+ OLED InfinityEdge)',
  },
  galaxy_zfold: {
    src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    title: 'Samsung Galaxy Z Fold',
    subtitle: 'Buồng Lái Xe Tải & Bản Đồ Mở (/maps)',
    resolution: '2160 × 1856 (Dynamic AMOLED 2X)',
  },
  ipad_pro: {
    src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    title: 'iPad Pro M4 13"',
    subtitle: 'Bảng Điều Khiển Kho Vận & Phân Bổ Kiện Hàng',
    resolution: '2752 × 2064 (Ultra Retina XDR)',
  },
  iphone_duo: {
    src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    title: 'iPhone Duo Gập Đôi',
    subtitle: 'Đa Nhiệm 2 Màn Hình: Đơn Hàng + Lộ Trình',
    resolution: '2420 × 1080 (Dual Dynamic OLED)',
  },
  iphone_18_pro_max: {
    src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    title: 'iPhone 18 Pro Max',
    subtitle: 'Ứng Dụng Tài Xế Chặng Giữa (>500kg)',
    resolution: '2868 × 1320 (Super Retina XDR 120Hz)',
  },
  galaxy_s26_ultra: {
    src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    title: 'Samsung Galaxy S26 Ultra',
    subtitle: 'Dẫn Đường Trực Tiếp Thời Gian Thực (/maps)',
    resolution: '3120 × 1440 (Dynamic AMOLED 2X 120Hz)',
  },
};

export const ThreeDeviceEcosystemBanner: React.FC<ThreeDeviceEcosystemBannerProps> = ({
  selectedDeviceId,
  onSelectDevice,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const camTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.48, z: 7.45 });
  const lookTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.38, z: 0 });
  const lookCurrentRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.38, z: 0 });
  const focusRingTargetRef = useRef<{ x: number; z: number; scale: number; opacity: number }>({
    x: 0,
    z: 0,
    scale: 0.2,
    opacity: 0,
  });
  const selectedIdRef = useRef<DeviceBannerFocusId>(selectedDeviceId);
  const clusterRef = useRef<ClusterPresetId>('none');
  const hoveredIdRef = useRef<Exclude<DeviceBannerFocusId, 'all_banner'> | null>(null);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<Exclude<DeviceBannerFocusId, 'all_banner'> | null>(null);
  const [clusterOverride, setClusterOverride] = useState<{
    preset: Exclude<ClusterPresetId, 'none'>;
    forDeviceId: DeviceBannerFocusId;
  } | null>(null);
  const [isAutoTour, setIsAutoTour] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const clusterPreset: ClusterPresetId =
    clusterOverride && clusterOverride.forDeviceId === selectedDeviceId
      ? clusterOverride.preset
      : 'none';
  const onSelectRef = useRef(onSelectDevice);

  useEffect(() => {
    onSelectRef.current = onSelectDevice;
  }, [onSelectDevice]);

  // Auto-Orbit Camera Tour across all 7 devices
  useEffect(() => {
    if (!isAutoTour) return;
    const tourStops: DeviceBannerFocusId[] = [
      'macbook_pro',
      'windows_xps',
      'galaxy_zfold',
      'iphone_18_pro_max',
      'iphone_duo',
      'galaxy_s26_ultra',
      'ipad_pro',
      'all_banner',
    ];
    const timerId = window.setInterval(() => {
      setClusterOverride(null);
      clusterRef.current = 'none';
      const idx = tourStops.indexOf(selectedIdRef.current);
      const nextId = tourStops[(idx + 1) % tourStops.length];
      onSelectRef.current(nextId);
    }, 2800);
    return () => window.clearInterval(timerId);
  }, [isAutoTour]);

  const stepDeviceCamera = (delta: -1 | 1) => {
    setIsAutoTour(false);
    setClusterOverride(null);
    clusterRef.current = 'none';
    const currentIdx = DEVICE_3D_SPECS.findIndex((d) => d.id === selectedIdRef.current);
    const nextIdx =
      currentIdx === -1
        ? delta > 0
          ? 0
          : DEVICE_3D_SPECS.length - 1
        : (currentIdx + delta + DEVICE_3D_SPECS.length) % DEVICE_3D_SPECS.length;
    onSelectDevice(DEVICE_3D_SPECS[nextIdx].id);
  };

  useEffect(() => {
    if (!isLightboxOpen && selectedDeviceId === 'all_banner') return;
    const allIds: DeviceBannerFocusId[] = [
      'all_banner',
      ...DIRECT_JUMP_DEVICES.map((d) => d.id),
    ];
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (isLightboxOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsLightboxOpen(false);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const delta = e.key === 'ArrowRight' ? 1 : -1;
          const curIdx = Math.max(0, allIds.indexOf(selectedIdRef.current));
          const nextId = allIds[(curIdx + delta + allIds.length) % allIds.length];
          setIsAutoTour(false);
          setClusterOverride(null);
          clusterRef.current = 'none';
          onSelectRef.current(nextId);
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIdx = DEVICE_3D_SPECS.findIndex((d) => d.id === selectedIdRef.current);
        const nextIdx =
          currentIdx === -1
            ? DEVICE_3D_SPECS.length - 1
            : (currentIdx - 1 + DEVICE_3D_SPECS.length) % DEVICE_3D_SPECS.length;
        onSelectRef.current(DEVICE_3D_SPECS[nextIdx].id);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIdx = DEVICE_3D_SPECS.findIndex((d) => d.id === selectedIdRef.current);
        const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % DEVICE_3D_SPECS.length;
        onSelectRef.current(DEVICE_3D_SPECS[nextIdx].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsAutoTour(false);
        setClusterOverride(null);
        clusterRef.current = 'none';
        onSelectRef.current('all_banner');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDeviceId, isLightboxOpen]);

  const applyClusterPreset = (preset: Exclude<ClusterPresetId, 'none'>) => {
    setIsAutoTour(false);
    setClusterOverride({ preset, forDeviceId: selectedDeviceId });
    clusterRef.current = preset;
    const dur =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 0.9;
    if (preset === 'office') {
      gsap.to(camTargetRef.current, { x: 0, y: 2.12, z: 3.85, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: 0, y: 2.02, z: -1.15, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(focusRingTargetRef.current, { x: 0, z: -1.15, scale: 2.8, opacity: 0.75, duration: dur, overwrite: 'auto' });
    } else if (preset === 'tablet') {
      gsap.to(camTargetRef.current, { x: 0, y: 1.42, z: 6.65, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: 0, y: 1.25, z: 0.15, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(focusRingTargetRef.current, { x: 0, z: 0.15, scale: 3.6, opacity: 0.7, duration: dur, overwrite: 'auto' });
    } else {
      gsap.to(camTargetRef.current, { x: 0, y: 1.02, z: 4.55, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: 0, y: 0.97, z: 1.15, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(focusRingTargetRef.current, { x: 0, z: 1.15, scale: 2.3, opacity: 0.85, duration: dur, overwrite: 'auto' });
    }
  };

  // GSAP Smooth 3D Camera Flight when selectedDeviceId changes
  useEffect(() => {
    selectedIdRef.current = selectedDeviceId;
    clusterRef.current = 'none';
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = prefersReducedMotion ? 0 : 0.85;

    if (selectedDeviceId === 'all_banner') {
      gsap.to(camTargetRef.current, { x: 0, y: 1.48, z: 7.45, duration: dur, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: 0, y: 1.38, z: 0, duration: dur, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(focusRingTargetRef.current, { x: 0, z: 0, scale: 0.2, opacity: 0, duration: dur, overwrite: 'auto' });
    } else {
      const spec = DEVICE_3D_SPECS.find((d) => d.id === selectedDeviceId);
      if (spec) {
        gsap.to(camTargetRef.current, {
          x: spec.camPos[0],
          y: spec.camPos[1],
          z: spec.camPos[2],
          duration: dur,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(lookTargetRef.current, {
          x: spec.lookAt[0],
          y: spec.lookAt[1],
          z: spec.lookAt[2],
          duration: dur,
          ease: 'power3.out',
          overwrite: 'auto',
        });
        gsap.to(focusRingTargetRef.current, {
          x: spec.pos[0],
          z: spec.pos[2],
          scale: spec.width > 2 ? 1.85 : spec.width > 1.2 ? 1.15 : 0.8,
          opacity: 0.88,
          duration: dur,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
    }
  }, [selectedDeviceId]);
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(360, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, width / height, 0.1, 100);
    camera.position.set(0, 1.48, 7.45);
    camera.lookAt(0, 1.38, 0);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Studio Grid & Glowing Emerald Horizon Ring
    const grid = new THREE.GridHelper(16, 32, 0xd6f65a, 0x064e3b);
    grid.position.y = -0.12;
    stageGroup.add(grid);

    // Volumetric GLSL Studio Floor Spotlight Disc tracking uFocusPos
    const floorDiscGeo = new THREE.CircleGeometry(4.2, 64);
    floorDiscGeo.rotateX(-Math.PI / 2);
    const floorDiscMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFocusPos: { value: new THREE.Vector2(0, 0) },
        uEmerald: { value: new THREE.Color(0x10b981) },
        uLime: { value: new THREE.Color(0xd6f65a) },
      },
      vertexShader: `
        varying vec2 vStageXZ;
        void main() {
          vStageXZ = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uFocusPos;
        uniform vec3 uEmerald;
        uniform vec3 uLime;
        varying vec2 vStageXZ;
        void main() {
          float stageDist = length(vStageXZ) / 4.2;
          float stageFalloff = smoothstep(1.0, 0.08, stageDist);
          float pulseRing = 0.5 + 0.5 * sin(stageDist * 14.0 - uTime * 1.8);
          float focusDist = distance(vStageXZ, uFocusPos);
          float focusSpot = exp(-focusDist * focusDist * 0.65);
          float focusCore = smoothstep(1.45, 0.0, focusDist);
          vec3 glowColor = mix(uEmerald, uLime, clamp(focusCore * 0.72 + pulseRing * 0.18, 0.0, 1.0));
          float alpha = stageFalloff * (0.11 + 0.26 * focusSpot + 0.03 * pulseRing * stageFalloff);
          gl_FragColor = vec4(glowColor, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const floorDisc = new THREE.Mesh(floorDiscGeo, floorDiscMat);
    floorDisc.position.set(0, -0.115, 0);
    stageGroup.add(floorDisc);

    const ringGeo = new THREE.RingGeometry(4.2, 4.28, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd6f65a,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.position.y = -0.11;
    stageGroup.add(floorRing);

    const innerRingGeo = new THREE.RingGeometry(2.35, 2.39, 64);
    innerRingGeo.rotateX(-Math.PI / 2);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0xd6f65a,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
    });
    const innerFloorRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerFloorRing.position.y = -0.108;
    stageGroup.add(innerFloorRing);

    // Animated Ground Focus Ring under the active 3D device
    const focusRingGeo = new THREE.RingGeometry(0.65, 0.78, 48);
    focusRingGeo.rotateX(-Math.PI / 2);
    const focusRingMat = new THREE.MeshBasicMaterial({
      color: 0xd6f65a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const focusRing = new THREE.Mesh(focusRingGeo, focusRingMat);
    focusRing.position.set(0, -0.105, 0);
    stageGroup.add(focusRing);

    // 3D Vertical Holographic Pedestal Light Beam under the focused device
    const holoBeamGeo = new THREE.CylinderGeometry(0.48, 0.72, 1.0, 32, 1, true);
    const holoBeamMat = new THREE.MeshBasicMaterial({
      color: 0xd6f65a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const holoBeam = new THREE.Mesh(holoBeamGeo, holoBeamMat);
    holoBeam.position.set(0, 0.4, 0);
    stageGroup.add(holoBeam);

    // 3D Data-Sync Arcs + Animated Data Pulses from Office Laptops to Field Devices
    const syncCurves: THREE.CatmullRomCurve3[] = [];
    const syncPulses: THREE.Mesh[] = [];
    const syncGeos: THREE.BufferGeometry[] = [];
    const syncMats: THREE.Material[] = [];
    const syncTubeMats: THREE.MeshBasicMaterial[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.055, 12, 12);
    syncGeos.push(pulseGeo);

    SYNC_ARCS.forEach((pts, idx) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
      syncCurves.push(curve);
      const tGeo = new THREE.TubeGeometry(curve, 36, 0.014, 8, false);
      const tMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0xd6f65a : 0x34d399,
        transparent: true,
        opacity: 0.35,
      });
      syncGeos.push(tGeo);
      syncMats.push(tMat);
      syncTubeMats.push(tMat);
      stageGroup.add(new THREE.Mesh(tGeo, tMat));

      const pMat = new THREE.MeshBasicMaterial({ color: 0xd6f65a });
      syncMats.push(pMat);
      const pulse = new THREE.Mesh(pulseGeo, pMat);
      pulse.userData = { curveIdx: idx, offset: idx * 0.16 };
      stageGroup.add(pulse);
      syncPulses.push(pulse);
    });

    // 3D Atmospheric Studio Light Motes (THREE.Points + BufferGeometry per threejs-geometry skill)
    const particleCount = 48;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (((i * 73) % 100) / 100 - 0.5) * 9.0;
      particlePositions[i * 3 + 1] = 0.05 + (((i * 41) % 100) / 100) * 2.5;
      particlePositions[i * 3 + 2] = (((i * 59) % 100) / 100 - 0.5) * 5.2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: 0xd6f65a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const studioParticles = new THREE.Points(particleGeo, particleMat);
    stageGroup.add(studioParticles);

    // Load 7 Real Device Textures (threejs-textures: SRGBColorSpace + LinearFilter + 3D Physical Chassis Backing)
    const loader = new THREE.TextureLoader();
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const deviceMeshes: THREE.Mesh[] = [];
    const chassisMeshes: THREE.Mesh[] = [];
    const rimBarMeshes: THREE.Mesh[] = [];
    const reflectionMeshes: THREE.Mesh[] = [];
    const pedestalRingMeshes: THREE.Mesh[] = [];
    const loadedTextures: THREE.Texture[] = [];

    const reflVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const reflFragmentShader = `
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform vec3 uTint;
      varying vec2 vUv;
      void main() {
        vec2 mirroredUv = vec2(vUv.x, 1.0 - vUv.y);
        vec4 texel = texture(uMap, mirroredUv);
        float verticalFade = smoothstep(0.0, 0.85, vUv.y) * pow(vUv.y, 1.65);
        float edgeVignette = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
        vec3 reflColor = mix(texel.rgb, uTint, 0.14);
        gl_FragColor = vec4(reflColor, texel.a * verticalFade * edgeVignette * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `;

    DEVICE_3D_SPECS.forEach((spec) => {
      const tex = loader.load(spec.textureUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = maxAniso;
      loadedTextures.push(tex);

      // 3D Physical Metallic Chassis Backing Plate behind each screen
      const chassisGeo = new THREE.BoxGeometry(spec.width + 0.06, spec.height + 0.06, 0.045);
      const chassisMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.92,
      });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.position.set(spec.pos[0], spec.pos[1], spec.pos[2] - 0.026);
      chassis.rotation.y = spec.rotY;
      chassis.userData = { deviceId: spec.id, baseY: spec.pos[1], baseRotY: spec.rotY };
      stageGroup.add(chassis);
      chassisMeshes.push(chassis);
      // 3D Glowing Top Telemetry Rim Bar above each device
      const rimGeo = new THREE.BoxGeometry(spec.width * 0.42, 0.022, 0.052);
      const rimMat = new THREE.MeshBasicMaterial({
        color: 0xd6f65a,
        transparent: true,
        opacity: 0.88,
      });
      const rimBaseY = spec.pos[1] + spec.height / 2 + 0.018;
      const rimBar = new THREE.Mesh(rimGeo, rimMat);
      rimBar.position.set(spec.pos[0], rimBaseY, spec.pos[2]);
      rimBar.rotation.y = spec.rotY;
      rimBar.userData = { deviceId: spec.id, rimBaseY, baseRotY: spec.rotY };
      stageGroup.add(rimBar);
      rimBarMeshes.push(rimBar);


      const geo = new THREE.PlaneGeometry(spec.width, spec.height);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      mesh.rotation.y = spec.rotY;
      mesh.userData = {
        deviceId: spec.id,
        baseY: spec.pos[1],
        baseRotY: spec.rotY,
      };
      stageGroup.add(mesh);
      deviceMeshes.push(mesh);

      // Real-Time GLSL ShaderMaterial Mirrored Floor Reflection beneath each device
      const reflHeight = spec.height * 0.42;
      const reflGeo = new THREE.PlaneGeometry(spec.width, reflHeight);
      const reflMat = new THREE.ShaderMaterial({
        vertexShader: reflVertexShader,
        fragmentShader: reflFragmentShader,
        uniforms: {
          uMap: { value: tex },
          uOpacity: { value: 0.28 },
          uTint: { value: new THREE.Color(0xd6f65a) },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const reflBaseY = spec.pos[1] - spec.height / 2 - reflHeight / 2 - 0.025;
      const reflMesh = new THREE.Mesh(reflGeo, reflMat);
      reflMesh.position.set(spec.pos[0], reflBaseY, spec.pos[2]);
      reflMesh.rotation.y = spec.rotY;
      reflMesh.userData = { reflBaseY };
      stageGroup.add(reflMesh);
      reflectionMeshes.push(reflMesh);

      // Per-Device 3D Floor Pedestal Ring
      const pedGeo = new THREE.RingGeometry(0.28, 0.35, 32);
      pedGeo.rotateX(-Math.PI / 2);
      const pedMat = new THREE.MeshBasicMaterial({
        color: 0xd6f65a,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const pedRing = new THREE.Mesh(pedGeo, pedMat);
      pedRing.position.set(spec.pos[0], 0.004, spec.pos[2]);
      pedRing.userData = { deviceId: spec.id };
      stageGroup.add(pedRing);
      pedestalRingMeshes.push(pedRing);
    });

    // Pointer parallax & Raycaster click picking
    const pointerOffset = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      pointerOffset.x = nx * 0.24;
      pointerOffset.y = -ny * 0.12;
      pointerNdc.set(nx, -ny);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(deviceMeshes, false);
      const hitId =
        (hits[0]?.object.userData.deviceId as Exclude<DeviceBannerFocusId, 'all_banner'> | undefined) ?? null;
      if (hoveredIdRef.current !== hitId) {
        hoveredIdRef.current = hitId;
        setHoveredDeviceId(hitId);
        if (selectedIdRef.current === 'all_banner' && clusterRef.current === 'none') {
          const dur = prefersReducedMotion ? 0 : 0.45;
          if (hitId) {
            const hoveredSpec = DEVICE_3D_SPECS.find((d) => d.id === hitId);
            if (hoveredSpec) {
              gsap.to(focusRingTargetRef.current, {
                x: hoveredSpec.pos[0],
                z: hoveredSpec.pos[2],
                scale: hoveredSpec.width > 2 ? 1.85 : hoveredSpec.width > 1.2 ? 1.15 : 0.8,
                opacity: 0.75,
                duration: dur,
                ease: 'power3.out',
                overwrite: 'auto',
              });
            }
          } else {
            gsap.to(focusRingTargetRef.current, {
              x: 0,
              z: 0,
              scale: 0.2,
              opacity: 0,
              duration: dur,
              ease: 'power3.out',
              overwrite: 'auto',
            });
          }
        }
      }
    };

    const onPointerLeave = () => {
      pointerOffset.x = 0;
      pointerOffset.y = 0;
      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredDeviceId(null);
        if (selectedIdRef.current === 'all_banner' && clusterRef.current === 'none') {
          gsap.to(focusRingTargetRef.current, {
            x: 0,
            z: 0,
            scale: 0.2,
            opacity: 0,
            duration: prefersReducedMotion ? 0 : 0.45,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(deviceMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.deviceId as DeviceBannerFocusId | undefined;
        if (hitId) {
          setIsAutoTour(false);
          setClusterOverride(null);
          clusterRef.current = 'none';
          onSelectRef.current(selectedIdRef.current === hitId ? 'all_banner' : hitId);
        }
      } else if (selectedIdRef.current !== 'all_banner' || clusterRef.current !== 'none') {
        setIsAutoTour(false);
        setClusterOverride(null);
        clusterRef.current = 'none';
        onSelectRef.current('all_banner');
        const dur = prefersReducedMotion ? 0 : 0.85;
        gsap.to(camTargetRef.current, { x: 0, y: 1.48, z: 7.45, duration: dur, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(lookTargetRef.current, { x: 0, y: 1.38, z: 0, duration: dur, ease: 'power3.out', overwrite: 'auto' });
        gsap.to(focusRingTargetRef.current, { x: 0, z: 0, scale: 0.2, opacity: 0, duration: dur, overwrite: 'auto' });
      }
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('click', onClick);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(360, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const timer = new THREE.Timer();
    timer.connect(document);

    const lookVec = new THREE.Vector3();
    const pulsePos = new THREE.Vector3();

    const animate = () => {
      timer.update();
      const elapsed = timer.getElapsed();
      const sel = selectedIdRef.current;

      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        camTargetRef.current.x + (prefersReducedMotion ? 0 : pointerOffset.x),
        0.1
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        camTargetRef.current.y + (prefersReducedMotion ? 0 : pointerOffset.y),
        0.1
      );
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetRef.current.z, 0.1);

      lookCurrentRef.current.x = THREE.MathUtils.lerp(lookCurrentRef.current.x, lookTargetRef.current.x, 0.12);
      lookCurrentRef.current.y = THREE.MathUtils.lerp(lookCurrentRef.current.y, lookTargetRef.current.y, 0.12);
      lookCurrentRef.current.z = THREE.MathUtils.lerp(lookCurrentRef.current.z, lookTargetRef.current.z, 0.12);
      lookVec.set(lookCurrentRef.current.x, lookCurrentRef.current.y, lookCurrentRef.current.z);
      camera.lookAt(lookVec);

      focusRing.position.x = focusRingTargetRef.current.x;
      focusRing.position.z = focusRingTargetRef.current.z;
      const pulseScale =
        focusRingTargetRef.current.scale * (prefersReducedMotion ? 1 : 1 + Math.sin(elapsed * 3.2) * 0.05);
      focusRing.scale.set(pulseScale, 1, pulseScale);
      focusRingMat.opacity = focusRingTargetRef.current.opacity;
      holoBeam.position.x = focusRingTargetRef.current.x;
      holoBeam.position.z = focusRingTargetRef.current.z;
      holoBeam.scale.set(pulseScale, 1, pulseScale);
      holoBeamMat.opacity = focusRingTargetRef.current.opacity * 0.16;
      floorDiscMat.uniforms.uTime.value = prefersReducedMotion ? 0 : elapsed;
      (floorDiscMat.uniforms.uFocusPos.value as THREE.Vector2).set(
        focusRingTargetRef.current.x,
        focusRingTargetRef.current.z
      );

      const activeCluster = clusterRef.current;
      deviceMeshes.forEach((m, i) => {
        const baseY = m.userData.baseY as number;
        const baseRotY = m.userData.baseRotY as number;
        const devId = m.userData.deviceId as DeviceBannerFocusId;
        const isHovered = hoveredIdRef.current === devId;
        const isFocused =
          activeCluster !== 'none'
            ? CLUSTER_MEMBERS[activeCluster].includes(devId)
            : sel === 'all_banner' || sel === devId;
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, isHovered ? 1.0 : isFocused ? 1.0 : 0.16, 0.12);
        m.rotation.y = THREE.MathUtils.lerp(
          m.rotation.y,
          sel === devId || isHovered ? 0 : baseRotY,
          0.1
        );
        const nextScale = THREE.MathUtils.lerp(m.scale.x, isHovered ? 1.045 : 1.0, 0.16);
        m.scale.setScalar(nextScale);

        const ch = chassisMeshes[i];
        if (ch) {
          const chMat = ch.material as THREE.MeshBasicMaterial;
          chMat.color.setHex(isHovered ? 0xd6f65a : 0x1e293b);
          chMat.opacity = THREE.MathUtils.lerp(chMat.opacity, isHovered ? 1.0 : isFocused ? 0.92 : 0.12, 0.12);
          ch.rotation.y = m.rotation.y;
          ch.scale.setScalar(nextScale);
        }
        const rim = rimBarMeshes[i];
        if (rim) {
          const rimMat = rim.material as THREE.MeshBasicMaterial;
          rimMat.color.setHex(isHovered ? 0xffffff : 0xd6f65a);
          rimMat.opacity = THREE.MathUtils.lerp(rimMat.opacity, isHovered ? 1.0 : isFocused ? 0.9 : 0.15, 0.12);
          rim.rotation.y = m.rotation.y;
          rim.scale.setScalar(nextScale);
        }


        const refl = reflectionMeshes[i];
        if (refl) {
          const rMat = refl.material as THREE.ShaderMaterial;
          rMat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
            rMat.uniforms.uOpacity.value as number,
            isHovered ? 0.42 : isFocused ? 0.28 : 0.04,
            0.12
          );
          refl.rotation.y = m.rotation.y;
          refl.scale.x = nextScale;
        }
        const ped = pedestalRingMeshes[i];
        if (ped) {
          const pedMat = ped.material as THREE.MeshBasicMaterial;
          const isPedestalHighlighted =
            isHovered ||
            sel === devId ||
            (activeCluster !== 'none' && CLUSTER_MEMBERS[activeCluster].includes(devId));
          pedMat.color.setHex(isHovered ? 0xffffff : 0xd6f65a);
          pedMat.opacity = THREE.MathUtils.lerp(
            pedMat.opacity,
            isPedestalHighlighted ? 0.85 : sel === 'all_banner' && activeCluster === 'none' ? 0.28 : 0.1,
            0.14
          );
          const pedScale = isHovered ? 1.18 : isPedestalHighlighted ? 1.08 : 1.0;
          ped.scale.setScalar(THREE.MathUtils.lerp(ped.scale.x, pedScale, 0.14));
        }

        if (!prefersReducedMotion) {
          const bob = Math.sin(elapsed * 1.5 + i * 0.7) * 0.03;
          const nextY = baseY + bob;
          m.position.y = nextY;
          if (ch) ch.position.y = nextY;
          if (rim) {
            rim.position.y = (rim.userData.rimBaseY as number) + bob;
          }
          if (refl) {
            refl.position.y = (refl.userData.reflBaseY as number) - bob * 0.5;
          }
        }
      });

      syncPulses.forEach((p, idx) => {
        const curve = syncCurves[p.userData.curveIdx as number];
        if (!curve) return;
        const [fromId, toId] = ARC_ENDPOINTS[idx];
        const hov = hoveredIdRef.current;
        const isArcActive =
          (hov !== null && (hov === fromId || hov === toId)) ||
          (activeCluster !== 'none' &&
            (CLUSTER_MEMBERS[activeCluster].includes(fromId) ||
              CLUSTER_MEMBERS[activeCluster].includes(toId))) ||
          (sel !== 'all_banner' && (sel === fromId || sel === toId));
        const targetArcOpacity = isArcActive
          ? 0.88
          : sel === 'all_banner' && activeCluster === 'none'
            ? 0.38
            : 0.14;
        const tubeMat = syncTubeMats[idx];
        if (tubeMat) {
          tubeMat.opacity = THREE.MathUtils.lerp(tubeMat.opacity, targetArcOpacity, 0.12);
        }
        p.scale.setScalar(isArcActive ? 1.5 : 1.0);
        const u = ((p.userData.offset as number) + (prefersReducedMotion ? 0 : elapsed * (0.28 + idx * 0.02))) % 1;
        curve.getPointAt(u, pulsePos);
        p.position.copy(pulsePos);
      });

      if (!prefersReducedMotion) {
        studioParticles.position.y = Math.sin(elapsed * 0.65) * 0.08;
        studioParticles.rotation.y = elapsed * 0.03;
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      renderer.setAnimationLoop(null);
      timer.dispose();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      grid.dispose();
      floorDiscGeo.dispose();
      floorDiscMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      focusRingGeo.dispose();
      focusRingMat.dispose();
      holoBeamGeo.dispose();
      holoBeamMat.dispose();
      syncGeos.forEach((g) => g.dispose());
      syncMats.forEach((m) => m.dispose());
      particleGeo.dispose();
      particleMat.dispose();
      deviceMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      chassisMeshes.forEach((c) => {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      });
      rimBarMeshes.forEach((rb) => {
        rb.geometry.dispose();
        (rb.material as THREE.Material).dispose();
      });
      reflectionMeshes.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      pedestalRingMeshes.forEach((pr) => {
        pr.geometry.dispose();
        (pr.material as THREE.Material).dispose();
      });
      loadedTextures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div className="relative w-full space-y-2">
      {(hoveredDeviceId || clusterPreset !== 'none' || selectedDeviceId !== 'all_banner') && (
        <div className="pointer-events-none absolute top-2 left-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-ecomiles-lime/60 text-[10.5px] font-bold text-ecomiles-lime shadow-lg backdrop-blur-md">
          {hoveredDeviceId
            ? `Đang trỏ: ${DEVICE_LABELS[hoveredDeviceId]}`
            : clusterPreset !== 'none'
              ? `Cụm 3D: ${
                  clusterPreset === 'office'
                    ? '2 Laptop Văn Phòng'
                    : clusterPreset === 'tablet'
                      ? 'Z Fold + iPad Pro'
                      : '3 Điện Thoại Tài Xế'
                }`
              : selectedDeviceId !== 'all_banner'
                ? `3D: ${DEVICE_2D_MOCKUPS[selectedDeviceId].title}`
                : null}
        </div>
      )}
      <div className="absolute top-2 right-2.5 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-slate-900/95 hover:bg-slate-800 border border-ecomiles-lime/60 text-ecomiles-lime text-[10.5px] font-extrabold shadow-lg backdrop-blur-md transition-all cursor-pointer"
          title="Phóng to màn hình thiết bị độ phân giải 2.4K"
        >
          🔍 Phóng To 2.4K
        </button>
        <a
          href={DEVICE_LIVE_ROUTES[selectedDeviceId].href}
          className="px-2.5 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 text-[10.5px] font-extrabold shadow-lg transition-colors"
        >
          {DEVICE_LIVE_ROUTES[selectedDeviceId].label}
        </a>
      </div>
      <div
        ref={mountRef}
        className="w-full h-[350px] sm:h-[385px] cursor-pointer rounded-xl overflow-hidden"
        title="Bấm trực tiếp vào bất kỳ thiết bị 3D nào để bay camera tới thiết bị đó (Bấm lần nữa để về toàn cảnh)"
      />
      <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 rounded-xl bg-slate-950/90 border border-ecomiles-lime/30 text-[10px] text-slate-300">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setIsAutoTour(false);
              setClusterOverride(null);
              clusterRef.current = 'none';
              onSelectDevice('all_banner');
            }}
            className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
              clusterPreset === 'none' && selectedDeviceId === 'all_banner'
                ? 'bg-ecomiles-lime text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Toàn cảnh (7)
          </button>
          <button
            type="button"
            onClick={() => applyClusterPreset('office')}
            className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
              clusterPreset === 'office'
                ? 'bg-ecomiles-lime text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            2 Laptop Văn Phòng
          </button>
          <button
            type="button"
            onClick={() => applyClusterPreset('tablet')}
            className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
              clusterPreset === 'tablet'
                ? 'bg-ecomiles-lime text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Z Fold + iPad Pro
          </button>
          <button
            type="button"
            onClick={() => applyClusterPreset('field')}
            className={`px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors ${
              clusterPreset === 'field'
                ? 'bg-ecomiles-lime text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            3 Điện Thoại Tài Xế
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepDeviceCamera(-1)}
            className="px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors bg-slate-900 text-slate-300 hover:text-white border border-white/10"
            title="Bay tới thiết bị trước"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => stepDeviceCamera(1)}
            className="px-2 py-0.5 rounded-lg font-bold cursor-pointer transition-colors bg-slate-900 text-slate-300 hover:text-white border border-white/10"
            title="Bay tới thiết bị tiếp theo"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setIsAutoTour((prev) => !prev)}
            className={`px-2 py-0.5 rounded-lg font-extrabold cursor-pointer transition-colors ${
              isAutoTour
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'bg-ecomiles-lime/15 text-ecomiles-lime border border-ecomiles-lime/40 hover:bg-ecomiles-lime/25'
            }`}
          >
            {isAutoTour ? '⏸ Đang Bay' : '▶ Bay Tự Động'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 px-1.5 py-1 rounded-xl bg-slate-950/90 border border-white/10 text-[9.5px]">
        {DIRECT_JUMP_DEVICES.map((item) => {
          const isDirectSelected = clusterPreset === 'none' && selectedDeviceId === item.id;
          const isInCluster =
            clusterPreset !== 'none' && CLUSTER_MEMBERS[clusterPreset].includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setIsAutoTour(false);
                setClusterOverride(null);
                clusterRef.current = 'none';
                onSelectDevice(isDirectSelected ? 'all_banner' : item.id);
              }}
              className={`px-1.5 py-0.5 rounded-md font-bold truncate cursor-pointer transition-colors ${
                isDirectSelected
                  ? 'bg-ecomiles-lime text-slate-950 shadow-sm'
                  : isInCluster
                    ? 'bg-ecomiles-lime/20 text-ecomiles-lime border border-ecomiles-lime/50'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10'
              }`}
              title={DEVICE_LABELS[item.id]}
            >
              {item.shortLabel}
            </button>
          );
        })}
      </div>
      {isLightboxOpen &&
        typeof document !== 'undefined' &&
        (() => {
          const allIds: DeviceBannerFocusId[] = [
            'all_banner',
            ...DIRECT_JUMP_DEVICES.map((d) => d.id),
          ];
          const curIdx = Math.max(0, allIds.indexOf(selectedDeviceId));
          const stepLightbox = (delta: 1 | -1) => {
            const nextId = allIds[(curIdx + delta + allIds.length) % allIds.length];
            setIsAutoTour(false);
            setClusterOverride(null);
            clusterRef.current = 'none';
            onSelectDevice(nextId);
          };
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="High-DPI Hardware Mockup Lightbox"
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-ecomiles-lime animate-pulse shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">
                        [{curIdx + 1}/{allIds.length}] {DEVICE_2D_MOCKUPS[selectedDeviceId].title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {DEVICE_2D_MOCKUPS[selectedDeviceId].subtitle} ·{' '}
                        <span className="text-ecomiles-lime font-mono">
                          {DEVICE_2D_MOCKUPS[selectedDeviceId].resolution}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => stepLightbox(-1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      ‹ Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => stepLightbox(1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Tiếp ›
                    </button>
                    <a
                      href={DEVICE_LIVE_ROUTES[selectedDeviceId].href}
                      className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 text-xs font-extrabold transition-colors"
                    >
                      {DEVICE_LIVE_ROUTES[selectedDeviceId].label}
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-colors cursor-pointer"
                    >
                      ✕ Đóng
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={DEVICE_2D_MOCKUPS[selectedDeviceId].src}
                    alt={DEVICE_2D_MOCKUPS[selectedDeviceId].title}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectDevice('all_banner')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                      selectedDeviceId === 'all_banner'
                        ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    0. Studio 7 Thiết Bị
                  </button>
                  {DIRECT_JUMP_DEVICES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectDevice(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        selectedDeviceId === item.id
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
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
};
