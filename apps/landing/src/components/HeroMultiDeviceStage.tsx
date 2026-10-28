import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Pause,
  Play,
  Smartphone,
  SplitSquareVertical,
  Tablet,
  X,
  ZoomIn,
} from 'lucide-react';
import { STUDIO_STAGE_SPATIAL_HOTSPOTS } from '../utils/studioStageHotspots';

interface HeroDeviceSpec {
  id: string;
  name: string;
  shortTag: string;
  roleLabel: string;
  imgSrc: string;
  liveHref: string;
  liveText: string;
  plane: 'rear' | 'mid' | 'front';
}

const HERO_DEVICES: HeroDeviceSpec[] = [
  {
    id: 'macbook_pro',
    name: 'MacBook Pro 16" · Trung Tâm B2B TMS',
    shortTag: 'MacBook Pro',
    roleLabel: 'Điều phối 120 đơn / 7 tuyến (-34.9% km)',
    imgSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
    liveText: 'Mở /dashboard',
    plane: 'rear',
  },
  {
    id: 'windows_xps',
    name: 'Windows 11 XPS 16 · Đối Chứng EVSIM',
    shortTag: 'Windows XPS',
    roleLabel: 'So sánh song song 374.4 km vs 243.7 km',
    imgSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveHref: '/benchmark/',
    liveText: 'Mở /benchmark',
    plane: 'rear',
  },
  {
    id: 'galaxy_zfold',
    name: 'Samsung Galaxy Z Fold · Bản Đồ Xe Tải',
    shortTag: 'Galaxy Z Fold',
    roleLabel: 'Né vùng cấm QĐ 23/2018 & cầu 13T ($0 API)',
    imgSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
    liveText: 'Mở /maps',
    plane: 'mid',
  },
  {
    id: 'iphone_18_pro_max',
    name: 'iPhone 18 Pro Max · App Tài Xế Chặng Giữa',
    shortTag: 'iPhone 18 Pro',
    roleLabel: 'Giao hàng xe tải (>500kg) & ghép đơn về',
    imgSrc: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
    liveText: 'Mở /driver',
    plane: 'front',
  },
  {
    id: 'iphone_duo',
    name: 'iPhone Duo (Gập Đôi) · Đa Nhiệm 2 Màn Hình',
    shortTag: 'iPhone Duo',
    roleLabel: 'Trái: Đơn hàng (/driver) · Phải: Bản đồ (/maps)',
    imgSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
    liveText: 'Mở /driver',
    plane: 'front',
  },
  {
    id: 'galaxy_s26_ultra',
    name: 'Samsung Galaxy S26 Ultra · Chặng Cuối',
    shortTag: 'Galaxy S26',
    roleLabel: 'Khóa tọa độ Waypoints Google Maps ($0 API)',
    imgSrc: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/driver/',
    liveText: 'Mở /driver',
    plane: 'front',
  },
  {
    id: 'ipad_pro',
    name: 'iPad Pro M4 · Bảng Điều Khiển Kho Bãi',
    shortTag: 'iPad Pro M4',
    roleLabel: 'Quản lý cảm ứng bến xuất & hàng chiều về',
    imgSrc: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
    liveText: 'Mở /dashboard',
    plane: 'mid',
  },
];

const STUDIO_STAGE_SPEC: HeroDeviceSpec = {
  id: 'studio_stage',
  name: 'Toàn Cảnh Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực',
  shortTag: 'Toàn Cảnh 7 Thiết Bị',
  roleLabel: 'Đồng bộ từ văn phòng điều phối đến kho bãi và tài xế ngoài thực địa (<50ms)',
  imgSrc: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
  liveHref: '/dashboard/',
  liveText: 'Mở Trung Tâm B2B (/dashboard)',
  plane: 'front',
};

const HERO_LIGHTBOX_ASSETS: HeroDeviceSpec[] = [STUDIO_STAGE_SPEC, ...HERO_DEVICES];

