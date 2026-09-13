import React, { useState } from 'react';
import type { Player, Team } from '../types';
import { Shield, Users, Trophy, CheckCircle, Search, LogOut, Settings, BarChart2 } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  teams: Team[];
  onApprovePlayer: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  players,
  teams,
  onApprovePlayer,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'players' | 'teams' | 'settings'>('players');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'kpl2026') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password! Try admin / kpl2026');
    }
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.registration_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(4,13,26,0.95)', backdropFilter: 'blur(16px)', zIndex: 1100 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="kpl-modal-content p-4 border border-success border-opacity-30">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary border-opacity-25 pb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success p-2 rounded-3 text-white">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="text-white fw-bold mb-0">KPL Admin Control Panel</h4>
                <span className="badge badge-green text-uppercase fs-8">Season 3 · 2026 Green Theme Edition</span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {!isAuthenticated ? (
            /* Login Form */
            <div className="row justify-content-center py-5">
              <div className="col-md-6 col-lg-5">
                <div className="kpl-card p-4 text-center">
                  <div className="bg-success bg-opacity-20 text-success p-3 rounded-circle d-inline-flex mb-3">
                    <Shield size={36} />
                  </div>
                  <h4 className="text-white fw-bold mb-2">Admin Sign In</h4>
                  <p className="text-muted small mb-4">Enter master credentials to manage KPL 2026</p>

                  {loginError && <div className="alert alert-danger py-2 small">{loginError}</div>}

                  <form onSubmit={handleLogin} className="text-start">
                    <div className="mb-3">
                      <label className="form-label text-slate-300 small fw-bold">Username</label>
                      <input
                        type="text"
                        className="form-control kpl-form-control"
                        placeholder="admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-slate-300 small fw-bold">Password</label>
                      <input
                        type="password"
                        className="form-control kpl-form-control"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-kpl-green w-100 rounded-pill py-2.5">
                      Sign In to Admin Panel
                    </button>
                    <p className="text-muted small text-center mt-3 mb-0">Default Demo: admin / kpl2026</p>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated Admin Dashboard */
            <div>
              {/* Top Stats */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-success bg-opacity-20 text-success rounded-3">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-white fw-bold mb-0">{players.length}</h3>
                      <span className="text-muted small">Total Players</span>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-success bg-opacity-20 text-success rounded-3">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="text-white fw-bold mb-0">{teams.length}</h3>
                      <span className="text-muted small">Registered Teams</span>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-warning bg-opacity-20 text-warning rounded-3">
                      <Trophy size={24} />
                    </div>
                    <div>
                      <h3 className="text-white fw-bold mb-0">₹1,50,000</h3>
                      <span className="text-muted small">Total Prize Pool</span>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="kpl-card p-3 d-flex align-items-center gap-3">
                    <div className="p-3 bg-info bg-opacity-20 text-info rounded-3">
                      <BarChart2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-white fw-bold mb-0">Active</h3>
                      <span className="text-muted small">UPI Gateway</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex gap-2">
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${
                      activeTab === 'players' ? 'btn-kpl-green' : 'btn-kpl-outline'
                    }`}
                    onClick={() => setActiveTab('players')}
                  >
                    <Users size={14} className="me-1" /> Manage Players ({players.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${
                      activeTab === 'teams' ? 'btn-kpl-green' : 'btn-kpl-outline'
                    }`}
                    onClick={() => setActiveTab('teams')}
                  >
                    <Shield size={14} className="me-1" /> Manage Teams ({teams.length})
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill px-3 ${
                      activeTab === 'settings' ? 'btn-kpl-green' : 'btn-kpl-outline'
                    }`}
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings size={14} className="me-1" /> Settings & Gateway
                  </button>
                </div>

                <button
                  className="btn btn-outline-danger btn-sm rounded-pill px-3"
                  onClick={() => setIsAuthenticated(false)}
                >
                  <LogOut size={14} className="me-1" /> Sign Out
                </button>
              </div>

              {/* Search Bar */}
              {activeTab === 'players' && (
                <div className="position-relative mb-3">
                  <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                  <input
                    type="text"
                    className="form-control kpl-form-control ps-5"
                    placeholder="Search player name or reg number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}

              {/* Tab Content */}
              {activeTab === 'players' && (
                <div className="table-responsive rounded-3 border border-secondary border-opacity-25">
                  <table className="table kpl-table align-middle">
                    <thead>
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
                      {filteredPlayers.map((player) => (
                        <tr key={player.id}>
                          <td className="fw-bold text-success">{player.registration_number}</td>
                          <td className="fw-bold text-white">{player.full_name}</td>
                          <td>
                            <span className="badge badge-green">{player.role}</span>
                          </td>
                          <td>
                            <span className="badge badge-gold">{player.category}</span>
                          </td>
                          <td>{player.village}</td>
                          <td>
                            <span
                              className={`badge ${
                                player.status === 'Sold'
                                  ? 'badge-blue'
                                  : player.status === 'Approved'
                                  ? 'badge-green'
                                  : 'bg-warning text-dark'
                              }`}
                            >
                              {player.status}
                            </span>
                          </td>
                          <td className="text-end">
                            {player.status === 'Pending' && (
                              <button
                                className="btn btn-kpl-green btn-sm rounded-pill py-1 px-3 me-1"
                                onClick={() => onApprovePlayer(player.id)}
                              >
                                <CheckCircle size={13} className="me-1" /> Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'teams' && (
                <div className="table-responsive rounded-3 border border-secondary border-opacity-25">
                  <table className="table kpl-table align-middle">
                    <thead>
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
                          <td className="fw-bold text-white">
                            <span
                              className="d-inline-block rounded-circle me-2"
                              style={{
                                width: '10px',
                                height: '10px',
                                background: team.primary_color,
                              }}
                            ></span>
                            {team.name} ({team.short_name})
                          </td>
                          <td>{team.owner_name}</td>
                          <td className="text-success fw-bold">{team.captain_name || 'TBA'}</td>
                          <td>{team.city}</td>
                          <td>
                            <span className="badge badge-blue">{team.squad_count} Players</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="kpl-card p-4">
                  <h5 className="text-white fw-bold mb-3">UPI Gateway & Fee Settings</h5>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Player Fee (₹)</label>
                      <input type="number" className="form-control kpl-form-control" defaultValue={500} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Team Fee (₹)</label>
                      <input type="number" className="form-control kpl-form-control" defaultValue={5000} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Merchant UPI ID</label>
                      <input type="text" className="form-control kpl-form-control" defaultValue="kpl2026@paytm" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Merchant Name</label>
                      <input type="text" className="form-control kpl-form-control" defaultValue="KPL Organising Committee" />
                    </div>
                  </div>
                  <div className="mt-4 text-end">
                    <button className="btn btn-kpl-green rounded-pill px-4">Save Green Theme Settings</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
