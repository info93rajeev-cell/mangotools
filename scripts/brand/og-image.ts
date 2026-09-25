/**
 * Renders assets/og/default.svg to assets/og/default.png (1200 × 630) with Playwright's Chromium,
 * using the self-hosted Inter font. Run once after changing the SVG: pnpm tsx scripts/brand/og-image.ts
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT } from '../lib/paths.ts';

const require = createRequire(join(ROOT, 'packages/ui/package.json'));
const fontDir = join(dirname(require.resolve('@fontsource-variable/inter/package.json')), 'files');
const font = readFileSync(join(fontDir, 'inter-latin-wght-normal.woff2')).toString('base64');
const svg = readFileSync(join(ROOT, 'assets/og/default.svg'), 'utf8');

const html = `<!doctype html><html><head><style>
@font-face { font-family: 'Inter Variable'; font-weight: 100 900; src: url(data:font/woff2;base64,${font}) format('woff2'); }
html, body { margin: 0; }
</style></head><body>${svg}</body></html>`;

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: join(ROOT, 'assets/og/default.png'),
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
await browser.close();
console.log('Wrote assets/og/default.png');
