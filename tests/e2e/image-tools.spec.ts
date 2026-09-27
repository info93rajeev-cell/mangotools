import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

test.describe('Image Resize', () => {
  const fileInput = (page: Page) => island(page, 'image-resize').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-resize/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-resize').locator('img');

  test('selecting an image previews it and prefills width and height', async ({ page }) => {
    await openTool(page, 'image-resize');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Width')).toHaveValue('8');
    await expect(page.getByLabel('Height')).toHaveValue('8');
  });

  test('resizes the image and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'image-resize');
    await fileInput(page).setInputFiles([sample]);
    await expect(page.getByLabel('Width')).toHaveValue('8');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download resized image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-resized.jpg');
    await expect(primaryResult(page)).toHaveText('8');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('jpg');
  });

  test('resizes to an exact size when aspect ratio is not kept', async ({ page }) => {
    await openTool(page, 'image-resize');
    await fileInput(page).setInputFiles([sample]);
    await expect(page.getByLabel('Width')).toHaveValue('8');
    await page.getByRole('switch', { name: 'Keep aspect ratio' }).click();
    await page.getByLabel('Width').fill('20');
    await page.getByLabel('Height').fill('10');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download resized image' }).click();
    await downloadPromise;
    await expect(primaryResult(page)).toHaveText('20');
    await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('10');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-resize');
    await fileInput(page).setInputFiles([sample]);
    await expect(page.getByLabel('Width')).toHaveValue('8');
    await page.getByLabel('Output file name').fill('  My Photo<>.JPG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download resized image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photo.jpg');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-resize');
    const notAnImage = join(process.cwd(), 'tools/image-resize/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download resized image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });

  test('shows a specific error for an invalid width', async ({ page }) => {
    await openTool(page, 'image-resize');
    await fileInput(page).setInputFiles([sample]);
    await expect(page.getByLabel('Width')).toHaveValue('8');
    await page.getByLabel('Width').fill('0');
    await page.getByRole('button', { name: 'Download resized image' }).click();
    await expect(page.getByText('Enter a width and height greater than 0.')).toBeVisible();
  });
});

test.describe('Image Compress', () => {
  const fileInput = (page: Page) => island(page, 'image-compress').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-compress/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-compress').locator('img');

  test('selecting an image previews it without exposing width or height controls', async ({
    page,
  }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Width')).toHaveCount(0);
    await expect(page.getByLabel('Height')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Keep aspect ratio' })).toHaveCount(0);
  });

  test('compresses the image, keeps its dimensions, and downloads it with the default name', async ({
    page,
  }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-compressed.jpg');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('jpg');
    await expect(page.locator('[data-output="outputWidth"] dd')).toHaveText('8');
    await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('8');
    await expect(page.locator('[data-output="originalWidth"] dd')).toHaveText('8');
    await expect(page.locator('[data-output="originalHeight"] dd')).toHaveText('8');
  });

  test('shows the output format after converting to PNG', async ({ page }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output format').selectOption('png');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-compressed.png');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output file name').fill('  My Photo<>.JPG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photo.jpg');
  });

  test('falls back to a compressed-image name when nothing usable remains', async ({ page }) => {
    await openTool(page, 'image-compress');
    // A file name that is only an extension, so the derived base is unusable too — the true fallback.
    await fileInput(page).setInputFiles({
      name: '.jpg',
      mimeType: 'image/jpeg',
      buffer: readFileSync(sample),
    });
    await page.getByLabel('Output file name').fill('////');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('compressed-image.jpg');
  });

  test('warns when the output is larger than the original', async ({ page }) => {
    // sample.jpg is a tiny (331-byte) hand-built fixture, smaller than any real browser's JPEG
    // container overhead, so re-encoding it always grows the file — but by how much is encoder-
    // specific (Chromium, Firefox and WebKit each produce a different byte count for the same
    // source). The stable, cross-browser contract is: the engine's own size-change fields agree the
    // output grew, and the warning is shown exactly because of that — not a specific percentage.
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    await downloadPromise;

    const percentText = await primaryResult(page).textContent();
    const sizeDifferenceText = await page
      .locator('[data-output="sizeDifferenceBytes"] dd')
      .textContent();
    expect(Number((percentText ?? '').replace('−', '-').replace('%', ''))).toBeLessThan(0);
    expect(Number((sizeDifferenceText ?? '').replace('−', '-').replace(/,/g, ''))).toBeLessThan(0);

    await expect(
      page.getByText(
        'The output file is larger than the original. Try a lower quality setting or another format.',
      ),
    ).toBeVisible();
  });

  test('a lower quality setting produces a smaller output than a higher one', async ({ page }) => {
    // A tiny hand-built fixture like sample.jpg is dominated by JPEG's fixed container overhead, where
    // quality makes no measurable difference — this needs a source with real per-pixel detail for the
    // quality setting to actually bite, hence the separate noisy.png fixture.
    const noisy = join(process.cwd(), 'tools/image-compress/fixtures/files/noisy.png');
    const outputSize = () =>
      page
        .locator('[data-output="outputFileSize"] dd')
        .textContent()
        .then((text) => Number((text ?? '').replace(/,/g, '')));

    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([noisy]);
    await page.getByLabel('Output format').selectOption('jpg');

    await page.getByLabel('Quality').fill('10');
    const lowPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    await lowPromise;
    const lowSize = await outputSize();

    await page.getByLabel('Quality').fill('95');
    const highPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    await highPromise;
    const highSize = await outputSize();

    expect(lowSize).toBeLessThan(highSize);
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-compress');
    const notAnImage = join(process.cwd(), 'tools/image-compress/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});

test.describe('Image Format Converter', () => {
  const fileInput = (page: Page) =>
    island(page, 'image-format-converter').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-format-converter/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-format-converter').locator('img');

  test('selecting an image previews it without exposing width or height controls', async ({
    page,
  }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Width')).toHaveCount(0);
    await expect(page.getByLabel('Height')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Keep aspect ratio' })).toHaveCount(0);
  });

  test('has no "same as input" option, unlike Resize and Compress', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    const options = await page.getByLabel('Convert to').locator('option').allTextContents();
    expect(options).toEqual(['JPG', 'PNG', 'WebP']);
  });

  test('converts to PNG (the default) and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download converted image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-converted.png');
    // outputFormat is this preset's primary result, unlike Resize (outputWidth) and Compress
    // (sizeChangePercent), so it renders via the primary-result element, not a "dd" output row.
    await expect(primaryResult(page)).toHaveText('png');
    await expect(page.locator('[data-output="originalFormat"] dd')).toHaveText('jpg');
  });

  test('converts to WebP and shows a quality control', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Convert to').selectOption('webp');
    await expect(page.getByLabel('Quality')).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download converted image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-converted.webp');
  });

  test('converting explicitly to the source’s own format warns that it was re-encoded', async ({
    page,
  }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Convert to').selectOption('jpg');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download converted image' }).click();
    await downloadPromise;
    await expect(
      page.getByText(
        'The output format is the same as the original. The image was re-encoded, which can change its size and quality slightly.',
      ),
    ).toBeVisible();
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output file name').fill('  My Photo<>.PNG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download converted image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photo.png');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    const notAnImage = join(process.cwd(), 'tools/image-format-converter/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download converted image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});
