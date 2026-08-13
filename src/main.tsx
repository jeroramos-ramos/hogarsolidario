import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Solo subset latino, dos pesos por familia.
// Archivo (display): 600 h3 / 700 h1. IBM Plex Sans (body): 400 texto / 600 semibold.
// IBM Plex Mono: 400 texto / 500 contadores.
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';

import './styles.css';

import { Gate } from '@/routes/Gate';
import { Inmuebles } from '@/routes/Inmuebles';
import { InmuebleDetalle } from '@/routes/InmuebleDetalle';
import { Familias } from '@/routes/Familias';
import { PublicarInmueble } from '@/routes/PublicarInmueble';
import { PublicarSolicitud } from '@/routes/PublicarSolicitud';
import { Panel } from '@/routes/Panel';
import { Admin } from '@/routes/Admin';

const router = createBrowserRouter([
  { path: '/', element: <Gate /> },
  { path: '/inmuebles', element: <Inmuebles /> },
  { path: '/inmuebles/:id', element: <InmuebleDetalle /> },
  { path: '/familias', element: <Familias /> },
  { path: '/publicar/inmueble', element: <PublicarInmueble /> },
  { path: '/publicar/solicitud', element: <PublicarSolicitud /> },
  { path: '/panel', element: <Panel /> },
  { path: '/admin', element: <Admin /> },
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
