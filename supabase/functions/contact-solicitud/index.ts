// Entrega el teléfono de una familia SOLO a quien pueda ver ese dato:
//   (a) usuario autenticado como asesor de agencia_usuarios con verificado=true, o
//   (b) propietario "identificado por posesión" — que tenga un inmueble activo publicado
//       con el teléfono declarado, sin acumular reportes recientes.
// Cada entrega queda registrada en `contactos`.

import { handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient, callerClient } from '../_shared/supabase.ts';

type Body = {
  solicitud_id?: unknown;
  // Propietarios sin sesión aportan su tel para ser "identificados por posesión".
  propietario_telefono?: unknown;
};

const MAX_OFERTAS_HORA_POR_PROPIETARIO = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    const rl = await checkRateLimit(ipHash, 'contact-solicitud', 30, 60);
    if (!rl.ok) return json({ error: 'rate_limited' }, { status: 429 });

    const body = (await req.json().catch(() => ({}))) as Body;
    const solicitud_id = typeof body.solicitud_id === 'string' ? body.solicitud_id : null;
    if (!solicitud_id) return json({ error: 'solicitud_id_required' }, { status: 400 });

    const sb = serviceClient();
    const { data: solicitud, error: sErr } = await sb
      .from('solicitudes')
      .select('id, telefono, nombre, estado')
      .eq('id', solicitud_id)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!solicitud || solicitud.estado !== 'activa') {
      return json({ error: 'not_found_or_inactive' }, { status: 404 });
    }

    // -------- vía A: sesión de asesor verificado --------
    let allowed = false;
    let propietarioTelHash: string | null = null;

    const caller = callerClient(req);
    const { data: userData } = await caller.auth.getUser();
    const email = userData?.user?.email?.toLowerCase() ?? null;
    if (email) {
      const { data: asesor } = await sb
        .from('agencia_usuarios')
        .select('id, verificado')
        .ilike('email', email)
        .maybeSingle();
      if (asesor?.verificado) allowed = true;
    }

    // -------- vía B: propietario con inmueble activo declarando su tel --------
    if (!allowed) {
      const tel = typeof body.propietario_telefono === 'string'
        ? body.propietario_telefono.replace(/\D/g, '')
        : '';
      if (tel.length === 10) {
        const { data: inmueble } = await sb
          .from('inmuebles')
          .select('id')
          .eq('publicado_por', 'propietario')
          .eq('telefono', tel)
          .eq('estado', 'activo')
          .limit(1)
          .maybeSingle();
        if (inmueble) {
          // Chequeo: en la última hora este propietario no puede exceder N ofertas.
          const enc = new TextEncoder().encode(`propi:${tel}`);
          const digest = await crypto.subtle.digest('SHA-256', enc);
          propietarioTelHash = Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');

          const since = new Date(Date.now() - 60 * 60_000).toISOString();
          const { count } = await sb
            .from('contactos')
            .select('*', { count: 'exact', head: true })
            .eq('propietario_tel_hash', propietarioTelHash)
            .gte('created_at', since);

          if ((count ?? 0) >= MAX_OFERTAS_HORA_POR_PROPIETARIO) {
            return json({ error: 'propietario_rate_limited' }, { status: 429 });
          }
          allowed = true;
        }
      }
    }

    if (!allowed) return json({ error: 'not_authorized' }, { status: 403 });

    await sb.from('contactos').insert({
      solicitud_id: solicitud.id,
      origen: 'usuario_contacta_familia',
      propietario_tel_hash: propietarioTelHash,
    });

    const wa = `https://wa.me/57${solicitud.telefono}?text=${encodeURIComponent(
      `Hola ${solicitud.nombre}, vi su solicitud en hogarsolidario.co. Tengo un inmueble que puede servirle.`,
    )}`;
    return json({ wa_url: wa, telefono: solicitud.telefono });
  } catch (err) {
    console.error('contact-solicitud error', err);
    return json({ error: 'internal' }, { status: 500 });
  }
});
