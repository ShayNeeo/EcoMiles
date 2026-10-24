import React, { useState } from 'react';
import { X, LayoutDashboard, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, Truck, AlertTriangle, MapPin } from 'lucide-react';

interface RolePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RolePortalModal: React.FC<RolePortalModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlate, setSelectedPlate] = useState('51C-000.01');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-ecomiles-lime/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Đóng bảng chọn vai trò"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ecomiles-lime/10 border border-ecomiles-lime/25 text-ecomiles-lime text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trải nghiệm trực tiếp không cần đăng ký</span>
          </div>
          <h2 id="portal-modal-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Chọn vai trò truy cập <span className="text-ecomiles-lime">EcoMiles</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Hệ thống trực tuyến 24/7. Phiên trải nghiệm được cấp quyền sẵn để bạn thao tác ngay mà không cần đăng ký tài khoản.
          </p>
        </div>

        {/* Three Role Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Role 1: Central Dispatcher */}
          <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-ecomiles-lime/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-ecomiles-lime/15 border border-ecomiles-lime/30 flex items-center justify-center text-ecomiles-lime">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-ecomiles-lime/10 text-ecomiles-lime border border-ecomiles-lime/20">
                  Quản lý
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-ecomiles-lime transition-colors">
                Bàn điều hành trung tâm
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Tối ưu hóa 80 đơn hàng với thuật toán VRPTW 2-Opt, vẽ lộ trình bám sát đường phố, giám sát 10 xe và tải báo cáo phát thải CO₂.
              </p>
              <ul className="text-[11.5px] text-slate-300 space-y-1.5 mb-5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bản đồ OSM bám sát lộ trình đường bộ</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bộ lọc cách ly từng tuyến xe</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Xuất báo cáo phát thải CSV/Excel</span>
                </li>
              </ul>
            </div>

            <a
              href="/app/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-ecomiles-lime/20 group-hover:shadow-lg group-hover:shadow-ecomiles-lime/30"
            >
              <span>Vào Bàn điều hành</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </a>
          </div>

          {/* Role 2: Local Dispatcher */}
          <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-cyan-400/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
                  Điều phối trạm
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">
                Điều phối viên trạm / Local Dispatcher
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Tạo và chỉnh sửa đơn hàng trực tiếp với GOFA Places Autocomplete, phân bổ chuyến xe cục bộ và giám sát lộ trình trạm trung chuyển.
              </p>
              <ul className="text-[11.5px] text-slate-300 space-y-1.5 mb-5">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Tra cứu địa chỉ GOFA Places chuẩn xác</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Gán tọa độ &amp; phường xã chuẩn hành chính</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Đồng bộ tức thì với trung tâm</span>
                </li>
              </ul>
            </div>

            <a
              href="/dispatcher/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-400/20 group-hover:shadow-lg group-hover:shadow-cyan-400/30"
            >
              <span>Vào Điều phối trạm</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </a>
          </div>

          {/* Role 3: Driver */}
          <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-emerald-400/50 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[10.5px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  Tài xế
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors">
                Ứng dụng tài xế di động
              </h3>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Nhận thứ tự điểm giao hàng theo lộ trình phân công, cập nhật trạng thái 'Đã giao' / 'Báo hoãn' 1-chạm và cảnh báo giờ cấm tải.
              </p>

              {/* Vehicle Picker */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Chọn biển số xe để xem lộ trình:
                </label>
                <div className="relative">
                  <select
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white font-semibold outline-none focus:border-emerald-400"
                  >
                    <option value="51C-000.01">51C-000.01 (Tân Bình · Q3 · Q1)</option>
                    <option value="51C-000.02">51C-000.02 (Thủ Đức)</option>
                    <option value="51C-000.03">51C-000.03 (Q7 · Nam Sài Gòn)</option>
                    <option value="51C-000.04">51C-000.04 (Bình Thạnh)</option>
                    <option value="51C-000.05">51C-000.05 (Phú Nhuận)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-amber-400 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-md p-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Cảnh báo cấm tải TP.HCM (06-09h & 16-20h)</span>
              </div>
            </div>

            <a
              href={`/driver/?plate=${encodeURIComponent(selectedPlate)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-400/20 group-hover:shadow-lg group-hover:shadow-emerald-400/30"
            >
              <span>Vào App tài xế</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </a>
          </div>
        </div>

        {/* Story Dashboard & XLSX Upload Benchmark Lab Quick Launch */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-950/90 border border-ecomiles-lime/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-black text-ecomiles-lime uppercase tracking-wider">
              MỚI: Trung Tâm Báo Cáo Tự Động, Giảm Xe Chạy Rỗng &amp; Thử File Excel (.xlsx)
            </div>
            <p className="text-xs text-slate-300">
              Tải file <code className="text-ecomiles-lime">.xlsx</code> của doanh nghiệp bạn lên để đối chứng trực tiếp với cách chia tuyến thủ công, kiểm tra giờ cấm QĐ 23/2018 và xuất báo cáo Excel 3 bảng tự động.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/dashboard/"
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10"
            >
              <span>Tổng quan &amp; Báo cáo</span>
              <ArrowRight className="w-3.5 h-3.5 text-ecomiles-lime" />
            </a>
            <a
              href="/benchmark/"
              className="py-2 px-3.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
            >
              <span>Thử File .XLSX</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Mọi thao tác cập nhật của tài xế và điều phối trạm sẽ đồng bộ thời gian thực lên Bàn điều hành</span>
          </div>
          <span className="hidden sm:inline text-slate-500">Mã PIN tài xế: <strong>0000</strong></span>
        </div>
      </div>
    </div>
  );
};
