-- =============================================
-- Migration 007: Score predictions
-- =============================================
-- Adds predicted_home_score / predicted_away_score to predictions table.
-- These allow users to predict exact match scores.
-- Points: 3 pts for exact score, 1 pt for correct winner only.

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS predicted_home_score INT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS predicted_away_score INT;
