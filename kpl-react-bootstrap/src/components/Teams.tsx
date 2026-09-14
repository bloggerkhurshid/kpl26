import React from 'react';
import type { Team } from '../types';
import { MapPin, Shield } from 'lucide-react';
import { getImageUrl } from '../api';

interface TeamsProps {
  teams: Team[];
}

export const Teams: React.FC<TeamsProps> = ({ teams }) => {
  return (
    <section id="teams" className="py-5 bg-white border-bottom">
      <div className="container py-4">
        <div className="mb-5">
          <div className="section-label">KPL Franchises</div>
          <h2 className="sport-heading">Participating Franchise Teams</h2>
          <p className="text-muted fs-6">Eight elite teams competing for KPL Season 3 Glory</p>
        </div>

        <div className="row g-4">
          {teams.map((team) => {
            const logo = getImageUrl(team.logo_url) || '/images/kpl-logo.jpg';

            return (
              <div key={team.id} className="col-md-6 col-lg-4">
                <div className="team-card">
                  <div className="team-card-top">
                    {logo ? (
                      <img
                        src={logo}
                        alt={team.name}
                        className="team-logo-avatar"
                        onError={(e) => {
                          // Fallback to default KPL logo if remote image fails
                          (e.currentTarget as HTMLImageElement).src = '/images/kpl-logo.jpg';
                        }}
                      />
                    ) : (
                      <div className="team-logo-avatar d-flex align-items-center justify-content-center bg-warning bg-opacity-20 text-dark fw-bold">
                        <Shield size={20} />
                      </div>
                    )}
                    <span className="team-short">{team.short_name || team.name.slice(0, 3).toUpperCase()}</span>
                  </div>

                  <div className="px-4 pt-3">
                    <h3 className="sport-heading fs-5 mb-1 text-dark">{team.name}</h3>
                    <p className="d-flex align-items-center gap-1 text-muted small mb-3">
                      <MapPin size={13} className="text-primary" /> {team.city || 'Assam'}
                    </p>
                  </div>

                  <div className="team-meta">
                    <div>
                      <span>Franchise Owner</span>
                      <strong className="text-dark text-truncate d-block">{team.owner_name}</strong>
                    </div>
                    <div>
                      <span>Captain</span>
                      <strong className="text-primary text-truncate d-block">{team.captain_name || 'TBA'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

