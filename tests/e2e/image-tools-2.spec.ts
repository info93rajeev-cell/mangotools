import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { gotoReady, island, openTool, primaryResult } from '../support/tool-page.ts';

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

test.describe('Favicon Generator', () => {
  const fileInput = (page: Page) => island(page, 'favicon-generator').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/favicon-generator/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'favicon-generator').locator('img');

  test('selecting an image previews it and shows the default favicon size', async ({ page }) => {
    await openTool(page, 'favicon-generator');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page)).toBeVisible();
    await expect(page.getByLabel('Favicon size')).toHaveValue('32');
  });

  test('generates a 32x32 favicon and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'favicon-generator');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download favicon' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-favicon-32.png');
    await expect(primaryResult(page)).toHaveText('sample-favicon-32.png');
    await expect(page.locator('[data-output="outputSize"] dd')).toHaveText('32');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('png');
    await expect(page.locator('[data-output="originalWidth"] dd')).toHaveText('8');
    await expect(page.locator('[data-output="originalHeight"] dd')).toHaveText('8');
  });

  test('generates a 16x16 favicon when selected', async ({ page }) => {
    await openTool(page, 'favicon-generator');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Favicon size').selectOption('16');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download favicon' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-favicon-16.png');
    await expect(page.locator('[data-output="outputSize"] dd')).toHaveText('16');
  });

  test('generates a 180x180 favicon when selected', async ({ page }) => {
    await openTool(page, 'favicon-generator');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Favicon size').selectOption('180');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download favicon' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-favicon-180.png');
    await expect(page.locator('[data-output="outputSize"] dd')).toHaveText('180');
  });

  test('warns that a very small source image will look blurry when enlarged', async ({ page }) => {
    // sample.jpg is 8x8; every favicon size (16 and up) upscales it.
    await openTool(page, 'favicon-generator');
    await fileInput(page).setInputFiles([sample]);
    await page.getByRole('button', { name: 'Download favicon' }).click();
    await expect(
      page.getByText(
        'This image is smaller than the selected favicon size, so it may look blurry.',
      ),
    ).toBeVisible();
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'favicon-generator');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output file name').fill('  My Icon<>.PNG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download favicon' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Icon.png');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'favicon-generator');
    const notAnImage = join(process.cwd(), 'tools/favicon-generator/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download favicon' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });
});

test.describe('Image & Media category', () => {
  test('shows exactly seven tools and no future image tools', async ({ page }) => {
    await gotoReady(page, '/media');
    await expect(page.getByRole('heading', { name: 'Image & Media', exact: true })).toBeVisible();
    const allTools = page.getByRole('region', { name: 'All Image & Media tools' });
    await expect(allTools.getByRole('link', { name: 'Image Resize' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Compress' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Format Converter' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Metadata Remover' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Watermark' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Image Crop' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Favicon Generator' })).toBeVisible();
    await expect(allTools.getByRole('link')).toHaveCount(7);
    for (const future of ['Background Remover', 'Passport Photo']) {
      await expect(page.getByText(future, { exact: true })).toHaveCount(0);
    }
  });
});
