import React, { useState, useEffect } from 'react';
import type { GalleryItem } from '../types';
import { getImageUrl } from '../api';
import { Maximize2, X } from 'lucide-react';

interface GalleryProps {
  items: GalleryItem[];
}

export const Gallery: React.FC<GalleryProps> = ({ items }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section id="gallery" className="py-5 border-bottom" style={{ background: '#f8fafc' }}>
      <div className="container py-4">
        <div className="mb-4">
          <div className="section-label">Tournament Highlights</div>
          <h2 className="sport-heading">Tournament Photo Gallery</h2>
          <p className="text-muted fs-6">Moments from past seasons and live tournament action</p>
        </div>

        <div className="gallery-grid">
          {items.map((item, idx) => {
            const photo = getImageUrl(item.photo_url) || `/images/hero-${(idx % 6) + 1}.jpg`;
            const isWide = idx === 0 || idx === 3 || idx === 6;

            return (
              <div
                key={item.id}
                className={`gallery-item ${isWide ? 'gallery-wide' : ''}`}
                onClick={() => setSelectedPhoto({ ...item, photo_url: photo })}
              >
                <img
                  src={photo}
                  alt={item.caption || 'KPL Tournament Highlight'}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `/images/hero-${(idx % 6) + 1}.jpg`;
                  }}
                />
                <div className="gallery-title d-flex justify-content-between align-items-center">
                  <span>{item.caption || 'KPL Season Action'}</span>
                  <Maximize2 size={16} className="text-warning opacity-75" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="image-modal-overlay animate__animated animate__fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="image-modal-close"
            onClick={() => setSelectedPhoto(null)}
            title="Close Lightbox (ESC)"
          >
            <X size={20} />
          </button>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || 'KPL Full Photo'}
            />
            <div className="image-modal-title">
              {selectedPhoto.caption || 'Khoraghat Premier League Action'}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

