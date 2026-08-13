import type { ReactNode } from 'react';

type AppErrorProps = {
  title: string;
  detail: ReactNode;
  hint?: ReactNode;
  showReload?: boolean;
};

// Pantalla amigable para fallas de configuración o de runtime.
// NO importa nada de Supabase — funciona aunque el cliente esté caído.
// Mantiene la barra de ticker y la marca para que la familia sepa dónde está.
export function AppError({ title, detail, hint, showReload = true }: AppErrorProps) {
  return (
    <div className="font-body text-ink bg-paper min-h-screen">
      <div className="bg-ink text-[#DDE6E3] font-mono text-[11.5px] tracking-[0.04em] py-[9px]">
        <div className="wrap flex items-center gap-[14px] flex-wrap">
          <span
            aria-hidden="true"
            className="w-[7px] h-[7px] rounded-full bg-signal flex-none"
          />
          <span>SISMO 10 AGO 2026 · M7.4</span>
          <span>VALLE · RISARALDA · QUINDÍO · CALDAS · CHOCÓ</span>
        </div>
      </div>

      <div className="wrap py-14 max-w-[680px]">
        <p className="eyebrow">Error temporal · hogarsolidario.co</p>
        <h1 className="text-[clamp(26px,4.5vw,38px)] font-display font-bold leading-[1.1] mt-1">
          {title}
        </h1>
        <div className="mt-5 text-[15px] text-ink-2 leading-relaxed">{detail}</div>
        {hint && (
          <div className="mt-6 border-l-[3px] border-line bg-surface p-4 text-[13px] text-ink-2">
            {hint}
          </div>
        )}
        {showReload && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-8 font-display font-semibold text-[14px] px-5 py-3 rounded bg-ink text-white border border-ink hover:bg-ink-2 cursor-pointer"
          >
            Reintentar
          </button>
        )}

        <div className="mt-12 pt-6 border-t border-line-soft text-[12.5px] text-muted">
          <p className="m-0">
            Si esto te aparece mientras buscabas vivienda, escríbenos a{' '}
            <a href="mailto:hola@hogarsolidario.co" className="text-ink underline">
              hola@hogarsolidario.co
            </a>{' '}
            y describí lo que veías en la página. El subsidio temporal de arriendo se tramita
            en la alcaldía de tu municipio, la UNGRD y el Ministerio de Vivienda — no depende
            de esta plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
