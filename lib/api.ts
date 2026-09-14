/**
 * KPL API Adapter
 * Connects Next.js Frontend to PHP MySQL REST API
 */

const PHP_API_BASE = process.env.NEXT_PUBLIC_PHP_API_URL || 'https://kpl.projuktisoft.com';
const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'php';

export const isPhpBackend = () => true;

export function getImageUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/images/') || trimmed === '/kpl-logo.jpg' || trimmed === '/kpl-logo.png') {
    return trimmed;
  }
  const baseUrl = PHP_API_BASE.replace(/\/$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

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

export const kplApi = {
  // 1. Players API
  async getPlayers(params: { status?: string; limit?: number; team_id?: string; count_only?: boolean; approval?: string; registered_by?: string } = {}) {
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

  async approvePlayer(id: string) {
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

  async updatePaymentStatus(id: string, status: string) {
    return fetchFromPhpApi(`api/payments.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 7. Content Settings API
  async getContentSettings() {
    return fetchFromPhpApi('api/content.php');
  },

  async saveContentSettings(settings: Record<string, any>) {
    return fetchFromPhpApi('api/content.php', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
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
  }
};


