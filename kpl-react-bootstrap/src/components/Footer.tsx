import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-5 border-top border-secondary border-opacity-25 bg-dark bg-opacity-75 text-slate-300">
      <div className="container">
        <div className="row g-4">
          {/* Brand Info */}
          <div className="col-lg-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo-img" />
              <div>
                <h5 className="text-white fw-bold mb-0">Khoraghat Premier League</h5>
                <span className="text-success small fw-bold">KPL Season 3 · 2026</span>
              </div>
            </div>
            <p className="small text-muted mb-3">
              Assam’s premier franchise-based hard tennis ball cricket tournament organized at Khoraghat High School Ground, Bilasipara, Dhubri, Assam.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-lg-4">
            <h6 className="text-white fw-bold mb-3">Quick Navigation</h6>
            <ul className="list-unstyled small">
              <li className="mb-2"><a href="#prizes" className="text-slate-300 text-decoration-none">Grand Prize Pool</a></li>
              <li className="mb-2"><a href="#teams" className="text-slate-300 text-decoration-none">Franchise Teams</a></li>
              <li className="mb-2"><a href="#players" className="text-slate-300 text-decoration-none">Player Draft List</a></li>
              <li className="mb-2"><a href="#gallery" className="text-slate-300 text-decoration-none">Action Photo Gallery</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-6 col-lg-4">
            <h6 className="text-white fw-bold mb-3">Contact Committee</h6>
            <ul className="list-unstyled small">
              <li className="mb-2 d-flex align-items-center gap-2">
                <MapPin size={14} className="text-success" /> Khoraghat, Bilasipara, Dhubri, Assam
              </li>
              <li className="mb-2 d-flex align-items-center gap-2">
                <Phone size={14} className="text-success" /> +91 98765 43210 / +91 98765 00001
              </li>
              <li className="mb-2 d-flex align-items-center gap-2">
                <Mail size={14} className="text-success" /> khoraghatpremierleague@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-secondary opacity-25 my-4" />

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-muted">
          <p className="mb-0">© 2026 Khoraghat Premier League (KPL). All rights reserved.</p>
          <span className="text-success fw-semibold">Built with React & Bootstrap (Green Admin Theme)</span>
        </div>
      </div>
    </footer>
  );
};
