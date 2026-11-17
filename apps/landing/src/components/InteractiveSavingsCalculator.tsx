import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { Co2AuditIcon, FuelPhysicsIcon, TruckWeightIcon, VanExemptIcon } from './EcoMilesMark';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface CalculatorProps {
  onOpenPilotModal: () => void;
}

export const InteractiveSavingsCalculator: React.FC<CalculatorProps> = ({ onOpenPilotModal }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [fleetSize, setFleetSize] = useState<number>(10);
  const [dailyKm, setDailyKm] = useState<number>(85);
  const [fuelConsumption, setFuelConsumption] = useState<number>(10.5);
  const [savingsRate, setSavingsRate] = useState<number>(31);

  const moneyNumRef = useRef<HTMLSpanElement | null>(null);
  const litersNumRef = useRef<HTMLSpanElement | null>(null);
  const co2NumRef = useRef<HTMLSpanElement | null>(null);
  const co2TonsNumRef = useRef<HTMLSpanElement | null>(null);
  const kmNumRef = useRef<HTMLSpanElement | null>(null);
  const countProxy = useRef({
    money: 10 * 85 * 26 * 0.31 * 0.105 * 23500,
    liters: 10 * 85 * 26 * 0.31 * 0.105,
    co2: 10 * 85 * 26 * 0.31 * 0.105 * 2.68,
    km: 10 * 85 * 26 * 0.31,
  });

  const workingDays = 26;
  const fuelPrice = 23500;
  const emissionFactor = 2.68;

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
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
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
        duration: prefersReducedMotion ? 0 : 0.35,
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
      className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 em-grid-cosmos text-[#FDF0D5] border-b-4 border-[#C1121F] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10 pb-5 border-b border-[#669BBC]/30">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#FDF0D5] tracking-tight leading-[1.04]">
            Đo tiền dầu &amp; tấn CO₂ giảm mỗi tháng
          </h2>
          <span className="inline-flex items-center gap-2 rounded-md bg-[#669BBC] px-3 py-1.5 font-mono text-[11px] font-extrabold text-[#003049] shrink-0">
            <FuelPhysicsIcon className="w-4 h-4 text-[#003049]" />
            <span>CHỌN MẪU PILOT HOẶC KÉO THANH TRƯỢT</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Cols: Varden Interactive Control Deck */}
          <div className="gsap-calc-panel lg:col-span-7 bg-[#FDF0D5] text-[#003049] rounded-2xl p-6 sm:p-8 border-2 border-[#669BBC] shadow-xl flex flex-col justify-between">
            <div className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(8);
                    setDailyKm(62);
                    setFuelConsumption(10.5);
                    setSavingsRate(31);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#003049] hover:bg-[#C1121F] text-[#FDF0D5] font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <TruckWeightIcon className="w-3.5 h-3.5" />
                  <span>Đồ uống 2,5T (−30,5%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(4);
                    setDailyKm(84);
                    setFuelConsumption(10.8);
                    setSavingsRate(51);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#780000] hover:bg-[#C1121F] text-[#FDF0D5] font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <VanExemptIcon className="w-3.5 h-3.5" />
                  <span>Van #01 (−50,8%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFleetSize(16);
                    setDailyKm(95);
                    setFuelConsumption(10.8);
                    setSavingsRate(36);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-[#669BBC] hover:bg-[#003049] hover:text-[#FDF0D5] text-[#003049] font-bold cursor-pointer transition-colors"
                >
                  91 Cửa hàng (−36,4%)
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                  <span>Số xe giao hàng</span>
                  <span className="font-mono text-lg font-black text-[#AE1F23] tabular-nums">{fleetSize} xe</span>
                </div>
                <input
                  aria-label="Số xe giao hàng"
                  type="range"
                  min="3"
                  max="80"
                  step="1"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(Number(e.target.value))}
                  className="w-full h-2 bg-[#D4BF94] rounded-lg appearance-none cursor-pointer em-range"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                  <span>Quãng đường / xe / ngày</span>
                  <span className="font-mono text-lg font-black text-[#AE1F23] tabular-nums">{dailyKm} km</span>
                </div>
                <input
                  aria-label="Quãng đường trung bình mỗi xe mỗi ngày"
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={dailyKm}
                  onChange={(e) => setDailyKm(Number(e.target.value))}
                  className="w-full h-2 bg-[#D4BF94] rounded-lg appearance-none cursor-pointer em-range"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                  <span>Định mức tiêu hao dầu</span>
                  <span className="font-mono text-lg font-black text-[#AE1F23] tabular-nums">{fuelConsumption} L/100km</span>
                </div>
                <input
                  aria-label="Mức tiêu hao nhiên liệu"
                  type="range"
                  min="6"
                  max="20"
                  step="0.5"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(Number(e.target.value))}
                  className="w-full h-2 bg-[#D4BF94] rounded-lg appearance-none cursor-pointer em-range"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
                  <span>Tỷ lệ cắt giảm km</span>
                  <span className="font-mono text-lg font-black text-[#003049] tabular-nums">{savingsRate}%</span>
                </div>
                <input
                  aria-label="Tỷ lệ quãng đường dự kiến cắt giảm"
                  type="range"
                  min="15"
                  max="51"
                  step="1"
                  value={savingsRate}
                  onChange={(e) => setSavingsRate(Number(e.target.value))}
                  className="w-full h-2 bg-[#D4BF94] rounded-lg appearance-none cursor-pointer em-range"
                />
                <div className="flex justify-between font-mono text-[10px] font-bold text-[#003049]/75 mt-1">
                  <span>15% SÀN</span>
                  <span>22-37% VS LỊCH CŨ</span>
                  <span>51% VAN VS GMAPS</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#D4BF94] font-mono text-[11px] font-semibold text-[#003049]/80">
              Tham chiếu: 23.500 đ/L diesel · 2,68 kg CO₂/L TTW (GLEC v3.2) · 26 ngày/tháng.
            </div>
          </div>

          {/* Right 5 Cols: Deep Cosmos Drafting Output with Semantic Green Savings & Red Baseline */}
          <div className="gsap-calc-panel lg:col-span-5 bg-[#002033] text-[#FDF0D5] rounded-2xl border-2 border-[#669BBC]/55 p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#669BBC]/25 pb-3 font-mono text-xs font-bold uppercase tracking-wider">
                <span className="text-[#669BBC]">Ước tính lợi ích ròng / tháng</span>
                <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] font-extrabold">26 NGÀY</span>
              </div>

              <div className="pb-5 border-b border-[#669BBC]/25">
                <div className="font-mono text-xs font-bold uppercase text-[#4ADE80] mb-1">
                  Tiền dầu giữ lại được
                </div>
                <div className="font-display text-3xl sm:text-5xl font-black text-[#4ADE80] tracking-tight tabular-nums">
                  +<span ref={moneyNumRef}>{Math.round(moneySavedVND).toLocaleString('vi-VN')}</span>
                  <span className="text-base font-bold ml-1.5 text-[#FDF0D5]">đ</span>
                </div>
                <div className="font-mono text-xs font-bold text-[#669BBC] mt-2 tabular-nums">
                  ≈ <span ref={litersNumRef}>{Math.round(litersSaved).toLocaleString('vi-VN')}</span> LÍT DIESEL KHÔNG BỊ ĐỐT VÔ ÍCH
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-5 border-b border-[#669BBC]/25">
                <div className="rounded-lg bg-[#052E16]/75 border border-[#4ADE80]/40 p-3.5">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#4ADE80] mb-1">
                    <Co2AuditIcon className="w-4 h-4" />
                    <span>CO₂ GIẢM (GLEC)</span>
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-black text-[#FDF0D5] tabular-nums">
                    −<span ref={co2NumRef}>{Math.round(co2SavedKg).toLocaleString('vi-VN')}</span> kg
                  </div>
                  <div className="font-mono text-[11px] font-bold text-[#4ADE80] mt-0.5 tabular-nums">
                    <span ref={co2TonsNumRef}>{(co2SavedKg / 1000).toFixed(2)}</span> tấn/tháng
                  </div>
                </div>

                <div className="rounded-lg bg-[#003049] border border-[#669BBC]/40 p-3.5">
                  <div className="font-mono text-[10px] font-bold uppercase text-[#669BBC] mb-1">
                    QUÃNG ĐƯỜNG CẮT
                  </div>
                  <div className="font-display text-xl sm:text-2xl font-black text-[#FDF0D5] tabular-nums">
                    −<span ref={kmNumRef}>{Math.round(kmSaved).toLocaleString('vi-VN')}</span> km
                  </div>
                  <div className="font-mono text-[11px] font-bold text-[#4ADE80] mt-0.5 tabular-nums">
                    Giảm {savingsRate}% tổng ca
                  </div>
                </div>
              </div>

              {/* Animated Visual Ratio Strip (Error Red baseline waste vs Success Green kept) */}
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-[#F87171]">TRƯỚC: {totalMonthlyKm.toLocaleString('vi-VN')} KM</span>
                  <span className="text-[#4ADE80]">SAU: {Math.round(totalMonthlyKm - kmSaved).toLocaleString('vi-VN')} KM</span>
                </div>
                <div className="h-4 w-full rounded bg-[#003049] overflow-hidden flex border border-[#669BBC]/35">
                  <motion.div
                    initial={false}
                    animate={{ width: `${100 - savingsRate}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="h-full bg-[#669BBC]"
                  />
                  <motion.div
                    initial={false}
                    animate={{ width: `${savingsRate}%` }}
                    transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    className="h-full bg-[#15803D]"
                    title={`Giảm ${savingsRate}% quãng đường thừa`}
                  />
                </div>
                <div className="text-[11px] font-bold text-[#FBBF24]">
                  Chưa tính tiền tránh phạt giờ cấm 4-6 triệu đ/lỗi (NĐ 168/2024)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="mt-6 w-full py-3.5 px-5 rounded-xl bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] font-extrabold text-sm shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Thử miễn phí trên Excel đội xe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
