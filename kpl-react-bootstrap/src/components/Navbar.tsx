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

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className={`site-nav ${isScrolled ? 'is-scrolled' : ''}`}>
      <div className="container-fluid d-flex align-items-center justify-content-between px-0">
        {/* Brand */}
        <button onClick={scrollToTop} className="brand bg-transparent border-0 text-start p-0">
          <img src="/images/kpl-logo.jpg" alt="KPL Logo" className="brand-logo" />
          <div className="brand-text">
            KPL SEASON 3
            <span>KHORAGHAT PREMIER LEAGUE</span>
          </div>
        </button>

        {/* Desktop Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'd-flex flex-column position-absolute top-100 start-0 end-0 bg-white p-4 shadow-lg rounded-4 border border-secondary border-opacity-25' : ''}`}>
          <button className="btn p-0 border-0 nav-link-btn" onClick={(e) => scrollToSection('prizes', e)}>Prizes</button>
          <button className="btn p-0 border-0 nav-link-btn" onClick={(e) => scrollToSection('format', e)}>Format</button>
          <button className="btn p-0 border-0 nav-link-btn" onClick={(e) => scrollToSection('teams', e)}>Teams</button>
          <button className="btn p-0 border-0 nav-link-btn" onClick={(e) => scrollToSection('players', e)}>Players</button>
          <button className="btn p-0 border-0 nav-link-btn" onClick={(e) => scrollToSection('management', e)}>Management</button>
          <button className="btn p-0 border-0 nav-link-btn" onClick={(e) => scrollToSection('gallery', e)}>Gallery</button>
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
