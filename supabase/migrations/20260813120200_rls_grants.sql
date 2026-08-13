-- RLS + grants por columna
--
-- Modelo:
--   1. RLS habilitada en todas las tablas.
--   2. anon: SELECT solo en las vistas públicas. NUNCA en las tablas base.
--   3. anon: INSERT restringido POR COLUMNA — no puede escribir estado, reportes,
--      canon_ref_mediana, verificado_tel, demo_seed, ni motivo_revision.
--      Esto es defensa en profundidad: aunque una policy futura se abra, el grant
--      por columna sigue bloqueando la escritura de campos server-controlados.
--   4. authenticated (magic link de agencia_usuarios): UPDATE limitado sobre sus
--      propios inmuebles (via agencia_id).
--   5. service_role: acceso total (edge functions).

set search_path = public;

-- ---------- habilitar RLS ----------
alter table agencias         enable row level security;
alter table agencia_usuarios enable row level security;
alter table inmuebles        enable row level security;
alter table solicitudes      enable row level security;
alter table contactos        enable row level security;
alter table reportes         enable row level security;
alter table rate_limits      enable row level security;

-- ---------- revocar todo por defecto ----------
revoke all on agencias         from anon, authenticated;
revoke all on agencia_usuarios from anon, authenticated;
revoke all on inmuebles        from anon, authenticated;
revoke all on solicitudes      from anon, authenticated;
revoke all on contactos        from anon, authenticated;
revoke all on reportes         from anon, authenticated;
revoke all on rate_limits      from anon, authenticated;

-- ---------- vistas públicas: SELECT abierto ----------
grant select on inmuebles_publicos   to anon, authenticated;
grant select on solicitudes_publicas to anon, authenticated;

-- Las vistas son con security_invoker: los permisos se resuelven contra las tablas base.
-- Necesitamos SELECT en las tablas base para que las vistas funcionen, PERO solo
-- las columnas que las vistas exponen.
grant select (
  id, publicado_por, quien_nombre, tipo, departamento, municipio, zona, barrio,
  canon, habitaciones, banos, area_m2, disponible_desde, duracion_minima,
  notas, fotos, flags, estado_estructural, created_at, estado
) on inmuebles to anon, authenticated;

grant select (
  id, nombre, adultos, ninos, adultos_mayores, situacion, en_censo,
  departamento, municipio, zona, tipo, habitaciones_min, tope_canon,
  nota, necesidades, created_at, estado
) on solicitudes to anon, authenticated;

-- ---------- policies para SELECT (activo/activa) ----------
create policy inmuebles_select_publico on inmuebles
  for select to anon, authenticated
  using (estado = 'activo');

create policy solicitudes_select_publico on solicitudes
  for select to anon, authenticated
  using (estado = 'activa');

-- ---------- INSERT anónimo restringido POR COLUMNA ----------
-- Nótese que NO se incluyen: estado, reportes, canon_ref_mediana, verificado_tel,
-- demo_seed, motivo_revision, ultima_actualizacion, created_at, id.
-- Aunque una policy futura tire abajo la restricción de fila, Postgres rechazará
-- cualquier INSERT que mencione esas columnas para el rol anon.
grant insert (
  agencia_id, publicado_por, quien_nombre, quien_doc, telefono,
  tipo, departamento, municipio, zona, barrio,
  canon, habitaciones, banos, area_m2,
  disponible_desde, duracion_minima, notas, fotos, flags, estado_estructural
) on inmuebles to anon, authenticated;

grant insert (
  nombre, telefono, adultos, ninos, adultos_mayores,
  situacion, en_censo, departamento, municipio, zona,
  tipo, habitaciones_min, tope_canon, nota, necesidades
) on solicitudes to anon, authenticated;

grant insert (
  tipo_objeto, objeto_id, motivo, detalle
) on reportes to anon, authenticated;

-- Policies WITH CHECK: sanity, no re-escriben la restricción por columna pero cierran
-- el círculo permitiendo la operación cuando pasa por el rol anon.
create policy inmuebles_insert_anon on inmuebles
  for insert to anon, authenticated
  with check (
    publicado_por in ('inmobiliaria','propietario')
    -- Los propietarios NO pueden auto-marcar agencia_id.
    and (publicado_por = 'inmobiliaria' or agencia_id is null)
  );

create policy solicitudes_insert_anon on solicitudes
  for insert to anon, authenticated
  with check (true);

create policy reportes_insert_anon on reportes
  for insert to anon, authenticated
  with check (motivo in ('precio_abusivo','no_existe','pide_dinero_antes','datos_falsos','otro'));

-- ---------- UPDATE ----------
-- anon: nada. authenticated (agencia_usuarios verificados): sus propios inmuebles.
grant update (estado, ultima_actualizacion, notas, fotos, disponible_desde, canon) on inmuebles to authenticated;

create policy inmuebles_update_agencia on inmuebles
  for update to authenticated
  using (
    agencia_id is not null and agencia_id in (
      select agencia_id from agencia_usuarios
      where lower(email) = lower((auth.jwt() ->> 'email')) and verificado = true
    )
  )
  with check (
    -- Solo pueden pasar entre estos estados desde el panel.
    estado in ('activo','arrendado','retirado')
    and agencia_id in (
      select agencia_id from agencia_usuarios
      where lower(email) = lower((auth.jwt() ->> 'email')) and verificado = true
    )
  );

-- Usuarios autenticados pueden leer su propia agencia y sus asesores.
grant select on agencias to authenticated;
grant select on agencia_usuarios to authenticated;

create policy agencias_select_own on agencias
  for select to authenticated
  using (
    id in (
      select agencia_id from agencia_usuarios
      where lower(email) = lower((auth.jwt() ->> 'email')) and verificado = true
    )
  );

create policy agencia_usuarios_select_own on agencia_usuarios
  for select to authenticated
  using (
    agencia_id in (
      select agencia_id from agencia_usuarios
      where lower(email) = lower((auth.jwt() ->> 'email')) and verificado = true
    )
  );

-- ---------- contactos, agencias write, rate_limits ----------
-- Todo cerrado a anon/authenticated. Solo service_role (edge functions y admin) puede tocarlo.
-- service_role bypasea RLS por diseño de Supabase.
