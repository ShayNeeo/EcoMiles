import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [previewAsset, setPreviewAsset] = useState<{
    src: string;
    title: string;
    href: string;
    cta: string;
  } | null>(null);

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="portal-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-5xl bg-slate-900/95 border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/80 overflow-hidden my-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Đóng bảng chọn vai trò"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ecomiles-lime/10 border border-ecomiles-lime/25 text-ecomiles-lime text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>4 KHÔNG GIAN VAI TRÒ ĐỘC LẬP + BẢN ĐỒ XE TẢI OPENTRUCK ($0 API)</span>
              </div>
              <h2 id="portal-modal-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Chọn Không Gian Làm Việc <span className="text-ecomiles-lime">EcoMiles B2B</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Mỗi vai trò được điền sẵn tài khoản mẫu và cách ly dữ liệu bằng mã hóa phong bì AES-256-GCM (Nghị định 13/2023/NĐ-CP).
              </p>
            </div>

            {/* 4 Role Cards Grid with Hardware Mockup Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {/* Role 1: Company Orchestrator (User) */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-ecomiles-lime/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-ecomiles-lime/15 text-ecomiles-lime border border-ecomiles-lime/25">
                      Vai trò 1 · Quản lý (User)
                    </span>
                    <LayoutDashboard className="w-4 h-4 text-ecomiles-lime" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png"
                    alt="MacBook Pro 16 B2B CRM/TMS"
                    onClick={() =>
                      setPreviewAsset({
                        src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
                        title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối Đội Xe B2B TMS',
                        href: '/dashboard/',
                        cta: 'Mở /dashboard',
                      })
                    }
                    className="w-full h-28 object-contain mx-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-ecomiles-lime transition-colors">
                    Trung Tâm Điều Phối Đội Xe B2B
                  </h3>
                  <ul className="text-[11px] text-slate-300 space-y-1">
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
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở /dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 2: EVSIM Benchmark Tester */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-cyan-400/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/25">
                      Vai trò 2 · Kiểm định (Tester)
                    </span>
                    <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png"
                    alt="Dell XPS 16 EVSIM Dual Simulator"
                    onClick={() =>
                      setPreviewAsset({
                        src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
                        title: 'Dell Windows 11 XPS 16 · Phòng Đối Chứng Kép EVSIM Simulator',
                        href: '/benchmark/',
                        cta: 'Mở /benchmark',
                      })
                    }
                    className="w-full h-28 object-contain mx-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Phòng Đối Chứng 2 Bên EVSIM
                  </h3>
                  <ul className="text-[11px] text-slate-300 space-y-1">
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
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở /benchmark</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 3: 2-Tier Driver App */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-emerald-400/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/25">
                      Vai trò 3 · Tài xế (Driver)
                    </span>
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png"
                    alt="iPhone Duo Driver App & Live Map"
                    onClick={() =>
                      setPreviewAsset({
                        src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
                        title: 'iPhone Duo Dual-Screen · App Tài Xế 2 Chặng & Bản Đồ Live',
                        href: `/driver/?plate=${encodeURIComponent(selectedPlate)}`,
                        cta: 'Mở /driver (PIN 0000)',
                      })
                    }
                    className="w-full h-28 object-contain mx-auto cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    App Tài Xế 2 Chặng ($0 Map API)
                  </h3>
                  <div>
                    <select
                      value={selectedPlate}
                      onChange={(e) => setSelectedPlate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white font-semibold"
                    >
                      <option value="51C-000.09">51C-000.09 (13 điểm · 48.51 km)</option>
                      <option value="51C-000.05">51C-000.05 (15 điểm · 41.14 km)</option>
                      <option value="51C-000.02">51C-000.02 (12 điểm · 34.99 km)</option>
                    </select>
                  </div>
                </div>
                <a
                  href={`/driver/?plate=${encodeURIComponent(selectedPlate)}`}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở /driver (PIN 0000)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Role 4: Zero-Knowledge Admin */}
              <div className="flex flex-col justify-between p-4 rounded-2xl bg-slate-950/85 border border-white/10 hover:border-rose-400/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25">
                      Vai trò 4 · Hệ thống (Admin)
                    </span>
                    <Activity className="w-4 h-4 text-rose-400" />
                  </div>
                  <img
                    src="/pitch-deck-screenshots/07_desktop_admin_zero_knowledge_audit.png"
                    alt="Zero-Knowledge Admin Monitor"
                    onClick={() =>
                      setPreviewAsset({
                        src: '/pitch-deck-screenshots/07_desktop_admin_zero_knowledge_audit.png',
                        title: 'Desktop Admin · Giám Sát Hạ Tầng Zero-Knowledge & KMS',
                        href: '/portal/audit/',
                        cta: 'Mở /portal/audit',
                      })
                    }
                    className="w-full h-28 object-contain mx-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                  <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                    Giám Sát Hạ Tầng Zero-Knowledge
                  </h3>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>0% quyền giải mã PII (AES-256-GCM)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Cách ly khóa KMS của 3 doanh nghiệp</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="/portal/audit/"
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/15 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Mở /portal/audit</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
                </a>
              </div>
            </div>

            {/* Dedicated OpenTruck Map Navigator Callout (/maps) */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-ecomiles-lime/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png"
                  alt="Galaxy Z Fold Truck Map"
                  onClick={() =>
                    setPreviewAsset({
                      src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
                      title: 'Samsung Galaxy Z Fold · Buồng Lái Bản Đồ Dẫn Đường Xe Tải Mở (/maps)',
                      href: '/maps/?vehicle=0&mode=navigate',
                      cta: 'Bắt Đầu Lái (/maps Live)',
                    })
                  }
                  className="w-12 h-14 object-contain shrink-0 hidden sm:block cursor-zoom-in hover:opacity-90 transition-opacity"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-ecomiles-lime uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Bản Đồ Dẫn Đường Xe Tải Mở EcoMiles (/maps · Chế Độ Bắt Đầu Follow-Truck)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Hiển thị vùng cấm tải QĐ 23/2018 màu đỏ, giới hạn cầu 13T / 4.5m, giọng nói tiếng Việt và xuất file .GPX sang OsmAnd Truck ($0 API).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="/maps/?vehicle=0&mode=overview"
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10"
                >
                  Xem Vùng Cấm (/maps)
                </a>
                <a
                  href="/maps/?vehicle=0&mode=navigate"
                  className="py-2 px-3.5 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Bắt Đầu Lái (/maps Live)</span>
                </a>
              </div>
            </div>

            {/* 7-Device Studio Cover Banner Strip */}
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                    alt="EcoMiles 7-Device Studio Banner"
                    onClick={() =>
                      setPreviewAsset({
                        src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
                        title: 'Hệ Sinh Thái 7 Thiết Bị Studio 2.4K Đồng Bộ Thời Gian Thực',
                        href: '/pitch-deck/',
                        cta: 'Bộ 28 Ảnh Pitch Deck →',
                      })
                    }
                    className="h-11 sm:h-12 w-auto object-contain rounded-lg border border-white/10 bg-black/40 p-0.5 shrink-0 cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                  <div>
                    <div className="text-[11px] font-black text-ecomiles-lime uppercase tracking-wider">
                      Hệ Sinh Thái 7 Thiết Bị Studio 2.4K — Chạm 1-Click Mở Trực Tiếp Từng Thiết Bị
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Đồng bộ tức thì qua Cloudflare Edge Worker &amp; Bảo mật Zero-Knowledge AES-256-GCM
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="#showcase"
                    onClick={onClose}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10"
                  >
                    Sân Khấu 3D (#showcase)
                  </a>
                  <a
                    href="/pitch-deck/"
                    className="py-1.5 px-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-black text-xs"
                  >
                    Bộ 28 Ảnh Pitch Deck →
                  </a>
                </div>
              </div>

              {/* 7-Device 1-Click Live Launch Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-2 border-t border-white/10">
                {[
                  { device: 'MacBook Pro 16"', sub: 'B2B CRM/TMS', href: '/dashboard/' },
                  { device: 'Windows 11 XPS 16', sub: 'EVSIM Dual Lab', href: '/benchmark/' },
                  { device: 'Galaxy Z Fold', sub: 'Truck Cockpit', href: '/maps/?vehicle=0&mode=navigate' },
                  { device: 'iPad Pro M4', sub: 'Taplo & ESG', href: '/dashboard/' },
                  { device: 'iPhone Duo', sub: '2-Tier Driver', href: `/driver/?plate=${encodeURIComponent(selectedPlate)}` },
                  { device: 'iPhone 18 Pro Max', sub: 'Driver ePOD', href: `/driver/?plate=${encodeURIComponent(selectedPlate)}` },
                  { device: 'Galaxy S26 Ultra', sub: 'Follow-Truck Nav', href: '/maps/?vehicle=0&mode=navigate' },
                ].map((item) => (
                  <a
                    key={item.device}
                    href={item.href}
                    className="group flex flex-col justify-between rounded-xl border border-white/10 bg-slate-900/90 px-2.5 py-1.5 hover:border-ecomiles-lime/60 hover:bg-slate-800/90 transition-all"
                  >
                    <span className="text-[10px] font-extrabold text-white group-hover:text-ecomiles-lime truncate">
                      {item.device}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400 group-hover:text-slate-200 truncate">
                      {item.sub} →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
      {previewAsset &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={previewAsset.title}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
            onClick={() => setPreviewAsset(null)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                    {previewAsset.title}
                  </div>
                  <div className="text-[11px] text-slate-300">Mockup Thiết Bị 2.4K Độ Phân Giải Cao</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewAsset.src}
                    download
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                  >
                    Tải PNG
                  </a>
                  <a
                    href={previewAsset.href}
                    className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
                  >
                    <span>{previewAsset.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(null)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    aria-label="Đóng xem trước"
                  >
                    ✕ Đóng
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                <img
                  src={previewAsset.src}
                  alt={previewAsset.title}
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
