import { NextRequest, NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content } = body as { content: Record<string, string> };

    await kplApi.saveContentSettings(content || {});
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Content update error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

