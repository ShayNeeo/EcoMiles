import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  Check,
  Compass,
  Laptop,
  Layers,
  Monitor,
  Smartphone,
  SplitSquareVertical,
  Tablet,
} from 'lucide-react';

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
    roleBadge: 'PANORAMIC STUDIO SHOWCASE · 7 THIẾT BỊ FLAGSHIP',
    imageSrc: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
    liveRouteUrl: '/dashboard/',
    liveRouteLabel: 'Mở Trung Tâm Điều Phối B2B (/dashboard)',
    description:
      'Một nền tảng duy nhất đồng bộ từ máy trạm điều phối tại văn phòng (MacBook Pro 16", Windows 11 XPS 16) đến máy tính bảng kho vận / buồng lái (Samsung Galaxy Z Fold, iPad Pro M4) và điện thoại tài xế ngoài thực địa (iPhone Duo Dual-Screen, iPhone 18 Pro Max, Samsung Galaxy S26 Ultra).',
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
      'Thiết kế đa nhiệm trên điện thoại gập đôi: màn hình bên trái giữ danh sách điểm dừng và trạng thái giao hàng (/driver), trong khi màn hình bên phải chạy bản đồ dẫn đường trực tiếp (/maps?mode=navigate).',
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
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageCardRef = useRef<HTMLDivElement | null>(null);

  const activeDevice =
    FLAGSHIP_DEVICES.find((d) => d.id === selectedDeviceId) ?? FLAGSHIP_DEVICES[0];

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current || !stageCardRef.current) return;

      gsap.fromTo(
        stageCardRef.current,
        { y: 36, opacity: 0.35, rotateX: 4, transformPerspective: 1200 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: stageCardRef.current,
            start: 'top 90%',
            end: 'top 40%',
            scrub: 0.4,
          },
        }
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDevice.id}
              initial={{ opacity: 0, y: 14, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left/Center 8 Cols: High-DPI Hardware Mockup Stage (Immediately Visible Above the Fold!) */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.32)_0%,rgba(2,6,23,0.92)_75%)] rounded-2xl p-3 sm:p-5 border border-white/10">
                <div className="w-full flex items-center justify-center">
                  <img
                    src={activeDevice.imageSrc}
                    alt={activeDevice.deviceTitle}
                    className="max-h-[470px] w-auto max-w-full mx-auto block object-contain drop-shadow-[0_20px_44px_rgba(0,0,0,0.8)] rounded-xl"
                  />
                </div>
              </div>

              {/* Right 4 Cols: Role Context, 3 Verified Highlights & Live Launch CTAs */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
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
                  <motion.a
                    href="/maps/?vehicle=0&mode=navigate"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-ecomiles-lime" />
                    <span>Mở Bản Đồ Xe Tải (/maps)</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
