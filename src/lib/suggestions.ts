import type { InmueblePublico, FiltrosInmuebles } from './types';
import { FILTROS_INICIALES } from './types';
import { aplicarFiltros } from './filters';
import { DEPTOS } from '@/data/municipios';

export type FilterKey =
  | 'departamento'
  | 'municipio'
  | 'zona'
  | 'tipo'
  | 'canonMax'
  | 'habitacionesMin'
  | 'soloRevisadosIngenieria'
  | 'flags';

export type Suggestion = {
  label: string;         // texto del CTA
  filterKey: FilterKey;  // qué filtro remueve
  additional: number;    // cuántos resultados adicionales desbloquea
  newFilters: FiltrosInmuebles;
};

function isActive(f: FiltrosInmuebles, key: FilterKey): boolean {
  switch (key) {
    case 'departamento': return f.departamento !== '';
    case 'municipio': return f.municipio !== '';
    case 'zona': return f.zona !== '';
    case 'tipo': return f.tipo !== '';
    case 'canonMax': return f.canonMax !== null;
    case 'habitacionesMin': return f.habitacionesMin !== null;
    case 'soloRevisadosIngenieria': return f.soloRevisadosIngenieria;
    case 'flags': return f.flags.size > 0;
  }
}

function clearFilter(f: FiltrosInmuebles, key: FilterKey): FiltrosInmuebles {
  switch (key) {
    case 'departamento': return { ...f, departamento: '', municipio: '' };
    case 'municipio': return { ...f, municipio: '' };
    case 'zona': return { ...f, zona: '' };
    case 'tipo': return { ...f, tipo: '' };
    case 'canonMax': return { ...f, canonMax: null };
    case 'habitacionesMin': return { ...f, habitacionesMin: null };
    case 'soloRevisadosIngenieria': return { ...f, soloRevisadosIngenieria: false };
    case 'flags': return { ...f, flags: new Set() };
  }
}

function labelFor(f: FiltrosInmuebles, key: FilterKey): string {
  switch (key) {
    case 'departamento': return `Quitar filtro de ${f.departamento}`;
    case 'municipio': return `Buscar en todo ${f.departamento || 'el país'}`;
    case 'zona': return `Quitar filtro de zona (${f.zona})`;
    case 'tipo': return `Quitar filtro de tipo (${f.tipo})`;
    case 'canonMax': return `Subir el tope de canon`;
    case 'habitacionesMin': return `Aceptar menos habitaciones`;
    case 'soloRevisadosIngenieria': return `Incluir sin daños aparentes / sin revisar`;
    case 'flags': return `Quitar condiciones marcadas`;
  }
}

const FILTER_KEYS: readonly FilterKey[] = [
  'flags',
  'canonMax',
  'habitacionesMin',
  'soloRevisadosIngenieria',
  'zona',
  'tipo',
  'municipio',
  'departamento',
];

// Devuelve hasta 3 sugerencias ordenadas por cuántos resultados adicionales
// desbloquean. Solo evalúa filtros activos.
export function suggestFilterRemovals(
  todos: readonly InmueblePublico[],
  f: FiltrosInmuebles,
  currentCount: number,
): Suggestion[] {
  const options: Suggestion[] = [];
  for (const key of FILTER_KEYS) {
    if (!isActive(f, key)) continue;
    const newFilters = clearFilter(f, key);
    const newCount = aplicarFiltros(todos, newFilters).length;
    const additional = newCount - currentCount;
    if (additional <= 0) continue;
    options.push({ label: labelFor(f, key), filterKey: key, additional, newFilters });
  }
  return options.sort((a, b) => b.additional - a.additional).slice(0, 3);
}

// Cuando el filtro por municipio da 0 pero el departamento tiene otros
// municipios con inventario, devuelve la lista de esos municipios con conteo.
export function municipiosCercanos(
  todos: readonly InmueblePublico[],
  f: FiltrosInmuebles,
): Array<{ municipio: string; count: number }> {
  if (!f.municipio || !f.departamento) return [];
  const dep = f.departamento;
  const municipiosDep = DEPTOS[dep] as readonly string[] | undefined;
  if (!municipiosDep) return [];

  const conteo = new Map<string, number>();
  for (const inm of todos) {
    if (inm.departamento !== dep || inm.municipio === f.municipio) continue;
    // Aplicar el resto de los filtros excepto municipio.
    const withoutMun: FiltrosInmuebles = { ...f, municipio: '' };
    if (!matchesAllExceptMunicipio(inm, withoutMun)) continue;
    conteo.set(inm.municipio, (conteo.get(inm.municipio) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .map(([municipio, count]) => ({ municipio, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function matchesAllExceptMunicipio(inm: InmueblePublico, f: FiltrosInmuebles): boolean {
  const withoutMun = { ...f, municipio: '' };
  return aplicarFiltros([inm], withoutMun).length === 1;
}

// Export util para tests
export const _internals = { FILTER_KEYS, FILTROS_INICIALES };
