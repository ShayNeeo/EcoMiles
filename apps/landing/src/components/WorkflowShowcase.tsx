import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  FileCheck2,
  FileSpreadsheet,
  Maximize2,
  Navigation,
  Pause,
  Play,
  Route,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react';

const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

const revealItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: REVEAL_EASE },
  },
};

interface WorkflowStepSpec {
  num: string;
  title: string;
  icon: React.ReactNode;
  badge: string;
  summary: string;
  inputSpec: string;
  outputSpec: string;
  proofImage: string;
  liveUrl: string;
  liveLabel: string;
  outcomes: string[];
}

export const WorkflowShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 4500;
    const tickMs = 50;
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveStep((s) => (s + 1) % 4);
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
        'Tải lên file .XLSX / .CSV (80 - 500 đơn/ca) từ ERP: từ điển cột thông minh tự động nhận diện Mã đơn, Địa chỉ, Quận/Huyện, Trọng lượng (kg) và phát hiện sớm 28 đơn vướng giờ cấm tải QĐ 23/2018.',
      inputSpec: 'File .XLSX / .CSV (120 đơn Chuỗi Lạnh hoặc 80 đơn FMCG)',
      outputSpec: '120 bản ghi chuẩn hóa + Gắn nhãn vùng cấm QĐ 23/2018',
      proofImage: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
      liveUrl: '/dashboard/',
      liveLabel: 'Thử Tải File .XLSX Trên /dashboard',
      outcomes: [
        'Tự động ánh xạ 100% cột tiếng Việt / tiếng Anh không cần sửa tay',
        'Phát hiện tức thì 28 đơn rơi vào khung giờ cấm 06:00-09:00 & 16:00-20:00',
        'Chỉ cần huy động 7/10 xe tải để phục vụ 100% 120 đơn hàng',
      ],
    },
    {
      num: '02',
      title: 'Tối Ưu Lộ Trình & Ghép Đơn Chiều Về (< 1s)',
      icon: <Route className="w-5 h-5 text-emerald-400" />,
      badge: 'Né Giờ Cấm & Backhaul',
      summary:
        'Thuật toán Carbon-Aware ALNS gom cụm theo quận, tự động dời lịch né vùng cấm tải QĐ 23/2018 & cầu 13T, đồng thời ghép 21 đơn thu hồi hàng chiều về kho Tân Bình.',
      inputSpec: '120 đơn hàng + Đồ thị đường phố thật TP.HCM',
      outputSpec: 'Lộ trình 243.7 km (-34.9% km · 0 lỗi QĐ 23 · 2.7% chạy rỗng)',
      proofImage: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
      liveUrl: '/benchmark/',
      liveLabel: 'Kiểm Chứng Trên Buồng Đôi EVSIM (/benchmark)',
      outcomes: [
        'Tiết giảm 130.7 km mỗi ca vận hành (-34.9% tổng quãng đường)',
        'Khử 28/28 lỗi vi phạm giờ cấm QĐ 23/2018 (tránh phạt 5.000.000đ/lỗi)',
        'Hạ tỷ lệ xe chạy rỗng từ 32.8% (122.9 km) xuống chỉ còn 2.7% (6.5 km)',
      ],
    },
    {
      num: '03',
      title: 'Đồng Bộ App Tài Xế & Dẫn Đường ($0 API)',
      icon: <Navigation className="w-5 h-5 text-emerald-300" />,
      badge: 'Thực Địa 2 Chặng ($0 API)',
      summary:
        'Phát hành lộ trình xuống điện thoại tài xế (/driver) và bản đồ dẫn đường xe tải giọng nói tiếng Việt (/maps): xe >500kg dùng bản đồ OpenTruck né đường cấm, xe <=500kg mở thẳng Google Maps Waypoints miễn phí.',
      inputSpec: 'Lộ trình 7 xe tải đã phê duyệt trên trung tâm điều phối',
      outputSpec: 'Dẫn đường trực tiếp (/maps) & Google Maps Waypoints ($0 API)',
      proofImage: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
      liveUrl: '/driver/',
      liveLabel: 'Trải Nghiệm App Tài Xế (/driver)',
      outcomes: [
        '0đ chi phí bản đồ API hàng tháng (tiết kiệm 7.500.000đ/tháng phí Google API)',
        'Thuyết minh giọng nói tiếng Việt đọc tên đường rẽ và cảnh báo cầu 13T / 4.5m',
        'Cập nhật trạng thái Đã đến / Đã giao xong về trung tâm trong < 50ms',
      ],
    },
    {
      num: '04',
      title: 'Xuất Báo Cáo Kiểm Toán ESG 3 Sheet',
      icon: <FileCheck2 className="w-5 h-5 text-ecomiles-lime" />,
      badge: 'Chuẩn ISO 14083 / GLEC v3.2',
      summary:
        'Tính chính xác phát thải CO₂e theo tải trọng thực tế sau từng điểm dỡ hàng và kết xuất tự động Báo cáo Excel 3 Sheet (.XLS), CSV, PDF phục vụ kiểm toán chuỗi cung ứng xanh.',
      inputSpec: 'Toàn bộ chuyến xe hoàn thành + Hệ số phát thải GLEC v3.2',
      outputSpec: 'Báo cáo Excel 3 Sheet (-39.2% CO₂e · Bảo mật NĐ 13/2023)',
      proofImage: '/pitch-deck-screenshots/20_slide_composite_4role_enterprise_architecture.png',
      liveUrl: '/portal/audit/',
      liveLabel: 'Mở Cổng Kiểm Toán ESG (/portal/audit)',
      outcomes: [
        'Cắt giảm 39.2% lượng phát thải CO₂e (tiết kiệm 36.14 kg CO₂e mỗi ca)',
        'Xuất báo cáo Excel 3 Sheet sẵn sàng nộp kiểm toán chuỗi cung ứng xanh',
        'Cách ly dữ liệu khách hàng độc lập cho từng doanh nghiệp B2B',
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
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            4 Bước Khép Kín Từ File Excel Đến <span className="text-ecomiles-lime">Báo Cáo ESG</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Bấm vào từng bước bên dưới để xem đầu vào, đầu ra và giao diện vận hành thực tế trong hệ thống EcoMiles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => {
                setIsPlaying((p) => !p);
                setProgress(0);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-ecomiles-lime/40 bg-slate-900 text-xs font-bold text-ecomiles-lime hover:bg-ecomiles-lime hover:text-slate-950 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Tạm dừng trình diễn' : 'Tự động chạy 4 bước'}</span>
            </button>
            {isPlaying && (
              <div className="w-32 h-2 rounded-full bg-slate-800 border border-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ecomiles-mint to-ecomiles-lime rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* 4 Step Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {steps.map((item, idx) => (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                setActiveStep(idx);
                setProgress(0);
              }}
              aria-pressed={activeStep === idx}
              className={`relative overflow-hidden p-4 rounded-2xl text-left transition-colors duration-200 border flex flex-col justify-between cursor-pointer ${
                activeStep === idx
                  ? 'bg-slate-900 border-ecomiles-lime shadow-lg shadow-black/40'
                  : 'bg-slate-900/45 border-white/10 hover:bg-slate-900/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-barlow font-extrabold text-xl ${
                    activeStep === idx ? 'text-ecomiles-lime' : 'text-slate-400'
                  }`}
                >
                  Bước {item.num}
                </span>
                {item.icon}
              </div>
              <div className="text-sm font-bold leading-snug text-white">
                {item.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Proof Panel (Flat Internal Structure — Zero Nested Sub-Cards) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl shadow-black/50 mb-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: REVEAL_EASE }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left 6 Cols: Step Details & Outcomes */}
              <div className="lg:col-span-6 space-y-5">
                <div className="pb-4 border-b border-white/10">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ecomiles-lime">
                    Bước {current.num} / 04 · {current.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    {current.title}
                  </h3>
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {current.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-white/10 text-xs sm:text-sm">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-300">Đầu vào (Input)</div>
                    <div className="font-semibold text-white mt-1">{current.inputSpec}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-ecomiles-lime">Đầu ra (Output)</div>
                    <div className="font-semibold text-ecomiles-lime mt-1">{current.outputSpec}</div>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  {current.outcomes.map((out, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-slate-200 font-medium">
                      <Check className="w-4 h-4 text-ecomiles-lime shrink-0 mt-0.5" />
                      <span>{out}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a
                    href={current.liveUrl}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-black/40 transition-colors"
                  >
                    <span>{current.liveLabel}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Right 6 Cols: In-App Screenshot Proof */}
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
                  className="max-h-[380px] w-auto max-w-full object-contain rounded-xl shadow-2xl group-hover:scale-[1.015] transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-white/20 text-xs font-semibold text-slate-200 group-hover:text-ecomiles-lime">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Phóng to</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Verified Benchmark Comparison Table */}
        <div className="bg-slate-900/60 rounded-3xl p-6 sm:p-9 border border-white/10">
          <h3 className="text-xl font-bold text-white text-center mb-6">
            Đối Chứng Thực Nghiệm (120 Đơn Chuỗi Lạnh TP.HCM): <span className="text-slate-300">Chia Tuyến Thủ Công</span> vs{' '}
            <span className="text-ecomiles-lime">EcoMiles v2.1</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b border-white/10 text-slate-300">
                  <th className="py-3 px-4">Chỉ Số Kiểm Định (Cùng Đồ Thị Đường Phố TP.HCM)</th>
                  <th className="py-3 px-4">Chia Quận Thủ Công + Google Maps</th>
                  <th className="py-3 px-4 text-ecomiles-lime">Thuật Toán EcoMiles (Carbon-Aware ALNS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Tổng quãng đường đội xe</td>
                  <td className="py-3 px-4">374.4 km (12 chuyến xe rời rạc)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">243.7 km (7 chuyến xe · Giảm 34.9%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Quãng đường &amp; Tỷ lệ chạy rỗng</td>
                  <td className="py-3 px-4">122.9 km chạy rỗng (32.8%)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">6.5 km chạy rỗng (2.7% · Ghép 21 đơn chiều về)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Vi phạm giờ cấm tải QĐ 23/2018</td>
                  <td className="py-3 px-4 text-rose-400 font-semibold">28 đơn vi phạm khung 06-09h &amp; 16-20h</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">0 vi phạm (Tự động dời lịch &amp; né vùng cấm đỏ)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Phát thải CO₂e (Chuẩn ISO 14083 / GLEC v3.2)</td>
                  <td className="py-3 px-4">92.21 kg CO₂e (WTW)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">56.07 kg CO₂e (WTW · Giảm 39.2%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 backdrop-blur-xl p-4 sm:p-8 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl max-h-[92vh] w-full bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center cursor-default"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ecomiles-lime bg-ecomiles-lime/10 px-2.5 py-1 rounded-full border border-ecomiles-lime/20">
                    Bước {current.num} / 04 · {current.badge}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white truncate">{current.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-white/10 cursor-pointer"
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
    </section>
  );
};
