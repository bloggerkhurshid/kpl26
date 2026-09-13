import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role if available, otherwise fall back to publishable/anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

const GATEWAY_KEYS = [
  'gateway_razorpay_key_id',
  'gateway_razorpay_key_secret',
  'gateway_cashfree_app_id',
  'gateway_cashfree_secret_key',
  'gateway_mode', // 'sandbox' | 'production'
  'fee_player',
  'fee_foreign_player',
  'fee_team',
  'active_gateway', // 'razorpay' | 'cashfree'
];

// GET — fetch current gateway settings (secrets are masked)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_settings')
      .select('key,value')
      .in('key', GATEWAY_KEYS);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const settings: Record<string, string> = {};
    (data || []).forEach(({ key, value }) => { settings[key] = value; });

    // Mask secret values in response
    const masked: Record<string, string> = {};
    GATEWAY_KEYS.forEach(k => {
      const val = settings[k] || '';
      if (k.includes('secret') || k.includes('key_secret')) {
        masked[k] = val ? `${'•'.repeat(Math.min(val.length - 4, 20))}${val.slice(-4)}` : '';
      } else {
        masked[k] = val;
      }
    });

    return NextResponse.json({ settings: masked });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — save gateway settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body as { settings: Record<string, string> };

    // Only save known gateway keys; skip masked values (•••)
    const upsertData = GATEWAY_KEYS
      .filter(k => settings[k] !== undefined && !settings[k].includes('•'))
      .map(k => ({
        key: k,
        value: settings[k],
        updated_at: new Date().toISOString(),
      }));

    if (upsertData.length === 0) {
      return NextResponse.json({ success: true, saved: 0 });
    }

    const { error } = await supabaseAdmin
      .from('content_settings')
      .upsert(upsertData, { onConflict: 'key' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, saved: upsertData.length });
  } catch (err) {
    console.error('Settings POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
