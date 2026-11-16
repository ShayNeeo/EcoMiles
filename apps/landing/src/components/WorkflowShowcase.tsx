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
      title: 'Nhập bảng tính đơn hàng (.XLSX)',
      icon: <FileSpreadsheet className="w-5 h-5 text-[#101418]" />,
      badge: 'Đầu vào ERP / Excel',
      summary:
        'Tải lên file .XLSX / .CSV đơn hàng: hệ thống tự động nhận diện mã đơn, địa chỉ, tải trọng và cảnh báo sớm các đơn vướng giờ cấm tải QĐ 23/2018.',
      inputSpec: 'File .XLSX / .CSV (120 đơn Chuỗi Lạnh hoặc 80 đơn FMCG)',
      outputSpec: '120 bản ghi chuẩn hóa + Gắn nhãn vùng cấm QĐ 23/2018',
      proofImage: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
      liveUrl: '/dashboard/',
      liveLabel: 'Thử tải file trên bảng điều khiển',
      outcomes: [
        'Tự động nhận diện cột tiếng Việt / tiếng Anh không cần chỉnh sửa tay',
        'Phát hiện tức thì 28 đơn rơi vào khung giờ cấm 06:00-09:00 & 16:00-20:00',
        'Huy động 7/10 xe tải để phục vụ 100% 120 đơn hàng',
      ],
    },
    {
      num: '02',
      title: 'Tối ưu lộ trình & Ghép đơn chiều về (< 1s)',
      icon: <Route className="w-5 h-5 text-[#101418]" />,
      badge: 'Né giờ cấm & Backhaul',
      summary:
        'Thuật toán gom cụm theo quận, tự động dời lịch né vùng cấm tải QĐ 23/2018 & cầu 13T, đồng thời ghép 21 đơn thu hồi hàng chiều về kho.',
      inputSpec: '120 đơn hàng + Đồ thị đường phố thật TP.HCM',
      outputSpec: 'Lộ trình 243,7 km (-34,9% km · 0 vi phạm · 2,7% chạy rỗng)',
      proofImage: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
      liveUrl: '/benchmark/',
      liveLabel: 'Mở phòng đối chứng EVSIM',
      outcomes: [
        'Tiết giảm 130,7 km mỗi ca vận hành (-34,9% tổng quãng đường)',
        'Khử 28/28 lỗi vi phạm giờ cấm QĐ 23/2018, QĐ 01/2026 & biển P.106a QCVN 41:2024 (tránh phạt NĐ 168/2024: 4-6 triệu đ + trừ 2 điểm GPLX)',
        'Hạ tỷ lệ xe chạy rỗng từ 32,8% xuống chỉ còn 2,7%',
      ],
    },
    {
      num: '03',
      title: 'Đồng bộ App tài xế & Dẫn đường ($0 API)',
      icon: <Navigation className="w-5 h-5 text-[#101418]" />,
      badge: 'Thực địa 2 chặng ($0 API)',
      summary:
        'Phát hành lộ trình xuống điện thoại tài xế và bản đồ dẫn đường xe tải giọng nói tiếng Việt: né đường cấm nội đô, không tốn phí Google API.',
      inputSpec: 'Lộ trình 7 xe tải đã duyệt từ trung tâm điều phối',
      outputSpec: 'Bản đồ dẫn đường trực tiếp & Google Maps Waypoints ($0 API)',
      proofImage: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
      liveUrl: '/driver/',
      liveLabel: 'Mở ứng dụng tài xế',
      outcomes: [
        'Tiết kiệm 7.500.000đ/tháng chi phí bản đồ API',
        'Thuyết minh giọng nói tiếng Việt đọc tên đường rẽ và cảnh báo cầu 13T',
        'Cập nhật trạng thái giao hàng tức thì về trung tâm điều phối',
      ],
    },
    {
      num: '04',
      title: 'Xuất báo cáo kiểm toán ESG 3 Sheet',
      icon: <FileCheck2 className="w-5 h-5 text-[#101418]" />,
      badge: 'Chuẩn ISO 14083 / GLEC v3.2',
      summary:
        'Ước tính phát thải CO₂e theo tải trọng thực sau từng điểm dỡ hàng (mô hình GLX-HDT-v1) và kết xuất tự động sổ cái Excel 3 Sheet hỗ trợ đối soát Scope 3.',
      inputSpec: 'Toàn bộ chuyến xe hoàn thành + Hệ số tham chiếu GLEC v3.2',
      outputSpec: 'Sổ cái Excel 3 Sheet (-32,2% CO₂e · Bảo mật NĐ 13/2023)',
      proofImage: '/pitch-deck-screenshots/20_slide_composite_4role_enterprise_architecture.png',
      liveUrl: '/portal/audit/',
      liveLabel: 'Mở cổng kiểm toán ESG',
      outcomes: [
        'Cắt giảm 32,2% CO₂e TTW (từ 83,57 kg xuống 56,66 kg CO₂e mỗi ca)',
        'Xuất sổ cái dữ liệu đầu vào hỗ trợ thẩm định khí nhà kính & Scope 3',
        'Cách ly dữ liệu khách hàng độc lập cho từng doanh nghiệp B2B',
      ],
    },
  ];

  const current = steps[activeStep] ?? steps[0];

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative overflow-hidden border-t border-slate-200/80 bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8 scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-slate-200" aria-hidden="true">
        <motion.div
          className="h-full origin-left bg-[#101418] will-change-transform"
          style={{ scaleX: shouldReduceMotion ? 1 : smoothProgress }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101418] tracking-tight leading-tight">
            4 bước vận hành từ bảng tính đến báo cáo ESG
          </h2>

          <p className="mt-4 text-base text-[#5B5F66] leading-relaxed">
            Quy trình khép kín giúp doanh nghiệp tự động hóa từ khâu tiếp nhận đơn hàng đến phân bổ xe và nghiệm thu báo cáo phát thải.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#101418] bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Tạm dừng tự động chạy' : 'Xem tự động 4 bước'}</span>
            </button>
            {isPlaying && (
              <div className="w-32 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#101418] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 4 Step Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
          {steps.map((item, idx) => {
            const isSelected = activeStep === idx;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  setActiveStep(idx);
                  setProgress(0);
                }}
                aria-pressed={isSelected}
                className={`relative overflow-hidden p-4 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/70 border-2 border-[#101418] text-[#101418] shadow-sm'
                    : 'bg-[#F6F1E7] border-slate-200 text-[#5B5F66] hover:bg-slate-50 hover:text-[#101418]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-barlow font-extrabold text-lg ${
                      isSelected ? 'text-[#101418]' : 'text-slate-400'
                    }`}
                  >
                    Bước {item.num}
                  </span>
                  {item.icon}
                </div>
                <div className="text-sm font-bold leading-snug text-[#101418]">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Proof Panel */}
        <div className="bg-[#F6F1E7] rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-12">
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
              <div className="lg:col-span-6 space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#101418] bg-emerald-100/60 px-2.5 py-1 rounded-full border border-emerald-200">
                    Bước {current.num} / 04 · {current.badge}
                  </span>
                  <h3 className="text-2xl font-bold text-[#101418] mt-2.5">
                    {current.title}
                  </h3>
                </div>

                <p className="text-sm sm:text-base text-[#5B5F66] leading-relaxed">
                  {current.summary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-y border-slate-200 text-xs sm:text-sm">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-500">Đầu vào (Input)</div>
                    <div className="font-semibold text-[#101418] mt-1">{current.inputSpec}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-[#101418]">Đầu ra (Output)</div>
                    <div className="font-bold text-[#101418] mt-1">{current.outputSpec}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  {current.outcomes.map((out, i) => (
                    <div key={i} className="flex items-start gap-2 text-[#334155]">
                      <Check className="w-4 h-4 text-[#0B7A3B] shrink-0 mt-0.5" />
                      <span>{out}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a
                    href={current.liveUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#101418] hover:bg-[#1B45D7] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
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
                className="group relative lg:col-span-6 flex flex-col items-center justify-center bg-white rounded-xl p-3 sm:p-4 border border-slate-200 hover:border-emerald-600/40 cursor-zoom-in transition-all shadow-sm"
              >
                <img
                  src={current.proofImage}
                  alt={`Giao diện thực tế Bước ${current.num}: ${current.title}`}
                  className="max-h-[360px] w-auto max-w-full object-contain rounded-lg group-hover:scale-[1.01] transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/95 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                  <Maximize2 className="w-3.5 h-3.5 text-[#101418]" />
                  <span>Phóng to</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Verified Benchmark Comparison Table */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg sm:text-xl font-bold text-[#101418] text-center mb-6">
            Đối chứng thực nghiệm (120 đơn Chuỗi Lạnh TP.HCM): <span className="text-slate-500 font-normal">Thủ công</span> vs{' '}
            <span className="text-[#101418]">EcoMiles</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#101418]">
                  <th className="py-3 px-4 rounded-l-lg">Chỉ số kiểm định</th>
                  <th className="py-3 px-4">Chia quận thủ công</th>
                  <th className="py-3 px-4 text-[#101418] font-bold rounded-r-lg">Thuật toán EcoMiles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155]">
                <tr>
                  <td className="py-3 px-4 font-bold text-[#101418]">Tổng quãng đường đội xe</td>
                  <td className="py-3 px-4">374,4 km (12 chuyến xe)</td>
                  <td className="py-3 px-4 font-bold text-[#101418]">243,7 km (7 chuyến · Giảm 34,9%)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#101418]">Quãng đường &amp; Tỷ lệ chạy rỗng</td>
                  <td className="py-3 px-4">122,9 km chạy rỗng (32,8%)</td>
                  <td className="py-3 px-4 font-bold text-[#101418]">6,5 km chạy rỗng (2,7% · Ghép 21 đơn chiều về)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#101418]">Vi phạm giờ cấm tải QĐ 23/2018</td>
                  <td className="py-3 px-4 text-rose-600 font-medium">28 đơn vi phạm giờ cao điểm</td>
                  <td className="py-3 px-4 font-bold text-[#101418]">0 vi phạm (Tự động né 100% giờ cấm)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#101418]">Ước tính CO₂e TTW (GLX-HDT-v1 / GLEC v3.2)</td>
                  <td className="py-3 px-4">83,57 kg CO₂e</td>
                  <td className="py-3 px-4 font-bold text-[#101418]">56,66 kg CO₂e (Giảm 32,2%)</td>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 sm:p-8 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[92vh] w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center cursor-default"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#101418] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Bước {current.num} / 04 · {current.badge}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-[#101418] truncate">{current.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  aria-label="Đóng ảnh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full flex-1 overflow-auto flex items-center justify-center">
                <img
                  src={current.proofImage}
                  alt={current.title}
                  className="max-h-[76vh] w-auto max-w-full object-contain rounded-lg border border-slate-200 shadow-md"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
