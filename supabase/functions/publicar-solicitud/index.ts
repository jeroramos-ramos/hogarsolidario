// Fase 2: scaffold. Fase 4 completa la lógica.

import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    const rl = await checkRateLimit(ipHash, 'publicar-solicitud', 3, 60);
    if (!rl.ok) {
      return json(
        { error: 'rate_limited', retry_after_seconds: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter), ...corsHeaders } },
      );
    }

    // TODO (Fase 4): validar zod + insertar en `solicitudes` via service_role.
    return json({ ok: true, message: 'scaffold' }, { status: 202 });
  } catch (err) {
    console.error('publicar-solicitud error', err);
    return json({ error: 'internal' }, { status: 500 });
  }
});
