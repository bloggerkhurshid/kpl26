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
  role: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicketkeeper';
  category: 'Local' | 'Outstation' | 'Icon';
  base_price: string;
  team_name?: string;
  photo_url?: string;
  status: 'Pending' | 'Approved' | 'Sold';
  contact: string;
  village: string;
}

export interface ManagementMember {
  id: string;
  name: string;
  designation: string;
  contact: string;
  photo_url?: string;
}

export interface GalleryItem {
  id: number;
  photo_url: string;
  caption: string;
  category: string;
}
