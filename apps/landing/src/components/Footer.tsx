import React from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ArrowRight, Compass, FileSpreadsheet, Leaf, Mail, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react';

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
        duration: 0.85,
        scrollTo: { y: target, offsetY: 64, autoKill: false },
        ease: 'power3.inOut',
      });
    }
  };

  return (
    <footer className="relative bg-slate-950 border-t border-white/10 pt-16 pb-10 px-4 sm:px-6 lg:px-8 text-slate-300 text-xs overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Closing CTA Banner (3 Focused Live App Actions) */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-ecomiles-lime/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Trải Nghiệm Ngay Hệ Sinh Thái Điều Phối B2B &amp; Bản Đồ Xe Tải Mở EcoMiles
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mở trực tiếp các không gian làm việc thực tế ngay trên trình duyệt mà không cần cài đặt phần mềm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/dashboard/"
              className="px-4 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-black/40 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Mở Bảng Điều Khiển</span>
            </a>
            <a
              href="/maps/?vehicle=0&mode=navigate"
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-4 h-4 text-ecomiles-lime" />
              <span>Mở Bản Đồ Xe Tải</span>
            </a>
            <a
              href="/driver/"
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Mở Ứng Dụng Tài Xế</span>
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

            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              Nền tảng B2B SaaS tối ưu lộ trình xe tải đô thị đa ràng buộc, lọc vùng cấm tải QĐ 23/2018/QĐ-UBND, ghép đơn
              chiều về và kiểm toán phát thải CO₂e tự động theo chuẩn ISO 14083 / GLEC v3.2.
            </p>

            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Đồng hành cùng Chiến lược Logistics Xanh &amp; Net Zero 2050</span>
            </div>
          </div>

          {/* Col 2: Direct Live Workspaces */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Ứng Dụng Trực Tuyến</h4>
            <ul className="space-y-2.5 text-slate-300">
              <li>
                <a href="/dashboard/" className="hover:text-ecomiles-lime transition-colors">
                  1. Trung tâm Điều phối Đội xe B2B
                </a>
              </li>
              <li>
                <a href="/benchmark/" className="hover:text-ecomiles-lime transition-colors">
                  2. Phòng Đối chứng Thuật toán EVSIM
                </a>
              </li>
              <li>
                <a href="/driver/" className="hover:text-ecomiles-lime transition-colors">
                  3. Ứng dụng Tài xế Giao nhận
                </a>
              </li>
              <li>
                <a href="/maps/?vehicle=0&mode=navigate" className="hover:text-ecomiles-lime transition-colors">
                  4. Bản đồ Dẫn đường Xe tải
                </a>
              </li>
              <li>
                <a href="/portal/audit/" className="hover:text-ecomiles-lime transition-colors">
                  5. Cổng Kiểm toán Phát thải ESG
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation & Pitch Deck */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Khám Phá</h4>
            <ul className="space-y-2.5 text-slate-300">
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => handleSmoothFooterScroll(e, '#solutions')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  4 trụ cột giải pháp
                </a>
              </li>
              <li>
                <a
                  href="#calculator"
                  onClick={(e) => handleSmoothFooterScroll(e, '#calculator')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Công cụ tính tiết kiệm ROI &amp; CO₂
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  onClick={(e) => handleSmoothFooterScroll(e, '#workflow')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Quy trình vận hành 4 bước
                </a>
              </li>
              <li>
                <a
                  href="#showcase"
                  onClick={(e) => handleSmoothFooterScroll(e, '#showcase')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Hệ sinh thái 7 thiết bị
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleSmoothFooterScroll(e, '#pricing')}
                  className="hover:text-ecomiles-lime transition-colors"
                >
                  Bảng giá &amp; Gói Pilot miễn phí
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & CTA */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Liên Hệ &amp; Hợp Tác</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                <span>contact@ecomiles.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-ecomiles-lime shrink-0" />
                <span>0889.917.555</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử Miễn Phí</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Standards */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div>© 2026 EcoMiles Platform · Urban Logistics VRPTW &amp; ISO 14083 / GLEC v3.2 Carbon Accounting.</div>
          <div className="flex flex-wrap items-center gap-5">
            <span>Bảo mật dữ liệu NĐ 13/2023/NĐ-CP</span>
            <span>100% Đường phố thật TP.HCM ($0 Map API)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
