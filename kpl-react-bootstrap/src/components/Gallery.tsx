import React, { useState } from 'react';
import type { GalleryItem } from '../types';

interface GalleryProps {
  items: GalleryItem[];
}

export const Gallery: React.FC<GalleryProps> = ({ items }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  return (
    <section id="gallery" className="py-5 border-bottom" style={{ background: '#f8fafc' }}>
      <div className="container py-4">
        <div className="mb-4">
          <div className="section-label">Tournament Highlights</div>
          <h2 className="sport-heading">Tournament Photo Gallery</h2>
          <p className="text-muted fs-6">Moments from past seasons and live tournament action</p>
        </div>

        <div className="gallery-grid">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`gallery-item ${idx === 0 || idx === 3 ? 'gallery-wide' : ''}`}
              onClick={() => setSelectedPhoto(item)}
            >
              <img src={item.photo_url} alt={item.caption} />
              <div className="gallery-title">{item.caption}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedPhoto(null)}
        >
          <button className="image-modal-close" onClick={() => setSelectedPhoto(null)}>
            ✕
          </button>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.photo_url} alt={selectedPhoto.caption} />
            <div className="image-modal-title">{selectedPhoto.caption}</div>
          </div>
        </div>
      )}
    </section>
  );
};
