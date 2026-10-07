import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from '@mangotools/schemas';
import { expect, test } from '@playwright/test';
import { gotoReady, primaryResult, produceResult, TOOL_IDS } from '../support/tool-page.ts';

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
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`GST populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/gst-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `gst-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`CBM populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/cbm-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('6.000');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `cbm-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`Volumetric Weight populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/volumetric-weight-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('120.000');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `volumetric-weight-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`Pallet Loading populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/pallet-loading-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('56');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `pallet-loading-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`Container Loading populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/container-loading-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('500');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `container-loading-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`plaster populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/plaster-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await page.getByLabel('Wastage allowance %').fill('10');
    await page.getByLabel('Material estimate').selectOption('bag-yield');
    await page.getByLabel('Wet yield per bag (from your product)').fill('30');
    await expect(primaryResult(page)).toHaveText('5');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `plaster-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`tile / flooring populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/tile-flooring-calculator');
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('245');
    await expect(page.locator('[data-output="boxes"] dd')).toHaveText('25');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `tile-flooring-calculator-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '1440x900', width: 1440, height: 900, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`paint Roof evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/paint-calculator');
    await page.getByLabel('What are you painting?').selectOption('roof');
    await page.getByLabel('Roof length').fill('10');
    await page.getByLabel('Roof width').fill('8');
    await page.getByLabel('Roof pitch angle').fill('30');
    await page.getByLabel('Same-size areas').fill('1');
    await page.getByLabel('Coats').fill('2');
    await page.getByLabel('Wastage %').fill('10');
    await page.getByLabel('Coverage / coat').fill('10');
    await page.getByLabel('Container size').fill('5');
    await expect(primaryResult(page)).toHaveText('20.323');
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `paint-calculator-roof-${size.name}.png`),
      fullPage: size.fullPage,
    });
  });
}

for (const size of [
  { name: '1366x768', width: 1366, height: 768, fullPage: false },
  { name: '1440x900', width: 1440, height: 900, fullPage: false },
  { name: '360x800', width: 360, height: 800, fullPage: true },
]) {
  test(`excavation populated evidence @ ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, '/excavation-calculator');
    await produceResult(page, 'excavation-calculator');
    await page.getByLabel('Excavation type').selectOption('circular');
    await page.getByLabel('Diameter').fill('2');
    await page.getByLabel('Depth').fill('4');
    await page.getByLabel('Same-size excavations').fill('2');
    await page.getByLabel('Swell / bulking %').fill('25');
    await page.getByLabel('Usable truck volume').fill('6');
    await expect(primaryResult(page)).toHaveText('25.133');
    await expect(page.locator('[data-output="truckLoads"] dd')).toHaveText('6');
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: join(OUT, `excavation-calculator-${size.name}.png`),
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
