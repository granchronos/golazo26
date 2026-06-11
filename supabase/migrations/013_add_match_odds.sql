-- Migration: Add odds column to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS odds TEXT;
