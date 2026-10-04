import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from '@mangotools/schemas';
import { test } from '@playwright/test';
import { gotoReady, produceResult, TOOL_IDS } from '../support/tool-page.ts';

const OUT = join(process.cwd(), 'tests/artifacts/screenshots');
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'desktop', width: 1366, height: 768 },
];
const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as Registry;
const PAGES = [
  { name: 'home', path: '/', tool: null },
  { name: 'tools', path: '/tools', tool: null },
  ...registry.categories
    .filter((c) => c.visible)
    .map((c) => ({ name: c.slug, path: c.url, tool: null })),
  ...TOOL_IDS.map((id) => ({ name: id, path: `/${id}`, tool: id })),
];

for (const size of SIZES) {
  for (const p of PAGES) {
    test(`${p.name} @ ${size.width}×${size.height}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await gotoReady(page, p.path);
      if (p.tool) {
        await produceResult(page, p.tool);
        await page.mouse.move(0, 0);
      }
      await page.screenshot({ path: join(OUT, `${p.name}-${size.name}.png`) });
    });
  }
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '1440x900', width: 1440, height: 900, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`brickwork populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/brickwork-calculator');
    await produceResult(page, 'brickwork-calculator');
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `brickwork-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '1440x900', width: 1440, height: 900, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`concrete populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/concrete-quantity-calculator');
    await produceResult(page, 'concrete-quantity-calculator');
    await page.getByLabel('Yield per bag (optional)').fill('14');
    await page.locator('[data-output="bags"] dd').waitFor({ state: 'visible' });
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `concrete-quantity-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}
