import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

// Cached state in Node.js process memory
interface LiveState {
  is_active: boolean;
  current_player_id: string | null;
  notes: string;
  player: any | null;
  sold_timestamp: number | null;
  stats: {
    pool_count: number;
    sold_count: number;
    disabled_count: number;
    total_purse_spent: number;
  };
  teams: any[];
  version: number;
  lastUpdated: number;
}

let liveState: LiveState = {
  is_active: true,
  current_player_id: null,
  notes: 'KPL Season 3 Live Auction',
  player: null,
  sold_timestamp: null,
  stats: {
    pool_count: 0,
    sold_count: 0,
    disabled_count: 0,
    total_purse_spent: 0,
  },
  teams: [],
  version: 1,
  lastUpdated: Date.now(),
};

let lastFullSync = 0;
let isSyncing = false;
let hasBootstrapped = false;

// Background sync from remote PHP DB
async function syncFromDatabase(force: boolean = false) {
  const now = Date.now();
  // Don't refetch heavy database queries more often than every 10 seconds unless forced
  if (!force && (now - lastFullSync < 10000 || isSyncing)) {
    return;
  }

  isSyncing = true;
  try {
    const [contentRes, playersRes, teamsRes] = await Promise.all([
      kplApi.getContentSettings().catch(() => null),
      kplApi.getPlayers({ status: 'active', limit: 1000 }).catch(() => []),
      kplApi.getTeams('active').catch(() => []),
    ]);

    const data = contentRes?.data || contentRes || {};
    if (!hasBootstrapped) {
      if (data.auction_is_active !== undefined) {
        liveState.is_active = data.auction_is_active === 'true' || data.auction_is_active === true || data.auction_is_active === '1' || data.auction_is_active === 1;
      }
      if (data.auction_current_player_id !== undefined) {
        liveState.current_player_id = data.auction_current_player_id || null;
      }
      if (data.auction_notes !== undefined) {
        liveState.notes = data.auction_notes || '';
      }
      hasBootstrapped = true;
    }

    const rawPlayers: any[] = Array.isArray(playersRes?.data) ? playersRes.data : (Array.isArray(playersRes) ? playersRes : []);
    const rawTeams: any[] = Array.isArray(teamsRes?.data) ? teamsRes.data : (Array.isArray(teamsRes) ? teamsRes : []);

    const isRetainedOrOwner = (p: any) => {
      const roleLower = (p.role || '').toLowerCase();
      const catLower = (p.player_category || '').toLowerCase();
      if (roleLower.includes('retain') || catLower.includes('retain') || roleLower.includes('owner')) {
        return true;
      }
      if (p.team_id) {
        const playerTeam = rawTeams.find((t: any) => String(t.id) === String(p.team_id));
        const ownerName = ((playerTeam as any)?.owner_name || (playerTeam as any)?.owner || '').trim().toLowerCase();
        if (ownerName && (p.player_name || '').trim().toLowerCase() === ownerName) {
          return true;
        }
      }
      return false;
    };

    // Calculate pool, sold, disabled, purse (excluding Retained & Owner players from auction)
    const pool = rawPlayers.filter((p: any) => (p.auction_eligible === 1 || p.auction_eligible === true || p.auction_eligible === '1') && !p.team_id && !isRetainedOrOwner(p));
    const sold = rawPlayers.filter((p: any) => Boolean(p.team_id) && !isRetainedOrOwner(p));
    const disabled = rawPlayers.filter((p: any) => (!p.auction_eligible || p.auction_eligible === 0 || p.auction_eligible === '0') && !p.team_id && !isRetainedOrOwner(p));
    const total_purse_spent = sold.reduce((acc: number, p: any) => acc + (Number(p.sold_price) || 0), 0);

    liveState.stats = {
      pool_count: pool.length,
      sold_count: sold.length,
      disabled_count: disabled.length,
      total_purse_spent,
    };

    // Enrich teams with real spent and squad counts
    liveState.teams = rawTeams.map((team: any) => {
      const teamPlayers = rawPlayers.filter((p: any) => String(p.team_id) === String(team.id));
      const calcSpent = teamPlayers.reduce((sum: number, p: any) => sum + (Number(p.sold_price) || 0), 0);
      return {
        id: team.id,
        name: team.name,
        short_code: team.short_code,
        accent_color: team.accent_color,
        budget: Number(team.budget) || 100000,
        spent: calcSpent > 0 ? calcSpent : (Number(team.spent) || 0),
        squad_limit: Number(team.squad_limit) || 18,
        squad_count: teamPlayers.length || Number(team.squad_count) || 0,
      };
    });

    // Compute recent sold players (last 8) excluding retained/owner players
    const recentSoldList = sold.slice(0, 8).map((p: any) => {
      const teamMatch = liveState.teams.find((t: any) => String(t.id) === String(p.team_id));
      return {
        id: p.id,
        player_name: p.player_name,
        sold_price: p.sold_price,
        base_price: p.base_price,
        team_id: p.team_id,
        team_name: teamMatch?.name || p.teams?.name || 'Franchise',
        team_short_code: teamMatch?.short_code || p.teams?.short_code || 'KPL',
        team_accent_color: teamMatch?.accent_color || p.teams?.accent_color || '#e8192c',
      };
    });
    (liveState as any).recent_sold = recentSoldList;

    // Populate current player details if on block
    if (liveState.current_player_id) {
      const curr = rawPlayers.find((p: any) => String(p.id) === String(liveState.current_player_id));
      if (curr) {
        const assignedTeam = liveState.teams.find((t: any) => String(t.id) === String(curr.team_id));
        liveState.player = {
          ...curr,
          teams: assignedTeam || curr.teams || null,
        };
      } else {
        liveState.player = null;
      }
    } else {
      liveState.player = null;
    }

    liveState.version += 1;
    liveState.lastUpdated = Date.now();
    lastFullSync = Date.now();
  } catch (err) {
    console.warn('Background sync error in /api/auction/live:', err);
  } finally {
    isSyncing = false;
  }
}

