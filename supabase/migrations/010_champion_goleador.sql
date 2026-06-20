-- =============================================
-- Migration 010: Champion and Goleador agnostic predictions
-- =============================================

-- Add prediction fields to room_members
ALTER TABLE room_members
  ADD COLUMN IF NOT EXISTS predicted_champion_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS predicted_goleador TEXT;

-- Add actual goleador to rooms
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS actual_goleador TEXT;

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    TEXT NOT NULL CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
  is_star     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimized search
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_is_star ON players(is_star);

-- Enable RLS on players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Allow public read on players
CREATE POLICY "players_public_read" ON players FOR SELECT USING (true);

-- Allow users to update their own prediction fields in room_members
CREATE POLICY "room_members_update_own" ON room_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Protect payment fields from non-admin updates in room_members
CREATE OR REPLACE FUNCTION protect_payment_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
      OLD.payment_confirmed_at IS DISTINCT FROM NEW.payment_confirmed_at OR
      OLD.payment_confirmed_by IS DISTINCT FROM NEW.payment_confirmed_by) THEN
    -- Verify the updater is the admin of the room
    IF NOT EXISTS (
      SELECT 1 FROM rooms r
      WHERE r.id = NEW.room_id AND r.admin_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Solo el administrador de la sala puede modificar los campos de pago';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER check_payment_fields_protection
  BEFORE UPDATE ON room_members
  FOR EACH ROW EXECUTE FUNCTION protect_payment_fields();

-- =============================================
-- CRON JOB SETUP (DEPRECATED — see 015_smart_cron.sql)
-- =============================================
-- The naive every-minute cron has been replaced by a smart cron
-- that only syncs during active match windows.
-- See: supabase/migrations/015_smart_cron.sql
--
-- Prerequisites (enable via Supabase Dashboard):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
