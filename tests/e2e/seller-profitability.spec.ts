import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'profit-margin-calculator';
const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);

async function loadSample(page: Page) {
  await page.getByRole('button', { name: 'Try sample' }).click();
  await expect(primaryResult(page)).toHaveText('₹325.00');
}

test.describe('Seller Profitability Calculator', () => {
  test('keeps the default workflow to selling price and product cost', async ({ page }) => {
    await openTool(page, tool);
    await expect(page.getByLabel('Marketplace fees')).toHaveCount(0);
    await expect(page.getByLabel('Settlement-only deductions')).toHaveCount(0);

    await page.getByLabel('Selling price').fill('100');
    await page.getByLabel('Product cost').fill('60');
    await expect(primaryResult(page)).toHaveText('₹40.00');
    await expect(output(page, 'cashSettlement')).toHaveText('₹100.00');
    await expect(output(page, 'profitMarginPercent')).toHaveText('40.00%');
    await expect(output(page, 'markupPercent')).toHaveText('66.67%');
  });

  test('loads engine input and UI-only disclosure state without mixing them', async ({ page }) => {
    await openTool(page, tool);
    await loadSample(page);

    await expect(page.getByRole('switch', { name: 'Seller / marketplace costs' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('switch', { name: 'Settlement deductions' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByLabel('Marketplace fees')).toHaveValue('100');
    await expect(page.getByLabel('Shipping / logistics')).toHaveValue('50');
    await expect(page.getByLabel('Seller expenses')).toHaveValue('25');
    await expect(page.getByLabel('Expected return / RTO cost')).toHaveValue('0');
    await expect(page.getByLabel('Non-recoverable tax cost')).toHaveValue('0');
    await expect(page.getByLabel('Settlement-only deductions')).toHaveValue('20');
    await expect(output(page, 'cashSettlement')).toHaveText('₹830.00');
    await expect(output(page, 'totalEconomicCost')).toHaveText('₹675.00');
    await expect(output(page, 'totalSettlementDeductions')).toHaveText('₹170.00');
  });

  test('applies every optional cost and keeps settlement-only deductions separate', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByLabel('Selling price').fill('200');
    await page.getByLabel('Product cost').fill('80');
    await page.getByRole('switch', { name: 'Seller / marketplace costs' }).click();
    await page.getByRole('switch', { name: 'Settlement deductions' }).click();
    await page.getByLabel('Marketplace fees').fill('20');
    await page.getByLabel('Shipping / logistics').fill('10');
    await page.getByLabel('Seller expenses').fill('5');
    await page.getByLabel('Expected return / RTO cost').fill('4');
    await page.getByLabel('Non-recoverable tax cost').fill('1');
    await page.getByLabel('Settlement-only deductions').fill('6');

    await expect(primaryResult(page)).toHaveText('₹80.00');
    await expect(output(page, 'cashSettlement')).toHaveText('₹164.00');
    await expect(output(page, 'profitMarginPercent')).toHaveText('40.00%');
    await expect(output(page, 'markupPercent')).toHaveText('100.00%');
    await expect(output(page, 'totalEconomicCost')).toHaveText('₹120.00');
    await expect(output(page, 'totalSettlementDeductions')).toHaveText('₹36.00');
  });

  test('handles zero product cost without presenting an invalid markup', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Selling price').fill('50');
    await page.getByLabel('Product cost').fill('0');

    await expect(primaryResult(page)).toHaveText('₹50.00');
    await expect(output(page, 'profitMarginPercent')).toHaveText('100.00%');
    await expect(page.locator('[data-output="markupPercent"]')).toHaveCount(0);
    await expect(page.getByRole('note')).toContainText(
      'Markup cannot be calculated when the cost is zero.',
    );
  });

  test('reset restores collapsed defaults and clears the result', async ({ page }) => {
    await openTool(page, tool);
    await loadSample(page);
    await page.getByRole('button', { name: 'Reset' }).click();

    await expect(page.getByRole('switch', { name: 'Seller / marketplace costs' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(page.getByRole('switch', { name: 'Settlement deductions' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(page.getByLabel('Marketplace fees')).toHaveCount(0);
    await expect(primaryResult(page)).toHaveCount(0);
  });

  test('uses the compact 60/40 workspace with its core in the desktop viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openTool(page, tool);
    await page.getByLabel('Selling price').fill('100');
    await page.getByLabel('Product cost').fill('60');

    await expect(island(page, tool).locator('[data-density]')).toHaveAttribute(
      'data-density',
      'compact',
    );
    const bounds = await page.evaluate(() => ({
      viewport: window.innerHeight,
      input:
        document.querySelector('[data-input-panel]')?.getBoundingClientRect().bottom ?? Infinity,
      result:
        document.querySelector('[data-result-panel]')?.getBoundingClientRect().bottom ?? Infinity,
    }));
    expect(Math.max(bounds.input, bounds.result)).toBeLessThanOrEqual(bounds.viewport);
    for (const section of await page.locator('details[data-tool-content-section]').all()) {
      await expect(section).not.toHaveAttribute('open');
    }
  });

  test('has no horizontal overflow on a 360 px phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await loadSample(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
