import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { FILE_TOOLS, gotoReady, island, openTool, primaryResult } from '../support/tool-page.ts';

test.describe('PDF Merge', () => {
  const fileInput = (page: Page) => island(page, 'pdf-merge').locator('input[type="file"]');

  test('uploads files, reorders and removes them, then clears the queue', async ({ page }) => {
    await openTool(page, 'pdf-merge');
    const [one, two] = FILE_TOOLS['pdf-merge'].files;
    await fileInput(page).setInputFiles([one, two]);
    const rows = island(page, 'pdf-merge').getByRole('listitem');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('one-page.pdf');
    await expect(rows.nth(1)).toContainText('two-page.pdf');

    await page.getByRole('button', { name: 'Move two-page.pdf up' }).click();
    await expect(rows.nth(0)).toContainText('two-page.pdf');
    await expect(rows.nth(1)).toContainText('one-page.pdf');

    await page.getByRole('button', { name: 'Remove one-page.pdf' }).click();
    await expect(rows).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(rows).toHaveCount(0);
  });

  test('merges files and downloads the result with the default name', async ({ page }) => {
    await openTool(page, 'pdf-merge');
    const [one, two] = FILE_TOOLS['pdf-merge'].files;
    await fileInput(page).setInputFiles([one, two]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download merged PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('merged.pdf');
    await expect(primaryResult(page)).toHaveText('2');
    await expect(page.locator('[data-output="totalPageCount"] dd')).toHaveText('3');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'pdf-merge');
    const [one] = FILE_TOOLS['pdf-merge'].files;
    await fileInput(page).setInputFiles([one]);
    await page.getByLabel('Output file name').fill('  My Report<>.PDF  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download merged PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Report.pdf');
  });

  test('shows a specific error for a non-PDF file', async ({ page }) => {
    await openTool(page, 'pdf-merge');
    const notPdf = join(process.cwd(), 'tools/pdf-merge/manifest.yaml');
    await fileInput(page).setInputFiles([notPdf]);
    await page.getByRole('button', { name: 'Download merged PDF' }).click();
    await expect(page.getByText('is not a PDF file.')).toBeVisible();
  });
});

test.describe('JPG to PDF', () => {
  const fileInput = (page: Page) => island(page, 'jpg-to-pdf').locator('input[type="file"]');

  test('uploads images, reorders and removes them, then clears the queue', async ({ page }) => {
    await openTool(page, 'jpg-to-pdf');
    const [small, wide] = FILE_TOOLS['jpg-to-pdf'].files;
    await fileInput(page).setInputFiles([small, wide]);
    const rows = island(page, 'jpg-to-pdf').getByRole('listitem');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('small-square.jpg');
    await expect(rows.nth(1)).toContainText('wide.jpg');

    await page.getByRole('button', { name: 'Move wide.jpg up' }).click();
    await expect(rows.nth(0)).toContainText('wide.jpg');
    await expect(rows.nth(1)).toContainText('small-square.jpg');

    await page.getByRole('button', { name: 'Remove small-square.jpg' }).click();
    await expect(rows).toHaveCount(1);

    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(rows).toHaveCount(0);
  });

  test('converts images and downloads the result with the default name', async ({ page }) => {
    await openTool(page, 'jpg-to-pdf');
    const [small, wide] = FILE_TOOLS['jpg-to-pdf'].files;
    await fileInput(page).setInputFiles([small, wide]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('images.pdf');
    await expect(primaryResult(page)).toHaveText('2');
    await expect(page.locator('[data-output="fileName"] dd')).toHaveText('images.pdf');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'jpg-to-pdf');
    const [small] = FILE_TOOLS['jpg-to-pdf'].files;
    await fileInput(page).setInputFiles([small]);
    await page.getByLabel('Output file name').fill('  My Photos<>.PDF  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Photos.pdf');
  });

  test('shows a specific error for a non-JPG file', async ({ page }) => {
    await openTool(page, 'jpg-to-pdf');
    const notJpg = join(process.cwd(), 'tools/jpg-to-pdf/manifest.yaml');
    await fileInput(page).setInputFiles([notJpg]);
    await page.getByRole('button', { name: 'Download PDF' }).click();
    await expect(page.getByText('is not a JPG or JPEG image.')).toBeVisible();
  });
});

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
    await openTool(page, 'image-compress');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download compressed image' }).click();
    await downloadPromise;
    await expect(primaryResult(page)).toHaveText('−128.4%');
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

test.describe('Image & Media category', () => {
  test('shows exactly two tools and no future image tools', async ({ page }) => {
    await gotoReady(page, '/media');
    await expect(page.getByRole('heading', { name: 'Image & Media', exact: true })).toBeVisible();
    const allTools = page.getByRole('region', { name: 'All Image & Media tools' });
    await expect(allTools.getByRole('link', { name: 'Image Resize' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Compress' })).toBeVisible();
    await expect(allTools.getByRole('link')).toHaveCount(2);
    for (const future of [
      'Background Remover',
      'JPG to PNG',
      'PNG to JPG',
      'WebP Converter',
      'EXIF Remover',
      'Passport Photo',
      'Image Watermark',
    ]) {
      await expect(page.getByText(future, { exact: true })).toHaveCount(0);
    }
  });
});

test.describe('PDF & Documents category', () => {
  test('shows exactly two tools and no future PDF tools', async ({ page }) => {
    await gotoReady(page, '/pdf');
    await expect(page.getByRole('heading', { name: 'PDF & Documents', exact: true })).toBeVisible();
    const allTools = page.getByRole('region', { name: 'All PDF & Documents tools' });
    await expect(allTools.getByRole('link', { name: 'PDF Merge' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'JPG to PDF' })).toBeVisible();
    await expect(allTools.getByRole('link')).toHaveCount(2);
    for (const future of ['PDF Split', 'PDF Compress', 'Metadata Remover', 'PDF Watermark']) {
      await expect(page.getByText(future, { exact: true })).toHaveCount(0);
    }
  });
});
