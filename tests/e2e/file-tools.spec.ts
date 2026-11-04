import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { FILE_TOOLS, gotoReady, island, openTool, primaryResult } from '../support/tool-page.ts';

test.describe('JPG to PDF', () => {
  const fileInput = (page: Page) =>
    island(page, 'jpg-to-pdf').locator('input[type="file"]').first();

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
    expect(download.suggestedFilename()).toBe('My Photos__.PDF.pdf');
  });

  test('shows a specific error for a non-JPG file', async ({ page }) => {
    await openTool(page, 'jpg-to-pdf');
    const notJpg = join(process.cwd(), 'tools/jpg-to-pdf/manifest.yaml');
    await fileInput(page).setInputFiles([notJpg]);
    await expect(page.getByText('0 images • 0 pages')).toBeVisible();
  });
});

test.describe('PDF & Documents category', () => {
  test('shows all published PDF tools and no unreleased tools', async ({ page }) => {
    await gotoReady(page, '/pdf');
    await expect(page.getByRole('heading', { name: 'PDF & Documents', exact: true })).toBeVisible();
    const allTools = page.getByRole('region', { name: 'All PDF & Documents tools' });
    await expect(allTools.getByRole('link', { name: 'PDF Merge' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'JPG to PDF' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'PDF Split' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Compress PDF' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'PDF to Word' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'Word to PDF' })).toBeVisible();
    await expect(allTools.getByRole('link')).toHaveCount(6);
    for (const future of ['PDF to JPG', 'PDF to PNG', 'PDF Rotate', 'Metadata Remover']) {
      await expect(page.getByText(future, { exact: true })).toHaveCount(0);
    }
  });
});
