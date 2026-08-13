-- Disparador programado para caducar_avisos().
--
-- NO se incluye en supabase/migrations/ porque programar cron jobs en producción
-- es una decisión operativa: activá esto una sola vez cuando el proyecto esté vivo.
--
-- Aplicar desde el SQL Editor del dashboard de Supabase, O con:
--   supabase db execute --file supabase/cron.sql
--
-- Requiere extensión pg_cron (disponible en todos los planes de Supabase incluyendo free).

-- ---------- habilitar pg_cron ----------
create extension if not exists pg_cron with schema extensions;

-- ---------- schedule diario: 3am hora Colombia = 8am UTC ----------
-- Si el job ya existe, lo re-programa (idempotente).
select cron.schedule(
  'hs_caducar_avisos',                 -- nombre único del job
  '0 8 * * *',                         -- 08:00 UTC = 03:00 Colombia (UTC-5)
  $$select public.caducar_avisos();$$  -- lo corre como service_role (usuario del cron)
);

-- ---------- verificar ----------
-- select * from cron.job;             -- lista jobs activos
-- select * from cron.job_run_details  -- historial de ejecuciones
--   order by start_time desc limit 5;

-- ---------- desprogramar ----------
-- select cron.unschedule('hs_caducar_avisos');
