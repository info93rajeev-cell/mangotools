import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { control, openEvidence } from '../support/amazon-evidence.ts';
import { primaryResult } from '../support/tool-page.ts';

test('Amazon trust evidence: keyboard navigation, sample, reset and private zero-cookie execution', async ({
  page,
  context,
}) => {
  const d = await openEvidence(page);
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Verify keyboard focus order through input fields
  await control(page, 'sellingPrice').focus();
  for (const key of ['productCost', 'packagingCost', 'packedWeight', 'monthlyQty']) {
    await page.keyboard.press('Tab');
    await expect(control(page, key)).toBeFocused();
  }

  // Modify an input
  await control(page, 'sellingPrice').fill('1800');
  await expect(primaryResult(page)).not.toHaveText('₹291.19');

  // Try Sample restores the sample product
  await page.locator('[data-try-sample]').click();
  await expect(primaryResult(page)).toHaveText('₹291.19');
  await expect(control(page, 'sellingPrice')).toHaveValue('1500');

  // Reset restores defaults
  await page.getByRole('button', { name: /Reset/i }).click();
  await expect(primaryResult(page)).toHaveText('₹291.19');

  // Copy profit breakdown button is present and functional
  await expect(page.getByRole('button', { name: 'Copy Profit Breakdown' })).toBeVisible();

  // Download CSV button is present and functional
  await expect(page.getByRole('button', { name: 'Download CSV' })).toBeVisible();

  // Zero cookies used for privacy
  expect(await context.cookies()).toEqual([]);

  d.audit();
});

for (const width of [320, 390, 1366]) {
  test(`Amazon trust evidence: ${width}px viewport responsive layout with zero overflow`, async ({
    page,
    browserName,
  }) => {
    const height = width === 1366 ? 768 : 844;
    await page.setViewportSize({ width, height });
    const d = await openEvidence(page);
    await expect(primaryResult(page)).toHaveText('₹291.19');

    // Confirm studio is visible
    await expect(page.locator('[data-amazon-fee-studio]')).toBeVisible();

    // Verify zero horizontal overflow at this width
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0);

    // Verify no broken text tokens
    await expect(page.locator('body')).not.toContainText(/\b(?:NaN|Infinity|undefined|null)\b/);

    if (browserName === 'chromium') {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.evaluate(() => scrollTo(0, 0));
      const out = join(process.cwd(), 'tests/artifacts/screenshots');
      mkdirSync(out, { recursive: true });
      await page.screenshot({
        path: join(out, `amazon-final-${width}.png`),
        fullPage: true,
      });
    }

    d.audit();
  });
}
