'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Crown,
  Facebook,
  Flame,
  Instagram,
  Loader2,
  MapPin,
  Medal,
  Menu,
  Play,
  Radio,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Clock,
  X,
  Zap,
  Target,
  Activity,
  Swords,
} from 'lucide-react';
import { kplApi, getImageUrl } from '@/lib/api';
import { ManagementSection } from '@/components/ManagementSection';
import { GallerySection } from '@/components/GallerySection';
import { UpiPaymentModal } from '@/components/UpiPaymentModal';



type Team = {
  id: string;
  name: string;
  owner_name?: string;
  owner?: string;
  captain_name?: string;
  captain?: string;
  home_location?: string;
  short_code: string;
  accent_color?: string;
  color?: string;
  logo_url?: string;
  squad_count?: number;
  squad_limit?: number;
  budget?: number;
  status: string;
};

type Player = {
  id: string;
  player_name: string;
  role: string;
  photo: string;
  player_category?: string;
};

type GalleryItem = {
  title: string;
  image: string;
  size: string;
};

type ModalType = 'team' | 'player' | null;

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const navItems = ['League', 'Teams', 'Champions', 'Highlights'];

function SectionLabel({ children }: { children: string }) {
  return <p className="section-label"><span />{children}</p>;
}

function CountdownTimer({ deadlineDate }: { deadlineDate?: string }) {
  const getTimeLeft = () => {
    const target = deadlineDate ? new Date(deadlineDate) : new Date(Date.now() + 12 * 86400000);
    const diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds };
  };
  const [time, setTime] = useState(getTimeLeft);
  useEffect(() => {
    const timer = window.setInterval(() => setTime(getTimeLeft()), 1000);
    return () => window.clearInterval(timer);
  }, [deadlineDate]);
  return (
    <div className="countdown" aria-label="Registration deadline countdown">
      {Object.entries(time).map(([label, value]) => <div className="countdown-cell" key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}
    </div>
  );
}

