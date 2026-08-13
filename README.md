# Hogar Solidario

Plataforma de emergencia para conectar familias sin vivienda por el terremoto del 10 de agosto de 2026 con inmobiliarias y propietarios que ofrecen inmuebles en Valle, Eje Cafetero y Chocó.

Dominio de producción: **hogarsolidario.co**

## Stack

- Vite + React 18 + TypeScript estricto
- Tailwind CSS con tokens del prototipo
- Supabase (Postgres + Auth + Storage + Edge Functions)
- Vercel + dominio ápex `hogarsolidario.co`
- pnpm

## Setup local

```sh
pnpm install
cp .env.example .env.local     # llenar con las creds de tu proyecto Supabase
pnpm dev                       # http://localhost:5173
```

## Trabajo con Supabase

### 1) Aplicar migraciones a un proyecto remoto

```sh
supabase login                                       # una vez
supabase link --project-ref <ref-del-proyecto>       # una vez
supabase db push                                     # aplica supabase/migrations/*.sql
```

### 2) Levantar Supabase local (opcional, requiere Docker)

```sh
supabase start                 # boots Postgres + Auth + Storage + Studio
supabase status                # muestra API URL, anon key, service_role key
supabase db reset              # aplica migrations desde cero + corre el seed
```

### 3) Deploy de edge functions

```sh
supabase secrets set RL_SALT=<32chars-random>
supabase secrets set CRON_SECRET=<random>
supabase functions deploy publicar-inmueble
supabase functions deploy publicar-solicitud
supabase functions deploy contact-inmueble
supabase functions deploy contact-solicitud
supabase functions deploy report
supabase functions deploy caducar
```

### 4) Programar caducidad automática (pg_cron)

`caducar_avisos()` marca `en_revision` los avisos con más de 21 días sin actualización. El cron va **por pg_cron dentro de Supabase**, no por Vercel — así no dependemos de que la app esté desplegada ni de un HTTP hop:

```sh
# aplicar una sola vez, cuando el proyecto esté vivo
supabase db execute --file supabase/cron.sql
```

Ejecuta diariamente a las 3am hora Colombia (`0 8 * * *` UTC). El script es idempotente: re-correrlo re-programa.

Para verificar / desprogramar, ver los comandos comentados al final de [`supabase/cron.sql`](supabase/cron.sql).

La edge function `caducar` sigue existiendo pero solo para triggering manual desde `/admin` (Fase 5).

### 5) Datos de demo (opcional, solo dev)

El seed vive en `supabase/seed.sql` (fuera de `migrations/` a propósito: no debe correr en producción).

- Local: `supabase db reset` lo aplica automáticamente después de las migraciones.
- Remoto (staging): correlo a mano con `psql "$DB_URL" < supabase/seed.sql`.
- Para borrarlo todo (identificado por `demo_seed=true`):
  ```sql
  select * from borrar_demos();  -- devuelve (inmuebles_borrados, solicitudes_borradas)
  ```

## Pruebas

### La anon key no puede leer el teléfono de una familia

```sh
./scripts/test-anon-cannot-see-phone.sh
```

El script corre tres pruebas contra la URL/key del `.env.local`:
1. La vista `solicitudes_publicas` no incluye el campo `telefono`.
2. Pedir `telefono` explícitamente devuelve error `42703` (column does not exist).
3. Consultar la tabla base `solicitudes` no devuelve teléfonos reales (grants por columna).

### Unit tests de lógica de negocio (a partir de Fase 3)

```sh
pnpm test
```

## DNS y correos (Resend)

Para que los magic links de inmobiliarias no caigan en spam, en el registrador del dominio hay que crear:

| Registro | Tipo | Valor |
|---|---|---|
| `hogarsolidario.co` | `MX` | `feedback-smtp.us-east-1.amazonses.com` (Resend te da el exacto) |
| `hogarsolidario.co` | `TXT` (SPF) | `v=spf1 include:amazonses.com ~all` |
| `resend._domainkey.hogarsolidario.co` | `TXT` (DKIM) | (te lo genera Resend) |
| `_dmarc.hogarsolidario.co` | `TXT` (DMARC) | `v=DMARC1; p=quarantine; rua=mailto:reportes@hogarsolidario.co` |

Correos configurados:
- `hola@hogarsolidario.co` — remitente público, footer.
- `acceso@hogarsolidario.co` — remitente único de magic links.
- `reportes@hogarsolidario.co` — buzón receptor de abusos.

En Supabase Auth → SMTP Settings: usar Resend con `acceso@hogarsolidario.co` como sender.

## Deploy en Vercel

1. Conectar el repo desde el dashboard de Vercel.
2. Framework preset: **Vite**. Build command: `pnpm build`. Output: `dist`.
3. Env vars: copiar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` al Production environment.
4. Dominios: agregar `hogarsolidario.co` (apex) como principal, con `www.hogarsolidario.co` → 301 al apex.
5. HTTPS: forzado. HSTS activado en `vercel.json`.

## Estructura

```
hogarsolidario/
├── PLAN.md                    ← plan de fases y decisiones
├── hogarsolidario.html        ← prototipo original (referencia viva)
├── src/                       ← app React
├── supabase/
│   ├── config.toml
│   ├── migrations/            ← SQL versionado, se aplica con db push
│   └── functions/             ← edge functions Deno
└── scripts/
    └── test-anon-cannot-see-phone.sh
```
