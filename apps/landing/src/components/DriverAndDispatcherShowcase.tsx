import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  Check,
  Compass,
  Download,
  Laptop,
  Layers,
  Monitor,
  Smartphone,
  SplitSquareVertical,
  Tablet,
} from 'lucide-react';
import { ThreeDeviceEcosystemBanner } from './ThreeDeviceEcosystemBanner';

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
    shortLabel: 'Toàn Cảnh 7 Thiết Bị (3D Stage)',
    deviceTitle: 'Hệ Sinh Thái Đa Thiết Bị Đồng Bộ Thời Gian Thực (Desktop · Foldable · Tablet · Mobile)',
    roleBadge: 'INTERACTIVE 7-DEVICE SPATIAL STAGE · CLICK BẤT KỲ THIẾT BỊ NÀO ĐỂ PHÓNG TO',
    imageSrc: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Trung Tâm Điều Phối B2B (/dashboard)',
    description:
      'Một nền tảng duy nhất đồng bộ từ máy trạm điều phối tại văn phòng (MacBook Pro 16", Windows 11 XPS 16) đến máy tính bảng kho vận / buồng lái (Samsung Galaxy Z Fold, iPad Pro M4) và điện thoại tài xế ngoài thực địa (iPhone Duo Dual-Screen, iPhone 18 Pro Max, Samsung Galaxy S26 Ultra). Di chuột hoặc bấm trực tiếp vào bất kỳ thiết bị nào trong sân khấu bên trái để kiểm tra chi tiết.',
    highlights: [
      'Đồng bộ tức thì trạng thái 94/120 đơn hoàn thành & 7/10 xe tải đang khai thác',
      'Tiết giảm 34.9% tổng quãng đường (374.4 km xuống 243.7 km) và 39.2% phát thải CO₂e',
      '0 vi phạm khung giờ cấm tải QĐ 23/2018/QĐ-UBND · Ghép 21 đơn chiều về (2.7% chạy rỗng)',
    ],
  },
  {
    id: 'macbook_pro',
    shortLabel: 'MacBook Pro 16"',
    deviceTitle: 'MacBook Pro 16" (macOS) · Trung Tâm Điều Phối Đội Xe B2B CRM/TMS',
    roleBadge: 'VAI TRÒ 1 (USER) · ĐIỀU PHỐI VIÊN CÔNG TY',
    imageSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Trải Nghiệm Giao Diện Quản Lý (/dashboard)',
    description:
      'Không gian quản trị Daylight Enterprise dành cho điều phối viên: nạp bảng tính .XLSX 120 đơn từ ERP, kiểm tra tiến độ từng xe theo thời gian thực và xuất báo cáo kiểm toán ESG 3 Sheet chuẩn ISO 14083 / GLEC v3.2.',
    highlights: [
      'Thanh chỉ số 6 ô (94/120 đơn · 7/10 xe · 243.7 km · 2.7% chạy rỗng · +19 đơn ghép về · 57.3 kg CO₂)',
      'Tích hợp trực tiếp Buồng Đối Chứng 2 Bên EVSIM ngay trong thanh điều hướng bên trái',
      '1-click nhảy từ bất kỳ dòng xe nào sang Bản đồ Dẫn đường Xe tải (/maps)',
    ],
  },
  {
    id: 'windows_xps',
    shortLabel: 'Windows 11 XPS 16',
    deviceTitle: 'Dell XPS 16 (Windows 11 PWA) · Buồng Kiểm Thử Đối Chứng 2 Bên EVSIM',
    roleBadge: 'VAI TRÒ 2 (TESTER) · KIỂM ĐỊNH THUẬT TOÁN ĐỘC LẬP',
    imageSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveRouteUrl: '/benchmark/',
    liveRouteLabel: 'Mở Buồng Đối Chứng EVSIM (/benchmark)',
    description:
      'Chạy song song hai bản đồ TP.HCM từ 06:00 đến 20:00 trên cùng một hàm khoảng cách đường phố thật OSRM: bên trái là quy trình điều phối thủ công (374.4 km, 28 lỗi cấm tải QĐ 23), bên phải là thuật toán Carbon-Aware ALNS của EcoMiles (243.7 km, 0 lỗi).',
    highlights: [
      'Đồng hồ mô phỏng 06:00 - 20:00 với tốc độ x30..x600 và nút nhảy mốc giờ cấm 06:00 / 09:05 / 16:30',
      'Cho phép tải lên bất kỳ file .XLSX / .CSV thực tế nào của doanh nghiệp để kiểm chứng',
      'Đồ thị sparkline theo dõi luỹ kế km chạy rỗng và phát thải CO₂e theo từng phút',
    ],
  },
  {
    id: 'galaxy_zfold',
    shortLabel: 'Galaxy Z Fold',
    deviceTitle: 'Samsung Galaxy Z Fold (768x1024 Unfolded) · Buồng Lái Bản Đồ Xe Tải (/maps)',
    roleBadge: 'BẢN ĐỒ XE TẢI MỞ OPENTRUCK · CHẶNG GIỮA (>500KG)',
    imageSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveRouteUrl: '/maps/?vehicle=0&mode=navigate',
    liveRouteLabel: 'Mở Chế Độ Bắt Đầu Lái (/maps Live)',
    description:
      'Màn hình gập mở rộng gắn trên taplo xe tải (>500kg): hiển thị rõ các vùng cấm tải QĐ 23/2018 màu đỏ, giới hạn tải trọng cầu (13T / 4.5m) và chế độ Dẫn Đường Trực Tiếp (Follow-Truck) kiểu nút "Start" của Google Maps.',
    highlights: [
      'Camera tự động xoay hướng mũi xe (36 km/h) với vệt xanh lá đã đi và đường xanh dương phía trước',
      'Thuyết minh giọng nói tiếng Việt tự động đọc tên đường rẽ tiếp theo và cảnh báo giờ cấm',
      'Hỗ trợ xuất file .GPX sang OsmAnd Truck với chi phí bản đồ API = $0',
    ],
  },
  {
    id: 'ipad_pro',
    shortLabel: 'iPad Pro M4',
    deviceTitle: 'iPad Pro M4 (768x1024) · Bảng Điều Khiển Kho Vận & Giám Sát Đội Xe Cảm Ứng',
    roleBadge: 'TABLET WAREHOUSE & DISPATCH · TOUCH UI',
    imageSrc: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Bảng Điều Khiển Tablet (/dashboard)',
    description:
      'Giao diện máy tính bảng tự động chuyển thanh điều hướng dọc thành dải nút cảm ứng ngang (Touch Pill Bar), đưa toàn bộ 6 chỉ số KPI và bảng tiến độ đội xe lên ngay màn hình đầu tiên mà không cần cuộn.',
    highlights: [
      '0px tràn ngang (scrollWidth === clientWidth = 768px) đã kiểm chứng tự động trên Chromium',
      'Tối ưu thao tác chạm một tay cho quản đốc kho kiểm tra tỷ lệ lấp đầy tải trọng (101.5%)',
      'Chuyển đổi tức thì giữa 3 doanh nghiệp B2B cách ly khóa mã hóa KMS riêng biệt',
    ],
  },
  {
    id: 'iphone_duo',
    shortLabel: 'iPhone Duo (Gập Đôi)',
    deviceTitle: 'iPhone Duo Dual-Screen · Màn Trái Danh Sách Điểm Giao + Màn Phải Dẫn Đường Trực Tiếp',
    roleBadge: 'DUAL-SCREEN FOLDABLE · ĐA NHIỆM TÀI XẾ',
    imageSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Mở Ứng Dụng Tài Xế (/driver)',
    description:
      'Thiết kế đa nhiệm trên điện thoại gập đôi: màn hình bên trái giữ danh sách 13 điểm dừng và trạng thái giao hàng (/driver), trong khi màn hình bên phải chạy bản đồ dẫn đường trực tiếp của cùng chuyến xe 51C-000.09 (/maps?mode=navigate).',
    highlights: [
      'Tài xế vừa xem ghi chú người nhận & đơn ghép chiều về vừa theo dõi lộ trình né đường cấm',
      'Không cần chuyển tab qua lại khi đang di chuyển qua các giao lộ phức tạp tại TP.HCM',
      'Đồng bộ trạng thái Đã đến / Đã giao xong về trung tâm điều phối trong < 50ms',
    ],
  },
  {
    id: 'iphone_18_pro_max',
    shortLabel: 'iPhone 18 Pro Max',
    deviceTitle: 'iPhone 18 Pro Max · Ứng Dụng Tài Xế Chặng Giữa (>500kg) & Ghép Đơn Chiều Về',
    roleBadge: 'VAI TRÒ 3 (DRIVER) · CHẶNG GIỮA (>500KG)',
    imageSrc: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Mở App Tài Xế Chặng Giữa (/driver)',
    description:
      'Giao diện điện thoại dành cho tài xế xe tải (>500kg): tích hợp Buồng Lái Dẫn Đường Xe Tải Mở ($0 API), thông báo lệnh ghép đơn chiều về kho Tân Bình và cập nhật biên bản giao hàng tức thì.',
    highlights: [
      'Khung viền đồng tâm chuẩn iOS với thanh trạng thái 09:41 và Dynamic Island không che tiêu đề',
      '1-chạm mở Bản Đồ Vùng Cấm (/maps) hoặc Bắt Đầu Lái (/maps Live)',
      'Hiển thị rõ ràng buộc cầu <= 13T, độ cao <= 3.8m và hành lang hợp pháp QĐ 23/2018',
    ],
  },
  {
    id: 'galaxy_s26_ultra',
    shortLabel: 'Galaxy S26 Ultra',
    deviceTitle: 'Samsung Galaxy S26 Ultra · Dẫn Đường Trực Tiếp & Khóa Tọa Độ Waypoints Google Maps ($0)',
    roleBadge: 'VAI TRÒ 3 (DRIVER) · CHẶNG CUỐI (<=500KG) & LIVE NAV',
    imageSrc: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveRouteUrl: '/driver/',
    liveRouteLabel: 'Thử Mở Google Maps Khóa Waypoints (/driver)',
    description:
      'Đối với xe van / ô tô con (<=500kg) không bị cấm tải QĐ 23/2018, EcoMiles tự động nhúng chuỗi tọa độ trung gian (waypoints=lat,lng|lat,lng) của thuật toán EcoALNS thẳng vào URL Google Maps miễn phí ($0 API).',
    highlights: [
      'Khắc phục hoàn toàn lỗi tiền tố via: trên Google Maps Universal Cross-Platform URL (?api=1)',
      'Hỗ trợ nút Mở Toàn Bộ Tuyến Nhiều Điểm Dừng Trên Google Maps Ô Tô ($0) chỉ với 1 chạm',
      'Giữ nguyên thứ tự giao hàng tối ưu của thuật toán mà không tốn phí Google Routes API',
    ],
  },
];

