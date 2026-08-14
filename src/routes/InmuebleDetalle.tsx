import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { ReportDialog } from '@/components/ReportDialog';
import { useInmueble } from '@/hooks/useInmuebles';
import { cop, shortId } from '@/lib/format';
import { publicUrl } from '@/lib/photos';
import { logContactoInmueble } from '@/lib/api';

export function InmuebleDetalle() {
  const { id } = useParams();
  const { data: inm, isLoading, error } = useInmueble(id);
  const [reportOpen, setReportOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <Ticker inmuebles={0} familias={0} />
        <AppHeader />
        <div className="wrap py-10">
          <div className="animate-pulse h-[400px] bg-surface border border-line-soft rounded" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Ticker inmuebles={0} familias={0} />
        <AppHeader />
        <div className="wrap py-10">
          <div className="bg-alert-soft border border-alert-line text-alert p-4 rounded">
            Error: {(error as Error).message}
          </div>
        </div>
      </>
    );
  }

  if (!inm) {
    return (
      <>
        <Ticker inmuebles={0} familias={0} />
        <AppHeader />
        <div className="wrap py-10">
          <p className="eyebrow">No encontrado</p>
          <h1 className="text-[28px] font-display font-bold">Este aviso ya no está disponible</h1>
          <p className="text-muted mt-2">
            Puede haber sido retirado por el publicante, marcado como arrendado o pasado a revisión.
          </p>
          <Link
            to="/inmuebles"
            className="inline-block mt-6 font-display font-semibold text-[13.5px] px-4 py-[10px] rounded border border-ink bg-ink text-white hover:bg-ink-2 no-underline"
          >
            Volver al buscador
          </Link>
        </div>
      </>
    );
  }

  const necesitaRevisar = inm.estado_estructural === 'sin_revisar';

  const wa = `https://wa.me/57${inm.telefono}?text=${encodeURIComponent(
    `Hola, escribo por el inmueble ${shortId(inm.id)} de hogarsolidario.co (${inm.tipo} en ${inm.barrio}, ${inm.municipio}). ¿Sigue disponible?`,
  )}`;

  return (
    <>
      <Ticker inmuebles={0} familias={0} />
      <AppHeader />

      <div className="wrap py-6 pb-16 max-w-[840px]">
        <Link
          to="/inmuebles"
          className="text-[12px] text-muted underline hover:text-ink no-underline"
        >
          ← Volver al buscador
        </Link>

        <div className="mt-4 font-mono text-[10.5px] text-muted tracking-[0.06em]">
          {shortId(inm.id)} ·{' '}
          {inm.disponible_desde === 'Inmediata'
            ? 'DISPONIBLE HOY'
            : 'DISPONIBLE ' + String(inm.disponible_desde ?? '').toUpperCase()}
        </div>
        <h1 className="text-[28px] font-display font-bold mt-1">
          {inm.tipo} en {inm.barrio}
        </h1>
        <div className="text-[15px] text-muted mt-1">
          {inm.municipio}, {inm.departamento}
          {inm.zona ? ' · ' + inm.zona : ''}
          {inm.duracion_minima ? ' · mínimo ' + inm.duracion_minima : ''}
        </div>

        {necesitaRevisar && (
          <div className="mt-5 bg-alert-soft border-l-[3px] border-alert p-[13px] pl-4 rounded-r text-[13px]">
            <b>Este inmueble no ha sido revisado tras el sismo.</b> El publicante no confirmó
            si sufrió daños estructurales. Pida al propietario que confirme habitabilidad antes
            de visitar y de comprometer dinero.
          </div>
        )}

        {inm.estado_estructural === 'sin_danos_aparentes' && (
          <div className="mt-5 bg-paper border-l-[3px] border-line p-[13px] pl-4 rounded-r text-[13px]">
            <b>Sin daños aparentes.</b> Declaración del propietario, no es un dictamen técnico.
          </div>
        )}

        {/* La confirmación positiva "revisado por ingeniería" se oculta en la vista
            pública mientras el inventario está en formación. La advertencia sin_revisar
            de arriba sí se muestra: una familia tiene derecho a saber si NO se revisó. */}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            {inm.fotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {inm.fotos.slice(0, 6).map((path, i) => (
                  <div
                    key={path + i}
                    className="aspect-[4/3] bg-paper border border-line-soft rounded overflow-hidden"
                  >
                    <img
                      src={publicUrl(path)}
                      alt={`Foto ${i + 1} de ${inm.tipo} en ${inm.barrio}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[4/3] bg-paper border border-dashed border-line rounded flex items-center justify-center text-muted text-sm">
                Sin fotos
              </div>
            )}

            {inm.notas && (
              <p className="mt-5 text-[14px] text-ink-2 leading-relaxed">{inm.notas}</p>
            )}

            {/* Sellos positivos (amoblado, mascotas, accesible, etc.) ocultos por
                decisión de producto — se siguen guardando en la base para reactivarlos
                sin editar avisos. */}
          </div>

          <aside className="bg-surface border border-line rounded p-5 md:sticky md:top-[14px]">
            <div className="font-mono text-[24px] font-semibold leading-none">
              {cop(inm.canon)}
              {inm.canon > 0 && (
                <small className="text-[12px] font-normal text-muted"> / mes</small>
              )}
            </div>

            <p className="mt-3 text-[11.5px] text-muted leading-snug">
              Si va a pagar con subsidio de arriendo, tramítelo en su alcaldía y la UNGRD —
              se lo giran a usted y cuenta como capacidad de pago para el canon.
            </p>

            <div className="flex gap-[14px] flex-wrap text-[13px] text-ink-2 border-t border-b border-line-soft py-3 mt-4">
              <span>
                <b className="font-mono font-semibold">{inm.habitaciones}</b> hab.
              </span>
              <span>
                <b className="font-mono font-semibold">{inm.banos}</b> baños
              </span>
              {inm.area_m2 ? (
                <span>
                  <b className="font-mono font-semibold">{inm.area_m2}</b> m²
                </span>
              ) : null}
            </div>

            <div className="mt-4 text-[13px] text-ink-2">
              <div className="text-[11px] text-muted uppercase tracking-[0.08em] font-mono">
                Publica
              </div>
              <div className="mt-1 font-semibold">{inm.quien_nombre}</div>
              <div className="text-[12px] text-muted mt-1">
                {inm.publicado_por === 'inmobiliaria'
                  ? 'Inmobiliaria solidaria'
                  : 'Propietario solidario'}
              </div>
              {/* Solo aplica a propietarios (personas naturales). Las inmobiliarias
                  no llevan esta línea. */}
              {inm.publicado_por === 'propietario' &&
                (inm.verificado_manual ? (
                  <div className="mt-2 text-[12px] text-verify-ink flex items-start gap-[6px]">
                    <span aria-hidden="true">✓</span>
                    <span>Contacto verificado por Hogar Solidario</span>
                  </div>
                ) : (
                  <p className="mt-2 text-[11.5px] text-muted leading-snug m-0">
                    Publicado por un particular. Verifique el inmueble en persona antes de
                    comprometerse.
                  </p>
                ))}
            </div>

            <a
              href={wa}
              target="_blank"
              rel="noopener"
              onClick={() => logContactoInmueble(inm.id)}
              className="mt-5 w-full font-display font-semibold text-[14px] px-4 py-3 rounded inline-flex items-center justify-center bg-ink text-white border border-ink hover:bg-ink-2 no-underline"
            >
              Escribir por WhatsApp
            </a>

            <p className="mt-3 text-[11.5px] text-muted leading-snug">
              Visite el inmueble antes de comprometerse. Nunca consigne a cuentas personales
              ni pague por "separar" — si le exigen plata antes de mostrarle la vivienda, es
              una estafa.
            </p>

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-4 text-[12px] text-muted underline hover:text-alert bg-transparent border-none p-0 cursor-pointer font-body block"
            >
              Reportar este aviso
            </button>
          </aside>
        </div>
      </div>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        tipoObjeto="inmueble"
        objetoId={inm.id}
      />
    </>
  );
}
