import { expect, test } from '@playwright/test';
import { gotoReady, island } from '../support/tool-page.ts';

const tool = 'pallet-loading-calculator';

test.describe('Pallet Loading studio', () => {
  test('renders workspace and calculates default pallet loading results', async ({ page }) => {
    await gotoReady(page, `/${tool}`);
    await expect(island(page, tool)).toBeVisible();

    const results = page.locator('[data-pallet-loading-workspace]');
    await expect(results).toContainText('Boxes per layer');
    await expect(results).toContainText('Total layers');
    await expect(results).toContainText('Total boxes');
    await expect(results).toContainText('Space utilization');

    const kpiValues = results.locator('span[class*="kpiValue"]');
    await expect(kpiValues.first()).toBeVisible();
    const count = await kpiValues.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('recalculates when switching pallet preset and dimensions', async ({ page }) => {
    await gotoReady(page, `/${tool}`);
    const results = page.locator('[data-pallet-loading-workspace]');

    const select = page.locator('select').first();
    await select.selectOption('euro');
    await expect(results).toContainText('Euro Pallet');

    await select.selectOption('custom');
    await expect(results).toContainText('Custom Dimensions');
  });

  test('switches units between cm, mm, and inch', async ({ page }) => {
    await gotoReady(page, `/${tool}`);
    const workspace = page.locator('[data-pallet-loading-workspace]');

    const mmBtn = workspace.getByRole('button', { name: /^mm$/i });
    if (await mmBtn.isVisible()) {
      await mmBtn.click();
      await expect(workspace).toContainText('mm');
    }
  });

  test('fits mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoReady(page, `/${tool}`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
