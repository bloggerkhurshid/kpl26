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

  return (
    <section className="hero-section py-5">
      {/* Cycling Background Images (100% Full Visibility) */}
      <div className="hero-bg-container">
        {HERO_IMAGES.map((imgUrl, index) => (
          <img
            key={imgUrl}
            src={imgUrl}
            alt={`KPL Hero ${index + 1}`}
            className="hero-bg-img"
            style={{
              display: index === currentImgIndex ? 'block' : 'none',
            }}
          />
        ))}
      </div>

      {/* Overlay */}
      <div className="hero-overlay"></div>

      {/* Content */}
      <div className="container position-relative z-3 my-auto">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            <div className="hero-content-card text-center">
              <div className="mb-3">
                <span className="hero-badge">
                  <Sparkles size={14} className="text-warning" /> Khoraghat Premier League — Season 3 · 2026
                </span>
              </div>

              <h1 className="display-4 fw-black text-white text-uppercase tracking-tight mb-3">
                ASSAM'S PREMIER <span className="text-success">HARD TENNIS</span> CRICKET CHAMPIONSHIP
              </h1>

              <p className="lead text-slate-300 mx-auto max-w-2xl mb-4 fs-6">
                Eight top franchise teams. High voltage cricket action. Grand cash prizes & trophies live from Khoraghat, Bilasipara, Dhubri, Assam.
              </p>

              {/* Tournament Meta Badges */}
              <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 mb-4">
                <span className="badge badge-green px-3 py-2 rounded-pill fs-7">
                  <Calendar size={14} className="me-1" /> Season 3 Launch: Summer 2026
                </span>
                <span className="badge badge-gold px-3 py-2 rounded-pill fs-7">
                  <MapPin size={14} className="me-1" /> Khoraghat High School Ground, Assam
                </span>
                <span className="badge badge-blue px-3 py-2 rounded-pill fs-7">
                  <Trophy size={14} className="me-1" /> ₹1,00,000 Champion Prize
                </span>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap align-items-center justify-content-center gap-3">
                <button className="btn btn-kpl-green btn-lg rounded-pill px-4 py-3 fs-6" onClick={onOpenRegister}>
                  Register Your Team / Player <ChevronRight size={18} className="ms-1" />
                </button>
                <a href="#prizes" className="btn btn-kpl-outline btn-lg rounded-pill px-4 py-3 fs-6">
                  Explore Prizes & League
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
