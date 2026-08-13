-- Utilidades server-side. NO inserta datos; solo declara funciones.

set search_path = public;

-- ---------- borrar_demos ----------
-- Retira todos los registros seed (identificados por demo_seed=true).
-- Útil incluso en producción por si accidentalmente se corre supabase/seed.sql.
create or replace function borrar_demos()
returns table(inmuebles_borrados integer, solicitudes_borradas integer)
language plpgsql security definer as $$
declare
  v_inm integer;
  v_sol integer;
begin
  with d as (delete from inmuebles   where demo_seed returning 1) select count(*) into v_inm from d;
  with d as (delete from solicitudes where demo_seed returning 1) select count(*) into v_sol from d;
  return query select v_inm, v_sol;
end;
$$;

comment on function borrar_demos() is
  'Borra todos los registros seed (demo_seed=true). Uso: select * from borrar_demos();';

revoke execute on function borrar_demos() from public;
grant  execute on function borrar_demos() to service_role;
