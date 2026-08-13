// Marca en_revision los avisos sin actualizar hace más de 21 días.
// Se llama desde Supabase Scheduled Triggers (cron: 0 3 * * *) o manualmente.
// Requiere el header `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` o CRON_SECRET.

import { handleOptions, json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const cronSecret = Deno.env.get('CRON_SECRET');
  const auth = req.headers.get('Authorization') ?? '';
  const expected = `Bearer ${cronSecret ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`;
  if (!cronSecret && !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    return json({ error: 'not_configured' }, { status: 500 });
  }
  if (auth !== expected) return json({ error: 'unauthorized' }, { status: 401 });

  try {
    const sb = serviceClient();
    const { data, error } = await sb.rpc('caducar_avisos');
    if (error) throw error;
    return json({ caducados: data });
  } catch (err) {
    console.error('caducar error', err);
    return json({ error: 'internal' }, { status: 500 });
  }
});
