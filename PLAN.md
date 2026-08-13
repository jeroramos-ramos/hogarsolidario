# Hogar Solidario — Plan de trabajo

Antes de escribir código, este documento fija qué se va a construir, en qué orden y qué asumo. **Necesito tu visto bueno antes de arrancar.** Lee sobre todo la sección "Cambios respecto al prototipo" — ahí es donde te propongo apartarme de lo que ya validaste.

---

## 0 · Estado del setup

- Repositorio: `/Users/jeronimoramos/hogarsolidario` con `git init` hecho, rama `main`.
- Prototipo copiado a `hogarsolidario.html` en la raíz, como referencia viva. No se toca; solo se lee para verificar tokens y textos.
- Supabase: tú vas a crear el proyecto en supabase.com. Yo genero `.env.example` con los nombres esperados; cuando lo tengas, copiás a `.env.local` con URL, `ANON_KEY` y `SERVICE_ROLE_KEY`. Las migraciones se escriben en `supabase/migrations/` y se aplican con `supabase db push` contra tu proyecto.
- Vercel: yo dejo `vercel.json` + docs de deploy en `README.md`. Tú conectás el repo desde el dashboard cuando esté listo.
- SMTP: Resend. Yo dejo la integración con Supabase Auth documentada y los registros DNS (SPF, DKIM, DMARC) que hay que crear en el registrador de `hogarsolidario.co`.

---

## 1 · Cambios respecto al prototipo (aprobados con ajustes 2026-08-13)

**1.1 — Estado estructural: TRI-ESTADO, no booleano.**
Radio con tres opciones sin default; obligatorio:
- `revisado_ingenieria` → badge **verde** "Revisado por ingeniería / gestión del riesgo".
- `sin_danos_aparentes` → badge **neutro** "Sin daños aparentes (declaración del propietario, no dictamen técnico)".
- `sin_revisar` → **advertencia** visible en la ficha "Este inmueble no ha sido revisado tras el sismo — confirme habitabilidad antes de visitar".
Columna: `inmuebles.estado_estructural` con enum `('revisado_ingenieria','sin_danos_aparentes','sin_revisar')`. En el filtro del buscador aparece como chip "Solo revisados por ingeniería".

**1.2 — Teléfono de solicitudes: solo entregado a usuarios verificados.**
La edge function `contact-solicitud` **exige sesión de inmobiliaria verificada** (JWT válido + `agencia_usuarios.verificado = true`). Sin verificación no entrega el número, ni siquiera con logging. La vista pública de solicitudes no incluye `telefono`. Esto afecta al flujo de propietarios (ver 1.4).

**1.3 — Coincidencias: exactas + cercanas.**
Se calculan dos conjuntos por solicitud:
- **Coincidencias exactas**: mismo municipio, `habitaciones ≥ pedidas`, `canon ≤ tope`, y **todas** las banderas necesarias marcadas (incluyendo `subsidio` e `inmediata` — se corrige el bug del prototipo).
- **Coincidencias cercanas**: relajando en `canon ≤ tope * 1.15` **o** `habitaciones ≥ (pedidas - 1)`. Mismo municipio y mismas banderas obligatorias.
La tarjeta muestra ambos números: `"12 exactas · 8 cercanas"`. La lógica vive en `src/lib/matching.ts` con tests.

**1.4 — Propietarios sin OTP: acceso completo con etiqueta + salvaguardas.**
Decisión (agilizar): propietarios publican Y contactan familias sin OTP. La verificación es post-hoc y automática.
- Todo inmueble publicado por rol `propietario` lleva badge visible **"Publicante sin verificar"** (neutro alerta) en tarjeta y ficha, para que la familia decida.
- El botón "Ofrecerle un inmueble" **está habilitado** para propietarios, con estas salvaguardas:
  - Solo aparece si el propietario ha publicado antes al menos un inmueble activo con WhatsApp válido (identidad mínima: el número que declararon).
  - Rate-limit: máx 10 ofertas por hora por teléfono de propietario.
  - Si el mismo teléfono acumula 2+ reportes de familias, se bloquea automáticamente (no puede volver a pulsar "Ofrecer" ni publicar nuevos inmuebles). Queda visible en `/admin` para desbloquear o eliminar.
- Cada contacto se registra en `contactos` con `propietario_tel_hash` para auditoría.
- Cuando activemos OTP (Supabase phone auth), el badge desaparece para verificados y se levanta el rate-limit.

