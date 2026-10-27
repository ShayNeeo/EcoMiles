import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface HeroProps {
  onOpenPilotModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenPilotModal }) => {
  const [videoReady, setVideoReady] = useState(false);
  const [isCtaHovered, setIsCtaHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoReady(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const mapPaths = [
    'M128.161 74.6764C79.9989 130.001 71.9994 46.0005 20.9815 111.737',
    'M216.999 9.99985C260.499 12.4998 222.499 71.9998 291.999 58.9998',
    'M130.102 70.9998C144.499 -32.0002 183.852 70.2739 219.999 3.99985',
    'M14.4999 16.9998C111 20.9998 -53.0003 73.4998 21.4999 107',
  ];

  const stopDots = [
    { cx: 9.519, cy: 15.519 },
    { cx: 289.519, cy: 59.518 },
    { cx: 220.519, cy: 9.519 },
    { cx: 125.518, cy: 78.519 },
    { cx: 19.519, cy: 104.519 },
  ];

  return (
    <section className="relative flex min-h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cargox-fallback">
      {/* Background Video */}
      <video
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260620_185230_f7f71ef4-6655-469f-b9c6-efbdc1f7684a.mp4"
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setVideoReady(true)}
        onLoadedData={() => setVideoReady(true)}
        className="absolute inset-0 z-0 h-full w-full object-cover brightness-[0.72] saturate-[0.78] contrast-[1.06] pointer-events-none"
      />

      {/* Contrast Vignette Gradient */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(2,9,5,0.72)_0%,rgba(4,21,13,0.16)_42%,rgba(7,17,12,0.96)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/35 mix-blend-multiply" />

      {/* Main Hero Content Layer */}
      <AnimatePresence>
        {videoReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 flex flex-col flex-1 w-full h-full justify-between overflow-hidden"
          >
            {/* Top Spacing for Floating Navbar */}
            <div className="h-16 sm:h-20" />

            {/* Main Content Grid */}
            <div
              className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[2.17fr_1fr] items-center w-full"
              style={{
                padding: 'clamp(20px, 6vh, 90px) clamp(16px, 3vw, 48px) 0',
                gap: 'clamp(20px, 4vh, 48px)',
              }}
            >
              {/* Left Column: Main Slogan */}
              <div className="flex min-w-0 flex-col justify-center text-left">
                <h1 className="flex w-full max-w-none flex-col gap-2 text-balance font-barlow text-[clamp(34px,9.5vw,48px)] font-extrabold uppercase leading-[0.96] tracking-[0.025em] sm:gap-3 sm:text-[clamp(48px,7.3vw,72px)] lg:text-[clamp(54px,5vw,92px)]">
                  {/* Line 1 */}
                  <motion.span
                    initial={{ x: -900, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.85, delay: 0, ease: EXPO_OUT }}
                    className="block text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] sm:whitespace-nowrap"
                  >
                    Tối ưu vận chuyển
                  </motion.span>

                  {/* Line 2 */}
                  <motion.span
                    initial={{ x: 900, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.85, delay: 0.13, ease: EXPO_OUT }}
                    className="block text-ecomiles-lime drop-shadow-[0_4px_18px_rgba(7,17,12,0.55)] sm:whitespace-nowrap"
                  >
                    Tiết kiệm chi phí
                  </motion.span>

                  {/* Line 3 */}
                  <motion.span
                    initial={{ x: -900, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.85, delay: 0.26, ease: EXPO_OUT }}
                    className="block text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] sm:whitespace-nowrap"
                  >
                    Kiến tạo tương lai xanh
                  </motion.span>
                </h1>
              </div>

              {/* Right Column: Interactive Route Map */}
              <div className="mx-auto flex w-full min-w-0 max-w-[540px] flex-col justify-center lg:mx-0 lg:max-w-none">
                {/* Map Section */}
                <div
                  className="relative w-full overflow-visible"
                  style={{ aspectRatio: '435 / 263' }}
                >
                  {/* Map Image Base */}
                  <img
                    src="https://polo-pecan-73837341.figma.site/_assets/v11/b6d561167283e799453232309bd13dd78b2d1afa.png"
                    alt="Bản đồ các tuyến giao hàng được sắp xếp tự động"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                  />

                  {/* Route Lines SVG Overlay */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: '13.8%',
                      top: '24.3%',
                      width: '68.7%',
                      aspectRatio: '299 / 143',
                    }}
                  >
                    <svg
                      viewBox="0 0 299.037 142.509"
                      className="w-full h-full overflow-visible"
                    >
                      {/* 4 Animated Bezier Curve Paths */}
                      {mapPaths.map((pathD, idx) => (
                        <g key={idx}>
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke="#D6F65A"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                              duration: 1.1,
                              delay: 0.55 + idx * 0.12,
                              ease: EXPO_OUT,
                            }}
                          />
                          <polygon points="0,-4 8,0 0,4" fill="#D6F65A">
                            <animateMotion
                              path={pathD}
                              dur={`${2.5 + idx * 0.3}s`}
                              repeatCount="indefinite"
                              rotate="auto"
                            />
                          </polygon>
                        </g>
                      ))}

                      {/* 5 Stop Dots */}
                      {stopDots.map((dot, idx) => (
                        <motion.g
                          key={idx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 420,
                            damping: 14,
                            delay: 0.9 + idx * 0.1,
                          }}
                        >
                          <circle cx={dot.cx} cy={dot.cy} r={9.519} fill="#D6F65A" />
                          <circle cx={dot.cx} cy={dot.cy} r={3.389} fill="#07110C" />
                        </motion.g>
                      ))}
                    </svg>
                  </div>

                  {/* 3 Transport Icons */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 220,
                      damping: 16,
                      delay: 2.1,
                    }}
                    whileHover={{ scale: 1.15, y: -4 }}
                    className="absolute bg-white rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.3)] ring-2 ring-ecomiles-lime/50 cursor-pointer"
                    style={{
                      left: '26.0%',
                      top: '28.9%',
                      width: '14.9%',
                      aspectRatio: '1 / 1',
                    }}
                  >
                    <img
                      src="https://image-bottom-92901062.figma.site/_components/v2/142c6a6f3074dd8aee013fa440ff4ff369649d48/08d6a37375d428e07c59e24a8529de89bfee157e.08d6a373.png"
                      alt="Vận chuyển đường thủy"
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 220,
                      damping: 16,
                      delay: 2.2,
                    }}
                    whileHover={{ scale: 1.15, y: -4 }}
                    className="absolute bg-white rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.3)] ring-2 ring-ecomiles-lime/50 cursor-pointer"
                    style={{
                      left: '70.8%',
                      top: '15.6%',
                      width: '14.9%',
                      aspectRatio: '1 / 1',
                      transform: 'rotate(9.73deg)',
                    }}
                  >
                    <img
                      src="https://image-bottom-92901062.figma.site/_components/v2/142c6a6f3074dd8aee013fa440ff4ff369649d48/7d6f50a87e1427d9b4d1a9c9f1c064ff04b2b3f9.7d6f50a8.png"
                      alt="Xe giao hàng đô thị"
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 220,
                      damping: 16,
                      delay: 2.3,
                    }}
                    whileHover={{ scale: 1.15, y: -4 }}
                    className="absolute bg-white rounded-full flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.3)] ring-2 ring-ecomiles-lime/50 cursor-pointer"
                    style={{
                      left: '55.2%',
                      top: '52.1%',
                      width: '14.9%',
                      aspectRatio: '1 / 1',
                      transform: 'rotate(180deg) scaleY(-1)',
                    }}
                  >
                    <img
                      src="https://image-bottom-92901062.figma.site/_components/v2/142c6a6f3074dd8aee013fa440ff4ff369649d48/0e0282ab1c70db03d437b0d01875ce45557d49f6.0e0282ab.png"
                      alt="Vận chuyển hàng không"
                      className="w-[60%] h-[60%] object-contain"
                    />
                  </motion.div>

                  {/* Map Description Text */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.4 }}
                    className="hidden sm:inline-flex items-center gap-2 absolute bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-white font-sans font-medium leading-tight"
                    style={{
                      left: '35%',
                      top: '84%',
                      maxWidth: '65%',
                      fontSize: 'clamp(11px, min(1.5vh, 1.1vw), 14px)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-ecomiles-lime shrink-0 animate-pulse"></span>
                    <span className="text-white/95">
                      Tự động sắp xếp tuyến giao hàng và đo lượng CO₂ theo <strong>chuẩn quốc tế</strong>.
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Footer Section of Hero */}
            <div
              className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full gap-4"
              style={{
                padding: 'clamp(10px, 2.5vh, 24px) clamp(16px, 3vw, 48px) clamp(14px, 4vh, 40px)',
              }}
            >
              {/* Left: Stat Block */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.45, ease: EXPO_OUT }}
                className="flex items-center gap-3 sm:gap-4 text-left bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-xl"
              >
                <div
                  className="font-barlow font-extrabold uppercase text-ecomiles-lime leading-none drop-shadow-[0_2px_8px_rgba(214,246,90,0.28)]"
                  style={{
                    fontSize: 'clamp(50px, min(7.5vh, 5.5vw), 92px)',
                  }}
                >
                  3M+
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div
                    className="font-sans font-medium text-white leading-[1.25] drop-shadow-sm"
                    style={{
                      fontSize: 'clamp(12px, min(1.5vh, 1.1vw), 16px)',
                    }}
                  >
                    <div className="text-white font-bold">tấn hàng hóa tối ưu tuyến</div>
                    <div className="text-emerald-300">giảm 20 - 30% CO₂ / đơn hàng</div>
                    <div className="text-white/90">đưa xe chạy rỗng về mức 5 - 10%</div>
                  </div>

                  <div
                    className="rounded-full bg-white flex items-center justify-center shadow-lg ring-2 ring-white/30 shrink-0"
                    style={{
                      width: 'clamp(38px, min(5vh, 3.8vw), 60px)',
                      height: 'clamp(38px, min(5vh, 3.8vw), 60px)',
                    }}
                  >
                    <img
                      src="https://image-bottom-92901062.figma.site/_components/v2/142c6a6f3074dd8aee013fa440ff4ff369649d48/b343ed71e721488b90c407df666fd6dc3f5f70b1.b343ed71.png"
                      alt="Hàng hóa đã giao"
                      className="w-[55%] h-[55%] object-contain"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Right: Custom SVG Pill CTA Button */}
              <motion.button
                onClick={onOpenPilotModal}
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, delay: 0.5, ease: EXPO_OUT }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setIsCtaHovered(true)}
                onHoverEnd={() => setIsCtaHovered(false)}
                className="relative flex w-full cursor-pointer items-center justify-center drop-shadow-2xl sm:w-auto"
                style={{
                  height: 'clamp(46px, min(5.5vh, 4.2vw), 64px)',
                  aspectRatio: '434 / 68',
                }}
              >
                <svg
                  viewBox="0 0 434.001 68"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  className="w-full h-full drop-shadow-xl"
                >
                  <path
                    d="M316 0C329.08 0 340.435 7.38674 346.121 18.2162C348.618 22.9736 353.086 26.8535 358.459 26.8535H359.252C364.667 26.8535 369.155 22.9169 371.63 18.1007C377.159 7.34039 388.205 0.00015843 400.931 0C419.195 0 434.001 15.1191 434.001 33.7695L433.99 34.6416C433.537 52.8891 418.909 67.5391 400.931 67.5391C387.96 67.5389 376.734 59.9132 371.317 48.8128C368.923 43.9077 364.427 39.873 358.969 39.873C353.492 39.873 348.986 43.9356 346.589 48.8605C341.074 60.1913 329.449 68 316 68H34.001C15.2233 68 0 52.7777 0 34C0 15.2223 15.2233 0 34.001 0H316ZM400.931 2.44141C384.063 2.44163 370.303 16.419 370.303 33.7695C370.303 51.1201 384.063 65.0974 400.931 65.0977C417.798 65.0977 431.56 51.1202 431.56 33.7695C431.56 16.4189 417.798 2.44141 400.931 2.44141Z"
                    fill="#D6F65A"
                  />
                </svg>

                <div
                  className="absolute left-0 right-[20%] inset-y-0 flex items-center justify-center font-sans font-extrabold text-ecomiles-ink tracking-tight whitespace-nowrap"
                  style={{
                    fontSize: 'clamp(13px, min(1.5vh, 1.15vw), 18px)',
                  }}
                >
                  Đăng ký dùng thử miễn phí
                </div>

                <div
                  className="absolute right-[1.5%] top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    width: '15%',
                    aspectRatio: '1 / 1',
                  }}
                >
                  <motion.svg
                    viewBox="0 0 16.89 20.37"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    animate={{ rotate: isCtaHovered ? -90 : -135 }}
                    transition={{ duration: 0.35, ease: EXPO_OUT }}
                    className="w-[45%] h-[45%]"
                  >
                    <path
                      d="M8.445 1.5V18.87M8.445 1.5L1.5 8.445M8.445 1.5L15.39 8.445"
                      stroke="#FFFFFF"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
