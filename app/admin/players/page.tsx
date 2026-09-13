'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { supabase } from '@/lib/supabase';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, CheckCircle2, AlertCircle, Users,
  UserCheck, UserX, Gavel, FileText, Printer
} from 'lucide-react';

interface Team { id: string; name: string; short_code: string; accent_color: string; }

interface Player {
  id: string;
  player_name: string;
  father_name: string;
  date_of_birth: string | null;
  age: number | null;
  present_address: string;
  address_proof: string | null;
  role: string;
  contact_number: string;
  email: string | null;
  photo: string | null;
  batsman?: boolean;
  batting_hand: string;
  wicket_keeper: boolean;
  player_category: string;
  previously_played: boolean;
  all_rounder: boolean;
  bowler: boolean;
  bowling_type: string;
  player_signature: string;
  declaration_accepted: boolean;
  approval: string;
  registration_number: string;
  registered_by: string;
  team_id: string | null;
  auction_eligible: boolean;
  base_price: number;
  sold_price: number | null;
  status: string;
  notes: string;
  created_at: string;
  teams?: Team | null;
}

const EMPTY_FORM = {
  player_name: '', father_name: '', date_of_birth: '', age: '', role: '',
  contact_number: '', email: '', present_address: '', address_proof: '', photo: '', batsman: false, batting_hand: '', wicket_keeper: false,
  player_category: '', previously_played: false, all_rounder: false, bowler: false,
  bowling_arm: '', bowling_style: '', bowling_type: '', player_signature: '', registration_number: '', registered_by: 'admin',
  team_id: '', auction_eligible: true, base_price: '50', status: 'active', notes: '',
};

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'view' | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterAuction, setFilterAuction] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData() {
    setLoading(true);
    const [{ data: playersData }, { data: teamsData }] = await Promise.all([
      supabase.from('players').select('*, teams(id,name,short_code,accent_color)').order('created_at', { ascending: false }),
      supabase.from('teams').select('id,name,short_code,accent_color').eq('status', 'active').order('name'),
    ]);
    setPlayers(playersData || []);
    setTeams(teamsData || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() { setForm(EMPTY_FORM); setSelected(null); setModal('create'); }
  function openEdit(p: Player) {
    setForm({
      player_name: p.player_name || '', father_name: p.father_name || '',
      date_of_birth: p.date_of_birth || '', age: p.age?.toString() || '',
      role: p.role || '', contact_number: p.contact_number || '', email: p.email || '',
      present_address: p.present_address || '',
      address_proof: p.address_proof || '',
      photo: p.photo || '', batsman: p.batsman || (p.batting_hand !== '' && p.batting_hand !== null), batting_hand: p.batting_hand || '', wicket_keeper: p.wicket_keeper || false,
      player_category: p.player_category || '', previously_played: p.previously_played || false,
      all_rounder: p.all_rounder || false, bowler: p.bowler || false, 
      bowling_arm: p.bowling_type ? (p.bowling_type.includes('Right Arm') ? 'Right Arm' : p.bowling_type.includes('Left Arm') ? 'Left Arm' : '') : '',
      bowling_style: p.bowling_type ? (p.bowling_type.includes('Pacer') ? 'Pacer' : p.bowling_type.includes('Spinner') ? 'Spinner' : '') : '',
      bowling_type: p.bowling_type || '',
      player_signature: p.player_signature || '', registration_number: p.registration_number || '',
      registered_by: p.registered_by || 'admin', team_id: p.team_id || '',
      auction_eligible: p.auction_eligible, base_price: p.base_price?.toString() || '0',
      status: p.status, notes: p.notes || '',
    });
    setSelected(p); setModal('edit');
  }
  function openView(p: Player) { setSelected(p); setModal('view'); }
  function openDelete(p: Player) { setSelected(p); setModal('delete'); }

  async function savePlayer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    // Auto generate reg number for admin creations if empty
    let regNum = form.registration_number;
    if (modal === 'create' && !regNum) {
      const { count } = await supabase.from('players').select('*', { count: 'exact', head: true });
      const nextSl = 1001 + (count || 0);
      regNum = `KPL-PLR-${nextSl}`;
    }

    // Parse age input intelligently
    let calculatedAge = null;
    const rawVal = parseInt(form.age, 10);
    if (!isNaN(rawVal)) {
      if (rawVal > 1900 && rawVal < 2026) {
        calculatedAge = 2026 - rawVal; // Entered birth year
      } else if (rawVal > 0 && rawVal < 100) {
        calculatedAge = rawVal; // Entered actual age
      }
    }

    const payload = {
      player_name: form.player_name,
      father_name: form.father_name,
      date_of_birth: form.date_of_birth || null,
      age: calculatedAge,
      role: form.role || null,
      contact_number: form.contact_number,
      email: form.email || null,
      present_address: form.present_address,
      address_proof: form.address_proof || null,
      photo: form.photo || null,
      batting_hand: form.batsman ? form.batting_hand : '',
      wicket_keeper: form.wicket_keeper,
      player_category: form.player_category,
      previously_played: form.previously_played,
      all_rounder: form.batsman && form.bowler,
      bowler: form.bowler,
      bowling_arm: form.bowling_arm,
      bowling_style: form.bowling_style,
      bowling_type: form.bowler ? `${form.bowling_arm} ${form.bowling_style}`.trim() : null,
      player_signature: form.player_signature || null,
      registration_number: regNum,
      registered_by: form.registered_by || 'admin',
      team_id: form.team_id || null,
      auction_eligible: form.auction_eligible,
      base_price: parseFloat(form.base_price) || 0,
      status: form.status,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    };
    
    let error;
    if (modal === 'create') ({ error } = await supabase.from('players').insert(payload));
    else if (modal === 'edit' && selected) ({ error } = await supabase.from('players').update(payload).eq('id', selected.id));
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else { showToast(modal === 'create' ? 'Player created!' : 'Player updated!'); setModal(null); loadData(); }
  }

  async function deletePlayer() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('players').delete().eq('id', selected.id);
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else { showToast('Player deleted.'); setModal(null); loadData(); }
  }

  async function toggleStatus(p: Player) {
    const newStatus = p.status === 'active' ? 'disabled' : 'active';
    const { error } = await supabase.from('players').update({ status: newStatus }).eq('id', p.id);
    if (error) showToast(error.message, 'error');
    else { showToast(`Player ${newStatus}.`); loadData(); }
  }

  async function toggleAuction(p: Player) {
    const { error } = await supabase.from('players').update({ auction_eligible: !p.auction_eligible }).eq('id', p.id);
    if (error) showToast(error.message, 'error');
    else { showToast(`Auction eligibility ${!p.auction_eligible ? 'enabled' : 'disabled'}.`); loadData(); }
  }

  async function unassignPlayer(p: Player) {
    const { error } = await supabase.from('players').update({ team_id: null, sold_price: null }).eq('id', p.id);
    if (error) showToast(error.message, 'error');
    else { showToast('Player unassigned from team.'); loadData(); }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setForm(prev => ({ ...prev, [field]: event.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const filtered = players.filter(p => {
    if (filterTeam && p.team_id !== filterTeam) return false;
    if (filterAuction === 'eligible' && !p.auction_eligible) return false;
    if (filterAuction === 'ineligible' && p.auction_eligible) return false;
    if (filterAuction === 'unassigned' && p.team_id) return false;
    return true;
  });

  const columns: Column<Player>[] = [
    {
      key: 'player_name', label: 'Player', sortable: true,
      render: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {p.photo ? <img src={p.photo} alt={p.player_name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />}
          <div>
            <div className="dt-player-name">{p.player_name}</div>
            <div className="dt-player-meta" style={{ fontSize: '11px', color: '#64748b' }}>
              {p.registration_number || 'No Reg #'} • {p.role || p.batting_hand || 'Unknown Role'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'team_id', label: 'Team',
      render: p => p.teams ? (
        <span className="dt-team-pill" style={{ borderColor: p.teams.accent_color }}>
          {p.teams.short_code}
        </span>
      ) : <span className="dt-no-team">Unassigned</span>,
    },
    {
      key: 'auction_eligible', label: 'Auction',
      render: p => (
        <button className={`admin-toggle-btn ${p.auction_eligible ? 'admin-toggle-on' : 'admin-toggle-off'}`} onClick={() => toggleAuction(p)}>
          <Gavel size={12} />
          {p.auction_eligible ? 'Eligible' : 'Disabled'}
        </button>
      ),
    },
    {
      key: 'base_price', label: 'Base Price',
      render: p => p.base_price > 0 ? `₹${Number(p.base_price).toLocaleString('en-IN')}` : '—',
    },
    {
      key: 'status', label: 'Status',
      render: p => <span className={`admin-status-badge admin-status-${p.status}`}>{p.status === 'pending' ? 'Pending' : p.status}</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: p => (
        <div className="dt-actions no-print">
          <button className="dt-btn dt-btn-icon" title="View details" onClick={() => openView(p)}><FileText size={14} /></button>
          <button className="dt-btn dt-btn-icon" title="Print details" onClick={() => window.open(`/admin/players/print/${p.id}`, '_blank')}><Printer size={14} /></button>
          <button className="dt-btn dt-btn-icon" title="Edit" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
          {p.team_id && (
            <button className="dt-btn dt-btn-icon" title="Unassign from team" onClick={() => unassignPlayer(p)}><UserX size={14} /></button>
          )}
          <button className="dt-btn dt-btn-icon" title={p.status === 'active' ? 'Disable' : 'Enable'} onClick={() => toggleStatus(p)}>
            {p.status === 'active' ? <ToggleRight size={16} className="text-green" /> : <ToggleLeft size={16} />}
          </button>
          <button className="dt-btn dt-btn-icon dt-btn-danger" title="Delete" onClick={() => openDelete(p)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

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
            <h1><Users size={22} /> Players</h1>
            <p>Manage player pool, detailed profiles, and team assignments.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Player
          </button>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            <option value="">All Teams</option>
            <option value="unassigned">Unassigned</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={filterAuction} onChange={e => setFilterAuction(e.target.value)}>
            <option value="">All Auction Status</option>
            <option value="eligible">Auction Eligible</option>
            <option value="ineligible">Auction Disabled</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <div className="admin-filter-count">
            <UserCheck size={14} /> {filtered.length} players
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          searchKeys={['player_name', 'registration_number', 'contact_number', 'email']}
          searchPlaceholder="Search players or reg ID..."
          emptyMessage="No players found."
        />

        {/* Create/Edit Modal */}
        {(modal === 'create' || modal === 'edit') && (
          <div className="admin-modal-overlay" onClick={() => setModal(null)}>
            <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{modal === 'create' ? 'Add Detailed Player' : 'Edit Player'}</h2>
                <button onClick={() => setModal(null)}><X size={20} /></button>
              </div>
              <form className="admin-modal-form" style={{ maxHeight: '70vh', overflowY: 'auto' }} onSubmit={savePlayer}>
                
                {/* 1. Basic Info */}
                <h4 style={{ margin: '10px 0', color: '#0f172a', textTransform: 'uppercase', fontSize: '13px' }}>1. Basic Info</h4>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label>Player Name *</label>
                    <input type="text" required value={form.player_name} onChange={e => setForm({ ...form, player_name: e.target.value })} placeholder="Full name" />
                  </div>
                  <div className="admin-form-field">
                    <label>Father's Name</label>
                    <input type="text" value={form.father_name} onChange={e => setForm({ ...form, father_name: e.target.value })} placeholder="Father's name" />
                  </div>
                  <div className="admin-form-field">
                    <label>Age / Year of Birth</label>
                    <input type="text" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="e.g. 22 or 2004" />
                  </div>
                  <div className="admin-form-field">
                    <label>Contact Number *</label>
                    <input type="tel" required value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} placeholder="+91 ..." />
                  </div>
                  <div className="admin-form-field">
                    <label>Email Address</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Present Address *</label>
                    <input type="text" required value={form.present_address} onChange={e => setForm({ ...form, present_address: e.target.value })} placeholder="Full address" />
                  </div>
                  <div className="admin-form-field">
                    <label>Photo</label>
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'photo')} />
                    {form.photo && <img src={form.photo} alt="Preview" style={{ marginTop: 8, width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />}
                  </div>
                </div>

                {/* 2. Cricket Profile */}
                <h4 style={{ margin: '20px 0 10px', color: '#0f172a', textTransform: 'uppercase', fontSize: '13px' }}>2. Cricket Profile</h4>
                <div className="admin-form-grid">
                  <div className="admin-form-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                    <label className="admin-checkbox-label"><input type="checkbox" checked={form.batsman} onChange={e => setForm({ ...form, batsman: e.target.checked })} /> Batsman</label>
                    {form.batsman && (
                      <div style={{ marginLeft: '24px', display: 'flex', gap: '15px' }}>
                        <label className="admin-checkbox-label"><input type="radio" name="admin_batting" checked={form.batting_hand === 'Right Hand'} onChange={() => setForm({...form, batting_hand: 'Right Hand'})} /> Right Hand</label>
                        <label className="admin-checkbox-label"><input type="radio" name="admin_batting" checked={form.batting_hand === 'Left Hand'} onChange={() => setForm({...form, batting_hand: 'Left Hand'})} /> Left Hand</label>
                      </div>
                    )}
                    
                    <label className="admin-checkbox-label"><input type="checkbox" checked={form.bowler} onChange={e => setForm({ ...form, bowler: e.target.checked })} /> Bowler</label>
                    {form.bowler && (
                      <div style={{ marginLeft: '24px', display: 'flex', gap: '15px' }}>
                        <label className="admin-checkbox-label"><input type="radio" name="admin_arm" checked={form.bowling_arm === 'Right Arm'} onChange={() => setForm({...form, bowling_arm: 'Right Arm'})} /> Right Arm</label>
                        <label className="admin-checkbox-label"><input type="radio" name="admin_arm" checked={form.bowling_arm === 'Left Arm'} onChange={() => setForm({...form, bowling_arm: 'Left Arm'})} /> Left Arm</label>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <label className="admin-checkbox-label"><input type="radio" name="admin_style" checked={form.bowling_style === 'Pacer'} onChange={() => setForm({...form, bowling_style: 'Pacer'})} /> Pacer</label>
                        <label className="admin-checkbox-label"><input type="radio" name="admin_style" checked={form.bowling_style === 'Spinner'} onChange={() => setForm({...form, bowling_style: 'Spinner'})} /> Spinner</label>
                      </div>
                    )}
                    
                    <label className="admin-checkbox-label"><input type="checkbox" checked={form.wicket_keeper} onChange={e => setForm({ ...form, wicket_keeper: e.target.checked })} /> Wicket Keeper</label>
                    <label className="admin-checkbox-label"><input type="checkbox" checked={form.previously_played} onChange={e => setForm({ ...form, previously_played: e.target.checked })} /> Played in previous KPL seasons</label>
                  </div>

                  <div className="admin-form-field">
                    <label>Player Category</label>
                    <select value={form.player_category} onChange={e => setForm({ ...form, player_category: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="Local">Local</option>
                      <option value="Foreign">Foreign</option>
                    </select>
                  </div>
                </div>

                {/* 3. Admin & Auction Controls */}
                <h4 style={{ margin: '20px 0 10px', color: '#0f172a', textTransform: 'uppercase', fontSize: '13px' }}>3. Admin Controls</h4>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label>Registered By</label>
                    <input type="text" value={form.registered_by} onChange={e => setForm({ ...form, registered_by: e.target.value })} placeholder="admin" />
                  </div>
                  <div className="admin-form-field">
                    <label>Assign to Team</label>
                    <select value={form.team_id} onChange={e => setForm({ ...form, team_id: e.target.value })}>
                      <option value="">Unassigned</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Base Price (₹)</label>
                    <input type="number" min={0} value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} placeholder="0" />
                  </div>
                  <div className="admin-form-field">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="pending">Pending (Review)</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-checkbox-label" style={{ marginTop: '24px' }}>
                      <input type="checkbox" checked={form.auction_eligible} onChange={e => setForm({ ...form, auction_eligible: e.target.checked })} />
                      Auction Eligible
                    </label>
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Notes</label>
                    <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal admin notes..." />
                  </div>
                </div>
                
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? <><Loader2 size={15} className="spin" /> Saving...</> : 'Save Player'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {modal === 'view' && selected && (
          <div className="admin-modal-overlay" onClick={() => setModal(null)}>
            <div className="admin-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Player Details: {selected.player_name}</h2>
                <button onClick={() => setModal(null)}><X size={20} /></button>
              </div>
              <div className="admin-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', gap: '32px' }}>
                
                {/* Left Side: Photos & Documents (50%) */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {selected.photo ? (
                    <img src={selected.photo} alt="Photo" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '4/5', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={64} color="#94a3b8" />
                    </div>
                  )}
                  
                  {selected.address_proof && (
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Address Proof</span>
                      <a href={selected.address_proof} target="_blank" rel="noopener noreferrer">
                        <img src={selected.address_proof} alt="Proof" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity='0.8'} onMouseOut={e => e.currentTarget.style.opacity='1'} />
                      </a>
                    </div>
                  )}

                  {selected.player_signature && (
                    <div>
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Player Signature</span>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <img src={selected.player_signature} alt="Signature" style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Information (50%) */}
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '28px' }}>{selected.player_name}</h3>
                    <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '15px' }}>Registration #: <strong style={{ color: '#0f172a' }}>{selected.registration_number || 'N/A'}</strong></p>
                    <p style={{ margin: '0 0 4px', color: '#64748b', fontSize: '15px' }}>Registered by: <strong style={{ color: '#0f172a' }}>{selected.registered_by}</strong></p>
                    <p style={{ margin: '0', color: '#64748b', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Status: <span className={`admin-status-badge admin-status-${selected.status}`}>{selected.status}</span>
                    </p>
                  </div>

                  <div>
                    <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', color: '#0f172a', fontSize: '16px' }}>Personal Info</h4>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Father's Name:</strong> <span>{selected.father_name || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Age:</strong> <span>{selected.age || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Contact:</strong> <span>{selected.contact_number}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Email:</strong> <span>{selected.email || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Address:</strong> <span>{selected.present_address || '—'}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', color: '#0f172a', fontSize: '16px' }}>Cricket Profile</h4>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Batting:</strong> <span>{selected.batting_hand || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Bowling:</strong> <span>{selected.bowling_type || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Category:</strong> <span>{selected.player_category || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Roles:</strong> <span>{[
                        selected.wicket_keeper ? 'WK' : '',
                        selected.all_rounder ? 'All-Rounder' : '',
                        selected.bowler ? 'Bowler' : '',
                        selected.batsman ? 'Batsman' : ''
                      ].filter(Boolean).join(', ') || '—'}</span></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}><strong style={{ color: '#64748b' }}>Played KPL:</strong> <span>{selected.previously_played ? 'Yes' : 'No'}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', color: '#0f172a', fontSize: '16px' }}>Legal & Declaration</h4>
                    <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}><strong style={{ color: '#64748b' }}>Declaration:</strong> <span>{selected.declaration_accepted ? 'Accepted ✅' : 'Not Accepted ❌'}</span></div>
                      {selected.approval && <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr' }}><strong style={{ color: '#64748b' }}>Approval:</strong> <span>{selected.approval}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer no-print">
                <button className="admin-btn admin-btn-ghost" onClick={() => window.open(`/admin/players/print/${selected.id}`, '_blank')}><Printer size={16} /> Print</button>
                <div style={{ flex: 1 }}></div>
                <button className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Close</button>
                <button className="admin-btn admin-btn-primary" onClick={() => { setModal('edit'); openEdit(selected); }}>Edit Player</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {modal === 'delete' && selected && (
          <div className="admin-modal-overlay" onClick={() => setModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Delete Player</h2>
                <button onClick={() => setModal(null)}><X size={20} /></button>
              </div>
              <div className="admin-modal-body">
                <p>Delete <strong>{selected.player_name}</strong>? This cannot be undone.</p>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={deletePlayer} disabled={saving}>
                  {saving ? <><Loader2 size={15} className="spin" /> Deleting...</> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
