'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2, X, Loader2, Sparkles, Award, ExternalLink,
  CheckCircle2, AlertCircle, Building2, Globe
} from 'lucide-react';
import { Sponsor } from '@/components/SponsorshipSection';

const TIERS = [
  { label: 'Title Sponsor', color: '#fbbf24' },
  { label: 'Co-Powered By', color: '#38bdf8' },
  { label: 'Associate Sponsor', color: '#a78bfa' },
  { label: 'Official Partner', color: '#22c55e' },
  { label: 'Beverage Partner', color: '#4ade80' },
  { label: 'Digital Media Partner', color: '#c084fc' }
] as const;

const DEFAULT_SPONSORS: Sponsor[] = [
  {
    id: '1',
    name: 'Projukti Soft',
    tier: 'Title Sponsor',
    tierBadgeColor: '#fbbf24',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=80',
    description: 'Premier digital engineering & cloud technology enterprise powering high-scale community web platforms and tournament management software across Northeast India.',
    highlight: 'Official Technology & Title Partner',
    website: 'https://kpl.projuktisoft.com'
  },
  {
    id: '2',
    name: 'Apex Arena Sports',
    tier: 'Co-Powered By',
    tierBadgeColor: '#38bdf8',
    logo: 'https://images.unsplash.com/photo-1531415074868-8363325697c0?auto=format&fit=crop&w=500&q=80',
    description: 'Specialists in international cricket equipment, tournament match balls, stadium gear, and youth athletic training apparel.',
    highlight: 'Official Match Equipment Provider'
  },
  {
    id: '3',
    name: 'GreenValley Agro & Refreshments',
    tier: 'Beverage Partner',
    tierBadgeColor: '#4ade80',
    logo: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80',
    description: 'Pure hydration and natural organic energy beverages keeping players and crowd refreshed under the Assam stadium sun.',
    highlight: 'Hydration & Nutrition Partner'
  },
  {
    id: '4',
    name: 'Khoraghat Media Network',
    tier: 'Digital Media Partner',
    tierBadgeColor: '#c084fc',
    logo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=80',
    description: 'High-definition multi-camera live broadcast, social media highlights, drone stadium sweeps, and real-time score updates.',
    highlight: 'Broadcasting & Broadcast Stream'
  }
];

