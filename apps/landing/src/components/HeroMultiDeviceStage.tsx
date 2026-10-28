import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Laptop,
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
  // Default: null -> 100% of the moving container truck background video is unobstructed on page load!
  const [activeDevice, setActiveDevice] = useState<HeroDeviceSpec | null>(null);
  const [pinnedDeviceId, setPinnedDeviceId] = useState<string | null>(null);
  const [fullscreenDevice, setFullscreenDevice] = useState<HeroDeviceSpec | null>(null);
  const dismissTimerRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const clearDismissTimer = () => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const handleDockMouseEnter = (dev: HeroDeviceSpec) => {
    clearDismissTimer();
    setActiveDevice(dev);
  };

  const handleWrapperMouseLeave = () => {
    clearDismissTimer();
    if (!pinnedDeviceId) {
      dismissTimerRef.current = window.setTimeout(() => {
        setActiveDevice(null);
      }, 150);
    }
  };

  const stepActiveDevice = (delta: -1 | 1) => {
    const current = activeDevice ?? HERO_DEVICES[0];
    const currentIdx = HERO_DEVICES.findIndex((d) => d.id === current.id);
    const nextDev = HERO_DEVICES[(currentIdx + delta + HERO_DEVICES.length) % HERO_DEVICES.length];
    setActiveDevice(nextDev);
    setPinnedDeviceId(nextDev.id);
  };

  useEffect(() => {
    return () => clearDismissTimer();
  }, []);

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

  const tiltRotateX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);
  const tiltRotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    pointerX.set(nx);
    pointerY.set(ny);
  };

  const handlePointerLeave = () => {
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
      onMouseEnter={clearDismissTimer}
      onMouseLeave={handleWrapperMouseLeave}
      className="relative flex flex-col items-end justify-end w-full max-w-[620px] ml-auto"
    >
      {/* On-Demand Floating 3D Glass Preview Card (Only Appears When Hovering/Clicking a Device Pill!) */}
      <AnimatePresence mode="wait">
        {activeDevice && (
          <motion.div
            key={activeDevice.id}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
              rotateX: shouldReduceMotion ? 0 : tiltRotateX,
              rotateY: shouldReduceMotion ? 0 : tiltRotateY,
              transformPerspective: 1100,
            }}
            className="mb-3 w-full sm:w-[460px] rounded-2xl bg-slate-950/80 backdrop-blur-2xl border border-ecomiles-lime/40 p-3.5 shadow-2xl shadow-black/80"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-ecomiles-lime truncate">
                  {activeDevice.name}
                </div>
                <div className="text-xs text-slate-200 truncate">{activeDevice.roleLabel}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFullscreenDevice(activeDevice)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-ecomiles-lime border border-ecomiles-lime/40 text-xs font-bold cursor-pointer"
                  title="Phóng to màn hình thiết bị"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Phóng to</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinnedDeviceId(null);
                    setActiveDevice(null);
                  }}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                  aria-label="Ẩn xem trước thiết bị"
                  title="Ẩn xem trước để ngắm toàn cảnh video"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              onClick={() => setFullscreenDevice(activeDevice)}
              className="py-3 flex items-center justify-center cursor-zoom-in"
            >
              <img
                src={activeDevice.imgSrc}
                alt={activeDevice.name}
                className="max-h-[180px] sm:max-h-[200px] w-auto max-w-full object-contain mx-auto drop-shadow-[0_18px_36px_rgba(0,0,0,0.9)]"
              />
            </div>

            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepActiveDevice(-1)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
                  aria-label="Thiết bị trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => stepActiveDevice(1)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 cursor-pointer"
                  aria-label="Thiết bị tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <a
                href={activeDevice.liveHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold transition-colors"
              >
                <span>{activeDevice.liveText}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low-Profile Translucent Floating 7-Device Glass Dock (Leaves Container Truck 100% Unobstructed!) */}
      <div className="relative z-30 w-full rounded-2xl bg-slate-950/65 backdrop-blur-xl border border-white/15 p-3 shadow-2xl shadow-black/75 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">Đồng bộ trên 7 thiết bị</span>
            <span className="text-slate-300 hidden sm:inline">· Di chuột hoặc chạm để xem nhanh</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setFullscreenDevice(STUDIO_STAGE_SPEC)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ecomiles-lime text-slate-950 hover:bg-yellow-300 font-extrabold text-xs cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Toàn cảnh 7 thiết bị</span>
            </button>
            <button
              type="button"
              onClick={() => {
                document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/15 font-bold text-xs cursor-pointer transition-colors"
            >
              <span>Khu trưng bày</span>
              <ArrowDown className="w-3.5 h-3.5 text-ecomiles-lime" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
          {HERO_DEVICES.map((dev) => {
            const isSelected = activeDevice?.id === dev.id;
            return (
              <button
                key={dev.id}
                type="button"
                onMouseEnter={() => handleDockMouseEnter(dev)}
                onFocus={() => handleDockMouseEnter(dev)}
                onClick={() => {
                  if (pinnedDeviceId === dev.id && activeDevice?.id === dev.id) {
                    setPinnedDeviceId(null);
                    setActiveDevice(null);
                  } else {
                    setPinnedDeviceId(dev.id);
                    setActiveDevice(dev);
                  }
                }}
                className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-slate-950 font-extrabold'
                    : 'bg-slate-900/75 text-slate-200 hover:text-white border border-white/10'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="heroDockActivePill"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-ecomiles-lime shadow-sm"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {renderDeviceIcon(dev.id)}
                  <span>{dev.shortTag}</span>
                </span>
              </button>
            );
          })}
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
