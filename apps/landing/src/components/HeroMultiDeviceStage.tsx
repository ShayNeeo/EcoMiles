import React, { useState } from 'react';
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
  const [hoveredDevice, setHoveredDevice] = useState<HeroDeviceSpec>(HERO_DEVICES[4]); // Default highlight: iPhone Duo
  const [inspectedDevice, setInspectedDevice] = useState<HeroDeviceSpec | null>(null);

  // 3-Plane Differential Parallax (scroll-craft standing hero requirement)
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 200, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 200, damping: 24 });

  // Plane 1 (Rear Office Laptops): subtle ±6px movement
  const rearX = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const rearY = useTransform(smoothY, [-0.5, 0.5], [-4, 4]);

  // Plane 2 (Mid Foldable/Tablet Wings): medium ±13px movement
  const midX = useTransform(smoothX, [-0.5, 0.5], [-13, 13]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);

  // Plane 3 (Foreground Field Phones): strong ±20px movement
  const frontX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const frontY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);

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
      className="relative rounded-3xl border border-ecomiles-lime/35 bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.42)_0%,rgba(4,9,18,0.96)_78%)] p-3 sm:p-4 shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden"
    >
      {/* Perspective Studio Grid Horizon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent_0%,rgba(214,246,90,0.08)_100%)] border-t border-ecomiles-lime/20"
      />

      {/* 3-Plane Layered Hardware Formation */}
      <div className="relative z-10 space-y-2.5">
        {/* Plane 1 (Rear Office Plane): MacBook Pro 16" + Windows 11 XPS 16 */}
        <motion.div style={{ x: rearX, y: rearY }} className="grid grid-cols-2 gap-2.5 sm:gap-3 items-end px-2">
          {rearDevices.map((dev) => (
            <motion.button
              key={dev.id}
              type="button"
              onMouseEnter={() => setHoveredDevice(dev)}
              onClick={() => setInspectedDevice(dev)}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="group text-center cursor-pointer focus:outline-none"
            >
              <div className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/90 border border-white/15 group-hover:border-ecomiles-lime text-[9.5px] font-bold text-slate-200 group-hover:text-ecomiles-lime transition-colors">
                {renderDeviceIcon(dev.id)}
                <span>{dev.shortTag}</span>
              </div>
              <img
                src={dev.imgSrc}
                alt={dev.name}
                className="w-full h-auto max-h-[145px] sm:max-h-[160px] object-contain mx-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
              />
            </motion.button>
          ))}
        </motion.div>

        {/* Plane 2 (Mid Wings) & Plane 3 (Foreground Trio): Z Fold · 18 Pro Max · iPhone Duo · S26 Ultra · iPad Pro */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 items-end pt-1">
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
                className={isDuo ? 'col-span-1 z-20' : 'col-span-1 z-10'}
              >
                <motion.button
                  type="button"
                  onMouseEnter={() => setHoveredDevice(dev)}
                  onClick={() => setInspectedDevice(dev)}
                  whileHover={{ y: -8, scale: 1.07 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className="group w-full text-center cursor-pointer focus:outline-none"
                >
                  <img
                    src={dev.imgSrc}
                    alt={dev.name}
                    className={`w-full h-auto ${
                      isDuo ? 'max-h-[148px] sm:max-h-[165px]' : 'max-h-[138px] sm:max-h-[155px]'
                    } object-contain mx-auto drop-shadow-[0_16px_28px_rgba(0,0,0,0.9)]`}
                  />
                  <span
                    className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9.5px] font-bold truncate max-w-full transition-colors ${
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
      <div className="relative z-20 mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
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
