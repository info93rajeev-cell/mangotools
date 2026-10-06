import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'pallet-loading-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('56');
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

test.describe('Pallet Loading compact workspace', () => {
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
    await expectSameMobileRow(page, id('length'), id('width'));
    await expectSameMobileRow(page, id('height'), id('quantity'));
    await expectSameMobileRow(page, id('palletType'), `${id('palletUnit')}-cm`);
    await expectSameMobileRow(page, id('maxStackHeight'), `${id('decimalPlaces')}-3`);

    await page.getByLabel('Pallet type').selectOption('custom');
    await page.getByLabel('Custom pallet length').fill('120');
    await page.getByLabel('Custom pallet width').fill('80');
    await expectSameMobileRow(page, id('palletLength'), id('palletWidth'));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves Euro, US and custom pallet results', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await expect(output(page, 'cartonsPerLayer')).toHaveText('8');
    await expect(output(page, 'layers')).toHaveText('7');
    await expect(output(page, 'palletsRequired')).toHaveText('2');

    await page.getByLabel('Carton length').fill('50');
    await page.getByLabel('Carton width').fill('40');
    await page.getByLabel('Carton height').fill('30');
    await page.getByLabel('Cartons').fill('60');
    await page.getByLabel('Pallet type').selectOption('us');
    await page.getByLabel('Max stack height').fill('160');
    await expect(primaryResult(page)).toHaveText('30');
    await expect(output(page, 'palletsRequired')).toHaveText('2');

    await page.getByLabel('Carton length').fill('30');
    await page.getByLabel('Carton width').fill('20');
    await page.getByLabel('Carton height').fill('15');
    await page.getByLabel('Cartons').fill('20');
    await page.getByLabel('Pallet type').selectOption('custom');
    await page.getByLabel('Custom pallet length').fill('120');
    await page.getByLabel('Custom pallet width').fill('100');
    await page.getByLabel('Max stack height').fill('100');
    await expect(primaryResult(page)).toHaveText('120');
    await expect(output(page, 'palletsRequired')).toHaveText('1');
  });

  test('preserves stacking, rotation and upright behavior', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);

    await page.getByRole('switch', { name: 'Stackable' }).uncheck();
    await expect(primaryResult(page)).toHaveText('8');
    await expect(output(page, 'layers')).toHaveText('1');
    await expect(output(page, 'palletsRequired')).toHaveText('13');

    await page.getByRole('switch', { name: 'Stackable' }).check();
    await page.getByRole('switch', { name: 'Allow base rotation' }).uncheck();
    await expect(primaryResult(page)).toHaveText('42');
    await expect(output(page, 'cartonsPerLayer')).toHaveText('6');

    await page.getByRole('switch', { name: 'Allow base rotation' }).check();
    await page.getByRole('switch', { name: 'Keep carton upright' }).uncheck();
    await expect(primaryResult(page)).toHaveText('60');
  });

  test('converts carton and pallet dimensions without changing physical results', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);

    await choose(page, 'unit', 'm');
    await expect(page.getByLabel('Carton length')).toHaveValue('0.4');
    await expect(page.getByLabel('Carton width')).toHaveValue('0.3');
    await expect(page.getByLabel('Carton height')).toHaveValue('0.2');
    await expect(primaryResult(page)).toHaveText('56');

    await choose(page, 'unit', 'mm');
    await expect(page.getByLabel('Carton length')).toHaveValue('400');
    await expect(page.getByLabel('Carton width')).toHaveValue('300');
    await expect(page.getByLabel('Carton height')).toHaveValue('200');
    await expect(primaryResult(page)).toHaveText('56');

    await choose(page, 'unit', 'in');
    await expect(page.getByLabel('Carton length')).toHaveValue('15.748031496063');
    await expect(page.getByLabel('Carton width')).toHaveValue('11.811023622047');
    await expect(page.getByLabel('Carton height')).toHaveValue('7.874015748031');
    await expect(primaryResult(page)).toHaveText('56');

    await page.getByLabel('Pallet type').selectOption('custom');
    await page.getByLabel('Custom pallet length').fill('120');
    await page.getByLabel('Custom pallet width').fill('80');
    await choose(page, 'palletUnit', 'm');
    await expect(page.getByLabel('Custom pallet length')).toHaveValue('1.2');
    await expect(page.getByLabel('Custom pallet width')).toHaveValue('0.8');
    await expect(page.getByLabel('Max stack height')).toHaveValue('1.5');
    await expect(primaryResult(page)).toHaveText('56');
  });

  test('formats only decimal outputs at 2, 3 and 4 places', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);

    await choose(page, 'decimalPlaces', '2');
    await expect(primaryResult(page)).toHaveText('56');
    await expect(output(page, 'palletsRequired')).toHaveText('2');
    await expect(output(page, 'estimatedStackHeight')).toHaveText('140.00');

    await choose(page, 'decimalPlaces', '3');
    await expect(output(page, 'estimatedStackHeight')).toHaveText('140.000');

    await choose(page, 'decimalPlaces', '4');
    await expect(output(page, 'estimatedStackHeight')).toHaveText('140.0000');
  });
});
