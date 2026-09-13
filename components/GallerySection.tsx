'use client';

import React, { useEffect, useState } from 'react';
import { Camera, X, Maximize2, Loader2 } from 'lucide-react';
import { kplApi, GalleryPhoto, getImageUrl } from '@/lib/api';

export function GallerySection() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const data = await kplApi.getGallery(100);
      if (Array.isArray(data)) {
        setPhotos(data);
      }
    } catch (err) {
      console.error('Failed to load gallery photos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="section-pad" id="gallery" style={{ background: '#f1f5f9' }}>
        <div className="page-width" style={{ textAlign: 'center' }}>
          <Loader2 className="spin" style={{ color: 'var(--gold-dark)', margin: '0 auto' }} size={32} />
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className="section-pad" style={{ background: '#f1f5f9' }}>
      <div className="page-width">
        {/* Symmetrical Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
          <span className="section-label" style={{ justifyContent: 'center' }}>Action & Passion</span>
          <h2 className="sport-heading">Photo <em>Gallery</em></h2>
          <p className="lead" style={{ margin: '16px auto 0' }}>
            Capturing high-voltage hard tennis cricket action, crowds, and tournament celebrations.
          </p>
        </div>

        {/* Gallery Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo.photo_url)}
              style={{
                position: 'relative',
                aspectRatio: '4 / 3',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: 'var(--navy-light)',
                transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              }}
              className="gallery-item-card"
            >
              <img
                src={getImageUrl(photo.photo_url)}
                alt="KPL Gallery Photo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(9, 19, 37, 0.85) 0%, transparent 60%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                className="gallery-item-overlay"
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <Maximize2 size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="image-modal-overlay"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="image-modal-close"
          >
            <X size={24} />
          </button>
          <div className="image-modal-content">
            <img
              src={getImageUrl(selectedPhoto)}
              alt="Enlarged KPL Photo"
            />
          </div>
        </div>
      )}
    </section>
  );
}
