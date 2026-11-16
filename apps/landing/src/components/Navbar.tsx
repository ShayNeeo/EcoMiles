import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Menu, X, ArrowRight, LayoutDashboard, Palette } from 'lucide-react';
import { EcoMilesWordmark } from './EcoMilesMark';

gsap.registerPlugin(ScrollToPlugin);

interface NavbarProps {
  onOpenPilotModal: () => void;
  onOpenPortalModal?: () => void;
}

const NAV_LINKS = [
  { name: 'Giải pháp', href: '#solutions', id: 'solutions' },
  { name: 'Quy trình', href: '#workflow', id: 'workflow' },
  { name: 'ROI', href: '#calculator', id: 'calculator' },
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
        duration: 0.75,
        scrollTo: { y: target, offsetY: 72, autoKill: false },
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
      <div className="max-w-7xl mx-auto w-full pointer-events-auto">
        <div
          className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg transition-all duration-300 backdrop-blur-md ${
            isScrolled
              ? 'bg-[#002033]/95 shadow-[0_14px_32px_-12px_rgba(0,0,0,0.45)] border border-[#669BBC]/45'
              : 'bg-[#003049]/95 shadow-md border border-[#669BBC]/30'
          }`}
        >
          <a
            href="#main-content"
            onClick={() => setActiveSection('')}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="EcoMiles: về đầu trang"
          >
            <EcoMilesWordmark dark />
          </a>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Điều hướng chính">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleSmoothNavClick(e, link.href, link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
                    isActive
                      ? 'text-[#FDF0D5]'
                      : 'text-[#669BBC] hover:text-[#FDF0D5]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbarActiveSectionPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-md bg-[#C1121F] shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
            <a
              href="/brand/"
              className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-[#669BBC]/40 bg-[#002033] px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#FDF0D5] hover:border-[#C1121F] hover:bg-[#780000] transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-[#669BBC]" />
              <span>Brand Kit</span>
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="whitespace-nowrap px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 text-[#003049] bg-[#FDF0D5] hover:bg-[#669BBC] hover:text-[#003049] active:scale-95 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#AE1F23]" />
              <span>Đăng nhập</span>
            </button>

            <button
              type="button"
              onClick={onOpenPilotModal}
              className="whitespace-nowrap px-4 py-2 rounded-md text-xs font-extrabold text-[#FDF0D5] bg-[#C1121F] hover:bg-[#780000] border border-[#FDF0D5]/20 shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Pilot 4-6 tuần</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="px-3 py-1.5 rounded-md text-xs font-bold text-[#003049] bg-[#FDF0D5] flex items-center gap-1 sm:hidden cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#AE1F23]" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-[#FDF0D5] hover:bg-[#004366] cursor-pointer"
              aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="lg:hidden mt-2 p-4 bg-[#002033] rounded-lg border border-[#669BBC]/40 shadow-2xl"
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
                    className={`whitespace-nowrap px-4 py-2.5 rounded-md text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-[#C1121F] text-[#FDF0D5]'
                        : 'text-[#FDF0D5] hover:bg-[#003049]'
                    }`}
                  >
                    {link.name}
                  </a>
                );
              })}
              <a
                href="/brand/"
                className="whitespace-nowrap px-4 py-2.5 rounded-md text-sm font-bold text-[#669BBC] hover:text-[#FDF0D5] hover:bg-[#003049] flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                <span>Brand Kit &amp; Hệ thống nhận diện</span>
              </a>
              <div className="pt-3 mt-1 border-t border-[#669BBC]/25 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPortalModal?.();
                  }}
                  className="w-full py-2.5 rounded-md text-center text-xs font-bold text-[#003049] bg-[#FDF0D5] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#AE1F23]" />
                  <span>Đăng nhập Hệ thống</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPilotModal();
                  }}
                  className="w-full py-3 rounded-md text-center text-xs font-extrabold text-[#FDF0D5] bg-[#C1121F] hover:bg-[#780000] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Pilot miễn phí 4-6 tuần</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
