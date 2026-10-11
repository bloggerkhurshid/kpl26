'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Phone, UserCheck, Loader2, Award } from 'lucide-react';
import { kplApi, ManagementMember, getImageUrl } from '@/lib/api';

export function ManagementSection() {
  const [members, setMembers] = useState<ManagementMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagement();
  }, []);

  const fetchManagement = async () => {
    try {
      setLoading(true);
      const data = await kplApi.getManagement('active');
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to load management committee:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="section-pad" id="management">
        <div className="page-width" style={{ textAlign: 'center' }}>
          <Loader2 className="spin" style={{ color: 'var(--green-mint)', margin: '0 auto' }} size={32} />
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <section id="management" className="section-pad management-section">
      {/* Background glow orbs */}
      <div className="management-bg-glow management-bg-glow-left" />
      <div className="management-bg-glow management-bg-glow-right" />

      <div className="page-width" style={{ position: 'relative', zIndex: 2 }}>
        {/* Premium Section Header */}
        <div className="management-header">
          <div className="management-badge-pill">
            <Award size={14} className="management-badge-icon" />
            <span>Executive Committee</span>
          </div>
          <h2 className="management-display-title">
            Leadership &amp; <em>Committee</em>
          </h2>
          <p className="management-display-subtitle">
            The visionary organizers, patrons, and executive leadership steering Khoraghat Premier League Season 3 with excellence.
          </p>
        </div>

        {/* Management Personnel Grid - Compact Luxury Cards */}
        <div className="management-grid">
          {members.map((member) => (
            <div key={member.id} className="management-executive-card">
              {/* Photo Showcase (Strict 3:4 Portrait Ratio) */}
              <div className="management-photo-wrapper">
                <div className="management-photo-frame">
                  {member.photo_url ? (
                    <img
                      src={getImageUrl(member.photo_url)}
                      alt={member.name}
                      className="management-photo-img"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="management-photo-fallback">
                      <UserCheck size={40} style={{ color: 'var(--green-mint)', opacity: 0.8 }} />
                    </div>
                  )}
                </div>

                {/* Subtle vignette gradient */}
                <div className="management-photo-gradient" />

                {/* Floating Designation Badge */}
                <div className="management-badge-float">
                  <Shield size={11} className="management-shield-icon" />
                  <span>{member.designation}</span>
                </div>
              </div>

              {/* Compact Card Body */}
              <div className="management-card-body">
                <div className="management-card-info">
                  <h3 className="management-card-name">{member.name}</h3>
                </div>

                {member.contact ? (
                  <a
                    href={`tel:${member.contact.replace(/\s+/g, '')}`}
                    className="management-contact-btn"
                    title={`Call ${member.name}`}
                  >
                    <div className="management-phone-circle">
                      <Phone size={12} />
                    </div>
                    <span>{member.contact}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
