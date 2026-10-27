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
    width: 3.3,
    height: 2.15,
    pos: [-1.85, 1.35, -1.1],
    rotY: 0.14,
    camPos: [-1.6, 1.4, 2.3],
    lookAt: [-1.85, 1.35, -1.1],
  },
  {
    id: 'windows_xps',
    textureUrl: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    width: 3.3,
    height: 2.15,
    pos: [1.85, 1.35, -1.1],
    rotY: -0.14,
    camPos: [1.6, 1.4, 2.3],
    lookAt: [1.85, 1.35, -1.1],
  },
  {
    id: 'galaxy_zfold',
    textureUrl: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    width: 1.55,
    height: 2.1,
    pos: [-3.55, 1.05, 0.25],
    rotY: 0.32,
    camPos: [-2.7, 1.08, 2.75],
    lookAt: [-3.55, 1.05, 0.25],
  },
  {
    id: 'ipad_pro',
    textureUrl: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    width: 1.55,
    height: 2.1,
    pos: [3.55, 1.05, 0.25],
    rotY: -0.32,
    camPos: [2.7, 1.08, 2.75],
    lookAt: [3.55, 1.05, 0.25],
  },
  {
    id: 'iphone_18_pro_max',
    textureUrl: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    width: 0.96,
    height: 2.06,
    pos: [-1.55, 0.92, 1.15],
    rotY: 0.18,
    camPos: [-1.35, 0.95, 3.25],
    lookAt: [-1.55, 0.92, 1.15],
  },
  {
    id: 'iphone_duo',
    textureUrl: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    width: 1.82,
    height: 2.02,
    pos: [0, 0.94, 1.38],
    rotY: 0,
    camPos: [0, 0.96, 3.55],
    lookAt: [0, 0.94, 1.38],
  },
  {
    id: 'galaxy_s26_ultra',
    textureUrl: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    width: 0.96,
    height: 2.06,
    pos: [1.55, 0.92, 1.15],
    rotY: -0.18,
    camPos: [1.35, 0.95, 3.25],
    lookAt: [1.55, 0.92, 1.15],
  },
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
  const camTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.55, z: 6.15 });
  const lookTargetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 1.05, z: 0 });
  const onSelectRef = useRef(onSelectDevice);

  useEffect(() => {
    onSelectRef.current = onSelectDevice;
  }, [onSelectDevice]);

  // GSAP Smooth 3D Camera Flight when selectedDeviceId changes
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dur = prefersReducedMotion ? 0 : 0.85;

    if (selectedDeviceId === 'all_banner') {
      gsap.to(camTargetRef.current, { x: 0, y: 1.55, z: 6.15, duration: dur, ease: 'power3.out' });
      gsap.to(lookTargetRef.current, { x: 0, y: 1.05, z: 0, duration: dur, ease: 'power3.out' });
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
    const height = Math.max(340, container.clientHeight);

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
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.55, 6.15);
    camera.lookAt(0, 1.05, 0);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // Studio Grid & Glowing Emerald Horizon Ring
    const grid = new THREE.GridHelper(14, 28, 0xd6f65a, 0x064e3b);
    grid.position.y = -0.15;
    stageGroup.add(grid);

    const ringGeo = new THREE.RingGeometry(3.8, 3.88, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd6f65a,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.position.y = -0.14;
    stageGroup.add(floorRing);

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
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      mesh.rotation.y = spec.rotY;
      mesh.userData = { deviceId: spec.id, baseY: spec.pos[1] };
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
      pointerOffset.x = nx * 0.22;
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
          onSelectRef.current(hitId);
        }
      }
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onClick);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(340, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const timer = new THREE.Timer();
    timer.connect(document);

    const lookVec = new THREE.Vector3();

    const animate = () => {
      timer.update();
      const elapsed = timer.getElapsed();

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

      if (!prefersReducedMotion) {
        deviceMeshes.forEach((m, i) => {
          const baseY = m.userData.baseY as number;
          m.position.y = baseY + Math.sin(elapsed * 1.6 + i * 0.7) * 0.035;
        });
      }

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
    <div className="relative w-full">
      <div
        ref={mountRef}
        className="w-full h-[380px] sm:h-[440px] cursor-pointer"
        title="Bấm trực tiếp vào bất kỳ thiết bị 3D nào để bay camera tới thiết bị đó"
      />
      <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-slate-950/85 border border-ecomiles-lime/35 text-[11px] font-bold text-ecomiles-lime whitespace-nowrap shadow-md">
        Sân Khấu 3D WebGL (Three.js + GSAP Camera Flight) · Bấm vào bất kỳ thiết bị nào để bay camera tới
      </div>
    </div>
  );
};
