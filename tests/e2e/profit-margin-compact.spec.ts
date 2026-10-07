import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'profit-margin-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);

async function populateSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('20.00%');
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

test.describe('Profit Margin compact workspace', () => {
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
    await expect(page.getByLabel('Calculate')).toHaveJSProperty('tagName', 'SELECT');
    const notes = page.locator('details[data-notes]');
    if ((await notes.count()) > 0) await expect(notes).not.toHaveAttribute('open');
    for (const section of await page.locator('details[data-tool-content-section]').all()) {
      await expect(section).not.toHaveAttribute('open');
    }

    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
    );
    expect(pageOverflow).toBeLessThanOrEqual(0);
  });

  test('pairs each mode inputs without mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await populateSample(page);

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, id('cost'), id('price'));

    await page.getByLabel('Calculate').selectOption('price-from-cost-and-margin');
    await expectSameMobileRow(page, id('cost'), id('marginPercent'));

    await page.getByLabel('Calculate').selectOption('cost-from-price-and-margin');
    await expectSameMobileRow(page, id('price'), id('marginPercent'));

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves margin, profit and markup from cost and selling price', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Cost', { exact: true }).fill('80');
    await page.getByLabel('Selling price', { exact: true }).fill('100');
    await expect(primaryResult(page)).toHaveText('20.00%');
    await expect(output(page, 'profit')).toHaveText('₹20.00');
    await expect(output(page, 'markupPercent')).toHaveText('25.00%');
  });

  test('preserves selling price and cost solve modes', async ({ page }) => {
    await openTool(page, tool);
    const calculate = page.getByLabel('Calculate');

    await calculate.selectOption('price-from-cost-and-margin');
    await page.getByLabel('Cost', { exact: true }).fill('80');
    await page.getByLabel('Margin', { exact: true }).fill('20');
    await expect(primaryResult(page)).toHaveText('₹100.00');
    await expect(output(page, 'profit')).toHaveText('₹20.00');
    await expect(output(page, 'markupPercent')).toHaveText('25.00%');

    await calculate.selectOption('cost-from-price-and-margin');
    await page.getByLabel('Selling price', { exact: true }).fill('100');
    await page.getByLabel('Margin', { exact: true }).fill('20');
    await expect(primaryResult(page)).toHaveText('₹80.00');
    await expect(output(page, 'profit')).toHaveText('₹20.00');
    await expect(output(page, 'markupPercent')).toHaveText('25.00%');
  });

  test('preserves Indian money grouping and rejects a 100% target margin', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Cost', { exact: true }).fill('1000000');
    await page.getByLabel('Selling price', { exact: true }).fill('1500000');
    await expect(output(page, 'profit')).toHaveText('₹5,00,000.00');

    await page.getByLabel('Calculate').selectOption('price-from-cost-and-margin');
    await page.getByLabel('Cost', { exact: true }).fill('50');
    await page.getByLabel('Margin', { exact: true }).fill('100');
    await expect(page.getByText('The margin must be less than 100%.')).toBeVisible();
    await expect(page.getByLabel('Margin', { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
