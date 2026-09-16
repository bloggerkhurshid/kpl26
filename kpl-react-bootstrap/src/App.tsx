import { useState, useEffect, useRef } from 'react';
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
import type { Player, Team, ManagementMember, GalleryItem, ContentSettings } from './types';
import { kplApi, type ApiFeeSettings } from './api';
import { MessageCircle, X, Volume2, VolumeX } from 'lucide-react';

export function App() {
  const [contentSettings, setContentSettings] = useState<ContentSettings | undefined>(undefined);
  const [feeSettings, setFeeSettings] = useState<ApiFeeSettings | null>(null);

  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [management, setManagement] = useState<ManagementMember[]>(INITIAL_MANAGEMENT);
  const [gallery, setGallery] = useState<GalleryItem[]>(INITIAL_GALLERY);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const attemptPlay = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log('Autoplay blocked by browser:', e));
      }
      document.removeEventListener('click', attemptPlay);
      document.removeEventListener('touchstart', attemptPlay);
      window.removeEventListener('scroll', attemptPlay);
    };

    document.addEventListener('click', attemptPlay);
    document.addEventListener('touchstart', attemptPlay);
    window.addEventListener('scroll', attemptPlay, { once: true });

    // Try immediately
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.log('Initial autoplay blocked:', e));
    }

    return () => {
      document.removeEventListener('click', attemptPlay);
      document.removeEventListener('touchstart', attemptPlay);
      window.removeEventListener('scroll', attemptPlay);
    };
  }, []);

  // Fetch live API data on mount with local storage cache
  useEffect(() => {
    // 1. Check local cache for immediate fast render
    const cached = localStorage.getItem('kpl_react_home_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.content) setContentSettings(parsed.content);
        if (parsed.fees) setFeeSettings(parsed.fees);
        if (parsed.teams && parsed.teams.length > 0) setTeams(parsed.teams);
        if (parsed.players && parsed.players.length > 0) setPlayers(parsed.players);
        if (parsed.management && parsed.management.length > 0) setManagement(parsed.management);
        if (parsed.gallery && parsed.gallery.length > 0) setGallery(parsed.gallery);
      } catch (err) {
        console.warn('Cache parsing notice:', err);
      }
    }

    // 2. Fetch live data from PHP REST API (https://kpl.projuktisoft.com)
    Promise.all([
      kplApi.getContentSettings().catch(() => null),
      kplApi.getFeeSettings().catch(() => null),
      kplApi.getTeams('active').catch(() => []),
      kplApi.getPlayers().catch(() => []),
      kplApi.getManagement('active').catch(() => []),
      kplApi.getGallery().catch(() => []),
    ])
      .then(([contentData, feeData, teamsData, playersData, mgmtData, galleryData]) => {
        if (contentData) {
          setContentSettings(contentData);
        }

        if (feeData) {
          setFeeSettings(feeData);
        }

        // Teams
        if (Array.isArray(teamsData) && teamsData.length > 0) {
          const mappedTeams: Team[] = teamsData.map((t) => ({
            id: t.id,
            name: t.name,
            short_name: t.short_code || t.name.slice(0, 3).toUpperCase(),
            owner_name: t.owner_name,
            captain_name: t.captain_name || 'TBA',
            city: t.home_location || 'Assam',
            primary_color: t.accent_color || '#0f172a',
            secondary_color: '#d4af37',
            logo_url: t.logo_url || '/images/kpl-logo.jpg',
            squad_count: 0,
          }));
          setTeams(mappedTeams);
        }

        // Players
        if (Array.isArray(playersData) && playersData.length > 0) {
          const mappedPlayers: Player[] = playersData.map((p) => ({
            id: p.id,
            registration_number: p.registration_number,
            full_name: p.player_name,
            role: p.role,
            category: p.player_category || 'Local',
            base_price: p.base_price ? `₹ ${p.base_price}` : '₹ 500',
            team_name: p.team_id || undefined,
            photo_url: p.photo || '/images/kpl-logo.jpg',
            status: p.status || 'Pending',
            contact: p.contact_number || '',
            village: p.village || p.present_address || 'Assam',
          }));
          setPlayers(mappedPlayers);
        }

        // Management Committee
        if (Array.isArray(mgmtData) && mgmtData.length > 0) {
          const mappedMgmt: ManagementMember[] = mgmtData.map((m) => ({
            id: m.id,
            name: m.name,
            designation: m.designation,
            contact: m.contact || '+91 86384 79115',
            photo_url: m.photo_url || '/images/kpl-logo.jpg',
            display_order: m.display_order || 1,
          }));
          setManagement(mappedMgmt);
        }

        // Gallery Photos
        if (Array.isArray(galleryData) && galleryData.length > 0) {
          const mappedGallery: GalleryItem[] = galleryData.map((g) => ({
            id: g.id,
            photo_url: g.photo_url,
            caption: g.caption || 'KPL Tournament Action',
            category: 'Match Action',
          }));
          setGallery(mappedGallery);
        }

        // Cache fresh response
        localStorage.setItem(
          'kpl_react_home_cache',
          JSON.stringify({
            content: contentData,
            fees: feeData,
            teams: teamsData,
            players: playersData,
            management: mgmtData,
            gallery: galleryData,
          })
        );
      })
      .catch((err) => {
        console.error('Error loading KPL live API data:', err);
      });
  }, []);

  const handleApprovePlayer = (id: string) => {
    kplApi
      .updatePlayer(id, { status: 'active' })
      .catch((err) => console.warn('Approve player API note:', err));

    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Approved' } : p))
    );
  };

  const handlePlayerRegistered = (newPlayer: any) => {
    setPlayers((prev) => [newPlayer, ...prev]);
  };

  const handleTeamRegistered = (newTeam: any) => {
    setTeams((prev) => [newTeam, ...prev]);
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light text-dark">
      {/* Background Audio */}
      <audio ref={audioRef} autoPlay loop src="https://kpl.projuktisoft.com/uploads/gallery/background-audio.mp3" style={{ display: 'none' }} />
      {/* Top Navbar */}
      <Navbar
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-grow-1">
        <Hero
          content={contentSettings}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />
        <Prizes />
        <Format content={contentSettings} />
        <Teams teams={teams} />
        <Players players={players} />
        <Management members={management} />
        <Gallery items={gallery} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Audio Control Float Widget */}
      <button
        onClick={toggleAudio}
        className="btn btn-dark rounded-circle shadow d-flex align-items-center justify-content-center"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '56px',
          height: '56px',
          zIndex: 9999,
          backgroundColor: '#0f172a',
          border: '2px solid #d4af37'
        }}
        title={isPlaying ? "Mute Background Music" : "Play Background Music"}
      >
        {isPlaying ? <Volume2 size={24} color="#d4af37" /> : <VolumeX size={24} color="#fff" />}
      </button>

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
                href="https://wa.me/918638479115?text=Hi%20Saddam%2C%20I%20have%20a%20query%20about%20KPL%20Season%203%20Registration"
                target="_blank"
                rel="noreferrer"
                className="wa-contact-btn"
              >
                <div className="wa-contact-icon">
                  <MessageCircle size={18} />
                </div>
                <div className="wa-contact-info">
                  <strong>Saddam Hussain (Secretary)</strong>
                  <small>+91 86384 79115</small>
                </div>
              </a>

              <a
                href="https://wa.me/916002506596?text=Hi%20Abu%20Sahid%2C%20I%20have%20a%20query%20about%20KPL%20Season%203%20Registration"
                target="_blank"
                rel="noreferrer"
                className="wa-contact-btn"
              >
                <div className="wa-contact-icon">
                  <MessageCircle size={18} />
                </div>
                <div className="wa-contact-info">
                  <strong>Abu Sahid Sk (Support Desk)</strong>
                  <small>+91 60025 06596</small>
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
        feeSettings={feeSettings}
        onPlayerRegistered={handlePlayerRegistered}
        onTeamRegistered={handleTeamRegistered}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        players={players}
        teams={teams}
        contentSettings={contentSettings}
        feeSettings={feeSettings}
        onApprovePlayer={handleApprovePlayer}
        onUpdateFeeSettings={(newFees) => setFeeSettings((prev) => ({ ...prev, ...newFees }))}
        onUpdateContentSettings={(newContent) =>
          setContentSettings((prev) => ({ ...prev, ...newContent }))
        }
      />
    </div>
  );
}

export default App;

