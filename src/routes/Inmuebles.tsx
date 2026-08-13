import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { InmuebleCard } from '@/components/InmuebleCard';
import { Chip } from '@/components/Chip';
import { useInmuebles } from '@/hooks/useInmuebles';
import { aplicarFiltros } from '@/lib/filters';
import { suggestFilterRemovals, municipiosCercanos } from '@/lib/suggestions';
import { FILTROS_INICIALES, type FiltrosInmuebles, type OrdenInmuebles } from '@/lib/types';
import { DEPARTAMENTOS, DEPTOS, ZONAS, TIPOS, type Departamento } from '@/data/municipios';
import { FLAGS, type FlagKey } from '@/data/flags';

export function Inmuebles() {
  const { data: inmuebles = [], isLoading, error } = useInmuebles();
  const [f, setF] = useState<FiltrosInmuebles>(FILTROS_INICIALES);

  const municipiosDisponibles = f.departamento ? DEPTOS[f.departamento] : null;
  const resultados = useMemo(() => aplicarFiltros(inmuebles, f), [inmuebles, f]);
  const sugerencias = useMemo(
    () => (resultados.length === 0 ? suggestFilterRemovals(inmuebles, f, 0) : []),
    [inmuebles, f, resultados.length],
  );
  const cercanos = useMemo(
    () => (resultados.length === 0 && f.municipio ? municipiosCercanos(inmuebles, f) : []),
    [inmuebles, f, resultados.length],
  );

  // Densidad dinámica: con pocos resultados usamos menos columnas para que las
  // tarjetas se vean llenas en vez de perdidas en huecos.
  const gridClass =
    resultados.length <= 2
      ? 'grid grid-cols-1 gap-4 max-w-[720px]'
      : resultados.length <= 4
        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

  function limpiar() {
    setF(FILTROS_INICIALES);
  }

  function toggleFlag(k: FlagKey) {
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

      <div className="wrap grid grid-cols-1 md:grid-cols-[262px_1fr] gap-[26px] py-6 pb-16 items-start">
        <aside className="bg-surface border border-line rounded p-[18px] md:sticky md:top-[14px]">
          <p className="eyebrow">Filtros</p>

          <div className="mb-[15px]">
            <label className="block text-[12px] font-semibold mb-[5px]" htmlFor="fDepto">
              Departamento
            </label>
            <select
              id="fDepto"
              value={f.departamento}
              onChange={(e) => {
                const dep = e.target.value as Departamento | '';
                setF((s) => ({ ...s, departamento: dep, municipio: '' }));
              }}
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
            >
              <option value="">Todos</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-[15px]">
            <label className="block text-[12px] font-semibold mb-[5px]" htmlFor="fMun">
              Municipio
            </label>
            <select
              id="fMun"
              value={f.municipio}
              onChange={(e) => setF((s) => ({ ...s, municipio: e.target.value }))}
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
            >
              <option value="">Todos</option>
              {municipiosDisponibles
                ? municipiosDisponibles.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                : DEPARTAMENTOS.map((d) => (
                    <optgroup key={d} label={d}>
                      {DEPTOS[d].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </optgroup>
                  ))}
            </select>
          </div>

          <div className="mb-[15px]">
            <label className="block text-[12px] font-semibold mb-[5px]" htmlFor="fZona">
              Zona
            </label>
            <select
              id="fZona"
              value={f.zona}
              onChange={(e) =>
                setF((s) => ({ ...s, zona: (e.target.value as FiltrosInmuebles['zona']) }))
              }
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
            >
              <option value="">Todas</option>
              {ZONAS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-[15px]">
            <label className="block text-[12px] font-semibold mb-[5px]" htmlFor="fTipo">
              Tipo
            </label>
            <select
              id="fTipo"
              value={f.tipo}
              onChange={(e) =>
                setF((s) => ({ ...s, tipo: (e.target.value as FiltrosInmuebles['tipo']) }))
              }
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
            >
              <option value="">Todos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-[15px]">
            <label className="block text-[12px] font-semibold mb-[5px]" htmlFor="fPrecio">
              Canon máximo (COP/mes)
            </label>
            <input
              id="fPrecio"
              type="number"
              min={0}
              step={50000}
              placeholder="Sin límite"
              value={f.canonMax ?? ''}
              onChange={(e) =>
                setF((s) => ({
                  ...s,
                  canonMax: e.target.value ? Math.max(0, parseInt(e.target.value, 10)) : null,
                }))
              }
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
            />
          </div>

          <div className="mb-[15px]">
            <label className="block text-[12px] font-semibold mb-[5px]" htmlFor="fHab">
              Habitaciones mínimas
            </label>
            <select
              id="fHab"
              value={f.habitacionesMin?.toString() ?? ''}
              onChange={(e) =>
                setF((s) => ({
                  ...s,
                  habitacionesMin: e.target.value ? parseInt(e.target.value, 10) : null,
                }))
              }
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
            >
              <option value="">Cualquiera</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="mb-[15px]">
            <label className="flex items-start gap-[9px] text-[13px] cursor-pointer border border-line-soft rounded p-[10px] hover:border-line">
              <input
                type="checkbox"
                className="mt-[2px] accent-ink flex-none"
                checked={f.soloRevisadosIngenieria}
                onChange={(e) =>
                  setF((s) => ({ ...s, soloRevisadosIngenieria: e.target.checked }))
                }
              />
              <span>
                Solo revisados por ingeniería
                <span className="block text-[11.5px] text-muted mt-[2px]">
                  Excluye "sin daños aparentes" y "sin revisar".
                </span>
              </span>
            </label>
          </div>

          <div className="mb-[15px]">
            <p className="eyebrow mb-2">Condiciones</p>
            <div className="flex flex-wrap gap-[6px]">
              {FLAGS.map((flg) => (
                <Chip
                  key={flg.k}
                  on={f.flags.has(flg.k)}
                  onClick={() => toggleFlag(flg.k)}
                >
                  {flg.l}
                </Chip>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={limpiar}
            className="bg-transparent border-none p-0 text-muted text-[12px] underline cursor-pointer hover:text-ink"
          >
            Quitar todos los filtros
          </button>
        </aside>

        <section>
          <div className="flex justify-between items-baseline gap-3 mb-[14px] flex-wrap">
            <span className="font-mono text-[13px]">
              {isLoading
                ? 'Cargando…'
                : `${resultados.length} ${resultados.length === 1 ? 'inmueble' : 'inmuebles'}`}
            </span>
            <label className="text-[12px] font-semibold flex gap-2 items-center font-normal">
              Ordenar
              <select
                value={f.orden}
                onChange={(e) =>
                  setF((s) => ({ ...s, orden: e.target.value as OrdenInmuebles }))
                }
                className="text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface"
              >
                <option value="recientes">Más recientes</option>
                <option value="baratos">Canon más bajo</option>
                <option value="grandes">Más habitaciones</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="bg-alert-soft border border-alert-line text-alert p-4 rounded">
              Error cargando inmuebles: {(error as Error).message}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface border border-line-soft rounded p-4 h-[280px] animate-pulse"
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
            <div className={gridClass}>
              {resultados.map((inm) => (
                <InmuebleCard key={inm.id} inm={inm} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
