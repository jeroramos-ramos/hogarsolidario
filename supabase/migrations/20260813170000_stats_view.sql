-- Vista pública de estadísticas para el banner de la puerta.
-- security definer (default) para bypasear RLS y agregar sin exponer filas.

set search_path = public;

drop view if exists inmuebles_stats;
create view inmuebles_stats as
select
  count(*)::int as total,
  count(*) filter (where flags @> '{"sinFiador":true}'::jsonb)::int as sin_fiador,
  count(distinct municipio)::int as municipios
from inmuebles
where estado = 'activo';

grant select on inmuebles_stats to anon, authenticated;
