'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable, { Column } from '@/components/admin/DataTable';
import {
  UserCheck, Plus, Edit2, Trash2, X, Phone, Loader2, Search,
  Award, Shield, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import { kplApi, ManagementMember, getImageUrl } from '@/lib/api';

export default function AdminManagementPage() {
  const [members, setMembers] = useState<ManagementMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ManagementMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '',
    designation: '',
    contact: '',
    photo_url: '',
    photo_base64: '',
    display_order: 0,
    status: 'active',
  });

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await kplApi.getManagement('all');
      if (Array.isArray(data)) {
        setMembers(data);
      }
    } catch (err: any) {
      console.error('Failed to load management members:', err);
      showToast(err.message || 'Failed to load management members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setForm({
      name: '',
      designation: '',
      contact: '',
      photo_url: '',
      photo_base64: '',
      display_order: members.length + 1,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (member: ManagementMember) => {
    setEditingMember(member);
    setForm({
      name: member.name || '',
      designation: member.designation || '',
      contact: member.contact || '',
      photo_url: member.photo_url || '',
      photo_base64: '',
      display_order: member.display_order || 0,
      status: member.status || 'active',
    });
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        photo_base64: event.target?.result as string,
        photo_url: '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.designation) {
      showToast('Name and designation are required', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingMember) {
        await kplApi.updateManagement(editingMember.id, form);
        showToast('Management personnel updated successfully!');
      } else {
        await kplApi.createManagement(form);
        showToast('Management personnel added successfully!');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await kplApi.deleteManagement(id);
      showToast('Personnel deleted successfully.');
      fetchMembers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete member', 'error');
    }
  };

  const toggleStatus = async (member: ManagementMember) => {
    const newStatus = member.status === 'active' ? 'disabled' : 'active';
    try {
      await kplApi.updateManagement(member.id, { status: newStatus });
      showToast(`Status updated to ${newStatus}.`);
      fetchMembers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const activeCount = members.filter(m => m.status === 'active').length;
  const disabledCount = members.filter(m => m.status === 'disabled').length;

  const columns: Column<ManagementMember>[] = [
    {
      key: 'name',
      label: 'Personnel / Leader',
      sortable: true,
      render: (m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--adm-surface-hover)',
              border: '1px solid var(--adm-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {m.photo_url ? (
              <img
                src={getImageUrl(m.photo_url)}
                alt={m.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <UserCheck size={16} color="var(--adm-emerald)" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--adm-text-primary)' }}>{m.name}</div>
            <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Display Order: #{m.display_order || 0}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'designation',
      label: 'Designation / Title',
      sortable: true,
      render: (m) => (
        <span
          className="admin-status-badge"
          style={{
            background: 'rgba(212, 175, 55, 0.1)',
            color: '#eab308',
            borderColor: 'rgba(212, 175, 55, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
          }}
        >
          <Award size={12} /> {m.designation}
        </span>
      ),
    },
    {
      key: 'contact',
      label: 'Contact Info',
      sortable: true,
      render: (m) => (
        m.contact ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--adm-text-secondary)', fontWeight: 500 }}>
            <Phone size={12} style={{ color: 'var(--adm-emerald)' }} /> {m.contact}
          </span>
        ) : (
          <span style={{ color: 'var(--adm-text-muted)' }}>—</span>
        )
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (m) => (
        <span className={`admin-status-badge admin-status-${m.status || 'active'}`}>
          {m.status || 'active'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (m) => (
        <div className="dt-actions" style={{ justifyContent: 'flex-end' }}>
          <button
            onClick={() => toggleStatus(m)}
            className="dt-btn"
            title={m.status === 'active' ? 'Disable Personnel' : 'Enable Personnel'}
          >
            {m.status === 'active' ? <ToggleRight size={15} color="var(--adm-emerald)" /> : <ToggleLeft size={15} />}
          </button>
          <button
            onClick={() => openEditModal(m)}
            className="dt-btn"
            title="Edit Member Details"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => handleDelete(m.id, m.name)}
            className="dt-btn dt-btn-danger"
            title="Delete Member"
          >
            <Trash2 size={13} />
          </button>
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

        {/* Standard Page Header */}
        <div className="admin-page-header">
          <div>
            <h1><Shield size={22} /> Management Committee</h1>
            <p>Manage tournament board members, designations, contact directory, and website hierarchy.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Member
          </button>
        </div>

        {/* Top Metric Cards - matching other sections */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Shield size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Total Committee</div>
              <div className="admin-stat-value">{members.length}</div>
              <div className="admin-stat-sub">Official organizers & board</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <UserCheck size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Active Members</div>
              <div className="admin-stat-value">{activeCount}</div>
              <div className="admin-stat-sub">Published to live site</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Award size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Key Roles</div>
              <div className="admin-stat-value">{new Set(members.map(m => m.designation).filter(Boolean)).size}</div>
              <div className="admin-stat-sub">Distinct committee roles</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              <Phone size={18} />
            </div>
            <div className="admin-stat-body" style={{ minWidth: 0, flex: 1 }}>
              <div className="admin-stat-label">Contact Listed</div>
              <div className="admin-stat-value">{members.filter(m => !!m.contact).length}</div>
              <div className="admin-stat-sub">{disabledCount} disabled members</div>
            </div>
          </div>
        </div>

        {/* Members Data Table with Built-In Search & Sorting */}
        <DataTable
          columns={columns}
          data={members}
          loading={loading}
          searchKeys={['name', 'designation', 'contact']}
          searchPlaceholder="Search by name, designation, or phone..."
          emptyMessage="No management personnel found. Click 'Add Member' to create one!"
        />

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="admin-modal-header">
                <h2>{editingMember ? 'Edit Management Personnel' : 'Add Management Personnel'}</h2>
                <button onClick={() => setModalOpen(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="admin-modal-form">
                <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="admin-form-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Surat Jamal Sheikh"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label>Designation / Role *</label>
                    <input
                      type="text"
                      required
                      value={form.designation}
                      onChange={e => setForm({ ...form, designation: e.target.value })}
                      placeholder="e.g. President / Organizing Secretary"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label>Contact Phone Number</label>
                    <input
                      type="text"
                      value={form.contact}
                      onChange={e => setForm({ ...form, contact: e.target.value })}
                      placeholder="e.g. 7002012581"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label>Personnel Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ marginBottom: 8 }}
                    />
                    <span style={{ fontSize: 12, color: '#64748b' }}>Or Image URL:</span>
                    <input
                      type="text"
                      value={form.photo_url}
                      onChange={e => setForm({ ...form, photo_url: e.target.value, photo_base64: '' })}
                      placeholder="https://..."
                      style={{ marginTop: 4 }}
                    />

                    {(form.photo_base64 || form.photo_url) && (
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid #d4af37' }}>
                          <img
                            src={getImageUrl(form.photo_base64 || form.photo_url)}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="admin-btn admin-btn-ghost"
                          onClick={() => setForm({ ...form, photo_url: '', photo_base64: '' })}
                          style={{ fontSize: 12 }}
                        >
                          Remove Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                    {submitting ? <><Loader2 size={15} className="spin" /> Saving...</> : editingMember ? 'Save Changes' : 'Add Personnel'}
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
