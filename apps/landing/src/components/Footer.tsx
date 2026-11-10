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
        duration: 0.8,
        scrollTo: { y: target, offsetY: 64, autoKill: false },
        ease: 'power3.inOut',
      });
    }
  };

  return (
    <footer className="relative bg-[#F8FAFC] border-t border-slate-200/80 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-[#475569] text-xs overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Closing CTA Banner */}
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
              Trải nghiệm ngay hệ sinh thái điều phối B2B &amp; bản đồ xe tải mở EcoMiles
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Mở trực tiếp các không gian làm việc thực tế ngay trên trình duyệt mà không cần cài đặt phần mềm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="/dashboard/"
              className="px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Mở Bảng Điều Khiển</span>
            </a>
            <a
              href="/maps/?vehicle=0&mode=navigate"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#14532D]" />
              <span>Mở Bản Đồ Xe Tải</span>
            </a>
            <a
              href="/driver/"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-4 h-4 text-[#14532D]" />
              <span>Mở Ứng Dụng Tài Xế</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#14532D] flex items-center justify-center text-white shadow-sm">
                <Leaf className="w-4 h-4 fill-white/20 stroke-white" />
              </div>
              <span className="font-extrabold text-xl text-[#0F172A] tracking-tight">
                ECO<span className="text-[#14532D]">MILES</span>
              </span>
            </div>

            <p className="text-[#475569] text-xs leading-relaxed max-w-sm">
              Nền tảng B2B SaaS tối ưu lộ trình xe tải đô thị đa ràng buộc, lọc vùng cấm tải QĐ 23/2018/QĐ-UBND, ghép đơn chiều về và kiểm toán phát thải CO₂e tự động theo chuẩn ISO 14083 / GLEC v3.2.
            </p>

            <div className="flex items-center gap-2 text-[#14532D] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Đồng hành cùng Chiến lược Logistics Xanh &amp; Net Zero 2050</span>
            </div>
          </div>

          {/* Col 2: Direct Live Workspaces */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs">Ứng Dụng Trực Tuyến</h4>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <a href="/dashboard/" className="hover:text-[#14532D] transition-colors">
                  1. Trung tâm Điều phối Đội xe B2B
                </a>
              </li>
              <li>
                <a href="/benchmark/" className="hover:text-[#14532D] transition-colors">
                  2. Phòng Đối chứng Thuật toán EVSIM
                </a>
              </li>
              <li>
                <a href="/driver/" className="hover:text-[#14532D] transition-colors">
                  3. Ứng dụng Tài xế Giao nhận
                </a>
              </li>
              <li>
                <a href="/maps/?vehicle=0&mode=navigate" className="hover:text-[#14532D] transition-colors">
                  4. Bản đồ Dẫn đường Xe tải
                </a>
              </li>
              <li>
                <a href="/portal/audit/" className="hover:text-[#14532D] transition-colors">
                  5. Cổng Kiểm toán Phát thải ESG
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs">Khám Phá</h4>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <a
                  href="#solutions"
                  onClick={(e) => handleSmoothFooterScroll(e, '#solutions')}
                  className="hover:text-[#14532D] transition-colors"
                >
                  4 trụ cột giải pháp
                </a>
              </li>
              <li>
                <a
                  href="#calculator"
                  onClick={(e) => handleSmoothFooterScroll(e, '#calculator')}
                  className="hover:text-[#14532D] transition-colors"
                >
                  Công cụ tính tiết kiệm ROI &amp; CO₂
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  onClick={(e) => handleSmoothFooterScroll(e, '#workflow')}
                  className="hover:text-[#14532D] transition-colors"
                >
                  Quy trình vận hành 4 bước
                </a>
              </li>
              <li>
                <a
                  href="#showcase"
                  onClick={(e) => handleSmoothFooterScroll(e, '#showcase')}
                  className="hover:text-[#14532D] transition-colors"
                >
                  Kiểm soát vùng cấm &amp; khung giờ
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleSmoothFooterScroll(e, '#pricing')}
                  className="hover:text-[#14532D] transition-colors"
                >
                  Bảng giá &amp; Gói Pilot miễn phí
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & CTA */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#0F172A] uppercase tracking-wider text-xs">Liên Hệ &amp; Hợp Tác</h4>
            <div className="space-y-2 text-xs text-[#475569]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#14532D] shrink-0" />
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#14532D] shrink-0" />
                <span>contact@ecomiles.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#14532D] shrink-0" />
                <span>0889.917.555</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử Miễn Phí</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Copyright & Standards */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
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
