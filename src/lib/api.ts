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

// ── import Domus ────────────────────────────────────────────────────
export type DomusImportSuccess = {
  ok: true;
  uploadId: string;
  fotos: string[];
  fotos_originales: number;
  fotos_subidas: number;
  warnings: string[];
  data: {
    operacion: 'venta' | 'arriendo' | 'unknown';
    precio: number;
    administracion: number;
    codigo: string | null;
    tipo: string | null;
    municipio: string | null;
    barrio: string | null;
    descripcion: string | null;
    habitaciones: number | null;
    banos: number | null;
    area_m2: number | null;
    estrato: number | null;
    garajes: number | null;
    ano_construccion: number | null;
    caracteristicas: string[];
    inmobiliaria: {
      nombre: string | null;
      telefonos: string[];
      telefono_whatsapp: string | null;
      direccion: string | null;
      web: string | null;
    };
    fotos_urls: string[];
  };
};

export type DomusImportFailure = {
  ok: false;
  reason: 'is_sale' | 'parser_failed';
  message: string;
  precio?: number;
};

export type DomusImportResp = DomusImportSuccess | DomusImportFailure;

export async function importarDomus(input: { url?: string; html?: string }): Promise<DomusImportResp> {
  try {
    return await invoke<DomusImportResp>('import-domus', input);
  } catch (err) {
    // El edge function devuelve 422 cuando la ficha es venta o no se pudo parsear.
    // Esos son resultados esperados, no errores: los pasamos como data.
    const e = err as Error & { status?: number; body?: unknown };
    const isHandledFailure =
      e.status === 422 &&
      e.body !== null &&
      typeof e.body === 'object' &&
      'ok' in (e.body as Record<string, unknown>) &&
      (e.body as { ok: unknown }).ok === false;
    if (isHandledFailure) return e.body as DomusImportFailure;
    throw err;
  }
}
