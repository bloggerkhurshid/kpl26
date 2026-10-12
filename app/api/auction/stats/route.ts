import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

export async function GET() {
  try {
    const playersRes = await kplApi.getPlayers({ status: 'active', limit: 2000 }).catch(() => []);
    const players: any[] = Array.isArray(playersRes?.data) ? playersRes.data : Array.isArray(playersRes) ? playersRes : [];

    const pool = players.filter((p: any) => (p.auction_eligible === 1 || p.auction_eligible === true || p.auction_eligible === '1') && !p.team_id);
    const sold = players.filter((p: any) => Boolean(p.team_id));
    const disabled = players.filter((p: any) => (!p.auction_eligible || p.auction_eligible === 0 || p.auction_eligible === '0') && !p.team_id);
    const total_purse_spent = sold.reduce((acc: number, p: any) => acc + (Number(p.sold_price) || 0), 0);

    return NextResponse.json({
      pool_count: pool.length,
      sold_count: sold.length,
      disabled_count: disabled.length,
      total_purse_spent,
    });
  } catch (err: any) {
    console.error('Failed to calculate auction stats:', err);
    return NextResponse.json({
      pool_count: 0,
      sold_count: 0,
      disabled_count: 0,
      total_purse_spent: 0,
    });
  }
}
