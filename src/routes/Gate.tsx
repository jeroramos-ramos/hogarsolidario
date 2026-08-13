import { useNavigate } from 'react-router-dom';
import { Ticker } from '@/components/Ticker';
import { StatsBanner } from '@/components/StatsBanner';
import { useStats } from '@/hooks/useStats';

type RoleKey = 'inmobiliaria' | 'propietario' | 'afectado';

type RoleCard = {
  num: string;
  key: RoleKey;
  title: string;
  body: string;
  cta: string;
  to: string;
};

const ROLES: RoleCard[] = [
  {
    num: '01',
    key: 'inmobiliaria',
    title: 'Soy Inmobiliaria Solidaria',
    body: 'Cargue su inventario disponible, vea en tiempo real qué está pidiendo cada familia y contáctela directamente. Sin comisión para nosotros.',
    cta: 'Publicar inmueble →',
    to: '/publicar/inmueble?rol=inmobiliaria',
  },
  {
    num: '02',
    key: 'propietario',
    title: 'Soy Propietario Solidario',
    body: 'Tiene un apartamento, una casa o una habitación desocupada. La ofrece en arriendo justo o cedida sin costo mientras pasa la emergencia.',
    cta: 'Publicar mi inmueble →',
    to: '/publicar/inmueble?rol=propietario',
  },
  {
    num: '03',
    key: 'afectado',
    title: 'Soy afectado por el terremoto',
    body: 'Busque entre los inmuebles disponibles o deje su solicitud: cuántos son, qué necesitan y hasta cuánto pueden pagar. Las inmobiliarias la verán.',
    cta: 'Buscar vivienda →',
    to: '/inmuebles',
  },
];

export function Gate() {
  const navigate = useNavigate();
  const { data: stats } = useStats();

  return (
    <>
      <Ticker inmuebles={stats?.total ?? 0} familias={0} />

      <section className="wrap pt-14 pb-20">
        <div className="max-w-[60ch]">
          <p className="eyebrow">Red solidaria de vivienda · zonas afectadas</p>
          <h1 className="text-[clamp(28px,5vw,44px)] font-bold leading-[1.02]">
            Un techo mientras
            <br />
            volvemos a levantar
            <br />
            <em className="not-italic text-muted">lo que se cayó.</em>
          </h1>
          <p className="text-base text-ink-2 mt-4">
            Conectamos a las familias que quedaron sin vivienda por el terremoto con inmobiliarias y
            propietarios del Valle, el Eje Cafetero y el Chocó que están abriendo sus inmuebles.
            Buscar es gratis y no pedimos documentos.
          </p>
        </div>

        <StatsBanner />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mt-8">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => navigate(r.to)}
              className={
                'text-left bg-surface rounded p-[22px] cursor-pointer ' +
                'flex flex-col gap-[9px] transition-transform transition-colors ' +
                // Bordes explícitos por lado para evitar cualquier ambigüedad de shorthand/longhand.
                'border-l border-r border-b border-t-[3px] ' +
                'border-l-line border-r-line border-b-line border-t-line ' +
                'hover:border-l-ink hover:border-r-ink hover:border-b-ink hover:border-t-signal ' +
                'hover:-translate-y-[2px] ' +
                'focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-[3px] ' +
                'text-inherit font-body'
              }
            >
              <span className="font-mono text-[11px] text-muted tracking-[0.1em]">{r.num}</span>
              <h3 className="text-[19px] font-semibold font-display">{r.title}</h3>
              <p className="text-[13.5px] text-muted flex-1 m-0">{r.body}</p>
              <span className="font-display font-semibold text-[13px] text-ink border-t border-line-soft pt-[11px]">
                {r.cta}
              </span>
            </button>
          ))}
        </div>

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
