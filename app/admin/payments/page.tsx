'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { supabase } from '@/lib/supabase';
import {
  CreditCard, Plus, X, Loader2, CheckCircle2,
  AlertCircle, Download, RefreshCw,
} from 'lucide-react';

interface Payment {
  id: string;
  order_id: string;
  payment_id: string;
  gateway: string;
  amount: number;
  currency: string;
  status: string;
  payer_name: string;
  payer_email: string;
  payer_phone: string;
  purpose: string;
  created_at: string;
}

const EMPTY_FORM = {
  gateway: 'razorpay', amount: '', currency: 'INR', status: 'success',
  payer_name: '', payer_email: '', payer_phone: '', purpose: 'team_registration',
  order_id: '', payment_id: '',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterGateway, setFilterGateway] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('payments').insert({
      gateway: form.gateway,
      amount: parseFloat(form.amount),
      currency: form.currency,
      status: form.status,
      payer_name: form.payer_name || null,
      payer_email: form.payer_email || null,
      payer_phone: form.payer_phone || null,
      purpose: form.purpose || null,
      order_id: form.order_id || `manual_${Date.now()}`,
      payment_id: form.payment_id || null,
    });
    setSaving(false);
    if (error) showToast(error.message, 'error');
    else { showToast('Payment recorded!'); setModal(null); setForm(EMPTY_FORM); loadPayments(); }
  }

  function exportCSV() {
    const rows = [
      ['Order ID', 'Payment ID', 'Gateway', 'Amount', 'Currency', 'Status', 'Payer', 'Email', 'Phone', 'Purpose', 'Date'],
      ...payments.map(p => [
        p.order_id, p.payment_id, p.gateway, p.amount, p.currency, p.status,
        p.payer_name, p.payer_email, p.payer_phone, p.purpose,
        new Date(p.created_at).toLocaleString('en-IN'),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kpl_payments.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = payments.filter(p => {
    if (filterGateway && p.gateway !== filterGateway) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const totalCollected = payments.filter(p => p.status === 'success').reduce((s, p) => s + Number(p.amount), 0);

  const columns: Column<Payment>[] = [
    {
      key: 'order_id', label: 'Order ID',
      render: p => <span className="dt-mono">{p.order_id?.slice(0, 16) || '—'}</span>,
    },
    {
      key: 'gateway', label: 'Gateway',
      render: p => (
        <span className={`admin-gateway-badge admin-gateway-${p.gateway}`}>
          {p.gateway === 'cashfree' ? '💳 Cashfree' : '🔵 Razorpay'}
        </span>
      ),
    },
    {
      key: 'amount', label: 'Amount', sortable: true,
      render: p => <strong>₹{Number(p.amount).toLocaleString('en-IN')}</strong>,
    },
    {
      key: 'status', label: 'Status',
      render: p => <span className={`admin-status-badge admin-status-${p.status}`}>{p.status}</span>,
    },
    {
      key: 'payer_name', label: 'Payer',
      render: p => (
        <div>
          <div>{p.payer_name || '—'}</div>
          <div className="dt-player-meta">{p.payer_phone || ''}</div>
        </div>
      ),
    },
    { key: 'purpose', label: 'Purpose', render: p => p.purpose?.replace('_', ' ') || '—' },
    {
      key: 'created_at', label: 'Date', sortable: true,
      render: p => new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
  ];

  return (
    <AdminLayout>
      <div className="admin-page">
        {toast && (
          <div className={`admin-toast admin-toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </div>
        )}

        <div className="admin-page-header">
          <div>
            <h1><CreditCard size={22} /> Payments</h1>
            <p>Track all payment records across Cashfree and Razorpay.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-ghost" onClick={loadPayments}><RefreshCw size={15} /> Refresh</button>
            <button className="admin-btn admin-btn-ghost" onClick={exportCSV}><Download size={15} /> Export CSV</button>
            <button className="admin-btn admin-btn-primary" onClick={() => setModal('create')}><Plus size={16} /> Manual Entry</button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="admin-pay-summary">
          {[
            { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: '#10b981' },
            { label: 'Successful', value: payments.filter(p => p.status === 'success').length, color: '#10b981' },
            { label: 'Pending', value: payments.filter(p => p.status === 'pending').length, color: '#f59e0b' },
            { label: 'Failed', value: payments.filter(p => p.status === 'failed').length, color: '#ef4444' },
            { label: 'Cashfree', value: payments.filter(p => p.gateway === 'cashfree').length, color: '#6366f1' },
            { label: 'Razorpay', value: payments.filter(p => p.gateway === 'razorpay').length, color: '#3b82f6' },
          ].map(s => (
            <div className="admin-pay-stat" key={s.label}>
              <div className="admin-pay-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="admin-pay-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <select value={filterGateway} onChange={e => setFilterGateway(e.target.value)}>
            <option value="">All Gateways</option>
            <option value="cashfree">Cashfree</option>
            <option value="razorpay">Razorpay</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          searchKeys={['order_id', 'payment_id', 'payer_name', 'payer_email', 'payer_phone']}
          searchPlaceholder="Search by order ID, payer..."
          emptyMessage="No payment records found."
        />

        {/* Manual Entry Modal */}
        {modal === 'create' && (
          <div className="admin-modal-overlay" onClick={() => setModal(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Manual Payment Entry</h2>
                <button onClick={() => setModal(null)}><X size={20} /></button>
              </div>
              <form className="admin-modal-form" onSubmit={savePayment}>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label>Gateway *</label>
                    <select value={form.gateway} onChange={e => setForm({ ...form, gateway: e.target.value })}>
                      <option value="razorpay">Razorpay</option>
                      <option value="cashfree">Cashfree</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Status *</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Amount (₹) *</label>
                    <input type="number" min={1} required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="1000" />
                  </div>
                  <div className="admin-form-field">
                    <label>Purpose</label>
                    <select value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}>
                      <option value="team_registration">Team Registration</option>
                      <option value="player_registration">Player Registration</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label>Payer Name</label>
                    <input type="text" value={form.payer_name} onChange={e => setForm({ ...form, payer_name: e.target.value })} placeholder="Name" />
                  </div>
                  <div className="admin-form-field">
                    <label>Phone</label>
                    <input type="tel" value={form.payer_phone} onChange={e => setForm({ ...form, payer_phone: e.target.value })} placeholder="+91 ..." />
                  </div>
                  <div className="admin-form-field admin-form-full">
                    <label>Email</label>
                    <input type="email" value={form.payer_email} onChange={e => setForm({ ...form, payer_email: e.target.value })} placeholder="Email" />
                  </div>
                  <div className="admin-form-field">
                    <label>Order ID</label>
                    <input type="text" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} placeholder="Auto-generated if blank" />
                  </div>
                  <div className="admin-form-field">
                    <label>Payment ID</label>
                    <input type="text" value={form.payment_id} onChange={e => setForm({ ...form, payment_id: e.target.value })} placeholder="Gateway payment ID" />
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? <><Loader2 size={15} className="spin" /> Saving...</> : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
