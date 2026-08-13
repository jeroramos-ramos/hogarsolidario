// Hash de IP con SHA-256 + salt (env RL_SALT).
// Guardamos hash, no IP en claro, para no acumular datos personales.
export async function hashIp(req: Request): Promise<string> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';
  const salt = Deno.env.get('RL_SALT') ?? 'hogarsolidario-dev-salt-change-me';
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
