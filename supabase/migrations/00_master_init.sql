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
/*
# KPL Admin Schema

New tables:
- teams: Official/managed team records
- players: Master player pool with auction and assignment fields
- payments: Payment records for Cashfree and Razorpay
- content_settings: Editable frontend content key-value store
- auction_config: Auction session state

RLS:
- teams, players, content_settings, auction_config: anon read only; admin writes via service role
- payments: anon insert (for webhook callbacks) + read
*/

-- ========================
-- TEAMS
-- ========================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_code text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  captain text DEFAULT '',
  color text DEFAULT '',
  accent_color text DEFAULT '#e8ac2f',
  home_location text DEFAULT '',
  logo_url text DEFAULT '',
  status text NOT NULL DEFAULT 'active', -- active | disabled
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_anon_select" ON teams;
CREATE POLICY "teams_anon_select"
  ON teams FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "teams_service_all" ON teams;
CREATE POLICY "teams_service_all"
  ON teams FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================
-- PLAYERS
-- ========================
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  age integer,
  role text DEFAULT '',            -- Batsman | Bowler | All-rounder | Wicket-keeper
  contact_number text NOT NULL DEFAULT '',
  email text DEFAULT '',
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  auction_eligible boolean NOT NULL DEFAULT true,
  base_price numeric(10,2) DEFAULT 0,
  sold_price numeric(10,2),
  status text NOT NULL DEFAULT 'active',  -- active | disabled
  registration_id uuid REFERENCES player_registrations(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "players_anon_select" ON players;
CREATE POLICY "players_anon_select"
  ON players FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "players_service_all" ON players;
CREATE POLICY "players_service_all"
  ON players FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================
-- PAYMENTS
-- ========================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE,
  payment_id text,
  gateway text NOT NULL DEFAULT 'razorpay', -- cashfree | razorpay
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',   -- pending | success | failed | refunded
  payer_name text DEFAULT '',
  payer_email text DEFAULT '',
  payer_phone text DEFAULT '',
  purpose text DEFAULT '',                  -- team_registration | player_registration | other
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_anon_insert" ON payments;
CREATE POLICY "payments_anon_insert"
  ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "payments_anon_select" ON payments;
CREATE POLICY "payments_anon_select"
  ON payments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "payments_service_all" ON payments;
CREATE POLICY "payments_service_all"
  ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========================
-- CONTENT SETTINGS
-- ========================
CREATE TABLE IF NOT EXISTS content_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_anon_select" ON content_settings;
CREATE POLICY "content_anon_select"
  ON content_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "content_service_all" ON content_settings;
CREATE POLICY "content_service_all"
  ON content_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed default content
INSERT INTO content_settings (key, value) VALUES
  ('hero_title', 'Where local legends become champions.'),
  ('hero_subtitle', 'Assam''s premier hard tennis ball cricket championship. Eight franchises. One unforgettable summer.'),
  ('hero_eyebrow', 'REGISTRATION OPEN · SEASON 3 · 2026'),
  ('deadline_text', 'Secure your franchise spot before 24 August 2026.'),
  ('deadline_days', '12'),
  ('contact_location', 'Khoraghat, Bilasipara, Dhubri, Assam'),
  ('contact_match_window', 'August – September 2026'),
  ('season_number', '03'),
  ('season_year', '2026'),
  ('registration_open', 'true')
ON CONFLICT (key) DO NOTHING;

-- ========================
-- AUCTION CONFIG
-- ========================
CREATE TABLE IF NOT EXISTS auction_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
  is_active boolean NOT NULL DEFAULT false,
  current_player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE auction_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auction_anon_select" ON auction_config;
CREATE POLICY "auction_anon_select"
  ON auction_config FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auction_service_all" ON auction_config;
CREATE POLICY "auction_service_all"
  ON auction_config FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed singleton row
INSERT INTO auction_config (id, is_active) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- Seed gateway settings (empty defaults — admin will fill via Settings page)
INSERT INTO content_settings (key, value) VALUES
  ('gateway_razorpay_key_id', ''),
  ('gateway_razorpay_key_secret', ''),
  ('gateway_cashfree_app_id', ''),
  ('gateway_cashfree_secret_key', ''),
  ('gateway_mode', 'sandbox')
ON CONFLICT (key) DO NOTHING;
/*
  Add detailed player registration fields to the `players` table.
  Also update RLS to allow anon inserts into `players` directly so the frontend can submit directly to the master players table.
*/

ALTER TABLE players
ADD COLUMN IF NOT EXISTS father_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS photo text DEFAULT '',
ADD COLUMN IF NOT EXISTS batting_hand text DEFAULT '',
ADD COLUMN IF NOT EXISTS wicket_keeper boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS player_category text DEFAULT '',
ADD COLUMN IF NOT EXISTS previously_played boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS all_rounder boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bowler boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bowling_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS declaration_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS player_signature text DEFAULT '',
ADD COLUMN IF NOT EXISTS approval text DEFAULT '',
ADD COLUMN IF NOT EXISTS registration_number text DEFAULT '',
ADD COLUMN IF NOT EXISTS registered_by text DEFAULT '';

-- Allow anonymous inserts to the players table for frontend registration
DROP POLICY IF EXISTS "players_anon_insert" ON players;
CREATE POLICY "players_anon_insert"
  ON players FOR INSERT TO anon, authenticated WITH CHECK (true);
/* Add present_address to players table */
ALTER TABLE players ADD COLUMN IF NOT EXISTS present_address text DEFAULT '';
