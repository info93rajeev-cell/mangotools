import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'plaster-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function addOpening(page: Page) {
  await island(page, tool).locator('[data-openings] > div button').last().click();
  await page.locator(`#tool-${tool}-openings-1-width`).fill('1');
  await page.locator(`#tool-${tool}-openings-1-height`).fill('1');
  await page.locator(`#tool-${tool}-openings-1-quantity`).fill('1');
}

async function populateBagYield(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await page.getByLabel('Wastage allowance %').fill('10');
  await page.getByLabel('Material estimate').selectOption('bag-yield');
  await page.getByLabel('Wet yield per bag (from your product)').fill('30');
  await expect(primaryResult(page)).toHaveText('5');
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

test.describe('Plaster compact workspace', () => {
  test('fits populated inputs, results and collapsed supporting content on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openTool(page, tool);
    await populateBagYield(page);
    await expect(island(page, tool).locator('[data-density]')).toHaveAttribute(
      'data-density',
      'compact',
    );
    await expect(page.locator('details[data-notes]')).not.toHaveAttribute('open');
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

  test('uses safe paired fields and compact openings without mobile overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateBagYield(page);

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, id('surfaceType'), `${id('unit')}-m`);
    await expectSameMobileRow(page, id('length'), id('secondDimension'));
    await expectSameMobileRow(page, id('quantity'), id('wastagePercent'));
    await expectSameMobileRow(page, `${id('thicknessUnit')}-mm`, id('thickness'));
    await expectSameMobileRow(page, id('materialMode'), `${id('decimalPlaces')}-3`);
    await expectSameMobileRow(page, id('bagYield'), `${id('bagYieldUnit')}-l`);

    const opening = page.locator('[data-item-row]').first();
    await expect(opening).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves Wall, Ceiling and General rectangular surface calculations', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(primaryResult(page)).toHaveText('0.120');
    for (const mode of ['wall', 'ceiling', 'general']) {
      await page.getByLabel('Surface type').selectOption(mode);
      await expect(primaryResult(page)).toHaveText('0.120');
      await expect(output(page, 'netAreaM2')).toHaveText('10.000');
    }
  });

  test('deducts openings, converts units and applies wastage once', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await addOpening(page);
    await page.getByLabel('Wastage allowance %').fill('10');
    await expect(output(page, 'grossAreaM2')).toHaveText('12.000');
    await expect(output(page, 'openingAreaM2')).toHaveText('3.000');
    await expect(output(page, 'netAreaM2')).toHaveText('9.000');
    await expect(output(page, 'wetVolumeM3')).toHaveText('0.108');
    await expect(primaryResult(page)).toHaveText('0.119');

    await choose(page, 'unit', 'ft');
    await expect(page.getByLabel('Length', { exact: true })).toHaveValue('13.123359580052');
    await expect(page.locator(`#tool-${tool}-openings-0-width`)).toHaveValue('3.280839895013');
    await expect(output(page, 'orderVolumeM3')).toHaveText('0.119');
    await choose(page, 'thicknessUnit', 'in');
    await expect(page.getByLabel('Plaster thickness')).toHaveValue('0.472440944882');
    await expect(output(page, 'orderVolumeM3')).toHaveText('0.119');
  });

  test('uses product yield or coverage for whole bags and never assumes product data', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    await expect(output(page, 'bags')).toHaveCount(0);
    await page.getByLabel('Material estimate').selectOption('bag-yield');
    await page.getByLabel('Wet yield per bag (from your product)').fill('30');
    await expect(primaryResult(page)).toHaveText('4');

    await page.getByLabel('Material estimate').selectOption('bag-coverage');
    await page.getByLabel('Coverage per bag (from your product)').fill('2');
    await page.getByLabel('…at this thickness (from your product)').fill('12');
    await expect(primaryResult(page)).toHaveText('5');
    await page.getByLabel('Wastage allowance %').fill('10');
    await expect(primaryResult(page)).toHaveText('6');
  });

  test('formats and validates decimal quantities with 2, 3 or 4 places', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();
    const wastage = page.getByLabel('Wastage allowance %');

    await choose(page, 'decimalPlaces', '2');
    await wastage.fill('1.25');
    await expect(primaryResult(page)).toHaveText('0.12');
    await wastage.fill('1.250');
    await expect(page.getByText('Use at most 2 decimal places.')).toBeVisible();
    await expect(wastage).toHaveValue('1.250');

    await choose(page, 'decimalPlaces', '3');
    await expect(wastage).toHaveValue('1.250');
    await expect(primaryResult(page)).toHaveText('0.122');

    await choose(page, 'decimalPlaces', '4');
    await wastage.fill('1.2500');
    await expect(primaryResult(page)).toHaveText('0.1215');
    await expect(output(page, 'wastagePercent')).toHaveText('1.25%');
  });
});
