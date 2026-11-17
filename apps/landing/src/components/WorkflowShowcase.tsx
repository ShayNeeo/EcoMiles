import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
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
  inputSpec: string;
  outputSpec: string;
  proofImage: string;
  liveUrl: string;
  liveLabel: string;
  chips: string[];
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
      title: 'Nạp Excel đơn hàng',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      badge: 'Input ERP / CSV',
      inputSpec: '500 đơn 2,5T + 2.395 đơn tạp hóa',
      outputSpec: 'Tách đơn >2,5T · Gắn nhãn P.106 & QĐ 23',
      proofImage: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
      liveUrl: '/dashboard/',
      liveLabel: 'Thử tải Excel',
      chips: ['Tự đọc cột Việt/Anh', 'Bắt 235 ca giờ cấm', 'Nhận diện Van <950kg'],
    },
    {
      num: '02',
      title: 'EcoALNS + Né giờ cấm',
      icon: <Route className="w-5 h-5" />,
      badge: '642 ma trận OSRM',
      inputSpec: 'Mạng lưới đường thật TP.HCM & Hà Nội',
      outputSpec: '−30,5% đến −50,8% km · 0 lỗi QĐ 23',
      proofImage: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
      liveUrl: '/benchmark/',
      liveLabel: 'Mở đối chứng EVSIM',
      chips: ['543 → 328 chuyến 2,5T', 'Ghép 91 điểm bán (−36,4%)', 'Tránh phạt NĐ 168 4-6M'],
    },
    {
      num: '03',
      title: 'Đẩy lệnh xuống App tài xế',
      icon: <Navigation className="w-5 h-5" />,
      badge: '$0 phí Map API',
      inputSpec: 'Lộ trình từng biển số đã kiểm tải',
      outputSpec: 'Dẫn đường giọng nói + Ghép chiều về',
      proofImage: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
      liveUrl: '/driver/',
      liveLabel: 'Mở App Tài Xế',
      chips: ['Xe tải: Bản đồ né cầu 13T', 'Van: Google Waypoints', 'Giới hạn ≤ 4h lái'],
    },
    {
      num: '04',
      title: 'Xuất sổ ESG 3 Sheet',
      icon: <FileCheck2 className="w-5 h-5" />,
      badge: 'GLEC v3.2 · NĐ 13',
      inputSpec: 'Dữ liệu km thực & tải trọng từng chặng',
      outputSpec: '−1.822 L dầu · −4,88 tấn CO₂e TTW',
      proofImage: '/pitch-deck-screenshots/20_slide_composite_4role_enterprise_architecture.png',
      liveUrl: '/portal/audit/',
      liveLabel: 'Mở Cổng Kiểm Toán',
      chips: ['Excel 3 Sheet + CSV', 'Mã hóa Multi-Tenant', 'Sẵn sàng kiểm kê 31/3/2027'],
    },
  ];

  const current = steps[activeStep] ?? steps[0];

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative overflow-hidden border-b-4 border-[#003049] em-grid-varden text-[#003049] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 scroll-mt-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-[#D4BF94]" aria-hidden="true">
        <motion.div
          className="h-full origin-left bg-[#C1121F] will-change-transform"
          style={{ scaleX: shouldReduceMotion ? 1 : smoothProgress }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-5 border-b-2 border-[#003049]">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#003049] tracking-tight leading-tight">
            4 bước vận hành trên trình duyệt
          </h2>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold text-[#FDF0D5] bg-[#003049] hover:bg-[#C1121F] transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Tạm dừng' : 'Chạy tự động'}</span>
            </button>
            {isPlaying && (
              <div className="w-24 h-2 rounded bg-[#D4BF94] overflow-hidden">
                <div className="h-full bg-[#C1121F] transition-all duration-75" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* 4 Step Graphic Tab Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
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
                className={`p-4 rounded-xl text-left transition-all border-2 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#003049] border-[#C1121F] text-[#FDF0D5] shadow-lg'
                    : 'bg-[#F8E7C4] border-[#003049]/30 text-[#003049] hover:border-[#003049]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-base font-black ${isSelected ? 'text-[#669BBC]' : 'text-[#AE1F23]'}`}>
                    {item.num}
                  </span>
                  {item.icon}
                </div>
                <div className="font-display text-sm sm:text-base font-extrabold leading-tight">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Step Proof Panel */}
        <div className="bg-[#003049] text-[#FDF0D5] rounded-2xl p-6 sm:p-8 border-2 border-[#003049] shadow-xl mb-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: REVEAL_EASE }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-6 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-[#C1121F] font-mono text-xs font-extrabold uppercase text-[#FDF0D5]">
                    Bước {current.num} · {current.badge}
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-black text-[#FDF0D5]">
                  {current.title}
                </h3>

                {/* Graphic Flow Banner: Input -> Engine -> Output */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-[#002033] border border-[#669BBC]/40 p-3.5">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#669BBC]">ĐẦU VÀO</div>
                    <div className="font-bold text-[#FDF0D5] mt-1">{current.inputSpec}</div>
                  </div>
                  <div className="rounded-lg bg-[#FDF0D5] p-3.5 text-[#003049]">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#AE1F23]">KẾT QUẢ THẬT</div>
                    <div className="font-extrabold mt-1">{current.outputSpec}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {current.chips.map((chip) => (
                    <span
                      key={chip}
                      className="px-3 py-1.5 rounded-md bg-[#669BBC] text-[#003049] font-bold text-xs"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <a
                  href={current.liveUrl}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-xs sm:text-sm transition-colors"
                >
                  <span>{current.liveLabel}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

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
                className="group relative lg:col-span-6 flex items-center justify-center bg-[#002033] rounded-xl p-3 border-2 border-[#669BBC]/60 hover:border-[#C1121F] cursor-zoom-in transition-all"
              >
                <img
                  src={current.proofImage}
                  alt={`Giao diện Bước ${current.num}: ${current.title}`}
                  className="max-h-[340px] w-auto max-w-full object-contain rounded-lg group-hover:scale-[1.01] transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FDF0D5] text-[#003049] font-mono text-[11px] font-bold shadow">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>ZOOM</span>
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Real Pilot Empirical Comparison Matrix (2.895 orders) */}
        <div className="bg-[#F8E7C4] rounded-2xl p-6 sm:p-8 border-2 border-[#003049] shadow-sm">
          <h3 className="font-display text-lg sm:text-xl font-black text-[#003049] mb-4 flex flex-wrap items-center justify-between gap-2">
            <span>Đối chứng thực nghiệm trên 2.895 đơn hàng thật tại TP.HCM (642 ma trận OSRM)</span>
            <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#DCFCE7] border border-[#15803D]/35 text-[#15803D]">
              0 VI PHẠM QĐ 23/2018
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b-2 border-[#003049] text-[#003049] font-mono text-xs uppercase">
                  <th className="py-2.5 px-3">Bộ dữ liệu thật</th>
                  <th className="py-2.5 px-3">Google Maps / Cũ</th>
                  <th className="py-2.5 px-3">EcoALNS + Luật 2025-2026</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4BF94] text-[#003049]">
                <tr>
                  <td className="py-3 px-3 font-bold">Đồ uống 2,5T (500 đơn / 88 ngày)</td>
                  <td className="py-3 px-3 text-[#B91C1C] font-semibold">14.178 km · 543 chuyến · 235 lỗi QĐ 23</td>
                  <td className="py-3 px-3 font-black text-[#15803D]">9.857 km (−30,5% · −22,3% vs CSV) · 328 chuyến · 0 lỗi</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold">Tạp hóa #01 · Van &lt;950kg (798 đơn / 161 ngày)</td>
                  <td className="py-3 px-3 text-[#B91C1C] font-semibold">13.441 km (Maps) · 8.940 km (Gom theo giờ)</td>
                  <td className="py-3 px-3 font-black text-[#15803D]">6.611 km (−50,8% vs Maps · −26,0% vs giờ)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold">91 Cửa hàng toàn mạng (2.395 đơn / 393 ngày)</td>
                  <td className="py-3 px-3 text-[#B91C1C] font-semibold">46.376 km đơn lẻ · 47.232 km nối giờ (+1,8%)</td>
                  <td className="py-3 px-3 font-black text-[#15803D]">29.508 km (−36,4%) · Tiết kiệm 1.822 L dầu &amp; 4,88 tấn CO₂e</td>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#002033]/85 backdrop-blur-md p-4 sm:p-8 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[92vh] w-full bg-[#FDF0D5] border-2 border-[#003049] rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center cursor-default"
            >
              <div className="w-full flex items-center justify-between pb-3 border-b border-[#D4BF94] mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#FDF0D5] bg-[#C1121F] px-2.5 py-1 rounded">
                    Bước {current.num} · {current.badge}
                  </span>
                  <h4 className="font-display text-sm sm:text-base font-extrabold text-[#003049] truncate">{current.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 rounded-lg bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5] transition-colors cursor-pointer"
                  aria-label="Đóng ảnh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full flex-1 overflow-auto flex items-center justify-center">
                <img
                  src={current.proofImage}
                  alt={current.title}
                  className="max-h-[76vh] w-auto max-w-full object-contain rounded-lg border-2 border-[#003049]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
