import type { SolicitudPublica } from '@/lib/types';
import { cop } from '@/lib/format';

// Tarjeta compacta para la puerta. Sin foto (no aplica). Sin botón de contacto
// (el flujo completo vive en /familias). Nunca imprime nombre completo, teléfono
// ni la nota libre — solo lo que trae la vista pública.
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

  return (
    <article className="bg-surface border border-line rounded p-4 flex flex-col gap-2">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted leading-tight">
        {[s.municipio, s.zona, s.tipo].filter(Boolean).join(' · ')}
      </div>

      <h3 className="text-[18px] font-display font-semibold leading-tight">
        Familia de {total} {total === 1 ? 'persona' : 'personas'}
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
    </article>
  );
}
