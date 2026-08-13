export const FLAGS = [
  { k: 'sinFiador', l: 'Sin fiador ni codeudor', h: 'No exige finca raíz ni aseguradora' },
  { k: 'sinDeposito', l: 'Sin depósito inicial', h: 'No cobra mes adelantado' },
  { k: 'subsidio', l: 'Acepta subsidio de arriendo', h: 'Recibe el pago del programa estatal' },
  { k: 'inmediata', l: 'Entrega inmediata', h: 'Se puede ocupar hoy' },
  { k: 'gratuito', l: 'Sin costo (cedido)', h: 'Sin canon mientras dura la emergencia' },
  { k: 'amoblado', l: 'Amoblado', h: 'Camas y enseres básicos' },
  { k: 'mascotas', l: 'Acepta mascotas', h: '' },
  { k: 'accesible', l: 'Accesible', h: 'Apto para movilidad reducida' },
] as const satisfies ReadonlyArray<{ k: string; l: string; h: string }>;

export type FlagKey = (typeof FLAGS)[number]['k'];

export const NEEDS = [
  { k: 'sinFiador', l: 'No tengo fiador' },
  { k: 'subsidio', l: 'Voy a pagar con el subsidio' },
  { k: 'amoblado', l: 'Lo necesito amoblado' },
  { k: 'mascotas', l: 'Tengo mascota' },
  { k: 'accesible', l: 'Necesito acceso sin escaleras' },
  { k: 'inmediata', l: 'Necesito entrar de inmediato' },
] as const satisfies ReadonlyArray<{ k: FlagKey; l: string }>;

export type NeedKey = (typeof NEEDS)[number]['k'];

// Estado estructural es aparte del resto de banderas (tri-estado, obligatorio).
export const ESTADOS_ESTRUCTURALES = [
  {
    k: 'revisado_ingenieria',
    l: 'Revisado por ingeniería / gestión del riesgo',
    tone: 'ok' as const,
  },
  {
    k: 'sin_danos_aparentes',
    l: 'Sin daños aparentes (declaración del propietario, no dictamen técnico)',
    tone: 'neutral' as const,
  },
  {
    k: 'sin_revisar',
    l: 'Sin revisar',
    tone: 'warn' as const,
  },
] as const;

export type EstadoEstructural = (typeof ESTADOS_ESTRUCTURALES)[number]['k'];

// Orden y clasificación de badges para las tarjetas.
export const BADGE_ORDEN: readonly FlagKey[] = [
  'gratuito',
  'sinFiador',
  'sinDeposito',
  'subsidio',
  'inmediata',
  'amoblado',
  'mascotas',
  'accesible',
];

export const BADGE_KEY_SET: ReadonlySet<FlagKey> = new Set([
  'gratuito',
  'sinFiador',
  'sinDeposito',
  'subsidio',
]);

export const BADGE_OK_SET: ReadonlySet<FlagKey> = new Set(['inmediata']);
