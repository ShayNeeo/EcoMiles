import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  SplitSquareVertical,
  Truck,
  X,
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-slate-900/95 border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng bảng chọn vai trò"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ecomiles-lime/10 border border-ecomiles-lime/25 text-ecomiles-lime text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>4 KHÔNG GIAN VAI TRÒ ĐỘC LẬP + BẢN ĐỒ XE TẢI MỞ ($0 API)</span>
              </div>
              <h2 id="portal-modal-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Chọn Không Gian Làm Việc <span className="text-ecomiles-lime">EcoMiles B2B</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Mỗi vai trò được điền sẵn tài khoản mẫu và cách ly dữ liệu doanh nghiệp độc lập theo Nghị định 13/2023/NĐ-CP.
              </p>
            </div>

            {/* 4 Role Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Role 1: Company Orchestrator (User) */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-ecomiles-lime/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-ecomiles-lime/15 text-ecomiles-lime border border-ecomiles-lime/25">
                      Vai trò 1 · Quản lý
                    </span>
                    <LayoutDashboard className="w-4 h-4 text-ecomiles-lime" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png"
                    alt="Trung Tâm Điều Phối Đội Xe B2B"
                    className="w-full h-28 object-contain mx-auto"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-ecomiles-lime transition-colors">
                    Trung Tâm Điều Phối Đội Xe B2B
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>94/120 đơn · 7/10 xe (-34.9% km)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Xuất Báo cáo ESG Excel 3 Sheet</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/dashboard/"
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở Bảng Điều Khiển</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 2: EVSIM Benchmark Tester */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-cyan-400/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/25">
                      Vai trò 2 · Kiểm định
                    </span>
                    <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png"
                    alt="Phòng Đối Chứng 2 Bên EVSIM"
                    className="w-full h-28 object-contain mx-auto"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Phòng Đối Chứng 2 Bên EVSIM
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Thủ công (374.4 km) vs EcoMiles (243.7 km)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Tải file .XLSX bất kỳ để kiểm chứng</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/benchmark/"
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở Phòng Đối Chứng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 3: 2-Tier Driver App */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-emerald-400/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
                      Vai trò 3 · Tài xế
                    </span>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png"
                    alt="Ứng Dụng Tài Xế 2 Chặng"
                    className="w-full h-28 object-contain mx-auto"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Ứng Dụng Tài Xế 2 Chặng ($0 API)
                  </h3>
                  <div>
                    <select
                      value={selectedPlate}
                      onChange={(e) => setSelectedPlate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                    >
                      <option value="51C-000.09">51C-000.09 (13 điểm · 48.51 km)</option>
                      <option value="51C-000.05">51C-000.05 (15 điểm · 41.14 km)</option>
                      <option value="51C-000.02">51C-000.02 (12 điểm · 34.99 km)</option>
                    </select>
                  </div>
                </div>
                <a
                  href={`/driver/?plate=${encodeURIComponent(selectedPlate)}`}
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở Ứng Dụng Tài Xế</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 4: Zero-Knowledge Admin */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-rose-400/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                      Vai trò 4 · Kiểm toán
                    </span>
                    <Activity className="w-4 h-4 text-rose-400" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/07_desktop_admin_zero_knowledge_audit.png"
                    alt="Cổng Kiểm Toán ESG & Bảo Mật"
                    className="w-full h-28 object-contain mx-auto rounded-lg"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                    Cổng Kiểm Toán &amp; Bảo Mật
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>0% quyền giải mã PII khách hàng</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Cách ly khóa của 3 doanh nghiệp</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/portal/audit/"
                  className="mt-4 w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/15 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở Cổng Kiểm Toán ESG</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
                </a>
              </div>
            </div>

            {/* Dedicated OpenTruck Map Navigator Callout */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-ecomiles-lime/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png"
                  alt="Galaxy Z Fold Truck Map"
                  className="w-12 h-14 object-contain shrink-0 hidden sm:block"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-ecomiles-lime uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Bản Đồ Dẫn Đường Xe Tải Mở EcoMiles (Chế Độ Bắt Đầu Bám Theo Xe)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Hiển thị vùng cấm tải QĐ 23/2018 màu đỏ, giới hạn cầu 13T / 4.5m, giọng nói tiếng Việt và xuất file .GPX ($0 API).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/maps/?vehicle=0&mode=overview"
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10"
                >
                  Xem Bản Đồ Vùng Cấm
                </a>
                <a
                  href="/maps/?vehicle=0&mode=navigate"
                  className="py-2 px-3.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Bắt Đầu Dẫn Đường</span>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
