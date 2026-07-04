-- =============================================
-- Migration 017: Add third_place match (match #104)
-- =============================================

-- 1. Allow 'third_place' in the round check constraint
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_round_check;
ALTER TABLE matches ADD CONSTRAINT matches_round_check
  CHECK (round IN ('group','round_of_32','round_of_16','quarter_finals','semi_finals','third_place','final'));

-- 2. Allow 'third_place' in the teams eliminated_round check constraint
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_eliminated_round_check;
ALTER TABLE teams ADD CONSTRAINT teams_eliminated_round_check
  CHECK (eliminated_round IN ('group','round_of_32','round_of_16','quarter_finals','semi_finals','third_place','final'));

-- 3. Insert the third place match (match 104)
INSERT INTO matches (match_number, round, match_date, venue, city, status)
VALUES (104, 'third_place', '2026-07-18T20:00:00Z', 'TBD', 'TBD', 'scheduled')
ON CONFLICT (match_number) DO UPDATE SET round = 'third_place';
