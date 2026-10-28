import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight,
  Check,
  FileCheck2,
  FileSpreadsheet,
  Globe2,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Route,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const revealItem = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: REVEAL_EASE },
  },
};

const stepGrid = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.06 },
  },
};

const stepItem = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: REVEAL_EASE },
  },
};

interface WorkflowStepSpec {
  num: string;
  title: string;
  icon: React.ReactNode;
  badge: string;
  summary: string;
  details: string;
  inputSpec: string;
  outputSpec: string;
  proofImage: string;
  liveUrl: string;
  liveLabel: string;
  devices: readonly string[];
  outcomes: string[];
}

const HARDWARE_EXECUTION_MOCKUPS: Record<
  string,
  { file: string; title: string; resolution: string; spec: string; liveHref: string; liveCta: string }
> = {
  'Studio 7 Thiết Bị': {
    file: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (Studio 2.4K)',
    resolution: '2400 × 1120 (Ultra-Wide High-DPI Stage)',
    spec: '7 Thiết Bị Đồng Bộ <50ms · Sàn Gương Phản Chiếu · $0 Map API',
    liveHref: '/dashboard/',
    liveCta: 'Mở /dashboard',
  },
  'MacBook Pro 16"': {
    file: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS',
    resolution: '3456 × 2234 (Liquid Retina XDR)',
    spec: '120 đơn / 7 tuyến ALNS · Báo cáo ESG 3 Sheet',
    liveHref: '/dashboard/',
    liveCta: 'Mở /dashboard',
  },
  'Windows 11 XPS 16': {
    file: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM',
    resolution: '3840 × 2400 (4K OLED)',
    spec: 'Đối chứng kép 374.4 km vs 243.7 km (-34.9%)',
    liveHref: '/benchmark/',
    liveCta: 'Mở /benchmark',
  },
  'Galaxy Z Fold': {
    file: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở (/maps)',
    resolution: '2160 × 1856 (Dynamic AMOLED 2X)',
    spec: 'Chặng giữa (>500kg) · Né vùng cấm QĐ 23/2018',
    liveHref: '/maps/?vehicle=0&mode=navigate',
    liveCta: 'Mở /maps Live',
  },
  'iPad Pro M4': {
    file: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
    resolution: '2752 × 2064 (Ultra Retina XDR)',
    spec: 'Quản lý bến xuất & ghép đơn chiều về (2.7% rỗng)',
    liveHref: '/dashboard/',
    liveCta: 'Mở /dashboard',
  },
  'iPhone Duo': {
    file: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
    resolution: '2420 × 1080 (Dual Mobile OLED)',
    spec: 'Màn 1: Danh sách đơn (/driver) · Màn 2: Dẫn đường (/maps)',
    liveHref: '/driver/',
    liveCta: 'Mở /driver',
  },
  'iPhone 18 Pro Max': {
    file: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    title: 'iPhone 18 Pro Max · App Tài Xế Chế Độ Nắng Gắt (/driver)',
    resolution: '2868 × 1320 (Super Retina XDR)',
    spec: 'Giao hàng 1-chạm & ghép đơn chiều về',
    liveHref: '/driver/',
    liveCta: 'Mở /driver',
  },
  'Galaxy S26 Ultra': {
    file: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    title: 'Samsung Galaxy S26 Ultra · Dẫn Đường & Waypoints ($0 API)',
    resolution: '3120 × 1440 (Dynamic AMOLED 2X 120Hz)',
    spec: 'Waypoints + Google Maps Ô tô miễn phí ($0)',
    liveHref: '/maps/?vehicle=0&mode=navigate',
    liveCta: 'Mở /maps Live',
  },
};

