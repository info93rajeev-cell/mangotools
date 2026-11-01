import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

test.describe('Compress PDF', () => {
  test('compresses the photo sample for real and downloads a smaller valid PDF', async ({
    page,
  }) => {
    await gotoReady(page, '/compress-pdf');
    await page.getByRole('button', { name: /Sample PDF/ }).click();
    await expect(page.getByText('Site-Photo-Report-Sample.pdf')).toBeVisible();
    await expect(page.getByText('Ready to compress')).toBeVisible();
    await page.getByRole('button', { name: /Compress PDF →/ }).click();
    await expect(page.getByText('✓ Compressed')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/3 of 3 JPEG images were re-encoded/)).toBeVisible();
    const reduction = await page
      .getByText('Size Reduction', { exact: true })
      .locator('..')
      .textContent();
    expect(Number(/(\d+)%/.exec(reduction ?? '')?.[1] ?? 0)).toBeGreaterThan(10);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Compressed PDF/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('Site-Photo-Report-Sample-compressed.pdf');
    const path = await file.path();
    const bytes = readFileSync(path);
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(bytes.subarray(-6).toString('latin1')).toContain('%%EOF');
  });

  test('changing a setting clears the old result', async ({ page }) => {
    await gotoReady(page, '/compress-pdf');
    await page.getByRole('button', { name: /Sample PDF/ }).click();
    await page.getByRole('button', { name: /Compress PDF →/ }).click();
    await expect(page.getByText('✓ Compressed')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /Strong Compression/ }).click();
    await expect(page.getByText('Ready to compress')).toBeVisible();
  });
});
