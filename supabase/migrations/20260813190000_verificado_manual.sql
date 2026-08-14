-- Verificación manual del contacto por parte del equipo de Hogar Solidario.
-- Default false. Se marca desde el Table Editor cuando confirmamos al publicante
-- por teléfono. En la UI, cambia el disclosure "publicado por un particular"
-- por un check verde "contacto verificado".

set search_path = public;

alter table public.inmuebles
  add column if not exists verificado_manual boolean not null default false;

-- La vista pública necesita exponer verificado_manual para que el frontend lo
-- lea. CREATE OR REPLACE VIEW en Postgres exige que los nuevos campos vayan
-- al final de la lista existente — respetamos ese orden agregando al cierre.
create or replace view public.inmuebles_publicos as
select
  id,
  publicado_por,
  quien_nombre,
  telefono,
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
  created_at,
  verificado_manual
from public.inmuebles
where estado = 'activo';

-- CREATE OR REPLACE preserva los grants existentes, pero re-declaramos por
-- claridad y seguridad si alguna vez se droppea la vista.
grant select on public.inmuebles_publicos to anon, authenticated;
