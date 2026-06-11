-- =============================================
-- Migration 012: Add match events column
-- =============================================

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS events JSONB;
