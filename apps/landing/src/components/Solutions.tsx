import React, { useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight } from 'lucide-react';
import {
  BackhaulMatchIcon,
  Co2AuditIcon,
  HanoiRingIcon,
  IsoLedgerIcon,
  Qd23WindowIcon,
  TruckWeightIcon,
  VanExemptIcon,
} from './EcoMilesMark';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface SolutionTile {
  id: string;
  title: string;
  tag: string;
  icon: React.ReactNode;
  screenshot: string;
  alt: string;
  statBig: string;
  statSub: string;
  chips: string[];
  liveHref: string;
  liveLabel: string;
  variant: 'cosmos' | 'gochujang' | 'marble' | 'varden';
  diagram: React.ReactNode;
}

export const Solutions: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useGSAP(
    () => {
      if (shouldReduceMotion || !sectionRef.current) return;
      gsap.fromTo(
        '.gsap-solution-card',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 82%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: sectionRef, dependencies: [shouldReduceMotion] }
  );

  const solutions: SolutionTile[] = [
    {
      id: '01',
      title: 'Gom cụm & Cắt vòng thừa',
      tag: 'EcoALNS + OSRM thật',
      icon: <TruckWeightIcon className="w-5 h-5" />,
      screenshot: '/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png',
      alt: 'Trung tâm gom cụm lộ trình EcoMiles',
      statBig: '−30,5% đến −50,8%',
      statSub: '14.178 → 9.857 km (2,5T) · 13.441 → 6.611 km (Van)',
      chips: ['543 → 328 chuyến', '0 ca quá tải', 'Lịch cũ: −22,3%'],
      liveHref: '/dashboard/',
      liveLabel: 'Mở Bảng Điều Khiển',
      variant: 'cosmos',
      diagram: (
        <svg viewBox="0 0 280 56" fill="none" className="w-full h-12" aria-hidden="true">
          <rect x="2" y="8" width="200" height="14" rx="2" fill="#C1121F" />
          <text x="8" y="18" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#FDF0D5">THỦ CÔNG 14.178 KM</text>
          <rect x="2" y="30" width="139" height="14" rx="2" fill="#669BBC" />
          <text x="8" y="40" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#003049">ECOMILES 9.857 KM</text>
          <text x="276" y="40" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="800" fill="#FDF0D5">−30,5%</text>
        </svg>
      ),
    },
    {
      id: '02',
      title: 'Né giờ cấm TP.HCM & Hà Nội',
      tag: 'QĐ 23 · QCVN 41 · NĐ 168',
      icon: <Qd23WindowIcon className="w-5 h-5" />,
      screenshot: '/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png',
      alt: 'Bản đồ vùng cấm tải nội đô QĐ 23',
      statBig: '235 → 0 lỗi',
      statSub: 'Tách riêng van <950 kg (24/24) vs xe tải ≥950 kg',
      chips: ['Tránh phạt 4-6 triệu đ', 'Trừ 0 điểm GPLX', 'Hỗ trợ Vành đai 3 HN'],
      liveHref: '/maps/?vehicle=0&mode=navigate',
      liveLabel: 'Mở Bản Đồ Xe Tải',
      variant: 'gochujang',
      diagram: (
        <svg viewBox="0 0 280 56" fill="none" className="w-full h-12" aria-hidden="true">
          <rect x="2" y="10" width="52" height="18" fill="#669BBC" />
          <rect x="56" y="10" width="46" height="18" fill="#C1121F" />
          <rect x="104" y="10" width="84" height="18" fill="#003049" />
          <rect x="190" y="10" width="46" height="18" fill="#C1121F" />
          <rect x="238" y="10" width="40" height="18" fill="#669BBC" />
          <text x="79" y="22" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#FDF0D5">06-09</text>
          <text x="146" y="22" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#FDF0D5">09-16 MỞ</text>
          <text x="213" y="22" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fontWeight="700" fill="#FDF0D5">16-20</text>
          <text x="140" y="45" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#FDF0D5">QCVN 41:2024 · BIỂN P.106a/b</text>
        </svg>
      ),
    },
    {
      id: '03',
      title: 'Ghép chiều về 91 điểm bán',
      tag: 'Backhaul & $0 Map API',
      icon: <BackhaulMatchIcon className="w-5 h-5" />,
      screenshot: '/pitch-deck-screenshots/06_desktop_driver_2tier_middle_and_last_mile.png',
      alt: 'Ứng dụng tài xế ghép đơn chiều về',
      statBig: '−36,4% toàn mạng',
      statSub: '46.376 → 29.508 km (2.395 đơn / 393 ngày)',
      chips: ['−37,5% vs ghép theo giờ', 'Van <950kg Transit/Solati', 'App tài xế 1 chạm'],
      liveHref: '/driver/',
      liveLabel: 'Mở App Tài Xế',
      variant: 'varden',
      diagram: (
        <svg viewBox="0 0 280 56" fill="none" className="w-full h-12" aria-hidden="true">
          <circle cx="28" cy="24" r="9" fill="#003049" />
          <circle cx="140" cy="14" r="7" fill="#C1121F" />
          <circle cx="252" cy="24" r="9" fill="#003049" />
          <path d="M37 22 L133 14 L243 22" stroke="#003049" strokeWidth="2.8" />
          <path d="M243 28 L37 28" stroke="#669BBC" strokeWidth="3.5" strokeDasharray="5 4" />
          <text x="140" y="47" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8.5" fontWeight="700" fill="#003049">VÒNG KHÉP KÍN 91 CỬA HÀNG</text>
        </svg>
      ),
    },
    {
      id: '04',
      title: 'Sổ kiểm toán CO₂ GLEC v3.2',
      tag: 'GLX-HDT-v1 · NĐ 13/2023',
      icon: <IsoLedgerIcon className="w-5 h-5" />,
      screenshot: '/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png',
      alt: 'Đối chứng phát thải nhiên liệu và CO2e',
      statBig: '4,88 tấn CO₂e',
      statSub: 'Tiết kiệm 1.822 L dầu (TTW 2,68 · WTW 3,24 kg/L)',
      chips: ['Excel 3 Sheet tự động', 'Cô lập Multi-Tenant', 'Sẵn sàng hạn 31/3/2027'],
      liveHref: '/benchmark/',
      liveLabel: 'Mở Đối Chứng EVSIM',
      variant: 'marble',
      diagram: (
        <svg viewBox="0 0 280 56" fill="none" className="w-full h-12" aria-hidden="true">
          <rect x="6" y="10" width="84" height="32" rx="4" fill="#003049" />
          <text x="48" y="29" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#FDF0D5">1.822 L DẦU</text>
          <path d="M96 26 H120" stroke="#003049" strokeWidth="2.5" />
          <rect x="124" y="10" width="74" height="32" rx="4" fill="#FDF0D5" />
          <text x="161" y="29" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9.5" fontWeight="700" fill="#AE1F23">4,88T TTW</text>
          <path d="M202 26 H216" stroke="#003049" strokeWidth="2.5" />
          <rect x="218" y="10" width="56" height="32" rx="4" fill="#780000" />
          <text x="246" y="29" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fontWeight="700" fill="#FDF0D5">5,90T WTW</text>
        </svg>
      ),
    },
  ];

  const cardSurface: Record<SolutionTile['variant'], string> = {
    cosmos: 'bg-[#003049] text-[#FDF0D5] border-[#003049]',
    gochujang: 'bg-[#780000] text-[#FDF0D5] border-[#C1121F]',
    varden: 'bg-[#F8E7C4] text-[#003049] border-[#003049]',
    marble: 'bg-[#669BBC] text-[#003049] border-[#003049]',
  };

  return (
    <section
      id="solutions"
      ref={sectionRef}
      className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 em-grid-varden text-[#003049] border-b-4 border-[#003049] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-6 border-b-2 border-[#003049]">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#003049] tracking-tight leading-[1.02]">
              4 trụ cột giải quyết bài toán giao nhận đô thị
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#003049] px-3 py-1.5 font-mono text-[11px] font-bold text-[#FDF0D5]">
              <VanExemptIcon className="w-4 h-4 text-[#669BBC]" />
              <span>642 ma trận OSRM thật</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#C1121F] px-3 py-1.5 font-mono text-[11px] font-bold text-[#FDF0D5]">
              <HanoiRingIcon className="w-4 h-4" />
              <span>TP.HCM + Hà Nội</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutions.map((item) => (
            <article
              key={item.id}
              className={`gsap-solution-card flex flex-col justify-between rounded-2xl border-2 p-6 shadow-md transition-transform hover:-translate-y-0.5 ${cardSurface[item.variant]}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-[11px] font-bold uppercase ${
                      item.variant === 'cosmos'
                        ? 'bg-[#669BBC] text-[#003049]'
                        : item.variant === 'gochujang'
                        ? 'bg-[#FDF0D5] text-[#780000]'
                        : 'bg-[#003049] text-[#FDF0D5]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.tag}</span>
                  </span>
                  <span className="font-mono text-lg font-black opacity-75">{item.id}</span>
                </div>

                {/* Product Frame */}
                <div className="rounded-xl overflow-hidden border-2 border-[#003049]/30 bg-[#002033] aspect-[16/9]">
                  <img
                    src={item.screenshot}
                    alt={item.alt}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>

                <div>
                  <h3 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">
                    {item.title}
                  </h3>
                  <div className="font-display text-2xl sm:text-3xl font-black mt-1 tabular-nums">
                    {item.statBig}
                  </div>
                  <div className="font-mono text-xs font-semibold opacity-90 mt-0.5 tabular-nums">
                    {item.statSub}
                  </div>
                </div>

                {/* Bespoke Inline Visual Diagram */}
                <div
                  className={`rounded-lg p-2.5 border ${
                    item.variant === 'cosmos'
                      ? 'bg-[#002033] border-[#669BBC]/40'
                      : item.variant === 'gochujang'
                      ? 'bg-[#003049] border-[#FDF0D5]/30'
                      : item.variant === 'varden'
                      ? 'bg-[#FDF0D5] border-[#003049]/25'
                      : 'bg-[#FDF0D5]/85 border-[#003049]/30'
                  }`}
                >
                  {item.diagram}
                </div>

                {/* Scannable Visual Chips (Replaces Bulky Prose) */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.chips.map((chip) => (
                    <span
                      key={chip}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        item.variant === 'cosmos'
                          ? 'bg-[#002033] text-[#FDF0D5] border border-[#669BBC]/40'
                          : item.variant === 'gochujang'
                          ? 'bg-[#C1121F] text-[#FDF0D5]'
                          : 'bg-[#003049] text-[#FDF0D5]'
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={item.liveHref}
                className={`mt-5 inline-flex items-center justify-between px-4 py-3 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-colors ${
                  item.variant === 'cosmos'
                    ? 'bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5]'
                    : item.variant === 'gochujang'
                    ? 'bg-[#FDF0D5] hover:bg-[#669BBC] text-[#003049]'
                    : 'bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Co2AuditIcon className="w-4 h-4" />
                  <span>{item.liveLabel}</span>
                </span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
