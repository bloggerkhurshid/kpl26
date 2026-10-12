'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Gavel, Play, Square, UserCheck, UserX, ExternalLink,
  CheckCircle2, AlertCircle, Loader2, Trophy, Users, DollarSign, Search, X,
  Radio, RefreshCw, Flame, ArrowRight, Shield, Edit3, Edit2, Printer
} from 'lucide-react';
import { printTeamDetails } from '@/lib/printRoster';

interface Team {
  id: string;
  name: string;
  short_code: string;
  accent_color: string;
  budget?: number | string;
  spent?: number | string;
  squad_count?: number;
}

interface Player {
  id: string;
  player_name: string;
  role: string;
  age: number | null;
  base_price: number;
  sold_price: number | null;
  auction_eligible: boolean | number | string;
  status: string;
  team_id: string | null;
  photo?: string | null;
  player_category?: string;
  teams?: Team | null;
}

interface AuctionConfig {
  is_active: boolean;
  current_player_id: string | null;
  notes: string;
}

export default function AuctionPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig>({
    is_active: false,
    current_player_id: null,
    notes: 'KPL Season 3 Live Auction',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellModal, setSellModal] = useState<Player | null>(null);
  const [sellForm, setSellForm] = useState({ team_id: '', sold_price: '' });
  const [editPriceModal, setEditPriceModal] = useState<Player | null>(null);
  const [editPriceForm, setEditPriceForm] = useState({ team_id: '', sold_price: '' });
  const [playerSearch, setPlayerSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedPrintTeamId, setSelectedPrintTeamId] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Load both roster and current live auction configuration
  const loadData = useCallback(async (quiet: boolean = false) => {
    if (!quiet) setLoading(true);
    setIsSyncing(true);
    try {
      const [pRes, tRes, cRes] = await Promise.all([
        kplApi.getPlayers({ status: 'active', limit: 1000 }),
        kplApi.getTeams('active'),
        kplApi.getAuctionConfig(),
      ]);

      const loadedPlayers: Player[] = pRes?.data || pRes || [];
      const loadedTeams: Team[] = tRes?.data || tRes || [];

      // Re-map teams object onto players if missing
      const teamMap = new Map<string, Team>();
      loadedTeams.forEach(t => teamMap.set(String(t.id), t));

      const enrichedPlayers = loadedPlayers.map(p => {
        if (p.team_id && (!p.teams || !p.teams.name)) {
          return { ...p, teams: teamMap.get(String(p.team_id)) || p.teams };
        }
        return p;
      });

      setPlayers(enrichedPlayers);
      setTeams(loadedTeams);

      if (cRes) {
        setAuctionConfig({
          is_active: Boolean(cRes.is_active),
          current_player_id: cRes.current_player_id || null,
          notes: cRes.notes || 'KPL Season 3 Live Auction',
        });
      }
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error(err);
      if (!quiet) {
        showToast(err.message || 'Failed to load auction data', 'error');
      }
    } finally {
      if (!quiet) setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Background polling every 4 seconds to keep admin console in sync with live changes
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Toggle auction session state (Start / Stop)
  async function toggleAuctionSession() {
    setSaving(true);
    const newActive = !auctionConfig.is_active;
    try {
      await kplApi.updateAuctionConfig({
        is_active: newActive,
        current_player_id: auctionConfig.current_player_id,
        notes: auctionConfig.notes,
      });
      setAuctionConfig(c => ({ ...c, is_active: newActive }));
      showToast(`Auction session ${newActive ? 'is now LIVE!' : 'is now STOPPED / STANDBY.'}`);
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update auction state', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Set current player on the auction block
  async function setCurrentPlayer(playerId: string | null) {
    const p = players.find(x => String(x.id) === String(playerId)) || null;

    // Optimistic instant UI update
    setAuctionConfig(c => ({ ...c, current_player_id: playerId }));

    try {
      await kplApi.updateAuctionConfig({
        is_active: auctionConfig.is_active,
        current_player_id: playerId,
        notes: auctionConfig.notes,
        player: p,
      });
      if (playerId && p) {
        showToast(`${p.player_name} is now ON THE AUCTION BLOCK!`);
      } else {
        showToast('Auction block cleared.');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to set player on block', 'error');
    }
  }

  // Toggle player auction eligibility
  async function toggleAuctionEligibility(p: Player) {
    const isCurrentlyEligible =
      p.auction_eligible === true ||
      p.auction_eligible === 1 ||
      p.auction_eligible === '1';

    try {
      await kplApi.updatePlayer(p.id, { auction_eligible: !isCurrentlyEligible ? 1 : 0 });
      showToast(`Player ${!isCurrentlyEligible ? 'enabled' : 'disabled'} for auction.`);
      // If disabled and currently on block, clear block
      if (isCurrentlyEligible && auctionConfig.current_player_id === p.id) {
        await setCurrentPlayer(null);
      }
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle eligibility', 'error');
    }
  }

  // Record player sold
  async function sellPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!sellModal) return;
    setSaving(true);
    const modalPlayer = sellModal;
    const soldPrice = parseFloat(sellForm.sold_price) || Number(modalPlayer.base_price) || 0;
    const assignedTeam = teams.find(t => String(t.id) === String(sellForm.team_id));

    // Optimistically update player in local state
    setPlayers(prev => prev.map(p => {
      if (String(p.id) === String(modalPlayer.id)) {
        return {
          ...p,
          team_id: sellForm.team_id || null,
          sold_price: soldPrice,
          auction_eligible: 0,
          teams: assignedTeam || p.teams,
        };
      }
      return p;
    }));

    if (auctionConfig.current_player_id === modalPlayer.id) {
      setAuctionConfig(c => ({ ...c, current_player_id: null }));
    }

    setSellModal(null);
    setSellForm({ team_id: '', sold_price: '' });

    try {
      await Promise.all([
        kplApi.updatePlayer(modalPlayer.id, {
          team_id: sellForm.team_id || null,
          sold_price: soldPrice,
          auction_eligible: 0,
        }),
        kplApi.updateAuctionConfig({
          is_active: auctionConfig.is_active,
          current_player_id: auctionConfig.current_player_id === modalPlayer.id ? null : auctionConfig.current_player_id,
          notes: auctionConfig.notes,
        }),
      ]);

      showToast(`🎉 ${modalPlayer.player_name} sold for ₹${soldPrice.toLocaleString('en-IN')}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to sell player', 'error');
      loadData(true);
    } finally {
      setSaving(false);
    }
  }

  // Mark player as Unsold / Pass (remove from block, mark not eligible so live screen reflects UNSOLD)
  async function markAsUnsold(p: Player) {
    setSaving(true);
    try {
      await kplApi.updatePlayer(p.id, {
        team_id: null,
        sold_price: null,
        auction_eligible: 0,
      });
      if (auctionConfig.current_player_id === p.id) {
        await setCurrentPlayer(null);
      }
      showToast(`${p.player_name} marked as UNSOLD (moved to pass pool).`);
      loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to mark as unsold', 'error');
    } finally {
      setSaving(false);
    }
  }

  // Update amount & team for already sold player
  async function updateSoldPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!editPriceModal) return;
    setSaving(true);
    const targetPlayer = editPriceModal;
    const newPrice = parseFloat(editPriceForm.sold_price) || 0;
    const newTeamId = editPriceForm.team_id || targetPlayer.team_id;
    const assignedTeam = teams.find(t => String(t.id) === String(newTeamId));

    // Optimistically update player in local state
    setPlayers(prev => prev.map(p => {
      if (String(p.id) === String(targetPlayer.id)) {
        return {
          ...p,
          team_id: newTeamId,
          sold_price: newPrice,
          teams: assignedTeam || p.teams,
        };
      }
      return p;
    }));

    setEditPriceModal(null);
    setEditPriceForm({ team_id: '', sold_price: '' });

    try {
      await Promise.all([
        kplApi.updatePlayer(targetPlayer.id, {
          team_id: newTeamId,
          sold_price: newPrice,
          auction_eligible: 0,
        }),
        // Broadcast update to live in-memory store so spectator screen updates instantly
        kplApi.updateAuctionConfig({
          is_active: auctionConfig.is_active,
          current_player_id: auctionConfig.current_player_id,
          notes: auctionConfig.notes,
        }),
      ]);

      showToast(`Updated ${targetPlayer.player_name}: ₹${newPrice.toLocaleString('en-IN')}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update sold amount', 'error');
      loadData(true);
    } finally {
      setSaving(false);
    }
  }

  // Unassign sold player and return to pool
  async function unassignPlayer(p: Player) {
    // Optimistically update local player
    setPlayers(prev => prev.map(item => {
      if (String(item.id) === String(p.id)) {
        return {
          ...item,
          team_id: null,
          sold_price: null,
          auction_eligible: 1,
          teams: null,
        };
      }
      return item;
    }));

    try {
      await Promise.all([
        kplApi.updatePlayer(p.id, { team_id: null, sold_price: null, auction_eligible: 1 }),
        kplApi.updateAuctionConfig({
          is_active: auctionConfig.is_active,
          current_player_id: auctionConfig.current_player_id === p.id ? null : auctionConfig.current_player_id,
          notes: auctionConfig.notes,
        }),
      ]);
      showToast(`${p.player_name} unassigned and returned to auction pool.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to unassign player', 'error');
      loadData(true);
    }
  }

  const isRetainedOrOwner = (p: Player) => {
    const roleLower = (p.role || '').toLowerCase();
    const catLower = (p.player_category || '').toLowerCase();
    if (roleLower.includes('retain') || catLower.includes('retain') || roleLower.includes('owner')) {
      return true;
    }
    // Also check if player name matches team owner
    if (p.team_id) {
      const playerTeam = teams.find(t => String(t.id) === String(p.team_id));
      const ownerName = ((playerTeam as any)?.owner_name || (playerTeam as any)?.owner || '').trim().toLowerCase();
      if (ownerName && (p.player_name || '').trim().toLowerCase() === ownerName) {
        return true;
      }
    }
    return false;
  };

  const isEligible = (p: Player) =>
    (p.auction_eligible === true || p.auction_eligible === 1 || p.auction_eligible === '1') && !p.team_id && !isRetainedOrOwner(p);

  const eligible = players.filter(p => isEligible(p));
  const sold = players.filter(p => Boolean(p.team_id) && !isRetainedOrOwner(p));
  const disabled = players.filter(p => !isEligible(p) && !p.team_id && !isRetainedOrOwner(p));
  const currentPlayer = players.find(p => String(p.id) === String(auctionConfig.current_player_id));

  return (
    <AdminLayout>
      <div className="admin-page">
        {toast && (
          <div className={`admin-toast admin-toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0 }}><Gavel size={22} /> Auction Control Center</h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  background: auctionConfig.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                  border: auctionConfig.is_active ? '1px solid #22c55e' : '1px solid #64748b',
                  color: auctionConfig.is_active ? '#4ade80' : '#94a3b8',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: auctionConfig.is_active ? '#22c55e' : '#64748b',
                    boxShadow: auctionConfig.is_active ? '0 0 8px #22c55e' : 'none',
                    display: 'inline-block',
                  }}
                />
                {auctionConfig.is_active ? 'LIVE BROADCAST ON' : 'STANDBY MODE'}
              </span>
            </div>
            <p style={{ marginTop: 4 }}>
              Fully synced with the public live auction screen. Any changes made here reflect instantly at{' '}
              <Link href="/auction" target="_blank" style={{ color: 'var(--adm-emerald)', textDecoration: 'underline' }}>
                /auction
              </Link>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Live Screen Button */}
            <Link
              href="/auction"
              target="_blank"
              className="admin-btn admin-btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Open public live auction screen in new tab"
            >
              <ExternalLink size={14} /> Open Live Viewer
            </Link>

            {/* Print Team Details (Select Team or All) */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--adm-border)',
              borderRadius: 6,
              padding: '2px 6px'
            }}>
              <select
                value={selectedPrintTeamId}
                onChange={e => setSelectedPrintTeamId(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: 12,
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: 155,
                }}
                title="Select team to print: Team Name, Owner, Retain Player"
              >
                <option value="all" style={{ background: '#0f172a', color: '#fff' }}>
                  ★ All Franchises ({teams.length})
                </option>
                {teams.map(t => (
                  <option key={t.id} value={t.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {t.name} ({t.short_code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => {
                  if (selectedPrintTeamId === 'all') {
                    printTeamDetails(teams, players);
                  } else {
                    const chosen = teams.filter(t => String(t.id) === String(selectedPrintTeamId));
                    printTeamDetails(chosen, players);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 8px',
                  fontSize: 12,
                  color: '#60a5fa',
                  fontWeight: 600
                }}
                title="Print selected team details (Team Name, Owner, Retain Player)"
              >
                <Printer size={13} /> Print Details
              </button>
            </div>

            {/* Refresh Data */}
            <button
              className="admin-btn admin-btn-ghost"
              onClick={() => loadData(false)}
              disabled={loading || saving}
              title="Force sync data from server"
            >
              <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
            </button>

            {/* Live Toggle */}
            <button
              className={`admin-btn ${auctionConfig.is_active ? 'admin-btn-danger' : 'admin-btn-primary'}`}
              onClick={toggleAuctionSession}
              disabled={saving || loading}
            >
              {saving ? (
                <Loader2 size={15} className="spin" />
              ) : auctionConfig.is_active ? (
                <Square size={15} />
              ) : (
                <Play size={15} />
              )}
              {auctionConfig.is_active ? 'Stop Auction' : 'Go Live Now'}
            </button>
          </div>
        </div>

        {/* Standard Metric Overview Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserCheck size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Auction Pool</div>
              <div className="admin-stat-value">{eligible.length}</div>
              <div className="admin-stat-sub">Ready for bidding</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Trophy size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Players Sold</div>
              <div className="admin-stat-value">{sold.length}</div>
              <div className="admin-stat-sub">Assigned to franchises</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserX size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Disabled / Unsold</div>
              <div className="admin-stat-value">{disabled.length}</div>
              <div className="admin-stat-sub">Pass-out or unapproved</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <DollarSign size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Total Purse Spent</div>
              <div className="admin-stat-value">
                ₹{sold.reduce((acc, p) => acc + (Number(p.sold_price) || 0), 0).toLocaleString('en-IN')}
              </div>
              <div className="admin-stat-sub">Across all {teams.length} franchise teams</div>
            </div>
          </div>
        </div>

        {/* CURRENT PLAYER ON BLOCK SPOTLIGHT */}
        <div
          style={{
            background: auctionConfig.is_active && currentPlayer
              ? 'linear-gradient(135deg, rgba(232,25,44,0.12) 0%, rgba(245,200,66,0.08) 100%)'
              : 'var(--adm-surface)',
            border: auctionConfig.is_active && currentPlayer
              ? '2px solid rgba(232,25,44,0.45)'
              : '1px solid var(--adm-border)',
            borderRadius: 'var(--adm-radius-md)',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: auctionConfig.is_active && currentPlayer ? '0 0 25px rgba(232,25,44,0.15)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={16} color={auctionConfig.is_active ? '#e8192c' : 'var(--adm-text-muted)'} className={auctionConfig.is_active ? 'spin' : ''} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: auctionConfig.is_active ? '#ff4d5e' : 'var(--adm-text-muted)',
                }}
              >
                {auctionConfig.is_active ? 'Live Auction Block · Broadcasting Now' : 'Auction Block (Standby)'}
              </h3>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--adm-text-muted)' }} suppressHydrationWarning>
              {mounted && lastSyncTime ? `Auto-synced: ${lastSyncTime.toLocaleTimeString()}` : 'Connecting...'}
            </div>
          </div>

          {currentPlayer ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Photo thumbnail */}
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={currentPlayer.photo ? getImageUrl(currentPlayer.photo) : '/images/kpl-logo.jpg'}
                    alt={currentPlayer.player_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 17, color: 'var(--adm-text-primary)' }}>
                      {currentPlayer.player_name}
                    </strong>
                    <span
                      style={{
                        background: 'rgba(232,25,44,0.15)',
                        border: '1px solid rgba(232,25,44,0.4)',
                        color: '#ff4d5e',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      LIVE ON HAMMER
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                    {currentPlayer.role || 'Player'} {currentPlayer.age ? `· Age ${currentPlayer.age}` : ''}
                    {currentPlayer.player_category ? ` · ${currentPlayer.player_category.toUpperCase()}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#f5c842', fontWeight: 700, marginTop: 4 }}>
                    Base Price: ₹{Number(currentPlayer.base_price || 500).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => {
                    setSellModal(currentPlayer);
                    setSellForm({ team_id: '', sold_price: String(currentPlayer.base_price || 500) });
                  }}
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <Trophy size={14} /> Mark Sold (Hammer Down)
                </button>

                <button
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => markAsUnsold(currentPlayer)}
                  disabled={saving}
                  title="Mark as unsold and remove from block"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <UserX size={14} /> Pass / Unsold
                </button>

                <button
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  onClick={() => setCurrentPlayer(null)}
                  disabled={saving}
                  title="Clear block without changing status"
                >
                  Clear Block
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '16px 0',
                color: 'var(--adm-text-muted)',
                fontSize: 13,
              }}
            >
              {auctionConfig.is_active ? (
                <>
                  <span>No player is currently on the block.</span>{' '}
                  <strong style={{ color: 'var(--adm-text-primary)' }}>
                    Click &ldquo;Put on Block&rdquo; on any player in the pool below to begin bidding on live screen!
                  </strong>
                </>
              ) : (
                <span>
                  The auction is in Standby mode. Click <strong>&ldquo;Go Live Now&rdquo;</strong> to activate real-time bidding screen.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Sleek Search & Filter Toolbar */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 'var(--adm-radius-md)',
            padding: '8px 12px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              flex: '1 1 200px',
              minWidth: '160px',
              maxWidth: '320px',
              background: 'var(--adm-input-bg)',
              border: '1px solid var(--adm-border)',
              borderRadius: 'var(--adm-radius-sm)',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            <Search size={13} color="var(--adm-text-muted)" />
            <input
              type="text"
              placeholder="Search auction pool players..."
              value={playerSearch}
              onChange={e => setPlayerSearch(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--adm-text-primary)',
                fontSize: '12px',
                width: '100%',
              }}
            />
            {playerSearch && (
              <button
                type="button"
                onClick={() => setPlayerSearch('')}
                style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Counter */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--adm-text-muted)', flexShrink: 0 }}>
            <span>
              Pool: <strong style={{ color: '#4ade80' }}>{eligible.length}</strong>
            </span>
            <span>
              Sold: <strong style={{ color: '#38bdf8' }}>{sold.length}</strong>
            </span>
            <span>
              Total: <strong style={{ color: 'var(--adm-text-primary)' }}>{players.length}</strong>
            </span>
            {playerSearch && (
              <button
                type="button"
                onClick={() => setPlayerSearch('')}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* 3 Columns: Pool / Sold / Disabled */}
        {loading ? (
          <div className="admin-loading-rows">
            {[...Array(6)].map((_, i) => <div className="admin-skeleton-row" key={i} />)}
          </div>
        ) : (
          <div className="admin-auction-columns">
            {/* 1. Eligible pool */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-eligible" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={16} /> Pool ({eligible.filter(p => !playerSearch || p.player_name.toLowerCase().includes(playerSearch.toLowerCase())).length})
                </div>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Ready for Block</span>
              </div>
              {eligible.length === 0 ? (
                <div className="admin-empty-col">No eligible players in pool.</div>
              ) : (
                eligible
                  .filter(p => !playerSearch || p.player_name.toLowerCase().includes(playerSearch.toLowerCase()))
                  .map(p => {
                    const isCurrent = String(p.id) === String(auctionConfig.current_player_id);
                    return (
                      <div
                        key={p.id}
                        className={`admin-auction-player-card ${isCurrent ? 'admin-auction-current' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          {/* Mini avatar */}
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 6,
                              overflow: 'hidden',
                              background: '#222',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg'}
                              alt={p.player_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => {
                                (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                              }}
                            />
                          </div>

                          <div className="admin-auction-player-info" style={{ minWidth: 0, flex: 1 }}>
                            <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.player_name}
                            </strong>
                            <span>{p.role || '—'} {p.age ? `· Age ${p.age}` : ''}</span>
                            <span className="admin-base-price">Base: ₹{Number(p.base_price || 500).toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <div className="admin-auction-player-btns">
                          {/* Put on Block Button */}
                          <button
                            className={`dt-btn dt-btn-icon ${isCurrent ? 'admin-btn-primary' : ''}`}
                            title={isCurrent ? 'Currently live on block' : 'Broadcast on live screen block'}
                            onClick={() => setCurrentPlayer(isCurrent ? null : p.id)}
                            style={isCurrent ? { background: '#e8192c', color: '#fff', border: 'none' } : {}}
                          >
                            <Gavel size={13} />
                          </button>

                          {/* Quick Sell Modal */}
                          <button
                            className="dt-btn dt-btn-icon"
                            title="Mark sold directly"
                            onClick={() => {
                              setSellModal(p);
                              setSellForm({ team_id: '', sold_price: String(p.base_price || 500) });
                            }}
                          >
                            <Trophy size={13} />
                          </button>

                          {/* Disable / Pass */}
                          <button
                            className="dt-btn dt-btn-icon dt-btn-danger"
                            title="Disable or pass player"
                            onClick={() => toggleAuctionEligibility(p)}
                          >
                            <UserX size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* 2. Sold */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-sold" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trophy size={16} /> Sold ({sold.length})
                </div>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Allocated</span>
              </div>
              {sold.length === 0 ? (
                <div className="admin-empty-col">No sold players yet.</div>
              ) : (
                sold.map(p => (
                  <div key={p.id} className="admin-auction-player-card admin-auction-player-sold">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: '#222',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg'}
                          alt={p.player_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                          }}
                        />
                      </div>
                      <div className="admin-auction-player-info" style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.player_name}
                        </strong>
                        <span style={{ color: p.teams?.accent_color || '#34d399', fontWeight: 600 }}>
                          {p.teams?.name || 'Assigned Franchise'}
                        </span>
                        {p.sold_price && (
                          <span className="admin-sold-price">
                            Sold: ₹{Number(p.sold_price).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="admin-auction-player-btns">
                      <button
                        className="dt-btn dt-btn-icon"
                        title="Edit sold price or franchise team"
                        onClick={() => {
                          setEditPriceModal(p);
                          setEditPriceForm({
                            team_id: p.team_id || '',
                            sold_price: String(p.sold_price || ''),
                          });
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="dt-btn dt-btn-icon dt-btn-danger"
                        title="Unassign & return to pool"
                        onClick={() => unassignPlayer(p)}
                      >
                        <UserX size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 3. Disabled / Unsold */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-disabled" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserX size={16} /> Disabled / Pass ({disabled.length})
                </div>
                <span style={{ fontSize: 10, opacity: 0.8 }}>Inactive</span>
              </div>
              {disabled.length === 0 ? (
                <div className="admin-empty-col">No disabled players.</div>
              ) : (
                disabled.map(p => (
                  <div key={p.id} className="admin-auction-player-card admin-auction-player-disabled">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: '#222',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={p.photo ? getImageUrl(p.photo) : '/images/kpl-logo.jpg'}
                          alt={p.player_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                          }}
                        />
                      </div>
                      <div className="admin-auction-player-info" style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.player_name}
                        </strong>
                        <span>{p.role || '—'} {p.age ? `· Age ${p.age}` : ''}</span>
                      </div>
                    </div>
                    <button
                      className="dt-btn dt-btn-icon"
                      title="Re-enable to auction pool"
                      onClick={() => toggleAuctionEligibility(p)}
                    >
                      <UserCheck size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sell Player Modal */}
        {sellModal && (
          <div className="admin-modal-overlay" onClick={() => setSellModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Record Player Sale</h2>
              </div>
              <div className="admin-modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#111',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <img
                      src={sellModal.photo ? getImageUrl(sellModal.photo) : '/images/kpl-logo.jpg'}
                      alt={sellModal.player_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{sellModal.player_name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--adm-text-muted)' }}>
                      {sellModal.role || 'Player'} · Base Price: <strong>₹{Number(sellModal.base_price || 500).toLocaleString('en-IN')}</strong>
                    </p>
                  </div>
                </div>
              </div>
              <form className="admin-modal-form" onSubmit={sellPlayer}>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-full">
                    <label>Winning Franchise Team *</label>
                    <select
                      required
                      value={sellForm.team_id}
                      onChange={e => setSellForm({ ...sellForm, team_id: e.target.value })}
                    >
                      <option value="">Select franchise team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Final Sold Price (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={sellForm.sold_price}
                      onChange={e => setSellForm({ ...sellForm, sold_price: e.target.value })}
                      placeholder={`Base: ₹${sellModal.base_price || 500}`}
                    />

                    {/* Quick increment buttons for accurate bidding calculations */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {[50, 100, 200, 500, 1000].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(sellForm.sold_price) || Number(sellModal.base_price) || 0;
                            setSellForm({ ...sellForm, sold_price: String(cur + inc) });
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: 'var(--adm-text-primary)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          +{inc}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSellForm({ ...sellForm, sold_price: String(sellModal.base_price || 500) });
                        }}
                        style={{
                          background: 'rgba(245, 200, 66, 0.12)',
                          border: '1px solid rgba(245, 200, 66, 0.3)',
                          color: '#f5c842',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginLeft: 'auto',
                        }}
                      >
                        Base Price
                      </button>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSellModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={15} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Trophy size={14} /> Confirm Sale & Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Edit Sold Price Modal */}
        {editPriceModal && (
          <div className="admin-modal-overlay" onClick={() => setEditPriceModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2><Edit3 size={18} style={{ marginRight: 6 }} /> Edit Sold Amount & Team</h2>
              </div>
              <div className="admin-modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#111',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <img
                      src={editPriceModal.photo ? getImageUrl(editPriceModal.photo) : '/images/kpl-logo.jpg'}
                      alt={editPriceModal.player_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/kpl-logo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{editPriceModal.player_name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--adm-text-muted)' }}>
                      Current: <strong style={{ color: '#4ade80' }}>₹{Number(editPriceModal.sold_price || 0).toLocaleString('en-IN')}</strong> · Base: ₹{Number(editPriceModal.base_price || 500).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
              <form className="admin-modal-form" onSubmit={updateSoldPrice}>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-full">
                    <label>Assigned Franchise Team *</label>
                    <select
                      required
                      value={editPriceForm.team_id}
                      onChange={e => setEditPriceForm({ ...editPriceForm, team_id: e.target.value })}
                    >
                      <option value="">Select franchise team</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Updated Sold Amount (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      required
                      value={editPriceForm.sold_price}
                      onChange={e => setEditPriceForm({ ...editPriceForm, sold_price: e.target.value })}
                      placeholder="Enter new sold price"
                    />

                    {/* Quick increment buttons for precision bidding adjustments */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {[50, 100, 200, 500, 1000].map(inc => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const cur = parseFloat(editPriceForm.sold_price) || 0;
                            setEditPriceForm({ ...editPriceForm, sold_price: String(cur + inc) });
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: 'var(--adm-text-primary)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          +{inc}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditPriceForm({ ...editPriceForm, sold_price: String(editPriceModal.base_price || 500) });
                        }}
                        style={{
                          background: 'rgba(245, 200, 66, 0.12)',
                          border: '1px solid rgba(245, 200, 66, 0.3)',
                          color: '#f5c842',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginLeft: 'auto',
                        }}
                      >
                        Reset to Base
                      </button>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditPriceModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 size={15} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} /> Save & Broadcast Change
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
