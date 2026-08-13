import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Estado de configuración. main.tsx lo consulta antes de montar rutas —
// si falta algo, renderiza ConfigError con instrucciones en vez de dejar
// la página en blanco.
export const configStatus = {
  ok: Boolean(url && anonKey),
  missingUrl: !url,
  missingKey: !anonKey,
} as const;

// Cliente. Si la config falta, se construye con placeholders que fallarían
// al primer request — pero main.tsx no monta las rutas que lo usarían.
export const supabase: SupabaseClient = createClient(
  url || 'https://config-missing.invalid',
  anonKey || 'config-missing',
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export const SUPABASE_URL = url;