const EMPTY_FORM: Omit<Sponsor, 'id'> = {
  name: '',
  tier: 'Official Partner',
  tierBadgeColor: '#22c55e',
  logo: '',
  description: '',
  highlight: '',
  website: ''
};

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Sponsor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadSponsors() {
    setLoading(true);
    try {
      const data = await kplApi.getSponsors();
      if (Array.isArray(data) && data.length > 0) {
        setSponsors(data);
      } else {
        setSponsors(DEFAULT_SPONSORS);
      }
    } catch (err: any) {
      console.error(err);
      setSponsors(DEFAULT_SPONSORS);
      showToast('Loaded default sponsor showcase', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSponsors();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setSelected(null);
    setModal('create');
  }

  function openEdit(s: Sponsor) {
    setSelected(s);
    setForm({
      name: s.name,
      tier: s.tier,
      tierBadgeColor: s.tierBadgeColor,
      logo: s.logo,
      description: s.description,
      highlight: s.highlight || '',
      website: s.website || ''
    });
    setModal('edit');
  }

  function openDelete(s: Sponsor) {
    setSelected(s);
    setModal('delete');
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setForm((prev) => ({ ...prev, logo: ev.target?.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  async function saveSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.logo.trim() || !form.description.trim()) {
      showToast('Please provide sponsor name, image/logo, and description', 'error');
      return;
    }

    setSaving(true);
    try {
      let updated: Sponsor[];
      if (modal === 'create') {
        const newSponsor: Sponsor = {
          ...form,
          id: String(Date.now()),
        };
        await kplApi.createSponsor(form);
        updated = [...sponsors, newSponsor];
      } else if (modal === 'edit' && selected) {
        await kplApi.updateSponsor(selected.id, form);
        updated = sponsors.map((item) =>
          item.id === selected.id ? { ...form, id: selected.id } : item
        );
      } else {
        return;
      }

      await kplApi.saveSponsors(updated);
      setSponsors(updated);
      showToast(modal === 'create' ? 'Sponsor added successfully' : 'Sponsor updated successfully');
      setModal(null);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save sponsor', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await kplApi.deleteSponsor(selected.id);
      const updated = sponsors.filter((item) => item.id !== selected.id);
      await kplApi.saveSponsors(updated);
      setSponsors(updated);
      showToast('Sponsor removed successfully');
      setModal(null);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete sponsor', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Toast */}
        {toast && (
          <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : ''}`}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Tournament Sponsors</h1>
            <p className="admin-sub">
              Manage sponsors, brand partners, images, and sponsorship tiers displayed on the public landing page.
            </p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Sponsor
          </button>
        </div>

        {/* Sponsor Grid View */}
        {loading ? (
          <div className="admin-loading-rows" style={{ padding: '40px 0', textAlign: 'center' }}>
            <Loader2 className="spin" size={32} style={{ color: 'var(--green-mint)', margin: '0 auto' }} />
          </div>
        ) : sponsors.length === 0 ? (
          <div className="admin-empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Building2 size={48} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>No sponsors added yet</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              Add your first tournament sponsor or partner brand to display them on the homepage.
            </p>
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Sponsor
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              marginTop: '16px'
            }}
          >
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                style={{
                  background: 'rgba(11, 26, 45, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}
              >
                {/* Image preview & tier */}
                <div style={{ position: 'relative', width: '100%', height: '180px', background: '#020813' }}>
                  <img
                    src={getImageUrl(sponsor.logo)}
                    alt={sponsor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 40%, rgba(11, 26, 45, 0.95) 100%)'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(4, 13, 26, 0.85)',
                      border: `1px solid ${sponsor.tierBadgeColor}66`,
                      color: sponsor.tierBadgeColor,
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <Award size={12} />
                    {sponsor.tier}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {sponsor.name}
                    </h3>
                    {sponsor.website && (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noreferrer"
                        title="Website"
                        style={{ color: 'var(--green-mint)' }}
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>

                  {sponsor.highlight && (
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-mint)', marginBottom: '10px' }}>
                      • {sponsor.highlight}
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text)',
                      lineHeight: '1.6',
                      margin: '0 0 20px',
                      flexGrow: 1
                    }}
                  >
                    {sponsor.description}
                  </p>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      className="admin-btn admin-btn-secondary"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => openEdit(sponsor)}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '0 12px' }}
                      title="Remove Sponsor"
                      onClick={() => openDelete(sponsor)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create / Edit */}
        {(modal === 'create' || modal === 'edit') && (
          <div className="admin-modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '580px' }}>
              <div className="admin-modal-header">
                <h2>{modal === 'create' ? 'Add Sponsor' : 'Edit Sponsor'}</h2>
                <button className="admin-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
              </div>

              <form onSubmit={saveSponsor} className="admin-form">
                <div className="form-group">
                  <label>Sponsor / Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Projukti Soft"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Sponsorship Tier *</label>
                    <select
                      value={form.tier}
                      onChange={(e) => {
                        const selectedTier = TIERS.find((t) => t.label === e.target.value);
                        setForm({
                          ...form,
                          tier: e.target.value as any,
                          tierBadgeColor: selectedTier?.color || '#22c55e'
                        });
                      }}
                    >
                      {TIERS.map((t) => (
                        <option key={t.label} value={t.label}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Badge Color Accent</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={form.tierBadgeColor}
                        onChange={(e) => setForm({ ...form, tierBadgeColor: e.target.value })}
                        style={{ width: '42px', height: '38px', padding: 2, cursor: 'pointer', borderRadius: '8px' }}
                      />
                      <input
                        type="text"
                        value={form.tierBadgeColor}
                        onChange={(e) => setForm({ ...form, tierBadgeColor: e.target.value })}
                        placeholder="#22c55e"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Highlight Tagline (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Official Technology & Title Partner"
                    value={form.highlight}
                    onChange={(e) => setForm({ ...form, highlight: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Partner Website (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Sponsor Image / Banner / Logo *</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Or enter direct image URL"
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  />
                  {form.logo && (
                    <div style={{ marginTop: '10px', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={getImageUrl(form.logo)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write a brief overview of the company, role in tournament, or products..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                    {saving ? <Loader2 size={15} className="spin" /> : null}
                    {modal === 'create' ? 'Add Sponsor' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {modal === 'delete' && selected && (
          <div className="admin-modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '420px' }}>
              <div className="admin-modal-header">
                <h2>Remove Sponsor</h2>
                <button className="admin-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
              </div>
              <div style={{ padding: '20px 0', color: 'var(--text)' }}>
                <p>Are you sure you want to remove <strong>{selected.name}</strong> from sponsors?</p>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
                  This will immediately remove the sponsor from the public tournament website.
                </p>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDelete} disabled={saving}>
                  {saving ? <Loader2 size={15} className="spin" /> : null}
                  Confirm Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
