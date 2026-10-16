'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './auction.css';
import { getImageUrl, getPlayerAuctionPart } from '@/lib/api';
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
  Clock,
  UserX,
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
  remaining_budget?: number;
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
  is_ended?: boolean;
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
  photo?: string | null;
  role?: string;
  player_category?: string;
  registration_number?: string | null;
  sold_price: number | string;
  base_price?: number | string;
  team_id?: string;
  team_name: string;
  team_short_code: string;
  team_accent_color: string;
  sold_at?: number | string | null;
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
   STATE 0 — AUCTION IS NOT LIVE SCREEN (STANDBY / OFFLINE)
   ────────────────────────────────────────────────────────── */
function NotLiveScreen({
  stats,
  notes,
}: {
  stats: AuctionStats;
  notes: string;
}) {
  return (
    <div className="auction-holding-stage">
      <BackgroundCricketBalls />
      <div className="holding-notlive-center">
        <div className="holding-notlive-pill">
          <span className="holding-notlive-dot" />
          <span>AUCTION STANDBY · NOT LIVE</span>
        </div>

        {/* Brand Spinning Ring */}
        <div className="holding-initial-logo" style={{ width: 92, height: 92, margin: '0 auto 16px' }}>
          <div className="holding-initial-logo-inner">
            <span className="holding-initial-logo-text" style={{ fontSize: 28 }}>KPL</span>
            <span className="holding-initial-logo-sub" style={{ fontSize: 9 }}>SEASON 3</span>
          </div>
        </div>

        <h1 className="holding-notlive-title-main">AUCTION IS NOT LIVE</h1>
        <p className="holding-notlive-desc">
          The live bidding broadcast is currently offline or paused by the auctioneer.
          Please standby — this screen will automatically go live as soon as the auction starts.
        </p>

        {notes && notes.trim() !== '' && notes !== 'KPL Season 3 Live Auction' && (
          <div className="holding-auctioneer-note" style={{ margin: '0 auto 16px' }}>
            <div className="holding-note-tag">AUCTIONEER&apos;S NOTE</div>
            <div className="holding-note-text">&ldquo;{notes}&rdquo;</div>
          </div>
        )}

        {/* Live Stats Summary Row */}
        <div className="holding-notlive-stats-row">
          <div className="holding-notlive-stat">
            <span className="holding-notlive-stat-label">FRANCHISES</span>
            <span className="holding-notlive-stat-val">6 TEAMS</span>
          </div>
          <div className="holding-notlive-stat-sep" />
          <div className="holding-notlive-stat">
            <span className="holding-notlive-stat-label">PLAYERS IN POOL</span>
            <span className="holding-notlive-stat-val gold">{stats.pool_count}</span>
          </div>
          <div className="holding-notlive-stat-sep" />
          <div className="holding-notlive-stat">
            <span className="holding-notlive-stat-label">PLAYERS SOLD</span>
            <span className="holding-notlive-stat-val crimson">{stats.sold_count}</span>
          </div>
          <div className="holding-notlive-stat-sep" />
          <div className="holding-notlive-stat">
            <span className="holding-notlive-stat-label">TOTAL SPENT</span>
            <span className="holding-notlive-stat-val purse">₹{Number(stats.total_purse_spent || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="holding-notlive-radar">
          <span className="holding-radar-ring" />
          <span className="holding-radar-text">STANDBY · WAITING FOR AUCTIONEER SIGNAL...</span>
        </div>
      </div>
    </div>
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
   STATE 4 — SOLD CELEBRATION SCREEN (UP TO 1 MINUTE AUTO DISPLAY)
   ────────────────────────────────────────────────────────── */
function SoldCelebrationScreen({
  player,
  team,
  soldPrice,
  secondsRemaining,
}: {
  player: Player | null;
  team: Team | { id: string; name: string; short_code: string; accent_color: string } | null | undefined;
  soldPrice: number;
  secondsRemaining: number;
}) {
  if (!player) return null;

  const teamColor = team?.accent_color || '#10b981';
  const teamName = team?.name || 'Franchise Team';
  const photoUrl = player.photo ? getImageUrl(player.photo) : '/images/kpl-logo.jpg';
  const displayRegNo = player.registration_number
    ? player.registration_number
    : player?.id
    ? `KPL-PLY-${player.id.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0') || '200'}`
    : 'KPL-PLY-200';
  const partMeta = getPlayerAuctionPart(player.player_category);

  return (
    <div className="auction-sold-celebration-screen">
      <div
        className="sold-celebration-bg-glow"
        style={{
          background: `radial-gradient(circle, ${teamColor} 0%, rgba(16, 185, 129, 0.25) 40%, transparent 70%)`,
        }}
      />

      <div className="sold-celebration-content">
        {/* Grand SOLD Header Stamp */}
        <div className="sold-stamp-banner">
          <Trophy size={36} color="#022c22" strokeWidth={2.5} />
          <span>SOLD!</span>
        </div>

        {/* Centerpiece Showcase Card */}
        <div className="sold-showcase-card">
          {/* Left: Player Avatar & Meta */}
          <div className="sold-player-left">
            <div className="sold-player-avatar-frame" style={{ borderColor: teamColor }}>
              <img
                src={photoUrl}
                alt={player.player_name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                }}
              />
            </div>
            <div className="sold-player-details">
              <div className="sold-player-name">{player.player_name}</div>
              <div className="sold-player-meta">
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{player.role || 'Player'}</span>
                <span>·</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: partMeta.color,
                    fontWeight: 700,
                  }}
                >
                  {partMeta.icon} {partMeta.label}
                </span>
                <span>·</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: '#38bdf8',
                    fontWeight: 800,
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  #{displayRegNo}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Team & Price */}
          <div className="sold-buyer-right">
            <div className="sold-buyer-team-box">
              <span className="sold-buyer-tag">Acquired By</span>
              <div className="sold-buyer-name" style={{ color: teamColor }}>
                {teamName}
              </div>
              {(team as any)?.remaining_budget !== undefined && (
                <div style={{ fontSize: 12, color: '#f5c842', fontWeight: 800, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🪙 Team Purse Remaining:</span>
                  <span>₹{Number((team as any).remaining_budget).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="sold-price-box" style={{ borderColor: teamColor }}>
              <span className="sold-price-label">Final Hammer Price</span>
              <div className="sold-price-val">
                ₹{soldPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Timer or Sold Confirmation Bar */}
        <div className="sold-timer-strip">
          {secondsRemaining > 0 ? (
            <>
              <div className="sold-timer-badge">
                <Sparkles size={16} color="#f5c842" />
                <span>Next Player In</span>
                <span className="sold-timer-seconds">{secondsRemaining}s</span>
              </div>
              <div className="sold-timer-bar-track">
                <div
                  className="sold-timer-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, (secondsRemaining / 10) * 100))}%`,
                    background: `linear-gradient(90deg, #10b981 0%, ${teamColor} 100%)`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="sold-timer-badge" style={{ borderColor: 'rgba(245, 200, 66, 0.4)', padding: '6px 18px' }}>
              <Sparkles size={16} color="#f5c842" />
              <span style={{ color: '#f5c842', fontWeight: 800 }}>HAMMER DOWN · OFFICIALLY SOLD</span>
              <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>· Awaiting next player call from auctioneer</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   STATE 5 — UNSOLD ANIMATED SCREEN (UP TO 30s CELEBRATION / BANNER)
   ────────────────────────────────────────────────────────── */
function UnsoldCelebrationScreen({
  player,
  secondsRemaining,
}: {
  player: Player | null;
  secondsRemaining: number;
}) {
  if (!player) return null;

  const photoUrl = player.photo ? getImageUrl(player.photo) : '/images/kpl-logo.jpg';
  const displayRegNo = player.registration_number
    ? player.registration_number
    : player?.id
    ? `KPL-PLY-${player.id.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0') || '200'}`
    : 'KPL-PLY-200';
  const partMeta = getPlayerAuctionPart(player.player_category);

  return (
    <div className="auction-unsold-celebration-screen">
      <div className="unsold-celebration-bg-glow" />

      <div className="unsold-celebration-content">
        {/* Grand UNSOLD Header Stamp */}
        <div className="unsold-stamp-banner">
          <X size={34} color="#ffffff" strokeWidth={3} />
          <span>UNSOLD</span>
        </div>

        {/* Centerpiece Showcase Card */}
        <div className="unsold-showcase-card">
          {/* Left: Player Avatar & Meta */}
          <div className="unsold-player-left">
            <div className="unsold-player-avatar-frame">
              <img
                src={photoUrl}
                alt={player.player_name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                }}
              />
            </div>
            <div className="unsold-player-details">
              <div className="unsold-player-name">{player.player_name}</div>
              <div className="unsold-player-meta">
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{player.role || 'Player'}</span>
                <span>·</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: partMeta.color,
                    fontWeight: 700,
                  }}
                >
                  {partMeta.icon} {partMeta.label}
                </span>
                <span>·</span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    color: '#38bdf8',
                    fontWeight: 800,
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  #{displayRegNo}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Status Box & Base Price */}
          <div className="unsold-status-right">
            <div className="unsold-status-box">
              <span className="unsold-status-tag">AUCTION OUTCOME</span>
              <div className="unsold-status-main">
                PASSED / NO BIDS
              </div>
              <span style={{ fontSize: 12, color: '#fca5a5', marginTop: 4, fontWeight: 600 }}>
                Moved to Unsold Pool for subsequent rounds
              </span>
            </div>

            <div className="unsold-base-price-line">
              <span>Base Price:</span>
              <span className="unsold-base-price-val">
                ₹{Number(player.base_price || 500).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown Timer or Status Strip */}
        <div className="unsold-timer-strip">
          {secondsRemaining > 0 ? (
            <>
              <div className="unsold-timer-badge">
                <Clock size={16} color="#f87171" />
                <span>Next Player In</span>
                <span className="unsold-timer-seconds">{secondsRemaining}s</span>
              </div>
              <div className="unsold-timer-bar-track">
                <div
                  className="unsold-timer-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, (secondsRemaining / 10) * 100))}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="unsold-timer-badge" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', padding: '6px 18px' }}>
              <Clock size={16} color="#f87171" />
              <span style={{ color: '#f87171', fontWeight: 800 }}>HAMMER DOWN · OFFICIALLY UNSOLD</span>
              <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>· Awaiting next player call from auctioneer</span>
            </div>
          )}
        </div>
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
    is_ended: false,
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
  const [celebrationPlayer, setCelebrationPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentSold, setRecentSold] = useState<RecentSoldPlayer[]>([]);
  const [viewState, setViewState] = useState<'loading' | 'not_live' | 'waiting' | 'changing' | 'player' | 'celebration_sold' | 'celebration_unsold'>('loading');
  const [soldSecondsLeft, setSoldSecondsLeft] = useState<number>(0);
  const [unsoldSecondsLeft, setUnsoldSecondsLeft] = useState<number>(0);

  const [connectionError, setConnectionError] = useState(false);
  const [zoomState, setZoomState] = useState<number>(0); // 0: cover, 1: contain, 2: scale(1.55)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'sold' | 'teams'>('sold');
  const [soldSearch, setSoldSearch] = useState<string>('');
  const [selectedTeamForModal, setSelectedTeamForModal] = useState<Team | null>(null);
  const [justSoldAlert, setJustSoldAlert] = useState<RecentSoldPlayer | null>(null);
  const [recentBuyerTeamId, setRecentBuyerTeamId] = useState<string | null>(null);

  const router = useRouter();
  const prevPlayerIdRef = useRef<string | null>(null);
  const prevWasActive = useRef<boolean | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const versionRef = useRef<number>(0);
  const configIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoldIdRef = useRef<string | null>(null);
  const soldTimestampRef = useRef<number | null>(null);
  const unsoldTimestampRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Lock viewport scroll */
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.add('auction-body-lock');
    document.body.classList.add('auction-body-lock');
    return () => {
      document.documentElement.classList.remove('auction-body-lock');
      document.body.classList.remove('auction-body-lock');
    };
  }, [mounted]);

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

      // Update config (session is live if is_active is true or player on block or active session running)
      const isEnded = Boolean(data.is_ended);
      const isLive = !isEnded && (
        Boolean(data.is_active) ||
        Boolean(data.current_player_id) ||
        (data.is_active !== false && prevWasActive.current !== false)
      );
      const newPlayerId = data.current_player_id || null;

      // Redirect viewer to results page only when auction is officially ended AND not live
      if (isEnded && !isLive) {
        router.push('/auction/ended');
        return;
      }

      prevWasActive.current = isLive;

      setConfig({
        is_active: isLive,
        is_ended: isEnded,
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

      // Live Sold Event detection for instant broadcast celebration alert
      if (data.last_sold_event) {
        const evt = data.last_sold_event;
        const key = `${evt.id}_${evt.sold_at || evt.sold_price}`;
        if (lastSoldIdRef.current !== key) {
          lastSoldIdRef.current = key;
          if (hasInitializedRef.current) {
            setJustSoldAlert(evt);
            setRecentBuyerTeamId(String(evt.team_id));
            setTimeout(() => setJustSoldAlert(null), 8000);
            setTimeout(() => setRecentBuyerTeamId(null), 14000);
          }
        }
      }

      // Update sold countdown timestamp if active (10s)
      if (data.sold_timestamp) {
        soldTimestampRef.current = Number(data.sold_timestamp);
        const elapsed = Math.floor((Date.now() - soldTimestampRef.current) / 1000);
        setSoldSecondsLeft(Math.max(0, 10 - elapsed));
      } else {
        soldTimestampRef.current = null;
        setSoldSecondsLeft(0);
      }

      // Update unsold countdown timestamp if active (10s)
      if (data.unsold_timestamp) {
        unsoldTimestampRef.current = Number(data.unsold_timestamp);
        const elapsed = Math.floor((Date.now() - unsoldTimestampRef.current) / 1000);
        setUnsoldSecondsLeft(Math.max(0, 10 - elapsed));
      } else {
        unsoldTimestampRef.current = null;
        setUnsoldSecondsLeft(0);
      }

      // ────────────────────────────────────────────────────────
      // DETERMINISTIC STATE MACHINE
      // ────────────────────────────────────────────────────────
      if (data.celebration_player) {
        setCelebrationPlayer(data.celebration_player);
      }

      const isInitialFetch = !hasInitializedRef.current;
      hasInitializedRef.current = true;

      const isSoldCelebrationActive = data.status === 'CELEBRATION_SOLD' && Boolean(data.sold_timestamp) && (
        Math.floor((Date.now() - Number(data.sold_timestamp)) / 1000) < 10
      );

      const isUnsoldCelebrationActive = data.status === 'CELEBRATION_UNSOLD' && Boolean(data.unsold_timestamp) && (
        Math.floor((Date.now() - Number(data.unsold_timestamp)) / 1000) < 10
      );

      if (!isLive) {
        // Auction is not live / stopped -> SHOW NOT LIVE SCREEN
        prevPlayerIdRef.current = null;
        setPlayer(null);
        setViewState('not_live');
      } else if (newPlayerId && (data.player || (player && String(player.id) === String(newPlayerId)))) {
        // Active player on block for BIDDING (Takes priority as soon as called!)
        const activeP = (data.player || player) as Player;
        if (newPlayerId !== prevPlayerIdRef.current) {
          prevPlayerIdRef.current = newPlayerId;
          if (isInitialFetch) {
            setPlayer(activeP);
            setViewState('player');
          } else {
            setViewState('changing');
            setTimeout(() => {
              setPlayer(activeP);
              setViewState('player');
            }, 350);
          }
        } else {
          setPlayer(activeP);
          setViewState('player');
        }
      } else if (isSoldCelebrationActive) {
        // Active 60s broadcast celebration for sold player (when block is cleared)
        prevPlayerIdRef.current = null;
        setPlayer(null);
        setViewState('celebration_sold');
      } else if (isUnsoldCelebrationActive) {
        // Active 30s broadcast celebration for unsold player (when block is cleared)
        prevPlayerIdRef.current = null;
        setPlayer(null);
        setViewState('celebration_unsold');
      } else {
        // IDLE: No active player, no celebration -> CLEAN WAITING SCREEN
        prevPlayerIdRef.current = null;
        setPlayer(null);
        setViewState('waiting');
      }
    } catch (err) {
      console.warn('Live sync fallback:', err);
      setConnectionError(true);
    }
  }, [router]);

  // Polling setup (800ms pulse)
  useEffect(() => {
    syncLiveAuction();
    configIntervalRef.current = setInterval(syncLiveAuction, 800);

    return () => {
      if (configIntervalRef.current) clearInterval(configIntervalRef.current);
    };
  }, [syncLiveAuction]);

  // Clean 1-second countdown ticker for sold & unsold celebrations
  useEffect(() => {
    const t = setInterval(() => {
      // Sold celebration countdown (10s)
      if (soldTimestampRef.current) {
        const elapsed = Math.floor((Date.now() - soldTimestampRef.current) / 1000);
        const remaining = Math.max(0, 10 - elapsed);
        setSoldSecondsLeft(remaining);
        if (remaining <= 0) {
          soldTimestampRef.current = null;
          syncLiveAuction();
        }
      } else {
        setSoldSecondsLeft(0);
      }

      // Unsold celebration countdown (10s)
      if (unsoldTimestampRef.current) {
        const elapsed = Math.floor((Date.now() - unsoldTimestampRef.current) / 1000);
        const remaining = Math.max(0, 10 - elapsed);
        setUnsoldSecondsLeft(remaining);
        if (remaining <= 0) {
          unsoldTimestampRef.current = null;
          syncLiveAuction();
        }
      } else {
        setUnsoldSecondsLeft(0);
      }
    }, 1000);
    return () => clearInterval(t);
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
    ? teams.find((t) => String(t.id) === String(player?.team_id)) || player?.teams
    : null;

  const displayRegNo = player?.registration_number
    ? player.registration_number
    : player?.id
    ? `KPL-PLY-${player.id.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0') || '200'}`
    : 'KPL-PLY-200';

  if (!mounted) {
    return <InitialLoadScreen />;
  }

  return (
    <div className="auction-viewer">
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
            <div
              className="auction-live-pill"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.45)',
                color: '#fca5a5',
                background: 'rgba(239, 68, 68, 0.12)',
              }}
            >
              <span
                className="auction-live-dot"
                style={{ background: '#ef4444', boxShadow: 'none', animation: 'none' }}
              />
              <span>NOT LIVE</span>
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

          {/* Quick Header Toggle Buttons */}
          <button
            className="auction-header-btn"
            onClick={() => { setDrawerTab('sold'); setDrawerOpen(true); }}
            title="View Live Sold Players Roster"
          >
            <Trophy size={13} color="#f5c842" />
            <span>SOLD ({recentSold.length})</span>
          </button>

          <button
            className="auction-header-btn"
            onClick={() => { setDrawerTab('teams'); setDrawerOpen(true); }}
            title="View Franchise Purse & Coins"
          >
            <span>🪙</span>
            <span>COINS</span>
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────
          1B. LIVE FRANCHISE COINS STRIP (ALL 6 TEAMS LIVE)
          ────────────────────────────────────────────────────── */}
      {teams.length > 0 && (
        <section className="auction-coins-strip" aria-label="Franchise Live Coins and Purse">
          {teams.map((t) => {
            const budget = Number(t.budget) || 100000;
            const spent = Number(t.spent) || 0;
            const remaining = t.remaining_budget !== undefined ? Number(t.remaining_budget) : Math.max(0, budget - spent);
            const pct = Math.min(100, Math.round((spent / budget) * 100));
            const isRecentBuyer = String(t.id) === String(recentBuyerTeamId);

            return (
              <div
                key={t.id}
                className={`coin-team-card ${isRecentBuyer ? 'is-buyer' : ''}`}
                style={{ borderLeft: `3.5px solid ${t.accent_color || '#e8192c'}` }}
                onClick={() => setSelectedTeamForModal(t)}
                title={`Click to inspect ${t.name}'s squad and coins`}
              >
                <div className="coin-team-top">
                  <span className="coin-team-badge" style={{ background: t.accent_color || '#e8192c' }}>
                    {t.short_code}
                  </span>
                  <span className="coin-team-name">{t.name}</span>
                  {isRecentBuyer && <span className="coin-buyer-pill">🔥 BUYER</span>}
                </div>

                <div className="coin-balance-row">
                  <div className="coin-balance-val">
                    <span className="coin-balance-icon">🪙</span>
                    <span>₹{remaining.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="coin-balance-label">PURSE REM</span>
                </div>

                <div className="coin-progress-track">
                  <div
                    className="coin-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: t.accent_color || '#e8192c',
                    }}
                  />
                </div>

                <div className="coin-meta-row">
                  <span>₹{spent.toLocaleString('en-IN')} spent ({pct}%)</span>
                  <span>👥 {t.squad_count || 0}/{t.squad_limit || 18}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ──────────────────────────────────────────────────────
          1C. LIVE SOLD DEALS TICKER (STREAM OF SOLD PLAYERS)
          ────────────────────────────────────────────────────── */}
      <section className="auction-live-deals-ticker" aria-label="Live Sold Deals Ticker">
        <div className="deals-ticker-tag">
          <span className="deals-live-beacon" />
          <span>LIVE DEALS</span>
        </div>
        <div className="deals-ticker-viewport">
          <div className="deals-ticker-track">
            {recentSold.length === 0 ? (
              <>
                <div className="deals-ticker-chip">
                  <span>⚡ KPL SEASON 3 LIVE AUCTION · 6 FRANCHISES READY · AWAITING FIRST HAMMER DOWN</span>
                </div>
                <div className="deals-ticker-chip">
                  <span>🏏 KHORAGHAT PREMIER LEAGUE · OFFICIAL LIVE BROADCAST</span>
                </div>
                <div className="deals-ticker-chip">
                  <span>⚡ KPL SEASON 3 LIVE AUCTION · 6 FRANCHISES READY · AWAITING FIRST HAMMER DOWN</span>
                </div>
                <div className="deals-ticker-chip">
                  <span>🏏 KHORAGHAT PREMIER LEAGUE · OFFICIAL LIVE BROADCAST</span>
                </div>
              </>
            ) : (
              (() => {
                let displaySold = [...recentSold];
                while (displaySold.length > 0 && displaySold.length < 8) {
                  displaySold = [...displaySold, ...recentSold];
                }
                return (
                  <>
                    {displaySold.map((p, idx) => (
                      <div key={`deal-1-${p.id || idx}-${idx}`} className="deals-ticker-chip">
                        <span className="deals-chip-name">{p.player_name}</span>
                        <span className="deals-chip-team" style={{ background: p.team_accent_color || '#e8192c' }}>
                          {p.team_short_code || 'KPL'}
                        </span>
                        <span className="deals-chip-price">🪙 ₹{Number(p.sold_price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {/* Loop duplicate for infinite smooth marquee */}
                    {displaySold.map((p, idx) => (
                      <div key={`deal-2-${p.id || idx}-${idx}`} className="deals-ticker-chip">
                        <span className="deals-chip-name">{p.player_name}</span>
                        <span className="deals-chip-team" style={{ background: p.team_accent_color || '#e8192c' }}>
                          {p.team_short_code || 'KPL'}
                        </span>
                        <span className="deals-chip-price">🪙 ₹{Number(p.sold_price || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </>
                );
              })()
            )}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          1D. LIVE JUST SOLD BROADCAST ALERT TOAST
          ────────────────────────────────────────────────────── */}
      {justSoldAlert && (
        <aside className="auction-just-sold-toast" role="alert">
          <div className="toast-gavel-icon">
            <Gavel size={20} />
          </div>
          <div className="toast-content">
            <div className="toast-header-row">
              <span className="toast-badge-sold">JUST SOLD!</span>
              <span className="toast-player-title">{justSoldAlert.player_name}</span>
            </div>
            <div className="toast-details-row">
              <span>Acquired by</span>
              <span style={{ color: justSoldAlert.team_accent_color || '#34d399', fontWeight: 800 }}>
                {justSoldAlert.team_name}
              </span>
              <span>for</span>
              <span className="toast-price-gold">
                🪙 ₹{Number(justSoldAlert.sold_price || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setJustSoldAlert(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </aside>
      )}

      {/* ──────────────────────────────────────────────────────
          2. CENTER STAGE (5 CONDITIONAL STATES + PLAYER CARD)
          ────────────────────────────────────────────────────── */}
      {viewState === 'loading' && <InitialLoadScreen />}

      {viewState === 'not_live' && (
        <NotLiveScreen stats={stats} notes={config.notes} />
      )}

      {viewState === 'waiting' && (
        <WaitingScreen stats={stats} notes={config.notes} recentSold={recentSold} />
      )}

      {viewState === 'changing' && <ChangingScreen />}

      {viewState === 'celebration_sold' && (
        <SoldCelebrationScreen
          player={celebrationPlayer || player}
          team={assignedTeam || (celebrationPlayer?.team_id ? teams.find(t => String(t.id) === String(celebrationPlayer.team_id)) : null)}
          soldPrice={Number(celebrationPlayer?.sold_price || player?.sold_price || 0)}
          secondsRemaining={soldSecondsLeft}
        />
      )}

      {viewState === 'celebration_unsold' && (
        <UnsoldCelebrationScreen
          player={celebrationPlayer || player}
          secondsRemaining={unsoldSecondsLeft}
        />
      )}

      {viewState === 'player' && player && (
        <main className="auction-stage">
          {/* ── LEFT HALF — PHOTO & REGISTRATION STRIP ── */}
          <section className="photo-side">
            <div className="auction-reg-strip">
              <div className="auction-reg-number">
                <span className="auction-reg-tag">REG NO.</span>
                <span className="auction-reg-code">{displayRegNo}</span>
              </div>
              {(() => {
                const partMeta = getPlayerAuctionPart(player?.player_category);
                return (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: partMeta.badgeBg,
                      border: `1.5px solid ${partMeta.badgeBorder}`,
                      color: partMeta.color,
                      fontSize: 12.5,
                      fontWeight: 900,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      boxShadow: `0 0 14px ${partMeta.badgeBg}`,
                    }}
                  >
                    <span>{partMeta.icon}</span> {partMeta.badgeLabel}
                  </div>
                );
              })()}
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

              {isUnsold && (
                <div className="auction-photo-unsold-stamp">
                  <div className="unsold-stamp-inner">
                    <span>UNSOLD</span>
                  </div>
                  <div className="unsold-stamp-caption">NO BIDS RECEIVED</div>
                </div>
              )}

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
                  <div
                    className="auction-stat-card auction-card-gold"
                    style={{
                      border: `1.5px solid ${getPlayerAuctionPart(player?.player_category).badgeBorder}`,
                      background: 'rgba(0,0,0,0.4)',
                    }}
                  >
                    <div className="auction-card-title">Auction Stage</div>
                    <div
                      style={{
                        color: getPlayerAuctionPart(player?.player_category).color,
                        fontSize: 16,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                      }}
                    >
                      <span>{getPlayerAuctionPart(player?.player_category).icon}</span>
                      <span>{getPlayerAuctionPart(player?.player_category).badgeLabel.toUpperCase()}</span>
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

                    {/* Live Franchise Purse Capacity for this Player */}
                    {teams.length > 0 && (
                      <div style={{ gridColumn: '1 / -1', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 700, letterSpacing: '0.8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span>🪙 LIVE FRANCHISE COINS (BIDDING):</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {teams.map(t => {
                            const budget = Number(t.budget) || 100000;
                            const spent = Number(t.spent) || 0;
                            const rem = t.remaining_budget !== undefined ? Number(t.remaining_budget) : Math.max(0, budget - spent);
                            const canBid = rem >= Number(player?.base_price || 500);
                            return (
                              <div
                                key={t.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '3px 8px',
                                  borderRadius: 5,
                                  background: canBid ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.12)',
                                  border: `1px solid ${canBid ? 'rgba(255, 255, 255, 0.12)' : 'rgba(239, 68, 68, 0.35)'}`,
                                  fontSize: 11.5,
                                  fontFamily: 'Barlow Condensed, sans-serif',
                                }}
                              >
                                <span style={{ fontWeight: 900, color: t.accent_color || '#e8192c' }}>{t.short_code}</span>
                                <span style={{ color: canBid ? '#f5c842' : '#f87171', fontWeight: 800 }}>🪙 ₹{rem.toLocaleString('en-IN')}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                      <div className="auction-val-main" style={{ color: '#f87171' }}>UNSOLD</div>
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
          DRAWER TOGGLE BUTTON (RIGHT EDGE)
          ────────────────────────────────────────────────────── */}
      <button
        className="auction-drawer-toggle"
        onClick={() => setDrawerOpen((prev) => !prev)}
        aria-label="Toggle Live Auction Feed Drawer"
        title="Toggle Live Sold Players & Coins"
      >
        <div className="auction-drawer-toggle-text">
          <span>{drawerTab === 'sold' ? 'SOLD' : 'COINS'}</span>
          {drawerOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </div>
      </button>

      {/* Drawer Backdrop Overlay for Mobile / Tap-outside */}
      {drawerOpen && (
        <div
          className="auction-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ──────────────────────────────────────────────────────
          LIVE SOLD & FRANCHISE COINS DRAWER
          ────────────────────────────────────────────────────── */}
      <aside className={`auction-feed-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-tabs">
            <button
              className={`drawer-tab-btn ${drawerTab === 'sold' ? 'active' : ''}`}
              onClick={() => setDrawerTab('sold')}
            >
              <Trophy size={13} />
              <span>SOLD ROSTER</span>
              <span className="drawer-tab-count">{recentSold.length}</span>
            </button>
            <button
              className={`drawer-tab-btn ${drawerTab === 'teams' ? 'active' : ''}`}
              onClick={() => setDrawerTab('teams')}
            >
              <span>🪙</span>
              <span>COINS</span>
              <span className="drawer-tab-count">{teams.length}</span>
            </button>
          </div>
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
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {drawerTab === 'sold' ? (
            <>
              {/* Search filter for sold players */}
              <div className="drawer-search-wrap">
                <Search size={14} className="drawer-search-icon" />
                <input
                  type="text"
                  placeholder="Search sold players or teams..."
                  value={soldSearch}
                  onChange={(e) => setSoldSearch(e.target.value)}
                  className="drawer-search-input"
                />
              </div>

              {recentSold.length === 0 ? (
                <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: '30px 10px' }}>
                  No players have been sold yet. Bidding updates will appear here live!
                </div>
              ) : (
                (() => {
                  const filtered = recentSold.filter((p) => {
                    if (!soldSearch) return true;
                    const q = soldSearch.toLowerCase();
                    return (
                      p.player_name.toLowerCase().includes(q) ||
                      p.team_name.toLowerCase().includes(q) ||
                      p.team_short_code.toLowerCase().includes(q) ||
                      (p.role && p.role.toLowerCase().includes(q))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: '30px 10px' }}>
                        No sold players match &quot;{soldSearch}&quot;
                      </div>
                    );
                  }

                  return filtered.map((p, idx) => {
                    const photo = p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg';
                    return (
                      <div key={p.id || idx} className="drawer-sold-card">
                        <div
                          className="drawer-player-avatar"
                          style={{ borderColor: p.team_accent_color || '#e8192c' }}
                        >
                          <img
                            src={photo}
                            alt={p.player_name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                            }}
                          />
                        </div>
                        <div className="drawer-player-meta">
                          <div className="drawer-player-name" title={p.player_name}>
                            {p.player_name}
                          </div>
                          <div className="drawer-player-sub">
                            <span>{p.role || 'Player'}</span>
                            {p.registration_number && (
                              <>
                                <span>·</span>
                                <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                                  #{p.registration_number}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="drawer-sold-price-col">
                          <div className="drawer-sold-price-val">
                            ₹{Number(p.sold_price || 0).toLocaleString('en-IN')}
                          </div>
                          <span
                            className="drawer-sold-team-pill"
                            style={{ background: p.team_accent_color || '#e8192c' }}
                          >
                            {p.team_short_code}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </>
          ) : (
            <>
              {/* Franchise Purse & Coins Tab */}
              {teams.length === 0 ? (
                <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                  No franchise teams loaded.
                </div>
              ) : (
                teams.map((t) => {
                  const budget = Number(t.budget) || 100000;
                  const spent = Number(t.spent) || 0;
                  const remaining = t.remaining_budget !== undefined ? Number(t.remaining_budget) : Math.max(0, budget - spent);
                  const pct = Math.min(100, Math.round((spent / budget) * 100));

                  return (
                    <div
                      key={t.id}
                      className="auction-team-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTeamForModal(t)}
                      title={`Click to inspect ${t.name}'s squad`}
                    >
                      <div className="auction-team-top">
                        <span
                          className="auction-team-badge"
                          style={{ background: t.accent_color || '#22c55e' }}
                        >
                          {t.short_code}
                        </span>
                        <span className="auction-team-name">{t.name}</span>
                        <span style={{ color: '#f5c842', fontWeight: 800, fontSize: 13 }}>
                          🪙 ₹{remaining.toLocaleString('en-IN')}
                        </span>
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
                          ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')} ({pct}% spent)
                        </span>
                        <span>
                          {t.squad_count || 0} / {t.squad_limit || 18} Players
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────
          TEAM SQUAD & PURSE INSPECTOR MODAL
          ────────────────────────────────────────────────────── */}
      {selectedTeamForModal && (
        <div className="auction-modal-overlay" onClick={() => setSelectedTeamForModal(null)}>
          <div
            className="auction-modal-card"
            style={{ borderColor: selectedTeamForModal.accent_color || '#e8192c' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auction-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className="coin-team-badge"
                  style={{
                    background: selectedTeamForModal.accent_color || '#e8192c',
                    fontSize: 14,
                    padding: '3px 10px',
                  }}
                >
                  {selectedTeamForModal.short_code}
                </span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>
                  {selectedTeamForModal.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedTeamForModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="auction-modal-body">
              {/* Financial & Squad Stats Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  marginBottom: 18,
                  padding: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700 }}>REMAINING COINS</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#f5c842' }}>
                    🪙 ₹{(selectedTeamForModal.remaining_budget !== undefined ? selectedTeamForModal.remaining_budget : Math.max(0, (Number(selectedTeamForModal.budget) || 100000) - (Number(selectedTeamForModal.spent) || 0))).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700 }}>TOTAL SPENT</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#ff4d5e' }}>
                    ₹{Number(selectedTeamForModal.spent || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 700 }}>SQUAD SIZE</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff' }}>
                    {selectedTeamForModal.squad_count || 0} / {selectedTeamForModal.squad_limit || 18}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: '#cbd5e1', marginBottom: 10, letterSpacing: '0.5px' }}>
                PLAYERS ACQUIRED IN AUCTION:
              </div>

              {(() => {
                const teamPlayers = recentSold.filter(
                  (p) => String(p.team_id) === String(selectedTeamForModal.id)
                );
                if (teamPlayers.length === 0) {
                  return (
                    <div style={{ color: 'var(--mute)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                      No players acquired yet in this auction.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {teamPlayers.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 6,
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: '#f5c842' }}>#{idx + 1}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>{p.player_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.role || 'Player'}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#f5c842' }}>
                          ₹{Number(p.sold_price || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

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
