import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, BarChart3, CheckCircle, Clock, RefreshCw, Route } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const Solutions: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (shouldReduceMotion || !sectionRef.current) return;

      gsap.fromTo(
        '.gsap-solution-card',
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [shouldReduceMotion] }
  );

  const solutions = [
    {
      id: '01',
      icon: <Route className="w-6 h-6 text-ecomiles-lime" />,
      badge: 'Tối Ưu Tuyến Đa Ràng Buộc',
      title: 'Gom Cụm & Khử Giao Cắt Lộ Trình Tự Động',
      description:
        'Nhập trực tiếp bảng tính .XLSX (80 - 500 đơn/ca): thuật toán tự động phân cụm theo quận, khớp tải trọng xe (500kg - 2.5 tấn) và khử toàn bộ đoạn chạy chồng chéo trên mạng lưới đường thật TP.HCM.',
      metrics: [
        'Cắt giảm 34.9% tổng quãng đường (374.4 km xuống 243.7 km)',
        'Sử dụng 7/10 xe thay vì 12 chuyến rời rạc (Lấp đầy tải 101.5%)',
        'Rút ngắn thời gian lập kế hoạch từ 90 phút xuống dưới 1 giây',
      ],
      liveHref: '/dashboard/',
      liveLabel: 'Thử Bàn Điều Phối Đội Xe (/dashboard)',
    },
    {
      id: '02',
      icon: <Clock className="w-6 h-6 text-emerald-400" />,
      badge: 'Tuân Thủ QĐ 23/2018 & Cầu 13T',
      title: 'Tự Động Né Khung Giờ Cấm Tải Nội Đô TP.HCM',
      description:
        'Tích hợp trực tiếp quy định cấm tải QĐ 23/2018/QĐ-UBND (06:00 - 09:00 & 16:00 - 20:00) và giới hạn tải trọng cầu (13T / 4.5m): tự động dời lịch hợp pháp hoặc định tuyến vòng qua hành lang cho phép.',
      metrics: [
        '0 vi phạm giờ cấm QĐ 23/2018 (so với 28 lỗi khi chia tuyến thủ công)',
        'Bản đồ xe tải (/maps) hiển thị rõ vùng cấm đỏ & cầu giới hạn',
        'Hỗ trợ cả xe tải (>500kg) và xe van (<=500kg mở Google Maps $0)',
      ],
      liveHref: '/maps/?vehicle=0&mode=navigate',
      liveLabel: 'Mở Bản Đồ Vùng Cấm QĐ 23 (/maps)',
    },
    {
      id: '03',
      icon: <RefreshCw className="w-6 h-6 text-emerald-300" />,
      badge: 'Ghép Đơn Chiều Về (Backhaul)',
      title: 'Biến Chuyến Xe Quay Về Không Tải Thành Doanh Thu',
      description:
        'Khi xe hoàn tất điểm giao cuối tại Thủ Đức, Quận 7 hoặc Bình Tân, hệ thống tự động quét và ghép các đơn thu hồi hàng hoàn hoặc luân chuyển nội bộ nằm dọc hành lang quay về kho Tân Bình.',
      metrics: [
        'Hạ tỷ lệ xe chạy rỗng từ 32.8% (122.9 km) xuống chỉ còn 2.7% (6.5 km)',
        'Tự động ghép 21 đơn chiều về, thu hồi 1,864.9 kg hàng về kho',
        'Tài xế nhận lệnh lấy hàng chiều về ngay trên điện thoại (/driver)',
      ],
      liveHref: '/driver/',
      liveLabel: 'Trải Nghiệm App Tài Xế (/driver)',
    },
    {
      id: '04',
      icon: <BarChart3 className="w-6 h-6 text-ecomiles-lime" />,
      badge: 'Kiểm Toán ISO 14083 / GLEC v3.2',
      title: 'Đo Lường Phát Thải Động & Xuất Báo Cáo ESG 3 Sheet',
      description:
        'Cập nhật hệ số tiêu hao nhiên liệu theo tải trọng thực tế sau từng điểm dỡ hàng để tính chính xác phát thải CO₂e đến từng chuyến xe và từng mã đơn hàng, sẵn sàng cho kiểm toán xanh.',
      metrics: [
        'Cắt giảm 39.2% phát thải CO₂e (từ 92.21 kg xuống 56.07 kg CO₂e)',
        'Kết xuất tự động Báo cáo Excel 3 Sheet (.XLS), CSV và PDF kiểm toán',
        'Mã hóa độc lập dữ liệu khách hàng theo Nghị định 13/2023/NĐ-CP',
      ],
      liveHref: '/benchmark/',
      liveLabel: 'Xem Phòng Đối Chứng EVSIM (/benchmark)',
    },
  ];

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-white/5 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            4 Trụ Cột Giúp Đội Xe <span className="text-ecomiles-lime">Vận Hành Hiệu Quả Hơn</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Thay thế quy trình chia tuyến thủ công trên bảng tính bằng hệ thống tối ưu đa ràng buộc, bản đồ xe tải né giờ
            cấm QĐ 23/2018 ($0 API) và báo cáo phát thải CO₂e tự động.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {solutions.map((item) => (
            <motion.div
              key={item.id}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className="gsap-solution-card relative rounded-3xl p-7 sm:p-8 bg-slate-900/75 border border-white/10 hover:border-ecomiles-lime/40 transition-colors duration-300 group shadow-xl shadow-black/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-white/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-ecomiles-lime bg-slate-950/90 border border-ecomiles-lime/30 px-3 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-ecomiles-lime transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="pt-5 border-t border-white/10 space-y-4">
                <div className="space-y-2.5">
                  {item.metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-slate-200">
                      <CheckCircle className="w-4 h-4 text-ecomiles-lime shrink-0 mt-0.5" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a
                    href={item.liveHref}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-ecomiles-lime hover:text-yellow-300 transition-colors"
                  >
                    <span>{item.liveLabel}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
