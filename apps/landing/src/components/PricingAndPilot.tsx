import React, { useState } from 'react';
import { Tag, Check, Sparkles, ArrowRight, FileText, RefreshCw, Calculator, Info, Plug } from 'lucide-react';

interface PricingProps {
  onOpenPilotModal: (interest?: string) => void;
}

export const PricingAndPilot: React.FC<PricingProps> = ({ onOpenPilotModal }) => {
  const [monthlyOrders, setMonthlyOrders] = useState<number>(100);
  const [averageWeight, setAverageWeight] = useState<number>(50);
  const [averageDistance, setAverageDistance] = useState<number>(20);
  const backhaulFeeEstimate = monthlyOrders * (5000 + averageWeight * averageDistance * 10);

  const tiers = [
    {
      name: 'Gói Starter',
      desc: 'Mức khởi đầu dễ tiếp cận cho đơn vị mới đưa hoạt động giao nhận lên hệ thống.',
      price: '1,5 - 2,5 triệu',
      unit: '/ tháng',
      vehicles: 'Tối đa 10 tài xế',
      features: [
        'Tự động sắp xếp tuyến giao hàng cơ bản',
        'Nhập đơn hàng từ bảng tính',
        'Hỗ trợ thiết lập và bắt đầu sử dụng',
        'Vượt mức: +100.000đ/tài xế/tháng',
      ],
      highlight: false,
    },
    {
      name: 'Gói Nhỏ',
      desc: 'Phù hợp với đội giao nhận nhỏ cần theo dõi đơn hàng và tài xế tập trung.',
      price: '3 - 5 triệu',
      unit: '/ tháng',
      vehicles: 'Từ 11 - 20 tài xế',
      features: [
        'Tất cả tính năng của gói Starter',
        'Tích hợp dữ liệu giao thông thời gian thực',
        'Theo dõi tài xế và tiến độ đơn hàng',
        'Vượt mức: +75.000đ/tài xế/tháng',
      ],
      highlight: true,
      badge: 'PHỔ BIẾN NHẤT',
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
        'Báo cáo nhiên liệu và lượng CO₂',
        'Vượt mức: +50.000đ/tài xế/tháng',
      ],
      highlight: false,
    },
    {
      name: 'Gói Lớn',
      desc: 'Giải pháp linh hoạt cho mạng lưới giao nhận lớn hoặc có yêu cầu vận hành riêng.',
      price: '20 - 40 triệu',
      unit: '/ tháng',
      vehicles: 'Trên 100 tài xế • Có thể thỏa thuận',
      features: [
        'Tùy chỉnh kết nối với hệ thống hiện có',
        'Hạ tầng vận hành theo nhu cầu doanh nghiệp',
        'Hỗ trợ kỹ thuật và đào tạo ưu tiên',
        'Vượt mức: +50.000đ/tài xế/tháng',
      ],
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-950 border-t border-white/5 scroll-mt-24">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-ecomiles-lime mb-4">
            <Tag className="w-3.5 h-3.5" />
            <span>BẢNG GIÁ MINH BẠCH &amp; LINH HOẠT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Đầu Tư Thông Minh, <span className="text-ecomiles-lime">Thu Hồi Vốn Nhanh Chóng</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Chọn gói theo số lượng tài xế hoạt động mỗi tháng. Doanh nghiệp có thể bắt đầu nhỏ và nâng cấp khi nhu cầu tăng.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mb-16 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-6 sm:p-8 xl:p-6 flex flex-col justify-between transition-all duration-300 ${
                tier.highlight
                  ? 'bg-slate-900 border-2 border-ecomiles-lime shadow-2xl shadow-ecomiles-lime/10 relative'
                  : 'bg-slate-900/60 border border-white/10 hover:border-white/20'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-ecomiles-lime text-slate-950 font-extrabold text-[10px] tracking-wider rounded-full shadow-md uppercase">
                  {tier.badge}
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="mb-6 text-xs leading-relaxed text-slate-400">{tier.desc}</p>

                {/* Price Display */}
                <div className="pb-6 mb-6 border-b border-white/10">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-xs text-slate-400 font-semibold">{tier.unit}</span>
                  </div>
                  <div className="text-xs font-bold text-ecomiles-lime mt-1.5">{tier.vehicles}</div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {tier.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onOpenPilotModal(`Đăng ký gói thuê bao - ${tier.name}`)}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tier.highlight
                    ? 'bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                }`}
              >
                <span>Đăng Ký Gói Này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-ecomiles-lime">
              <Sparkles className="h-3.5 w-3.5" />
              <span>DỊCH VỤ BỔ SUNG THEO NHU CẦU</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
              Báo Cáo CO₂ Theo Năm &amp; Kết Nối Đơn Chiều Về
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Hai dịch vụ được đăng ký riêng theo quy mô vận hành, không gộp cứng vào giá thuê bao hàng tháng.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/30 p-6 shadow-xl sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Hợp đồng theo năm
                </span>
              </div>

              <h4 className="text-xl font-extrabold text-white sm:text-2xl">Báo Cáo CO₂ &amp; Tư Vấn Giảm Phát Thải</h4>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Báo giá riêng theo số phương tiện, khối lượng dữ liệu, tần suất báo cáo và phạm vi tư vấn.
              </p>

              <div className="my-6 space-y-3 text-xs text-slate-200 sm:text-sm">
                {[
                  'Kiểm kê phát thải theo chuyến xe, đơn hàng và đội phương tiện',
                  'Chuẩn hóa dữ liệu nhiên liệu, quãng đường và hệ số phát thải',
                  'Báo cáo định kỳ, so sánh theo năm và hồ sơ phục vụ ESG',
                  'Tư vấn mục tiêu giảm phát thải và lộ trình cải thiện vận hành',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onOpenPilotModal('Báo cáo CO₂ & tư vấn theo năm')}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20 cursor-pointer"
              >
                <span>Đăng Ký Tư Vấn Theo Năm</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </article>

            <article className="rounded-3xl border border-ecomiles-lime/30 bg-slate-900 p-6 shadow-xl sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ecomiles-lime/20 bg-ecomiles-lime/10 text-ecomiles-lime">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-ecomiles-lime/20 bg-ecomiles-lime/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ecomiles-lime">
                  Tính theo mức sử dụng
                </span>
              </div>

              <h4 className="text-xl font-extrabold text-white sm:text-2xl">Module Kết Nối Đơn Chiều Về</h4>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Doanh nghiệp đăng ký module riêng. Phí được dự toán theo tổng số đơn kết nối, khối lượng bình quân và quãng đường vận chuyển.
              </p>

              <div className="my-5 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold">Mẫu sản lượng chiều về:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthlyOrders(120);
                      setAverageWeight(85);
                      setAverageDistance(18);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-ecomiles-lime/35 text-ecomiles-lime font-bold cursor-pointer"
                  >
                    120 đơn Kho Lạnh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthlyOrders(500);
                      setAverageWeight(60);
                      setAverageDistance(22);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-slate-300 font-semibold cursor-pointer"
                  >
                    500 đơn Nội Đô
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthlyOrders(1500);
                      setAverageWeight(110);
                      setAverageDistance(28);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-slate-300 font-semibold cursor-pointer"
                  >
                    1.500 đơn Liên Quận
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <label htmlFor="backhaul-orders">Số đơn/tháng</label>
                      <strong className="text-ecomiles-lime">{monthlyOrders}</strong>
                    </div>
                    <input
                      id="backhaul-orders"
                      type="range"
                      min="20"
                      max="2000"
                      step="20"
                      value={monthlyOrders}
                      onChange={(event) => setMonthlyOrders(Math.max(1, Number(event.target.value)))}
                      className="w-full accent-ecomiles-lime cursor-pointer"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <label htmlFor="backhaul-weight">Kg/đơn</label>
                      <strong className="text-ecomiles-lime">{averageWeight} kg</strong>
                    </div>
                    <input
                      id="backhaul-weight"
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={averageWeight}
                      onChange={(event) => setAverageWeight(Math.max(1, Number(event.target.value)))}
                      className="w-full accent-ecomiles-lime cursor-pointer"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-white/10">
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                      <label htmlFor="backhaul-distance">Km/đơn</label>
                      <strong className="text-ecomiles-lime">{averageDistance} km</strong>
                    </div>
                    <input
                      id="backhaul-distance"
                      type="range"
                      min="5"
                      max="80"
                      step="1"
                      value={averageDistance}
                      onChange={(event) => setAverageDistance(Math.max(1, Number(event.target.value)))}
                      className="w-full accent-ecomiles-lime cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-ecomiles-lime/20 bg-slate-950 p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Calculator className="h-4 w-4 text-ecomiles-lime" />
                  <span>Dự toán phí module mỗi tháng</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-ecomiles-lime">
                  {backhaulFeeEstimate.toLocaleString('vi-VN')}đ
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  Công thức minh họa: 5.000đ/đơn + 10đ/kg/km. Đơn giá chính thức được hiệu chỉnh theo sản lượng, cung đường và thỏa thuận với doanh nghiệp.
                </p>
              </div>

              <button
                onClick={() => onOpenPilotModal('Kết nối đơn chiều về')}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ecomiles-lime py-3 text-xs font-bold text-slate-950 transition-colors hover:bg-yellow-300 cursor-pointer"
              >
                <span>Đăng Ký Kết Nối Đơn Chiều Về</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </article>
          </div>
        </div>

        <div className="mb-16 rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
          <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.6fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                <Plug className="h-3.5 w-3.5 text-ecomiles-lime" />
                <span>Chính sách khách hàng mới</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">Phí Triển Khai &amp; Tích Hợp Một Lần</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Khoản phí onboarding được báo giá trước khi ký hợp đồng và tách riêng khỏi phí thuê bao hàng tháng.
              </p>
              <div className="mt-5">
                <button
                  onClick={() => onOpenPilotModal('Triển khai & tích hợp hệ thống')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-ecomiles-lime px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-ecomiles-lime/10 transition-all hover:bg-yellow-300 cursor-pointer"
                >
                  <span>Đăng Ký Tư Vấn &amp; Nhận Báo Giá Triển Khai</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-950" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                'Khảo sát, làm sạch và nhập dữ liệu ban đầu',
                'Cấu hình tài khoản, bưu cục và đội phương tiện',
                'Đào tạo người quản lý và tài xế sử dụng web',
                'Kết nối API hoặc phần mềm doanh nghiệp đang dùng',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-2xl border border-white/5 bg-slate-950/70 p-3 text-xs text-slate-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ecomiles-lime" />
                  <span>{item}</span>
                </div>
              ))}
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100 sm:col-span-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>Mức phí phụ thuộc số điểm vận hành, chất lượng dữ liệu và độ phức tạp tích hợp; mọi hạng mục được xác nhận trong báo giá riêng.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Free Pilot Callout Banner */}
        <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-ecomiles-lime/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ecomiles-lime/10 border border-ecomiles-lime/30 text-xs font-bold text-ecomiles-lime">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CHƯƠNG TRÌNH DÙNG THỬ MIỄN PHÍ 4 - 6 TUẦN</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Trải Nghiệm Miễn Phí Trên Dữ Liệu Thực Tế
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Dành cho <strong>3 - 5 doanh nghiệp đầu tiên tại TP.HCM</strong> có đội xe từ 5 - 15 phương tiện. EcoMiles sẽ hỗ trợ chuẩn bị dữ liệu và đo mức tiết kiệm thực tế trước khi doanh nghiệp quyết định sử dụng.
            </p>
          </div>

          <button
            onClick={() => onOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-ecomiles-lime px-6 py-3.5 text-xs font-extrabold text-slate-950 shadow-xl transition-all hover:bg-yellow-300 sm:w-auto sm:px-8 sm:text-sm md:shrink-0"
          >
            <span>Đăng Ký Dùng Thử Miễn Phí</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </section>
  );
};
