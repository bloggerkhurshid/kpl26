'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, CheckCircle2, AlertCircle, Shield,
  CreditCard, Upload, Check, UserCheck, RefreshCw, Eye
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  short_code: string;
  owner?: string;
  owner_name?: string;
  owner_contact?: string;
  captain?: string;
  captain_name?: string;
  color?: string;
  accent_color?: string;
  home_location?: string;
  logo_url?: string;
  squad_count?: number;
  status: string;
  created_at: string;
}

const EMPTY_FORM = { name: '', short_code: '', owner: '', captain: '', home_location: '', logo_url: '' };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Team | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [proofModal, setProofModal] = useState<{
    url: string;
    title: string;
    meta?: string;
    team?: Team;
    payment?: any;
  } | null>(null);
  const [attachingScreenshot, setAttachingScreenshot] = useState(false);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadTeams(silent: boolean = false) {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      const [res, payRes] = await Promise.all([
        kplApi.getTeams('all'),
        kplApi.getPayments(500).catch(() => []),
      ]);
      const data = res?.data || res || [];
      const payData = payRes?.data || payRes || [];
      setTeams(data);
      setPayments(Array.isArray(payData) ? payData : []);
    } catch (err: any) {
      console.error(err);
      if (!silent) showToast(err.message || 'Failed to load teams', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => { loadTeams(); }, []);

  function openCreate() { setForm(EMPTY_FORM); setSelected(null); setModal('create'); }
  function openEdit(t: Team) {
    setForm({
      name: t.name,
      short_code: t.short_code,
      owner: t.owner_name || t.owner || '',
      captain: t.captain_name || t.captain || '',
      home_location: t.home_location || '',
      logo_url: t.logo_url || ''
    });
    setSelected(t);
    setModal('edit');
  }
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

  function getTeamPayment(t: Team) {
    if (!payments.length) return null;
    const cleanCode = (t.short_code || '').trim().toLowerCase();
    const cleanName = (t.name || '').trim().toLowerCase();
    const cleanPhone = (t.owner_contact || (t as any).phone || '').replace(/\D/g, '').slice(-10);

    return payments.find(pay => {
      const payReg = (pay.registration_id || '').trim().toLowerCase();
      const payPhone = (pay.phone || '').replace(/\D/g, '').slice(-10);
      const payName = (pay.name || '').trim().toLowerCase();

      if (payReg && (payReg === t.id || (cleanCode && payReg.includes(cleanCode)))) return true;
      if (cleanPhone && payPhone && cleanPhone === payPhone) return true;
      if (cleanName && payName && (payName === cleanName || payName.includes(cleanName) || cleanName.includes(payName))) return true;
      if (pay.registration_type === 'team' && cleanName && payReg.includes(cleanName)) return true;
      return false;
    }) || null;
  }

  function openTeamPaymentProof(t: Team) {
    const pay = getTeamPayment(t);
    const screenshot = pay?.screenshot || pay?.payment_proof || pay?.proof_url || '';
    setProofModal({
      url: screenshot,
      title: `Team Payment Proof — ${t.name}`,
      meta: pay ? `UTR: ${pay.payment_id || 'N/A'} • Amount: ₹${Number(pay.amount || 3999).toLocaleString('en-IN')} • Status: ${pay.status}` : `Franchise: ${t.name} (${t.short_code})`,
      team: t,
      payment: pay,
    });
  }

  const handleAttachScreenshotToTeamPayment = async (
    e: React.ChangeEvent<HTMLInputElement>,
    paymentId?: string,
    team?: Team
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxW = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = (maxW / w) * h;
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);

        setAttachingScreenshot(true);
        try {
          if (paymentId) {
            await kplApi.updatePaymentStatus(paymentId, 'pending_verification', compressed);
          } else if (team) {
            await kplApi.createPayment({
              registration_type: 'team',
              registration_id: team.id,
              name: team.owner_name || team.owner || team.name,
              phone: team.owner_contact || '',
              amount: 3999,
              payment_gateway: 'upi_direct',
              payment_id: `MANUAL-${team.short_code || 'TEAM'}-${Date.now().toString().slice(-6)}`,
              screenshot: compressed,
              status: 'pending_verification',
            });
          }
          showToast('Team payment screenshot attached successfully!');
          await loadTeams(true);
          setProofModal(prev => prev ? {
            ...prev,
            url: compressed,
            payment: prev.payment ? { ...prev.payment, screenshot: compressed } : { screenshot: compressed }
          } : null);
        } catch (err: any) {
          showToast(err.message || 'Failed to attach screenshot', 'error');
        } finally {
          setAttachingScreenshot(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  async function handleApproveTeamPayment(team: Team, payment?: any) {
    setSaving(true);
    try {
      if (payment?.id) {
        await kplApi.updatePaymentStatus(payment.id, 'completed');
      }
      await kplApi.updateTeam(team.id, { status: 'active' });
      showToast(`Team "${team.name}" payment verified and franchise activated!`);
      setProofModal(null);
      await loadTeams(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to verify team payment', 'error');
    } finally {
      setSaving(false);
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
            <div className="dt-team-owner">{t.owner_name || t.owner || 'No Owner Listed'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'captain',
      label: 'Captain',
      sortable: true,
      render: t => t.captain_name || t.captain || 'TBA',
    },
    {
      key: 'squad_count',
      label: 'Squad',
      render: t => (
        <span style={{ fontWeight: 600, color: '#10b981', fontSize: '12px' }}>
          {t.squad_count || 0} / 15
        </span>
      ),
    },
    { key: 'home_location', label: 'Location', render: t => t.home_location || 'Khoraghat' },
    {
      key: 'payment', label: 'Payment Proof',
      render: t => {
        const pay = getTeamPayment(t);
        const screenshot = pay?.screenshot || pay?.payment_proof || pay?.proof_url;
        if (screenshot) {
          return (
            <button
              type="button"
              onClick={() => openTeamPaymentProof(t)}
              className="admin-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Click to view payment proof / screenshot"
            >
              <img
                src={getImageUrl(screenshot)}
                alt="Receipt"
                style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }}
              />
              <span>View Proof ↗</span>
            </button>
          );
        }
        if (pay) {
          return (
            <button
              type="button"
              onClick={() => openTeamPaymentProof(t)}
              className="admin-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                color: pay.status === 'completed' ? '#10b981' : '#eab308',
                background: pay.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                border: `1px solid ${pay.status === 'completed' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Click to view recorded payment details"
            >
              <CreditCard size={12} />
              <span>{pay.status === 'completed' ? '₹3,999 Paid' : 'Verify UTR'}</span>
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={() => openTeamPaymentProof(t)}
            className="admin-btn admin-btn-ghost"
            style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--adm-text-muted)', border: '1px dashed var(--adm-border)' }}
            title="Attach payment receipt for this team"
          >
            + Attach
          </button>
        );
      },
    },
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
          <button className="dt-btn dt-btn-icon" title="View / Verify Payment" onClick={() => openTeamPaymentProof(t)}>
            <CreditCard size={14} color="#10b981" />
          </button>
          <button className="dt-btn dt-btn-icon" title="Edit" onClick={() => openEdit(t)}><Edit2 size={14} /></button>
          <button className="dt-btn dt-btn-icon" title={t.status === 'active' ? 'Disable' : 'Enable'} onClick={() => toggleStatus(t)}>
            {t.status === 'active' ? <ToggleRight size={16} className="text-green" /> : <ToggleLeft size={16} />}
          </button>
          <button className="dt-btn dt-btn-icon dt-btn-danger" title="Delete" onClick={() => openDelete(t)}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const teamPayments = payments.filter(p => p.registration_type === 'team');
  const verifiedTeamPayments = teamPayments.filter(p => p.status === 'completed' || p.status === 'success');
  const pendingTeamPayments = teamPayments.filter(p => p.status === 'pending_verification');
  const totalTeamFees = verifiedTeamPayments.reduce((acc, p) => acc + (Number(p.amount) || 3999), 0);
  const activeTeamsCount = teams.filter(t => t.status === 'active').length;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0 }}><Shield size={22} /> Teams</h1>
              {syncing && (
                <span className="admin-sync-indicator">
                  <RefreshCw size={11} className="spin" /> Syncing...
                </span>
              )}
            </div>
            <p style={{ marginTop: '4px' }}>Manage franchise teams, squad limits, owner details, and verify franchise registration payments.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Team
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Shield size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{teams.length}</div>
              <div className="admin-stat-label">Total Teams</div>
              <div className="admin-stat-sub">{activeTeamsCount} active franchises</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <UserCheck size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{activeTeamsCount}</div>
              <div className="admin-stat-label">Active Franchises</div>
              <div className="admin-stat-sub">{teams.length - activeTeamsCount} inactive / pending</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}>
              <CreditCard size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">₹{totalTeamFees.toLocaleString('en-IN')}</div>
              <div className="admin-stat-label">Team Fees Verified</div>
              <div className="admin-stat-sub">{verifiedTeamPayments.length} team payments confirmed</div>
            </div>
          </div>

          <div className="admin-stat-card" style={{ borderColor: pendingTeamPayments.length > 0 ? 'rgba(234, 179, 8, 0.4)' : undefined }}>
            <div className="admin-stat-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
              <AlertCircle size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value" style={{ color: pendingTeamPayments.length > 0 ? '#facc15' : undefined }}>{pendingTeamPayments.length}</div>
              <div className="admin-stat-label">Pending Verification</div>
              <div className="admin-stat-sub">{pendingTeamPayments.length > 0 ? 'Review franchise receipts' : 'All payments up to date'}</div>
            </div>
          </div>
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

        {/* Team Payment Proof Modal */}
        {proofModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setProofModal(null)}>
            <div className="admin-modal" style={{ maxWidth: '800px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={18} color="#10b981" />
                    {proofModal.title}
                  </h3>
                  {proofModal.meta && (
                    <p style={{ margin: '4px 0 0 26px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                      {proofModal.meta}
                    </p>
                  )}
                </div>
                <button onClick={() => setProofModal(null)} style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--adm-border)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                    Owner: <strong style={{ color: 'var(--adm-text-strong)' }}>{proofModal.team?.owner_name || proofModal.team?.owner || 'N/A'}</strong>
                  </span>
                  {proofModal.team?.owner_contact && (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      • Phone: {proofModal.team.owner_contact}
                    </span>
                  )}
                </div>

                <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', padding: '5px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={13} />
                  <span>{attachingScreenshot ? 'Attaching...' : 'Attach / Change Screenshot'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={attachingScreenshot}
                    onChange={(e) => handleAttachScreenshotToTeamPayment(e, proofModal.payment?.id, proofModal.team)}
                  />
                </label>
              </div>

              <div className="admin-modal-body" style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--adm-input-bg)', minHeight: '320px' }}>
                {!proofModal.url ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', maxWidth: '440px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#eab308' }}>
                      <CreditCard size={28} />
                    </div>
                    <h4 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '16px', fontWeight: 700 }}>Direct UPI Payment Recorded</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Transaction reference:
                    </p>
                    <div style={{ margin: '14px 0', padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid var(--adm-border)', fontFamily: 'monospace', fontSize: '13px', color: '#10b981', fontWeight: 700 }}>
                      {proofModal.payment?.payment_id || 'Pending manual verification'}
                    </div>
                    <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                      <Upload size={16} />
                      <span>{attachingScreenshot ? 'Attaching...' : 'Upload Payment Screenshot'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={attachingScreenshot}
                        onChange={(e) => handleAttachScreenshotToTeamPayment(e, proofModal.payment?.id, proofModal.team)}
                      />
                    </label>
                  </div>
                ) : (
                  <img
                    src={getImageUrl(proofModal.url)}
                    alt={proofModal.title}
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                  />
                )}
              </div>

              <div className="admin-modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div>
                  {proofModal.team && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      disabled={saving}
                      onClick={() => handleApproveTeamPayment(proofModal.team!, proofModal.payment)}
                    >
                      <UserCheck size={14} />
                      <span>{saving ? 'Verifying...' : 'Approve Team & Verify Payment'}</span>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {proofModal.url && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => {
                        if (proofModal.url.startsWith('data:')) {
                          try {
                            const arr = proofModal.url.split(',');
                            const mimeMatch = arr[0].match(/:(.*?);/);
                            const mime = mimeMatch ? mimeMatch[1] : 'image/png';
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                            const blob = new Blob([u8arr], { type: mime });
                            const blobUrl = URL.createObjectURL(blob);
                            window.open(blobUrl, '_blank');
                          } catch (e) {
                            window.open(proofModal.url, '_blank');
                          }
                        } else {
                          window.open(proofModal.url, '_blank');
                        }
                      }}
                    >
                      Open in New Tab ↗
                    </button>
                  )}
                  <button type="button" className="admin-btn admin-btn-primary" onClick={() => setProofModal(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

