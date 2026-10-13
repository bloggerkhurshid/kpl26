import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const auctionEligibleParam = searchParams.get('auction_eligible');
    const teamIdParam = searchParams.get('team_id');
    const notTeamIdParam = searchParams.get('team_id[not]');

    const res = await kplApi.getPlayers({ status: 'active', limit: 2000 });
    let players = Array.isArray(res) ? res : (res?.data || []);

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

    return NextResponse.json(players);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
