'use client';

import React, { useEffect, useState } from 'react';
import { Camera, X, Maximize2 } from 'lucide-react';
import { kplApi, GalleryPhoto } from '@/lib/api';

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
      <section className="py-20 bg-black text-white relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-emerald-800/30 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-emerald-800/20 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className="py-24 bg-black text-white relative overflow-hidden border-t border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Camera className="w-3.5 h-3.5" />
            Photo Gallery
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500">Moments</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Capturing high-voltage hard tennis cricket action, crowds, and celebrations.
          </p>
        </div>

        {/* Gallery Masonry / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo.photo_url)}
              className="group relative aspect-square bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-800/80 hover:border-emerald-500/60 transition-all duration-300 hover:scale-[1.02] shadow-lg"
            >
              <img
                src={photo.photo_url}
                alt="KPL Gallery Photo"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="p-2.5 rounded-full bg-emerald-500 text-black shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <Maximize2 className="w-5 h-5" />
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
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 hover:bg-emerald-500 text-white hover:text-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Enlarged KPL Photo"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-800"
          />
        </div>
      )}
    </section>
  );
}
