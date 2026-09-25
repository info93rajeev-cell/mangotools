// @ts-check
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

const generated = fileURLToPath(new URL('../../generated', import.meta.url));
const env = process.env.MANGOTOOLS_ENV ?? 'development';
const registry = JSON.parse(readFileSync(`${generated}/registry.json`, 'utf8'));
const environment = registry.site.environments[env];
if (!environment) {
  throw new Error(`MANGOTOOLS_ENV="${env}" is not defined in site.config.yaml environments.`);
}

export default defineConfig({
  site: environment.url,
  output: 'static',
  outDir: process.env.MANGOTOOLS_OUT_DIR ?? './dist',
  trailingSlash: 'never',
  compressHTML: true,
  devToolbar: { enabled: false },
  prefetch: false,
  build: { format: 'file', assets: 'assets', inlineStylesheets: 'never' },
  integrations: [preact()],
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
  vite: {
    resolve: { alias: { '@generated': generated } },
    worker: { format: 'es' },
    server: { fs: { allow: ['../..'] } },
    build: { assetsInlineLimit: 0 },
  },
});
