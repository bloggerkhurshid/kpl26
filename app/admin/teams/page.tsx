'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, CheckCircle2, AlertCircle, Shield,
  CreditCard, Upload, Check, UserCheck, RefreshCw, Eye,
  Crown, Users, Star, Search, Sparkles, UserPlus, Award, Printer, Coins
} from 'lucide-react';
import { printTeamDetails } from '@/lib/printRoster';

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
  budget?: number | string;
  spent?: number | string;
  squad_count?: number;
  status: string;
  created_at: string;
}

const EMPTY_FORM = { name: '', short_code: '', owner: '', captain: '', home_location: '', logo_url: '', budget: '100000' };

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [squadModal, setSquadModal] = useState<Team | null>(null);
  const [coinModal, setCoinModal] = useState<Team | null>(null);
  const [coinAmount, setCoinAmount] = useState<string>('');
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
  const [selectedPrintTeamId, setSelectedPrintTeamId] = useState<string>('all');
  const [printModalOpen, setPrintModalOpen] = useState(false);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getTeamCaptainPlayer(team: Team) {
    if (!players || !players.length) return null;
    const squad = players.filter(p => String(p.team_id) === String(team.id));
    
    // 1. Check squad player whose role explicitly mentions retain or captain
    const roleRetainOrCap = squad.find(p => (p.role || '').toLowerCase().includes('retain') || (p.role || '').toLowerCase().includes('captain'));
    if (roleRetainOrCap) return roleRetainOrCap;

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

  function getTeamRetainPlayer(team: Team) {
    if (!players || !players.length) return null;
    const squad = players.filter(p => String(p.team_id) === String(team.id));
    return squad.find(p => (p.role || '').toLowerCase().includes('retain') || (p.player_category || '').toLowerCase().includes('retain')) || null;
  }

  function getTeamOwnerPlayer(team: Team) {
    if (!players || !players.length) return null;
    const squad = players.filter(p => String(p.team_id) === String(team.id));
    const ownerName = (team.owner_name || team.owner || '').trim().toLowerCase();
    return squad.find(p => (p.role || '').toLowerCase().includes('owner') || (ownerName && (p.player_name || '').trim().toLowerCase() === ownerName)) || null;
  }

  async function handleSetRetainedPlayer(team: Team, player: any) {
    setSaving(true);
    try {
      const isAlreadyRetain = (player.role || '').toLowerCase().includes('retain');
      const cleanOldRole = (player.role || 'Player')
        .replace(/retained?\s*(player)?\s*(&\s*)?/gi, '')
        .replace(/owner\s*(&\s*)?/gi, '')
        .trim() || 'Player';
      const newRole = isAlreadyRetain ? cleanOldRole : `Retained Player & ${cleanOldRole}`;

      // 1. Assign player to this team, set Retained role, and fix sold_price = 1500 (or clear if demoted)
      await kplApi.updatePlayer(player.id, {
        team_id: team.id,
        role: newRole,
        sold_price: isAlreadyRetain ? 0 : 1500,
        auction_eligible: 0,
      });

      // 2. Clear any other retain OR playing owner in this team (Strict Rule: Just 1 per team — Retain OR Owner)
      if (!isAlreadyRetain) {
        const others = players.filter(p => 
          String(p.team_id) === String(team.id) && 
          p.id !== player.id && 
          ((p.role || '').toLowerCase().includes('retain') || (p.role || '').toLowerCase().includes('owner'))
        );
        for (const other of others) {
          const demotedRole = (other.role || 'Player')
            .replace(/retained?\s*(player)?\s*(&\s*)?/gi, '')
            .replace(/owner\s*(&\s*)?/gi, '')
            .trim() || 'Player';
          await kplApi.updatePlayer(other.id, { role: demotedRole, sold_price: 0 }).catch(() => {});
        }

        // Update team captain_name / retain attribute
        await kplApi.updateTeam(team.id, {
          captain_name: player.player_name,
        }).catch(() => {});
      }

      // 3. Clear public caches
      try {
        localStorage.removeItem('kpl_public_players_cache');
        localStorage.removeItem('kpl_home_cache');
      } catch (e) {}

      showToast(isAlreadyRetain ? `${player.player_name} is no longer retained.` : `💎 ${player.player_name} set as Retained Player (₹1,500) for ${team.name}!`);
      await loadTeams(true);
      if (squadModal && squadModal.id === team.id) {
        setSquadModal({ ...team, captain_name: player.player_name, captain: player.player_name });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update retained player', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetOwnerPlayer(team: Team, player: any) {
    setSaving(true);
    try {
      const isAlreadyOwner = (player.role || '').toLowerCase().includes('owner');
      const cleanOldRole = (player.role || 'Player')
        .replace(/owner\s*(&\s*)?/gi, '')
        .replace(/retained?\s*(player)?\s*(&\s*)?/gi, '')
        .trim() || 'Player';
      const newRole = isAlreadyOwner ? cleanOldRole : `Owner & ${cleanOldRole}`;

      // Assign to team as playing owner (sold_price = 0, playing owner does not cost 1500 retain fee)
      await kplApi.updatePlayer(player.id, {
        team_id: team.id,
        role: newRole,
        sold_price: 0,
        auction_eligible: 0,
      });

      // Clear any other retain OR playing owner in this team (Strict Rule: Just 1 per team — Retain OR Owner)
      if (!isAlreadyOwner) {
        const others = players.filter(p => 
          String(p.team_id) === String(team.id) && 
          p.id !== player.id && 
          ((p.role || '').toLowerCase().includes('retain') || (p.role || '').toLowerCase().includes('owner'))
        );
        for (const other of others) {
          const demotedRole = (other.role || 'Player')
            .replace(/owner\s*(&\s*)?/gi, '')
            .replace(/retained?\s*(player)?\s*(&\s*)?/gi, '')
            .trim() || 'Player';
          await kplApi.updatePlayer(other.id, { role: demotedRole, sold_price: 0 }).catch(() => {});
        }

        await kplApi.updateTeam(team.id, {
          owner: player.player_name,
          owner_name: player.player_name,
          captain_name: player.player_name,
        }).catch(() => {});
      }

      try {
        localStorage.removeItem('kpl_public_players_cache');
        localStorage.removeItem('kpl_home_cache');
      } catch (e) {}

      showToast(isAlreadyOwner ? `${player.player_name} is no longer playing owner.` : `👑 ${player.player_name} is registered as Playing Owner of ${team.name}!`);
      await loadTeams(true);
      if (squadModal && squadModal.id === team.id) {
        setSquadModal({ ...team, owner: isAlreadyOwner ? '' : player.player_name, owner_name: isAlreadyOwner ? '' : player.player_name, captain_name: isAlreadyOwner ? '' : player.player_name });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update playing owner', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRetainOrOwner(team: Team) {
    setSaving(true);
    try {
      const teamPlayers = players.filter(p => String(p.team_id) === String(team.id));
      const targets = teamPlayers.filter(p => 
        (p.role || '').toLowerCase().includes('retain') ||
        (p.role || '').toLowerCase().includes('owner') ||
        (p.role || '').toLowerCase().includes('captain') ||
        Number(p.sold_price) === 1500
      );

      for (const p of targets) {
        const cleanRole = (p.role || 'Player')
          .replace(/retained?\s*(player)?\s*(&\s*)?/gi, '')
          .replace(/owner\s*(&\s*)?/gi, '')
          .replace(/captain\s*(&\s*)?/gi, '')
          .trim() || 'Player';
        await kplApi.updatePlayer(p.id, {
          role: cleanRole,
          sold_price: 0,
        }).catch(() => {});
      }

      await kplApi.updateTeam(team.id, {
        captain_name: '',
        captain: '',
      }).catch(() => {});

      try {
        localStorage.removeItem('kpl_public_players_cache');
        localStorage.removeItem('kpl_home_cache');
      } catch (e) {}

      showToast(`Removed retained / playing owner from ${team.name}.`);
      await loadTeams(true);
      if (squadModal && squadModal.id === team.id) {
        setSquadModal({ ...team, captain_name: '', captain: '' });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleMakeCaptain(team: Team, player: any) {
    setSaving(true);
    try {
      const cleanOldRole = (player.role || 'Player').replace(/captain\s*(&\s*)?/gi, '').trim();
      const newRole = cleanOldRole ? `Retained Player & ${cleanOldRole}` : 'Retained Player';

      // 1. Assign player to this team and set Retained role with ₹1,500 cost
      await kplApi.updatePlayer(player.id, {
        team_id: team.id,
        role: newRole,
        sold_price: 1500,
        auction_eligible: 0,
      });

      // 2. Demote any other retain/captain in this team to regular player role
      const otherCaptains = players.filter(p => 
        String(p.team_id) === String(team.id) && 
        p.id !== player.id && 
        ((p.role || '').toLowerCase().includes('captain') || (p.role || '').toLowerCase().includes('retain'))
      );
      for (const other of otherCaptains) {
        const demotedRole = (other.role || 'Player').replace(/captain\s*(&\s*)?/gi, '').replace(/retained?\s*(player)?\s*(&\s*)?/gi, '').trim() || 'Player';
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

      showToast(`💎 ${player.player_name} appointed as Retained Player (₹1,500) for ${team.name}!`);
      await loadTeams(true);
      if (squadModal && squadModal.id === team.id) {
        setSquadModal({ ...team, captain_name: player.player_name, captain: player.player_name });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to appoint retained player', 'error');
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
      logo_url: t.logo_url || '',
      budget: String(t.budget ?? 100000)
    });
    setSelectedCaptainId(matchedId);
    setCaptainMode('select');
    setSelected(t);
    setModal('edit');
  }

  function openCoinModal(t: Team) {
    setCoinModal(t);
    setCoinAmount(String(t.budget ?? 100000));
  }

  async function handleSaveCoins(e: React.FormEvent) {
    e.preventDefault();
    if (!coinModal) return;
    setSaving(true);
    const newCoins = parseFloat(coinAmount) || 0;
    try {
      await kplApi.updateTeam(coinModal.id, { budget: newCoins });
      showToast(`Updated coins for ${coinModal.name}: ₹${newCoins.toLocaleString('en-IN')}`);
      setCoinModal(null);
      loadTeams(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update coins', 'error');
    } finally {
      setSaving(false);
    }
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
      label: 'Retained & Owner',
      sortable: true,
      render: t => {
        const retainPlayer = getTeamRetainPlayer(t) || getTeamCaptainPlayer(t);
        const ownerPlayer = getTeamOwnerPlayer(t);
        const retainName = retainPlayer ? retainPlayer.player_name : (t.captain_name || t.captain || '');
        const ownerName = t.owner_name || t.owner || '';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* Retain player */}
            {retainPlayer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', background: 'rgba(245, 200, 66, 0.15)', color: '#f5c842', border: '1px solid rgba(245, 200, 66, 0.35)', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                  RETAIN ₹1.5k
                </span>
                <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#f8fafc' }}>{retainName}</span>
                <button
                  type="button"
                  onClick={() => setSquadModal(t)}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '10.5px' }}
                >
                  Change
                </button>
              </div>
            ) : retainName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#f5c842' }}>Retain:</span>
                <span style={{ fontWeight: 600, fontSize: '12px' }}>{retainName}</span>
                <button
                  type="button"
                  onClick={() => setSquadModal(t)}
                  className="admin-btn admin-btn-ghost"
                  style={{ padding: '1px 5px', fontSize: '10.5px' }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSquadModal(t)}
                className="admin-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#f5c842',
                  background: 'rgba(245, 200, 66, 0.1)',
                  border: '1px solid rgba(245, 200, 66, 0.35)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: 'fit-content',
                }}
              >
                <Award size={12} />
                <span>+ Retain Player (₹1500)</span>
              </button>
            )}

            {/* Owner Player Badge */}
            {ownerPlayer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#38bdf8' }}>
                <span style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '0px 5px', borderRadius: 4, fontWeight: 700, fontSize: '9.5px' }}>
                  OWNER (PLAYS)
                </span>
                <span>{ownerPlayer.player_name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRetainOrOwner(t)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '10px', marginLeft: 4 }}
                  title="Remove playing owner designation"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                Owner: {ownerName || 'None'}
              </span>
            )}

            {/* Quick Remove button if retain is set */}
            {retainPlayer && (
              <button
                type="button"
                onClick={() => handleRemoveRetainOrOwner(t)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  fontSize: '10px',
                  alignSelf: 'flex-start',
                }}
                title="Remove retained player designation"
              >
                ✕ Clear Retain (₹1500)
              </button>
            )}
          </div>
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
            <span>{count} / 18 Players</span>
          </button>
        );
      },
    },
    {
      key: 'budget' as any,
      label: 'Coins / Purse',
      render: t => {
        const budget = Number(t.budget ?? 100000);
        const teamPlayers = players.filter(p => String(p.team_id) === String(t.id));
        const spent = teamPlayers.reduce((sum, p) => sum + (Number(p.sold_price) || 0), 0);
        const remaining = Math.max(0, budget - spent);

        return (
          <button
            type="button"
            onClick={() => openCoinModal(t)}
            className="admin-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: 700,
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#facc15',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            title="Click to update team coins / purse budget"
          >
            <Coins size={13} color="#facc15" />
            <span>₹{remaining.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '10px', color: 'rgba(250, 204, 21, 0.7)', fontWeight: 500 }}>
              / {budget.toLocaleString('en-IN')}
            </span>
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
          <button className="dt-btn dt-btn-icon" title="Update Coins / Budget" onClick={() => openCoinModal(t)}>
            <Coins size={14} color="#facc15" />
          </button>
          <button className="dt-btn dt-btn-icon" title="Print Team Details (Name, Owner, Retain Player)" onClick={() => printTeamDetails([t], players)}>
            <Printer size={14} color="#3b82f6" />
          </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Team Selector & Print Controls */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid var(--adm-border)',
              borderRadius: '8px',
              padding: '4px 6px'
            }}>
              <select
                value={selectedPrintTeamId}
                onChange={e => setSelectedPrintTeamId(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '190px'
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
                className="admin-btn"
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
                  gap: '6px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.45)',
                  color: '#60a5fa',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Print selected team details: Team Name, Owner Name, Retain Player"
              >
                <Printer size={14} />
                <span>Print Details</span>
              </button>

              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => setPrintModalOpen(true)}
                style={{
                  padding: '5px 7px',
                  fontSize: '11px',
                  color: 'var(--adm-text-muted)',
                  borderLeft: '1px solid var(--adm-border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Open Team Print Selection & Live Preview Modal"
              >
                <span>Select</span>
                <Eye size={12} />
              </button>
            </div>

            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <Plus size={16} /> New Team
            </button>
          </div>
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
                        <Award size={14} color="#f5c842" /> RETAIN PLAYER (₹1,500)
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
                                -- Select Retain Player (Cost: ₹1,500) from Registered List ({players.length} Players) --
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
                  <div className="admin-form-field">
                    <label>Home Location</label>
                    <input type="text" value={form.home_location} onChange={e => setForm({ ...form, home_location: e.target.value })} placeholder="City / Town" />
                  </div>
                  <div className="admin-form-field">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Coins size={13} color="#facc15" /> Coins / Purse Budget (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={(form as any).budget ?? '100000'}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                      placeholder="100000"
                    />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost"
                    onClick={() => printTeamDetails([squadModal], players)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      fontSize: '11.5px',
                      padding: '5px 10px',
                      cursor: 'pointer'
                    }}
                    title="Print this team's details (Name, Owner, Retain Player & Squad)"
                  >
                    <Printer size={13} />
                    <span>Print Team</span>
                  </button>
                  <button onClick={() => { setSquadModal(null); setSquadSearch(''); }} style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="admin-modal-body" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {/* Retain & Owner Squad Banner */}
                {(() => {
                  const retainPlayer = getTeamRetainPlayer(squadModal) || getTeamCaptainPlayer(squadModal);
                  const ownerPlayer = getTeamOwnerPlayer(squadModal);
                  const retainName = retainPlayer ? retainPlayer.player_name : (squadModal.captain_name || squadModal.captain || '');
                  const ownerName = squadModal.owner_name || squadModal.owner || '';

                  return (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '12px',
                      marginBottom: '20px'
                    }}>
                      {/* Retain Player Card */}
                      <div style={{
                        background: retainName ? 'linear-gradient(135deg, rgba(245, 200, 66, 0.12), rgba(15, 23, 42, 0.8))' : 'rgba(255, 255, 255, 0.03)',
                        border: retainName ? '1.5px solid rgba(245, 200, 66, 0.45)' : '1px dashed var(--adm-border)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {retainPlayer?.photo ? (
                            <img src={getImageUrl(retainPlayer.photo)} alt={retainName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f5c842' }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245, 200, 66, 0.2)', border: '2px solid #f5c842', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c842' }}>
                              <Award size={22} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#f5c842', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Award size={12} fill="#f5c842" /> Retain Player (₹1,500)
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                              {retainName || 'No Retain Set'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              {retainPlayer ? `Cost: ₹1,500 • Reg: #${retainPlayer.registration_number || retainPlayer.id}` : 'Cost deducted from purse'}
                            </div>
                          </div>
                        </div>

                        {retainPlayer && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleRemoveRetainOrOwner(squadModal)}
                            className="admin-btn admin-btn-ghost"
                            style={{
                              fontSize: '11.5px',
                              padding: '5px 10px',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.08)',
                            }}
                            title="Remove Retain Player"
                          >
                            ✕ Remove Retain
                          </button>
                        )}
                      </div>

                      {/* Owner Player Card */}
                      <div style={{
                        background: ownerPlayer ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.8))' : 'rgba(255, 255, 255, 0.03)',
                        border: ownerPlayer ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1px dashed var(--adm-border)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {ownerPlayer?.photo ? (
                            <img src={getImageUrl(ownerPlayer.photo)} alt={ownerPlayer.player_name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8' }} />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '2px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                              <Crown size={22} />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#38bdf8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Crown size={12} fill="#38bdf8" /> Franchise Owner
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                              {ownerPlayer ? ownerPlayer.player_name : (ownerName || 'Franchise Owner')}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              {ownerPlayer ? 'Plays in squad • Squad member' : 'Non-playing owner'}
                            </div>
                          </div>
                        </div>

                        {ownerPlayer && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleRemoveRetainOrOwner(squadModal)}
                            className="admin-btn admin-btn-ghost"
                            style={{
                              fontSize: '11.5px',
                              padding: '5px 10px',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.08)',
                            }}
                            title="Remove Playing Owner"
                          >
                            ✕ Remove Owner
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Section 1: Assigned Team Squad Players */}
                {(() => {
                  const squadPlayers = players.filter(p => String(p.team_id) === String(squadModal.id));
                  const retainPlayer = getTeamRetainPlayer(squadModal) || getTeamCaptainPlayer(squadModal);
                  const ownerPlayer = getTeamOwnerPlayer(squadModal);

                  return (
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={15} color="#10b981" /> Current Squad Players ({squadPlayers.length} / 18)
                        </h3>
                        <span style={{ fontSize: '11.5px', color: 'var(--adm-text-muted)' }}>
                          Rule: 1 Player per team — Retain (₹1,500) OR Playing Owner
                        </span>
                      </div>

                      {squadPlayers.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--adm-border)', color: 'var(--adm-text-muted)', fontSize: '13px' }}>
                          No players currently assigned to this team. You can assign and appoint a retain/owner player below!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {squadPlayers.map((p, idx) => {
                            const isRetain = (retainPlayer && retainPlayer.id === p.id) || (p.role || '').toLowerCase().includes('retain');
                            const isOwner = (ownerPlayer && ownerPlayer.id === p.id) || (p.role || '').toLowerCase().includes('owner');

                            return (
                              <div
                                key={p.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  background: isRetain ? 'rgba(245, 200, 66, 0.08)' : (isOwner ? 'rgba(56, 189, 248, 0.08)' : 'var(--adm-input-bg)'),
                                  border: isRetain ? '1.5px solid rgba(245, 200, 66, 0.45)' : (isOwner ? '1.5px solid rgba(56, 189, 248, 0.45)' : '1px solid var(--adm-border)'),
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
                                      {isRetain && (
                                        <span style={{ fontSize: '10px', background: 'rgba(245, 200, 66, 0.2)', color: '#f5c842', border: '1px solid #f5c842', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                                          💎 RETAINED (₹1,500)
                                        </span>
                                      )}
                                      {isOwner && (
                                        <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #38bdf8', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>
                                          👑 OWNER (PLAYS)
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                                      {p.role?.replace(/retained?\s*(player)?\s*(&\s*)?/gi, '').replace(/owner\s*(&\s*)?/gi, '').trim() || 'Player'} • ID: {p.registration_number || 'N/A'} • {p.contact_number || 'No phone'}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {/* Retain toggle button */}
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleSetRetainedPlayer(squadModal, p)}
                                    className="admin-btn"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 9px',
                                      borderRadius: '6px',
                                      background: isRetain ? 'rgba(245, 200, 66, 0.25)' : 'rgba(245, 200, 66, 0.1)',
                                      border: '1px solid rgba(245, 200, 66, 0.45)',
                                      color: '#f5c842',
                                      fontWeight: 700,
                                      fontSize: '11.5px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Award size={12} />
                                    <span>{isRetain ? 'Retained (₹1.5k)' : 'Make Retain'}</span>
                                  </button>

                                  {/* Owner toggle button */}
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => handleSetOwnerPlayer(squadModal, p)}
                                    className="admin-btn"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '4px 9px',
                                      borderRadius: '6px',
                                      background: isOwner ? 'rgba(56, 189, 248, 0.25)' : 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.45)',
                                      color: '#38bdf8',
                                      fontWeight: 700,
                                      fontSize: '11.5px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Crown size={12} />
                                    <span>{isOwner ? 'Playing Owner' : 'Make Owner'}</span>
                                  </button>
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

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSetRetainedPlayer(squadModal, p)}
                                  className="admin-btn"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    background: 'rgba(245, 200, 66, 0.15)',
                                    border: '1px solid rgba(245, 200, 66, 0.45)',
                                    color: '#f5c842',
                                  }}
                                >
                                  <Award size={12} />
                                  <span>Retain (₹1.5k)</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSetOwnerPlayer(squadModal, p)}
                                  className="admin-btn"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    background: 'rgba(56, 189, 248, 0.15)',
                                    border: '1px solid rgba(56, 189, 248, 0.45)',
                                    color: '#38bdf8',
                                  }}
                                >
                                  <Crown size={12} />
                                  <span>Owner</span>
                                </button>
                              </div>
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

        {/* Coin / Budget Updation Modal */}
        {coinModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setCoinModal(null)}>
            <div
              className="admin-modal admin-modal-sm"
              style={{ maxWidth: '440px' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={20} color="#facc15" />
                  <h2 style={{ margin: 0, fontSize: '17px' }}>Update Team Coins</h2>
                </div>
                <button onClick={() => setCoinModal(null)} style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveCoins}>
                <div className="admin-modal-body" style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: 'rgba(250, 204, 21, 0.08)',
                    border: '1px solid rgba(250, 204, 21, 0.25)',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `${coinModal.accent_color || coinModal.color || '#3b82f6'}25`,
                      border: `1.5px solid ${coinModal.accent_color || coinModal.color || '#3b82f6'}`,
                      color: coinModal.accent_color || coinModal.color || '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px'
                    }}>
                      {coinModal.short_code}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>{coinModal.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                        Current Budget: <strong style={{ color: '#facc15' }}>₹{Number(coinModal.budget ?? 100000).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-field">
                    <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Set Total Coins / Purse Budget (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={coinAmount}
                      onChange={e => setCoinAmount(e.target.value)}
                      placeholder="e.g. 100000"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'var(--adm-input-bg)',
                        border: '1px solid var(--adm-border)',
                        color: '#facc15',
                        borderRadius: '6px',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {[50000, 75000, 100000, 150000, 200000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCoinAmount(String(val))}
                        style={{
                          background: coinAmount === String(val) ? 'rgba(250, 204, 21, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: coinAmount === String(val) ? '1px solid #facc15' : '1px solid var(--adm-border)',
                          color: coinAmount === String(val) ? '#facc15' : 'var(--adm-text-secondary)',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        ₹{(val / 1000)}k
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setCoinModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {saving ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                    <span>Save Coins</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Print Team Details Modal with Selection & Live Preview */}
        {printModalOpen && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setPrintModalOpen(false)}>
            <div
              className="admin-modal"
              style={{ maxWidth: '840px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Printer size={18} color="#3b82f6" /> Select Team & Print Details
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--adm-text-muted)' }}>
                    Outputs official printout containing: <strong>TEAM NAME</strong>, <strong>OWNER NAME</strong>, and <strong>RETAIN PLAYER</strong>.
                  </p>
                </div>
                <button onClick={() => setPrintModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body" style={{ flex: 1, padding: '18px 20px', overflowY: 'auto' }}>
                {/* Team Selection Dropdown & Quick Badges */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>
                      Choose Franchise to Print:
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--adm-text-muted)' }}>
                      {teams.length} Franchises registered
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={selectedPrintTeamId}
                      onChange={e => setSelectedPrintTeamId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--adm-input-bg)',
                        border: '1px solid var(--adm-border)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    >
                      <option value="all">★ All Franchises ({teams.length} Teams)</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.short_code})
                        </option>
                      ))}
                    </select>

                    {selectedPrintTeamId !== 'all' && (
                      <button
                        type="button"
                        className="admin-btn admin-btn-ghost"
                        onClick={() => setSelectedPrintTeamId('all')}
                        style={{ fontSize: '12px', whiteSpace: 'nowrap', padding: '9px 14px' }}
                      >
                        Reset to All Teams
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Preview Card / Table */}
                {(() => {
                  const previewList = selectedPrintTeamId === 'all'
                    ? teams
                    : teams.filter(t => String(t.id) === String(selectedPrintTeamId));

                  return (
                    <div style={{ border: '1px solid var(--adm-border)', borderRadius: '10px', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.45)' }}>
                      <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                          Print Preview ({previewList.length} {previewList.length === 1 ? 'Team' : 'Teams'})
                        </span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                          ✓ Ready for A4 Print / PDF
                        </span>
                      </div>

                      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--adm-border)' }}>
                              <th style={{ padding: '8px 12px', width: '35px', color: '#94a3b8', fontSize: '11px' }}>#</th>
                              <th style={{ padding: '8px 12px', width: '33%', color: '#94a3b8', fontSize: '11px' }}>TEAM NAME</th>
                              <th style={{ padding: '8px 12px', width: '33%', color: '#94a3b8', fontSize: '11px' }}>OWNER NAME</th>
                              <th style={{ padding: '8px 12px', width: '34%', color: '#94a3b8', fontSize: '11px' }}>RETAIN PLAYER</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewList.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                                  No teams found to display.
                                </td>
                              </tr>
                            ) : (
                              previewList.map((t, idx) => {
                                const retainP = getTeamRetainPlayer(t) || getTeamCaptainPlayer(t);
                                const ownerP = getTeamOwnerPlayer(t);
                                const retainName = retainP ? retainP.player_name : (t.captain_name || t.captain || '');
                                const ownerName = ownerP ? ownerP.player_name : (t.owner_name || t.owner || '—');
                                const tColor = t.accent_color || t.color || '#3b82f6';

                                return (
                                  <tr key={t.id} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                                    <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: 10, height: 10, borderRadius: 2, background: tColor, flexShrink: 0 }}></span>
                                        <div>
                                          <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '13px' }}>{t.name}</div>
                                          <div style={{ fontSize: '11px', color: '#64748b' }}>Code: {t.short_code}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13px' }}>{ownerName}</div>
                                      {t.owner_contact && <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {t.owner_contact}</div>}
                                      {ownerP && (
                                        <span style={{ fontSize: '9.5px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: 4, fontWeight: 800, marginTop: '2px', display: 'inline-block' }}>
                                          PLAYING OWNER
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                      {retainName ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                          <div style={{ fontWeight: 800, color: '#10b981', fontSize: '13px' }}>★ {retainName}</div>
                                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ fontSize: '9.5px', background: 'rgba(245, 200, 66, 0.18)', color: '#f5c842', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                                              RETAINED ₹1,500
                                            </span>
                                            {retainP?.registration_number && (
                                              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>#{retainP.registration_number}</span>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <span style={{ color: '#64748b', fontSize: '11.5px', fontStyle: 'italic' }}>— None / Open Retain Slot —</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="admin-modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--adm-border)' }}>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setPrintModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 20px', fontWeight: 700 }}
                  onClick={() => {
                    const toPrint = selectedPrintTeamId === 'all'
                      ? teams
                      : teams.filter(t => String(t.id) === String(selectedPrintTeamId));
                    printTeamDetails(toPrint, players);
                    setPrintModalOpen(false);
                  }}
                >
                  <Printer size={15} />
                  <span>
                    Print {selectedPrintTeamId === 'all' ? `All ${teams.length} Franchises` : (teams.find(t => String(t.id) === String(selectedPrintTeamId))?.name || 'Selected Team')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

