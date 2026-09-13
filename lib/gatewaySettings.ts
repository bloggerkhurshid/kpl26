import { createClient } from '@supabase/supabase-js';

// Use service role if available, otherwise fall back to publishable/anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache for gateway settings (TTL: 60s) to avoid hammering DB on every request
let cachedSettings: Record<string, string> = {};
let cacheExpiry = 0;

export async function getGatewaySettings(): Promise<Record<string, string>> {
  if (Date.now() < cacheExpiry && Object.keys(cachedSettings).length > 0) {
    return cachedSettings;
  }

  const { data } = await supabaseAdmin
    .from('content_settings')
    .select('key,value');

  const settings: Record<string, string> = {};
  (data || []).forEach(({ key, value }) => { settings[key] = value; });

  cachedSettings = settings;
  cacheExpiry = Date.now() + 60_000; // 60s TTL
  return settings;
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
