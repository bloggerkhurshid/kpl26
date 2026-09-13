import React from 'react';
import type { ManagementMember } from '../types';
import { Phone, ShieldCheck } from 'lucide-react';

interface ManagementProps {
  members: ManagementMember[];
}

export const Management: React.FC<ManagementProps> = ({ members }) => {
  return (
    <section id="management" className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Organizing Committee</span>
          <h2 className="section-title">KPL Management & Board</h2>
          <p className="text-muted">Leaders behind Khoraghat Premier League Season 3</p>
        </div>

        <div className="row g-4">
          {members.map((member) => (
            <div key={member.id} className="col-md-6 col-lg-4">
              <div className="kpl-card p-4 h-100 text-center">
                <div className="position-relative d-inline-block mb-3">
                  <img
                    src={member.photo_url || '/images/kpl-logo.jpg'}
                    alt={member.name}
                    className="rounded-circle border border-2 border-success p-1"
                    style={{ width: '88px', height: '88px', objectFit: 'cover' }}
                  />
                  <span className="position-absolute bottom-0 end-0 bg-success text-white p-1 rounded-circle">
                    <ShieldCheck size={14} />
                  </span>
                </div>

                <h4 className="text-white fs-5 fw-bold mb-1">{member.name}</h4>
                <p className="text-success fw-semibold small mb-3">{member.designation}</p>

                <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-dark border border-secondary border-opacity-25 small text-slate-300">
                  <Phone size={13} className="text-success" />
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
