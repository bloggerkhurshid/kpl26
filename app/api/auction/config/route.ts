import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

// In-memory fallback if content_settings does not have keys yet
let memoryConfig = {
  is_active: true,
  current_player_id: null as string | null,
  notes: 'KPL Season 3 Live Auction',
};

export async function GET() {
  try {
    const content = await kplApi.getContentSettings().catch(() => null);
    const data = content?.data || content || {};

    let is_active = memoryConfig.is_active;
    if (data.auction_is_active !== undefined) {
      is_active = data.auction_is_active === 'true' || data.auction_is_active === true || data.auction_is_active === '1' || data.auction_is_active === 1;
    }

    const current_player_id = data.auction_current_player_id !== undefined ? (data.auction_current_player_id || null) : memoryConfig.current_player_id;
    const notes = data.auction_notes !== undefined ? (data.auction_notes || '') : memoryConfig.notes;

    return NextResponse.json({
      is_active,
      current_player_id,
      notes,
    });
  } catch (err: any) {
    return NextResponse.json(memoryConfig);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.is_active !== undefined) memoryConfig.is_active = Boolean(body.is_active);
    if (body.current_player_id !== undefined) memoryConfig.current_player_id = body.current_player_id;
    if (body.notes !== undefined) memoryConfig.notes = String(body.notes);

    // Also persist to content settings if available
    try {
      await kplApi.saveContentSettings({
        auction_is_active: String(memoryConfig.is_active),
        auction_current_player_id: memoryConfig.current_player_id || '',
        auction_notes: memoryConfig.notes,
      });
    } catch {}

    // Synchronize with in-memory live auction store
    try {
      await kplApi.updateAuctionConfig({
        is_active: memoryConfig.is_active,
        current_player_id: memoryConfig.current_player_id,
        notes: memoryConfig.notes,
        sold_timestamp: null,
      });
    } catch {}

    return NextResponse.json({ success: true, ...memoryConfig });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}

