import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Download, Sparkles, X, ZoomIn } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);
interface TeamMember {
  name: string;
  role: React.ReactNode;
  ownershipBadge: string;
  hardwareEndpoints: string;
  image: string;
  imagePosition: string;
  liveSubsystemLabel: string;
  liveSubsystemHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  mockupSrc: string;
  mockupTitle: string;
}

const members: TeamMember[] = [
  {
    name: 'Nguyễn Thu Thuỷ',
    role: (
      <>
        Nghiên Cứu &amp; Cung Cấp Kiến Thức
        <br />
        Logistics &amp; Chuỗi Cung Ứng
      </>
    ),
    ownershipBadge: 'Operations · B2B TMS & Luồng 120 Đơn',
    hardwareEndpoints: 'MacBook Pro 16" · iPad Pro M4',
    image: '/team/thuy.jpg',
    imagePosition: 'center 20%',
    liveSubsystemLabel: 'Điều Phối B2B TMS (/dashboard)',
    liveSubsystemHref: '/dashboard/',
    mockupSrc: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    mockupTitle: 'MacBook Pro 16" · Điều Phối B2B TMS & Luồng 120 Đơn',
  },
  {
    name: 'Phạm Quốc Thanh',
    role: (
      <>
        Phụ Trách Công Nghệ
        <br />
        &amp; Kiến Trúc Hệ Thống
      </>
    ),
    ownershipBadge: 'CTO · VRPTW/ALNS, 3D WebGL & 7 Thiết Bị',
    hardwareEndpoints: 'Full 7-Device Studio · AES-256-GCM',
    image: '/team/thanh.jpg',
    imagePosition: 'center 32%',
    liveSubsystemLabel: 'Zero-Knowledge Audit (/audit)',
    liveSubsystemHref: '/portal/audit/',
    secondaryLabel: '28 Ảnh Pitch Deck',
    secondaryHref: '/pitch-deck/',
    mockupSrc: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    mockupTitle: 'Full 7-Device Studio Stage · VRPTW/ALNS, 3D WebGL & AES-256-GCM (2400×1120)',
  },
  {
    name: 'Nguyễn Ngọc Khánh Phương',
    role: (
      <>
        Nghiên Cứu Thị Trường
        <br />
        &amp; Phát Triển Bền Vững
      </>
    ),
    ownershipBadge: 'ESG Lead · Kiểm Định Đối Chứng EVSIM',
    hardwareEndpoints: 'Windows 11 XPS 16 · ESG 3-Sheet',
    image: '/team/phuong.jpg',
    imagePosition: 'center 28%',
    liveSubsystemLabel: 'Đối Chứng EVSIM & ESG (/benchmark)',
    liveSubsystemHref: '/benchmark/',
    mockupSrc: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    mockupTitle: 'Windows 11 XPS 16 · Kiểm Định Đối Chứng EVSIM & ESG 3-Sheet',
  },
  {
    name: 'Nguyễn Hồng Phúc',
    role: (
      <>
        Mô Hình Tài Chính
        <br />
        &amp; Kế Hoạch Vốn
      </>
    ),
    ownershipBadge: 'CFO · Bản Đồ Xe Tải $0 API & ROI',
    hardwareEndpoints: 'Galaxy Z Fold · /pitch-deck/',
    image: '/team/phuc.jpg',
    imagePosition: 'center 24%',
    liveSubsystemLabel: 'Bản Đồ Xe Tải $0 API (/maps)',
    liveSubsystemHref: '/maps/?vehicle=0&mode=navigate',
    secondaryLabel: 'Hồ Sơ Gọi Vốn',
    secondaryHref: '/pitch-deck/',
    mockupSrc: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    mockupTitle: 'Samsung Galaxy Z Fold · Bản Đồ Xe Tải $0 API & Mô Hình Tài Chính',
  },
  {
    name: 'Lê Thị Hoàng Ngân',
    role: (
      <>
        Nghiên Cứu Thị Trường
        <br />
        &amp; Thương Mại Điện Tử
      </>
    ),
    ownershipBadge: 'Last-Mile Lead · App Tài Xế 2 Chặng',
    hardwareEndpoints: 'iPhone Duo · 18 Pro Max · S26 Ultra',
    image: '/team/ngan.jpg',
    imagePosition: 'center 25%',
    liveSubsystemLabel: 'App Tài Xế 2 Chặng (/driver)',
    liveSubsystemHref: '/driver/',
    mockupSrc: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    mockupTitle: 'iPhone Duo Dual-Screen · App Tài Xế 2 Chặng & Bản Đồ Live',
  },
];
const OG_COVER_TEAM_SPEC: TeamMember = {
  name: 'Ảnh Bìa OG 2.4K',
  role: 'Bìa OpenGraph & Pitch Deck 2400×1260',
  ownershipBadge: 'Flagship Cover Banner · 7 Thiết Bị Đồng Bộ',
  hardwareEndpoints: '2400×1260 · -34.9% Km & -39.2% CO₂e',
  image: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
  imagePosition: 'center center',
  liveSubsystemLabel: 'Mở Pitch Deck (/pitch-deck/)',
  liveSubsystemHref: '/pitch-deck/',
  mockupSrc: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
  mockupTitle: 'Ảnh Bìa OpenGraph / Pitch Deck (2400×1260 Cover Banner)',
};
const TEAM_LIGHTBOX_ITEMS: TeamMember[] = [...members, OG_COVER_TEAM_SPEC];

