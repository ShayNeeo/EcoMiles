import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Sparkles,
  ArrowRight,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface PricingProps {
  onOpenPilotModal: (interest?: string) => void;
}

export const PricingAndPilot: React.FC<PricingProps> = ({ onOpenPilotModal }) => {
  const [activeDrivers, setActiveDrivers] = useState<number>(15);

  const tiers = [
    {
      name: 'Gói Starter',
      desc: 'Mức khởi đầu dễ tiếp cận cho đơn vị mới đưa hoạt động giao nhận lên hệ thống.',
      price: '1,5 - 2,5 triệu',
      unit: '/ tháng',
      vehicles: 'Tối đa 10 tài xế',
      features: [
        'Tự động sắp xếp tuyến giao hàng cơ bản',
        'Nhập đơn hàng từ bảng tính Excel (.XLSX)',
        'Hỗ trợ thiết lập và bắt đầu sử dụng',
        'Vượt mức: +100.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers <= 10,
      badge: activeDrivers <= 10 ? 'Đề xuất cho bạn' : undefined,
    },
    {
      name: 'Gói Nhỏ',
      desc: 'Phù hợp với đội giao nhận nhỏ cần theo dõi đơn hàng và tài xế tập trung.',
      price: '3 - 5 triệu',
      unit: '/ tháng',
      vehicles: 'Từ 11 - 20 tài xế',
      features: [
        'Tất cả tính năng của gói Starter',
        'Tự động né khung giờ cấm tải QĐ 23/2018',
        'Theo dõi tài xế và tiến độ đơn hàng trực tiếp',
        'Vượt mức: +75.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers >= 11 && activeDrivers <= 20,
      badge: activeDrivers >= 11 && activeDrivers <= 20 ? 'Phổ biến nhất' : undefined,
    },
    {
      name: 'Gói Vừa',
      desc: 'Dành cho doanh nghiệp có nhiều tuyến và cần kiểm soát hiệu quả vận hành sâu hơn.',
      price: '8 - 15 triệu',
      unit: '/ tháng',
      vehicles: 'Từ 21 - 100 tài xế',
      features: [
        'Tất cả tính năng của gói Nhỏ',
        'Tự động ghép đơn cho chiều xe quay về',
        'Báo cáo nhiên liệu và lượng CO₂ tự động',
        'Vượt mức: +50.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers >= 21 && activeDrivers <= 100,
      badge: activeDrivers >= 21 && activeDrivers <= 100 ? 'Đề xuất cho bạn' : undefined,
    },
    {
      name: 'Gói Lớn',
      desc: 'Giải pháp linh hoạt cho mạng lưới giao nhận lớn hoặc có yêu cầu vận hành riêng.',
      price: '20 - 40 triệu',
      unit: '/ tháng',
      vehicles: 'Trên 100 tài xế • Có thể thỏa thuận',
      features: [
        'Tùy chỉnh kết nối với hệ thống ERP hiện có',
        'Cách ly dữ liệu doanh nghiệp độc lập (NĐ 13/2023)',
        'Hỗ trợ kỹ thuật và đào tạo ưu tiên 24/7',
        'Vượt mức: +50.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers > 100,
      badge: activeDrivers > 100 ? 'Đề xuất cho bạn' : undefined,
    },
  ];

  return (
    <section
      id="pricing"
      className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-white/5 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Đầu Tư Thông Minh, <span className="text-ecomiles-lime">Thu Hồi Vốn Nhanh Chóng</span>
          </h2>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Chọn gói theo số lượng tài xế hoạt động mỗi tháng. Chạy trực tiếp trên máy tính và điện thoại sẵn có của
            doanh nghiệp — $0 phí thiết bị chuyên dụng, $0 phí bản đồ API.
          </p>

          {/* Interactive Fleet Size Tier Matcher */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900 border border-white/10">
            <span className="text-xs font-bold text-slate-200 px-2">Quy mô đội xe của bạn:</span>
            {[
              { label: '8 tài xế (Khởi đầu)', count: 8 },
              { label: '15 tài xế (Đội nhỏ)', count: 15 },
              { label: '45 tài xế (Đội vừa)', count: 45 },
              { label: '120 tài xế (Mạng lưới lớn)', count: 120 },
            ].map((preset) => {
              const isSelected = activeDrivers === preset.count;
              return (
                <button
                  key={preset.count}
                  type="button"
                  onClick={() => setActiveDrivers(preset.count)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isSelected ? 'text-slate-950' : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="pricingFleetPresetPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-ecomiles-lime shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 SaaS Pricing Cards Grid (Clean & Flat) */}
        <div className="mb-16 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-6 sm:p-8 xl:p-6 flex flex-col justify-between transition-all duration-300 ${
                tier.highlight
                  ? 'bg-slate-900 border-2 border-ecomiles-lime shadow-2xl shadow-black/60'
                  : 'bg-slate-900/65 border border-white/10 hover:border-white/20'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3.5 py-1 bg-ecomiles-lime text-slate-950 font-extrabold text-xs tracking-wider rounded-full shadow-md uppercase">
                  {tier.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="mb-6 text-xs sm:text-sm leading-relaxed text-slate-300">{tier.desc}</p>

                <div className="pb-5 mb-6 border-b border-white/10">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-xs text-slate-300 font-semibold">{tier.unit}</span>
                  </div>
                  <div className="text-xs font-bold text-ecomiles-lime mt-1.5">{tier.vehicles}</div>
                </div>

                <div className="space-y-3 mb-8">
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPilotModal(`Đăng ký gói thuê bao - ${tier.name}`)}
                className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tier.highlight
                    ? 'bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 shadow-lg shadow-black/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                }`}
              >
                <span>Đăng Ký Gói Này</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* 2 Concise Add-on Cards (Equal-Height, Zero Nested Calculators) */}
        <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="flex flex-col justify-between rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-6 shadow-xl shadow-black/40 sm:p-8">
            <div>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  Dịch vụ kiểm toán ESG
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                Báo Cáo CO₂ &amp; Tư Vấn Giảm Phát Thải Theo Năm
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Phục vụ doanh nghiệp xuất khẩu và chuỗi cung ứng xanh cần hồ sơ kiểm kê phát thải đạt chuẩn ISO 14083 / GLEC v3.2.
              </p>

              <div className="my-6 space-y-3 text-xs sm:text-sm text-slate-200">
                {[
                  'Kiểm kê phát thải TTW / WTW theo từng chuyến xe, đơn hàng và biển số',
                  'Kết xuất tự động Báo cáo Excel 3 Sheet (.XLS), CSV và PDF kiểm toán',
                  'Tư vấn lộ trình cắt giảm phát thải và chuyển đổi phương tiện xanh',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenPilotModal('Báo cáo CO₂ & tư vấn theo năm')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs sm:text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 cursor-pointer"
            >
              <span>Đăng Ký Tư Vấn Báo Cáo ESG</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <article className="flex flex-col justify-between rounded-3xl border border-ecomiles-lime/30 bg-slate-900/80 p-6 shadow-xl shadow-black/40 sm:p-8">
            <div>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ecomiles-lime/20 bg-ecomiles-lime/10 text-ecomiles-lime">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-ecomiles-lime/20 bg-ecomiles-lime/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ecomiles-lime">
                  Tính theo sản lượng thực tế
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                Module Kết Nối Đơn Hàng Chiều Về (Backhaul)
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Tự động ghép đơn lấy hàng dọc hành lang xe quay về kho Tân Bình, hạ tỷ lệ chạy rỗng từ 32.8% xuống 2.7%.
              </p>

              <div className="my-6 space-y-3 text-xs sm:text-sm text-slate-200">
                {[
                  'Chỉ tính phí khi ghép đơn chiều về thành công (Minh họa: 5.000đ/đơn + 10đ/kg/km)',
                  'Tự động thu hồi hàng hoàn, bao bì, pallet hoặc ghép hàng liên kho B2B',
                  'Hiển thị điểm lấy hàng chiều về ngay trên ứng dụng điện thoại tài xế (/driver)',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-ecomiles-lime" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenPilotModal('Kết nối đơn chiều về')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ecomiles-lime py-3 text-xs sm:text-sm font-extrabold text-slate-950 transition-colors hover:bg-yellow-300 cursor-pointer"
            >
              <span>Đăng Ký Module Đơn Chiều Về</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </div>

        {/* Pilot Offer Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-ecomiles-lime/40 p-8 sm:p-12 shadow-2xl shadow-black/60">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ecomiles-lime/15 border border-ecomiles-lime/30 text-ecomiles-lime text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>CHƯƠNG TRÌNH THỬ NGHIỆM PILOT MIỄN PHÍ 4 - 6 TUẦN</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Kiểm Chứng Mức Tiết Kiệm Ngay Trên <span className="text-ecomiles-lime">Đội Xe Thực Tế Của Bạn</span>
              </h3>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl">
                Dành cho 3 – 5 doanh nghiệp đối tác đầu tiên (quy mô 10 – 100 xe): miễn phí 100% chi phí thiết lập, nạp
                thử bảng tính đơn hàng thực tế và đo lường đối chứng Trước – Sau trong 4 – 6 tuần.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col items-stretch sm:items-center lg:items-end justify-center">
              <button
                type="button"
                onClick={() => onOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-black/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng Ký Pilot Miễn Phí Ngay</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <span className="text-xs text-slate-300 mt-2.5 text-center lg:text-right">
                Không ràng buộc hợp đồng · Hỗ trợ kỹ thuật trực tiếp tại kho
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
