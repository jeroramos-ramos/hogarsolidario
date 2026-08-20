import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SolicitudPublica } from '@/lib/types';

async function fetchSolicitudes(): Promise<SolicitudPublica[]> {
  // La vista solicitudes_publicas ya excluye telefono, nombre completo y nota.
  // Aquí solo pedimos los campos que muestra la UI para minimizar ancho de banda
  // y hacer explícito qué información sale de la base.
  const { data, error } = await supabase
    .from('solicitudes_publicas')
    .select(
      'id, nombre_corto, adultos, ninos, adultos_mayores, situacion, en_censo, departamento, municipio, zona, tipo, habitaciones_min, tope_canon, necesidades, created_at, telefono',
    )
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as SolicitudPublica[];
}

export function useSolicitudes() {
  return useQuery({
    queryKey: ['solicitudes_publicas'],
    queryFn: fetchSolicitudes,
    staleTime: 30_000,
  });
}
