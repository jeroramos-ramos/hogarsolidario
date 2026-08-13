// Parser puro de fichas de Domus (v2.domus.la). Recibe un Document (linkedom o el
// del navegador) y devuelve datos estructurados. NO importa nada en runtime;
// las herramientas DOM se cargan aparte:
//   - En Deno (edge function): linkedom vía esm.sh
//   - En Node (vitest tests): linkedom via npm
//
// Si Domus cambia el markup, los tests contra el fixture avisan primero.

export type DomusOperacion = 'venta' | 'arriendo' | 'unknown';

export type DomusInmobiliaria = {
  nombre: string | null;
  telefonos: string[];
  telefono_whatsapp: string | null;
  direccion: string | null;
  web: string | null;
};

export type DomusData = {
  operacion: DomusOperacion;
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
  inmobiliaria: DomusInmobiliaria;
  fotos_urls: string[];
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
};

// ── helpers ────────────────────────────────────────────────────────────

function textOf(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function parseMoney(s: string): number {
  // "$ 1,280,000,000" o "$1.280.000.000" → 1280000000
  const digits = s.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function parseIntSafe(s: string): number | null {
  const m = s.match(/-?\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeTipo(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  // Mapeo conservador — solo los tipos que existen en nuestro sistema.
  if (/apart[a-z]*estudio|aparta[- ]?estudio/.test(t)) return 'Aparta-estudio';
  if (/apartamento|apto|dpto/.test(t)) return 'Apartamento';
  if (/casa[- ]?finca|finca|casaquinta/.test(t)) return 'Casa-finca';
  if (/^casa/.test(t) || /\bcasa\b/.test(t)) return 'Casa';
  if (/habitacion/.test(t)) return 'Habitación';
  if (/albergue/.test(t)) return 'Albergue temporal';
  return null;
}

function extractMobiles(raw: string): string[] {
  // "602 5241930,3174144208" → ["6025241930", "3174144208"]
  // Se filtran solo los que parecen móviles colombianos: 10 dígitos que empiezan por 3.
  const parts = raw.split(/[,;/|]/);
  const digitsOnly = parts.map((p) => p.replace(/\D/g, '')).filter(Boolean);
  const mobiles = digitsOnly.filter((n) => n.length === 10 && n.startsWith('3'));
  return mobiles;
}

// ── extractores por sección ───────────────────────────────────────────

function extractOgTag(doc: Document, property: string): string | null {
  const el = doc.querySelector(`meta[property="og:${property}"]`);
  const c = el?.getAttribute('content');
  return c && c.trim() ? c.trim() : null;
}

function extractCodigo(doc: Document): string | null {
  // <h3 class="color-perzonalidado" style="margin: auto">Código: 5059</h3>
  const headers = doc.querySelectorAll('header h3.color-perzonalidado');
  for (const h of Array.from(headers) as Element[]) {
    const t = textOf(h);
    const m = t.match(/C[oó]digo:\s*([A-Za-z0-9-]+)/i);
    if (m) return m[1] ?? null;
  }
  return null;
}

function extractTitleFields(doc: Document): { tipo: string | null; barrio_hint: string | null } {
  // <h3 class="color-perzonalidado">APARTAMENTO EN arboledas</h3>
  const h3s = doc.querySelectorAll('.title h3.color-perzonalidado');
  for (const h of Array.from(h3s) as Element[]) {
    const t = textOf(h);
    const m = t.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ \-]+?)\s+EN\s+(.+)$/i);
    if (m) {
      return {
        tipo: normalizeTipo(m[1] ?? ''),
        barrio_hint: (m[2] ?? '').trim() || null,
      };
    }
  }
  return { tipo: null, barrio_hint: null };
}

function extractPrecio(doc: Document): { operacion: DomusOperacion; precio: number; administracion: number } {
  // <h4 class="color-perzonalidado">Venta: $ 1,280,000,000</h4>
  // <h4 class="color-perzonalidado">Arriendo: $ 1,500,000</h4>
  // <h4 class="color-perzonalidado">Administracion: $ 1,230,000</h4>
  let operacion: DomusOperacion = 'unknown';
  let precio = 0;
  let administracion = 0;

  const h4s = doc.querySelectorAll('.title h4.color-perzonalidado');
  for (const h of Array.from(h4s) as Element[]) {
    const t = textOf(h);
    if (/^\s*venta\s*:/i.test(t)) {
      operacion = 'venta';
      precio = parseMoney(t);
    } else if (/^\s*arriendo\s*:/i.test(t)) {
      operacion = 'arriendo';
      precio = parseMoney(t);
    } else if (/administraci/i.test(t)) {
      administracion = parseMoney(t);
    }
  }
  return { operacion, precio, administracion };
}

function extractDetailBlock(doc: Document): {
  habitaciones: number | null;
  banos: number | null;
  area_m2: number | null;
  estrato: number | null;
  garajes: number | null;
  ano_construccion: number | null;
} {
  // Bloque de "col-md-6" con <b>Label:</b> value dentro del primer article.
  const result = {
    habitaciones: null as number | null,
    banos: null as number | null,
    area_m2: null as number | null,
    estrato: null as number | null,
    garajes: null as number | null,
    ano_construccion: null as number | null,
  };
  const cells = doc.querySelectorAll('.col-md-6');
  for (const c of Array.from(cells) as Element[]) {
    const label = textOf(c.querySelector('b'));
    if (!label) continue;
    const raw = textOf(c);
    // "Habitaciones: 1" → parseamos lo que sigue al label.
    const after = raw.slice(label.length).trim();
    const n = parseIntSafe(after);
    if (n === null) continue;
    if (/habitaciones/i.test(label)) result.habitaciones = n;
    else if (/ba[nñ]os/i.test(label)) result.banos = n;
    else if (/[aá]rea\s+priv/i.test(label)) result.area_m2 = n;
    else if (result.area_m2 === null && /[aá]rea\s+const/i.test(label)) result.area_m2 = n;
    else if (/estrato/i.test(label)) result.estrato = n;
    else if (/garajes/i.test(label)) result.garajes = n;
    else if (/a[nñ]o\s+construcci/i.test(label)) result.ano_construccion = n;
  }
  return result;
}

function extractLocation(doc: Document): { municipio: string | null; barrio: string | null } {
  // <h2 class="color-perzonalidado"><i class="fa fa-list"></i> Cali ,  arboledas</h2>
  const h2s = doc.querySelectorAll('h2.color-perzonalidado');
  for (const h of Array.from(h2s) as Element[]) {
    const t = textOf(h);
    // Descartamos secciones tipo "Características" o "Fotos 360".
    if (/caracter[íi]sticas|fotos\s*360|videos/i.test(t)) continue;
    const parts = t.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        municipio: parts[0] ?? null,
        barrio: parts.slice(1).join(', ') || null,
      };
    }
  }
  return { municipio: null, barrio: null };
}

