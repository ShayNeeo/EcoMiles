import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  Leaf,
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
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
  { name: 'Bảng giá', href: '#pricing', id: 'pricing' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenPilotModal, onOpenPortalModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      const sections = NAV_LINKS.map((link) => document.getElementById(link.id));
      const scrollPosition = window.scrollY + 220;

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
        <div
          className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
            isScrolled
              ? 'bg-slate-950/92 backdrop-blur-2xl shadow-2xl shadow-black/80 border border-white/15'
              : 'bg-slate-900/80 backdrop-blur-xl shadow-xl shadow-black/40 border border-white/10'
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
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-none">
                ECO<span className="text-ecomiles-lime">MILES</span>
              </span>
              <span className="text-xs text-slate-300 font-medium tracking-wide mt-0.5">
                Logistics Xanh Thông Minh
              </span>
            </div>
          </a>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleSmoothNavClick(e, link.href, link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                    isActive
                      ? 'text-slate-950 font-bold'
                      : 'text-slate-200 hover:text-ecomiles-lime hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbarActiveSectionPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-ecomiles-lime shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: 2 Focused Action CTAs (Live App + Free Pilot) */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="whitespace-nowrap px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-ecomiles-lime/40 active:scale-95 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>Vào ứng dụng</span>
            </button>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 shadow-lg shadow-black/40 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Đăng ký dùng thử</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 flex items-center gap-1 sm:hidden cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-ecomiles-lime" />
              <span>App</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-200 hover:bg-white/10 cursor-pointer"
              aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="lg:hidden mt-2 p-4 bg-slate-950/95 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl"
          >
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
                    onOpenPortalModal?.();
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-ecomiles-lime" />
                  <span>Vào ứng dụng Live (Quản lý / Tài xế / Đối chứng)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPilotModal();
                  }}
                  className="w-full py-3 rounded-xl text-center text-xs font-extrabold text-slate-950 bg-ecomiles-lime hover:bg-yellow-300 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Đăng ký dùng thử miễn phí</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
