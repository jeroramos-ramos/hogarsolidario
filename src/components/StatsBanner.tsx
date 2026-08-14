import { useStats } from '@/hooks/useStats';

// Franja de 3 datos vivos. Aparece entre el h1 y las tarjetas de rol.
// Cuando el total es 0, muestra una sola línea explicativa — un cero grande
// en la portada mata la confianza.
export function StatsBanner() {
  const { data, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="border border-line rounded p-4 sm:p-5 mt-8 h-[92px] animate-pulse bg-surface" />
    );
  }

  if (error || !data || data.total === 0) {
    return (
      <div className="border border-line rounded p-4 sm:p-5 mt-8 bg-surface">
        <p className="eyebrow mb-1">Estado del inventario</p>
        <p className="text-[14px] text-ink-2 m-0">
          Las inmobiliarias y propietarios están cargando sus inmuebles en este momento.
          Volvé en unos minutos.
        </p>
      </div>
    );
  }

  const stats: Array<{ n: number; label: string }> = [
    { n: data.total, label: 'Inmuebles disponibles' },
    { n: data.municipios, label: 'Municipios con oferta' },
  ];

  return (
    <div className="border border-line rounded bg-surface mt-8 divide-y sm:divide-y-0 sm:divide-x divide-line-soft grid grid-cols-1 sm:grid-cols-2">
      {stats.map((s) => (
        <div key={s.label} className="px-4 sm:px-5 py-4">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">
            {s.label}
          </div>
          <div className="font-mono text-[34px] sm:text-[38px] font-semibold leading-none mt-1 tabular-nums">
            {s.n.toLocaleString('es-CO')}
          </div>
        </div>
      ))}
    </div>
  );
}
