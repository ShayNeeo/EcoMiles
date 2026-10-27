import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowUpRight, Laptop, Smartphone, SplitSquareVertical, Tablet, X } from 'lucide-react';

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
    name: 'MacBook Pro 16" (macOS)',
    shortTag: 'MacBook Pro 16"',
    roleLabel: 'Vai trò 1 (User) · Điều phối B2B CRM/TMS (94/120 đơn · -34.9% km)',
    imgSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
    liveText: 'Mở Trung Tâm B2B (/dashboard)',
    plane: 'rear',
  },
  {
    id: 'windows_xps',
    name: 'Dell XPS 16 (Windows 11)',
    shortTag: 'Windows 11 XPS 16',
    roleLabel: 'Vai trò 2 (Tester) · Đối chứng 2 bên EVSIM (374.4 km vs 243.7 km)',
    imgSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveHref: '/benchmark/',
    liveText: 'Mở Phòng Đối Chứng (/benchmark)',
    plane: 'rear',
  },
  {
    id: 'galaxy_zfold',
    name: 'Samsung Galaxy Z Fold (768x1024)',
    shortTag: 'Galaxy Z Fold',
    roleLabel: 'Bản đồ Xe tải Mở (/maps) · Né vùng cấm QĐ 23/2018 & Cầu 13T',
    imgSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
    liveText: 'Mở Bản Đồ Xe Tải (/maps)',
    plane: 'mid',
  },
  {
    id: 'iphone_18_pro_max',
    name: 'iPhone 18 Pro Max (Titanium)',
    shortTag: 'iPhone 18 Pro Max',
    roleLabel: 'Vai trò 3 (Driver) · Chặng Giữa (>500kg) & Ghép đơn chiều về',
    imgSrc: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
    liveText: 'Mở App Tài Xế (/driver)',
    plane: 'front',
  },
  {
    id: 'iphone_duo',
    name: 'iPhone Duo (Gập Đôi 2 Màn Hình)',
    shortTag: 'iPhone Duo (Gập Đôi)',
    roleLabel: 'Đa nhiệm Tài xế · Trái: 13 điểm giao (/driver) · Phải: Dẫn đường (/maps)',
    imgSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
    liveText: 'Trải Nghiệm Đa Nhiệm (/driver)',
    plane: 'front',
  },
  {
    id: 'galaxy_s26_ultra',
    name: 'Samsung Galaxy S26 Ultra',
    shortTag: 'Galaxy S26 Ultra',
    roleLabel: 'Vai trò 3 (Driver) · Chặng Cuối (<=500kg) Khóa Waypoints Google Maps ($0)',
    imgSrc: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/driver/',
    liveText: 'Thử Google Maps Waypoints (/driver)',
    plane: 'front',
  },
  {
    id: 'ipad_pro',
    name: 'iPad Pro M4 (Tablet Kho Vận)',
    shortTag: 'iPad Pro M4',
    roleLabel: 'Bảng Điều Khiển Cảm Ứng · Tối ưu thao tác 1 chạm tại kho Tân Bình',
    imgSrc: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
    liveText: 'Mở Giao Diện Tablet (/dashboard)',
    plane: 'mid',
  },
];

