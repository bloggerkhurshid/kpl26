import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trophy, Sparkles, ChevronRight } from 'lucide-react';

interface HeroProps {
  onOpenRegister: () => void;
}

const HERO_IMAGES = [
  '/images/hero-1.jpg',
  '/images/hero-2.jpg',
  '/images/hero-3.jpg',
  '/images/hero-4.jpg',
  '/images/hero-5.jpg',
  '/images/hero-6.jpg',
];

export const Hero: React.FC<HeroProps> = ({ onOpenRegister }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const scrollToPrizes = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('prizes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero">
      {/* 100% Full Visibility Background Images */}
      {HERO_IMAGES.map((imgUrl, index) => (
        <img
          key={imgUrl}
          src={imgUrl}
          alt={`KPL Hero ${index + 1}`}
          className={`hero-bg-img ${index === currentImgIndex ? 'is-active' : ''}`}
        />
      ))}

      {/* Content */}
      <div className="container position-relative z-3">
        <div className="hero-content">
          <div className="section-label">
            <Sparkles size={14} className="text-warning me-1" /> Khoraghat Premier League — Season 3 · 2026
          </div>

          <h1 className="sport-heading">
            ASSAM'S PREMIER <em>HARD TENNIS</em> CRICKET CHAMPIONSHIP
          </h1>

          <p className="lead">
            Eight top franchise teams. High voltage cricket action. Grand cash prizes & trophies live from Khoraghat, Bilasipara, Dhubri, Assam.
          </p>

          <div className="d-flex flex-wrap gap-3 align-items-center">
            <span className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-bold">
              <Calendar size={14} className="me-1 text-primary" /> Launch: Summer 2026
            </span>
            <span className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-bold">
              <MapPin size={14} className="me-1 text-danger" /> Khoraghat High School Ground
            </span>
            <span className="badge bg-light text-dark border p-2 px-3 rounded-pill fw-bold">
              <Trophy size={14} className="me-1 text-warning" /> ₹1,00,000 Champion Prize
            </span>
          </div>

          <div className="hero-actions">
            <button className="button-primary" onClick={onOpenRegister}>
              <span>Register Team / Player <ChevronRight size={18} className="ms-1" /></span>
            </button>
            <button className="button-outline" onClick={scrollToPrizes}>
              <span>Explore Prizes</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
