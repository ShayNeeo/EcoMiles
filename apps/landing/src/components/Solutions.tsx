import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, BarChart3, CheckCircle, Clock, Cpu, Monitor, RefreshCw, Route } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

export const Solutions: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();


  const handleScrollToShowcase = (e: React.MouseEvent<HTMLAnchorElement>, deviceId?: string) => {
    if (typeof window === 'undefined') return;
    const target = document.querySelector('#showcase');
    if (!target) return;
    e.preventDefault();
    if (deviceId) {
      window.dispatchEvent(new CustomEvent('ecomiles:select-device', { detail: { deviceId } }));
    }
    if (shouldReduceMotion) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      gsap.to(window, {
        duration: 0.85,
        scrollTo: { y: target, offsetY: 64 },
        ease: 'power3.inOut',
      });
    }
  };
  useGSAP(
    () => {
      if (shouldReduceMotion || !sectionRef.current) return;

      gsap.fromTo(
        '.gsap-solution-card',
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.12,
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
      badge: 'Tối Ưu Đa Ràng Buộc VRPTW',
      title: 'Gom Cụm & Khử Giao Cắt Lộ Trình Trong 31ms',
      description:
        'Nhập trực tiếp bảng tính .XLSX (80 - 500 đơn/ca): thuật toán Carbon-Aware ALNS tự động phân cụm theo quận, khớp tải trọng xe (500kg - 2.5 tấn) và khử toàn bộ đoạn chạy chồng chéo trên mạng lưới đường thật OSRM TP.HCM.',
      metrics: [
        'Cắt giảm 34.9% tổng quãng đường (374.4 km xuống 243.7 km)',
        'Sử dụng 7/10 xe thay vì 12 chuyến rời rạc (Lấp đầy tải 101.5%)',
        'Rút ngắn thời gian lập kế hoạch từ 90 phút xuống < 1 giây',
      ],
      liveLinks: [
        { href: '/dashboard/', label: 'Bảng Điều Khiển Đội Xe (/dashboard)' },
        { href: '/benchmark/', label: 'Đối Chứng EVSIM (/benchmark)' },
      ],
      gradient: 'from-yellow-400/10 to-emerald-400/5',
      devices: [
        { id: 'macbook_pro', label: 'MacBook Pro 16"' },
        { id: 'windows_xps', label: 'Windows 11 XPS 16' },
      ],
    },
    {
      id: '02',
      icon: <Clock className="w-6 h-6 text-emerald-400" />,
      badge: 'Bộ Lọc QĐ 23/2018 & Cầu 13T',
      title: 'Tự Động Né Khung Giờ Cấm Tải Nội Đô TP.HCM',
      description:
        'Tích hợp trực tiếp quy định cấm tải QĐ 23/2018/QĐ-UBND (06:00 - 09:00 & 16:00 - 20:00) và giới hạn tải trọng cầu (13T / 4.5m): tự động dời lịch hợp pháp hoặc định tuyến vòng qua hành lang cho phép.',
      metrics: [
        '0 vi phạm giờ cấm QĐ 23/2018 (so với 28 lỗi khi chia tuyến thủ công)',
        'Bản đồ Mở OpenTruck (/maps) hiển thị rõ vùng cấm đỏ & cầu giới hạn',
        'Hỗ trợ cả Chặng Giữa (>500kg) và Chặng Cuối (<=500kg Google Maps $0)',
      ],
      liveLinks: [
        { href: '/maps/?vehicle=0&mode=overview', label: 'Bản Đồ Vùng Cấm QĐ 23 (/maps)' },
      ],
      gradient: 'from-emerald-500/10 to-teal-500/5',
      devices: [
        { id: 'galaxy_zfold', label: 'Galaxy Z Fold' },
        { id: 'ipad_pro', label: 'iPad Pro M4' },
      ],
    },
    {
      id: '03',
      icon: <RefreshCw className="w-6 h-6 text-emerald-300" />,
      badge: 'Ghép Đơn Chiều Về (Backhaul)',
      title: 'Biến Chuyến Xe Quay Về Không Tải Thành Năng Suất',
      description:
        'Khi xe hoàn tất điểm giao cuối tại Thủ Đức, Quận 7 hoặc Bình Tân, thuật toán tự động quét và ghép các đơn thu hồi hàng hoàn / luân chuyển nội bộ nằm dọc hành lang quay về kho Tân Bình.',
      metrics: [
        'Hạ tỷ lệ xe chạy rỗng từ 32.8% (122.9 km) xuống chỉ còn 2.7% (6.5 km)',
        'Tự động ghép 21 đơn chiều về, thu hồi 1,864.9 kg hàng về kho',
        'Tài xế nhận lệnh lấy hàng chiều về ngay trên ứng dụng web (/driver)',
      ],
      liveLinks: [
        { href: '/driver/', label: 'Ứng Dụng Tài Xế 2 Chặng (/driver)' },
      ],
      gradient: 'from-emerald-500/10 to-teal-500/5',
      devices: [
        { id: 'iphone_duo', label: 'iPhone Duo' },
        { id: 'iphone_18_pro_max', label: 'iPhone 18 Pro Max' },
        { id: 'galaxy_s26_ultra', label: 'Galaxy S26 Ultra' },
      ],
    },
    {
      id: '04',
      icon: <BarChart3 className="w-6 h-6 text-ecomiles-lime" />,
      badge: 'Kiểm Toán ISO 14083 / GLEC v3.2',
      title: 'Đo Lường Phát Thải Động Theo Tải Trọng & Xuất Excel 3 Sheet',
      description:
        'Áp dụng công thức tải trọng động GLX-HDT-v1 (cập nhật hệ số tiêu hao nhiên liệu sau từng điểm dỡ hàng) để tính chính xác phát thải TTW / WTW đến từng chuyến xe và từng mã đơn hàng.',
      metrics: [
        'Cắt giảm 39.2% phát thải CO₂e (từ 92.21 kg xuống 56.07 kg CO₂e WTW)',
        'Kết xuất tự động Báo cáo Excel 3 Sheet (.XLS), CSV và PDF kiểm toán',
        'Bảo mật Zero-Knowledge AES-256-GCM tuân thủ Nghị định 13/2023/NĐ-CP',
      ],
      liveLinks: [
        { href: '/portal/audit/', label: 'Cổng Kiểm Toán ISO 14083 (/portal/audit)' },
        { href: '/benchmark/', label: 'Buồng Đối Chứng EVSIM (/benchmark)' },
      ],
      gradient: 'from-yellow-400/10 to-emerald-500/5',
      devices: [
        { id: 'macbook_pro', label: 'MacBook Pro 16"' },
        { id: 'windows_xps', label: 'Windows 11 XPS 16' },
        { id: 'ipad_pro', label: 'iPad Pro M4' },
      ],
    },
  ];

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-950/90 border-t border-white/5 scroll-mt-24"
    >
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(600px,100vw)] h-[300px] bg-ecomiles-lime/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-ecomiles-lime mb-4 shadow-sm">
            <Cpu className="w-3.5 h-3.5" />
            <span>4 TRỤ CỘT CÔNG NGHỆ ĐÃ KIỂM CHỨNG THỰC NGHIỆM</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            4 Cách EcoMiles Giúp <span className="text-ecomiles-lime">Vận Hành Hiệu Quả Hơn</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Thay thế quy trình chia tuyến thủ công trên bảng tính bằng hệ thống tối ưu đa ràng buộc (VRPTW), bản đồ xe
            tải né giờ cấm QĐ 23/2018 ($0 API) và kiểm toán phát thải CO₂e tự động.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {solutions.map((item) => (
            <motion.div
              key={item.id}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              className={`gsap-solution-card relative rounded-3xl p-7 sm:p-8 bg-gradient-to-br ${item.gradient} bg-slate-900/65 backdrop-blur-xl border border-white/10 hover:border-ecomiles-lime/40 transition-colors duration-300 group shadow-xl shadow-black/30 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-ecomiles-lime bg-slate-950/80 border border-ecomiles-lime/25 px-3 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-ecomiles-lime transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <div className="pt-5 border-t border-white/10 space-y-3">
                <div className="space-y-2">
                  {item.metrics.map((metric, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-200">
                      <CheckCircle className="w-4 h-4 text-ecomiles-lime shrink-0 mt-0.5" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {item.liveLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="inline-flex items-center gap-1 text-xs font-extrabold text-ecomiles-lime hover:underline"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.devices.map((dev) => (
                      <a
                        key={dev.id}
                        href="#showcase"
                        onClick={(e) => handleScrollToShowcase(e, dev.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 hover:bg-ecomiles-lime/15 border border-white/10 hover:border-ecomiles-lime/40 text-[10.5px] font-bold text-slate-300 hover:text-ecomiles-lime transition-all cursor-pointer"
                        title={`Xem ${dev.label} trên Sân khấu 7 Thiết Bị (#showcase)`}
                      >
                        <Monitor className="w-3 h-3 text-ecomiles-lime" />
                        <span>{dev.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
