import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Inyecta <link rel="preload"> solo para las woff2 de Archivo (display) subset latino.
// Se ejecuta en build; en dev el preload se omite (localhost no lo necesita).
function preloadDisplayFonts(): Plugin {
  return {
    name: 'preload-display-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const files = Object.keys(ctx.bundle).filter((f) =>
          /assets\/archivo-latin-(600|700)-normal-.+\.woff2$/.test(f),
        );
        if (files.length === 0) return html;
        const tags = files
          .map(
            (f) =>
              `<link rel="preload" as="font" type="font/woff2" href="/${f}" crossorigin>`,
          )
          .join('\n    ');
        return html.replace('</head>', `    ${tags}\n  </head>`);
      },
    },
  };
}

// Imprime en el log del build si las env vars críticas llegaron o no.
// Aparece en el output de `vite build` (local) y en el "Build logs" de Vercel.
// Sirve para diagnosticar deploys donde el bundle sale con URL vacía.
function envDiagnostic(env: Record<string, string>): Plugin {
  return {
    name: 'env-diagnostic',
    apply: 'build',
    buildStart() {
      const line = (name: string, val: string | undefined): string => {
        if (!val) return `[env-diag] ${name}: MISSING ← el bundle saldrá roto`;
        const preview = val.length > 40 ? `${val.slice(0, 30)}…(${val.length}c)` : val;
        return `[env-diag] ${name}: ${preview}`;
      };
      // eslint-disable-next-line no-console
      console.log(line('VITE_SUPABASE_URL', env.VITE_SUPABASE_URL));
      // eslint-disable-next-line no-console
      console.log(line('VITE_SUPABASE_ANON_KEY', env.VITE_SUPABASE_ANON_KEY));
    },
  };
}

export default defineConfig(({ mode }) => {
  // loadEnv lee .env, .env.local, .env.[mode], .env.[mode].local Y process.env.
  // El tercer arg '' significa "sin filtro de prefijo": expone también las system
  // vars que Vercel/CI inyecten al proceso de build.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), preloadDisplayFonts(), envDiagnostic(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
