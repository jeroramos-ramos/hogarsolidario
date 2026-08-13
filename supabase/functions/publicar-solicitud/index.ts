import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { solicitudInputSchema } from '../_shared/schemas.ts';

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

    const raw = await req.json().catch(() => null);
    const parsed = solicitudInputSchema.safeParse(raw);
    if (!parsed.success) {
      return json(
        { error: 'validation_failed', issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const sb = serviceClient();
    const { data, error } = await sb
      .from('solicitudes')
      .insert({
        nombre: input.nombre,
        telefono: input.telefono,
        adultos: input.adultos,
        ninos: input.ninos,
        adultos_mayores: input.adultos_mayores,
        situacion: input.situacion ?? null,
        en_censo: input.en_censo,
        departamento: input.departamento,
        municipio: input.municipio,
        zona: input.zona ?? null,
        tipo: input.tipo,
        habitaciones_min: input.habitaciones_min,
        tope_canon: input.tope_canon,
        nota: input.nota ?? null,
        necesidades: input.necesidades,
      })
      .select('id')
      .single();

    if (error) throw error;
    return json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error('publicar-solicitud error', err);
    return json({ error: 'internal', message: (err as Error).message }, { status: 500 });
  }
});