**1.5 — Orden de fases invertido: `/admin` va antes que `/panel`.**
La moderación es más urgente que el auto-servicio de inmobiliarias: si en las primeras horas hay avisos abusivos, alguien tiene que poder retirarlos. Fase 5 pasa a ser `/admin`, Fase 6 (antes 7) es `/panel` con auth. Ver §4 actualizado.

---

**Nuevo (1.6) — Modelo de acceso de inmobiliarias: 1 agencia : N usuarios.**
Una inmobiliaria tiene varios asesores. Tabla nueva `agencia_usuarios (id, agencia_id, email, nombre, verificado, created_at)`. La allowlist es sobre `email` (no sobre `agencia`): el CSV que cargues trae `agencia_nit, agencia_nombre, email_usuario, nombre_usuario`. El magic link se valida contra esta tabla. Todos los usuarios de una agencia ven el mismo inventario en `/panel`.

---

## 2 · Arquitectura fijada

- **App**: Vite + React 18 + TypeScript estricto (`noImplicitAny`, `strictNullChecks`, sin `any`).
- **Router**: React Router v6, SPA con `historyApiFallback`.
- **Estilos**: Tailwind CSS. Tokens del prototipo extraídos a `tailwind.config.ts` (colores `ink`, `ink-2`, `paper`, `line`, `signal`, `verify`, `alert`; radio 4px; fuentes Archivo / IBM Plex Sans / IBM Plex Mono autoalojadas via `@fontsource/*`).
- **Datos**: `@tanstack/react-query` para todo lo que sale del server. Cero estado global.
- **Cliente Supabase**: `@supabase/supabase-js` v2. Dos instancias: pública (anon) para lecturas y RPC, y una interna de auth para inmobiliarias.
- **Formularios**: `react-hook-form` + `zod`. Los schemas de validación se comparten con las edge functions donde aplica.
- **Compresión de imágenes en cliente**: `browser-image-compression` (≤1600px lado largo, WebP, ~200KB).
- **Tests**: `vitest` + solo unit tests de la lógica de negocio (coincidencias, precio abusivo, filtros). Cero tests de UI.
- **Package manager**: pnpm.

Estructura de carpetas:

