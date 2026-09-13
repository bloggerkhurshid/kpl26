'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Phone, UserCheck, Loader2 } from 'lucide-react';
import { kplApi, ManagementMember } from '@/lib/api';

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
      <section className="section-pad" id="management" style={{ background: 'var(--navy-light)' }}>
        <div className="page-width" style={{ textAlign: 'center' }}>
          <Loader2 className="spin" style={{ color: 'var(--gold)', margin: '0 auto' }} size={32} />
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return null;
  }

  return (
    <section id="management" className="section-pad" style={{ background: 'var(--navy-light)' }}>
      <div className="page-width">
        {/* Symmetrical Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
          <span className="section-label" style={{ justifyContent: 'center' }}>Leadership & Guidance</span>
          <h2 className="sport-heading">League <em>Management</em></h2>
          <p className="lead" style={{ margin: '16px auto 0' }}>
            The visionary leaders and organizers driving Khoraghat Premier League forward.
          </p>
        </div>

        {/* Symmetrical Committee Grid */}
        <div className="teams-grid">
          {members.map((member) => (
            <div
              key={member.id}
              className="format-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '36px 28px',
                borderRadius: '16px',
                background: 'var(--navy)',
                border: '1px solid var(--border)',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Photo Avatar */}
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  padding: '3px',
                  background: 'linear-gradient(135deg, var(--gold), var(--electric))',
                  marginBottom: '20px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0,
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
                      src={member.photo_url}
                      alt={member.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <UserCheck style={{ width: '40px', height: '40px', color: 'var(--gold)', opacity: 0.8 }} />
                  )}
                </div>
              </div>

              {/* Details */}
              <h3 className="sport-heading" style={{ fontSize: '20px', color: 'var(--text)', marginBottom: '8px' }}>
                {member.name}
              </h3>
              
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'var(--gold)',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  padding: '4px 14px',
                  borderRadius: '100px',
                  marginBottom: '16px',
                }}
              >
                {member.designation}
              </span>

              {member.contact && (
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border)',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <Phone size={14} style={{ color: 'var(--gold)' }} />
                  <span>{member.contact}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