export const WorkflowShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [activeMockupDevice, setActiveMockupDevice] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  useEffect(() => {
    if (!activeMockupDevice) return undefined;
    const keys = Object.keys(HARDWARE_EXECUTION_MOCKUPS);
    const total = keys.length;
    const idx = Math.max(0, keys.indexOf(activeMockupDevice));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMockupDevice(null);
      else if (e.key === 'ArrowLeft') setActiveMockupDevice(keys[(idx - 1 + total) % total]);
      else if (e.key === 'ArrowRight') setActiveMockupDevice(keys[(idx + 1) % total]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeMockupDevice]);

  // Auto-Play 8-Step Tour timer (4.5s per step with 50ms smooth ticker)
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 4500;
    const tickMs = 50;
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % 8);
          return 0;
        }
        return prev + (tickMs / intervalMs) * 100;
      });
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [isPlaying]);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 85%', 'end 20%'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.28,
  });

  const steps: WorkflowStepSpec[] = [
    {
      num: '01',
      title: 'Nhập Bảng Tính Đơn Hàng (.XLSX)',
      icon: <FileSpreadsheet className="w-5 h-5 text-ecomiles-lime" />,
      badge: 'Đầu Vào ERP / Excel',
      summary:
        'Tải lên file .XLSX / .CSV (80 - 500 đơn/ca) từ ERP: từ điển cột thông minh tự động nhận diện Mã đơn, Địa chỉ, Quận/Huyện, Trọng lượng (kg) và Khung giờ giao.',
      details:
        'Tự động kiểm tra tọa độ GPS tại TP.HCM, phát hiện sớm các đơn nằm trong khung giờ cấm tải QĐ 23/2018 và che số điện thoại người nhận theo Nghị định 13/2023/NĐ-CP.',
      inputSpec: 'File .XLSX / .CSV (120 đơn Chuỗi Lạnh hoặc 80 đơn FMCG)',
      outputSpec: '120 bản ghi chuẩn hóa + Mã băm SHA-256 chống làm giả',
      proofImage: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
      liveUrl: '/dashboard/',
      liveLabel: 'Thử Tải File .XLSX Trên /dashboard',
      devices: ['MacBook Pro 16"', 'Windows 11 XPS 16', 'iPad Pro M4'],
      outcomes: [
        'Tự động ánh xạ 100% cột tiếng Việt / tiếng Anh không cần sửa tay',
        'Phát hiện tức thì 28 đơn rơi vào khung giờ cấm 06:00-09:00 & 16:00-20:00',
        'Che tự động SĐT và số nhà nhạy cảm (PII Masking NĐ 13/2023)',
      ],
    },
    {
      num: '02',
      title: 'Khai Báo Đội Xe & Giới Hạn Cầu',
      icon: <Truck className="w-5 h-5 text-emerald-400" />,
      badge: 'Cấu Hình Đội Xe',
      summary:
        'Thiết lập đội xe hỗn hợp (Xe tải lạnh 1.5T - 2.5T Chặng Giữa và Xe Van <=500kg Chặng Cuối) cùng định mức nhiên liệu chuẩn GLEC v3.2.',
      details:
        'Hệ thống gán tự động ràng buộc tải trọng cầu tối đa (13T), giới hạn chiều cao gầm cầu (3.8m - 4.5m) và hệ số phát thải động GLX-HDT-v1 cho từng biển số xe.',
      inputSpec: 'Danh sách 10 xe tải (51C-000.01 .. 51C-000.10)',
      outputSpec: 'Ma trận năng lực chuyên chở & định mức nhiên liệu L/100km',
      proofImage: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
      liveUrl: '/dashboard/',
      liveLabel: 'Xem Bảng Đội Xe Trên /dashboard',
      devices: ['MacBook Pro 16"', 'Windows 11 XPS 16', 'iPad Pro M4'],
      outcomes: [
        'Chỉ cần huy động 7/10 xe để phục vụ 100% 120 đơn hàng (tiết kiệm 3 xe dự phòng)',
        'Tỷ lệ lấp đầy tải trọng đạt 101.5% nhờ luân chuyển hàng chiều về',
        'Tách bạch rõ xe >500kg (Chặng Giữa) và xe <=500kg (Chặng Cuối)',
      ],
    },
    {
      num: '03',
      title: 'Phân Cụm Địa Lý & Lọc Giờ Cấm QĐ 23',
      icon: <MapPin className="w-5 h-5 text-emerald-300" />,
      badge: 'Bộ Lọc QĐ 23/2018',
      summary:
        'Gom cụm đơn hàng theo bán kính địa lý (1.5 - 6.0 km) và tự động dời lịch hợp pháp cho các đơn nằm trong vùng cấm tải nội đô TP.HCM.',
      details:
        'Loại bỏ hoàn toàn nguy cơ xe tải >500kg đi vào Quận 1, Quận 3, Phú Nhuận hoặc hành lang sân bay Tân Sơn Nhất trong khung giờ cấm 06:00-09:00 và 16:00-20:00.',
      inputSpec: '120 điểm giao + 28 điểm xung đột giờ cấm QĐ 23/2018',
      outputSpec: '7 cụm địa lý sạch 100% vi phạm (0 lỗi QĐ 23/2018)',
      proofImage: '/pitch-deck-screenshots/03_desktop_b2b_tms_routing_qd23_ban_guard.png',
      liveUrl: '/dashboard/',
      liveLabel: 'Mở Bàn Điều Phối & Bộ Lọc QĐ 23',
      devices: ['MacBook Pro 16"', 'Windows 11 XPS 16', 'Galaxy Z Fold'],
      outcomes: [
        'Khử 28/28 lỗi vi phạm giờ cấm QĐ 23/2018 (tránh phạt 5.000.000đ/lỗi)',
        'Cho phép điều chỉnh trực tiếp thanh trượt bán kính gom cụm (1.5 - 6.0 km)',
        'Lưu nhật ký kiểm toán giờ gốc vs giờ hợp lệ cho từng mã đơn',
      ],
    },
    {
      num: '04',
      title: 'Giải Thuật Carbon-Aware ALNS & 2-Opt',
      icon: <Route className="w-5 h-5 text-ecomiles-lime" />,
      badge: 'Tối Ưu Tuyến < 35ms',
      summary:
        'Khử toàn bộ các điểm giao cắt hình ngôi sao và sắp xếp thứ tự điểm dừng tối ưu theo hàm mục tiêu kép: Quãng đường (km) + Phát thải CO₂e (kg).',
      details:
        'Ưu tiên dỡ các kiện hàng nặng ở các điểm dừng đầu tiên để giảm tải trọng xe sớm, từ đó giảm mức tiêu hao nhiên liệu trên toàn bộ hành trình còn lại.',
      inputSpec: '7 cụm đơn hàng + Đồ thị đường phố thật OSRM TP.HCM',
      outputSpec: 'Lộ trình 243.7 km (-34.9% so với 374.4 km chia thủ công)',
      proofImage: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
      liveUrl: '/benchmark/',
      liveLabel: 'Kiểm Chứng Trên Buồng Đôi EVSIM (/benchmark)',
      devices: ['Windows 11 XPS 16', 'MacBook Pro 16"', 'iPad Pro M4'],
      outcomes: [
        'Tiết giảm 130.7 km mỗi ca vận hành (-34.9% tổng quãng đường)',
        'Thời gian giải thuật trung bình 13.9 ms (p50) / 20.4 ms (p95)',
        '100% kết quả tất định (Deterministic) giữa trình duyệt và máy chủ',
      ],
    },
    {
      num: '05',
      title: 'Ghép Đơn Thu Hồi Chiều Về (Backhaul)',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />,
      badge: 'Hạ Chạy Rỗng Xuống 2.7%',
      summary:
        'Tự động phát hiện và ghép các đơn lấy hàng từ nhà cung cấp / kho vệ tinh trên cung đường xe quay về kho Tân Bình.',
      details:
        'Biến quãng đường quay về không tải (vốn chiếm 32.8% tổng km ở phương án thủ công) thành hành trình thu hồi 1,864.9 kg hàng hóa có ích.',
      inputSpec: '7 xe hoàn tất giao hàng tại Thủ Đức, Quận 7, Bình Tân',
      outputSpec: '+21 đơn ghép chiều về (Chỉ còn 6.5 km / 2.7% chạy rỗng)',
      proofImage: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
      liveUrl: '/driver/',
      liveLabel: 'Xem Lệnh Ghép Chiều Về Trên /driver',
      devices: ['iPhone Duo', 'iPhone 18 Pro Max', 'Galaxy S26 Ultra', 'MacBook Pro 16"'],
      outcomes: [
        'Hạ tỷ lệ chạy rỗng từ 32.8% (122.9 km) xuống 2.7% (6.5 km)',
        'Thu hồi tự động 1,864.9 kg hàng hoàn / vỏ thùng về kho Tân Bình',
        'Tăng doanh thu thuần trên mỗi chuyến xe mà không tốn thêm đầu xe',
      ],
    },
    {
      num: '06',
      title: 'Phát Hành Xuống App Tài Xế 2 Chặng',
      icon: <Globe2 className="w-5 h-5 text-emerald-300" />,
      badge: 'App Tài Xế ($0 Map API)',
      summary:
        'Đồng bộ lộ trình xuống trình duyệt điện thoại của tài xế (iPhone 18 Pro Max, Galaxy S26 Ultra, iPhone Duo) chỉ bằng biển số xe và mã PIN 0000.',
      details:
        'Hỗ trợ 2 chế độ chuyên biệt: Chặng Giữa (>500kg) dùng Bản đồ Mở OpenTruck (/maps + GPX) né đường cấm QĐ 23; Chặng Cuối (<=500kg) nhúng thẳng tọa độ Waypoints vào Google Maps Ô tô miễn phí ($0).',
      inputSpec: 'Lộ trình 13 điểm của xe 51C-000.09 (Ca 1 · 48.51 km)',
      outputSpec: 'Danh sách điểm dừng + Nút Bắt Đầu Lái (/maps) & Google Maps Waypoints',
      proofImage: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
      liveUrl: '/driver/',
      liveLabel: 'Trải Nghiệm App Tài Xế (/driver)',
      devices: ['iPhone 18 Pro Max', 'Galaxy S26 Ultra', 'iPhone Duo'],
      outcomes: [
        '0đ chi phí bản đồ API hàng tháng (tiết kiệm 7.500.000đ/tháng phí Google API)',
        'Khóa cứng tọa độ trung gian (waypoints=lat,lng|lat,lng) trên Google Maps Ô tô',
        'Cập nhật trạng thái Đã đến / Đã giao xong / Báo hoãn theo thời gian thực',
      ],
    },
    {
      num: '07',
      title: 'Dẫn Đường Trực Tiếp (Follow-Truck)',
      icon: <Navigation className="w-5 h-5 text-ecomiles-lime" />,
      badge: 'Bản Đồ Xe Tải (/maps)',
      summary:
        'Chế độ "Bắt đầu" (Follow-Truck) bám sát vị trí xe tải trên đường phố thật TP.HCM với thuyết minh giọng nói tiếng Việt và cảnh báo cầu / giờ cấm.',
      details:
        'Hiển thị đồng hồ tốc độ (36 km/h), vệt đường đã đi màu xanh lá, lộ trình phía trước màu xanh dương, vùng cấm tải QĐ 23 màu đỏ và khoảng cách đếm ngược đến ngã rẽ tiếp theo.',
      inputSpec: 'Tọa độ GPS thời gian thực + Đồ thị đường phố OSRM TP.HCM',
      outputSpec: 'Buồng lái dẫn đường trực tiếp + Xuất file .GPX sang OsmAnd Truck',
      proofImage: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
      liveUrl: '/maps/?vehicle=0&mode=navigate',
      liveLabel: 'Mở Chế Độ Bắt Đầu Lái (/maps Live)',
      devices: ['Galaxy Z Fold', 'iPad Pro M4', 'iPhone Duo'],
      outcomes: [
        'Hiển thị trực quan 3 vùng cấm tải QĐ 23/2018 và giới hạn cầu 13T / 4.5m',
        'Tự động đọc hướng dẫn rẽ bằng giọng nói tiếng Việt (Web Speech TTS)',
        'Chuyển đổi mượt mà giữa Chế độ Tổng Quan và Chế độ Dẫn Đường Trực Tiếp',
      ],
    },
    {
      num: '08',
      title: 'Kiểm Toán ESG & Bảo Mật Zero-Knowledge',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />,
      badge: 'ISO 14083 & AES-256-GCM',
      summary:
        'Kết xuất Báo cáo Kiểm toán ESG 3 Sheet (.XLS), CSV, PDF theo chuẩn ISO 14083 / GLEC v3.2 và cách ly dữ liệu khách hàng bằng mã hóa phong bì AES-256-GCM.',
      details:
        'Mỗi doanh nghiệp B2B sở hữu khóa KMS riêng biệt: ngay cả Quản trị viên hệ thống (Admin) cũng chỉ thấy bản mã mù (admin_can_decrypt = false, 0% quyền giải mã PII).',
      inputSpec: 'Toàn bộ chuyến xe hoàn thành + Hệ số phát thải GLEC v3.2',
      outputSpec: 'Báo cáo Excel 3 Sheet + Bảng kiểm toán mật mã AES-256-GCM',
      proofImage: '/pitch-deck-screenshots/20_slide_composite_4role_enterprise_architecture.png',
      liveUrl: '/portal/audit/',
      liveLabel: 'Mở Phòng Giám Sát Zero-Knowledge (/portal/audit)',
      devices: ['MacBook Pro 16"', 'Windows 11 XPS 16', 'Galaxy Z Fold', 'iPad Pro M4'],
      outcomes: [
        'Cắt giảm 39.2% lượng phát thải CO₂e (tiết kiệm 36.14 kg CO₂e mỗi ca)',
        'Xuất báo cáo Excel 3 Sheet sẵn sàng nộp kiểm toán chuỗi cung ứng xanh',
        'Đảm bảo quyền riêng tư tuyệt đối (Zero-Knowledge BYOK) cho từng doanh nghiệp',
      ],
    },
  ];

  const current = steps[activeStep] ?? steps[0];

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative overflow-hidden border-t border-white/5 bg-slate-950 px-4 py-20 sm:px-6 sm:py-28 lg:px-8 scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-white/5" aria-hidden="true">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-ecomiles-mint via-ecomiles-lime to-ecomiles-sage will-change-transform"
          style={{ scaleX: shouldReduceMotion ? 1 : smoothProgress }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={revealItem}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-ecomiles-lime mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>QUY TRÌNH VẬN HÀNH 8 BƯỚC KHÉP KÍN (CÓ HÌNH ẢNH BẰNG CHỨNG THỰC TẾ)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Từ File Excel Đến <span className="text-ecomiles-lime">Báo Cáo CO₂e Chuẩn Quốc Tế</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Bấm vào từng bước bên dưới để xem đầu vào, đầu ra và giao diện thực tế tương ứng trong hệ thống EcoMiles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <button
              type="button"
              onClick={() => {
                setIsPlaying((p) => !p);
                setProgress(0);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-ecomiles-lime/40 bg-slate-900/90 text-[11px] font-bold text-ecomiles-lime hover:bg-ecomiles-lime hover:text-slate-950 transition-all shadow-lg shadow-ecomiles-lime/10 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Tạm dừng tour 8 bước' : 'Tự động chạy 8 bước'}</span>
            </button>
            {isPlaying && (
              <div className="w-32 h-2 rounded-full bg-slate-800/80 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ecomiles-mint to-ecomiles-lime rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {[
              { label: 'Bàn Điều Phối (/dashboard)', href: '/dashboard/' },
              { label: 'Bản Đồ Xe Tải (/maps)', href: '/maps/?vehicle=0&mode=navigate' },
              { label: 'App Tài Xế (/driver)', href: '/driver/' },
              { label: 'Đối Chứng (/benchmark)', href: '/benchmark/' },
            ].map((app) => (
              <a
                key={app.href}
                href={app.href}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-ecomiles-lime/40 text-[11px] font-semibold text-slate-200 hover:text-ecomiles-lime transition-colors"
              >
                <span>{app.label}</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* 8 Step Selector Buttons (Full Un-Truncated Labels + Reduced-Motion-Safe layoutId) */}
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stepGrid}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {steps.map((item, idx) => (
            <motion.button
              key={item.num}
              type="button"
              onClick={() => {
                setActiveStep(idx);
                setProgress(0);
              }}
              aria-pressed={activeStep === idx}
              variants={stepItem}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
              className={`relative overflow-hidden p-3.5 sm:p-4 rounded-2xl text-left transition-colors duration-200 border flex flex-col justify-between cursor-pointer ${
                activeStep === idx
                  ? 'bg-slate-900 border-ecomiles-lime shadow-lg shadow-ecomiles-lime/10'
                  : 'bg-slate-900/40 border-white/10 hover:bg-slate-900/75 text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeStep === idx && !shouldReduceMotion && (
                <motion.span
                  layoutId="active-workflow-step"
                  className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-ecomiles-lime/80"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  aria-hidden="true"
                />
              )}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-barlow font-bold text-lg ${
                    activeStep === idx ? 'text-ecomiles-lime' : 'text-slate-500'
                  }`}
                >
                  {item.num}
                </span>
                {item.icon}
              </div>
              <div
                className={`text-xs font-bold leading-snug ${
                  activeStep === idx ? 'text-white' : 'text-slate-300'
                }`}
              >
                {item.title}
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Active Step Proof Panel (Left: Input/Output & Outcomes · Right: Real In-App Screenshot Proof) */}
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealItem}
          className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl mb-14"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: REVEAL_EASE }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left 6 Cols: Step Details, Input -> Output Contract, and Step-Specific Outcomes */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                      {current.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-ecomiles-lime bg-ecomiles-lime/10 px-2.5 py-0.5 rounded-full border border-ecomiles-lime/20">
                        Bước {current.num} / 08 · {current.badge}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                        {current.title}
                      </h3>
                    </div>
                  </div>
                </div>
                {/* 7-Device Flagship Hardware Execution Matrix */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                    Thiết bị thực thi ({current.devices.length}/7):
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveMockupDevice('Studio 7 Thiết Bị')}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border border-ecomiles-lime bg-ecomiles-lime text-slate-950 hover:bg-yellow-300 transition-colors cursor-pointer"
                    title="Xem Sân Khấu 7 Thiết Bị Đồng Bộ 2.4K (2400×1120)"
                  >
                    🔍 Sân Khấu 2.4K
                  </button>
                  {[
                    'MacBook Pro 16"',
                    'Windows 11 XPS 16',
                    'Galaxy Z Fold',
                    'iPad Pro M4',
                    'iPhone Duo',
                    'iPhone 18 Pro Max',
                    'Galaxy S26 Ultra',
                  ].map((device) => {
                    const isActiveDevice = current.devices.includes(device);
                    return (
                      <button
                        key={device}
                        type="button"
                        onClick={() => setActiveMockupDevice(device)}
                        title={`Xem ảnh phần cứng 2.4K: ${device}`}
                        className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border transition-colors cursor-pointer ${
                          isActiveDevice
                            ? 'bg-ecomiles-lime/15 hover:bg-ecomiles-lime/25 border-ecomiles-lime/50 text-ecomiles-lime shadow-sm'
                            : 'bg-slate-950/50 hover:bg-slate-900 border-white/5 hover:border-white/20 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isActiveDevice ? '● ' : ''}{device} 🔍
                      </button>
                    );
                  })}
                </div>


                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {current.summary}
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-emerald-400 block mb-1">Cơ Chế Xử Lý Tự Động:</strong>
                  {current.details}
                </div>

                {/* Explicit Input -> Output Contract */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-white/10">
                    <div className="text-[10px] font-bold uppercase text-slate-400">Đầu vào (Input)</div>
                    <div className="font-semibold text-white mt-0.5">{current.inputSpec}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-ecomiles-lime/30">
                    <div className="text-[10px] font-bold uppercase text-ecomiles-lime">Đầu ra (Output)</div>
                    <div className="font-semibold text-ecomiles-lime mt-0.5">{current.outputSpec}</div>
                  </div>
                </div>

                {/* Step-Specific Outcomes */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 space-y-2 text-xs">
                  {current.outcomes.map((out, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-ecomiles-lime shrink-0 mt-0.5" />
                      <span>{out}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <a
                    href={current.liveUrl}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs shadow-md transition-colors"
                  >
                    <span>{current.liveLabel}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Right 6 Cols: Real In-App Screenshot Proof for This Step */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsPlaying(false);
                  setIsZoomed(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsPlaying(false);
                    setIsZoomed(true);
                  }
                }}
                className="group relative lg:col-span-6 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-3 sm:p-5 border border-white/10 hover:border-ecomiles-lime/50 cursor-zoom-in transition-all overflow-hidden"
              >
                <img
                  src={current.proofImage}
                  alt={`Giao diện thực tế Bước ${current.num}: ${current.title}`}
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.75)] group-hover:scale-[1.015] transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-white/20 text-[11px] font-semibold text-slate-200 group-hover:text-ecomiles-lime group-hover:border-ecomiles-lime/60 backdrop-blur-md transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Phóng to (High-DPI)</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Verified Benchmark Comparison Table */}
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
          variants={revealItem}
          className="bg-slate-900/60 rounded-3xl p-6 sm:p-9 border border-white/10"
        >
          <h3 className="text-xl font-bold text-white text-center mb-6">
            Đối Chứng Thực Nghiệm (120 Đơn Chuỗi Lạnh TP.HCM): <span className="text-slate-400">Chia Tuyến Thủ Công</span> vs{' '}
            <span className="text-ecomiles-lime">EcoMiles v2.1</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-4">Chỉ Số Kiểm Định (Cùng Đồ Thị Đường Phố OSRM)</th>
                  <th className="py-3 px-4">Chia Quận Thủ Công + Google Maps</th>
                  <th className="py-3 px-4 text-ecomiles-lime">Thuật Toán EcoMiles (Carbon-Aware ALNS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Tổng quãng đường đội xe</td>
                  <td className="py-3 px-4 text-slate-300">374.4 km (12 chuyến xe rời rạc)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">243.7 km (7 chuyến xe · Giảm 34.9%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Quãng đường &amp; Tỷ lệ chạy rỗng</td>
                  <td className="py-3 px-4 text-slate-300">122.9 km chạy rỗng (32.8%)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">6.5 km chạy rỗng (2.7% · Ghép 21 đơn chiều về)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Vi phạm giờ cấm tải QĐ 23/2018</td>
                  <td className="py-3 px-4 text-rose-400 font-semibold">28 đơn vi phạm khung 06-09h &amp; 16-20h</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">0 vi phạm (Tự động dời lịch &amp; né vùng cấm đỏ)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Phát thải CO₂e (Chuẩn ISO 14083 / GLEC v3.2)</td>
                  <td className="py-3 px-4 text-slate-300">92.21 kg CO₂e (WTW)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">56.07 kg CO₂e (WTW · Giảm 39.2%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 sm:p-8 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl max-h-[92vh] w-full bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center cursor-default"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ecomiles-lime bg-ecomiles-lime/10 px-2.5 py-0.5 rounded-full border border-ecomiles-lime/20">
                    Bước {current.num} / 08 · {current.badge}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white truncate">{current.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-white/10 cursor-pointer"
                  aria-label="Đóng ảnh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full flex-1 overflow-auto flex items-center justify-center">
                <img
                  src={current.proofImage}
                  alt={current.title}
                  className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl border border-white/10 shadow-2xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {activeMockupDevice &&
        HARDWARE_EXECUTION_MOCKUPS[activeMockupDevice] &&
        typeof document !== 'undefined' &&
        (() => {
          const mockupKeys = Object.keys(HARDWARE_EXECUTION_MOCKUPS);
          const total = mockupKeys.length;
          const activeIdx = Math.max(0, mockupKeys.indexOf(activeMockupDevice));
          const activeItem = HARDWARE_EXECUTION_MOCKUPS[activeMockupDevice];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeItem.title}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setActiveMockupDevice(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                      [{activeIdx + 1}/{total}] {activeItem.title}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      {activeItem.resolution} · {activeItem.spec}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMockupDevice(mockupKeys[(activeIdx - 1 + total) % total])
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      ‹ Trước
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMockupDevice(mockupKeys[(activeIdx + 1) % total])
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Tiếp ›
                    </button>
                    <a
                      href={activeItem.file}
                      download
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                    >
                      Tải PNG 2.4K
                    </a>
                    <a
                      href={activeItem.liveHref}
                      className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                    >
                      {activeItem.liveCta} ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveMockupDevice(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      ✕ Đóng
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={activeItem.file}
                    alt={activeItem.title}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {mockupKeys.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveMockupDevice(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        key === activeMockupDevice
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}
    </section>
  );
};
