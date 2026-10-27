import React, { useEffect, useRef } from 'react';
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

export const ThreeDeviceEcosystemBanner: React.FC<ThreeDeviceEcosystemBannerProps> = ({
  selectedDeviceId,
  onSelectDevice,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const camTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.48, z: 7.45 });
  const lookTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.38, z: 0 });
  const selectedIdRef = useRef<DeviceBannerFocusId>(selectedDeviceId);
  const onSelectRef = useRef(onSelectDevice);

  useEffect(() => {
    onSelectRef.current = onSelectDevice;
  }, [onSelectDevice]);

  // GSAP Smooth 3D Camera Flight when selectedDeviceId changes
  useEffect(() => {
    selectedIdRef.current = selectedDeviceId;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = prefersReducedMotion ? 0 : 0.85;

    if (selectedDeviceId === 'all_banner') {
      gsap.to(camTargetRef.current, { x: 0, y: 1.48, z: 7.45, duration: dur, ease: 'power3.out' });
      gsap.to(lookTargetRef.current, { x: 0, y: 1.38, z: 0, duration: dur, ease: 'power3.out' });
    } else {
      const spec = DEVICE_3D_SPECS.find((d) => d.id === selectedDeviceId);
      if (spec) {
        gsap.to(camTargetRef.current, {
          x: spec.camPos[0],
          y: spec.camPos[1],
          z: spec.camPos[2],
          duration: dur,
          ease: 'power3.out',
        });
        gsap.to(lookTargetRef.current, {
          x: spec.lookAt[0],
          y: spec.lookAt[1],
          z: spec.lookAt[2],
          duration: dur,
          ease: 'power3.out',
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

    // Load 7 Real Device Textures (threejs-textures: tag SRGBColorSpace + maxAnisotropy)
    const loader = new THREE.TextureLoader();
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const deviceMeshes: THREE.Mesh[] = [];
    const loadedTextures: THREE.Texture[] = [];

    DEVICE_3D_SPECS.forEach((spec) => {
      const tex = loader.load(spec.textureUrl);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      loadedTextures.push(tex);

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
          onSelectRef.current(selectedIdRef.current === hitId ? 'all_banner' : hitId);
        }
      }
    };

    container.addEventListener('pointermove', onPointerMove);
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
        0.08
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        camTargetRef.current.y + (prefersReducedMotion ? 0 : pointerOffset.y),
        0.08
      );
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetRef.current.z, 0.08);

      lookVec.set(lookTargetRef.current.x, lookTargetRef.current.y, lookTargetRef.current.z);
      camera.lookAt(lookVec);

      deviceMeshes.forEach((m, i) => {
        const baseY = m.userData.baseY as number;
        const baseRotY = m.userData.baseRotY as number;
        const devId = m.userData.deviceId as DeviceBannerFocusId;
        const isFocused = sel === 'all_banner' || sel === devId;

        const mat = m.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, isFocused ? 1.0 : 0.16, 0.12);
        m.rotation.y = THREE.MathUtils.lerp(
          m.rotation.y,
          sel === devId ? 0 : baseRotY,
          0.1
        );

        if (!prefersReducedMotion) {
          m.position.y = baseY + Math.sin(elapsed * 1.5 + i * 0.7) * 0.03;
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
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      grid.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      syncGeos.forEach((g) => g.dispose());
      syncMats.forEach((m) => m.dispose());
      deviceMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      loadedTextures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div className="relative w-full space-y-2">
      <div
        ref={mountRef}
        className="w-full h-[390px] sm:h-[430px] cursor-pointer rounded-xl overflow-hidden"
        title="Bấm trực tiếp vào bất kỳ thiết bị 3D nào để bay camera tới thiết bị đó (Bấm lần nữa để về toàn cảnh)"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-ecomiles-lime/30 text-[11px] text-slate-300">
        <span className="font-bold text-ecomiles-lime">
          Three.js 3D WebGL + GSAP Camera Flight + Luồng Đồng Bộ Dữ Liệu 3D
        </span>
        <span>Bấm trực tiếp vào thiết bị 3D để bay camera tới (bấm lần 2 để về toàn cảnh)</span>
      </div>
    </div>
  );
};
