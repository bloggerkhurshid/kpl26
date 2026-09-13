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
import { supabase } from '@/lib/supabase';
import { load } from '@cashfreepayments/cashfree-js';
type Team = {
  id: string;
  name: string;
  owner_name: string;
  captain_name: string;
  home_location: string;
  short_code: string;
  accent_color: string;
  status: string;
};

type Player = {
  id: string;
  player_name: string;
  role: string;
  photo: string;
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
    { name: 'Saddad Hussain', number: '8638479115' },
    { name: 'Support', number: '6002506596' },
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
  const [fees, setFees] = useState({ fee_player: 500, fee_foreign_player: 1000, fee_team: 5000, active_gateway: 'razorpay' });
  const [content, setContent] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

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

    // 2. Fetch fresh data in the background
    Promise.all([
      supabase.from('teams').select('*').eq('status', 'active'),
      supabase.from('players').select('id,player_name,role,photo').eq('status', 'active').limit(8).order('created_at', { ascending: false }),
      supabase.from('players').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('highlights').select('*').order('created_at', { ascending: false }).limit(6),
      fetch('/api/settings').then(res => res.json()).catch(() => null),
      fetch('/api/content').then(res => res.json()).catch(() => null)
    ]).then(([{ data: t }, { data: p }, { count }, { data: h }, f, c]) => {
      
      const parsedGallery = h ? h.map(item => ({ title: item.title, image: item.image_url, size: item.size })) : [];
      
      if (t) setTeams(t as Team[]);
      if (p) setPlayers(p as Player[]);
      if (count !== null) setPlayerCount(count);
      if (h) setGallery(parsedGallery as GalleryItem[]);
      if (f) setFees(f);
      if (c) {
        setContent(c);
        setLoadingContent(false);
      }

      // 3. Update the cache for the next time the user visits
      localStorage.setItem('kpl_home_cache', JSON.stringify({
        t: t || [],
        p: p || [],
        count: count || 0,
        h: parsedGallery,
        f: f || { fee_player: 500, fee_foreign_player: 1000, fee_team: 5000, active_gateway: 'razorpay' },
        c: c || {}
      }));
    }).catch(console.error);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    const { data: team, error } = await supabase.from('team_registrations').insert({
      team_name: teamForm.team_name,
      owner_name: teamForm.owner_name,
      captain_name: teamForm.captain_name || null,
      contact_number: teamForm.contact_number,
      email: teamForm.email || null,
      home_location: teamForm.home_location || null,
      message: teamForm.message || null,
      status: 'pending'
    }).select().single();

    if (error || !team) {
      setStatus('error');
      setErrorMsg(error?.message || 'Failed to register team');
      return;
    }

    // Handle Payment Gateway for Team
    try {
      const newRegNum = `KPL-TEAM-${Date.now().toString().slice(-6)}`;
      if (fees.active_gateway === 'razorpay') {
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify({ amount: fees.fee_team, receipt: newRegNum, notes: { teamId: team.id } })
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
            await supabase.from('team_registrations').update({ status: 'active' }).eq('id', team.id);
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
            await supabase.from('team_registrations').update({ status: 'active' }).eq('id', team.id);
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
    
    // Generate Registration Number
    const { count, error: countError } = await supabase.from('players').select('*', { count: 'exact', head: true });
    if (countError) {
      setStatus('error');
      setErrorMsg('Failed to generate registration number.');
      return;
    }
    const currentCount = count || 0;
    const newRegNum = `KPL-PLR-${9910 + currentCount + 1}`;

    const age = parseInt(playerForm.age_input);
    const calculatedAge = age > 1900 ? new Date().getFullYear() - age : age;

    const { data: player, error } = await supabase.from('players').insert({
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
      wicket_keeper: playerForm.wicket_keeper,
      previously_played: playerForm.previously_played,
      bowler: playerForm.bowler,
      bowling_type: playerForm.bowler ? `${playerForm.bowling_arm} ${playerForm.bowling_style}`.trim() : null,
      registered_by: 'Self Registration',
      status: 'pending',
      auction_eligible: true,
      base_price: 50
    }).select().single();

    if (error || !player) {
      setStatus('error');
      setErrorMsg(error?.message || 'Failed to register player');
      return;
    }

    // Handle Payment Gateway
    try {
      const paymentAmount = playerForm.player_category === 'Foreign' ? fees.fee_foreign_player : fees.fee_player;

      if (fees.active_gateway === 'razorpay') {
        const res = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify({ amount: paymentAmount, receipt: newRegNum, notes: { playerId: player.id } })
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
            await supabase.from('players').update({ status: 'active' }).eq('id', player.id);
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
            await supabase.from('players').update({ status: 'active' }).eq('id', player.id);
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
            <button className="nav-cta" onClick={() => { setModal('player'); setMenuOpen(false); }}>Register Player <ArrowRight size={15} /></button>
          </div>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </nav>

      {content.show_hero === 'true' && (
        <section className="hero" id="top">
          <div className="hero-content page-width">
            <span className="section-label">THE BATTLE BEGINS • 2026</span>
            <h1 className="sport-heading" dangerouslySetInnerHTML={{ __html: content.hero_title || 'Where local legends become <em>champions.</em>' }} />
            <p className="lead">{content.hero_subtitle}</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => setModal('team')}>Register Franchise <ArrowRight size={18} strokeWidth={3} /></button>
              <button className="button button-outline" onClick={() => setModal('player')}>Register Player <Users size={18} /></button>
            </div>
          </div>
        </section>
      )}

      {content.show_stats === 'true' && (
      <section className="section-pad" id="prizes" style={{ background: 'linear-gradient(180deg, var(--navy-light) 0%, var(--navy) 100%)' }}>
        <div className="page-width">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="section-label" style={{ justifyContent: 'center' }}>Ultimate Glory</span>
            <h2 className="sport-heading">Prize Pool</h2>
          </div>
          <div className="format-grid">
            <div className="format-card" style={{ borderColor: 'var(--gold)', boxShadow: '0 10px 30px rgba(212,175,55,0.15)', transform: 'scale(1.05)', zIndex: 2 }}>
              <span className="format-icon" style={{ color: 'rgba(212,175,55,0.1)' }}>🏆</span>
              <h3 className="sport-heading" style={{ color: 'var(--gold)', fontSize: '28px' }}>Champions</h3>
              <p style={{ fontSize: '54px', fontWeight: '900', color: 'var(--text)', marginTop: '8px', fontFamily: '"Arial Black", Impact, sans-serif', fontStyle: 'italic', lineHeight: 1 }}>₹27,000</p>
            </div>
            <div className="format-card">
              <span className="format-icon">🥈</span>
              <h3 className="sport-heading" style={{ fontSize: '24px' }}>Runners Up</h3>
              <p style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text)', marginTop: '8px', fontFamily: '"Arial Black", Impact, sans-serif', fontStyle: 'italic', lineHeight: 1 }}>₹17,000</p>
            </div>
            <div className="format-card">
              <span className="format-icon">⭐</span>
              <h3 className="sport-heading" style={{ fontSize: '24px' }}>Player of Series</h3>
              <p style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text)', marginTop: '8px', fontFamily: '"Arial Black", Impact, sans-serif', fontStyle: 'italic', lineHeight: 1 }}>₹500</p>
            </div>
          </div>
        </div>
      </section>
      )}

      {content.show_about === 'true' && (
        <section className="section-pad" id="league">
          <div className="page-width split-layout">
            <div>
              <span className="section-label">The League</span>
              <h2 className="sport-heading">{content.about_title}</h2>
            </div>
            <div>
              <p className="lead" style={{ whiteSpace: 'pre-wrap' }}>{content.about_text}</p>
              {content.show_format === 'true' && (
                <a className="text-link" href="#format" style={{ marginTop: '24px' }}>Discover the format <ArrowRight size={16} strokeWidth={3} /></a>
              )}
            </div>
          </div>
        </section>
      )}

      {content.show_format === 'true' && (
        <section className="section-pad" id="format">
          <div className="page-width">
            <span className="section-label">Built for the bold</span>
            <h2 className="sport-heading">{content.format_title}</h2>
            <p className="lead" style={{ whiteSpace: 'pre-wrap', marginTop: '16px' }}>{content.format_subtitle}</p>
            
            <div className="format-grid">
              <div className="format-card">
                <span className="format-icon">01</span>
                <h3 className="sport-heading">Match format</h3>
                <p>15 overs of high intensity hard tennis ball cricket.</p>
              </div>
              <div className="format-card">
                <span className="format-icon">02</span>
                <h3 className="sport-heading">League structure</h3>
                <p>8 franchise teams playing round robin matches followed by a knockout stage.</p>
              </div>
              <div className="format-card">
                <span className="format-icon">03</span>
                <h3 className="sport-heading">Season duration</h3>
                <p>A multi-week tournament featuring competitive fixtures.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {content.show_teams === 'true' && (
        <section className="section-pad" id="teams">
          <div className="page-width">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <span className="section-label">Meet the contenders</span>
                <h2 className="sport-heading">Franchises</h2>
              </div>
              <button className="text-link" onClick={() => setModal('team')}>Own a franchise <ArrowRight size={14} /></button>
            </div>
            
            <div className="teams-grid">
              {teams.length === 0 ? (
                <p className="lead">Teams will be revealed soon...</p>
              ) : (
                teams.map((team, i) => (
                  <article className="team-card" key={team.id}>
                    <div className="team-card-top">
                      <span className="sport-heading" style={{ fontSize: '20px', color: 'var(--gold)' }}>0{i + 1}</span>
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
      <section className="section-pad" id="players">
        <div className="page-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <span className="section-label">The Talent</span>
              <h2 className="sport-heading">Registered Players</h2>
            </div>
            <button className="text-link" onClick={() => setModal('player')}>Register to play <ArrowRight size={14} /></button>
          </div>
          
          <div className="players-grid">
            {players.length === 0 ? (
              <p className="lead">Players will be revealed soon...</p>
            ) : (
              players.map((player) => (
                <div className="player-card" key={player.id}>
                  {player.photo ? (
                    <img src={player.photo} alt={player.player_name} className="player-photo" />
                  ) : (
                    <div className="player-photo" style={{ display: 'grid', placeItems: 'center', background: '#091325' }}>
                      <Users size={48} color="#D4AF37" />
                    </div>
                  )}
                  <div className="player-info">
                    <h3 className="sport-heading">{player.player_name}</h3>
                    <p>{player.role || 'ALL-ROUNDER'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      )}

      {content.show_register === 'true' && (
        <section className="section-pad" id="register" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, #091325, #12213F)', zIndex: -1 }}></div>
          <div className="page-width split-layout">
            <div>
              <span className="section-label">Your moment is here</span>
              <h2 className="sport-heading">Season 3 is calling.</h2>
              <p className="lead" style={{ marginTop: '16px' }}>Join the biggest hard tennis ball cricket league in the region and compete for glory.</p>
              <div className="hero-actions">
                <button className="button button-primary" onClick={() => setModal('team')}>Register a team <ArrowRight size={16} /></button>
                <button className="button button-outline" onClick={() => setModal('player')}>Register as player <Users size={16} /></button>
              </div>
            </div>
            <div className="register-deadline">
              <span className="section-label">Registration Deadline</span>
              <strong className="sport-heading" style={{ fontSize: 'clamp(64px, 10vw, 96px)', color: 'var(--gold)', letterSpacing: '-0.05em', lineHeight: 1 }}>
                {(() => {
                  const target = content.deadline_date ? new Date(content.deadline_date) : null;
                  if (!target) return '—';
                  const diff = Math.max(0, target.getTime() - Date.now());
                  const days = Math.floor(diff / 86400000);
                  return <>{days} <span style={{ fontSize: 'clamp(18px, 4vw, 24px)', color: 'var(--text)', fontStyle: 'normal', fontFamily: 'Inter', letterSpacing: 'normal', marginLeft: '8px' }}>Days left</span></>;
                })()}
              </strong>
              <p className="lead" style={{ marginTop: '16px' }}>{content.deadline_text || 'Secure your spot before the registration closes.'}</p>
            </div>
          </div>
        </section>
      )}

      {content.show_highlights === 'true' && gallery.length > 0 && (
        <section id="highlights" className="section-pad" style={{ background: 'var(--navy)' }}>
          <div className="page-width">
            <SectionLabel>Highlights</SectionLabel>
            <h2>Best of <em>Season 1 & 2</em></h2>
            <div className="gallery-grid">
              {gallery.map((item, i) => (
                <div key={i} className={`gallery-item ${item.size || ''}`} onClick={() => setSelectedImage(item)}>
                  <img src={item.image} alt={item.title} />
                  <div className="gallery-title">{item.title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <button className="image-modal-close" onClick={() => setSelectedImage(null)}><X size={24} /></button>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.image} alt={selectedImage.title} />
            <div className="image-modal-title">{selectedImage.title}</div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="page-width">
          <div className="footer-top">
            <a className="brand" href="#top">
              KHORAGHAT PREMIER LEAGUE
              <span>WHERE LEGENDS RISE</span>
            </a>
            <div className="nav-links">
              <a href="#league">League</a>
              <a href="#teams">Teams</a>
              <a href="#players">Players</a>
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
                        {playerForm.photo ? <img src={playerForm.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Users size={32} color="var(--gold)" style={{ marginBottom: '8px' }} /> <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Upload Photo</span></>}
                      </label>
                    </div>
                    <div className="form-row">
                      <label>Address Proof *</label>
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px', border: '1px dashed var(--gold)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
                        <input type="file" accept="image/*" required onChange={(e) => handlePlayerFileChange(e, 'address_proof')} style={{ opacity: 0, position: 'absolute', inset: 0, zIndex: 10 }} />
                        {playerForm.address_proof ? <img src={playerForm.address_proof} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><BadgeCheck size={32} color="var(--gold)" style={{ marginBottom: '8px' }} /> <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Upload Proof</span></>}
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
      {/* WhatsApp Support Float */}
      <WhatsAppFloat />
    </main>
  );
}
