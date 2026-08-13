export const DEPTOS = {
  'Valle del Cauca': [
    'Cali',
    'Palmira',
    'Yumbo',
    'Jamundí',
    'Candelaria',
    'Buenaventura',
    'Tuluá',
    'Buga',
    'Cartago',
    'Florida',
    'Pradera',
    'El Cerrito',
    'Ginebra',
    'Guacarí',
    'Zarzal',
    'Roldanillo',
    'Sevilla',
    'Caicedonia',
    'La Unión',
    'Dagua',
    'Andalucía',
    'Bugalagrande',
    'San Pedro',
    'Restrepo',
    'Vijes',
    'Yotoco',
    'La Cumbre',
    'Calima–El Darién',
    'Riofrío',
    'Trujillo',
    'Obando',
    'Toro',
    'La Victoria',
    'Bolívar',
    'Versalles',
    'El Dovio',
    'Argelia',
    'Ansermanuevo',
    'Alcalá',
    'Ulloa',
    'El Águila',
    'El Cairo',
  ],
  Risaralda: [
    'Pereira',
    'Dosquebradas',
    'Santa Rosa de Cabal',
    'La Virginia',
    'Marsella',
    'Belén de Umbría',
    'Apía',
    'Santuario',
    'Quinchía',
    'Guática',
    'Mistrató',
    'Pueblo Rico',
    'Balboa',
    'La Celia',
  ],
  Quindío: [
    'Armenia',
    'Calarcá',
    'La Tebaida',
    'Montenegro',
    'Quimbaya',
    'Circasia',
    'Filandia',
    'Salento',
    'Córdoba',
    'Pijao',
    'Buenavista',
    'Génova',
  ],
  Caldas: [
    'Manizales',
    'Villamaría',
    'Chinchiná',
    'Palestina',
    'Neira',
    'Anserma',
    'Riosucio',
    'Supía',
    'Salamina',
    'Aguadas',
    'Viterbo',
    'Belalcázar',
    'Filadelfia',
    'Manzanares',
    'Pensilvania',
    'Marmato',
    'La Dorada',
    'Samaná',
  ],
  Chocó: [
    'Quibdó',
    'San José del Palmar',
    'Istmina',
    'Tadó',
    'Condoto',
    'Nóvita',
    'Sipí',
    'Cértegui',
    'Unión Panamericana',
    'Bagadó',
    'Lloró',
    'Atrato',
    'Medio San Juan',
    'Litoral del San Juan',
    'Río Iró',
  ],
} as const satisfies Record<string, readonly string[]>;

export type Departamento = keyof typeof DEPTOS;

export const DEPARTAMENTOS: readonly Departamento[] = Object.keys(DEPTOS) as Departamento[];

export const MUNICIPIOS: readonly string[] = DEPARTAMENTOS.flatMap((d) => DEPTOS[d]);

export const DEPTO_DE: Readonly<Record<string, Departamento>> = (() => {
  const map: Record<string, Departamento> = {};
  for (const d of DEPARTAMENTOS) {
    for (const m of DEPTOS[d]) map[m] = d;
  }
  return map;
})();

export const ZONAS = [
  'Norte',
  'Sur',
  'Oriente',
  'Occidente',
  'Centro',
  'Ladera',
  'Zona rural',
] as const;

export type Zona = (typeof ZONAS)[number];

export const TIPOS = [
  'Apartamento',
  'Casa',
  'Aparta-estudio',
  'Habitación',
  'Casa-finca',
  'Albergue temporal',
] as const;

export type Tipo = (typeof TIPOS)[number];

export const SITUACIONES = [
  'Estamos en un albergue',
  'Estamos donde familiares',
  'Vivienda con daños, aún adentro',
  'Arriendo terminado por el sismo',
] as const;

export type Situacion = (typeof SITUACIONES)[number];
