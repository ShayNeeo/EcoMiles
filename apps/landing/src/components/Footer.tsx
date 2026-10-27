import React from 'react';
import { Leaf, MapPin, Mail, Phone, ShieldCheck, ArrowRight, Star } from 'lucide-react';

interface FooterProps {
  onOpenPilotModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPilotModal }) => {
  return (
    <footer className="relative bg-slate-950 border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto">
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
              Nền tảng giúp doanh nghiệp tự động sắp xếp tuyến giao hàng, theo dõi đội xe và tính lượng CO₂ phát thải theo chuẩn quốc tế.
            </p>

            <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Đồng hành cùng Chiến lược Logistics Quốc Gia QĐ 2229/QĐ-TTg</span>
            </div>
          </div>

          {/* Col 2: Solutions */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Giải Pháp</h4>
            <ul className="space-y-2">
              <li><a href="#solutions" className="hover:text-ecomiles-lime transition-colors">Tự động sắp tuyến giao hàng</a></li>
              <li><a href="#solutions" className="hover:text-ecomiles-lime transition-colors">Cập nhật tình hình giao thông</a></li>
              <li><a href="#solutions" className="hover:text-ecomiles-lime transition-colors">Ghép đơn chiều về</a></li>
              <li><a href="#solutions" className="hover:text-ecomiles-lime transition-colors">Theo dõi lượng CO₂</a></li>
              <li><a href="#calculator" className="hover:text-ecomiles-lime transition-colors">Tính mức tiết kiệm và CO₂</a></li>
            </ul>
          </div>

          {/* Col 3: Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Hệ Thống</h4>
            <ul className="space-y-2">
              <li><a href="#showcase" className="hover:text-ecomiles-lime transition-colors">Màn hình quản lý giao hàng</a></li>
              <li><a href="#showcase" className="hover:text-ecomiles-lime transition-colors">Web vận hành cho tài xế</a></li>
              <li><a href="#workflow" className="hover:text-ecomiles-lime transition-colors">Quy trình 8 bước</a></li>
              <li><a href="#team" className="hover:text-ecomiles-lime transition-colors">Đội ngũ EcoMiles</a></li>
              <li><a href="#pricing" className="hover:text-ecomiles-lime transition-colors">Bảng giá gói cước</a></li>
              <li><a href="#pricing" className="hover:text-ecomiles-lime transition-colors">Dùng thử miễn phí 4 - 6 tuần</a></li>
              <li><a href="#pitch-deck" className="hover:text-emerald-400 transition-colors text-emerald-400/80 font-medium flex items-center gap-1"><Star className="w-3 h-3 fill-current" /><span>Kịch bản Pitch Deck (SO 2026)</span></a></li>
            </ul>
          </div>

          {/* Col 4: Contact & CTA */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Liên Hệ &amp; Đăng Ký</h4>
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
              onClick={onOpenPilotModal}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 EcoMiles. Nền tảng Logistics Xanh Thông Minh.
          </div>
          <div className="flex items-center gap-6">
            <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
            <span>Báo cáo theo chuẩn quốc tế</span>
            <span>Hướng đến phát thải ròng bằng 0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
