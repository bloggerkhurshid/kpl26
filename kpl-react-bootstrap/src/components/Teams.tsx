import React from 'react';
import type { Team } from '../types';
import { MapPin } from 'lucide-react';

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
          {teams.map((team) => (
            <div key={team.id} className="col-md-6 col-lg-4">
              <div className="team-card">
                <div className="team-card-top">
                  <img src={team.logo_url} alt={team.name} className="team-logo-avatar" />
                  <span className="team-short">{team.short_name}</span>
                </div>

                <h3 className="sport-heading fs-5 mb-1">{team.name}</h3>
                <p className="d-flex align-items-center gap-1">
                  <MapPin size={13} className="text-primary" /> {team.city}
                </p>

                <div className="team-meta">
                  <div>
                    <span>Franchise Owner</span>
                    <strong>{team.owner_name}</strong>
                  </div>
                  <div>
                    <span>Captain</span>
                    <strong className="text-primary">{team.captain_name || 'TBA'}</strong>
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
