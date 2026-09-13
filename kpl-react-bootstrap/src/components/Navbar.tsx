import React, { useState, useEffect } from 'react';
import { UserPlus, LogIn, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRegister, onOpenAdmin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`site-nav ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="container-fluid d-flex align-items-center justify-content-between px-0">
        {/* Brand */}
        <a href="#" className="brand">
          <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo" />
          <div className="brand-text">
            KPL SEASON 3
            <span>KHORAGHAT PREMIER LEAGUE</span>
          </div>
        </a>

        {/* Desktop Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'd-flex flex-column position-absolute top-100 start-0 end-0 bg-white p-4 shadow-lg rounded-4 border border-secondary border-opacity-25' : ''}`}>
          <a href="#prizes" onClick={() => setMobileMenuOpen(false)}>Prizes</a>
          <a href="#format" onClick={() => setMobileMenuOpen(false)}>Format</a>
          <a href="#teams" onClick={() => setMobileMenuOpen(false)}>Teams</a>
          <a href="#players" onClick={() => setMobileMenuOpen(false)}>Players</a>
          <a href="#management" onClick={() => setMobileMenuOpen(false)}>Management</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
        </div>

        {/* Action CTAs */}
        <div className="d-flex align-items-center gap-2">
          <button className="button-outline py-2 px-3 fs-7" onClick={onOpenAdmin}>
            <span><LogIn size={14} className="me-1" /> Admin</span>
          </button>

          <button className="nav-cta" onClick={onOpenRegister}>
            <span><UserPlus size={14} className="me-1" /> Register</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="btn p-1 d-md-none border-0 ms-2 text-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};
