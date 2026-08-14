import { describe, it, expect } from 'vitest';
import { aplicarFiltros, cumpleFiltros } from './filters';
import type { InmueblePublico, FiltrosInmuebles } from './types';
import { FILTROS_INICIALES } from './types';

function make(over: Partial<InmueblePublico> = {}): InmueblePublico {
  return {
    id: 'x',
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
    verificado_manual: false,
    ...over,
  };
}

describe('cumpleFiltros', () => {
  it('pasa con filtros vacíos', () => {
    expect(cumpleFiltros(make(), FILTROS_INICIALES)).toBe(true);
  });

  it('filtra por departamento exacto', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, departamento: 'Risaralda' };
    expect(cumpleFiltros(make({ departamento: 'Caldas' }), f)).toBe(false);
    expect(cumpleFiltros(make({ departamento: 'Risaralda' }), f)).toBe(true);
  });

  it('canonMax es inclusivo', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, canonMax: 800000 };
    expect(cumpleFiltros(make({ canon: 800000 }), f)).toBe(true);
    expect(cumpleFiltros(make({ canon: 800001 }), f)).toBe(false);
  });

  it('habitacionesMin es inclusivo', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, habitacionesMin: 3 };
    expect(cumpleFiltros(make({ habitaciones: 3 }), f)).toBe(true);
    expect(cumpleFiltros(make({ habitaciones: 2 }), f)).toBe(false);
  });

  it('soloRevisadosIngenieria excluye sin_danos_aparentes y sin_revisar', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, soloRevisadosIngenieria: true };
    expect(cumpleFiltros(make({ estado_estructural: 'revisado_ingenieria' }), f)).toBe(true);
    expect(cumpleFiltros(make({ estado_estructural: 'sin_danos_aparentes' }), f)).toBe(false);
    expect(cumpleFiltros(make({ estado_estructural: 'sin_revisar' }), f)).toBe(false);
  });

  it('todas las flags marcadas deben cumplirse (AND)', () => {
    const f: FiltrosInmuebles = { ...FILTROS_INICIALES, flags: new Set(['sinDeposito', 'mascotas']) };
    expect(cumpleFiltros(make({ flags: { sinDeposito: true } }), f)).toBe(false);
    expect(cumpleFiltros(make({ flags: { sinDeposito: true, mascotas: true } }), f)).toBe(true);
    expect(
      cumpleFiltros(make({ flags: { sinDeposito: true, mascotas: true, amoblado: true } }), f),
    ).toBe(true);
  });
});

describe('aplicarFiltros orden', () => {
  const rows = [
    make({ id: 'a', canon: 900000, habitaciones: 2, created_at: '2026-08-01T00:00:00Z' }),
    make({ id: 'b', canon: 500000, habitaciones: 4, created_at: '2026-08-10T00:00:00Z' }),
    make({ id: 'c', canon: 700000, habitaciones: 3, created_at: '2026-08-05T00:00:00Z' }),
  ];

  it('recientes: más nuevo primero', () => {
    const r = aplicarFiltros(rows, { ...FILTROS_INICIALES, orden: 'recientes' });
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('baratos: menor canon primero', () => {
    const r = aplicarFiltros(rows, { ...FILTROS_INICIALES, orden: 'baratos' });
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('grandes: más habitaciones primero', () => {
    const r = aplicarFiltros(rows, { ...FILTROS_INICIALES, orden: 'grandes' });
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('no muta el array original', () => {
    const before = rows.map((r) => r.id);
    aplicarFiltros(rows, { ...FILTROS_INICIALES, orden: 'baratos' });
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});
