import { expect, type Page, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

/**
 * The Volumetric Weight studio is calculated by logistics.weight.shipment@1; the expected figures
 * are the hand-verified engine fixture 001 (the tool's own three-row sample, divisor 6000).
 */
const tool = 'volumetric-weight-calculator';
const results = (page: Page) =>
  page
    .locator('#volumetric-results-title')
    .locator('xpath=ancestor::div[contains(@class,"card")][1]');

test.describe('Volumetric Weight studio', () => {
  test('shows the engine result for the sample shipment', async ({ page }) => {
    await gotoReady(page, `/${tool}`);
    await expect(results(page)).toContainText('34.646 kg');
    await expect(results(page)).toContainText('30.500 kg');
    await expect(results(page)).toContainText('0.208 m³');
    await expect(results(page)).toContainText('VOLUMETRIC GOVERNS');
  });

  test('recalculates as the divisor is typed and explains an out-of-range divisor', async ({
    page,
  }) => {
    await gotoReady(page, `/${tool}`);
    await page.locator('#divisorInput').fill('5000');
    // 207,875 cm³ ÷ 5000 = 41.575 kg
    await expect(results(page)).toContainText('41.575 kg');
    await page.locator('#divisorInput').fill('500');
    await expect(results(page).locator('[data-engine-error]')).toContainText('1,000 and 10,000');
  });
});
