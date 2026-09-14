import React from 'react';
import { Trophy, Award, Flame, Star, Zap } from 'lucide-react';

export const Prizes: React.FC = () => {
  return (
    <section id="prizes" className="py-5 bg-white border-bottom">
      <div className="container py-4">
        <div className="mb-5">
          <div className="section-label">Championship Rewards</div>
          <h2 className="sport-heading">Grand Prize Pool & Trophies</h2>
          <p className="text-muted fs-6">High stakes tennis ball cricket competition in Assam</p>
        </div>

        <div className="row g-4 justify-content-center">
          {/* Champions */}
          <div className="col-md-6 col-lg-5">
            <div className="kpl-card p-4 text-center h-100 position-relative border-success border-2 shadow-sm" style={{ background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, #ffffff 100%)' }}>
              <span className="badge bg-success text-white mb-3 px-3 py-2 rounded-pill fw-bold">1ST PLACE CHAMPIONS</span>
              <div className="my-3">
                <Trophy size={64} className="text-success mb-2" />
                <h3 className="sport-heading display-5 mb-1 text-dark">₹ 1,00,000</h3>
                <p className="text-success fw-bold">Grand Cash Prize + Championship Trophy</p>
              </div>
              <p className="text-muted small">
                Winner of KPL Season 3 Grand Finale receives the championship trophy, winner medals, and ₹1,00,000 cash prize.
              </p>
            </div>
          </div>

          {/* Runner Up */}
          <div className="col-md-6 col-lg-5">
            <div className="kpl-card p-4 text-center h-100 position-relative shadow-sm">
              <span className="badge bg-primary text-white mb-3 px-3 py-2 rounded-pill fw-bold">2ND PLACE RUNNER-UP</span>
              <div className="my-3">
                <Award size={64} className="text-primary mb-2" />
                <h3 className="sport-heading display-5 mb-1 text-dark">₹ 50,000</h3>
                <p className="text-primary fw-bold">Runner-Up Trophy + Medals</p>
              </div>
              <p className="text-muted small">
                Finalist team awarded ₹50,000 cash prize along with runner-up trophy and team medals.
              </p>
            </div>
          </div>
        </div>

        {/* Individual Awards */}
        <div className="row g-3 mt-4">
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center h-100">
              <Star size={28} className="text-warning mb-2" />
              <h5 className="fw-bold fs-6 mb-1 text-dark">Man of Tournament</h5>
              <p className="text-warning small fw-bold mb-0">Trophy + ₹ 10,000</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center h-100">
              <Flame size={28} className="text-danger mb-2" />
              <h5 className="fw-bold fs-6 mb-1 text-dark">Orange Cap (Most Runs)</h5>
              <p className="text-danger small fw-bold mb-0">Cap + ₹ 5,000</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center h-100">
              <Zap size={28} className="text-info mb-2" />
              <h5 className="fw-bold fs-6 mb-1 text-dark">Purple Cap (Most Wickets)</h5>
              <p className="text-info small fw-bold mb-0">Cap + ₹ 5,000</p>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="kpl-card p-3 text-center h-100">
              <Award size={28} className="text-success mb-2" />
              <h5 className="fw-bold fs-6 mb-1 text-dark">Man of the Match</h5>
              <p className="text-success small fw-bold mb-0">MOM Trophies Every Match</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
