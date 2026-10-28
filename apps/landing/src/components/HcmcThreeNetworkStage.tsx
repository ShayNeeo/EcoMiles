import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import gsap from 'gsap';
import { ArrowUpRight, ChevronLeft, ChevronRight, Download, Pause, Play, ShieldCheck, Truck, X, Zap, ZoomIn } from 'lucide-react';

interface HcmcNodeSpec {
  id: string;
  label: string;
  shortName: string;
  x: number;
  z: number;
  kind: 'depot' | 'hub' | 'ban';
  deviceLabel: string;
  stats: string;
  mockupSrc: string;
  liveHref: string;
}

const HCMC_3D_NODES: HcmcNodeSpec[] = [
  {
    id: 'depot',
    label: 'Kho Tân Bình (364 Cộng Hòa)',
    shortName: 'Kho Tân Bình',
    x: -1.9,
    z: -0.7,
    kind: 'depot',
    deviceLabel: 'MacBook Pro 16" & Windows XPS 16',
    stats: '120 đơn · 7 tuyến ALNS · Xuất phát 05:30',
    mockupSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'govap',
    label: 'Gò Vấp (18 đơn)',
    shortName: 'Gò Vấp',
    x: -0.8,
    z: -2.1,
    kind: 'hub',
    deviceLabel: 'iPhone 18 Pro Max',
    stats: '18 đơn · Bắc Sài Gòn · ETA 06:45',
    mockupSrc: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
  },
  {
    id: 'binhthanh',
    label: 'Bình Thạnh (Cầu 13T)',
    shortName: 'Bình Thạnh',
    x: 0.9,
    z: -0.9,
    kind: 'hub',
    deviceLabel: 'Samsung Galaxy Z Fold',
    stats: 'Cầu 13T · Chuyển tải Đông-Bắc · 100% đúng tải',
    mockupSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
  {
    id: 'thuduc',
    label: 'TP. Thủ Đức (24 đơn)',
    shortName: 'TP. Thủ Đức',
    x: 2.4,
    z: -1.4,
    kind: 'hub',
    deviceLabel: 'iPhone Duo Dual-Screen',
    stats: '24 đơn · Xa Lộ Hà Nội · Ghép đơn chiều về',
    mockupSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
  },
  {
    id: 'quan7',
    label: 'Quận 7 · Nam Sài Gòn',
    shortName: 'Quận 7',
    x: 1.3,
    z: 1.9,
    kind: 'hub',
    deviceLabel: 'Samsung Galaxy S26 Ultra',
    stats: '19 đơn · Nam Sài Gòn · Phối hợp Cảng Hiệp Phước',
    mockupSrc: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
  {
    id: 'binhtan',
    label: 'Bình Tân · Chợ Lớn',
    shortName: 'Bình Tân',
    x: -2.3,
    z: 1.5,
    kind: 'hub',
    deviceLabel: 'iPad Pro M4',
    stats: '22 đơn · Quốc Lộ 1A · Tải trọng 94.2%',
    mockupSrc: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'q1_ban',
    label: 'Lõi Cấm Tải QĐ 23 (06-09h & 16-20h)',
    shortName: 'Lõi Cấm QĐ 23',
    x: -0.1,
    z: 0.35,
    kind: 'ban',
    deviceLabel: 'OpenTruck HUD · 0 Vi Phạm',
    stats: 'Khung cấm 06-09h & 16-20h · Định tuyến vòng 100%',
    mockupSrc: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
];
const STUDIO_HUB_SPEC: HcmcNodeSpec = {
  id: 'studio_stage',
  label: 'Toàn Cảnh Hệ Sinh Thái 7 Thiết Bị (Studio 2.4K)',
  shortName: '0A. Studio 2.4K',
  x: 0,
  z: 0,
  kind: 'hub',
  deviceLabel: 'Master Studio Stage · 2400×1120',
  stats: 'Toàn bộ 7 thiết bị · Sàn gương phản chiếu · Đồng bộ thời gian thực',
  mockupSrc: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
  liveHref: '/dashboard/',
};
const OG_COVER_HUB_SPEC: HcmcNodeSpec = {
  id: 'cover_banner',
  label: 'Ảnh Bìa OpenGraph / Pitch Deck (OG Cover 2.4K)',
  shortName: '0B. Ảnh Bìa OG',
  x: 0,
  z: 0,
  kind: 'hub',
  deviceLabel: 'Flagship Cover Banner · 2400×1260',
  stats: 'Chuẩn Thương Hiệu EcoMiles · -34.9% Km & -39.2% CO₂e',
  mockupSrc: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
  liveHref: '/pitch-deck/',
};
const HCMC_LIGHTBOX_NODES: HcmcNodeSpec[] = [STUDIO_HUB_SPEC, OG_COVER_HUB_SPEC, ...HCMC_3D_NODES];

const ROUTE_ARCS: Array<{ points: Array<[number, number, number]>; color: number }> = [
  {
    points: [
      [-1.9, 0.08, -0.7],
      [-1.4, 0.36, -1.6],
      [-0.8, 0.12, -2.1],
      [0.1, 0.38, -1.55],
      [0.9, 0.12, -0.9],
      [1.75, 0.34, -1.2],
      [2.4, 0.08, -1.4],
    ],
    color: 0xd6f65a,
  },
  {
    points: [
      [-1.9, 0.08, -0.7],
      [-2.2, 0.28, 0.4],
      [-2.3, 0.1, 1.5],
      [-0.5, 0.36, 1.85],
      [1.3, 0.1, 1.9],
      [1.2, 0.32, 0.4],
      [0.9, 0.12, -0.9],
    ],
    color: 0x34d399,
  },
  {
    points: [
      [2.4, 0.08, -1.4],
      [2.1, 0.42, 0.25],
      [1.3, 0.1, 1.9],
      [-0.4, 0.28, 1.15],
      [-1.9, 0.08, -0.7],
    ],
    color: 0x38bdf8,
  },
];

export const HcmcThreeNetworkStage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeCluster, setActiveCluster] = useState<'all' | 'qd23' | 'backhaul'>('all');
  const activeClusterRef = useRef<'all' | 'qd23' | 'backhaul'>('all');
  const camTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 4.7, z: 6.2 });
  const lookTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const lookCurrentRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [selectedNode, setSelectedNode] = useState<HcmcNodeSpec>(HCMC_3D_NODES[0]);
  const selectedNodeRef = useRef<HcmcNodeSpec>(HCMC_3D_NODES[0]);
  const [isAutoHubTour, setIsAutoHubTour] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<HcmcNodeSpec | null>(null);
  const hoveredNodeRef = useRef<HcmcNodeSpec | null>(null);
  const [isDeviceLightboxOpen, setIsDeviceLightboxOpen] = useState<boolean>(false);

  const focusHcmcNode = (node: HcmcNodeSpec) => {
    selectedNodeRef.current = node;
    setSelectedNode(node);
    const dur =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 0.75;
    gsap.to(camTargetRef.current, {
      x: node.x * 0.85,
      y: 2.75,
      z: node.z + 3.15,
      duration: dur,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    gsap.to(lookTargetRef.current, {
      x: node.x,
      y: 0.12,
      z: node.z,
      duration: dur,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };
  useEffect(() => {
    if (!isDeviceLightboxOpen) return undefined;
    const total = HCMC_LIGHTBOX_NODES.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDeviceLightboxOpen(false);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setIsAutoHubTour(false);
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const idx = Math.max(
          0,
          HCMC_LIGHTBOX_NODES.findIndex((n) => n.id === selectedNodeRef.current.id)
        );
        const nextNode = HCMC_LIGHTBOX_NODES[(idx + delta + total) % total];
        if (nextNode) focusHcmcNode(nextNode);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDeviceLightboxOpen]);

  useEffect(() => {
    if (!isAutoHubTour) return;
    const timerId = window.setInterval(() => {
      const idx = HCMC_3D_NODES.findIndex((n) => n.id === selectedNodeRef.current.id);
      const nextNode = HCMC_3D_NODES[(idx + 1) % HCMC_3D_NODES.length];
      if (nextNode) focusHcmcNode(nextNode);
    }, 2800);
    return () => window.clearInterval(timerId);
  }, [isAutoHubTour]);

  useEffect(() => {
    activeClusterRef.current = activeCluster;
    const dur =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 0.85;
    if (activeCluster === 'qd23') {
      gsap.to(camTargetRef.current, { x: -0.15, y: 2.85, z: 3.65, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: -0.1, y: 0.06, z: 0.35, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
    } else if (activeCluster === 'backhaul') {
      gsap.to(camTargetRef.current, { x: 0.55, y: 3.55, z: 4.85, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: 0.25, y: 0.15, z: 0.45, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
    } else {
      gsap.to(camTargetRef.current, { x: 0, y: 4.7, z: 6.2, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(lookTargetRef.current, { x: 0, y: 0, z: 0, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }, [activeCluster]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const width = Math.max(300, container.clientWidth);
    const height = Math.max(260, container.clientHeight);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 4.7, 6.2);
    camera.lookAt(0, 0, 0);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const ambient = new THREE.AmbientLight(0xd1fae5, 1.25);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xd6f65a, 8, 12);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    const baseGeo = new THREE.CylinderGeometry(3.45, 3.6, 0.14, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x07150f,
      roughness: 0.55,
      metalness: 0.35,
    });
    const baseDisk = new THREE.Mesh(baseGeo, baseMat);
    baseDisk.position.y = -0.08;
    worldGroup.add(baseDisk);

    const ringGeo = new THREE.RingGeometry(3.38, 3.46, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd6f65a,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(ringGeo, ringMat);
    outerRing.position.y = 0.01;
    worldGroup.add(outerRing);

    const gridHelper = new THREE.PolarGridHelper(3.2, 12, 6, 48, 0x10b981, 0x064e3b);
    gridHelper.position.y = 0.015;
    worldGroup.add(gridHelper);

    // GLSL ShaderMaterial Concentric Radar Sonar Pulse radiating from Kho Tan Binh (-1.9, -0.7)
    const radarGeo = new THREE.CircleGeometry(3.36, 64);
    radarGeo.rotateX(-Math.PI / 2);
    const radarMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uOrigin: { value: new THREE.Vector2(-1.9, -0.7) },
        uColor: { value: new THREE.Color(0xd6f65a) },
      },
      vertexShader: `
        varying vec2 vXz;
        void main() {
          vXz = position.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uOrigin;
        uniform vec3 uColor;
        varying vec2 vXz;
        void main() {
          float d = distance(vXz, uOrigin);
          float wave = fract(d * 1.15 - uTime * 0.45);
          float ring = smoothstep(0.0, 0.12, wave) * (1.0 - smoothstep(0.12, 0.28, wave));
          float falloff = 1.0 - smoothstep(0.4, 5.2, d);
          gl_FragColor = vec4(uColor, ring * falloff * 0.24);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    const radarDisk = new THREE.Mesh(radarGeo, radarMat);
    radarDisk.position.y = 0.012;
    worldGroup.add(radarDisk);

    const banZoneGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.06, 36);
    const banZoneMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.42,
    });
    const banDisk = new THREE.Mesh(banZoneGeo, banZoneMat);
    banDisk.position.set(-0.1, 0.04, 0.35);
    banDisk.userData = { nodeSpec: HCMC_3D_NODES.find((n) => n.id === 'q1_ban') };
    worldGroup.add(banDisk);
    const pickableMeshes: THREE.Mesh[] = [banDisk];

    const banRingGeo = new THREE.RingGeometry(0.84, 0.92, 48);
    banRingGeo.rotateX(-Math.PI / 2);
    const banRingMat = new THREE.MeshBasicMaterial({
      color: 0xf87171,
      side: THREE.DoubleSide,
    });
    const banRing = new THREE.Mesh(banRingGeo, banRingMat);
    banRing.position.set(-0.1, 0.08, 0.35);
    worldGroup.add(banRing);

    const nodeGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.24, 24);
    const depotGeo = new THREE.BoxGeometry(0.34, 0.38, 0.34);
    const beaconGeo = new THREE.CylinderGeometry(0.05, 0.13, 0.65, 24, 1, true);
    const beaconMeshes: THREE.Mesh[] = [];

    HCMC_3D_NODES.forEach((n) => {
      const isDepot = n.kind === 'depot';
      const isBan = n.kind === 'ban';
      const beaconColor = isBan ? 0xef4444 : isDepot ? 0xd6f65a : 0x34d399;

      const beaconMat = new THREE.MeshBasicMaterial({
        color: beaconColor,
        transparent: true,
        opacity: isDepot ? 0.42 : 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(n.x, isDepot ? 0.56 : 0.48, n.z);
      beaconMesh.userData = { nodeSpec: n };
      worldGroup.add(beaconMesh);
      beaconMeshes.push(beaconMesh);

      if (isBan) return;
      const mat = new THREE.MeshStandardMaterial({
        color: isDepot ? 0xd6f65a : 0x10b981,
        emissive: isDepot ? 0xd6f65a : 0x059669,
        emissiveIntensity: isDepot ? 0.55 : 0.35,
        roughness: 0.25,
        metalness: 0.6,
      });
      const mesh = new THREE.Mesh(isDepot ? depotGeo : nodeGeo, mat);
      mesh.position.set(n.x, isDepot ? 0.2 : 0.13, n.z);
      mesh.userData = { nodeSpec: n };
      worldGroup.add(mesh);
      pickableMeshes.push(mesh);
    });

    const curves: THREE.CatmullRomCurve3[] = [];
    const tubeMaterials: THREE.MeshStandardMaterial[] = [];
    const truckPucks: THREE.Mesh[] = [];
    const puckGeo = new THREE.BoxGeometry(0.22, 0.12, 0.12);

    ROUTE_ARCS.forEach((arc) => {
      const vecs = arc.points.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      const curve = new THREE.CatmullRomCurve3(vecs);
      curves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.036, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: arc.color,
        emissive: arc.color,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        transparent: true,
        opacity: 0.95,
      });
      tubeMaterials.push(tubeMat);
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      worldGroup.add(tubeMesh);

      for (let t = 0; t < 2; t++) {
        const puckMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: arc.color,
          emissiveIntensity: 0.85,
        });
        const puck = new THREE.Mesh(puckGeo, puckMat);
        puck.userData = { curveIdx: curves.length - 1, offset: t * 0.48 };
        worldGroup.add(puck);
        truckPucks.push(puck);
      }
    });

    const targetRot = { x: 0.08, y: -0.25 };
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      targetRot.y = nx * 0.45;
      targetRot.x = ny * 0.22;
      pointerNdc.set(nx, -ny);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(pickableMeshes, false);
      const hitSpec =
        (hits[0]?.object.userData.nodeSpec as HcmcNodeSpec | undefined) ?? null;
      if (hoveredNodeRef.current?.id !== hitSpec?.id) {
        hoveredNodeRef.current = hitSpec;
        setHoveredNode(hitSpec);
      }
    };
    const onPointerLeave = () => {
      if (hoveredNodeRef.current !== null) {
        hoveredNodeRef.current = null;
        setHoveredNode(null);
      }
    };
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(pickableMeshes, false);
      if (hits.length > 0) {
        const hitSpec = hits[0].object.userData.nodeSpec as HcmcNodeSpec | undefined;
        if (hitSpec) focusHcmcNode(hitSpec);
      }
    };
    container.addEventListener('click', onClick);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(260, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const timer = new THREE.Timer();
    timer.connect(document);

    const tempPos = new THREE.Vector3();
    const tempLook = new THREE.Vector3();

    const animate = () => {
      timer.update();
      const elapsed = timer.getElapsed();
      const mode = activeClusterRef.current;
      radarMat.uniforms.uTime.value = prefersReducedMotion ? 1.2 : elapsed;


      camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetRef.current.x, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, camTargetRef.current.y, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetRef.current.z, 0.1);
      lookCurrentRef.current.x = THREE.MathUtils.lerp(lookCurrentRef.current.x, lookTargetRef.current.x, 0.12);
      lookCurrentRef.current.y = THREE.MathUtils.lerp(lookCurrentRef.current.y, lookTargetRef.current.y, 0.12);
      lookCurrentRef.current.z = THREE.MathUtils.lerp(lookCurrentRef.current.z, lookTargetRef.current.z, 0.12);
      camera.lookAt(lookCurrentRef.current.x, lookCurrentRef.current.y, lookCurrentRef.current.z);
      banZoneMat.opacity = mode === 'qd23' ? 0.78 : 0.42;
      banZoneMat.emissiveIntensity = mode === 'qd23' ? 1.15 : 0.65;
      tubeMaterials.forEach((tm, idx) => {
        const isBackhaulCorridor = idx >= 1;
        tm.opacity = mode === 'backhaul' ? (isBackhaulCorridor ? 1.0 : 0.25) : 0.95;
        tm.emissiveIntensity = mode === 'backhaul' && isBackhaulCorridor ? 0.95 : 0.45;
      });

      if (!prefersReducedMotion) {
        worldGroup.rotation.y = THREE.MathUtils.lerp(
          worldGroup.rotation.y,
          targetRot.y + Math.sin(elapsed * 0.35) * 0.14,
          0.06
        );
        worldGroup.rotation.x = THREE.MathUtils.lerp(worldGroup.rotation.x, targetRot.x, 0.06);
        banRing.scale.setScalar(
          1 + Math.sin(elapsed * (mode === 'qd23' ? 4.2 : 2.6)) * (mode === 'qd23' ? 0.08 : 0.04)
        );
      }

      pickableMeshes.forEach((m) => {
        if (m === banDisk) return;
        const spec = m.userData.nodeSpec as HcmcNodeSpec | undefined;
        const isHov = spec && hoveredNodeRef.current?.id === spec.id;
        const nextScale = THREE.MathUtils.lerp(m.scale.x, isHov ? 1.24 : 1.0, 0.16);
        m.scale.setScalar(nextScale);
      });
      beaconMeshes.forEach((beacon, idx) => {
        const spec = beacon.userData.nodeSpec as HcmcNodeSpec | undefined;
        const isSelected = spec && selectedNodeRef.current.id === spec.id;
        const isHovered = spec && hoveredNodeRef.current?.id === spec.id;
        const isHighlighted = Boolean(isSelected || isHovered);
        const bMat = beacon.material as THREE.MeshBasicMaterial;
        const pulse = prefersReducedMotion ? 0 : Math.sin(elapsed * 4.2 + idx * 0.9) * 0.08;
        const targetOpacity = (isHovered ? 0.85 : isSelected ? 0.72 : 0.22) + pulse;
        bMat.opacity = THREE.MathUtils.lerp(bMat.opacity, THREE.MathUtils.clamp(targetOpacity, 0.12, 0.96), 0.16);
        const targetRadialScale = isHovered ? 1.38 : isSelected ? 1.22 : 1.0;
        const targetHeightScale = isHighlighted ? 1.22 : 0.92;
        beacon.scale.x = THREE.MathUtils.lerp(beacon.scale.x, targetRadialScale, 0.16);
        beacon.scale.z = THREE.MathUtils.lerp(beacon.scale.z, targetRadialScale, 0.16);
        beacon.scale.y = THREE.MathUtils.lerp(beacon.scale.y, targetHeightScale, 0.16);
      });
      truckPucks.forEach((puck, idx) => {
        const cIdx = puck.userData.curveIdx as number;
        const offset = puck.userData.offset as number;
        const curve = curves[cIdx];
        if (!curve) return;
        const speed = prefersReducedMotion ? 0 : 0.09 + idx * 0.012;
        const u = (offset + elapsed * speed) % 1;
        curve.getPointAt(u, tempPos);
        curve.getPointAt((u + 0.02) % 1, tempLook);
        puck.position.copy(tempPos);
        puck.lookAt(tempLook);
      });

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
      gridHelper.dispose();
      beaconGeo.dispose();
      worldGroup.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => m?.dispose());
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div className="relative w-full rounded-3xl border border-emerald-400/25 bg-slate-950/85 backdrop-blur-md shadow-[0_24px_64px_rgba(0,0,0,0.65)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-slate-900/90 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-ecomiles-lime animate-pulse" />
          <span className="font-extrabold text-white tracking-wide uppercase">
            Mô Hình 3D Mạng Lưới Điều Phối TP.HCM (Three.js WebGL)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['all', 'qd23', 'backhaul'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveCluster(mode)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                activeCluster === mode
                  ? 'bg-ecomiles-lime text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {mode === 'all'
                ? '7 Tuyến Tối Ưu'
                : mode === 'qd23'
                  ? 'Vùng Cấm QĐ 23/2018'
                  : 'Ghép Chiều Về'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full">
        {hoveredNode && (
          <div className="pointer-events-none absolute top-2.5 left-3 z-10 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-ecomiles-lime/60 text-[10.5px] font-bold text-ecomiles-lime shadow-lg backdrop-blur-md">
            Đang trỏ: {hoveredNode.label} · {hoveredNode.deviceLabel}
          </div>
        )}
        <a
          href="/maps/?vehicle=0&mode=navigate"
          className="absolute top-2.5 right-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/90 hover:bg-ecomiles-lime hover:text-slate-950 border border-ecomiles-lime/40 text-[10.5px] font-extrabold text-ecomiles-lime transition-colors shadow-lg backdrop-blur-md"
        >
          <span>Mở Bản Đồ /maps</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
        <div
          ref={mountRef}
          className="w-full h-[270px] sm:h-[310px] cursor-grab active:cursor-grabbing"
          aria-label="Mô hình 3D mạng lưới giao nhận đô thị TP.HCM tránh vùng cấm tải QĐ 23/2018"
        />
      </div>

      {/* Interactive 7-Hub & 7-Device Corridor Telemetry Picker Strip */}
      <div className="px-3 py-2 border-t border-white/10 bg-slate-900/95 space-y-1.5 text-[10px]">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-extrabold text-ecomiles-lime">
            {selectedNode.label} · {selectedNode.deviceLabel}
          </span>
          <span className="text-slate-300 font-medium">{selectedNode.stats}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1">
            {HCMC_3D_NODES.map((node) => {
              const isSel = selectedNode.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    setIsAutoHubTour(false);
                    focusHcmcNode(node);
                  }}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    isSel
                      ? 'bg-ecomiles-lime text-slate-950'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {node.shortName}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsAutoHubTour(false);
                focusHcmcNode(STUDIO_HUB_SPEC);
                setIsDeviceLightboxOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold cursor-pointer transition-colors border bg-ecomiles-lime text-slate-950 border-ecomiles-lime hover:bg-yellow-300"
            >
              <ZoomIn className="w-3 h-3" />
              <span>Sân Khấu 2.4K</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAutoHubTour(false);
                setIsDeviceLightboxOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold cursor-pointer transition-colors border bg-slate-950 text-ecomiles-lime border-ecomiles-lime/50 hover:bg-ecomiles-lime hover:text-slate-950"
            >
              <ZoomIn className="w-3 h-3" />
              <span>Xem Thiết Bị 2.4K</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAutoHubTour((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold cursor-pointer transition-colors border ${
                isAutoHubTour
                  ? 'bg-emerald-400 text-slate-950 border-emerald-400'
                  : 'bg-ecomiles-lime/15 text-ecomiles-lime border-ecomiles-lime/40 hover:bg-ecomiles-lime/25'
              }`}
            >
              {isAutoHubTour ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              <span>{isAutoHubTour ? 'Đang Quét' : 'Quét 7 Trạm'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-slate-950/95 text-center py-2.5 px-2">
        <div className="px-2">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Truck className="w-3 h-3 text-ecomiles-lime" />
            <span>Cự ly 120 đơn</span>
          </div>
          <div className="text-sm sm:text-base font-black text-ecomiles-lime mt-0.5">
            243.7 km (-34.9%)
          </div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-rose-400" />
            <span>Vùng cấm QĐ 23</span>
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
            0 Vi phạm (Né lõi đỏ)
          </div>
        </div>
        <div className="px-2">
          <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-sky-400" />
            <span>Tỷ lệ chạy rỗng</span>
          </div>
          <div className="text-sm sm:text-base font-black text-sky-300 mt-0.5">
            2.7% (+21 đơn về)
          </div>
        </div>
      </div>
      {isDeviceLightboxOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Thiết bị 2.4K tại ${selectedNode.label}`}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
            onClick={() => setIsDeviceLightboxOpen(false)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                    [{Math.max(0, HCMC_LIGHTBOX_NODES.findIndex((n) => n.id === selectedNode.id)) + 1}/
                    {HCMC_LIGHTBOX_NODES.length}] {selectedNode.label} · {selectedNode.deviceLabel}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">{selectedNode.stats}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = Math.max(0, HCMC_LIGHTBOX_NODES.findIndex((n) => n.id === selectedNode.id));
                      const prev =
                        HCMC_LIGHTBOX_NODES[(idx - 1 + HCMC_LIGHTBOX_NODES.length) % HCMC_LIGHTBOX_NODES.length];
                      if (prev) focusHcmcNode(prev);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = Math.max(0, HCMC_LIGHTBOX_NODES.findIndex((n) => n.id === selectedNode.id));
                      const next = HCMC_LIGHTBOX_NODES[(idx + 1) % HCMC_LIGHTBOX_NODES.length];
                      if (next) focusHcmcNode(next);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                  >
                    <span>Tiếp</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={selectedNode.mockupSrc}
                    download
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải PNG 2.4K</span>
                  </a>
                  <a
                    href={selectedNode.liveHref}
                    className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1"
                  >
                    <span>Mở App ({selectedNode.liveHref})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsDeviceLightboxOpen(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    aria-label="Đóng phóng to 2.4K"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Đóng</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                <img
                  src={selectedNode.mockupSrc}
                  alt={`${selectedNode.label} - ${selectedNode.deviceLabel}`}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                />
              </div>
              <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                {HCMC_LIGHTBOX_NODES.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => focusHcmcNode(node)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                      selectedNode.id === node.id
                        ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    {node.shortName}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
