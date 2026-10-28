import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Layers,
  Smartphone,
  SplitSquareVertical,
  Tablet,
  X,
  ZoomIn,
} from 'lucide-react';
import { STUDIO_STAGE_SPATIAL_HOTSPOTS } from '../utils/studioStageHotspots';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type DeviceViewId =
  | 'all_banner'
  | 'macbook_pro'
  | 'windows_xps'
  | 'galaxy_zfold'
  | 'ipad_pro'
  | 'iphone_duo'
  | 'iphone_18_pro_max'
  | 'galaxy_s26_ultra';

interface DeviceShowcaseSpec {
  id: DeviceViewId;
  shortLabel: string;
  deviceTitle: string;
  roleBadge: string;
  imageSrc: string;
  liveRouteUrl: string;
  liveRouteLabel: string;
  description: string;
  highlights: string[];
}

const FLAGSHIP_DEVICES: DeviceShowcaseSpec[] = [
  {
    id: 'all_banner',
    shortLabel: 'Toàn Cảnh 7 Thiết Bị',
    deviceTitle: 'Hệ Sinh Thái Đa Thiết Bị Đồng Bộ Thời Gian Thực (Desktop · Foldable · Tablet · Mobile)',
    roleBadge: 'SÂN KHẤU 7 THIẾT BỊ · BẤM VÀO THIẾT BỊ BẤT KỲ ĐỂ XEM CHI TIẾT',
    imageSrc: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Trung Tâm Điều Phối B2B (/dashboard)',
    description:
      'Một nền tảng duy nhất đồng bộ từ máy trạm điều phối tại văn phòng (MacBook Pro 16", Windows 11 XPS 16) đến máy tính bảng kho vận / buồng lái (Samsung Galaxy Z Fold, iPad Pro M4) và điện thoại tài xế ngoài thực địa (iPhone Duo, iPhone 18 Pro Max, Galaxy S26 Ultra).',
    highlights: [
      'Đồng bộ tức thì trạng thái 94/120 đơn hoàn thành & 7/10 xe tải đang khai thác',
      'Tiết giảm 34.9% tổng quãng đường (374.4 km xuống 243.7 km) và 39.2% phát thải CO₂e',
      '0 vi phạm khung giờ cấm tải QĐ 23/2018/QĐ-UBND · Ghép 21 đơn chiều về (2.7% chạy rỗng)',
    ],
  },
  {
    id: 'macbook_pro',
    shortLabel: 'MacBook Pro 16"',
    deviceTitle: 'MacBook Pro 16" · Trung Tâm Điều Phối Đội Xe B2B CRM/TMS',
    roleBadge: 'VAI TRÒ 1 · ĐIỀU PHỐI VIÊN CÔNG TY',
    imageSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Trải Nghiệm Giao Diện Quản Lý (/dashboard)',
    description:
      'Không gian quản trị dành cho điều phối viên: nạp bảng tính .XLSX 120 đơn từ ERP, kiểm tra tiến độ từng xe theo thời gian thực và xuất báo cáo kiểm toán ESG 3 Sheet chuẩn ISO 14083 / GLEC v3.2.',
    highlights: [
      'Theo dõi trực quan 94/120 đơn, 7/10 xe, 243.7 km, 2.7% chạy rỗng và +19 đơn ghép về',
      'Tích hợp trực tiếp Buồng Đối Chứng 2 Bên EVSIM ngay trong thanh điều hướng bên trái',
      '1-click chuyển từ bất kỳ dòng xe nào sang Bản đồ Dẫn đường Xe tải (/maps)',
    ],
  },
  {
    id: 'windows_xps',
    shortLabel: 'Windows 11 XPS 16',
    deviceTitle: 'Dell XPS 16 · Buồng Kiểm Thử Đối Chứng 2 Bên EVSIM',
    roleBadge: 'VAI TRÒ 2 · KIỂM ĐỊNH THUẬT TOÁN ĐỘC LẬP',
    imageSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveRouteUrl: '/benchmark/',
    liveRouteLabel: 'Mở Buồng Đối Chứng EVSIM (/benchmark)',
    description:
      'Chạy song song hai bản đồ TP.HCM từ 06:00 đến 20:00 trên cùng một mạng lưới đường phố thật: bên trái là quy trình điều phối thủ công (374.4 km, 28 lỗi cấm tải QĐ 23), bên phải là thuật toán EcoMiles (243.7 km, 0 lỗi).',
    highlights: [
      'Đồng hồ mô phỏng 06:00 - 20:00 với tốc độ tua nhanh và nút nhảy mốc giờ cấm 06:00 / 09:05 / 16:30',
      'Cho phép tải lên bất kỳ file .XLSX / .CSV thực tế nào của doanh nghiệp để kiểm chứng ngay',
      'Biểu đồ theo dõi luỹ kế km chạy rỗng và phát thải CO₂e theo thời gian thực',
    ],
  },
  {
    id: 'galaxy_zfold',
    shortLabel: 'Galaxy Z Fold',
    deviceTitle: 'Samsung Galaxy Z Fold · Buồng Lái Bản Đồ Xe Tải (/maps)',
    roleBadge: 'BẢN ĐỒ XE TẢI MỞ · CHẶNG GIỮA (>500KG)',
    imageSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveRouteUrl: '/maps/?vehicle=0&mode=navigate',
    liveRouteLabel: 'Mở Chế Độ Bắt Đầu Lái (/maps Live)',
    description:
      'Màn hình gập mở rộng gắn trên taplo xe tải (>500kg): hiển thị rõ các vùng cấm tải QĐ 23/2018 màu đỏ, giới hạn tải trọng cầu (13T / 4.5m) và chế độ Dẫn Đường Trực Tiếp bám theo mũi xe.',
    highlights: [
      'Camera tự động xoay hướng mũi xe (36 km/h) với vệt xanh lá đã đi và đường xanh dương phía trước',
      'Thuyết minh giọng nói tiếng Việt tự động đọc tên đường rẽ tiếp theo và cảnh báo giờ cấm',
      'Hỗ trợ xuất file .GPX sang ứng dụng dẫn đường xe tải với chi phí bản đồ API = $0',
    ],
  },
  {
    id: 'ipad_pro',
    shortLabel: 'iPad Pro M4',
    deviceTitle: 'iPad Pro M4 · Bảng Điều Khiển Kho Vận & Giám Sát Bến Xuất',
    roleBadge: 'TABLET KHO VẬN · GIAO DIỆN CẢM ỨNG',
    imageSrc: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Bảng Điều Khiển Tablet (/dashboard)',
    description:
      'Giao diện máy tính bảng chuyển thanh điều hướng dọc thành dải nút cảm ứng ngang, đưa toàn bộ 6 chỉ số KPI và bảng tiến độ đội xe lên ngay màn hình đầu tiên để quản đốc kho thao tác nhanh.',
    highlights: [
      'Giao diện cảm ứng tối ưu cho quản đốc kho kiểm tra nhanh tiến độ bến xuất và hàng về',
      'Theo dõi tức thì tỷ lệ lấp đầy tải trọng (101.5%) và danh sách đơn ghép chiều về',
      'Chuyển đổi nhanh giữa các chi nhánh doanh nghiệp B2B với kho dữ liệu cách ly độc lập',
    ],
  },
  {
    id: 'iphone_duo',
    shortLabel: 'iPhone Duo (Gập Đôi)',
    deviceTitle: 'iPhone Duo Dual-Screen · Màn Trái Đơn Hàng + Màn Phải Bản Đồ',
    roleBadge: 'ĐIỆN THOẠI GẬP ĐÔI · ĐA NHIỆM TÀI XẾ',
    imageSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Mở Ứng Dụng Tài Xế (/driver)',
    description:
      'Thiết kế đa nhiệm trên điện thoại gập đôi: màn hình bên trái giữ danh sách 13 điểm dừng và trạng thái giao hàng (/driver), trong khi màn hình bên phải chạy bản đồ dẫn đường trực tiếp (/maps).',
    highlights: [
      'Tài xế vừa xem ghi chú người nhận & đơn ghép chiều về vừa theo dõi lộ trình né đường cấm',
      'Không cần chuyển tab qua lại khi đang di chuyển qua các giao lộ phức tạp tại TP.HCM',
      'Đồng bộ trạng thái Đã đến / Đã giao xong về trung tâm điều phối trong < 50ms',
    ],
  },
  {
    id: 'iphone_18_pro_max',
    shortLabel: 'iPhone 18 Pro Max',
    deviceTitle: 'iPhone 18 Pro Max · Ứng Dụng Tài Xế Chặng Giữa (>500kg)',
    roleBadge: 'VAI TRÒ 3 (TÀI XẾ) · CHẶNG GIỮA (>500KG)',
    imageSrc: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Mở App Tài Xế Chặng Giữa (/driver)',
    description:
      'Giao diện điện thoại độ tương phản cao ngoài trời nắng dành cho tài xế xe tải (>500kg): tích hợp bản đồ xe tải né đường cấm, thông báo lệnh ghép đơn chiều về kho Tân Bình và cập nhật giao hàng 1 chạm.',
    highlights: [
      'Bố cục chữ lớn, nút bấm một chạm rõ ràng giúp tài xế thao tác an toàn tại điểm dừng',
      '1-chạm mở Bản Đồ Vùng Cấm (/maps) hoặc Bắt Đầu Lái (/maps Live)',
      'Hiển thị rõ ràng buộc cầu <= 13T, độ cao <= 3.8m và hành lang hợp pháp QĐ 23/2018',
    ],
  },
  {
    id: 'galaxy_s26_ultra',
    shortLabel: 'Galaxy S26 Ultra',
    deviceTitle: 'Samsung Galaxy S26 Ultra · Dẫn Đường Google Maps Waypoints ($0)',
    roleBadge: 'VAI TRÒ 3 (TÀI XẾ) · CHẶNG CUỐI (<=500KG)',
    imageSrc: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Thử Mở Google Maps Waypoints (/driver)',
    description:
      'Đối với xe van / ô tô con (<=500kg) không bị cấm tải QĐ 23/2018, EcoMiles tự động nhúng chuỗi tọa độ các điểm dừng tối ưu thẳng vào ứng dụng Google Maps sẵn có trên điện thoại tài xế ($0 phí API).',
    highlights: [
      'Giữ nguyên thứ tự điểm giao tối ưu của thuật toán khi mở trực tiếp trên Google Maps điện thoại',
      'Hỗ trợ nút Mở Toàn Bộ Tuyến Nhiều Điểm Dừng Trên Google Maps Ô Tô ($0) chỉ với 1 chạm',
      'Tiết kiệm 100% chi phí thuê bao bản đồ thương mại cho đội xe giao hàng chặng cuối',
    ],
  },
];

