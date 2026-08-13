-- Hogar Solidario · schema base
-- Estado estructural: text + CHECK (no enum nativo — se anticipa un cuarto estado).

set search_path = public;

-- ---------- extensiones ----------
create extension if not exists pgcrypto;

-- ---------- agencias ----------
create table agencias (
  id             uuid primary key default gen_random_uuid(),
  nit            text not null unique,
  nombre         text not null,
  ciudad         text,
  contacto_nombre text,
  telefono       text,
  email          text,
  verificada     boolean not null default false,
  created_at     timestamptz not null default now()
);

-- ---------- agencia_usuarios (1 agencia : N asesores) ----------
create table agencia_usuarios (
  id         uuid primary key default gen_random_uuid(),
  agencia_id uuid not null references agencias(id) on delete cascade,
  email      text not null unique,
  nombre     text,
  verificado boolean not null default false,
  created_at timestamptz not null default now()
);

create index agencia_usuarios_agencia_idx on agencia_usuarios(agencia_id);

-- ---------- inmuebles ----------
create table inmuebles (
  id                  uuid primary key default gen_random_uuid(),
  agencia_id          uuid references agencias(id) on delete set null,
  publicado_por       text not null check (publicado_por in ('inmobiliaria','propietario')),
  quien_nombre        text not null,
  quien_doc           text,
  telefono            text not null,
  tipo                text not null,
  departamento        text not null,
  municipio           text not null,
  zona                text,
  barrio              text not null,
  canon               integer not null check (canon >= 0),
  habitaciones        integer not null check (habitaciones >= 0),
  banos               integer not null check (banos >= 0),
  area_m2             integer check (area_m2 is null or area_m2 > 0),
  disponible_desde    text,
  duracion_minima     text,
  notas               text,
  fotos               text[] not null default '{}',
  flags               jsonb not null default '{}'::jsonb,
  -- Estado estructural: text con CHECK (anticipando un 4to estado).
  estado_estructural  text not null
    check (estado_estructural in ('revisado_ingenieria','sin_danos_aparentes','sin_revisar')),
  -- Estado del aviso: server-controlado, nunca lo pone el cliente.
  estado              text not null default 'activo'
    check (estado in ('activo','en_revision','arrendado','retirado')),
  -- Motivo cuando pasa a en_revision (para mostrar al publicante y en /admin).
  motivo_revision     text,
  reportes            integer not null default 0 check (reportes >= 0),
  canon_ref_mediana   integer,          -- lo escribe el trigger, nunca el cliente
  verificado_tel      boolean not null default false, -- OTP futuro
  demo_seed           boolean not null default false,
  ultima_actualizacion timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index inmuebles_mun_estado_idx    on inmuebles(municipio, estado);
create index inmuebles_mun_hab_canon_idx on inmuebles(municipio, habitaciones, canon);
create index inmuebles_estado_ua_idx     on inmuebles(estado, ultima_actualizacion);
create index inmuebles_agencia_idx       on inmuebles(agencia_id);

-- ---------- solicitudes ----------
create table solicitudes (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  telefono            text not null,
  adultos             integer not null default 1 check (adultos >= 0),
  ninos               integer not null default 0 check (ninos >= 0),
  adultos_mayores     integer not null default 0 check (adultos_mayores >= 0),
  situacion           text,
  en_censo            text not null default 'tramite'
    check (en_censo in ('si','no','tramite')),
  departamento        text not null,
  municipio           text not null,
  zona                text,
  tipo                text not null,
  habitaciones_min    integer not null default 1 check (habitaciones_min >= 1),
  tope_canon          integer not null default 0 check (tope_canon >= 0),
  nota                text,
  necesidades         jsonb not null default '{}'::jsonb,
  estado              text not null default 'activa'
    check (estado in ('activa','resuelta','retirada','en_revision')),
  motivo_revision     text,
  reportes            integer not null default 0 check (reportes >= 0),
  demo_seed           boolean not null default false,
  ultima_actualizacion timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index solicitudes_mun_estado_idx on solicitudes(municipio, estado);
create index solicitudes_estado_ua_idx  on solicitudes(estado, ultima_actualizacion);

-- ---------- contactos (auditoría de clics de contacto) ----------
create table contactos (
  id             uuid primary key default gen_random_uuid(),
  inmueble_id    uuid references inmuebles(id) on delete set null,
  solicitud_id   uuid references solicitudes(id) on delete set null,
  origen         text not null check (origen in ('familia_contacta_inmueble','usuario_contacta_familia')),
  -- Hash del teléfono del propietario (SHA-256 con salt) para bloqueo cruzado sin exponer datos.
  propietario_tel_hash text,
  created_at     timestamptz not null default now()
);

create index contactos_inmueble_idx  on contactos(inmueble_id);
create index contactos_solicitud_idx on contactos(solicitud_id);
create index contactos_propi_idx     on contactos(propietario_tel_hash);

-- ---------- reportes ----------
create table reportes (
  id            uuid primary key default gen_random_uuid(),
  tipo_objeto   text not null check (tipo_objeto in ('inmueble','solicitud')),
  objeto_id     uuid not null,
  motivo        text not null check (motivo in ('precio_abusivo','no_existe','pide_dinero_antes','datos_falsos','otro')),
  detalle       text,
  created_at    timestamptz not null default now()
);

create index reportes_objeto_idx on reportes(tipo_objeto, objeto_id);

-- ---------- rate_limits (IP hasheada + endpoint + timestamp) ----------
create table rate_limits (
  ip_hash    text not null,
  endpoint   text not null,
  ts         timestamptz not null default now(),
  primary key (ip_hash, endpoint, ts)
);

create index rate_limits_endpoint_ts_idx on rate_limits(endpoint, ts);
-- Limpieza de registros viejos (>24h). Se puede llamar desde un cron.
create or replace function purge_old_rate_limits() returns void
language sql security definer as $$
  delete from rate_limits where ts < now() - interval '24 hours';
$$;
