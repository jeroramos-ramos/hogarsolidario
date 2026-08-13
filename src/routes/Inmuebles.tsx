import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { InmuebleCard } from '@/components/InmuebleCard';
import { Chip } from '@/components/Chip';
import { useInmuebles } from '@/hooks/useInmuebles';
import { aplicarFiltros } from '@/lib/filters';
import { suggestFilterRemovals, municipiosCercanos } from '@/lib/suggestions';
import { FILTROS_INICIALES, type FiltrosInmuebles, type OrdenInmuebles } from '@/lib/types';
import type { InmueblePublico } from '@/lib/types';
import { FLAGS, type FlagKey } from '@/data/flags';
import type { Zona } from '@/data/municipios';

// Cuenta valores no-nulos en un array; devuelve pares ordenados por frecuencia desc.
function frecuencias<T extends string>(items: readonly (T | null | undefined)[]): Array<{ value: T; count: number }> {
  const map = new Map<T, number>();
  for (const it of items) {
    if (!it) continue;
    map.set(it, (map.get(it) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function toneOfBarrier(k: FlagKey): boolean {
  return k === 'sinFiador' || k === 'sinDeposito' || k === 'subsidio' || k === 'gratuito';
}

export function Inmuebles() {
  const { data: inmuebles = [], isLoading, error } = useInmuebles();
  const [f, setF] = useState<FiltrosInmuebles>(FILTROS_INICIALES);
  const [openCondiciones, setOpenCondiciones] = useState(false);

  const resultados = useMemo(() => aplicarFiltros(inmuebles, f), [inmuebles, f]);
  const sugerencias = useMemo(
    () => (resultados.length === 0 ? suggestFilterRemovals(inmuebles, f, 0) : []),
    [inmuebles, f, resultados.length],
  );
  const cercanos = useMemo(
    () => (resultados.length === 0 && f.municipio ? municipiosCercanos(inmuebles, f) : []),
    [inmuebles, f, resultados.length],
  );

  // Municipios y zonas se derivan del inventario visible con los OTROS filtros aplicados
  // (excluyendo el propio filtro). Así no colapsamos la lista cuando ya hay uno activo.
  const municipiosDisponibles = useMemo(() => {
    const sinMun: FiltrosInmuebles = { ...f, municipio: '' };
    const base = aplicarFiltros(inmuebles, sinMun);
    return frecuencias<string>(base.map((i) => i.municipio));
  }, [inmuebles, f]);

  const zonasDisponibles = useMemo(() => {
    const sinZona: FiltrosInmuebles = { ...f, zona: '' };
    const base = aplicarFiltros(inmuebles, sinZona);
    return frecuencias<Zona>(base.map((i: InmueblePublico) => i.zona));
  }, [inmuebles, f]);

  const activeCondCount =
    f.flags.size + (f.soloRevisadosIngenieria ? 1 : 0);

  function limpiar(): void {
    setF(FILTROS_INICIALES);
  }

  function toggleFlag(k: FlagKey): void {
    setF((s) => {
      const flags = new Set(s.flags);
      if (flags.has(k)) flags.delete(k);
      else flags.add(k);
      return { ...s, flags };
    });
  }

  return (
    <>
      <Ticker inmuebles={inmuebles.length} familias={0} />
      <AppHeader />

      <div className="wrap py-6 pb-16">
        {/* ─── Título + contador ─── */}
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="text-[24px] sm:text-[28px] font-display font-bold">
            Inmuebles disponibles
          </h1>
          <span className="font-mono text-[13px] text-muted whitespace-nowrap">
            {isLoading
              ? 'Cargando…'
              : `${resultados.length} ${resultados.length === 1 ? 'aviso' : 'avisos'}`}
          </span>
        </div>

        {/* ─── Filtros como chips horizontales ─── */}
        <div className="mt-5 flex flex-col gap-2">
          {/* Municipios */}
          <ChipRow
            label="Municipio"
            active={f.municipio || null}
            onSelect={(v) => setF((s) => ({ ...s, municipio: v ?? '' }))}
            options={municipiosDisponibles}
          />

          {/* Zonas */}
          <ChipRow
            label="Zona"
            active={f.zona || null}
            onSelect={(v) => setF((s) => ({ ...s, zona: (v as Zona | null) ?? '' }))}
            options={zonasDisponibles}
          />

          {/* Condiciones (colapsable) */}
          <div className="border border-line rounded">
            <button
              type="button"
              onClick={() => setOpenCondiciones((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-[12.5px] font-semibold cursor-pointer bg-transparent border-none text-inherit font-body focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-[-2px]"
              aria-expanded={openCondiciones}
            >
              <span>
                Condiciones
                {activeCondCount > 0 && (
                  <span className="ml-2 font-mono text-[11px] text-signal-ink bg-signal-soft border border-signal-line px-1.5 py-0.5 rounded">
                    {activeCondCount}
                  </span>
                )}
              </span>
              <span aria-hidden="true" className="text-muted">
                {openCondiciones ? '−' : '+'}
              </span>
            </button>
            {openCondiciones && (
              <div className="px-3 pb-3 pt-1 border-t border-line-soft flex flex-wrap gap-[6px]">
                {FLAGS.map((flg) => (
                  <Chip
                    key={flg.k}
                    on={f.flags.has(flg.k)}
                    onClick={() => toggleFlag(flg.k)}
                    className={toneOfBarrier(flg.k) && !f.flags.has(flg.k) ? 'border-signal-line' : ''}
                  >
                    {flg.l}
                  </Chip>
                ))}
                <label className="flex items-center gap-2 text-[12px] font-medium border border-line rounded-full px-[11px] py-[7px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.soloRevisadosIngenieria}
                    onChange={(e) =>
                      setF((s) => ({ ...s, soloRevisadosIngenieria: e.target.checked }))
                    }
                    className="accent-ink"
                  />
                  Solo revisados por ingeniería
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ─── Ordenar ─── */}
        <div className="mt-4 flex items-center gap-2 text-[12px]">
          <label htmlFor="fOrden" className="text-muted font-semibold">
            Ordenar
          </label>
          <select
            id="fOrden"
            value={f.orden}
            onChange={(e) => setF((s) => ({ ...s, orden: e.target.value as OrdenInmuebles }))}
            className="text-[13px] px-2 py-1 border border-line rounded bg-surface font-body"
          >
            <option value="recientes">Más recientes</option>
            <option value="baratos">Canon más bajo</option>
            <option value="grandes">Más habitaciones</option>
          </select>
        </div>

        {/* ─── Resultados ─── */}
        <div className="mt-5">
          {error && (
            <div className="bg-alert-soft border border-alert-line text-alert p-4 rounded">
              Error cargando inmuebles: {(error as Error).message}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface border border-line-soft rounded p-4 h-[180px] animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && !error && resultados.length === 0 && (
            <div className="bg-surface border border-dashed border-line rounded p-8 sm:p-10">
              <h3 className="text-[19px] font-display font-semibold">
                {inmuebles.length
                  ? 'Ningún inmueble cumple estos filtros'
                  : 'Todavía no hay inmuebles publicados'}
              </h3>
              <p className="text-muted text-sm mt-2 max-w-[52ch]">
                {inmuebles.length
                  ? 'Estos ajustes te pueden ayudar:'
                  : 'Las inmobiliarias y propietarios están cargando inventario. Volvé a intentarlo en unos minutos.'}
              </p>

              {sugerencias.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2 max-w-[520px]">
                  {sugerencias.map((s) => (
                    <li key={s.filterKey}>
                      <button
                        type="button"
                        onClick={() => setF(s.newFilters)}
                        className="text-left w-full flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-paper border border-line rounded px-3 py-2 hover:border-ink cursor-pointer"
                      >
                        <span className="text-[13.5px] text-ink">{s.label}</span>
                        <span className="text-[11.5px] font-mono text-muted whitespace-nowrap">
                          +{s.additional} {s.additional === 1 ? 'inmueble' : 'inmuebles'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {cercanos.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow">Municipios cercanos con inventario</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {cercanos.map((c) => (
                      <button
                        key={c.municipio}
                        type="button"
                        onClick={() => setF((s) => ({ ...s, municipio: c.municipio }))}
                        className="text-[12.5px] font-medium px-3 py-1.5 border border-line rounded-full bg-surface hover:border-ink cursor-pointer flex items-center gap-2"
                      >
                        {c.municipio}
                        <span className="font-mono text-[11px] text-muted">{c.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inmuebles.length > 0 && (
                <button
                  type="button"
                  onClick={limpiar}
                  className="mt-6 font-display font-semibold text-[13px] px-4 py-2 rounded border border-line bg-transparent text-muted hover:text-ink hover:border-ink"
                >
                  Quitar todos los filtros
                </button>
              )}
            </div>
          )}

          {!isLoading && !error && resultados.length > 0 && (
            <div className="flex flex-col gap-3">
              {resultados.map((inm) => (
                <InmuebleCard key={inm.id} inm={inm} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Fila de chips horizontal con scroll horizontal en móvil.
// Los negativos -mx-4 permiten que en pantallas angostas la fila
// se extienda hasta el borde y ofrezca affordance de scroll.
// ────────────────────────────────────────────────────────────
type ChipRowProps<T extends string> = {
  label: string;
  active: T | null;
  onSelect: (value: T | null) => void;
  options: Array<{ value: T; count: number }>;
};

function ChipRow<T extends string>({ label, active, onSelect, options }: ChipRowProps<T>) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
      <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-muted flex-none pr-1 min-w-[80px]">
        {label}
      </span>
      <Chip on={active === null} onClick={() => onSelect(null)} className="flex-none">
        Todas
      </Chip>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          on={active === opt.value}
          onClick={() => onSelect(opt.value)}
          className="flex-none"
        >
          <span>{opt.value}</span>
          <span className="ml-1.5 font-mono text-[10px] opacity-60">{opt.count}</span>
        </Chip>
      ))}
    </div>
  );
}
