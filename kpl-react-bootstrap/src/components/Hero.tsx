import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trophy, Sparkles, ChevronRight, Clock } from 'lucide-react';
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

  // Countdown timer calculation
  const targetDateStr = content?.deadline_date || '2026-09-20T23:59:59';
  const calculateTimeLeft = () => {
    const target = new Date(targetDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, target - now);

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDateStr]);

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

          {/* Registration Countdown Timer */}
          <div className="my-2">
            <div className="d-flex align-items-center gap-2 mb-2 text-dark small fw-bold">
              <Clock size={15} className="text-warning" />
              <span>
                {content?.deadline_text || 'Registration Closes Soon — Secure Your Spot!'}
              </span>
            </div>
            <div className="countdown">
              <div className="countdown-cell">
                <strong>{String(timeLeft.days).padStart(2, '0')}</strong>
                <span>Days</span>
              </div>
              <div className="countdown-cell">
                <strong>{String(timeLeft.hours).padStart(2, '0')}</strong>
                <span>Hours</span>
              </div>
              <div className="countdown-cell">
                <strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>
                <span>Mins</span>
              </div>
              <div className="countdown-cell">
                <strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>
                <span>Secs</span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center pt-2">
            <span className="badge bg-white text-dark border p-2 px-3 rounded-pill fw-bold shadow-sm">
              <Calendar size={14} className="me-1 text-primary" /> Launch: Summer 2026
            </span>
            <span className="badge bg-white text-dark border p-2 px-3 rounded-pill fw-bold shadow-sm">
              <MapPin size={14} className="me-1 text-danger" /> Khoraghat High School Ground
            </span>
            <span className="badge bg-white text-dark border p-2 px-3 rounded-pill fw-bold shadow-sm">
              <Trophy size={14} className="me-1 text-warning" /> ₹1,00,000 Champion Prize
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