export const DriverAndDispatcherShowcase: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceViewId>('all_banner');
  const [stageRenderMode, setStageRenderMode] = useState<'spatial_2d' | 'webgl_3d' | 'studio_banner'>('spatial_2d');
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
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    tiltRotateX.set(-ny * 14);
    tiltRotateY.set(nx * 16);
  };

  const handleSingleDevicePointerLeave = () => {
    tiltRotateX.set(0);
    tiltRotateY.set(0);
  };

  useEffect(() => {
    const handleSelectDevice = (e: Event) => {
      const customEvent = e as CustomEvent<{ deviceId: DeviceViewId }>;
      const targetId = customEvent.detail?.deviceId;
      if (targetId && FLAGSHIP_DEVICES.some((d) => d.id === targetId)) {
        tiltRotateX.set(0);
        tiltRotateY.set(0);
        setSelectedDeviceId(targetId);
      }
    };
    window.addEventListener('ecomiles:select-device', handleSelectDevice);
    return () => window.removeEventListener('ecomiles:select-device', handleSelectDevice);
  }, [tiltRotateX, tiltRotateY]);
  // GSAP ScrollTrigger 4-Beat Spatial Fan-Out (Office -> Handover -> Field -> Outcome)
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current || !stageCardRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stageCardRef.current,
          start: 'top 90%',
          end: 'top 35%',
          scrub: 0.45,
        },
      });

      tl.fromTo(
        stageCardRef.current,
        { y: 32, opacity: 0.4, rotateX: 4, transformPerspective: 1200 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.6, ease: 'none' },
        0
      );

      // 4-Beat Device Fan-Out inside the Interactive 7-Device Stage
      tl.fromTo(
        '.gsap-beat-office',
        { y: 24, scale: 0.94, opacity: 0.5 },
        { y: 0, scale: 1, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'none' },
        0.05
      );
      tl.fromTo(
        '.gsap-beat-handover',
        { y: 36, scale: 0.9, opacity: 0.35 },
        { y: 0, scale: 1, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'none' },
        0.2
      );
      tl.fromTo(
        '.gsap-beat-field',
        { y: 48, scale: 0.88, opacity: 0.25 },
        { y: 0, scale: 1, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'none' },
        0.35
      );
    },
    { scope: sectionRef }
  );

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
      className="relative py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/95 border-t border-white/10 scroll-mt-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10 space-y-5">
        {/* Compact Header + Framer Motion 8-Pill Device Selector */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-ecomiles-lime/30 text-[11px] font-bold text-ecomiles-lime">
            <Monitor className="w-3.5 h-3.5" />
            <span>HỆ SINH THÁI ĐA THIẾT BỊ THỰC TẾ (MACBOOK · WINDOWS · Z FOLD · iPAD · iPHONE DUO · S26 ULTRA)</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Đồng Bộ Tức Thì Trên <span className="text-ecomiles-lime">Mọi Thiết Bị Điều Phối &amp; Tài Xế</span>
          </h2>

          {/* Framer Motion Shared-Layout 8-Pill Device Selector Bar */}
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
                    isActive ? 'text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeDeviceSelectorPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-ecomiles-lime shadow-md"
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

        {/* Main Interactive Stage Card (GSAP Scroll-Scrubbed + Framer Motion AnimatePresence) */}
        <div
          ref={stageCardRef}
          className="rounded-3xl bg-slate-950/90 border border-white/10 p-4 sm:p-6 lg:p-7 shadow-[0_28px_80px_rgba(0,0,0,0.65)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left/Center 8 Cols: Interactive 7-Device Spatial Stage OR Individual High-DPI Hardware Mockup */}
              <div
                ref={multiStageRef}
                className="lg:col-span-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.34)_0%,rgba(2,6,23,0.94)_75%)] rounded-2xl p-3 sm:p-5 border border-white/10 overflow-hidden space-y-3"
              >
                {/* 3-Mode Stage View Switcher: Interactive 2D Fan-Out vs 3D WebGL Camera Flight vs 2.4K Studio Banner */}
                <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 text-[11px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wider">
                    Chế độ sân khấu thiết bị:
                  </span>
                  <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStageRenderMode('spatial_2d')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        stageRenderMode === 'spatial_2d'
                          ? 'bg-ecomiles-lime text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      1. Sân Khấu 7 Thiết Bị (Tương Tác)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageRenderMode('webgl_3d')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        stageRenderMode === 'webgl_3d'
                          ? 'bg-ecomiles-lime text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      2. Không Gian 3D WebGL (Camera Flight)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageRenderMode('studio_banner')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        stageRenderMode === 'studio_banner'
                          ? 'bg-ecomiles-lime text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      3. Ảnh Bìa Studio 2.4K (Phản Chiếu)
                    </button>
                  </div>
                </div>

                {stageRenderMode === 'webgl_3d' ? (
                  <ThreeDeviceEcosystemBanner
                    selectedDeviceId={selectedDeviceId}
                    onSelectDevice={setSelectedDeviceId}
                  />
                ) : stageRenderMode === 'studio_banner' ? (
                  <div className="w-full flex items-center justify-center">
                    <img
                      src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                      alt="EcoMiles 7-Device Flagship Studio Cover Banner with Floor Reflections"
                      className="max-h-[450px] w-auto max-w-full mx-auto block object-contain drop-shadow-[0_20px_44px_rgba(0,0,0,0.85)] rounded-xl"
                    />
                  </div>
                ) : activeDevice.id === 'all_banner' ? (
                  <div className="w-full">
                    <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 items-end px-2 sm:px-4">
                      <div className="gsap-beat-office">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('macbook_pro')}
                          whileHover={{ y: -8, scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                          className="group w-full text-center cursor-pointer focus:outline-none"
                        >
                          <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-ecomiles-lime/40 text-[10px] font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors">
                            <Laptop className="w-3 h-3" />
                            <span>1. MacBook Pro 16&quot; · Điều phối B2B</span>
                          </div>
                          <img
                            src="/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png"
                            alt="MacBook Pro 16 inch B2B CRM/TMS"
                            className="w-full h-auto max-h-[175px] object-contain mx-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
                          />
                        </motion.button>
                      </div>

                      <div className="gsap-beat-office">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('windows_xps')}
                          whileHover={{ y: -8, scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                          className="group w-full text-center cursor-pointer focus:outline-none"
                        >
                          <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-ecomiles-lime/40 text-[10px] font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors">
                            <Laptop className="w-3 h-3" />
                            <span>2. Windows 11 XPS 16 · EVSIM Dual</span>
                          </div>
                          <img
                            src="/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png"
                            alt="Dell XPS 16 Windows 11 EVSIM Dual Simulator"
                            className="w-full h-auto max-h-[175px] object-contain mx-auto drop-shadow-[0_14px_28px_rgba(0,0,0,0.85)]"
                          />
                        </motion.button>
                      </div>
                    </div>

                    {/* Tier 2 & 3 (Mid Handover Tablets + Foreground Field Phones): 5 Interactive Devices */}
                    <div className="relative z-20 -mt-7 sm:-mt-9 flex flex-wrap sm:flex-nowrap items-end justify-center gap-3 sm:gap-4">
                      <div className="gsap-beat-handover shrink-0">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('galaxy_zfold')}
                          whileHover={{ y: -10, scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                          className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png"
                            alt="Samsung Galaxy Z Fold Unfolded Truck Map Cockpit"
                            className="h-[122px] sm:h-[152px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
                          />
                          <span className="mt-1.5 inline-block px-2 py-0.5 rounded bg-slate-900/90 border border-ecomiles-lime/35 text-[9.5px] font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors whitespace-nowrap">
                            3. Galaxy Z Fold
                          </span>
                        </motion.button>
                      </div>

                      <div className="gsap-beat-field shrink-0">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('iphone_18_pro_max')}
                          whileHover={{ y: -10, scale: 1.06 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                          className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png"
                            alt="iPhone 18 Pro Max Driver App"
                            className="h-[122px] sm:h-[152px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
                          />
                          <span className="mt-1.5 inline-block px-2 py-0.5 rounded bg-slate-900/90 border border-ecomiles-lime/35 text-[9.5px] font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors whitespace-nowrap">
                            4. iPhone 18 Pro Max
                          </span>
                        </motion.button>
                      </div>

                      <div className="gsap-beat-field shrink-0">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('iphone_duo')}
                          whileHover={{ y: -10, scale: 1.06 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                          className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png"
                            alt="iPhone Duo Dual-Screen Foldable"
                            className="h-[122px] sm:h-[152px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.95)]"
                          />
                          <span className="mt-1.5 inline-block px-2 py-0.5 rounded bg-ecomiles-lime text-slate-950 text-[9.5px] font-extrabold whitespace-nowrap">
                            5. iPhone Duo (Gập Đôi)
                          </span>
                        </motion.button>
                      </div>

                      <div className="gsap-beat-field shrink-0">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('galaxy_s26_ultra')}
                          whileHover={{ y: -10, scale: 1.06 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                          className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png"
                            alt="Samsung Galaxy S26 Ultra Live Truck Navigation"
                            className="h-[122px] sm:h-[152px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
                          />
                          <span className="mt-1.5 inline-block px-2 py-0.5 rounded bg-slate-900/90 border border-ecomiles-lime/35 text-[9.5px] font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors whitespace-nowrap">
                            6. Galaxy S26 Ultra
                          </span>
                        </motion.button>
                      </div>

                      <div className="gsap-beat-handover shrink-0">
                        <motion.button
                          type="button"
                          onClick={() => setSelectedDeviceId('ipad_pro')}
                          whileHover={{ y: -10, scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                          className="group flex flex-col items-center text-center cursor-pointer focus:outline-none"
                        >
                          <img
                            src="/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png"
                            alt="iPad Pro M4 Tablet Fleet Dashboard"
                            className="h-[122px] sm:h-[152px] w-auto object-contain mx-auto drop-shadow-[0_18px_32px_rgba(0,0,0,0.9)]"
                          />
                          <span className="mt-1.5 inline-block px-2 py-0.5 rounded bg-slate-900/90 border border-ecomiles-lime/35 text-[9.5px] font-bold text-ecomiles-lime group-hover:bg-ecomiles-lime group-hover:text-slate-950 transition-colors whitespace-nowrap">
                            7. iPad Pro M4
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full flex flex-col items-center justify-center gap-2.5 py-1">
                    {/* In-Stage Return Pill + Cyclic 1..7 / 7 Counter */}
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 px-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          tiltRotateX.set(0);
                          tiltRotateY.set(0);
                          setSelectedDeviceId('all_banner');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-ecomiles-lime hover:text-slate-950 text-ecomiles-lime border border-ecomiles-lime/40 font-bold transition-colors cursor-pointer"
                      >
                        ← Toàn cảnh 7 thiết bị
                      </button>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => stepHardwareDevice(-1)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 font-bold cursor-pointer transition-colors"
                        >
                          ‹ Thiết bị trước
                        </button>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-white/10 font-mono font-bold text-ecomiles-lime">
                          {activeHardwareIndex + 1} / {hardwareDevices.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => stepHardwareDevice(1)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/15 font-bold cursor-pointer transition-colors"
                        >
                          Thiết bị tiếp ›
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
                      initial={{ opacity: 0, scale: 0.94, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full flex items-center justify-center cursor-grab active:cursor-grabbing py-1"
                    >
                      <img
                        src={activeDevice.imageSrc}
                        alt={activeDevice.deviceTitle}
                        className="max-h-[420px] w-auto max-w-full mx-auto block object-contain drop-shadow-[0_22px_48px_rgba(0,0,0,0.85)] rounded-xl"
                      />
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Right 4 Cols: Role Context, 3 Verified Highlights & Live Launch CTAs */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDevice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-4 flex flex-col justify-between space-y-4"
                >
                <div className="space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold text-ecomiles-lime bg-ecomiles-lime/10 border border-ecomiles-lime/25 uppercase tracking-wider">
                    {activeDevice.roleBadge}
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                    {activeDevice.deviceTitle}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeDevice.description}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {activeDevice.highlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/85 border border-white/10 flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-ecomiles-lime flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-slate-200 leading-relaxed font-medium">
                        {hl}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 pt-1">
                  <motion.a
                    href={activeDevice.liveRouteUrl}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-full px-4 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <span>{activeDevice.liveRouteLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.a>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.a
                      href="/maps/?vehicle=0&mode=navigate"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                      <span>Bản Đồ (/maps)</span>
                    </motion.a>
                    <motion.a
                      href="/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png"
                      download="00_ecomiles_flagship_cover_banner.png"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-ecomiles-lime border border-ecomiles-lime/30 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>Tải Ảnh Bìa 2.4K</span>
                    </motion.a>
                  </div>
                </div>
                </motion.div>
              </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
