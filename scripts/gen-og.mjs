#!/usr/bin/env node
// Genera public/og.png (1200x630), public/icon-192.png, public/icon-512.png
// desde SVGs armados a mano. Fondo #0F2A2E, acento ámbar. Sin fotos del terremoto.
// Correr una sola vez:  node scripts/gen-og.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── fuentes ─────────────────────────────────────────────────────────
// Cargamos archivos locales de @fontsource (subset latino) para que resvg
// renderice el texto con la tipografía real de la marca.
const archivo700 = readFileSync(
  resolve(ROOT, 'node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff'),
);
const archivo600 = readFileSync(
  resolve(ROOT, 'node_modules/@fontsource/archivo/files/archivo-latin-600-normal.woff'),
);
const plexMono500 = readFileSync(
  resolve(ROOT, 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff'),
);

const fontBuffers = [archivo700, archivo600, plexMono500];

// ── OG image 1200x630 ───────────────────────────────────────────────
const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0F2A2E"/>
  <!-- barra ámbar izquierda -->
  <rect x="0" y="0" width="14" height="630" fill="#F0A202"/>
  <!-- ticker superior (mono, ámbar) -->
  <text x="80" y="110" font-family="IBM Plex Mono" font-weight="500" font-size="22" fill="#F0A202" letter-spacing="4">SISMO 10 AGO 2026 · M7.4</text>
  <!-- headline -->
  <text x="80" y="270" font-family="Archivo" font-weight="700" font-size="108" fill="#FFFFFF" letter-spacing="-2">Hogar Solidario</text>
  <!-- support line -->
  <text x="80" y="370" font-family="Archivo" font-weight="600" font-size="38" fill="#DDE6E3">Un techo mientras volvemos a levantar</text>
  <text x="80" y="420" font-family="Archivo" font-weight="600" font-size="38" fill="#DDE6E3">lo que se cayó.</text>
  <!-- deptos (mono, muted) -->
  <text x="80" y="540" font-family="IBM Plex Mono" font-weight="500" font-size="20" fill="#8FA3A4" letter-spacing="3">VALLE · RISARALDA · QUINDÍO · CALDAS · CHOCÓ</text>
  <!-- url bottom right -->
  <text x="1120" y="585" font-family="Archivo" font-weight="700" font-size="30" fill="#FFFFFF" text-anchor="end" letter-spacing="1">hogarsolidario.co</text>
</svg>`;

function renderPng(svg, size = null) {
  const opts = {
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'Archivo' },
  };
  if (size) opts.fitTo = { mode: 'width', value: size };
  const resvg = new Resvg(svg, opts);
  return resvg.render().asPng();
}

writeFileSync(resolve(ROOT, 'public/og.png'), renderPng(ogSvg));
console.log('✓ public/og.png (1200×630)');

// ── ícono cuadrado (para favicon.png y app icons) ────────────────────
// Sin width/height explícitos — fitTo controla el tamaño final.
function iconSvgAt(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0F2A2E"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.1875}" fill="#F0A202"/>
</svg>`;
}

writeFileSync(resolve(ROOT, 'public/icon-512.png'), renderPng(iconSvgAt(512)));
console.log('✓ public/icon-512.png');
writeFileSync(resolve(ROOT, 'public/icon-192.png'), renderPng(iconSvgAt(192)));
console.log('✓ public/icon-192.png');
writeFileSync(resolve(ROOT, 'public/apple-touch-icon.png'), renderPng(iconSvgAt(180)));
console.log('✓ public/apple-touch-icon.png');

// ── favicon.svg (crisp en todos los tamaños) ────────────────────────
writeFileSync(
  resolve(ROOT, 'public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#0F2A2E"/><circle cx="16" cy="16" r="6" fill="#F0A202"/></svg>\n`,
);
console.log('✓ public/favicon.svg');
