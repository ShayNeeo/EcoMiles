import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Laptop,
  Layers,
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
    name: 'MacBook Pro 16" · Trung Tâm Điều Phối Đội Xe',
    shortTag: 'MacBook Pro',
    roleLabel: 'Điều phối 120 đơn / 7 tuyến (-34.9% quãng đường)',
    imgSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
    liveText: 'Mở Bảng Điều Khiển',
    plane: 'rear',
  },
  {
    id: 'windows_xps',
    name: 'Windows 11 XPS 16 · Phòng Đối Chứng EVSIM',
    shortTag: 'Windows XPS',
    roleLabel: 'So sánh song song 374.4 km thủ công vs 243.7 km EcoMiles',
    imgSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveHref: '/benchmark/',
    liveText: 'Mở Phòng Đối Chứng',
    plane: 'rear',
  },
  {
    id: 'galaxy_zfold',
    name: 'Samsung Galaxy Z Fold · Bản Đồ Xe Tải Mở',
    shortTag: 'Galaxy Z Fold',
    roleLabel: 'Né vùng cấm QĐ 23/2018 & cầu 13T ($0 phí bản đồ)',
    imgSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
    liveText: 'Mở Bản Đồ Xe Tải',
    plane: 'mid',
  },
  {
    id: 'iphone_18_pro_max',
    name: 'iPhone 18 Pro Max · Ứng Dụng Tài Xế Chặng Giữa',
    shortTag: 'iPhone 18 Pro',
    roleLabel: 'Giao hàng xe tải (>500kg) & ghép đơn chiều về',
    imgSrc: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
    liveText: 'Mở Ứng Dụng Tài Xế',
    plane: 'front',
  },
  {
    id: 'iphone_duo',
    name: 'iPhone Duo (Gập Đôi) · Đa Nhiệm 2 Màn Hình',
    shortTag: 'iPhone Duo',
    roleLabel: 'Màn trái: Danh sách đơn hàng · Màn phải: Bản đồ dẫn đường',
    imgSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
    liveText: 'Mở Ứng Dụng Tài Xế',
    plane: 'front',
  },
  {
    id: 'galaxy_s26_ultra',
    name: 'Samsung Galaxy S26 Ultra · Dẫn Đường Chặng Cuối',
    shortTag: 'Galaxy S26',
    roleLabel: 'Khóa tọa độ nhiều điểm dừng trên Google Maps ($0 API)',
    imgSrc: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/driver/',
    liveText: 'Mở Ứng Dụng Tài Xế',
    plane: 'front',
  },
  {
    id: 'ipad_pro',
    name: 'iPad Pro M4 · Bảng Điều Khiển Kho Bãi',
    shortTag: 'iPad Pro M4',
    roleLabel: 'Quản lý cảm ứng bến xuất & thu hồi hàng chiều về',
    imgSrc: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
    liveText: 'Mở Bảng Điều Khiển',
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
  liveText: 'Mở Bảng Điều Khiển',
  plane: 'front',
};

const HERO_LIGHTBOX_ASSETS: HeroDeviceSpec[] = [STUDIO_STAGE_SPEC, ...HERO_DEVICES];

