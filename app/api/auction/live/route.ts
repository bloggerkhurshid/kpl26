import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

// Cached state in Node.js process memory
interface SoldPlayerItem {
  id: string;
  player_name: string;
  photo?: string | null;
  role: string;
  player_category?: string;
  registration_number?: string | null;
  sold_price: number;
  base_price?: number;
  team_id: string;
  team_name: string;
  team_short_code: string;
  team_accent_color: string;
  sold_at?: number | string | null;
}

interface TeamState {
  id: string;
  name: string;
  short_code: string;
  accent_color: string;
  budget: number;
  spent: number;
  remaining_budget: number;
  squad_limit: number;
  squad_count: number;
}

interface LiveState {
  is_active: boolean;
  is_ended: boolean;
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
  teams: TeamState[];
  recent_sold: SoldPlayerItem[];
  last_sold_event: SoldPlayerItem | null;
  version: number;
  lastUpdated: number;
}

// In-memory persistent sold history tracking
const inMemorySoldOrder: Map<string, SoldPlayerItem> = new Map();

let liveState: LiveState = {
  is_active: false,
  is_ended: false,
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
  recent_sold: [],
  last_sold_event: null,
  version: 1,
  lastUpdated: Date.now(),
};

let lastFullSync = 0;
let isSyncing = false;
let hasBootstrapped = false;