// GET /api/auction/live - ultra-fast snapshot in <5ms from memory
export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientVersion = Number(url.searchParams.get('v') || 0);

  // Trigger non-blocking async background refresh if stale
  if (Date.now() - lastFullSync > 8000) {
    syncFromDatabase();
  }

  // If client already has the current version, return 304 or light payload
  if (clientVersion && clientVersion === liveState.version) {
    return NextResponse.json({
      changed: false,
      version: liveState.version,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }

  return NextResponse.json({
    changed: true,
    version: liveState.version,
    is_active: liveState.is_active,
    current_player_id: liveState.current_player_id,
    notes: liveState.notes,
    stats: liveState.stats,
    player: liveState.player,
    teams: liveState.teams,
    recent_sold: (liveState as any).recent_sold || [],
    sold_timestamp: liveState.sold_timestamp,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

// POST /api/auction/live - instant state mutation (called by Admin Panel)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.is_active !== undefined) liveState.is_active = Boolean(body.is_active);
    if (body.notes !== undefined) liveState.notes = String(body.notes);
    if (body.sold_timestamp !== undefined) liveState.sold_timestamp = body.sold_timestamp;

    if (body.current_player_id !== undefined) {
      if (body.current_player_id !== liveState.current_player_id && body.sold_timestamp === undefined) {
        liveState.sold_timestamp = null;
      }
      liveState.current_player_id = body.current_player_id;
    }

    // If player object passed directly or current_player_id set, update player instantly in memory
    if (body.current_player_id === null) {
      liveState.player = null;
      liveState.sold_timestamp = null;
    } else if (body.player) {
      liveState.player = body.player;
    }

    liveState.version += 1;
    liveState.lastUpdated = Date.now();

    // Asynchronously persist to database in background without blocking response
    (async () => {
      try {
        await kplApi.saveContentSettings({
          auction_is_active: String(liveState.is_active),
          auction_current_player_id: liveState.current_player_id || '',
          auction_notes: liveState.notes,
        });
      } catch (e) {
        console.warn('Failed to persist auction state to database:', e);
      }
    })();

    return NextResponse.json({
      success: true,
      version: liveState.version,
      is_active: liveState.is_active,
      current_player_id: liveState.current_player_id,
      notes: liveState.notes,
      player: liveState.player,
      sold_timestamp: liveState.sold_timestamp,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
