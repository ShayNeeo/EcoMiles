import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, ShieldCheck, Sparkles, Building2, Phone, Mail, User, Truck, ClipboardList } from 'lucide-react';

interface PilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterest?: string;
}
const PILOT_LIGHTBOX_ASSETS = [
  {
    id: 'studio_stage',
    shortLabel: '0. Studio 7 Thiết Bị',
    title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)',
    subtitle: 'MacBook Pro 16" · Windows XPS 16 · Galaxy Z Fold · iPad Pro M4 · iPhone Duo · 18 Pro Max · S26 Ultra',
    src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'macbook_pro',
    shortLabel: '1. MacBook Pro 16"',
    title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS (/dashboard)',
    subtitle: '3456×2234 · 120 đơn / 7 tuyến ALNS · Báo cáo ESG 3 Sheet',
    src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'windows_xps',
    shortLabel: '2. Windows XPS 16',
    title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM (/benchmark)',
    subtitle: '3840×2400 · Đối chứng 374.4 km vs 243.7 km (-34.9%)',
    src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveHref: '/benchmark/',
  },
  {
    id: 'galaxy_zfold',
    shortLabel: '3. Galaxy Z Fold',
    title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở (/maps)',
    subtitle: '2160×1856 · Chặng giữa (>500kg) · Né vùng cấm QĐ 23/2018',
    src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
  {
    id: 'ipad_pro',
    shortLabel: '4. iPad Pro M4',
    title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
    subtitle: '2752×2064 · Quản lý bến xuất & ghép đơn chiều về',
    src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'iphone_duo',
    shortLabel: '5. iPhone Duo',
    title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
    subtitle: '2420×1080 · Màn 1: Đơn hàng (/driver) · Màn 2: Dẫn đường (/maps)',
    src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
  },
  {
    id: 'iphone_18_pro_max',
    shortLabel: '6. iPhone 18 Pro Max',
    title: 'iPhone 18 Pro Max · App Tài Xế Chế Độ Nắng Gắt (/driver)',
    subtitle: '2868×1320 · Giao hàng 1-chạm & ghép đơn chiều về (2.7% rỗng)',
    src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
  },
  {
    id: 'galaxy_s26_ultra',
    shortLabel: '7. Galaxy S26 Ultra',
    title: 'Samsung Galaxy S26 Ultra · Giao Hẻm Nhỏ & Google Maps Waypoints ($0)',
    subtitle: '3120×1440 · Waypoints + Google Maps Ô tô ($0 API)',
    src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
] as const;

export const PilotModal: React.FC<PilotModalProps> = ({ isOpen, onClose, initialInterest }) => {
  const [submitted, setSubmitted] = useState(false);
  const [pilotLightboxIdx, setPilotLightboxIdx] = useState<number | null>(null);
  useEffect(() => {
    if (pilotLightboxIdx === null) return undefined;
    const total = PILOT_LIGHTBOX_ASSETS.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPilotLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setPilotLightboxIdx((p) => ((p ?? 0) - 1 + total) % total);
      else if (e.key === 'ArrowRight') setPilotLightboxIdx((p) => ((p ?? 0) + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pilotLightboxIdx]);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    interest: initialInterest || 'Dùng thử miễn phí 4 - 6 tuần',
    fleetSize: '5-15 xe',
    area: 'TP. Hồ Chí Minh (Ưu tiên đợt 1)',
    notes: '',
    deviceMix: [
      'MacBook / Windows (B2B TMS & EVSIM)',
      'iPad / Tablet (Kho Vận & Cross-dock)',
      'Galaxy Z Fold / Gập Đôi (Cockpit /maps)',
      'iPhone / Samsung Android (App Tài Xế)',
    ],
  });

  const toggleDeviceMix = (chip: string) => {
    setFormData((prev) => ({
      ...prev,
      deviceMix: prev.deviceMix.includes(chip)
        ? prev.deviceMix.filter((c) => c !== chip)
        : [...prev.deviceMix, chip],
    }));
  };
  // initialInterest is already seeded in useState above

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-white/10 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Đóng cửa sổ đăng ký"
          >
            <X className="w-5 h-5" />
          </button>

          {!submitted ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-ecomiles-lime/10 border border-ecomiles-lime/20 text-ecomiles-lime flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-ecomiles-lime" />
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-ecomiles-lime uppercase bg-ecomiles-lime/10 px-2.5 py-0.5 rounded-full border border-ecomiles-lime/20">
                    TƯ VẤN GIẢI PHÁP &amp; DÙNG THỬ
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Đăng Ký Nhu Cầu Với EcoMiles</h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Chọn nội dung doanh nghiệp quan tâm. Chương trình dùng thử 4 - 6 tuần ưu tiên <strong>3 - 5 doanh nghiệp đầu tiên tại TP.HCM</strong>.
              </p>

              {/* 7-Device Studio Cover Banner Strip inside Pilot Modal */}
              <div className="mb-4 p-2.5 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                    alt="EcoMiles 7-Device Flagship Studio Cover"
                    onClick={() => setPilotLightboxIdx(0)}
                    className="h-10 sm:h-12 w-auto object-contain rounded-lg border border-white/10 bg-black/40 p-0.5 shrink-0 cursor-zoom-in"
                  />
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-black text-ecomiles-lime uppercase tracking-wider truncate">
                      Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      MacBook Pro 16&quot; · Windows XPS 16 · Z Fold · iPad Pro · iPhone Duo · 18 Pro Max · S26 Ultra
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPilotLightboxIdx(0)}
                  className="px-2 py-1 rounded-lg bg-ecomiles-lime/15 hover:bg-ecomiles-lime hover:text-slate-950 text-ecomiles-lime border border-ecomiles-lime/40 text-[10px] font-extrabold shrink-0 cursor-pointer transition-colors"
                >
                  🔍 2.4K
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="interest" className="block text-xs font-semibold text-slate-300 mb-1">
                    Nhu cầu quan tâm
                  </label>
                  <div className="relative">
                    <ClipboardList className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <select
                      id="interest"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                    >
                      <option>Dùng thử miễn phí 4 - 6 tuần</option>
                      <option>Đăng ký gói thuê bao</option>
                      <option>Báo cáo CO₂ &amp; tư vấn theo năm</option>
                      <option>Kết nối đơn chiều về</option>
                      <option>Triển khai &amp; tích hợp hệ thống</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-300 mb-1">
                      Họ và tên người liên hệ *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company-name" className="block text-xs font-semibold text-slate-300 mb-1">
                      Doanh nghiệp / Bưu cục *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        id="company-name"
                        type="text"
                        autoComplete="organization"
                        required
                        placeholder="VD: Bưu cục GHN Q. Bình Thạnh"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                      Số điện thoại *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        id="contact-phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        placeholder="09xx xxx xxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-300 mb-1">
                      Email công việc *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fleet-size" className="block text-xs font-semibold text-slate-300 mb-1">
                      Quy mô đội xe giao hàng
                    </label>
                    <div className="relative">
                      <Truck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        id="fleet-size"
                        value={formData.fleetSize}
                        onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                      >
                        <option value="Dưới 5 xe">Dưới 5 xe</option>
                        <option value="5-15 xe">5 - 15 xe (Phù hợp để dùng thử)</option>
                        <option value="15-50 xe">15 - 50 xe</option>
                        <option value="Trên 50 xe">Trên 50 xe</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="operation-area" className="block text-xs font-semibold text-slate-300 mb-1">
                      Khu vực vận hành chính
                    </label>
                    <select
                      id="operation-area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-ecomiles-lime"
                    >
                      <option value="TP. Hồ Chí Minh (Ưu tiên đợt 1)">TP. Hồ Chí Minh (Đợt 1)</option>
                      <option value="Hà Nội (Đợt 2)">Hà Nội (Đợt 2)</option>
                      <option value="Bình Dương / Đồng Nai">Bình Dương / Đồng Nai</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Thiết bị vận hành đang sử dụng ({formData.deviceMix.length}/4 nhóm)
                    </label>
                    <span className="text-[10px] text-ecomiles-lime font-bold">$0 Map API</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { chip: 'MacBook / Windows (B2B TMS & EVSIM)', idx: 1 },
                      { chip: 'iPad / Tablet (Kho Vận & Cross-dock)', idx: 4 },
                      { chip: 'Galaxy Z Fold / Gập Đôi (Cockpit /maps)', idx: 3 },
                      { chip: 'iPhone / Samsung Android (App Tài Xế)', idx: 5 },
                    ].map(({ chip, idx }) => {
                      const active = formData.deviceMix.includes(chip);
                      return (
                        <div
                          key={chip}
                          className={`rounded-xl text-[11px] font-semibold transition-all border flex items-center justify-between ${
                            active
                              ? 'bg-ecomiles-lime/15 text-ecomiles-lime border-ecomiles-lime/40'
                              : 'bg-slate-950 text-slate-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleDeviceMix(chip)}
                            className="flex-1 px-2.5 py-1.5 text-left truncate cursor-pointer"
                          >
                            {active ? '✓ ' : '+ '}
                            {chip}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPilotLightboxIdx(idx)}
                            title={`Phóng to Mockup 2.4K: ${chip}`}
                            className="px-2 py-1.5 text-[10px] font-mono font-extrabold text-ecomiles-lime hover:bg-ecomiles-lime hover:text-slate-950 rounded-r-xl transition-colors cursor-zoom-in shrink-0"
                          >
                            🔍
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Gửi Thông Tin Đăng Ký</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cam kết bảo mật dữ liệu theo Nghị định 13/2023/NĐ-CP</span>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Đã Gửi Thông Tin Thành Công!</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed max-w-sm mx-auto">
                Cảm ơn bạn. Đội ngũ EcoMiles sẽ liên hệ trực tiếp trong vòng 24h để trao đổi nhu cầu và đề xuất phương án phù hợp.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 transition-all cursor-pointer"
              >
                Hoàn Tất &amp; Đóng
              </button>
            </div>
          )}
        </motion.div>
        </div>
      </AnimatePresence>
      {pilotLightboxIdx !== null &&
        typeof document !== 'undefined' &&
        (() => {
          const total = PILOT_LIGHTBOX_ASSETS.length;
          const safeIdx = ((pilotLightboxIdx % total) + total) % total;
          const activeAsset = PILOT_LIGHTBOX_ASSETS[safeIdx];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeAsset.title}
              className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6"
              onClick={() => setPilotLightboxIdx(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                      [{safeIdx + 1}/{total}] {activeAsset.title}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{activeAsset.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPilotLightboxIdx((safeIdx - 1 + total) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      ‹ Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setPilotLightboxIdx((safeIdx + 1) % total)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      Tiếp ›
                    </button>
                    <a
                      href={activeAsset.src}
                      download
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                    >
                      Tải PNG 2.4K
                    </a>
                    <a
                      href={activeAsset.liveHref}
                      className="px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                    >
                      Mở App Live ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => setPilotLightboxIdx(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      ✕ Đóng
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={activeAsset.src}
                    alt={activeAsset.title}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {PILOT_LIGHTBOX_ASSETS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPilotLightboxIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        idx === safeIdx
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {item.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}
    </>
  );
};
