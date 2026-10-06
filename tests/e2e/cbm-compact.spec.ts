import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'cbm-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('6.000');
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

test.describe('CBM compact workspace', () => {
  test('fits populated inputs, results and collapsed supporting content on desktop', async ({
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
      secondary: Math.max(
        ...Array.from(
          document.querySelectorAll(
            'details[data-disclaimer] > summary, details[data-tool-content-section] > summary',
          ),
          (element) => element.getBoundingClientRect().bottom,
        ),
      ),
    }));
    expect(Math.max(bounds.input, bounds.result, bounds.secondary)).toBeLessThanOrEqual(
      bounds.viewport,
    );
  });

  test('uses paired fields without mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateSample(page);

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, `${id('unit')}-cm`, `${id('decimalPlaces')}-3`);
    await expectSameMobileRow(page, id('length'), id('width'));
    await expectSameMobileRow(page, id('height'), id('quantity'));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('converts dimensions across cm, m, mm and inches without changing physical volume', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);

    const length = page.getByLabel('Length');
    const width = page.getByLabel('Width');
    const height = page.getByLabel('Height');
    await choose(page, 'unit', 'm');
    await expect(length).toHaveValue('0.5');
    await expect(width).toHaveValue('0.4');
    await expect(height).toHaveValue('0.3');
    await expect(primaryResult(page)).toHaveText('6.000');

    await populateSample(page);
    await choose(page, 'unit', 'mm');
    await expect(length).toHaveValue('500');
    await expect(width).toHaveValue('400');
    await expect(height).toHaveValue('300');
    await expect(primaryResult(page)).toHaveText('6.000');

    await populateSample(page);
    await choose(page, 'unit', 'in');
    await expect(length).toHaveValue('19.685039370079');
    await expect(width).toHaveValue('15.748031496063');
    await expect(height).toHaveValue('11.811023622047');
    await expect(primaryResult(page)).toHaveText('6.000');
  });

  test('preserves quantity and cubic-feet outputs', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await page.getByLabel('Number of cartons').fill('10');
    await expect(primaryResult(page)).toHaveText('0.600');
    await expect(output(page, 'cbmPerCarton')).toHaveText('0.060');
    await expect(output(page, 'totalCft')).toHaveText('21.189');
    await expect(output(page, 'cftPerCarton')).toHaveText('2.119');
  });

  test('formats decimal outputs at 2, 3 and 4 places without changing the calculation', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);
    await page.getByLabel('Length').fill('25');
    await page.getByLabel('Width').fill('25');
    await page.getByLabel('Height').fill('20');

    await choose(page, 'decimalPlaces', '2');
    await page.getByLabel('Length').fill('25.00');
    await expect(primaryResult(page)).toHaveText('1.25');
    await expect(output(page, 'cbmPerCarton')).toHaveText('0.01');
    await expect(output(page, 'totalCft')).toHaveText('44.14');

    await choose(page, 'decimalPlaces', '3');
    await page.getByLabel('Length').fill('25.000');
    await expect(primaryResult(page)).toHaveText('1.250');
    await expect(output(page, 'cbmPerCarton')).toHaveText('0.013');
    await expect(output(page, 'totalCft')).toHaveText('44.143');

    await choose(page, 'decimalPlaces', '4');
    await page.getByLabel('Length').fill('25.0000');
    await expect(primaryResult(page)).toHaveText('1.2500');
    await expect(output(page, 'cbmPerCarton')).toHaveText('0.0125');
    await expect(output(page, 'totalCft')).toHaveText('44.1433');
  });
});
