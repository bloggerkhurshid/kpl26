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
