import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="row g-4 mb-5">
          {/* Brand Info */}
          <div className="col-lg-4">
            <div className="brand mb-3">
              <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo" />
              <div className="brand-text text-white">
                KPL SEASON 3
                <span className="text-warning">KHORAGHAT PREMIER LEAGUE</span>
              </div>
            </div>
            <p className="small text-muted mb-3">
              Assam’s premier franchise-based hard tennis ball cricket tournament organized at Khoraghat High School Ground, Bilasipara, Dhubri, Assam.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-lg-4">
            <h6 className="text-white fw-bold mb-3 text-uppercase tracking-wider fs-7">Quick Navigation</h6>
            <ul className="list-unstyled small text-muted">
              <li className="mb-2"><a href="#prizes" className="text-slate-300 text-decoration-none">Grand Prize Pool</a></li>
              <li className="mb-2"><a href="#teams" className="text-slate-300 text-decoration-none">Franchise Teams</a></li>
              <li className="mb-2"><a href="#players" className="text-slate-300 text-decoration-none">Player Draft List</a></li>
              <li className="mb-2"><a href="#gallery" className="text-slate-300 text-decoration-none">Action Photo Gallery</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-6 col-lg-4">
            <h6 className="text-white fw-bold mb-3 text-uppercase tracking-wider fs-7">Contact Committee</h6>
            <ul className="list-unstyled small text-muted">
              <li className="mb-2 d-flex align-items-center gap-2">
                <MapPin size={14} className="text-warning" /> Khoraghat, Bilasipara, Dhubri, Assam
              </li>
              <li className="mb-2 d-flex align-items-center gap-2">
                <Phone size={14} className="text-warning" /> +91 98765 43210 / +91 98765 00001
              </li>
              <li className="mb-2 d-flex align-items-center gap-2">
                <Mail size={14} className="text-warning" /> khoraghatpremierleague@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="mb-0">© 2026 Khoraghat Premier League (KPL). All rights reserved.</p>
          <span className="text-warning fw-semibold">React & Bootstrap Edition</span>
        </div>
      </div>
    </footer>
  );
};
