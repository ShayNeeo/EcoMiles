import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { InteractiveSavingsCalculator } from './components/InteractiveSavingsCalculator';
import { WorkflowShowcase } from './components/WorkflowShowcase';
import { DriverAndDispatcherShowcase } from './components/DriverAndDispatcherShowcase';
import { Team } from './components/Team';
import { PricingAndPilot } from './components/PricingAndPilot';
import { Footer } from './components/Footer';
import { PilotModal } from './components/PilotModal';
import { RolePortalModal } from './components/RolePortalModal';
import { PitchDeckVoiceoverPage } from './components/PitchDeckVoiceoverPage';

export function App() {
  const [pilotModalOpen, setPilotModalOpen] = useState<boolean>(false);
  const [rolePortalOpen, setRolePortalOpen] = useState<boolean>(false);
  const [selectedInterest, setSelectedInterest] = useState<string>('Dùng thử miễn phí 4–6 tuần');

  const checkIsPitchDeck = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return path.includes('pitch-deck') || path.includes('kich-ban') || hash.includes('pitch-deck') || hash.includes('kich-ban') || search.includes('pitch-deck');
  };

  const [showPitchDeck, setShowPitchDeck] = useState<boolean>(checkIsPitchDeck());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p === '/app') {
        window.location.replace('/app/');
        return;
      }
      if (p === '/driver') {
        window.location.replace('/driver/' + window.location.search);
        return;
      }
      if (p === '/dispatcher') {
        window.location.replace('/dispatcher/' + window.location.search);
        return;
      }
    }

    const handleLocationChange = () => {
      setShowPitchDeck(checkIsPitchDeck());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  if (showPitchDeck) {
    return (
      <PitchDeckVoiceoverPage
        onBackToHome={() => {
          setShowPitchDeck(false);
          window.history.pushState(null, '', '/');
        }}
      />
    );
  }

  const handleOpenPilotModal = (interest?: string) => {
    if (interest) {
      setSelectedInterest(interest);
    }
    setPilotModalOpen(true);
  };

  return (
    <div className="site-shell min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-ecomiles-lime selection:text-slate-950">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-ecomiles-lime px-4 py-2 text-sm font-bold text-slate-950 shadow-xl transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng
      </a>

      {/* Floating Glass Pill Top Bar */}
      <Navbar
        onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4–6 tuần')}
        onOpenPortalModal={() => setRolePortalOpen(true)}
      />

      <main id="main-content" tabIndex={-1}>
        {/* 1. Hero Section (Full Viewport Video with Barlow Condensed Headline & Route Map) */}
        <Hero onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4–6 tuần')} />

        {/* 2. Solutions Section (4 Core VRPTW & Carbon Accounting Pillars) */}
        <Solutions />

        {/* 3. Interactive ROI & CO₂ Savings Calculator */}
        <InteractiveSavingsCalculator onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4–6 tuần')} />

        {/* 4. 8-Step Interactive Dispatch Workflow */}
        <WorkflowShowcase />

        {/* 5. Dispatcher & Driver Web Portal Showcase */}
        <DriverAndDispatcherShowcase />

        {/* 6. Interdisciplinary Founding Team */}
        <Team />

        {/* 7. Pricing & Pilot Program */}
        <PricingAndPilot onOpenPilotModal={handleOpenPilotModal} />
      </main>

      {/* Footer */}
      <Footer onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4–6 tuần')} />

      {/* Pilot Registration Modal */}
      <PilotModal
        isOpen={pilotModalOpen}
        onClose={() => setPilotModalOpen(false)}
        initialInterest={selectedInterest}
      />

      {/* Live Demo Role Portal Modal (Zero-Friction Role Entrance) */}
      <RolePortalModal
        isOpen={rolePortalOpen}
        onClose={() => setRolePortalOpen(false)}
      />
    </div>
  );
}

export default App;
