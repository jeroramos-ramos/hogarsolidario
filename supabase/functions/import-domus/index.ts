// Import de fichas de Domus. Fetch + parser (linkedom via esm.sh) + upload de fotos
// al bucket 'inmuebles'. No headless browser. La UI decide qué hacer con el resultado:
// nunca publicamos automáticamente.

import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts';
import { corsHeaders, handleOptions, json } from '../_shared/cors.ts';
import { hashIp } from '../_shared/ip.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { parseDomus, type DomusData } from './parser.ts';

const ALLOWED_HOSTS = new Set(['v2.domus.la', 'www.domus.la', 'domus.la']);

type Body = {
  url?: string;
  html?: string; // fallback: si el fetch falla el usuario puede pegar el HTML/texto
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, { status: 405 });

  try {
    const ipHash = await hashIp(req);
    // Bucket compartido con publicar-inmueble ('inventario', 100/h). Importar
    // desde Domus es la variante automatizada de cargar inventario.
    const MAX_PER_HOUR = 100;
    const rl = await checkRateLimit(ipHash, 'inventario', MAX_PER_HOUR, 60);
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

    const body = (await req.json().catch(() => ({}))) as Body;
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    const rawHtml = typeof body.html === 'string' ? body.html.trim() : '';

    if (!rawUrl && !rawHtml) {
      return json({ error: 'url_or_html_required' }, { status: 400 });
    }

    // ── obtener HTML ────────────────────────────────────────────────
    let html = rawHtml;
    if (!html) {
      // Validar dominio antes de hacer fetch — evita SSRF genérico.
      let u: URL;
      try {
        u = new URL(rawUrl);
      } catch {
        return json({ error: 'invalid_url' }, { status: 400 });
      }
      if (!ALLOWED_HOSTS.has(u.hostname)) {
        return json(
          { error: 'unsupported_host', message: 'Solo aceptamos URLs de Domus.' },
          { status: 400 },
        );
      }
      try {
        const resp = await fetch(u.toString(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; HogarSolidarioImporter/1.0; +https://hogarsolidario.co)',
            Accept: 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(15_000),
        });
        if (!resp.ok) {
          return json(
            { error: 'fetch_failed', status: resp.status },
            { status: 502 },
          );
        }
        html = await resp.text();
      } catch (err) {
        console.error('domus fetch error', err);
        return json({ error: 'fetch_failed', message: (err as Error).message }, { status: 502 });
      }
    }

    // ── parsear ────────────────────────────────────────────────────
    const document = new DOMParser().parseFromString(html, 'text/html');
    if (!document) {
      return json({ ok: false, reason: 'parser_failed', message: 'HTML inválido.' }, { status: 422 });
    }
    const data: DomusData = parseDomus(document as unknown as Document);

    // Señal crítica: si es venta, rechazamos. La UI muestra el mensaje al usuario.
    if (data.operacion === 'venta') {
      return json(
        {
          ok: false,
          reason: 'is_sale',
          message: 'La ficha es una venta. Esta plataforma solo lista inmuebles en arriendo.',
          precio: data.precio,
        },
        { status: 422 },
      );
    }

    // Sanity check: sin municipio ni precio, el parser probablemente no matcheó nada.
    if (!data.municipio && data.precio === 0 && !data.tipo && data.fotos_urls.length === 0) {
      return json(
        { ok: false, reason: 'parser_failed', message: 'No pudimos leer los datos de esta ficha.' },
        { status: 422 },
      );
    }

    // ── subir fotos al bucket ──────────────────────────────────────
    const uploadId = crypto.randomUUID();
    const fotos = await uploadPhotos(data.fotos_urls, uploadId);

    return json({
      ok: true,
      uploadId,
      fotos,               // paths dentro del bucket, listos para insertar
      fotos_originales: data.fotos_urls.length,
      fotos_subidas: fotos.length,
      warnings: buildWarnings(data),
      data,                // datos parseados en crudo — la UI decide cómo poblar
    });
  } catch (err) {
    console.error('import-domus error', err);
    return json({ error: 'internal', message: (err as Error).message }, { status: 500 });
  }
});

function buildWarnings(d: DomusData): string[] {
  const w: string[] = [];
  if (d.precio > 2_500_000) {
    w.push(
      `El canon ${d.precio.toLocaleString('es-CO')} supera $2.500.000. Probablemente no sirve para el público de esta plataforma; confirmá antes de publicar.`,
    );
  }
  if (!d.municipio) w.push('No se detectó el municipio; hay que llenarlo a mano.');
  if (!d.tipo) w.push('No se detectó el tipo de inmueble; hay que llenarlo a mano.');
  if (!d.inmobiliaria.telefono_whatsapp) {
    w.push('No se detectó un WhatsApp móvil (10 dígitos); ingresalo a mano.');
  }
  return w;
}

// ── upload de fotos ─────────────────────────────────────────────────
// Máximo 6 (nuestro límite del bucket + de la UI). Timeout corto por foto
// para no colgar la request entera si Domus/S3 no responden.
async function uploadPhotos(urls: string[], uploadId: string): Promise<string[]> {
  const sb = serviceClient();
  const paths: string[] = [];
  const capped = urls.slice(0, 6);
  let i = 0;
  for (const src of capped) {
    try {
      const resp = await fetch(src, {
        headers: { 'User-Agent': 'HogarSolidarioImporter/1.0' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!resp.ok) continue;
      const ct = resp.headers.get('Content-Type') ?? '';
      const ext = inferExt(src, ct);
      if (!ext) continue;

      const bytes = new Uint8Array(await resp.arrayBuffer());
      // Tope duro: si excede 512KB (límite del bucket) saltamos — nuestra
      // política de storage rechazaría el INSERT.
      if (bytes.byteLength > 512 * 1024) continue;

      const path = `${uploadId}/${i}.${ext}`;
      const { error } = await sb.storage.from('inmuebles').upload(path, bytes, {
        contentType: ct || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        upsert: false,
      });
      if (error) {
        console.warn('upload failed', src, error.message);
        continue;
      }
      paths.push(path);
      i++;
    } catch (err) {
      console.warn('photo import error', src, (err as Error).message);
    }
  }
  return paths;
}

function inferExt(url: string, contentType: string): 'webp' | 'jpg' | 'png' | null {
  const ct = contentType.toLowerCase();
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('png')) return 'png';
  const u = url.toLowerCase();
  if (u.endsWith('.webp')) return 'webp';
  if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'jpg';
  if (u.endsWith('.png')) return 'png';
  return null;
}