```
hogarsolidario/
├── public/                     # og:image, favicon, manifest, robots.txt
├── src/
│   ├── data/municipios.ts      # DEPTOS copiado del prototipo, tipado
│   ├── data/flags.ts           # FLAGS + NEEDS del prototipo
│   ├── lib/supabase.ts         # cliente
│   ├── lib/matching.ts         # coincidencias (con tests)
│   ├── lib/pricing.ts          # detección de canon abusivo (con tests)
│   ├── lib/filters.ts          # aplicar filtros a inmuebles (con tests)
│   ├── lib/image.ts            # compresión
│   ├── hooks/                  # useInmuebles, useSolicitudes, useAuth
│   ├── components/             # Card, Badge, Chip, Field, Button, Toast
│   ├── routes/
│   │   ├── Gate.tsx            # /
│   │   ├── Inmuebles.tsx       # /inmuebles
│   │   ├── InmuebleDetalle.tsx # /inmuebles/:id
│   │   ├── Familias.tsx        # /familias
│   │   ├── PublicarInmueble.tsx
│   │   ├── PublicarSolicitud.tsx
│   │   ├── Panel.tsx           # /panel  (auth)
│   │   └── Admin.tsx           # /admin  (service_role)
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 0001_schema.sql
│   │   ├── 0002_rls.sql
│   │   ├── 0003_functions.sql
│   │   └── 0004_seed_agencias.sql  # allowlist de NITs vacía; se llena en runtime
│   └── functions/
│       ├── publicar-inmueble/     # gateway con rate-limit y precio abusivo
│       ├── publicar-solicitud/    # gateway con rate-limit
│       ├── contact-solicitud/     # entrega WhatsApp de familia + registra contacto
│       ├── contact-inmueble/      # solo registra contacto
│       ├── report/                # registra reporte + auto-retira al segundo
│       └── caducar/               # cron: marca en_revision > 21 días
├── .env.example
├── vercel.json
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## 3 · Modelo de datos (SQL exacto se escribe en Fase 2)

Idéntico al brief. Puntos donde amplío para que funcione en producción:

- **`inmuebles.canon_ref_mediana`** (int, nullable): calculado por trigger al insertar. Sirve para explicar al publicador por qué su aviso quedó en revisión. No se muestra al público.
- **`inmuebles.ultima_actualizacion`** (timestamp, default `now()`): dispara la caducidad de 21 días. Se actualiza cuando la inmobiliaria toca el aviso en `/panel`.
- **`solicitudes.ultima_actualizacion`** análogo.
- **Vista `inmuebles_publicos`**: SELECT sin `telefono`, `quien_doc`. Es lo que consume el frontend anónimo. El teléfono del inmueble sí se expone directo (menos sensible que el de una familia) pero via edge function que registra el click.
- **Vista `solicitudes_publicas`**: SELECT sin `telefono`, `nombre` truncado a primer nombre. El botón dispara `contact-solicitud`.
- **Índices**: `(municipio, estado)`, `(municipio, habitaciones, canon)`, `(estado, ultima_actualizacion)`.

**RLS**:
- `inmuebles_publicos`, `solicitudes_publicas`: SELECT público.
- `inmuebles`, `solicitudes`: SELECT solo con `service_role`; INSERT solo desde edge functions (que usan service_role internamente); UPDATE solo `service_role` o (para inmobiliarias autenticadas) fila donde `agencia_id = auth.uid()` correspondiente a su agencia.
- `contactos`, `reportes`: INSERT público con rate-limit por IP; SELECT solo `service_role`.
- `agencias`: SELECT solo `service_role` (allowlist de NITs).

**Rate-limit**: tabla `rate_limits (ip_hash, endpoint, ts)` con índice; las edge functions rechazan si hay más de N inserts en ventana móvil. Umbrales conservadores (5 por hora por endpoint por IP hasheada con SHA-256 + salt).

---

## 4 · Fases de implementación

Al terminar cada fase, te reporto en dos líneas qué quedó funcionando y qué falta.

### Fase 1 — Esqueleto (~1 día)
- `pnpm init`, dependencias, TypeScript estricto.
- `tailwind.config.ts` con los tokens del prototipo.
- Fuentes autoalojadas.
- Estructura de rutas con placeholders.
- `src/data/municipios.ts` y `src/data/flags.ts` con los datos del prototipo, sin cambios.
- Componentes base (Card, Badge, Chip, Field, Button) que reproducen el prototipo pixel-a-pixel.
- **Salida**: `pnpm dev` levanta la puerta (`/`) igualita al prototipo, aunque las otras rutas sean stubs.

### Fase 2 — Backend (~1 día)
- 4 migraciones SQL (schema, RLS, funciones SQL, seed).
- Trigger de mediana + `canon_ref_mediana`.
- Vistas públicas.
- Edge functions vacías pero con auth y rate-limit funcionando.
- **Salida**: `supabase db push` corre limpio. Puedo hacer INSERT/SELECT via curl y el RLS bloquea lo que debe.

### Fase 3 — Buscador y ficha (ruta crítica) (~2 días)
- `/inmuebles` con filtros del prototipo, consumiendo `inmuebles_publicos`.
- `/inmuebles/:id` con galería, badges, advertencia si no revisado, botón WhatsApp que llama a `contact-inmueble`.
- Sin fotos aún (solo placeholder).
- Loading states, empty states, error states.
- **Salida**: una familia con celular gama baja puede buscar y ver detalles. Lighthouse mobile ≥ 90 en performance.

### Fase 4 — Publicación y fotos (~2 días)
- `/publicar/inmueble` (para inmobiliaria y propietario, con las diferencias del prototipo).
- `/publicar/solicitud`.
- Compresión y subida de hasta 6 fotos al bucket `inmuebles`.
- Edge functions `publicar-inmueble` y `publicar-solicitud` con validación zod compartida.
- Regla anti-especulación se activa aquí (más detalle en Fase 7, pero la marca la edge function).
- **Salida**: se puede publicar sin cuenta desde el móvil, subiendo fotos, y aparecer en el buscador en ≤5 segundos.

### Fase 5 — Moderación (`/admin`, precio abusivo, caducidad) (~1 día)
- `/admin` accesible con `service_role` en header (no login público).
  - Tabla de `agencia_usuarios` pendientes → verificar (marca `verificado = true`).
  - Tabla de reportes → retirar aviso, marcar falso.
  - Tabla de avisos `en_revision` con motivo (precio abusivo, caducado, reportado, sin estado estructural).
- Cron diario en Supabase que llama a `caducar` (marca `>21 días` como `en_revision`).
- `src/lib/pricing.ts` con la regla del 30% sobre mediana y umbral mínimo de 5 comparables. Test unitario.
- **Salida**: la plataforma tiene volante de moderación desde el día 1. Los avisos viejos caen solos.

### Fase 6 — Auth inmobiliarias y panel (~1.5 días)
- Magic link contra `agencia_usuarios` (allowlist cargada por CSV desde `/admin`).
- Resend en Supabase Auth con `acceso@hogarsolidario.co` como remitente.
- `/panel`: inventario de la agencia (todos los usuarios ven el mismo), botón "marcar arrendado", contador de reportes por aviso, botón "renovar" (actualiza `ultima_actualizacion`).
- **Salida**: los asesores de una inmobiliaria pueden loguearse, ver su inventario compartido y marcar avisos.

### Fase 7 — Tablero de demanda (~0.5 día)
- `/familias` con las tarjetas del prototipo.
- Contador de coincidencias exactas + cercanas (usa `src/lib/matching.ts`).
- Filtro por municipio.
- Botón "Ofrecerle un inmueble" habilitado solo para sesión de inmobiliaria verificada. Para propietarios, deshabilitado con tooltip (ver 1.4).
- **Salida**: las inmobiliarias verificadas ven la demanda real con contactos accesibles.

### Fase 8 — A11y, 3G, deploy (~1 día)
- Auditoría de accesibilidad: contraste, `alt`, teclado, roles ARIA en tabs y modales.
- Imágenes con `loading="lazy"`, `srcset`, tamaños fijos para no reflows.
- Pre-render de `/` y `/inmuebles` con SSG mínimo (via `vite-plugin-ssr` o simplemente HTML estático servido con hidratación) — solo si la métrica lo pide.
- OG image 1200×630 generada con los tokens (Figma o script node + Satori). Manifest, favicon, robots.
- Deploy en Vercel, dominio conectado, HTTPS con HSTS, DNS de Resend documentado en README.
- **Salida**: `hogarsolidario.co` sirve en producción, carga bajo 3s en 3G simulado, se ve bien en WhatsApp preview.

---

## 5 · Lo que NO voy a hacer (para evitar sorpresas)

- No agrego SSR salvo pre-render estático de la puerta y del listado.
- No agrego búsqueda semántica ni geo por radio — filtros del prototipo son suficientes para MVP.
- No hago sistema de mensajes internos — el contacto es WhatsApp, punto.
- No implemento subsidio de arriendo — el prototipo aclara y yo mantengo: eso lo tramitan la alcaldía, la UNGRD y el Ministerio.
- No hago tests de UI ni e2e — solo lógica de negocio.
- No agrego analítica de terceros (GA, Meta pixel). Un contador propio en `contactos` es todo lo que necesitamos para medir.

---

## 6 · Riesgos y dependencias

- **DNS de `hogarsolidario.co`**: los registros SPF/DKIM/DMARC de Resend deben propagarse antes de que los magic links funcionen. Puede tomar hasta 24h. Lo dejo documentado, tú lo aplicás.
- **Costos Supabase**: en free tier caben ~500MB DB y 1GB Storage. Con fotos comprimidas a 200KB × 6 × 500 avisos ≈ 600MB. Si crece más rápido, hay que subir a plan Pro (~$25/mes).
- **Rate-limit y bots**: hasheo IP+salt para no guardar IPs planas, pero un bot con proxies puede saltar el rate-limit. Si vemos abuso, agregamos Turnstile de Cloudflare.
- **Allowlist de inmobiliarias**: alguien tiene que cargar los NITs en `agencias`. ¿Sos tú? ¿Hay una lista fuente (Fedelonjas, Camacol)? Decidilo antes de la Fase 5.

---

## Decisiones tomadas (2026-08-13)

- **Cambios sección 1**: aprobados con los ajustes descritos arriba.
- **Allowlist inmobiliarias**: CSV cargado por el usuario desde `/admin`, con esquema `agencia_nit, agencia_nombre, email_usuario, nombre_usuario` (una agencia, N usuarios — tabla `agencia_usuarios`).
- **OG image**: estático, fondo `#0F2A2E`, sin fotos del terremoto. Diseño con los tokens de la marca.
- **Correos** (Resend con DNS del dominio):
  - `hola@hogarsolidario.co` — remitente público, visible en footer, cualquier email informativo.
  - `acceso@hogarsolidario.co` — remitente único de magic links a inmobiliarias. Cero uso público.
  - `reportes@hogarsolidario.co` — buzón para que la gente escriba a reportar abusos. No envía.

Fase 1 arranca ya.
