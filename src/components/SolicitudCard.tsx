import type { SolicitudPublica } from '@/lib/types';
import { cop } from '@/lib/format';
import { logContactoSolicitud } from '@/lib/api';

// Tarjeta completa para /familias. WhatsApp directo con el número que la familia
// declaró en su solicitud. Cada clic queda auditado en `contactos` via el log
// fire-and-forget — el ancla nativa navega sin esperar al POST.
export function SolicitudCard({ s }: { s: SolicitudPublica }) {
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

  const censoLabel =
    s.en_censo === 'si' ? 'En censo' : s.en_censo === 'tramite' ? 'Censo en trámite' : null;

  const wa = `https://wa.me/57${s.telefono}?text=${encodeURIComponent(
    `Hola ${s.nombre_corto}, escribo por su solicitud en hogarsolidario.co (familia de ${total} en ${s.municipio}). Tengo un inmueble que puede servirle.`,
  )}`;

  return (
    <article className="bg-surface border border-line rounded p-4 sm:p-5 flex flex-col gap-3">
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted">
          {[s.municipio, s.zona, s.tipo].filter(Boolean).join(' · ')}
        </div>
        <h3 className="text-[19px] font-display font-semibold leading-tight mt-1">
          {s.nombre_corto} · Familia de {total}
        </h3>
        <div className="text-[13px] text-muted mt-1">{composition}</div>
      </div>

      <div className="flex gap-[14px] flex-wrap text-[12.5px] text-ink-2 border-t border-b border-line-soft py-[9px]">
        <span>
          desde <b className="font-mono font-semibold">{s.habitaciones_min}</b> hab.
        </span>
        {s.tope_canon > 0 && (
          <span>
            hasta <b className="font-mono font-semibold">{cop(s.tope_canon)}</b>/mes
          </span>
        )}
        {censoLabel && <span>{censoLabel}</span>}
      </div>

      {s.situacion && <p className="text-[13px] text-ink-2 m-0 italic">"{s.situacion}"</p>}

      <div className="flex mt-auto pt-1">
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          onClick={() => logContactoSolicitud(s.id)}
          className="font-display font-semibold text-[13px] px-4 py-2 rounded border border-ink bg-ink text-white hover:bg-ink-2 no-underline focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
        >
          Escribir por WhatsApp
        </a>
      </div>
    </article>
  );
}