// Background sync from remote PHP DB
async function syncFromDatabase(force: boolean = false) {
  const now = Date.now();
  // Don't refetch heavy database queries more often than every 6 seconds unless forced
  if (!force && (now - lastFullSync < 6000 || isSyncing)) {
    return;
  }

  isSyncing = true;
  try {
    const [contentRes, playersRes, teamsRes] = await Promise.all([
      kplApi.getContentSettings().catch(() => null),
      kplApi.getPlayers({ status: 'active', limit: 2000 }).catch(() => []),
      kplApi.getTeams('active').catch(() => []),
    ]);

    const data = contentRes?.data || contentRes || {};
    if (!hasBootstrapped) {
      if (data.auction_is_active !== undefined) {
        liveState.is_active = data.auction_is_active === 'true' || data.auction_is_active === true || data.auction_is_active === '1' || data.auction_is_active === 1;
      }
      if (data.auction_is_ended !== undefined) {
        liveState.is_ended = data.auction_is_ended === 'true' || data.auction_is_ended === true || data.auction_is_ended === '1' || data.auction_is_ended === 1;
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

    // Calculate pool, sold, disabled, purse (excluding Retained & Owner players from auction stats)
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

    // Enrich teams with real spent, remaining coins and squad counts
    liveState.teams = rawTeams.map((team: any) => {
      const teamPlayers = rawPlayers.filter((p: any) => String(p.team_id) === String(team.id));
      const calcSpent = teamPlayers.reduce((sum: number, p: any) => sum + (Number(p.sold_price) || 0), 0);
      const budget = Number(team.budget) || 100000;
      const spent = calcSpent > 0 ? calcSpent : (Number(team.spent) || 0);
      const remaining_budget = Math.max(0, budget - spent);

      return {
        id: String(team.id),
        name: team.name,
        short_code: team.short_code,
        accent_color: team.accent_color,
        budget,
        spent,
        remaining_budget,
        squad_limit: Number(team.squad_limit) || 18,
        squad_count: teamPlayers.length || Number(team.squad_count) || 0,
      };
    });

    // Merge in-memory sold orders with database sold players
    const teamMap = new Map<string, any>();
    liveState.teams.forEach(t => teamMap.set(String(t.id), t));

    // Seed any DB sold players not already in inMemorySoldOrder
    // Sort sold players: players with higher ID or updated recently come first
    const dbSoldSorted = [...sold].sort((a: any, b: any) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    dbSoldSorted.forEach((p: any) => {
      const pId = String(p.id);
      if (!inMemorySoldOrder.has(pId)) {
        const teamMatch = teamMap.get(String(p.team_id));
        inMemorySoldOrder.set(pId, {
          id: pId,
          player_name: p.player_name,
          photo: p.photo || null,
          role: p.role || 'Player',
          player_category: p.player_category || '',
          registration_number: p.registration_number || null,
          sold_price: Number(p.sold_price) || 0,
          base_price: Number(p.base_price) || 500,
          team_id: String(p.team_id),
          team_name: teamMatch?.name || p.teams?.name || 'Franchise Team',
          team_short_code: teamMatch?.short_code || p.teams?.short_code || 'KPL',
          team_accent_color: teamMatch?.accent_color || p.teams?.accent_color || '#e8192c',
          sold_at: p.updated_at || p.created_at || null,
        });
      }
    });

    // Build ordered recent sold array (up to 50 players)
    // Filter out any player that was unassigned or is no longer in sold list
    const validSoldIds = new Set(sold.map((p: any) => String(p.id)));
    const mergedRecentSold: SoldPlayerItem[] = [];

    // Most recent are at the beginning
    Array.from(inMemorySoldOrder.values())
      .reverse()
      .forEach(item => {
        if (validSoldIds.has(String(item.id))) {
          // Refresh team name/color from latest liveState.teams
          const t = teamMap.get(String(item.team_id));
          if (t) {
            item.team_name = t.name;
            item.team_short_code = t.short_code;
            item.team_accent_color = t.accent_color;
          }
          mergedRecentSold.push(item);
        }
      });

    liveState.recent_sold = mergedRecentSold.slice(0, 50);

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

  // Trigger non-blocking async background refresh if stale (> 5 seconds)
  if (Date.now() - lastFullSync > 5000) {
    syncFromDatabase();
  }

  // If client already has the current version, return light payload
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
    is_ended: Boolean(liveState.is_ended),
    current_player_id: liveState.current_player_id,
    notes: liveState.notes,
    stats: liveState.stats,
    player: liveState.player,
    teams: liveState.teams,
    recent_sold: liveState.recent_sold || [],
    last_sold_event: liveState.last_sold_event,
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

    if (body.is_active !== undefined) {
      liveState.is_active = Boolean(body.is_active);
      if (body.is_active) {
        liveState.is_ended = false;
      }
    }
    if (body.is_ended !== undefined) {
      liveState.is_ended = Boolean(body.is_ended);
      if (body.is_ended) {
        liveState.is_active = false;
        liveState.current_player_id = null;
        liveState.player = null;
        liveState.sold_timestamp = null;
      }
    }
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

    // INSTANT LIVE SOLD UPDATE: If a player was sold, update teams' coins, stats, and recent_sold immediately!
    if (body.player && body.player.team_id && body.player.sold_price !== undefined && body.player.sold_price !== null) {
      const soldPrice = Number(body.player.sold_price) || 0;
      const teamId = String(body.player.team_id);
      const buyerTeam = liveState.teams.find(t => String(t.id) === teamId);

      const soldItem: SoldPlayerItem = {
        id: String(body.player.id),
        player_name: body.player.player_name,
        photo: body.player.photo || null,
        role: body.player.role || 'Player',
        player_category: body.player.player_category || '',
        registration_number: body.player.registration_number || null,
        sold_price: soldPrice,
        base_price: Number(body.player.base_price) || 500,
        team_id: teamId,
        team_name: buyerTeam?.name || body.player.teams?.name || 'Franchise Team',
        team_short_code: buyerTeam?.short_code || body.player.teams?.short_code || 'KPL',
        team_accent_color: buyerTeam?.accent_color || body.player.teams?.accent_color || '#e8192c',
        sold_at: Date.now(),
      };

      // Add to in-memory order map
      inMemorySoldOrder.set(String(body.player.id), soldItem);

      // Prepend to recent_sold
      const prevSold = (liveState.recent_sold || []).filter(x => String(x.id) !== String(body.player.id));
      liveState.recent_sold = [soldItem, ...prevSold].slice(0, 50);
      liveState.last_sold_event = soldItem;

      // Update team's live coins and squad count in memory
      if (buyerTeam) {
        buyerTeam.spent = (Number(buyerTeam.spent) || 0) + soldPrice;
        buyerTeam.remaining_budget = Math.max(0, (Number(buyerTeam.budget) || 100000) - buyerTeam.spent);
        buyerTeam.squad_count = (Number(buyerTeam.squad_count) || 0) + 1;
      }

      // Update live stats in memory
      liveState.stats.sold_count = (liveState.stats.sold_count || 0) + 1;
      if (liveState.stats.pool_count > 0) {
        liveState.stats.pool_count -= 1;
      }
      liveState.stats.total_purse_spent = (Number(liveState.stats.total_purse_spent) || 0) + soldPrice;
    }

    liveState.version += 1;
    liveState.lastUpdated = Date.now();

    // Trigger full background sync with DB immediately without blocking response
    syncFromDatabase(true);

    // Asynchronously persist to database in background without blocking response
    (async () => {
      try {
        await kplApi.saveContentSettings({
          auction_is_active: String(liveState.is_active),
          auction_is_ended: String(Boolean(liveState.is_ended)),
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
      is_ended: liveState.is_ended,
      current_player_id: liveState.current_player_id,
      notes: liveState.notes,
      player: liveState.player,
      sold_timestamp: liveState.sold_timestamp,
      stats: liveState.stats,
      teams: liveState.teams,
      recent_sold: liveState.recent_sold,
      last_sold_event: liveState.last_sold_event,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

