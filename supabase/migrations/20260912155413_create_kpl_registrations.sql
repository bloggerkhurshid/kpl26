/*
# Create KPL registration tables (single-tenant, no auth)

1. New Tables
- `team_registrations`
  - `id` (uuid, primary key)
  - `team_name` (text, not null) — franchise team name
  - `owner_name` (text, not null) — team owner / franchise owner
  - `captain_name` (text) — team captain
  - `contact_number` (text, not null) — phone number
  - `email` (text) — email address
  - `home_location` (text) — team base location
  - `message` (text) — optional notes from the applicant
  - `status` (text, default 'pending') — registration status
  - `created_at` (timestamptz, default now())
- `player_registrations`
  - `id` (uuid, primary key)
  - `player_name` (text, not null) — player full name
  - `age` (integer) — player age
  - `role` (text) — batting / bowling / all-rounder / wicket-keeper
  - `contact_number` (text, not null) — phone number
  - `email` (text) — email address
  - `preferred_team` (text) — team the player wants to join
  - `experience` (text) — previous cricket experience
  - `message` (text) — optional notes from the applicant
  - `status` (text, default 'pending') — registration status
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on both tables.
- Allow anon + authenticated INSERT only (public registration form).
- No SELECT / UPDATE / DELETE from the anon key — organizers manage data server-side.
*/

CREATE TABLE IF NOT EXISTS team_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  owner_name text NOT NULL,
  captain_name text,
  contact_number text NOT NULL,
  email text,
  home_location text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_team_registrations" ON team_registrations;
CREATE POLICY "anon_insert_team_registrations"
ON team_registrations FOR INSERT
TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS player_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  age integer,
  role text,
  contact_number text NOT NULL,
  email text,
  preferred_team text,
  experience text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE player_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_player_registrations" ON player_registrations;
CREATE POLICY "anon_insert_player_registrations"
ON player_registrations FOR INSERT
TO anon, authenticated WITH CHECK (true);
