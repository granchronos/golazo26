-- =============================================
-- Migration 015: Smart Cron — Sync only during matches
-- =============================================
-- Instead of syncing 24/7, this cron runs every 5 minutes
-- but ONLY calls the sync endpoint when matches are actively
-- being played (or about to start / recently finished).
--
-- Requires: pg_cron, pg_net (enable via Supabase Dashboard)
-- =============================================

-- 1) Gatekeeper function: determines if we should sync right now
-- Returns TRUE if current time falls within today's match window
-- or if any match is currently live.
CREATE OR REPLACE FUNCTION should_sync_now()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_live BOOLEAN;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Safety net: if ANY match is currently live, always sync
  SELECT EXISTS (
    SELECT 1 FROM matches WHERE status = 'live'
  ) INTO v_has_live;

  IF v_has_live THEN
    RETURN TRUE;
  END IF;

  -- Find today's match window:
  --   Start = earliest match_date today - 15 minutes (pre-match buffer)
  --   End   = latest match_date today + 3 hours (match duration ~2h + 1h post buffer)
  --
  -- We look at a 30-hour rolling window from "today 00:00 UTC" to handle
  -- matches that start late at night and end past midnight (e.g., 02:00 UTC
  -- matches that are seeded as next-day but logically belong to the previous
  -- matchday's schedule).
  SELECT
    MIN(match_date) - INTERVAL '15 minutes',
    MAX(match_date) + INTERVAL '3 hours'
  INTO v_window_start, v_window_end
  FROM matches
  WHERE match_date >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC')
    AND match_date <  DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC') + INTERVAL '30 hours'
    AND status NOT IN ('postponed', 'finished');  -- ignore already-finished matches

  -- No matches today at all
  IF v_window_start IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if NOW falls within the match window
  RETURN NOW() >= v_window_start AND NOW() <= v_window_end;
END;
$$;

-- 2) Wrapper function called by pg_cron
-- Only fires the HTTP request if should_sync_now() returns TRUE
CREATE OR REPLACE FUNCTION smart_sync_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
BEGIN
  IF should_sync_now() THEN
    PERFORM net.http_get(
      'https://golazo26.vercel.app/api/cron/sync?secret=yRDGp_G4-4VcHX_'
    );
  END IF;
END;
$$;

-- 3) Schedule the smart cron: every 5 minutes, 24/7 (but the function
--    itself decides whether to actually call the sync endpoint)
--
-- NOTE: If you already have an existing cron job, unschedule it first:
--   SELECT cron.unschedule('sync-world-cup-scores-every-minute');
--   SELECT cron.unschedule('sync-world-cup-scores-every-5-minutes');

SELECT cron.schedule(
  'smart-sync-scores',
  '*/5 * * * *',
  $$SELECT smart_sync_scores()$$
);

-- =============================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================
-- Check if the function works:
--   SELECT should_sync_now();
--
-- Check registered cron jobs:
--   SELECT * FROM cron.job;
--
-- Check recent execution history:
--   SELECT * FROM cron.job_run_details
--   ORDER BY start_time DESC LIMIT 20;
-- =============================================