export const HeroMultiDeviceStage: React.FC = () => {
  const [hoveredDevice, setHoveredDevice] = useState<HeroDeviceSpec>(HERO_DEVICES[0]); // MacBook Pro default
  const [stageLayout, setStageLayout] = useState<'spotlight' | 'fan_all' | 'dock_only'>('spotlight');
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
    }, 3600);
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

  const tiltRotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const tiltRotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  const floatX = useTransform(smoothX, [-0.5, 0.5], [-12, 12]);
  const floatY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);

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
      className="relative flex flex-col items-center justify-end w-full"
    >
      {/* Open-Air Floating Stage (Zero Opaque Box — Container Moving Video Shines Directly Behind!) */}
      <AnimatePresence mode="wait">
        {stageLayout === 'spotlight' && (
          <motion.div
            key={`spotlight-${hoveredDevice.id}`}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              rotateX: shouldReduceMotion ? 0 : tiltRotateX,
              rotateY: shouldReduceMotion ? 0 : tiltRotateY,
              x: shouldReduceMotion ? 0 : floatX,
              y: shouldReduceMotion ? 0 : floatY,
              transformPerspective: 1100,
            }}
            className="relative z-10 mb-3 flex flex-col items-center justify-center cursor-zoom-in group"
            onClick={() => setFullscreenDevice(hoveredDevice)}
          >
            <img
              src={hoveredDevice.imgSrc}
              alt={hoveredDevice.name}
              className="h-auto max-h-[215px] sm:max-h-[250px] w-auto max-w-full object-contain mx-auto drop-shadow-[0_24px_48px_rgba(0,0,0,0.85)] group-hover:scale-[1.02] transition-transform duration-300"
            />
          </motion.div>
        )}

        {stageLayout === 'fan_all' && (
          <motion.div
            key="fan-all-open-air"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mb-3 w-full"
          >
            {/* Open-Air 2-Tier Fan without any background box */}
            <div className="grid grid-cols-2 gap-3 items-end px-4">
              {HERO_DEVICES.slice(0, 2).map((dev) => (
                <button
                  key={dev.id}
                  type="button"
                  onMouseEnter={() => setHoveredDevice(dev)}
                  onClick={() => setFullscreenDevice(dev)}
                  className="group text-center cursor-zoom-in focus:outline-none"
                >
                  <img
                    src={dev.imgSrc}
                    alt={dev.name}
                    className="w-full h-auto max-h-[135px] sm:max-h-[150px] object-contain mx-auto drop-shadow-[0_20px_36px_rgba(0,0,0,0.9)] group-hover:-translate-y-1 transition-transform"
                  />
                </button>
              ))}
            </div>
            <div className="relative z-20 -mt-6 flex items-end justify-center gap-2">
              {HERO_DEVICES.slice(2).map((dev) => (
                <button
                  key={dev.id}
                  type="button"
                  onMouseEnter={() => setHoveredDevice(dev)}
                  onClick={() => setFullscreenDevice(dev)}
                  className="group flex flex-col items-center cursor-zoom-in focus:outline-none shrink-0"
                >
                  <img
                    src={dev.imgSrc}
                    alt={dev.name}
                    className="h-[92px] sm:h-[115px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.92)] group-hover:-translate-y-1.5 transition-transform"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleek Translucent Floating Glass Dock (Lets Container Video Shine Around It) */}
      <div className="relative z-30 w-full rounded-2xl bg-slate-950/65 backdrop-blur-xl border border-white/15 p-3 shadow-2xl shadow-black/70 space-y-2.5">
        {/* Row 1: 7-Device Pill Switcher + View Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {HERO_DEVICES.map((dev) => {
              const isSelected = hoveredDevice.id === dev.id;
              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => {
                    setIsAutoSpotlight(false);
                    setHoveredDevice(dev);
                    if (stageLayout === 'dock_only') setStageLayout('spotlight');
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-ecomiles-lime text-slate-950 shadow-sm font-extrabold'
                      : 'bg-slate-900/75 text-slate-200 hover:text-white border border-white/10'
                  }`}
                >
                  {renderDeviceIcon(dev.id)}
                  <span>{dev.shortTag}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                setStageLayout((prev) => (prev === 'fan_all' ? 'spotlight' : 'fan_all'))
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                stageLayout === 'fan_all'
                  ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                  : 'bg-slate-900/80 border-white/15 text-slate-200 hover:text-white'
              }`}
              title="Chuyển đổi giữa xem 1 thiết bị và xem cả 7 thiết bị"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{stageLayout === 'fan_all' ? '1 Thiết bị' : 'Cả 7 máy'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setStageLayout((prev) => (prev === 'dock_only' ? 'spotlight' : 'dock_only'))
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Ẩn hoặc hiện hình thiết bị để ngắm toàn cảnh video nền"
            >
              {stageLayout === 'dock_only' ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-ecomiles-lime" />
                  <span>Hiện máy</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                  <span>Ngắm nền</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFullscreenDevice(STUDIO_STAGE_SPEC)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Phóng to toàn cảnh 7 thiết bị"
            >
              <ZoomIn className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>Phóng to</span>
            </button>
          </div>
        </div>

        {/* Row 2: Active Device Summary + Step Controls + Refined Live App Launch Button */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => stepHeroDevice(-1)}
                className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
                title="Thiết bị trước"
                aria-label="Thiết bị trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAutoSpotlight((prev) => !prev)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isAutoSpotlight
                    ? 'bg-ecomiles-lime/20 border-ecomiles-lime/50 text-ecomiles-lime'
                    : 'bg-slate-900/90 border-white/15 text-slate-300 hover:text-white'
                }`}
                title={isAutoSpotlight ? 'Tạm dừng tự động chuyển' : 'Bật tự động chuyển thiết bị'}
                aria-label="Tự động chuyển thiết bị"
              >
                {isAutoSpotlight ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => stepHeroDevice(1)}
                className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
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
