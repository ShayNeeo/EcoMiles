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
  { name: 'ROI', href: '#calculator', id: 'calculator' },
  { name: 'Quy trình', href: '#workflow', id: 'workflow' },
  { name: 'Giờ cấm', href: '#showcase', id: 'showcase' },
  { name: 'Bảng giá', href: '#pricing', id: 'pricing' },
];

export const Navbar: React.FC<NavbarProps> = ({ onOpenPilotModal, onOpenPortalModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSmoothNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    sectionId: string
  ) => {
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
      setIsScrolled(window.scrollY > 18);
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
    <header className="sticky top-0 z-50 w-full transition-all duration-200 bg-[#FDF0D5]/95 backdrop-blur-md border-b border-[#003049]/15">
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all ${
          isScrolled ? 'py-2.5' : 'py-3.5'
        }`}
      >
        <a
          href="#main-content"
          onClick={() => setActiveSection('')}
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="EcoMiles: về đầu trang"
        >
          <EcoMilesWordmark dark={false} />
        </a>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Điều hướng chính">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleSmoothNavClick(e, link.href, link.id)}
                className={`relative py-1 text-[13px] font-bold transition-colors ${
                  isActive ? 'text-[#C1121F]' : 'text-[#003049]/80 hover:text-[#003049]'
                }`}
              >
                <span>{link.name}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#C1121F]"
                    transition={{ type: 'spring', stiffness: 440, damping: 32 }}
                  />
                )}
              </a>
            );
          })}

          <a
            href="/brand/"
            className="inline-flex items-center gap-1.5 text-[12px] font-mono font-bold uppercase tracking-wider text-[#003049]/75 hover:text-[#C1121F] transition-colors"
            title="Mở EcoMiles Brand Identity System"
          >
            <Palette className="w-3.5 h-3.5 text-[#669BBC]" />
            <span>Brand Kit</span>
          </a>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenPortalModal ? (
            <button
              type="button"
              onClick={onOpenPortalModal}
              className="whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5 text-[#003049] bg-[#F8E7C4] hover:bg-[#EED9AF] border border-[#003049]/25 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#003049]" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            <a
              href="/dashboard/"
              className="whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5 text-[#003049] bg-[#F8E7C4] hover:bg-[#EED9AF] border border-[#003049]/25"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#003049]" />
              <span>Mở App</span>
            </a>
          )}

          <button
            type="button"
            onClick={onOpenPilotModal}
            className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-lg bg-[#C1121F] hover:bg-[#780000] text-[#FDF0D5] text-xs font-extrabold tracking-tight transition-colors shadow-sm cursor-pointer"
          >
            <span>Pilot 4-6 tuần</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-[#003049] hover:bg-[#EED9AF] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#003049]/15 bg-[#FDF0D5] px-4 py-4">
          <div className="flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleSmoothNavClick(e, link.href, link.id)}
                className="px-3 py-2.5 rounded-lg text-sm font-bold text-[#003049] hover:bg-[#F8E7C4]"
              >
                {link.name}
              </a>
            ))}
            <a
              href="/brand/"
              className="px-3 py-2.5 rounded-lg text-sm font-bold text-[#003049] hover:bg-[#F8E7C4] flex items-center gap-2"
            >
              <Palette className="w-4 h-4 text-[#C1121F]" />
              <span>Brand Kit &amp; Hệ Thống Nhận Diện</span>
            </a>
            <div className="pt-3 border-t border-[#003049]/15 flex flex-col gap-2">
              {onOpenPortalModal && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPortalModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#003049] text-[#FDF0D5] font-bold text-sm text-center cursor-pointer"
                >
                  Đăng nhập Hệ thống
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPilotModal();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[#C1121F] text-[#FDF0D5] font-extrabold text-sm text-center cursor-pointer"
              >
                Đăng ký Pilot 4-6 tuần
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
