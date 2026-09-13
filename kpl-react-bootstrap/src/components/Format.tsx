import React from 'react';
import { Shield, Layers, Trophy, CheckCircle2 } from 'lucide-react';

export const Format: React.FC = () => {
  return (
    <section id="format" className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Tournament Structure</span>
          <h2 className="section-title">League Format & Guidelines</h2>
          <p className="text-muted">Franchise-based hard tennis ball tournament rules</p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="kpl-card p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 rounded-3 bg-success bg-opacity-20 text-success">
                  <Shield size={24} />
                </div>
                <h4 className="text-white fs-5 mb-0">8 Franchise Teams</h4>
              </div>
              <p className="text-slate-300 small">
                8 registered franchises split into Group A and Group B. Each franchise consists of 15 squad players drafted via live auction.
              </p>
              <ul className="list-unstyled text-slate-300 small mb-0">
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Live Auction Draft</li>
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Max 4 Outstation Players per XI</li>
                <li><CheckCircle2 size={14} className="text-success me-2" /> Mandatory Local Icon Captain</li>
              </ul>
            </div>
          </div>

          <div className="col-md-4">
            <div className="kpl-card p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 rounded-3 bg-success bg-opacity-20 text-success">
                  <Layers size={24} />
                </div>
                <h4 className="text-white fs-5 mb-0">Group Stage & NRR</h4>
              </div>
              <p className="text-slate-300 small">
                Round-robin league matches inside each group. Top 2 teams from each group advance to Knockouts based on Points & Net Run Rate.
              </p>
              <ul className="list-unstyled text-slate-300 small mb-0">
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> 10-Over Hard Tennis Ball Matches</li>
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Powerplay Overs Rules</li>
                <li><CheckCircle2 size={14} className="text-success me-2" /> Official KPL Super Over for ties</li>
              </ul>
            </div>
          </div>

          <div className="col-md-4">
            <div className="kpl-card p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-2 rounded-3 bg-success bg-opacity-20 text-success">
                  <Trophy size={24} />
                </div>
                <h4 className="text-white fs-5 mb-0">Semi-Finals & Finale</h4>
              </div>
              <p className="text-slate-300 small">
                Semi-Final 1 (Group A1 vs Group B2), Semi-Final 2 (Group B1 vs Group A2), followed by the Grand Finale event.
              </p>
              <ul className="list-unstyled text-slate-300 small mb-0">
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Night/Day Floodlight Finale</li>
                <li className="mb-2"><CheckCircle2 size={14} className="text-success me-2" /> Live Broadcast & Commentary</li>
                <li><CheckCircle2 size={14} className="text-success me-2" /> Official Umpires & Scorer Panel</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
