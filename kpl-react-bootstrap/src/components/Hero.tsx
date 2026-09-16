import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Sparkles, ChevronRight } from 'lucide-react';
import type { ContentSettings } from '../types';

interface HeroProps {
  onOpenRegister: () => void;
  content?: ContentSettings;
}

const HERO_IMAGES = [
  '/images/hero-1.jpg',
  '/images/hero-2.jpg',
  '/images/hero-3.jpg',
  '/images/hero-4.jpg',
  '/images/hero-5.jpg',
  '/images/hero-6.jpg',
];

export const Hero: React.FC<HeroProps> = ({ onOpenRegister, content }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Cycling background
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Extract clean title or fallback
  const heroTitle = content?.hero_title || "ASSAM'S PREMIER <em>HARD TENNIS</em> CRICKET CHAMPIONSHIP";
  const heroSubtitle =
    content?.hero_subtitle ||
    "Eight top franchise teams. High voltage cricket action. Grand cash prizes & trophies live from Khoraghat, Bilasipara, Dhubri, Assam.";

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

          <h1
            className="sport-heading"
            dangerouslySetInnerHTML={{ __html: heroTitle }}
          />

          <p className="lead">{heroSubtitle}</p>

          <div className="d-flex flex-wrap gap-2 align-items-center pt-2">
            <span className="badge bg-white text-dark border p-2 px-3 rounded-pill fw-bold shadow-sm">
              <Calendar size={14} className="me-1 text-primary" /> Season 3 · 2026 Registration Open
            </span>
            <span className="badge bg-white text-dark border p-2 px-3 rounded-pill fw-bold shadow-sm">
              <MapPin size={14} className="me-1 text-danger" /> Khoraghat M.E. School Ground, Kokrajhar, Assam
            </span>
          </div>

          <div className="hero-actions pt-2">
            <button className="button-primary" onClick={onOpenRegister}>
              <span>
                Register Team / Player <ChevronRight size={18} className="ms-1" />
              </span>
            </button>
            <button className="button-outline" onClick={(e) => scrollToSection('prizes', e)}>
              <span>Explore Prizes</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