/* ---- WhatsApp Floating Support Button ---- */
function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const contacts = [
    { name: 'Saddam Hussain', number: '8638479115' },
    { name: 'Abu Sahid Sk', number: '6002506596' },
  ];
  return (
    <div className="wa-float-wrap">
      {open && (
        <div className="wa-popup">
          <div className="wa-popup-header">
            <span>💬 WhatsApp Support</span>
            <button onClick={() => setOpen(false)} className="wa-popup-close">✕</button>
          </div>
          <p className="wa-popup-sub">Hi there! Need help? Chat with us on WhatsApp.</p>
          <div className="wa-popup-contacts">
            {contacts.map(c => (
              <a
                key={c.number}
                href={`https://wa.me/91${c.number}?text=Hi%2C%20I%20need%20help%20with%20KPL%20Season%203%20registration.`}
                target="_blank"
                rel="noopener noreferrer"
                className="wa-contact-btn"
              >
                <span className="wa-contact-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </span>
                <span className="wa-contact-info">
                  <strong>{c.name}</strong>
                  <small>+91 {c.number}</small>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        className={`wa-float-btn ${open ? 'wa-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="WhatsApp Support"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        {!open && <span className="wa-pulse" />}
      </button>
    </div>
  );
}

const FALLBACK_HERO_PHOTOS = [
  'https://kpl.projuktisoft.com/uploads/gallery/gallery_6aa6f7ff7fa9e4.23537043.jpg',
  'https://kpl.projuktisoft.com/uploads/gallery/gallery_6aa6f7fb8e0d31.97887951.jpg',
  'https://kpl.projuktisoft.com/uploads/gallery/gallery_6aa6f4789eb346.46586793.jpg',
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [modal, setModal] = useState<ModalType>(null);

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [teamForm, setTeamForm] = useState({
    team_name: '',
    owner_name: '',
    captain_name: '',
    contact_number: '',
    email: '',
    home_location: '',
    message: '',
  });

  const [playerForm, setPlayerForm] = useState({
    player_name: '',
    father_name: '',
    age_input: '',
    contact_number: '',
    present_address: '',
    address_proof: '',
    photo: '',
    batsman: false,
    batting_hand: '',
    wicket_keeper: false,
    player_category: '',
    previously_played: false,
    bowler: false,
    bowling_arm: '',
    bowling_style: '',
    declaration_accepted: false,
  });

  const [registeredId, setRegisteredId] = useState('');
  const [fees, setFees] = useState({ fee_player: 500, fee_foreign_player: 1000, fee_team: 5000, active_gateway: 'upi_direct', upi_id: '8638479115@ybl', upi_payee_name: 'Khoraghat Premier League' });
  const [upiModalData, setUpiModalData] = useState<{
    isOpen: boolean;
    type: 'player' | 'team';
    regId: string;
    name: string;
    phone: string;
    amount: number;
  }>({
    isOpen: false,
    type: 'player',
    regId: '',
    name: '',
    phone: '',
    amount: 500,
  });

  const [content, setContent] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // 1. Instantly load from local cache if available (Stale-While-Revalidate)
    const cachedData = localStorage.getItem('kpl_home_cache');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed.t) setTeams(parsed.t);
        if (parsed.p) setPlayers(parsed.p);
        if (parsed.count !== undefined) setPlayerCount(parsed.count);
        if (parsed.h) setGallery(parsed.h);
        if (parsed.f) setFees(parsed.f);
        if (parsed.c) { setContent(parsed.c); setLoadingContent(false); }
      } catch(e) {}
    }

    // 2. Fetch fresh data in the background from PHP API (https://kpl.projuktisoft.com/)
    Promise.all([
      kplApi.getTeams('active').catch(() => []),
      kplApi.getPlayers({ status: 'active', limit: 8 }).catch(() => []),
      kplApi.getHighlights(6).catch(() => []),
      kplApi.getFeeSettings().catch(() => null),
      kplApi.getContentSettings().catch(() => null),
    ]).then(([t, p, h, f, c]) => {
      const parsedGallery = Array.isArray(h) ? h.map((item: any) => ({ title: item.title || '', image: item.image_url || item.image || '', size: item.size || 'normal' })) : [];
      
      if (Array.isArray(t)) setTeams(t as Team[]);
      if (Array.isArray(p)) {
        setPlayers(p as Player[]);
        setPlayerCount(p.length);
      }
      if (parsedGallery.length > 0) setGallery(parsedGallery as GalleryItem[]);
      if (f) setFees(f);
      if (c) {
        setContent(c);
        setLoadingContent(false);
      }

      // 3. Update local cache
      localStorage.setItem('kpl_home_cache', JSON.stringify({
        t: t || [],
        p: p || [],
        count: Array.isArray(p) ? p.length : 0,
        h: parsedGallery,
        f: f || fees,
        c: c || {}
      }));
    }).catch(console.error);


    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroPhotos = gallery.filter((g) => g.image).map((g) => g.image);
  const activeHeroList = heroPhotos.length > 0 ? heroPhotos : FALLBACK_HERO_PHOTOS;

  // Cycle hero background through gallery images smoothly every 5s
  useEffect(() => {
    if (activeHeroList.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % activeHeroList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeHeroList.length]);


  const handlePlayerFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FileReader and Canvas to compress image to max 800px width/height and JPEG 0.7 quality (< 150KB)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.72);
          setPlayerForm(prev => ({ ...prev, [field]: compressed }));
        } else {
          setPlayerForm(prev => ({ ...prev, [field]: dataUrl }));
        }
      };
      img.onerror = () => {
        setPlayerForm(prev => ({ ...prev, [field]: dataUrl }));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (modal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  function closeModal() {
    setModal(null);
    setStatus('idle');
    setErrorMsg('');
  }

  async function submitTeamRegistration(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    const newRegNum = `KPL-TEAM-${Date.now().toString().slice(-6)}`;

    // Defer API call until payment proof is submitted
    setModal(null);
    setStatus('idle');
    setUpiModalData({
      isOpen: true,
      type: 'team',
      regId: newRegNum,
      name: teamForm.owner_name,
      phone: teamForm.contact_number,
      amount: Number(fees.fee_team) || 5000,
    });
  }

  async function submitPlayerRegistration(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!playerForm.photo) {
      setStatus('error');
      setErrorMsg('Please upload your player photo before submitting registration.');
      return;
    }

    if (!playerForm.address_proof) {
      setStatus('error');
      setErrorMsg('Please upload your address proof document (Aadhaar, Voter ID, etc.) before submitting.');
      return;
    }

    if (!playerForm.declaration_accepted) {
      setStatus('error');
      setErrorMsg('Please accept the Player Declaration & Undertaking checkbox to proceed.');
      return;
    }

    setStatus('submitting');
    
    const newRegNum = `KPL-PLR-${Date.now().toString().slice(-6)}`;
    const paymentAmount = playerForm.player_category === 'Foreign' ? Number(fees.fee_foreign_player) : Number(fees.fee_player);

    // Defer API call until payment proof is submitted
    setModal(null);
    setStatus('idle');
    setUpiModalData({
      isOpen: true,
      type: 'player',
      regId: newRegNum,
      name: playerForm.player_name,
      phone: playerForm.contact_number,
      amount: paymentAmount || 500,
    });
  }

  const scrollTo = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main>
      {/* Loading Screen — shown only on first visit (no cache) */}
      {loadingContent && (
        <div className="kpl-loading-screen">
          <div className="kpl-loading-content">
            {/* KPL Logo */}
            <img
              src="/kpl-logo.jpg"
              alt="KPL Logo"
              className="kpl-loading-logo"
            />
            {/* Progress bar */}
            <div className="kpl-loading-bar-wrap">
              <div className="kpl-loading-bar" />
            </div>
            <p className="kpl-loading-text">Entering the KPL Arena…</p>
          </div>
        </div>
      )}

      <nav className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-container max-w-7xl mx-auto w-full flex items-center justify-between">
          <button className="brand" onClick={scrollToTop} aria-label="KPL home">
            <img src="/kpl-logo.jpg" alt="KPL" className="brand-logo" />
            <span className="brand-text">
              KHORAGHAT PREMIER LEAGUE
              <span>SEASON 03 • 2026</span>
            </span>
          </button>
          <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
            <button onClick={scrollToTop}>Home</button>
            {content.show_about === 'true' && <button onClick={(e) => scrollTo('league', e)}>League</button>}
            {content.show_format === 'true' && <button onClick={(e) => scrollTo('format', e)}>Format</button>}
            {content.show_teams === 'true' && <button onClick={(e) => scrollTo('teams', e)}>Teams</button>}
            {content.show_management === 'true' && <button onClick={(e) => scrollTo('management', e)}>Management</button>}
            {content.show_gallery === 'true' && <button onClick={(e) => scrollTo('gallery', e)}>Gallery</button>}
            
            {/* Redesigned Nav Register Button */}
            <div className="nav-cta-wrapper">
              <button
                className="nav-cta"
                onClick={() => {
                  setModal('player');
                  setMenuOpen(false);
                }}
                title="Register for KPL Season 3"
              >
                <span className="nav-cta-pulse" />
                <span>Register Now</span>
                <ArrowRight size={15} strokeWidth={2.8} className="nav-cta-arrow" />
              </button>
            </div>
          </div>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </nav>

      {content.show_hero === 'true' && (
        <section className="hero" id="top">
          {/* Cycling background images with smooth CSS crossfade */}
          {activeHeroList.map((imgSrc, idx) => {
            const activeIdx = heroIndex % (activeHeroList.length || 1);
            return (
              <img
                key={imgSrc}
                src={getImageUrl(imgSrc)}
                alt="KPL Action"
                aria-hidden="true"
                className={`hero-bg-img ${idx === activeIdx ? 'is-active' : ''}`}
              />
            );
          })}
          <div className="page-width hero-wrapper">
            <div className="hero-content">
              {/* Live Status Ribbon */}
              <div className="hero-badge-row">
                <div className="hero-live-pill">
                  <span className="hero-live-dot" />
                  <span>Season 3 · 2026 Registration Open</span>
                </div>
                <div className="hero-venue-pill">
                  <MapPin size={13} className="text-emerald-400" />
                  <span>Khoraghat High School Ground, Assam</span>
                </div>
              </div>

              {/* Headline Title */}
              <h1
                className="sport-heading hero-title"
                dangerouslySetInnerHTML={{
                  __html: content.hero_title || 'ASSAM’S PREMIER <em>HARD TENNIS</em> CRICKET CHAMPIONSHIP'
                }}
              />

              {/* Subtitle */}
              <p className="lead hero-lead">
                {content.hero_subtitle || 'Eight elite franchises. High-voltage auction draft. Massive cash prizes & trophies live under floodlights from Khoraghat, Bilasipara, Dhubri, Assam.'}
              </p>

              {/* Action Buttons */}
              <div className="hero-actions">
                <button
                  className="button button-primary"
                  onClick={() => setModal('player')}
                >
                  <span>Register Player</span>
                  <ArrowRight size={17} strokeWidth={2.8} />
                </button>
                <button
                  className="button button-outline"
                  onClick={() => setModal('team')}
                >
                  <Users size={17} />
                  <span>Register Franchise</span>
                </button>
                <button
                  className="hero-prizes-link"
                  onClick={(e) => scrollTo('prizes', e)}
                >
                  <Trophy size={16} />
                  <span>Explore Prizes</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}


      {content.show_stats === 'true' && (
        <section className="section-pad prizes-section" id="prizes">
          <div className="page-width">
            <div className="section-header-center">
              <span className="section-label">Ultimate Glory</span>
              <h2 className="sport-heading">Prize <em>Pool</em></h2>
              <p className="lead" style={{ margin: '16px auto 0', maxWidth: '640px' }}>
                Compete for major cash prizes and prestigious trophies in KPL Season 3.
              </p>
            </div>

            <div className="prizes-podium-grid">
              {/* Runners Up (Silver - 2nd Place, Left on Desktop) */}
              <div className="podium-card podium-card-runner">
                <span className="podium-badge podium-badge-silver">
                  <Medal size={13} /> 2nd Place · Finalist
                </span>
                <div className="podium-icon-wrap podium-icon-runner">
                  <Award size={34} />
                </div>
                <h3 className="podium-title">Runners Up</h3>
                <div className="podium-amount podium-amount-medium">₹17,000</div>
                <div className="podium-reward">Runner-Up Trophy + Medals</div>
                <ul className="podium-checklist">
                  <li className="podium-check-item">
                    <span className="podium-check-icon podium-check-silver"><Check size={11} strokeWidth={3} /></span>
                    <span>Official KPL Runner-Up Silver Trophy</span>
                  </li>
                  <li className="podium-check-item">
                    <span className="podium-check-icon podium-check-silver"><Check size={11} strokeWidth={3} /></span>
                    <span>16x Squad Finalist Medals</span>
                  </li>
                </ul>
              </div>

              {/* Champions (Gold/Emerald Spotlight - Center on Desktop, Top on Mobile) */}
              <div className="podium-card podium-card-champion">
                <span className="podium-badge podium-badge-gold">
                  <Crown size={13} /> 1st Place · Grand Champions
                </span>
                <div className="podium-icon-wrap podium-icon-champion">
                  <Trophy size={36} />
                </div>
                <h3 className="podium-title" style={{ color: 'var(--green-mint)' }}>Champions</h3>
                <div className="podium-amount podium-amount-large">₹27,000</div>
                <div className="podium-reward" style={{ color: '#ffffff' }}>Grand Trophy + Winner Medals</div>
                <ul className="podium-checklist">
                  <li className="podium-check-item">
                    <span className="podium-check-icon"><Check size={11} strokeWidth={3} /></span>
                    <span>Grand KPL Championship Cup</span>
                  </li>
                  <li className="podium-check-item">
                    <span className="podium-check-icon"><Check size={11} strokeWidth={3} /></span>
                    <span>16x Squad Winner Medals</span>
                  </li>
                </ul>
              </div>

              {/* Player of Series (MVP - Right on Desktop) */}
              <div className="podium-card podium-card-mvp">
                <span className="podium-badge podium-badge-mvp">
                  <Star size={13} /> Tournament MVP
                </span>
                <div className="podium-icon-wrap podium-icon-mvp">
                  <Star size={34} />
                </div>
                <h3 className="podium-title">Player of Series</h3>
                <div className="podium-amount podium-amount-gold">₹500</div>
                <div className="podium-reward">MOM Trophy & Cap Awards</div>
                <ul className="podium-checklist">
                  <li className="podium-check-item">
                    <span className="podium-check-icon podium-check-gold"><Check size={11} strokeWidth={3} /></span>
                    <span>Player of the Series Trophy</span>
                  </li>
                  <li className="podium-check-item">
                    <span className="podium-check-icon podium-check-gold"><Check size={11} strokeWidth={3} /></span>
                    <span>Official Cap & Match Awards</span>
                  </li>
                </ul>
              </div>
            </div>


          </div>
        </section>
      )}

      {content.show_about === 'true' && (
        <section className="section-pad league-section" id="league">
          <div className="page-width">
            <div className="league-redesign-container">
              {/* Top Section Header */}
              <div className="league-redesign-header">
                <div className="league-badge-pill">
                  <Flame size={14} className="league-flame-icon" />
                  <span>KPL 2026 Season Official</span>
                </div>
                <h2 className="league-display-title">
                  {content.about_title || 'Assam’s Premier Cricket League'}
                </h2>
                <p className="league-display-subtitle">
                  {content.about_text || 'KPL is more than a tournament. It is where the region’s fearless players find their stage, where rivalries become traditions, and every over writes a new story.'}
                </p>
              </div>

              {/* Central Grid with Main Narrative Card & Dynamic Feature Highlights */}
              <div className="league-redesign-grid">
                {/* Left: High-Impact Mission Showcase Card */}
                <div className="league-feature-showcase">
                  <div className="league-showcase-glow" />
                  <div className="league-showcase-content">
                    <span className="league-tag">The Championship Spirit</span>
                    <h3 className="league-showcase-heading">Built For Real Champions.</h3>
                    <p className="league-showcase-desc">
                      Bringing together Khoraghat’s and Assam’s finest cricketing talent under one electrifying stage. High-octane competition, passionate stadium crowds, professional umpiring, and an atmosphere built for legends.
                    </p>

                    <div className="league-stats-row">
                      <div className="league-stat-item">
                        <span className="league-stat-num">100%</span>
                        <span className="league-stat-label">Fair Play & Rules</span>
                      </div>
                      <div className="league-stat-divider" />
                      <div className="league-stat-item">
                        <span className="league-stat-num">Live</span>
                        <span className="league-stat-label">CricHeroes Tracked</span>
                      </div>
                      <div className="league-stat-divider" />
                      <div className="league-stat-item">
                        <span className="league-stat-num">Grand</span>
                        <span className="league-stat-label">Podium Awards</span>
                      </div>
                    </div>

                    {content.show_format === 'true' && (
                      <button className="league-cta-btn" onClick={(e) => scrollTo('format', e)}>
                        <span>Explore Tournament Format</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Key Feature Badges / Pillars */}
                <div className="league-pillars-column">
                  <div className="league-pillar-card">
                    <div className="league-pillar-icon icon-gold">
                      <Radio size={24} />
                    </div>
                    <div className="league-pillar-body">
                      <h4>Real-time CricHeroes Scoring</h4>
                      <p>Every ball, boundary, and wicket broadcasted live with detailed bowler & batsman analytics for scouts and fans.</p>
                    </div>
                  </div>

                  <div className="league-pillar-card">
                    <div className="league-pillar-icon icon-purple">
                      <Trophy size={24} />
                    </div>
                    <div className="league-pillar-body">
                      <h4>Championship Honors</h4>
                      <p>₹44,500 total cash rewards, winner and runner-up cups, tournament MVP honors, and 32 squad medals.</p>
                    </div>
                  </div>

                  <div className="league-pillar-card">
                    <div className="league-pillar-icon icon-green">
                      <ShieldCheck size={24} />
                    </div>
                    <div className="league-pillar-body">
                      <h4>Certified Officiating</h4>
                      <p>Certified umpires and strict tournament bylaws ensuring pure cricket integrity and sportsmanship throughout.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_format === 'true' && (
        <section className="section-pad" id="format">
          <div className="page-width">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Built for the bold</span>
              <h2 className="sport-heading">{content.format_title || 'Tournament Format'}</h2>
              <p className="lead" style={{ margin: '16px auto 0', whiteSpace: 'pre-wrap' }}>{content.format_subtitle}</p>
            </div>
            
            <div className="format-grid">
              <div className="format-card">
                <span className="format-icon">01</span>
                <h3 className="sport-heading" style={{ color: 'var(--green-mint)', fontSize: '22px' }}>Match format</h3>
                <p style={{ marginTop: '8px', lineHeight: 1.6 }}>15 overs of high intensity hard tennis ball cricket.</p>
              </div>
              <div className="format-card">
                <span className="format-icon">02</span>
                <h3 className="sport-heading" style={{ color: 'var(--green-mint)', fontSize: '22px' }}>League structure</h3>
                <p style={{ marginTop: '8px', lineHeight: 1.6 }}>8 franchise teams playing round robin matches followed by a knockout stage.</p>
              </div>
              <div className="format-card">
                <span className="format-icon">03</span>
                <h3 className="sport-heading" style={{ color: 'var(--green-mint)', fontSize: '22px' }}>Season duration</h3>
                <p style={{ marginTop: '8px', lineHeight: 1.6 }}>A multi-week tournament featuring competitive fixtures.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_teams === 'true' && (
        <section className="section-pad" id="teams">
          <div className="page-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="section-label">Franchise Battle</span>
                <h2 className="sport-heading">Franchises & Contenders</h2>
                <p className="lead" style={{ margin: '8px 0 0', maxWidth: '640px' }}>
                  Official franchise teams competing for championship glory, cash prizes, and the prestigious KPL trophy in Khoraghat.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setModal('team')}
                  className="button button-primary"
                  style={{ padding: '10px 20px', fontSize: '12.5px' }}
                >
                  <Users size={15} />
                  <span>Register Franchise</span>
                </button>
                <a
                  className="button button-outline"
                  style={{ padding: '10px 18px', fontSize: '12.5px' }}
                  href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20own%20a%20franchise%20in%20KPL%20Season%203."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Enquire Ownership</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
            
            <div className="teams-grid">
              {teams.length === 0 ? (
                <div className="teams-empty-state">
                  <div className="teams-empty-icon">
                    <Shield size={36} className="text-emerald-400" />
                  </div>
                  <h3 className="sport-heading" style={{ fontSize: '22px', color: '#fff', marginTop: '12px' }}>
                    Franchises Being Unveiled
                  </h3>
                  <p className="lead" style={{ maxWidth: '480px', margin: '8px auto 20px' }}>
                    Franchise registrations are currently underway. Be the first to register your team for KPL Season 3!
                  </p>
                  <button onClick={() => setModal('team')} className="button button-primary">
                    <Users size={16} />
                    <span>Register Your Franchise Now</span>
                  </button>
                </div>
              ) : (
                teams.map((team, i) => {
                  const teamOwner = team.owner_name || team.owner || 'Franchise Management';
                  const teamCaptain = team.captain_name || team.captain || 'TBA';
                  const teamLocation = team.home_location || 'Khoraghat / Dhubri';
                  const teamAccent = team.accent_color || team.color || '#22c55e';
                  const teamShort = team.short_code || team.name.slice(0, 3).toUpperCase();
                  const squadCount = team.squad_count || 0;
                  const squadLimit = team.squad_limit || 15;

                  return (
                    <article
                      className="team-card"
                      key={team.id}
                      style={{ '--team-accent': teamAccent } as React.CSSProperties}
                    >
                      {/* Top Team Ribbon & Crest */}
                      <div className="team-card-top">
                        <div className="team-logo-wrapper">
                          {team.logo_url ? (
                            <img
                              src={getImageUrl(team.logo_url)}
                              alt={team.name}
                              className="team-logo-avatar"
                            />
                          ) : (
                            <div className="team-crest-fallback" style={{ borderColor: teamAccent, color: teamAccent }}>
                              {teamShort.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="team-top-info">
                          <span className="team-tag-badge">Franchise #{String(i + 1).padStart(2, '0')}</span>
                          <span className="team-short">{teamShort}</span>
                        </div>
                      </div>

                      {/* Team Name & Owner Header */}
                      <div className="team-card-header">
                        <h3 className="sport-heading team-card-title">{team.name}</h3>
                        <p className="team-owner-sub">
                          <span className="team-owner-label">Owner:</span> {teamOwner}
                        </p>
                      </div>

                      {/* Team Meta Grid */}
                      <div className="team-meta">
                        <div className="team-meta-cell">
                          <span>Captain</span>
                          <div>{teamCaptain}</div>
                        </div>
                        <div className="team-meta-cell">
                          <span>Home Base</span>
                          <div>{teamLocation}</div>
                        </div>
                        <div className="team-meta-cell">
                          <span>Squad Size</span>
                          <div className="team-squad-stat">
                            <span className="team-squad-active">{squadCount}</span>
                            <span className="team-squad-max">/{squadLimit} Players</span>
                          </div>
                        </div>
                        <div className="team-meta-cell">
                          <span>Status</span>
                          <div className="team-status-tag">
                            <span className="team-status-dot" />
                            <span>{team.status === 'active' ? 'Confirmed' : 'Pending'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Accent Glow Line */}
                      <div className="team-accent-line" style={{ background: teamAccent }} />
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {content.show_players === 'true' && (
        <section className="section-pad" id="players">
          <div className="page-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="section-label">The Talent</span>
                <h2 className="sport-heading">Registered Players</h2>
              </div>
              <a className="text-link" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20to%20play%20in%20KPL%20Season%203." target="_blank" rel="noopener noreferrer">Register to play <ArrowRight size={14} /></a>
            </div>
            
            <div className="players-grid">
              {players.length === 0 ? (
                <p className="lead">Players will be revealed soon...</p>
              ) : (
                players.map((player) => (
                  <div className="player-card" key={player.id}>
                    {player.photo ? (
                      <img
                        src={getImageUrl(player.photo)}
                        alt={player.player_name}
                        className="player-photo"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="player-photo" style={{ display: 'grid', placeItems: 'center', background: 'var(--bg-subtle)' }}>
                        <Users size={48} color="var(--green-mint)" />
                      </div>
                    )}
                    <div className="player-info">
                      <h3 className="sport-heading">{player.player_name}</h3>
                      <div className="player-badge-wrap">
                        <span className="player-role-badge">{player.role || 'ALL-ROUNDER'}</span>
                        {player.player_category && (
                          <span className="player-category-badge">{player.player_category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {content.show_register === 'true' && (
        <section className="section-pad cta-register-section" id="register">
          <div className="page-width">
            <div className="cta-banner-card">
              <div className="cta-grid">
                {/* Left Column: Call to Action */}
                <div className="cta-content-col">
                  <div className="cta-badge">
                    <Sparkles size={13} />
                    <span>Your moment is here</span>
                  </div>

                  <h2 className="sport-heading cta-title">
                    Season 3 is <em>calling.</em>
                  </h2>

                  <p className="lead cta-subtitle">
                    Join the biggest hard tennis ball cricket league in the region and compete for glory.
                  </p>

                  <div className="cta-perks-list">
                    <div className="cta-perk-item">
                      <CheckCircle2 size={16} className="cta-perk-icon" />
                      <span>Official Franchise Auction & Player Draft</span>
                    </div>
                    <div className="cta-perk-item">
                      <CheckCircle2 size={16} className="cta-perk-icon" />
                      <span>Custom Squad Kits & Championship Trophies</span>
                    </div>
                    <div className="cta-perk-item">
                      <CheckCircle2 size={16} className="cta-perk-icon" />
                      <span>Ball-by-Ball Live Scoring on CricHeroes</span>
                    </div>
                  </div>

                  <div className="cta-actions-row">
                    <a
                      className="button button-primary cta-btn-team"
                      href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20a%20team%20for%20KPL%20Season%203."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Register a Team</span>
                      <ArrowRight size={16} />
                    </a>
                    <button
                      type="button"
                      className="button button-outline cta-btn-player"
                      onClick={() => setModal('player')}
                    >
                      <Users size={16} />
                      <span>Register as Player</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Deadline Showcase */}
                <div className="cta-deadline-col">
                  <div className="deadline-glass-card">
                    <div className="deadline-card-top">
                      <span className="deadline-status-pill">
                        <span className="deadline-pulse-dot" />
                        <span>Registration Deadline</span>
                      </span>
                      <span className="deadline-year-badge">KPL Season 3</span>
                    </div>

                    <div className="deadline-counter-wrap">
                      {(() => {
                        const target = content.deadline_date ? new Date(content.deadline_date) : null;
                        const diff = target ? Math.max(0, target.getTime() - Date.now()) : null;
                        const days = diff !== null ? Math.floor(diff / 86400000) : (content.deadline_days ? parseInt(content.deadline_days) : null);
                        return (
                          <>
                            <div className="deadline-number">
                              {days !== null ? days : '12'}
                            </div>
                            <div className="deadline-unit">
                              <span className="deadline-unit-main">Days Left</span>
                              <span className="deadline-unit-sub">Before slots lock</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="deadline-progress-bar">
                      <div className="deadline-progress-fill" />
                    </div>

                    <div className="deadline-card-footer">
                      <div className="deadline-calendar-row">
                        <CalendarDays size={18} className="deadline-cal-icon" />
                        <p className="deadline-notice-text">
                          {content.deadline_text || 'Secure your franchise or player spot before the registration closes.'}
                        </p>
                      </div>
                      <div className="deadline-slots-tag">
                        <Shield size={13} />
                        <span>Limited Franchise & Player Slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_highlights === 'true' && gallery.length > 0 && (
        <section id="highlights" className="section-pad">
          <div className="page-width">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Highlights</span>
              <h2 className="sport-heading">Best of <em>Season 1 & 2</em></h2>
              <p className="lead" style={{ margin: '16px auto 0' }}>Unforgettable moments, winning shots, and electric crowd reactions.</p>
            </div>
            <div className="gallery-grid">
              {gallery.map((item, i) => (
                <div key={i} className={`gallery-item ${item.size || ''}`} onClick={() => setSelectedImage(item)}>
                  <img src={getImageUrl(item.image)} alt={item.title} />
                  <div className="gallery-title">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.show_management === 'true' && <ManagementSection />}
      {content.show_gallery === 'true' && <GallerySection />}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <button className="image-modal-close" onClick={() => setSelectedImage(null)}><X size={24} /></button>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <img src={getImageUrl(selectedImage.image)} alt={selectedImage.title} />
            <div className="image-modal-title">{selectedImage.title}</div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="page-width">
          <div className="footer-top" style={{ gap: '32px' }}>
            <button className="brand" onClick={scrollToTop} aria-label="KPL home">
              <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo" />
              <div className="brand-text">
                KHORAGHAT PREMIER LEAGUE
                <span>SEASON-3 • 2026</span>
              </div>
            </button>
            <div className="nav-links">
              <button onClick={(e) => scrollTo('league', e)}>League</button>
              <button onClick={(e) => scrollTo('teams', e)}>Teams</button>
              <button onClick={(e) => scrollTo('players', e)}>Players</button>
              <button onClick={(e) => scrollTo('management', e)}>Management</button>
              <button onClick={(e) => scrollTo('gallery', e)}>Gallery</button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Khoraghat Premier League. All rights reserved.</span>
            <span>Developed by <a href="https://projuktisoft.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green-mint)', textDecoration: 'none', fontWeight: 600 }}>ProjuktiSoft</a></span>
          </div>
        </div>
      </footer>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card modal-registration-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close"><X size={20} /></button>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <CheckCircle2 size={64} color="#22c55e" style={{ margin: '0 auto 24px' }} />
                <h3 className="sport-heading">Registration received!</h3>
                <p className="lead" style={{ margin: '16px auto', fontSize: '15px' }}>Your {modal === 'team' ? 'team' : 'player'} registration for KPL Season 3 has been submitted.</p>
                {modal === 'player' && registeredId && (
                  <>
                    <p style={{ marginBottom: '16px', fontSize: '15px' }}>
                      Your Registration ID is <strong style={{ color: 'var(--green-mint)' }}>{registeredId}</strong>
                    </p>
                    <div style={{
                      background: 'rgba(234, 179, 8, 0.12)',
                      border: '1px solid rgba(234, 179, 8, 0.35)',
                      borderRadius: '12px',
                      padding: '16px',
                      maxWidth: '440px',
                      margin: '0 auto 28px',
                      textAlign: 'left',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#fef08a'
                    }}>
                      <div style={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                        color: '#facc15',
                        fontSize: '14px'
                      }}>
                        <Clock size={16} /> Pending Admin Approval
                      </div>
                      Your self-registration and uploaded documents are currently pending verification by the KPL Committee. Once approved by the administrator, your profile will be officially activated in the player pool.
                    </div>
                  </>
                )}
                <button className="button button-primary" onClick={closeModal} style={{ width: '100%', maxWidth: '240px', margin: '0 auto' }}>Done</button>
              </div>
            ) : modal === 'team' ? (
              <>
                <div className="modal-header">
                  <span className="section-label">FRANCHISE REGISTRATION</span>
                  <h3 className="sport-heading">Register your team</h3>
                  <p className="lead" style={{ fontSize: '14px', marginTop: '6px' }}>Enter your franchise details to join KPL Season 3.</p>
                </div>
                {status === 'error' && <div className="status-error">{errorMsg || 'Something went wrong. Please try again.'}</div>}
                <form className="modal-form" onSubmit={submitTeamRegistration}>
                  <div className="form-row"><label>Team name *</label><input type="text" required value={teamForm.team_name} onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })} placeholder="e.g. Khoraghat Kings" /></div>
                  <div className="form-row"><label>Owner name *</label><input type="text" required value={teamForm.owner_name} onChange={(e) => setTeamForm({ ...teamForm, owner_name: e.target.value })} placeholder="Franchise owner" /></div>
                  
                  <div className="form-grid">
                    <div className="form-row"><label>Contact number *</label><input type="tel" inputMode="tel" required value={teamForm.contact_number} onChange={(e) => setTeamForm({ ...teamForm, contact_number: e.target.value })} placeholder="+91 ..." /></div>
                    <div className="form-row"><label>Home location</label><input type="text" value={teamForm.home_location} onChange={(e) => setTeamForm({ ...teamForm, home_location: e.target.value })} placeholder="City / Town" /></div>
                  </div>
                  
                  <div className="form-row"><label>Message</label><textarea rows={3} value={teamForm.message} onChange={(e) => setTeamForm({ ...teamForm, message: e.target.value })} placeholder="Anything else we should know?" /></div>
                  
                  <button className="button button-primary" type="submit" disabled={status === 'submitting'} style={{ marginTop: '16px', width: '100%' }}>
                    {status === 'submitting' ? <><Loader2 size={16} className="spin" /> Processing...</> : <>Pay ₹{fees.fee_team} & Register <ArrowRight size={16} /></>}
                  </button>
                </form>
              </>
            ) : modal === 'player' ? (
              <>
                <div className="modal-header">
                  <span className="section-label">PLAYER REGISTRATION</span>
                  <h3 className="sport-heading">Register as player</h3>
                  <p className="lead" style={{ fontSize: '14px', marginTop: '6px' }}>Enter your details to join KPL Season 3.</p>
                </div>
                {status === 'error' && <div className="status-error">{errorMsg || 'Something went wrong. Please try again.'}</div>}
                <form className="modal-form" onSubmit={submitPlayerRegistration}>
                  <div className="form-grid">
                    <div className="form-row"><label>Player Name *</label><input type="text" required value={playerForm.player_name} onChange={(e) => setPlayerForm({ ...playerForm, player_name: e.target.value })} placeholder="Full name" /></div>
                    <div className="form-row"><label>Father's Name *</label><input type="text" required value={playerForm.father_name} onChange={(e) => setPlayerForm({ ...playerForm, father_name: e.target.value })} placeholder="Father's name" /></div>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-row"><label>Age *</label><input type="number" inputMode="numeric" required value={playerForm.age_input} onChange={(e) => setPlayerForm({ ...playerForm, age_input: e.target.value })} placeholder="e.g. 22" /></div>
                    <div className="form-row"><label>Contact No. *</label><input type="tel" inputMode="tel" required value={playerForm.contact_number} onChange={(e) => setPlayerForm({ ...playerForm, contact_number: e.target.value })} placeholder="+91 ..." /></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-row">
                      <label>Player Category *</label>
                      <select required value={playerForm.player_category} onChange={(e) => setPlayerForm({ ...playerForm, player_category: e.target.value })}>
                        <option value="">Select Category...</option>
                        <option value="Local">Local</option>
                        <option value="Foreign">Foreign</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Previously Played in KPL? *</label>
                      <select required value={playerForm.previously_played ? 'yes' : 'no'} onChange={(e) => setPlayerForm({ ...playerForm, previously_played: e.target.value === 'yes' })}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row"><label>Present Address *</label><input type="text" required value={playerForm.present_address} onChange={(e) => setPlayerForm({ ...playerForm, present_address: e.target.value })} placeholder="Village / Town / District" /></div>
                  
                  <div className="form-row" style={{ marginTop: '8px' }}>
                    <label>Cricket Profile</label>
                    <div className="cricket-profile-container">
                      {/* Batsman */}
                      <div className="cricket-role-card">
                        <label className="cricket-checkbox-label">
                          <input type="checkbox" checked={playerForm.batsman} onChange={(e) => setPlayerForm({ ...playerForm, batsman: e.target.checked })} />
                          <span>Batsman</span>
                        </label>
                        {playerForm.batsman && (
                          <div className="cricket-suboptions-row">
                            <label className={`cricket-pill-option ${playerForm.batting_hand === 'Right Hand' ? 'active' : ''}`}>
                              <input type="radio" name="batting_hand" checked={playerForm.batting_hand === 'Right Hand'} onChange={() => setPlayerForm({...playerForm, batting_hand: 'Right Hand'})} />
                              <span>Right Hand</span>
                            </label>
                            <label className={`cricket-pill-option ${playerForm.batting_hand === 'Left Hand' ? 'active' : ''}`}>
                              <input type="radio" name="batting_hand" checked={playerForm.batting_hand === 'Left Hand'} onChange={() => setPlayerForm({...playerForm, batting_hand: 'Left Hand'})} />
                              <span>Left Hand</span>
                            </label>
                          </div>
                        )}
                      </div>
                      
                      {/* Bowler */}
                      <div className="cricket-role-card">
                        <label className="cricket-checkbox-label">
                          <input type="checkbox" checked={playerForm.bowler} onChange={(e) => setPlayerForm({ ...playerForm, bowler: e.target.checked })} />
                          <span>Bowler</span>
                        </label>
                        {playerForm.bowler && (
                          <div className="cricket-suboptions-row">
                            <label className={`cricket-pill-option ${playerForm.bowling_arm === 'Right Arm' ? 'active' : ''}`}>
                              <input type="radio" name="bowling_arm" checked={playerForm.bowling_arm === 'Right Arm'} onChange={() => setPlayerForm({...playerForm, bowling_arm: 'Right Arm'})} />
                              <span>Right Arm</span>
                            </label>
                            <label className={`cricket-pill-option ${playerForm.bowling_arm === 'Left Arm' ? 'active' : ''}`}>
                              <input type="radio" name="bowling_arm" checked={playerForm.bowling_arm === 'Left Arm'} onChange={() => setPlayerForm({...playerForm, bowling_arm: 'Left Arm'})} />
                              <span>Left Arm</span>
                            </label>
                            <div className="cricket-option-divider" />
                            <label className={`cricket-pill-option ${playerForm.bowling_style === 'Pacer' ? 'active' : ''}`}>
                              <input type="radio" name="bowling_style" checked={playerForm.bowling_style === 'Pacer'} onChange={() => setPlayerForm({...playerForm, bowling_style: 'Pacer'})} />
                              <span>Pacer</span>
                            </label>
                            <label className={`cricket-pill-option ${playerForm.bowling_style === 'Spinner' ? 'active' : ''}`}>
                              <input type="radio" name="bowling_style" checked={playerForm.bowling_style === 'Spinner'} onChange={() => setPlayerForm({...playerForm, bowling_style: 'Spinner'})} />
                              <span>Spinner</span>
                            </label>
                          </div>
                        )}
                      </div>
                      
                      {/* Wicket Keeper */}
                      <div className="cricket-role-card">
                        <label className="cricket-checkbox-label">
                          <input type="checkbox" checked={playerForm.wicket_keeper} onChange={(e) => setPlayerForm({ ...playerForm, wicket_keeper: e.target.checked })} />
                          <span>Wicket Keeper</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-row">
                      <label>Player Photo *</label>
                      <label className="file-upload-dropzone">
                        <input type="file" accept="image/*" required onChange={(e) => handlePlayerFileChange(e, 'photo')} />
                        {playerForm.photo ? (
                          <div className="file-upload-preview">
                            <img src={getImageUrl(playerForm.photo)} alt="Preview" />
                            <span className="file-upload-change-badge">Change Photo</span>
                          </div>
                        ) : (
                          <div className="file-upload-empty">
                            <Users size={26} className="file-upload-icon" />
                            <span className="file-upload-label">Upload Photo</span>
                            <span className="file-upload-sublabel">PNG, JPG up to 5MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="form-row">
                      <label>Address Proof *</label>
                      <label className="file-upload-dropzone">
                        <input type="file" accept="image/*" required onChange={(e) => handlePlayerFileChange(e, 'address_proof')} />
                        {playerForm.address_proof ? (
                          <div className="file-upload-preview">
                            <img src={getImageUrl(playerForm.address_proof)} alt="Preview" />
                            <span className="file-upload-change-badge">Change Proof</span>
                          </div>
                        ) : (
                          <div className="file-upload-empty">
                            <BadgeCheck size={26} className="file-upload-icon" />
                            <span className="file-upload-label">Upload Proof</span>
                            <span className="file-upload-sublabel">Aadhaar, Voter ID, etc.</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Player Declaration */}
                  <div
                    style={{
                      margin: '16px 0 6px',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${playerForm.declaration_accepted ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                      background: playerForm.declaration_accepted ? 'rgba(34, 197, 94, 0.08)' : 'rgba(4, 13, 26, 0.6)',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        required
                        checked={playerForm.declaration_accepted}
                        onChange={(e) => setPlayerForm({ ...playerForm, declaration_accepted: e.target.checked })}
                        style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: 'var(--green-mint)', flexShrink: 0, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#cbd5e1' }}>
                        <strong style={{ display: 'block', color: '#ffffff', marginBottom: '3px', fontSize: '13px' }}>
                          Player Declaration &amp; Undertaking *
                        </strong>
                        I hereby declare that all the information provided above is true and correct to the best of my knowledge. I agree to abide by the rules, code of conduct, and regulations of Khoraghat Premier League (KPL) Season 3.
                      </span>
                    </label>
                  </div>

                  <button className="button button-primary" type="submit" disabled={status === 'submitting'} style={{ marginTop: '16px', width: '100%' }}>
                    {status === 'submitting' ? <><Loader2 size={16} className="spin" /> Processing...</> : <>Pay ₹{playerForm.player_category === 'Foreign' ? fees.fee_foreign_player : fees.fee_player} & Register <ArrowRight size={16} /></>}
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* Free Direct UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={upiModalData.isOpen}
        onClose={() => {
          setUpiModalData(prev => ({ ...prev, isOpen: false }));
          setStatus('idle');
        }}
        registrationType={upiModalData.type}
        registrationId={upiModalData.regId}
        payerName={upiModalData.name}
        payerPhone={upiModalData.phone}
        amount={upiModalData.amount}
        upiId={fees.upi_id || '8638479115@ybl'}
        payeeName={fees.upi_payee_name || 'Khoraghat Premier League'}
        onSubmitPaymentProof={async (paymentPayload) => {
          if (upiModalData.type === 'team') {
            await kplApi.createTeam({
              name: teamForm.team_name,
              owner_name: teamForm.owner_name,
              owner_contact: teamForm.contact_number,
              short_code: teamForm.team_name.slice(0, 3).toUpperCase(),
              home_location: teamForm.home_location || null,
              status: 'pending_verification'
            });
          } else {
            const age = parseInt(playerForm.age_input);
            const calculatedAge = age > 1900 ? new Date().getFullYear() - age : age;
            
            let calculatedRole = '';
            if (playerForm.batsman && playerForm.bowler) {
              calculatedRole = 'All-Rounder';
            } else if (playerForm.wicket_keeper && playerForm.batsman) {
              calculatedRole = 'WK-Batsman';
            } else {
              calculatedRole = [playerForm.batsman ? 'Batsman' : '', playerForm.bowler ? 'Bowler' : '', playerForm.wicket_keeper ? 'Wicket-keeper' : ''].filter(Boolean).join(', ');
            }

            await kplApi.createPlayer({
              registration_number: upiModalData.regId,
              player_name: playerForm.player_name,
              father_name: playerForm.father_name,
              age: calculatedAge,
              contact_number: playerForm.contact_number,
              present_address: playerForm.present_address,
              address_proof: playerForm.address_proof || null,
              photo: playerForm.photo || null,
              role: calculatedRole,
              batting_hand: playerForm.batting_hand || null,
              wicket_keeper: playerForm.wicket_keeper ? 1 : 0,
              previously_played: playerForm.previously_played ? 1 : 0,
              bowler: playerForm.bowler ? 1 : 0,
              bowling_type: playerForm.bowler ? `${playerForm.bowling_arm} ${playerForm.bowling_style}`.trim() : null,
              registered_by: 'Self Registration',
              declaration_accepted: playerForm.declaration_accepted ? 1 : 0,
              status: 'pending_verification',
              approval: 'pending',
              auction_eligible: 0,
              base_price: 50
            });
          }
          await kplApi.createPayment(paymentPayload);
        }}
        onSuccess={(utr) => {
          setUpiModalData(prev => ({ ...prev, isOpen: false }));
          setRegisteredId(upiModalData.regId);
          setModal(upiModalData.type);
          setStatus('success');
          if (upiModalData.type === 'team') {
            setTeamForm({ team_name: '', owner_name: '', captain_name: '', contact_number: '', email: '', home_location: '', message: '' });
          } else {
            setPlayerForm({ player_name: '', father_name: '', age_input: '', contact_number: '', present_address: '', address_proof: '', photo: '', batsman: false, batting_hand: '', wicket_keeper: false, previously_played: false, player_category: 'local', bowler: false, bowling_arm: '', bowling_style: '', declaration_accepted: false });
          }
        }}
      />

      {/* WhatsApp Support Float */}
      <WhatsAppFloat />

    </main>
  );
}
