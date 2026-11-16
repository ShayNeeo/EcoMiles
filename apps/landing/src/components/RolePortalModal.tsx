import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002033]/80 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl bg-[#FDF0D5] text-[#003049] border-2 border-[#003049] rounded-2xl p-5 sm:p-8 shadow-2xl overflow-hidden my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#FDF0D5] bg-[#003049] hover:bg-[#C1121F] rounded-lg transition-colors cursor-pointer"
              aria-label="Đóng bảng chọn vai trò"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-left">
              <h2 id="portal-modal-title" className="font-display text-xl sm:text-2xl font-black text-[#003049] tracking-tight">
                Chọn không gian làm việc EcoMiles B2B
              </h2>
              <p className="font-mono text-xs font-bold text-[#AE1F23] mt-1">
                Bảo mật độc lập đa doanh nghiệp theo Nghị định 13/2023/NĐ-CP
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Role 1 */}
              <div className="flex flex-col justify-between p-4 rounded-xl bg-[#003049] text-[#FDF0D5] border-2 border-[#003049] shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#C1121F] text-[#FDF0D5]">
                      01 · Điều phối
                    </span>
                    <LayoutDashboard className="w-4 h-4 text-[#669BBC]" />
                  </div>
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-[#669BBC]/40">
                    <img
                      src="/pitch-deck-screenshots/01_desktop_b2b_tms_fleet_overview.png"
                      alt="Trung Tâm Điều Phối Đội Xe B2B"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="font-display text-sm font-extrabold">Điều Phối Đội Xe B2B</h3>
                  <div className="font-mono text-[11px] font-bold text-[#669BBC]">
                    −30,5% đến −50,8% km · Excel 3 Sheet
                  </div>
                </div>
                <a
                  href="/dashboard/"
                  className="mt-4 w-full py-2.5 px-3 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Mở Điều Phối</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 2 */}
              <div className="flex flex-col justify-between p-4 rounded-xl bg-[#F8E7C4] text-[#003049] border-2 border-[#003049] shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#003049] text-[#FDF0D5]">
                      02 · Đối chứng
                    </span>
                    <SplitSquareVertical className="w-4 h-4 text-[#AE1F23]" />
                  </div>
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-[#003049]">
                    <img
                      src="/pitch-deck-screenshots/02_desktop_b2b_tms_evsim_dual_simulator.png"
                      alt="Phòng Đối Chứng EVSIM"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="font-display text-sm font-extrabold">Đối Chứng EVSIM</h3>
                  <div className="font-mono text-[11px] font-bold text-[#AE1F23]">
                    2 bản đồ OSRM song song · Nạp Excel
                  </div>
                </div>
                <a
                  href="/benchmark/"
                  className="mt-4 w-full py-2.5 px-3 rounded-lg bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Mở Đối Chứng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 3 */}
              <div className="flex flex-col justify-between p-4 rounded-xl bg-[#780000] text-[#FDF0D5] border-2 border-[#003049] shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FDF0D5] text-[#780000]">
                      03 · Tài xế
                    </span>
                    <Smartphone className="w-4 h-4 text-[#FDF0D5]" />
                  </div>
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-[#FDF0D5]/40">
                    <img
                      src="/pitch-deck-screenshots/04_desktop_maps_overview_qd23_banned_zones.png"
                      alt="Ứng Dụng Tài Xế"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="font-display text-sm font-extrabold">App Tài Xế ($0 API)</h3>
                  <select
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                    className="w-full bg-[#FDF0D5] border border-[#003049] rounded-md px-2 py-1.5 text-xs text-[#003049] font-bold"
                  >
                    <option value="51C-000.09">51C-000.09 (13 điểm · 48,51 km)</option>
                    <option value="51C-000.05">51C-000.05 (15 điểm · 41,14 km)</option>
                    <option value="51C-000.02">51C-000.02 (12 điểm · 34,99 km)</option>
                  </select>
                </div>
                <a
                  href={`/driver/?plate=${encodeURIComponent(selectedPlate)}`}
                  className="mt-4 w-full py-2.5 px-3 rounded-lg bg-[#FDF0D5] hover:bg-[#669BBC] text-[#003049] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Mở App Tài Xế</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 4 */}
              <div className="flex flex-col justify-between p-4 rounded-xl bg-[#669BBC] text-[#003049] border-2 border-[#003049] shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#003049] text-[#FDF0D5]">
                      04 · Bản đồ
                    </span>
                    <Compass className="w-4 h-4 text-[#003049]" />
                  </div>
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-[#003049]">
                    <img
                      src="/pitch-deck-screenshots/05_desktop_maps_live_navigate_follow_truck.png"
                      alt="Bản Đồ Xe Tải QĐ 23"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <h3 className="font-display text-sm font-extrabold">Bản Đồ Cấm Tải</h3>
                  <div className="font-mono text-[11px] font-bold">
                    QĐ 23 · QCVN 41 · Cầu 13T
                  </div>
                </div>
                <a
                  href="/maps/?vehicle=0&mode=navigate"
                  className="mt-4 w-full py-2.5 px-3 rounded-lg bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Mở Bản Đồ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#003049] text-[#FDF0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-[#669BBC] shrink-0" />
                <span>Cách ly Multi-Tenant NĐ 13/2023/NĐ-CP · Không chia sẻ dữ liệu chéo</span>
              </div>
              <a
                href="/dashboard/"
                className="py-2 px-4 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Đăng Nhập Doanh Nghiệp</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
