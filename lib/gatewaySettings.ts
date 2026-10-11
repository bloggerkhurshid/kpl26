import { kplApi } from '@/lib/api';

// Cache for gateway settings (TTL: 60s) to avoid hammering DB on every request
let cachedSettings: Record<string, string> = {};
let cacheExpiry = 0;

export async function getGatewaySettings(): Promise<Record<string, string>> {
  if (Date.now() < cacheExpiry && Object.keys(cachedSettings).length > 0) {
    return cachedSettings;
  }

  try {
    const res = await kplApi.getContentSettings();
    const settingsData = res?.data || res || {};
    const settings: Record<string, string> = {};
    if (Array.isArray(settingsData)) {
      settingsData.forEach(({ key, value }: { key: string; value: string }) => { settings[key] = value; });
    } else if (typeof settingsData === 'object') {
      Object.assign(settings, settingsData);
    }

    cachedSettings = settings;
    cacheExpiry = Date.now() + 60_000; // 60s TTL
    return settings;
  } catch (err) {
    console.error('Failed to load gateway settings from PHP API:', err);
    return cachedSettings;
  }
}

/** Resolve a setting: DB value → env var fallback → empty string */
export async function resolveKey(dbKey: string, envFallback: string): Promise<string> {
  const settings = await getGatewaySettings();
  return (settings[dbKey] && settings[dbKey].trim()) ? settings[dbKey].trim() : (process.env[envFallback] || '');
}

/** Invalidate cache (call after saving new settings) */
export function invalidateSettingsCache() {
  cacheExpiry = 0;
  cachedSettings = {};
}

export function isProductionMode(settings: Record<string, string>): boolean {
  const mode = settings['gateway_mode'] || 'sandbox';
  return mode === 'production';
}

