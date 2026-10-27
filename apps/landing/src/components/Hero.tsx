import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useGSAP } from '@gsap/react';
import {
  ArrowUpRight,
  CheckCircle2,
  Compass,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { HcmcThreeNetworkStage } from './HcmcThreeNetworkStage';
import { HeroMultiDeviceStage } from './HeroMultiDeviceStage';
import { ThreeDeviceEcosystemBanner, type DeviceBannerFocusId } from './ThreeDeviceEcosystemBanner';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const STUDIO_24K_HOTSPOTS = [
  { id: 'macbook_pro', label: 'MacBook Pro 16"' },
  { id: 'windows_xps', label: 'Windows XPS 16' },
  { id: 'galaxy_zfold', label: 'Galaxy Z Fold' },
  { id: 'iphone_18_pro_max', label: 'iPhone 18 Pro Max' },
  { id: 'iphone_duo', label: 'iPhone Duo' },
  { id: 'galaxy_s26_ultra', label: 'Galaxy S26 Ultra' },
  { id: 'ipad_pro', label: 'iPad Pro M4' },
] as const;

interface HeroProps {
  onOpenPilotModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenPilotModal }) => {
  const [isCtaHovered, setIsCtaHovered] = useState(false);
  const [heroStageMode, setHeroStageMode] = useState<'devices_banner' | 'webgl_7devices' | 'studio_24k' | 'three_network'>('devices_banner');
  const [heroWebglDeviceId, setHeroWebglDeviceId] = useState<DeviceBannerFocusId>('all_banner');
  const [studioBannerVariant, setStudioBannerVariant] = useState<'clean_stage' | 'cover_banner'>('clean_stage');
  const heroRef = useRef<HTMLElement | null>(null);
  const bgPlaneRef = useRef<HTMLVideoElement | null>(null);
  const midPlaneRef = useRef<HTMLDivElement | null>(null);
  const fgPlaneRef = useRef<HTMLDivElement | null>(null);


  const handleSelectStudioDevice = (deviceId: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('ecomiles:select-device', { detail: { deviceId } }));
    const target = document.querySelector('#showcase');
    if (!target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      gsap.to(window, {
        duration: 0.85,
        scrollTo: { y: target, offsetY: 64 },
        ease: 'power3.inOut',
      });
    }
  };
  // Layer 2: GSAP ScrollTrigger Dimensional Parallax across Background, Midground, and Foreground Planes
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
        tl.to(fgPlaneRef.current, { yPercent: -12, ease: 'none' }, 0);
      }
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cargox-fallback"
    >
      {/* Plane 1 (Background): Ambient Urban Logistics Video */}
      <video
        ref={bgPlaneRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260620_185230_f7f71ef4-6655-469f-b9c6-efbdc1f7684a.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover brightness-[0.66] saturate-[0.82] contrast-[1.08] pointer-events-none"
      />

      {/* Focused Contrast Scrim */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(2,9,5,0.78)_0%,rgba(4,21,13,0.32)_45%,rgba(7,17,12,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/35 mix-blend-multiply" />

      {/* Main Hero Content Layer (Immediate 0ms First Paint — Zero LCP Block) */}
      <div className="relative z-10 flex flex-col flex-1 w-full h-full justify-between overflow-hidden">
        <div className="h-16 sm:h-20" />

        {/* Main Content Grid: Midground Copy (6 Cols) + Foreground Multi-Device Cover Banner / 3D Stage (6 Cols) */}
        <div
          className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center w-full max-w-[1440px] mx-auto"
          style={{
            padding: 'clamp(12px, 3vh, 44px) clamp(16px, 3vw, 48px) 0',
            gap: 'clamp(20px, 3vw, 40px)',
          }}
        >
          {/* Plane 2 (Midground, 6 Cols): Display Headline + Live Route Quick-Launch */}
          <div ref={midPlaneRef} className="lg:col-span-6 flex min-w-0 flex-col justify-center text-left space-y-5">
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, ease: EXPO_OUT }}
              className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-ecomiles-lime/35 text-xs font-bold text-ecomiles-lime backdrop-blur-md"
            >
              <ShieldCheck className="w-4 h-4 text-ecomiles-lime shrink-0" />
              <span>TỐI ƯU LỘ TRÌNH VRPTW ĐÔ THỊ TP.HCM · CHUẨN ISO 14083 / GLEC v3.2</span>
            </motion.div>

            <h1 className="flex w-full max-w-none flex-col gap-1.5 text-balance font-barlow text-[clamp(34px,8.5vw,50px)] font-extrabold uppercase leading-[0.98] tracking-[0.02em] sm:gap-2.5 sm:text-[clamp(44px,5.8vw,68px)] lg:text-[clamp(48px,4.2vw,74px)]">
              <motion.span
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.05, ease: EXPO_OUT }}
                className="block text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]"
              >
                Tối ưu lộ trình xe tải
              </motion.span>
              <motion.span
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.65, delay: 0.14, ease: EXPO_OUT }}
                className="block text-ecomiles-lime drop-shadow-[0_4px_18px_rgba(7,17,12,0.65)]"
              >
                Giảm 34.9% km &amp; 39.2% CO₂e
              </motion.span>
            </h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, delay: 0.22, ease: EXPO_OUT }}
              className="max-w-2xl text-sm sm:text-base text-slate-200 leading-relaxed font-normal"
            >
              Nhập trực tiếp bảng tính <code className="text-ecomiles-lime font-mono font-bold">.XLSX</code> từ ERP:
              thuật toán <strong>Carbon-Aware ALNS</strong> tự động gom cụm điểm giao, né khung giờ cấm tải{' '}
              <strong>QĐ 23/2018/QĐ-UBND</strong>, ghép đơn chiều về giảm chạy rỗng xuống <strong>2.7%</strong> và đồng
              bộ xuống 7 dòng thiết bị điều phối &amp; tài xế với <strong>$0 chi phí bản đồ API</strong>.
            </motion.p>

            {/* Quick-Launch Live Workspace Pills */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, delay: 0.3, ease: EXPO_OUT }}
              className="flex flex-wrap items-center gap-2.5 pt-1"
            >
              <motion.a
                href="/dashboard/"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-4 py-2.5 rounded-xl bg-ecomiles-lime text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Trung Tâm Điều Phối B2B (/dashboard)</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.a>

              <motion.a
                href="/maps/?vehicle=0&mode=navigate"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-ecomiles-lime/40 font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md cursor-pointer"
              >
                <Compass className="w-4 h-4 text-ecomiles-lime" />
                <span>Bản Đồ Xe Tải (/maps)</span>
              </motion.a>

              <motion.a
                href="/driver/"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-white/15 font-semibold text-xs sm:text-sm flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>App Tài Xế (/driver)</span>
              </motion.a>
            </motion.div>
          </div>

          {/* Plane 3 (Foreground, 6 Cols): 2-Mode Interactive Hero Cover Stage (7-Device In-App Cover Banner + 3D WebGL Network) */}
          <motion.div
            ref={fgPlaneRef}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.18, ease: EXPO_OUT }}
            className="lg:col-span-6 mx-auto flex w-full min-w-0 flex-col justify-center space-y-2.5"
          >
            {/* Top Mode Switcher Pill Bar */}
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/85 border border-white/15 backdrop-blur-md text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-ecomiles-lime" />
                <span>Trình diễn trực tiếp:</span>
              </span>
              <div className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-xl bg-slate-900 border border-white/10">
                <button
                  type="button"
                  onClick={() => setHeroStageMode('devices_banner')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    heroStageMode === 'devices_banner'
                      ? 'bg-ecomiles-lime text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  1. Tháp 7 Thiết Bị
                </button>
                <button
                  type="button"
                  onClick={() => setHeroStageMode('webgl_7devices')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    heroStageMode === 'webgl_7devices'
                      ? 'bg-ecomiles-lime text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  2. Không Gian 3D WebGL
                </button>
                <button
                  type="button"
                  onClick={() => setHeroStageMode('studio_24k')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    heroStageMode === 'studio_24k'
                      ? 'bg-ecomiles-lime text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  3. Studio 2.4K
                </button>
                <button
                  type="button"
                  onClick={() => setHeroStageMode('three_network')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    heroStageMode === 'three_network'
                      ? 'bg-ecomiles-lime text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  4. Mạng Lưới 3D TP.HCM
                </button>
              </div>
            </div>

            {heroStageMode === 'devices_banner' ? (
              <HeroMultiDeviceStage />
            ) : heroStageMode === 'webgl_7devices' ? (
              <div className="rounded-3xl border border-ecomiles-lime/35 bg-slate-950/90 p-2.5 shadow-[0_24px_64px_rgba(0,0,0,0.85)]">
                <ThreeDeviceEcosystemBanner
                  selectedDeviceId={heroWebglDeviceId}
                  onSelectDevice={setHeroWebglDeviceId}
                />
              </div>
            ) : heroStageMode === 'studio_24k' ? (
              <div className="relative w-full rounded-3xl overflow-hidden border border-ecomiles-lime/35 bg-[radial-gradient(ellipse_at_center,rgba(20,83,45,0.46)_0%,rgba(4,9,18,0.97)_78%)] p-3 sm:p-4 shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center space-y-2.5">
                {/* Dual-Banner Switcher: A. Sân Khấu 7 Thiết Bị 2400×1120 vs B. Ảnh Bìa OpenGraph 2400×1260 */}
                <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <div className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-xl bg-slate-950/90 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStudioBannerVariant('clean_stage')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        studioBannerVariant === 'clean_stage'
                          ? 'bg-ecomiles-lime text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      A. Sân Khấu 7 Thiết Bị 2400×1120
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudioBannerVariant('cover_banner')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        studioBannerVariant === 'cover_banner'
                          ? 'bg-ecomiles-lime text-slate-950'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      B. Ảnh Bìa OpenGraph 2400×1260
                    </button>
                  </div>
                  <a
                    href={
                      studioBannerVariant === 'clean_stage'
                        ? '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png'
                        : '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png'
                    }
                    download={
                      studioBannerVariant === 'clean_stage'
                        ? '00_ecomiles_clean_devices_hero_stage.png'
                        : '00_ecomiles_flagship_cover_banner.png'
                    }
                    className="font-extrabold text-ecomiles-lime hover:underline"
                  >
                    Tải PNG 2.4K →
                  </a>
                </div>
                <img
                  src={
                    studioBannerVariant === 'clean_stage'
                      ? '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png'
                      : '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png'
                  }
                  alt={
                    studioBannerVariant === 'clean_stage'
                      ? 'EcoMiles 7-Device Clean Studio Stage (2400x1120) with Floor Reflections'
                      : 'EcoMiles 7-Device OpenGraph Flagship Cover Banner (2400x1260)'
                  }
                  className="w-full h-auto max-h-[310px] object-contain mx-auto rounded-xl drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)]"
                  loading="eager"
                />
                <div className="w-full flex flex-wrap items-center justify-center gap-1 pt-0.5">
                  {STUDIO_24K_HOTSPOTS.map((spot, idx) => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => {
                        setHeroWebglDeviceId(spot.id);
                        setHeroStageMode('webgl_7devices');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-ecomiles-lime hover:text-slate-950 text-slate-200 border border-white/10 text-[9.5px] font-bold transition-colors cursor-pointer"
                      title={`Bay camera 3D WebGL tới ${spot.label}`}
                    >
                      {idx + 1}. {spot.label} · 3D →
                    </button>
                  ))}
                </div>
                <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-ecomiles-lime/30 text-[10.5px] text-slate-300">
                  <span className="font-bold text-ecomiles-lime">
                    {studioBannerVariant === 'clean_stage'
                      ? 'Ảnh Bìa Studio 2.4K (2400×1120) · Phản Chiếu Sàn Gương 7 Thiết Bị'
                      : 'Ảnh Bìa OpenGraph / Pitch Deck (2400×1260) · Chuẩn Thương Hiệu EcoMiles'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectStudioDevice(
                        heroWebglDeviceId === 'all_banner' ? 'macbook_pro' : heroWebglDeviceId
                      )
                    }
                    className="font-extrabold text-emerald-400 hover:text-ecomiles-lime hover:underline cursor-pointer"
                  >
                    Cuộn xuống Khu Trưng Bày (#showcase) ↓
                  </button>
                </div>
              </div>
            ) : (
              <HcmcThreeNetworkStage />
            )}
          </motion.div>
        </div>

        {/* Bottom Bar: Verified Benchmark Proof Metrics & Non-Distorted Primary CTA */}
        <div
          className="relative z-10 grid w-full max-w-[1440px] mx-auto grid-cols-1 items-end gap-6 lg:grid-cols-[1fr_auto]"
          style={{
            padding: 'clamp(16px, 2.5vh, 32px) clamp(16px, 3vw, 48px) clamp(20px, 3.5vh, 40px)',
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.35, ease: EXPO_OUT }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl"
          >
            <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 backdrop-blur-md">
              <div className="text-[11px] font-bold text-ecomiles-lime uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kiểm chứng 120 đơn QĐ 23</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                374.4 km → 243.7 km
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Tiết giảm <strong>130.7 km (-34.9%)</strong> trên mạng lưới đường thật OSRM TP.HCM
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 backdrop-blur-md">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ghép đơn chiều về (Backhaul)</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                32.8% → 2.7% rỗng
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Thu hồi tự động <strong>1,864.9 kg</strong> hàng chiều về kho Tân Bình
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 backdrop-blur-md">
              <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Kiểm toán CO₂e GLEC v3.2</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                -39.2% kg CO₂e
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Mô hình tải trọng động <strong>GLX-HDT-v1</strong> · Xuất Excel 3 Sheet
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.42, ease: EXPO_OUT }}
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
              className="group relative inline-flex items-center justify-between gap-4 w-full sm:w-auto pl-6 pr-2.5 py-2.5 rounded-full bg-ecomiles-lime hover:bg-[#e2fc79] text-slate-950 shadow-[0_12px_36px_rgba(214,246,90,0.32)] cursor-pointer transition-colors"
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
