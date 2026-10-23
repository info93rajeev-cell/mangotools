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

  test('resizes the image to PDF and downloads .pdf', async ({ page }) => {
    await openTool(page, 'image-resize');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output format').selectOption('pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download resized image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-resized.pdf');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('pdf');
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
  const photo = join(process.cwd(), 'tools/image-compress/fixtures/files/photo.jpg');
  const compressible = join(process.cwd(), 'tools/image-compress/fixtures/files/compressible.png');
  const preview = (page: Page) => island(page, 'image-compress').locator('img');

  test('selecting an image previews it without exposing width or height controls', async ({
    page,
  }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([photo]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Width')).toHaveCount(0);
    await expect(page.getByLabel('Height')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Keep aspect ratio' })).toHaveCount(0);
  });

  test('compresses the image, keeps its dimensions, and downloads it with the default name', async ({
    page,
  }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([photo]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('photo-compressed.jpg');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('jpg');
    const sizeDiffRaw = await page
      .locator('[data-output="sizeDifferenceBytes"] dd')
      .getAttribute('data-raw-value');
    expect(Number(sizeDiffRaw)).toBeGreaterThan(0);
  });

  test('compresses a compressible PNG image and downloads it with PNG format', async ({ page }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([compressible]);
    await page.getByLabel('Output format').selectOption('png');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('compressible-compressed.png');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
  });

  test('compresses the image to PDF and downloads .pdf', async ({ page }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([photo]);
    await page.getByLabel('Output format').selectOption('pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('photo-compressed.pdf');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('pdf');
  });

  test('reports honest failure when converting a JPEG photo to PNG cannot achieve a smaller file', async ({
    page,
  }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([photo]);
    await page.getByLabel('Output format').selectOption('png');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    await expect(
      page.getByText('No smaller result was achieved without degrading quality below 50%.'),
    ).toBeVisible();
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([photo]);
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
      buffer: readFileSync(photo),
    });
    await page.getByLabel('Output file name').fill('////');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('compressed-image.jpg');
  });

  test('reports honest failure when no smaller output can be achieved without degrading quality below 50%', async ({
    page,
  }) => {
    // sample.jpg is a tiny 331-byte fixture already smaller than browser JPEG overhead.
    // Under the byte-reduction contract, rather than claiming compression on an enlarged file,
    // the tool reports failure honestly.
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    await page.getByRole('button', { name: 'Download compressed image' }).click();

    await expect(
      page.getByText('No smaller result was achieved without degrading quality below 50%.'),
    ).toBeVisible();
  });

  test('a lower quality setting produces a smaller output than a higher one', async ({ page }) => {
    const noisy = join(process.cwd(), 'tools/image-compress/fixtures/files/noisy.png');
    const outputSize = () =>
      page
        .locator('[data-output="outputFileSize"] dd')
        .getAttribute('data-raw-value')
        .then((val) => Number(val));

    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([noisy]);
    await page.getByLabel('Output format').selectOption('jpg');

    await page.getByLabel('Quality').fill('50');
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

  test('fits strictly within 900px desktop viewport without page scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTool(page, 'image-compress');
    await page.waitForTimeout(500);
    const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    const innerH = await page.evaluate(() => window.innerHeight);
    const info = await page.evaluate(() => {
      return {
        bodyScroll: document.body.scrollHeight,
        docScroll: document.documentElement.scrollHeight,
        header: document.querySelector('header')?.getBoundingClientRect().height,
        main: document.querySelector('main')?.getBoundingClientRect().height,
        footer: document.querySelector('footer')?.getBoundingClientRect().height,
        controls: document.querySelector('[class*="controlsPanel"]')?.getBoundingClientRect()
          .height,
        canvas: document.querySelector('[class*="canvasPanel"]')?.getBoundingClientRect().height,
        result: document.querySelector('[class*="resultPanel"]')?.getBoundingClientRect().height,
      };
    });
    console.log('LAYOUT INFO:', JSON.stringify(info));
    expect(scrollH).toBeLessThanOrEqual(innerH);
    await page.screenshot({
      path: 'C:/Users/user/.gemini/antigravity/brain/69dd2223-e082-499a-9544-d181fd76ffa1/compress_desktop_900.png',
    });
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
    expect(options).toEqual(['JPG', 'PNG', 'WebP', 'PDF']);
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

  test('converts to PDF and downloads it with .pdf extension', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Convert to').selectOption('pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download converted image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-converted.pdf');
    await expect(primaryResult(page)).toHaveText('pdf');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-format-converter');
    const notAnImage = join(process.cwd(), 'tools/image-format-converter/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download converted image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});

test.describe('Background Remover', () => {
  const fileInput = (page: Page) =>
    island(page, 'image-background-remover').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-background-remover/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-background-remover').locator('img');

  test('selecting an image previews it and exposes tolerance and feather controls', async ({
    page,
  }) => {
    await openTool(page, 'image-background-remover');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page).first()).toBeVisible();
    await expect(page.getByLabel('Color tolerance')).toBeVisible();
    await expect(page.getByLabel('Edge smoothing')).toBeVisible();
  });

  test('removes background to transparent PNG and downloads it with default name', async ({
    page,
  }) => {
    await openTool(page, 'image-background-remover');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download transparent image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-no-bg.png');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
  });

  test('removes background and exports to PDF and downloads .pdf', async ({ page }) => {
    await openTool(page, 'image-background-remover');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output format').selectOption('pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download transparent image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-no-bg.pdf');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('pdf');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-background-remover');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output file name').fill('  My Cutout<>.PNG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download transparent image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Cutout.png');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-background-remover');
    const notAnImage = join(process.cwd(), 'tools/image-background-remover/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download transparent image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });

  test('fits strictly within 900px desktop viewport without page scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTool(page, 'image-background-remover');
    await page.waitForTimeout(500);
    const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    const innerH = await page.evaluate(() => window.innerHeight);
    const info = await page.evaluate(() => {
      return {
        bodyScroll: document.body.scrollHeight,
        docScroll: document.documentElement.scrollHeight,
        header: document.querySelector('header')?.getBoundingClientRect().height,
        main: document.querySelector('main')?.getBoundingClientRect().height,
        footer: document.querySelector('footer')?.getBoundingClientRect().height,
        controls: document.querySelector('[class*="controlsPanel"]')?.getBoundingClientRect()
          ?.height,
        canvas: document.querySelector('[class*="canvasPanel"]')?.getBoundingClientRect()?.height,
        result: document.querySelector('[class*="resultPanel"]')?.getBoundingClientRect()?.height,
      };
    });
    console.log('BG REMOVER LAYOUT INFO:', JSON.stringify(info));
    expect(scrollH).toBeLessThanOrEqual(innerH);
    await page.screenshot({
      path: 'C:/Users/user/.gemini/antigravity/brain/69dd2223-e082-499a-9544-d181fd76ffa1/bg_remover_desktop_900.png',
    });
  });
});
