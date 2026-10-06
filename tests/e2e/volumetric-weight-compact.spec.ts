import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'volumetric-weight-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('120.000');
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

test.describe('Volumetric Weight compact workspace', () => {
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
    await expectSameMobileRow(page, id('length'), id('width'));
    await expectSameMobileRow(page, id('height'), id('quantity'));
    await expectSameMobileRow(page, `${id('weightUnit')}-kg`, id('weight'));
    await expectSameMobileRow(page, id('divisor'), `${id('decimalPlaces')}-3`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('converts dimensions across cm, m, mm and inches without changing chargeable weight', async ({
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
    await expect(primaryResult(page)).toHaveText('120.000');

    await populateSample(page);
    await choose(page, 'unit', 'mm');
    await expect(length).toHaveValue('500');
    await expect(width).toHaveValue('400');
    await expect(height).toHaveValue('300');
    await expect(primaryResult(page)).toHaveText('120.000');

    await populateSample(page);
    await choose(page, 'unit', 'in');
    await expect(length).toHaveValue('19.685039370079');
    await expect(width).toHaveValue('15.748031496063');
    await expect(height).toHaveValue('11.811023622047');
    await expect(primaryResult(page)).toHaveText('120.000');
  });

  test('converts actual weight across kg, g and lb without changing chargeable weight', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);
    await page.getByLabel('Length').fill('1');
    await page.getByLabel('Width').fill('1');
    await page.getByLabel('Height').fill('1');
    await expect(primaryResult(page)).toHaveText('80.000');

    await choose(page, 'weightUnit', 'g');
    await expect(page.getByLabel('Actual weight')).toHaveValue('8000');
    await expect(output(page, 'actualTotal')).toHaveText('80.000');
    await expect(primaryResult(page)).toHaveText('80.000');

    await populateSample(page);
    await page.getByLabel('Length').fill('1');
    await page.getByLabel('Width').fill('1');
    await page.getByLabel('Height').fill('1');
    await choose(page, 'weightUnit', 'lb');
    await expect(page.getByLabel('Actual weight')).toHaveValue('17.63698097479');
    await expect(output(page, 'actualTotal')).toHaveText('80.000');
    await expect(primaryResult(page)).toHaveText('80.000');
  });

  test('preserves quantity, divisor behavior and billed basis', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await page.getByLabel('Packages').fill('2');
    await expect(primaryResult(page)).toHaveText('24.000');

    await page.getByLabel('Divisor (cm³ per kg)').selectOption({ label: '6000' });
    await expect(primaryResult(page)).toHaveText('20.000');

    await page.getByLabel('Actual weight').fill('20');
    await expect(primaryResult(page)).toHaveText('40.000');
    await expect(island(page, tool)).toContainText(
      'Actual weight is higher, so actual weight is used for billing.',
    );

    await page.getByLabel('Divisor (cm³ per kg)').selectOption({ label: 'Custom' });
    await page.getByLabel('Custom divisor (cm³ per kg)').fill('3000');
    await expect(output(page, 'volumetricPerPackage')).toHaveText('20.000');
    await expect(island(page, tool)).toContainText(
      'Actual and volumetric weight are the same, so either value may be used for billing.',
    );
  });

  test('formats decimal outputs at 2, 3 and 4 places without changing the calculation', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);
    await page.getByLabel('Length').fill('25');
    await page.getByLabel('Width').fill('25');
    await page.getByLabel('Height').fill('20');
    await page.getByLabel('Packages').fill('100');
    await page.getByLabel('Actual weight').fill('0.1');
    await page.getByLabel('Divisor (cm³ per kg)').selectOption({ label: '6000' });

    await choose(page, 'decimalPlaces', '2');
    await page.getByLabel('Length').fill('25.00');
    await expect(primaryResult(page)).toHaveText('208.33');
    await expect(output(page, 'chargeablePerPackage')).toHaveText('2.08');

    await choose(page, 'decimalPlaces', '3');
    await page.getByLabel('Length').fill('25.000');
    await expect(primaryResult(page)).toHaveText('208.333');
    await expect(output(page, 'chargeablePerPackage')).toHaveText('2.083');

    await choose(page, 'decimalPlaces', '4');
    await page.getByLabel('Length').fill('25.0000');
    await expect(primaryResult(page)).toHaveText('208.3333');
    await expect(output(page, 'chargeablePerPackage')).toHaveText('2.0833');
  });
});
