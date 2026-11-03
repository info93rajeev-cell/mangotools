import { expect, type Page, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

/** Calculated by estimate.pricing.price-plan@1; figures are its hand-verified fixtures. */
const tool = 'markup-calculator';
const result = (page: Page) => page.getByRole('region', { name: 'Pricing Result' });
const modeTab = (page: Page, name: string) =>
  page.getByRole('tablist', { name: 'Pricing Mode Tabs' }).getByRole('button', { name });

test.describe('Markup Calculator', () => {
  test('shows the default 40% markup result as soon as it opens', async ({ page }) => {
    await openTool(page, tool);
    await expect(result(page)).toContainText('700.00');
    await expect(result(page)).toContainText('28.57%');
    await expect(result(page)).toContainText('₹4,000.00');
    await expect(page.getByRole('region', { name: 'Target Margin Mode' })).toContainText('₹714.29');
  });

  test('a target margin gives the price and the markup it really needs', async ({ page }) => {
    await openTool(page, tool);
    await modeTab(page, 'Target margin').click();
    await expect(result(page)).toContainText('714.29');
    await expect(result(page)).toContainText('42.86%');
  });

  test('a price below cost is shown as a loss', async ({ page }) => {
    await openTool(page, tool);
    await modeTab(page, 'Find markup %').click();
    await page
      .getByRole('region', { name: 'Reverse Calculator' })
      .locator('input')
      .first()
      .fill('400');
    await expect(result(page)).toContainText('-20%');
    await expect(result(page)).toContainText('-100');
  });

  test('GST after pricing adds GST on top of the selling price', async ({ page }) => {
    await openTool(page, tool);
    await page.locator('#markup-gst-pricing').selectOption('18');
    await expect(page.getByRole('region', { name: 'Optional Price Additions' })).toContainText(
      '₹826.00',
    );
  });
});
