import { Link } from 'react-router-dom';
import type { InmueblePublico } from '@/lib/types';
import { cop, shortId } from '@/lib/format';
import { Badge } from './Badge';
import { FLAGS, type FlagKey } from '@/data/flags';

const FLAG_LABEL: Record<FlagKey, string> = Object.fromEntries(
  FLAGS.map((f) => [f.k, f.l]),
) as Record<FlagKey, string>;

// Chips que quitan barreras (ámbar). Se muestran arriba de todo lo demás.
const BARRIER_KEYS: readonly FlagKey[] = ['gratuito', 'sinFiador', 'sinDeposito', 'subsidio'];
// Los demás flags — se muestran en un bloque secundario, más discretos.
const SECONDARY_KEYS: readonly FlagKey[] = ['inmediata', 'amoblado', 'mascotas', 'accesible'];

export function InmuebleCard({ inm }: { inm: InmueblePublico }) {
  const barrierChips = BARRIER_KEYS.filter((k) => inm.flags[k]);
  const secondaryChips = SECONDARY_KEYS.filter((k) => inm.flags[k]);
  const propietarioSinVerificar = inm.publicado_por === 'propietario';
  const necesitaRevisar = inm.estado_estructural === 'sin_revisar';
  const dispHoy = inm.disponible_desde === 'Inmediata';

  return (
    <article
      className={[
        'bg-surface rounded p-4 sm:p-5 flex flex-col gap-3',
        'border border-line',
        'hover:border-ink transition-colors',
      ].join(' ')}
    >
      {/* pequeña banda superior: código + estado disponibilidad */}
      <div className="font-mono text-[10.5px] text-muted tracking-[0.06em] flex items-center gap-2 flex-wrap">
        <span>{shortId(inm.id)}</span>
        <span aria-hidden="true">·</span>
        <span className={dispHoy ? 'text-verify-ink font-semibold' : ''}>
          {dispHoy ? 'DISPONIBLE HOY' : 'DISPONIBLE ' + (inm.disponible_desde ?? '').toUpperCase()}
        </span>
      </div>

      {/* PRIMER GOLPE DE VISTA: municipio + canon */}
      <div>
        <h3 className="text-[19px] font-semibold font-display leading-[1.15]">
          <Link to={`/inmuebles/${inm.id}`} className="text-inherit no-underline hover:underline">
            {inm.municipio}
          </Link>
          {inm.zona ? <span className="text-muted font-normal"> · {inm.zona}</span> : null}
        </h3>
        <div
          className={
            'mt-1 font-mono text-[24px] sm:text-[26px] font-semibold leading-none' +
            (inm.canon === 0 ? ' text-verify' : '')
          }
        >
          {cop(inm.canon)}
          {inm.canon > 0 && (
            <small className="text-[12px] font-normal text-muted"> / mes</small>
          )}
        </div>
      </div>

      {/* subtítulo: tipo + barrio + duración */}
      <div className="text-[13px] text-muted">
        {inm.tipo} en {inm.barrio}
        {inm.duracion_minima ? ' · mínimo ' + inm.duracion_minima : ''}
      </div>

      {/* CHIPS QUE QUITAN BARRERAS — ámbar, arriba de todo */}
      {barrierChips.length > 0 && (
        <div className="flex flex-wrap gap-[5px]">
          {barrierChips.map((k) => (
            <Badge key={k} tone="key">
              {FLAG_LABEL[k]}
            </Badge>
          ))}
        </div>
      )}

      {/* specs numéricos — línea horizontal simple */}
      <div className="flex gap-[14px] flex-wrap text-[12.5px] text-ink-2 border-t border-b border-line-soft py-[9px]">
        <span>
          <b className="font-mono font-semibold">{inm.habitaciones}</b> hab.
        </span>
        <span>
          <b className="font-mono font-semibold">{inm.banos}</b> baños
        </span>
        {inm.area_m2 ? (
          <span>
            <b className="font-mono font-semibold">{inm.area_m2}</b> m²
          </span>
        ) : null}
      </div>

      {inm.notas ? (
        <p className="text-[13px] text-muted m-0 line-clamp-2">{inm.notas}</p>
      ) : null}

      {/* CHIPS SECUNDARIOS + advertencias — font-medium para no competir con el h3 */}
      {(secondaryChips.length > 0 || necesitaRevisar || propietarioSinVerificar) && (
        <div className="flex flex-wrap gap-[5px]">
          {necesitaRevisar && <Badge tone="warn">Sin revisar tras el sismo</Badge>}
          {propietarioSinVerificar && <Badge tone="neutral">Publicante sin verificar</Badge>}
          {secondaryChips.map((k) => (
            <Badge key={k} tone="neutral">
              {FLAG_LABEL[k]}
            </Badge>
          ))}
        </div>
      )}

      {/* quién publica — línea sobria */}
      <div className="text-[12px] text-muted flex items-center gap-[6px]">
        <span className="text-verify" aria-hidden="true">✓</span> {inm.quien_nombre} ·{' '}
        {inm.publicado_por === 'inmobiliaria' ? 'Inmobiliaria' : 'Propietario'} solidario
      </div>

      <div className="flex mt-auto pt-1">
        <Link
          to={`/inmuebles/${inm.id}`}
          className={[
            'w-full font-display font-semibold text-[13px] px-3 py-2 rounded inline-flex items-center justify-center',
            'bg-ink text-white border border-ink hover:bg-ink-2 no-underline',
            'focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2',
          ].join(' ')}
        >
          Ver detalles
        </Link>
      </div>
    </article>
  );
}
