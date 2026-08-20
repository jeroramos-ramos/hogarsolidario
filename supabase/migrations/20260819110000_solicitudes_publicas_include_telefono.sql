-- Cambio de política: el WhatsApp de la solicitud pasa a ser público.
-- Sin auth funcional para inmobiliarias, restringirlo dejaba a las familias
-- sin canal de contacto real. Se privilegia utilidad sobre protección de scraping.
--
-- Lo que sigue privado (no en la vista):
--   - nombre completo (solo primer nombre via split_part)
--   - nota (campo libre con detalles identificables)
--
-- El clic de contacto sigue registrándose en `contactos` para auditoría, ahora
-- vía llamada fire-and-forget desde el <a href="wa.me/...">.

set search_path = public;

create or replace view public.solicitudes_publicas as
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
  necesidades,
  created_at,
  telefono
from public.solicitudes
where estado = 'activa';

grant select on public.solicitudes_publicas to anon, authenticated;
