/**
 * KPL API Adapter
 * Connects Next.js Frontend to PHP MySQL REST API
 */

const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_URL || 'https://kpl.projuktisoft.com';
const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'php';

export const isPhpBackend = () => true;

export { compareRegistrationNumbers, getNextPlayerRegId, searchMatchesPlayer, getPlayerAuctionPart } from './printRoster';

export function getImageUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  // 1. Valid data URL (e.g. data:image/jpeg;base64,...)
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 2. Absolute web URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 3. Local bundled static asset
  if (trimmed.startsWith('/images/') || trimmed === '/kpl-logo.jpg' || trimmed === '/kpl-logo.png') {
    return trimmed;
  }

  // 4. Relative server uploads path (must look like a real path: starts with /uploads/ or uploads/)
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const baseUrl = PHP_API_BASE.replace(/\/$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${cleanPath}`;
  }

  // 5. If it's a raw base64 string without data: prefix (e.g. from an un-prefixed upload), prefix it as jpeg
  if (trimmed.startsWith('/9j/') || trimmed.startsWith('iVBORw0K') || trimmed.startsWith('UklGR')) {
    const mime = trimmed.startsWith('iVBORw0K') ? 'image/png' : trimmed.startsWith('UklGR') ? 'image/webp' : 'image/jpeg';
    return `data:${mime};base64,${trimmed}`;
  }

  // 6. If it doesn't contain a slash or extension, it's not a valid server path — return empty to prevent browser ERR_BLOCKED_BY_CLIENT / 414 URI Too Long
  if (!trimmed.includes('/') && !trimmed.includes('.')) {
    return '';
  }

  // Fallback for other valid relative paths
  if (trimmed.startsWith('/')) {
    const baseUrl = PHP_API_BASE.replace(/\/$/, '');
    return `${baseUrl}${trimmed}`;
  }

  return '';
}

export async function fetchFromPhpApi(endpoint: string, options: RequestInit & { forceFresh?: boolean } = {}) {
  let cleanEndpoint = endpoint.replace(/^\//, '');
  // Only add cache-busting timestamp when explicitly requested to enable HTTP caching
  if (options.forceFresh && (!options.method || options.method.toUpperCase() === 'GET')) {
    const separator = cleanEndpoint.includes('?') ? '&' : '?';
    cleanEndpoint = `${cleanEndpoint}${separator}_t=${Date.now()}`;
  }

  const url = `${PHP_API_BASE.replace(/\/$/, '')}/${cleanEndpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  return response.json();
}

export interface ManagementMember {
  id: string;
  name: string;
  designation: string;
  contact: string;
  photo_url?: string;
  display_order?: number;
  status?: string;
  created_at?: string;
}

export interface GalleryPhoto {
  id: number;
  photo_url: string;
  created_at?: string;
}

// High-speed In-Memory & LocalStorage Cache for Players List
interface PlayersCacheEntry {
  data: any[];
  timestamp: number;
}
const playersMemoryCache = new Map<string, PlayersCacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh in memory
const LOCAL_STORAGE_PREFIX = 'kpl_players_cache_v2_';

function getPlayersFromStorage(key: string): any[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data) && Date.now() - (parsed.timestamp || 0) < 3600000) {
      return parsed.data;
    }
  } catch {}
  return null;
}

function savePlayersToStorage(key: string, data: any[]) {
  if (typeof window === 'undefined' || !Array.isArray(data)) return;
  try {
    // Strip overly large base64 photos & proofs so localStorage stays ultra-lean (<100KB) and NEVER exceeds quota
    const lean = data.map((item: any) => ({
      ...item,
      // If photo is a massive inline base64 string (>500 chars), omit from localStorage.
      // Clean URLs are kept intact. When network/memory SWR loads, full photo is rendered.
      photo: item.photo && item.photo.length > 500 ? '' : item.photo,
      address_proof: '',
      player_signature: '',
    }));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify({
      data: lean,
      timestamp: Date.now(),
    }));
  } catch {}
}

const teamsMemoryCache = new Map<string, { data: any[]; timestamp: number }>();

