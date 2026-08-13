import { defineConfig, type Plugin } from 'vite';
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

export default defineConfig({
  plugins: [react(), preloadDisplayFonts()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
