import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { InmueblePublico } from '@/lib/types';

async function fetchInmuebles(): Promise<InmueblePublico[]> {
  const { data, error } = await supabase
    .from('inmuebles_publicos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as InmueblePublico[];
}

export function useInmuebles() {
  return useQuery({
    queryKey: ['inmuebles_publicos'],
    queryFn: fetchInmuebles,
    staleTime: 30_000,
  });
}

async function fetchInmueble(id: string): Promise<InmueblePublico | null> {
  const { data, error } = await supabase
    .from('inmuebles_publicos')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as InmueblePublico | null;
}

export function useInmueble(id: string | undefined) {
  return useQuery({
    queryKey: ['inmueble', id],
    queryFn: () => fetchInmueble(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}
