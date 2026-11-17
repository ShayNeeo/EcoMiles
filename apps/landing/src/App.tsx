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
    <div className="site-shell min-h-screen bg-[#FDF0D5] text-[#003049] antialiased selection:bg-[#C1121F] selection:text-[#FDF0D5]">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded bg-[#C1121F] px-4 py-2 text-sm font-bold text-[#FDF0D5] shadow-xl transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng
      </a>

      <Navbar
        onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')}
        onOpenPortalModal={() => setRolePortalOpen(true)}
      />

      <main id="main-content" tabIndex={-1}>
        <Hero onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')} />
        <Solutions />
        <InteractiveSavingsCalculator onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')} />
        <WorkflowShowcase />
        <DriverAndDispatcherShowcase />
        <Team />
        <PricingAndPilot onOpenPilotModal={handleOpenPilotModal} />
      </main>

      <Footer onOpenPilotModal={() => handleOpenPilotModal('Dùng thử miễn phí 4 - 6 tuần')} />

      <PilotModal
        isOpen={pilotModalOpen}
        onClose={() => setPilotModalOpen(false)}
        initialInterest={selectedInterest}
      />

      <RolePortalModal
        isOpen={rolePortalOpen}
        onClose={() => setRolePortalOpen(false)}
      />
    </div>
  );
}

export default App;
