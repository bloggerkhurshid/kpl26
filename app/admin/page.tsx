'use client';

import { useState, useEffect } from 'react';
import { Trophy, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { adminLogin, isLoggedIn } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn()) {
      window.location.href = '/admin/dashboard';
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await adminLogin(password);
    setLoading(false);
    if (ok) {
      window.location.href = '/admin/dashboard';
    } else {
      setError('Incorrect password. Please try again.');
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg" />
      <div className="admin-login-grid" />

      <div className="admin-login-card">
        <div className="admin-login-logo">
          <Trophy size={32} />
        </div>
        <h1 className="admin-login-title">KPL Admin Panel</h1>
        <p className="admin-login-sub">Khoraghat Premier League · Season 3</p>

        <form className="admin-login-form" onSubmit={handleLogin}>
          <div className="admin-login-field">
            <label>
              <Lock size={14} /> Admin Password
            </label>
            <div className="admin-login-input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button className="admin-login-btn" type="submit" disabled={loading}>
            {loading ? (
              <><Loader2 size={16} className="spin" /> Verifying...</>
            ) : (
              'Enter Admin Panel'
            )}
          </button>
        </form>

        <p className="admin-login-hint">
          Set <code>ADMIN_PASSWORD</code> in your <code>.env</code> file.
        </p>
      </div>
    </div>
  );
}
