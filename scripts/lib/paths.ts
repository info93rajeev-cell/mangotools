import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute repository root, derived from this file's location (works on Windows and Linux). */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const paths = {
  root: ROOT,
  engines: join(ROOT, 'engines'),
  presets: join(ROOT, 'presets'),
  tools: join(ROOT, 'tools'),
  taxonomy: join(ROOT, 'taxonomy'),
  generated: join(ROOT, 'generated'),
  siteConfig: join(ROOT, 'site.config.yaml'),
  webDist: join(ROOT, 'apps', 'web', 'dist'),
};

/** Repository-relative path with forward slashes, for messages. */
export function rel(path: string): string {
  return path
    .slice(ROOT.length + 1)
    .split('\\')
    .join('/');
}
