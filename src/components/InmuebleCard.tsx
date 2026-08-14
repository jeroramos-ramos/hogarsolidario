import { Link } from 'react-router-dom';
import type { InmueblePublico } from '@/lib/types';
import { cop, shortId } from '@/lib/format';
import { publicUrl } from '@/lib/photos';
import { logContactoInmueble } from '@/lib/api';
import { Badge } from './Badge';
import { PlaceholderPhoto } from './PlaceholderPhoto';

// Los sellos positivos (sin fiador, subsidio, amoblado, revisado, etc.) no se
// muestran en la vista pública mientras el inventario está en formación.
// Se mantienen guardados en la base para poder reactivarlos sin editar avisos.
// Excepciones que sí quedan: la advertencia "sin revisar tras el sismo" y el
// disclosure "publicante sin verificar" — información de seguridad, no sellos.

export function InmuebleCard({ inm }: { inm: InmueblePublico }) {
  const necesitaRevisar = inm.estado_estructural === 'sin_revisar';
  const foto = inm.fotos[0];

  const metaTags = [inm.tipo, inm.municipio, inm.zona].filter(
    (x): x is string => Boolean(x),
  );

  const waUrl = `https://wa.me/57${inm.telefono}?text=${encodeURIComponent(
    `Hola, escribo por el inmueble ${shortId(inm.id)} de hogarsolidario.co (${inm.tipo} en ${inm.barrio}, ${inm.municipio}). ¿Sigue disponible?`,
  )}`;

  return (
    <article className="bg-surface border border-line rounded p-3 sm:p-4 hover:border-ink transition-colors">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Foto: cuadrada en desktop, 4:3 arriba en móvil */}
        <Link
          to={`/inmuebles/${inm.id}`}
          className="w-full sm:w-32 md:w-40 flex-none aspect-[4/3] sm:aspect-square bg-paper border border-line-soft rounded overflow-hidden block"
        >
          {foto ? (
            <img
              src={publicUrl(foto)}
              alt={`${inm.tipo} en ${inm.barrio}`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <PlaceholderPhoto />
          )}
        </Link>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Meta tags mono uppercase */}
          <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted leading-tight">
            {metaTags.join(' · ')}
          </div>

          {/* Barrio (grande) + canon (grande, mono, derecha) */}
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <h3 className="text-[19px] font-display font-semibold leading-tight min-w-0">
              <Link
                to={`/inmuebles/${inm.id}`}
                className="text-inherit no-underline hover:underline"
              >
                {inm.barrio}
              </Link>
            </h3>
            <div
              className={
                'font-mono text-[19px] font-semibold whitespace-nowrap leading-none pt-1' +
                (inm.canon === 0 ? ' text-verify' : '')
              }
            >
              {cop(inm.canon)}
              {inm.canon > 0 && (
                <small className="text-[11.5px] font-normal text-muted"> / mes</small>
              )}
            </div>
          </div>

          {/* Descripción truncada a 1 línea */}
          {inm.notas ? (
            <p className="text-[13px] text-muted line-clamp-1 m-0">{inm.notas}</p>
          ) : null}

          {/* Sellos positivos ocultos. Solo mostramos la advertencia de seguridad
              cuando el estructural es "sin revisar" — información que la familia
              necesita saber. El disclosure "publicado por particular" vive en la
              ficha, no acá — en la fila el nombre + "Propietario solidario" del
              pie ya diferencia al publicante. */}
          {necesitaRevisar && (
            <div className="flex flex-wrap gap-1">
              <Badge tone="warn">Sin revisar tras el sismo</Badge>
            </div>
          )}

          {/* Pie: publica + WhatsApp + Ver. WhatsApp registra el clic. */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1 mt-auto">
            <span className="text-[12px] text-muted min-w-0 truncate">
              <span className="text-verify" aria-hidden="true">
                ✓
              </span>{' '}
              {inm.quien_nombre}
            </span>
            <div className="flex gap-2 flex-none">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener"
                onClick={() => logContactoInmueble(inm.id)}
                className="font-display font-semibold text-[12px] px-3 py-2 rounded border border-ink bg-ink text-white hover:bg-ink-2 no-underline focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                WhatsApp
              </a>
              <Link
                to={`/inmuebles/${inm.id}`}
                className="font-display font-semibold text-[12px] px-3 py-2 rounded border border-ink bg-transparent text-ink hover:bg-paper no-underline focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                Ver
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
