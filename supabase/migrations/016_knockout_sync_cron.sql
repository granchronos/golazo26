-- =============================================
-- Migration 016: Cron para sincronizar equipos de knockout
-- =============================================
-- Ejecuta cada hora (minuto 0) y solo llama al endpoint de Vercel
-- si hay partidos de knockout con equipos sin confirmar.
--
-- Requiere: pg_cron, pg_net (habilitados en el Dashboard de Supabase)
-- =============================================

-- 1) Gatekeeper: solo dispara si hay matches knockout con equipos NULL
CREATE OR REPLACE FUNCTION should_sync_knockout_teams()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM matches
    WHERE round IN (
      'round_of_32',
      'round_of_16',
      'quarter_finals',
      'semi_finals',
      'third_place',
      'final'
    )
    AND (home_team_id IS NULL OR away_team_id IS NULL)
  );
END;
$$;

-- 2) Función principal llamada por pg_cron
CREATE OR REPLACE FUNCTION sync_knockout_teams()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
BEGIN
  IF should_sync_knockout_teams() THEN
    PERFORM net.http_get(
      'https://golazo26.vercel.app/api/cron/sync-knockout-teams?secret=yRDGp_G4-4VcHX_'
    );
  END IF;
END;
$$;

-- 3) Registrar el cron: cada hora en el minuto 0
--    (desfasado del smart-sync-scores que corre en */5 para no solaparse)
--
-- Si ya existe, eliminarlo primero:
--   SELECT cron.unschedule('sync-knockout-teams');

SELECT cron.schedule(
  'sync-knockout-teams',
  '0 * * * *',
  $$SELECT sync_knockout_teams()$$
);

-- =============================================
-- VERIFICACIÓN (ejecutar manualmente tras la migración)
-- =============================================
-- Ver cron registrado:
--   SELECT * FROM cron.job WHERE jobname = 'sync-knockout-teams';
--
-- Ver historial de ejecuciones:
--   SELECT * FROM cron.job_run_details
--   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-knockout-teams')
--   ORDER BY start_time DESC LIMIT 20;
--
-- Verificar el gatekeeper manualmente:
--   SELECT should_sync_knockout_teams();
-- =============================================
