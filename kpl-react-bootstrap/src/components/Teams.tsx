import React from 'react';
import type { Team } from '../types';
import { MapPin } from 'lucide-react';

interface TeamsProps {
  teams: Team[];
}

export const Teams: React.FC<TeamsProps> = ({ teams }) => {
  return (
    <section id="teams" className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">KPL Franchises</span>
          <h2 className="section-title">Participating Franchise Teams</h2>
          <p className="text-muted">Eight elite teams competing for KPL Season 3 Glory</p>
        </div>

        <div className="row g-4">
          {teams.map((team) => (
            <div key={team.id} className="col-md-6 col-lg-4">
              <div className="kpl-card p-4 h-100 position-relative">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{
                      width: '48px',
                      height: '48px',
                      background: team.primary_color,
                      border: `1px solid ${team.secondary_color}`,
                    }}
                  >
                    {team.short_name}
                  </div>
                  <div>
                    <h4 className="text-white fs-5 mb-0 fw-bold">{team.name}</h4>
                    <span className="badge badge-green text-uppercase fs-8 mt-1">
                      <MapPin size={12} className="me-1" /> {team.city}
                    </span>
                  </div>
                </div>

                <hr className="border-secondary opacity-25" />

                <div className="d-flex flex-column gap-2 text-slate-300 small">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Franchise Owner:</span>
                    <strong className="text-white">{team.owner_name}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Captain:</span>
                    <strong className="text-success">{team.captain_name || 'TBA'}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Squad Strength:</span>
                    <span className="badge badge-blue">{team.squad_count} Players</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
