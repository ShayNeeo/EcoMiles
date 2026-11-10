import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  Smartphone,
  SplitSquareVertical,
  Truck,
  X,
  ShieldCheck,
} from 'lucide-react';

interface RolePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolePortalModal: React.FC<RolePortalModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlate, setSelectedPlate] = useState('51C-000.09');

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Đóng bảng chọn vai trò"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-left">
              <h2 id="portal-modal-title" className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Chọn không gian làm việc <span className="text-[#14532D]">EcoMiles B2B</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                Tài khoản mẫu điền sẵn theo từng vai trò, bảo mật dữ liệu độc lập theo Nghị định 13/2023/NĐ-CP.
              </p>
            </div>

            {/* 4 Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Role 1: Company Orchestrator (User) */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-emerald-600/40 hover:bg-white transition-all shadow-sm group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-[#14532D] border border-emerald-200">
                      Vai trò 1 · Quản lý
                    </span>
                    <LayoutDashboard className="w-4 h-4 text-[#14532D]" />
                  </div>
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <img
                      src="/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png"
                      alt="Trung Tâm Điều Phối Đội Xe B2B"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#14532D] transition-colors">
                    Điều Phối Đội Xe B2B
                  </h3>
                  <ul className="text-xs text-[#475569] space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>94/120 đơn · 7/10 xe (-34,9% km)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Báo cáo ESG Excel 3 Sheet</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/dashboard/"
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Mở Bảng Điều Khiển</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 2: EVSIM Benchmark Tester */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-emerald-600/40 hover:bg-white transition-all shadow-sm group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                      Vai trò 2 · Đối chứng
                    </span>
                    <SplitSquareVertical className="w-4 h-4 text-sky-700" />
                  </div>
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <img
                      src="/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png"
                      alt="Phòng Đối Chứng 2 Bên EVSIM"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#14532D] transition-colors">
                    Đối Chứng Thuật Toán EVSIM
                  </h3>
                  <ul className="text-xs text-[#475569] space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Thủ công (374,4 km) vs EcoMiles (243,7 km)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Tải file Excel kiểm chứng tức thì</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/benchmark/"
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Mở Phòng Đối Chứng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 3: Personal Driver App */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-emerald-600/40 hover:bg-white transition-all shadow-sm group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-[#14532D] border border-emerald-200">
                      Vai trò 3 · Tài xế
                    </span>
                    <Smartphone className="w-4 h-4 text-[#14532D]" />
                  </div>
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <img
                      src="/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png"
                      alt="Ứng Dụng Tài Xế Giao Nhận"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#14532D] transition-colors">
                    Tài Xế Giao Nhận ($0 API)
                  </h3>
                  <div>
                    <select
                      value={selectedPlate}
                      onChange={(e) => setSelectedPlate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-[#0F172A] font-semibold"
                    >
                      <option value="51C-000.09">51C-000.09 (13 điểm · 48,51 km)</option>
                      <option value="51C-000.05">51C-000.05 (15 điểm · 41,14 km)</option>
                      <option value="51C-000.02">51C-000.02 (12 điểm · 34,99 km)</option>
                    </select>
                  </div>
                </div>
                <a
                  href={`/driver/?plate=${encodeURIComponent(selectedPlate)}`}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Mở Ứng Dụng Tài Xế</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 4: QĐ 23 Truck Navigation */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 hover:border-emerald-600/40 hover:bg-white transition-all shadow-sm group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-[#14532D] border border-emerald-200">
                      Vai trò 4 · Bản đồ
                    </span>
                    <Compass className="w-4 h-4 text-[#14532D]" />
                  </div>
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <img
                      src="/pitch-deck-screenshots/05_desktop_maps_live_navigate_follow_truck.png"
                      alt="Bản Đồ Xe Tải Dẫn Đường QĐ 23"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#14532D] transition-colors">
                    Bản Đồ Xe Tải QĐ 23
                  </h3>
                  <ul className="text-xs text-[#475569] space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Cảnh báo trực quan vùng cấm đỏ</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Giới hạn cầu 13T &amp; giọng nói tiếng Việt</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/maps/?vehicle=0&mode=navigate"
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Mở Bản Đồ Xe Tải</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Bottom Callout Strip */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-[#14532D] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#14532D]" />
                    <span>Bảo mật dữ liệu theo Nghị định 13/2023/NĐ-CP</span>
                  </div>
                  <p className="text-xs text-[#475569]">
                    Hệ thống mã hóa dữ liệu độc lập cho từng doanh nghiệp B2B, không chia sẻ thông tin lộ trình và khách hàng.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/dashboard/"
                  className="py-2 px-4 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Đăng Nhập Doanh Nghiệp</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
