import React, { useState } from 'react';
import type { GalleryItem } from '../types';

interface GalleryProps {
  items: GalleryItem[];
}

export const Gallery: React.FC<GalleryProps> = ({ items }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  return (
    <section id="gallery" className="py-5">
      <div className="container">
        <div className="text-center mb-5">
          <span className="section-subtitle">Tournament Highlights</span>
          <h2 className="section-title">Tournament Photo Gallery</h2>
          <p className="text-muted">Moments from past seasons and live tournament action</p>
        </div>

        <div className="row g-3">
          {items.map((item) => (
            <div key={item.id} className="col-6 col-md-4 col-lg-3">
              <div
                className="kpl-card overflow-hidden h-100 position-relative cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedPhoto(item)}
              >
                <img
                  src={item.photo_url}
                  alt={item.caption}
                  className="w-100"
                  style={{ height: '180px', objectFit: 'cover' }}
                />
                <div className="p-2 text-center bg-dark bg-opacity-75">
                  <span className="text-white small fw-semibold text-truncate d-block">{item.caption}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="kpl-modal-content p-3 text-center position-relative">
              <button
                type="button"
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3 z-3"
                onClick={() => setSelectedPhoto(null)}
              ></button>
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.caption}
                className="img-fluid rounded-3 mb-3"
                style={{ maxHeight: '75vh', objectFit: 'contain' }}
              />
              <h5 className="text-white fw-bold mb-0">{selectedPhoto.caption}</h5>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
