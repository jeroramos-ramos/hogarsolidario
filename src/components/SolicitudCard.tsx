import { useState, type FormEvent } from 'react';
import type { SolicitudPublica } from '@/lib/types';
import { cop } from '@/lib/format';
import { contactarSolicitud } from '@/lib/api';
import { toast } from '@/lib/toast';

// Tarjeta completa para /familias. Incluye botón "Ofrecerle inmueble" que sale
// por la edge function contact-solicitud. Esa edge function no entrega el
// teléfono a cualquiera: requiere sesión de asesor verificado o propietario
// identificado por su WhatsApp (que ya tenga inmueble activo publicado).
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

  const [askingPhone, setAskingPhone] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState('');
  const [contacting, setContacting] = useState(false);

  async function tryContact(propietario_telefono?: string): Promise<void> {
    setContacting(true);
    // Abrimos ventana ahora para no perder el gesture del click ante popup blockers.
    const win = window.open('', '_blank');
    try {
      const resp = await contactarSolicitud({
        solicitud_id: s.id,
        ...(propietario_telefono ? { propietario_telefono } : {}),
      });
      if (resp.ok) {
        if (win) win.location.href = resp.wa_url;
        setAskingPhone(false);
        setOwnerPhone('');
        return;
      }
      win?.close();
      if (resp.status === 401 || resp.status === 403) {
        // Anon o no autorizado — pedimos el WhatsApp con el que publicó su inmueble.
        setAskingPhone(true);
      } else if (resp.status === 429) {
        toast('Demasiadas solicitudes desde tu red. Esperá una hora.', { tone: 'alert' });
      } else {
        toast(`Error: ${resp.error}`, { tone: 'alert' });
      }
    } catch (err) {
      win?.close();
      toast(`Error: ${(err as Error).message}`, { tone: 'alert' });
    } finally {
      setContacting(false);
    }
  }

  function onSubmitPhone(e: FormEvent): void {
    e.preventDefault();
    const digits = ownerPhone.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast('El WhatsApp debe tener 10 dígitos.', { tone: 'alert' });
      return;
    }
    void tryContact(digits);
  }

  return (
    <article className="bg-surface border border-line rounded p-4 sm:p-5 flex flex-col gap-3">
      <div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.08em] text-muted">
          {[s.municipio, s.zona, s.tipo].filter(Boolean).join(' · ')}
        </div>
        <h3 className="text-[19px] font-display font-semibold leading-tight mt-1">
          Familia de {total} {total === 1 ? 'persona' : 'personas'}
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

      {s.situacion && (
        <p className="text-[13px] text-ink-2 m-0 italic">"{s.situacion}"</p>
      )}

      {askingPhone ? (
        <form onSubmit={onSubmitPhone} className="flex flex-col gap-2 mt-2 border-t border-line-soft pt-3">
          <p className="text-[12px] text-muted m-0">
            Para contactar a esta familia necesitamos verificar que ofreces vivienda. Ingresá
            el WhatsApp con el que publicaste tu inmueble (10 dígitos):
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="numeric"
              placeholder="3001234567"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="flex-1 text-[13px] px-2 py-1.5 border border-line rounded bg-surface font-body"
              autoFocus
            />
            <button
              type="submit"
              disabled={contacting}
              className="font-display font-semibold text-[12px] px-3 py-1.5 rounded border border-ink bg-ink text-white hover:bg-ink-2 disabled:opacity-50 whitespace-nowrap"
            >
              {contacting ? 'Verificando…' : 'Continuar'}
            </button>
            <button
              type="button"
              onClick={() => setAskingPhone(false)}
              className="text-[12px] text-muted underline hover:text-ink bg-transparent border-none cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[11.5px] text-muted m-0">
            Si sos asesor de una inmobiliaria, próximamente vas a poder iniciar sesión con tu
            correo autorizado y contactar sin este paso.
          </p>
        </form>
      ) : (
        <div className="flex mt-auto pt-1">
          <button
            type="button"
            onClick={() => void tryContact()}
            disabled={contacting}
            className="font-display font-semibold text-[13px] px-4 py-2 rounded border border-ink bg-ink text-white hover:bg-ink-2 disabled:opacity-50 cursor-pointer"
          >
            {contacting ? 'Conectando…' : 'Ofrecerle un inmueble'}
          </button>
        </div>
      )}
    </article>
  );
}
