// Registra un reporte de abuso. El trigger reportes_after_insert se encarga de
// contar y retirar el aviso automáticamente al 2° reporte.

import { handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient } from '../_shared/supabase.ts';

const MOTIVOS = new Set([
  'precio_abusivo',
  'no_existe',
  'pide_dinero_antes',
  'datos_falsos',
  'otro',
]);
const TIPOS = new Set(['inmueble', 'solicitud']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    const rl = await checkRateLimit(ipHash, 'report', 10, 60);
    if (!rl.ok) return json({ error: 'rate_limited' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const tipo_objeto = String(body.tipo_objeto ?? '');
    const objeto_id = String(body.objeto_id ?? '');
    const motivo = String(body.motivo ?? '');
    const detalle = typeof body.detalle === 'string' ? body.detalle.slice(0, 500) : null;

    if (!TIPOS.has(tipo_objeto)) return json({ error: 'tipo_objeto_invalido' }, { status: 400 });
    if (!MOTIVOS.has(motivo)) return json({ error: 'motivo_invalido' }, { status: 400 });
    if (!/^[0-9a-f-]{36}$/i.test(objeto_id)) return json({ error: 'objeto_id_invalido' }, { status: 400 });

    const sb = serviceClient();
    const { error } = await sb.from('reportes').insert({ tipo_objeto, objeto_id, motivo, detalle });
    if (error) throw error;

    return json({ ok: true });
  } catch (err) {
    console.error('report error', err);
    return json({ error: 'internal' }, { status: 500 });
  }
});
