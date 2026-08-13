import { Link, useLocation } from 'react-router-dom';

type Tab = { to: string; label: string };

// /familias (tablero de demanda) sale post-lanzamiento con el panel de inmobiliaria.
// Hasta entonces no lo mostramos como tab para no llevar a un stub.
const TABS: Tab[] = [
  { to: '/inmuebles', label: 'Inmuebles disponibles' },
  { to: '/publicar/inmueble', label: 'Publicar inmueble' },
  { to: '/publicar/solicitud', label: 'Publicar solicitud' },
];

export function AppHeader() {
  const { pathname } = useLocation();

  return (
    <header className="bg-surface border-b border-line">
      <div className="wrap">
        <div className="flex items-center justify-between gap-5 py-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <Link to="/" className="no-underline text-inherit">
              <h2 className="text-[22px] font-bold font-display">Hogar Solidario</h2>
            </Link>
            <span className="font-mono text-[11px] text-muted tracking-[0.08em]">
              HOGARSOLIDARIO.CO
            </span>
          </div>
          <Link
            to="/"
            className="text-[12px] text-muted underline hover:text-ink font-body no-underline"
          >
            Cambiar rol
          </Link>
        </div>
        <nav role="tablist" className="flex gap-[2px] overflow-x-auto -mb-px">
          {TABS.map((t) => {
            const selected = pathname === t.to || pathname.startsWith(t.to + '/');
            return (
              <Link
                key={t.to}
                to={t.to}
                role="tab"
                aria-selected={selected}
                className={[
                  'font-display font-semibold text-[13px] px-4 py-[11px] cursor-pointer whitespace-nowrap',
                  'border-l border-r border-t border-line rounded-t no-underline',
                  selected
                    ? 'bg-paper text-ink shadow-[inset_0_3px_0_theme(colors.signal.DEFAULT)]'
                    : 'bg-transparent text-muted',
                  'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
                ].join(' ')}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
