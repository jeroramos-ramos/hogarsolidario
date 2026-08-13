import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import {
  parseDomus,
  type DomusData,
} from '../../supabase/functions/import-domus/parser';

const FIXTURE = resolve(
  __dirname,
  '../../supabase/functions/import-domus/__fixtures__/example.html',
);

describe('parseDomus (fixture: Cali arboledas, venta)', () => {
  let data: DomusData;

  beforeAll(() => {
    const html = readFileSync(FIXTURE, 'utf8');
    const { document } = parseHTML(html);
    data = parseDomus(document as unknown as Document);
  });

  it('reconoce que es venta y captura el precio', () => {
    expect(data.operacion).toBe('venta');
    expect(data.precio).toBe(1_280_000_000);
  });

  it('captura la administración', () => {
    expect(data.administracion).toBe(1_230_000);
  });

  it('detecta código del inmueble', () => {
    expect(data.codigo).toBe('5059');
  });

  it('normaliza el tipo del H3 del header', () => {
    expect(data.tipo).toBe('Apartamento');
  });

  it('ubica ciudad y barrio', () => {
    expect(data.municipio?.toLowerCase()).toBe('cali');
    expect(data.barrio?.toLowerCase()).toContain('arboledas');
  });

  it('extrae el bloque de detalles', () => {
    expect(data.habitaciones).toBe(1);
    expect(data.banos).toBe(2);
    expect(data.area_m2).toBe(103);
    expect(data.estrato).toBe(6);
    expect(data.garajes).toBe(1);
    expect(data.ano_construccion).toBe(2017);
  });

  it('extrae la descripción del primer párrafo', () => {
    expect(data.descripcion).toContain('Ofrecemos en venta');
    expect(data.descripcion).toContain('Arboleda');
    expect(data.descripcion?.length).toBeGreaterThan(200);
  });

  it('extrae al menos algunas características', () => {
    expect(data.caracteristicas.length).toBeGreaterThan(5);
    expect(data.caracteristicas).toContain('Cocina Integral');
    expect(data.caracteristicas).toContain('Piscina');
  });

  it('extrae info de la inmobiliaria', () => {
    expect(data.inmobiliaria.nombre).toBe('GARBIRAS INMOBILIARIA');
    expect(data.inmobiliaria.direccion).toContain('Av. 4N');
    expect(data.inmobiliaria.web).toBe('http://www.garbirasinmobiliaria.com');
  });

  it('extrae teléfonos móviles y elige el WhatsApp', () => {
    expect(data.inmobiliaria.telefonos).toContain('3174144208');
    expect(data.inmobiliaria.telefono_whatsapp).toBe('3174144208');
  });

  it('extrae todas las fotos apuntando al bucket S3', () => {
    expect(data.fotos_urls.length).toBeGreaterThan(10);
    for (const url of data.fotos_urls) {
      expect(url).toMatch(/^https:\/\/s3\.us-west-2\.amazonaws\.com\/pictures\.domus\.la\//);
    }
  });

  it('extrae los meta og:*', () => {
    expect(data.og.title).toBe('APARTAMENTO EN VENTA EN arboledas');
    expect(data.og.image).toContain('s3.us-west-2.amazonaws.com');
    expect(data.og.description).toBeTruthy();
  });
});

describe('parseDomus con HTML mínimo (edge cases)', () => {
  it('devuelve todos los campos null/vacíos sin explotar', () => {
    const { document } = parseHTML('<html><body></body></html>');
    const data = parseDomus(document as unknown as Document);
    expect(data.operacion).toBe('unknown');
    expect(data.precio).toBe(0);
    expect(data.tipo).toBeNull();
    expect(data.municipio).toBeNull();
    expect(data.habitaciones).toBeNull();
    expect(data.fotos_urls).toEqual([]);
    expect(data.caracteristicas).toEqual([]);
    expect(data.inmobiliaria.nombre).toBeNull();
    expect(data.inmobiliaria.telefonos).toEqual([]);
  });

  it('reconoce operación arriendo', () => {
    const { document } = parseHTML(
      '<html><body><div class="title"><h4 class="color-perzonalidado">Arriendo: $ 1,500,000</h4></div></body></html>',
    );
    const data = parseDomus(document as unknown as Document);
    expect(data.operacion).toBe('arriendo');
    expect(data.precio).toBe(1_500_000);
  });
});
