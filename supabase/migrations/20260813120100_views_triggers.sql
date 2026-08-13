-- Vistas públicas + triggers de negocio

set search_path = public;

-- ---------- vista pública de inmuebles ----------
-- No expone quien_doc, verificado_tel, canon_ref_mediana, motivo_revision, demo_seed, agencia_id.
-- Sí expone telefono del inmueble (menos sensible que el de una familia; el cliente lo consume
--   via edge function contact-inmueble que registra el click).
create view inmuebles_publicos with (security_invoker=true) as
select
  id,
  publicado_por,
  quien_nombre,
  tipo,
  departamento,
  municipio,
  zona,
  barrio,
  canon,
  habitaciones,
  banos,
  area_m2,
  disponible_desde,
  duracion_minima,
  notas,
  fotos,
  flags,
  estado_estructural,
  created_at
from inmuebles
where estado = 'activo';

-- ---------- vista pública de solicitudes ----------
-- NO expone telefono ni apellido (solo primer nombre — split_part por el primer espacio).
create view solicitudes_publicas with (security_invoker=true) as
select
  id,
  split_part(nombre, ' ', 1) as nombre_corto,
  adultos,
  ninos,
  adultos_mayores,
  situacion,
  en_censo,
  departamento,
  municipio,
  zona,
  tipo,
  habitaciones_min,
  tope_canon,
  nota,
  necesidades,
  created_at
from solicitudes
where estado = 'activa';

-- ---------- trigger: recalcular mediana de canon comparable al insertar/actualizar ----------
-- Regla: mediana de inmuebles activos en el mismo municipio con las mismas habitaciones,
-- excluyendo el propio inmueble. Si hay ≥5 comparables y el canon supera la mediana en más
-- de 30%, marca el aviso en_revision con motivo 'precio_abusivo'.
create or replace function inmuebles_check_precio() returns trigger
language plpgsql as $$
declare
  v_mediana numeric;
  v_count   integer;
begin
  -- No aplica a inmuebles cedidos (canon = 0) ni a los que el server ya marcó.
  if new.canon = 0 then
    new.canon_ref_mediana := null;
    return new;
  end if;

  select
    percentile_cont(0.5) within group (order by canon)::numeric,
    count(*)
  into v_mediana, v_count
  from inmuebles
  where estado = 'activo'
    and municipio = new.municipio
    and habitaciones = new.habitaciones
    and canon > 0
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  new.canon_ref_mediana := case when v_count >= 5 then v_mediana::integer else null end;

  if v_count >= 5 and new.canon > v_mediana * 1.30 then
    new.estado := 'en_revision';
    new.motivo_revision := format(
      'Canon %s supera en más de 30%% la mediana comparable (%s) en %s para %s habitaciones.',
      new.canon, v_mediana::integer, new.municipio, new.habitaciones
    );
  end if;

  return new;
end;
$$;

create trigger inmuebles_check_precio_trg
  before insert or update of canon, municipio, habitaciones on inmuebles
  for each row execute function inmuebles_check_precio();

-- ---------- trigger: al 2° reporte, mover el objeto a en_revision ----------
create or replace function reportes_after_insert() returns trigger
language plpgsql security definer as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from reportes
  where tipo_objeto = new.tipo_objeto and objeto_id = new.objeto_id;

  if new.tipo_objeto = 'inmueble' then
    update inmuebles set reportes = v_count where id = new.objeto_id;
    if v_count >= 2 then
      update inmuebles
         set estado = 'en_revision',
             motivo_revision = coalesce(motivo_revision, format('Retirado tras %s reportes de la comunidad.', v_count))
       where id = new.objeto_id and estado = 'activo';
    end if;
  elsif new.tipo_objeto = 'solicitud' then
    update solicitudes set reportes = v_count where id = new.objeto_id;
    if v_count >= 2 then
      update solicitudes
         set estado = 'en_revision',
             motivo_revision = coalesce(motivo_revision, format('Retirado tras %s reportes de la comunidad.', v_count))
       where id = new.objeto_id and estado = 'activa';
    end if;
  end if;

  return new;
end;
$$;

create trigger reportes_after_insert_trg
  after insert on reportes
  for each row execute function reportes_after_insert();

-- ---------- función: caducar avisos con > 21 días sin actualización ----------
-- La corre un cron desde Supabase (Fase 5) o se puede invocar manualmente desde /admin.
-- caducar_avisos: solo service_role puede invocarla.
create or replace function caducar_avisos() returns integer
language plpgsql security definer as $$
declare
  v_inm integer;
  v_sol integer;
begin
  with u as (
    update inmuebles
       set estado = 'en_revision',
           motivo_revision = coalesce(motivo_revision, 'Sin actualizar hace más de 21 días.')
     where estado = 'activo'
       and ultima_actualizacion < now() - interval '21 days'
     returning 1
  ) select count(*) into v_inm from u;

  with u as (
    update solicitudes
       set estado = 'en_revision',
           motivo_revision = coalesce(motivo_revision, 'Sin actualizar hace más de 21 días.')
     where estado = 'activa'
       and ultima_actualizacion < now() - interval '21 days'
     returning 1
  ) select count(*) into v_sol from u;

  return v_inm + v_sol;
end;
$$;

revoke execute on function caducar_avisos()          from public;
revoke execute on function purge_old_rate_limits()   from public;
grant  execute on function caducar_avisos()          to service_role;
grant  execute on function purge_old_rate_limits()   to service_role;
