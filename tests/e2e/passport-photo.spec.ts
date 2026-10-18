import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

const ID = 'passport-photo-resizer';
const source = join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg');
const downloadButton = (page: Page) =>
  page.getByRole('button', { name: 'Download passport photo' });

async function loadPhoto(page: Page) {
  await openTool(page, ID);
  await island(page, ID).locator('input[type="file"]').setInputFiles(source);
  await expect(page.getByLabel('Photo width')).toHaveValue('8');
  await expect(page.getByLabel('Photo height')).toHaveValue('8');
}

async function downloadPhoto(page: Page) {
  const pending = page.waitForEvent('download');
  await downloadButton(page).click();
  return pending;
}

test('passport photo preserves aspect ratio and reports actual fitted dimensions', async ({
  page,
}) => {
  await loadPhoto(page);
  await expect(page.getByLabel('Output format')).toHaveValue('jpg');
  await expect(page.getByLabel('Quality', { exact: true })).toHaveValue('85');
  await expect(page.getByRole('switch', { name: 'Keep aspect ratio' })).toBeChecked();
  await page.getByLabel('Photo width').fill('6');
  await page.getByLabel('Photo height').fill('4');
  expect((await downloadPhoto(page)).suggestedFilename()).toBe('sample-passport.jpg');
  await expect(primaryResult(page)).toHaveText('4');
  await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('4');
  await expect(page.locator('[data-output="outputFileSize"] dd')).toHaveText(/^\d+$/);
});

test('passport photo can force explicit pixel dimensions and export PNG', async ({ page }) => {
  await loadPhoto(page);
  await page.getByRole('switch', { name: 'Keep aspect ratio' }).click();
  await page.getByLabel('Photo width').fill('6');
  await page.getByLabel('Photo height').fill('4');
  await page.getByLabel('Output format').selectOption('png');
  expect((await downloadPhoto(page)).suggestedFilename()).toBe('sample-passport.png');
  await expect(primaryResult(page)).toHaveText('6');
  await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('4');
  await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
});

test('passport photo accepts PNG input and retains transparent-to-JPG warning', async ({
  page,
}) => {
  await openTool(page, ID);
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 8;
    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  });
  await island(page, ID)
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'transparent.png',
      mimeType: 'image/png',
      buffer: Buffer.from(encoded, 'base64'),
    });
  await expect(page.getByLabel('Photo width')).toHaveValue('8');
  expect((await downloadPhoto(page)).suggestedFilename()).toBe('transparent-passport.jpg');
  await expect(primaryResult(page)).toHaveText('8');
  await expect(page.getByText(/transparent areas.*white/i)).toBeVisible();
});

test('passport photo errors are recoverable and clear restores normal defaults', async ({
  page,
}) => {
  await loadPhoto(page);
  await page.getByLabel('Photo width').fill('0');
  await downloadButton(page).click();
  await expect(page.getByText('Enter a width and height greater than 0.')).toBeVisible();
  await page.getByLabel('Photo width').fill('6');
  await page.getByLabel('Output format').selectOption('png');
  await downloadPhoto(page);
  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(
    page.getByText('Add a photo, then enter the pixel dimensions required by your application.'),
  ).toBeVisible();
  await expect(page.getByLabel('Photo width')).toHaveCount(0);
  await expect(primaryResult(page)).toHaveCount(0);
  await island(page, ID).locator('input[type="file"]').setInputFiles(source);
  await expect(page.getByLabel('Photo width')).toHaveValue('8');
  await expect(page.getByLabel('Output format')).toHaveValue('jpg');
  await expect(page.getByLabel('Quality', { exact: true })).toHaveValue('85');
});

test('passport photo rejects non-image input using the existing typed error', async ({ page }) => {
  await openTool(page, ID);
  await island(page, ID)
    .locator('input[type="file"]')
    .setInputFiles(join(process.cwd(), 'tools/passport-photo-resizer/manifest.yaml'));
  await downloadButton(page).click();
  await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
});

for (const size of [
  { width: 1366, height: 768 },
  { width: 360, height: 800 },
]) {
  test(`passport photo keyboard and viewport @ ${size.width}x${size.height}`, async ({
    page,
    browserName,
  }) => {
    await page.setViewportSize(size);
    await loadPhoto(page);
    await page.getByLabel('Photo width').focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('6');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Photo height')).toBeFocused();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('4');
    await downloadButton(page).focus();
    const pending = page.waitForEvent('download');
    await page.keyboard.press('Enter');
    await pending;
    await expect(primaryResult(page)).toHaveText('4');
    expect(await page.locator('details[open]').count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('status').filter({ hasText: 'Downloaded' })).toHaveCount(0);
    await page.evaluate(() => scrollTo(0, 0));
    const directory = join(process.cwd(), 'tests/artifacts/screenshots');
    mkdirSync(directory, { recursive: true });
    await page.screenshot({
      path: join(directory, `${ID}-${browserName}-${size.width}x${size.height}.png`),
      fullPage: true,
    });
  });
}
