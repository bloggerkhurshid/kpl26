'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Globe, MapPin, Search, X, Printer, CheckSquare, Shield } from 'lucide-react';
import Link from 'next/link';
import { kplApi, getImageUrl } from '@/lib/api';
import { printPlayerRoster } from '@/lib/printRoster';

type Player = {
  id: string;
  player_name: string;
  role: string;
  photo: string;
  player_category?: string;
  registration_number?: string;
  father_name?: string;
  age_input?: string;
  contact_number?: string;
  present_address?: string;
  batting_hand?: string;
  bowling_style?: string;
  wicket_keeper?: boolean | string;
  registered_by?: string;
  serial_no?: string;
  team_id?: string | null;
  team_name?: string | null;
  team_short_code?: string | null;
  team_accent_color?: string | null;
  teams?: {
    id?: string;
    name?: string;
    short_code?: string;
    accent_color?: string;
  } | null;
};

const formatPlayerRole = (roleStr?: string) => {
  if (!roleStr) return 'ALL-ROUNDER';
  const roles = roleStr.split(',').map((r) => r.trim().toLowerCase());
  const isBat = roles.includes('batsman') || roles.includes('batter');
  const isBowl = roles.includes('bowler');
  const isWk = roles.includes('wicket-keeper') || roles.includes('wicketkeeper') || roles.includes('wk');

  if (isBat && isBowl) return 'ALL-ROUNDER';
  if (isWk && isBat) return 'WK-BATSMAN';

  return roleStr.toUpperCase();
};

