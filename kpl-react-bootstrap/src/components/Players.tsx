import React, { useState } from 'react';
import type { Player } from '../types';
import { Search, UserCheck } from 'lucide-react';
import { getImageUrl } from '../api';

interface PlayersProps {
  players: Player[];
}

export const Players: React.FC<PlayersProps> = ({ players }) => {
  const [filterRole, setFilterRole] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPlayers = players.filter((player) => {
    const role = player.role || '';
    const matchesRole =
      filterRole === 'All' || role.toLowerCase().includes(filterRole.toLowerCase());
    const name = (player.full_name || '').toLowerCase();
    const reg = (player.registration_number || '').toLowerCase();
    const village = (player.village || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = name.includes(q) || reg.includes(q) || village.includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <section id="players" className="py-5 border-bottom" style={{ background: '#f8fafc' }}>
      <div className="container py-4">
        <div className="mb-4">
          <div className="section-label">Auction & Player Pool</div>
          <h2 className="sport-heading">Registered Players</h2>
          <p className="text-muted fs-6">Explore the players draft list for KPL Season 3</p>
        </div>

        {/* Filters */}
        <div className="row g-3 justify-content-between align-items-center mb-4">
          <div className="col-md-7">
            <div className="d-flex flex-wrap gap-2">
              {['All', 'Batter', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                <button
                  key={role}
                  className={`btn btn-sm rounded-pill px-3 fw-bold ${
                    filterRole === role ? 'button-primary py-1 px-3 fs-8' : 'btn-outline-secondary text-dark bg-white'
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
            <div className="col-12 text-center py-5 text-muted bg-white rounded-3 border">
              <UserCheck size={40} className="text-muted mb-2 opacity-50" />
              <p className="mb-0">No registered players match your search criteria.</p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const photo = getImageUrl(player.photo_url) || '/images/kpl-logo.jpg';

              return (
                <div key={player.id} className="col-6 col-md-4 col-lg-3">
                  <div className="player-card">
                    <img
                      src={photo}
                      alt={player.full_name}
                      className="player-photo"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/kpl-logo.jpg';
                      }}
                    />

                    <div className="p-3 bg-white">
                      <span className="text-muted fs-8 fw-bold d-block mb-1 font-monospace">
                        {player.registration_number}
                      </span>
                      <h3 className="sport-heading fs-6 mb-1 text-truncate" title={player.full_name}>
                        {player.full_name}
                      </h3>
                      <p className="text-muted small mb-2 text-truncate">{player.village || 'Assam'}</p>

                      <div className="d-flex flex-wrap gap-1 mb-2">
                        <span className="player-role-badge">{player.role || 'All-Rounder'}</span>
                        <span className="player-category-badge">{player.category || 'Local'}</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span className="text-muted small">Base Price:</span>
                        <strong className="text-dark fs-7">{player.base_price || '₹ 500'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

