import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cliente con service_role para operaciones server-side (bypasea RLS).
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Cliente con el token del request (para validar la sesión del caller).
export function callerClient(req: Request): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY');
  const auth = req.headers.get('Authorization') ?? '';
  return createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: auth } },
  });
}
