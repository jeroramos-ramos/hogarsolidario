import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Stats = {
  total: number;
  sin_fiador: number;
  municipios: number;
};

async function fetchStats(): Promise<Stats> {
  const { data, error } = await supabase
    .from('inmuebles_stats')
    .select('*')
    .single();
  if (error) throw error;
  return data as Stats;
}

export function useStats() {
  return useQuery({
    queryKey: ['inmuebles_stats'],
    queryFn: fetchStats,
    staleTime: 60_000,
  });
}
