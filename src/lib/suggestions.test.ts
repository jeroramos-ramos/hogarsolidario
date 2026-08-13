import { describe, it, expect } from 'vitest';
import { suggestFilterRemovals, municipiosCercanos } from './suggestions';
import { FILTROS_INICIALES, type InmueblePublico, type FiltrosInmuebles } from './types';

function make(over: Partial<InmueblePublico> = {}): InmueblePublico {
  return {
    id: crypto.randomUUID(),
    publicado_por: 'inmobiliaria',
    quien_nombre: 'X',
    telefono: '3001234567',
    tipo: 'Apartamento',
    departamento: 'Caldas',
    municipio: 'Manizales',
    zona: 'Centro',
    barrio: 'Palermo',
    canon: 800000,
    habitaciones: 2,
    banos: 1,
    area_m2: 60,
    disponible_desde: 'Inmediata',
    duracion_minima: '3 meses',
    notas: null,
    fotos: [],
    flags: {},
    estado_estructural: 'revisado_ingenieria',
    created_at: '2026-08-13T10:00:00Z',
    ...over,
  };
}

describe('suggestFilterRemovals', () => {
  const inventory: InmueblePublico[] = [
    make({ municipio: 'Manizales', canon: 1_500_000, habitaciones: 3 }),
    make({ municipio: 'Manizales', canon: 900_000, habitaciones: 2 }),
    make({ municipio: 'Manizales', canon: 500_000, habitaciones: 1 }),
    make({ municipio: 'Pereira', departamento: 'Risaralda', canon: 800_000, habitaciones: 2 }),
  ];

  it('sin filtros activos → sin sugerencias', () => {
    const s = suggestFilterRemovals(inventory, FILTROS_INICIALES, inventory.length);
    expect(s).toEqual([]);
  });

  it('con canonMax restrictivo → sugerir subir el tope', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, canonMax: 100_000 };
    const s = suggestFilterRemovals(inventory, f, 0);
    expect(s.length).toBeGreaterThan(0);
    const canonSug = s.find((x) => x.filterKey === 'canonMax');
    expect(canonSug).toBeDefined();
    expect(canonSug?.additional).toBe(4);
  });

  it('con municipio Manizales y depto Caldas → sugiere quitar municipio para ver todo Caldas', () => {
    const f: FiltrosInmuebles = {
      ...FILTROS_INICIALES,
      departamento: 'Caldas',
      municipio: 'Manizales',
      habitacionesMin: 5,
    };
    const s = suggestFilterRemovals(inventory, f, 0);
    // habitacionesMin 5 mata todo. Quitarlo desbloquea 3 (los de Caldas/Manizales).
    const habSug = s.find((x) => x.filterKey === 'habitacionesMin');
    expect(habSug).toBeDefined();
    expect(habSug?.additional).toBe(3);
  });

  it('ordena por additional descendente y limita a 3', () => {
    const f: FiltrosInmuebles = {
      ...FILTROS_INICIALES,
      canonMax: 100_000,
      habitacionesMin: 10,
      zona: 'Norte',
      tipo: 'Casa',
    };
    const s = suggestFilterRemovals(inventory, f, 0);
    expect(s.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < s.length; i++) {
      const cur = s[i]!.additional;
      const prev = s[i - 1]!.additional;
      expect(cur).toBeLessThanOrEqual(prev);
    }
  });

  it('no sugiere quitar filtros que no desbloquearían nada', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, tipo: 'Albergue temporal' };
    const s = suggestFilterRemovals(inventory, f, 0);
    // Quitar tipo desbloquea 4. Ninguna otra sugerencia.
    expect(s.every((x) => x.additional > 0)).toBe(true);
  });
});

describe('municipiosCercanos', () => {
  const inventory: InmueblePublico[] = [
    make({ municipio: 'Manizales', departamento: 'Caldas' }),
    make({ municipio: 'Villamaría', departamento: 'Caldas' }),
    make({ municipio: 'Villamaría', departamento: 'Caldas' }),
    make({ municipio: 'Chinchiná', departamento: 'Caldas' }),
    make({ municipio: 'Pereira', departamento: 'Risaralda' }),
  ];

  it('sin municipio activo → vacío', () => {
    expect(municipiosCercanos(inventory, FILTROS_INICIALES)).toEqual([]);
  });

  it('con municipio activo devuelve otros del mismo depto ordenados por count', () => {
    const f: FiltrosInmuebles = {
      ...FILTROS_INICIALES,
      departamento: 'Caldas',
      municipio: 'Manizales',
    };
    const r = municipiosCercanos(inventory, f);
    expect(r).toEqual([
      { municipio: 'Villamaría', count: 2 },
      { municipio: 'Chinchiná', count: 1 },
    ]);
  });

  it('no incluye municipios de otros departamentos', () => {
    const f: FiltrosInmuebles = {
      ...FILTROS_INICIALES,
      departamento: 'Caldas',
      municipio: 'Manizales',
    };
    const r = municipiosCercanos(inventory, f);
    expect(r.find((x) => x.municipio === 'Pereira')).toBeUndefined();
  });
});
