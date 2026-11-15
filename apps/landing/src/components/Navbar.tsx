import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';
import { EcoMilesWordmark } from './EcoMilesMark';

gsap.registerPlugin(ScrollToPlugin);

interface NavbarProps {
  onOpenPilotModal: () => void;
  onOpenPortalModal?: () => void;
}

const NAV_LINKS = [
  { name: 'Giải pháp', href: '#solutions', id: 'solutions' },
  { name: 'Quy trình', href: '#workflow', id: 'workflow' },
  { name: 'Ước tính ROI', href: '#calculator', id: 'calculator' },
  { name: 'Bảng giá', href: '#pricing', id: 'pricing' },
  { name: 'Đội ngũ', href: '#team', id: 'team' },
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
          className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[4px] transition-all duration-300 ${
            isScrolled
              ? 'bg-[#FBF8F1]/98 shadow-md shadow-[#101418]/10 border border-[#BDB5A3]'
              : 'bg-[#FBF8F1]/95 shadow-sm shadow-[#101418]/5 border border-[#D8D2C4]'
          }`}
        >
          {/* Left: Return M & Wordmark */}
          <a
            href="#main-content"
            onClick={() => setActiveSection('')}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="EcoMiles: về đầu trang"
          >
            <EcoMilesWordmark />
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
                  className={`relative whitespace-nowrap rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                    isActive
                      ? 'text-[#101418] font-bold'
                      : 'text-[#5B5F66] hover:text-[#101418] hover:bg-[#ECE5D7]/60'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbarActiveSectionPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-[4px] bg-[#ECE5D7] border border-[#BDB5A3]"
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Right: 2 Focused Action CTAs (Sign In + Free Pilot) */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="whitespace-nowrap px-3.5 py-2 rounded-[4px] text-xs font-bold transition-all flex items-center gap-1.5 text-[#101418] bg-[#FFFFFF] hover:bg-[#ECE5D7] border border-[#BDB5A3] active:scale-95 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#1B45D7]" />
              <span>Đăng nhập Hệ thống</span>
            </button>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="whitespace-nowrap px-4 py-2 rounded-[4px] text-xs font-extrabold text-[#F6F1E7] bg-[#101418] hover:bg-[#1B45D7] shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Dùng thử 4-6 tuần</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#F6F1E7]" />
            </button>
          </div>
          {/* Mobile Right Controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="px-3 py-1.5 rounded-[4px] text-xs font-bold text-[#101418] bg-[#FFFFFF] border border-[#BDB5A3] flex items-center gap-1 sm:hidden cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#1B45D7]" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[#101418] hover:bg-[#ECE5D7] cursor-pointer"
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
            className="lg:hidden mt-2 p-4 bg-[#FBF8F1] rounded-[4px] border border-[#BDB5A3] shadow-xl"
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
                    className={`whitespace-nowrap px-4 py-2.5 rounded-[4px] text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#101418] text-[#F6F1E7] font-bold'
                        : 'text-[#5B5F66] hover:text-[#101418] hover:bg-[#ECE5D7]'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
              <div className="pt-3 mt-1 border-t border-[#D8D2C4] flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPortalModal?.();
                  }}
                  className="w-full py-2.5 rounded-[4px] text-center text-xs font-bold text-[#101418] bg-[#FFFFFF] hover:bg-[#ECE5D7] border border-[#BDB5A3] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#1B45D7]" />
                  <span>Đăng nhập Hệ thống</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPilotModal();
                  }}
                  className="w-full py-3 rounded-[4px] text-center text-xs font-extrabold text-[#F6F1E7] bg-[#101418] hover:bg-[#1B45D7] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Dùng thử 4-6 tuần</span>
                  <ArrowRight className="w-4 h-4 text-[#F6F1E7]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
