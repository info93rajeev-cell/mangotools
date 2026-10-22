import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

test.describe('Image Watermark', () => {
  const fileInput = (page: Page) => island(page, 'image-watermark').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/image-watermark/fixtures/files/sample.jpg');
  const preview = (page: Page) => island(page, 'image-watermark').locator('img');

  test('selecting an image previews it and exposes controls', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await expect(preview(page).first()).toBeVisible();
    await expect(page.getByLabel('Watermark text')).toBeVisible();
    await expect(page.getByLabel('Position')).toBeVisible();
    await expect(page.getByLabel('Opacity')).toBeVisible();
    await expect(page.getByLabel('Font size')).toBeVisible();
    await expect(page.getByLabel('Text color')).toBeVisible();
  });

  test('watermarks the image and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-watermarked.jpg');
    await expect(primaryResult(page)).toHaveText('sample-watermarked.jpg');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('jpg');
  });

  test('updates watermark text and position and applies watermark', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Watermark text').fill('CONFIDENTIAL');
    await page.getByLabel('Position').selectOption('center');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-watermarked.jpg');
    await expect(page.locator('[data-output="watermarkText"] dd')).toHaveText('CONFIDENTIAL');
    await expect(page.locator('[data-output="position"] dd')).toHaveText('center');
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output file name').fill('  My Brand<>.JPG  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Brand.jpg');
  });

  test('watermarks the image to PDF and downloads .pdf', async ({ page }) => {
    await openTool(page, 'image-watermark');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Output format').selectOption('pdf');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('sample-watermarked.pdf');
    await expect(page.locator('[data-output="outputFormat"] dd')).toHaveText('pdf');
  });

  test('shows a specific error for a file that is not a JPG, PNG or WebP', async ({ page }) => {
    await openTool(page, 'image-watermark');
    const notAnImage = join(process.cwd(), 'tools/image-watermark/manifest.yaml');
    await fileInput(page).setInputFiles([notAnImage]);
    await page.getByRole('button', { name: 'Download watermarked image' }).click();
    await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
  });

  test('fits strictly within 900px desktop viewport without page scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await openTool(page, 'image-watermark');
    await page.waitForTimeout(500);
    const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    const innerH = await page.evaluate(() => window.innerHeight);
    expect(scrollH).toBeLessThanOrEqual(innerH);
    await page.screenshot({
      path: 'C:/Users/user/.gemini/antigravity/brain/69dd2223-e082-499a-9544-d181fd76ffa1/watermark_desktop_900.png',
    });
  });

  test('renders responsive mobile layout at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openTool(page, 'image-watermark');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-image-watermark-layout]')).toBeVisible();
    await page.screenshot({
      path: 'C:/Users/user/.gemini/antigravity/brain/69dd2223-e082-499a-9544-d181fd76ffa1/watermark_mobile_390.png',
    });
  });
});
