import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Building2,
  Phone,
  Mail,
  User,
  Truck,
  ClipboardList,
} from 'lucide-react';

interface PilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterest?: string;
}

export const PilotModal: React.FC<PilotModalProps> = ({ isOpen, onClose, initialInterest }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    interest: initialInterest || 'Dùng thử miễn phí 4 - 6 tuần',
    fleetSize: '5-15 xe',
    area: 'TP. Hồ Chí Minh (Ưu tiên đợt 1)',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white text-[#101418] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Đóng cửa sổ đăng ký"
          >
            <X className="w-5 h-5" />
          </button>

          {!submitted ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#101418] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-[#101418]" />
                </div>
                <div>
                  <span className="text-xs font-bold tracking-wider text-[#101418] uppercase">
                    Tư vấn giải pháp &amp; Dùng thử
                  </span>
                  <h3 className="text-xl font-bold text-[#101418] mt-0.5">Đăng Ký Nhu Cầu Với EcoMiles</h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#5B5F66] mb-5 leading-relaxed">
                Chương trình dùng thử miễn phí 4-6 tuần ưu tiên{' '}
                <strong className="text-[#101418]">3-5 doanh nghiệp đầu tiên tại TP.HCM</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="interest" className="block text-xs font-semibold text-[#334155] mb-1">
                    Nhu cầu quan tâm
                  </label>
                  <div className="relative">
                    <ClipboardList className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      id="interest"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
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
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-[#334155] mb-1">
                      Họ và tên người liên hệ *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company-name" className="block text-xs font-semibold text-[#334155] mb-1">
                      Doanh nghiệp / Bưu cục *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="company-name"
                        type="text"
                        autoComplete="organization"
                        required
                        placeholder="VD: Chuỗi Lạnh Nam Việt"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-[#334155] mb-1">
                      Số điện thoại *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="contact-phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        placeholder="09xx xxx xxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-[#334155] mb-1">
                      Email công việc *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fleet-size" className="block text-xs font-semibold text-[#334155] mb-1">
                      Quy mô đội xe giao hàng
                    </label>
                    <div className="relative">
                      <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        id="fleet-size"
                        value={formData.fleetSize}
                        onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
                      >
                        <option value="Dưới 5 xe">Dưới 5 xe</option>
                        <option value="5-15 xe">5 - 15 xe (Phù hợp để dùng thử)</option>
                        <option value="15-50 xe">15 - 50 xe</option>
                        <option value="Trên 50 xe">Trên 50 xe</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="operation-area" className="block text-xs font-semibold text-[#334155] mb-1">
                      Khu vực vận hành chính
                    </label>
                    <select
                      id="operation-area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-[#101418] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101418]"
                    >
                      <option value="TP. Hồ Chí Minh (Ưu tiên đợt 1)">TP. Hồ Chí Minh (Đợt 1)</option>
                      <option value="Hà Nội (Đợt 2)">Hà Nội (Đợt 2)</option>
                      <option value="Bình Dương / Đồng Nai">Bình Dương / Đồng Nai</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#101418] hover:bg-[#1B45D7] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Gửi Thông Tin Đăng Ký</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B5F66] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0B7A3B]" />
                  <span>Cam kết bảo mật dữ liệu theo Nghị định 13/2023/NĐ-CP</span>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#101418] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-[#101418]" />
              </div>
              <h3 className="text-xl font-bold text-[#101418] mb-2">Đã Gửi Thông Tin Thành Công!</h3>
              <p className="text-xs sm:text-sm text-[#5B5F66] mb-6 leading-relaxed max-w-sm mx-auto">
                Cảm ơn bạn. Đội ngũ EcoMiles sẽ liên hệ trực tiếp trong vòng 24h để trao đổi nhu cầu và đề xuất phương án phù hợp.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#101418] hover:bg-[#1B45D7] transition-all cursor-pointer shadow-sm"
              >
                Hoàn Tất &amp; Đóng
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
