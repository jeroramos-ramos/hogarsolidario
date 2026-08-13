import { serviceClient } from './supabase.ts';

// Verifica si hay más de `max` eventos para `ip_hash+endpoint` en las últimas `windowMinutes`.
// Devuelve { ok: true } si se puede continuar, o { ok: false, retryAfter } si excede.
export async function checkRateLimit(
  ipHash: string,
  endpoint: string,
  max: number,
  windowMinutes: number,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const sb = serviceClient();
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  const { count, error: countErr } = await sb
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('endpoint', endpoint)
    .gte('ts', since);

  if (countErr) throw countErr;

  if ((count ?? 0) >= max) {
    return { ok: false, retryAfter: windowMinutes * 60 };
  }

  const { error: insErr } = await sb
    .from('rate_limits')
    .insert({ ip_hash: ipHash, endpoint });
  if (insErr) throw insErr;

  return { ok: true };
}
