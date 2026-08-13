// Fase 2: scaffold. La lógica de negocio completa (validación zod + subida de fotos)
// se implementa en Fase 4. Este handler ya trae CORS, rate-limit y el gateway al service_role.

import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    const rl = await checkRateLimit(ipHash, 'publicar-inmueble', 5, 60);
    if (!rl.ok) {
      return json(
        { error: 'rate_limited', retry_after_seconds: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter), ...corsHeaders } },
      );
    }

    // TODO (Fase 4): validar payload con zod, insertar en `inmuebles` via service_role,
    // manejar upload de fotos al bucket, disparar mediana automáticamente por el trigger.
    return json({ ok: true, message: 'scaffold' }, { status: 202 });
  } catch (err) {
    console.error('publicar-inmueble error', err);
    return json({ error: 'internal' }, { status: 500 });
  }
});
