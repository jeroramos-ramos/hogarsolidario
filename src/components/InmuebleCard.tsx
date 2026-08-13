import { Link } from 'react-router-dom';
import type { InmueblePublico } from '@/lib/types';
import { cop, shortId } from '@/lib/format';
import { Badge } from './Badge';
import { BADGE_ORDEN, BADGE_KEY_SET, BADGE_OK_SET, FLAGS } from '@/data/flags';
import type { FlagKey } from '@/data/flags';

const FLAG_LABEL: Record<FlagKey, string> = Object.fromEntries(
  FLAGS.map((f) => [f.k, f.l]),
) as Record<FlagKey, string>;

function badgesOf(inm: InmueblePublico) {
  const badges: Array<{ k: FlagKey; tone: 'key' | 'ok' | 'neutral' }> = [];
  for (const k of BADGE_ORDEN) {
    if (!inm.flags[k]) continue;
    if (BADGE_KEY_SET.has(k)) badges.push({ k, tone: 'key' });
    else if (BADGE_OK_SET.has(k)) badges.push({ k, tone: 'ok' });
    else badges.push({ k, tone: 'neutral' });
  }
  return badges;
}

export function InmuebleCard({ inm }: { inm: InmueblePublico }) {
  const badges = badgesOf(inm);
  const disp = inm.disponible_desde ?? 'Consultar';
  const dur = inm.duracion_minima ?? '';
  const propietarioSinVerificar = inm.publicado_por === 'propietario';
  const necesitaRevisar = inm.estado_estructural === 'sin_revisar';

  return (
    <article
      className={[
        'bg-surface rounded p-4 flex flex-col gap-[11px]',
        'border-l border-r border-b border-t border-line',
        'hover:border-ink hover:-translate-y-[1px]',
        'transition-transform transition-colors',
      ].join(' ')}
    >
      <div>
        <div className="font-mono text-[10.5px] text-muted tracking-[0.06em]">
          {shortId(inm.id)} · {disp === 'Inmediata' ? 'DISPONIBLE HOY' : 'DISPONIBLE ' + disp.toUpperCase()}
        </div>
        <h3 className="text-[16.5px] font-semibold leading-[1.25] font-display mt-1">
          <Link to={`/inmuebles/${inm.id}`} className="text-inherit no-underline hover:underline">
            {inm.tipo} en {inm.barrio}
          </Link>
        </h3>
        <div className="text-[13px] text-muted">
          {inm.municipio}, {inm.departamento}
          {inm.zona ? ' · ' + inm.zona : ''}
          {dur ? ' · mínimo ' + dur : ''}
        </div>
      </div>

      <div
        className={
          'font-mono text-[19px] font-semibold leading-none' +
          (inm.canon === 0 ? ' text-verify' : '')
        }
      >
        {cop(inm.canon)}
        {inm.canon > 0 && (
          <small className="text-[11px] font-normal text-muted"> / mes</small>
        )}
      </div>

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

      {inm.notas ? <p className="text-[13px] text-muted m-0">{inm.notas}</p> : null}

      <div className="flex flex-wrap gap-[5px]">
        {badges.map((b) => (
          <Badge key={b.k} tone={b.tone}>
            {FLAG_LABEL[b.k]}
          </Badge>
        ))}
        {necesitaRevisar && <Badge tone="warn">Sin revisar tras el sismo</Badge>}
        {propietarioSinVerificar && (
          <Badge tone="neutral">Publicante sin verificar</Badge>
        )}
      </div>

      <div className="text-[12px] text-muted flex items-center gap-[6px]">
        <span className="text-verify font-bold">✓</span> {inm.quien_nombre} ·{' '}
        {inm.publicado_por === 'inmobiliaria' ? 'Inmobiliaria' : 'Propietario'} solidario
      </div>

      <div className="flex gap-2 items-center mt-auto pt-1">
        <Link
          to={`/inmuebles/${inm.id}`}
          className={[
            'font-display font-semibold text-[12px] px-3 py-2 rounded inline-flex items-center justify-center gap-[7px]',
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
