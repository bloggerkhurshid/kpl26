'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import { kplApi, getImageUrl } from '@/lib/api';
import {
  Plus, Edit2, Trash2,
  X, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Highlight {
  id: string;
  title: string;
  image_url: string;
  size: string;
  created_at: string;
}

const EMPTY_FORM = { title: '', image_url: '', size: '' };

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Highlight | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadHighlights() {
    setLoading(true);
    try {
      const res = await kplApi.getHighlights(100);
      const data = res?.data || res || [];
      setHighlights(data);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load highlights', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHighlights(); }, []);

  function openCreate() { setForm(EMPTY_FORM); setSelected(null); setModal('create'); }
  function openEdit(h: Highlight) { setForm({ title: h.title, image_url: h.image_url, size: h.size || '' }); setSelected(h); setModal('edit'); }
  function openDelete(h: Highlight) { setSelected(h); setModal('delete'); }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setForm({ ...form, image_url: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  async function saveHighlight(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await kplApi.createHighlight(form);
      } else if (modal === 'edit' && selected) {
        await kplApi.updateHighlight(selected.id, form);
      }
      showToast(modal === 'create' ? 'Highlight added!' : 'Highlight updated!');
      setModal(null);
      loadHighlights();
    } catch (err: any) {
      showToast(err.message || 'Failed to save highlight', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteHighlight() {
    if (!selected) return;
    setSaving(true);
    try {
      await kplApi.deleteHighlight(selected.id);
      showToast('Highlight deleted.');
      setModal(null);
      loadHighlights();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete highlight', 'error');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Highlight>[] = [
    {
      key: 'image_url', label: 'Photo',
      render: h => (
        <div style={{ width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', background: '#e2e8f0' }}>
          <img src={getImageUrl(h.image_url)} alt={h.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )
    },
    { key: 'title', label: 'Title', sortable: true },
    { 
      key: 'size', label: 'Grid Size', 
      render: h => h.size === 'gallery-tall' ? 'Tall' : h.size === 'gallery-wide' ? 'Wide' : 'Normal'
    },
    {
      key: 'id', label: 'Actions',
      render: h => (
        <div className="dt-actions">
          <button className="dt-btn" onClick={() => openEdit(h)} title="Edit"><Edit2 size={15} /></button>
          <button className="dt-btn dt-btn-danger" onClick={() => openDelete(h)} title="Delete"><Trash2 size={15} /></button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gallery Highlights</h1>
          <p className="admin-page-desc">Manage the photos shown in the landing page highlights section.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Photo
          </button>
        </div>
      </div>

      {toast && (
        <div className={`admin-toast ${toast.type === 'error' ? 'admin-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="admin-loading"><Loader2 className="spin" size={24} /> Loading highlights...</div>
      ) : highlights.length === 0 ? (
        <div className="admin-empty-state">
          <ImageIcon size={48} />
          <h3>No highlights found</h3>
          <p>Upload some photos to display in your gallery.</p>
          <button className="admin-btn admin-btn-outline" onClick={openCreate}>
            Add Photo
          </button>
        </div>
      ) : (
        <div className="admin-card">
          <DataTable data={highlights} columns={columns} />
        </div>
      )}

      {/* Form Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal === 'create' ? 'Add Photo' : 'Edit Photo'}</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={saveHighlight}>
              <div className="admin-modal-body">
                <div className="admin-form-field">
                  <label>Title / Caption *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Action Shot" />
                </div>
                
                <div className="admin-form-field">
                  <label>Display Size (Grid Layout)</label>
                  <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                    <option value="">Normal (1x1 square)</option>
                    <option value="gallery-wide">Wide (2x wide)</option>
                    <option value="gallery-tall">Tall (2x tall)</option>
                  </select>
                </div>

                <div className="admin-form-field">
                  <label>Upload Photo *</label>
                  {!form.image_url ? (
                    <label className="admin-upload-dropzone">
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      <div className="admin-upload-content">
                        <ImageIcon size={32} />
                        <span>Click to browse photo</span>
                      </div>
                    </label>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', height: '200px', background: '#f8fafc', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={getImageUrl(form.image_url)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setForm({ ...form, image_url: '' })} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Change</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || !form.image_url}>
                  {saving ? <><Loader2 size={15} className="spin" /> Saving...</> : 'Save Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 style={{ color: '#ef4444' }}>Delete Photo</h2>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <p>Are you sure you want to delete the photo <strong>"{selected.title}"</strong>?</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>This action cannot be undone.</p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={deleteHighlight} disabled={saving}>
                {saving ? 'Deleting...' : 'Yes, Delete Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
