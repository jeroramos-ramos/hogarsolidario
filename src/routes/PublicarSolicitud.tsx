import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Ticker } from '@/components/Ticker';
import { DEPARTAMENTOS, DEPTOS, ZONAS, TIPOS, SITUACIONES, type Departamento } from '@/data/municipios';
import { NEEDS, type NeedKey } from '@/data/flags';
import { publicarSolicitud } from '@/lib/api';
import { solicitudInputSchema } from '@/lib/schemas';
import { toast } from '@/lib/toast';

export function PublicarSolicitud() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [adultos, setAdultos] = useState('2');
  const [ninos, setNinos] = useState('0');
  const [mayores, setMayores] = useState('0');
  const [situacion, setSituacion] = useState<string>(SITUACIONES[0]);
  const [enCenso, setEnCenso] = useState<'si' | 'no' | 'tramite'>('tramite');

  const [departamento, setDepartamento] = useState<Departamento | ''>('');
  const [municipio, setMunicipio] = useState('');
  const [zona, setZona] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS[0]);
  const [habitacionesMin, setHabitacionesMin] = useState('2');
  const [topeCanon, setTopeCanon] = useState('');
  const [nota, setNota] = useState('');

  const [needs, setNeeds] = useState<Partial<Record<NeedKey, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const municipiosDisponibles = departamento ? DEPTOS[departamento] : null;
  const fieldClass = 'w-full text-[13.5px] px-[10px] py-[9px] border border-line rounded bg-surface font-body';
  const labelClass = 'block text-[12px] font-semibold mb-[5px]';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const cleanNeeds: Partial<Record<NeedKey, boolean>> = {};
    for (const [k, v] of Object.entries(needs)) if (v) cleanNeeds[k as NeedKey] = true;

    const payload = {
      nombre: nombre.trim(),
      telefono: telefono.replace(/\D/g, ''),
      adultos: parseInt(adultos || '1', 10),
      ninos: parseInt(ninos || '0', 10),
      adultos_mayores: parseInt(mayores || '0', 10),
      situacion,
      en_censo: enCenso,
      departamento,
      municipio,
      zona: zona || undefined,
      tipo,
      habitaciones_min: parseInt(habitacionesMin || '1', 10),
      tope_canon: topeCanon ? Math.max(0, parseInt(topeCanon, 10)) : 0,
      nota: nota.trim() || undefined,
      necesidades: cleanNeeds,
    };

    const parsed = solicitudInputSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast(first ? `${first.path.join('.')}: ${first.message}` : 'Datos inválidos.', {
        tone: 'alert',
      });
      return;
    }

    setSubmitting(true);
    try {
      await publicarSolicitud(parsed.data);
      toast('Tu solicitud quedó publicada. Te pueden contactar en cualquier momento.', { ms: 5000 });
      navigate('/familias');
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 429) {
        toast('Demasiadas solicitudes desde tu red. Esperá una hora.', { tone: 'alert' });
      } else {
        toast(`Error: ${e.message}`, { tone: 'alert' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Ticker inmuebles={0} familias={0} />
      <AppHeader />

      <div className="wrap max-w-[780px] py-6 pb-16">
        <div className="border-l-[3px] border-verify bg-verify-soft p-[13px] pl-4 rounded-r text-[13px] mb-6">
          <b>Esto no es una solicitud de subsidio.</b> Es un aviso para que inmobiliarias y
          propietarios de las zonas afectadas sepan qué necesitás y te contacten. No pedimos
          documentos ni cobramos nada. El subsidio de arriendo lo tramita la alcaldía, la
          UNGRD y el Ministerio de Vivienda.
        </div>

        <form onSubmit={onSubmit} noValidate>
          <fieldset className="border border-line rounded p-[18px] mb-4 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              Quién busca
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="sNombre">Tu nombre</label>
                <input
                  id="sNombre"
                  className={fieldClass}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="sTel">WhatsApp</label>
                <input
                  id="sTel"
                  type="tel"
                  inputMode="numeric"
                  placeholder="3001234567"
                  className={fieldClass}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                />
                <div className="text-[11.5px] text-muted mt-1">
                  Aparece en tu solicitud para que te escriban directamente por WhatsApp
                  quienes tengan un inmueble para vos.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="sAdultos">Adultos</label>
                <input id="sAdultos" type="number" min={1} max={20} className={fieldClass} value={adultos} onChange={(e) => setAdultos(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="sNinos">Niños</label>
                <input id="sNinos" type="number" min={0} max={20} className={fieldClass} value={ninos} onChange={(e) => setNinos(e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="sMayores">Adultos mayores</label>
                <input id="sMayores" type="number" min={0} max={20} className={fieldClass} value={mayores} onChange={(e) => setMayores(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="sUrg">¿Dónde están ahora?</label>
                <select id="sUrg" className={fieldClass} value={situacion} onChange={(e) => setSituacion(e.target.value)}>
                  {SITUACIONES.map((s) => (<option key={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="sCenso">¿Están en el censo de damnificados?</label>
                <select id="sCenso" className={fieldClass} value={enCenso} onChange={(e) => setEnCenso(e.target.value as 'si' | 'no' | 'tramite')}>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                  <option value="tramite">En trámite</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-line rounded p-[18px] mb-4 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              Qué necesitan
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="sDepto">Departamento</label>
                <select
                  id="sDepto"
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
              <div>
                <label className={labelClass} htmlFor="sMun">Municipio donde busca</label>
                <select
                  id="sMun"
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="sZona">Zona preferida</label>
                <select id="sZona" className={fieldClass} value={zona} onChange={(e) => setZona(e.target.value)}>
                  <option value="">Cualquiera</option>
                  {ZONAS.map((z) => (<option key={z}>{z}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="sTipo">Tipo</label>
                <select id="sTipo" className={fieldClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => (<option key={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="sHab">Habitaciones mín.</label>
                <input id="sHab" type="number" min={1} max={20} className={fieldClass} value={habitacionesMin} onChange={(e) => setHabitacionesMin(e.target.value)} />
              </div>
            </div>
            <p className="text-[12.5px] text-muted mb-3 border-l-[3px] border-line pl-3">
              <b className="text-ink">Si vas a usar el subsidio de arriendo</b>, sumalo a lo
              que ponés acá. El subsidio lo tramitás vos ante la alcaldía de tu municipio y
              la UNGRD — cuando te lo giren, es parte de tu capacidad de pago mensual. Las
              inmobiliarias no lo "aceptan" ni lo "rechazan": simplemente cobran el canon.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="sTope">Hasta cuánto podés pagar</label>
                <input
                  id="sTope"
                  type="number"
                  min={0}
                  step={50000}
                  className={fieldClass}
                  value={topeCanon}
                  onChange={(e) => setTopeCanon(e.target.value)}
                  placeholder="800000"
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="sNota">
                Algo más que deban saber
              </label>
              <textarea
                id="sNota"
                className={fieldClass}
                rows={3}
                maxLength={500}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: trabajo en el sur, necesitamos quedar cerca al colegio del barrio."
              />
              <div className="text-[11.5px] text-muted mt-1">
                Este texto solo lo ven inmobiliarias verificadas. Evitá poner apellidos completos
                o direcciones exactas.
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-line rounded p-[18px] mb-6 bg-surface">
            <legend className="font-display font-semibold text-[12.5px] px-2 uppercase tracking-[0.07em]">
              Tu situación
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[9px]">
              {NEEDS.map((n) => (
                <label
                  key={n.k}
                  className="flex items-start gap-[9px] text-[13px] cursor-pointer border border-line-soft rounded p-[10px] hover:border-line"
                >
                  <input
                    type="checkbox"
                    checked={!!needs[n.k]}
                    onChange={(e) => setNeeds((s) => ({ ...s, [n.k]: e.target.checked }))}
                    className="mt-[2px] accent-ink flex-none"
                  />
                  <span>{n.l}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full font-display font-semibold text-[14px] px-4 py-3 rounded bg-ink text-white border border-ink hover:bg-ink-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Publicando…' : 'Publicar mi solicitud'}
          </button>
          <p className="text-[11.5px] text-muted text-center mt-2">
            Podés seguir buscando por tu cuenta mientras te contactan.
          </p>
        </form>
      </div>
    </>
  );
}
