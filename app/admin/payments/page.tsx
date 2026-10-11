'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi } from '@/lib/api';
import {
  CreditCard, Plus, X, Loader2, CheckCircle2,
  AlertCircle, Download, RefreshCw, Check, Ban, Image as ImageIcon
} from 'lucide-react';


interface Payment {
  id: string;
  order_id?: string;
  payment_id?: string;
  gateway?: string;
  payment_gateway?: string;
  amount: number;
  currency?: string;
  status: string;
  payment_status?: string;
  registration_type?: string;
  registration_id?: string;
  purpose?: string;
  entity_type?: string;
  entity_name?: string;
  applicant_name?: string;
  contact_email?: string;
  contact_phone?: string;
  payer_name?: string;
  name?: string;
  payer_email?: string;
  payer_phone?: string;
  phone?: string;
  utr_number?: string;
  screenshot?: string;
  created_at: string;
}

const EMPTY_FORM = {
  gateway: 'upi_direct', amount: '', currency: 'INR', status: 'completed',
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
  const [selectedScreenshot, setSelectedScreenshot] = useState<{ url: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await kplApi.getPayments(500);
      const data = res?.data || res || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleVerifyPayment = async (id: string, newStatus: 'completed' | 'rejected') => {
    try {
      await kplApi.updatePaymentStatus(id, newStatus);
      showToast(newStatus === 'completed' ? 'Payment Approved & Registration Activated!' : 'Payment Rejected');
      loadPayments();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  async function savePayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await kplApi.createPayment({
        name: form.payer_name || 'Manual Payment',
        phone: form.payer_phone || '',
        amount: parseFloat(form.amount),
        payment_gateway: form.gateway,
        payment_id: form.payment_id || `MANUAL-${Date.now()}`,
        status: form.status,
        registration_type: form.purpose === 'team_registration' ? 'team' : 'player',
      });
      showToast('Payment recorded successfully!');
      setModal(null);
      setForm(EMPTY_FORM);
      loadPayments();
    } catch (err: any) {
      showToast(err.message || 'Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    const rows = [
      ['ID / Ref', 'UTR / Payment ID', 'Gateway', 'Amount', 'Status', 'Payer', 'Phone', 'Type', 'Date'],
      ...payments.map(p => [
        p.id, p.payment_id || p.order_id, p.payment_gateway || p.gateway, p.amount, p.status,
        p.name || p.payer_name, p.phone || p.payer_phone, p.registration_type || p.purpose,
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
    const gw = p.payment_gateway || p.gateway || '';
    if (filterGateway && gw !== filterGateway) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const totalCollected = payments
    .filter(p => p.status === 'completed' || p.status === 'success')
    .reduce((s, p) => s + Number(p.amount), 0);

  const columns: Column<Payment>[] = [
    {
      key: 'payment_id', label: 'UTR / Payment Ref',
      render: p => (
        <div>
          <span className="dt-mono" style={{ fontWeight: 700, color: '#10b981' }}>{p.payment_id || p.order_id || '—'}</span>
          {p.screenshot && (
            <div style={{ marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setSelectedScreenshot({
                  url: p.screenshot!,
                  title: `${p.name || p.payer_name || 'Payer'} (UTR: ${p.payment_id || 'N/A'})`
                })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#0284c7',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
                title="View Payment Proof Screenshot"
              >
                <ImageIcon size={12} /> View Screenshot
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'payment_gateway', label: 'Gateway',
      render: p => {
        const gw = p.payment_gateway || p.gateway;
        return (
          <span className={`admin-gateway-badge admin-gateway-${gw}`}>
            {gw === 'upi_direct' ? '⚡ Free Direct UPI' : gw === 'cashfree' ? '💳 Cashfree' : '🔵 Razorpay'}
          </span>
        );
      },
    },
    {
      key: 'amount', label: 'Amount', sortable: true,
      render: p => <strong>₹{Number(p.amount).toLocaleString('en-IN')}</strong>,
    },
    {
      key: 'status', label: 'Status',
      render: p => (
        <span className={`admin-status-badge admin-status-${p.status === 'pending_verification' ? 'pending' : p.status}`}>
          {p.status === 'pending_verification' ? '⏳ Pending UTR Review' : p.status}
        </span>
      ),
    },
    {
      key: 'payer_name', label: 'Payer Details',
      render: p => (
        <div>
          <div style={{ fontWeight: 600 }}>{p.name || p.payer_name || '—'}</div>
          <div className="dt-player-meta">{p.phone || p.payer_phone || ''}</div>
        </div>
      ),
    },
    {
      key: 'registration_type', label: 'Type & Reg ID',
      render: p => (
        <div>
          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{p.registration_type || p.purpose || '—'}</span>
          {p.registration_id && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.registration_id}</div>}
        </div>
      ),
    },
    {
      key: 'created_at', label: 'Date', sortable: true,
      render: p => new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      key: 'id', label: 'Actions',
      render: p => (
        <div style={{ display: 'flex', gap: 6 }}>
          {p.status === 'pending_verification' || p.status === 'pending' ? (
            <>
              <button
                onClick={() => handleVerifyPayment(p.id, 'completed')}
                className="admin-btn admin-btn-primary"
                style={{ padding: '4px 8px', fontSize: 12 }}
                title="Approve Payment & Activate Registration"
              >
                <Check size={13} /> Approve
              </button>
              <button
                onClick={() => handleVerifyPayment(p.id, 'rejected')}
                className="admin-btn admin-btn-danger"
                style={{ padding: '4px 8px', fontSize: 12 }}
                title="Reject"
              >
                <Ban size={13} /> Reject
              </button>
            </>
          ) : (
            <span style={{ color: '#64748b', fontSize: 12 }}>—</span>
          )}
        </div>
      ),
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

        {/* Standard Metric Overview Cards */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <CreditCard size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Total Revenue</div>
              <div className="admin-stat-value">₹{totalCollected.toLocaleString('en-IN')}</div>
              <div className="admin-stat-sub">Verified UPI & gateway collections</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <CheckCircle2 size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Successful</div>
              <div className="admin-stat-value">
                {payments.filter(p => p.status === 'success' || p.status === 'completed').length}
              </div>
              <div className="admin-stat-sub">Confirmed registrations</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ color: payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length > 0 ? '#facc15' : undefined }}>
              <AlertCircle size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Pending Verification</div>
              <div className="admin-stat-value">
                {payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length}
              </div>
              <div className="admin-stat-sub">UTR screenshots awaiting review</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <RefreshCw size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Total Records</div>
              <div className="admin-stat-value">{payments.length}</div>
              <div className="admin-stat-sub">{payments.filter(p => (p.payment_gateway || p.gateway) === 'upi_direct').length} Direct UPI scans</div>
            </div>
          </div>
        </div>

        {/* Sleek Single-Line Filter Toolbar */}
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 'var(--adm-radius-md)',
            padding: '8px 12px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
          }}
        >
          {/* Gateway Filter */}
          <select
            value={filterGateway}
            onChange={e => setFilterGateway(e.target.value)}
            style={{
              background: 'var(--adm-input-bg)',
              border: '1px solid var(--adm-border)',
              color: 'var(--adm-text-primary)',
              padding: '6px 10px',
              borderRadius: 'var(--adm-radius-sm)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="">⚡ All Payment Channels</option>
            <option value="upi_direct">Free Direct UPI (QR)</option>
            <option value="cashfree">Cashfree PG</option>
            <option value="razorpay">Razorpay PG</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              background: 'var(--adm-input-bg)',
              border: '1px solid var(--adm-border)',
              color: 'var(--adm-text-primary)',
              padding: '6px 10px',
              borderRadius: 'var(--adm-radius-sm)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value="">Status: All Records</option>
            <option value="completed">Completed / Verified</option>
            <option value="success">Success</option>
            <option value="pending_verification">Pending UTR Review</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </select>

          {/* Counter and Reset */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--adm-text-muted)', flexShrink: 0 }}>
            <span>
              Showing <strong style={{ color: 'var(--adm-text-primary)' }}>{filtered.length}</strong> of {payments.length}
            </span>
            {(filterGateway || filterStatus) && (
              <button
                type="button"
                onClick={() => {
                  setFilterGateway('');
                  setFilterStatus('');
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <X size={11} /> Reset
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          searchKeys={['order_id', 'payment_id', 'name', 'payer_name', 'phone', 'payer_phone', 'registration_id']}
          searchPlaceholder="Search by UTR, order ID, phone, name..."
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

        {/* Screenshot Preview Modal */}
        {selectedScreenshot && (
          <div className="admin-modal-overlay" onClick={() => setSelectedScreenshot(null)}>
            <div className="admin-modal" style={{ maxWidth: 520, width: '90%' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Payment Proof Screenshot</h2>
                <button onClick={() => setSelectedScreenshot(null)}><X size={20} /></button>
              </div>
              <div style={{ padding: '1.25rem', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>
                  {selectedScreenshot.title}
                </p>
                <div style={{ maxHeight: '65vh', overflowY: 'auto', borderRadius: 8, border: '1px solid var(--adm-border)', background: 'var(--adm-input-bg)', padding: '8px' }}>
                  <img
                    src={selectedScreenshot.url}
                    alt="Payment Screenshot"
                    style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: 4 }}
                  />
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <a
                    href={selectedScreenshot.url}
                    download="payment_screenshot"
                    className="admin-btn admin-btn-ghost"
                    style={{ textDecoration: 'none' }}
                  >
                    <Download size={14} /> Download
                  </a>
                  <button type="button" className="admin-btn admin-btn-primary" onClick={() => setSelectedScreenshot(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
