import { join } from 'node:path';
import { expect, test } from '@playwright/test';

for (const tool of ['image-resize', 'image-format-converter']) {
  test(`${tool}: user upload wins over delayed automatic sample; manual sample still works`, async ({
    page,
  }) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let requested = () => {};
    const requestStarted = new Promise<void>((resolve) => {
      requested = resolve;
    });
    await page.route('**/samples/jaipur-palace.jpg', async (route) => {
      requested();
      await gate;
      await route.continue();
    });
    await page.goto(`/${tool}`);
    await requestStarted;
    await page
      .locator('input[type="file"]')
      .setInputFiles(join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg'));
    await expect(page.getByText('sample.jpg', { exact: true }).first()).toBeVisible();
    const response = page.waitForResponse('**/samples/jaipur-palace.jpg');
    release();
    await (await response).finished();
    // Allow image decode and Preact paint to settle after the delayed response.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    await expect(page.getByText('sample.jpg', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('jaipur-palace.jpg', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try Sample', exact: true }).click();
    await expect(page.getByText('jaipur-palace.jpg', { exact: true }).first()).toBeVisible();
  });

  test(`${tool}: automatic sample loads without user interaction`, async ({ page }) => {
    await page.goto(`/${tool}`);
    await expect(page.getByText('jaipur-palace.jpg', { exact: true }).first()).toBeVisible();
  });
}
