import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { gotoReady, primaryResult, produceResult } from '../support/tool-page.ts';

const slug = 'amazon-india-seller-fee-profit-estimator';
test('production Amazon form activates existing results, preserves collapsed values and saves locally', async ({
  page,
}) => {
  await gotoReady(page, `/${slug}`);
  await produceResult(page, slug);
  await expect(page.locator('[data-amazon-result]')).toBeVisible();
  await expect(page.getByText('No Amazon fees are configured.', { exact: false })).toBeVisible();
  await page.getByRole('switch', { name: 'Amazon Fees', exact: true }).click();
  await page.getByLabel('Closing fee', { exact: true }).selectOption('fixed');
  await page.getByLabel('Closing fee amount', { exact: true }).fill('10');
  await page.getByLabel('Closing fee GST treatment', { exact: true }).selectOption('none');
  await expect(primaryResult(page)).toHaveText('₹590.00');
  await page.getByRole('switch', { name: 'Amazon Fees', exact: true }).click();
  await expect(primaryResult(page)).toHaveText('₹590.00');
  const manager = page.locator('[data-tool-presets]');
  await manager.getByRole('button', { name: 'Save as new', exact: true }).click();
  await manager.getByLabel('Preset name').fill('Manual test');
  await manager.getByRole('button', { name: 'Save preset', exact: true }).click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await manager.getByRole('button', { name: 'Load', exact: true }).click();
  await expect(primaryResult(page)).toHaveText('₹590.00');
  await page.getByRole('switch', { name: 'Amazon Fees', exact: true }).click();
  await expect(page.getByLabel('Closing fee amount', { exact: true })).toHaveValue('10');
});
test('production price-slab rows reach the existing operation and renderer', async ({ page }) => {
  await gotoReady(page, `/${slug}`);
  await produceResult(page, slug);
  await page.getByRole('switch', { name: 'Amazon Fees', exact: true }).click();
  await page.getByLabel('Referral fee', { exact: true }).selectOption('price-slabs');
  await page.getByLabel('Referral fee GST treatment', { exact: true }).selectOption('none');
  const rows = page.locator('[data-rows-field="referralPriceSlabs"]');
  await rows.getByRole('button', { name: /Add/ }).click();
  await rows.getByLabel('Up to price (inclusive)', { exact: true }).fill('2000');
  await rows.getByLabel('Rate %', { exact: true }).fill('7');
  await expect(primaryResult(page)).toHaveText('₹530.00');
  await page.getByText('Amazon fee breakdown', { exact: true }).first().click();
  await expect(page.locator('[data-fee-row]')).toContainText('₹70.00');
});
for (const size of [
  { width: 1366, height: 768 },
  { width: 360, height: 800 },
]) {
  test(`production Amazon populated viewport ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, `/${slug}`);
    await produceResult(page, slug);
    await expect(page.locator('[data-tool-presets]')).toBeVisible();
    await expect(page.locator('details[data-tool-content-section][open]')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0);
    const out = join(process.cwd(), 'tests/artifacts/screenshots');
    mkdirSync(out, { recursive: true });
    await page.screenshot({
      path: join(out, `${slug}-${size.width}x${size.height}.png`),
      fullPage: true,
    });
  });
}