function saveTeamsToStorage(status: string, data: any[]) {
  if (typeof window === 'undefined' || !Array.isArray(data)) return;
  try {
    // Keep team storage lean by omitting raw base64 data URLs
    const lean = data.map((t: any) => ({
      ...t,
      logo_url: t.logo_url && t.logo_url.length > 500 ? '' : t.logo_url,
    }));
    localStorage.setItem(`kpl_teams_cache_${status}`, JSON.stringify({
      data: lean,
      timestamp: Date.now(),
    }));
  } catch {}
}

export const kplApi = {
  // Synchronous cache reader for 0ms initial component rendering (with fuzzy fallback)
  getCachedPlayers(params: { status?: string; limit?: number; team_id?: string; count_only?: boolean; approval?: string; registered_by?: string; include_documents?: boolean } = {}): any[] | null {
    const cacheKey = JSON.stringify(params);
    const inMem = playersMemoryCache.get(cacheKey);
    if (inMem && Array.isArray(inMem.data) && inMem.data.length > 0) {
      return inMem.data;
    }
    const fromStorage = getPlayersFromStorage(cacheKey);
    if (fromStorage && fromStorage.length > 0) {
      return fromStorage;
    }
    // Smart fallback: Check any available cached player list if exact query key not yet initialized
    const cachedEntries = Array.from(playersMemoryCache.values());
    for (const entry of cachedEntries) {
      if (entry && Array.isArray(entry.data) && entry.data.length > 0) {
        if (!params.status || params.status === 'all') return entry.data;
        return entry.data.filter((p: any) => p.status === params.status);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(LOCAL_STORAGE_PREFIX)) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
                if (!params.status || params.status === 'all') return parsed.data;
                return parsed.data.filter((p: any) => p.status === params.status);
              }
            }
          }
        }
      } catch {}
    }
    return null;
  },

  // Invalidate player cache across memory and localStorage
  invalidatePlayersCache() {
    playersMemoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(LOCAL_STORAGE_PREFIX) || k.startsWith('kpl_public_players_cache')) {
            localStorage.removeItem(k);
          }
        });
      } catch {}
    }
  },

  // 1. Players API (with SWR Instant-Return Caching)
  async getPlayers(
    params: { status?: string; limit?: number; team_id?: string; count_only?: boolean; approval?: string; registered_by?: string; include_documents?: boolean } = {},
    options: { forceRefresh?: boolean } = {}
  ) {
    if (params.count_only) {
      return fetchFromPhpApi(`api/players.php?count_only=true&status=${params.status || 'active'}`);
    }
    const cacheKey = JSON.stringify(params);
    const now = Date.now();

    // 1. In-memory cache hit
    const cached = playersMemoryCache.get(cacheKey);
    if (!options.forceRefresh && cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    // 2. LocalStorage cache hit for instant browser render
    if (!options.forceRefresh && !cached) {
      const stored = getPlayersFromStorage(cacheKey);
      if (stored && stored.length > 0) {
        playersMemoryCache.set(cacheKey, { data: stored, timestamp: now });
        // Background revalidation
        (async () => {
          try {
            const query = new URLSearchParams(params as any).toString();
            const res = await fetchFromPhpApi(`api/players.php?${query}`);
            const fresh = Array.isArray(res) ? res : (res?.data || []);
            if (Array.isArray(fresh) && fresh.length > 0) {
              playersMemoryCache.set(cacheKey, { data: fresh, timestamp: Date.now() });
              savePlayersToStorage(cacheKey, fresh);
            }
          } catch {}
        })();
        return stored;
      }
    }

    // 3. Network fetch (prefer Next.js cached API in browser, fallback to PHP API)
    let data: any[] = [];
    if (typeof window !== 'undefined' && !params.count_only && !params.include_documents) {
      try {
        const query = new URLSearchParams(params as any).toString();
        const localRes = await fetch(`/api/players?${query}${options.forceRefresh ? '&fresh=true' : ''}`);
        if (localRes.ok) {
          const json = await localRes.json();
          if (Array.isArray(json) && json.length > 0) {
            data = json;
          }
        }
      } catch {}
    }

    // Fallback to direct PHP API if local route returned empty
    if (!data || data.length === 0) {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetchFromPhpApi(`api/players.php?${query}`, { forceFresh: options.forceRefresh });
      data = Array.isArray(res) ? res : (res?.data || []);
    }

    if (Array.isArray(data) && data.length > 0) {
      playersMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
      savePlayersToStorage(cacheKey, data);
    }
    return data;
  },

  async getPlayer(id: string) {
    return fetchFromPhpApi(`api/players.php?id=${id}`);
  },

  async createPlayer(playerData: any) {
    kplApi.invalidatePlayersCache();
    return fetchFromPhpApi('api/players.php', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  async updatePlayer(id: string, playerData: any) {
    kplApi.invalidatePlayersCache();
    return fetchFromPhpApi(`api/players.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  },

  async approvePlayer(id: string) {
    kplApi.invalidatePlayersCache();
    return fetchFromPhpApi(`api/players.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        approval: 'approved',
        status: 'active',
        auction_eligible: 1,
      }),
    });
  },

  async rejectPlayer(id: string, notes?: string) {
    kplApi.invalidatePlayersCache();
    return fetchFromPhpApi(`api/players.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        approval: 'rejected',
        status: 'disabled',
        auction_eligible: 0,
        notes: notes || 'Rejected by admin',
      }),
    });
  },

  async deletePlayer(id: string) {
    kplApi.invalidatePlayersCache();
    return fetchFromPhpApi(`api/players.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // 2. Teams API (with High-Speed Caching)
  getCachedTeams(status: string = 'active'): any[] | null {
    const key = `teams_${status}`;
    const inMem = teamsMemoryCache.get(key);
    if (inMem && Array.isArray(inMem.data) && inMem.data.length > 0) return inMem.data;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`kpl_teams_cache_${status}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.data)) return parsed.data;
        }
      } catch {}
    }
    return null;
  },

  async getTeams(status: string = 'active', options: { forceRefresh?: boolean } = {}) {
    const key = `teams_${status}`;
    const now = Date.now();
    const inMem = teamsMemoryCache.get(key);
    if (!options.forceRefresh && inMem && (now - inMem.timestamp < 120000)) {
      return inMem.data;
    }

    const cachedStorage = !options.forceRefresh ? kplApi.getCachedTeams(status) : null;
    if (cachedStorage && cachedStorage.length > 0) {
      teamsMemoryCache.set(key, { data: cachedStorage, timestamp: now });
      // Background revalidation
      (async () => {
        try {
          const res = await fetchFromPhpApi(`api/teams.php?status=${status}`, { forceFresh: options.forceRefresh });
          const fresh = Array.isArray(res) ? res : (res?.data || []);
          if (Array.isArray(fresh) && fresh.length > 0) {
            teamsMemoryCache.set(key, { data: fresh, timestamp: Date.now() });
            saveTeamsToStorage(status, fresh);
          }
        } catch {}
      })();
      return cachedStorage;
    }

    const res = await fetchFromPhpApi(`api/teams.php?status=${status}`, { forceFresh: options.forceRefresh });
    const data = Array.isArray(res) ? res : (res?.data || []);
    if (Array.isArray(data) && data.length > 0) {
      teamsMemoryCache.set(key, { data, timestamp: Date.now() });
      saveTeamsToStorage(status, data);
    }
    return data;
  },

  async createTeam(teamData: any) {
    return fetchFromPhpApi('api/teams.php', {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  async updateTeam(id: string, teamData: any) {
    return fetchFromPhpApi(`api/teams.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  },

  async deleteTeam(id: string) {
    return fetchFromPhpApi(`api/teams.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // 3. Highlights API
  async getHighlights(limit: number = 100) {
    return fetchFromPhpApi(`api/highlights.php?limit=${limit}`);
  },

  async createHighlight(highlightData: any) {
    return fetchFromPhpApi('api/highlights.php', {
      method: 'POST',
      body: JSON.stringify(highlightData),
    });
  },

  async updateHighlight(id: number | string, highlightData: any) {
    return fetchFromPhpApi(`api/highlights.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(highlightData),
    });
  },

  async deleteHighlight(id: number | string) {
    return fetchFromPhpApi(`api/highlights.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // 4. Management API
  async getManagement(status: string = 'active') {
    return fetchFromPhpApi(`api/management.php?status=${status}`);
  },

  async createManagement(memberData: Partial<ManagementMember> & { photo_base64?: string }) {
    return fetchFromPhpApi('api/management.php', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  async updateManagement(id: string, memberData: Partial<ManagementMember> & { photo_base64?: string }) {
    return fetchFromPhpApi(`api/management.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  },

  async deleteManagement(id: string) {
    return fetchFromPhpApi(`api/management.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // 5. Gallery API (No captions, single & multi upload support)
  async getGallery(limit: number = 500) {
    return fetchFromPhpApi(`api/gallery.php?limit=${limit}`);
  },

  async uploadGalleryPhotos(photos: Array<{ photo_base64?: string; photo_url?: string }>) {
    return fetchFromPhpApi('api/gallery.php', {
      method: 'POST',
      body: JSON.stringify({ photos }),
    });
  },

  async deleteGalleryPhoto(id: number | string) {
    return fetchFromPhpApi(`api/gallery.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // 6. Payments API
  async getPayments(limit: number = 500) {
    return fetchFromPhpApi(`api/payments.php?limit=${limit}`);
  },

  async createPayment(paymentData: any) {
    return fetchFromPhpApi('api/payments.php', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  async updatePaymentStatus(id: string, status: string, screenshot?: string | null) {
    const payload: any = { status };
    if (screenshot) {
      payload.screenshot = screenshot;
      payload.payment_proof = screenshot;
    }
    return fetchFromPhpApi(`api/payments.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // 7. Content Settings API
  async getContentSettings() {
    return fetchFromPhpApi('api/content.php', { cache: 'no-store', forceFresh: true });
  },

  async saveContentSettings(settings: Record<string, any>) {
    return fetchFromPhpApi('api/content.php', {
      method: 'POST',
      headers: { 'Cache-Control': 'no-cache' },
      body: JSON.stringify(settings),
    });
  },

  // Sponsors API (Dedicated MySQL `sponsors` table + fallback)
  async getSponsors(status: string = 'active') {
    try {
      const res = await fetchFromPhpApi(`api/sponsors.php?status=${status}`);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
    } catch (e) {
      // Fallback to content.php if table not yet created on remote
    }
    const content = await fetchFromPhpApi('api/content.php');
    if (content?.sponsors_data) {
      try {
        return typeof content.sponsors_data === 'string' ? JSON.parse(content.sponsors_data) : content.sponsors_data;
      } catch (err) {}
    }
    return null;
  },

  async createSponsor(sponsorData: any) {
    try {
      return await fetchFromPhpApi('api/sponsors.php', {
        method: 'POST',
        body: JSON.stringify(sponsorData),
      });
    } catch (e) {
      return null;
    }
  },

  async updateSponsor(id: string, sponsorData: any) {
    try {
      return await fetchFromPhpApi(`api/sponsors.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(sponsorData),
      });
    } catch (e) {
      return null;
    }
  },

  async deleteSponsor(id: string) {
    try {
      return await fetchFromPhpApi(`api/sponsors.php?id=${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      return null;
    }
  },

  async saveSponsors(sponsors: any[]) {
    // Saves to both sponsors.php and content.php backup
    try {
      await fetchFromPhpApi('api/content.php', {
        method: 'POST',
        body: JSON.stringify({ sponsors_data: JSON.stringify(sponsors) }),
      });
    } catch (e) {}
    return sponsors;
  },

  // 8. Fee Settings API
  async getFeeSettings() {
    return fetchFromPhpApi('api/settings.php');
  },

  async saveFeeSettings(settings: Record<string, any>) {
    return fetchFromPhpApi('api/settings.php', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // 9. Dashboard API
  async getDashboardMetrics() {
    return fetchFromPhpApi('api/dashboard.php');
  },

  // 10. Auth API
  async adminLogin(credentials: { username: string; password: string }) {
    return fetchFromPhpApi('api/auth.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // 11. Auction Live Sync API (Ultra-Fast <5ms in-memory state)
  async getAuctionLive(version: number = 0) {
    try {
      const res = await fetch(`/api/auction/live?v=${version}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async getAuctionConfig() {
    try {
      const res = await fetch(`/api/auction/live?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  async updateAuctionConfig(data: { is_active?: boolean; is_ended?: boolean; current_player_id?: string | null; notes?: string; player?: any; sold_timestamp?: number | null; unassign_player_id?: string }) {
    // Post to fast live endpoint
    const res = await fetch('/api/auction/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to update auction configuration');
    }
    return await res.json();
  }
};


