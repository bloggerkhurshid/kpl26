import React, { useState } from 'react';
import type { Player } from '../types';
import { Search } from 'lucide-react';

interface PlayersProps {
  players: Player[];
}

export const Players: React.FC<PlayersProps> = ({ players }) => {
  const [filterRole, setFilterRole] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPlayers = players.filter((player) => {
    const matchesRole = filterRole === 'All' || player.role === filterRole;
    const matchesSearch =
      player.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.village.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <section id="players" className="py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="section-subtitle">Auction & Player Pool</span>
          <h2 className="section-title">Registered Players</h2>
          <p className="text-muted">Explore players draft list for KPL Season 3</p>
        </div>

        {/* Filters */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-md-6">
            <div className="d-flex flex-wrap gap-2">
              {['All', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                <button
                  key={role}
                  className={`btn btn-sm rounded-pill px-3 ${
                    filterRole === role ? 'btn-kpl-green' : 'btn-kpl-outline'
                  }`}
                  onClick={() => setFilterRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="col-md-4">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control kpl-form-control ps-5"
                placeholder="Search by name, reg # or village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="row g-4">
          {filteredPlayers.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">No registered players match your search criteria.</div>
          ) : (
            filteredPlayers.map((player) => (
              <div key={player.id} className="col-md-6 col-lg-4 col-xl-3">
                <div className="kpl-card p-3 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <img
                      src={player.photo_url || '/images/kpl-logo.jpg'}
                      alt={player.full_name}
                      className="rounded-3 border border-success border-opacity-30"
                      style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                    />
                    <div className="overflow-hidden">
                      <span className="text-success fs-8 fw-bold tracking-wider">{player.registration_number}</span>
                      <h5 className="text-white fs-6 mb-0 fw-bold text-truncate">{player.full_name}</h5>
                      <span className="text-muted fs-8">{player.village}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-top border-secondary border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge badge-green">{player.role}</span>
                      <span className="badge badge-gold">{player.category}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Base Price:</span>
                      <strong className="text-white">{player.base_price}</strong>
                    </div>

                    {player.team_name && (
                      <div className="mt-2 text-center py-1 bg-success bg-opacity-10 rounded text-success small fw-bold">
                        {player.team_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
