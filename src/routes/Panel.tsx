import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';

export function Panel() {
  return (
    <>
      <Ticker inmuebles={0} familias={0} />
      <AppHeader />
      <div className="wrap max-w-[640px] py-10">
        <p className="eyebrow">Panel de la inmobiliaria</p>
        <h1 className="text-[28px] font-display font-bold mt-1">Próximamente</h1>
        <p className="mt-3 text-ink-2 text-[15px]">
          El panel para gestionar tu inventario completo, marcar avisos como arrendados y ver
          reportes llega en los próximos días.
        </p>
        <p className="mt-3 text-muted text-[13px]">
          Mientras tanto, cada inmueble se carga por separado:
        </p>
        <Link
          to="/publicar/inmueble?rol=inmobiliaria"
          className="inline-block mt-5 font-display font-semibold text-[13.5px] px-4 py-[10px] rounded bg-ink text-white border border-ink hover:bg-ink-2 no-underline"
        >
          Publicar inmueble
        </Link>
      </div>
    </>
  );
}
