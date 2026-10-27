import React from 'react';
import { ArrowRight, Compass, Download, FileSpreadsheet, Leaf, Mail, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react';

interface FooterProps {
  onOpenPilotModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPilotModal }) => {
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

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/dashboard/"
              className="px-4 py-2.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Trung Tâm B2B (/dashboard)</span>
            </a>
            <a
              href="/maps/?vehicle=0&mode=navigate"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-4 h-4 text-ecomiles-lime" />
              <span>Bản Đồ Xe Tải (/maps)</span>
            </a>
            <a
              href="/driver/"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-white/15 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>App Tài Xế (/driver)</span>
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
                <a href="#solutions" className="hover:text-ecomiles-lime transition-colors">
                  4 trụ cột công nghệ VRPTW &amp; GLEC
                </a>
              </li>
              <li>
                <a href="#calculator" className="hover:text-ecomiles-lime transition-colors">
                  Công cụ tính ROI &amp; CO₂e tiết giảm
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-ecomiles-lime transition-colors">
                  Quy trình vận hành 8 bước khép kín
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-ecomiles-lime transition-colors">
                  Sân khấu 7 thiết bị (MacBook · Z Fold · Duo)
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-ecomiles-lime transition-colors">
                  Bảng giá SaaS &amp; Gói Pilot 4 - 6 tuần
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

        {/* Full-Width Architectural Brand Close */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>© 2026 EcoMiles Platform · Urban Logistics VRPTW &amp; ISO 14083 / GLEC v3.2 Carbon Accounting.</div>
          <div className="flex flex-wrap items-center gap-5">
            <span>Zero-Knowledge AES-256-GCM (NĐ 13/2023/NĐ-CP)</span>
            <span>100% Đường Phố Thật OSRM ($0 Map API)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
