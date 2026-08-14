// Gateway de publicación: rate-limit, valida payload zod, inserta via service_role.
// El trigger inmuebles_check_precio marca en_revision automáticamente si el canon
// supera en 30% la mediana comparable (y hay ≥5 comparables).

import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { inmuebleInputSchema } from '../_shared/schemas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    // Cargar inventario es el caso de uso principal, no abuso. 40/h por IP
    // (una oficina compartiendo IP puede ser 3-4 asesores × 10 avisos).
    // Si una inmobiliaria necesita más, escribe a hola@hogarsolidario.co
    // y les subimos la cuota puntualmente.
    const MAX_PER_HOUR = 40;
    const rl = await checkRateLimit(ipHash, 'publicar-inmueble', MAX_PER_HOUR, 60);
    if (!rl.ok) {
      return json(
        {
          error: 'rate_limited',
          count: rl.count,
          max: MAX_PER_HOUR,
          retry_after_seconds: rl.retryAfter,
          reset_at: rl.resetAt,
          contact_email: 'hola@hogarsolidario.co',
        },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter), ...corsHeaders } },
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = inmuebleInputSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: 'validation_failed', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const sb = serviceClient();
    const { data, error } = await sb
      .from('inmuebles')
      .insert({
        publicado_por: input.publicado_por,
        quien_nombre: input.quien_nombre,
        quien_doc: input.quien_doc ?? null,
        telefono: input.telefono,
        tipo: input.tipo,
        departamento: input.departamento,
        municipio: input.municipio,
        zona: input.zona ?? null,
        barrio: input.barrio,
        canon: input.flags.gratuito ? 0 : input.canon,
        habitaciones: input.habitaciones,
        banos: input.banos,
        area_m2: input.area_m2 ?? null,
        disponible_desde: input.disponible_desde ?? null,
        duracion_minima: input.duracion_minima ?? null,
        notas: input.notas ?? null,
        fotos: input.fotos.map((p) => p),
        flags: input.flags.gratuito
          ? { ...input.flags, sinDeposito: true }
          : input.flags,
        estado_estructural: input.estado_estructural,
      })
      .select('id, estado, motivo_revision')
      .single();

    if (error) throw error;

    return json(
      {
        id: data.id,
        estado: data.estado,
        // Si el trigger de precio lo marcó en_revision, se lo devolvemos al publicante
        // para que sepa por qué no aparece en el buscador.
        motivo_revision: data.motivo_revision,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('publicar-inmueble error', err);
    return json({ error: 'internal', message: (err as Error).message }, { status: 500 });
  }
});
