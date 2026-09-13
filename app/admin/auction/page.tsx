'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import {
  Gavel, Play, Square, UserCheck, UserX,
  CheckCircle2, AlertCircle, Loader2, Trophy,
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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: playersData }, { data: teamsData }, { data: configData }] = await Promise.all([
      supabase.from('players').select('*, teams(id,name,short_code,accent_color)').eq('status', 'active').order('player_name'),
      supabase.from('teams').select('id,name,short_code,accent_color').eq('status', 'active').order('name'),
      supabase.from('auction_config').select('*').eq('id', 1).single(),
    ]);
    setPlayers(playersData || []);
    setTeams(teamsData || []);
    if (configData) setAuctionConfig(configData);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleAuctionSession() {
    setSaving(true);
    const newActive = !auctionConfig.is_active;
    const { error } = await supabase.from('auction_config').update({ is_active: newActive, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else { showToast(`Auction session ${newActive ? 'started' : 'stopped'}.`); setAuctionConfig(c => ({ ...c, is_active: newActive })); }
  }

  async function setCurrentPlayer(playerId: string | null) {
    const { error } = await supabase.from('auction_config').update({ current_player_id: playerId, updated_at: new Date().toISOString() }).eq('id', 1);
    if (error) showToast(error.message, 'error');
    else { setAuctionConfig(c => ({ ...c, current_player_id: playerId })); }
  }

  async function toggleAuctionEligibility(p: Player) {
    const { error } = await supabase.from('players').update({ auction_eligible: !p.auction_eligible }).eq('id', p.id);
    if (error) showToast(error.message, 'error');
    else { showToast(`Player ${!p.auction_eligible ? 'enabled' : 'disabled'} for auction.`); loadData(); }
  }

  async function sellPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!sellModal) return;
    setSaving(true);
    const { error } = await supabase.from('players').update({
      team_id: sellForm.team_id || null,
      sold_price: parseFloat(sellForm.sold_price) || 0,
      auction_eligible: false,
      updated_at: new Date().toISOString(),
    }).eq('id', sellModal.id);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else {
      showToast(`${sellModal.player_name} sold!`);
      setSellModal(null);
      setSellForm({ team_id: '', sold_price: '' });
      if (auctionConfig.current_player_id === sellModal.id) {
        await setCurrentPlayer(null);
      }
      loadData();
    }
  }

  async function unassignPlayer(p: Player) {
    const { error } = await supabase.from('players').update({ team_id: null, sold_price: null, auction_eligible: true }).eq('id', p.id);
    if (error) showToast(error.message, 'error');
    else { showToast('Player unassigned & returned to pool.'); loadData(); }
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

        {/* Auction status banner */}
        <div className={`admin-auction-banner ${auctionConfig.is_active ? 'admin-auction-live' : 'admin-auction-off'}`}>
          <div className="admin-auction-status">
            {auctionConfig.is_active ? (
              <><span className="live-dot" /> Auction Live</>
            ) : (
              <><Square size={14} /> Auction Stopped</>
            )}
          </div>
          <div className="admin-auction-stats">
            <span><UserCheck size={14} /> {eligible.length} in pool</span>
            <span><Trophy size={14} /> {sold.length} sold</span>
            <span><UserX size={14} /> {disabled.length} disabled</span>
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
                <UserCheck size={16} /> Pool ({eligible.length})
              </div>
              {eligible.length === 0 ? (
                <div className="admin-empty-col">No eligible players.</div>
              ) : (
                eligible.map(p => (
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
