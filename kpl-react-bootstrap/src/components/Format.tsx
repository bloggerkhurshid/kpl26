import React from 'react';
import { Shield, Layers, Trophy, CheckCircle2 } from 'lucide-react';

export const Format: React.FC = () => {
  return (
    <section id="format" className="py-5 border-bottom" style={{ background: '#f8fafc' }}>
      <div className="container py-4">
        <div className="mb-4">
          <div className="section-label">Tournament Structure</div>
          <h2 className="sport-heading">League Format & Guidelines</h2>
          <p className="text-muted fs-6">Franchise-based hard tennis ball tournament rules</p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="kpl-card p-4 h-100 position-relative overflow-hidden">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                  <Shield size={24} />
                </div>
                <h4 className="fw-bold fs-5 mb-0 text-dark">8 Franchise Teams</h4>
              </div>
              <p className="text-muted small mb-3">
                8 registered franchises split into Group A and Group B. Each franchise consists of 15 squad players drafted via live auction.
              </p>
              <ul className="list-unstyled text-muted small mb-0">
                <li className="mb-2"><CheckCircle2 size={14} className="text-primary me-2" /> Live Auction Draft</li>
                <li className="mb-2"><CheckCircle2 size={14} className="text-primary me-2" /> Max 4 Outstation Players per XI</li>
                <li><CheckCircle2 size={14} className="text-primary me-2" /> Mandatory Local Icon Captain</li>
              </ul>
              <div className="position-absolute bottom-0 end-0 opacity-10 pe-3 pb-2 text-dark fs-1 fw-bold">01</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="kpl-card p-4 h-100 position-relative overflow-hidden">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                  <Layers size={24} />
                </div>
                <h4 className="fw-bold fs-5 mb-0 text-dark">Group Stage & NRR</h4>
              </div>
              <p className="text-muted small mb-3">
                Round-robin league matches inside each group. Top 2 teams from each group advance to Knockouts based on Points & Net Run Rate.
              </p>
              <ul className="list-unstyled text-muted small mb-0">
                <li className="mb-2"><CheckCircle2 size={14} className="text-warning me-2" /> 10-Over Hard Tennis Ball Matches</li>
                <li className="mb-2"><CheckCircle2 size={14} className="text-warning me-2" /> Powerplay Overs Rules</li>
                <li><CheckCircle2 size={14} className="text-warning me-2" /> Official KPL Super Over for ties</li>
              </ul>
              <div className="position-absolute bottom-0 end-0 opacity-10 pe-3 pb-2 text-dark fs-1 fw-bold">02</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="kpl-card p-4 h-100 position-relative overflow-hidden">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                  <Trophy size={24} />
                </div>
                <h4 className="fw-bold fs-5 mb-0 text-dark">Semi-Finals & Finale</h4>
              </div>
              <p className="text-muted small mb-3">
                Semi-Final 1 (Group A1 vs Group B2), Semi-Final 2 (Group B1 vs Group A2), followed by the Grand Finale event.
              </p>
              <ul className="list-unstyled text-muted small mb-0">
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Night/Day Floodlight Finale</li>
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Live Broadcast & Commentary</li>
                <li><CheckCircle2 size={14} className="text-success me-2" /> Official Umpires & Scorer Panel</li>
              </ul>
              <div className="position-absolute bottom-0 end-0 opacity-10 pe-3 pb-2 text-dark fs-1 fw-bold">03</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
