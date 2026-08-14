// Condiciones que aparecen en el formulario del inmueble.
//
// Historia de decisiones:
// - "sin fiador" / "sin deudor solidario" se eliminó: el deudor solidario lo
//   exige la aseguradora del contrato, no lo decide la inmobiliaria.
//   Ofrecerlo como condición era publicidad engañosa.
// - "acepta subsidio de arriendo" se eliminó: el subsidio lo tramita la
//   familia ante su alcaldía y la UNGRD. La inmobiliaria no acepta ni
//   rechaza — cuenta como parte de la capacidad de pago de la familia.
//   Se sustituye por una nota informativa en el formulario y la ficha.
export const FLAGS = [
  {
    k: 'sinDeposito',
    l: 'No cobra canon anticipado',
    h: 'No exige un mes por adelantado además del primero',
  },
  { k: 'inmediata', l: 'Entrega inmediata', h: 'Se puede ocupar hoy' },
  { k: 'gratuito', l: 'Sin costo (cedido)', h: 'Sin canon mientras dura la emergencia' },
  { k: 'amoblado', l: 'Amoblado', h: 'Camas y enseres básicos' },
  { k: 'mascotas', l: 'Acepta mascotas', h: '' },
  { k: 'accesible', l: 'Accesible', h: 'Apto para movilidad reducida' },
] as const satisfies ReadonlyArray<{ k: string; l: string; h: string }>;

export type FlagKey = (typeof FLAGS)[number]['k'];

export const NEEDS = [
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
  'sinDeposito',
  'inmediata',
  'amoblado',
  'mascotas',
  'accesible',
];

export const BADGE_KEY_SET: ReadonlySet<FlagKey> = new Set(['gratuito', 'sinDeposito']);

export const BADGE_OK_SET: ReadonlySet<FlagKey> = new Set(['inmediata']);
