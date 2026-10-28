import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  FileSpreadsheet,
  SplitSquareVertical,
  Truck,
} from 'lucide-react';
import { HeroMultiDeviceStage } from './HeroMultiDeviceStage';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface HeroProps {
  onOpenPilotModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenPilotModal }) => {
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);
  const bgPlaneRef = useRef<HTMLVideoElement | null>(null);
  const midPlaneRef = useRef<HTMLDivElement | null>(null);
  const fgPlaneRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !heroRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });

      if (bgPlaneRef.current) {
        tl.to(bgPlaneRef.current, { yPercent: 14, scale: 1.05, ease: 'none' }, 0);
      }
      if (midPlaneRef.current) {
        tl.to(midPlaneRef.current, { yPercent: -6, ease: 'none' }, 0);
      }
      if (fgPlaneRef.current) {
        tl.to(fgPlaneRef.current, { yPercent: -3, ease: 'none' }, 0);
      }
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cargox-fallback"
    >
      {/* Plane 1 (Background): Moving Container Truck & Urban Logistics Video — Full Optical Clarity */}
      <video
        ref={bgPlaneRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260620_185230_f7f71ef4-6655-469f-b9c6-efbdc1f7684a.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover brightness-[0.86] saturate-[0.96] contrast-[1.06] pointer-events-none"
      />

      {/* Directional Scrim: Protects Left Headline Legibility While Leaving Right Container Truck 100% Open & Bright */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(2,9,5,0.88)_0%,rgba(2,9,5,0.46)_44%,rgba(2,9,5,0.04)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(2,9,5,0.52)_0%,transparent_26%,transparent_74%,rgba(7,17,12,0.92)_100%)]" />

      {/* Main Hero Content Layer */}
      <div className="relative z-10 flex flex-col flex-1 w-full h-full justify-between overflow-hidden">
        <div className="h-16 sm:h-20" />

        {/* Main Content Grid: Left Value Proposition (6 Cols) + Bottom-Right Low-Profile Glass Dock (6 Cols, Self-End) */}
        <div
          className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center w-full max-w-[1440px] mx-auto"
          style={{
            padding: 'clamp(16px, 3vh, 44px) clamp(16px, 3vw, 48px) 0',
            gap: 'clamp(24px, 3vw, 44px)',
          }}
        >
          {/* Left 6 Cols: 3-Second Clarity Headline + Instant Live App Entry */}
          <div ref={midPlaneRef} className="lg:col-span-6 flex min-w-0 flex-col justify-center text-left space-y-5">
            <h1 className="flex w-full max-w-none flex-col gap-1.5 text-balance font-barlow text-[clamp(36px,8.5vw,52px)] font-extrabold uppercase leading-[0.98] tracking-[-0.01em] sm:gap-2.5 sm:text-[clamp(46px,5.6vw,68px)] lg:text-[clamp(50px,4.2vw,74px)]">
              <motion.span
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.04, ease: EXPO_OUT }}
                className="block text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]"
              >
                Tối ưu lộ trình xe tải
              </motion.span>
              <motion.span
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.12, ease: EXPO_OUT }}
                className="block text-ecomiles-lime drop-shadow-[0_4px_18px_rgba(7,17,12,0.65)]"
              >
                Giảm 34.9% km &amp; 39.2% CO₂e
              </motion.span>
            </h1>

            <motion.p
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EXPO_OUT }}
              className="max-w-xl text-sm sm:text-base text-slate-100 leading-relaxed font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            >
              Nhập trực tiếp file Excel đơn hàng: hệ thống tự động chia tuyến xe tải né khung giờ cấm tải{' '}
              <strong>QĐ 23/2018/QĐ-UBND</strong>, ghép đơn chiều về giảm chạy rỗng xuống <strong>2.7%</strong> và xuất
              báo cáo kiểm toán phát thải CO₂ chuẩn quốc tế trong 30 giây — <strong>$0 phí bản đồ API</strong>.
            </motion.p>

            {/* Primary & Secondary Live Workspace Launchers */}
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28, ease: EXPO_OUT }}
              className="space-y-3 pt-1"
            >
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/dashboard/"
                  className="px-5 py-3 rounded-xl bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xl shadow-black/50 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Mở Bảng Điều Khiển Đội Xe</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <a
                  href="/benchmark/"
                  className="px-4 py-3 rounded-xl bg-slate-950/75 hover:bg-slate-900 text-slate-100 border border-white/20 hover:border-ecomiles-lime/50 font-bold text-xs sm:text-sm inline-flex items-center gap-2 backdrop-blur-md transition-colors cursor-pointer"
                >
                  <SplitSquareVertical className="w-4 h-4 text-ecomiles-lime" />
                  <span>Mở Phòng Đối Chứng EVSIM</span>
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                <span className="font-semibold text-slate-200 drop-shadow">Trải nghiệm thực địa:</span>
                <a
                  href="/maps/?vehicle=0&mode=navigate"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-slate-100 hover:text-ecomiles-lime border border-white/15 backdrop-blur-md transition-colors font-semibold"
                >
                  <Compass className="w-3.5 h-3.5 text-ecomiles-lime" />
                  <span>Mở Bản Đồ Xe Tải</span>
                </a>
                <a
                  href="/driver/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-slate-100 hover:text-ecomiles-lime border border-white/15 backdrop-blur-md transition-colors font-semibold"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mở Ứng Dụng Tài Xế</span>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right 6 Cols: Self-End Bottom-Right Floating Glass Dock (Leaves Container Truck Cab 100% Unobstructed!) */}
          <motion.div
            ref={fgPlaneRef}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.24, ease: EXPO_OUT }}
            className="lg:col-span-6 self-end flex w-full min-w-0 flex-col items-end justify-end lg:pb-1"
          >
            <HeroMultiDeviceStage />
          </motion.div>
        </div>

        {/* Bottom Bar: 3 Verified Empirical Proof Metrics + Primary Pilot Registration CTA */}
        <div
          className="relative z-10 grid w-full max-w-[1440px] mx-auto grid-cols-1 items-end gap-6 lg:grid-cols-[1fr_auto]"
          style={{
            padding: 'clamp(16px, 2.5vh, 32px) clamp(16px, 3vw, 48px) clamp(20px, 3.5vh, 40px)',
          }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.34, ease: EXPO_OUT }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl"
          >
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/15 backdrop-blur-md">
              <div className="text-xs font-bold text-ecomiles-lime uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kiểm chứng 120 đơn QĐ 23</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-1.5 tabular-nums">
                <span>374.4 km</span>
                <ArrowRight className="w-5 h-5 text-ecomiles-lime shrink-0" />
                <span>243.7 km</span>
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                Tiết giảm <strong>130.7 km (-34.9%)</strong> trên mạng lưới đường thật TP.HCM
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/15 backdrop-blur-md">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ghép đơn chiều về (Backhaul)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-1.5 tabular-nums">
                <span>32.8%</span>
                <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>2.7% rỗng</span>
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                Thu hồi tự động <strong>1,864.9 kg</strong> hàng chiều về kho Tân Bình
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/15 backdrop-blur-md">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kiểm toán CO₂e ISO 14083</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 tabular-nums">
                -39.2% kg CO₂e
              </div>
              <div className="text-xs text-slate-200 mt-0.5">
                Tính theo tải trọng thực tế · Xuất báo cáo <strong>Excel 3 Sheet</strong>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EXPO_OUT }}
            className="w-full sm:w-auto flex justify-start lg:justify-end"
          >
            <motion.button
              type="button"
              onClick={onOpenPilotModal}
              onMouseEnter={() => setIsCtaHovered(true)}
              onMouseLeave={() => setIsCtaHovered(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="group relative inline-flex items-center justify-between gap-4 w-full sm:w-auto pl-6 pr-2.5 py-2.5 rounded-full bg-ecomiles-lime hover:bg-[#e2fc79] text-slate-950 shadow-2xl shadow-black/70 cursor-pointer transition-colors"
            >
              <span className="font-barlow font-extrabold uppercase tracking-wider text-sm sm:text-base">
                Đăng ký dùng thử Pilot miễn phí 4 - 6 tuần
              </span>
              <motion.span
                animate={{
                  rotate: isCtaHovered ? 45 : 0,
                  scale: isCtaHovered ? 1.06 : 1,
                }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                className="w-11 h-11 rounded-full bg-slate-950 text-ecomiles-lime flex items-center justify-center shrink-0"
              >
                <ArrowUpRight className="w-5 h-5" />
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
