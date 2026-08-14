-- Removemos las condiciones "sin fiador" (deudor solidario) y "subsidio"
-- de la base. Ambas eran promesas que la inmobiliaria no puede cumplir:
-- el deudor solidario lo exige la aseguradora del contrato, y el subsidio
-- lo tramita la familia con la alcaldía y la UNGRD.

set search_path = public;

-- 1) Strip de las flags existentes en inmuebles.
update public.inmuebles
   set flags = flags - 'sinFiador' - 'subsidio'
 where flags ? 'sinFiador' or flags ? 'subsidio';

-- 2) Strip de las necesidades existentes en solicitudes.
update public.solicitudes
   set necesidades = necesidades - 'sinFiador' - 'subsidio'
 where necesidades ? 'sinFiador' or necesidades ? 'subsidio';

-- 3) Regenerar la vista inmuebles_stats sin la columna sin_fiador.
-- CREATE OR REPLACE VIEW no permite quitar columnas, así que DROP + CREATE.
drop view if exists public.inmuebles_stats;
create view public.inmuebles_stats as
select
  count(*)::int as total,
  count(distinct municipio)::int as municipios
from public.inmuebles
where estado = 'activo';

grant select on public.inmuebles_stats to anon, authenticated;