export const Team: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeLightboxMember, setActiveLightboxMember] = useState<TeamMember | null>(null);
  useEffect(() => {
    if (!activeLightboxMember) return undefined;
    const total = TEAM_LIGHTBOX_ITEMS.length;
    const idx = Math.max(0, TEAM_LIGHTBOX_ITEMS.findIndex((m) => m.name === activeLightboxMember.name));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveLightboxMember(null);
      else if (e.key === 'ArrowLeft') setActiveLightboxMember(TEAM_LIGHTBOX_ITEMS[(idx - 1 + total) % total]);
      else if (e.key === 'ArrowRight') setActiveLightboxMember(TEAM_LIGHTBOX_ITEMS[(idx + 1) % total]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeLightboxMember]);

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.fromTo(
        '.gsap-team-card',
        { y: 36, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="team"
      aria-labelledby="team-heading"
      className="relative isolate overflow-hidden bg-ecomiles-ink px-4 py-24 text-white sm:px-6 sm:py-32 lg:px-8 scroll-mt-24"
    >
      <div className="pointer-events-none absolute inset-0 team-grid opacity-35" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-ecomiles-lime/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-end gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.35fr_0.65fr] lg:pb-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Đội ngũ sáng lập &amp; phát triển</span>
            </div>

            <h2
              id="team-heading"
              className="max-w-4xl text-balance text-3xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl lg:leading-[0.98]"
            >
              Sức Mạnh Liên Ngành{' '}
              <span className="block pt-2 text-ecomiles-lime">Từ Nghiên Cứu Đến Khởi Nghiệp 2026</span>
            </h2>
          </div>

          <div className="lg:pb-1">
            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Dự án hội tụ năng lực chuyên sâu về kinh tế, công nghệ thông tin,
              phát triển bền vững và vận hành giao nhận hàng hóa.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">05 thành viên</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">05 chuyên môn</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">01 sứ mệnh</span>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-x-4 gap-y-12 sm:gap-x-8 md:gap-y-14 lg:mt-20 lg:gap-x-10 lg:gap-y-16">
          {members.map((member, index) => (
            <article
              key={member.name}
              className="gsap-team-card group min-w-0 w-[calc(50%-0.5rem)] max-w-[220px] text-center max-[359px]:w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.34rem)] lg:w-[calc(33.333%-1.67rem)] lg:max-w-[300px]"
            >
              <div className="relative mx-auto aspect-square w-full max-w-[240px]">
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-300/25 via-white/10 to-ecomiles-lime/20 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative h-full overflow-hidden rounded-full border border-white/15 bg-[#e8f0e4] shadow-[0_22px_60px_rgba(0,0,0,0.45)] ring-1 ring-black/20 transition duration-300 group-hover:-translate-y-1 group-hover:border-ecomiles-lime/60">
                  <img
                    src={member.image}
                    alt={`Chân dung ${member.name}`}
                    width="440"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover saturate-[0.82] transition duration-500 group-hover:scale-[1.035] group-hover:saturate-100"
                    style={{ objectPosition: member.imagePosition }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ecomiles-ink/70 to-transparent"
                    aria-hidden="true"
                  />
                </div>

                <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-ecomiles-lime/40 bg-ecomiles-ink font-mono text-[10px] font-bold text-ecomiles-lime shadow-lg sm:h-9 sm:w-9">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="mx-auto mt-6 max-w-[270px]">
                <h3 className="font-barlow text-lg font-extrabold uppercase leading-tight tracking-[0.025em] text-white sm:text-xl">
                  {member.name}
                </h3>
                <p className="mt-2 min-h-[40px] text-xs font-bold leading-5 text-ecomiles-lime sm:text-[13px] text-balance">
                  {member.role}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveLightboxMember(member)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] hover:border-ecomiles-lime/55 hover:bg-white/[0.08] px-2.5 py-1.5 text-left text-[10px] leading-4 text-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-white truncate">{member.ownershipBadge}</span>
                    <span className="inline-flex items-center gap-1 shrink-0 rounded bg-ecomiles-lime/15 border border-ecomiles-lime/35 px-1.5 py-0.5 font-mono text-[9px] font-extrabold text-ecomiles-lime">
                      <ZoomIn className="w-2.5 h-2.5" />
                      <span>2.4K</span>
                    </span>
                  </div>
                  <div className="mt-0.5 font-mono text-[9.5px] text-emerald-300 truncate">
                    {member.hardwareEndpoints}
                  </div>
                </button>
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                  <a
                    href={member.liveSubsystemHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-white/15 text-[10.5px] font-bold text-slate-200 hover:border-ecomiles-lime/60 hover:text-ecomiles-lime transition-all"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{member.liveSubsystemLabel}</span>
                  </a>
                  {member.secondaryHref && member.secondaryLabel && (
                    <a
                      href={member.secondaryHref}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ecomiles-lime/15 border border-ecomiles-lime/35 text-[10px] font-extrabold text-ecomiles-lime hover:bg-ecomiles-lime hover:text-slate-950 transition-all"
                    >
                      <span>{member.secondaryLabel}</span>
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
      {activeLightboxMember &&
        typeof document !== 'undefined' &&
        (() => {
          const total = TEAM_LIGHTBOX_ITEMS.length;
          const activeIdx = Math.max(
            0,
            TEAM_LIGHTBOX_ITEMS.findIndex((m) => m.name === activeLightboxMember.name)
          );
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Mockup 2.4K: ${activeLightboxMember.name}`}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setActiveLightboxMember(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                      [{activeIdx + 1}/{total}] {activeLightboxMember.name} ·{' '}
                      {activeLightboxMember.ownershipBadge}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      {activeLightboxMember.mockupTitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveLightboxMember(TEAM_LIGHTBOX_ITEMS[(activeIdx - 1 + total) % total])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveLightboxMember(TEAM_LIGHTBOX_ITEMS[(activeIdx + 1) % total])
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <span>Tiếp</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={activeLightboxMember.mockupSrc}
                      download
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải PNG 2.4K</span>
                    </a>
                    <a
                      href={activeLightboxMember.liveSubsystemHref}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                    >
                      <span>{activeLightboxMember.liveSubsystemLabel}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveLightboxMember(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Đóng</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={activeLightboxMember.mockupSrc}
                    alt={activeLightboxMember.mockupTitle}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {TEAM_LIGHTBOX_ITEMS.map((m, idx) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setActiveLightboxMember(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        m.name === activeLightboxMember.name
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}. {m.name}
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
