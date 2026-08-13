#!/usr/bin/env bash
# Prueba: la anon key no puede leer el teléfono de una familia.
#
# Uso:
#   ./scripts/test-anon-cannot-see-phone.sh
#
# Requiere que exista un .env.local en la raíz del proyecto con:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...
#
# También corre contra Supabase local si están seteadas las vars normales de supabase CLI.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^\s*#' "$ENV_FILE" | grep -E '^(VITE_)?SUPABASE_' | xargs -I {} echo {})
fi

URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "✗ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Configurá .env.local o exportá las vars." >&2
  echo "  (si estás corriendo Supabase local: supabase status → copiá API URL y anon key)"     >&2
  exit 2
fi

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; exit 1; }

echo "→ URL: $URL"
echo

# ─── Test 1 ────────────────────────────────────────────────────────────
# La vista pública NO debe contener la columna 'telefono' en su respuesta.
echo "Test 1: solicitudes_publicas no expone 'telefono'"
resp1=$(curl -sS -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes_publicas?select=*&limit=3")
echo "  respuesta: $(echo "$resp1" | head -c 220)…"
if echo "$resp1" | grep -qE '"telefono"[[:space:]]*:'; then
  fail "la respuesta CONTIENE 'telefono' — el campo se está filtrando"
else
  pass "no aparece 'telefono' en la vista pública"
fi
echo

# ─── Test 2 ────────────────────────────────────────────────────────────
# Pedir el teléfono explícitamente debe fallar (columna no existe en la vista).
echo "Test 2: pedir 'telefono' explícitamente falla"
resp2=$(curl -sS -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes_publicas?select=id,telefono&limit=1")
echo "  respuesta: $(echo "$resp2" | head -c 220)…"
if echo "$resp2" | grep -qE '"code"[[:space:]]*:[[:space:]]*"42703"|column .* does not exist'; then
  pass "la vista rechaza el campo 'telefono' (error 42703)"
elif echo "$resp2" | grep -qE '"telefono"[[:space:]]*:'; then
  fail "la respuesta trajo 'telefono' — filtración clara"
else
  pass "no se devolvió 'telefono' (respuesta: sin datos o error de esquema)"
fi
echo

# ─── Test 3 ────────────────────────────────────────────────────────────
# Consultar la tabla base 'solicitudes' pidiendo 'telefono' con anon key debe fallar
# con permission denied (42501). No basta con devolver filas vacías: exigimos que la
# capa de permisos por columna sea la que rechace la lectura.
echo "Test 3: la tabla base 'solicitudes' rechaza SELECT sobre 'telefono' con 42501"
http3=$(curl -sS -o /tmp/hs-resp3.json -w "%{http_code}" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes?select=id,telefono&limit=1")
resp3=$(cat /tmp/hs-resp3.json)
rm -f /tmp/hs-resp3.json
echo "  HTTP $http3"
echo "  respuesta: $(echo "$resp3" | head -c 220)…"

# PostgREST convierte permission denied en HTTP 401/403. Postgres emite código 42501.
# Exigimos las dos señales para dejar cero ambigüedad.
has_code=$(echo "$resp3" | grep -cE '"code"[[:space:]]*:[[:space:]]*"42501"' || true)
has_msg=$(echo  "$resp3" | grep -ciE 'permission denied' || true)

if [ "$http3" != "401" ] && [ "$http3" != "403" ]; then
  fail "esperábamos HTTP 401/403; recibimos $http3"
fi
if [ "$has_code" -eq 0 ] && [ "$has_msg" -eq 0 ]; then
  fail "no se detectó code=42501 ni 'permission denied' en la respuesta"
fi
if echo "$resp3" | grep -qE '"telefono"[[:space:]]*:[[:space:]]*"[0-9]'; then
  fail "la respuesta contiene un teléfono real"
fi
pass "PostgreSQL rechazó la lectura de 'telefono' por permisos (42501 / permission denied)"
echo

echo "═══════════════════════════════════════════"
echo "✓ TODOS LOS TESTS DE ANONIMATO PASARON"
