import { NextResponse } from 'next/server';
import { kplApi } from '@/lib/api';

export type AuctionStageStatus = 'IDLE' | 'BIDDING' | 'CELEBRATION_SOLD' | 'CELEBRATION_UNSOLD';

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
  status: AuctionStageStatus;
  current_player_id: string | null;
  notes: string;
  player: any | null;
  sold_timestamp: number | null;
  unsold_timestamp: number | null;
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

// In-memory persistent state across requests
const inMemorySoldOrder: Map<string, SoldPlayerItem> = new Map();
let inMemoryPool: any[] = [];

let liveState: LiveState = {
  is_active: true,
  is_ended: false,
  status: 'IDLE',
  current_player_id: null,
  notes: 'KPL Season 3 Live Auction',
  player: null,
  sold_timestamp: null,
  unsold_timestamp: null,
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
let lastLocalMutation = 0;

// Background sync from remote PHP DB
async function syncFromDatabase(force: boolean = false) {
  const now = Date.now();
  // Don't refetch heavy database queries more often than every 5 seconds unless forced
  if (!force && (now - lastFullSync < 5000 || isSyncing)) {
    return;
  }

  isSyncing = true;
  try {
    const [contentRes, playersRes, teamsRes] = await Promise.all([
      kplApi.getContentSettings().catch(() => null),
      kplApi.getPlayers({ status: 'active', limit: 2000 }, { forceRefresh: force }).catch(() => []),
      kplApi.getTeams('active').catch(() => []),
    ]);

    const snapshotPlayerId = liveState.current_player_id;
    const snapshotPlayerTeamId = liveState.player?.team_id;
    const snapshotSoldCount = liveState.stats.sold_count;
    const snapshotPoolCount = liveState.stats.pool_count;
    const snapshotIsActive = liveState.is_active;
    const snapshotIsEnded = liveState.is_ended;
    const snapshotStatus = liveState.status;

    const data = contentRes?.data || contentRes || {};
    
    // Only adopt remote database config if we are IDLE or during cold start
    const timeSinceLocalMutation = Date.now() - lastLocalMutation;
    if (!hasBootstrapped || (liveState.status === 'IDLE' && timeSinceLocalMutation > 10000)) {
      if (data.auction_is_ended !== undefined) {
        liveState.is_ended = data.auction_is_ended === 'true' || data.auction_is_ended === true || data.auction_is_ended === '1' || data.auction_is_ended === 1;
      }
      if (data.auction_is_active !== undefined) {
        const dbIsActive = data.auction_is_active === 'true' || data.auction_is_active === true || data.auction_is_active === '1' || data.auction_is_active === 1;
        if (dbIsActive) {
          liveState.is_active = true;
        } else if (liveState.is_ended) {
          liveState.is_active = false;
        }
      }
      if (data.auction_notes !== undefined) {
        liveState.notes = data.auction_notes || '';
      }
      // Only adopt player from database if status was explicitly BIDDING in DB and player has no team_id
      if (data.auction_stage_status === 'BIDDING' && data.auction_current_player_id) {
        liveState.current_player_id = String(data.auction_current_player_id);
        liveState.status = 'BIDDING';
      }
    }
    hasBootstrapped = true;

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
    inMemoryPool = pool;
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

    const validSoldIds = new Set(sold.map((p: any) => String(p.id)));
    const mergedRecentSold: SoldPlayerItem[] = [];

    Array.from(inMemorySoldOrder.values())
      .reverse()
      .forEach(item => {
        if (validSoldIds.has(String(item.id))) {
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
        if (liveState.status === 'BIDDING') {
          // Player is actively on the block for bidding: NEVER CLOBBER!
          const assignedTeam = curr.team_id ? liveState.teams.find((t: any) => String(t.id) === String(curr.team_id)) : null;
          liveState.player = {
            ...curr,
            teams: assignedTeam || curr.teams || null,
          };
        } else if (liveState.status === 'CELEBRATION_SOLD') {
          const existingPlayer = liveState.player;
          const teamId = existingPlayer?.team_id || curr.team_id;
          const soldPrice = existingPlayer?.sold_price !== undefined ? existingPlayer.sold_price : curr.sold_price;
          const assignedTeam = liveState.teams.find((t: any) => String(t.id) === String(teamId));
          liveState.player = {
            ...curr,
            team_id: teamId || null,
            sold_price: soldPrice !== undefined ? soldPrice : null,
            teams: assignedTeam || curr.teams || null,
          };
        } else if (liveState.status === 'CELEBRATION_UNSOLD') {
          liveState.player = {
            ...curr,
            team_id: null,
            sold_price: null,
            auction_eligible: 0,
          };
        }
      } else {
        // If not in rawPlayers yet, keep existing optimistic player if id matches
        if (!liveState.player || String(liveState.player.id) !== String(liveState.current_player_id)) {
          liveState.player = null;
        }
      }
    } else {
      liveState.player = null;
    }

    const hasMeaningfulChange = !hasBootstrapped ||
      snapshotPlayerId !== liveState.current_player_id ||
      snapshotPlayerTeamId !== liveState.player?.team_id ||
      snapshotSoldCount !== liveState.stats.sold_count ||
      snapshotPoolCount !== liveState.stats.pool_count ||
      snapshotIsActive !== liveState.is_active ||
      snapshotIsEnded !== liveState.is_ended ||
      snapshotStatus !== liveState.status;

    if (hasMeaningfulChange) {
      liveState.version += 1;
      liveState.lastUpdated = Date.now();
    }
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

  // If this server instance has not bootstrapped from the database yet, await initial sync
  if (!hasBootstrapped) {
    await syncFromDatabase(true);
  } else if (Date.now() - lastFullSync > 5000) {
    // Non-blocking background sync if already bootstrapped
    syncFromDatabase();
  }

  // Auto-clear celebrations when their time has elapsed
  if (liveState.status === 'CELEBRATION_SOLD') {
    const isExpired = !liveState.sold_timestamp || (Date.now() - Number(liveState.sold_timestamp) >= 60000);
    if (isExpired) {
      liveState.status = 'IDLE';
      liveState.current_player_id = null;
      liveState.player = null;
      liveState.sold_timestamp = null;
      liveState.version += 1;
      kplApi.saveContentSettings({ auction_current_player_id: '', auction_stage_status: 'IDLE' }).catch(() => {});
    }
  } else if (liveState.status === 'CELEBRATION_UNSOLD') {
    const isExpired = !liveState.unsold_timestamp || (Date.now() - Number(liveState.unsold_timestamp) >= 30000);
    if (isExpired) {
      liveState.status = 'IDLE';
      liveState.current_player_id = null;
      liveState.player = null;
      liveState.unsold_timestamp = null;
      liveState.version += 1;
      kplApi.saveContentSettings({ auction_current_player_id: '', auction_stage_status: 'IDLE' }).catch(() => {});
    }
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
    status: liveState.status,
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
    unsold_timestamp: liveState.unsold_timestamp,
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

    hasBootstrapped = true;
    lastLocalMutation = Date.now();

    // 1. Session Active / Ended state
    if (body.is_active !== undefined) {
      liveState.is_active = Boolean(body.is_active);
      if (body.is_active) liveState.is_ended = false;
    }
    if (body.is_ended !== undefined) {
      liveState.is_ended = Boolean(body.is_ended);
      if (body.is_ended) {
        liveState.is_active = false;
        liveState.status = 'IDLE';
        liveState.current_player_id = null;
        liveState.player = null;
        liveState.sold_timestamp = null;
        liveState.unsold_timestamp = null;
      }
    }
    if (body.notes !== undefined) liveState.notes = String(body.notes);

    // 2. Player and Stage Status transition
    if (body.current_player_id === null) {
      // Clear block completely
      liveState.status = 'IDLE';
      liveState.current_player_id = null;
      liveState.player = null;
      liveState.sold_timestamp = null;
      liveState.unsold_timestamp = null;
    } else if (body.current_player_id) {
      liveState.is_active = true;
      liveState.is_ended = false;
      liveState.current_player_id = String(body.current_player_id);

      if (body.sold_timestamp) {
        // Player was SOLD
        liveState.status = 'CELEBRATION_SOLD';
        liveState.sold_timestamp = Number(body.sold_timestamp);
        liveState.unsold_timestamp = null;
      } else if (body.unsold_timestamp) {
        // Player was marked UNSOLD
        liveState.status = 'CELEBRATION_UNSOLD';
        liveState.unsold_timestamp = Number(body.unsold_timestamp);
        liveState.sold_timestamp = null;
      } else {
        // Player placed on the block for BIDDING
        liveState.status = 'BIDDING';
        liveState.sold_timestamp = null;
        liveState.unsold_timestamp = null;
      }

      if (body.player) {
        liveState.player = body.player;
      }
    }

    // 3. If a player was SOLD, update sold history, team budget & stats immediately
    if (liveState.status === 'CELEBRATION_SOLD' && body.player && body.player.team_id) {
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

      inMemorySoldOrder.set(String(body.player.id), soldItem);
      const prevSold = (liveState.recent_sold || []).filter(x => String(x.id) !== String(body.player.id));
      liveState.recent_sold = [soldItem, ...prevSold].slice(0, 50);
      liveState.last_sold_event = soldItem;

      if (buyerTeam) {
        buyerTeam.spent = (Number(buyerTeam.spent) || 0) + soldPrice;
        buyerTeam.remaining_budget = Math.max(0, (Number(buyerTeam.budget) || 100000) - buyerTeam.spent);
        buyerTeam.squad_count = (Number(buyerTeam.squad_count) || 0) + 1;
      }

      liveState.stats.sold_count = (liveState.stats.sold_count || 0) + 1;
      if (liveState.stats.pool_count > 0) {
        liveState.stats.pool_count -= 1;
      }
      liveState.stats.total_purse_spent = (Number(liveState.stats.total_purse_spent) || 0) + soldPrice;
    }

    // 4. Handle player unassignment
    if (body.unassign_player_id) {
      const unassignId = String(body.unassign_player_id);
      inMemorySoldOrder.delete(unassignId);
      liveState.recent_sold = (liveState.recent_sold || []).filter(x => String(x.id) !== unassignId);
      if (liveState.last_sold_event && String(liveState.last_sold_event.id) === unassignId) {
        liveState.last_sold_event = null;
      }
    }

    lastLocalMutation = Date.now();
    liveState.version += 1;
    liveState.lastUpdated = Date.now();

    // 5. Persist to MySQL database
    // If BIDDING: save the current player ID so page reloads/cold restarts keep this player on the block
    // If CELEBRATION_SOLD, CELEBRATION_UNSOLD, or IDLE: save empty '' so reloads after round never resurrect the player
    const dbPlayerIdToSave = liveState.status === 'BIDDING' ? (liveState.current_player_id || '') : '';
    const dbStatusToSave = liveState.status === 'BIDDING' ? 'BIDDING' : 'IDLE';

    try {
      await kplApi.saveContentSettings({
        auction_is_active: String(liveState.is_active),
        auction_is_ended: String(Boolean(liveState.is_ended)),
        auction_current_player_id: dbPlayerIdToSave,
        auction_stage_status: dbStatusToSave,
        auction_notes: liveState.notes,
      });
    } catch (e) {
      console.warn('Failed to persist auction state to database:', e);
    }

    // Refresh memory cache in background (non-blocking)
    syncFromDatabase(true);

    return NextResponse.json({
      success: true,
      version: liveState.version,
      status: liveState.status,
      is_active: liveState.is_active,
      is_ended: liveState.is_ended,
      current_player_id: liveState.current_player_id,
      notes: liveState.notes,
      player: liveState.player,
      sold_timestamp: liveState.sold_timestamp,
      unsold_timestamp: liveState.unsold_timestamp,
      stats: liveState.stats,
      teams: liveState.teams,
      recent_sold: liveState.recent_sold,
      last_sold_event: liveState.last_sold_event,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
