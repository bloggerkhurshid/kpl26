'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import './auction.css';
import { getImageUrl } from '@/lib/api';
import {
  Gavel,
  Shield,
  Trophy,
  Check,
  Search,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  Award,
  Star,
  Users,
  Flame,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   SPONSOR DATA
   ────────────────────────────────────────────────────────── */
const SPONSORS = [
  { name: 'TITLE SPONSOR', colorClass: 'l1', icon: Trophy },
  { name: 'PRESENTING PARTNER', colorClass: 'l2', icon: Star },
  { name: 'ASSOCIATE SPONSOR', colorClass: 'l3', icon: Shield },
  { name: 'OFFICIAL PARTNER', colorClass: 'l4', icon: Award },
  { name: 'MEDIA SPONSOR', colorClass: 'l5', icon: Sparkles },
];

/* ──────────────────────────────────────────────────────────
   TYPES & INTERFACES
   ────────────────────────────────────────────────────────── */
interface Team {
  id: string;
  name: string;
  short_code: string;
  budget: number | string;
  spent: number | string;
  squad_limit: number | string;
  squad_count?: number;
  accent_color: string;
}

interface Player {
  id: string;
  player_name: string;
  role: string;
  age: number | null;
  base_price: number | string;
  sold_price: number | string | null;
  auction_eligible: boolean | number | string;
  status: string;
  team_id: string | null;
  player_category?: string;
  batsman?: number | boolean;
  bowler?: number | boolean;
  all_rounder?: number | boolean;
  wicket_keeper?: number | boolean;
  previously_played?: number | boolean;
  photo?: string | null;
  registration_number?: string | null;
  teams?: {
    id: string;
    name: string;
    short_code: string;
    accent_color: string;
  } | null;
}

interface AuctionConfig {
  is_active: boolean;
  current_player_id: string | null;
  notes: string;
}

interface AuctionStats {
  pool_count: number;
  sold_count: number;
  disabled_count: number;
  total_purse_spent: number;
}

interface RecentSoldPlayer {
  id: string;
  player_name: string;
  sold_price: number | string;
  base_price?: number | string;
  team_id?: string;
  team_name: string;
  team_short_code: string;
  team_accent_color: string;
}

/* ──────────────────────────────────────────────────────────
   BACKGROUND FLOATING CRICKET BALLS (Cinematic Decoration)
   ────────────────────────────────────────────────────────── */
function BackgroundCricketBalls() {
  return (
    <>
      <div className="holding-bg-grid" />
      {/* Top Left */}
      <svg className="holding-cricket-ball holding-ball-1" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" stroke="#e8192c" strokeWidth="2.5" />
        <path d="M 22 18 C 38 35, 38 65, 22 82" stroke="#e8192c" strokeWidth="2.5" strokeDasharray="4 3" />
        <path d="M 78 18 C 62 35, 62 65, 78 82" stroke="#e8192c" strokeWidth="2.5" strokeDasharray="4 3" />
        <line x1="50" y1="4" x2="50" y2="96" stroke="#e8192c" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
      {/* Bottom Right */}
      <svg className="holding-cricket-ball holding-ball-2" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" stroke="#e8192c" strokeWidth="2.5" />
        <path d="M 22 18 C 38 35, 38 65, 22 82" stroke="#e8192c" strokeWidth="2.5" strokeDasharray="4 3" />
        <path d="M 78 18 C 62 35, 62 65, 78 82" stroke="#e8192c" strokeWidth="2.5" strokeDasharray="4 3" />
      </svg>
      {/* Center Right */}
      <svg className="holding-cricket-ball holding-ball-3" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" stroke="#e8192c" strokeWidth="2" />
        <line x1="4" y1="50" x2="96" y2="50" stroke="#e8192c" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   STATE 1 — INITIAL LOAD SCREEN
   ────────────────────────────────────────────────────────── */
function InitialLoadScreen() {
  return (
    <div className="auction-holding-stage">
      <BackgroundCricketBalls />
      <div className="holding-initial-center">
        {/* Large KPL Logo badge */}
        <div className="holding-initial-logo">
          <div className="holding-initial-logo-inner">
            <span className="holding-initial-logo-text">KPL</span>
            <span className="holding-initial-logo-sub">SEASON 3</span>
          </div>
        </div>

        {/* Text */}
        <h1 className="holding-initial-title">KHORAGHAT PREMIER LEAGUE</h1>
        <div className="holding-initial-season">SEASON 3 · 2026</div>

        {/* Animated Loading Bar */}
        <div className="holding-loading-bar-wrap">
          <div className="holding-loading-bar-fill" />
        </div>

        <div className="holding-connecting-text">
          CONNECTING TO LIVE AUCTION...
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   STATE 2 — WAITING FOR NEXT PLAYER (SPLIT GRID + SIDEBAR)
   ────────────────────────────────────────────────────────── */
function WaitingScreen({
  stats,
  notes,
  recentSold,
}: {
  stats: AuctionStats;
  notes: string;
  recentSold: RecentSoldPlayer[];
}) {
  const remainingCount = Math.max(0, stats.pool_count);

  return (
    <div className="auction-holding-stage">
      <BackgroundCricketBalls />

      <div className="holding-waiting-container">
        {/* LEFT COLUMN: Main message */}
        <div className="holding-waiting-left">
          <div className="holding-progress-pill">
            <span className="holding-progress-dot" />
            <span>AUCTION IN PROGRESS</span>
          </div>

          <h2 className="holding-main-title">NEXT PLAYER</h2>
          <h2 className="holding-gradient-title">COMING SOON</h2>

          {/* Animated bouncing dots */}
          <div className="holding-dots-row">
            <span className="holding-bounce-dot holding-dot-red" />
            <span className="holding-bounce-dot holding-dot-gold" />
            <span className="holding-bounce-dot holding-dot-white" />
          </div>

          <p className="holding-sub-desc">
            The auctioneer is preparing the next player. Bidding will resume shortly.
          </p>

          {/* Auctioneer Note Callout */}
          {notes && notes.trim() !== '' && (
            <div className="holding-auctioneer-note">
              <div className="holding-note-tag">AUCTIONEER&apos;S NOTE</div>
              <div className="holding-note-text">&ldquo;{notes}&rdquo;</div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live stats cards */}
        <div className="holding-waiting-right">
          <div className="holding-stats-header">LIVE STATS</div>

          <div className="holding-stats-grid">
            {/* Card 1: Players in Pool */}
            <div className="holding-stat-card card-accent-gold">
              <div className="holding-card-top">
                <span className="holding-card-label">IN POOL</span>
                <span className="holding-card-icon">👥</span>
              </div>
              <div className="holding-card-val holding-val-gold">{stats.pool_count}</div>
            </div>

            {/* Card 2: Players Sold */}
            <div className="holding-stat-card card-accent-crimson">
              <div className="holding-card-top">
                <span className="holding-card-label">SOLD</span>
                <span className="holding-card-icon">🏆</span>
              </div>
              <div className="holding-card-val holding-val-crimson">{stats.sold_count}</div>
            </div>

            {/* Card 3: Total Purse Spent */}
            <div className="holding-stat-card card-accent-gold">
              <div className="holding-card-top">
                <span className="holding-card-label">TOTAL SPENT</span>
                <span className="holding-card-icon">💰</span>
              </div>
              <div className="holding-card-val holding-val-purse">
                ₹{Number(stats.total_purse_spent || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Card 4: Remaining Pool */}
            <div className="holding-stat-card card-accent-white">
              <div className="holding-card-top">
                <span className="holding-card-label">REMAINING</span>
                <span className="holding-card-icon">⏳</span>
              </div>
              <div className="holding-card-val holding-val-white">{remainingCount}</div>
            </div>
          </div>

          {/* Recently Sold Horizontal Scroll Row (last 5) */}
          {recentSold && recentSold.length > 0 && (
            <div className="holding-recent-strip">
              <div className="holding-recent-label">RECENTLY SOLD</div>
              <div className="holding-recent-scroll">
                {recentSold.slice(0, 5).map((p, idx) => (
                  <div key={p.id || idx} className="holding-recent-chip">
                    <span className="holding-chip-name">{p.player_name.slice(0, 14)}</span>
                    <span
                      className="holding-chip-team"
                      style={{ background: p.team_accent_color || '#e8192c' }}
                    >
                      {p.team_short_code || 'KPL'}
                    </span>
                    <span className="holding-chip-price">
                      ₹{Number(p.sold_price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECENTLY SOLD FIXED RIGHT SIDEBAR (Desktop only, last 8) */}
      {recentSold && recentSold.length > 0 && (
        <aside className="holding-sold-sidebar">
          <div className="holding-sidebar-header">
            <span className="holding-sidebar-title">SOLD ROSTER</span>
            <Trophy size={14} color="#e8192c" />
          </div>
          <div className="holding-sidebar-body">
            {recentSold.map((p, idx) => (
              <div
                key={p.id || idx}
                className="holding-sidebar-row"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <span className="holding-row-rank">#{idx + 1}</span>
                <span className="holding-row-name" title={p.player_name}>
                  {p.player_name}
                </span>
                <span
                  className="holding-row-badge"
                  style={{ background: p.team_accent_color || '#e8192c' }}
                >
                  {p.team_short_code || 'KPL'}
                </span>
                <span className="holding-row-price">
                  ₹{Number(p.sold_price || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   STATE 3 — PLAYER CHANGING TRANSITION SCREEN
   ────────────────────────────────────────────────────────── */
function ChangingScreen() {
  return (
    <div className="auction-holding-stage">
      {/* Subtle camera flash overlay */}
      <div className="holding-flash-overlay" />
      <BackgroundCricketBalls />

      <div className="holding-changing-center">
        {/* Label Pill */}
        <div className="holding-changing-pill">
          <Gavel size={13} />
          <span>NEXT UP</span>
        </div>

        {/* Animated Gavel */}
        <div className="holding-gavel-wrap">
          <svg
            className="holding-gavel-svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f5c842"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
            <path d="m16 16 6-6" />
            <path d="m8 8 6-6" />
            <path d="m9 7 8 8" />
            <path d="m21 11-8-8" />
          </svg>
        </div>

        {/* Text */}
        <h1 className="holding-changing-title-1">BRINGING PLAYER</h1>
        <h1 className="holding-changing-title-2">TO THE BLOCK</h1>

        {/* Animated Loading Ring */}
        <div className="holding-ring-spinner" />

        <div className="holding-changing-wait">Please wait...</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN AUCTION VIEWER PAGE COMPONENT
   ────────────────────────────────────────────────────────── */
export default function AuctionViewerPage() {
  const [config, setConfig] = useState<AuctionConfig>({
    is_active: true,
    current_player_id: null,
    notes: 'KPL Season 3 Live Auction',
  });
  const [stats, setStats] = useState<AuctionStats>({
    pool_count: 0,
    sold_count: 0,
    disabled_count: 0,
    total_purse_spent: 0,
  });
  const [player, setPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentSold, setRecentSold] = useState<RecentSoldPlayer[]>([]);
  const [viewState, setViewState] = useState<'loading' | 'waiting' | 'changing' | 'player'>('loading');

  const [connectionError, setConnectionError] = useState(false);
  const [zoomState, setZoomState] = useState<number>(0); // 0: cover, 1: contain, 2: scale(1.55)
  const [drawerOpen, setDrawerOpen] = useState(false);

  const prevPlayerIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const versionRef = useRef<number>(0);
  const configIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /* Lock viewport scroll */
  useEffect(() => {
    document.documentElement.classList.add('auction-body-lock');
    document.body.classList.add('auction-body-lock');
    return () => {
      document.documentElement.classList.remove('auction-body-lock');
      document.body.classList.remove('auction-body-lock');
    };
  }, []);

  /* ──────────────────────────────────────────────────────────
     LIVE STATE SYNCHRONIZATION (Ultra-Lightweight < 5ms)
     ────────────────────────────────────────────────────────── */
  const syncLiveAuction = useCallback(async () => {
    try {
      const res = await fetch(`/api/auction/live?v=${versionRef.current}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Live API offline');

      const data = await res.json();
      setConnectionError(false);

      // Nothing changed on server, 0 re-render cost
      if (data.changed === false) {
        return;
      }

      versionRef.current = data.version || versionRef.current + 1;

      // Update config
      const isLive = Boolean(data.is_active);
      const newPlayerId = data.current_player_id || null;
      setConfig({
        is_active: isLive,
        current_player_id: newPlayerId,
        notes: data.notes || '',
      });

      // Update stats
      if (data.stats) {
        setStats(data.stats);
      }

      // Update teams
      if (Array.isArray(data.teams) && data.teams.length > 0) {
        setTeams(data.teams);
      }

      // Update recently sold
      if (Array.isArray(data.recent_sold)) {
        setRecentSold(data.recent_sold);
      }

      // ────────────────────────────────────────────────────────
      // TRANSITION STATE MACHINE
      // ────────────────────────────────────────────────────────
      const isInitialFetch = !hasInitializedRef.current;
      hasInitializedRef.current = true;

      if (!newPlayerId) {
        // No player on block
        prevPlayerIdRef.current = null;
        setPlayer(null);
        setViewState('waiting');
      } else if (newPlayerId !== prevPlayerIdRef.current) {
        // Player changed!
        prevPlayerIdRef.current = newPlayerId;

        if (isInitialFetch) {
          // Direct load if first page open
          setPlayer(data.player || null);
          setViewState('player');
        } else {
          // Cinematic 350ms transition
          setViewState('changing');
          setTimeout(() => {
            setPlayer(data.player || null);
            setViewState('player');
          }, 350);
        }
      } else {
        // Same player: keep state updated (e.g. marked sold/bids)
        setPlayer(data.player || null);
        setViewState('player');
      }
    } catch (err) {
      console.warn('Live sync fallback:', err);
      setConnectionError(true);
    }
  }, []);

  // Polling setup (800ms pulse)
  useEffect(() => {
    syncLiveAuction();
    configIntervalRef.current = setInterval(syncLiveAuction, 800);

    return () => {
      if (configIntervalRef.current) clearInterval(configIntervalRef.current);
    };
  }, [syncLiveAuction]);

  /* ──────────────────────────────────────────────────────────
     PHOTO ZOOM HANDLER
     ────────────────────────────────────────────────────────── */
  const handlePhotoClick = () => {
    setZoomState((prev) => (prev + 1) % 3);
  };

  const getZoomLabel = () => {
    if (zoomState === 0) return 'Cover';
    if (zoomState === 1) return 'Fit';
    return '1.55x';
  };

  /* ──────────────────────────────────────────────────────────
     PLAYER COMPUTED STATES
     ────────────────────────────────────────────────────────── */
  const isEligible =
    player?.auction_eligible === true ||
    player?.auction_eligible === 1 ||
    player?.auction_eligible === '1';

  const isSold = Boolean(player?.team_id);
  const isUnsold = !isSold && !isEligible && player !== null;
  const isOnBlock = isEligible && !isSold && config.is_active;

  const photoUrl = player?.photo ? getImageUrl(player.photo) : '/images/kpl-logo.jpg';
  const assignedTeam = isSold
    ? player?.teams || teams.find((t) => String(t.id) === String(player?.team_id))
    : null;

  const displayRegNo = player?.registration_number
    ? player.registration_number
    : player?.id
    ? `KPL-PLAY-${player.id.replace(/[^0-9]/g, '').slice(-4).padStart(4, '0') || '0026'}`
    : 'KPL-PLAY-0000';

  return (
    <div className="auction-viewer">
      {/* ──────────────────────────────────────────────────────
          NOT ACTIVE OVERLAY (is_active = false)
          ────────────────────────────────────────────────────── */}
      {!config.is_active && (
        <div className="auction-inactive-overlay">
          <div className="auction-inactive-badge">
            <div className="auction-inactive-badge-inner">
              <span className="auction-badge-text" style={{ fontSize: 24 }}>KPL</span>
              <span className="auction-badge-sub" style={{ fontSize: 11 }}>S-3</span>
            </div>
          </div>
          <h1 className="auction-inactive-title">AUCTION NOT LIVE YET</h1>
          <p className="auction-inactive-subtitle">
            Stay tuned for KHORAGHAT PREMIER LEAGUE Season 3
          </p>
          <div className="auction-inactive-pulse-tag">
            <span className="auction-live-dot" style={{ background: '#f5c842', boxShadow: '0 0 10px #f5c842' }} />
            <span>Official Franchise Draft Starting Soon · Khoraghat Stadium</span>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          1. HEADER (PERSISTENT ACROSS ALL STATES)
          ────────────────────────────────────────────────────── */}
      <header className="auction-header">
        <div className="auction-brand">
          <div className="auction-badge-logo">
            <div className="auction-badge-inner">
              <span className="auction-badge-text">KPL</span>
              <span className="auction-badge-sub">SEASON 3</span>
            </div>
          </div>
          <div className="auction-titles">
            <div className="auction-title-main">KHORAGHAT PREMIER LEAGUE</div>
            <div className="auction-title-sub">SEASON 3 · PLAYER AUCTION</div>
          </div>
        </div>

        <div className="auction-header-right">
          {connectionError && (
            <div className="auction-reconnecting-badge">
              <Zap size={12} /> Reconnecting...
            </div>
          )}

          {config.is_active ? (
            <div className="auction-live-pill">
              <span className="auction-live-dot" />
              <span>LIVE</span>
            </div>
          ) : (
            <div className="auction-live-pill" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8' }}>
              <span className="auction-live-dot" style={{ background: '#64748b', boxShadow: 'none', animation: 'none' }} />
              <span>STANDBY</span>
            </div>
          )}

          <div className="auction-header-stats">
            <div className="auction-stat-item">
              <span>Pool:</span>
              <span className="auction-stat-num">{stats.pool_count}</span>
            </div>
            <span className="auction-stat-sep">|</span>
            <div className="auction-stat-item">
              <span>Sold:</span>
              <span className="auction-stat-num">{stats.sold_count}</span>
            </div>
            <span className="auction-stat-sep">|</span>
            <div className="auction-stat-item">
              <span>Spent:</span>
              <span className="auction-stat-num">
                ₹{Number(stats.total_purse_spent || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────
          2. CENTER STAGE (3 CONDITIONAL STATES + PLAYER CARD)
          ────────────────────────────────────────────────────── */}
      {viewState === 'loading' && <InitialLoadScreen />}

      {viewState === 'waiting' && (
        <WaitingScreen stats={stats} notes={config.notes} recentSold={recentSold} />
      )}

      {viewState === 'changing' && <ChangingScreen />}

      {viewState === 'player' && (
        <main className="auction-stage">
          {/* ── LEFT HALF — PHOTO & REGISTRATION STRIP ── */}
          <section className="photo-side">
            <div className="auction-reg-strip">
              <div className="auction-reg-number">
                <span className="auction-reg-tag">REG NO.</span>
                <span className="auction-reg-code">{displayRegNo}</span>
              </div>
              <div className={`auction-status-pill ${player?.status === 'active' ? 'active' : 'pending'}`}>
                {player?.status === 'active' ? 'ACTIVE' : 'PENDING'}
              </div>
            </div>

            <div
              className="auction-photo-container"
              onClick={handlePhotoClick}
              title="Click to toggle zoom mode"
            >
              <img
                src={photoUrl}
                alt={player?.player_name || 'KPL Player'}
                className={`auction-player-img zoom-${zoomState}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                }}
              />

              <div className="auction-photo-gradient" />
              <div className="auction-photo-scanlines" />
              <div className="auction-corner-accent auction-corner-tl" />
              <div className="auction-corner-accent auction-corner-tr" />
              <div className="auction-corner-accent auction-corner-bl" />
              <div className="auction-corner-accent auction-corner-br" />
              <div className="auction-watermark-stripe" />
              <div className="auction-zoom-hint">
                🔍 Click to zoom ({getZoomLabel()})
              </div>
            </div>
          </section>

          {/* ── RIGHT HALF — DETAILS & RESULT BOX ── */}
          <section className="details-side details-fade-enter">
            {/* NAME BAR */}
            <div className="auction-name-bar">
              <h2 className="auction-player-name">{player?.player_name}</h2>
              <div className="auction-player-role-sub">
                {player?.role || 'Player'}
                {player?.age ? ` · Age ${player.age}` : ''}
              </div>
            </div>

            {/* DETAIL BODY */}
            <div className="auction-detail-body">
              {/* SECTION 1: Personal Info */}
              <div>
                <div className="auction-section-title">Personal Info</div>
                <div className="auction-detail-grid">
                  <span className="auction-grid-label">Age</span>
                  <span className="auction-grid-val">{player?.age ? `${player.age} Years` : '—'}</span>

                  <span className="auction-grid-label">Base Price</span>
                  <span className="auction-grid-val">
                    <span className="auction-price-gold">
                      ₹{Number(player?.base_price || 500).toLocaleString('en-IN')}
                    </span>
                  </span>

                  <span className="auction-grid-label">Role</span>
                  <span className="auction-grid-val">{player?.role || 'Batsman'}</span>
                </div>
              </div>

              {/* SECTION 2: Cricket Profile */}
              <div>
                <div className="auction-section-title">Cricket Profile</div>
                <div className="auction-profile-cards">
                  <div className="auction-stat-card auction-card-red">
                    <div className="auction-card-title">Batting Role</div>
                    <div className="auction-card-val-red">{player?.role || 'Top Order'}</div>
                  </div>
                  <div className="auction-stat-card auction-card-gold">
                    <div className="auction-card-title">Category</div>
                    <div className="auction-card-val-gold">
                      {player?.player_category ? player.player_category.toUpperCase() : 'LOCAL-A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Player Profile */}
              <div>
                <div className="auction-section-title">Player Profile</div>
                <div className="auction-detail-grid">
                  <span className="auction-grid-label">Skill Tags</span>
                  <div className="auction-grid-val">
                    {player?.batsman || player?.role?.toLowerCase().includes('bats') ? (
                      <span className="auction-pill auction-pill-red">Batsman</span>
                    ) : null}
                    {player?.bowler || player?.role?.toLowerCase().includes('bowl') ? (
                      <span className="auction-pill auction-pill-gold">Bowler</span>
                    ) : null}
                    {player?.all_rounder || player?.role?.toLowerCase().includes('all') ? (
                      <span className="auction-pill auction-pill-white">All-Rounder</span>
                    ) : null}
                    {player?.wicket_keeper || player?.role?.toLowerCase().includes('keep') ? (
                      <span className="auction-pill auction-pill-blue">Wicket Keeper</span>
                    ) : null}
                    {!player?.batsman && !player?.bowler && !player?.all_rounder && !player?.wicket_keeper && (
                      <span className="auction-pill auction-pill-red">{player?.role || 'Squad Member'}</span>
                    )}
                  </div>

                  <span className="auction-grid-label">Played KPL</span>
                  <span className="auction-grid-val">
                    <Check size={14} color="#e8192c" strokeWidth={3} />
                    <span>{player?.previously_played ? 'Yes (Veteran)' : 'Yes'}</span>
                  </span>

                  <span className="auction-grid-label">Status</span>
                  <span className="auction-grid-val">
                    <span
                      className="auction-pill"
                      style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        border: '1px solid #22c55e',
                        color: '#4ade80',
                      }}
                    >
                      {player?.status?.toUpperCase() || 'ACTIVE'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* AUCTION RESULT BOX */}
            <div className="auction-result-box">
              <div className="auction-result-top">
                <span className="auction-result-label">Auction Status</span>

                {isSold ? (
                  <span className="auction-stage-pill sold">
                    <Trophy size={13} /> SOLD
                  </span>
                ) : isOnBlock ? (
                  <span className="auction-stage-pill on-block">
                    <Gavel size={13} /> ON THE BLOCK
                  </span>
                ) : isUnsold ? (
                  <span className="auction-stage-pill unsold">UNSOLD</span>
                ) : (
                  <span className="auction-stage-pill idle">IN POOL</span>
                )}
              </div>

              <div className="auction-result-vals">
                {isOnBlock && (
                  <>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Base Price</span>
                      <div className="auction-val-main auction-val-gold">
                        ₹{Number(player?.base_price || 500).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Current Hammer</span>
                      <div className="auction-val-main" style={{ color: '#ff4d5e' }}>
                        <span className="auction-live-dots">BIDDING LIVE</span>
                      </div>
                    </div>
                  </>
                )}

                {isSold && (
                  <>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Sold To</span>
                      <div className="auction-val-main">
                        <span style={{ color: assignedTeam?.accent_color || '#34d399' }}>
                          {assignedTeam?.name || 'Franchise Team'}
                        </span>
                        {assignedTeam?.short_code && (
                          <span
                            className="auction-team-badge"
                            style={{ background: assignedTeam?.accent_color || '#059669' }}
                          >
                            {assignedTeam.short_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Sold Price</span>
                      <div className="auction-val-main auction-val-gold">
                        ₹{Number(player?.sold_price || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </>
                )}

                {isUnsold && (
                  <>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Outcome</span>
                      <div className="auction-val-main" style={{ color: '#f87171' }}>—</div>
                    </div>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Final Price</span>
                      <div className="auction-val-main" style={{ color: 'var(--mute)' }}>—</div>
                    </div>
                  </>
                )}

                {!isOnBlock && !isSold && !isUnsold && (
                  <>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Base Price</span>
                      <div className="auction-val-main auction-val-gold">
                        ₹{Number(player?.base_price || 500).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="auction-val-col">
                      <span className="auction-val-sub">Block Status</span>
                      <div className="auction-val-main" style={{ color: 'var(--mute)' }}>
                        Awaiting Call
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ──────────────────────────────────────────────────────
          TEAMS BUDGET DRAWER (COLLAPSIBLE, RIGHT EDGE)
          ────────────────────────────────────────────────────── */}
      <button
        className="auction-drawer-toggle"
        onClick={() => setDrawerOpen((prev) => !prev)}
        aria-label="Toggle Franchise Teams Drawer"
        title="Toggle Team Purse Drawer"
      >
        <div className="auction-drawer-toggle-text">
          <span>TEAMS</span>
          {drawerOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </div>
      </button>

      <aside className={`auction-teams-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="auction-drawer-header">
          <div className="auction-drawer-title">Franchise Purse & Squads</div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--mute)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="auction-drawer-body">
          {teams.length === 0 ? (
            <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              No teams loaded.
            </div>
          ) : (
            teams.map((t) => {
              const budget = Number(t.budget) || 100000;
              const spent = Number(t.spent) || 0;
              const pct = Math.min(100, Math.round((spent / budget) * 100));

              return (
                <div key={t.id} className="auction-team-row">
                  <div className="auction-team-top">
                    <span
                      className="auction-team-badge"
                      style={{ background: t.accent_color || '#22c55e' }}
                    >
                      {t.short_code}
                    </span>
                    <span className="auction-team-name">{t.name}</span>
                  </div>

                  <div className="auction-budget-bar-bg">
                    <div
                      className="auction-budget-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: t.accent_color || '#22c55e',
                      }}
                    />
                  </div>

                  <div className="auction-team-meta">
                    <span>
                      ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')} ({pct}%)
                    </span>
                    <span>
                      {t.squad_count || 0} / {t.squad_limit || 18} Players
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────
          3. SPONSOR TICKER (PERSISTENT FOOTER)
          ────────────────────────────────────────────────────── */}
      <footer className="auction-footer-ticker">
        <div className="auction-ticker-track">
          {/* Group 1 */}
          <div className="auction-ticker-group">
            <span className="auction-ticker-tag">POWERED BY</span>
            {SPONSORS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={`g1-${idx}`} className={`auction-sponsor-pill ${s.colorClass}`}>
                  <Icon size={13} />
                  <span>{s.name}</span>
                </div>
              );
            })}
            <span className="auction-ticker-title">
              KHORAGHAT PREMIER LEAGUE · SEASON 3
            </span>
          </div>

          {/* Group 2 (Duplicated for seamless infinite loop) */}
          <div className="auction-ticker-group">
            <span className="auction-ticker-tag">POWERED BY</span>
            {SPONSORS.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={`g2-${idx}`} className={`auction-sponsor-pill ${s.colorClass}`}>
                  <Icon size={13} />
                  <span>{s.name}</span>
                </div>
              );
            })}
            <span className="auction-ticker-title">
              KHORAGHAT PREMIER LEAGUE · SEASON 3
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
