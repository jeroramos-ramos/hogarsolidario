import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';

export function Admin() {
  return (
    <>
      <Ticker inmuebles={0} familias={0} />
      <AppHeader />
      <div className="wrap max-w-[640px] py-10">
        <p className="eyebrow">Moderación</p>
        <h1 className="text-[28px] font-display font-bold mt-1">Panel interno</h1>
        <p className="mt-3 text-ink-2 text-[15px]">
          Durante el arranque, la moderación se hace desde el Table Editor de Supabase (buscar
          <code className="font-mono text-[13px] bg-paper border border-line-soft px-1.5 py-0.5 rounded mx-1">
            inmuebles
          </code>
          y filtrar por
          <code className="font-mono text-[13px] bg-paper border border-line-soft px-1.5 py-0.5 rounded mx-1">
            estado = en_revision
          </code>
          ).
        </p>
        <p className="mt-3 text-muted text-[13px]">
          Los reportes de la comunidad ya retiran avisos automáticamente al segundo reporte. Esta
          página se activará cuando armemos la vista propia.
        </p>
        <Link
          to="/inmuebles"
          className="inline-block mt-6 font-display font-semibold text-[13.5px] px-4 py-[10px] rounded border border-ink bg-transparent text-ink hover:bg-paper no-underline"
        >
          Ir al buscador
        </Link>
      </div>
    </>
  );
}
