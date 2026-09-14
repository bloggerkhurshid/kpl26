import React from 'react';
import type { ManagementMember } from '../types';
import { Phone, ShieldCheck } from 'lucide-react';
import { getImageUrl } from '../api';

interface ManagementProps {
  members: ManagementMember[];
}

export const Management: React.FC<ManagementProps> = ({ members }) => {
  return (
    <section id="management" className="py-5 bg-white border-bottom">
      <div className="container py-4">
        <div className="mb-5">
          <div className="section-label">Organizing Committee</div>
          <h2 className="sport-heading">KPL Management & Board</h2>
          <p className="text-muted fs-6">The leaders behind Khoraghat Premier League Season 3</p>
        </div>

        <div className="row g-4 justify-content-center">
          {members.map((member) => {
            const photo = getImageUrl(member.photo_url) || '/images/kpl-logo.jpg';
            const contactNum = member.contact || '+91 86384 79115';

            return (
              <div key={member.id} className="col-md-6 col-lg-4">
                <div className="kpl-card p-4 h-100 text-center shadow-sm d-flex flex-column align-items-center">
                  <div className="position-relative d-inline-block mb-3">
                    <img
                      src={photo}
                      alt={member.name}
                      className="rounded-circle border border-2 border-warning p-1"
                      style={{ width: '92px', height: '92px', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/kpl-logo.jpg';
                      }}
                    />
                    <span
                      className="position-absolute bottom-0 end-0 bg-warning text-dark p-1 rounded-circle shadow-sm"
                      title="Verified Official"
                    >
                      <ShieldCheck size={16} />
                    </span>
                  </div>

                  <h4 className="sport-heading fs-5 mb-1 text-dark">{member.name}</h4>
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold small mb-3">
                    {member.designation}
                  </span>

                  <div className="mt-auto">
                    <a
                      href={`tel:${contactNum.replace(/\s+/g, '')}`}
                      className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-light border small text-dark fw-semibold text-decoration-none transition"
                    >
                      <Phone size={13} className="text-success" />
                      <span>{contactNum}</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

