'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import './ended.css';
import { kplApi } from '@/lib/api';
import { Sponsor, defaultSponsors } from '@/components/SponsorshipSection';
import { Trophy, Star, Shield, Award, Sparkles } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   SPONSORS HELPERS
   ────────────────────────────────────────────────────────── */
function getSponsorTierIcon(tier?: string) {
  const t = (tier || '').toLowerCase();
  if (t.includes('title')) return Trophy;
  if (t.includes('power') || t.includes('co-powered')) return Star;
  if (t.includes('associate')) return Shield;
  if (t.includes('media') || t.includes('digital')) return Sparkles;
  return Award;
}

function getSponsorTierColor(tier?: string, fallbackColor?: string) {
  if (fallbackColor && fallbackColor.startsWith('#')) return fallbackColor;
  const t = (tier || '').toLowerCase();
  if (t.includes('title')) return '#fbbf24';
  if (t.includes('power') || t.includes('co-powered')) return '#38bdf8';
  if (t.includes('associate')) return '#a78bfa';
  if (t.includes('media') || t.includes('digital')) return '#c084fc';
  if (t.includes('beverage')) return '#4ade80';
  return '#22c55e';
}

/* ──────────────────────────────────────────────────────────
   TYPES & INTERFACES
   ────────────────────────────────────────────────────────── */
interface Team {
  id: string;
  name: string;
  short_code: string;
  budget: number | string;
  spent: number | string;
  squad_limit?: number | string;
  squad_count?: number;
  accent_color: string;
}

interface Player {
  id: string;
  player_name: string;
  role: string;
  base_price: number | string;
  sold_price: number | string | null;
  team_id: string | null;
  auction_eligible?: boolean | number | string;
  player_category?: string;
  batsman?: number | boolean;
  bowler?: number | boolean;
  all_rounder?: number | boolean;
  wicket_keeper?: number | boolean;
  teams?: {
    id?: string;
    name: string;
    short_code: string;
    accent_color: string;
  } | null;
}

