import React, { useEffect, useRef, useState } from 'react';
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

const DEVICE_LABELS: Record<Exclude<DeviceBannerFocusId, 'all_banner'>, string> = {
  macbook_pro: 'MacBook Pro 16" (Trung Tâm Điều Phối B2B)',
  windows_xps: 'Windows 11 XPS 16 (Đối Chứng EVSIM)',
  galaxy_zfold: 'Samsung Galaxy Z Fold (Buồng Lái Xe Tải)',
  ipad_pro: 'iPad Pro M4 (Bảng Điều Khiển Kho Vận)',
  iphone_18_pro_max: 'iPhone 18 Pro Max (Chặng Giữa >500kg)',
  iphone_duo: 'iPhone Duo Gập Đôi (Đa Nhiệm 2 Màn Hình)',
  galaxy_s26_ultra: 'Samsung Galaxy S26 Ultra (Dẫn Đường /maps)',
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

    // 3D Data-Sync Arcs + Animated Data Pulses from Office Laptops to Field Devices
    const syncCurves: THREE.CatmullRomCurve3[] = [];
    const syncPulses: THREE.Mesh[] = [];
    const syncGeos: THREE.BufferGeometry[] = [];
    const syncMats: THREE.Material[] = [];
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
      stageGroup.add(new THREE.Mesh(tGeo, tMat));

      const pMat = new THREE.MeshBasicMaterial({ color: 0xd6f65a });
      syncMats.push(pMat);
      const pulse = new THREE.Mesh(pulseGeo, pMat);
      pulse.userData = { curveIdx: idx, offset: idx * 0.16 };
      stageGroup.add(pulse);
      syncPulses.push(pulse);
    });

    // Load 7 Real Device Textures (threejs-textures: SRGBColorSpace + LinearFilter + 3D Physical Chassis Backing)
    const loader = new THREE.TextureLoader();
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const deviceMeshes: THREE.Mesh[] = [];
    const chassisMeshes: THREE.Mesh[] = [];
    const reflectionMeshes: THREE.Mesh[] = [];
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
      }
    };

    const onPointerLeave = () => {
      pointerOffset.x = 0;
      pointerOffset.y = 0;
      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredDeviceId(null);
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
          onSelectRef.current(selectedIdRef.current === hitId ? 'all_banner' : hitId);
        }
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

        if (!prefersReducedMotion) {
          const bob = Math.sin(elapsed * 1.5 + i * 0.7) * 0.03;
          const nextY = baseY + bob;
          m.position.y = nextY;
          if (ch) ch.position.y = nextY;
          if (refl) {
            refl.position.y = (refl.userData.reflBaseY as number) - bob * 0.5;
          }
        }
      });

      syncPulses.forEach((p, idx) => {
        const curve = syncCurves[p.userData.curveIdx as number];
        if (!curve) return;
        const u = ((p.userData.offset as number) + (prefersReducedMotion ? 0 : elapsed * (0.28 + idx * 0.02))) % 1;
        curve.getPointAt(u, pulsePos);
        p.position.copy(pulsePos);
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
      grid.dispose();
      floorDiscGeo.dispose();
      floorDiscMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      focusRingGeo.dispose();
      focusRingMat.dispose();
      syncGeos.forEach((g) => g.dispose());
      syncMats.forEach((m) => m.dispose());
      deviceMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      chassisMeshes.forEach((c) => {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      });
      reflectionMeshes.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      });
      loadedTextures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div className="relative w-full space-y-2">
      {hoveredDeviceId && (
        <div className="pointer-events-none absolute top-2 left-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-ecomiles-lime/60 text-[10.5px] font-bold text-ecomiles-lime shadow-lg backdrop-blur-md">
          Đang trỏ: {DEVICE_LABELS[hoveredDeviceId]} · Bấm để bay camera tới
        </div>
      )}
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
    </div>
  );
};
