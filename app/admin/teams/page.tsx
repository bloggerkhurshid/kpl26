'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, CheckCircle2, AlertCircle, Shield,
  CreditCard, Upload, Check, UserCheck, RefreshCw, Eye,
  Crown, Users, Star, Search, Sparkles
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
  const [players, setPlayers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [squadModal, setSquadModal] = useState<Team | null>(null);
  const [selected, setSelected] = useState<Team | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>('');
  const [captainMode, setCaptainMode] = useState<'select' | 'custom'>('select');
  const [squadSearch, setSquadSearch] = useState<string>('');
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

  function getTeamCaptainPlayer(team: Team) {
    if (!players || !players.length) return null;
    const squad = players.filter(p => String(p.team_id) === String(team.id));
    
    // 1. Check squad player whose role explicitly mentions captain
    const roleCaptain = squad.find(p => (p.role || '').toLowerCase().includes('captain'));
    if (roleCaptain) return roleCaptain;

    // 2. Check squad player matching captain name
    const capName = (team.captain_name || team.captain || '').trim().toLowerCase();
    if (capName) {
      const nameMatch = squad.find(p => (p.player_name || '').trim().toLowerCase() === capName);
      if (nameMatch) return nameMatch;

      // 3. Fallback to any registered player matching captain name
      const anyMatch = players.find(p => (p.player_name || '').trim().toLowerCase() === capName);
      if (anyMatch) return anyMatch;
    }

    return null;
  }

  async function handleMakeCaptain(team: Team, player: any) {
    setSaving(true);
    try {
      const cleanOldRole = (player.role || 'Player').replace(/captain\s*(&\s*)?/gi, '').trim();
      const newRole = cleanOldRole ? `Captain & ${cleanOldRole}` : 'Captain';

      // 1. Assign player to this team and set Captain role
      await kplApi.updatePlayer(player.id, {
        team_id: team.id,
        role: newRole,
      });

      // 2. Demote any other captain in this team to regular player role
      const otherCaptains = players.filter(p => 
        String(p.team_id) === String(team.id) && 
        p.id !== player.id && 
        (p.role || '').toLowerCase().includes('captain')
      );
      for (const other of otherCaptains) {
        const demotedRole = (other.role || 'Player').replace(/captain\s*(&\s*)?/gi, '').trim() || 'Player';
        await kplApi.updatePlayer(other.id, { role: demotedRole }).catch(() => {});
      }

      // 3. Update team captain_name attribute
      await kplApi.updateTeam(team.id, {
        captain_name: player.player_name,
      }).catch(() => {});

      // 4. Invalidate website caches so landing page & roster update immediately
      try {
        localStorage.removeItem('kpl_public_players_cache');
        localStorage.removeItem('kpl_home_cache');
      } catch (e) {}

      showToast(`⭐ ${player.player_name} is now appointed Captain of ${team.name}!`);
      await loadTeams(true);
      if (squadModal && squadModal.id === team.id) {
        setSquadModal({ ...team, captain_name: player.player_name, captain: player.player_name });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to appoint captain', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function loadTeams(silent: boolean = false) {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      const [res, payRes, playersRes] = await Promise.all([
        kplApi.getTeams('all'),
        kplApi.getPayments(500).catch(() => []),
        kplApi.getPlayers({ limit: 1000 }).catch(() => []),
      ]);
      const data = res?.data || res || [];
      const payData = payRes?.data || payRes || [];
      const playersData = playersRes?.data || playersRes || [];
      
      setTeams(data);
      setPayments(Array.isArray(payData) ? payData : []);
      setPlayers(Array.isArray(playersData) ? playersData : []);
    } catch (err: any) {
      console.error(err);
      if (!silent) showToast(err.message || 'Failed to load teams', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => { loadTeams(); }, []);

  function openCreate() { 
    setForm(EMPTY_FORM); 
    setSelectedCaptainId('');
    setCaptainMode('select');
    setSelected(null); 
    setModal('create'); 
  }

  function openEdit(t: Team) {
    const capPlayer = getTeamCaptainPlayer(t);
    const existingCaptainName = capPlayer ? capPlayer.player_name : (t.captain_name || t.captain || '');
    let matchedId = capPlayer ? String(capPlayer.id) : '';
    if (!matchedId && existingCaptainName && players.length > 0) {
      const match = players.find(p => (p.player_name || '').trim().toLowerCase() === existingCaptainName.trim().toLowerCase());
      if (match) matchedId = String(match.id);
    }
    setForm({
      name: t.name,
      short_code: t.short_code,
      owner: t.owner_name || t.owner || '',
      captain: existingCaptainName,
      home_location: t.home_location || '',
      logo_url: t.logo_url || ''
    });
    setSelectedCaptainId(matchedId);
    setCaptainMode('select');
    setSelected(t);
    setModal('edit');
  }

  function openDelete(t: Team) { setSelected(t); setModal('delete'); }

  async function saveTeam(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    try {
      let savedTeamId = selected?.id;
      if (modal === 'create') {
        const createRes = await kplApi.createTeam(payload);
        savedTeamId = createRes?.id || createRes?.data?.id;
      } else if (modal === 'edit' && selected) {
        await kplApi.updateTeam(selected.id, payload);
      }

      // If a player from the list was selected as captain, designate them properly
      const finalCaptainId = selectedCaptainId || (form.captain ? players.find(p => (p.player_name || '').trim().toLowerCase() === form.captain.trim().toLowerCase())?.id : null);
      if (finalCaptainId && savedTeamId) {
        const pickedPlayer = players.find(p => String(p.id) === String(finalCaptainId));
        if (pickedPlayer) {
          const currentTeamObj = { ...selected, id: savedTeamId, name: form.name } as Team;
          await handleMakeCaptain(currentTeamObj, pickedPlayer);
        }
      }

      // Invalidate public caches
      try {
        localStorage.removeItem('kpl_public_players_cache');
        localStorage.removeItem('kpl_home_cache');
      } catch (e) {}

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
            <div className="dt-team-crest">{t.short_code || t.name[0]}</div>
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
      render: t => {
        const capPlayer = getTeamCaptainPlayer(t);
        const capName = capPlayer ? capPlayer.player_name : (t.captain_name || t.captain || '');
        if (capPlayer) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {capPlayer.photo ? (
                <img src={getImageUrl(capPlayer.photo)} alt={capName} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(234,179,8,0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  <Crown size={14} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                  <span>{capName}</span>
                  <Crown size={12} color="#eab308" fill="#eab308" />
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{capPlayer.role?.replace(/captain\s*(&\s*)?/gi, '').trim() || 'Captain'}</span>
                  <button
                    type="button"
                    onClick={() => setSquadModal(t)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '10.5px' }}
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (capName) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '12.5px' }}>{capName}</span>
              <button
                type="button"
                onClick={() => setSquadModal(t)}
                className="admin-btn admin-btn-ghost"
                style={{ padding: '2px 6px', fontSize: '10.5px' }}
                title="Change or link player as captain"
              >
                Change
              </button>
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={() => setSquadModal(t)}
            className="admin-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#eab308',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <Crown size={12} />
            <span>+ Make Captain</span>
          </button>
        );
      },
    },
    {
      key: 'squad_count',
      label: 'Squad',
      render: t => {
        const teamPlayers = players.filter(p => String(p.team_id) === String(t.id));
        const count = teamPlayers.length || t.squad_count || 0;
        return (
          <button
            type="button"
            onClick={() => setSquadModal(t)}
            className="admin-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 9px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            title="View squad players and assign captain"
          >
            <Users size={12} />
            <span>{count} / 15 Players</span>
          </button>
        );
      },
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
            <div className="admin-stat-icon">
              <Shield size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Total Teams</div>
              <div className="admin-stat-value">{teams.length}</div>
              <div className="admin-stat-sub">{activeTeamsCount} active franchises</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserCheck size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Active Franchises</div>
              <div className="admin-stat-value">{activeTeamsCount}</div>
              <div className="admin-stat-sub">{teams.length - activeTeamsCount} inactive / pending</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <CreditCard size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Team Fees Verified</div>
              <div className="admin-stat-value">₹{totalTeamFees.toLocaleString('en-IN')}</div>
              <div className="admin-stat-sub">{verifiedTeamPayments.length} team payments confirmed</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ color: pendingTeamPayments.length > 0 ? '#facc15' : undefined }}>
              <AlertCircle size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Pending Verification</div>
              <div className="admin-stat-value">{pendingTeamPayments.length}</div>
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
                  <div className="admin-form-field admin-form-full">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <Crown size={14} color="#eab308" /> CAPTAIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setCaptainMode(m => m === 'select' ? 'custom' : 'select')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textDecoration: 'underline'
                        }}
                      >
                        {captainMode === 'select' ? '✏️ Enter Custom Name' : '👥 Select from Player List'}
                      </button>
                    </div>

                    {(() => {
                      const squadPlayers = selected ? players.filter(p => String(p.team_id) === String(selected.id)) : [];
                      const otherPlayers = players.filter(p => !selected || String(p.team_id) !== String(selected.id));
                      const currentCaptainPlayer = players.find(p => 
                        String(p.id) === String(selectedCaptainId) || 
                        (form.captain && (p.player_name || '').trim().toLowerCase() === form.captain.trim().toLowerCase())
                      );
                      const effectiveSelectVal = currentCaptainPlayer ? String(currentCaptainPlayer.id) : (form.captain ? '__custom_val__' : '');

                      return (
                        <div>
                          {captainMode === 'select' ? (
                            <select
                              id="team-captain-select"
                              value={effectiveSelectVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '__custom__') {
                                  setCaptainMode('custom');
                                } else if (!val) {
                                  setSelectedCaptainId('');
                                  setForm(prev => ({ ...prev, captain: '' }));
                                } else if (val === '__custom_val__') {
                                  // keep existing text value
                                } else {
                                  const found = players.find(p => String(p.id) === String(val));
                                  if (found) {
                                    setSelectedCaptainId(String(found.id));
                                    setForm(prev => ({ ...prev, captain: found.player_name }));
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: 'var(--adm-radius-sm)',
                                background: 'var(--adm-input-bg, #1e293b)',
                                border: '1px solid var(--adm-border, #334155)',
                                color: 'var(--adm-text-primary, #ffffff)',
                                fontSize: '13px',
                                outline: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="" style={{ background: '#0f172a', color: '#94a3b8' }}>
                                -- Select Captain from Registered Player List ({players.length} Players) --
                              </option>
                              {form.captain && !currentCaptainPlayer && (
                                <option value="__custom_val__" style={{ background: '#0f172a', color: '#facc15' }}>
                                  Current: {form.captain}
                                </option>
                              )}
                              {squadPlayers.length > 0 && (
                                <optgroup label="⭐ Current Squad Players" style={{ background: '#0f172a', color: '#facc15', fontWeight: 'bold' }}>
                                  {squadPlayers.map(p => (
                                    <option key={p.id} value={p.id} style={{ background: '#1e293b', color: '#ffffff', fontWeight: 'normal' }}>
                                      ⭐ {p.player_name} ({p.role || 'Player'}) • Reg: #{p.registration_number || p.id}
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              <optgroup label="👥 All Registered Players" style={{ background: '#0f172a', color: '#38bdf8', fontWeight: 'bold' }}>
                                {otherPlayers.map(p => (
                                  <option key={p.id} value={p.id} style={{ background: '#1e293b', color: '#ffffff', fontWeight: 'normal' }}>
                                    {p.player_name} ({p.role || 'Player'}) {p.team_name ? `• [${p.team_short_code || p.team_name}]` : '• [Available]'} • Reg: #{p.registration_number || p.id}
                                  </option>
                                ))}
                              </optgroup>
                              <option value="__custom__" style={{ background: '#0f172a', color: '#a78bfa' }}>
                                ✏️ Custom name (enter manually)...
                              </option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={form.captain}
                              onChange={e => {
                                setForm({ ...form, captain: e.target.value });
                                setSelectedCaptainId('');
                              }}
                              placeholder="Type captain name"
                              autoFocus
                            />
                          )}

                          {currentCaptainPlayer && (
                            <div style={{
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '6px 12px',
                              background: 'rgba(234, 179, 8, 0.12)',
                              border: '1px solid rgba(234, 179, 8, 0.35)',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', background: '#334155', flexShrink: 0 }}>
                                {currentCaptainPlayer.photo_url ? (
                                  <img src={getImageUrl(currentCaptainPlayer.photo_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#eab308' }}>
                                    {currentCaptainPlayer.player_name?.slice(0, 1)}
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <strong style={{ color: '#facc15' }}>👑 {currentCaptainPlayer.player_name}</strong>
                                <span style={{ color: 'var(--adm-text-secondary)', marginLeft: '6px' }}>
                                  ({currentCaptainPlayer.role || 'Player'}) • Reg #{currentCaptainPlayer.registration_number || 'N/A'}
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Designated Captain</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
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

        {/* Squad & Captain Management Modal */}
        {squadModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }} onClick={() => { setSquadModal(null); setSquadSearch(''); }}>
            <div
              className="admin-modal"
              style={{ maxWidth: '820px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {squadModal.logo_url ? (
                    <img src={getImageUrl(squadModal.logo_url)} alt={squadModal.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'contain', background: '#fff' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${squadModal.accent_color || squadModal.color || '#10b981'}25`, border: `1.5px solid ${squadModal.accent_color || squadModal.color || '#10b981'}`, color: squadModal.accent_color || squadModal.color || '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                      {squadModal.short_code}
                    </div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {squadModal.name}
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: `${squadModal.accent_color || squadModal.color || '#10b981'}20`, color: squadModal.accent_color || squadModal.color || '#10b981', border: `1px solid ${squadModal.accent_color || squadModal.color || '#10b981'}60` }}>
                        {squadModal.short_code}
                      </span>
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                      Owner: {squadModal.owner_name || squadModal.owner || 'Franchise Management'} • Squad & Captain Roster
                    </p>
                  </div>
                </div>
                <button onClick={() => { setSquadModal(null); setSquadSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="admin-modal-body" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {/* Captain Banner */}
                {(() => {
                  const currentCapPlayer = getTeamCaptainPlayer(squadModal);
                  const currentCapName = currentCapPlayer ? currentCapPlayer.player_name : (squadModal.captain_name || squadModal.captain || '');

                  return (
                    <div style={{
                      background: currentCapName ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(15, 23, 42, 0.8))' : 'rgba(255, 255, 255, 0.03)',
                      border: currentCapName ? '1.5px solid rgba(234, 179, 8, 0.4)' : '1px dashed var(--adm-border)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {currentCapPlayer?.photo ? (
                          <img src={getImageUrl(currentCapPlayer.photo)} alt={currentCapName} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #eab308' }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(234, 179, 8, 0.2)', border: '2px solid #eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                            <Crown size={24} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#eab308', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Crown size={12} fill="#eab308" /> Team Captain
                          </div>
                          <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                            {currentCapName || 'No Captain Appointed'}
                          </div>
                          {currentCapPlayer && (
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              {currentCapPlayer.role?.replace(/captain\s*(&\s*)?/gi, '').trim() || 'Player'} • ID: {currentCapPlayer.registration_number || 'N/A'} • {currentCapPlayer.contact_number || ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {currentCapName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                            👑 Leading {squadModal.short_code}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Section 1: Assigned Team Squad Players */}
                {(() => {
                  const squadPlayers = players.filter(p => String(p.team_id) === String(squadModal.id));
                  const currentCapPlayer = getTeamCaptainPlayer(squadModal);

                  return (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={15} color="#10b981" /> Current Squad Players ({squadPlayers.length} / 15)
                        </h3>
                        <span style={{ fontSize: '11.5px', color: 'var(--adm-text-muted)' }}>
                          Click &quot;Make Captain&quot; to designate captain from squad
                        </span>
                      </div>

                      {squadPlayers.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--adm-border)', color: 'var(--adm-text-muted)', fontSize: '13px' }}>
                          No players currently assigned to this team. You can assign and appoint a captain from the registered players list below!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {squadPlayers.map((p, idx) => {
                            const isCaptain = (currentCapPlayer && currentCapPlayer.id === p.id) || (p.role || '').toLowerCase().includes('captain');

                            return (
                              <div
                                key={p.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  background: isCaptain ? 'rgba(234, 179, 8, 0.08)' : 'var(--adm-input-bg)',
                                  border: isCaptain ? '1.5px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--adm-border)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, width: '18px' }}>
                                    #{idx + 1}
                                  </span>
                                  {p.photo ? (
                                    <img src={getImageUrl(p.photo)} alt={p.player_name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                                      {p.player_name?.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>{p.player_name}</span>
                                      {isCaptain && <Crown size={13} color="#eab308" fill="#eab308" title="Team Captain" />}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                      {p.role?.replace(/captain\s*(&\s*)?/gi, '').trim() || 'Player'} • ID: {p.registration_number || 'N/A'} • {p.contact_number || 'No phone'}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  {isCaptain ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid #eab308', color: '#eab308', fontWeight: 800, fontSize: '12px' }}>
                                      <Crown size={13} fill="#eab308" /> Current Captain
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => handleMakeCaptain(squadModal, p)}
                                      className="admin-btn"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        background: 'rgba(234, 179, 8, 0.12)',
                                        border: '1px solid rgba(234, 179, 8, 0.45)',
                                        color: '#eab308',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <Crown size={12} />
                                      <span>Make Captain</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Section 2: Appoint Captain from All Other Registered Players */}
                {(() => {
                  const otherPlayers = players.filter(p => String(p.team_id) !== String(squadModal.id));
                  const query = squadSearch.trim().toLowerCase();
                  const filteredOthers = query
                    ? otherPlayers.filter(p =>
                        (p.player_name || '').toLowerCase().includes(query) ||
                        (p.registration_number || '').toLowerCase().includes(query) ||
                        (p.contact_number || '').includes(query) ||
                        (p.role || '').toLowerCase().includes(query)
                      )
                    : otherPlayers.slice(0, 8);

                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkles size={15} color="#eab308" /> Appoint Captain from All Registered Players
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-muted)' }}>
                          {otherPlayers.length} registered players available
                        </span>
                      </div>

                      {/* Search Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--adm-input-bg)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '6px 12px', marginBottom: '12px' }}>
                        <Search size={14} color="var(--adm-text-muted)" />
                        <input
                          type="text"
                          placeholder="Search any player by name, ID, phone..."
                          value={squadSearch}
                          onChange={e => setSquadSearch(e.target.value)}
                          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '12.5px', width: '100%' }}
                        />
                        {squadSearch && (
                          <button type="button" onClick={() => setSquadSearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Players List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                        {filteredOthers.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                            No matching players found.
                          </div>
                        ) : (
                          filteredOthers.map(p => (
                            <div
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: 'var(--adm-input-bg)',
                                border: '1px solid var(--adm-border)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {p.photo ? (
                                  <img src={getImageUrl(p.photo)} alt={p.player_name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                                    {p.player_name?.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#fff' }}>
                                    {p.player_name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                    {p.role || 'Player'} • ID: {p.registration_number || 'N/A'} {p.team_name ? `• Currently in ${p.team_short_code || p.team_name}` : '• Unassigned'}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleMakeCaptain(squadModal, p)}
                                className="admin-btn admin-btn-primary"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '11.5px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                }}
                              >
                                <Crown size={12} />
                                <span>Assign & Make Captain</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--adm-border)' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => { setSquadModal(null); setSquadSearch(''); }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