function extractDescripcion(doc: Document): string | null {
  // El primer article/post contiene <p> con la descripción.
  const p = doc.querySelector('article.post p');
  const t = textOf(p);
  return t || null;
}

function extractCaracteristicas(doc: Document): string[] {
  // Article con h2 "Características", lista de "col-md-6" con texto.
  const articles = doc.querySelectorAll('article.post');
  for (const a of Array.from(articles) as Element[]) {
    const heading = textOf(a.querySelector('h2'));
    if (!/caracter[íi]sticas/i.test(heading)) continue;
    const items = Array.from(a.querySelectorAll('.col-md-6')) as Element[];
    return items
      .map((it) => {
        // Los items tienen "<li class='fa fa-check'></li> Texto"
        const clone = it.cloneNode(true) as Element;
        clone.querySelectorAll('li').forEach((n) => n.remove());
        return textOf(clone);
      })
      .filter((s) => s.length > 0 && s.length < 80);
  }
  return [];
}

function extractInmobiliaria(doc: Document): DomusInmobiliaria {
  const header = doc.querySelector('#sidebar article.mini-post header');
  if (!header) {
    return { nombre: null, telefonos: [], telefono_whatsapp: null, direccion: null, web: null };
  }

  // Recorremos childNodes: cada <i> marca el inicio de un campo, el siguiente
  // text node es su valor, y <br> cierra la línea. Más robusto que parsear
  // innerHTML — inmune a cómo linkedom serialize atributos.
  let nombre: string | null = null;
  let direccion: string | null = null;
  let web: string | null = null;
  const telefonos: string[] = [];
  let currentIcon: 'building' | 'phone' | 'map' | 'globe' | null = null;
  let currentText = '';

  const flush = (): void => {
    const text = currentText.trim();
    if (text) {
      if (currentIcon === 'building') nombre = text;
      else if (currentIcon === 'phone') telefonos.push(...extractMobiles(text));
      else if (currentIcon === 'map') direccion = text;
      else if (currentIcon === 'globe') web = text;
    }
    currentIcon = null;
    currentText = '';
  };

  for (const node of Array.from(header.childNodes)) {
    // 1 = Element, 3 = Text
    if (node.nodeType === 1) {
      const el = node as Element;
      const tag = el.tagName?.toUpperCase();
      if (tag === 'I') {
        flush();
        const cls = el.getAttribute('class') ?? '';
        if (cls.includes('fa-building')) currentIcon = 'building';
        else if (cls.includes('fa-phone')) currentIcon = 'phone';
        else if (cls.includes('fa-map')) currentIcon = 'map';
        else if (cls.includes('fa-globe')) currentIcon = 'globe';
      } else if (tag === 'BR') {
        flush();
      }
    } else if (node.nodeType === 3) {
      currentText += node.textContent ?? '';
    }
  }
  flush();

  return {
    nombre,
    telefonos,
    telefono_whatsapp: telefonos[0] ?? null,
    direccion,
    web,
  };
}

function extractFotos(doc: Document): string[] {
  const input = doc.querySelector('#inmfotos');
  const raw = input?.getAttribute('value');
  if (!raw) return [];
  let json: Array<{ imageurl?: string; thumburl?: string }> = [];
  try {
    json = JSON.parse(decodeHtmlEntities(raw));
  } catch {
    return [];
  }
  return json
    .map((it) => {
      const src = it.imageurl ?? it.thumburl ?? '';
      return src.replace(
        'https://pictures.domus.la/',
        'https://s3.us-west-2.amazonaws.com/pictures.domus.la/',
      );
    })
    .filter((u) => /^https?:\/\//.test(u));
}

// ── entry point ────────────────────────────────────────────────────────

export function parseDomus(doc: Document): DomusData {
  const { tipo, barrio_hint } = extractTitleFields(doc);
  const { operacion, precio, administracion } = extractPrecio(doc);
  const details = extractDetailBlock(doc);
  const { municipio, barrio } = extractLocation(doc);

  return {
    operacion,
    precio,
    administracion,
    codigo: extractCodigo(doc),
    tipo,
    municipio,
    barrio: barrio ?? barrio_hint,
    descripcion: extractDescripcion(doc),
    ...details,
    caracteristicas: extractCaracteristicas(doc),
    inmobiliaria: extractInmobiliaria(doc),
    fotos_urls: extractFotos(doc),
    og: {
      title: extractOgTag(doc, 'title'),
      description: extractOgTag(doc, 'description'),
      image: extractOgTag(doc, 'image'),
    },
  };
}
