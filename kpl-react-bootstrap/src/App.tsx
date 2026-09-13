import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Prizes } from './components/Prizes';
import { Format } from './components/Format';
import { Teams } from './components/Teams';
import { Players } from './components/Players';
import { Management } from './components/Management';
import { Gallery } from './components/Gallery';
import { RegistrationModal } from './components/RegistrationModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';

import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_MANAGEMENT, INITIAL_GALLERY } from './mockData';
import type { Player, Team } from './types';

export function App() {
  const [teams] = useState<Team[]>(INITIAL_TEAMS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [management] = useState(INITIAL_MANAGEMENT);
  const [gallery] = useState(INITIAL_GALLERY);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleApprovePlayer = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Approved' } : p))
    );
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-grow-1">
        <Hero onOpenRegister={() => setIsRegisterOpen(true)} />
        <Prizes />
        <Format />
        <Teams teams={teams} />
        <Players players={players} />
        <Management members={management} />
        <Gallery items={gallery} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        players={players}
        teams={teams}
        onApprovePlayer={handleApprovePlayer}
      />
    </div>
  );
}

export default App;
