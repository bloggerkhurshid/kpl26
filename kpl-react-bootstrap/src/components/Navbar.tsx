import React from 'react';
import { Trophy, Shield, Users, UserCheck, Image, UserPlus, LogIn } from 'lucide-react';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRegister, onOpenAdmin }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark kpl-navbar py-2">
      <div className="container">
        {/* Brand */}
        <a className="navbar-brand d-flex align-items-center gap-2" href="#">
          <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo-img" />
          <div className="d-flex flex-column">
            <span className="brand-title">KPL SEASON 3</span>
            <span className="brand-sub">Khoraghat Premier League 2026</span>
          </div>
        </a>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#kplNavContent"
          aria-controls="kplNavContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Links */}
        <div className="collapse navbar-collapse" id="kplNavContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-1">
            <li className="nav-item">
              <a className="nav-link" href="#prizes">
                <Trophy size={15} className="me-1 text-success" /> Prizes
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#format">
                Format
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#teams">
                <Shield size={15} className="me-1 text-success" /> Teams
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#players">
                <Users size={15} className="me-1 text-success" /> Players
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#management">
                <UserCheck size={15} className="me-1 text-success" /> Management
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#gallery">
                <Image size={15} className="me-1 text-success" /> Gallery
              </a>
            </li>
          </ul>

          {/* CTAs */}
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-kpl-outline btn-sm rounded-pill px-3 py-2" onClick={onOpenAdmin}>
              <LogIn size={14} className="me-1" /> Admin
            </button>
            <button className="btn btn-kpl-green btn-sm rounded-pill px-3 py-2" onClick={onOpenRegister}>
              <UserPlus size={14} className="me-1" /> Register Team/Player
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
