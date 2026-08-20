import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { SolicitudCard } from '@/components/SolicitudCard';
import { useSolicitudes } from '@/hooks/useSolicitudes';
import { useInmuebles } from '@/hooks/useInmuebles';

export function Familias() {
  const { data: solicitudes = [], isLoading, error } = useSolicitudes();
  const { data: inmuebles = [] } = useInmuebles();

  return (
    <>
      <Ticker inmuebles={inmuebles.length} familias={solicitudes.length} />
      <AppHeader />

      <div className="wrap py-6 pb-16">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="text-[24px] sm:text-[28px] font-display font-bold">
            Familias buscando vivienda
          </h1>
          <span className="font-mono text-[13px] text-muted whitespace-nowrap">
            {isLoading
              ? 'Cargando…'
              : `${solicitudes.length} ${solicitudes.length === 1 ? 'solicitud' : 'solicitudes'}`}
          </span>
        </div>

        <div className="mt-4 border-l-[3px] border-verify bg-verify-soft text-verify-ink p-[13px] pl-4 rounded-r text-[13px] max-w-[70ch]">
          <b>Aquí está la demanda real.</b> Cada tarjeta es una familia que ya dijo qué
          necesita y cuánto puede pagar. Escribiles directamente por WhatsApp — cada
          contacto queda registrado para medir uso. En el listado no aparece el apellido
          ni las notas privadas que la familia haya escrito.
        </div>

        {error && (
          <div className="mt-6 bg-alert-soft border border-alert-line text-alert p-4 rounded">
            Error cargando solicitudes: {(error as Error).message}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-line-soft rounded h-[240px] animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && solicitudes.length === 0 && (
          <div className="mt-6 bg-surface border border-dashed border-line rounded p-8 sm:p-10">
            <h3 className="text-[19px] font-display font-semibold">
              Aún no hay solicitudes publicadas
            </h3>
            <p className="text-muted text-sm mt-2 max-w-[52ch]">
              Cuando una familia deje su solicitud aquí verás qué necesita — municipio, número
              de personas, tope de canon y situación actual.
            </p>
            <Link
              to="/publicar/solicitud"
              className="inline-block mt-5 font-display font-semibold text-[13px] px-4 py-2 rounded border border-ink bg-transparent text-ink hover:bg-paper no-underline"
            >
              Publicar mi solicitud
            </Link>
          </div>
        )}

        {!isLoading && !error && solicitudes.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {solicitudes.map((s) => (
              <SolicitudCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
