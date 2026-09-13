/**
 * KPL API Adapter
 * Connects Next.js Frontend to PHP MySQL REST API or Supabase Backend
 */

const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_URL || 'http://localhost:8000';
const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'php'; // 'php' or 'supabase'

export const isPhpBackend = () => API_MODE === 'php';

export async function fetchFromPhpApi(endpoint: string, options: RequestInit = {}) {
  const url = `${PHP_API_BASE.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
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

export const kplApi = {
  // 1. Players API
  async getPlayers(params: { status?: string; limit?: number; team_id?: string; count_only?: boolean } = {}) {
    if (params.count_only) {
      return fetchFromPhpApi(`api/players.php?count_only=true&status=${params.status || 'active'}`);
    }
    const query = new URLSearchParams(params as any).toString();
    return fetchFromPhpApi(`api/players.php?${query}`);
  },

  async createPlayer(playerData: any) {
    return fetchFromPhpApi('api/players.php', {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  async updatePlayer(id: string, playerData: any) {
    return fetchFromPhpApi(`api/players.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  },

  async deletePlayer(id: string) {
    return fetchFromPhpApi(`api/players.php?id=${id}`, {
      method: 'DELETE',
    });
  },

  // 2. Teams API
  async getTeams(status: string = 'active') {
    return fetchFromPhpApi(`api/teams.php?status=${status}`);
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

  // 4. Content Settings API
  async getContentSettings() {
    return fetchFromPhpApi('api/content.php');
  },

  async saveContentSettings(settings: Record<string, any>) {
    return fetchFromPhpApi('api/content.php', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // 5. Dashboard API
  async getDashboardMetrics() {
    return fetchFromPhpApi('api/dashboard.php');
  },

  // 6. Auth API
  async adminLogin(credentials: { username: string; password: string }) {
    return fetchFromPhpApi('api/auth.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }
};
