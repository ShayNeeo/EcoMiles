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

export function App() {
  const [pilotModalOpen, setPilotModalOpen] = useState<boolean>(false);
  const [rolePortalOpen, setRolePortalOpen] = useState<boolean>(false);
  const [selectedInterest, setSelectedInterest] = useState<string>('Dùng thử miễn phí 4 - 6 tuần');

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
  }, []);

  const handleOpenPilotModal = (interest?: string) => {
    if (interest) {
      setSelectedInterest(interest);
    }
    setPilotModalOpen(true);
  };

  return (
    <div className="site-shell min-h-screen bg-[#F6F1E7] text-[#101418] antialiased selection:bg-[#101418] selection:text-[#F6F1E7]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded bg-[#101418] px-4 py-2 text-sm font-bold text-[#F6F1E7] shadow-xl transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng
      </a>

      {/* Asphalt & Paper Navigation Bar */}
      <Navbar
        onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')}
        onOpenPortalModal={() => setRolePortalOpen(true)}
      />

      <main id="main-content" tabIndex={-1}>
        {/* 1. Hero Section (Archivo Display + Return-Line Proof) */}
        <Hero onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')} />

        {/* 2. Solutions Section (4 Core VRPTW & Carbon Accounting Pillars) */}
        <Solutions />

        {/* 3. Interactive ROI & CO₂ Savings Calculator */}
        <InteractiveSavingsCalculator onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')} />

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
      <Footer onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')} />

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
