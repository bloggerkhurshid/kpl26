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
    <section id="players" className="py-5 border-bottom" style={{ background: '#f8fafc' }}>
      <div className="container py-4">
        <div className="mb-4">
          <div className="section-label">Auction & Player Pool</div>
          <h2 className="sport-heading">Registered Players</h2>
          <p className="text-muted fs-6">Explore players draft list for KPL Season 3</p>
        </div>

        {/* Filters */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-md-7">
            <div className="d-flex flex-wrap gap-2">
              {['All', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                <button
                  key={role}
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${
                    filterRole === role ? 'btn-dark text-warning' : 'btn-outline-secondary text-dark bg-white'
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
                className="form-control form-control-light ps-5"
                placeholder="Search name, reg # or village..."
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
              <div key={player.id} className="col-6 col-md-4 col-lg-3">
                <div className="player-card">
                  <img
                    src={player.photo_url || '/images/kpl-logo.jpg'}
                    alt={player.full_name}
                    className="player-photo"
                  />

                  <div className="p-3 bg-white">
                    <span className="text-muted fs-8 fw-bold d-block mb-1">{player.registration_number}</span>
                    <h3 className="sport-heading fs-6 mb-2 text-truncate">{player.full_name}</h3>
                    <p className="text-muted small mb-2">{player.village}</p>

                    <div className="d-flex flex-wrap gap-1 mb-2">
                      <span className="player-role-badge">{player.role}</span>
                      <span className="player-category-badge">{player.category}</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="text-muted small">Base Price:</span>
                      <strong className="text-dark fs-7">{player.base_price}</strong>
                    </div>
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
