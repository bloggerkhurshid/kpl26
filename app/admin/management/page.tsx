'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
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

  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.designation.toLowerCase().includes(search.toLowerCase())
  );

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
            <h1><Shield size={22} /> Management Committee</h1>
            <p>Manage executive board members, designations, photos, and contact information.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Add Member
          </button>
        </div>

        {/* Search */}
        <div className="admin-filter-bar" style={{ marginBottom: 24 }}>
          <div className="admin-search-wrap" style={{ flex: 1, maxWidth: 400 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Members Cards / Table */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="admin-loading-rows" style={{ padding: 24 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="admin-skeleton-row" style={{ height: 48, marginBottom: 12 }} />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="admin-empty" style={{ padding: 48, textAlign: 'center' }}>
              <UserCheck size={40} style={{ margin: '0 auto 12px', color: '#64748b' }} />
              <h3>No Committee Members Found</h3>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Add your league presidents, secretaries, and organizers.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Personnel</th>
                    <th>Designation</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {member.photo_url ? (
                              <img src={getImageUrl(member.photo_url)} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <UserCheck size={20} color="#10b981" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#f8fafc' }}>{member.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>Order: #{member.display_order || 0}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-status-badge" style={{ background: 'rgba(212, 175, 55, 0.12)', color: '#d4af37', borderColor: 'rgba(212, 175, 55, 0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Award size={12} /> {member.designation}
                        </span>
                      </td>
                      <td>
                        {member.contact ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>
                            <Phone size={13} style={{ color: '#10b981' }} /> {member.contact}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-status-badge admin-status-${member.status || 'active'}`}>
                          {member.status || 'active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => toggleStatus(member)}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: '6px 10px' }}
                            title={member.status === 'active' ? 'Disable' : 'Enable'}
                          >
                            {member.status === 'active' ? <ToggleRight size={16} color="#10b981" /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 10px' }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '6px 10px' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
