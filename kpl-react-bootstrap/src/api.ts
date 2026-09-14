/**
 * KPL API Client for React Version
 * Connects to PHP MySQL REST API at https://kpl.projuktisoft.com
 */

const PHP_API_BASE = 'https://kpl.projuktisoft.com';

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

export interface ApiContentSettings {
  show_hero?: string;
  show_stats?: string;
  show_about?: string;
  show_format?: string;
  show_champions?: string;
  show_teams?: string;
  show_players?: string;
  show_register?: string;
  show_highlights?: string;
  show_management?: string;
  show_gallery?: string;
  hero_title?: string;
  hero_subtitle?: string;
  about_title?: string;
  about_text?: string;
  format_title?: string;
  format_subtitle?: string;
  deadline_date?: string;
  deadline_text?: string;
  fee_player?: string | number;
  fee_foreign_player?: string | number;
  fee_team?: string | number;
  active_gateway?: string;
}

export interface ApiFeeSettings {
  fee_player: number;
  fee_foreign_player: number;
  fee_team: number;
  active_gateway: string;
  gateway_mode?: string;
  upi_id?: string;
  upi_payee_name?: string;
  raw_settings?: Record<string, any>;
}

export interface ApiTeam {
  id: string;
  name: string;
  owner_name: string;
  captain_name?: string;
  home_location?: string;
  short_code?: string;
  accent_color?: string;
  logo_url?: string;
  status?: string;
  created_at?: string;
}

export interface ApiPlayer {
  id: string;
  registration_number: string;
  player_name: string;
  role: string;
  player_category?: string;
  base_price?: number | string;
  photo?: string;
  team_id?: string;
  status?: string;
  contact_number?: string;
  present_address?: string;
  village?: string;
  father_name?: string;
  age?: number;
}

export interface ApiManagementMember {
  id: string;
  name: string;
  designation: string;
  contact: string;
  photo_url?: string;
  display_order?: number;
  status?: string;
  created_at?: string;
}

export interface ApiGalleryPhoto {
  id: number;
  photo_url: string;
  caption?: string;
  created_at?: string;
}

export interface ApiPayment {
  id: string;
  registration_type: string;
  registration_id: string;
  name: string;
  phone: string;
  amount: number;
  payment_gateway: string;
  payment_id: string;
  status: string;
  created_at?: string;
}

export const kplApi = {
  // 1. Content Settings
  async getContentSettings(): Promise<ApiContentSettings> {
    return fetchFromPhpApi('api/content.php');
  },

  async saveContentSettings(settings: Record<string, any>) {
    return fetchFromPhpApi('api/content.php', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // 2. Fee & Payment Settings
  async getFeeSettings(): Promise<ApiFeeSettings> {
    return fetchFromPhpApi('api/settings.php');
  },

  async saveFeeSettings(settings: Record<string, any>) {
    return fetchFromPhpApi('api/settings.php', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  // 3. Teams API
  async getTeams(status: string = 'active'): Promise<ApiTeam[]> {
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

  // 4. Players API
  async getPlayers(params: { status?: string; limit?: number; team_id?: string } = {}): Promise<ApiPlayer[]> {
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

  // 5. Management API
  async getManagement(status: string = 'active'): Promise<ApiManagementMember[]> {
    return fetchFromPhpApi(`api/management.php?status=${status}`);
  },

  async createManagement(memberData: any) {
    return fetchFromPhpApi('api/management.php', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  async updateManagement(id: string, memberData: any) {
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

  // 6. Gallery API
  async getGallery(limit: number = 100): Promise<ApiGalleryPhoto[]> {
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

  // 7. Payments API
  async getPayments(limit: number = 200): Promise<ApiPayment[]> {
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

  // 8. Dashboard Metrics
  async getDashboardMetrics() {
    return fetchFromPhpApi('api/dashboard.php');
  },

  // 9. Admin Auth
  async adminLogin(credentials: { username: string; password: string }) {
    return fetchFromPhpApi('api/auth.php', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};
