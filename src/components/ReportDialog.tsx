import { useEffect, useState, type FormEvent } from 'react';
import { reportar } from '@/lib/api';
import { toast } from '@/lib/toast';

type MotivoKey = 'precio_abusivo' | 'no_existe' | 'pide_dinero_antes' | 'datos_falsos' | 'otro';

const MOTIVOS: Array<{ k: MotivoKey; l: string }> = [
  { k: 'precio_abusivo', l: 'Está cobrando más que antes del sismo' },
  { k: 'pide_dinero_antes', l: 'Pide dinero antes de mostrar el inmueble' },
  { k: 'no_existe', l: 'El inmueble no existe o no es del que publica' },
  { k: 'datos_falsos', l: 'Datos falsos o inconsistentes' },
  { k: 'otro', l: 'Otro motivo' },
];

type ReportDialogProps = {
  open: boolean;
  onClose: () => void;
  tipoObjeto: 'inmueble' | 'solicitud';
  objetoId: string;
};

export function ReportDialog({ open, onClose, tipoObjeto, objetoId }: ReportDialogProps) {
  const [motivo, setMotivo] = useState<MotivoKey>('precio_abusivo');
  const [detalle, setDetalle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo('precio_abusivo');
      setDetalle('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportar({ tipo_objeto: tipoObjeto, objeto_id: objetoId, motivo, detalle: detalle.trim() || undefined });
      toast('Reporte registrado. Gracias.');
      onClose();
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 429) {
        toast('Demasiados reportes desde tu red. Esperá una hora.', { tone: 'alert' });
      } else {
        toast(`Error: ${e.message}`, { tone: 'alert' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-ink/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-line rounded max-w-[520px] w-full p-6">
        <h2 id="report-title" className="text-[20px] font-display font-bold">
          Reportar este aviso
        </h2>
        <p className="text-[13px] text-muted mt-2">
          Los reportes son anónimos. Al segundo reporte de la comunidad el aviso pasa a
          revisión automáticamente y se retira del buscador.
        </p>

        <form onSubmit={onSubmit} className="mt-5">
          <fieldset>
            <legend className="text-[12px] font-semibold mb-2">Motivo</legend>
            <div className="flex flex-col gap-2">
              {MOTIVOS.map((m) => (
                <label
                  key={m.k}
                  className="flex items-start gap-[9px] text-[13px] cursor-pointer border border-line-soft rounded p-[10px] hover:border-line"
                >
                  <input
                    type="radio"
                    name="motivo"
                    value={m.k}
                    checked={motivo === m.k}
                    onChange={() => setMotivo(m.k)}
                    className="mt-[3px] accent-ink flex-none"
                  />
                  <span>{m.l}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4">
            <label htmlFor="detalle" className="block text-[12px] font-semibold mb-[5px]">
              Detalle (opcional)
            </label>
            <textarea
              id="detalle"
              rows={3}
              maxLength={500}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              className="w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface font-body"
              placeholder="Qué te llamó la atención"
            />
          </div>

          <div className="flex gap-2 mt-5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="font-display font-semibold text-[13px] px-4 py-2 rounded border border-ink bg-transparent text-ink hover:bg-paper"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="font-display font-semibold text-[13px] px-4 py-2 rounded border border-alert bg-alert text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Enviando…' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
