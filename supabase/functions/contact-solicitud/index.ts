// Registra el clic de contacto sobre una solicitud. El teléfono ya está expuesto
// en la vista pública solicitudes_publicas — el cliente arma el link wa.me por su
// cuenta. Esta edge function existe solo para dejar auditoría en la tabla
// `contactos` (fire-and-forget desde el cliente).

import { handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    // 60/h por IP: cotas altas porque cada tarjeta puede generar varios clics
    // legítimos (asesor mira varios, decide, clica). Es solo auditoría, no un
    // gate de acceso — no vale la pena bloquear a nadie por spam de logs.
    const rl = await checkRateLimit(ipHash, 'contact-solicitud', 60, 60);
    if (!rl.ok) return json({ ok: true, throttled: true });

    const body = await req.json().catch(() => ({}));
    const solicitud_id = typeof body.solicitud_id === 'string' ? body.solicitud_id : null;
    if (!solicitud_id) return json({ ok: false }, { status: 400 });

    const sb = serviceClient();
    // No falla si la solicitud fue retirada — el clic ya ocurrió, lo registramos.
    await sb.from('contactos').insert({
      solicitud_id,
      origen: 'usuario_contacta_familia',
    });

    return json({ ok: true });
  } catch (err) {
    console.error('contact-solicitud error', err);
    // Nunca bloqueamos el WhatsApp por un fallo de log.
    return json({ ok: false }, { status: 500 });
  }
});
