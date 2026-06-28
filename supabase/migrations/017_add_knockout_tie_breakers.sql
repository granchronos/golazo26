-- Add tie breaker and penalty columns for predictions and matches

ALTER TABLE predictions ADD COLUMN predicted_tie_breaker varchar; -- 'home_et', 'away_et', 'penalties'
ALTER TABLE predictions ADD COLUMN predicted_home_penalty_score integer;
ALTER TABLE predictions ADD COLUMN predicted_away_penalty_score integer;

ALTER TABLE matches ADD COLUMN tie_breaker varchar; -- 'home_et', 'away_et', 'penalties'
ALTER TABLE matches ADD COLUMN home_penalty_score integer;
ALTER TABLE matches ADD COLUMN away_penalty_score integer;
