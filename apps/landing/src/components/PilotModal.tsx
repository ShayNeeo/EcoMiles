import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  User,
  Truck,
  ClipboardList,
} from 'lucide-react';
import { ReturnMMark } from './EcoMilesMark';

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002033]/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FDF0D5] text-[#003049] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border-2 border-[#003049] max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#003049] text-[#FDF0D5] transition-colors hover:bg-[#C1121F] cursor-pointer"
            aria-label="Đóng cửa sổ đăng ký"
          >
            <X className="w-5 h-5" />
          </button>

          {!submitted ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg bg-[#003049] text-[#FDF0D5] flex items-center justify-center font-bold">
                  <ReturnMMark className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-mono text-[11px] font-bold tracking-wider text-[#AE1F23] uppercase">
                    Pilot 4-6 tuần · 0đ thiết lập
                  </span>
                  <h3 className="font-display text-xl font-black text-[#003049] mt-0.5">
                    Đăng Ký Thử Nghiệm EcoMiles
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="interest" className="block text-xs font-bold text-[#003049] mb-1">
                    Nhu cầu
                  </label>
                  <div className="relative">
                    <ClipboardList className="w-4 h-4 text-[#003049] absolute left-3 top-2.5" />
                    <select
                      id="interest"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] font-semibold focus:bg-[#FDF0D5]"
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
                    <label htmlFor="contact-name" className="block text-xs font-bold text-[#003049] mb-1">
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#003049] absolute left-3 top-2.5" />
                      <input
                        id="contact-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="VD: Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] placeholder-[#003049]/50 focus:bg-[#FDF0D5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company-name" className="block text-xs font-bold text-[#003049] mb-1">
                      Doanh nghiệp *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-[#003049] absolute left-3 top-2.5" />
                      <input
                        id="company-name"
                        type="text"
                        autoComplete="organization"
                        required
                        placeholder="VD: Chuỗi Lạnh Nam Việt"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] placeholder-[#003049]/50 focus:bg-[#FDF0D5]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-bold text-[#003049] mb-1">
                      Điện thoại *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#003049] absolute left-3 top-2.5" />
                      <input
                        id="contact-phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        placeholder="09xx xxx xxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] placeholder-[#003049]/50 focus:bg-[#FDF0D5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-bold text-[#003049] mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#003049] absolute left-3 top-2.5" />
                      <input
                        id="contact-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] placeholder-[#003049]/50 focus:bg-[#FDF0D5]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fleet-size" className="block text-xs font-bold text-[#003049] mb-1">
                      Quy mô đội xe
                    </label>
                    <div className="relative">
                      <Truck className="w-4 h-4 text-[#003049] absolute left-3 top-2.5" />
                      <select
                        id="fleet-size"
                        value={formData.fleetSize}
                        onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] font-semibold focus:bg-[#FDF0D5]"
                      >
                        <option value="Dưới 5 xe">Dưới 5 xe</option>
                        <option value="5-15 xe">5 - 15 xe</option>
                        <option value="15-50 xe">15 - 50 xe</option>
                        <option value="Trên 50 xe">Trên 50 xe</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="operation-area" className="block text-xs font-bold text-[#003049] mb-1">
                      Khu vực
                    </label>
                    <select
                      id="operation-area"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#F8E7C4] border border-[#003049] text-[#003049] font-semibold focus:bg-[#FDF0D5]"
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
                  className="w-full mt-2 py-3 rounded-lg font-extrabold text-xs sm:text-sm text-[#FDF0D5] bg-[#C1121F] hover:bg-[#780000] transition-colors cursor-pointer"
                >
                  Gửi Đăng Ký Pilot
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#003049] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#AE1F23]" />
                  <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#003049] text-[#FDF0D5] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#669BBC]" />
              </div>
              <h3 className="font-display text-xl font-black text-[#003049] mb-2">Đã Nhận Đăng Ký!</h3>
              <p className="text-xs sm:text-sm text-[#003049]/85 mb-6 max-w-sm mx-auto">
                Đội ngũ EcoMiles sẽ liên hệ trong 24h để đối chứng trên file Excel thực tế của bạn.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-lg font-extrabold text-xs text-[#FDF0D5] bg-[#003049] hover:bg-[#C1121F] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
