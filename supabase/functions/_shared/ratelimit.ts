import { serviceClient } from './supabase.ts';

// Ventana móvil por (ip_hash, endpoint). Devuelve el conteo actual dentro de la
// ventana y el momento exacto de liberación (cuando el registro más viejo salga
// de la ventana) para que la UI pueda mostrar "podés seguir a las 18:45" en vez
// de un genérico "esperá una hora".
export async function checkRateLimit(
  ipHash: string,
  endpoint: string,
  max: number,
  windowMinutes: number,
): Promise<
  | { ok: true; count: number }
  | { ok: false; count: number; retryAfter: number; resetAt: string }
> {
  const sb = serviceClient();
  const windowMs = windowMinutes * 60_000;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { data, error } = await sb
    .from('rate_limits')
    .select('ts')
    .eq('ip_hash', ipHash)
    .eq('endpoint', endpoint)
    .gte('ts', since)
    .order('ts', { ascending: true })
    .limit(max + 1);
  if (error) throw error;

  const count = data?.length ?? 0;

  if (count >= max) {
    const earliestTs = data![0]!.ts as string;
    const resetAtMs = new Date(earliestTs).getTime() + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));
    return {
      ok: false,
      count,
      retryAfter,
      resetAt: new Date(resetAtMs).toISOString(),
    };
  }

  const { error: insErr } = await sb
    .from('rate_limits')
    .insert({ ip_hash: ipHash, endpoint });
  if (insErr) throw insErr;

  return { ok: true, count: count + 1 };
}