export default function AuctionEndedPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fetchedUnsoldCount, setFetchedUnsoldCount] = useState<number | null>(null);
  const [sponsorsList, setSponsorsList] = useState<Sponsor[]>(defaultSponsors);

  useEffect(() => {
    let isCancelled = false;
    kplApi.getSponsors().then(data => {
      if (isCancelled) return;
      if (Array.isArray(data) && data.length > 0) {
        setSponsorsList(data);
      }
    }).catch(() => {});
    return () => { isCancelled = true; };
  }, []);

  // Fixed stars and confetti generated once on mount
  const stars = useMemo(() => {
    return Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      x: (i * 1.33 + Math.sin(i * 9) * 20 + 50) % 99,
      y: (i * 1.37 + Math.cos(i * 7) * 25 + 50) % 98,
      size: 0.6 + ((i * 17) % 20) / 10,
      duration: 2 + ((i * 13) % 30) / 10,
      delay: ((i * 11) % 40) / 10,
    }));
  }, []);

  const confetti = useMemo(() => {
    const colors = ['#e8192c', '#ffd700', '#ffffff', '#ff6b8a', '#ff3344', '#ffa0a0', '#ffe066', '#ffcaca'];
    return Array.from({ length: 55 }).map((_, i) => ({
      id: i,
      left: (i * 1.82 + Math.sin(i * 5) * 15 + 50) % 98,
      color: colors[i % colors.length],
      width: 4 + (i % 5),
      height: 8 + (i % 9),
      duration: 4.5 + ((i * 7) % 45) / 10,
      delay: ((i * 13) % 70) / 10,
    }));
  }, []);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const [teamsData, soldData, unsoldData] = await Promise.all([
          fetch('/api/teams').then(r => r.json()).catch(async () => {
            const res = await kplApi.getTeams('active');
            return Array.isArray(res) ? res : (res?.data || []);
          }),
          fetch('/api/players?team_id[not]=null').then(r => r.json()).catch(async () => {
            const res = await kplApi.getPlayers({ status: 'active', limit: 1500 });
            return Array.isArray(res) ? res : (res?.data || []);
          }),
          fetch('/api/players?team_id=null').then(r => r.json()).catch(() => []),
        ]);

        const rawTeams: Team[] = Array.isArray(teamsData) ? teamsData : (teamsData?.data || []);
        let rawPlayers: Player[] = Array.isArray(soldData) ? soldData : (soldData?.data || []);
        const rawUnsold: Player[] = Array.isArray(unsoldData) ? unsoldData : (unsoldData?.data || []);

        // Fallback: If soldData endpoint returned empty, fall back to general players list
        if (rawPlayers.length === 0) {
          try {
            const allRes = await fetch('/api/players').then(r => r.json());
            const list = Array.isArray(allRes) ? allRes : (allRes?.data || []);
            rawPlayers = list.filter((p: Player) => Boolean(p.team_id));
          } catch {}
        }

        const teamMap = new Map<string, Team>();
        rawTeams.forEach(t => teamMap.set(String(t.id), t));

        const enrichedPlayers = rawPlayers.map(p => {
          if (p.team_id && (!p.teams || !p.teams.name)) {
            const matched = teamMap.get(String(p.team_id));
            if (matched) {
              return {
                ...p,
                teams: {
                  id: matched.id,
                  name: matched.name,
                  short_code: matched.short_code,
                  accent_color: matched.accent_color,
                },
              };
            }
          }
          return p;
        });

        setTeams(rawTeams);
        setPlayers(enrichedPlayers);
        if (Array.isArray(rawUnsold)) {
          setFetchedUnsoldCount(rawUnsold.length);
        }
      } catch (err) {
        console.error('Failed to load auction end results:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  /* ──────────────────────────────────────────────────────────
     CLIENT-SIDE DERIVATIONS
     ────────────────────────────────────────────────────────── */
  const isRetainedOrOwner = (p: Player) => {
    const roleLower = (p.role || '').toLowerCase();
    const catLower = (p.player_category || '').toLowerCase();
    return roleLower.includes('retain') || catLower.includes('retain') || roleLower.includes('owner');
  };

  // Sold players excluding retained/owners
  const soldPlayers = useMemo(() => {
    return players.filter(p => Boolean(p.team_id) && !isRetainedOrOwner(p));
  }, [players]);

  // Unsold players in pass pool
  const unsoldPlayers = useMemo(() => {
    return players.filter(p => !p.team_id && !isRetainedOrOwner(p));
  }, [players]);

  const totalSold = soldPlayers.length;
  const totalPurse = useMemo(() => {
    return soldPlayers.reduce((acc, p) => acc + (Number(p.sold_price) || 0), 0);
  }, [soldPlayers]);
  const unsoldCount = fetchedUnsoldCount !== null ? fetchedUnsoldCount : unsoldPlayers.length;

  // Top 6 picks by sold_price DESC
  const topPicks = useMemo(() => {
    return [...soldPlayers]
      .sort((a, b) => (Number(b.sold_price) || 0) - (Number(a.sold_price) || 0))
      .slice(0, 6);
  }, [soldPlayers]);

  // Role Counts
  const roleCounts = useMemo(() => {
    let batsmen = 0;
    let bowlers = 0;
    let allRounders = 0;
    let keepers = 0;

    soldPlayers.forEach(p => {
      const r = (p.role || '').toLowerCase();
      if (p.batsman || r.includes('bats')) batsmen++;
      else if (p.bowler || r.includes('bowl')) bowlers++;
      else if (p.all_rounder || r.includes('all')) allRounders++;
      else if (p.wicket_keeper || r.includes('keep')) keepers++;
      else batsmen++; // Default fallback
    });

    return { batsmen, bowlers, allRounders, keepers };
  }, [soldPlayers]);

  // Teams sorted by spent DESC
  const sortedTeams = useMemo(() => {
    const mapped = teams.map(team => {
      const teamPlayers = soldPlayers.filter(p => String(p.team_id) === String(team.id));
      const calcSpent = teamPlayers.reduce((acc, p) => acc + (Number(p.sold_price) || 0), 0);
      const budgetNum = Number(team.budget) || 100000;
      const spentNum = calcSpent > 0 ? calcSpent : (Number(team.spent) || 0);
      return {
        ...team,
        spent: spentNum,
        squad_count: teamPlayers.length || Number(team.squad_count) || 0,
        budget: budgetNum,
        percent: Math.min(100, Math.round((spentNum / (budgetNum || 1)) * 100)),
      };
    });

    return mapped.sort((a, b) => (Number(b.spent) || 0) - (Number(a.spent) || 0));
  }, [teams, soldPlayers]);

  // Podium top 3 (rendered in order: 2nd place left, 1st place center, 3rd place right)
  const podiumTop3 = useMemo(() => {
    return [
      { rank: 2, medal: '🥈', data: sortedTeams[1] || null },
      { rank: 1, medal: '🥇', data: sortedTeams[0] || null },
      { rank: 3, medal: '🥉', data: sortedTeams[2] || null },
    ];
  }, [sortedTeams]);

  // 4th to 6th teams
  const restTeams = useMemo(() => {
    return sortedTeams.slice(3, 6);
  }, [sortedTeams]);

  return (
    <div className="ended-page-wrapper">
      {/* Background Grid & Ambient Glow Orbs */}
      <div className="ended-bg-grid" />
      <div className="ended-aurora-orb ended-orb-1" />
      <div className="ended-aurora-orb ended-orb-2" />
      <div className="ended-aurora-orb ended-orb-3" />

      {/* 75 Stars Layer */}
      {stars.map(s => (
        <div
          key={s.id}
          className="ended-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* 55 Confetti Pieces Layer */}
      <div className="ended-confetti-layer">
        {confetti.map(c => (
          <div
            key={c.id}
            className="ended-confetti"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
              width: `${c.width}px`,
              height: `${c.height}px`,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────
          1. HEADER
          ────────────────────────────────────────────────────── */}
      <header className="ended-header">
        <div className="ended-header-brand">
          <div className="ended-spinning-ring-frame">
            <div className="ended-spinning-ring-inner">
              <span className="ended-ring-text-main">KPL</span>
              <span className="ended-ring-text-sub">S-3</span>
            </div>
          </div>
          <div className="ended-brand-titles">
            <div className="ended-brand-title-main">KHORAGHAT PREMIER LEAGUE</div>
            <div className="ended-brand-title-sub">SEASON 3 · PLAYER AUCTION</div>
          </div>
        </div>

        <div className="ended-complete-badge">
          <span>✦ AUCTION COMPLETE ✦</span>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────
          2. HERO STRIP
          ────────────────────────────────────────────────────── */}
      <section className="ended-hero-strip">
        {/* Left Stat Pair */}
        <div className="ended-hero-stat-pair">
          <div className="ended-hero-stat-item">
            <span className="ended-hero-stat-label">PLAYERS SOLD</span>
            <div className="ended-hero-stat-val gold">
              {loading ? <span className="ended-shimmer" style={{ width: 60, height: 32, display: 'inline-block' }} /> : totalSold}
            </div>
          </div>
          <div className="ended-hero-stat-item">
            <span className="ended-hero-stat-label">TOTAL PURSE</span>
            <div className="ended-hero-stat-val gradient-purse">
              {loading ? <span className="ended-shimmer" style={{ width: 120, height: 32, display: 'inline-block' }} /> : `₹${totalPurse.toLocaleString('en-IN')}`}
            </div>
          </div>
        </div>

        {/* Center Title */}
        <div className="ended-hero-center">
          <div className="ended-hero-kicker">KHORAGHAT PREMIER LEAGUE</div>
          <div className="ended-hero-title-container">
            <span className="ended-hero-title-auction">AUCTION</span>
            <span className="ended-hero-title-complete">COMPLETE</span>
          </div>
          <div className="ended-hero-sub">All squads drafted · Season 3 begins</div>
        </div>

        {/* Right Stat Pair */}
        <div className="ended-hero-stat-pair right">
          <div className="ended-hero-stat-item" style={{ textAlign: 'right' }}>
            <span className="ended-hero-stat-label">FRANCHISES</span>
            <div className="ended-hero-stat-val white">
              {loading ? <span className="ended-shimmer" style={{ width: 40, height: 32, display: 'inline-block' }} /> : (sortedTeams.length || 6)}
            </div>
          </div>
          <div className="ended-hero-stat-item" style={{ textAlign: 'right' }}>
            <span className="ended-hero-stat-label">UNSOLD</span>
            <div className="ended-hero-stat-val dim">
              {loading ? <span className="ended-shimmer" style={{ width: 40, height: 32, display: 'inline-block' }} /> : unsoldCount}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────
          3. MAIN STAGE (3 COLUMNS)
          ────────────────────────────────────────────────────── */}
      <main className="ended-main-stage">
        {/* ── LEFT COLUMN: TOP HAMMER PRICES ── */}
        <section className="ended-panel ended-panel-left">
          <div className="ended-panel-heading">
            <span className="ended-heading-bar" />
            <span>TOP HAMMER PRICES</span>
          </div>

          <div className="ended-panel-body">
            {loading ? (
              <div className="ended-hammer-list">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="ended-hammer-row">
                    <span className="ended-shimmer" style={{ width: 22, height: 26 }} />
                    <div className="ended-hammer-info">
                      <span className="ended-shimmer" style={{ width: '75%', height: 16, marginBottom: 4 }} />
                      <span className="ended-shimmer" style={{ width: '45%', height: 12 }} />
                    </div>
                    <div className="ended-hammer-price-col">
                      <span className="ended-shimmer" style={{ width: 65, height: 18 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : topPicks.length > 0 ? (
              <div className="ended-hammer-list">
                {topPicks.map((player, idx) => {
                  const rankNum = idx + 1;
                  const rankClass = rankNum === 1 ? 'ended-rank-1' : rankNum === 2 ? 'ended-rank-2' : rankNum === 3 ? 'ended-rank-3' : 'ended-rank-other';
                  const teamColor = player.teams?.accent_color || '#e8192c';
                  const teamCode = player.teams?.short_code || player.teams?.name?.slice(0, 3).toUpperCase() || 'KPL';

                  return (
                    <div key={player.id || idx} className="ended-hammer-row">
                      <div className={`ended-hammer-rank ${rankClass}`}>{rankNum}</div>
                      <div className="ended-hammer-info">
                        <div className="ended-hammer-name">{player.player_name}</div>
                        <div className="ended-hammer-sub">
                          <span className="ended-team-accent-dot" style={{ backgroundColor: teamColor }} />
                          <span>{teamCode}</span>
                          <span>·</span>
                          <span>{player.role || 'Player'}</span>
                        </div>
                      </div>
                      <div className="ended-hammer-price-col">
                        <div className="ended-hammer-price">
                          ₹{Number(player.sold_price || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="ended-hammer-base">
                          base ₹{Number(player.base_price || 500).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ended-mute)', fontSize: 13 }}>
                No sold auction data available yet.
              </div>
            )}
          </div>
        </section>

        {/* ── CENTER COLUMN: FRANCHISE STANDINGS ── */}
        <section className="ended-panel">
          <div className="ended-panel-heading">
            <span className="ended-heading-bar" />
            <span>FRANCHISE STANDINGS</span>
          </div>

          <div className="ended-standings-container">
            {/* Top 3 Podium */}
            <div className="ended-podium-section">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="ended-podium-slot">
                    <div className="ended-shimmer" style={{ width: '100%', height: i === 1 ? 120 : 85, borderRadius: 8 }} />
                  </div>
                ))
              ) : (
                podiumTop3.map(slot => {
                  const team = slot.data;
                  if (!team) return null;
                  const accentColor = team.accent_color || '#22c55e';

                  return (
                    <div
                      key={slot.rank}
                      className={`ended-podium-slot ended-podium-${slot.rank}`}
                      style={{ '--podium-accent': accentColor } as React.CSSProperties}
                    >
                      <div className="ended-podium-plate">
                        <div className="ended-podium-medal">{slot.medal}</div>
                        <div
                          className="ended-podium-badge"
                          style={{
                            backgroundColor: `${accentColor}22`,
                            color: accentColor,
                            border: `1px solid ${accentColor}44`,
                          }}
                        >
                          {team.short_code}
                        </div>
                        <div className="ended-podium-spent">
                          ₹{Number(team.spent || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="ended-podium-meta">
                        <div className="ended-podium-team-name">{team.name}</div>
                        <div className="ended-podium-squad">{team.squad_count || 0} players</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rest Teams 4th–6th */}
            <div className="ended-teams-rest-grid">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="ended-team-mini-card">
                    <span className="ended-shimmer" style={{ width: '60%', height: 16 }} />
                    <span className="ended-shimmer" style={{ width: '100%', height: 4 }} />
                    <span className="ended-shimmer" style={{ width: '50%', height: 14 }} />
                  </div>
                ))
              ) : (
                restTeams.map((team, idx) => {
                  const accentColor = team.accent_color || '#22c55e';
                  const percent = team.percent || 0;

                  return (
                    <div key={team.id || idx} className="ended-team-mini-card">
                      <div className="ended-card-top">
                        <span
                          className="ended-card-badge"
                          style={{
                            backgroundColor: `${accentColor}25`,
                            color: accentColor,
                            border: `1px solid ${accentColor}44`,
                          }}
                        >
                          {team.short_code}
                        </span>
                        <span className="ended-card-name">{team.name}</span>
                      </div>
                      <div className="ended-card-bar-track">
                        <div
                          className="ended-card-bar-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: accentColor,
                          }}
                        />
                      </div>
                      <div className="ended-card-bottom">
                        <span className="ended-card-spent">
                          ₹{Number(team.spent || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="ended-card-squad">
                          {team.squad_count || 0} players · {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ── RIGHT COLUMN: ROLES + SIGN OFF ── */}
        <section className="ended-panel ended-panel-right">
          <div className="ended-panel-heading">
            <span className="ended-heading-bar" />
            <span>SOLD BY ROLE</span>
          </div>

          <div className="ended-right-container">
            {/* 2×2 Role Chips Grid */}
            <div className="ended-role-grid">
              {/* Batsmen */}
              <div
                className="ended-role-chip"
                style={{ '--chip-color': '#e8192c' } as React.CSSProperties}
              >
                <div className="ended-chip-count ended-chip-batsman">
                  {loading ? '—' : roleCounts.batsmen}
                </div>
                <div className="ended-chip-label">BATSMEN</div>
              </div>

              {/* Bowlers */}
              <div
                className="ended-role-chip"
                style={{ '--chip-color': '#dca600' } as React.CSSProperties}
              >
                <div className="ended-chip-count ended-chip-bowler">
                  {loading ? '—' : roleCounts.bowlers}
                </div>
                <div className="ended-chip-label">BOWLERS</div>
              </div>

              {/* All-Rounders */}
              <div
                className="ended-role-chip"
                style={{ '--chip-color': '#4fc3f7' } as React.CSSProperties}
              >
                <div className="ended-chip-count ended-chip-allrounder">
                  {loading ? '—' : roleCounts.allRounders}
                </div>
                <div className="ended-chip-label">ALL-ROUNDERS</div>
              </div>

              {/* Keepers */}
              <div
                className="ended-role-chip"
                style={{ '--chip-color': '#22d3ee' } as React.CSSProperties}
              >
                <div className="ended-chip-count ended-chip-keeper">
                  {loading ? '—' : roleCounts.keepers}
                </div>
                <div className="ended-chip-label">KEEPERS</div>
              </div>
            </div>

            {/* Sign Off */}
            <div className="ended-signoff-box">
              <div className="ended-trophy-icon">🏆</div>
              <div className="ended-signoff-title">SEE YOU ON THE FIELD</div>
              <div className="ended-signoff-sub">
                Khoraghat Premier League Season 3 squads are now complete. Best of luck to all franchises.
              </div>
              <div className="ended-signoff-tag">KPL · SEASON 3 · 2026</div>
            </div>
          </div>
        </section>
      </main>

      {/* ──────────────────────────────────────────────────────
          4. SPONSOR TICKER (FOOTER)
          ────────────────────────────────────────────────────── */}
      <footer className="ended-footer-ticker">
        <div className="ended-ticker-mask-left" />
        <div className="ended-ticker-mask-right" />

        <div className="ended-ticker-track">
          {[...sponsorsList, ...sponsorsList, ...sponsorsList].map((sponsor, idx) => {
            const Icon = getSponsorTierIcon(sponsor.tier);
            const tierColor = getSponsorTierColor(sponsor.tier, sponsor.tierBadgeColor);
            return (
              <div
                key={idx}
                className="ended-sponsor-badge"
                style={{
                  borderColor: `${tierColor}66`,
                  background: `${tierColor}15`,
                }}
              >
                <Icon size={12} className="ended-sponsor-icon" style={{ color: tierColor }} />
                <span style={{ color: tierColor, fontWeight: 900 }}>
                  {sponsor.tier ? `${sponsor.tier.toUpperCase()}:` : 'SPONSOR:'}
                </span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>
                  {sponsor.name}
                </span>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
