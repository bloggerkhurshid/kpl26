export interface Team {
  id: string;
  name: string;
  short_name: string;
  owner_name: string;
  captain_name?: string;
  city: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  squad_count: number;
}

export interface Player {
  id: string;
  registration_number: string;
  full_name: string;
  role: string;
  category: string;
  base_price: string;
  team_name?: string;
  photo_url?: string;
  status: string;
  contact: string;
  village: string;
}

export interface ManagementMember {
  id: string;
  name: string;
  designation: string;
  contact: string;
  photo_url?: string;
  display_order?: number;
}

export interface GalleryItem {
  id: number;
  photo_url: string;
  caption: string;
  category?: string;
}

export interface ContentSettings {
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

