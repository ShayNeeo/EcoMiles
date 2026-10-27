import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ArrowRight, Compass, Download, FileSpreadsheet, Leaf, Mail, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react';

gsap.registerPlugin(ScrollToPlugin);
const FOOTER_LIGHTBOX_ASSETS = [
  {
    id: 'studio_stage',
    shortLabel: 'Studio 7 Thiết Bị',
    title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)',
    spec: '2400×1120 · 7 Thiết Bị Đồng Bộ <50ms',
    src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
  },
  {
    id: 'macbook_pro',
    shortLabel: 'MacBook Pro 16"',
    title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS (/dashboard)',
    spec: '3456×2234 · 120 đơn / 7 tuyến ALNS · Báo cáo ESG 3 Sheet',
    src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
  },
  {
    id: 'windows_xps',
    shortLabel: 'Windows 11 XPS 16',
    title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM (/benchmark)',
    spec: '3840×2400 · Đối chứng 374.4 km vs 243.7 km (-34.9%)',
    src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
  },
  {
    id: 'galaxy_zfold',
    shortLabel: 'Galaxy Z Fold',
    title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở (/maps)',
    spec: '2160×1856 · Chặng giữa (>500kg) · Né vùng cấm QĐ 23/2018',
    src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
  },
  {
    id: 'ipad_pro',
    shortLabel: 'iPad Pro M4',
    title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
    spec: '2752×2064 · Quản lý bến xuất & ghép đơn chiều về',
    src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
  },
  {
    id: 'iphone_duo',
    shortLabel: 'iPhone Duo (Gập Đôi)',
    title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
    spec: '2420×1080 · Màn 1: Đơn hàng (/driver) · Màn 2: Dẫn đường (/maps)',
    src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
  },
  {
    id: 'iphone_18_pro_max',
    shortLabel: 'iPhone 18 Pro Max',
    title: 'iPhone 18 Pro Max · App Tài Xế Chế Độ Nắng Gắt (/driver)',
    spec: '2868×1320 · Giao hàng 1-chạm & ghép đơn chiều về (2.7% rỗng)',
    src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
  },
  {
    id: 'galaxy_s26_ultra',
    shortLabel: 'Galaxy S26 Ultra',
    title: 'Samsung Galaxy S26 Ultra · Giao Hẻm Nhỏ & Google Maps Waypoints ($0)',
    spec: '3120×1440 · Waypoints + Google Maps Ô tô ($0 API)',
    src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
  },
] as const;
interface FooterProps {
  onOpenPilotModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPilotModal }) => {
  const [footerLightboxIdx, setFooterLightboxIdx] = useState<number | null>(null);
  const handleSmoothFooterScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetSelector: string,
    deviceId?: string
  ) => {
    if (typeof window === 'undefined') return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    e.preventDefault();
    if (deviceId) {
      window.dispatchEvent(new CustomEvent('ecomiles:select-device', { detail: { deviceId } }));
    }
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      gsap.to(window, {
        duration: 0.85,
        scrollTo: { y: target, offsetY: 64, autoKill: false },
        ease: 'power3.inOut',
      });
    }
  };

  return (
    <footer className="relative bg-slate-950 border-t border-white/10 pt-16 pb-10 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Designed Closing Banner */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-ecomiles-lime/25 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold text-ecomiles-lime uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>SẴN SÀNG VẬN HÀNH THỰC TẾ TRÊN MỌI THIẾT BỊ ($0 MAP API)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Trải Nghiệm Ngay Hệ Sinh Thái Điều Phối B2B &amp; Bản Đồ Xe Tải Mở EcoMiles
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mở trực tiếp 4 không gian làm việc độc lập hoặc tải bộ 28 ảnh chụp màn hình độ phân giải cao (MacBook Pro,
              Windows XPS, Galaxy Z Fold, iPad Pro, iPhone Duo, iPhone 18 Pro Max, Galaxy S26 Ultra).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 max-w-2xl">
            <a
              href="/dashboard/"
              className="px-3.5 py-2 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Trung Tâm B2B (/dashboard)</span>
            </a>
            <a
              href="/maps/?vehicle=0&mode=navigate"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>Bản Đồ Xe Tải (/maps)</span>
            </a>
            <a
              href="/driver/"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>App Tài Xế (/driver)</span>
            </a>
            <a
              href="/benchmark/"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Đối Chứng EVSIM (/benchmark)</span>
            </a>
            <a
              href="/portal/audit/"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phòng Audit (/portal/audit)</span>
            </a>
            <a
              href="/pitch-deck/"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Slide Deck (/pitch-deck)</span>
            </a>
            <button
              type="button"
              onClick={() => setFooterLightboxIdx(0)}
              className="px-3.5 py-2 rounded-xl bg-ecomiles-lime/15 hover:bg-ecomiles-lime hover:text-slate-950 text-ecomiles-lime border border-ecomiles-lime/40 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🔍 Xem Sân Khấu 2.4K</span>
            </button>
            <a
              href="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
              download="00_ecomiles_clean_devices_hero_stage.png"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/15 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>Banner 2.4K (.PNG)</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ecomiles-lime to-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
                <Leaf className="w-4 h-4 fill-slate-950/20 stroke-slate-950" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                ECO<span className="text-ecomiles-lime">MILES</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Nền tảng B2B SaaS tối ưu lộ trình xe tải đô thị đa ràng buộc (VRPTW), lọc vùng cấm tải QĐ 23/2018/QĐ-UBND,
              ghép đơn chiều về và kiểm toán phát thải CO₂e tự động theo chuẩn ISO 14083 / GLEC v3.2.
            </p>

            <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Đồng hành cùng Chiến lược Logistics Quốc Gia QĐ 2229/QĐ-TTg &amp; Net Zero 2050</span>
            </div>
          </div>

          {/* Col 2: Direct Live Workspaces */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">4 Không Gian Vai Trò</h4>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard/" className="hover:text-ecomiles-lime transition-colors">
                  1. Điều phối viên B2B (/dashboard)
                </a>
              </li>
              <li>
                <a href="/benchmark/" className="hover:text-ecomiles-lime transition-colors">
                  2. Phòng đối chứng EVSIM (/benchmark)
                </a>
              </li>
              <li>
                <a href="/driver/" className="hover:text-ecomiles-lime transition-colors">
                  3. Ứng dụng Tài xế 2 Chặng (/driver)
                </a>
              </li>
              <li>
                <a href="/maps/?vehicle=0&mode=navigate" className="hover:text-ecomiles-lime transition-colors">
                  4. Bản đồ Xe tải OpenTruck (/maps)
                </a>
              </li>
              <li>
                <a href="/portal/audit/" className="hover:text-ecomiles-lime transition-colors">
                  5. Phòng Giám sát Zero-Knowledge (/audit)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation & Pitch Deck Assets */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Cấu Trúc &amp; Tài Liệu</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => handleSmoothFooterScroll(e, '#solutions')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  4 trụ cột công nghệ VRPTW &amp; GLEC
                </a>
              </li>
              <li>
                <a
                  href="#calculator"
                  onClick={(e) => handleSmoothFooterScroll(e, '#calculator')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Công cụ tính ROI &amp; CO₂e tiết giảm
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  onClick={(e) => handleSmoothFooterScroll(e, '#workflow')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Quy trình vận hành 8 bước khép kín
                </a>
              </li>
              <li>
                <a
                  href="#showcase"
                  onClick={(e) => handleSmoothFooterScroll(e, '#showcase')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Sân khấu 7 thiết bị (MacBook · Z Fold · Duo)
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleSmoothFooterScroll(e, '#pricing')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Bảng giá SaaS &amp; Gói Pilot 4 - 6 tuần
                </a>
              </li>
              <li>
                <a
                  href="/pitch-deck/"
                  className="hover:text-ecomiles-lime transition-colors text-slate-300 font-semibold flex items-center gap-1"
                >
                  <span>Bộ 28 ảnh &amp; Slide Thuyết Trình (/pitch-deck)</span>
                </a>
              </li>
              <li>
                <a
                  href="/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png"
                  download="00_ecomiles_flagship_cover_banner.png"
                  className="hover:text-emerald-400 transition-colors text-ecomiles-lime font-semibold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Tải Banner 7 Thiết Bị (2400x1260)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & CTA */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Liên Hệ &amp; Đăng Ký Pilot</h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                <span>contact@ecomiles.vn</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                <span>0889.917.555</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử Miễn Phí</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 7-Device Ecosystem Quick-Jump Bar */}
        <div className="py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-slate-300">Hệ sinh thái 7 thiết bị:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'MacBook Pro 16" (B2B TMS)', id: 'macbook_pro' },
              { label: 'Windows 11 XPS 16 (EVSIM)', id: 'windows_xps' },
              { label: 'Samsung Galaxy Z Fold (Cockpit)', id: 'galaxy_zfold' },
              { label: 'iPad Pro M4 (Kho Vận)', id: 'ipad_pro' },
              { label: 'iPhone Duo (Gập Đôi)', id: 'iphone_duo' },
              { label: 'iPhone 18 Pro Max (Chặng Giữa)', id: 'iphone_18_pro_max' },
              { label: 'Galaxy S26 Ultra (Live /maps)', id: 'galaxy_s26_ultra' },
            ].map((dev) => (
              <a
                key={dev.id}
                href="#showcase"
                onClick={(e) => handleSmoothFooterScroll(e, '#showcase', dev.id)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-ecomiles-lime hover:text-slate-950 text-slate-300 border border-white/10 font-semibold transition-colors"
              >
                {dev.label}
              </a>
            ))}
          </div>
        </div>

        {/* Full-Width Architectural Brand Close */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© 2026 EcoMiles Platform · Urban Logistics VRPTW &amp; ISO 14083 / GLEC v3.2 Carbon Accounting.</div>
          <div className="flex flex-wrap items-center gap-5">
            <span>Zero-Knowledge AES-256-GCM (NĐ 13/2023/NĐ-CP)</span>
            <span>100% Đường Phố Thật OSRM ($0 Map API)</span>
          </div>
        </div>
      </div>
      {footerLightboxIdx !== null &&
        typeof document !== 'undefined' &&
        (() => {
          const total = FOOTER_LIGHTBOX_ASSETS.length;
          const safeIdx = ((footerLightboxIdx % total) + total) % total;
          const activeAsset = FOOTER_LIGHTBOX_ASSETS[safeIdx];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeAsset.title}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setFooterLightboxIdx(null)}
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
                      onClick={() => setFooterLightboxIdx((safeIdx - 1 + total) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      ‹ Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterLightboxIdx((safeIdx + 1) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Tiếp ›
                    </button>
                    <a
                      href={activeAsset.src}
                      download
                      className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                    >
                      Tải PNG 2.4K
                    </a>
                    <button
                      type="button"
                      onClick={() => setFooterLightboxIdx(null)}
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
                  {FOOTER_LIGHTBOX_ASSETS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFooterLightboxIdx(idx)}
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
    </footer>
  );
};
