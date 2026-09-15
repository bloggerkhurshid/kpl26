import React, { useState } from 'react';
import {
  CheckCircle,
  QrCode,
  User,
  Shield,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Download,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { kplApi } from '../api';
import type { ApiFeeSettings } from '../api';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeSettings?: ApiFeeSettings | null;
  onPlayerRegistered?: (player: any) => void;
  onTeamRegistered?: (team: any) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  feeSettings,
  onPlayerRegistered,
  onTeamRegistered,
}) => {
  const [regType, setRegType] = useState<'player' | 'team'>('player');
  const [step, setStep] = useState<'form' | 'upi_payment' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Player state
  const [playerName, setPlayerName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [age, setAge] = useState('22');
  const [role, setRole] = useState('All-Rounder');
  const [category, setCategory] = useState<'Local' | 'Foreign'>('Local');
  const [contact, setContact] = useState('');
  const [village, setVillage] = useState('');
  const [battingHand, setBattingHand] = useState('Right-hand Bat');
  const [bowlingStyle, setBowlingStyle] = useState('Right-arm Medium');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Team state
  const [teamName, setTeamName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [city, setCity] = useState('');
  const [teamContact, setTeamContact] = useState('');

  // Payment State
  const [registeredId, setRegisteredId] = useState('');
  const [payableAmount, setPayableAmount] = useState(500);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 900;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setPaymentScreenshot(canvas.toDataURL('image/jpeg', 0.72));
        } else {
          setPaymentScreenshot(rawUrl);
        }
        setErrorMsg('');
      };
      img.onerror = () => {
        setPaymentScreenshot(rawUrl);
        setErrorMsg('');
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const upiId = feeSettings?.upi_id || '8638479115@ybl';
  const payeeName = feeSettings?.upi_payee_name || 'Khoraghat Premier League';
  const playerFee =
    category === 'Foreign'
      ? Number(feeSettings?.fee_foreign_player) || 1000
      : Number(feeSettings?.fee_player) || 500;
  const teamFee = Number(feeSettings?.fee_team) || 5000;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (regType === 'player') {
        if (!photoBase64) {
          setErrorMsg('Please upload a passport-size photo of the player.');
          setSubmitting(false);
          return;
        }

        if (!declarationAccepted) {
          setErrorMsg('Please accept the player declaration & undertaking checkbox.');
          setSubmitting(false);
          return;
        }

        const regNum = `KPL-PLR-${Date.now().toString().slice(-6)}`;
        const payload = {
          registration_number: regNum,
          player_name: playerName.trim(),
          father_name: fatherName.trim(),
          age: parseInt(age) || 22,
          contact_number: contact.trim(),
          present_address: village.trim(),
          village: village.trim(),
          photo: photoBase64 || null,
          role: role,
          player_category: category,
          batting_hand: battingHand,
          bowling_type: bowlingStyle,
          declaration_accepted: declarationAccepted ? 1 : 0,
          status: 'pending',
          base_price: 500,
        };

        const res = await kplApi.createPlayer(payload).catch((err) => {
          console.warn('API createPlayer notice:', err);
          return { id: regNum, registration_number: regNum };
        });

        const finalId = res?.registration_number || regNum;
        setRegisteredId(finalId);
        setPayableAmount(playerFee);

        if (onPlayerRegistered) {
          onPlayerRegistered({
            id: res?.id || finalId,
            registration_number: finalId,
            full_name: playerName,
            role: role,
            category: category,
            base_price: '₹ 500',
            photo_url: photoBase64 || '/images/kpl-logo.jpg',
            status: 'Pending',
            contact: contact,
            village: village,
          });
        }
      } else {
        const regNum = `KPL-TEAM-${Date.now().toString().slice(-6)}`;
        const payload = {
          name: teamName.trim(),
          owner_name: ownerName.trim(),
          captain_name: captainName.trim() || 'TBA',
          owner_contact: teamContact.trim(),
          short_code: teamName.slice(0, 3).toUpperCase(),
          home_location: city.trim(),
          status: 'pending',
        };

        const res = await kplApi.createTeam(payload).catch((err) => {
          console.warn('API createTeam notice:', err);
          return { id: regNum };
        });

        const finalId = res?.id || regNum;
        setRegisteredId(regNum);
        setPayableAmount(teamFee);

        if (onTeamRegistered) {
          onTeamRegistered({
            id: finalId,
            name: teamName,
            short_name: teamName.slice(0, 3).toUpperCase(),
            owner_name: ownerName,
            captain_name: captainName || 'TBA',
            city: city,
            primary_color: '#0f172a',
            secondary_color: '#d4af37',
            logo_url: '/images/kpl-logo.jpg',
            squad_count: 0,
          });
        }
      }

      setStep('upi_payment');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check details and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!paymentScreenshot) {
      setErrorMsg('Please upload your payment confirmation screenshot before submitting.');
      return;
    }

    if (cleanUtr && cleanUtr.length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR / Reference number.');
      return;
    }

    const finalPaymentId = cleanUtr || `UPI-SHOT-${registeredId}`;

    setSubmitting(true);
    setErrorMsg('');

    try {
      await kplApi.createPayment({
        registration_type: regType,
        registration_id: registeredId,
        name: regType === 'player' ? playerName : ownerName,
        phone: regType === 'player' ? contact : teamContact,
        amount: payableAmount,
        payment_gateway: 'upi_direct',
        payment_id: finalPaymentId,
        screenshot: paymentScreenshot || null,
        payment_proof: paymentScreenshot || null,
        status: 'pending_verification',
      }).catch((err) => {
        console.warn('Payment submission note:', err);
      });

      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment reference submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setStep('form');
    setPlayerName('');
    setFatherName('');
    setContact('');
    setVillage('');
    setTeamName('');
    setOwnerName('');
    setTeamContact('');
    setUtrNumber('');
    onClose();
  };

  // Construct UPI URL & QR
  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    payeeName
  )}&am=${payableAmount}&tr=${registeredId}&tn=${encodeURIComponent(
    `KPL Reg ${registeredId}`
  )}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    upiIntentUrl
  )}`;

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="kpl-modal-content p-3 p-sm-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <div>
              <h3 className="sport-heading fs-4 mb-1">
                {step === 'form'
                  ? regType === 'player'
                    ? 'Player Registration'
                    : 'Franchise Team Registration'
                  : step === 'upi_payment'
                  ? 'Complete Registration Fee via UPI'
                  : 'Registration & Payment Submitted!'}
              </h3>
              <p className="text-muted small mb-0">
                Khoraghat Premier League Season 3 · Official 2026 Season
              </p>
            </div>
            <button type="button" className="btn-close" onClick={handleCloseAll}></button>
          </div>

          {errorMsg && (
            <div className="alert alert-danger py-2 small mb-3">{errorMsg}</div>
          )}

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'form' && (
            <div>
              {/* Switcher */}
              <div className="d-flex flex-column flex-sm-row gap-2 mb-4">
                <button
                  type="button"
                  className={`btn flex-grow-1 rounded-pill fw-bold py-2.5 ${
                    regType === 'player'
                      ? 'button-primary text-dark border-0'
                      : 'btn-outline-secondary text-dark bg-white'
                  }`}
                  onClick={() => setRegType('player')}
                >
                  <User size={16} className="me-1" /> Player Registration (₹{playerFee})
                </button>
                <button
                  type="button"
                  className={`btn flex-grow-1 rounded-pill fw-bold py-2.5 ${
                    regType === 'team'
                      ? 'button-primary text-dark border-0'
                      : 'btn-outline-secondary text-dark bg-white'
                  }`}
                  onClick={() => setRegType('team')}
                >
                  <Shield size={16} className="me-1" /> Franchise Team (₹{teamFee})
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                {regType === 'player' ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Jahidul Hasan"
                        required
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Father's Name</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Nurul Islam"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-dark small fw-bold">Playing Role *</label>
                      <select
                        className="form-select form-control-light"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="All-Rounder">All-Rounder</option>
                        <option value="Batter">Batter</option>
                        <option value="Bowler">Bowler</option>
                        <option value="Wicketkeeper">Wicketkeeper</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-dark small fw-bold">Player Category *</label>
                      <select
                        className="form-select form-control-light"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'Local' | 'Foreign')}
                      >
                        <option value="Local">Local (Khoraghat / Dhubri) — ₹500</option>
                        <option value="Foreign">Foreign / Outstation — ₹1000</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-dark small fw-bold">Age *</label>
                      <input
                        type="number"
                        min="14"
                        max="55"
                        className="form-control form-control-light"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Contact Phone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-light"
                        placeholder="+91 98765 43210"
                        required
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Village / Address *</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Khoraghat / Bilasipara"
                        required
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Batting Hand</label>
                      <select
                        className="form-select form-control-light"
                        value={battingHand}
                        onChange={(e) => setBattingHand(e.target.value)}
                      >
                        <option value="Right-hand Bat">Right-hand Bat</option>
                        <option value="Left-hand Bat">Left-hand Bat</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Bowling Style</label>
                      <select
                        className="form-select form-control-light"
                        value={bowlingStyle}
                        onChange={(e) => setBowlingStyle(e.target.value)}
                      >
                        <option value="Right-arm Medium Fast">Right-arm Medium Fast</option>
                        <option value="Right-arm Fast">Right-arm Fast</option>
                        <option value="Right-arm Spin">Right-arm Spin</option>
                        <option value="Left-arm Fast">Left-arm Fast</option>
                        <option value="Left-arm Spin">Left-arm Spin</option>
                        <option value="None">None</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label text-dark small fw-bold">Player Photo</label>
                      <div className="d-flex align-items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-light"
                          onChange={handlePhotoUpload}
                        />
                        {photoBase64 && (
                          <img
                            src={photoBase64}
                            alt="Preview"
                            className="rounded border"
                            style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="p-3 rounded-3 border bg-light">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="bootstrapPlayerDeclaration"
                            required
                            checked={declarationAccepted}
                            onChange={(e) => setDeclarationAccepted(e.target.checked)}
                          />
                          <label className="form-check-label small text-dark" htmlFor="bootstrapPlayerDeclaration">
                            <strong>Player Declaration &amp; Undertaking *</strong><br />
                            I declare that all information provided is true and correct. I agree to abide by the rules and code of conduct of Khoraghat Premier League (KPL) Season 3.
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Franchise Team Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Bilasipara Strikers"
                        required
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Owner Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Rafiqul Islam"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">Captain Name</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Surat Jamal"
                        value={captainName}
                        onChange={(e) => setCaptainName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-dark small fw-bold">City / District *</label>
                      <input
                        type="text"
                        className="form-control form-control-light"
                        placeholder="e.g. Bilasipara, Dhubri"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label text-dark small fw-bold">Owner Contact Phone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-light"
                        placeholder="+91 98765 43210"
                        required
                        value={teamContact}
                        onChange={(e) => setTeamContact(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="button-outline py-2 px-4" onClick={handleCloseAll}>
                    <span>Cancel</span>
                  </button>
                  <button type="submit" disabled={submitting} className="button-primary py-2 px-4">
                    <span>
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="spinner-border spinner-border-sm me-2" /> Saving...
                        </>
                      ) : (
                        <>
                          Proceed to Payment <ArrowRight size={16} className="ms-1" />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: INSTANT DIRECT UPI QR PAYMENT */}
          {step === 'upi_payment' && (
            <div>
              <div className="text-center mb-4">
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fw-bold small">
                  <ShieldCheck size={14} className="me-1" /> Direct Official UPI Gateway (0% Extra Fees)
                </span>
                <h4 className="sport-heading fs-4 mt-2 mb-1">Scan & Pay via UPI</h4>
                <p className="text-muted small">
                  Registration ID: <strong className="text-primary font-monospace">{registeredId}</strong>
                </p>
              </div>

              <div className="row g-4 align-items-center">
                <div className="col-md-5 text-center">
                  <div className="p-3 bg-white border border-2 border-warning rounded-3 shadow-sm d-inline-block">
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                    />
                  </div>
                  <p className="text-muted small mt-2 mb-0">
                    <QrCode size={13} className="me-1 text-primary" />
                    Scan using GPay, PhonePe, Paytm, or BHIM
                  </p>
                </div>

                <div className="col-md-7">
                  <div className="bg-light p-3 rounded-3 border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Amount to Pay:</span>
                      <strong className="fs-4 text-dark font-monospace">₹{payableAmount}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Merchant UPI ID:</span>
                      <code className="text-primary fw-bold">{upiId}</code>
                    </div>
                  </div>

                  {/* App Action Buttons for Phones */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <a
                      href={upiIntentUrl}
                      className="btn btn-success flex-grow-1 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-1 text-decoration-none"
                    >
                      <Smartphone size={16} /> Open UPI App
                    </a>
                    <a
                      href={qrCodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-dark rounded-pill fw-bold py-2 px-3 d-flex align-items-center gap-1"
                      title="Open/Save QR code image to scan in UPI app"
                    >
                      <Download size={15} /> Save QR
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="btn btn-outline-secondary rounded-pill fw-bold py-2 px-3"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <>
                          <Check size={16} className="text-success me-1" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="me-1" /> Copy ID
                        </>
                      )}
                    </button>
                  </div>

                  {/* Payment Submission Form */}
                  <form onSubmit={handleUtrSubmit}>
                    {/* Option A: Upload Payment Screenshot */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label text-dark small fw-bold mb-0">
                          <ImageIcon size={14} className="text-success me-1" /> Upload Payment Screenshot
                        </label>
                        <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25" style={{ fontSize: '10px' }}>
                          Recommended on Phone
                        </span>
                      </div>

                      {paymentScreenshot ? (
                        <div className="d-flex align-items-center gap-2 p-2 bg-light border rounded-3">
                          <img src={paymentScreenshot} alt="Payment Receipt" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                          <div className="flex-grow-1 min-w-0">
                            <div className="small fw-bold text-dark text-truncate">Payment Screenshot Attached</div>
                            <div className="text-success" style={{ fontSize: '11px' }}>Ready to verify</div>
                          </div>
                          <button type="button" className="btn btn-sm text-danger" onClick={() => setPaymentScreenshot('')}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center p-3 border border-2 border-dashed rounded-3 bg-white text-center cursor-pointer w-100" style={{ cursor: 'pointer' }}>
                          <input type="file" accept="image/*" className="d-none" onChange={handleScreenshotUpload} />
                          <UploadCloud size={24} className="text-muted mb-1" />
                          <span className="small fw-bold text-dark">Tap to Upload Payment Screenshot</span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>From Google Pay, PhonePe, Paytm, or Gallery</span>
                        </label>
                      )}
                    </div>

                    <div className="text-center text-muted small my-2" style={{ fontSize: '11px' }}>— AND / OR —</div>

                    {/* Option B: 12-Digit UTR Number */}
                    <div className="mb-3">
                      <label className="form-label text-dark small fw-bold">
                        12-Digit UPI UTR / Transaction Ref No
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-light font-monospace"
                        placeholder="e.g. 425612349876 or UTR Ref"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !paymentScreenshot}
                      className="button-primary w-100 py-2.5"
                    >
                      <span>
                        {submitting ? (
                          <>
                            <Loader2 size={16} className="spinner-border spinner-border-sm me-2" /> Submitting...
                          </>
                        ) : (
                          <>
                            Submit Payment Proof <ArrowRight size={16} className="ms-1" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS NOTIFICATION */}
          {step === 'success' && (
            <div className="text-center py-4">
              <CheckCircle size={64} className="text-success mb-3 animate__animated animate__zoomIn" />
              <h4 className="sport-heading text-dark mb-1">Registration & Payment Submitted!</h4>
              <p className="text-muted small mb-3">
                Your Registration ID is <strong className="text-primary font-monospace">{registeredId}</strong> with UTR <strong className="font-monospace">{utrNumber}</strong>.
              </p>
              <div className="p-3 bg-light rounded-3 border text-start mb-4 max-w-md mx-auto" style={{ maxWidth: '440px' }}>
                <p className="small text-muted mb-1">
                  <strong>What's Next?</strong>
                </p>
                <ul className="small text-muted ps-3 mb-0">
                  <li>The KPL Committee will verify your UPI transaction within a few hours.</li>
                  <li>You will receive an official confirmation SMS / WhatsApp message.</li>
                  <li>Eligible players will be added to the live KPL Season 3 draft auction pool.</li>
                </ul>
              </div>

              <div className="d-flex justify-content-center gap-2">
                <button className="button-primary py-2 px-4" onClick={handleCloseAll}>
                  <span>Done & Return to Homepage</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

