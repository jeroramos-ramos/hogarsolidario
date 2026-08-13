#!/usr/bin/env bash
# Prueba end-to-end del auto-retiro al 2° reporte.
#
# 1. Publica un inmueble de prueba via edge function publicar-inmueble.
# 2. Confirma que aparece en solicitudes_publicas (activo).
# 3. Manda 1 reporte → sigue activo.
# 4. Manda 2° reporte → el trigger reportes_after_insert debería marcarlo
#    en_revision y desaparecer del buscador público.
# 5. Limpia el inmueble creado (via service_role para bypasear RLS).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ -f "$ROOT/.env.local" ] || { echo "✗ falta .env.local"; exit 2; }
# shellcheck disable=SC2046
export $(grep -v '^\s*#' "$ROOT/.env.local" | grep -E '^(VITE_)?SUPABASE_' | xargs -I {} echo {})

URL="$VITE_SUPABASE_URL"
ANON="$VITE_SUPABASE_ANON_KEY"
SR="$SUPABASE_SERVICE_ROLE_KEY"

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; exit 1; }

echo "→ URL: $URL"
echo

# ─── Paso 1: publicar ────────────────────────────────────────────
echo "1) Publicar inmueble de prueba (edge function publicar-inmueble)"
PAYLOAD='{
  "publicado_por": "propietario",
  "quien_nombre": "TEST AUTO RETIRO",
  "telefono": "3000000000",
  "tipo": "Apartamento",
  "departamento": "Caldas",
  "municipio": "Manizales",
  "zona": "Centro",
  "barrio": "TEST-AUTO-RETIRO",
  "canon": 750000,
  "habitaciones": 2,
  "banos": 1,
  "fotos": [],
  "flags": {"inmediata": true},
  "estado_estructural": "sin_danos_aparentes"
}'
RESP=$(curl -sS -X POST "$URL/functions/v1/publicar-inmueble" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON" \
  -H "apikey: $ANON" \
  -d "$PAYLOAD")
INM_ID=$(echo "$RESP" | grep -oE '"id":"[0-9a-f-]{36}"' | head -1 | cut -d'"' -f4)
[ -n "$INM_ID" ] || fail "no se pudo publicar. Respuesta: $RESP"
pass "publicado con id $INM_ID"
echo

# ─── Paso 2: aparece en la vista pública ─────────────────────────
echo "2) Aparece en solicitudes_publicas (activo)"
sleep 1
LIST=$(curl -sS -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  "$URL/rest/v1/inmuebles_publicos?id=eq.$INM_ID&select=id")
echo "$LIST" | grep -q "$INM_ID" && pass "visible" || fail "no aparece: $LIST"
echo

# ─── Paso 3: primer reporte ──────────────────────────────────────
echo "3) Primer reporte → debe seguir activo"
R1=$(curl -sS -X POST "$URL/functions/v1/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON" \
  -H "apikey: $ANON" \
  -d "{\"tipo_objeto\":\"inmueble\",\"objeto_id\":\"$INM_ID\",\"motivo\":\"datos_falsos\"}")
echo "  resp: $R1"
echo "$R1" | grep -q '"ok":true' || fail "el reporte no se aceptó"

sleep 1
STATE1=$(curl -sS -H "apikey: $SR" -H "Authorization: Bearer $SR" \
  "$URL/rest/v1/inmuebles?id=eq.$INM_ID&select=estado,reportes,motivo_revision")
echo "  estado: $STATE1"
echo "$STATE1" | grep -qE '"estado":"activo"' && pass "sigue activo" || fail "no sigue activo"
echo "$STATE1" | grep -qE '"reportes":1' && pass "reportes=1" || fail "reportes != 1"
echo

# ─── Paso 4: segundo reporte ────────────────────────────────────
echo "4) Segundo reporte → trigger auto-retira a en_revision"
R2=$(curl -sS -X POST "$URL/functions/v1/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON" \
  -H "apikey: $ANON" \
  -d "{\"tipo_objeto\":\"inmueble\",\"objeto_id\":\"$INM_ID\",\"motivo\":\"pide_dinero_antes\"}")
echo "  resp: $R2"
echo "$R2" | grep -q '"ok":true' || fail "el reporte no se aceptó"

sleep 1
STATE2=$(curl -sS -H "apikey: $SR" -H "Authorization: Bearer $SR" \
  "$URL/rest/v1/inmuebles?id=eq.$INM_ID&select=estado,reportes,motivo_revision")
echo "  estado: $STATE2"
echo "$STATE2" | grep -qE '"estado":"en_revision"' && pass "estado=en_revision" || fail "el trigger no cambió el estado"
echo "$STATE2" | grep -qE '"reportes":2'         && pass "reportes=2"           || fail "reportes != 2"

# Comprobamos también que desapareció del buscador público
PUBAFTER=$(curl -sS -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  "$URL/rest/v1/inmuebles_publicos?id=eq.$INM_ID&select=id")
echo "  público post-retiro: $PUBAFTER"
[ "$PUBAFTER" = "[]" ] && pass "ya no aparece en inmuebles_publicos" || fail "sigue visible al público"
echo

# ─── Cleanup ────────────────────────────────────────────────────
echo "5) Cleanup (service_role)"
curl -sS -X DELETE "$URL/rest/v1/reportes?objeto_id=eq.$INM_ID" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR" > /dev/null
curl -sS -X DELETE "$URL/rest/v1/inmuebles?id=eq.$INM_ID" \
  -H "apikey: $SR" -H "Authorization: Bearer $SR" > /dev/null
pass "inmueble y reportes de prueba borrados"

echo
echo "══════════════════════════════════════════════"
echo "✓ AUTO-RETIRO AL 2° REPORTE FUNCIONA END-TO-END"
