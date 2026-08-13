// Schemas zod compartidos. NO se importan desde el cliente (Deno).
// El cliente tiene copias en src/lib/schemas.ts — mantener en sync.
import { z } from 'https://esm.sh/zod@3.23.8';

const ESTADO_ESTRUCTURAL = ['revisado_ingenieria', 'sin_danos_aparentes', 'sin_revisar'] as const;

const flagsSchema = z
  .object({
    sinFiador: z.boolean().optional(),
    sinDeposito: z.boolean().optional(),
    subsidio: z.boolean().optional(),
    inmediata: z.boolean().optional(),
    gratuito: z.boolean().optional(),
    amoblado: z.boolean().optional(),
    mascotas: z.boolean().optional(),
    accesible: z.boolean().optional(),
  })
  .default({});

export const inmuebleInputSchema = z.object({
  publicado_por: z.enum(['inmobiliaria', 'propietario']),
  quien_nombre: z.string().trim().min(2).max(120),
  quien_doc: z.string().trim().max(30).optional(),
  telefono: z.string().regex(/^[0-9]{10}$/),
  tipo: z.string().min(2).max(40),
  departamento: z.string().min(2).max(40),
  municipio: z.string().min(2).max(60),
  zona: z.string().max(40).optional(),
  barrio: z.string().trim().min(2).max(80),
  canon: z.number().int().nonnegative(),
  habitaciones: z.number().int().nonnegative().max(30),
  banos: z.number().int().nonnegative().max(20),
  area_m2: z.number().int().optional(),
  disponible_desde: z.string().max(40).optional(),
  duracion_minima: z.string().max(40).optional(),
  notas: z.string().max(400).optional(),
  fotos: z.array(z.string().regex(/^[0-9a-f-]{36}\/[0-9]+\.(webp|jpe?g|png)$/)).max(6).default([]),
  flags: flagsSchema,
  estado_estructural: z.enum(ESTADO_ESTRUCTURAL),
});

export type InmuebleInput = z.infer<typeof inmuebleInputSchema>;

export const solicitudInputSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().regex(/^[0-9]{10}$/),
  adultos: z.number().int().min(1).max(20),
  ninos: z.number().int().min(0).max(20),
  adultos_mayores: z.number().int().min(0).max(20),
  situacion: z.string().max(80).optional(),
  en_censo: z.enum(['si', 'no', 'tramite']),
  departamento: z.string().min(2).max(40),
  municipio: z.string().min(2).max(60),
  zona: z.string().max(40).optional(),
  tipo: z.string().min(2).max(40),
  habitaciones_min: z.number().int().min(1).max(20),
  tope_canon: z.number().int().nonnegative(),
  nota: z.string().max(500).optional(),
  necesidades: z
    .object({
      sinFiador: z.boolean().optional(),
      subsidio: z.boolean().optional(),
      amoblado: z.boolean().optional(),
      mascotas: z.boolean().optional(),
      accesible: z.boolean().optional(),
      inmediata: z.boolean().optional(),
    })
    .default({}),
});

export type SolicitudInput = z.infer<typeof solicitudInputSchema>;
