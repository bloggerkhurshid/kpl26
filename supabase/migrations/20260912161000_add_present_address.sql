/* Add present_address to players table */
ALTER TABLE players ADD COLUMN IF NOT EXISTS present_address text DEFAULT '';
