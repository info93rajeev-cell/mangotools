import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'container-loading-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('500');
}

async function expectSameMobileRow(page: Page, left: string, right: string) {
  const boxes = await page.evaluate(
    ({ left, right }) => {
      const box = (id: string) =>
        document
          .querySelector<HTMLElement>(id)
          ?.closest<HTMLElement>('[data-width]')
          ?.getBoundingClientRect()
          .toJSON();
      return { left: box(left), right: box(right) };
    },
    { left, right },
  );
  expect(boxes.left).toBeTruthy();
  expect(boxes.right).toBeTruthy();
  expect(Math.abs((boxes.left?.top ?? 0) - (boxes.right?.top ?? 0))).toBeLessThanOrEqual(2);
  expect(boxes.left?.right ?? 0).toBeLessThan(boxes.right?.left ?? 0);
}

test.describe('Container Loading compact workspace', () => {
  test('fits populated inputs and results with supporting content collapsed on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openTool(page, tool);
    await populateSample(page);
    await expect(island(page, tool).locator('[data-density]')).toHaveAttribute(
      'data-density',
      'compact',
    );
    const notes = page.locator('details[data-notes]');
    if ((await notes.count()) > 0) await expect(notes).not.toHaveAttribute('open');
    for (const section of await page.locator('details[data-tool-content-section]').all()) {
      await expect(section).not.toHaveAttribute('open');
    }
    const bounds = await page.evaluate(() => ({
      viewport: window.innerHeight,
      input:
        document.querySelector('[data-input-panel]')?.getBoundingClientRect().bottom ?? Infinity,
      result:
        document.querySelector('[data-result-panel]')?.getBoundingClientRect().bottom ?? Infinity,
    }));
    expect(Math.max(bounds.input, bounds.result)).toBeLessThanOrEqual(bounds.viewport);
  });

  test('uses the requested mobile pairings without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateSample(page);
    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, `${id('unit')}-cm`, `${id('decimalPlaces')}-3`);
    await expectSameMobileRow(page, id('length'), id('width'));
    await expectSameMobileRow(page, id('height'), id('quantity'));
    await expectSameMobileRow(page, id('containerType'), id('usablePercent'));

    await page.getByLabel('Container type').selectOption('custom');
    await page.getByLabel('Custom container length').fill('1200');
    await page.getByLabel('Custom container width').fill('240');
    await page.getByLabel('Custom container height').fill('240');
    await expectSameMobileRow(page, id('containerLength'), id('containerWidth'));
    await expectSameMobileRow(page, id('containerHeight'), `${id('containerUnit')}-cm`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves standard and custom container results', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await expect(output(page, 'cartonsByVolume')).toHaveText('634');
    await expect(output(page, 'volumeFillPercent')).toHaveText('78.755%');
    await expect(output(page, 'totalCbm')).toHaveText('48.000');

    await page.getByLabel('Container type').selectOption('20gp');
    await expect(primaryResult(page)).toHaveText('225');
    await page.getByLabel('Container type').selectOption('40hc');
    await expect(primaryResult(page)).toHaveText('600');

    await page.getByLabel('Carton length').fill('30');
    await page.getByLabel('Carton width').fill('20');
    await page.getByLabel('Carton height').fill('15');
    await page.getByLabel('Cartons').fill('100');
    await page.getByLabel('Container type').selectOption('custom');
    await choose(page, 'containerUnit', 'm');
    await page.getByLabel('Custom container length').fill('6');
    await page.getByLabel('Custom container width').fill('2.4');
    await page.getByLabel('Custom container height').fill('2.4');
    await page.getByLabel('Usable space (%)').fill('95');
    await expect(primaryResult(page)).toHaveText('3,840');
    await expect(output(page, 'cartonsByVolume')).toHaveText('3,648');
  });

  test('preserves stacking, rotation, upright and usable-space behavior', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await page.getByRole('switch', { name: 'Stackable' }).uncheck();
    await expect(primaryResult(page)).toHaveText('150');
    await page.getByRole('switch', { name: 'Stackable' }).check();
    await page.getByRole('switch', { name: 'Allow rotation' }).uncheck();
    await expect(primaryResult(page)).toHaveText('500');
    await page.getByRole('switch', { name: 'Allow rotation' }).check();
    await page.getByRole('switch', { name: 'Keep upright' }).check();
    await expect(primaryResult(page)).toHaveText('500');
    await page.getByLabel('Usable space (%)').fill('80');
    await expect(primaryResult(page)).toHaveText('500');
    await expect(output(page, 'cartonsByVolume')).toHaveText('564');
  });

  test('converts carton and custom-container units without changing physical results', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);
    await choose(page, 'unit', 'm');
    await expect(page.getByLabel('Carton length')).toHaveValue('0.6');
    await expect(page.getByLabel('Carton width')).toHaveValue('0.4');
    await expect(page.getByLabel('Carton height')).toHaveValue('0.4');
    await expect(primaryResult(page)).toHaveText('500');

    await choose(page, 'unit', 'mm');
    await expect(page.getByLabel('Carton length')).toHaveValue('600');
    await expect(primaryResult(page)).toHaveText('500');
    await choose(page, 'unit', 'in');
    await expect(page.getByLabel('Carton length')).toHaveValue('23.622047244094');
    await expect(primaryResult(page)).toHaveText('500');

    await page.getByLabel('Container type').selectOption('custom');
    await page.getByLabel('Custom container length').fill('1203.2');
    await page.getByLabel('Custom container width').fill('235.2');
    await page.getByLabel('Custom container height').fill('239.3');
    await choose(page, 'containerUnit', 'm');
    await expect(page.getByLabel('Custom container length')).toHaveValue('12.032');
    await expect(page.getByLabel('Custom container width')).toHaveValue('2.352');
    await expect(page.getByLabel('Custom container height')).toHaveValue('2.393');
    await expect(primaryResult(page)).toHaveText('500');
  });

  test('formats only decimal outputs at 2, 3 and 4 places', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await choose(page, 'decimalPlaces', '2');
    await expect(primaryResult(page)).toHaveText('500');
    await expect(output(page, 'cartonsByVolume')).toHaveText('634');
    await expect(output(page, 'volumeFillPercent')).toHaveText('78.76%');
    await expect(output(page, 'totalCbm')).toHaveText('48.00');

    await choose(page, 'decimalPlaces', '3');
    await expect(output(page, 'volumeFillPercent')).toHaveText('78.755%');
    await expect(output(page, 'totalCbm')).toHaveText('48.000');

    await choose(page, 'decimalPlaces', '4');
    await expect(output(page, 'volumeFillPercent')).toHaveText('78.7555%');
    await expect(output(page, 'totalCbm')).toHaveText('48.0000');
  });
});
