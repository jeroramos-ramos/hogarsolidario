import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Home, HandHeart, type LucideIcon } from 'lucide-react';
import { Ticker } from '@/components/Ticker';
import { Hero } from '@/components/Hero';
import { InmueblePreviewCard } from '@/components/InmueblePreviewCard';
import { SolicitudPreviewCard } from '@/components/SolicitudPreviewCard';
import { useInmuebles } from '@/hooks/useInmuebles';
import { useSolicitudes } from '@/hooks/useSolicitudes';

type RoleKey = 'inmobiliaria' | 'propietario' | 'afectado';

type RoleCard = {
  num: string;
  key: RoleKey;
  icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  to: string;
};

const ROLES: RoleCard[] = [
  {
    num: '01',
    key: 'inmobiliaria',
    icon: Building2,
    title: 'Soy Inmobiliaria Solidaria',
    body: 'Cargue su inventario disponible, vea en tiempo real qué está pidiendo cada familia y contáctela directamente. Sin comisión para nosotros.',
    cta: 'Publicar inmueble →',
    to: '/publicar/inmueble?rol=inmobiliaria',
  },
  {
    num: '02',
    key: 'propietario',
    icon: Home,
    title: 'Soy Propietario Solidario',
    body: 'Tiene un apartamento, una casa o una habitación desocupada. La ofrece en arriendo justo o cedida sin costo mientras pasa la emergencia.',
    cta: 'Publicar mi inmueble →',
    to: '/publicar/inmueble?rol=propietario',
  },
  {
    num: '03',
    key: 'afectado',
    icon: HandHeart,
    title: 'Soy afectado por el terremoto',
    body: 'Busque entre los inmuebles disponibles o deje su solicitud: cuántos son, qué necesitan y hasta cuánto pueden pagar. Las inmobiliarias la verán.',
    cta: 'Buscar vivienda →',
    to: '/inmuebles',
  },
];

export function Gate() {
  const navigate = useNavigate();
  const { data: inmuebles = [], isLoading: loadingInmuebles } = useInmuebles();
  const { data: solicitudes = [] } = useSolicitudes();

  // Top 6 por canon ascendente. Familias que llegan por WhatsApp ven
  // vivienda real de una, sin tener que elegir rol.
  const preview = useMemo(() => {
    const sorted = [...inmuebles].sort((a, b) => a.canon - b.canon);
    return sorted.slice(0, 6);
  }, [inmuebles]);
  const totalAvisos = inmuebles.length;
  const totalSolicitudes = solicitudes.length;
  const solicitudesPreview = solicitudes.slice(0, 6);

  return (
    <>
      <Hero />
      <Ticker inmuebles={totalAvisos} familias={totalSolicitudes} />

      <section className="wrap pt-8 pb-20">
        <p className="text-base text-ink-2 max-w-[60ch]">
          Conectamos a las familias que quedaron sin vivienda por el terremoto con inmobiliarias
          y propietarios del Valle, el Eje Cafetero y el Chocó que están abriendo sus inmuebles.
          Buscar es gratis y no pedimos documentos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mt-8">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.key}
                onClick={() => navigate(r.to)}
                className={
                  'group text-left bg-surface rounded p-[22px] cursor-pointer ' +
                  'flex flex-col gap-[9px] transition-transform transition-colors ' +
                  'border-l border-r border-b border-t-[3px] ' +
                  'border-l-line border-r-line border-b-line border-t-line ' +
                  'hover:border-l-ink hover:border-r-ink hover:border-b-ink hover:border-t-signal ' +
                  'hover:-translate-y-[2px] ' +
                  'focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-[3px] ' +
                  'text-inherit font-body'
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={32}
                    strokeWidth={1.5}
                    className="text-ink group-hover:text-signal transition-colors flex-none"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-[11px] text-muted tracking-[0.1em]">{r.num}</span>
                </div>
                <h3 className="text-[19px] font-semibold font-display mt-1">{r.title}</h3>
                <p className="text-[13.5px] text-muted flex-1 m-0">{r.body}</p>
                <span className="font-display font-semibold text-[13px] text-ink border-t border-line-soft pt-[11px]">
                  {r.cta}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Catálogo preview: familias que llegan por WhatsApp ven vivienda ya ─── */}
        {(loadingInmuebles || preview.length > 0) && (
          <section aria-labelledby="cat-heading" className="mt-14">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
              <h2
                id="cat-heading"
                className="text-[22px] sm:text-[26px] font-display font-bold leading-tight"
              >
                Inmuebles disponibles
                {!loadingInmuebles && (
                  <span className="ml-3 font-mono text-[14px] font-normal text-muted">
                    {totalAvisos} {totalAvisos === 1 ? 'aviso' : 'avisos'}
                  </span>
                )}
              </h2>
              {totalAvisos > preview.length && (
                <Link
                  to="/inmuebles"
                  className="text-[13px] font-display font-semibold text-ink underline hover:no-underline no-underline whitespace-nowrap"
                >
                  Ver los {totalAvisos} →
                </Link>
              )}
            </div>

            {loadingInmuebles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-surface border border-line-soft rounded h-[320px] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {preview.map((inm) => (
                  <InmueblePreviewCard key={inm.id} inm={inm} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── Solicitudes de familias — solo si hay ≥ 1 ─── */}
        {solicitudesPreview.length > 0 && (
          <section aria-labelledby="sol-heading" className="mt-14">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
              <h2
                id="sol-heading"
                className="text-[22px] sm:text-[26px] font-display font-bold leading-tight"
              >
                Familias buscando vivienda
                <span className="ml-3 font-mono text-[14px] font-normal text-muted">
                  {totalSolicitudes} {totalSolicitudes === 1 ? 'solicitud' : 'solicitudes'}
                </span>
              </h2>
              {totalSolicitudes > solicitudesPreview.length && (
                <Link
                  to="/familias"
                  className="text-[13px] font-display font-semibold text-ink underline hover:no-underline no-underline whitespace-nowrap"
                >
                  Ver todas →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {solicitudesPreview.map((s) => (
                <SolicitudPreviewCard key={s.id} s={s} />
              ))}
            </div>
          </section>
        )}

        <p className="mt-[34px] text-[12.5px] text-muted max-w-[70ch] border-l-[3px] border-line pl-[14px]">
          <b className="text-ink">
            Hogar Solidario no arrienda, no cobra y no verifica los avisos.
          </b>{' '}
          Somos un punto de encuentro. Visite siempre el inmueble antes de comprometerse, exija
          contrato escrito y no consigne dinero a cuentas personales ni pague nada por "separar". Si
          alguien le exige plata antes de mostrarle la vivienda, es una estafa.
        </p>
      </section>
    </>
  );
}
