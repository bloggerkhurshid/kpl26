import { NextRequest, NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    const playerRes = await kplApi.getPlayer(id).catch(async () => {
      // Fallback: search in players list
      const all = await kplApi.getPlayers({ limit: 2000 });
      return (all || []).find((p: any) => String(p.id) === String(id)) || null;
    });

    const player = playerRes?.data || playerRes;
    if (!player || !player.id) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Attach team object if team_id present and teams object not already expanded
    if (player.team_id && (!player.teams || !player.teams.name)) {
      try {
        const teams = await kplApi.getTeams('active');
        const teamMatch = (teams || []).find((t: any) => String(t.id) === String(player.team_id));
        if (teamMatch) {
          player.teams = {
            id: teamMatch.id,
            name: teamMatch.name,
            short_code: teamMatch.short_code,
            accent_color: teamMatch.accent_color,
          };
        }
      } catch {}
    }

    return NextResponse.json(player);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
