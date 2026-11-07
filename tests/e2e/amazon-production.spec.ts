import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { gotoReady, primaryResult } from '../support/tool-page.ts';

const slug = 'amazon-india-seller-fee-profit-estimator';

test('production Amazon studio loads initial result, computes live and resets to sample defaults', async ({
  page,
  context,
}) => {
  await gotoReady(page, `/${slug}`);
  // Initial sample is engine fixture 023: ₹1,500 sale, ₹600 cost, fees claimed as ITC.
  await expect(primaryResult(page)).toHaveText('₹291.19');
  await expect(page.locator('#amz-sp')).toHaveValue('1500');
  await expect(page.locator('#amz-cost')).toHaveValue('600');
  await expect(page.locator('#amz-qty')).toHaveValue('100');

  // Live calculation on input edits
  await page.locator('#amz-sp').fill('2000');
  await expect(primaryResult(page)).not.toHaveText('…');
  await expect(primaryResult(page)).not.toHaveText('₹291.19');

  // Reset restores exact default sample
  await page.getByRole('button', { name: /Reset/i }).click();
  await expect(page.locator('#amz-sp')).toHaveValue('1500');
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Zero cookies used for privacy
  expect(await context.cookies()).toEqual([]);
  await gotoReady(page, '/gst-calculator');
  await expect(page.locator('[data-tool-presets]')).toHaveCount(0);
});

test('production Amazon studio category selection and ITC claim toggle update financial results', async ({
  page,
}) => {
  await gotoReady(page, `/${slug}`);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Category selection computes referral fee percentage dynamically
  await page.locator('#amz-category').selectOption('electronics');
  await expect(primaryResult(page)).not.toHaveText('…');
  await expect(page.locator('#amz-ref-fee')).toHaveValue('₹127.50');

  // Unchecking ITC turns fee GST into a cost deduction
  const itc = page.locator('#amz-itc');
  await expect(itc).toBeChecked();
  await itc.uncheck();
  await expect(itc).not.toBeChecked();
  await expect(primaryResult(page)).toHaveText('₹238.24');

  // Re-checking restores ITC credit
  await itc.check();
  await expect(itc).toBeChecked();
});

test('production Amazon studio itemized profit and settlement tables render correct figures', async ({
  page,
}) => {
  await gotoReady(page, `/${slug}`);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  const statement = page.getByRole('table', { name: 'Statement Table' });
  await expect(statement).toBeVisible();
  await expect(statement).toContainText('₹1,500.00');
  await expect(statement).toContainText('−₹600.00');

  const settlement = page.getByRole('table', { name: 'Settlement Table' });
  await expect(settlement).toBeVisible();
  await expect(settlement).toContainText('₹1,203.27');
});

for (const size of [
  { width: 1366, height: 768 },
  { width: 360, height: 800 },
]) {
  test(`production Amazon populated viewport ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await gotoReady(page, `/${slug}`);
    await expect(primaryResult(page)).toHaveText('₹291.19');
    await expect(page.locator('[data-amazon-fee-studio]')).toBeVisible();
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
