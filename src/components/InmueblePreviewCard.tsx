import { Link } from 'react-router-dom';
import type { InmueblePublico } from '@/lib/types';
import { cop } from '@/lib/format';
import { publicUrl } from '@/lib/photos';
import { Badge } from './Badge';
import { PlaceholderPhoto } from './PlaceholderPhoto';

// Tarjeta con foto destacada 4:3 arriba, para el catálogo en la puerta.
// No muestra sellos positivos (sin fiador, subsidio, etc.) — decisión de
// producto para no prometer cosas sin verificar. Sí muestra advertencias
// de seguridad y disclosures (sin revisar tras el sismo, sin verificar).
export function InmueblePreviewCard({ inm }: { inm: InmueblePublico }) {
  const foto = inm.fotos[0];
  const necesitaRevisar = inm.estado_estructural === 'sin_revisar';
  const propietarioSinVerificar = inm.publicado_por === 'propietario';

  return (
    <Link
      to={`/inmuebles/${inm.id}`}
      className="group bg-surface border border-line rounded overflow-hidden hover:border-ink transition-colors block no-underline text-inherit"
    >
      <div className="aspect-[4/3] bg-paper border-b border-line-soft overflow-hidden">
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
      </div>

      <div className="p-4 flex flex-col gap-2">
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted leading-tight">
          {[inm.tipo, inm.municipio, inm.zona].filter(Boolean).join(' · ')}
        </div>

        <h3 className="text-[18px] font-display font-semibold leading-tight">
          {inm.barrio}
        </h3>

        <div
          className={
            'font-mono text-[20px] font-semibold leading-none' +
            (inm.canon === 0 ? ' text-verify' : '')
          }
        >
          {cop(inm.canon)}
          {inm.canon > 0 && (
            <small className="text-[11.5px] font-normal text-muted"> / mes</small>
          )}
        </div>

        {(necesitaRevisar || propietarioSinVerificar) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {necesitaRevisar && <Badge tone="warn">Sin revisar tras el sismo</Badge>}
            {propietarioSinVerificar && (
              <Badge tone="neutral">Publicante sin verificar</Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
