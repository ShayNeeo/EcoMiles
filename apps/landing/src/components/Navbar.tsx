import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  Leaf,
  Menu,
  X,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  LayoutDashboard,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
} from 'lucide-react';

gsap.registerPlugin(ScrollToPlugin);
interface NavbarProps {
  onOpenPilotModal: () => void;
  onOpenPortalModal?: () => void;
}

const NAV_LINKS = [
  { name: 'Giải pháp', href: '#solutions', id: 'solutions' },
  { name: 'Mức tiết kiệm', href: '#calculator', id: 'calculator' },
  { name: 'Quy trình', href: '#workflow', id: 'workflow' },
  { name: 'Sản phẩm', href: '#showcase', id: 'showcase' },
  { name: 'Đội ngũ', href: '#team', id: 'team' },
  { name: 'Dùng thử', href: '#pricing', id: 'pricing' },
];

const NAVBAR_LIGHTBOX_ASSETS = [
  {
    id: 'all_banner',
    name: 'Studio 7 Thiết Bị',
    role: '2400×1120',
    title: 'Hệ Sinh Thái 7 Thiết Bị Đồng Bộ Thời Gian Thực (2400×1120 Studio Stage)',
    spec: '2400×1120 · 7 Thiết Bị Đồng Bộ <50ms',
    src: '/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'macbook_pro',
    name: 'MacBook Pro 16"',
    role: 'B2B TMS',
    title: 'MacBook Pro 16" M3 Max · Trung Tâm Điều Phối B2B TMS (/dashboard)',
    spec: '3456×2234 · 120 đơn / 7 tuyến ALNS · Báo cáo ESG 3 Sheet',
    src: '/pitch-deck-screenshots/26_mockup_macbook_pro_16_b2b_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'windows_xps',
    name: 'Windows 11 XPS 16',
    role: 'EVSIM',
    title: 'Dell Windows 11 XPS 16 · Buồng Đối Chứng Kép EVSIM (/benchmark)',
    spec: '3840×2400 · Đối chứng 374.4 km vs 243.7 km (-34.9%)',
    src: '/pitch-deck-screenshots/27_mockup_windows_xps_16_evsim_dual.png',
    liveHref: '/benchmark/',
  },
  {
    id: 'galaxy_zfold',
    name: 'Galaxy Z Fold',
    role: 'Cockpit',
    title: 'Samsung Galaxy Z Fold · Buồng Lái Xe Tải Mở (/maps)',
    spec: '2160×1856 · Chặng giữa (>500kg) · Né vùng cấm QĐ 23/2018',
    src: '/pitch-deck-screenshots/24_mockup_samsung_zfold_tablet_cockpit.png',
    liveHref: '/maps/?vehicle=0&mode=navigate',
  },
  {
    id: 'ipad_pro',
    name: 'iPad Pro M4',
    role: 'Kho Vận',
    title: 'iPad Pro M4 13" · Bảng Điều Khiển Kho Bãi & Taplo',
    spec: '2752×2064 · Quản lý bến xuất & ghép đơn chiều về',
    src: '/pitch-deck-screenshots/25_mockup_ipad_pro_tablet_tms.png',
    liveHref: '/dashboard/',
  },
  {
    id: 'iphone_duo',
    name: 'iPhone Duo',
    role: 'Gập Đôi',
    title: 'iPhone Duo Dual-Screen · Đa Nhiệm Tài Xế & Bản Đồ',
    spec: '2420×1080 · Màn 1: Đơn hàng (/driver) · Màn 2: Dẫn đường (/maps)',
    src: '/pitch-deck-screenshots/23_mockup_iphone_duo_dual_screen.png',
    liveHref: '/driver/',
  },
  {
    id: 'iphone_18_pro_max',
    name: 'iPhone 18 Pro Max',
    role: 'Chặng Giữa',
    title: 'iPhone 18 Pro Max · App Tài Xế Chế Độ Nắng Gắt (/driver)',
    spec: '2868×1320 · Giao hàng 1-chạm & ghép đơn chiều về (2.7% rỗng)',
    src: '/pitch-deck-screenshots/21_mockup_iphone_18_pro_max_driver.png',
    liveHref: '/driver/',
  },
  {
    id: 'galaxy_s26_ultra',
    name: 'Galaxy S26 Ultra',
    role: 'Live /maps',
    title: 'Samsung Galaxy S26 Ultra · Giao Hẻm Nhỏ & Google Maps Waypoints ($0)',
    spec: '3120×1440 · Waypoints + Google Maps Ô tô ($0 API)',
    src: '/pitch-deck-screenshots/22_mockup_samsung_s26_ultra_maps_live.png',
    liveHref: '/driver/',
  },
  {
    id: 'cover_banner',
    name: 'Ảnh Bìa OG 2.4K',
    role: '2400×1260',
    title: 'Ảnh Bìa OpenGraph / Pitch Deck (2400×1260 Cover Banner)',
    spec: '2400×1260 · Chuẩn Thương Hiệu EcoMiles · -34.9% Km & -39.2% CO₂e',
    src: '/pitch-deck-screenshots/00_ecomiles_flagship_cover_banner.png',
    liveHref: '/pitch-deck/',
  },
] as const;
const NAVBAR_ECOSYSTEM_DEVICES = NAVBAR_LIGHTBOX_ASSETS.slice(1, 8);

