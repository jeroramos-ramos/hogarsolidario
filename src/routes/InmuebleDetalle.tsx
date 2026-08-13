import { useParams } from 'react-router-dom';

export function InmuebleDetalle() {
  const { id } = useParams();
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Ficha del inmueble</p>
      <h1 className="text-2xl">Inmueble {id}</h1>
      <p className="text-muted mt-2 text-sm">Fase 3 — galería y WhatsApp.</p>
    </div>
  );
}
