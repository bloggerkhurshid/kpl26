import React from 'react';
import { Trophy, Award, Flame, Star, Zap } from 'lucide-react';

export const Prizes: React.FC = () => {
  return (
    <section id="prizes" className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Championship Rewards</span>
          <h2 className="section-title">Grand Prize Pool & Trophies</h2>
          <p className="text-muted">High stakes tennis ball cricket competition in Assam</p>
        </div>

        <div className="row g-4 justify-content-center">
          {/* Champions */}
          <div className="col-md-6 col-lg-5">
            <div className="kpl-card p-4 text-center h-100 position-relative overflow-hidden">
              <div className="badge badge-gold mb-3 px-3 py-2 rounded-pill">1ST PLACE CHAMPIONS</div>
              <div className="my-3">
                <Trophy size={64} className="text-warning mb-2" />
                <h3 className="display-6 fw-bold text-white mb-1">₹ 1,00,000</h3>
                <p className="text-success fw-bold">Grand Cash Prize + Championship Trophy</p>
              </div>
              <p className="text-slate-300 small">
                Winner of KPL Season 3 Grand Finale receives the championship trophy, winner medals, and ₹1,00,000 cash prize.
              </p>
            </div>
          </div>

          {/* Runner Up */}
          <div className="col-md-6 col-lg-5">
            <div className="kpl-card p-4 text-center h-100 position-relative overflow-hidden">
              <div className="badge badge-green mb-3 px-3 py-2 rounded-pill">2ND PLACE RUNNER-UP</div>
              <div className="my-3">
                <Award size={64} className="text-success mb-2" />
                <h3 className="display-6 fw-bold text-white mb-1">₹ 50,000</h3>
                <p className="text-success fw-bold">Runner-Up Trophy + Medals</p>
              </div>
              <p className="text-slate-300 small">
                Finalist team awarded ₹50,000 cash prize along with runner-up trophy and team medals.
              </p>
            </div>
          </div>
        </div>

        {/* Individual Individual Awards */}
        <div className="row g-3 mt-4">
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center">
              <Star size={28} className="text-warning mb-2" />
              <h5 className="text-white fs-6 mb-1">Man of Tournament</h5>
              <p className="text-success small fw-bold mb-0">Trophy + ₹ 10,000</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center">
              <Flame size={28} className="text-warning mb-2" />
              <h5 className="text-white fs-6 mb-1">Orange Cap (Most Runs)</h5>
              <p className="text-success small fw-bold mb-0">Cap + ₹ 5,000</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center">
              <Zap size={28} className="text-info mb-2" />
              <h5 className="text-white fs-6 mb-1">Purple Cap (Most Wickets)</h5>
              <p className="text-success small fw-bold mb-0">Cap + ₹ 5,000</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center">
              <Award size={28} className="text-success mb-2" />
              <h5 className="text-white fs-6 mb-1">Man of the Match</h5>
              <p className="text-success small fw-bold mb-0">Mom Trophies Every Match</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
