'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  X, Loader2, CheckCircle2, AlertCircle, Users,
  UserCheck, UserX, Gavel, FileText, Printer,
  Phone, Mail, MapPin, Calendar, Hash, User, Shield, Target, Zap,
  Check, Clock, XCircle, ArrowRight, ShieldCheck, CreditCard, Image as ImageIcon, Upload,
  LayoutGrid, List, RefreshCw, Search, IdCard
} from 'lucide-react';
import { RegistrationSlipModal } from '@/components/RegistrationSlipModal';

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
  team_id: '', auction_eligible: true, base_price: '50', status: 'active', approval: 'approved', notes: '',
  declaration_accepted: false,
};

const ROLES = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'view' | null>(null);
  const [selected, setSelected] = useState<Player | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'self' | 'active'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [filterTeam, setFilterTeam] = useState('');
  const [filterAuction, setFilterAuction] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterApproval, setFilterApproval] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [slipPlayer, setSlipPlayer] = useState<any>(null);
  const [proofModal, setProofModal] = useState<{
    url: string;
    title: string;
    meta?: string;
    player?: Player;
    payment?: any;
    activeTab?: 'payment' | 'address' | 'photo';
  } | null>(null);
  const [attachingScreenshot, setAttachingScreenshot] = useState(false);

  function openAddressProof(proofUrl: string | null | undefined, title: string = 'Address Proof', player?: Player) {
    if (!proofUrl) return;
    const pay = player ? getPlayerPayment(player) : null;
    setProofModal({
      url: proofUrl,
      title: title,
      player: player,
      payment: pay,
      activeTab: 'address',
      meta: player ? `Reg: ${player.registration_number || 'N/A'} • ${player.player_name}` : undefined,
    });
  }

  function getPlayerPayment(p: Player) {
    if (!payments.length) return null;
    const cleanPhone = (p.contact_number || '').replace(/\D/g, '').slice(-10);
    const cleanReg = (p.registration_number || '').trim().toLowerCase();
    return payments.find(pay => {
      const payReg = (pay.registration_id || '').trim().toLowerCase();
      const payPhone = (pay.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanReg && payReg && (payReg === cleanReg || payReg.includes(cleanReg) || cleanReg.includes(payReg))) return true;
      if (cleanPhone && payPhone && cleanPhone === payPhone) return true;
      return false;
    }) || null;
  }

  function openPaymentProof(p: Player) {
    const pay = getPlayerPayment(p);
    const screenshot = pay?.screenshot || pay?.payment_proof || pay?.proof_url || '';
    
    // Determine the most accurate image to display:
    // If payment screenshot is present, show it.
    // Otherwise fallback to player's uploaded address proof or photo so the user ALWAYS sees the image!
    const effectiveUrl = screenshot || p.address_proof || p.photo || '';
    const initialTab: 'payment' | 'address' | 'photo' = screenshot ? 'payment' : (p.address_proof ? 'address' : 'photo');

    setProofModal({
      url: effectiveUrl,
      title: `Payment & Documents — ${p.player_name}`,
      meta: pay ? `UTR / Ref: ${pay.payment_id || 'N/A'} • Amount: ₹${pay.amount || '—'} • Status: ${pay.status || 'Pending'}` : `Reg: ${p.registration_number || 'N/A'} • ${p.player_name}`,
      player: p,
      payment: pay,
      activeTab: initialTab,
    });
  }

  const handleAttachScreenshotToPayment = async (e: React.ChangeEvent<HTMLInputElement>, paymentId?: string, player?: Player) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = async () => {
        const MAX_DIM = 900;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        let compressed = dataUrl;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          compressed = canvas.toDataURL('image/jpeg', 0.72);
        }

        setAttachingScreenshot(true);
        try {
          if (paymentId) {
            await kplApi.updatePaymentStatus(paymentId, 'pending_verification', compressed);
          } else if (player) {
            await kplApi.createPayment({
              registration_type: 'player',
              registration_id: player.registration_number || player.id,
              name: player.player_name,
              phone: player.contact_number,
              amount: player.player_category === 'Foreign' ? 250 : 200,
              payment_gateway: 'upi_direct',
              payment_id: `UPI-SHOT-${player.registration_number || player.id}`,
              screenshot: compressed,
              payment_proof: compressed,
              status: 'pending_verification',
            });
          }
          showToast('Payment screenshot attached successfully!');
          await loadData(true);
          setProofModal(prev => prev ? {
            ...prev,
            url: compressed,
            activeTab: 'payment',
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

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadData(silent: boolean = false) {
    if (!silent) setLoading(true);
    else setSyncing(true);
    try {
      const [pRes, tRes, payRes] = await Promise.all([
        kplApi.getPlayers({ limit: 1000 }),
        kplApi.getTeams('active'),
        kplApi.getPayments(500).catch(() => []),
      ]);
      const pList = pRes?.data || pRes || [];
      const tList = tRes?.data || tRes || [];
      const payList = payRes?.data || payRes || [];

      setPlayers(pList);
      setTeams(tList);
      setPayments(Array.isArray(payList) ? payList : []);

      // Cache data locally so subsequent visits load instantly (0ms), stripping any huge base64 strings
      try {
        const leanPlayers = pList.map((p: any) => {
          const item = { ...p };
          if (item.address_proof && item.address_proof.length > 500 && item.address_proof.startsWith('data:')) {
            item.address_proof = '';
          }
          if (item.player_signature && item.player_signature.length > 500) {
            item.player_signature = '';
          }
          return item;
        });
        localStorage.setItem('kpl_admin_players_cache', JSON.stringify({ p: leanPlayers, t: tList, pay: payList }));
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      if (!silent) showToast(err.message || 'Failed to load players data', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    // 1. Restore saved view mode preference
    try {
      const savedMode = localStorage.getItem('kpl_admin_players_view_mode');
      if (savedMode === 'cards' || savedMode === 'table') setViewMode(savedMode);
    } catch (e) {}

    // 2. Instant cache load (Zero waiting time on initial render)
    try {
      const cached = localStorage.getItem('kpl_admin_players_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.p && parsed.p.length > 0) {
          setPlayers(parsed.p);
          if (parsed.t) setTeams(parsed.t);
          if (parsed.pay) setPayments(parsed.pay);
          setLoading(false);
          loadData(true); // Revalidate fresh data quietly in background
          return;
        }
      }
    } catch (e) {}
    loadData(false);
  }, []);

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
      status: p.status, approval: p.approval || (p.status === 'active' ? 'approved' : 'pending'), notes: p.notes || '',
      declaration_accepted: p.declaration_accepted || false,
    });
    setSelected(p); setModal('edit');
  }
  function openView(p: Player) { setSelected(p); setModal('view'); }
  function openDelete(p: Player) { setSelected(p); setModal('delete'); }

  async function handleApprove(p: Player) {
    setSaving(true);
    try {
      await kplApi.approvePlayer(p.id);
      showToast(`Player "${p.player_name}" approved successfully!`);
      if (selected && selected.id === p.id) {
        setSelected({ ...selected, status: 'active', approval: 'approved', auction_eligible: true });
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve player', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleReject(p: Player, reason?: string) {
    setSaving(true);
    try {
      await kplApi.rejectPlayer(p.id, reason || 'Registration rejected by committee');
      showToast(`Player "${p.player_name}" application rejected.`);
      if (selected && selected.id === p.id) {
        setSelected({ ...selected, status: 'disabled', approval: 'rejected', auction_eligible: false });
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject player', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function savePlayer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    // Auto generate reg number for admin creations if empty
    let regNum = form.registration_number;
    if (modal === 'create' && !regNum) {
      const nextSl = 1001 + (players.length || 0);
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
      bowling_type: form.bowler ? `${form.bowling_arm} ${form.bowling_style}`.trim() : null,
      player_signature: form.player_signature || null,
      registration_number: regNum,
      registered_by: form.registered_by || 'admin',
      declaration_accepted: form.declaration_accepted,
      team_id: form.team_id || null,
      auction_eligible: form.auction_eligible,
      base_price: parseFloat(form.base_price) || 0,
      status: form.status,
      approval: form.approval || (form.status === 'active' ? 'approved' : 'pending'),
      notes: form.notes || null,
    };
    
    try {
      if (modal === 'create') {
        await kplApi.createPlayer(payload);
      } else if (modal === 'edit' && selected) {
        await kplApi.updatePlayer(selected.id, payload);
      }
      showToast(modal === 'create' ? 'Player created!' : 'Player updated!');
      setModal(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save player', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deletePlayer() {
    if (!selected) return;
    setSaving(true);
    try {
      await kplApi.deletePlayer(selected.id);
      showToast('Player deleted.');
      setModal(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete player', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(p: Player) {
    const newStatus = p.status === 'active' ? 'disabled' : 'active';
    try {
      await kplApi.updatePlayer(p.id, { status: newStatus });
      showToast(`Player ${newStatus}.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update player status', 'error');
    }
  }

  async function toggleAuction(p: Player) {
    try {
      await kplApi.updatePlayer(p.id, { auction_eligible: !p.auction_eligible });
      showToast(`Auction eligibility ${!p.auction_eligible ? 'enabled' : 'disabled'}.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle auction eligibility', 'error');
    }
  }

  async function unassignPlayer(p: Player) {
    try {
      await kplApi.updatePlayer(p.id, { team_id: null, sold_price: null });
      showToast('Player unassigned from team.');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to unassign player', 'error');
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setForm(prev => ({ ...prev, [field]: event.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const pendingPlayers = players.filter(p => p.status === 'pending' || p.approval === 'pending');
  const pendingCount = pendingPlayers.length;
  const selfCount = players.filter(p => p.registered_by?.toLowerCase().includes('self')).length;
  const activeCount = players.filter(p => p.status === 'active' && p.approval !== 'rejected').length;
  const auctionCount = players.filter(p => p.auction_eligible).length;

  const verifiedPayments = payments.filter(p => p.status === 'completed' || p.status === 'success');
  const totalFeesCollected = verifiedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const batsmanCount = players.filter(p => p.batsman || (p.role || '').toLowerCase().includes('bat')).length;
  const bowlerCount = players.filter(p => p.bowler || (p.role || '').toLowerCase().includes('bowl')).length;
  const allRounderCount = players.filter(p => p.all_rounder || (p.role || '').toLowerCase().includes('all')).length;
  const keeperCount = players.filter(p => p.wicket_keeper || (p.role || '').toLowerCase().includes('keep')).length;

  const filtered = players.filter(p => {
    if (activeTab === 'pending' && p.status !== 'pending' && p.approval !== 'pending') return false;
    if (activeTab === 'self' && !p.registered_by?.toLowerCase().includes('self')) return false;
    if (activeTab === 'active' && (p.status !== 'active' || p.approval === 'rejected')) return false;

    if (roleFilter !== 'all') {
      const r = (p.role || '').toLowerCase();
      if (roleFilter === 'batsman' && !p.batsman && !r.includes('bat')) return false;
      if (roleFilter === 'bowler' && !p.bowler && !r.includes('bowl')) return false;
      if (roleFilter === 'all_rounder' && !p.all_rounder && !r.includes('all')) return false;
      if (roleFilter === 'keeper' && !p.wicket_keeper && !r.includes('keep')) return false;
    }

    if (filterTeam && p.team_id !== filterTeam) return false;
    if (filterAuction === 'eligible' && !p.auction_eligible) return false;
    if (filterAuction === 'ineligible' && p.auction_eligible) return false;
    if (filterAuction === 'unassigned' && p.team_id) return false;
    if (filterSource === 'self' && !p.registered_by?.toLowerCase().includes('self')) return false;
    if (filterSource === 'admin' && p.registered_by?.toLowerCase().includes('self')) return false;
    if (filterApproval === 'pending' && p.status !== 'pending' && p.approval !== 'pending') return false;
    if (filterApproval === 'approved' && p.status !== 'active') return false;
    if (filterApproval === 'rejected' && p.approval !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.player_name || '').toLowerCase().includes(q);
      const matchReg = (p.registration_number || '').toLowerCase().includes(q);
      const matchPhone = (p.contact_number || '').toLowerCase().includes(q);
      const matchEmail = (p.email || '').toLowerCase().includes(q);
      const matchRole = (p.role || '').toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchPhone && !matchEmail && !matchRole) return false;
    }

    return true;
  });

  const columns: Column<Player>[] = [
    {
      key: 'player_name', label: 'Player', sortable: true,
      render: p => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {p.photo ? (
            <img src={getImageUrl(p.photo)} alt={p.player_name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}>
              {p.player_name?.slice(0, 2).toUpperCase() || 'PL'}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dt-player-name">{p.player_name}</span>
              {p.registered_by?.toLowerCase().includes('self') ? (
                <span className="admin-source-badge self" title="Self-registered from website">Self Reg</span>
              ) : (
                <span className="admin-source-badge admin" title="Registered by admin">Admin</span>
              )}
            </div>
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
      key: 'payment', label: 'Payment Proof',
      render: p => {
        const pay = getPlayerPayment(p);
        const screenshot = pay?.screenshot || pay?.payment_proof || pay?.proof_url || p.address_proof;
        if (screenshot) {
          return (
            <button
              type="button"
              onClick={() => openPaymentProof(p)}
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
              title="Click to view payment proof / documents"
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
              onClick={() => openPaymentProof(p)}
              className="admin-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#eab308',
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Click to view recorded payment details"
            >
              <CreditCard size={12} />
              <span>UTR: {pay.payment_id?.slice(-8) || 'Details'}</span>
            </button>
          );
        }
        return <span style={{ color: '#64748b', fontSize: '11px' }}>—</span>;
      },
    },
    {
      key: 'status', label: 'Status & Approval', sortable: true,
      render: p => {
        const isPending = p.status === 'pending' || p.approval === 'pending';
        const isRejected = p.approval === 'rejected' || p.status === 'rejected';
        const isActive = p.status === 'active';
        if (isPending) {
          return (
            <span className="admin-status-badge admin-status-pending" title="Awaiting admin approval">
              <Clock size={11} /> Pending Review
            </span>
          );
        }
        if (isRejected) {
          return (
            <span className="admin-status-badge admin-status-disabled" title="Rejected application">
              <XCircle size={11} /> Rejected
            </span>
          );
        }
        if (isActive) {
          return (
            <span className="admin-status-badge admin-status-approved" title="Approved and active">
              <CheckCircle2 size={11} /> Approved
            </span>
          );
        }
        return <span className={`admin-status-badge admin-status-${p.status}`}>{p.status}</span>;
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: p => {
        const isPending = p.status === 'pending' || p.approval === 'pending';
        return (
          <div className="dt-actions no-print">
            {isPending && (
              <>
                <button
                  className="dt-btn dt-btn-approve"
                  title="Approve Player"
                  onClick={() => handleApprove(p)}
                  disabled={saving}
                  style={{ height: '30px', padding: '0 8px', gap: '4px', fontSize: '11px', fontWeight: 700 }}
                >
                  <Check size={13} /> Approve
                </button>
                <button
                  className="dt-btn dt-btn-reject dt-btn-icon"
                  title="Reject Application"
                  onClick={() => handleReject(p)}
                  disabled={saving}
                >
                  <X size={14} />
                </button>
              </>
            )}
            <button className="dt-btn dt-btn-icon" title="View details" onClick={() => openView(p)}><FileText size={14} /></button>
            <button className="dt-btn dt-btn-icon" title="Print details" onClick={() => window.open(`/admin/players/print/${p.id}`, '_blank')}><Printer size={14} /></button>
            {p.address_proof ? (
              <button className="dt-btn dt-btn-icon" title="View Address Proof" onClick={() => openAddressProof(p.address_proof, `${p.player_name} - Address Proof`)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={14} />
              </button>
            ) : (
              <button className="dt-btn dt-btn-icon" title="No address proof uploaded" style={{ opacity: 0.35, cursor: 'not-allowed' }} disabled>
                <MapPin size={14} />
              </button>
            )}
            {/* View Payment Proof button */}
            {(() => {
              const pay = getPlayerPayment(p);
              const hasProof = !!(pay && (pay.screenshot || pay.payment_proof || pay.proof_url));
              return (
                <button
                  className={`dt-btn dt-btn-icon ${hasProof ? 'dt-btn-payment-active' : ''}`}
                  title={hasProof ? `View Payment Proof (UTR: ${pay.payment_id || 'N/A'})` : pay ? `Payment: ${pay.payment_id || 'No proof image'}` : 'No payment proof recorded'}
                  onClick={() => openPaymentProof(p)}
                  style={{
                    color: hasProof ? '#10b981' : undefined,
                    borderColor: hasProof ? 'rgba(16, 185, 129, 0.4)' : undefined,
                    background: hasProof ? 'rgba(16, 185, 129, 0.1)' : undefined,
                  }}
                >
                  <CreditCard size={14} />
                </button>
              );
            })()}
            <button className="dt-btn dt-btn-icon" title="View Slip" onClick={() => setSlipPlayer(p)}><IdCard size={14} /></button>
            <button className="dt-btn dt-btn-icon" title="Edit" onClick={() => openEdit(p)}><Edit2 size={14} /></button>
            {p.team_id && (
              <button className="dt-btn dt-btn-icon" title="Unassign from team" onClick={() => unassignPlayer(p)}><UserX size={14} /></button>
            )}
            <button className="dt-btn dt-btn-icon" title={p.status === 'active' ? 'Disable' : 'Enable'} onClick={() => toggleStatus(p)}>
              {p.status === 'active' ? <ToggleRight size={16} className="text-green" /> : <ToggleLeft size={16} />}
            </button>
            <button className="dt-btn dt-btn-icon dt-btn-danger" title="Delete" onClick={() => openDelete(p)}><Trash2 size={14} /></button>
          </div>
        );
      },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0 }}><Users size={22} /> Players</h1>
              {syncing && (
                <span className="admin-sync-indicator">
                  <RefreshCw size={11} className="spin" /> Syncing...
                </span>
              )}
            </div>
            <p style={{ marginTop: '4px' }}>Review registrations, verify player payments, manage cricket profiles, and auction pool.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Switcher */}
            <div className="admin-view-toggle">
              <button
                type="button"
                className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('table');
                  try { localStorage.setItem('kpl_admin_players_view_mode', 'table'); } catch (e) {}
                }}
                title="Compact Table View"
              >
                <List size={14} />
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`admin-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => {
                  setViewMode('cards');
                  try { localStorage.setItem('kpl_admin_players_view_mode', 'cards'); } catch (e) {}
                }}
                title="Cricket Trading Cards Grid View"
              >
                <LayoutGrid size={14} />
                <span>Cards</span>
              </button>
            </div>

            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Player
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Users size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{players.length}</div>
              <div className="admin-stat-label">Total Players</div>
              <div className="admin-stat-sub">{selfCount} self-registered • {players.length - selfCount} admin</div>
            </div>
          </div>

          <div
            className="admin-stat-card"
            style={{ cursor: 'pointer', borderColor: pendingCount > 0 ? 'rgba(234, 179, 8, 0.4)' : undefined }}
            onClick={() => setActiveTab('pending')}
            title="Click to view pending reviews"
          >
            <div className="admin-stat-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
              <Clock size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value" style={{ color: pendingCount > 0 ? '#facc15' : undefined }}>{pendingCount}</div>
              <div className="admin-stat-label">Pending Review</div>
              <div className="admin-stat-sub">{pendingCount > 0 ? '⚠️ Action needed for auction pool' : 'All applications reviewed'}</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Gavel size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{auctionCount}</div>
              <div className="admin-stat-label">Auction Eligible</div>
              <div className="admin-stat-sub">{Math.round((auctionCount / (players.length || 1)) * 100)}% pool readiness</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}>
              <CreditCard size={20} />
            </div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">₹{totalFeesCollected.toLocaleString('en-IN')}</div>
              <div className="admin-stat-label">Fees Verified</div>
              <div className="admin-stat-sub">{verifiedPayments.length} payments recorded</div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Notice Banner */}
        {pendingCount > 0 && activeTab !== 'pending' && (
          <div className="admin-approval-banner">
            <div className="admin-approval-banner-info">
              <div className="admin-approval-banner-icon">
                <Clock size={20} />
              </div>
              <div className="admin-approval-banner-text">
                <h4>{pendingCount} Self-Registered Player{pendingCount > 1 ? 's' : ''} Awaiting Admin Approval</h4>
                <p>Review submitted identity proofs, cricket profiles, and approve or reject player applications.</p>
              </div>
            </div>
            <button className="admin-approval-banner-btn" onClick={() => setActiveTab('pending')}>
              Review Pending Players ({pendingCount}) <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Quick Filter Tabs */}
        <div className="admin-quick-tabs">
          <button className={`admin-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All Players <span className="admin-tab-badge">{players.length}</span>
          </button>
          <button className={`admin-tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <Clock size={13} color="#facc15" /> Pending Approval <span className={`admin-tab-badge ${pendingCount > 0 ? 'pending' : ''}`}>{pendingCount}</span>
          </button>
          <button className={`admin-tab-btn ${activeTab === 'self' ? 'active' : ''}`} onClick={() => setActiveTab('self')}>
            Self-Registered <span className="admin-tab-badge">{selfCount}</span>
          </button>
          <button className={`admin-tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
            Approved / Active <span className="admin-tab-badge">{activeCount}</span>
          </button>
        </div>

        {/* Role Filter Pills & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div className="admin-role-pills">
            <button
              type="button"
              className={`admin-role-pill ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All Roles ({players.length})
            </button>
            <button
              type="button"
              className={`admin-role-pill ${roleFilter === 'batsman' ? 'active' : ''}`}
              onClick={() => setRoleFilter('batsman')}
            >
              🏏 Batsmen ({batsmanCount})
            </button>
            <button
              type="button"
              className={`admin-role-pill ${roleFilter === 'bowler' ? 'active' : ''}`}
              onClick={() => setRoleFilter('bowler')}
            >
              ⚡ Bowlers ({bowlerCount})
            </button>
            <button
              type="button"
              className={`admin-role-pill ${roleFilter === 'all_rounder' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all_rounder')}
            >
              ⭐ All-Rounders ({allRounderCount})
            </button>
            <button
              type="button"
              className={`admin-role-pill ${roleFilter === 'keeper' ? 'active' : ''}`}
              onClick={() => setRoleFilter('keeper')}
            >
              🧤 Keepers ({keeperCount})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px', flex: '1', maxWidth: '340px' }}>
            <div className="dt-search" style={{ margin: 0, width: '100%', background: 'var(--adm-panel)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} color="var(--adm-text-muted)" />
              <input
                type="text"
                placeholder="Search name, phone, reg ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--adm-text-strong)', fontSize: '12.5px', width: '100%' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--adm-text-muted)', cursor: 'pointer', padding: '0 4px', display: 'flex' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="admin-filters" style={{ marginBottom: '16px' }}>
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
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">All Sources</option>
            <option value="self">Self-Registered</option>
            <option value="admin">Admin Created</option>
          </select>
          <select value={filterApproval} onChange={e => setFilterApproval(e.target.value)}>
            <option value="">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="admin-filter-count">
            <UserCheck size={14} /> {filtered.length} players shown
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && players.length === 0 ? (
          viewMode === 'cards' ? (
            <div className="player-cards-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          ) : (
            <div className="admin-loading-rows">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="admin-skeleton-row" />
              ))}
            </div>
          )
        ) : viewMode === 'cards' ? (
          /* Cards Grid View */
          filtered.length === 0 ? (
            <div className="admin-empty">No players found matching current filters.</div>
          ) : (
            <div className="player-cards-grid">
              {filtered.map(p => {
                const pay = getPlayerPayment(p);
                const screenshot = pay?.screenshot || pay?.payment_proof || pay?.proof_url || p.address_proof;
                const isPending = p.status === 'pending' || p.approval === 'pending';
                const isRejected = p.approval === 'rejected' || p.status === 'rejected';

                return (
                  <div key={p.id} className="player-card">
                    <div className="player-card-header">
                      <div className="player-avatar-wrap">
                        {p.photo ? (
                          <img src={getImageUrl(p.photo)} alt={p.player_name} className="player-avatar-img" />
                        ) : (
                          <div className="player-avatar-placeholder">
                            {p.player_name?.slice(0, 2).toUpperCase() || 'PL'}
                          </div>
                        )}
                        <span className={`status-dot ${isPending ? 'pending' : isRejected ? 'rejected' : 'active'}`} />
                      </div>

                      <div className="player-card-info">
                        <div className="player-card-name" title={p.player_name}>
                          <span>{p.player_name}</span>
                          {p.registered_by?.toLowerCase().includes('self') ? (
                            <span className="admin-source-badge self" style={{ fontSize: '9px', padding: '1px 5px' }}>Self</span>
                          ) : (
                            <span className="admin-source-badge admin" style={{ fontSize: '9px', padding: '1px 5px' }}>Admin</span>
                          )}
                        </div>
                        <div className="player-card-reg">{p.registration_number || 'No Reg #'}</div>
                      </div>
                    </div>

                    <div className="player-card-badges">
                      <span className="player-card-pill" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}>
                        {p.role || p.player_category || 'Player'}
                      </span>
                      {p.teams ? (
                        <span className="player-card-pill" style={{ borderColor: p.teams.accent_color, border: '1px solid', color: p.teams.accent_color }}>
                          {p.teams.short_code}
                        </span>
                      ) : (
                        <span className="player-card-pill" style={{ opacity: 0.6 }}>Unassigned</span>
                      )}
                      <span className={`admin-status-badge ${isPending ? 'admin-status-pending' : isRejected ? 'admin-status-disabled' : 'admin-status-approved'}`}>
                        {isPending ? 'Pending' : isRejected ? 'Rejected' : 'Approved'}
                      </span>
                    </div>

                    <div className="player-card-details">
                      <div className="player-card-detail-item">
                        <span className="player-card-detail-label">Batting / Bowling</span>
                        <span className="player-card-detail-val" title={`${p.batting_hand || 'RHB'} • ${p.bowling_type || 'None'}`}>
                          {p.batting_hand || 'RHB'} • {p.bowling_type || (p.bowler ? 'Bowler' : 'None')}
                        </span>
                      </div>
                      <div className="player-card-detail-item">
                        <span className="player-card-detail-label">Base Price</span>
                        <span className="player-card-detail-val" style={{ color: '#d4af37' }}>
                          ₹{Number(p.base_price || 50).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="player-card-detail-item">
                        <span className="player-card-detail-label">Auction Pool</span>
                        <span className="player-card-detail-val">
                          <button
                            type="button"
                            onClick={() => toggleAuction(p)}
                            className={`admin-toggle-btn ${p.auction_eligible ? 'admin-toggle-on' : 'admin-toggle-off'}`}
                            style={{ fontSize: '10.5px', padding: '2px 6px' }}
                          >
                            <Gavel size={10} />
                            {p.auction_eligible ? 'Eligible' : 'Off'}
                          </button>
                        </span>
                      </div>
                      <div className="player-card-detail-item">
                        <span className="player-card-detail-label">Payment Proof</span>
                        <span className="player-card-detail-val">
                          {screenshot ? (
                            <button
                              type="button"
                              onClick={() => openPaymentProof(p)}
                              style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
                            >
                              <CreditCard size={12} /> View Proof ↗
                            </button>
                          ) : pay ? (
                            <button
                              type="button"
                              onClick={() => openPaymentProof(p)}
                              style={{ background: 'none', border: 'none', color: '#eab308', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}
                            >
                              <CreditCard size={12} /> UTR: {pay.payment_id?.slice(-6)}
                            </button>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '11px' }}>—</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="player-card-actions">
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="dt-btn dt-btn-approve"
                            onClick={() => handleApprove(p)}
                            disabled={saving}
                            style={{ height: '28px', padding: '0 8px', fontSize: '11px', fontWeight: 700 }}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            className="dt-btn dt-btn-reject dt-btn-icon"
                            onClick={() => handleReject(p)}
                            disabled={saving}
                            style={{ width: '28px', height: '28px' }}
                            title="Reject"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {p.contact_number || 'No Contact'}
                        </span>
                      )}

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="dt-btn dt-btn-icon" title="View details" onClick={() => openView(p)} style={{ width: '28px', height: '28px' }}><FileText size={13} /></button>
                        <button className="dt-btn dt-btn-icon" title="Print" onClick={() => window.open(`/admin/players/print/${p.id}`, '_blank')} style={{ width: '28px', height: '28px' }}><Printer size={13} /></button>
                        <button className="dt-btn dt-btn-icon" title="View Slip" onClick={() => setSlipPlayer(p)} style={{ width: '28px', height: '28px' }}><IdCard size={13} /></button>
                        <button className="dt-btn dt-btn-icon" title="Edit" onClick={() => openEdit(p)} style={{ width: '28px', height: '28px' }}><Edit2 size={13} /></button>
                        <button className="dt-btn dt-btn-icon dt-btn-danger" title="Delete" onClick={() => openDelete(p)} style={{ width: '28px', height: '28px' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Table View */
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading && players.length === 0}
            searchKeys={['player_name', 'registration_number', 'contact_number', 'email']}
            searchPlaceholder="Search players or reg ID..."
            emptyMessage="No players found."
          />
        )}

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
                  {/* Photo Upload */}
                  <div className="admin-form-field">
                    <label>Photo</label>
                    <label className="admin-upload-box" style={{ aspectRatio: '1/1' }}>
                      <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'photo')} style={{ display: 'none' }} />
                      {form.photo ? (
                        <>
                          <img src={getImageUrl(form.photo)} alt="Photo preview" className="admin-upload-preview" />
                          <div className="admin-upload-overlay">📷 Change Photo</div>
                        </>
                      ) : (
                        <div className="admin-upload-placeholder">
                          <Users size={28} color="var(--adm-gold)" />
                          <span>Click to upload photo</span>
                          <small>JPG, PNG, WEBP</small>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Address Proof Upload */}
                  <div className="admin-form-field">
                    <label>Address Proof</label>
                    <label className="admin-upload-box" style={{ aspectRatio: '4/3' }}>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={e => handleFileChange(e, 'address_proof')}
                        style={{ display: 'none' }}
                      />
                      {form.address_proof ? (
                        <>
                          {form.address_proof.startsWith('data:application/pdf') || form.address_proof.endsWith('.pdf') ? (
                            <div className="admin-upload-placeholder" style={{ gap: '6px' }}>
                              <FileText size={36} color="var(--adm-gold)" />
                              <span style={{ fontSize: '12px' }}>PDF Uploaded</span>
                              <small>Click to change</small>
                            </div>
                          ) : (
                            <img src={getImageUrl(form.address_proof)} alt="Proof preview" className="admin-upload-preview" />
                          )}
                          <div className="admin-upload-overlay">📎 Change Proof</div>
                        </>
                      ) : (
                        <div className="admin-upload-placeholder">
                          <FileText size={28} color="var(--adm-gold)" />
                          <span>Click to upload proof</span>
                          <small>Image or PDF — Aadhar, Voter ID, etc.</small>
                        </div>
                      )}
                    </label>
                    {form.address_proof && (
                      <button type="button" onClick={() => openAddressProof(form.address_proof, 'Address Proof Preview')} style={{ fontSize: '11px', color: 'var(--adm-gold)', marginTop: '4px', display: 'inline-block', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>↗ View full size</button>
                    )}
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
                    <select value={form.status} onChange={e => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        status: val,
                        approval: val === 'active' ? 'approved' : val === 'disabled' ? 'rejected' : form.approval
                      });
                    }}>
                      <option value="active">Active</option>
                      <option value="pending">Pending (Review)</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Approval Decision</label>
                    <select value={form.approval} onChange={e => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        approval: val,
                        status: val === 'approved' ? 'active' : val === 'rejected' ? 'disabled' : form.status
                      });
                    }}>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending Review</option>
                      <option value="rejected">Rejected</option>
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

                {/* Declaration */}
                <div style={{ margin: '20px 0 4px', padding: '16px', borderRadius: '10px', border: `2px solid ${form.declaration_accepted ? 'var(--adm-gold)' : 'var(--adm-border)'}`, background: form.declaration_accepted ? 'var(--adm-gold-bg)' : 'var(--adm-panel)', transition: 'all .2s' }}>
                  <label className="admin-checkbox-label" style={{ alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.declaration_accepted}
                      onChange={e => setForm({ ...form, declaration_accepted: e.target.checked })}
                      style={{ marginTop: '3px', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--adm-text)' }}>
                      <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--adm-text-strong)' }}>Declaration</strong>
                      I hereby declare that all the information provided above is true and correct to the best of my knowledge. I agree to abide by the rules and regulations of Khoraghat Premier League (KPL) Season 3. I understand that any false information may lead to disqualification.
                    </span>
                  </label>
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

        {/* View Details Modal — Full Screen */}
        {modal === 'view' && selected && (
          <div className="player-detail-overlay" onClick={() => setModal(null)}>
            <div className="player-detail-modal" onClick={e => e.stopPropagation()}>

              {/* LEFT — Photo Panel */}
              <div className="player-detail-photo-panel">
                {selected.photo ? (
                  <img src={getImageUrl(selected.photo)} alt={selected.player_name} className="player-detail-photo" />
                ) : (
                  <div className="player-detail-no-photo">
                    <Users size={80} color="var(--adm-text-muted)" />
                  </div>
                )}
                {/* Name overlay at bottom of photo */}
                <div className="player-detail-photo-overlay">
                  <span className="player-detail-reg">#{selected.registration_number || 'N/A'}</span>
                  <h2 className="player-detail-name">{selected.player_name}</h2>
                  <span className={`admin-status-badge admin-status-${selected.status}`}>{selected.status}</span>
                </div>
              </div>

              {/* RIGHT — Details Panel */}
              <div className="player-detail-info-panel">
                {/* Header */}
                <div className="player-detail-info-header">
                  <div>
                    <h3>Player Details</h3>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      Registered by: <strong>{selected.registered_by || '—'}</strong>
                      {selected.registered_by?.toLowerCase().includes('self') ? (
                        <span className="admin-source-badge self">Self Reg</span>
                      ) : (
                        <span className="admin-source-badge admin">Admin</span>
                      )}
                    </p>
                  </div>
                  <div className="player-detail-header-actions">
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => window.open(`/admin/players/print/${selected.id}`, '_blank')}><Printer size={14} /> Print</button>
                    <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setModal('edit'); openEdit(selected); }}><Edit2 size={14} /> Edit</button>
                    <button className="player-detail-close" onClick={() => setModal(null)}><X size={20} /></button>
                  </div>
                </div>

                {/* Review / Approval Callout Box */}
                {(selected.status === 'pending' || selected.approval === 'pending') ? (
                  <div className="player-review-box" style={{ margin: '16px 20px 0' }}>
                    <div>
                      <div className="player-review-box-title">
                        <Clock size={16} /> Self-Registration Awaiting Admin Approval
                      </div>
                      <p className="player-review-box-sub">
                        Review personal information, address proof, and cricket profile. Approve to activate and make player auction-eligible.
                      </p>
                    </div>
                    <div className="player-review-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleReject(selected)}
                        disabled={saving}
                      >
                        <X size={14} /> Reject Application
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        style={{ background: '#16a34a', borderColor: '#16a34a' }}
                        onClick={() => handleApprove(selected)}
                        disabled={saving}
                      >
                        <Check size={14} /> Approve Player
                      </button>
                    </div>
                  </div>
                ) : (selected.approval === 'rejected' || selected.status === 'rejected') ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '10px 16px', margin: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#f87171', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={15} /> Registration Rejected
                    </span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary admin-btn-sm"
                      style={{ fontSize: '11px', height: '26px', background: '#16a34a', borderColor: '#16a34a' }}
                      onClick={() => handleApprove(selected)}
                      disabled={saving}
                    >
                      Approve Player
                    </button>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: '10px', padding: '10px 16px', margin: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} /> Approved by Admin — Active in Tournament Pool
                    </span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      style={{ fontSize: '11px', height: '26px' }}
                      onClick={() => handleReject(selected)}
                      disabled={saving}
                    >
                      Revoke Approval
                    </button>
                  </div>
                )}

                {/* Details Grid */}
                <div className="player-detail-grid">

                  {/* Personal Info */}
                  <div className="player-detail-section">
                    <h4><User size={14} color="var(--adm-gold)" /> Personal Info</h4>
                    <div className="player-detail-rows">
                      <div className="player-detail-row"><span><Users size={13}/>Father's Name</span><strong>{selected.father_name || '—'}</strong></div>
                      <div className="player-detail-row"><span><Calendar size={13}/>Age</span><strong>{selected.age || '—'}</strong></div>
                      <div className="player-detail-row"><span><Phone size={13}/>Contact</span><strong>{selected.contact_number || '—'}</strong></div>
                      <div className="player-detail-row"><span><Mail size={13}/>Email</span><strong>{selected.email || '—'}</strong></div>
                      <div className="player-detail-row"><span><MapPin size={13}/>Address</span><strong>{selected.present_address || '—'}</strong></div>
                    </div>
                  </div>

                  {/* Cricket Profile */}
                  <div className="player-detail-section">
                    <h4><Target size={14} color="var(--adm-gold)" /> Cricket Profile</h4>
                    <div className="player-detail-rows">
                      <div className="player-detail-row"><span><Zap size={13}/>Batting Hand</span><strong>{selected.batting_hand || '—'}</strong></div>
                      <div className="player-detail-row"><span><Target size={13}/>Bowling Type</span><strong>{selected.bowling_type || '—'}</strong></div>
                      <div className="player-detail-row"><span><Hash size={13}/>Category</span><strong style={{ textTransform: 'capitalize' }}>{selected.player_category || '—'}</strong></div>
                      <div className="player-detail-row"><span><Shield size={13}/>Roles</span><strong>{[selected.wicket_keeper && 'WK', selected.all_rounder && 'All-Rounder', selected.bowler && 'Bowler', selected.batsman && 'Batsman'].filter(Boolean).join(', ') || '—'}</strong></div>
                      <div className="player-detail-row"><span><CheckCircle2 size={13}/>Played KPL Before</span><strong>{selected.previously_played ? 'Yes' : 'No'}</strong></div>
                    </div>
                  </div>

                  {/* Documents & Payment */}
                  <div className="player-detail-section player-detail-docs">
                    <h4><FileText size={14} color="var(--adm-gold)" /> Verification Documents & Payment</h4>
                    <div className="player-detail-doc-row">
                      {selected.address_proof ? (
                        <div className="player-detail-doc-thumb" onClick={() => openAddressProof(selected.address_proof, `${selected.player_name} - Address Proof`, selected)} style={{ cursor: 'pointer' }}>
                          {selected.address_proof.toLowerCase().includes('.pdf') || selected.address_proof.startsWith('data:application/pdf') ? (
                            <div style={{ width: '100%', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--adm-panel)' }}>
                              <FileText size={28} color="var(--adm-gold)" />
                              <span style={{ fontSize: '9px', color: 'var(--adm-text-muted)', fontWeight: 700 }}>PDF</span>
                            </div>
                          ) : (
                            <img src={getImageUrl(selected.address_proof)} alt="Address Proof" />
                          )}
                          <span>Address Proof ↗</span>
                        </div>
                      ) : <span className="player-detail-no-doc">No address proof uploaded</span>}

                      {/* Payment Proof Tile */}
                      {(() => {
                        const pay = getPlayerPayment(selected);
                        const proof = pay?.screenshot || pay?.payment_proof || pay?.proof_url || selected.address_proof;
                        if (proof) {
                          return (
                            <div
                              className="player-detail-doc-thumb"
                              onClick={() => openPaymentProof(selected)}
                              style={{ cursor: 'pointer', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                            >
                              <img src={getImageUrl(proof)} alt="Payment Screenshot" />
                              <span style={{ color: '#10b981' }}>Payment Proof ↗</span>
                            </div>
                          );
                        }
                        if (pay) {
                          return (
                            <div
                              className="player-detail-doc-thumb"
                              onClick={() => openPaymentProof(selected)}
                              style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}
                              title="Click to view payment UTR details"
                            >
                              <div style={{ width: '100%', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <CreditCard size={26} color="#10b981" />
                                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>₹{pay.amount || 'Paid'}</span>
                              </div>
                              <span style={{ fontSize: '10px', color: '#10b981' }}>UTR: {pay.payment_id?.slice(-8) || 'Paid'} ↗</span>
                            </div>
                          );
                        }
                        return <span className="player-detail-no-doc">No payment proof uploaded</span>;
                      })()}

                      {selected.player_signature ? (
                        <div className="player-detail-doc-thumb player-detail-sig">
                          <img src={getImageUrl(selected.player_signature)} alt="Signature" />
                          <span>Signature</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="player-detail-row" style={{ marginTop: '10px' }}>
                      <span><CheckCircle2 size={13}/>Declaration</span>
                      <strong style={{ color: selected.declaration_accepted ? '#4ade80' : '#f87171' }}>
                        {selected.declaration_accepted ? 'Accepted ✅' : 'Not Accepted ❌'}
                      </strong>
                    </div>
                  </div>

                </div>
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

        {/* Document & Payment Proof Viewer Modal */}
        {proofModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999 }} onClick={() => setProofModal(null)}>
            <div className="admin-modal" style={{ maxWidth: '850px', width: '92%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
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

              {/* Multi-document Navigation Tabs */}
              {(proofModal.player || proofModal.payment) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 20px', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid var(--adm-border)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const payImg = proofModal.payment?.screenshot || proofModal.player?.address_proof || proofModal.player?.photo || '';
                        setProofModal({ ...proofModal, activeTab: 'payment', url: payImg });
                      }}
                      className={`admin-btn ${proofModal.activeTab === 'payment' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CreditCard size={14} />
                      <span>Payment Proof {proofModal.payment?.screenshot ? '✓' : '(Fallback Doc)'}</span>
                    </button>

                    {proofModal.player?.address_proof && (
                      <button
                        type="button"
                        onClick={() => setProofModal({ ...proofModal, activeTab: 'address', url: proofModal.player!.address_proof! })}
                        className={`admin-btn ${proofModal.activeTab === 'address' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                        style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileText size={14} />
                        <span>Address Proof / ID</span>
                      </button>
                    )}

                    {proofModal.player?.photo && (
                      <button
                        type="button"
                        onClick={() => setProofModal({ ...proofModal, activeTab: 'photo', url: proofModal.player!.photo! })}
                        className={`admin-btn ${proofModal.activeTab === 'photo' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                        style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <ImageIcon size={14} />
                        <span>Player Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Direct Attach / Change Button */}
                  <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', padding: '5px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={13} />
                    <span>{attachingScreenshot ? 'Attaching...' : 'Attach / Change Screenshot'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={attachingScreenshot}
                      onChange={(e) => handleAttachScreenshotToPayment(e, proofModal.payment?.id, proofModal.player)}
                    />
                  </label>
                </div>
              )}

              {/* Informative notification if viewing fallback document */}
              {proofModal.activeTab === 'payment' && !proofModal.payment?.screenshot && proofModal.url && (
                <div style={{ padding: '8px 20px', background: 'rgba(234, 179, 8, 0.1)', borderBottom: '1px solid rgba(234, 179, 8, 0.25)', fontSize: '12px', color: '#facc15', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>
                    No separate UPI payment slip was attached to the payment record. Showing player&apos;s submitted verification document ({proofModal.player?.player_name}&apos;s proof/photo). You can attach a UPI screenshot anytime using the button above.
                  </span>
                </div>
              )}

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
                      {proofModal.meta || 'Pending manual verification'}
                    </div>
                    <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                      <Upload size={16} />
                      <span>{attachingScreenshot ? 'Attaching...' : 'Upload Payment Screenshot'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={attachingScreenshot}
                        onChange={(e) => handleAttachScreenshotToPayment(e, proofModal.payment?.id, proofModal.player)}
                      />
                    </label>
                  </div>
                ) : proofModal.url.startsWith('data:application/pdf') || proofModal.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={proofModal.url} title={proofModal.title} style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '8px' }} />
                ) : (
                  <img src={getImageUrl(proofModal.url)} alt={proofModal.title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                )}
              </div>

              <div className="admin-modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div>
                  {proofModal.player && (proofModal.player.status === 'pending' || proofModal.player.approval === 'pending') && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={async () => {
                        await handleApprove(proofModal.player!);
                        setProofModal(null);
                      }}
                    >
                      <UserCheck size={14} />
                      <span>Approve Player &amp; Payment</span>
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

      {slipPlayer && (
        <RegistrationSlipModal 
          isOpen={true} 
          onClose={() => setSlipPlayer(null)} 
          player={slipPlayer} 
        />
      )}
    </AdminLayout>
  );
}
