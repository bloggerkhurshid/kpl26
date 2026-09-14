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
      <div className="page-width">
        {/* Section Header */}
        <div className="management-header">
          <span className="section-label" style={{ justifyContent: 'center' }}>
            <Award size={14} style={{ color: 'var(--green-mint)' }} />
            Leadership & Committee
          </span>
          <h2 className="sport-heading">League <em>Management</em></h2>
          <p className="lead" style={{ margin: '16px auto 0' }}>
            The visionary organizers, sports patrons, and executive committee members powering Khoraghat Premier League.
          </p>
        </div>

        {/* Management Personnel Grid */}
        <div className="management-grid">
          {members.map((member) => (
            <div key={member.id} className="management-executive-card">
              {/* Photo Showcase (Large Portrait) */}
              <div className="management-photo-wrapper">
                <div className="management-photo-halo" />
                <div className="management-photo-frame">
                  {member.photo_url ? (
                    <img
                      src={getImageUrl(member.photo_url)}
                      alt={member.name}
                      className="management-photo-img"
                    />
                  ) : (
                    <div className="management-photo-fallback">
                      <UserCheck size={56} style={{ color: 'var(--green-mint)', opacity: 0.8 }} />
                    </div>
                  )}
                </div>
                {/* Official Role Badge Floating on image */}
                <div className="management-badge-float">
                  <Shield size={12} />
                  <span>{member.designation}</span>
                </div>
              </div>

              {/* Body Content */}
              <div className="management-card-body">
                <h3 className="management-card-name">{member.name}</h3>

                {member.contact && (
                  <a
                    href={`tel:${member.contact.replace(/\s+/g, '')}`}
                    className="management-contact-btn"
                  >
                    <Phone size={13} className="management-phone-icon" />
                    <span>{member.contact}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