const renderCategoryBadge = (category?: string | null) => {
  if (!category) return null;
  const cat = category.toLowerCase().trim();
  const isForeign = cat.includes('foreign');
  const isLocalB = !isForeign && (cat.includes('b') || cat.includes('-b') || cat.includes('(b)') || cat.includes('grade b') || cat.endsWith(' b'));

  if (isForeign) {
    return (
      <span
        className="player-category-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(59, 130, 246, 0.18)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.55)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        ✈️ Foreigner
      </span>
    );
  }

  if (isLocalB) {
    return (
      <span
        className="player-category-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(6, 182, 212, 0.18)',
          color: '#22d3ee',
          border: '1px solid rgba(6, 182, 212, 0.55)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
        }}
      >
        🔹 Local-B
      </span>
    );
  }

  return (
    <span
      className="player-category-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(234, 179, 8, 0.18)',
        color: '#facc15',
        border: '1px solid rgba(234, 179, 8, 0.55)',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}
    >
      ⭐ Local-A
    </span>
  );
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'local-a' | 'local-b' | 'foreigner' | 'assigned'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [visibleCount, setVisibleCount] = useState(24);

  const fetchFreshPlayers = () => {
    Promise.all([
      kplApi.getPlayers({ status: 'active', limit: 1000 }),
      kplApi.getTeams('active').catch(() => []),
    ])
      .then(([playersData, teamsData]: [any, any]) => {
        const pList = Array.isArray(playersData) ? playersData : playersData?.data || [];
        const tList = Array.isArray(teamsData) ? teamsData : teamsData?.data || [];
        const teamMap = new Map<string, any>((tList || []).map((t: any) => [String(t.id), t]));

        const enrichedList = (pList as any[]).map((p: any) => {
          const matchedTeam: any = p.team_id ? teamMap.get(String(p.team_id)) : null;
          return {
            ...p,
            team_name: p.team_name || matchedTeam?.name || null,
            team_short_code: p.team_short_code || matchedTeam?.short_code || null,
            team_accent_color: p.team_accent_color || matchedTeam?.accent_color || matchedTeam?.color || null,
            teams: p.teams || (matchedTeam ? {
              id: matchedTeam.id,
              name: matchedTeam.name,
              short_code: matchedTeam.short_code,
              accent_color: matchedTeam.accent_color || matchedTeam.color,
            } : (p.team_name || p.team_short_code ? {
              id: p.team_id,
              name: p.team_name,
              short_code: p.team_short_code || p.team_name,
              accent_color: p.team_accent_color || '#10b981',
            } : null)),
          };
        });

        if (Array.isArray(enrichedList) && enrichedList.length > 0) {
          setPlayers(enrichedList as Player[]);
          setTeams(tList);
          try {
            // Strip any large base64 strings before storing in cache
            const leanList = enrichedList.map((item: any) => ({
              ...item,
              address_proof: item.address_proof && item.address_proof.length > 500 ? '' : item.address_proof,
              player_signature: item.player_signature && item.player_signature.length > 500 ? '' : item.player_signature,
            }));
            localStorage.setItem('kpl_public_players_cache', JSON.stringify({ p: leanList, t: tList }));
          } catch (e) {}
        }
      })
      .catch((err) => {
        console.error('Error fetching players:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // 1. Instant cache load
    try {
      const cached = localStorage.getItem('kpl_public_players_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlayers(parsed);
          setLoading(false);
        } else if (parsed?.p && Array.isArray(parsed.p) && parsed.p.length > 0) {
          setPlayers(parsed.p);
          if (parsed.t) setTeams(parsed.t);
          setLoading(false);
        }
      }
    } catch (e) {}

    // 2. Fetch fresh data in the background
    fetchFreshPlayers();

    // 3. Live sync when updated from Admin panel in other tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'kpl_cache_bust' || e.key === 'kpl_public_players_cache' || e.key === 'kpl_home_cache') {
        fetchFreshPlayers();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const localACount = players.filter(p => {
    const c = (p.player_category || '').toLowerCase();
    const isFor = c.includes('foreign');
    const isB = !isFor && (c.includes('b') || c.includes('-b') || c.includes('(b)') || c.includes('grade b') || c.endsWith(' b'));
    return !isFor && !isB;
  }).length;
  const localBCount = players.filter(p => {
    const c = (p.player_category || '').toLowerCase();
    const isFor = c.includes('foreign');
    return !isFor && (c.includes('b') || c.includes('-b') || c.includes('(b)') || c.includes('grade b') || c.endsWith(' b'));
  }).length;
  const foreignCount = players.filter((p) => (p.player_category || '').toLowerCase().includes('foreign')).length;
  const assignedCount = players.filter((p) => !!(p.team_id || p.team_name || p.team_short_code || p.teams)).length;

  const filteredPlayers = players.filter((p) => {
    // Category Filter: Local-A vs Local-B vs Foreigner vs Assigned
    if (categoryFilter === 'local-a') {
      const cat = (p.player_category || '').toLowerCase();
      const isFor = cat.includes('foreign');
      const isB = !isFor && (cat.includes('b') || cat.includes('-b') || cat.includes('(b)') || cat.includes('grade b') || cat.endsWith(' b'));
      if (isFor || isB) return false;
    } else if (categoryFilter === 'local-b') {
      const cat = (p.player_category || '').toLowerCase();
      const isFor = cat.includes('foreign');
      const isB = !isFor && (cat.includes('b') || cat.includes('-b') || cat.includes('(b)') || cat.includes('grade b') || cat.endsWith(' b'));
      if (isFor || !isB) return false;
    } else if (categoryFilter === 'foreigner') {
      const cat = (p.player_category || '').toLowerCase();
      if (!cat.includes('foreign')) return false;
    } else if (categoryFilter === 'assigned') {
      const hasTeam = !!(p.team_id || p.team_name || p.team_short_code || p.teams);
      if (!hasTeam) return false;
    }

    // Specific Team Dropdown Filter
    if (teamFilter !== 'all') {
      const pTeamId = p.team_id || p.teams?.id;
      const pTeamCode = (p.team_short_code || p.teams?.short_code || '').toLowerCase();
      const pTeamName = (p.team_name || p.teams?.name || '').toLowerCase();
      const match =
        String(pTeamId) === String(teamFilter) ||
        pTeamCode === teamFilter.toLowerCase() ||
        pTeamName === teamFilter.toLowerCase();
      if (!match) return false;
    }

    // Text Search Filter
    if (search.trim()) {
      const s = search.toLowerCase();
      const match =
        p.player_name.toLowerCase().includes(s) ||
        (p.player_category && p.player_category.toLowerCase().includes(s)) ||
        (p.role && p.role.toLowerCase().includes(s)) ||
        (p.team_name && p.team_name.toLowerCase().includes(s)) ||
        (p.team_short_code && p.team_short_code.toLowerCase().includes(s)) ||
        (p.registration_number && p.registration_number.toLowerCase().includes(s));
      if (!match) return false;
    }

    return true;
  });

  const isAllFilteredSelected = filteredPlayers.length > 0 && filteredPlayers.every((p) => selectedIds.has(p.id));

  const toggleSelectPlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPlayers.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPlayers.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  return (
    <main className="bg-[#0f172a] min-h-screen pb-16" style={{ backgroundColor: 'var(--bg-main, #0f172a)' }}>
      <nav className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="nav-container max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="brand" aria-label="KPL home">
            <img src="/kpl-logo.jpg" alt="KPL" className="brand-logo" />
            <span className="brand-text">
              KHORAGHAT PREMIER LEAGUE
              <span>SEASON 03 • 2026</span>
            </span>
          </Link>
          <div style={{ display: 'flex' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', textDecoration: 'none', background: 'rgba(255, 255, 255, 0.1)', padding: '8px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>
      </nav>

      <section className="section-pad pt-32" id="players" style={{ paddingTop: '120px' }}>
        <div className="page-width">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span className="section-label">All Registered Talent</span>
              <h1 className="sport-heading text-4xl text-white">Tournament Players</h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: '640px', justifyContent: 'flex-end' }}>
              {/* Category Filter Pills */}
              <div style={{ display: 'inline-flex', background: 'rgba(30, 41, 59, 0.7)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => { setCategoryFilter('all'); setVisibleCount(24); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    background: categoryFilter === 'all' ? '#10b981' : 'transparent',
                    color: categoryFilter === 'all' ? '#0f172a' : '#cbd5e1',
                  }}
                >
                  <Users size={14} />
                  <span>All</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: categoryFilter === 'all' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  }}>
                    {players.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategoryFilter('local-a'); setVisibleCount(24); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    background: categoryFilter === 'local-a' ? '#eab308' : 'transparent',
                    color: categoryFilter === 'local-a' ? '#0f172a' : '#facc15',
                  }}
                >
                  <span>⭐ Local-A</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: categoryFilter === 'local-a' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  }}>
                    {localACount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategoryFilter('local-b'); setVisibleCount(24); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    background: categoryFilter === 'local-b' ? '#06b6d4' : 'transparent',
                    color: categoryFilter === 'local-b' ? '#0f172a' : '#22d3ee',
                  }}
                >
                  <span>🔹 Local-B</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: categoryFilter === 'local-b' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                  }}>
                    {localBCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategoryFilter('foreigner'); setVisibleCount(24); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    background: categoryFilter === 'foreigner' ? '#3b82f6' : 'transparent',
                    color: categoryFilter === 'foreigner' ? '#0f172a' : '#60a5fa',
                  }}
                >
                  <Globe size={14} />
                  <span>Foreigner</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: categoryFilter === 'foreigner' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  }}>
                    {foreignCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCategoryFilter('assigned'); setVisibleCount(24); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: 'none',
                    background: categoryFilter === 'assigned' ? '#10b981' : 'transparent',
                    color: categoryFilter === 'assigned' ? '#0f172a' : '#cbd5e1',
                  }}
                >
                  <Shield size={14} />
                  <span>Assigned</span>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: categoryFilter === 'assigned' ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  }}>
                    {assignedCount}
                  </span>
                </button>
              </div>

              {/* Team Dropdown Filter */}
              {teams.length > 0 && (
                <select
                  value={teamFilter}
                  onChange={(e) => { setTeamFilter(e.target.value); setVisibleCount(24); }}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    padding: '9px 12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">🛡️ All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.short_code ? `(${t.short_code})` : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* Search Bar */}
              <div style={{
                position: 'relative',
                flex: '1',
                minWidth: '220px',
                maxWidth: '320px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                border: '1px solid #334155',
                padding: '0 12px',
              }}>
                <Search size={16} color="#94a3b8" style={{ flexShrink: 0, marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="Search player, role, team..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setVisibleCount(24); }}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Select All Button */}
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedIds.size > 0 ? '1px solid #10b981' : '1px solid #334155',
                  background: selectedIds.size > 0 ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                  color: selectedIds.size > 0 ? '#10b981' : '#cbd5e1',
                  transition: 'all 0.15s ease',
                }}
              >
                <CheckSquare size={14} />
                <span>{isAllFilteredSelected ? `Deselect (${filteredPlayers.length})` : selectedIds.size > 0 ? `Selected (${selectedIds.size})` : `Select All`}</span>
              </button>

              {/* Print Roster Button */}
              <button
                type="button"
                onClick={() => {
                  const list = selectedIds.size > 0 ? filteredPlayers.filter((p) => selectedIds.has(p.id)) : filteredPlayers;
                  const categoryLabel =
                    categoryFilter === 'all'
                      ? teamFilter !== 'all'
                        ? 'Team Players'
                        : 'All Categories'
                      : categoryFilter === 'local-a'
                      ? 'Local-A Players'
                      : categoryFilter === 'local-b'
                      ? 'Local-B Players'
                      : categoryFilter === 'foreigner'
                      ? 'Foreigner Players'
                      : 'Assigned Players';
                  printPlayerRoster(list, categoryLabel, teams);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  transition: 'all 0.15s ease',
                }}
              >
                <Printer size={15} />
                <span>Print List {selectedIds.size > 0 ? `(${selectedIds.size})` : `(${filteredPlayers.length})`}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <div className="kpl-loading-bar-wrap" style={{ width: '200px' }}>
                <div className="kpl-loading-bar" />
              </div>
            </div>
          ) : (
            <div className="players-grid">
              {filteredPlayers.length === 0 ? (
                <p className="lead text-gray-400">No players found matching your search.</p>
              ) : (
                <>
                  {filteredPlayers.slice(0, visibleCount).map((player) => {
                    const assignedTeamColor = player.team_accent_color || player.teams?.accent_color;
                    const assignedTeamCode = player.team_short_code || player.teams?.short_code || player.team_name || player.teams?.name;

                    return (
                      <div
                        className="player-card"
                        key={player.id}
                        style={{
                          position: 'relative',
                          border: selectedIds.has(player.id) ? '1px solid #10b981' : undefined,
                          borderTop: assignedTeamColor ? `3.5px solid ${assignedTeamColor}` : undefined,
                        }}
                      >
                      {/* Selection Checkbox */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          zIndex: 10,
                          background: 'rgba(15, 23, 42, 0.85)',
                          borderRadius: '6px',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(player.id)}
                          onChange={() => toggleSelectPlayer(player.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                          title="Select player"
                        />
                      </div>
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
                        <h3 className="sport-heading text-white">{player.player_name}</h3>
                        <div className="player-badge-wrap">
                          <span className="player-role-badge">{formatPlayerRole(player.role)}</span>
                          {renderCategoryBadge(player.player_category)}
                          {assignedTeamCode && (
                            <span
                              className="player-team-badge"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                background: `${assignedTeamColor || '#10b981'}25`,
                                color: assignedTeamColor || '#10b981',
                                border: `1.5px solid ${assignedTeamColor || '#10b981'}70`,
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: assignedTeamColor || '#10b981', display: 'inline-block' }} />
                              {assignedTeamCode}
                            </span>
                          )}
                        </div>
                        {player.registration_number && (
                          <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', letterSpacing: '0.5px' }}>
                            ID: {player.registration_number}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {filteredPlayers.length > visibleCount && !loading && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '36px' }}>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '15px'
                }}
              >
                Load More Players ({filteredPlayers.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Printable Player List Modal */}
      {printModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPrintModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '14px',
              maxWidth: '980px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar (Hidden during print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Printer size={20} color="#10b981" /> Print Player List
                </h2>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                  Printing {selectedIds.size > 0 ? `${selectedIds.size} selected player(s)` : `${filteredPlayers.length} filtered player(s)`}
                </p>
              </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const list = selectedIds.size > 0 ? filteredPlayers.filter((p) => selectedIds.has(p.id)) : filteredPlayers;
                    const categoryLabel = categoryFilter === 'all' ? 'All Categories' : categoryFilter === 'local-a' ? 'Local-A' : categoryFilter === 'local-b' ? 'Local-B' : 'Foreigner';
                    printPlayerRoster(list, categoryLabel);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: '#10b981',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="kpl-print-area" style={{ background: '#fff', color: '#000', padding: '24px', borderRadius: '8px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' }}>
                  KHORAGHAT PREMIER LEAGUE — SEASON 03 (2026)
                </h1>
                <h2 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#333', textTransform: 'uppercase' }}>
                  OFFICIAL REGISTERED PLAYERS LIST
                </h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#444' }}>
                  <span>Category: <strong>{categoryFilter === 'all' ? 'All Categories' : categoryFilter === 'local-a' ? 'Local-A' : categoryFilter === 'local-b' ? 'Local-B' : 'Foreigner'}</strong></span>
                  <span>Total Players: <strong>{(selectedIds.size > 0 ? filteredPlayers.filter((p) => selectedIds.has(p.id)) : filteredPlayers).length}</strong></span>
                  <span>Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #000', borderBottom: '2px solid #000' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #94a3b8', width: '50px' }}>SL NO</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #94a3b8', width: '90px' }}>REG ID</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #94a3b8' }}>PLAYER NAME</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #94a3b8' }}>ADDRESS</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #94a3b8', width: '120px' }}>MOBILE NO</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #94a3b8', width: '125px' }}>CATEGORY</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedIds.size > 0 ? filteredPlayers.filter((p) => selectedIds.has(p.id)) : filteredPlayers).map((player, index) => {
                    const cat = (player.player_category || '').toLowerCase();
                    const isForeign = cat.includes('foreign');
                    const isLocalB = !isForeign && (cat.includes('b') || cat.includes('-b') || cat.includes('(b)') || cat.includes('grade b') || cat.endsWith(' b'));
                    const categoryLabel = isForeign ? 'Foreigner' : isLocalB ? 'Local-B' : 'Local-A';
                    const badgeBg = isForeign ? '#eff6ff' : isLocalB ? '#ecfeff' : '#fefce8';
                    const badgeColor = isForeign ? '#1e40af' : isLocalB ? '#155e75' : '#854d0e';
                    const badgeBorder = isForeign ? '#bfdbfe' : isLocalB ? '#a5f3fc' : '#fef08a';

                    return (
                      <tr key={player.id} style={{ borderBottom: '1px solid #cbd5e1', background: index % 2 === 1 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 600 }}>{index + 1}</td>
                        <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 700, fontFamily: 'monospace' }}>{player.registration_number || '—'}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>
                          <div style={{ fontWeight: 700 }}>{player.player_name}</div>
                          {player.role && <div style={{ fontSize: '10px', color: '#64748b' }}>{player.role}</div>}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #cbd5e1', color: '#1e293b' }}>
                          {player.present_address || '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                          {player.contact_number || '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                          }}>
                            {categoryLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px dashed #94a3b8', fontSize: '11px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '160px', borderBottom: '1px solid #000', marginBottom: '6px' }} />
                  <span>Prepared By</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '160px', borderBottom: '1px solid #000', marginBottom: '6px' }} />
                  <span>Verified By</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '160px', borderBottom: '1px solid #000', marginBottom: '6px' }} />
                  <span>KPL Committee Authority</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
