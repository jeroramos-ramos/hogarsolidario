import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';

export function Familias() {
  return (
    <>
      <Ticker inmuebles={0} familias={0} />
      <AppHeader />
      <div className="wrap max-w-[640px] py-10">
        <p className="eyebrow">Tablero de demanda</p>
        <h1 className="text-[28px] font-display font-bold mt-1">Próximamente</h1>
        <p className="mt-3 text-ink-2 text-[15px]">
          Estamos preparando esta vista para que las inmobiliarias verificadas puedan ver, en
          tiempo real, qué necesita cada familia y contactarla directo. Sale en los próximos
          días junto con el panel de inmobiliarias.
        </p>
        <p className="mt-3 text-muted text-[13px]">
          Mientras tanto, si tenés vivienda para ofrecer, publicala:
        </p>
        <div className="mt-5 flex gap-2 flex-wrap">
          <Link
            to="/publicar/inmueble?rol=inmobiliaria"
            className="font-display font-semibold text-[13.5px] px-4 py-[10px] rounded bg-ink text-white border border-ink hover:bg-ink-2 no-underline"
          >
            Publicar como inmobiliaria
          </Link>
          <Link
            to="/publicar/inmueble?rol=propietario"
            className="font-display font-semibold text-[13.5px] px-4 py-[10px] rounded border border-ink bg-transparent text-ink hover:bg-paper no-underline"
          >
            Publicar como propietario
          </Link>
        </div>
      </div>
    </>
  );
}
