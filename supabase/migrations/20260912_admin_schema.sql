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
