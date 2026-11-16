import React from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ArrowRight, Compass, FileSpreadsheet, Mail, MapPin, Phone, Truck } from 'lucide-react';
import { EcoMilesWordmark, IsoLedgerIcon } from './EcoMilesMark';

gsap.registerPlugin(ScrollToPlugin);

interface FooterProps {
  onOpenPilotModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPilotModal }) => {
  const handleSmoothFooterScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetSelector: string
  ) => {
    if (typeof window === 'undefined') return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    e.preventDefault();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      gsap.to(window, {
        duration: 0.75,
        scrollTo: { y: target, offsetY: 72, autoKill: false },
        ease: 'power3.inOut',
      });
    }
  };

  return (
    <footer className="relative em-grid-varden border-t-4 border-[#003049] pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-[#003049] text-xs overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Action Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-[#003049] text-[#FDF0D5] border-2 border-[#003049] flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <h3 className="font-display text-2xl sm:text-3xl font-black text-[#FDF0D5]">
              Đường về không trống · Chạy ngay trên trình duyệt
            </h3>
            <p className="font-mono text-xs font-bold text-[#669BBC]">
              Điều phối Excel · Bản đồ QĐ 23 · App Tài xế · Sổ CO₂e GLEC v3.2
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/dashboard/"
              className="px-4 py-2.5 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Điều Phối</span>
            </a>
            <a
              href="/maps/?vehicle=0&mode=navigate"
              className="px-4 py-2.5 rounded-lg bg-[#FDF0D5] hover:bg-[#669BBC] text-[#003049] font-extrabold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#AE1F23]" />
              <span>Bản Đồ QĐ 23</span>
            </a>
            <a
              href="/driver/"
              className="px-4 py-2.5 rounded-lg bg-[#669BBC] hover:bg-[#FDF0D5] text-[#003049] font-extrabold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>App Tài Xế</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 border-b-2 border-[#D4BF94]">
          <div className="lg:col-span-2 space-y-4">
            <EcoMilesWordmark dark={false} showTagline />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#003049] text-[#FDF0D5] font-mono text-[11px] font-bold">
              <IsoLedgerIcon className="w-4 h-4 text-[#669BBC] shrink-0" />
              <span>ISO 14083 · GLEC v3.2 · QCVN 41:2024</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono font-extrabold text-[#AE1F23] uppercase tracking-wider text-xs">Không Gian Làm Việc</h4>
            <ul className="space-y-2 font-semibold">
              <li><a href="/dashboard/" className="hover:text-[#C1121F]">1. Trung tâm Điều phối B2B</a></li>
              <li><a href="/benchmark/" className="hover:text-[#C1121F]">2. Phòng Đối chứng EVSIM</a></li>
              <li><a href="/driver/" className="hover:text-[#C1121F]">3. Ứng dụng Tài xế</a></li>
              <li><a href="/maps/?vehicle=0&mode=navigate" className="hover:text-[#C1121F]">4. Bản đồ Vùng cấm QĐ 23</a></li>
              <li><a href="/portal/audit/" className="hover:text-[#C1121F]">5. Cổng Kiểm toán ESG</a></li>
              <li><a href="/brand/" className="hover:text-[#C1121F] font-bold">6. Brand Kit &amp; Hệ thống nhận diện</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono font-extrabold text-[#AE1F23] uppercase tracking-wider text-xs">Điều Hướng</h4>
            <ul className="space-y-2 font-semibold">
              <li><a href="#solutions" onClick={(e) => handleSmoothFooterScroll(e, '#solutions')} className="hover:text-[#C1121F]">4 trụ cột giải pháp</a></li>
              <li><a href="#calculator" onClick={(e) => handleSmoothFooterScroll(e, '#calculator')} className="hover:text-[#C1121F]">Ước tính dầu &amp; CO₂</a></li>
              <li><a href="#workflow" onClick={(e) => handleSmoothFooterScroll(e, '#workflow')} className="hover:text-[#C1121F]">Quy trình 4 bước</a></li>
              <li><a href="#showcase" onClick={(e) => handleSmoothFooterScroll(e, '#showcase')} className="hover:text-[#C1121F]">Ma trận giờ cấm tải</a></li>
              <li><a href="#pricing" onClick={(e) => handleSmoothFooterScroll(e, '#pricing')} className="hover:text-[#C1121F]">Bảng giá &amp; Pilot</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-mono font-extrabold text-[#AE1F23] uppercase tracking-wider text-xs">Liên Hệ</h4>
            <div className="space-y-2 font-semibold">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#AE1F23] shrink-0" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#AE1F23] shrink-0" />
                <span>contact@ecomiles.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#AE1F23] shrink-0" />
                <span>0889.917.555</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-3 w-full py-2.5 px-3 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px] font-bold text-[#003049]/75">
          <span>© 2026 ECOMILES · ĐẠI SỨ GEN G 2026</span>
          <span>COSMOS #003049 · VARDEN #FDF0D5 · CRIMSON #C1121F · MARBLE #669BBC</span>
        </div>
      </div>
    </footer>
  );
};
