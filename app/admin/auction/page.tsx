'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { kplApi } from '@/lib/api';
import {
  Gavel, Play, Square, UserCheck, UserX,
  CheckCircle2, AlertCircle, Loader2, Trophy, Users, DollarSign, Search, X
} from 'lucide-react';

interface Team { id: string; name: string; short_code: string; accent_color: string; }

interface Player {
  id: string;
  player_name: string;
  role: string;
  age: number | null;
  base_price: number;
  sold_price: number | null;
  auction_eligible: boolean;
  status: string;
  team_id: string | null;
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
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig>({ is_active: false, current_player_id: null, notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellModal, setSellModal] = useState<Player | null>(null);
  const [sellForm, setSellForm] = useState({ team_id: '', sold_price: '' });
  const [playerSearch, setPlayerSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        kplApi.getPlayers({ status: 'active', limit: 1000 }),
        kplApi.getTeams('active'),
      ]);
      setPlayers(pRes?.data || pRes || []);
      setTeams(tRes?.data || tRes || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load auction data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleAuctionSession() {
    setSaving(true);
    const newActive = !auctionConfig.is_active;
    setSaving(false);
    setAuctionConfig(c => ({ ...c, is_active: newActive }));
    showToast(`Auction session ${newActive ? 'started' : 'stopped'}.`);
  }

  async function setCurrentPlayer(playerId: string | null) {
    setAuctionConfig(c => ({ ...c, current_player_id: playerId }));
  }

  async function toggleAuctionEligibility(p: Player) {
    try {
      await kplApi.updatePlayer(p.id, { auction_eligible: !p.auction_eligible });
      showToast(`Player ${!p.auction_eligible ? 'enabled' : 'disabled'} for auction.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle eligibility', 'error');
    }
  }

  async function sellPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!sellModal) return;
    setSaving(true);
    try {
      await kplApi.updatePlayer(sellModal.id, {
        team_id: sellForm.team_id || null,
        sold_price: parseFloat(sellForm.sold_price) || 0,
        auction_eligible: false,
      });
      showToast(`${sellModal.player_name} sold!`);
      setSellModal(null);
      setSellForm({ team_id: '', sold_price: '' });
      if (auctionConfig.current_player_id === sellModal.id) {
        await setCurrentPlayer(null);
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to sell player', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function unassignPlayer(p: Player) {
    try {
      await kplApi.updatePlayer(p.id, { team_id: null, sold_price: null, auction_eligible: true });
      showToast('Player unassigned & returned to pool.');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to unassign player', 'error');
    }
  }

  const eligible = players.filter(p => p.auction_eligible && !p.team_id);
  const sold = players.filter(p => p.team_id);
  const disabled = players.filter(p => !p.auction_eligible && !p.team_id);
  const currentPlayer = players.find(p => p.id === auctionConfig.current_player_id);

  return (
    <AdminLayout>
      <div className="admin-page">
        {toast && (
          <div className={`admin-toast admin-toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        <div className="admin-page-header">
          <div>
            <h1><Gavel size={22} /> Auction Control</h1>
            <p>Manage the player auction — set eligibility, current player, and record sales.</p>
          </div>
          <button
            className={`admin-btn ${auctionConfig.is_active ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            onClick={toggleAuctionSession}
            disabled={saving || loading}
          >
            {saving ? <Loader2 size={15} className="spin" /> : auctionConfig.is_active ? <Square size={15} /> : <Play size={15} />}
            {auctionConfig.is_active ? 'Stop Auction' : 'Start Auction'}
          </button>
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
              <div className="admin-stat-sub">Players ready for bidding</div>
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
              <div className="admin-stat-sub">Inactive or pass-out pool</div>
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

        {/* Sleek Single-Line Search / Filter Toolbar */}
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

          {/* Session Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--adm-text-secondary)', flexShrink: 0 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: auctionConfig.is_active ? 'var(--adm-emerald)' : 'var(--adm-text-muted)',
                display: 'inline-block',
                boxShadow: auctionConfig.is_active ? '0 0 8px var(--adm-emerald)' : undefined,
              }}
            />
            <strong>{auctionConfig.is_active ? 'Live Auction Active' : 'Auction Session Inactive'}</strong>
          </div>

          {/* Counter & Reset */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--adm-text-muted)', flexShrink: 0 }}>
            <span>
              Total Roster: <strong style={{ color: 'var(--adm-text-primary)' }}>{players.length}</strong>
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

        {/* Current player on block */}
        {auctionConfig.is_active && (
          <div className="admin-current-player">
            <h3>Current Player on Block</h3>
            {currentPlayer ? (
              <div className="admin-current-player-card">
                <div className="admin-current-player-info">
                  <strong>{currentPlayer.player_name}</strong>
                  <span>{currentPlayer.role || '—'} {currentPlayer.age ? `· Age ${currentPlayer.age}` : ''}</span>
                  <span className="admin-base-price">Base: ₹{Number(currentPlayer.base_price).toLocaleString('en-IN')}</span>
                </div>
                <div className="admin-current-player-actions">
                  <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setSellModal(currentPlayer); setSellForm({ team_id: '', sold_price: '' }); }}>
                    <Trophy size={13} /> Mark Sold
                  </button>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setCurrentPlayer(null)}>
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <p className="admin-empty">No player selected. Click &quot;Set on Block&quot; below.</p>
            )}
          </div>
        )}

        {loading ? (
          <div className="admin-loading-rows">
            {[...Array(6)].map((_, i) => <div className="admin-skeleton-row" key={i} />)}
          </div>
        ) : (
          <div className="admin-auction-columns">
            {/* Eligible pool */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-eligible">
                <UserCheck size={16} /> Pool ({eligible.filter(p => !playerSearch || p.player_name.toLowerCase().includes(playerSearch.toLowerCase())).length})
              </div>
              {eligible.length === 0 ? (
                <div className="admin-empty-col">No eligible players.</div>
              ) : (
                eligible
                  .filter(p => !playerSearch || p.player_name.toLowerCase().includes(playerSearch.toLowerCase()))
                  .map(p => (
                  <div key={p.id} className={`admin-auction-player-card ${p.id === auctionConfig.current_player_id ? 'admin-auction-current' : ''}`}>
                    <div className="admin-auction-player-info">
                      <strong>{p.player_name}</strong>
                      <span>{p.role || '—'}</span>
                      {p.base_price > 0 && <span className="admin-base-price">₹{Number(p.base_price).toLocaleString('en-IN')}</span>}
                    </div>
                    <div className="admin-auction-player-btns">
                      {auctionConfig.is_active && p.id !== auctionConfig.current_player_id && (
                        <button className="dt-btn dt-btn-icon" title="Set on block" onClick={() => setCurrentPlayer(p.id)}>
                          <Gavel size={13} />
                        </button>
                      )}
                      <button className="dt-btn dt-btn-icon" title="Sell player" onClick={() => { setSellModal(p); setSellForm({ team_id: '', sold_price: '' }); }}>
                        <Trophy size={13} />
                      </button>
                      <button className="dt-btn dt-btn-icon dt-btn-danger" title="Disable for auction" onClick={() => toggleAuctionEligibility(p)}>
                        <UserX size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sold */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-sold">
                <Trophy size={16} /> Sold ({sold.length})
              </div>
              {sold.length === 0 ? (
                <div className="admin-empty-col">No sold players yet.</div>
              ) : (
                sold.map(p => (
                  <div key={p.id} className="admin-auction-player-card admin-auction-player-sold">
                    <div className="admin-auction-player-info">
                      <strong>{p.player_name}</strong>
                      <span style={{ color: p.teams?.accent_color }}>{p.teams?.name || '?'}</span>
                      {p.sold_price && <span className="admin-sold-price">₹{Number(p.sold_price).toLocaleString('en-IN')}</span>}
                    </div>
                    <button className="dt-btn dt-btn-icon" title="Unassign" onClick={() => unassignPlayer(p)}>
                      <UserX size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Disabled */}
            <div className="admin-auction-col">
              <div className="admin-auction-col-header admin-auction-col-disabled">
                <UserX size={16} /> Disabled ({disabled.length})
              </div>
              {disabled.length === 0 ? (
                <div className="admin-empty-col">No disabled players.</div>
              ) : (
                disabled.map(p => (
                  <div key={p.id} className="admin-auction-player-card admin-auction-player-disabled">
                    <div className="admin-auction-player-info">
                      <strong>{p.player_name}</strong>
                      <span>{p.role || '—'}</span>
                    </div>
                    <button className="dt-btn dt-btn-icon" title="Re-enable" onClick={() => toggleAuctionEligibility(p)}>
                      <UserCheck size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sell Modal */}
        {sellModal && (
          <div className="admin-modal-overlay" onClick={() => setSellModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Sell Player</h2>
              </div>
              <div className="admin-modal-body">
                <p>Record sale for <strong>{sellModal.player_name}</strong></p>
              </div>
              <form className="admin-modal-form" onSubmit={sellPlayer}>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-full">
                    <label>Sold to Team *</label>
                    <select required value={sellForm.team_id} onChange={e => setSellForm({ ...sellForm, team_id: e.target.value })}>
                      <option value="">Select team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Sold Price (₹) *</label>
                    <input type="number" min={0} required value={sellForm.sold_price} onChange={e => setSellForm({ ...sellForm, sold_price: e.target.value })} placeholder={`Base: ₹${sellModal.base_price}`} />
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setSellModal(null)}>Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? <><Loader2 size={15} className="spin" /> Selling...</> : <><Trophy size={14} /> Confirm Sale</>}
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
