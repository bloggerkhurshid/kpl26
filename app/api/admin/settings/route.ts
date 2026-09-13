import { NextRequest, NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

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
    const res = await kplApi.getFeeSettings();
    const settings: Record<string, string> = res?.data || res || {};

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
  } catch (err: any) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST — save gateway settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body as { settings: Record<string, string> };

    // Only save known gateway keys; skip masked values (•••)
    const payloadToSave: Record<string, string> = {};
    GATEWAY_KEYS.forEach(k => {
      if (settings[k] !== undefined && !settings[k].includes('•')) {
        payloadToSave[k] = settings[k];
      }
    });

    if (Object.keys(payloadToSave).length === 0) {
      return NextResponse.json({ success: true, saved: 0 });
    }

    await kplApi.saveFeeSettings(payloadToSave);

    return NextResponse.json({ success: true, saved: Object.keys(payloadToSave).length });
  } catch (err: any) {
    console.error('Settings POST error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

