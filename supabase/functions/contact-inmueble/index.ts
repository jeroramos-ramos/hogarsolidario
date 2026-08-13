// Registra el click de contacto y devuelve el WhatsApp del inmueble.
// No requiere auth (el teléfono del inmueble es "menos sensible" que el de una familia).

import { handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    const rl = await checkRateLimit(ipHash, 'contact-inmueble', 30, 60);
    if (!rl.ok) return json({ error: 'rate_limited' }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const inmueble_id = typeof body.inmueble_id === 'string' ? body.inmueble_id : null;
    if (!inmueble_id) return json({ error: 'inmueble_id_required' }, { status: 400 });

    const sb = serviceClient();
    const { data: inmueble, error } = await sb
      .from('inmuebles')
      .select('id, telefono, estado, publicado_por')
      .eq('id', inmueble_id)
      .maybeSingle();

    if (error) throw error;
    if (!inmueble || inmueble.estado !== 'activo') {
      return json({ error: 'not_found_or_inactive' }, { status: 404 });
    }

    await sb.from('contactos').insert({
      inmueble_id: inmueble.id,
      origen: 'familia_contacta_inmueble',
    });

    const wa = `https://wa.me/57${inmueble.telefono}`;
    return json({ wa_url: wa, telefono: inmueble.telefono });
  } catch (err) {
    console.error('contact-inmueble error', err);
    return json({ error: 'internal' }, { status: 500 });
  }
});
