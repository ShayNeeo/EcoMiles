import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, BarChart3, CheckCircle, Clock, Cpu, Monitor, RefreshCw, Route } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);
const SOLUTIONS_LIGHTBOX_ASSETS = [
  {
    id: 'studio_stage',
    shortLabel: 'Studio 7 Thiết Bị',
    title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)',
    spec: '2400×1120 · 7 Thiết Bị Đồng Bộ <50ms',
    src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'macbook_pro',
    shortLabel: 'MacBook Pro 16"',
    title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS (/dashboard)',
    spec: '3456×2234 · 120 đơn / 7 tuyến ALNS · Báo cáo ESG 3 Sheet',
    src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'windows_xps',
    shortLabel: 'Windows 11 XPS 16',
    title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM (/benchmark)',
    spec: '3840×2400 · Đối chứng 374.4 km vs 243.7 km (-34.9%)',
    src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveHref: '/benchmark/',
  },
  {
    id: 'galaxy_zfold',
    shortLabel: 'Galaxy Z Fold',
    title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở (/maps)',
    spec: '2160×1856 · Chặng giữa (>500kg) · Né vùng cấm QĐ 23/2018',
    src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
  {
    id: 'ipad_pro',
    shortLabel: 'iPad Pro M4',
    title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
    spec: '2752×2064 · Quản lý bến xuất & ghép đơn chiều về',
    src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'iphone_duo',
    shortLabel: 'iPhone Duo (Gập Đôi)',
    title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
    spec: '2420×1080 · Màn 1: Đơn hàng (/driver) · Màn 2: Dẫn đường (/maps)',
    src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
  },
  {
    id: 'iphone_18_pro_max',
    shortLabel: 'iPhone 18 Pro Max',
    title: 'iPhone 18 Pro Max · App Tài Xế Chế Độ Nắng Gắt (/driver)',
    spec: '2868×1320 · Giao hàng 1-chạm & ghép đơn chiều về (2.7% rỗng)',
    src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
  },
  {
    id: 'galaxy_s26_ultra',
    shortLabel: 'Galaxy S26 Ultra',
    title: 'Samsung Galaxy S26 Ultra · Giao Hẻm Nhỏ & Google Maps Waypoints ($0)',
    spec: '3120×1440 · Waypoints + Google Maps Ô tô ($0 API)',
    src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
] as const;

export const Solutions: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return undefined;
    const total = SOLUTIONS_LIGHTBOX_ASSETS.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowLeft') setLightboxIndex((p) => ((p ?? 0) - 1 + total) % total);
      else if (e.key === 'ArrowRight') setLightboxIndex((p) => ((p ?? 0) + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex]);

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
        scrollTo: { y: target, offsetY: 64, autoKill: false },
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
      mockupSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
      mockupLabel: 'MacBook Pro 16" · B2B TMS (120 đơn / 7 tuyến ALNS)',
      lightboxIdx: 1,
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
        { id: 'macbook_pro', label: 'MacBook Pro 16"', idx: 1 },
        { id: 'windows_xps', label: 'Windows 11 XPS 16', idx: 2 },
      ],
    },
    {
      id: '02',
      icon: <Clock className="w-6 h-6 text-emerald-400" />,
      badge: 'Bộ Lọc QĐ 23/2018 & Cầu 13T',
      title: 'Tự Động Né Khung Giờ Cấm Tải Nội Đô TP.HCM',
      description:
        'Tích hợp trực tiếp quy định cấm tải QĐ 23/2018/QĐ-UBND (06:00 - 09:00 & 16:00 - 20:00) và giới hạn tải trọng cầu (13T / 4.5m): tự động dời lịch hợp pháp hoặc định tuyến vòng qua hành lang cho phép.',
      mockupSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
      mockupLabel: 'Galaxy Z Fold · Bản Đồ Xe Tải Mở (/maps QĐ 23/2018)',
      lightboxIdx: 3,
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
        { id: 'galaxy_zfold', label: 'Galaxy Z Fold', idx: 3 },
        { id: 'ipad_pro', label: 'iPad Pro M4', idx: 4 },
      ],
    },
    {
      id: '03',
      icon: <RefreshCw className="w-6 h-6 text-emerald-300" />,
      badge: 'Ghép Đơn Chiều Về (Backhaul)',
      title: 'Biến Chuyến Xe Quay Về Không Tải Thành Năng Suất',
      description:
        'Khi xe hoàn tất điểm giao cuối tại Thủ Đức, Quận 7 hoặc Bình Tân, thuật toán tự động quét và ghép các đơn thu hồi hàng hoàn / luân chuyển nội bộ nằm dọc hành lang quay về kho Tân Bình.',
      mockupSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
      mockupLabel: 'iPhone Duo Dual-Screen · App Tài Xế 2 Chặng (/driver)',
      lightboxIdx: 5,
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
        { id: 'iphone_duo', label: 'iPhone Duo', idx: 5 },
        { id: 'iphone_18_pro_max', label: 'iPhone 18 Pro Max', idx: 6 },
        { id: 'galaxy_s26_ultra', label: 'Galaxy S26 Ultra', idx: 7 },
      ],
    },
    {
      id: '04',
      icon: <BarChart3 className="w-6 h-6 text-ecomiles-lime" />,
      badge: 'Kiểm Toán ISO 14083 / GLEC v3.2',
      title: 'Đo Lường Phát Thải Động Theo Tải Trọng & Xuất Excel 3 Sheet',
      description:
        'Áp dụng công thức tải trọng động GLX-HDT-v1 (cập nhật hệ số tiêu hao nhiên liệu sau từng điểm dỡ hàng) để tính chính xác phát thải TTW / WTW đến từng chuyến xe và từng mã đơn hàng.',
      mockupSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
      mockupLabel: 'Windows 11 XPS 16 · Đối Chứng EVSIM & ESG 3-Sheet',
      lightboxIdx: 2,
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
        { id: 'macbook_pro', label: 'MacBook Pro 16"', idx: 1 },
        { id: 'windows_xps', label: 'Windows 11 XPS 16', idx: 2 },
        { id: 'ipad_pro', label: 'iPad Pro M4', idx: 4 },
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
                <button
                  type="button"
                  onClick={() => setLightboxIndex(item.lightboxIdx)}
                  className="mb-5 w-full rounded-2xl border border-white/10 hover:border-ecomiles-lime/55 bg-slate-950/75 p-2.5 flex items-center justify-between gap-3 text-left transition-all cursor-zoom-in group/mock"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.mockupSrc}
                      alt={item.mockupLabel}
                      loading="lazy"
                      className="h-12 w-20 object-contain rounded-lg border border-white/10 bg-black/50 p-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">{item.mockupLabel}</div>
                      <div className="text-[10px] text-slate-400">Bấm để phóng to Mockup Thiết bị 2.4K</div>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-ecomiles-lime/15 border border-ecomiles-lime/40 text-[10px] font-extrabold text-ecomiles-lime group-hover/mock:bg-ecomiles-lime group-hover/mock:text-slate-950 transition-colors">
                    🔍 2.4K
                  </span>
                </button>
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
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => setLightboxIndex(dev.idx)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 hover:bg-ecomiles-lime/15 border border-white/10 hover:border-ecomiles-lime/40 text-[10.5px] font-bold text-slate-300 hover:text-ecomiles-lime transition-all cursor-zoom-in"
                        title={`Phóng to Mockup 2.4K của ${dev.label}`}
                      >
                        <Monitor className="w-3 h-3 text-ecomiles-lime" />
                        <span>{dev.label} 🔍</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {lightboxIndex !== null &&
        typeof document !== 'undefined' &&
        (() => {
          const total = SOLUTIONS_LIGHTBOX_ASSETS.length;
          const safeIdx = ((lightboxIndex % total) + total) % total;
          const activeAsset = SOLUTIONS_LIGHTBOX_ASSETS[safeIdx];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeAsset.title}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setLightboxIndex(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                      [{safeIdx + 1}/{total}] {activeAsset.title}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{activeAsset.spec}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex((safeIdx - 1 + total) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      ‹ Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex((safeIdx + 1) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Tiếp ›
                    </button>
                    <a
                      href={activeAsset.src}
                      download
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                    >
                      Tải PNG 2.4K
                    </a>
                    <a
                      href={activeAsset.liveHref}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-400/30"
                    >
                      Mở App Live ↗
                    </a>
                    <a
                      href="#showcase"
                      onClick={(e) => {
                        setLightboxIndex(null);
                        handleScrollToShowcase(e, activeAsset.id === 'studio_stage' ? 'all_banner' : activeAsset.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                    >
                      Đến #showcase ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      ✕ Đóng
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={activeAsset.src}
                    alt={activeAsset.title}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {SOLUTIONS_LIGHTBOX_ASSETS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        idx === safeIdx
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {item.shortLabel}
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
