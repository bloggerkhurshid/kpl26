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
import { MessageCircle, X } from 'lucide-react';

export function App() {
  const [teams] = useState<Team[]>(INITIAL_TEAMS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [management] = useState(INITIAL_MANAGEMENT);
  const [gallery] = useState(INITIAL_GALLERY);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);

  const handleApprovePlayer = (id: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Approved' } : p))
    );
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light text-dark">
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

      {/* WhatsApp Float Widget */}
      <div className="wa-float-wrap">
        {waOpen && (
          <div className="wa-popup animate__animated animate__fadeInUp">
            <div className="wa-popup-header">
              <span>KPL Help & Support</span>
              <button className="wa-popup-close" onClick={() => setWaOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p className="wa-popup-sub">Need help with Team/Player registration? Chat on WhatsApp:</p>
            <div className="wa-popup-contacts">
              <a
                href="https://wa.me/919876543210?text=Hi%20KPL%20Team%2C%20I%20have%20a%20query%20about%20Season%203%20Registration"
                target="_blank"
                rel="noreferrer"
                className="wa-contact-btn"
              >
                <div className="wa-contact-icon">
                  <MessageCircle size={18} />
                </div>
                <div className="wa-contact-info">
                  <strong>KPL Registration Desk</strong>
                  <small>+91 98765 43210</small>
                </div>
              </a>
            </div>
          </div>
        )}
        <button
          className={`wa-float-btn ${waOpen ? 'wa-open' : ''}`}
          onClick={() => setWaOpen(!waOpen)}
          title="Chat on WhatsApp"
        >
          <span className="wa-pulse"></span>
          {waOpen ? <X size={26} /> : <MessageCircle size={28} />}
        </button>
      </div>

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
