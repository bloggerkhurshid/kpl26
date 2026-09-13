-- Add address_proof column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS address_proof TEXT;
