import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Receipt } from 'lucide-react';
import { ZeroKnowledgeIcon } from './EcoMilesMark';

interface PricingProps {
  onOpenPilotModal: (interest?: string) => void;
}

export const PricingAndPilot: React.FC<PricingProps> = ({ onOpenPilotModal }) => {
  const [activeDrivers, setActiveDrivers] = useState<number>(15);

  const tiers = [
    {
      name: 'Starter',
      price: '1,5-2,5 triệu',
      unit: '/ tháng',
      vehicles: '≤ 10 tài xế',
      features: ['Nhập Excel (.XLSX)', 'Xếp thứ tự giao tự động', 'Vượt mức: +100k/tài xế'],
      highlight: activeDrivers <= 10,
      badge: activeDrivers <= 10 ? 'Phù hợp' : undefined,
    },
    {
      name: 'Gói Nhỏ',
      price: '3-5 triệu',
      unit: '/ tháng',
      vehicles: '11-20 tài xế',
      features: ['Né giờ cấm QĐ 23 & QCVN 41', 'Dẫn đường giọng nói $0 API', 'Vượt mức: +75k/tài xế'],
      highlight: activeDrivers >= 11 && activeDrivers <= 20,
      badge: activeDrivers >= 11 && activeDrivers <= 20 ? 'Phổ biến' : undefined,
    },
    {
      name: 'Gói Vừa',
      price: '8-15 triệu',
      unit: '/ tháng',
      vehicles: '21-100 tài xế',
      features: ['Ghép chiều về đa điểm', 'Sổ CO₂e Excel 3 Sheet', 'Vượt mức: +50k/tài xế'],
      highlight: activeDrivers >= 21 && activeDrivers <= 100,
      badge: activeDrivers >= 21 && activeDrivers <= 100 ? 'Đề xuất' : undefined,
    },
    {
      name: 'Gói Lớn',
      price: '20-40 triệu',
      unit: '/ tháng',
      vehicles: '> 100 tài xế',
      features: ['API tích hợp ERP trực tiếp', 'Khóa mã hóa NĐ 13/2023', 'SLA 24/7 chuyên biệt'],
      highlight: activeDrivers > 100,
      badge: activeDrivers > 100 ? 'Enterprise' : undefined,
    },
  ];

  const comparisonRows = [
    { feature: 'Gom cụm & Chia tải thông minh', starter: 'Cơ bản', small: 'Đầy đủ', medium: 'Đầy đủ', large: 'Tùy biến' },
    { feature: 'Né QĐ 23 · QĐ 01 · Van <950kg', starter: 'Không', small: 'Có', medium: 'Có', large: 'Có' },
    { feature: 'Bản đồ xe tải giọng nói ($0 API)', starter: 'GMaps', small: 'Có', medium: 'Có', large: 'Có' },
    { feature: 'Ghép đơn chiều về (Backhaul)', starter: 'Không', small: 'Không', medium: 'Có', large: 'Có' },
    { feature: 'Sổ CO₂e (GLEC v3.2 / ISO 14083)', starter: 'Không', small: 'Tháng', medium: '3 Sheet', large: 'Từng đơn' },
    { feature: 'Bảo mật NĐ 13/2023', starter: 'Chuẩn', small: 'Chuẩn', medium: 'Riêng biệt', large: 'Khóa riêng' },
  ];

  return (
    <section
      id="pricing"
      className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 em-grid-cosmos text-[#FDF0D5] border-b-4 border-[#C1121F] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-5 border-b border-[#669BBC]/30">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#FDF0D5] tracking-tight leading-tight">
            Bảng giá SaaS theo quy mô đội xe
          </h2>

          <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#002033] border border-[#669BBC]/40 shrink-0">
            {[
              { label: '8 xe', count: 8 },
              { label: '15 xe', count: 15 },
              { label: '45 xe', count: 45 },
              { label: '120 xe', count: 120 },
            ].map((preset) => {
              const isSelected = activeDrivers === preset.count;
              return (
                <button
                  key={preset.count}
                  type="button"
                  onClick={() => setActiveDrivers(preset.count)}
                  className={`relative px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    isSelected ? 'text-[#FDF0D5]' : 'text-[#669BBC] hover:text-[#FDF0D5]'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="pricingFleetPresetPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                      className="absolute inset-0 rounded-lg bg-[#C1121F]"
                    />
                  )}
                  <span className="relative z-10">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 High-Contrast Pricing Cards */}
        <div className="mb-12 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all border-2 ${
                tier.highlight
                  ? 'bg-[#780000] border-[#FDF0D5] text-[#FDF0D5] shadow-2xl'
                  : 'bg-[#FDF0D5] border-[#669BBC] text-[#003049] shadow-lg'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 bg-[#C1121F] text-[#FDF0D5] border border-[#FDF0D5] font-mono font-bold text-[11px] uppercase rounded">
                  {tier.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="font-display text-xl font-black">{tier.name}</h3>
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded ${
                      tier.highlight ? 'bg-[#003049] text-[#FDF0D5]' : 'bg-[#003049] text-[#FDF0D5]'
                    }`}
                  >
                    {tier.vehicles}
                  </span>
                </div>

                <div className={`pb-4 mb-4 border-b ${tier.highlight ? 'border-[#FDF0D5]/25' : 'border-[#D4BF94]'}`}>
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="font-display text-2xl sm:text-3xl font-black tabular-nums">{tier.price}</span>
                    <span className="font-mono text-xs font-bold opacity-80">{tier.unit}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs font-bold">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          tier.highlight ? 'text-[#669BBC]' : 'text-[#AE1F23]'
                        }`}
                      />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenPilotModal(`Đăng ký gói thuê bao - ${tier.name}`)}
                className={`w-full py-3 rounded-lg font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  tier.highlight
                    ? 'bg-[#FDF0D5] hover:bg-[#669BBC] text-[#003049]'
                    : 'bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5]'
                }`}
              >
                <span>Chọn {tier.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Visual Matrix Table */}
        <div className="mb-12 rounded-2xl border-2 border-[#669BBC] bg-[#002033] p-5 sm:p-7 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm tabular-nums">
              <thead>
                <tr className="border-b-2 border-[#669BBC]/40 text-[#669BBC] font-mono text-xs uppercase">
                  <th className="py-3 px-3">Tiêu chuẩn</th>
                  <th className="py-3 px-3">Starter</th>
                  <th className="py-3 px-3">Nhỏ</th>
                  <th className="py-3 px-3 text-[#FDF0D5]">Vừa</th>
                  <th className="py-3 px-3">Lớn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#669BBC]/20 text-[#FDF0D5]">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#003049]/80 transition-colors">
                    <td className="py-3 px-3 font-bold">{row.feature}</td>
                    <td className="py-3 px-3 text-[#669BBC]">{row.starter}</td>
                    <td className="py-3 px-3 text-[#669BBC]">{row.small}</td>
                    <td className="py-3 px-3 font-black text-[#FDF0D5]">{row.medium}</td>
                    <td className="py-3 px-3 text-[#669BBC]">{row.large}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3 Visual Onboarding Tiles + Free Pilot CTA Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-[#FDF0D5] text-[#003049] flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-lg bg-[#C1121F] text-[#FDF0D5] font-mono font-black flex items-center justify-center shrink-0">01</span>
            <div className="text-xs font-extrabold">Pilot miễn phí 4-6 tuần trên Excel đội xe</div>
          </div>
          <div className="p-5 rounded-xl bg-[#FDF0D5] text-[#003049] flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-lg bg-[#003049] text-[#FDF0D5] font-mono font-black flex items-center justify-center shrink-0">
              <ZeroKnowledgeIcon className="w-5 h-5" />
            </span>
            <div className="text-xs font-extrabold">Hợp đồng B2B &amp; Khóa mã hóa NĐ 13/2023</div>
          </div>
          <div className="p-5 rounded-xl bg-[#FDF0D5] text-[#003049] flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-lg bg-[#669BBC] text-[#003049] font-mono font-black flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </span>
            <div className="text-xs font-extrabold">Chuyển khoản &amp; Hóa đơn VAT doanh nghiệp</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#C1121F] border-2 border-[#FDF0D5] p-7 sm:p-9 text-[#FDF0D5] shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
              Thử miễn phí 4-6 tuần cho 3-5 đội xe TP.HCM
            </h3>
            <div className="flex flex-wrap gap-3 font-mono text-xs font-bold">
              <span>0đ thiết lập</span>
              <span>·</span>
              <span>Không ràng buộc hợp đồng</span>
              <span>·</span>
              <span>Đối chứng OBD tại Living Lab</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')}
            className="px-6 py-3.5 rounded-lg bg-[#FDF0D5] hover:bg-[#003049] hover:text-[#FDF0D5] text-[#003049] font-extrabold text-sm shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Đăng ký Pilot ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
