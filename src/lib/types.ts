import type { Departamento, Tipo, Zona, Situacion } from '@/data/municipios';
import type { FlagKey, EstadoEstructural } from '@/data/flags';

export type InmueblePublico = {
  id: string;
  publicado_por: 'inmobiliaria' | 'propietario';
  quien_nombre: string;
  telefono: string;
  tipo: Tipo;
  departamento: Departamento;
  municipio: string;
  zona: Zona | null;
  barrio: string;
  canon: number;
  habitaciones: number;
  banos: number;
  area_m2: number | null;
  disponible_desde: string | null;
  duracion_minima: string | null;
  notas: string | null;
  fotos: string[];
  flags: Partial<Record<FlagKey, boolean>>;
  estado_estructural: EstadoEstructural;
  created_at: string;
};

export type SolicitudPublica = {
  id: string;
  nombre_corto: string;
  adultos: number;
  ninos: number;
  adultos_mayores: number;
  situacion: Situacion | null;
  en_censo: 'si' | 'no' | 'tramite';
  departamento: Departamento;
  municipio: string;
  zona: Zona | null;
  tipo: Tipo;
  habitaciones_min: number;
  tope_canon: number;
  necesidades: Partial<Record<FlagKey, boolean>>;
  created_at: string;
};

export type OrdenInmuebles = 'recientes' | 'baratos' | 'grandes';

export type FiltrosInmuebles = {
  departamento: Departamento | '';
  municipio: string;
  zona: Zona | '';
  tipo: Tipo | '';
  canonMax: number | null;
  habitacionesMin: number | null;
  flags: ReadonlySet<FlagKey>;
  soloRevisadosIngenieria: boolean;
  orden: OrdenInmuebles;
};

export const FILTROS_INICIALES: FiltrosInmuebles = {
  departamento: '',
  municipio: '',
  zona: '',
  tipo: '',
  canonMax: null,
  habitacionesMin: null,
  flags: new Set(),
  soloRevisadosIngenieria: false,
  orden: 'recientes',
};
