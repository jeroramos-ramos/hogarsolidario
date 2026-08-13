// Wrapper para invocar edge functions con la anon key.
import { supabase, SUPABASE_URL } from './supabase';

async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // No JSON: dejar como texto crudo.
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === 'object' && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : text) || `HTTP ${res.status}`;
    const err = new Error(message) as Error & { status: number; body: unknown };
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed as T;
}

export type PublicarInmuebleResp = {
  id: string;
  estado: 'activo' | 'en_revision' | 'arrendado' | 'retirado';
  motivo_revision: string | null;
};

export async function publicarInmueble(input: unknown): Promise<PublicarInmuebleResp> {
  return invoke<PublicarInmuebleResp>('publicar-inmueble', input);
}

export async function publicarSolicitud(input: unknown): Promise<{ id: string }> {
  return invoke<{ id: string }>('publicar-solicitud', input);
}

export async function reportar(input: unknown): Promise<{ ok: true }> {
  return invoke<{ ok: true }>('report', input);
}