export const Navbar: React.FC<NavbarProps> = ({ onOpenPilotModal, onOpenPortalModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [devicesPopoverOpen, setDevicesPopoverOpen] = useState(false);
  const [navbarLightboxIdx, setNavbarLightboxIdx] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const handleSelectNavbarDevice = (deviceId: string) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('ecomiles:select-device', { detail: { deviceId } }));
    setDevicesPopoverOpen(false);
    setActiveSection('showcase');
    const target = document.querySelector('#showcase');
    if (!target) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      gsap.to(window, {
        duration: 0.85,
        scrollTo: { y: target, offsetY: 64, autoKill: false },
        ease: 'power3.inOut',
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setDevicesPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    if (navbarLightboxIdx === null) return undefined;
    const total = NAVBAR_LIGHTBOX_ASSETS.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavbarLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setNavbarLightboxIdx((p) => ((p ?? 0) - 1 + total) % total);
      else if (e.key === 'ArrowRight') setNavbarLightboxIdx((p) => ((p ?? 0) + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navbarLightboxIdx]);

  const handleSmoothNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, sectionId: string) => {
    if (typeof window === 'undefined') return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      target.scrollIntoView({ behavior: 'instant' });
    } else {
      gsap.to(window, {
        duration: 0.8,
        scrollTo: { y: target, offsetY: 64, autoKill: false },
        ease: 'power3.inOut',
      });
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Active Section Spy
      const sections = NAV_LINKS.map((link) => document.getElementById(link.id));
      const scrollPosition = window.scrollY + 220; // Offset for navbar

      let current = '';
      for (const section of sections) {
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            current = section.id;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 sm:py-4 px-3 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-6xl mx-auto w-full pointer-events-auto">
        {/* Floating Glass Pill Container */}
        <div
          className={`flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
            isScrolled
              ? 'bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-black/80 border border-white/15 ring-1 ring-white/5'
              : 'bg-slate-900/75 backdrop-blur-xl shadow-xl shadow-black/40 border border-white/10'
          }`}
        >
          {/* Left: Brand Emblem & Logo */}
          <a
            href="#main-content"
            onClick={() => setActiveSection('')}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="EcoMiles: về đầu trang"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-ecomiles-lime to-emerald-500 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Leaf className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-slate-950/20 stroke-slate-950" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  ECO<span className="text-ecomiles-lime">MILES</span>
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-wide">
                Logistics Xanh Thông Minh
              </span>
            </div>
          </a>

          {/* Center: Desktop Navigation Links with Active Scroll Spy Focus */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleSmoothNavClick(e, link.href, link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-full px-2.5 py-2 text-xs font-semibold transition-colors duration-200 xl:px-3 ${
                    isActive
                      ? 'text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-ecomiles-lime hover:bg-white/5 active:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbarActiveSectionPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-ecomiles-lime shadow-md shadow-ecomiles-lime/20"
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: Actions CTAs */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Desktop 7-Device Studio Banner & 1-Click Hardware Quick-Jump Popover */}
            <div className="relative hidden xl:block" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setDevicesPopoverOpen((prev) => !prev)}
                className={`whitespace-nowrap px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  devicesPopoverOpen
                    ? 'bg-ecomiles-lime text-slate-950 shadow-md'
                    : 'text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10'
                }`}
                aria-expanded={devicesPopoverOpen}
                aria-haspopup="dialog"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>7 Thiết Bị</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    devicesPopoverOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {devicesPopoverOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2.5 w-96 p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 z-50 pointer-events-auto"
                  >
                    <div
                      onClick={() => handleSelectNavbarDevice('all_banner')}
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-slate-900 cursor-pointer mb-2.5 transition-all hover:border-ecomiles-lime/50"
                    >
                      <img
                        src="/pitch-deck-screenshots/00_ecomiles_clean_devices_hero_stage.png"
                        alt="EcoMiles 7-Device Studio Stage"
                        className="w-full h-24 object-contain bg-black/50 p-1 group-hover:scale-105 transition-transform duration-300"
                        loading="eager"
                      />
                      <div className="px-2.5 py-1.5 bg-slate-950/90 border-t border-white/10 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold text-ecomiles-lime uppercase">
                          Sân Khấu 7 Thiết Bị 2.4K
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDevicesPopoverOpen(false);
                              setNavbarLightboxIdx(0);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-ecomiles-lime text-slate-950 font-extrabold text-[9.5px] hover:bg-yellow-300 cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>Phóng To 2.4K</span>
                          </button>
                          <span className="inline-flex items-center gap-0.5 text-[9.5px] font-mono text-slate-300">
                            <span>#showcase</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {NAVBAR_ECOSYSTEM_DEVICES.map((device, idx) => (
                        <div
                          key={device.id}
                          className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10.5px] font-semibold transition-all flex items-center justify-between"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectNavbarDevice(device.id)}
                            className="flex-1 text-left px-2 py-1.5 text-slate-200 hover:text-ecomiles-lime truncate cursor-pointer"
                          >
                            {device.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDevicesPopoverOpen(false);
                              setNavbarLightboxIdx(idx + 1);
                            }}
                            title={`Phóng to 2.4K: ${device.name}`}
                            className="inline-flex items-center gap-1 px-1.5 py-1 text-[9px] font-mono font-bold text-ecomiles-lime hover:bg-ecomiles-lime hover:text-slate-950 rounded-r-lg transition-colors shrink-0 cursor-pointer"
                          >
                            <span>{device.role}</span>
                            <ZoomIn className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <a
              href="#calculator"
              onClick={(e) => handleSmoothNavClick(e, '#calculator', 'calculator')}
              className={`whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSection === 'calculator'
                  ? 'bg-ecomiles-lime text-slate-950 shadow-md'
                  : 'text-ecomiles-lime bg-ecomiles-lime/10 border border-ecomiles-lime/20 hover:bg-ecomiles-lime/20'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Tính tiết kiệm</span>
            </a>

            <button
              type="button"
              onClick={onOpenPortalModal}
              className="whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 active:scale-95 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>Vào ứng dụng</span>
            </button>

            <button
              onClick={onOpenPilotModal}
              className="whitespace-nowrap px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 shadow-lg shadow-ecomiles-lime/20 hover:shadow-xl hover:shadow-ecomiles-lime/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Đăng ký dùng thử</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={onOpenPortalModal}
              className="px-2.5 py-1.5 rounded-full text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-1 sm:hidden cursor-pointer"
            >
              <LayoutDashboard className="w-3 h-3 text-ecomiles-lime" />
              <span>App</span>
            </button>
            <button
              onClick={onOpenPilotModal}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 shadow-sm sm:hidden"
            >
              Dùng thử
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-300 hover:bg-white/10"
              aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Glass Card) */}
        {mobileMenuOpen && (
          <div id="mobile-navigation" className="lg:hidden mt-2 p-4 bg-slate-950/95 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1.5">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleSmoothNavClick(e, link.href, link.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-ecomiles-lime text-slate-950 font-bold'
                        : 'text-slate-200 hover:text-ecomiles-lime hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="pt-3 mt-1 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setNavbarLightboxIdx(0);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-ecomiles-lime/40 text-ecomiles-lime font-extrabold text-xs flex items-center justify-between cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Sân Khấu 7 Thiết Bị 2.4K (Full Lightbox)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300">
                    <span>9 Ảnh</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
                <a
                  href="#calculator"
                  onClick={(e) => handleSmoothNavClick(e, '#calculator', 'calculator')}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-ecomiles-lime bg-ecomiles-lime/10 flex items-center justify-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5 text-ecomiles-lime" />
                  <span>Tính mức tiết kiệm và lượng CO₂ giảm</span>
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/dashboard/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <span>Trung Tâm B2B (/dashboard)</span>
                  </a>
                  <a
                    href="/maps/?vehicle=0&mode=navigate"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <span>Bản Đồ Xe Tải (/maps)</span>
                  </a>
                  <a
                    href="/driver/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <span>App Tài Xế (/driver)</span>
                  </a>
                  <a
                    href="/pitch-deck/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-2 rounded-xl text-[11px] font-bold bg-ecomiles-lime/15 border border-ecomiles-lime/40 text-ecomiles-lime flex items-center justify-center gap-1.5"
                  >
                    <span>Pitch Deck (28 Ảnh)</span>
                  </a>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPortalModal?.();
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-ecomiles-lime" />
                  <span>Vào ứng dụng (Chọn vai trò Quản lý / Tài xế)</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPilotModal();
                  }}
                  className="w-full py-3 rounded-xl text-center text-xs font-bold text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Đăng ký dùng thử miễn phí</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {navbarLightboxIdx !== null &&
        typeof document !== 'undefined' &&
        (() => {
          const total = NAVBAR_LIGHTBOX_ASSETS.length;
          const safeIdx = ((navbarLightboxIdx % total) + total) % total;
          const activeAsset = NAVBAR_LIGHTBOX_ASSETS[safeIdx];
          return createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activeAsset.title}
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 backdrop-blur-md p-3 sm:p-6 pointer-events-auto"
              onClick={() => setNavbarLightboxIdx(null)}
            >
              <div
                className="relative max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl border border-ecomiles-lime/45 bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/90">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-ecomiles-lime truncate">
                      [{safeIdx + 1}/{total}] {activeAsset.title}
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{activeAsset.spec}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setNavbarLightboxIdx((safeIdx - 1 + total) % total)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNavbarLightboxIdx((safeIdx + 1) % total)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-white/10"
                    >
                      <span>Tiếp</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={activeAsset.src}
                      download
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải PNG 2.4K</span>
                    </a>
                    <a
                      href={activeAsset.liveHref}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-ecomiles-lime hover:bg-yellow-300 text-slate-950 font-extrabold text-xs"
                    >
                      <span>Mở App Live</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setNavbarLightboxIdx(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Đóng</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60">
                  <img
                    src={activeAsset.src}
                    alt={activeAsset.title}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl drop-shadow-[0_24px_54px_rgba(0,0,0,0.9)]"
                  />
                </div>
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-center gap-1.5">
                  {NAVBAR_LIGHTBOX_ASSETS.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNavbarLightboxIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                        idx === safeIdx
                          ? 'bg-ecomiles-lime text-slate-950 border-ecomiles-lime'
                          : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          );
        })()}
    </header>
  );
};
