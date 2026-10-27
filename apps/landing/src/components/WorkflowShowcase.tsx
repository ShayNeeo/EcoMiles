import React, { useRef, useState } from 'react';
import { Layers, FileSpreadsheet, Truck, MapPin, Route, RefreshCw, Globe2, Navigation, FileCheck2, Check } from 'lucide-react';
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
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const stepItem = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: REVEAL_EASE },
  },
};

export const WorkflowShowcase: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
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

  const steps = [
    {
      num: '01',
      title: 'Tiếp Nhận Đơn Hàng',
      icon: <FileSpreadsheet className="w-5 h-5 text-ecomiles-lime" />,
      summary: 'Nhập nhanh danh sách hơn 80 đơn hàng từ bảng tính hoặc hệ thống đang sử dụng.',
      details:
        'Hệ thống tự động đọc và chuẩn hóa địa chỉ, khối lượng hàng, khung giờ cam kết (Time Windows) và yêu cầu bảo quản hàng hóa.',
      badge: 'Đầu Vào Đơn Hàng',
    },
    {
      num: '02',
      title: 'Khai Báo Đội Phương Tiện',
      icon: <Truck className="w-5 h-5 text-emerald-400" />,
      summary: 'Khai báo thông số kỹ thuật 10+ xe: tải trọng 500kg - 2 tấn, loại nhiên liệu.',
      details:
        'Ghi nhận vị trí xuất phát hiện tại của xe, mức tiêu thụ lít/km và thời gian làm việc quy định của tài xế theo luật giao thông 2024.',
      badge: 'Cấu Hình Đội Xe',
    },
    {
      num: '03',
      title: 'Tự Động Phân Cụm Địa Lý',
      icon: <MapPin className="w-5 h-5 text-emerald-300" />,
      summary: 'Thuật toán gom nhóm các điểm giao gần nhau thành cụm khoa học.',
      details:
        'Ví dụ: Cụm Q.1 - Q.3 (15 đơn), Cụm Bình Thạnh - Phú Nhuận (18 đơn), Cụm Q.7 - Nhà Bè (17 đơn), Cụm Thủ Đức (20 đơn).',
      badge: 'Tự Động Gom Nhóm',
    },
    {
      num: '04',
      title: 'Tối Ưu Tuyến & Phân Bổ Xe',
      icon: <Route className="w-5 h-5 text-ecomiles-lime" />,
      summary: 'Tính tuyến đường phù hợp cho toàn bộ đơn hàng chỉ trong vài giây.',
      details:
        'Tự động phân xe phù hợp nhất cho từng cụm, tối ưu thứ tự điểm giao để không chạy lặp vòng và ưu tiên đơn có khung giờ giao gấp.',
      badge: 'Tự Động Sắp Tuyến',
    },
    {
      num: '05',
      title: 'Tự Động Ghép Đơn Chiều Về',
      icon: <RefreshCw className="w-5 h-5 text-emerald-400" />,
      summary: 'Tìm kiếm đơn lấy hàng trên cung đường quay về kho.',
      details:
        'Ví dụ: Xe giao xong tại Thủ Đức lúc 14:00, hệ thống phát hiện đơn lấy từ Thủ Đức về Bình Thạnh → đề xuất ghép cho xe thực hiện trên đường quay về.',
      badge: 'Ghép Đơn Chiều Về',
    },
    {
      num: '06',
      title: 'Tài Xế Nhận Tuyến Trên Web',
      icon: <Globe2 className="w-5 h-5 text-emerald-300" />,
      summary: 'Lộ trình được gửi đến giao diện web responsive dành cho tài xế.',
      details:
        'Tài xế mở đường dẫn trên trình duyệt để xem chỉ dẫn từng chặng, cập nhật trạng thái và lưu ảnh hoặc chữ ký xác nhận sau khi giao.',
      badge: 'Web Dành Cho Tài Xế',
    },
    {
      num: '07',
      title: 'Theo Dõi Vị Trí & Tránh Kẹt Xe',
      icon: <Navigation className="w-5 h-5 text-ecomiles-lime" />,
      summary: 'Người quản lý theo dõi toàn bộ đội xe trên màn hình bản đồ.',
      details:
        'Theo dõi xe đang ở đâu, tiến độ giao bao nhiêu đơn, xe nào trễ hẹn. Nếu tuyến phía trước ùn tắc, hệ thống gợi ý tuyến thay thế ngay.',
      badge: 'Màn Hình Điều Hành',
    },
    {
      num: '08',
      title: 'Báo Cáo Chuyến & Đo Lường CO₂',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />,
      summary: 'Tự động tổng hợp quãng đường, nhiên liệu và lượng phát thải sau mỗi chuyến.',
      details:
        'So sánh trực tiếp km thực tế, lượng dầu tiết kiệm, số kg CO₂ cắt giảm và đối chiếu rõ nét mức tiết kiệm so với phương án thủ công cũ.',
      badge: 'Báo Cáo Sau Chuyến',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative overflow-hidden border-t border-white/5 bg-slate-950 px-4 py-24 sm:px-6 sm:py-32 lg:px-8 scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-white/5" aria-hidden="true">
        <motion.div
          className="h-full origin-left bg-gradient-to-r from-ecomiles-mint via-ecomiles-lime to-ecomiles-sage will-change-transform"
          style={{ scaleX: shouldReduceMotion ? 1 : smoothProgress }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.45 }}
          variants={revealItem}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-ecomiles-lime mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>QUY TRÌNH VẬN HÀNH 8 BƯỚC KHÉP KÍN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Từ Nhận Đơn Đến <span className="text-ecomiles-lime">Báo Cáo CO₂ Chuẩn Hóa</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Tình huống thực tế: Doanh nghiệp phân phối thực phẩm tại TP.HCM xử lý 80 đơn hàng mỗi ngày với 10 phương tiện qua hệ thống EcoMiles.
          </p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={stepGrid}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10"
        >
          {steps.map((item, idx) => (
            <motion.button
              key={idx}
              onClick={() => setActiveStep(idx)}
              aria-pressed={activeStep === idx}
              variants={stepItem}
              whileHover={shouldReduceMotion ? undefined : { y: -3 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
              className={`relative overflow-hidden p-3.5 sm:p-4 rounded-2xl text-left transition-colors duration-200 border flex flex-col justify-between cursor-pointer ${
                activeStep === idx
                  ? 'bg-slate-900 border-ecomiles-lime shadow-lg shadow-ecomiles-lime/10'
                  : 'bg-slate-900/40 border-white/5 hover:bg-slate-900/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {activeStep === idx && (
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
                className={`text-xs font-bold truncate ${
                  activeStep === idx ? 'text-white' : 'text-slate-300'
                }`}
              >
                {item.title}
              </div>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealItem}
          className="min-h-[360px] bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:min-h-[320px] sm:p-10 lg:min-h-[285px] border border-white/10 shadow-2xl mb-16"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: REVEAL_EASE }}
            >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-inner">
                {steps[activeStep].icon}
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-ecomiles-lime bg-ecomiles-lime/10 px-2.5 py-0.5 rounded-full border border-ecomiles-lime/20">
                  Bước {steps[activeStep].num} • {steps[activeStep].badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {steps[activeStep].title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>Bước {activeStep + 1} / 8</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">
                Bước Này Làm Gì:
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                {steps[activeStep].summary}
              </p>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-400 block mb-1">Hệ Thống Thực Hiện:</strong>
                {steps[activeStep].details}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3 text-xs">
              <div className="font-bold text-ecomiles-lime uppercase tracking-wider text-[11px]">
                Giá Trị Đạt Được Tại Bước Này
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rút ngắn 80 - 90% thời gian điều phối mỗi ngày</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Giảm sai sót phát sinh khi phân bổ bằng tay</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thông tin thống nhất giữa màn hình quản lý và web tài xế</span>
              </div>
            </div>
          </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
          variants={revealItem}
          className="bg-slate-900/60 rounded-3xl p-6 sm:p-9 border border-white/10"
        >
          <h3 className="text-xl font-bold text-white text-center mb-6">
            So Sánh Hiệu Quả: <span className="text-slate-400">Phương Án Cũ</span> và <span className="text-ecomiles-lime">EcoMiles</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-3 px-4">Hạng Mục</th>
                  <th className="py-3 px-4">Phương Án Cũ (Làm thủ công trên bảng tính)</th>
                  <th className="py-3 px-4 text-ecomiles-lime">Phương Án Tối Ưu EcoMiles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Thời gian lập tuyến</td>
                  <td className="py-3 px-4 text-slate-300">1.5 - 2 giờ/ngày (Phụ thuộc kinh nghiệm)</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">10 - 20 phút, giảm 80 - 90% thời gian điều phối</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Tổng quãng đường di chuyển</td>
                  <td className="py-3 px-4 text-slate-300">Chồng chéo, nhiều km thừa</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Cắt giảm 20 - 30% tổng km</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Tỷ lệ xe chạy rỗng chiều về</td>
                  <td className="py-3 px-4 text-slate-300">30 - 35% xe chạy rỗng sau khi giao</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Ghép đơn chiều về, đưa tỷ lệ xuống 5 - 10%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-white">Đo lường phát thải CO₂</td>
                  <td className="py-3 px-4 text-slate-300">Không có dữ liệu / Không tính được</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Tự động xuất báo cáo phát thải theo chuẩn quốc tế</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
