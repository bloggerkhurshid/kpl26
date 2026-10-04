'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Save, Loader2, LayoutTemplate, Type, Eye, EyeOff } from 'lucide-react';
import { kplApi } from '@/lib/api';


export default function ContentPage() {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    kplApi.getContentSettings()
      .then(data => {
        setContent(data?.data || data || {});
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load content settings:', err);
        setLoading(false);
      });
  }, []);

  const update = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
    setStatus('idle');
  };

  const toggle = (key: string) => {
    setContent(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
    setStatus('idle');
  };

  const saveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');

    try {
      await kplApi.saveContentSettings(content);
      setStatus('success');
      localStorage.removeItem('kpl_home_cache');
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="admin-loading">
        <Loader2 className="spin" size={24} />
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="admin-content-page">
      <div className="admin-page-header">
        <div>
          <h1>Homepage Sections</h1>
          <p>Toggle sections on or off and edit content displayed on the homepage.</p>
        </div>
      </div>

      <form onSubmit={saveContent} className="admin-cms-grid">
        
        {/* HERO SECTION */}
        <div className="settings-section">
          <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <LayoutTemplate size={16} />
              <h3>Hero Section</h3>
            </div>
            <button type="button" onClick={() => toggle('show_hero')} className={`toggle-btn ${content.show_hero === 'true' ? 'active' : ''}`}>
              {content.show_hero === 'true' ? <Eye size={16} /> : <EyeOff size={16} />}
              {content.show_hero === 'true' ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="form-row">
            <label>Hero Title</label>
            <input type="text" value={content.hero_title || ''} onChange={(e) => update('hero_title', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Hero Subtitle</label>
            <textarea rows={2} value={content.hero_subtitle || ''} onChange={(e) => update('hero_subtitle', e.target.value)} />
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="settings-section">
          <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <LayoutTemplate size={16} />
              <h3>Prize Pool / Stats Section</h3>
            </div>
            <button type="button" onClick={() => toggle('show_stats')} className={`toggle-btn ${content.show_stats === 'true' ? 'active' : ''}`}>
              {content.show_stats === 'true' ? <Eye size={16} /> : <EyeOff size={16} />}
              {content.show_stats === 'true' ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <p className="settings-hint">The stats strip displays prize pool or key numbers.</p>
        </div>

        {/* ABOUT SECTION */}
        <div className="settings-section">
          <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <LayoutTemplate size={16} />
              <h3>About Section</h3>
            </div>
            <button type="button" onClick={() => toggle('show_about')} className={`toggle-btn ${content.show_about === 'true' ? 'active' : ''}`}>
              {content.show_about === 'true' ? <Eye size={16} /> : <EyeOff size={16} />}
              {content.show_about === 'true' ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="form-row">
            <label>About Title</label>
            <input type="text" value={content.about_title || ''} onChange={(e) => update('about_title', e.target.value)} />
          </div>
          <div className="form-row">
            <label>About Text</label>
            <textarea rows={4} value={content.about_text || ''} onChange={(e) => update('about_text', e.target.value)} />
          </div>
        </div>

        {/* FORMAT SECTION */}
        <div className="settings-section">
          <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <LayoutTemplate size={16} />
              <h3>Format Section</h3>
            </div>
            <button type="button" onClick={() => toggle('show_format')} className={`toggle-btn ${content.show_format === 'true' ? 'active' : ''}`}>
              {content.show_format === 'true' ? <Eye size={16} /> : <EyeOff size={16} />}
              {content.show_format === 'true' ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="form-row">
            <label>Format Title</label>
            <input type="text" value={content.format_title || ''} onChange={(e) => update('format_title', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Format Subtitle</label>
            <textarea rows={2} value={content.format_subtitle || ''} onChange={(e) => update('format_subtitle', e.target.value)} />
          </div>
        </div>

        {/* REGISTRATION DEADLINE SECTION */}
        <div className="settings-section">
          <div className="settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Type size={16} />
              <h3>Registration Deadline</h3>
            </div>
            <button type="button" onClick={() => toggle('show_register')} className={`toggle-btn ${content.show_register === 'true' ? 'active' : ''}`}>
              {content.show_register === 'true' ? <Eye size={16} /> : <EyeOff size={16} />}
              {content.show_register === 'true' ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="form-row">
            <label>Deadline Date</label>
            <input
              type="date"
              value={content.deadline_date || ''}
              onChange={(e) => update('deadline_date', e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Deadline Description Text</label>
            <textarea
              rows={2}
              placeholder="e.g. Secure your franchise or player spot before 24 August 2026."
              value={content.deadline_text || ''}
              onChange={(e) => update('deadline_text', e.target.value)}
            />
          </div>
          <p className="settings-hint">The countdown on the homepage auto-calculates days left from the date above.</p>
        </div>

        {/* OTHER SECTIONS */}
        <div className="settings-section admin-form-full">
          <div className="settings-section-header">
            <LayoutTemplate size={16} />
            <h3>Toggle Other Sections</h3>
          </div>
          
          <div className="settings-mode-toggle" style={{ gridTemplateColumns: '1fr', gap: '10px' }}>
            <label className="settings-mode-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Champions Timeline</strong><span>Show the history of previous winners</span></div>
              <button type="button" onClick={() => toggle('show_champions')} className={`toggle-btn ${content.show_champions === 'true' ? 'active' : ''}`}>
                {content.show_champions === 'true' ? 'Visible' : 'Hidden'}
              </button>
            </label>
            
            <label className="settings-mode-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Teams Grid</strong><span>Show the franchise teams cards</span></div>
              <button type="button" onClick={() => toggle('show_teams')} className={`toggle-btn ${content.show_teams === 'true' ? 'active' : ''}`}>
                {content.show_teams === 'true' ? 'Visible' : 'Hidden'}
              </button>
            </label>

            <label className="settings-mode-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Registered Players</strong><span>Show the players gallery grid</span></div>
              <button type="button" onClick={() => toggle('show_players')} className={`toggle-btn ${content.show_players === 'true' ? 'active' : ''}`}>
                {content.show_players === 'true' ? 'Visible' : 'Hidden'}
              </button>
            </label>

            <label className="settings-mode-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Management Section</strong><span>Show the leadership and committee section</span></div>
              <button type="button" onClick={() => toggle('show_management')} className={`toggle-btn ${content.show_management === 'true' ? 'active' : ''}`}>
                {content.show_management === 'true' ? 'Visible' : 'Hidden'}
              </button>
            </label>

            <label className="settings-mode-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Photo Gallery</strong><span>Show the full photo gallery grid</span></div>
              <button type="button" onClick={() => toggle('show_gallery')} className={`toggle-btn ${content.show_gallery === 'true' ? 'active' : ''}`}>
                {content.show_gallery === 'true' ? 'Visible' : 'Hidden'}
              </button>
            </label>

            <label className="settings-mode-option" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Highlights Gallery</strong><span>Show the photo highlights gallery</span></div>
              <button type="button" onClick={() => toggle('show_highlights')} className={`toggle-btn ${content.show_highlights === 'true' ? 'active' : ''}`}>
                {content.show_highlights === 'true' ? 'Visible' : 'Hidden'}
              </button>
            </label>
          </div>
        </div>


        <div className="admin-actions">
          {status === 'success' && <span className="status-success">Content saved successfully!</span>}
          {status === 'error' && <span className="status-error">Failed to save content.</span>}
          <button type="submit" className="button button-gold" disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Save Content
          </button>
        </div>
      </form>
    </div>
    </AdminLayout>
  );
}
