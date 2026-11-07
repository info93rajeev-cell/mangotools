import { expect, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const tools = ['/compress-pdf', '/pdf-merge', '/pdf-split', '/pdf-to-word', '/word-to-pdf'];

for (const path of tools) {
  test(`${path} draws real page previews in the browser, with no outside requests`, async ({
    page,
  }) => {
    const outside: string[] = [];
    page.on('request', (r) => {
      const url = new URL(r.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol.startsWith('http')) {
        outside.push(r.url());
      }
    });
    await gotoReady(page, path);
    await page.getByRole('button', { name: 'Load Sample' }).click();
    const img = page.locator('img[src^="blob:"]').first();
    await expect(img).toBeVisible({ timeout: 15000 });
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(50);
    expect(outside).toEqual([]);
  });
}

test('PDF Merge opens with the sample, and the user’s own file replaces it', async ({ page }) => {
  await gotoReady(page, '/pdf-merge');
  await expect(page.getByText('Contract.pdf', { exact: true })).toBeVisible({ timeout: 15000 });
  await page
    .locator('input[type="file"][accept*="pdf"]')
    .first()
    .setInputFiles('tools/pdf-split/fixtures/files/five-page.pdf');
  await expect(page.getByText('five-page.pdf', { exact: true })).toBeVisible();
  await expect(page.getByText('Contract.pdf', { exact: true })).toHaveCount(0);
});
