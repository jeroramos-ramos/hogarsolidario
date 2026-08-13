-- Fix de seguridad: la vista pública era invocador-security, lo que exigía a anon
-- tener SELECT column-level sobre solicitudes.nombre (para que split_part funcione).
-- Eso volvía la vista inútil: cualquiera con la anon key podía consultar la tabla
-- base y sacar nombre completo + municipio + zona + situación de cada familia.
--
-- Corrección:
--   1. Recrear las vistas como SECURITY DEFINER (el default de Postgres). Corren como
--      el owner (postgres) y bypasean RLS de la tabla base. La curación ocurre en el
--      SELECT de la vista.
--   2. Revocar TODOS los grants de column-level SELECT que anon tenía sobre las tablas
--      base solicitudes/inmuebles. Anon solo puede tocar las vistas.
--   3. Retirar `nota` de solicitudes_publicas: las familias escriben datos identificables
--      ahí ("mi mamá usa caminador", "trabajo cerca al colegio X"). Solo inmobiliarias
--      verificadas verán `nota`, via SELECT autenticado.
--   4. Retirar `notas` de inmuebles_publicos también? NO: describe el inmueble, no
--      a personas identificables. Se mantiene.

set search_path = public;

-- ---------- revocar acceso base-table de anon ----------
revoke select on inmuebles   from anon;
revoke select on solicitudes from anon;

-- Las policies de SELECT sobre anon quedan sin efecto (no hay grant), pero las
-- dejamos declaradas por claridad: si un mantenedor futuro reintroduce un grant,
-- la policy sigue restringiendo a estado activo.

-- ---------- recrear vistas sin security_invoker ----------
drop view if exists inmuebles_publicos;
drop view if exists solicitudes_publicas;

-- inmuebles_publicos: mismos campos que antes (sin quien_doc, verificado_tel,
-- canon_ref_mediana, motivo_revision, demo_seed, agencia_id). Corre como owner:
-- la única fuente que llega a anon es esta proyección + el WHERE.
create view inmuebles_publicos as
select
  id,
  publicado_por,
  quien_nombre,
  telefono,           -- expuesto: es cómo se contacta el inmueble
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
  notas,              -- describe el inmueble, no identifica personas
  fotos,
  flags,
  estado_estructural,
  created_at
from inmuebles
where estado = 'activo';

-- solicitudes_publicas: nombre corto (primer nombre) + campos de match. NO expone
-- telefono ni nombre completo ni nota (todos con contenido identificable).
create view solicitudes_publicas as
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
  -- nota: retirada. Solo inmobiliarias verificadas la ven via SELECT autenticado.
  necesidades,
  created_at
from solicitudes
where estado = 'activa';

-- ---------- grants sobre las vistas ----------
grant select on inmuebles_publicos   to anon, authenticated;
grant select on solicitudes_publicas to anon, authenticated;

-- ---------- authenticated (inmobiliaria verificada) sigue con acceso ampliado ----------
-- Reafirmamos los grants para authenticated sobre las tablas base — /panel los necesita.
-- (No estaban en riesgo: los revoke arriba fueron solo para anon.)
grant select on inmuebles   to authenticated;
grant select on solicitudes to authenticated;

-- Las policies existentes (inmuebles_select_publico WHERE estado='activo',
-- solicitudes_select_publico WHERE estado='activa') gobiernan lo que ve authenticated.
-- Para /panel (agencia ve su propio inventario incluyendo en_revision/arrendado),
-- agregamos policy adicional:
create policy inmuebles_select_agencia on inmuebles
  for select to authenticated
  using (
    agencia_id is not null and agencia_id in (
      select agencia_id from agencia_usuarios
      where lower(email) = lower((auth.jwt() ->> 'email')) and verificado = true
    )
  );
