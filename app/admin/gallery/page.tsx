'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Camera, Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { kplApi, GalleryPhoto } from '@/lib/api';

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const data = await kplApi.getGallery(500);
      if (Array.isArray(data)) {
        setPhotos(data);
      }
    } catch (err) {
      console.error('Failed to load gallery photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);

    const base64Promises = fileArray.map(file => {
      return new Promise<{ photo_base64: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ photo_base64: e.target?.result as string });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const payload = await Promise.all(base64Promises);
      await kplApi.uploadGalleryPhotos(payload);
      fetchGallery();
    } catch (err: any) {
      alert(err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      await kplApi.deleteGalleryPhoto(id);
      fetchGallery();
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1>Photo Gallery Manager</h1>
            <p>Upload single or multiple tournament photos without captions. Drag & drop photos anywhere below.</p>
          </div>
        </div>

        {/* Multi-file Upload Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragActive ? '#10b981' : '#334155'}`,
            borderRadius: 16,
            padding: '40px 24px',
            textAlign: 'center',
            background: dragActive ? 'rgba(16, 185, 129, 0.05)' : '#0f172a',
            marginBottom: 32,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => document.getElementById('multi-photo-input')?.click()}
        >
          <input
            id="multi-photo-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {uploading ? <Loader2 size={28} className="spin" /> : <Upload size={28} />}
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#f8fafc' }}>
            {uploading ? 'Uploading Photos...' : 'Click or Drag & Drop Photos Here'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: 14, maxWidth: 450, margin: '0 auto' }}>
            Select single or multiple photos to upload directly to the KPL public gallery grid.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="admin-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={20} color="#10b981" /> Uploaded Gallery Photos ({photos.length})
            </h2>
          </div>

          {loading ? (
            <div className="admin-loading-rows" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="admin-skeleton" style={{ aspectRatio: '1/1', borderRadius: 12 }} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              <ImageIcon size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No photos uploaded yet. Drag & drop images above to start!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#1e293b',
                    border: '1px solid #334155'
                  }}
                  className="group"
                >
                  <img
                    src={photo.photo_url}
                    alt="Gallery item"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Delete overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',

                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
