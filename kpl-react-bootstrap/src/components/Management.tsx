import React from 'react';
import type { ManagementMember } from '../types';
import { Phone, ShieldCheck } from 'lucide-react';

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
          <p className="text-muted fs-6">Leaders behind Khoraghat Premier League Season 3</p>
        </div>

        <div className="row g-4">
          {members.map((member) => (
            <div key={member.id} className="col-md-6 col-lg-4">
              <div className="kpl-card p-4 h-100 text-center shadow-sm">
                <div className="position-relative d-inline-block mb-3">
                  <img
                    src={member.photo_url || '/images/kpl-logo.jpg'}
                    alt={member.name}
                    className="rounded-circle border border-2 border-warning p-1"
                    style={{ width: '88px', height: '88px', objectFit: 'cover' }}
                  />
                  <span className="position-absolute bottom-0 end-0 bg-warning text-dark p-1 rounded-circle">
                    <ShieldCheck size={14} />
                  </span>
                </div>

                <h4 className="sport-heading fs-5 mb-1">{member.name}</h4>
                <p className="text-primary fw-bold small mb-3">{member.designation}</p>

                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-light border small text-dark fw-semibold">
                  <Phone size={13} className="text-primary" />
                  <span>{member.contact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
