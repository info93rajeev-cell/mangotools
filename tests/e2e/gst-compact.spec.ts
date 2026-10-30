import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const tool = 'gst-calculator';

const kpi = (page: Page, title: string) =>
  page
    .locator('[data-tax-results-card] [class*="kpiCard"]')
    .filter({ hasText: title })
    .locator('[class*="kpiVal"]');

const componentAmount = (page: Page, name: string) =>
  page
    .locator('[data-tax-results-card] [class*="breakdownRow"]')
    .filter({ hasText: name })
    .locator('[class*="breakdownAmount"]');

const componentRow = (page: Page, name: string) =>
  page.locator('[data-tax-results-card] [class*="breakdownRow"]').filter({ hasText: name });

test.describe('GST compact workspace', () => {
  test('fits populated inputs, results and collapsed supporting content on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openTool(page, tool);

    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await expect(island(page, tool).locator('[data-universal-tax-studio]')).toBeVisible();
    await expect(page.locator('[data-tax-results-card]')).toBeVisible();

    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(pageOverflow).toBeLessThanOrEqual(0);
  });

  test('uses paired controls without mobile horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);

    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await expect(page.locator('#tax-input-amount')).toBeVisible();
    await expect(page.locator('#tax-input-qty')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('preserves Add GST results for intra-state and inter-state supplies', async ({ page }) => {
    await openTool(page, tool);
    await page.locator('#tax-input-amount').fill('1000');
    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await expect(kpi(page, 'Taxable')).toHaveText('₹1,000.00');
    await expect(kpi(page, 'Total tax')).toHaveText('₹180.00');
    await expect(componentAmount(page, 'CGST')).toHaveText('₹90.00');
    await expect(componentAmount(page, 'SGST')).toHaveText('₹90.00');

    await page.getByRole('button', { name: 'Inter-state (IGST)' }).click();
    await expect(primaryResult(page)).toHaveText('₹1,180.00');
    await expect(kpi(page, 'Total tax')).toHaveText('₹180.00');
    await expect(componentAmount(page, 'IGST')).toHaveText('₹180.00');
    await expect(componentRow(page, 'CGST')).toHaveCount(0);
  });

  test('preserves Remove GST results and odd-paisa rounding', async ({ page }) => {
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Inclusive Price' }).click();
    await page.locator('#tax-input-amount').fill('100');
    await expect(primaryResult(page)).toHaveText('₹100.00');
    await expect(kpi(page, 'Taxable')).toHaveText('₹84.75');
    await expect(kpi(page, 'Total tax')).toHaveText('₹15.25');
    await expect(componentAmount(page, 'CGST')).toHaveText('₹7.63');
    await expect(componentAmount(page, 'SGST')).toHaveText('₹7.62');

    await page.getByRole('button', { name: 'Inter-state (IGST)' }).click();
    await expect(primaryResult(page)).toHaveText('₹100.00');
    await expect(kpi(page, 'Taxable')).toHaveText('₹84.75');
    await expect(kpi(page, 'Total tax')).toHaveText('₹15.25');
    await expect(componentAmount(page, 'IGST')).toHaveText('₹15.25');
    await expect(componentRow(page, 'CGST')).toHaveCount(0);
  });

  test('supports every predefined rate, zero, and a custom rate', async ({ page }) => {
    await openTool(page, tool);
    await page.locator('#tax-input-amount').fill('100');
    const rate = page.locator('#gst-rate-select');
    for (const [value, gross] of [
      ['0', '₹100.00'],
      ['5', '₹105.00'],
      ['12', '₹112.00'],
      ['18', '₹118.00'],
      ['28', '₹128.00'],
    ]) {
      await rate.selectOption(value);
      await expect(primaryResult(page)).toHaveText(gross);
    }
  });
});
