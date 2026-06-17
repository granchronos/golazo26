-- Migration: Add elapsed column to matches table for live minute tracking
ALTER TABLE matches ADD COLUMN IF NOT EXISTS elapsed INT;
