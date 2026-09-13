import React, { useState } from 'react';
import { CheckCircle, QrCode, User, Shield } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [regType, setRegType] = useState<'player' | 'team'>('player');
  const [submitted, setSubmitted] = useState(false);

  // Player state
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Batter');
  const [contact, setContact] = useState('');
  const [village, setVillage] = useState('');

  // Team state
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="kpl-modal-content p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary border-opacity-25 pb-3">
            <div>
              <h4 className="text-white fw-bold mb-1">
                {regType === 'player' ? 'Player Registration' : 'Team Franchise Registration'}
              </h4>
              <p className="text-success small mb-0">Khoraghat Premier League Season 3 · 2026</p>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle size={64} className="text-success mb-3" />
              <h4 className="text-white fw-bold">Registration Submitted Successfully!</h4>
              <p className="text-slate-300 max-w-md mx-auto small mb-4">
                Thank you for registering for KPL Season 3. Our organizing committee will review your details and contact you via phone/WhatsApp.
              </p>
              <button className="btn btn-kpl-green rounded-pill px-4 py-2" onClick={onClose}>
                Close & Return
              </button>
            </div>
          ) : (
            <div>
              {/* Type Switcher */}
              <div className="d-flex gap-2 mb-4">
                <button
                  className={`btn flex-grow-1 rounded-pill ${
                    regType === 'player' ? 'btn-kpl-green' : 'btn-kpl-outline'
                  }`}
                  onClick={() => setRegType('player')}
                >
                  <User size={16} className="me-1" /> Register as Player (₹ 500)
                </button>
                <button
                  className={`btn flex-grow-1 rounded-pill ${
                    regType === 'team' ? 'btn-kpl-green' : 'btn-kpl-outline'
                  }`}
                  onClick={() => setRegType('team')}
                >
                  <Shield size={16} className="me-1" /> Register Franchise Team (₹ 5,000)
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {regType === 'player' ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control kpl-form-control"
                        placeholder="e.g. Jahidul Hasan"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Playing Role *</label>
                      <select
                        className="form-select kpl-form-control"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="Batter">Batter</option>
                        <option value="Bowler">Bowler</option>
                        <option value="All-Rounder">All-Rounder</option>
                        <option value="Wicketkeeper">Wicketkeeper</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Contact Number *</label>
                      <input
                        type="tel"
                        className="form-control kpl-form-control"
                        placeholder="+91 98765 43210"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Village / Town *</label>
                      <input
                        type="text"
                        className="form-control kpl-form-control"
                        placeholder="e.g. Khoraghat / Bilasipara"
                        required
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Franchise Team Name *</label>
                      <input
                        type="text"
                        className="form-control kpl-form-control"
                        placeholder="e.g. Bilasipara Strikers"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Franchise Owner Name *</label>
                      <input
                        type="text"
                        className="form-control kpl-form-control"
                        placeholder="e.g. Rafiqul Islam"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">City / District *</label>
                      <input
                        type="text"
                        className="form-control kpl-form-control"
                        placeholder="e.g. Bilasipara, Dhubri"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-slate-300 small fw-bold">Owner Contact Phone *</label>
                      <input
                        type="tel"
                        className="form-control kpl-form-control"
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Payment QR Section */}
                <div className="kpl-card p-3 my-4 bg-dark bg-opacity-50">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-success bg-opacity-20 p-3 rounded-3 text-success">
                      <QrCode size={36} />
                    </div>
                    <div>
                      <h6 className="text-white mb-1 fw-bold">
                        UPI Payment Fee: {regType === 'player' ? '₹ 500' : '₹ 5,000'}
                      </h6>
                      <p className="text-slate-300 small mb-0">
                        Scan & Pay via GPay / PhonePe / Paytm to UPI ID: <code>kpl2026@paytm</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-kpl-outline rounded-pill px-4" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-kpl-green rounded-pill px-4">
                    Submit Registration
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
