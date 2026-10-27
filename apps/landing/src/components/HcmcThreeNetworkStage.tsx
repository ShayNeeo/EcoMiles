import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ShieldCheck, Truck, Zap } from 'lucide-react';

interface HcmcNodeSpec {
  id: string;
  label: string;
  x: number;
  z: number;
  kind: 'depot' | 'hub' | 'ban';
}

const HCMC_3D_NODES: HcmcNodeSpec[] = [
  { id: 'depot', label: 'Kho Tân Bình (364 Cộng Hòa)', x: -1.9, z: -0.7, kind: 'depot' },
  { id: 'govap', label: 'Gò Vấp (18 đơn)', x: -0.8, z: -2.1, kind: 'hub' },
  { id: 'binhthanh', label: 'Bình Thạnh (Cầu 13T)', x: 0.9, z: -0.9, kind: 'hub' },
  { id: 'thuduc', label: 'TP. Thủ Đức (24 đơn)', x: 2.4, z: -1.4, kind: 'hub' },
  { id: 'quan7', label: 'Quận 7 · Nam Sài Gòn', x: 1.3, z: 1.9, kind: 'hub' },
  { id: 'binhtan', label: 'Bình Tân · Chợ Lớn', x: -2.3, z: 1.5, kind: 'hub' },
  { id: 'q1_ban', label: 'Lõi Cấm Tải QĐ 23 (06-09h & 16-20h)', x: -0.1, z: 0.35, kind: 'ban' },
];

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

  useEffect(() => {
    activeClusterRef.current = activeCluster;
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
    worldGroup.add(banDisk);

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

    HCMC_3D_NODES.forEach((n) => {
      if (n.kind === 'ban') return;
      const isDepot = n.kind === 'depot';
      const mat = new THREE.MeshStandardMaterial({
        color: isDepot ? 0xd6f65a : 0x10b981,
        emissive: isDepot ? 0xd6f65a : 0x059669,
        emissiveIntensity: isDepot ? 0.55 : 0.35,
        roughness: 0.25,
        metalness: 0.6,
      });
      const mesh = new THREE.Mesh(isDepot ? depotGeo : nodeGeo, mat);
      mesh.position.set(n.x, isDepot ? 0.2 : 0.13, n.z);
      worldGroup.add(mesh);
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
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      targetRot.y = nx * 0.45;
      targetRot.x = ny * 0.22;
    };
    container.addEventListener('pointermove', onPointerMove);

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
      window.removeEventListener('resize', onResize);
      gridHelper.dispose();
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

      <div
        ref={mountRef}
        className="w-full h-[270px] sm:h-[310px] cursor-grab active:cursor-grabbing"
        aria-label="Mô hình 3D mạng lưới giao nhận đô thị TP.HCM tránh vùng cấm tải QĐ 23/2018"
      />

      {/* 7-Device Corridor Telemetry Sync Strip */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 border-t border-white/10 bg-slate-900/90 text-[10px] text-slate-300">
        <span className="px-2 py-0.5 rounded bg-slate-950 border border-ecomiles-lime/30 text-ecomiles-lime font-bold">
          Kho Tân Bình: MacBook Pro 16&quot; · Windows XPS 16
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-400/30 text-emerald-300 font-bold">
          Hub Thủ Đức / Q7: Galaxy Z Fold · iPad Pro M4
        </span>
        <span className="px-2 py-0.5 rounded bg-slate-950 border border-sky-400/30 text-sky-300 font-bold">
          7 Xe ALNS: iPhone Duo · 18 Pro Max · S26 Ultra
        </span>
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
    </div>
  );
};
