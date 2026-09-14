'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  X,
  Loader2,
  Download,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { kplApi } from '@/lib/api';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationType: 'player' | 'team';
  registrationId: string;
  payerName: string;
  payerPhone: string;
  amount: number;
  upiId?: string;
  payeeName?: string;
  onSuccess: (utr: string) => void;
}

export function UpiPaymentModal({
  isOpen,
  onClose,
  registrationType,
  registrationId,
  payerName,
  payerPhone,
  amount,
  upiId = '8638479115@ybl',
  payeeName = 'Khoraghat Premier League',
  onSuccess,
}: UpiPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState<string>('');
  const [processingImage, setProcessingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Format standard UPI URL scheme
  const encodedPayee = encodeURIComponent(payeeName);
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodedPayee}&am=${amount}&tr=${registrationId}&tn=${encodeURIComponent(`KPL Registration ${registrationId}`)}&cu=INR`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpl-upi-qr-${registrationId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrApiUrl, '_blank');
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError('Screenshot file size must be under 20MB.');
      return;
    }
    setProcessingImage(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawUrl = event.target?.result as string;
      // Compress image using canvas so payload is compact (~80-150KB) and database insertion is 100% reliable
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 900;
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setScreenshot(canvas.toDataURL('image/jpeg', 0.72));
        } else {
          setScreenshot(rawUrl);
        }
        setProcessingImage(false);
        setError('');
      };
      img.onerror = () => {
        setScreenshot(rawUrl);
        setProcessingImage(false);
        setError('');
      };
      img.src = rawUrl;
    };
    reader.onerror = () => {
      setProcessingImage(false);
      setError('Failed to read selected image file. Please try another image.');
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-select if desired
    e.target.value = '';
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();

    if (processingImage) {
      setError('Please wait, processing payment screenshot...');
      return;
    }

    // Screenshot is required for proof verification
    if (!screenshot) {
      setError('Please tap "Tap to Upload Payment Screenshot" to attach your payment confirmation screenshot before submitting.');
      return;
    }

    if (cleanUtr && cleanUtr.length < 6) {
      setError('Please enter a valid 12-digit UPI UTR / Transaction reference number');
      return;
    }

    const finalPaymentId = cleanUtr || `UPI-SHOT-${registrationId}`;

    try {
      setSubmitting(true);
      setError('');

      await kplApi.createPayment({
        registration_type: registrationType,
        registration_id: registrationId,
        name: payerName,
        phone: payerPhone,
        amount: amount,
        payment_gateway: 'upi_direct',
        payment_id: finalPaymentId,
        screenshot: screenshot,
        payment_proof: screenshot,
        status: 'pending_verification',
      });

      onSuccess(finalPaymentId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment proof.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      style={{ zIndex: 2500 }}
    >
      <div className="bg-[#081426] border border-slate-700/60 rounded-2xl max-w-lg w-full p-4 sm:p-6 text-white relative shadow-2xl my-auto max-h-[94vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-4 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            0% MDR Free Direct UPI Gateway
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Scan & Pay via UPI</h3>
          <p className="text-slate-400 text-xs mt-1">
            Registration ID: <span className="text-emerald-400 font-mono font-bold">{registrationId}</span>
          </p>
        </div>

        {/* Amount Badge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-center mb-4">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Total Amount Payable</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-0.5">
            ₹{amount.toLocaleString('en-IN')}{' '}
            <span className="text-xs text-slate-300 font-normal"> (Official Entry Fee)</span>
          </div>
        </div>

        {/* QR Code Section for Phones & Desktops */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 mb-4 flex flex-col items-center">
          <div className="bg-white p-2.5 rounded-xl shadow-xl border-2 border-emerald-500/40 relative">
            <img src={qrApiUrl} alt="UPI QR Code" className="w-44 h-44 sm:w-48 sm:h-48 object-contain" />
          </div>
          <p className="text-slate-300 text-xs mt-2.5 flex items-center gap-1 font-medium">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            Scan using GPay, PhonePe, Paytm, or any UPI App
          </p>

          {/* Quick Actions for Phones */}
          <div className="grid grid-cols-3 gap-2 w-full mt-3.5">
            <a
              href={upiUrl}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2 px-2 rounded-xl transition-all shadow text-center"
            >
              <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Open UPI</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 px-2 rounded-xl transition-colors border border-slate-700"
              title="Save QR Code image to scan in UPI app"
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Save QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2 px-2 rounded-xl transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* Payment Proof Submission Form */}
        <form onSubmit={handleSubmitPayment} className="space-y-3.5">
          {/* Option A: Upload Payment Screenshot (Primary on Phone) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Upload Payment Screenshot *
              </label>
              <span className="text-[11px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Recommended on Phone
              </span>
            </div>

            {processingImage ? (
              <div className="border border-slate-700/80 rounded-xl p-4 bg-slate-950/80 flex items-center justify-center gap-2.5 text-slate-300 text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Optimizing screenshot for upload...</span>
              </div>
            ) : screenshot ? (
              <div className="relative border border-emerald-500/40 rounded-xl overflow-hidden bg-slate-950 p-2 flex items-center gap-3">
                <img src={screenshot} alt="Payment Receipt" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">Payment Screenshot Attached</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">Ready for instant verification</div>
                </div>
                <button
                  type="button"
                  onClick={() => setScreenshot('')}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove screenshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-3.5 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all text-center group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors mb-1" />
                <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Tap to Upload Payment Screenshot
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Screenshot from Google Pay, PhonePe, Paytm, or Gallery
                </span>
              </label>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 my-2 text-slate-500 text-[11px]">
            <div className="flex-1 h-px bg-slate-800" />
            <span>AND / OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Option B: 12-Digit UTR Ref No */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              12-Digit UPI UTR / Transaction Ref No
            </label>
            <input
              type="text"
              maxLength={22}
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 425612349876 or UPI Ref"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors font-mono"
            />
          </div>

          {error && <div className="text-red-400 text-xs font-medium bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Submit Payment Proof <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
