'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Facebook,
  Instagram,
  Loader2,
  MapPin,
  Menu,
  Play,
  Trophy,
  Twitter,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { load } from '@cashfreepayments/cashfree-js';
import { kplApi, getImageUrl } from '@/lib/api';
import { ManagementSection } from '@/components/ManagementSection';
import { GallerySection } from '@/components/GallerySection';
import { UpiPaymentModal } from '@/components/UpiPaymentModal';



type Team = {
  id: string;
  name: string;
  owner_name: string;
  captain_name: string;
  home_location: string;
  short_code: string;
  accent_color: string;
  logo_url?: string;
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

  // Cycle hero background through gallery images smoothly every 6s
  useEffect(() => {
    const imgs = gallery.filter(g => g.image);
    if (imgs.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % imgs.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const handlePlayerFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setPlayerForm(prev => ({ ...prev, [field]: event.target?.result as string }));
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

    try {
      const res = await kplApi.createTeam({
        name: teamForm.team_name,
        owner_name: teamForm.owner_name,
        owner_contact: teamForm.contact_number,
        short_code: teamForm.team_name.slice(0, 3).toUpperCase(),
        home_location: teamForm.home_location || null,
        status: 'pending'
      });

      const teamId = res.id || res.data?.id || newRegNum;

      if (fees.active_gateway === 'upi_direct' || !fees.active_gateway) {
        setUpiModalData({
          isOpen: true,
          type: 'team',
          regId: newRegNum,
          name: teamForm.owner_name,
          phone: teamForm.contact_number,
          amount: Number(fees.fee_team) || 5000,
        });
        return;
      }

      if (fees.active_gateway === 'razorpay') {
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify({ amount: fees.fee_team, receipt: newRegNum, notes: { teamId } })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'Khoraghat Premier League',
          description: 'Team Registration Fee',
          order_id: data.orderId,
          handler: async function (response: any) {
            await kplApi.updateTeam(teamId, { status: 'active' });
            setStatus('success');
            setRegisteredId(newRegNum);
            setTeamForm({ team_name: '', owner_name: '', captain_name: '', contact_number: '', email: '', home_location: '', message: '' });
          },
          prefill: {
            name: teamForm.owner_name,
            contact: teamForm.contact_number,
            email: teamForm.email || ''
          },
          theme: {
            color: '#e8ac2f'
          }
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (fees.active_gateway === 'cashfree') {
        const res = await fetch('/api/payments/cashfree/create-order', {
          method: 'POST',
          body: JSON.stringify({ 
            amount: fees.fee_team, 
            customerName: teamForm.owner_name, 
            customerPhone: teamForm.contact_number,
            customerEmail: teamForm.email || '',
            orderId: newRegNum
          })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const cashfree = await load({ mode: data.mode });
        cashfree.checkout({
          paymentSessionId: data.paymentSessionId
        }).then(async (result: any) => {
          if (result.error) {
            setStatus('error');
            setErrorMsg(result.error.message);
          }
          if (result.paymentDetails) {
            await kplApi.updateTeam(teamId, { status: 'active' });
            setStatus('success');
            setRegisteredId(newRegNum);
            setTeamForm({ team_name: '', owner_name: '', captain_name: '', contact_number: '', email: '', home_location: '', message: '' });
          }
        });
      }

    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Payment failed to initiate.');
    }
  }

  async function submitPlayerRegistration(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    
    const newRegNum = `KPL-PLR-${Date.now().toString().slice(-6)}`;
    const age = parseInt(playerForm.age_input);
    const calculatedAge = age > 1900 ? new Date().getFullYear() - age : age;

    try {
      const res = await kplApi.createPlayer({
        registration_number: newRegNum,
        player_name: playerForm.player_name,
        father_name: playerForm.father_name,
        age: calculatedAge,
        contact_number: playerForm.contact_number,
        present_address: playerForm.present_address,
        address_proof: playerForm.address_proof || null,
        photo: playerForm.photo || null,
        role: [playerForm.batsman ? 'Batsman' : '', playerForm.bowler ? 'Bowler' : '', playerForm.wicket_keeper ? 'Wicket-keeper' : ''].filter(Boolean).join(', '),
        batting_hand: playerForm.batting_hand || null,
        wicket_keeper: playerForm.wicket_keeper ? 1 : 0,
        previously_played: playerForm.previously_played ? 1 : 0,
        bowler: playerForm.bowler ? 1 : 0,
        bowling_type: playerForm.bowler ? `${playerForm.bowling_arm} ${playerForm.bowling_style}`.trim() : null,
        registered_by: 'Self Registration',
        status: 'pending',
        auction_eligible: 1,
        base_price: 50
      });

      const playerId = res.id || res.data?.id || newRegNum;

      // Handle Payment Gateway
      const paymentAmount = playerForm.player_category === 'Foreign' ? Number(fees.fee_foreign_player) : Number(fees.fee_player);

      if (fees.active_gateway === 'upi_direct' || !fees.active_gateway) {
        setUpiModalData({
          isOpen: true,
          type: 'player',
          regId: newRegNum,
          name: playerForm.player_name,
          phone: playerForm.contact_number,
          amount: paymentAmount || 500,
        });
        return;
      }

      if (fees.active_gateway === 'razorpay') {
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify({ amount: paymentAmount, receipt: newRegNum, notes: { playerId } })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'Khoraghat Premier League',
          description: 'Player Registration Fee',
          order_id: data.orderId,
          handler: async function (response: any) {
            await kplApi.updatePlayer(playerId, { status: 'active' });
            setStatus('success');
            setRegisteredId(newRegNum);
            setPlayerForm({ player_name: '', father_name: '', age_input: '', contact_number: '', present_address: '', address_proof: '', photo: '', batsman: false, batting_hand: '', wicket_keeper: false, previously_played: false, player_category: 'local', bowler: false, bowling_arm: '', bowling_style: '' });
          },
          prefill: {
            name: playerForm.player_name,
            contact: playerForm.contact_number,
          },
          theme: {
            color: '#e8ac2f'
          }
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (fees.active_gateway === 'cashfree') {
        const res = await fetch('/api/payments/cashfree/create-order', {
          method: 'POST',
          body: JSON.stringify({ 
            amount: paymentAmount, 
            customerName: playerForm.player_name, 
            customerPhone: playerForm.contact_number,
            orderId: newRegNum
          })
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        const cashfree = await load({ mode: data.mode });
        cashfree.checkout({
          paymentSessionId: data.paymentSessionId
        }).then(async (result: any) => {
          if (result.error) {
            setStatus('error');
            setErrorMsg(result.error.message);
          }
          if (result.paymentDetails) {
            await kplApi.updatePlayer(playerId, { status: 'active' });
            setStatus('success');
            setRegisteredId(newRegNum);
            setPlayerForm({ player_name: '', father_name: '', age_input: '', contact_number: '', present_address: '', address_proof: '', photo: '', batsman: false, batting_hand: '', wicket_keeper: false, previously_played: false, player_category: 'local', bowler: false, bowling_arm: '', bowling_style: '' });
          }
        });
      }

    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Payment failed to initiate.');
    }
  }

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
            <p className="kpl-loading-text">Loading the arena…</p>
          </div>
        </div>
      )}

      <nav className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="max-w-7xl mx-auto w-full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a className="brand" href="#top" aria-label="KPL home">
            <img src="/kpl-logo.jpg" alt="KPL" className="brand-logo" />
            <span className="brand-text">
              KHORAGHAT PREMIER LEAGUE
              <span>SEASON 03</span>
            </span>
          </a>
          <div className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
            <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
            {content.show_about === 'true' && <a href="#league" onClick={() => setMenuOpen(false)}>League</a>}
            {content.show_format === 'true' && <a href="#format" onClick={() => setMenuOpen(false)}>Format</a>}
            {content.show_teams === 'true' && <a href="#teams" onClick={() => setMenuOpen(false)}>Teams</a>}
            {content.show_management === 'true' && <a href="#management" onClick={() => setMenuOpen(false)}>Management</a>}
            {content.show_gallery === 'true' && <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>}
            <a className="nav-cta" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20as%20a%20player%20for%20KPL%20Season%203." target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Register Player <ArrowRight size={15} /></a>

          </div>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </nav>

      {content.show_hero === 'true' && (
        <section className="hero" id="top">
          {/* Cycling background images with smooth 60fps CSS crossfade */}
          {gallery.filter(g => g.image).map((item, idx) => {
            const activeImgs = gallery.filter(g => g.image);
            const activeIdx = heroIndex % (activeImgs.length || 1);
            return (
              <img
                key={item.image}
                src={getImageUrl(item.image)}
                alt=""
                aria-hidden="true"
                className={`hero-bg-img ${idx === activeIdx ? 'is-active' : ''}`}
              />
            );
          })}
          <div className="hero-content page-width">
            <span className="section-label">THE BATTLE BEGINS • 2026</span>
            <h1 className="sport-heading" dangerouslySetInnerHTML={{ __html: content.hero_title || 'Where local legends become <em>champions.</em>' }} />
            <p className="lead">{content.hero_subtitle}</p>
            <div className="hero-actions">
              {/* Buttons redirect to WhatsApp for now — modals kept for future use */}
              <a className="button button-primary" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20a%20franchise%20for%20KPL%20Season%203." target="_blank" rel="noopener noreferrer">Register Franchise <ArrowRight size={18} strokeWidth={3} /></a>
              <a className="button button-outline" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20as%20a%20player%20for%20KPL%20Season%203." target="_blank" rel="noopener noreferrer">Register Player <Users size={18} /></a>
            </div>
          </div>
        </section>
      )}

      {content.show_stats === 'true' && (
        <section className="section-pad" id="prizes" style={{ background: '#f8fafc' }}>
          <div className="page-width">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Ultimate Glory</span>
              <h2 className="sport-heading">Prize <em>Pool</em></h2>
              <p className="lead" style={{ margin: '16px auto 0' }}>Compete for major cash prizes and prestigious trophies in KPL Season 3.</p>
            </div>
            <div className="format-grid" style={{ alignItems: 'center' }}>
              <div className="format-card" style={{ borderColor: 'var(--gold)', boxShadow: '0 12px 30px rgba(212, 175, 55, 0.25)', background: '#ffffff' }}>
                <span className="format-icon" style={{ color: 'rgba(212,175,55,0.12)' }}>🏆</span>
                <h3 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '28px' }}>Champions</h3>
                <p style={{ fontSize: '52px', fontWeight: '900', color: '#0f172a', marginTop: '8px', fontFamily: '"Arial Black", Impact, sans-serif', fontStyle: 'italic', lineHeight: 1 }}>₹27,000</p>
              </div>
              <div className="format-card" style={{ background: '#ffffff' }}>
                <span className="format-icon">🥈</span>
                <h3 className="sport-heading" style={{ fontSize: '24px', color: '#0f172a' }}>Runners Up</h3>
                <p style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', marginTop: '8px', fontFamily: '"Arial Black", Impact, sans-serif', fontStyle: 'italic', lineHeight: 1 }}>₹17,000</p>
              </div>
              <div className="format-card" style={{ background: '#ffffff' }}>
                <span className="format-icon">⭐</span>
                <h3 className="sport-heading" style={{ fontSize: '24px', color: '#0f172a' }}>Player of Series</h3>
                <p style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', marginTop: '8px', fontFamily: '"Arial Black", Impact, sans-serif', fontStyle: 'italic', lineHeight: 1 }}>₹500</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_about === 'true' && (
        <section className="section-pad" id="league" style={{ background: '#ffffff' }}>
          <div className="page-width split-layout" style={{ alignItems: 'flex-start' }}>
            <div>
              <span className="section-label">The League</span>
              <h2 className="sport-heading">{content.about_title || 'Assam’s Premier Cricket League'}</h2>
              <p className="lead" style={{ marginTop: '20px', whiteSpace: 'pre-wrap' }}>{content.about_text}</p>
              {content.show_format === 'true' && (
                <a className="text-link" href="#format" style={{ marginTop: '28px' }}>Discover the format <ArrowRight size={16} strokeWidth={3} /></a>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="format-card" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc' }}>
                <span style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}>🏏</span>
                <h4 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '18px', marginBottom: '6px' }}>Hard Tennis</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: '#475569' }}>High-voltage hard tennis cricket with professional gear.</p>
              </div>
              <div className="format-card" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc' }}>
                <span style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}>🛡️</span>
                <h4 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '18px', marginBottom: '6px' }}>8 Franchises</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: '#475569' }}>Top team owners competing in an official auction draft.</p>
              </div>
              <div className="format-card" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc' }}>
                <span style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}>📺</span>
                <h4 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '18px', marginBottom: '6px' }}>Live Coverage</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: '#475569' }}>HD YouTube & Facebook live streaming with commentary.</p>
              </div>
              <div className="format-card" style={{ padding: '24px', borderRadius: '16px', background: '#f8fafc' }}>
                <span style={{ fontSize: '28px', marginBottom: '8px', display: 'block' }}>🏆</span>
                <h4 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '18px', marginBottom: '6px' }}>Grand Finale</h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5, color: '#475569' }}>Cash rewards, player trophies, and championship glory.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_format === 'true' && (
        <section className="section-pad" id="format" style={{ background: '#f8fafc' }}>
          <div className="page-width">
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
              <span className="section-label" style={{ justifyContent: 'center' }}>Built for the bold</span>
              <h2 className="sport-heading">{content.format_title || 'Tournament Format'}</h2>
              <p className="lead" style={{ margin: '16px auto 0', whiteSpace: 'pre-wrap' }}>{content.format_subtitle}</p>
            </div>
            
            <div className="format-grid">
              <div className="format-card">
                <span className="format-icon">01</span>
                <h3 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '22px' }}>Match format</h3>
                <p style={{ marginTop: '8px', lineHeight: 1.6 }}>15 overs of high intensity hard tennis ball cricket.</p>
              </div>
              <div className="format-card">
                <span className="format-icon">02</span>
                <h3 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '22px' }}>League structure</h3>
                <p style={{ marginTop: '8px', lineHeight: 1.6 }}>8 franchise teams playing round robin matches followed by a knockout stage.</p>
              </div>
              <div className="format-card">
                <span className="format-icon">03</span>
                <h3 className="sport-heading" style={{ color: 'var(--gold-dark)', fontSize: '22px' }}>Season duration</h3>
                <p style={{ marginTop: '8px', lineHeight: 1.6 }}>A multi-week tournament featuring competitive fixtures.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_teams === 'true' && (
        <section className="section-pad" id="teams" style={{ background: '#ffffff' }}>
          <div className="page-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="section-label">Meet the contenders</span>
                <h2 className="sport-heading">Franchises</h2>
              </div>
              <a className="text-link" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20own%20a%20franchise%20in%20KPL%20Season%203." target="_blank" rel="noopener noreferrer">Own a franchise <ArrowRight size={14} /></a>
            </div>
            
            <div className="teams-grid">
              {teams.length === 0 ? (
                <p className="lead">Teams will be revealed soon...</p>
              ) : (
                teams.map((team, i) => (
                  <article className="team-card" key={team.id}>
                    <div className="team-card-top">
                      {team.logo_url ? (
                        <img src={getImageUrl(team.logo_url)} alt={team.name} className="team-logo-avatar" />
                      ) : (
                        <span className="sport-heading" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>0{i + 1}</span>
                      )}
                      <span className="team-short">{team.short_code}</span>
                    </div>
                    <h3 className="sport-heading">{team.name}</h3>
                    <p>{team.owner_name}</p>
                    <div className="team-meta">
                      <div>
                        <span>Captain</span>
                        {team.captain_name || 'TBA'}
                      </div>
                      <div>
                        <span>Home Base</span>
                        {team.home_location || 'TBA'}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {content.show_players === 'true' && (
        <section className="section-pad" id="players" style={{ background: '#f1f5f9' }}>
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
                      <img src={getImageUrl(player.photo)} alt={player.player_name} className="player-photo" />
                    ) : (
                      <div className="player-photo" style={{ display: 'grid', placeItems: 'center', background: '#f8fafc' }}>
                        <Users size={48} color="#d4af37" />
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
        <section className="section-pad" id="register" style={{ position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
          <div className="page-width split-layout">
            <div>
              <span className="section-label">Your moment is here</span>
              <h2 className="sport-heading">Season 3 is calling.</h2>
              <p className="lead" style={{ marginTop: '16px' }}>Join the biggest hard tennis ball cricket league in the region and compete for glory.</p>
              <div className="hero-actions" style={{ marginTop: '32px' }}>
                <a className="button button-primary" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20a%20team%20for%20KPL%20Season%203." target="_blank" rel="noopener noreferrer">Register a team <ArrowRight size={16} /></a>
                <a className="button button-outline" href="https://wa.me/918638479115?text=Hi%2C%20I%20want%20to%20register%20as%20a%20player%20for%20KPL%20Season%203." target="_blank" rel="noopener noreferrer">Register as player <Users size={16} /></a>
              </div>
            </div>
            <div className="register-deadline">
              <span className="section-label">Registration Deadline</span>
              <strong className="sport-heading" style={{ fontSize: 'clamp(64px, 10vw, 96px)', color: 'var(--gold-dark)', letterSpacing: '-0.05em', lineHeight: 1 }}>
                {(() => {
                  const target = content.deadline_date ? new Date(content.deadline_date) : null;
                  if (!target) return '—';
                  const diff = Math.max(0, target.getTime() - Date.now());
                  const days = Math.floor(diff / 86400000);
                  return <>{days} <span style={{ fontSize: 'clamp(18px, 4vw, 24px)', color: '#0f172a', fontStyle: 'normal', fontFamily: 'Inter', letterSpacing: 'normal', marginLeft: '8px' }}>Days left</span></>;
                })()}
              </strong>
              <p className="lead" style={{ marginTop: '16px' }}>{content.deadline_text || 'Secure your spot before the registration closes.'}</p>
            </div>
          </div>
        </section>
      )}

      {content.show_highlights === 'true' && gallery.length > 0 && (
        <section id="highlights" className="section-pad" style={{ background: '#f8fafc' }}>
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

      <footer className="footer" style={{ background: '#040d1a', borderTop: '1px solid var(--border)' }}>
        <div className="page-width">
          <div className="footer-top" style={{ gap: '32px' }}>
            <a className="brand" href="#top">
              <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo" />
              <div className="brand-text">
                KHORAGHAT PREMIER LEAGUE
                <span>SEASON-3 • 2026</span>
              </div>
            </a>
            <div className="nav-links">
              <a href="#league">League</a>
              <a href="#teams">Teams</a>
              <a href="#players">Players</a>
              <a href="#management">Management</a>
              <a href="#gallery">Gallery</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Khoraghat Premier League. All rights reserved.</span>
            <span>Developed by <a href="https://projuktisoft.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>ProjuktiSoft</a></span>
          </div>
        </div>
      </footer>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: '80%', maxWidth: '80%' }}>
            <button className="modal-close" onClick={closeModal} aria-label="Close"><X size={20} /></button>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle2 size={64} color="#D4AF37" style={{ margin: '0 auto 24px' }} />
                <h3 className="sport-heading">Registration received!</h3>
                <p className="lead" style={{ margin: '16px auto', fontSize: '15px' }}>Your {modal === 'team' ? 'team' : 'player'} registration for KPL Season 3 has been submitted.</p>
                {modal === 'player' && registeredId && <p style={{ marginBottom: '32px' }}>Your Registration ID is <strong>{registeredId}</strong></p>}
                <button className="button button-primary" onClick={closeModal}>Done</button>
              </div>
            ) : modal === 'team' ? (
              <>
                <div className="modal-header">
                  <span className="section-label">FRANCHISE REGISTRATION</span>
                  <h3 className="sport-heading">Register your team</h3>
                  <p className="lead" style={{ fontSize: '15px' }}>Enter your franchise details to join KPL Season 3.</p>
                </div>
                {status === 'error' && <div className="status-error">{errorMsg || 'Something went wrong. Please try again.'}</div>}
                <form className="modal-form" onSubmit={submitTeamRegistration}>
                  <div className="form-row"><label>Team name *</label><input type="text" required value={teamForm.team_name} onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })} placeholder="e.g. Khoraghat Kings" /></div>
                  <div className="form-row"><label>Owner name *</label><input type="text" required value={teamForm.owner_name} onChange={(e) => setTeamForm({ ...teamForm, owner_name: e.target.value })} placeholder="Franchise owner" /></div>
                  
                  <div className="form-grid">
                    <div className="form-row"><label>Contact number *</label><input type="tel" required value={teamForm.contact_number} onChange={(e) => setTeamForm({ ...teamForm, contact_number: e.target.value })} placeholder="+91 ..." /></div>
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
                  <p className="lead" style={{ fontSize: '15px' }}>Enter your details to join KPL Season 3.</p>
                </div>
                {status === 'error' && <div className="status-error">{errorMsg || 'Something went wrong. Please try again.'}</div>}
                <form className="modal-form" onSubmit={submitPlayerRegistration}>
                  <div className="form-grid">
                    <div className="form-row"><label>Player Name *</label><input type="text" required value={playerForm.player_name} onChange={(e) => setPlayerForm({ ...playerForm, player_name: e.target.value })} /></div>
                    <div className="form-row"><label>Father's Name *</label><input type="text" required value={playerForm.father_name} onChange={(e) => setPlayerForm({ ...playerForm, father_name: e.target.value })} /></div>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-row"><label>Age *</label><input type="number" required value={playerForm.age_input} onChange={(e) => setPlayerForm({ ...playerForm, age_input: e.target.value })} /></div>
                    <div className="form-row"><label>Contact No. *</label><input type="tel" required value={playerForm.contact_number} onChange={(e) => setPlayerForm({ ...playerForm, contact_number: e.target.value })} /></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-row">
                      <label>Player Category *</label>
                      <select required value={playerForm.player_category} onChange={(e) => setPlayerForm({ ...playerForm, player_category: e.target.value })}>
                        <option value="">Select...</option>
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
                  
                  <div className="form-row"><label>Present Address *</label><input type="text" required value={playerForm.present_address} onChange={(e) => setPlayerForm({ ...playerForm, present_address: e.target.value })} /></div>
                  
                  <div className="form-row" style={{ marginTop: '16px', gap: '12px' }}>
                    <label>Cricket Profile</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      
                      {/* Batsman */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text)' }}><input type="checkbox" checked={playerForm.batsman} onChange={(e) => setPlayerForm({ ...playerForm, batsman: e.target.checked })} style={{ width: 'auto' }} /> Batsman</label>
                      {playerForm.batsman && (
                        <div style={{ marginLeft: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="batting_hand" checked={playerForm.batting_hand === 'Right Hand'} onChange={() => setPlayerForm({...playerForm, batting_hand: 'Right Hand'})} style={{ width: 'auto' }} /> Right Hand</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="batting_hand" checked={playerForm.batting_hand === 'Left Hand'} onChange={() => setPlayerForm({...playerForm, batting_hand: 'Left Hand'})} style={{ width: 'auto' }} /> Left Hand</label>
                        </div>
                      )}
                      
                      {/* Bowler */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text)', marginTop: '8px' }}><input type="checkbox" checked={playerForm.bowler} onChange={(e) => setPlayerForm({ ...playerForm, bowler: e.target.checked })} style={{ width: 'auto' }} /> Bowler</label>
                      {playerForm.bowler && (
                        <div style={{ marginLeft: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="bowling_arm" checked={playerForm.bowling_arm === 'Right Arm'} onChange={() => setPlayerForm({...playerForm, bowling_arm: 'Right Arm'})} style={{ width: 'auto' }} /> Right Arm</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="bowling_arm" checked={playerForm.bowling_arm === 'Left Arm'} onChange={() => setPlayerForm({...playerForm, bowling_arm: 'Left Arm'})} style={{ width: 'auto' }} /> Left Arm</label>
                          <span style={{ color: 'var(--muted)' }}>|</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="bowling_style" checked={playerForm.bowling_style === 'Pacer'} onChange={() => setPlayerForm({...playerForm, bowling_style: 'Pacer'})} style={{ width: 'auto' }} /> Pacer</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}><input type="radio" name="bowling_style" checked={playerForm.bowling_style === 'Spinner'} onChange={() => setPlayerForm({...playerForm, bowling_style: 'Spinner'})} style={{ width: 'auto' }} /> Spinner</label>
                        </div>
                      )}
                      
                      {/* Wicket Keeper */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--text)', marginTop: '8px' }}><input type="checkbox" checked={playerForm.wicket_keeper} onChange={(e) => setPlayerForm({ ...playerForm, wicket_keeper: e.target.checked })} style={{ width: 'auto' }} /> Wicket Keeper</label>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-row">
                      <label>Player Photo *</label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: '1px dashed var(--gold)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
                        <input type="file" accept="image/*" required onChange={(e) => handlePlayerFileChange(e, 'photo')} style={{ opacity: 0, position: 'absolute', inset: 0, zIndex: 10 }} />
                        {playerForm.photo ? <img src={getImageUrl(playerForm.photo)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Users size={32} color="var(--gold)" style={{ marginBottom: '8px' }} /> <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Upload Photo</span></>}
                      </label>
                    </div>
                    <div className="form-row">
                      <label>Address Proof *</label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: '1px dashed var(--gold)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
                        <input type="file" accept="image/*" required onChange={(e) => handlePlayerFileChange(e, 'address_proof')} style={{ opacity: 0, position: 'absolute', inset: 0, zIndex: 10 }} />
                        {playerForm.address_proof ? <img src={getImageUrl(playerForm.address_proof)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><BadgeCheck size={32} color="var(--gold)" style={{ marginBottom: '8px' }} /> <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Upload Proof</span></>}
                      </label>
                    </div>
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
        onClose={() => setUpiModalData(prev => ({ ...prev, isOpen: false }))}
        registrationType={upiModalData.type}
        registrationId={upiModalData.regId}
        payerName={upiModalData.name}
        payerPhone={upiModalData.phone}
        amount={upiModalData.amount}
        upiId={fees.upi_id || '8638479115@ybl'}
        payeeName={fees.upi_payee_name || 'Khoraghat Premier League'}
        onSuccess={(utr) => {
          setUpiModalData(prev => ({ ...prev, isOpen: false }));
          setRegisteredId(upiModalData.regId);
          setStatus('success');
          if (upiModalData.type === 'team') {
            setTeamForm({ team_name: '', owner_name: '', captain_name: '', contact_number: '', email: '', home_location: '', message: '' });
          } else {
            setPlayerForm({ player_name: '', father_name: '', age_input: '', contact_number: '', present_address: '', address_proof: '', photo: '', batsman: false, batting_hand: '', wicket_keeper: false, previously_played: false, player_category: 'local', bowler: false, bowling_arm: '', bowling_style: '' });
          }
        }}
      />

      {/* WhatsApp Support Float */}
      <WhatsAppFloat />

    </main>
  );
}