export const HeroMultiDeviceStage: React.FC = () => {
  const [hoveredDevice, setHoveredDevice] = useState<HeroDeviceSpec>(HERO_DEVICES[4]); // iPhone Duo default
  const [fullscreenDevice, setFullscreenDevice] = useState<HeroDeviceSpec | null>(null);
  const [isPointerInside, setIsPointerInside] = useState<boolean>(false);
  const [isAutoSpotlight, setIsAutoSpotlight] = useState<boolean>(true);
  const shouldReduceMotion = useReducedMotion();

  const stepHeroDevice = (delta: -1 | 1) => {
    setIsAutoSpotlight(false);
    const currentIdx = HERO_DEVICES.findIndex((d) => d.id === hoveredDevice.id);
    const nextIdx = (currentIdx + delta + HERO_DEVICES.length) % HERO_DEVICES.length;
    setHoveredDevice(HERO_DEVICES[nextIdx]);
  };

  useEffect(() => {
    if (!isAutoSpotlight || isPointerInside || fullscreenDevice || shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setHoveredDevice((prev) => {
        const idx = HERO_DEVICES.findIndex((d) => d.id === prev.id);
        return HERO_DEVICES[(idx + 1) % HERO_DEVICES.length];
      });
    }, 3400);
    return () => window.clearInterval(timer);
  }, [isAutoSpotlight, isPointerInside, fullscreenDevice, shouldReduceMotion]);

  useEffect(() => {
    if (!fullscreenDevice) return undefined;
    const total = HERO_LIGHTBOX_ASSETS.length;
    const activeIdx = Math.max(
      0,
      HERO_LIGHTBOX_ASSETS.findIndex((d) => d.id === fullscreenDevice.id)
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenDevice(null);
      } else if (e.key === 'ArrowLeft') {
        setFullscreenDevice(HERO_LIGHTBOX_ASSETS[(activeIdx - 1 + total) % total]);
      } else if (e.key === 'ArrowRight') {
        setFullscreenDevice(HERO_LIGHTBOX_ASSETS[(activeIdx + 1) % total]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreenDevice]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 200, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 200, damping: 24 });

  const rearX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const rearY = useTransform(smoothY, [-0.5, 0.5], [-4, 4]);
  const midX = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);
  const frontX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const frontY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerInside(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    pointerX.set(nx);
    pointerY.set(ny);
  };

  const handlePointerLeave = () => {
    setIsPointerInside(false);
    pointerX.set(0);
    pointerY.set(0);
  };

  const rearDevices = HERO_DEVICES.filter((d) => d.plane === 'rear');
  const bottomRowDevices = [
    HERO_DEVICES[2],
    HERO_DEVICES[3],
    HERO_DEVICES[4],
    HERO_DEVICES[5],
    HERO_DEVICES[6],
  ];

  const renderDeviceIcon = (id: string) => {
    if (id === 'macbook_pro' || id === 'windows_xps') return <Laptop className="w-3.5 h-3.5" />;
    if (id === 'galaxy_zfold' || id === 'ipad_pro') return <Tablet className="w-3.5 h-3.5" />;
    if (id === 'iphone_duo') return <SplitSquareVertical className="w-3.5 h-3.5" />;
    return <Smartphone className="w-3.5 h-3.5" />;
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative rounded-3xl border border-white/15 bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.42)_0%,rgba(4,9,18,0.96)_78%)] p-3.5 sm:p-5 shadow-2xl shadow-black/80 overflow-hidden"
    >
      {/* Top Stage Header Bar */}
      <div className="relative z-30 mb-3 pb-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">Hệ sinh thái 7 thiết bị đồng bộ</span>
          <button
            type="button"
            onClick={() => setIsAutoSpotlight((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
              isAutoSpotlight
                ? 'bg-ecomiles-lime/15 border-ecomiles-lime/50 text-ecomiles-lime'
                : 'bg-slate-900/80 border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            {isAutoSpotlight ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isAutoSpotlight ? 'Đang tự xoay' : 'Tự động xoay'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFullscreenDevice(STUDIO_STAGE_SPEC)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ecomiles-lime text-slate-950 hover:bg-yellow-300 font-extrabold text-xs cursor-pointer transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span>Phóng to toàn cảnh</span>
        </button>
      </div>

      {/* Animated SVG Data-Sync Bezier Network */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 320"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-15"
      >
        {[
          { from: 'macbook_pro', to: 'galaxy_zfold', sx: 185, sy: 95, ex: 70, ey: 245, d: 'M 185 95 C 120 130, 85 190, 70 245' },
          { from: 'macbook_pro', to: 'iphone_18_pro_max', sx: 185, sy: 95, ex: 185, ey: 250, d: 'M 185 95 C 185 145, 185 200, 185 250' },
          { from: 'macbook_pro', to: 'iphone_duo', sx: 185, sy: 95, ex: 300, ey: 245, d: 'M 185 95 C 235 140, 275 195, 300 245' },
          { from: 'windows_xps', to: 'iphone_duo', sx: 415, sy: 95, ex: 300, ey: 245, d: 'M 415 95 C 365 140, 325 195, 300 245' },
          { from: 'windows_xps', to: 'galaxy_s26_ultra', sx: 415, sy: 95, ex: 415, ey: 250, d: 'M 415 95 C 415 145, 415 200, 415 250' },
          { from: 'windows_xps', to: 'ipad_pro', sx: 415, sy: 95, ex: 530, ey: 245, d: 'M 415 95 C 480 130, 515 190, 530 245' },
        ].map((arc, idx) => {
          const isActive = hoveredDevice.id === arc.from || hoveredDevice.id === arc.to;
          return (
            <g key={idx}>
              <path
                d={arc.d}
                fill="none"
                stroke={isActive ? '#d6f65a' : '#34d399'}
                strokeWidth={isActive ? 2.2 : 1.15}
                strokeOpacity={isActive ? 0.9 : 0.25}
                strokeDasharray="6 6"
              />
              {!shouldReduceMotion && (
                <circle r={isActive ? 3.2 : 2} fill="#d6f65a" fillOpacity={isActive ? 1 : 0.7}>
                  <animateMotion dur="2.2s" begin={`${idx * 0.32}s`} repeatCount="indefinite" path={arc.d} />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* 3-Plane Layered Hardware V-Formation */}
      <div className="relative z-10">
        {/* Rear Office Plane: MacBook Pro 16" + Windows 11 XPS 16 */}
        <motion.div
          style={{ x: rearX, y: rearY }}
          className="relative z-10 grid grid-cols-2 gap-3 items-end px-2 sm:px-4"
        >
          {rearDevices.map((dev) => (
            <motion.button
              key={dev.id}
              type="button"
              onMouseEnter={() => setHoveredDevice(dev)}
              onClick={() => setFullscreenDevice(dev)}
              animate={{
                y: hoveredDevice.id === dev.id ? -5 : 0,
                scale: hoveredDevice.id === dev.id ? 1.025 : 1,
              }}
              whileHover={{ y: -7, scale: 1.035, zIndex: 35 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="group relative text-center cursor-pointer focus:outline-none"
            >
              <div
                className={`mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold transition-colors shadow-md ${
                  hoveredDevice.id === dev.id
                    ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                    : 'bg-slate-950/90 border-white/15 text-slate-200 group-hover:border-ecomiles-lime group-hover:text-ecomiles-lime'
                }`}
              >
                {renderDeviceIcon(dev.id)}
                <span>{dev.shortTag}</span>
              </div>
              <img
                src={dev.imgSrc}
                alt={dev.name}
                className="w-full h-auto max-h-[164px] sm:max-h-[184px] object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Foreground Field & Tablet Plane */}
        <div className="relative z-20 -mt-7 sm:-mt-10 flex flex-wrap sm:flex-nowrap items-end justify-center gap-2 sm:gap-2.5">
          {bottomRowDevices.map((dev) => {
            const isFront = dev.plane === 'front';
            const isDuo = dev.id === 'iphone_duo';
            return (
              <motion.div
                key={dev.id}
                style={{
                  x: isFront ? frontX : midX,
                  y: isFront ? frontY : midY,
                }}
                className={isDuo ? 'relative z-30 shrink-0' : isFront ? 'relative z-25 shrink-0' : 'relative z-20 shrink-0'}
              >
                <motion.button
                  type="button"
                  onMouseEnter={() => setHoveredDevice(dev)}
                  onClick={() => setFullscreenDevice(dev)}
                  animate={{
                    y: hoveredDevice.id === dev.id ? -6 : 0,
                    scale: hoveredDevice.id === dev.id ? 1.04 : 1,
                  }}
                  whileHover={{ y: -9, scale: 1.06, zIndex: 40 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                >
                  <img
                    src={dev.imgSrc}
                    alt={dev.name}
                    className="h-[110px] sm:h-[144px] w-auto object-contain mx-auto drop-shadow-[0_20px_34px_rgba(0,0,0,0.95)]"
                  />
                  <span
                    className={`mt-1 inline-block px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${
                      hoveredDevice.id === dev.id
                        ? 'bg-ecomiles-lime text-slate-950'
                        : 'bg-slate-950/90 text-slate-200 border border-white/10 group-hover:text-ecomiles-lime'
                    }`}
                  >
                    {dev.shortTag}
                  </span>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Active Device Status Bar (Single Clean Row) */}
      <div className="relative z-30 mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="inline-flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => stepHeroDevice(-1)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
              title="Thiết bị trước"
              aria-label="Thiết bị trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => stepHeroDevice(1)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
              title="Thiết bị tiếp theo"
              aria-label="Thiết bị tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-ecomiles-lime truncate">{hoveredDevice.name}</div>
            <div className="text-slate-200 truncate">{hoveredDevice.roleLabel}</div>
          </div>
        </div>

        <a
          href={hoveredDevice.liveHref}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold shrink-0 transition-colors"
        >
          <span>{hoveredDevice.liveText}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Fullscreen Lightbox Portal with Interactive Spatial Hotspots */}
      {fullscreenDevice &&
        typeof document !== 'undefined' &&
        (() => {
          const total = HERO_LIGHTBOX_ASSETS.length;
          const activeIdx = Math.max(
            0,
            HERO_LIGHTBOX_ASSETS.findIndex((d) => d.id === fullscreenDevice.id)
          );
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={fullscreenDevice.name}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setFullscreenDevice(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                      [{activeIdx + 1}/{total}] {fullscreenDevice.name}
                    </div>
                    <div className="text-xs text-slate-300 truncate">{fullscreenDevice.roleLabel}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setFullscreenDevice(HERO_LIGHTBOX_ASSETS[(activeIdx - 1 + total) % total])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFullscreenDevice(HERO_LIGHTBOX_ASSETS[(activeIdx + 1) % total])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <span>Tiếp</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={fullscreenDevice.liveHref}
                      className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1"
                    >
                      <span>{fullscreenDevice.liveText}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setFullscreenDevice(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                      aria-label="Đóng toàn màn hình"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Đóng</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <div className="relative inline-block">
                    <motion.img
                      key={fullscreenDevice.imgSrc}
                      src={fullscreenDevice.imgSrc}
                      alt={fullscreenDevice.name}
                      initial={{ opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                    />
                    {fullscreenDevice.id === 'studio_stage' && (
                      <div className="absolute inset-0 pointer-events-none">
                        {STUDIO_STAGE_SPATIAL_HOTSPOTS.map((spot) => {
                          const matched = HERO_LIGHTBOX_ASSETS.find((a) => a.id === spot.id);
                          if (!matched) return null;
                          return (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => setFullscreenDevice(matched)}
                              style={{
                                left: `${spot.leftPct}%`,
                                top: `${spot.topPct}%`,
                                width: `${spot.widthPct}%`,
                                height: `${spot.heightPct}%`,
                              }}
                              title={`Nhấn để xem chi tiết: ${spot.label} (${spot.roleHint})`}
                              aria-label={`Xem chi tiết ${spot.label}`}
                              className={`pointer-events-auto absolute ${spot.zIndexClass} group rounded-xl border-2 border-transparent hover:border-ecomiles-lime/85 hover:bg-ecomiles-lime/10 transition-all cursor-zoom-in flex items-end justify-center p-1.5`}
                            >
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/95 border border-ecomiles-lime/60 text-xs font-extrabold text-ecomiles-lime shadow-lg whitespace-nowrap">
                                <ZoomIn className="w-3 h-3 shrink-0" />
                                <span>{spot.label}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {HERO_LIGHTBOX_ASSETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFullscreenDevice(item)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        item.id === fullscreenDevice.id
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {item.shortTag}
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
