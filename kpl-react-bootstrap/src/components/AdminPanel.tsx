import React, { useState, useEffect } from 'react';
import type { Player, Team, ContentSettings } from '../types';
import {
  Shield,
  Users,
  Trophy,
  CheckCircle,
  Search,
  LogOut,
  Settings,
  BarChart2,
  CreditCard,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Download,
} from 'lucide-react';
import { kplApi, type ApiPayment, type ApiFeeSettings } from '../api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  teams: Team[];
  contentSettings?: ContentSettings;
  feeSettings?: ApiFeeSettings | null;
  onApprovePlayer: (id: string) => void;
  onUpdateFeeSettings?: (newFees: any) => void;
  onUpdateContentSettings?: (newContent: any) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  players,
  teams,
  contentSettings,
  feeSettings,
  onApprovePlayer,
  onUpdateFeeSettings,
  onUpdateContentSettings,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'players' | 'teams' | 'payments' | 'settings'>('players');
  const [search, setSearch] = useState('');
  const [playerStatusFilter, setPlayerStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Payments from API
  const [payments, setPayments] = useState<ApiPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ url: string; title: string } | null>(null);

  // Settings form
  const [formFees, setFormFees] = useState({
    fee_player: feeSettings?.fee_player || 500,
    fee_foreign_player: feeSettings?.fee_foreign_player || 1000,
    fee_team: feeSettings?.fee_team || 5000,
    upi_id: feeSettings?.upi_id || '8638479115@ybl',
    upi_payee_name: feeSettings?.upi_payee_name || 'Khoraghat Premier League',
  });

  const [formContent, setFormContent] = useState({
    hero_title: contentSettings?.hero_title || '',
    hero_subtitle: contentSettings?.hero_subtitle || '',
    deadline_date: contentSettings?.deadline_date || '2026-09-20',
    deadline_text: contentSettings?.deadline_text || '',
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (feeSettings) {
      setFormFees({
        fee_player: feeSettings.fee_player || 500,
        fee_foreign_player: feeSettings.fee_foreign_player || 1000,
        fee_team: feeSettings.fee_team || 5000,
        upi_id: feeSettings.upi_id || '8638479115@ybl',
        upi_payee_name: feeSettings.upi_payee_name || 'Khoraghat Premier League',
      });
    }
    if (contentSettings) {
      setFormContent({
        hero_title: contentSettings.hero_title || '',
        hero_subtitle: contentSettings.hero_subtitle || '',
        deadline_date: contentSettings.deadline_date || '2026-09-20',
        deadline_text: contentSettings.deadline_text || '',
      });
    }
  }, [feeSettings, contentSettings]);

  // Load payments when authenticated or tab changes
  useEffect(() => {
    if (isAuthenticated && activeTab === 'payments') {
      setLoadingPayments(true);
      kplApi
        .getPayments()
        .then((res) => {
          if (Array.isArray(res)) setPayments(res);
        })
        .catch(console.warn)
        .finally(() => setLoadingPayments(false));
    }
  }, [isAuthenticated, activeTab]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthLoading(true);

    try {
      const res = await kplApi.adminLogin({ username, password }).catch(() => null);
      if (res?.status === 'success' || (username === 'admin' && password === 'kpl2026')) {
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid credentials! Default demo: admin / kpl2026');
      }
    } catch {
      if (username === 'admin' && password === 'kpl2026') {
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid credentials! Default demo: admin / kpl2026');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await kplApi.updatePaymentStatus(paymentId, 'verified');
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: 'verified' } : p))
      );
    } catch (err) {
      console.warn('verify payment err:', err);
    }
  };

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccessMsg('');

    try {
      await Promise.all([
        kplApi.saveFeeSettings(formFees).catch(console.warn),
        kplApi.saveContentSettings(formContent).catch(console.warn),
      ]);

      if (onUpdateFeeSettings) onUpdateFeeSettings(formFees);
      if (onUpdateContentSettings) onUpdateContentSettings(formContent);

      setSaveSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      setSaveSuccessMsg('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      (p.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.registration_number || '').toLowerCase().includes(search.toLowerCase());

    const pStatus = (p.status || 'Pending').toLowerCase();
    if (playerStatusFilter === 'pending') return matchesSearch && pStatus === 'pending';
    if (playerStatusFilter === 'approved') return matchesSearch && (pStatus === 'approved' || pStatus === 'sold');
    return matchesSearch;
  });

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)', zIndex: 1100 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="kpl-modal-content p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-warning bg-opacity-20 p-2 rounded-3 text-dark">
                <Shield size={26} className="text-warning" />
              </div>
              <div>
                <h4 className="sport-heading fs-4 mb-0 text-dark">KPL Admin Control Panel</h4>
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-uppercase fs-8">
                  Official KPL Season 3 Manager
                </span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {!isAuthenticated ? (
            /* Login Form */
            <div className="row justify-content-center py-5">
              <div className="col-md-6 col-lg-5">
                <div className="kpl-card p-4 text-center">
                  <div className="bg-warning bg-opacity-20 text-dark p-3 rounded-circle d-inline-flex mb-3">
                    <Shield size={36} />
                  </div>
                  <h4 className="sport-heading text-dark mb-1">Admin Sign In</h4>
                  <p className="text-muted small mb-4">Enter credentials to manage KPL Season 3</p>

                  {loginError && (
                    <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 text-start">
                      <AlertCircle size={16} /> <span>{loginError}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="text-start">
                    <div className="mb-3">
                      <label className="form-label text-dark small fw-bold">Username</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-dark small fw-bold">Password</label>
                      <input
                        type="password"
                        className="form-control form-control-light"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="button-primary w-100 py-2.5 mt-2"
                    >
                      <span>
                        {authLoading ? (
                          <>
                            <Loader2 size={16} className="spinner-border spinner-border-sm me-2" /> Signing in...
                          </>
                        ) : (
                          'Sign In to Dashboard'
                        )}
                      </span>
                    </button>
                    <p className="text-muted fs-8 text-center mt-3 mb-0">
                      Default Demo: <strong>admin</strong> / <strong>kpl2026</strong>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated Admin Dashboard */
            <div>
              {/* Top Summary Metrics */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="sport-heading fs-4 mb-0 text-dark">{players.length}</h3>
                      <span className="text-muted small">Total Players</span>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="sport-heading fs-4 mb-0 text-dark">{teams.length}</h3>
                      <span className="text-muted small">Registered Teams</span>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-warning bg-opacity-20 text-dark rounded-3">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 className="sport-heading fs-4 mb-0 text-dark">₹1,50,000</h3>
                      <span className="text-muted small">Prize Pool</span>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-info bg-opacity-10 text-info rounded-3">
                      <BarChart2 size={24} />
                    </div>
                    <div>
                      <h3 className="sport-heading fs-4 mb-0 text-dark">UPI Direct</h3>
                      <span className="text-muted small">Active Gateway</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div className="d-flex flex-wrap gap-2">
                  <button
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${
                      activeTab === 'players' ? 'button-primary text-dark border-0' : 'btn-outline-secondary text-dark bg-white'
                    }`}
                    onClick={() => setActiveTab('players')}
                  >
                    <Users size={14} className="me-1" /> Players ({players.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${
                      activeTab === 'teams' ? 'button-primary text-dark border-0' : 'btn-outline-secondary text-dark bg-white'
                    }`}
                    onClick={() => setActiveTab('teams')}
                  >
                    <Shield size={14} className="me-1" /> Teams ({teams.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${
                      activeTab === 'payments' ? 'button-primary text-dark border-0' : 'btn-outline-secondary text-dark bg-white'
                    }`}
                    onClick={() => setActiveTab('payments')}
                  >
                    <CreditCard size={14} className="me-1" /> UPI Payments ({payments.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${
                      activeTab === 'settings' ? 'button-primary text-dark border-0' : 'btn-outline-secondary text-dark bg-white'
                    }`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings size={14} className="me-1" /> Fees & Content
                  </button>
                </div>

                <button
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                  onClick={() => setIsAuthenticated(false)}
                >
                  <LogOut size={14} className="me-1" /> Sign Out
                </button>
              </div>

              {/* TAB 1: PLAYERS */}
              {activeTab === 'players' && (
                <div>
                  <div className="row g-2 mb-3 align-items-center">
                    <div className="col-md-6">
                      <div className="position-relative">
                        <Search
                          size={16}
                          className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                        />
                        <input
                          type="text"
                          className="form-control form-control-light ps-5"
                          placeholder="Search player name or reg number..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6 text-md-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className={`btn ${playerStatusFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
                          onClick={() => setPlayerStatusFilter('all')}
                        >
                          All ({players.length})
                        </button>
                        <button
                          type="button"
                          className={`btn ${playerStatusFilter === 'pending' ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                          onClick={() => setPlayerStatusFilter('pending')}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          className={`btn ${playerStatusFilter === 'approved' ? 'btn-success' : 'btn-outline-secondary'}`}
                          onClick={() => setPlayerStatusFilter('approved')}
                        >
                          Approved
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive rounded-3 border bg-white shadow-sm">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Reg #</th>
                          <th>Player Name</th>
                          <th>Role</th>
                          <th>Category</th>
                          <th>Village</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              No players match the search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredPlayers.map((player) => (
                            <tr key={player.id}>
                              <td className="fw-bold font-monospace text-primary">
                                {player.registration_number}
                              </td>
                              <td className="fw-bold text-dark">{player.full_name}</td>
                              <td>
                                <span className="player-role-badge">{player.role}</span>
                              </td>
                              <td>
                                <span className="player-category-badge">{player.category}</span>
                              </td>
                              <td className="small text-muted">{player.village}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    player.status === 'Sold'
                                      ? 'bg-primary'
                                      : player.status === 'Approved'
                                      ? 'bg-success'
                                      : 'bg-warning text-dark'
                                  } rounded-pill px-2.5 py-1`}
                                >
                                  {player.status || 'Pending'}
                                </span>
                              </td>
                              <td className="text-end">
                                {player.status === 'Pending' && (
                                  <button
                                    className="btn btn-sm btn-success rounded-pill px-3 py-1 me-1"
                                    onClick={() => onApprovePlayer(player.id)}
                                  >
                                    <CheckCircle size={13} className="me-1" /> Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: TEAMS */}
              {activeTab === 'teams' && (
                <div className="table-responsive rounded-3 border bg-white shadow-sm">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Team</th>
                        <th>Owner</th>
                        <th>Captain</th>
                        <th>City</th>
                        <th>Squad Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => (
                        <tr key={team.id}>
                          <td className="fw-bold text-dark">
                            <span
                              className="d-inline-block rounded-circle me-2"
                              style={{
                                width: '12px',
                                height: '12px',
                                background: team.primary_color || '#d4af37',
                              }}
                            ></span>
                            {team.name} ({team.short_name})
                          </td>
                          <td>{team.owner_name}</td>
                          <td className="text-primary fw-bold">{team.captain_name || 'TBA'}</td>
                          <td>{team.city}</td>
                          <td>
                            <span className="badge bg-light text-dark border px-2.5 py-1">
                              {team.squad_count} Players
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: PAYMENTS (UPI UTR VERIFICATION) */}
              {activeTab === 'payments' && (
                <div>
                  <p className="text-muted small mb-3">
                    Review incoming direct UPI registration fee submissions with UTR numbers. Click 'Approve' to confirm receipt.
                  </p>
                  <div className="table-responsive rounded-3 border bg-white shadow-sm">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Registration ID</th>
                          <th>Type</th>
                          <th>Payer Name</th>
                          <th>Contact</th>
                          <th>Amount</th>
                          <th>UPI UTR / Ref No</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingPayments ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted">
                              <Loader2 size={20} className="spinner-border spinner-border-sm me-2" /> Loading payments...
                            </td>
                          </tr>
                        ) : payments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted">
                              No payment references submitted yet. New UPI submissions will appear here.
                            </td>
                          </tr>
                        ) : (
                          payments.map((p) => (
                            <tr key={p.id}>
                              <td className="fw-bold font-monospace text-primary">{p.registration_id}</td>
                              <td className="text-capitalize">{p.registration_type}</td>
                              <td className="fw-semibold text-dark">{p.name}</td>
                              <td className="small text-muted">{p.phone}</td>
                              <td className="font-monospace text-dark fw-bold">
                                <div>{p.payment_id}</div>
                                {p.screenshot && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-info rounded-pill px-2 py-0 mt-1 d-inline-flex align-items-center gap-1"
                                    style={{ fontSize: '11px', fontWeight: 600 }}
                                    onClick={() => setSelectedScreenshot({
                                      url: p.screenshot!,
                                      title: `${p.name} (Ref: ${p.payment_id || 'N/A'})`
                                    })}
                                    title="View Payment Proof Screenshot"
                                  >
                                    <ImageIcon size={11} /> Screenshot
                                  </button>
                                )}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    p.status === 'verified' ? 'bg-success' : 'bg-warning text-dark'
                                  } rounded-pill px-2.5 py-1`}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td className="text-end">
                                {p.status !== 'verified' && (
                                  <button
                                    className="btn btn-sm btn-success rounded-pill px-3 py-1"
                                    onClick={() => handleVerifyPayment(p.id)}
                                  >
                                    <Check size={13} className="me-1" /> Approve
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: SETTINGS & CONTENT */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveAllSettings} className="kpl-card p-4">
                  {saveSuccessMsg && (
                    <div className="alert alert-success py-2 small d-flex align-items-center gap-2 mb-4">
                      <CheckCircle size={16} /> <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  <h5 className="sport-heading fs-5 mb-3 text-dark">UPI Gateway & Fee Settings</h5>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label text-dark small fw-bold">Player Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-light"
                        value={formFees.fee_player}
                        onChange={(e) =>
                          setFormFees({ ...formFees, fee_player: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-dark small fw-bold">Foreign Player Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-light"
                        value={formFees.fee_foreign_player}
                        onChange={(e) =>
                          setFormFees({ ...formFees, fee_foreign_player: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-dark small fw-bold">Team Fee (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-light"
                        value={formFees.fee_team}
                        onChange={(e) =>
                          setFormFees({ ...formFees, fee_team: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Merchant UPI VPA ID</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        value={formFees.upi_id}
                        onChange={(e) => setFormFees({ ...formFees, upi_id: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Payee Account Name</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        value={formFees.upi_payee_name}
                        onChange={(e) => setFormFees({ ...formFees, upi_payee_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <h5 className="sport-heading fs-5 mb-3 text-dark border-top pt-4">
                    Homepage Content & Countdown Deadline
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Countdown Deadline Date</label>
                      <input
                        type="date"
                        className="form-control form-control-light"
                        value={formContent.deadline_date}
                        onChange={(e) =>
                          setFormContent({ ...formContent, deadline_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Deadline Subtitle Text</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        value={formContent.deadline_text}
                        onChange={(e) =>
                          setFormContent({ ...formContent, deadline_text: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-dark small fw-bold">Hero Headline Title</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        value={formContent.hero_title}
                        onChange={(e) =>
                          setFormContent({ ...formContent, hero_title: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-dark small fw-bold">Hero Subtitle</label>
                      <textarea
                        rows={2}
                        className="form-control form-control-light"
                        value={formContent.hero_subtitle}
                        onChange={(e) =>
                          setFormContent({ ...formContent, hero_subtitle: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top text-end">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="button-primary py-2.5 px-4"
                    >
                      <span>
                        {savingSettings ? (
                          <>
                            <Loader2 size={16} className="spinner-border spinner-border-sm me-2" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="me-1" /> Save All Settings
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1060 }}
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-bottom py-2.5 px-3">
                <h6 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <ImageIcon size={16} className="text-primary" /> Payment Proof Screenshot
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedScreenshot(null)}
                />
              </div>
              <div className="modal-body text-center p-3">
                <p className="text-muted small mb-2">{selectedScreenshot.title}</p>
                <div
                  className="rounded-3 border overflow-auto bg-dark p-2"
                  style={{ maxHeight: '65vh' }}
                >
                  <img
                    src={selectedScreenshot.url}
                    alt="Payment Screenshot"
                    className="img-fluid rounded"
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
              </div>
              <div className="modal-footer border-top py-2 px-3 justify-content-between">
                <a
                  href={selectedScreenshot.url}
                  download="payment_screenshot"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                >
                  <Download size={13} /> Download
                </a>
                <button
                  type="button"
                  className="btn btn-sm btn-primary px-3"
                  onClick={() => setSelectedScreenshot(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

