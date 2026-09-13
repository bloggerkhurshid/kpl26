'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, CheckCircle2, AlertCircle, Shield,
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  short_code: string;
  owner: string;
  captain: string;
  color: string;
  accent_color: string;
  home_location: string;
  logo_url: string;
  status: string;
  created_at: string;
}

const EMPTY_FORM = { name: '', short_code: '', owner: '', captain: '', home_location: '', logo_url: '' };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Team | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadTeams() {
    setLoading(true);
    try {
      const res = await kplApi.getTeams('all');
      const data = res?.data || res || [];
      setTeams(data);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load teams', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTeams(); }, []);

  function openCreate() { setForm(EMPTY_FORM); setSelected(null); setModal('create'); }
  function openEdit(t: Team) { setForm({ name: t.name, short_code: t.short_code, owner: t.owner, captain: t.captain, home_location: t.home_location, logo_url: t.logo_url || '' }); setSelected(t); setModal('edit'); }
  function openDelete(t: Team) { setSelected(t); setModal('delete'); }

  async function saveTeam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    try {
      if (modal === 'create') {
        await kplApi.createTeam(payload);
      } else if (modal === 'edit' && selected) {
        await kplApi.updateTeam(selected.id, payload);
      }
      showToast(modal === 'create' ? 'Team created!' : 'Team updated!');
      setModal(null);
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to save team', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam() {
    if (!selected) return;
    setSaving(true);
    try {
      await kplApi.deleteTeam(selected.id);
      showToast('Team deleted.');
      setModal(null);
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete team', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(t: Team) {
    const newStatus = t.status === 'active' ? 'disabled' : 'active';
    try {
      await kplApi.updateTeam(t.id, { status: newStatus });
      showToast(`Team ${newStatus === 'active' ? 'enabled' : 'disabled'}.`);
      loadTeams();
    } catch (err: any) {
      showToast(err.message || 'Failed to update team status', 'error');
    }
  }

  const columns: Column<Team>[] = [
    {
      key: 'name', label: 'Team', sortable: true,
      render: t => (
        <div className="dt-team-cell">
          {t.logo_url ? (
            <img src={getImageUrl(t.logo_url)} alt={t.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'contain', background: '#fff' }} />
          ) : (
            <div className="dt-team-crest" style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0' }}>{t.short_code || t.name[0]}</div>
          )}
          <div>
            <div className="dt-team-name">{t.name}</div>
            <div className="dt-team-owner">{t.owner}</div>
          </div>
        </div>
      ),
    },
    { key: 'captain', label: 'Captain', sortable: true },
    { key: 'home_location', label: 'Location' },
    {
      key: 'status', label: 'Status',
      render: t => (
        <span className={`admin-status-badge admin-status-${t.status}`}>
          {t.status}
        </span>
      ),
    },
    {
      key: 'created_at', label: 'Registered',
      render: t => new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions', label: 'Actions',
      render: t => (
        <div className="dt-actions">
          <button className="dt-btn dt-btn-icon" title="Edit" onClick={() => openEdit(t)}><Edit2 size={14} /></button>
          <button className="dt-btn dt-btn-icon" title={t.status === 'active' ? 'Disable' : 'Enable'} onClick={() => toggleStatus(t)}>
            {t.status === 'active' ? <ToggleRight size={16} className="text-green" /> : <ToggleLeft size={16} />}
          </button>
          <button className="dt-btn dt-btn-icon dt-btn-danger" title="Delete" onClick={() => openDelete(t)}><Trash2 size={14} /></button>
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
            <h1><Shield size={22} /> Teams</h1>
            <p>Manage all KPL franchise teams.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Team
          </button>
        </div>

        <DataTable
          columns={columns}
          data={teams}
          loading={loading}
          searchKeys={['name', 'owner', 'captain', 'home_location']}
          searchPlaceholder="Search teams..."
          emptyMessage="No teams found. Create your first team!"
        />

        {/* Create/Edit Modal */}
        {(modal === 'create' || modal === 'edit') && (
          <div className="admin-modal-overlay" onClick={() => setModal(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>{modal === 'create' ? 'Create Team' : 'Edit Team'}</h2>
                <button onClick={() => setModal(null)}><X size={20} /></button>
              </div>
              <form className="admin-modal-form" onSubmit={saveTeam}>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                  {form.logo_url ? (
                    <img src={getImageUrl(form.logo_url)} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, background: '#fff', marginBottom: 10 }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>No Logo</div>
                  )}
                  <label className="admin-btn admin-btn-ghost" style={{ cursor: 'pointer', padding: '5px 10px', fontSize: 12 }}>
                    Upload Logo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => setForm(prev => ({ ...prev, logo_url: event.target?.result as string }));
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-full">
                    <label>Team Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Khoraghat Kings" />
                  </div>
                  <div className="admin-form-field">
                    <label>Short Code *</label>
                    <input type="text" maxLength={4} required value={form.short_code} onChange={e => setForm({ ...form, short_code: e.target.value.toUpperCase() })} placeholder="KK" />
                  </div>
                  <div className="admin-form-field">
                    <label>Owner</label>
                    <input type="text" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="Franchise owner" />
                  </div>
                  <div className="admin-form-field">
                    <label>Captain</label>
                    <input type="text" value={form.captain} onChange={e => setForm({ ...form, captain: e.target.value })} placeholder="Team captain" />
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Home Location</label>
                    <input type="text" value={form.home_location} onChange={e => setForm({ ...form, home_location: e.target.value })} placeholder="City / Town" />
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? <><Loader2 size={15} className="spin" /> Saving...</> : 'Save Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {modal === 'delete' && selected && (
          <div className="admin-modal-overlay" onClick={() => setModal(null)}>
            <div className="admin-modal admin-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Delete Team</h2>
                <button onClick={() => setModal(null)}><X size={20} /></button>
              </div>
              <div className="admin-modal-body">
                <p>Are you sure you want to delete <strong>{selected.name}</strong>? This action cannot be undone.</p>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={deleteTeam} disabled={saving}>
                  {saving ? <><Loader2 size={15} className="spin" /> Deleting...</> : 'Delete Team'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
