'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserCheck, Plus, Edit2, Trash2, X, Upload, Phone, Loader2, Search } from 'lucide-react';
import { kplApi, ManagementMember } from '@/lib/api';

export default function AdminManagementPage() {
  const [members, setMembers] = useState<ManagementMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ManagementMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    designation: '',
    contact: '',
    photo_url: '',
    photo_base64: '',
    display_order: 0,
    status: 'active',
  });

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
    } catch (err) {
      console.error('Failed to load management members:', err);
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
      alert('Name and designation are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingMember) {
        await kplApi.updateManagement(editingMember.id, form);
      } else {
        await kplApi.createManagement(form);
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this management personnel?')) return;
    try {
      await kplApi.deleteManagement(id);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete member');
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
        <div className="admin-page-header">
          <div>
            <h1>Management Committee</h1>
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

        {/* Table */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="admin-loading-rows" style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="admin-skeleton-row" style={{ height: 48, marginBottom: 12 }} />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="admin-empty" style={{ padding: 48, textAlign: 'center' }}>
              <UserCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No management members found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
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
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {member.photo_url ? (
                            <img src={member.photo_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <UserCheck size={20} color="#10b981" />
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{member.name}</td>
                      <td>
                        <span className="admin-status-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                          {member.designation}
                        </span>
                      </td>
                      <td>
                        {member.contact ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                            <Phone size={13} /> {member.contact}
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
                            onClick={() => openEditModal(member)}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '6px 10px' }}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
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

        {/* Modal */}
        {modalOpen && (
          <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="admin-modal-header">
                <h3>{editingMember ? 'Edit Management Personnel' : 'Add Management Personnel'}</h3>
                <button onClick={() => setModalOpen(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="admin-form" style={{ padding: 24 }}>
                <div className="admin-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Saddam Hussain"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    placeholder="e.g. President / Organizing Secretary"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={e => setForm({ ...form, contact: e.target.value })}
                    placeholder="+91 8638479115"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Photo Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ marginBottom: 8 }}
                  />
                  <span style={{ fontSize: 12, color: '#64748b' }}>Or paste image URL:</span>
                  <input
                    type="text"
                    value={form.photo_url}
                    onChange={e => setForm({ ...form, photo_url: e.target.value, photo_base64: '' })}
                    placeholder="https://..."
                    style={{ marginTop: 4 }}
                  />

                  {(form.photo_base64 || form.photo_url) && (
                    <div style={{ marginTop: 12, width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: '2px solid #10b981' }}>
                      <img
                        src={form.photo_base64 || form.photo_url}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>

                <div className="admin-modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="spin" /> : editingMember ? 'Update Member' : 'Add Member'}
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
