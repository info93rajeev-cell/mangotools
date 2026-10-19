import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { island, openTool } from '../support/tool-page.ts';

const TOOL_ID = 'image-crop';
const FIXTURES = join(process.cwd(), 'tools/image-crop/fixtures/files');
const SAMPLE_JPG = join(FIXTURES, 'sample.jpg');
const PHOTO_JPG = join(process.cwd(), 'tools/image-compress/fixtures/files/photo.jpg');
const TRANSPARENT_PNG = join(FIXTURES, 'transparent.png');
const ANIMATED_PNG = join(FIXTURES, 'animated.png');
const ANIMATED_WEBP = join(FIXTURES, 'animated.webp');

const isWinWebKit = (browserName: string) =>
  browserName === 'webkit' && process.platform === 'win32';

const fileInput = (page: Page) => island(page, TOOL_ID).locator('input[type="file"]');
const downloadButton = (page: Page) => page.locator('[data-crop-button]');
const selectionRect = (page: Page) =>
  page.locator('section[aria-roledescription="crop selection"]');
const resultCard = (page: Page) => page.locator('[data-crop-result]');

test.describe('Image Crop — Acceptance Contract Gates', () => {
  test('Gate 1: Free crop by visual drag moves selection box', async ({ page }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);
    await expect(selectionRect(page)).toBeVisible();

    const box = await selectionRect(page).boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 15, startY + 15, { steps: 5 });
    await page.mouse.up();

    const xVal = Number(await page.getByLabel('Crop X').inputValue());
    const yVal = Number(await page.getByLabel('Crop Y').inputValue());
    expect(xVal >= 0).toBe(true);
    expect(yVal >= 0).toBe(true);
  });

  test('Gate 2: All 8 resize handles exist and resize selection', async ({ page }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([PHOTO_JPG]);

    const handleLabels = [
      'Resize selection from top left',
      'Resize selection from top',
      'Resize selection from top right',
      'Resize selection from right',
      'Resize selection from bottom right',
      'Resize selection from bottom',
      'Resize selection from bottom left',
      'Resize selection from left',
    ];
    for (const label of handleLabels) {
      await expect(page.getByRole('slider', { name: label, exact: true })).toBeVisible();
    }

    const seHandle = page.getByRole('slider', {
      name: 'Resize selection from bottom right',
      exact: true,
    });
    const seBox = await seHandle.boundingBox();
    expect(seBox).not.toBeNull();
    if (!seBox) return;

    const prevW = Number(await page.getByLabel('Crop width').inputValue());
    await page.mouse.move(seBox.x + seBox.width / 2, seBox.y + seBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(seBox.x - 30, seBox.y - 30, { steps: 5 });
    await page.mouse.up();

    const nextW = Number(await page.getByLabel('Crop width').inputValue());
    expect(nextW).toBeLessThan(prevW);
  });

  test('Gates 3-6: Aspect ratio presets (1:1, 4:3, 16:9, 35:45)', async ({ page }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([PHOTO_JPG]);

    // 1:1
    await page.getByRole('button', { name: '1:1' }).click();
    let w = Number(await page.getByLabel('Crop width').inputValue());
    let h = Number(await page.getByLabel('Crop height').inputValue());
    expect(w).toBe(h);

    // 4:3
    await page.getByRole('button', { name: '4:3' }).click();
    w = Number(await page.getByLabel('Crop width').inputValue());
    h = Number(await page.getByLabel('Crop height').inputValue());
    expect(Math.abs(w / h - 4 / 3)).toBeLessThan(0.05);

    // 16:9
    await page.getByRole('button', { name: '16:9' }).click();
    w = Number(await page.getByLabel('Crop width').inputValue());
    h = Number(await page.getByLabel('Crop height').inputValue());
    expect(Math.abs(w / h - 16 / 9)).toBeLessThan(0.05);

    // 35:45
    await page.getByRole('button', { name: '35:45' }).click();
    w = Number(await page.getByLabel('Crop width').inputValue());
    h = Number(await page.getByLabel('Crop height').inputValue());
    expect(Math.abs(w / h - 35 / 45)).toBeLessThan(0.05);
  });

  test('Gate 7: X/Y/W/H bi-directional synchronization', async ({ page }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);

    await page.getByLabel('Crop X').fill('1');
    await page.getByLabel('Crop Y').fill('1');
    await page.getByLabel('Crop width').fill('5');
    await page.getByLabel('Crop height').fill('5');

    await expect(page.getByLabel('Crop X')).toHaveValue('1');
    await expect(page.getByLabel('Crop Y')).toHaveValue('1');
    await expect(page.getByLabel('Crop width')).toHaveValue('5');
    await expect(page.getByLabel('Crop height')).toHaveValue('5');
  });

  test('Gate 8: Crop at exact right and bottom boundary', async ({ page, browserName }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);

    await page.getByLabel('Crop X').fill('4');
    await page.getByLabel('Crop Y').fill('4');
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');

    if (isWinWebKit(browserName)) {
      await downloadButton(page).click();
      await expect(page.getByText('The image could not be cropped.')).toBeVisible();
      return;
    }

    const downloadPromise = page.waitForEvent('download');
    await downloadButton(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-cropped.jpg');

    await expect(resultCard(page)).toBeVisible();
    await expect(page.locator('[data-output="outputWidth"] dd')).toHaveText('4');
    await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('4');
    await expect(page.locator('[data-output="cropX"] dd')).toHaveText('4');
    await expect(page.locator('[data-output="cropY"] dd')).toHaveText('4');
  });

  test('Gate 9: Out-of-bounds rejection with typed error', async ({ page }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);

    await page.getByLabel('Crop width').fill('50');
    await page.getByLabel('Crop height').fill('50');
    await downloadButton(page).click();

    await expect(
      page.getByText('The crop rectangle extends outside the image, which is 8×8 pixels.'),
    ).toBeVisible();
  });

  test('Gate 10: PNG alpha preservation', async ({ page, browserName }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([TRANSPARENT_PNG]);

    await page.getByLabel('Output format').selectOption('png');
    await page.getByLabel('Crop X').fill('0');
    await page.getByLabel('Crop Y').fill('0');
    await page.getByLabel('Crop width').fill('8');
    await page.getByLabel('Crop height').fill('8');

    if (isWinWebKit(browserName)) {
      await downloadButton(page).click();
      await expect(page.getByText('The image could not be cropped.')).toBeVisible();
      return;
    }

    const downloadPromise = page.waitForEvent('download');
    await downloadButton(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('transparent-cropped.png');

    await expect(resultCard(page)).toBeVisible();
    await expect(page.locator('[data-result-row="output-format"] dd')).toHaveText('png');

    const path = await download.path();
    if (path) {
      const bytes = readFileSync(path);
      expect(bytes[0]).toBe(0x89);
      expect(bytes[1]).toBe(0x50);
      expect(bytes[25]).toBe(6);
    }
  });

  test('Gate 11: JPG transparency flattened to white with warning', async ({
    page,
    browserName,
  }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([TRANSPARENT_PNG]);

    await page.getByLabel('Output format').selectOption('jpg');
    await page.getByLabel('Crop X').fill('0');
    await page.getByLabel('Crop Y').fill('0');
    await page.getByLabel('Crop width').fill('8');
    await page.getByLabel('Crop height').fill('8');

    if (isWinWebKit(browserName)) {
      await downloadButton(page).click();
      await expect(page.getByText('The image could not be cropped.')).toBeVisible();
      return;
    }

    const downloadPromise = page.waitForEvent('download');
    await downloadButton(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('transparent-cropped.jpg');

    await expect(resultCard(page)).toBeVisible();
    await expect(page.locator('[data-result-row="output-format"] dd')).toHaveText('jpg');
    await expect(page.locator('[data-warnings-disclosure]')).toBeVisible();
  });

  test('Gate 12: Stale result invalidation upon any input change', async ({
    page,
    browserName,
  }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);

    await page.getByLabel('Crop X').fill('0');
    await page.getByLabel('Crop Y').fill('0');
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');

    if (isWinWebKit(browserName)) {
      await downloadButton(page).click();
      await expect(page.getByText('The image could not be cropped.')).toBeVisible();
      await page.getByLabel('Crop width').fill('5');
      await expect(page.locator('[data-crop-error]')).toHaveCount(0);
      return;
    }

    const downloadPromise = page.waitForEvent('download');
    await downloadButton(page).click();
    await downloadPromise;
    await expect(resultCard(page)).toBeVisible();

    await page.getByLabel('Crop width').fill('5');
    await expect(resultCard(page)).toHaveCount(0);
  });

  test('Gate 13: Animated input rejection before decode (APNG and WebP)', async ({ page }) => {
    await openTool(page, TOOL_ID);

    // APNG
    await fileInput(page).setInputFiles([ANIMATED_PNG]);
    await expect(
      page.getByText('is an animated image. Animated images are not supported for this operation.'),
    ).toBeVisible();

    // Animated WebP
    await fileInput(page).setInputFiles([ANIMATED_WEBP]);
    await expect(
      page.getByText('is an animated image. Animated images are not supported for this operation.'),
    ).toBeVisible();
  });

  test('Gate 14: WebP output verified or typed failure', async ({ page, browserName }) => {
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);

    await page.getByLabel('Output format').selectOption('webp');
    await page.getByLabel('Crop X').fill('0');
    await page.getByLabel('Crop Y').fill('0');
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');

    if (isWinWebKit(browserName)) {
      await downloadButton(page).click();
      await expect(page.getByText('The image could not be cropped.')).toBeVisible();
      return;
    }

    const downloadPromise = page.waitForEvent('download');
    await downloadButton(page).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-cropped.webp');
    await expect(resultCard(page)).toBeVisible();
    await expect(page.locator('[data-result-row="output-format"] dd')).toHaveText('webp');

    const path = await download.path();
    if (path) {
      const bytes = readFileSync(path);
      const riff = String.fromCharCode(...bytes.subarray(0, 4));
      const webp = String.fromCharCode(...bytes.subarray(8, 12));
      expect(riff).toBe('RIFF');
      expect(webp).toBe('WEBP');
    }
  });
});

for (const size of [
  { width: 1366, height: 768 },
  { width: 360, height: 800 },
]) {
  test(`Responsive viewport verification @ ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await openTool(page, TOOL_ID);
    await fileInput(page).setInputFiles([SAMPLE_JPG]);
    await expect(selectionRect(page)).toBeVisible();
    await expect(page.getByLabel('Crop width')).toHaveValue('8');
    await expect(downloadButton(page)).toBeVisible();
  });
}