export const DriverAndDispatcherShowcase: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceViewId>('all_banner');
  const shouldReduceMotion = useReducedMotion();
  const [isShowcaseLightboxOpen, setIsShowcaseLightboxOpen] = useState<boolean>(false);

  const activeFlagshipIndex = Math.max(
    0,
    FLAGSHIP_DEVICES.findIndex((d) => d.id === selectedDeviceId)
  );
  const wrapFlagshipIndex = gsap.utils.wrap(0, FLAGSHIP_DEVICES.length);
  const stepFlagshipDevice = (delta: -1 | 1) => {
    const nextDev = FLAGSHIP_DEVICES[wrapFlagshipIndex(activeFlagshipIndex + delta)];
    if (nextDev) {
      tiltRotateX.set(0);
      tiltRotateY.set(0);
      setSelectedDeviceId(nextDev.id);
    }
  };

  const sectionRef = useRef<HTMLElement | null>(null);
  const stageCardRef = useRef<HTMLDivElement | null>(null);
  const multiStageRef = useRef<HTMLDivElement | null>(null);
  const activeDevice =
    FLAGSHIP_DEVICES.find((d) => d.id === selectedDeviceId) ?? FLAGSHIP_DEVICES[0];

  const hardwareDevices = FLAGSHIP_DEVICES.filter((d) => d.id !== 'all_banner');
  const activeHardwareIndex = Math.max(
    0,
    hardwareDevices.findIndex((d) => d.id === activeDevice.id)
  );
  const wrapHardwareIndex = gsap.utils.wrap(0, hardwareDevices.length);
  const stepHardwareDevice = (delta: -1 | 1) => {
    const nextDev = hardwareDevices[wrapHardwareIndex(activeHardwareIndex + delta)];
    if (nextDev) {
      tiltRotateX.set(0);
      tiltRotateY.set(0);
      setSelectedDeviceId(nextDev.id);
    }
  };

  const tiltRotateX = useMotionValue(0);
  const tiltRotateY = useMotionValue(0);
  const springRotateX = useSpring(tiltRotateX, { stiffness: 260, damping: 22, mass: 0.6 });
  const springRotateY = useSpring(tiltRotateY, { stiffness: 260, damping: 22, mass: 0.6 });

  const handleSingleDevicePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    tiltRotateX.set(gsap.utils.clamp(-8, 8, -ny * 14));
    tiltRotateY.set(gsap.utils.clamp(-10, 10, nx * 16));
  };

  const handleSingleDevicePointerLeave = () => {
    tiltRotateX.set(0);
    tiltRotateY.set(0);
  };

  useEffect(() => {
    const handleExternalSelectDevice = (e: Event) => {
      const customEvent = e as CustomEvent<{ deviceId?: string }>;
      const targetId = customEvent.detail?.deviceId;
      if (targetId && FLAGSHIP_DEVICES.some((d) => d.id === targetId)) {
        tiltRotateX.set(0);
        tiltRotateY.set(0);
        setSelectedDeviceId(targetId as DeviceViewId);
      }
    };
    window.addEventListener('ecomiles:select-device', handleExternalSelectDevice);
    return () => window.removeEventListener('ecomiles:select-device', handleExternalSelectDevice);
  }, [tiltRotateX, tiltRotateY]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        if (isShowcaseLightboxOpen) {
          setIsShowcaseLightboxOpen(false);
          return;
        }
        if (selectedDeviceId !== 'all_banner') {
          tiltRotateX.set(0);
          tiltRotateY.set(0);
          setSelectedDeviceId('all_banner');
        }
        return;
      }
      if (!isShowcaseLightboxOpen && selectedDeviceId === 'all_banner') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        if (isShowcaseLightboxOpen) {
          const nextDev = FLAGSHIP_DEVICES[wrapFlagshipIndex(activeFlagshipIndex + delta)];
          if (nextDev) {
            tiltRotateX.set(0);
            tiltRotateY.set(0);
            setSelectedDeviceId(nextDev.id);
          }
        } else {
          const nextDev = hardwareDevices[wrapHardwareIndex(activeHardwareIndex + delta)];
          if (nextDev) {
            tiltRotateX.set(0);
            tiltRotateY.set(0);
            setSelectedDeviceId(nextDev.id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedDeviceId,
    activeHardwareIndex,
    hardwareDevices,
    wrapHardwareIndex,
    wrapFlagshipIndex,
    tiltRotateX,
    tiltRotateY,
    isShowcaseLightboxOpen,
    activeFlagshipIndex,
  ]);

  const renderDeviceIcon = (id: DeviceViewId) => {
    if (id === 'all_banner') return <Layers className="w-3.5 h-3.5" />;
    if (id === 'macbook_pro' || id === 'windows_xps') return <Laptop className="w-3.5 h-3.5" />;
    if (id === 'galaxy_zfold' || id === 'ipad_pro') return <Tablet className="w-3.5 h-3.5" />;
    if (id === 'iphone_duo') return <SplitSquareVertical className="w-3.5 h-3.5" />;
    return <Smartphone className="w-3.5 h-3.5" />;
  };

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-900/95 border-t border-white/10 scroll-mt-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Clean Section Heading + 8-Pill Device Selector */}
        <div className="flex flex-col items-center text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Đồng Bộ Tức Thì Trên <span className="text-ecomiles-lime">Mọi Thiết Bị Điều Phối &amp; Tài Xế</span>
          </h2>
          <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Chọn bất kỳ thiết bị nào bên dưới để xem giao diện thực tế và bấm mở trực tiếp ứng dụng tương ứng.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10 max-w-6xl mx-auto">
            {FLAGSHIP_DEVICES.map((dev) => {
              const isActive = dev.id === selectedDeviceId;
              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => setSelectedDeviceId(dev.id)}
                  aria-pressed={isActive}
                  className={`relative px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive ? 'text-slate-950' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeDeviceSelectorPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-ecomiles-lime shadow-sm"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {renderDeviceIcon(dev.id)}
                    <span>{dev.shortLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Interactive Stage Card */}
        <div
          ref={stageCardRef}
          className="rounded-3xl bg-slate-950/90 border border-white/10 p-5 sm:p-7 shadow-2xl shadow-black/60"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 8 Cols: Interactive 7-Device Spatial Stage OR Individual Device Mockup */}
            <div
              ref={multiStageRef}
              className="lg:col-span-8 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden"
            >
              {activeDevice.id === 'all_banner' ? (
                <div className="w-full relative space-y-3">
                  {/* Animated SVG Data-Sync Bezier Network */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 600 320"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 w-full h-full z-0"
                  >
                    {[
                      { sx: 150, sy: 95, ex: 70, ey: 250, d: 'M 150 95 C 150 170, 70 190, 70 250' },
                      { sx: 150, sy: 95, ex: 185, ey: 255, d: 'M 150 95 C 150 180, 185 200, 185 255' },
                      { sx: 150, sy: 95, ex: 300, ey: 260, d: 'M 150 95 C 180 180, 300 200, 300 260' },
                      { sx: 450, sy: 95, ex: 300, ey: 260, d: 'M 450 95 C 420 180, 300 200, 300 260' },
                      { sx: 450, sy: 95, ex: 415, ey: 255, d: 'M 450 95 C 450 180, 415 200, 415 255' },
                      { sx: 450, sy: 95, ex: 530, ey: 250, d: 'M 450 95 C 450 170, 530 190, 530 250' },
                    ].map((arc, idx) => (
                      <g key={idx}>
                        <path
                          d={arc.d}
                          fill="none"
                          stroke="#d6f65a"
                          strokeWidth={1.35}
                          strokeOpacity={0.35}
                          strokeDasharray="5 6"
                        />
                        {!shouldReduceMotion && (
                          <circle r={2.6} fill="#d6f65a" fillOpacity={0.9}>
                            <animateMotion
                              dur="2.2s"
                              begin={`${idx * 0.32}s`}
                              repeatCount="indefinite"
                              path={arc.d}
                            />
                          </circle>
                        )}
                      </g>
                    ))}
                  </svg>

                  <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 items-end px-2 sm:px-4">
                    <motion.button
                      type="button"
                      onClick={() => setSelectedDeviceId('macbook_pro')}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group w-full text-center cursor-pointer focus:outline-none"
                    >
                      <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/90 border border-ecomiles-lime/40 text-xs font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors">
                        <Laptop className="w-3.5 h-3.5" />
                        <span>1. MacBook Pro 16&quot;</span>
                      </div>
                      <img
                        src="/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png"
                        alt="MacBook Pro 16 inch B2B CRM/TMS"
                        className="w-full h-auto max-h-[175px] object-contain mx-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
                      />
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setSelectedDeviceId('windows_xps')}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group w-full text-center cursor-pointer focus:outline-none"
                    >
                      <div className="mb-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/90 border border-ecomiles-lime/40 text-xs font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors">
                        <Laptop className="w-3.5 h-3.5" />
                        <span>2. Windows 11 XPS 16</span>
                      </div>
                      <img
                        src="/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png"
                        alt="Dell XPS 16 Windows 11 EVSIM Dual Simulator"
                        className="w-full h-auto max-h-[175px] object-contain mx-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
                      />
                    </motion.button>
                  </div>

                  {/* 5 Foreground Field & Tablet Devices */}
                  <div className="relative z-20 -mt-7 sm:-mt-9 flex flex-wrap sm:flex-nowrap items-end justify-center gap-3 sm:gap-4">
                    {[
                      { id: 'galaxy_zfold' as const, label: '3. Galaxy Z Fold', src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png', highlight: false },
                      { id: 'iphone_18_pro_max' as const, label: '4. iPhone 18 Pro', src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png', highlight: false },
                      { id: 'iphone_duo' as const, label: '5. iPhone Duo', src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png', highlight: true },
                      { id: 'galaxy_s26_ultra' as const, label: '6. Galaxy S26', src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png', highlight: false },
                      { id: 'ipad_pro' as const, label: '7. iPad Pro M4', src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png', highlight: false },
                    ].map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedDeviceId(item.id)}
                        whileHover={{ y: -8, scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex flex-col items-center text-center cursor-pointer focus:outline-none shrink-0"
                      >
                        <img
                          src={item.src}
                          alt={item.label}
                          className="h-[120px] sm:h-[148px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
                        />
                        <span
                          className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
                            item.highlight
                              ? 'bg-ecomiles-lime text-slate-950 font-extrabold'
                              : 'bg-slate-900/90 border border-ecomiles-lime/35 text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950'
                          }`}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative w-full flex flex-col items-center justify-center gap-3 py-1">
                  <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        tiltRotateX.set(0);
                        tiltRotateY.set(0);
                        setSelectedDeviceId('all_banner');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-ecomiles-lime hover:text-slate-950 text-ecomiles-lime border border-ecomiles-lime/40 font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Toàn cảnh 7 thiết bị</span>
                    </button>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stepHardwareDevice(-1)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 font-bold cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                      </button>
                      <span className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 font-mono font-bold text-ecomiles-lime">
                        {activeHardwareIndex + 1} / {hardwareDevices.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => stepHardwareDevice(1)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 font-bold cursor-pointer transition-colors"
                      >
                        <span>Tiếp</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsShowcaseLightboxOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ecomiles-lime text-slate-950 hover:bg-yellow-300 font-extrabold cursor-pointer transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Xem lớn</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive 3D Pointer-Tilted Hardware Mockup */}
                  <motion.div
                    key={activeDevice.id}
                    onPointerMove={handleSingleDevicePointerMove}
                    onPointerLeave={handleSingleDevicePointerLeave}
                    style={{
                      rotateX: springRotateX,
                      rotateY: springRotateY,
                      transformPerspective: 1100,
                    }}
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex items-center justify-center cursor-grab active:cursor-grabbing py-1"
                  >
                    <img
                      src={activeDevice.imageSrc}
                      alt={activeDevice.deviceTitle}
                      onClick={() => setIsShowcaseLightboxOpen(true)}
                      className="max-h-[420px] w-auto max-w-full mx-auto block object-contain cursor-zoom-in drop-shadow-[0_22px_48px_rgba(0,0,0,0.85)] rounded-xl"
                    />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Role Context, 3 Verified Highlights (Flat Checklist, Zero Nested Cards) & Live Launch CTA */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDevice.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-4 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-ecomiles-lime bg-ecomiles-lime/10 border border-ecomiles-lime/25 uppercase tracking-wider">
                    {activeDevice.roleBadge}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                    {activeDevice.deviceTitle}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activeDevice.description}
                  </p>
                </div>

                <div className="py-4 border-y border-white/10 space-y-3">
                  {activeDevice.highlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-ecomiles-lime shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {hl}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5">
                  <a
                    href={activeDevice.liveRouteUrl}
                    className="w-full px-4 py-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/40 transition-colors cursor-pointer"
                  >
                    <span>{activeDevice.liveRouteLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsShowcaseLightboxOpen(true)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4 text-ecomiles-lime" />
                    <span>Phóng to màn hình thiết bị</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal with Interactive Spatial Hotspots */}
      {isShowcaseLightboxOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeDevice.deviceTitle}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-xl p-3 sm:p-6"
            onClick={() => setIsShowcaseLightboxOpen(false)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                    [{activeFlagshipIndex + 1}/{FLAGSHIP_DEVICES.length}] {activeDevice.deviceTitle}
                  </div>
                  <div className="text-xs text-slate-300 truncate">{activeDevice.roleBadge}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => stepFlagshipDevice(-1)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => stepFlagshipDevice(1)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                  >
                    <span>Tiếp</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={activeDevice.liveRouteUrl}
                    className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1"
                  >
                    <span>{activeDevice.liveRouteLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsShowcaseLightboxOpen(false)}
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
                    key={activeDevice.id}
                    src={activeDevice.imageSrc}
                    alt={activeDevice.deviceTitle}
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                  />
                  {activeDevice.id === 'all_banner' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {STUDIO_STAGE_SPATIAL_HOTSPOTS.map((spot) => (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => {
                            tiltRotateX.set(0);
                            tiltRotateY.set(0);
                            setSelectedDeviceId(spot.id);
                          }}
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                {FLAGSHIP_DEVICES.map((dev) => {
                  const isActive = dev.id === selectedDeviceId;
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => {
                        tiltRotateX.set(0);
                        tiltRotateY.set(0);
                        setSelectedDeviceId(dev.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                        isActive
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {dev.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
};
