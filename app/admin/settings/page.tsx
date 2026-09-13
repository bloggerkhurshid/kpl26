'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Settings, Save, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, RefreshCw, Key, Zap, ShieldCheck,
  ExternalLink, Info,
} from 'lucide-react';

interface GatewaySettings {
  gateway_razorpay_key_id: string;
  gateway_razorpay_key_secret: string;
  gateway_cashfree_app_id: string;
  gateway_cashfree_secret_key: string;
  gateway_mode: string;
  fee_player: string;
  fee_foreign_player: string;
  fee_team: string;
  active_gateway: string;
}

const DEFAULT: GatewaySettings = {
  gateway_razorpay_key_id: '',
  gateway_razorpay_key_secret: '',
  gateway_cashfree_app_id: '',
  gateway_cashfree_secret_key: '',
  gateway_mode: 'sandbox',
  fee_player: '500',
  fee_foreign_player: '1000',
  fee_team: '5000',
  active_gateway: 'razorpay',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<GatewaySettings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // Track which secret fields are revealed
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  // Track which fields the user has edited (to detect new values vs masked)
  const [edited, setEdited] = useState<Record<string, boolean>>({});

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings({ ...DEFAULT, ...data.settings });
      }
    } catch {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  function update(key: keyof GatewaySettings, value: string) {
    setSettings(s => ({ ...s, [key]: value }));
    setEdited(e => ({ ...e, [key]: true }));
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      showToast(`Settings saved! (${data.saved} field${data.saved !== 1 ? 's' : ''} updated)`);
      setEdited({});
      loadSettings(); // Reload to show fresh masked values
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const hasChanges = Object.keys(edited).length > 0;

  function SecretInput({
    fieldKey,
    placeholder,
    value,
  }: {
    fieldKey: keyof GatewaySettings;
    placeholder: string;
    value: string;
  }) {
    const isRevealed = revealed[fieldKey];
    const isEdited = edited[fieldKey];
    return (
      <div className="settings-secret-wrap">
        <input
          type={isRevealed ? 'text' : 'password'}
          value={value}
          onChange={e => update(fieldKey, e.target.value)}
          placeholder={placeholder}
          className={isEdited ? 'settings-input-edited' : ''}
          autoComplete="off"
        />
        <button
          type="button"
          className="settings-reveal-btn"
          onClick={() => setRevealed(r => ({ ...r, [fieldKey]: !r[fieldKey] }))}
          title={isRevealed ? 'Hide' : 'Reveal'}
        >
          {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    );
  }

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
            <h1><Settings size={22} /> Settings</h1>
            <p>Configure payment gateway credentials. These are stored securely in your database.</p>
          </div>
          <button className="admin-btn admin-btn-ghost" onClick={loadSettings} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Info banner */}
        <div className="settings-info-banner">
          <Info size={16} />
          <div>
            <strong>Keys are stored in Supabase.</strong> Secret values are masked in this view. To update a key, simply type the new value — unchanged masked fields will be skipped during save.
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-rows">
            {[...Array(5)].map((_, i) => <div className="admin-skeleton-row" key={i} />)}
          </div>
        ) : (
          <form onSubmit={saveSettings}>
            {/* Gateway Mode */}
            <div className="settings-section">
              <div className="settings-section-header">
                <Zap size={16} />
                <h3>Gateway Mode</h3>
              </div>
              <div className="settings-mode-toggle">
                {(['sandbox', 'production'] as const).map(mode => (
                  <label key={mode} className={`settings-mode-option ${settings.gateway_mode === mode ? 'settings-mode-active' : ''}`}>
                    <input
                      type="radio"
                      name="gateway_mode"
                      value={mode}
                      checked={settings.gateway_mode === mode}
                      onChange={() => update('gateway_mode', mode)}
                    />
                    <span className="settings-mode-dot" />
                    <div>
                      <strong>{mode === 'sandbox' ? '🧪 Sandbox' : '🚀 Production'}</strong>
                      <span>{mode === 'sandbox' ? 'Use test credentials — no real payments' : 'Live mode — real payments processed'}</span>
                    </div>
                  </label>
                ))}
              </div>
              {settings.gateway_mode === 'production' && (
                <div className="settings-warn">
                  ⚠️ Production mode is active. Real money will be processed. Make sure to use live credentials.
                </div>
              )}
            </div>

            {/* Active Gateway */}
            <div className="settings-section">
              <div className="settings-section-header">
                <Settings size={16} />
                <h3>Active Payment Gateway</h3>
              </div>
              <div className="settings-mode-toggle">
                {(['razorpay', 'cashfree'] as const).map(gateway => (
                  <label key={gateway} className={`settings-mode-option ${settings.active_gateway === gateway ? 'settings-mode-active' : ''}`}>
                    <input
                      type="radio"
                      name="active_gateway"
                      value={gateway}
                      checked={settings.active_gateway === gateway}
                      onChange={() => update('active_gateway', gateway)}
                    />
                    <span className="settings-mode-dot" />
                    <div>
                      <strong>{gateway === 'razorpay' ? 'Razorpay' : 'Cashfree'}</strong>
                      <span>{gateway === 'razorpay' ? 'Use Razorpay for all registrations' : 'Use Cashfree for all registrations'}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="settings-hint">
                This enforces the selected gateway for all users. The frontend selection options will be hidden.
              </div>
            </div>

            {/* Razorpay */}
            <div className="settings-section">
              <div className="settings-section-header">
                <Key size={16} />
                <h3>Razorpay</h3>
                <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="settings-ext-link">
                  Get keys <ExternalLink size={11} />
                </a>
              </div>
              <div className="settings-grid">
                <div className="admin-form-field">
                  <label>Key ID</label>
                  <input
                    type="text"
                    value={settings.gateway_razorpay_key_id}
                    onChange={e => update('gateway_razorpay_key_id', e.target.value)}
                    placeholder={settings.gateway_mode === 'production' ? 'rzp_live_...' : 'rzp_test_...'}
                    className={edited['gateway_razorpay_key_id'] ? 'settings-input-edited' : ''}
                    autoComplete="off"
                  />
                </div>
                <div className="admin-form-field">
                  <label>Key Secret <span className="settings-secret-tag">secret</span></label>
                  <SecretInput
                    fieldKey="gateway_razorpay_key_secret"
                    placeholder="••••••••••••••••"
                    value={settings.gateway_razorpay_key_secret}
                  />
                </div>
              </div>
              <div className="settings-hint">
                {settings.gateway_mode === 'sandbox'
                  ? 'Use Test API keys from Razorpay Dashboard → Settings → API Keys'
                  : 'Use Live API keys. Ensure webhook is configured for payment verification.'}
              </div>
            </div>

            {/* Cashfree */}
            <div className="settings-section">
              <div className="settings-section-header">
                <Key size={16} />
                <h3>Cashfree</h3>
                <a href="https://merchant.cashfree.com/merchants/settings/api" target="_blank" rel="noopener noreferrer" className="settings-ext-link">
                  Get keys <ExternalLink size={11} />
                </a>
              </div>
              <div className="settings-grid">
                <div className="admin-form-field">
                  <label>App ID</label>
                  <input
                    type="text"
                    value={settings.gateway_cashfree_app_id}
                    onChange={e => update('gateway_cashfree_app_id', e.target.value)}
                    placeholder={settings.gateway_mode === 'production' ? 'App ID' : 'TEST_...'}
                    className={edited['gateway_cashfree_app_id'] ? 'settings-input-edited' : ''}
                    autoComplete="off"
                  />
                </div>
                <div className="admin-form-field">
                  <label>Secret Key <span className="settings-secret-tag">secret</span></label>
                  <SecretInput
                    fieldKey="gateway_cashfree_secret_key"
                    placeholder="••••••••••••••••"
                    value={settings.gateway_cashfree_secret_key}
                  />
                </div>
              </div>
              <div className="settings-hint">
                {settings.gateway_mode === 'sandbox'
                  ? 'Use Test API credentials from Cashfree Dashboard → Developers → API Keys'
                  : 'Use Production credentials. Test thoroughly in sandbox before going live.'}
              </div>
            </div>
            {/* Registration Fees */}
            <div className="settings-section">
              <div className="settings-section-header">
                <Settings size={16} />
                <h3>Registration Fees</h3>
              </div>
              <div className="settings-grid">
                <div className="admin-form-field">
                  <label>Local Player Fee (₹)</label>
                  <input
                    type="number"
                    value={settings.fee_player}
                    onChange={e => update('fee_player', e.target.value)}
                    placeholder="500"
                    className={edited['fee_player'] ? 'settings-input-edited' : ''}
                    min="0"
                  />
                </div>
                <div className="admin-form-field">
                  <label>Foreign Player Fee (₹)</label>
                  <input
                    type="number"
                    value={settings.fee_foreign_player}
                    onChange={e => update('fee_foreign_player', e.target.value)}
                    placeholder="1000"
                    className={edited['fee_foreign_player'] ? 'settings-input-edited' : ''}
                    min="0"
                  />
                </div>
                <div className="admin-form-field">
                  <label>Team Registration Fee (₹)</label>
                  <input
                    type="number"
                    value={settings.fee_team}
                    onChange={e => update('fee_team', e.target.value)}
                    placeholder="5000"
                    className={edited['fee_team'] ? 'settings-input-edited' : ''}
                    min="0"
                  />
                </div>
              </div>
              <div className="settings-hint">
                These fees are dynamically fetched by the frontend forms. Set to 0 for free registration.
              </div>
            </div>

            {/* Security note */}
            <div className="settings-security-note">
              <ShieldCheck size={15} />
              <span>Keys are stored in your Supabase database and used server-side only. Secret keys are never exposed to the browser or included in client-side code.</span>
            </div>

            {/* Save */}
            <div className="settings-save-row">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={saving || !hasChanges}
              >
                {saving
                  ? <><Loader2 size={15} className="spin" /> Saving...</>
                  : <><Save size={15} /> Save Settings</>
                }
              </button>
              {hasChanges && (
                <span className="settings-unsaved">
                  {Object.keys(edited).length} unsaved change{Object.keys(edited).length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
