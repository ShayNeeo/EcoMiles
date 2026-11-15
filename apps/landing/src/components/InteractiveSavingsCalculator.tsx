import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TrendingDown, ArrowRight, DollarSign } from 'lucide-react';
import { Co2AuditIcon } from './EcoMilesMark';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface CalculatorProps {
  onOpenPilotModal: () => void;
}

export const InteractiveSavingsCalculator: React.FC<CalculatorProps> = ({ onOpenPilotModal }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [fleetSize, setFleetSize] = useState<number>(12);
  const [dailyKm, setDailyKm] = useState<number>(85);
  const [fuelConsumption, setFuelConsumption] = useState<number>(11); // L/100km
  const [savingsRate, setSavingsRate] = useState<number>(25); // %

  const moneyNumRef = useRef<HTMLSpanElement | null>(null);
  const litersNumRef = useRef<HTMLSpanElement | null>(null);
  const co2NumRef = useRef<HTMLSpanElement | null>(null);
  const co2TonsNumRef = useRef<HTMLSpanElement | null>(null);
  const kmNumRef = useRef<HTMLSpanElement | null>(null);
  const countProxy = useRef({
    money: 12 * 85 * 26 * 0.25 * 0.11 * 23500,
    liters: 12 * 85 * 26 * 0.25 * 0.11,
    co2: 12 * 85 * 26 * 0.25 * 0.11 * 2.68,
    km: 12 * 85 * 26 * 0.25,
  });

  const workingDays = 26; // days/month
  const fuelPrice = 23500; // VND/liter
  const emissionFactor = 2.68; // kg CO2 / liter diesel (ISO 14083 standard)

  const totalMonthlyKm = fleetSize * dailyKm * workingDays;
  const kmSaved = (totalMonthlyKm * savingsRate) / 100;
  const litersSaved = (kmSaved * fuelConsumption) / 100;
  const moneySavedVND = litersSaved * fuelPrice;
  const co2SavedKg = litersSaved * emissionFactor;

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !sectionRef.current) return;

      gsap.fromTo(
        '.gsap-calc-panel',
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: sectionRef }
  );

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.to(countProxy.current, {
        money: moneySavedVND,
        liters: litersSaved,
        co2: co2SavedKg,
        km: kmSaved,
        duration: prefersReducedMotion ? 0 : 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => {
          if (moneyNumRef.current) {
            moneyNumRef.current.textContent = Math.round(countProxy.current.money).toLocaleString('vi-VN');
          }
          if (litersNumRef.current) {
            litersNumRef.current.textContent = Math.round(countProxy.current.liters).toLocaleString('vi-VN');
          }
          if (co2NumRef.current) {
            co2NumRef.current.textContent = Math.round(countProxy.current.co2).toLocaleString('vi-VN');
          }
          if (co2TonsNumRef.current) {
            co2TonsNumRef.current.textContent = (countProxy.current.co2 / 1000).toFixed(2);
          }
          if (kmNumRef.current) {
            kmNumRef.current.textContent = Math.round(countProxy.current.km).toLocaleString('vi-VN');
          }
        },
      });
    },
    { dependencies: [moneySavedVND, litersSaved, co2SavedKg, kmSaved], scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="calculator"
      className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F6F1E7] border-t border-slate-200/80 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101418] tracking-tight leading-tight">
            Ước tính mức tiết kiệm chi phí &amp; cắt giảm CO₂
          </h2>
          <p className="mt-4 text-base text-[#5B5F66] leading-relaxed">
            Kéo các thanh trượt theo quy mô đội xe thực tế để xem ngay số tiền nhiên liệu, số lít dầu và lượng CO₂ tiết kiệm mỗi tháng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 7 Cols: Sliders Control Panel */}
          <div className="gsap-calc-panel lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="mb-6 space-y-3">
              <h3 className="text-lg font-bold text-[#101418]">Thông số đội xe &amp; vận hành</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#5B5F66] font-medium">Mẫu tham khảo:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(10);
                    setDailyKm(54);
                    setFuelConsumption(11.5);
                    setSavingsRate(35);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#101418] font-semibold cursor-pointer transition-colors"
                >
                  10 xe · Chuỗi lạnh (-35%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(25);
                    setDailyKm(95);
                    setFuelConsumption(12.0);
                    setSavingsRate(28);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  25 xe · Siêu thị
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(50);
                    setDailyKm(120);
                    setFuelConsumption(13.5);
                    setSavingsRate(30);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  50 xe · FMCG
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Slider 1: Fleet Size */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-[#334155]">Quy mô đội xe giao hàng:</span>
                  <span className="text-base font-extrabold text-[#101418] tabular-nums">
                    {fleetSize} xe
                  </span>
                </div>
                <input
                  aria-label="Quy mô đội xe giao hàng"
                  type="range"
                  min="3"
                  max="80"
                  step="1"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#101418]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>3 xe</span>
                  <span>40 xe</span>
                  <span>80 xe</span>
                </div>
              </div>

              {/* Slider 2: Daily Km */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-[#334155]">Quãng đường bình quân/xe/ngày:</span>
                  <span className="text-base font-extrabold text-[#101418] tabular-nums">
                    {dailyKm} km
                  </span>
                </div>
                <input
                  aria-label="Quãng đường trung bình mỗi xe mỗi ngày"
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={dailyKm}
                  onChange={(e) => setDailyKm(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#101418]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>30 km</span>
                  <span>100 km</span>
                  <span>200 km</span>
                </div>
              </div>

              {/* Slider 3: Fuel Consumption */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-[#334155]">Định mức tiêu hao nhiên liệu:</span>
                  <span className="text-base font-extrabold text-[#101418] tabular-nums">
                    {fuelConsumption} L / 100km
                  </span>
                </div>
                <input
                  aria-label="Mức tiêu hao nhiên liệu"
                  type="range"
                  min="6"
                  max="20"
                  step="0.5"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#101418]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>6L (Xe van nhỏ)</span>
                  <span>12L (Xe tải 1 - 2T)</span>
                  <span>20L (Xe tải nặng)</span>
                </div>
              </div>

              {/* Slider 4: Savings Rate */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-[#334155]">Tỷ lệ quãng đường cắt giảm:</span>
                  <span className="text-base font-extrabold text-[#0B7A3B] tabular-nums">
                    {savingsRate}%
                  </span>
                </div>
                <input
                  aria-label="Tỷ lệ quãng đường dự kiến cắt giảm"
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B7A3B]"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>15% (Cơ sở)</span>
                  <span>25% (Tiêu chuẩn)</span>
                  <span>35% (Chuẩn 120 đơn QĐ 23: -34,9%)</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
              * Tạm tính theo giá dầu 23.500đ/lít và hệ số phát thải 2,68 kg CO₂/lít (chuẩn ISO 14083 / GLEC v3.2).
            </div>
          </div>

          {/* Right 5 Cols: Financial & Environmental Results Panel */}
          <div className="gsap-calc-panel lg:col-span-5 bg-[#101418] text-[#F6F1E7] rounded-[4px] border border-[#101418] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-4">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C9C3B6]">
                  Dự toán tiết kiệm mỗi tháng
                </span>
                <span className="font-mono text-xs font-medium text-[#C9C3B6]">
                  26 ngày vận hành
                </span>
              </div>

              {/* Primary Financial Outcome */}
              <div className="pb-5 border-b border-white/15">
                <div className="text-xs font-medium text-[#C9C3B6] mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#0B7A3B]" />
                  <span>Chi phí nhiên liệu tiết kiệm ròng:</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#F6F1E7] tracking-tight tabular-nums">
                  <span ref={moneyNumRef}>{Math.round(moneySavedVND).toLocaleString('vi-VN')}</span>{' '}
                  <span className="text-sm font-normal text-[#C9C3B6]">VNĐ/tháng</span>
                </div>
                <div className="text-xs sm:text-sm text-[#C9C3B6] mt-1 tabular-nums">
                  Tiết giảm ~ <span ref={litersNumRef}>{Math.round(litersSaved).toLocaleString('vi-VN')}</span> Lít dầu diesel / tháng
                </div>
              </div>

              {/* Secondary Outcomes: CO2 + Distance */}
              <div className="grid grid-cols-2 gap-4 pb-5 border-b border-white/15">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-[#C9C3B6] mb-1">
                    <Co2AuditIcon className="w-3.5 h-3.5 text-[#0B7A3B]" />
                    <span>CO₂ Tiết Giảm</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-[#F6F1E7] tabular-nums">
                    <span ref={co2NumRef}>{Math.round(co2SavedKg).toLocaleString('vi-VN')}</span>{' '}
                    <span className="text-xs font-normal text-[#C9C3B6]">kg</span>
                  </div>
                  <div className="text-xs text-[#0B7A3B] font-semibold mt-0.5 tabular-nums">
                    ~ <span ref={co2TonsNumRef}>{(co2SavedKg / 1000).toFixed(2)}</span> tấn/tháng
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200 mb-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Quãng Đường Giảm</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                    <span ref={kmNumRef}>{Math.round(kmSaved).toLocaleString('vi-VN')}</span>{' '}
                    <span className="text-xs font-normal text-emerald-200">km</span>
                  </div>
                  <div className="text-xs text-emerald-300 mt-0.5">
                    Giảm hao mòn xe
                  </div>
                </div>
              </div>

              {/* Animated Before vs After Monthly Distance Comparison Bar */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-200">
                  <span>Trước: {totalMonthlyKm.toLocaleString('vi-VN')} km</span>
                  <span className="text-white font-bold">
                    Sau: {Math.round(totalMonthlyKm - kmSaved).toLocaleString('vi-VN')} km (-{savingsRate}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-emerald-950/60 overflow-hidden flex">
                  <motion.div
                    initial={false}
                    animate={{ width: `${100 - savingsRate}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="h-full bg-emerald-400 rounded-l-full"
                  />
                  <motion.div
                    initial={false}
                    animate={{ width: `${savingsRate}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="h-full bg-white/20"
                    title={`Cắt giảm ${savingsRate}% quãng đường`}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-6 w-full py-3.5 px-5 rounded-xl bg-white hover:bg-emerald-50 text-[#101418] font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử 4-6 Tuần</span>
              <ArrowRight className="w-4 h-4 text-[#101418]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
