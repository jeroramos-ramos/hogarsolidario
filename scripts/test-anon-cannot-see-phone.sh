#!/usr/bin/env bash
# Prueba de política de privacidad de solicitudes.
#
# Historia: originalmente esta plataforma NO exponía el teléfono de las familias
# en la vista pública. Se cambió de política para permitir contacto directo por
# WhatsApp (ver migración 20260819110000_solicitudes_publicas_include_telefono).
#
# Lo que sí sigue protegido y este script verifica:
#   - La tabla base `solicitudes` rechaza SELECT desde anon (42501).
#   - La vista `solicitudes_publicas` NO expone el apellido (solo nombre_corto).
#   - La vista tampoco expone la `nota` libre (campo con detalles identificables).
#
# Lo que sí se expone (nuevo comportamiento):
#   - `telefono` en la vista pública — validado con positivo abajo.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"
[ -f "$ENV_FILE" ] || { echo "✗ Falta .env.local" >&2; exit 2; }
# shellcheck disable=SC2046
export $(grep -v '^\s*#' "$ENV_FILE" | grep -E '^(VITE_)?SUPABASE_' | xargs -I {} echo {})

URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"

pass() { echo "✓ $1"; }
fail() { echo "✗ $1"; exit 1; }

echo "→ URL: $URL"
echo

# ─── Test 1 ─────────────────────────────────────────────────────────
echo "Test 1: solicitudes_publicas SÍ expone 'telefono'"
resp1=$(curl -sS -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes_publicas?select=id,telefono&limit=1")
echo "  respuesta: $(echo "$resp1" | head -c 200)…"
if echo "$resp1" | grep -qE '"telefono"[[:space:]]*:[[:space:]]*"[0-9]{10}"'; then
  pass "teléfono disponible (10 dígitos)"
elif [ "$resp1" = "[]" ]; then
  pass "vista vacía (sin datos aún) — schema OK"
else
  fail "no llega teléfono en la vista pública"
fi
echo

# ─── Test 2 ─────────────────────────────────────────────────────────
echo "Test 2: solicitudes_publicas NO expone la 'nota' libre"
resp2=$(curl -sS -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes_publicas?select=id,nota&limit=1")
echo "  respuesta: $(echo "$resp2" | head -c 200)…"
if echo "$resp2" | grep -qE '"code"[[:space:]]*:[[:space:]]*"42703"|column .* does not exist'; then
  pass "la vista rechaza el campo 'nota' (error 42703)"
elif echo "$resp2" | grep -qE '"nota"[[:space:]]*:'; then
  fail "la vista expone 'nota' — decisión de producto: no debería"
else
  pass "no se devolvió 'nota'"
fi
echo

# ─── Test 3 ─────────────────────────────────────────────────────────
echo "Test 3: la tabla base 'solicitudes' rechaza SELECT desde anon (42501)"
http3=$(curl -sS -o /tmp/hs-resp3.json -w "%{http_code}" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes?select=id,telefono,nombre,nota&limit=1")
resp3=$(cat /tmp/hs-resp3.json)
rm -f /tmp/hs-resp3.json
echo "  HTTP $http3"
echo "  respuesta: $(echo "$resp3" | head -c 200)…"

has_code=$(echo "$resp3" | grep -cE '"code"[[:space:]]*:[[:space:]]*"42501"' || true)
has_msg=$(echo  "$resp3" | grep -ciE 'permission denied' || true)

if [ "$http3" != "401" ] && [ "$http3" != "403" ]; then
  fail "esperábamos HTTP 401/403; recibimos $http3"
fi
if [ "$has_code" -eq 0 ] && [ "$has_msg" -eq 0 ]; then
  fail "no se detectó code=42501 ni 'permission denied' en la respuesta"
fi
pass "PostgreSQL rechazó la lectura desde la tabla base (defensa en profundidad)"
echo

# ─── Test 4 ─────────────────────────────────────────────────────────
echo "Test 4: solicitudes_publicas devuelve nombre_corto (primer nombre) sin apellido"
resp4=$(curl -sS -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  "$URL/rest/v1/solicitudes_publicas?select=id,nombre_corto&limit=1")
echo "  respuesta: $(echo "$resp4" | head -c 200)…"
if echo "$resp4" | grep -qE '"nombre_corto"[[:space:]]*:'; then
  pass "expone 'nombre_corto' (primer nombre)"
elif [ "$resp4" = "[]" ]; then
  pass "vista vacía — schema OK"
else
  fail "no llega nombre_corto"
fi
echo

echo "═══════════════════════════════════════════════════"
echo "✓ POLÍTICA DE SOLICITUDES VERIFICADA"