export const HeroMultiDeviceStage: React.FC = () => {
  const [hoveredDevice, setHoveredDevice] = useState<HeroDeviceSpec>(HERO_DEVICES[4]);
  const [inspectedDevice, setInspectedDevice] = useState<HeroDeviceSpec | null>(null);
  const [isPointerInside, setIsPointerInside] = useState<boolean>(false);

  // Auto-Cycling 7-Device Spotlight Tour (pauses on pointer hover, inspect modal, or reduced motion)
  useEffect(() => {
    if (isPointerInside || inspectedDevice) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setHoveredDevice((prev) => {
        const idx = HERO_DEVICES.findIndex((d) => d.id === prev.id);
        return HERO_DEVICES[(idx + 1) % HERO_DEVICES.length];
      });
    }, 2800);
    return () => window.clearInterval(interval);
  }, [isPointerInside, inspectedDevice]);
  // 3-Plane Differential Parallax + Overlapping Occlusion (scroll-craft standing hero requirement)
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 200, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 200, damping: 24 });

  // Plane 1 (Rear Office Laptops): subtle ±6px movement
  const rearX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const rearY = useTransform(smoothY, [-0.5, 0.5], [-4, 4]);

  // Plane 2 (Mid Foldable/Tablet Wings): medium ±14px movement
  const midX = useTransform(smoothX, [-0.5, 0.5], [-14, 14]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);

  // Plane 3 (Foreground Field Phones): strong ±22px movement
  const frontX = useTransform(smoothX, [-0.5, 0.5], [-22, 22]);
  const frontY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);
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
    HERO_DEVICES[2], // Galaxy Z Fold
    HERO_DEVICES[3], // iPhone 18 Pro Max
    HERO_DEVICES[4], // iPhone Duo
    HERO_DEVICES[5], // Galaxy S26 Ultra
    HERO_DEVICES[6], // iPad Pro M4
  ];

  const renderDeviceIcon = (id: string) => {
    if (id === 'macbook_pro' || id === 'windows_xps') return <Laptop className="w-3 h-3" />;
    if (id === 'galaxy_zfold' || id === 'ipad_pro') return <Tablet className="w-3 h-3" />;
    if (id === 'iphone_duo') return <SplitSquareVertical className="w-3 h-3" />;
    return <Smartphone className="w-3 h-3" />;
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative rounded-3xl border border-ecomiles-lime/35 bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.46)_0%,rgba(4,9,18,0.97)_78%)] p-3 sm:p-4 shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden"
    >
      {/* Perspective Studio Grid Horizon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent_0%,rgba(214,246,90,0.09)_100%)] border-t border-ecomiles-lime/20"
      />

      {/* Animated SVG Data-Sync Bezier Network connecting Rear Office Laptops to Foreground Field Devices */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 320"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-15"
      >
        {[
          { from: 'macbook_pro', to: 'galaxy_zfold', d: 'M 185 85 C 120 120, 85 180, 70 235' },
          { from: 'macbook_pro', to: 'iphone_18_pro_max', d: 'M 185 85 C 185 135, 185 190, 185 240' },
          { from: 'macbook_pro', to: 'iphone_duo', d: 'M 185 85 C 235 130, 275 185, 300 235' },
          { from: 'windows_xps', to: 'iphone_duo', d: 'M 415 85 C 365 130, 325 185, 300 235' },
          { from: 'windows_xps', to: 'galaxy_s26_ultra', d: 'M 415 85 C 415 135, 415 190, 415 240' },
          { from: 'windows_xps', to: 'ipad_pro', d: 'M 415 85 C 480 120, 515 180, 530 235' },
        ].map((arc, idx) => {
          const isActive = hoveredDevice.id === arc.from || hoveredDevice.id === arc.to;
          return (
            <path
              key={idx}
              d={arc.d}
              fill="none"
              stroke={isActive ? '#d6f65a' : '#34d399'}
              strokeWidth={isActive ? 2.2 : 1.15}
              strokeOpacity={isActive ? 0.92 : 0.28}
              strokeDasharray="6 6"
            />
          );
        })}
      </svg>

      {/* 3-Plane Layered Hardware V-Formation with True Depth Occlusion (-mt-8 sm:-mt-11) */}
      <div className="relative z-10">
        {/* Plane 1 (Rear Office Plane, z-10): MacBook Pro 16" + Windows 11 XPS 16 */}
        <motion.div
          style={{ x: rearX, y: rearY }}
          className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 items-end px-3 sm:px-5"
        >
          {rearDevices.map((dev) => (
            <motion.button
              key={dev.id}
              type="button"
              onMouseEnter={() => setHoveredDevice(dev)}
              onClick={() => setInspectedDevice(dev)}
              animate={{
                y: hoveredDevice.id === dev.id ? -6 : 0,
                scale: hoveredDevice.id === dev.id ? 1.03 : 1,
              }}
              whileHover={{ y: -8, scale: 1.04, zIndex: 35 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              className="group relative text-center cursor-pointer focus:outline-none"
            >
              <div
                className={`mb-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9.5px] font-bold transition-colors shadow-md ${
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
                className="w-full h-auto max-h-[168px] sm:max-h-[188px] object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Plane 2 (Mid Wings, z-20) & Plane 3 (Foreground Trio, z-30) Occluding Lower 22% of Laptops */}
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
                  onClick={() => setInspectedDevice(dev)}
                  animate={{
                    y: hoveredDevice.id === dev.id ? -7 : 0,
                    scale: hoveredDevice.id === dev.id ? 1.045 : 1,
                  }}
                  whileHover={{ y: -10, scale: 1.07, zIndex: 40 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                  className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                >
                  <img
                    src={dev.imgSrc}
                    alt={dev.name}
                    className="h-[112px] sm:h-[146px] w-auto object-contain mx-auto drop-shadow-[0_20px_34px_rgba(0,0,0,0.95)]"
                  />
                  <span
                    className={`mt-1 inline-block px-2 py-0.5 rounded text-[9px] sm:text-[9.5px] font-bold whitespace-nowrap transition-colors shadow-sm ${
                      hoveredDevice.id === dev.id
                        ? 'bg-ecomiles-lime text-slate-950'
                        : 'bg-slate-950/90 text-slate-300 border border-white/10 group-hover:text-ecomiles-lime'
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

      {/* Live Hovered Device Telemetry Bar */}
      <div className="relative z-30 mt-2.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded bg-ecomiles-lime text-slate-950 font-extrabold shrink-0">
            {hoveredDevice.shortTag}
          </span>
          <span className="text-slate-200 font-medium truncate">{hoveredDevice.roleLabel}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setInspectedDevice(hoveredDevice)}
            className="font-bold text-ecomiles-lime hover:underline cursor-pointer"
          >
            Phóng to màn hình
          </button>
          <a
            href={hoveredDevice.liveHref}
            className="font-extrabold text-white hover:text-ecomiles-lime flex items-center gap-1"
          >
            <span>{hoveredDevice.liveText}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-ecomiles-lime" />
          </a>
        </div>
      </div>

      {/* Quick-Inspect Lightbox Overlay inside Hero */}
      <AnimatePresence>
        {inspectedDevice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-xl p-4 flex flex-col justify-between rounded-3xl border border-ecomiles-lime/50"
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div>
                <div className="text-xs font-extrabold text-ecomiles-lime">{inspectedDevice.name}</div>
                <div className="text-[11px] text-slate-300">{inspectedDevice.roleLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="#showcase"
                  onClick={(e) => {
                    e.preventDefault();
                    const targetId = inspectedDevice.id;
                    setInspectedDevice(null);
                    window.dispatchEvent(new CustomEvent('ecomiles:select-device', { detail: { deviceId: targetId } }));
                    document.querySelector('#showcase')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-ecomiles-lime border border-ecomiles-lime/40 font-bold text-xs"
                >
                  Mở trên #showcase
                </a>
                <a
                  href={inspectedDevice.liveHref}
                  className="px-3 py-1.5 rounded-lg bg-ecomiles-lime text-slate-950 font-extrabold text-xs flex items-center gap-1"
                >
                  <span>{inspectedDevice.liveText}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setInspectedDevice(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                  aria-label="Đóng phóng to"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-hidden py-2">
              <img
                src={inspectedDevice.imgSrc}
                alt={inspectedDevice.name}
                className="max-h-[290px] w-auto max-w-full object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.85)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
