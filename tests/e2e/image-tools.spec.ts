import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { gotoReady, island, openTool, primaryResult } from '../support/tool-page.ts';

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

test.describe('Image Metadata Remover', () => {
  const fileInput = (page: Page) =>
    island(page, 'image-metadata-remover').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-metadata-remover/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-metadata-remover').locator('img');

  test('selecting an image previews it without exposing width or height controls', async ({
    page,
  }) => {
    await openTool(page, 'image-metadata-remover');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Width')).toHaveCount(0);
    await expect(page.getByLabel('Height')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Keep aspect ratio' })).toHaveCount(0);
  });

  test('defaults to "same as input", cleans the image, and downloads it with the default name', async ({
    page,
  }) => {
    await openTool(page, 'image-metadata-remover');
    await fileInput(page).setInputFiles([sample]);
    await expect(page.getByLabel('Output format')).toHaveValue('same');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cleaned image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-cleaned.jpg');
    await expect(primaryResult(page)).toHaveText('sample-cleaned.jpg');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('jpg');
    // The standing warning already shown by every image.resize@1-backed tool is this tool's whole point.
    await expect(
      page.getByText('Metadata such as camera and location data is not preserved.'),
    ).toBeVisible();
  });

  test('can also convert format while cleaning', async ({ page }) => {
    await openTool(page, 'image-metadata-remover');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output format').selectOption('png');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cleaned image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-cleaned.png');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-metadata-remover');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output file name').fill('  My Photo<>.JPG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cleaned image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photo.jpg');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-metadata-remover');
    const notAnImage = join(process.cwd(), 'tools/image-metadata-remover/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download cleaned image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});

test.describe('Image Watermark', () => {
  const fileInput = (page: Page) => island(page, 'image-watermark').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-watermark/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-watermark').locator('img');

  test('selecting an image previews it and shows watermark controls with their defaults', async ({
    page,
  }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Position')).toHaveValue('bottom-right');
    await expect(page.getByLabel('Opacity')).toHaveValue('50');
    await expect(page.getByLabel('Font size')).toHaveValue('32');
    await expect(page.getByLabel('Text color')).toHaveValue('#ffffff');
  });

  test('shows a specific error when no watermark text is entered', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    await expect(page.getByText('Enter the text to use as a watermark.')).toBeVisible();
  });

  test('adds a bottom-right watermark and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Watermark text').fill('© Sample');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-watermarked.jpg');
    await expect(primaryResult(page)).toHaveText('sample-watermarked.jpg');
    await expect(page.locator('[data-output="watermarkText"] dd')).toHaveText('© Sample');
    await expect(page.locator('[data-output="position"] dd')).toHaveText('bottom-right');
    await expect(page.locator('[data-output="outputWidth"] dd')).toHaveText('8');
    await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('8');
  });

  test('adds a center watermark with custom opacity, font size and color', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Watermark text').fill('Draft');
    await page.getByLabel('Position').selectOption('center');
    await page.getByLabel('Opacity').fill('80');
    await page.getByLabel('Font size').fill('16');
    await page.getByLabel('Text color').fill('#ff0000');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    await downloadPromise;
    await expect(page.locator('[data-output="position"] dd')).toHaveText('center');
    await expect(page.locator('[data-output="opacity"] dd')).toHaveText('80');
    await expect(page.locator('[data-output="fontSize"] dd')).toHaveText('16');
    await expect(page.locator('[data-output="color"] dd')).toHaveText('#ff0000');
  });

  test('can also convert format while watermarking', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Watermark text').fill('Sample');
    await page.getByLabel('Output format').selectOption('png');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-watermarked.png');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Watermark text').fill('Sample');
    await page.getByLabel('Output file name').fill('  My Photo<>.JPG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photo.jpg');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-watermark');
    const notAnImage = join(process.cwd(), 'tools/image-watermark/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByLabel('Watermark text').fill('Sample');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});

test.describe('Image Crop', () => {
  const fileInput = (page: Page) => island(page, 'image-crop').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-crop/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-crop').locator('img');

  test('selecting an image previews it and shows the default crop rectangle', async ({ page }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Crop X')).toHaveValue('0');
    await expect(page.getByLabel('Crop Y')).toHaveValue('0');
    await expect(page.getByLabel('Crop width')).toHaveValue('100');
    await expect(page.getByLabel('Crop height')).toHaveValue('100');
  });

  test('crops from the top-left and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Crop X').fill('0');
    await page.getByLabel('Crop Y').fill('0');
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-cropped.jpg');
    await expect(primaryResult(page)).toHaveText('sample-cropped.jpg');
    await expect(page.locator('[data-output="outputWidth"] dd')).toHaveText('4');
    await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('4');
    await expect(page.locator('[data-output="originalWidth"] dd')).toHaveText('8');
    await expect(page.locator('[data-output="originalHeight"] dd')).toHaveText('8');
  });

  test('crops from a center area', async ({ page }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Crop X').fill('2');
    await page.getByLabel('Crop Y').fill('2');
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    await downloadPromise;
    await expect(page.locator('[data-output="cropX"] dd')).toHaveText('2');
    await expect(page.locator('[data-output="cropY"] dd')).toHaveText('2');
    await expect(page.locator('[data-output="outputWidth"] dd')).toHaveText('4');
    await expect(page.locator('[data-output="outputHeight"] dd')).toHaveText('4');
  });

  test('can also convert format while cropping', async ({ page }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');
    await page.getByLabel('Output format').selectOption('png');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-cropped.png');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
  });

  test('shows a specific error when the crop rectangle extends outside the image', async ({
    page,
  }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Crop width').fill('100');
    await page.getByLabel('Crop height').fill('100');
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    await expect(
      page.getByText('The crop rectangle extends outside the image, which is 8×8 pixels.'),
    ).toBeVisible();
  });

  test('shows a specific error for an invalid crop width', async ({ page }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Crop width').fill('0');
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    await expect(page.getByText('Enter a crop width and height greater than 0.')).toBeVisible();
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-crop');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Crop width').fill('4');
    await page.getByLabel('Crop height').fill('4');
    await page.getByLabel('Output file name').fill('  My Photo<>.JPG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photo.jpg');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-crop');
    const notAnImage = join(process.cwd(), 'tools/image-crop/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download cropped image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});

test.describe('Image & Media category', () => {
  test('shows exactly six tools and no future image tools', async ({ page }) => {
    await gotoReady(page, '/media');
    await expect(page.getByRole('heading', { name: 'Image & Media', exact: true })).toBeVisible();
    const allTools = page.getByRole('region', { name: 'All Image & Media tools' });
    await expect(allTools.getByRole('link', { name: 'Image Resize' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Compress' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Format Converter' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Metadata Remover' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Watermark' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Crop' })).toBeVisible();
    await expect(allTools.getByRole('link')).toHaveCount(6);
    for (const future of ['Background Remover', 'Passport Photo', 'Favicon Generator']) {
      await expect(page.getByText(future, { exact: true })).toHaveCount(0);
    }
  });
});
