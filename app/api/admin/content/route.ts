import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content } = body as { content: Record<string, string> };

    // Format for upsert
    const updates = Object.keys(content).map(key => ({
      key,
      value: content[key]
    }));

    if (updates.length > 0) {
      const { error } = await supabaseAdmin
        .from('content_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Content update error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
