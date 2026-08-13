import type { InmueblePublico, FiltrosInmuebles } from './types';

// Devuelve inmuebles que cumplen todos los filtros activos, ordenados según F.orden.
export function aplicarFiltros(
  inmuebles: readonly InmueblePublico[],
  f: FiltrosInmuebles,
): InmueblePublico[] {
  const out = inmuebles.filter((i) => cumpleFiltros(i, f));
  return ordenar(out, f.orden);
}

export function cumpleFiltros(i: InmueblePublico, f: FiltrosInmuebles): boolean {
  if (f.departamento && i.departamento !== f.departamento) return false;
  if (f.municipio && i.municipio !== f.municipio) return false;
  if (f.zona && i.zona !== f.zona) return false;
  if (f.tipo && i.tipo !== f.tipo) return false;
  if (f.canonMax !== null && i.canon > f.canonMax) return false;
  if (f.habitacionesMin !== null && i.habitaciones < f.habitacionesMin) return false;
  if (f.soloRevisadosIngenieria && i.estado_estructural !== 'revisado_ingenieria') return false;
  for (const key of f.flags) {
    if (!i.flags[key]) return false;
  }
  return true;
}

function ordenar(
  arr: InmueblePublico[],
  orden: FiltrosInmuebles['orden'],
): InmueblePublico[] {
  const sorted = [...arr];
  if (orden === 'baratos') sorted.sort((a, b) => a.canon - b.canon);
  else if (orden === 'grandes') sorted.sort((a, b) => b.habitaciones - a.habitaciones);
  else sorted.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  return sorted;
}
