'use client';

import React, { useState } from 'react';
import { QrCode, Copy, Check, ArrowRight, ShieldCheck, Smartphone, X, Loader2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Format standard UPI URL scheme
  const encodedPayee = encodeURIComponent(payeeName);
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodedPayee}&am=${amount}&tr=${registrationId}&tn=${encodeURIComponent(`KPL Registration ${registrationId}`)}&cu=INR`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();
    if (cleanUtr.length < 6) {
      setError('Please enter a valid 12-digit UPI UTR / Transaction reference number');
      return;
    }

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
        payment_id: cleanUtr,
        status: 'pending_verification',
      });

      onSuccess(cleanUtr);
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment reference.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white relative shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            0% MDR Free Direct UPI Gateway
          </div>
          <h3 className="text-xl font-black text-white">Scan & Pay via UPI</h3>
          <p className="text-slate-400 text-xs mt-1">
            Registration ID: <span className="text-emerald-400 font-mono font-bold">{registrationId}</span>
          </p>
        </div>

        {/* Amount Badge */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center mb-5">
          <div className="text-slate-400 text-xs uppercase font-medium">Total Amount Payable</div>
          <div className="text-3xl font-black text-white mt-0.5">
            ₹{amount.toLocaleString('en-IN')}{' '}
            <span className="text-xs text-emerald-400 font-normal"> (Zero Extra Fees)</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-emerald-500/30 relative group">
            <img src={qrApiUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
          </div>
          <p className="text-slate-400 text-xs mt-2.5 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            Scan using GPay, PhonePe, Paytm, or any UPI app
          </p>
        </div>

        {/* Mobile App Intent Shortcuts */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <a
            href={upiUrl}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-lg"
          >
            <Smartphone className="w-4 h-4" /> Open UPI App
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied VPA!' : upiId}
          </button>
        </div>

        {/* UTR Form */}
        <form onSubmit={handleSubmitUtr} className="border-t border-slate-800 pt-5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Enter 12-Digit UPI UTR / Ref No *
          </label>
          <input
            type="text"
            required
            maxLength={18}
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="e.g. 425612349876 or UTR Ref No"
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors mb-3 font-mono"
          />

          {error && <div className="text-red-400 text-xs mb-3 font-medium">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Submit Payment Reference <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
