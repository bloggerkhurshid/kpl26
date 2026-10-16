import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

// In-memory server-side cache for high performance
let serverPlayersCache: { data: any[]; timestamp: number } | null = null;
const SERVER_CACHE_TTL_MS = 30 * 1000; // 30 seconds

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const auctionEligibleParam = searchParams.get('auction_eligible');
    const teamIdParam = searchParams.get('team_id');
    const notTeamIdParam = searchParams.get('team_id[not]');
    const forceRefresh = searchParams.get('fresh') === 'true';

    const now = Date.now();
    let rawPlayers: any[] = [];

    if (!forceRefresh && serverPlayersCache && (now - serverPlayersCache.timestamp < SERVER_CACHE_TTL_MS)) {
      rawPlayers = serverPlayersCache.data;
    } else {
      const res = await kplApi.getPlayers({ status: 'active', limit: 2000 }, { forceRefresh });
      rawPlayers = Array.isArray(res) ? res : (res?.data || []);
      if (rawPlayers.length > 0) {
        serverPlayersCache = { data: rawPlayers, timestamp: now };
      }
    }

    let players = rawPlayers;

    if (auctionEligibleParam !== null) {
      const isEligible = auctionEligibleParam === '1' || auctionEligibleParam === 'true';
      players = players.filter((p: any) => {
        const pElig = p.auction_eligible === 1 || p.auction_eligible === '1' || p.auction_eligible === true;
        return isEligible ? pElig : !pElig;
      });
    }

    if (notTeamIdParam !== null) {
      players = players.filter((p: any) => Boolean(p.team_id));
    } else if (teamIdParam !== null) {
      if (teamIdParam === 'null' || teamIdParam === '') {
        players = players.filter((p: any) => !p.team_id);
      } else {
        players = players.filter((p: any) => String(p.team_id) === String(teamIdParam));
      }
    }

    return NextResponse.json(players, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
