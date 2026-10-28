import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TrendingDown, Leaf, ArrowRight, DollarSign } from 'lucide-react';

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
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
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
        duration: prefersReducedMotion ? 0 : 0.5,
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
      className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-white/5 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ước Tính Mức Tiết Kiệm Chi Phí &amp; <span className="text-ecomiles-lime">Cắt Giảm CO₂</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Điều chỉnh các thanh trượt theo đội xe thực tế để xem ngay số tiền nhiên liệu, quãng đường và lượng CO₂ có
            thể tiết kiệm mỗi tháng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 7 Cols: Sliders Control Panel */}
          <div className="gsap-calc-panel lg:col-span-7 bg-slate-950/85 rounded-3xl p-6 sm:p-9 border border-white/10 shadow-2xl shadow-black/50 flex flex-col justify-between">
            <div className="mb-6 space-y-3">
              <h3 className="text-xl font-bold text-white">Thông Số Đội Xe &amp; Vận Hành Thực Tế</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-300 font-semibold">Mẫu đội xe B2B:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(10);
                    setDailyKm(54);
                    setFuelConsumption(11.5);
                    setSavingsRate(35);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-ecomiles-lime/40 text-ecomiles-lime font-bold cursor-pointer"
                >
                  10 Xe · Chuỗi Lạnh (-35%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(25);
                    setDailyKm(95);
                    setFuelConsumption(12.0);
                    setSavingsRate(28);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold cursor-pointer"
                >
                  25 Xe · Chuỗi Siêu Thị
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(50);
                    setDailyKm(120);
                    setFuelConsumption(13.5);
                    setSavingsRate(30);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold cursor-pointer"
                >
                  50 Xe · Phân Phối FMCG
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Slider 1: Fleet Size */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-slate-200">Quy mô đội xe giao hàng:</span>
                  <span className="text-base font-extrabold text-ecomiles-lime tabular-nums">
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
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-ecomiles-lime"
                />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>3 xe</span>
                  <span>40 xe</span>
                  <span>80 xe</span>
                </div>
              </div>

              {/* Slider 2: Daily Km */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-slate-200">Quãng đường bình quân/xe/ngày:</span>
                  <span className="text-base font-extrabold text-ecomiles-lime tabular-nums">
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
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-ecomiles-lime"
                />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>30 km</span>
                  <span>100 km</span>
                  <span>200 km</span>
                </div>
              </div>

              {/* Slider 3: Fuel Consumption */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-slate-200">Định mức tiêu hao nhiên liệu:</span>
                  <span className="text-base font-extrabold text-ecomiles-lime tabular-nums">
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
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-ecomiles-lime"
                />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>6L (Xe van nhỏ)</span>
                  <span>12L (Xe tải 1 - 2T)</span>
                  <span>20L (Xe tải nặng)</span>
                </div>
              </div>

              {/* Slider 4: Savings Rate */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                  <span className="text-slate-200">Tỷ lệ quãng đường cắt giảm tối ưu:</span>
                  <span className="text-base font-extrabold text-emerald-400 tabular-nums">
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
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>15% (Cơ sở)</span>
                  <span>25% (Tiêu chuẩn)</span>
                  <span>35% (Chuẩn 120 đơn QĐ 23: -34.9%)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-white/10 text-xs text-slate-300">
              * Tạm tính theo giá dầu 23.500đ/lít và hệ số phát thải 2,68 kg CO₂/lít theo chuẩn ISO 14083 / GLEC v3.2.
            </div>
          </div>

          {/* Right 5 Cols: Pure Financial & Environmental Results Panel (Flat Structure, Zero Nested Cards) */}
          <div className="gsap-calc-panel lg:col-span-5 bg-slate-950 rounded-3xl p-6 sm:p-9 border border-ecomiles-lime/35 shadow-2xl shadow-black/50 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  DỰ TOÁN TIẾT KIỆM MỖI THÁNG
                </span>
                <span className="text-xs font-bold text-ecomiles-lime">
                  26 ngày vận hành
                </span>
              </div>

              {/* Primary Financial Outcome */}
              <div className="pb-6 border-b border-white/10">
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Chi phí nhiên liệu tiết kiệm ròng:</span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-ecomiles-lime tracking-tight tabular-nums">
                  <span ref={moneyNumRef}>{Math.round(moneySavedVND).toLocaleString('vi-VN')}</span>{' '}
                  <span className="text-sm font-bold text-white">VNĐ/tháng</span>
                </div>
                <div className="text-xs sm:text-sm text-emerald-400 font-semibold mt-1.5 tabular-nums">
                  Tiết giảm ~ <span ref={litersNumRef}>{Math.round(litersSaved).toLocaleString('vi-VN')}</span> Lít dầu diesel / tháng
                </div>
              </div>

              {/* Secondary Outcomes: CO2 + Distance */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    <span>CO₂ Tiết Giảm</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white tabular-nums">
                    <span ref={co2NumRef}>{Math.round(co2SavedKg).toLocaleString('vi-VN')}</span>{' '}
                    <span className="text-xs font-normal text-slate-300">kg</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 tabular-nums">
                    ~ <span ref={co2TonsNumRef}>{(co2SavedKg / 1000).toFixed(2)}</span> Tấn CO₂/tháng
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                    <TrendingDown className="w-4 h-4 text-emerald-300" />
                    <span>Quãng Đường Giảm</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white tabular-nums">
                    <span ref={kmNumRef}>{Math.round(kmSaved).toLocaleString('vi-VN')}</span>{' '}
                    <span className="text-xs font-normal text-slate-300">km</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Giảm hao mòn &amp; phí bảo dưỡng
                  </div>
                </div>
              </div>

              {/* Animated Before vs After Monthly Distance Comparison Bar */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-300">Trước tối ưu ({totalMonthlyKm.toLocaleString('vi-VN')} km)</span>
                  <span className="text-ecomiles-lime">
                    Sau EcoMiles ({Math.round(totalMonthlyKm - kmSaved).toLocaleString('vi-VN')} km · -{savingsRate}%)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <motion.div
                    initial={false}
                    animate={{ width: `${100 - savingsRate}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-ecomiles-lime rounded-l-full"
                  />
                  <motion.div
                    initial={false}
                    animate={{ width: `${savingsRate}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="h-full bg-rose-500/35 border-l border-white/30"
                    title={`Cắt giảm ${savingsRate}% quãng đường thừa`}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-8 w-full py-4 px-6 rounded-2xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-black/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng Ký Dùng Thử Miễn Phí 4 - 6 Tuần</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
