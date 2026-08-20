import type { SolicitudPublica } from '@/lib/types';
import { cop } from '@/lib/format';
import { logContactoSolicitud } from '@/lib/api';

// Tarjeta compacta para la puerta. Incluye WhatsApp directo: el clic desde acá
// también queda auditado en `contactos`. Solo primer nombre en el listado; sin
// apellido ni nota (esas son las privacías que se conservan).
export function SolicitudPreviewCard({ s }: { s: SolicitudPublica }) {
  const total = s.adultos + s.ninos + s.adultos_mayores;
  const composition = [
    s.adultos > 0 ? `${s.adultos} ${s.adultos === 1 ? 'adulto' : 'adultos'}` : null,
    s.ninos > 0 ? `${s.ninos} ${s.ninos === 1 ? 'niño' : 'niños'}` : null,
    s.adultos_mayores > 0
      ? `${s.adultos_mayores} ${s.adultos_mayores === 1 ? 'mayor' : 'mayores'}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const wa = `https://wa.me/57${s.telefono}?text=${encodeURIComponent(
    `Hola ${s.nombre_corto}, escribo por su solicitud en hogarsolidario.co (familia de ${total} en ${s.municipio}). Tengo un inmueble que puede servirle.`,
  )}`;

  return (
    <article className="bg-surface border border-line rounded p-4 flex flex-col gap-2">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted leading-tight">
        {[s.municipio, s.zona, s.tipo].filter(Boolean).join(' · ')}
      </div>

      <h3 className="text-[18px] font-display font-semibold leading-tight">
        {s.nombre_corto} · Familia de {total}
      </h3>

      <div className="text-[13px] text-muted">{composition}</div>

      {s.tope_canon > 0 && (
        <div className="font-mono text-[16px] font-semibold leading-none pt-1">
          Hasta {cop(s.tope_canon)}
          <small className="text-[11.5px] font-normal text-muted"> / mes</small>
        </div>
      )}

      {s.situacion && (
        <p className="text-[12.5px] text-ink-2 m-0 mt-1 italic">"{s.situacion}"</p>
      )}

      <div className="flex mt-auto pt-2">
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          onClick={() => logContactoSolicitud(s.id)}
          className="font-display font-semibold text-[12px] px-3 py-2 rounded border border-ink bg-ink text-white hover:bg-ink-2 no-underline focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
        >
          Escribir por WhatsApp
        </a>
      </div>
    </article>
  );
}
