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
    <section id="management" className="section-pad">
      <div className="page-width">
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 60px' }}>
          <span className="section-label" style={{ justifyContent: 'center' }}>Leadership & Committee</span>
          <h2 className="sport-heading">League <em>Management</em></h2>
          <p className="lead" style={{ margin: '16px auto 0' }}>
            The visionary team and executive committee members driving Khoraghat Premier League forward.
          </p>
        </div>

        {/* Management Personnel Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px',
          }}
        >
          {members.map((member) => (
            <div
              key={member.id}
              className="format-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '40px 24px 32px',
                borderRadius: '20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}
            >
              {/* Avatar Frame with Gold Glow */}
              <div
                style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px',
                  marginBottom: '24px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--gold), var(--electric))',
                    opacity: 0.85,
                    filter: 'blur(4px)',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    padding: '3px',
                    background: 'linear-gradient(135deg, #FFDF00, #D4AF37)',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#040d1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {member.photo_url ? (
                      <img
                        src={getImageUrl(member.photo_url)}
                        alt={member.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <UserCheck style={{ width: '48px', height: '48px', color: 'var(--gold)', opacity: 0.8 }} />
                    )}
                  </div>
                </div>
              </div>

              {/* Personnel Name */}
              <h3
                className="sport-heading"
                style={{
                  fontSize: '22px',
                  color: 'var(--text)',
                  marginBottom: '10px',
                  lineHeight: 1.2,
                }}
              >
                {member.name}
              </h3>

              {/* Designation Pill */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  color: 'var(--gold)',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  padding: '6px 16px',
                  borderRadius: '100px',
                  marginBottom: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Award size={13} style={{ color: 'var(--gold)' }} />
                {member.designation}
              </span>

              {/* Contact Information */}
              {member.contact && (
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '18px',
                    borderTop: '1px solid var(--border)',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <a
                    href={`tel:${member.contact.replace(/\s+/g, '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text)',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gold)';
                      e.currentTarget.style.color = 'var(--gold)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text)';
                    }}
                  >
                    <Phone size={14} style={{ color: 'var(--gold)' }} />
                    <span>{member.contact}</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
