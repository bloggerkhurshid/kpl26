import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

export async function GET() {
  try {
    const [teamsRes, playersRes] = await Promise.all([
      kplApi.getTeams('active').catch(() => []),
      kplApi.getPlayers({ status: 'active', limit: 2000 }).catch(() => []),
    ]);

    const rawTeams = Array.isArray(teamsRes) ? teamsRes : (teamsRes?.data || []);
    const rawPlayers = Array.isArray(playersRes) ? playersRes : (playersRes?.data || []);

    const teams = rawTeams.map((team: any) => {
      const teamPlayers = rawPlayers.filter((p: any) => String(p.team_id) === String(team.id));
      const calculatedSpent = teamPlayers.reduce((sum: number, p: any) => sum + (Number(p.sold_price) || 0), 0);
      return {
        ...team,
        spent: calculatedSpent > 0 ? calculatedSpent : (Number(team.spent) || 0),
        squad_count: teamPlayers.length || Number(team.squad_count) || 0,
      };
    });

    return NextResponse.json(teams);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
