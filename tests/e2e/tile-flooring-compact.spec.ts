import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'tile-flooring-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);
const choose = (page: Page, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('245');
  await expect(output(page, 'boxes')).toHaveText('25');
}

async function addDeduction(page: Page) {
  await island(page, tool).locator('[data-openings] > div button').last().click();
  await page.locator(`#tool-${tool}-openings-0-width`).fill('1');
  await page.locator(`#tool-${tool}-openings-0-height`).fill('1');
  await page.locator(`#tool-${tool}-openings-0-quantity`).fill('1');
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

test.describe('Tile / Flooring compact workspace', () => {
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

  test('uses safe paired fields and compact deductions without mobile overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateSample(page);
    await addDeduction(page);

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, `${id('mode')}-dimensions`, `${id('unit')}-m`);
    await expectSameMobileRow(page, id('surfaceLength'), id('surfaceWidth'));
    await expectSameMobileRow(page, `${id('tileUnit')}-mm`, `${id('decimalPlaces')}-3`);
    await expectSameMobileRow(page, id('tileLength'), id('tileWidth'));
    await expectSameMobileRow(page, id('pattern'), id('wastagePercent'));
    await expectSameMobileRow(page, id('packMode'), id('tilesPerBox'));
    await choose(page, 'mode', 'area');
    await page.getByLabel(/Area \(surface unit squared/).fill('20');
    await expectSameMobileRow(page, id('surfaceArea'), id('quantity'));

    await expect(page.locator('[data-item-row]').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves dimensions and known-area calculations with exact unit conversion', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);
    await choose(page, 'mode', 'area');
    await page.getByLabel(/Area \(surface unit squared/).fill('20');
    await expect(primaryResult(page)).toHaveText('245');
    await choose(page, 'unit', 'ft');
    await expect(page.getByLabel(/Area \(surface unit squared/)).toHaveValue('215.278208334194');
    await expect(primaryResult(page)).toHaveText('245');
    await choose(page, 'tileUnit', 'in');
    await expect(page.getByLabel('Tile length')).toHaveValue('11.811023622047');
    await expect(page.getByLabel('Tile width')).toHaveValue('11.811023622047');
    await expect(primaryResult(page)).toHaveText('245');
    await expect(output(page, 'boxes')).toHaveText('25');
  });

  test('deducts areas and applies each editable layout wastage suggestion once', async ({
    page,
  }) => {
    await openTool(page, tool);
    await populateSample(page);
    await addDeduction(page);
    await expect(output(page, 'grossAreaM2')).toHaveText('20.000');
    await expect(output(page, 'openingAreaM2')).toHaveText('1.000');
    await expect(output(page, 'netAreaM2')).toHaveText('19.000');
    await expect(primaryResult(page)).toHaveText('233');

    const layout = page.getByLabel('Layout (suggests a wastage %)');
    const wastage = page.getByLabel('Wastage allowance %');
    await layout.selectOption('straight');
    await expect(wastage).toHaveValue('10');
    await layout.selectOption('diagonal');
    await expect(wastage).toHaveValue('15');
    await layout.selectOption('complex');
    await expect(wastage).toHaveValue('20');
    await layout.selectOption('custom');
    await expect(wastage).toHaveValue('20');
    await wastage.fill('12.5');
    await expect(primaryResult(page)).toHaveText('238');
  });

  test('supports both box contracts and keeps purchase outputs whole', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    await expect(primaryResult(page)).toHaveText(/^\d+$/);
    await expect(output(page, 'boxes')).toHaveText('25');

    await page.getByLabel('Box packing').selectOption('coverage');
    await page.getByLabel('Coverage per box').fill('1.44');
    await expect(output(page, 'boxes')).toHaveText('16');
    await page.getByLabel('Box packing').selectOption('none');
    await expect(output(page, 'boxes')).toHaveCount(0);
  });

  test('formats and validates decimal quantities with 2, 3 or 4 places', async ({ page }) => {
    await openTool(page, tool);
    await populateSample(page);
    const wastage = page.getByLabel('Wastage allowance %');

    await choose(page, 'decimalPlaces', '2');
    await wastage.fill('1.25');
    await expect(output(page, 'baseTiles')).toHaveText('222.22');
    await wastage.fill('1.250');
    await expect(page.getByText('Use at most 2 decimal places.')).toBeVisible();
    await expect(wastage).toHaveValue('1.250');

    await choose(page, 'decimalPlaces', '3');
    await expect(wastage).toHaveValue('1.250');
    await expect(output(page, 'baseTiles')).toHaveText('222.222');
    await choose(page, 'decimalPlaces', '4');
    await wastage.fill('1.2500');
    await expect(output(page, 'baseTiles')).toHaveText('222.2222');
    await expect(primaryResult(page)).toHaveText('225');
    await expect(output(page, 'boxes')).toHaveText('23');
  });
});
