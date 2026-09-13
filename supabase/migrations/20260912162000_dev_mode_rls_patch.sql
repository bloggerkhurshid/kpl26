/* 
  TEMPORARY DEV-MODE RLS PATCH
  This script temporarily enables full anonymous access (INSERT/UPDATE/DELETE) 
  to the admin tables so that the client-side admin dashboard can function.
  
  WARNING: These policies are permissive and should be replaced with 
  Service-Role API routes before moving to production.
*/

-- TEAMS
DROP POLICY IF EXISTS "teams_anon_all" ON teams;
CREATE POLICY "teams_anon_all" ON teams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- PLAYERS
DROP POLICY IF EXISTS "players_anon_all" ON players;
CREATE POLICY "players_anon_all" ON players FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- PAYMENTS
DROP POLICY IF EXISTS "payments_anon_all" ON payments;
CREATE POLICY "payments_anon_all" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- CONTENT SETTINGS
DROP POLICY IF EXISTS "content_settings_anon_all" ON content_settings;
CREATE POLICY "content_settings_anon_all" ON content_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- AUCTION CONFIG
DROP POLICY IF EXISTS "auction_config_anon_all" ON auction_config;
CREATE POLICY "auction_config_anon_all" ON auction_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
