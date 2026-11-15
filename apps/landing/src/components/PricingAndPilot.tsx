import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ArrowRight,
  Receipt,
} from 'lucide-react';

interface PricingProps {
  onOpenPilotModal: (interest?: string) => void;
}

export const PricingAndPilot: React.FC<PricingProps> = ({ onOpenPilotModal }) => {
  const [activeDrivers, setActiveDrivers] = useState<number>(15);

  const tiers = [
    {
      name: 'Starter',
      desc: 'Khởi đầu số hóa lộ trình giao nhận cơ bản cho tổ chức nhỏ.',
      price: '1,5 - 2,5 triệu',
      unit: '/ tháng',
      vehicles: 'Tối đa 10 tài xế',
      features: [
        'Nhập đơn hàng từ bảng tính Excel (.XLSX)',
        'Sắp xếp thứ tự giao hàng tự động',
        'Hỗ trợ cài đặt và hướng dẫn sử dụng',
        'Vượt mức: +100.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers <= 10,
      badge: activeDrivers <= 10 ? 'Phù hợp với bạn' : undefined,
    },
    {
      name: 'Gói Nhỏ',
      desc: 'Tối ưu lộ trình và kiểm soát giờ cấm tải nội đô TP.HCM.',
      price: '3 - 5 triệu',
      unit: '/ tháng',
      vehicles: 'Từ 11 - 20 tài xế',
      features: [
        'Toàn bộ tính năng gói Starter',
        'Tự động né khung giờ cấm tải QĐ 23/2018',
        'Bản đồ dẫn đường xe tải giọng nói ($0 API)',
        'Vượt mức: +75.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers >= 11 && activeDrivers <= 20,
      badge: activeDrivers >= 11 && activeDrivers <= 20 ? 'Phổ biến nhất' : undefined,
    },
    {
      name: 'Gói Vừa',
      desc: 'Đầy đủ module ghép đơn chiều về và kiểm toán phát thải ESG.',
      price: '8 - 15 triệu',
      unit: '/ tháng',
      vehicles: 'Từ 21 - 100 tài xế',
      features: [
        'Toàn bộ tính năng gói Nhỏ',
        'Tự động ghép đơn chiều về Backhaul',
        'Báo cáo phát thải CO₂e Excel 3 Sheet',
        'Vượt mức: +50.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers >= 21 && activeDrivers <= 100,
      badge: activeDrivers >= 21 && activeDrivers <= 100 ? 'Đề xuất tối ưu' : undefined,
    },
    {
      name: 'Gói Lớn',
      desc: 'Hạ tầng chuyên biệt, tích hợp ERP và khóa bảo mật riêng.',
      price: '20 - 40 triệu',
      unit: '/ tháng',
      vehicles: 'Trên 100 tài xế',
      features: [
        'Tích hợp API trực tiếp hệ thống ERP',
        'Khóa bảo mật dữ liệu riêng (NĐ 13/2023)',
        'Hỗ trợ kỹ thuật và cam kết SLA 24/7',
        'Vượt mức: +50.000đ/tài xế/tháng',
      ],
      highlight: activeDrivers > 100,
      badge: activeDrivers > 100 ? 'Doanh nghiệp lớn' : undefined,
    },
  ];

  const comparisonRows = [
    {
      feature: 'Tối ưu gom cụm & phân bổ xe',
      starter: 'Cơ bản',
      small: 'Đầy đủ',
      medium: 'Đầy đủ',
      large: 'Tùy biến cao',
    },
    {
      feature: 'Né giờ cấm tải QĐ 23/2018',
      starter: 'Không hỗ trợ',
      small: 'Có hỗ trợ',
      medium: 'Có hỗ trợ',
      large: 'Có hỗ trợ',
    },
    {
      feature: 'Bản đồ xe tải giọng nói $0 API',
      starter: 'Google Maps thường',
      small: 'Có hỗ trợ',
      medium: 'Có hỗ trợ',
      large: 'Có hỗ trợ',
    },
    {
      feature: 'Ghép đơn chiều về (Backhaul)',
      starter: 'Không hỗ trợ',
      small: 'Không hỗ trợ',
      medium: 'Có hỗ trợ',
      large: 'Có hỗ trợ',
    },
    {
      feature: 'Báo cáo kiểm toán CO₂e (ISO 14083)',
      starter: 'Không hỗ trợ',
      small: 'Tổng hợp tháng',
      medium: 'Excel 3 Sheet',
      large: 'Chi tiết từng đơn',
    },
    {
      feature: 'Mã hóa dữ liệu Nghị định 13/2023',
      starter: 'Chuẩn',
      small: 'Chuẩn',
      medium: 'Phân quyền riêng',
      large: 'Khóa mã hóa riêng',
    },
    {
      feature: 'Hình thức thanh toán & Hóa đơn',
      starter: 'Chuyển khoản / VAT',
      small: 'Chuyển khoản / VAT',
      medium: 'Chuyển khoản / VAT',
      large: 'Hợp đồng B2B / VAT',
    },
  ];

  return (
    <section
      id="pricing"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101418] tracking-tight leading-tight">
            Bảng giá dịch vụ phần mềm B2B SaaS
          </h2>

          <p className="mt-4 text-base text-[#5B5F66] leading-relaxed">
            Chọn gói cước theo số lượng tài xế hoạt động hàng tháng. Chạy trực tiếp trên thiết bị sẵn có, không phụ thuộc phần cứng riêng hay phí bản đồ API.
          </p>

          {/* Interactive Fleet Size Selector */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-[#F6F1E7] border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-600 px-2.5">Quy mô đội xe:</span>
            {[
              { label: '8 xe (Khởi đầu)', count: 8 },
              { label: '15 xe (Đội nhỏ)', count: 15 },
              { label: '45 xe (Đội vừa)', count: 45 },
              { label: '120 xe (Doanh nghiệp)', count: 120 },
            ].map((preset) => {
              const isSelected = activeDrivers === preset.count;
              return (
                <button
                  key={preset.count}
                  type="button"
                  onClick={() => setActiveDrivers(preset.count)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isSelected ? 'text-white' : 'text-slate-600 hover:text-[#101418]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="pricingFleetPresetPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-[#101418] shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Clean Daylight SaaS Pricing Cards */}
        <div className="mb-14 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 border ${
                tier.highlight
                  ? 'bg-emerald-50/40 border-2 border-[#101418] shadow-md'
                  : 'bg-[#F6F1E7] border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 bg-[#101418] text-white font-bold text-xs rounded-full shadow-sm">
                  {tier.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-[#101418] mb-1">{tier.name}</h3>
                <p className="mb-5 text-xs text-[#5B5F66] leading-relaxed">{tier.desc}</p>

                <div className="pb-4 mb-5 border-b border-slate-200">
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#101418] tabular-nums">{tier.price}</span>
                    <span className="text-xs text-slate-500 font-medium">{tier.unit}</span>
                  </div>
                  <div className="text-xs font-bold text-[#101418] mt-1">{tier.vehicles}</div>
                </div>

                <div className="space-y-2.5 mb-6">
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-[#334155]">
                      <Check className="w-3.5 h-3.5 text-[#0B7A3B] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPilotModal(`Đăng ký gói thuê bao - ${tier.name}`)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tier.highlight
                    ? 'bg-[#101418] hover:bg-[#1B45D7] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-[#101418] border border-slate-300'
                }`}
              >
                <span>Đăng ký gói này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Structured Feature Comparison Matrix Table */}
        <div className="mb-14 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[#101418] mb-6 text-center">
            Bảng so sánh chi tiết tính năng theo từng gói
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[#101418]">
                  <th className="py-3 px-4 rounded-l-lg font-bold">Tính năng / Tiêu chuẩn</th>
                  <th className="py-3 px-4 font-bold">Starter</th>
                  <th className="py-3 px-4 font-bold">Gói Nhỏ</th>
                  <th className="py-3 px-4 font-bold text-[#101418]">Gói Vừa</th>
                  <th className="py-3 px-4 rounded-r-lg font-bold">Gói Lớn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#334155]">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#101418]">{row.feature}</td>
                    <td className="py-3 px-4 text-slate-600">{row.starter}</td>
                    <td className="py-3 px-4 text-slate-600">{row.small}</td>
                    <td className="py-3 px-4 font-bold text-[#101418]">{row.medium}</td>
                    <td className="py-3 px-4 text-slate-900 font-medium">{row.large}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Corporate Billing & Settlement Workflow Strip */}
        <div className="mb-14 rounded-2xl border border-slate-200 bg-[#F6F1E7] p-6 sm:p-8 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#101418] uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>Quy trình thanh toán B2B minh bạch</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#101418]">
              Hợp đồng, Hóa đơn điện tử VAT &amp; Tài khoản ngân hàng doanh nghiệp
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#101418] font-bold flex items-center justify-center text-sm border border-emerald-200">
                1
              </div>
              <h4 className="font-bold text-sm text-[#101418]">Thí điểm miễn phí 4-6 tuần</h4>
              <p className="text-xs text-[#5B5F66] leading-relaxed">
                Đối chứng mức tiết kiệm nhiên liệu thực tế trên bảng tính Excel đơn hàng hiện có của doanh nghiệp trước khi ký kết.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#101418] font-bold flex items-center justify-center text-sm border border-emerald-200">
                2
              </div>
              <h4 className="font-bold text-sm text-[#101418]">Hợp đồng B2B &amp; Bảo mật NĐ 13</h4>
              <p className="text-xs text-[#5B5F66] leading-relaxed">
                Ký hợp đồng pháp nhân doanh nghiệp, cam kết bảo vệ dữ liệu khách hàng và cấp khóa mã hóa riêng biệt.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#101418] font-bold flex items-center justify-center text-sm border border-emerald-200">
                3
              </div>
              <h4 className="font-bold text-sm text-[#101418]">Chuyển khoản &amp; Hóa đơn VAT</h4>
              <p className="text-xs text-[#5B5F66] leading-relaxed">
                Thanh toán chuyển khoản định kỳ qua tài khoản ngân hàng công ty và nhận hóa đơn điện tử VAT hợp lệ.
              </p>
            </div>
          </div>
        </div>

        {/* Free Pilot CTA Banner */}
        <div className="rounded-2xl bg-[#101418] p-8 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dùng thử miễn phí 4-6 tuần trên đội xe thực tế
            </h3>
            <p className="text-sm text-emerald-100 leading-relaxed">
              Ưu tiên 3-5 doanh nghiệp vận tải đầu tiên tại TP.HCM: miễn 100% phí thiết lập, nạp bảng tính đơn hàng thực tế và kiểm chứng kết quả đối chứng.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200 pt-1">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                Không ràng buộc hợp đồng
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                Hỗ trợ kỹ thuật trực tiếp
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                Bảo mật Nghị định 13/2023
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-[#101418] font-extrabold text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Đăng ký dùng thử ngay</span>
              <ArrowRight className="w-4 h-4 text-[#101418]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
