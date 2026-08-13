import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Solo subset latino, dos pesos por familia.
import '@fontsource/archivo/latin-600.css';
import '@fontsource/archivo/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';

import './styles.css';

import { configStatus } from '@/lib/supabase';
import { AppError } from '@/components/AppError';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { Gate } from '@/routes/Gate';
import { Inmuebles } from '@/routes/Inmuebles';
import { InmuebleDetalle } from '@/routes/InmuebleDetalle';
import { Familias } from '@/routes/Familias';
import { PublicarInmueble } from '@/routes/PublicarInmueble';
import { PublicarSolicitud } from '@/routes/PublicarSolicitud';
import { Panel } from '@/routes/Panel';
import { Admin } from '@/routes/Admin';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');
const root = createRoot(rootEl);

// ─── Config check antes de montar el router ───────────────────────────
// Si faltan las env vars (típico problema de deploy), no montamos el router
// ni Query — renderizamos una pantalla explicativa. Como supabase.ts ya no
// tira excepción al importarse, todos los módulos de rutas cargan igual;
// simplemente no llegan a instanciarse hasta que la app está sana.
if (!configStatus.ok) {
  const missing: string[] = [];
  if (configStatus.missingUrl) missing.push('VITE_SUPABASE_URL');
  if (configStatus.missingKey) missing.push('VITE_SUPABASE_ANON_KEY');

  root.render(
    <StrictMode>
      <AppError
        title="El sitio no está configurado correctamente"
        detail={
          <>
            Faltan variables de entorno necesarias para conectar con la base de datos:{' '}
            <code className="font-mono text-[13px] bg-paper border border-line-soft px-2 py-0.5 rounded">
              {missing.join(', ')}
            </code>
            . La página no puede cargar hasta que estén disponibles al momento del build.
          </>
        }
        hint={
          <>
            <b>Si eres administrador:</b> las vars con prefijo <code className="font-mono">VITE_</code>{' '}
            se leen al momento de <code className="font-mono">vite build</code>, no en runtime.
            Verificá que estén en el entorno de build (Vercel → Settings → Environment Variables,
            scoped a Production y Preview). Redeployá <b>sin cache</b> después de agregarlas.
            El log del build de Vercel debería decir{' '}
            <code className="font-mono">[env-diag] VITE_SUPABASE_URL: https://…</code>. Si dice{' '}
            <code className="font-mono">MISSING</code>, las variables no llegaron al build.
          </>
        }
        showReload={false}
      />
    </StrictMode>,
  );
} else {
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

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
