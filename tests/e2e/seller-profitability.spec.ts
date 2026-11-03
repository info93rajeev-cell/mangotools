import { expect, type Page, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

/**
 * The Seller Profitability studio is calculated by estimate.seller.unit-economics@1; expected
 * figures are the hand-verified engine fixtures 001 and 011.
 */
const tool = 'profit-margin-calculator';
const summary = (page: Page) => page.getByRole('region', { name: 'Profitability Summary' });
const targets = (page: Page) => page.getByRole('region', { name: 'Target and Break-even' });

test.describe('Seller Profitability Calculator', () => {
  test('shows the default example result as soon as it opens', async ({ page }) => {
    await openTool(page, tool);
    await expect(summary(page)).toContainText('81.36');
    await expect(summary(page)).toContainText('9.6%');
    await expect(summary(page)).toContainText('20.34%');
    await expect(targets(page)).toContainText('₹888.47');
    await expect(targets(page)).toContainText('₹1,299.73');
    await expect(targets(page)).toContainText('₹1,363.79');
  });

  test('takes the GST inside the price out of profit and recalculates on every edit', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.locator('#seller-sp').fill('1500');
    await expect(summary(page)).toContainText('446.09');
    const table = page.getByRole('table', { name: 'Cost Breakdown Table' });
    await expect(table).toContainText('−₹228.81');
    await page.locator('#seller-fee-gst-rate').fill('0');
    await expect(summary(page)).toContainText('477.59');
  });

  test('a GST-exclusive price is all revenue (reference sample)', async ({ page }) => {
    await openTool(page, tool);
    await page.locator('#seller-gst-inclusive').selectOption('no');
    for (const [id, value] of [
      ['#seller-warehousing', '0'],
      ['#seller-labour', '0'],
      ['#seller-overhead', '0'],
      ['#seller-closing-fee', '0'],
      ['#seller-fee-gst-rate', '0'],
      ['#seller-other-charges', '20'],
      ['#seller-ret-rate', '0'],
    ]) {
      await page.locator(id).fill(value);
    }
    await expect(summary(page)).toContainText('330.00');
    await expect(summary(page)).toContainText('82.5%');
    await expect(targets(page)).toContainText('₹633.33');
  });

  test('reset brings back the default example', async ({ page }) => {
    await openTool(page, tool);
    await page.locator('#seller-sp').fill('2000');
    await page.getByRole('button', { name: /Reset/ }).first().click();
    await expect(page.locator('#seller-sp')).toHaveValue('1000');
    await expect(summary(page)).toContainText('81.36');
  });
});
