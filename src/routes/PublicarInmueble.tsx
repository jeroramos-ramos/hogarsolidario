import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { DEPARTAMENTOS, DEPTOS, ZONAS, TIPOS, type Departamento } from '@/data/municipios';
import { FLAGS, ESTADOS_ESTRUCTURALES, type FlagKey, type EstadoEstructural } from '@/data/flags';
import { compressAndUpload, newUploadId, publicUrl } from '@/lib/photos';
import { publicarInmueble } from '@/lib/api';
import { inmuebleInputSchema } from '@/lib/schemas';
import { toast } from '@/lib/toast';

type PubRol = 'inmobiliaria' | 'propietario';

const DURACIONES = ['1 mes', '3 meses', '6 meses', '12 meses'] as const;
const DISPONIBILIDADES = ['Inmediata', '3 días', '1 semana', '15 días'] as const;

type PhotoState = { path: string; url: string; uploading: false } | { file: File; uploading: true };

export function PublicarInmueble() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialRol = (params.get('rol') as PubRol | null) ?? null;
  const [rol, setRol] = useState<PubRol | null>(initialRol);

  const [quienNombre, setQuienNombre] = useState('');
  const [quienDoc, setQuienDoc] = useState('');
  const [telefono, setTelefono] = useState('');

  const [tipo, setTipo] = useState<string>(TIPOS[0]);
  const [departamento, setDepartamento] = useState<Departamento | ''>('');
  const [municipio, setMunicipio] = useState('');
  const [zona, setZona] = useState<string>('');
  const [barrio, setBarrio] = useState('');

  const [gratuito, setGratuito] = useState(false);
  const [canon, setCanon] = useState<string>('');
  const [duracion, setDuracion] = useState<string>('3 meses');
  const [habitaciones, setHabitaciones] = useState<string>('2');
  const [banos, setBanos] = useState<string>('1');
  const [area, setArea] = useState<string>('');
  const [disponible, setDisponible] = useState<string>('Inmediata');
  const [notas, setNotas] = useState('');

  const [flags, setFlags] = useState<Partial<Record<FlagKey, boolean>>>({});
  const [estadoEstructural, setEstadoEstructural] = useState<EstadoEstructural | ''>('');

  const [uploadId] = useState(() => newUploadId());
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const municipiosDisponibles = departamento ? DEPTOS[departamento] : null;
  const esInmo = rol === 'inmobiliaria';

  // Si aún no eligió rol, mostrar selector primero.
  if (!rol) {
    return (
      <>
        <Ticker inmuebles={0} familias={0} />
        <AppHeader />
        <div className="wrap max-w-[560px] py-10">
          <p className="eyebrow">Publicar inmueble</p>
          <h1 className="text-[28px] font-display font-bold mt-1">¿Quién publica?</h1>
          <p className="text-muted mt-2 text-sm">Esto ajusta las etiquetas del formulario.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            <button
              type="button"
              onClick={() => setRol('inmobiliaria')}
              className="text-left bg-surface rounded p-5 border border-line hover:border-ink font-body cursor-pointer"
            >
              <div className="font-mono text-[11px] text-muted tracking-[0.1em]">01</div>
              <h3 className="text-[17px] font-semibold font-display mt-1">Inmobiliaria solidaria</h3>
              <p className="text-[13px] text-muted mt-1">Con NIT y nombre comercial.</p>
            </button>
            <button
              type="button"
              onClick={() => setRol('propietario')}
              className="text-left bg-surface rounded p-5 border border-line hover:border-ink font-body cursor-pointer"
            >
              <div className="font-mono text-[11px] text-muted tracking-[0.1em]">02</div>
              <h3 className="text-[17px] font-semibold font-display mt-1">Propietario solidario</h3>
              <p className="text-[13px] text-muted mt-1">Persona natural con un inmueble para ceder o arrendar.</p>
            </button>
          </div>
        </div>
      </>
    );
  }

  function toggleFlag(k: FlagKey, checked: boolean) {
    setFlags((s) => ({ ...s, [k]: checked }));
    if (k === 'gratuito') {
      setGratuito(checked);
      if (checked) setCanon('0');
    }
  }

  async function onPickPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // reset input para poder reelegir el mismo archivo
    if (files.length === 0) return;
    const spaceLeft = 6 - photos.length;
    const chosen = files.slice(0, spaceLeft);
    if (files.length > spaceLeft) {
      toast(`Solo caben ${spaceLeft} fotos más (máximo 6).`, { tone: 'alert' });
    }

    // Empujamos placeholders con estado uploading, luego los reemplazamos.
    const placeholders: PhotoState[] = chosen.map((f) => ({ file: f, uploading: true }));
    setPhotos((cur) => [...cur, ...placeholders]);
    const startIndex = photos.length;

    for (let i = 0; i < chosen.length; i++) {
      const file = chosen[i];
      if (!file) continue;
      const globalIndex = startIndex + i;
      try {
        const path = await compressAndUpload(file, uploadId, globalIndex);
        const url = publicUrl(path);
        setPhotos((cur) => {
          const next = cur.slice();
          next[globalIndex] = { path, url, uploading: false };
          return next;
        });
      } catch (err) {
        console.error('upload failed', err);
        toast(`Foto ${i + 1} no se pudo subir: ${(err as Error).message}`, { tone: 'alert' });
        setPhotos((cur) => cur.filter((_, idx) => idx !== globalIndex));
      }
    }
  }

  function removePhoto(idx: number) {
    setPhotos((cur) => cur.filter((_, i) => i !== idx));
    // La foto queda huérfana en Storage: la limpieza masiva se hace por sweep periódico.
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!estadoEstructural) {
      toast('Elegí una opción del estado estructural del inmueble.', { tone: 'alert' });
      return;
    }
    if (photos.some((p) => p.uploading)) {
      toast('Espera a que terminen de subir las fotos.', { tone: 'alert' });
      return;
    }

    const cleanFlags: Partial<Record<FlagKey, boolean>> = {};
    for (const [k, v] of Object.entries(flags)) if (v) cleanFlags[k as FlagKey] = true;

    const fotosPaths = photos
      .filter((p): p is Extract<PhotoState, { uploading: false }> => !p.uploading)
      .map((p) => p.path);

    const payload = {
      publicado_por: rol,
      quien_nombre: quienNombre.trim(),
      quien_doc: quienDoc.trim() || undefined,
      telefono: telefono.replace(/\D/g, ''),
      tipo,
      departamento,
      municipio,
      zona: zona || undefined,
      barrio: barrio.trim(),
      canon: gratuito ? 0 : parseInt(canon || '0', 10),
      habitaciones: parseInt(habitaciones || '0', 10),
      banos: parseInt(banos || '0', 10),
      area_m2: area ? parseInt(area, 10) : undefined,
      disponible_desde: disponible,
      duracion_minima: duracion,
      notas: notas.trim() || undefined,
      fotos: fotosPaths,
      flags: cleanFlags,
      estado_estructural: estadoEstructural,
    };

    const parsed = inmuebleInputSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast(first ? `${first.path.join('.')}: ${first.message}` : 'Datos inválidos.', {
        tone: 'alert',
      });
      return;
    }

    setSubmitting(true);
    try {
      const resp = await publicarInmueble(parsed.data);
      if (resp.estado === 'en_revision' && resp.motivo_revision) {
        toast(`Publicado en revisión: ${resp.motivo_revision}`, { ms: 8000, tone: 'alert' });
      } else {
        toast('Publicado. Ya aparece en el buscador.');
      }
      navigate(`/inmuebles/${resp.id}`);
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 429) {
        toast('Demasiadas publicaciones desde tu red. Esperá una hora.', { tone: 'alert' });
      } else {
        toast(`Error: ${e.message}`, { tone: 'alert' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    'w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface font-body';
  const labelClass = 'block text-[12px] font-semibold mb-[5px]';

  return (
    <>
      <Ticker inmuebles={0} familias={0} />
      <AppHeader />

      <div className="wrap max-w-[780px] py-6 pb-16">
        {esInmo && (
          <div className="border-l-[3px] border-line bg-surface p-[13px] pl-4 rounded-r text-[13px] mb-4">
            Por ahora la carga es de un inmueble a la vez. El panel para gestionar inventario
            completo llega en los próximos días.
          </div>
        )}
        <div className="border-l-[3px] border-signal bg-signal-soft p-[13px] pl-4 rounded-r text-[13px] mb-6">
          <b>Antes de publicar.</b> Solo inmuebles habitables. Mantené el canon del mercado
          previo al 10 de agosto: subir el precio aprovechando la emergencia es sancionable y
          retiramos el aviso automáticamente si supera en 30% la mediana comparable.
        </div>

        <form onSubmit={onSubmit} noValidate>
          {/* ---------- Publicante ---------- */}
          <fieldset className="border border-line rounded p-[18px] mb-4 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              {esInmo ? 'La inmobiliaria' : 'El propietario'}
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="quien">
                  {esInmo ? 'Nombre de la inmobiliaria' : 'Su nombre completo'}
                </label>
                <input
                  id="quien"
                  className={fieldClass}
                  value={quienNombre}
                  onChange={(e) => setQuienNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="doc">
                  {esInmo ? 'NIT' : 'Cédula (opcional)'}
                </label>
                <input
                  id="doc"
                  className={fieldClass}
                  value={quienDoc}
                  onChange={(e) => setQuienDoc(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="tel">
                WhatsApp de contacto
              </label>
              <input
                id="tel"
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                className={fieldClass}
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
              <div className="text-[11.5px] text-muted mt-1">
                10 dígitos. Es el botón que verá la familia.
              </div>
            </div>
          </fieldset>

          {/* ---------- Inmueble ---------- */}
          <fieldset className="border border-line rounded p-[18px] mb-4 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              El inmueble
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="tipo">Tipo</label>
                <select id="tipo" className={fieldClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => (<option key={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="depto">Departamento</label>
                <select
                  id="depto"
                  className={fieldClass}
                  value={departamento}
                  onChange={(e) => {
                    setDepartamento(e.target.value as Departamento | '');
                    setMunicipio('');
                  }}
                  required
                >
                  <option value="">Seleccione</option>
                  {DEPARTAMENTOS.map((d) => (<option key={d}>{d}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="mun">Municipio</label>
                <select
                  id="mun"
                  className={fieldClass}
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  required
                  disabled={!departamento}
                >
                  <option value="">{departamento ? 'Seleccione' : 'Elegí departamento primero'}</option>
                  {municipiosDisponibles?.map((m) => (<option key={m}>{m}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="zona">Zona</label>
                <select id="zona" className={fieldClass} value={zona} onChange={(e) => setZona(e.target.value)}>
                  <option value="">Sin definir</option>
                  {ZONAS.map((z) => (<option key={z}>{z}</option>))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className={labelClass} htmlFor="barrio">Barrio o sector</label>
              <input
                id="barrio"
                className={fieldClass}
                placeholder="Ej: El Ingenio"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="canon">Canon mensual (COP)</label>
                <input
                  id="canon"
                  type="number"
                  min={0}
                  step={50000}
                  placeholder="0 si lo cede"
                  className={fieldClass}
                  value={canon}
                  onChange={(e) => setCanon(e.target.value)}
                  disabled={gratuito}
                />
                <div className="text-[11.5px] text-muted mt-1">
                  Marcá "Sin costo" en Condiciones si lo cede.
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="dur">Duración mínima</label>
                <select id="dur" className={fieldClass} value={duracion} onChange={(e) => setDuracion(e.target.value)}>
                  {DURACIONES.map((d) => (<option key={d}>{d}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="hab">Habitaciones</label>
                <input id="hab" type="number" min={0} max={30} className={fieldClass} value={habitaciones} onChange={(e) => setHabitaciones(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="ban">Baños</label>
                <input id="ban" type="number" min={0} max={20} className={fieldClass} value={banos} onChange={(e) => setBanos(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="area">Área (m²)</label>
                <input id="area" type="number" min={0} className={fieldClass} value={area} onChange={(e) => setArea(e.target.value)} placeholder="60" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="disp">Disponible</label>
                <select id="disp" className={fieldClass} value={disponible} onChange={(e) => setDisponible(e.target.value)}>
                  {DISPONIBILIDADES.map((d) => (<option key={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="notas">Detalle corto</label>
                <input id="notas" className={fieldClass} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: tercer piso, agua y luz activas" maxLength={400} />
              </div>
            </div>
          </fieldset>

          {/* ---------- Estado estructural (obligatorio, tri-estado) ---------- */}
          <fieldset className="border border-line rounded p-[18px] mb-4 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              Estado estructural
            </legend>
            <p className="text-[12.5px] text-muted mb-3">
              Obligatorio. Elegí conscientemente: los inmuebles sin revisar salen igual pero con
              advertencia visible a las familias.
            </p>
            <div className="flex flex-col gap-2">
              {ESTADOS_ESTRUCTURALES.map((s) => {
                const toneBg =
                  s.tone === 'ok' ? 'border-verify-line bg-verify-soft'
                    : s.tone === 'warn' ? 'border-alert-line bg-alert-soft'
                    : 'border-line-soft';
                return (
                  <label
                    key={s.k}
                    className={`flex items-start gap-[9px] text-[13px] cursor-pointer border rounded p-[10px] hover:border-line ${toneBg}`}
                  >
                    <input
                      type="radio"
                      name="estadoEstructural"
                      value={s.k}
                      checked={estadoEstructural === s.k}
                      onChange={() => setEstadoEstructural(s.k)}
                      className="mt-[3px] accent-ink flex-none"
                    />
                    <span>{s.l}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* ---------- Condiciones ---------- */}
          <fieldset className="border border-line rounded p-[18px] mb-4 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              Condiciones
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[9px]">
              {FLAGS.map((f) => (
                <label
                  key={f.k}
                  className="flex items-start gap-[9px] text-[13px] cursor-pointer border border-line-soft rounded p-[10px] hover:border-line"
                >
                  <input
                    type="checkbox"
                    checked={!!flags[f.k]}
                    onChange={(e) => toggleFlag(f.k, e.target.checked)}
                    className="mt-[2px] accent-ink flex-none"
                  />
                  <span>
                    {f.l}
                    {f.h && <span className="block text-[11.5px] text-muted mt-[2px]">{f.h}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* ---------- Fotos ---------- */}
          <fieldset className="border border-line rounded p-[18px] mb-6 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              Fotos (máx 6)
            </legend>
            <p className="text-[12.5px] text-muted mb-3">
              Se comprimen en tu celular antes de subir (≤200KB cada una). Sin fotos también se
              puede publicar.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  className="aspect-[4/3] bg-paper border border-line-soft rounded overflow-hidden relative"
                >
                  {p.uploading ? (
                    <div className="w-full h-full flex items-center justify-center text-[12px] text-muted animate-pulse">
                      Subiendo…
                    </div>
                  ) : (
                    <>
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-ink text-white text-[11px] px-2 py-1 rounded"
                      >
                        Quitar
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {photos.length < 6 && (
              <label className="inline-block font-display font-semibold text-[13px] px-4 py-2 rounded border border-ink bg-transparent text-ink cursor-pointer hover:bg-paper">
                Agregar fotos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onPickPhotos}
                  className="hidden"
                />
              </label>
            )}
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-display font-semibold text-[14px] px-4 py-3 rounded bg-ink text-white border border-ink hover:bg-ink-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Publicando…' : 'Publicar inmueble'}
          </button>
          <p className="text-[11.5px] text-muted text-center mt-2">
            Queda visible de inmediato para todas las familias.
          </p>
        </form>
      </div>
    </>
  );
}
