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

test.describe('PDF Split', () => {
  const fileInput = (page: Page) => island(page, 'pdf-split').locator('input[type="file"]');
  const sample = join(process.cwd(), 'tools/pdf-split/fixtures/files/five-page.pdf');

  test('selecting a PDF shows the default start and end page', async ({ page }) => {
    await openTool(page, 'pdf-split');
    await fileInput(page).setInputFiles([sample]);
    await expect(page.getByLabel('Start page')).toHaveValue('1');
    await expect(page.getByLabel('End page')).toHaveValue('1');
  });

  test('extracts the first page and downloads it with the default name', async ({ page }) => {
    await openTool(page, 'pdf-split');
    await fileInput(page).setInputFiles([sample]);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download split PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('five-page-pages-1-1.pdf');
    await expect(primaryResult(page)).toHaveText('five-page-pages-1-1.pdf');
    await expect(page.locator('[data-output="extractedPageCount"] dd')).toHaveText('1');
    await expect(page.locator('[data-output="originalPageCount"] dd')).toHaveText('5');
  });

  test('extracts a middle page range', async ({ page }) => {
    await openTool(page, 'pdf-split');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Start page').fill('2');
    await page.getByLabel('End page').fill('4');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download split PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('five-page-pages-2-4.pdf');
    await expect(page.locator('[data-output="extractedPageCount"] dd')).toHaveText('3');
    await expect(page.locator('[data-output="startPage"] dd')).toHaveText('2');
    await expect(page.locator('[data-output="endPage"] dd')).toHaveText('4');
  });

  test('shows a specific error when the end page is before the start page', async ({ page }) => {
    await openTool(page, 'pdf-split');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Start page').fill('4');
    await page.getByLabel('End page').fill('2');
    await page.getByRole('button', { name: 'Download split PDF' }).click();
    await expect(
      page.getByText('The end page must be the same as or after the start page.'),
    ).toBeVisible();
  });

  test('shows a specific error when the page range exceeds the page count', async ({ page }) => {
    await openTool(page, 'pdf-split');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Start page').fill('3');
    await page.getByLabel('End page').fill('10');
    await page.getByRole('button', { name: 'Download split PDF' }).click();
    await expect(
      page.getByText('The selected page range extends beyond this PDF, which has 5 pages.'),
    ).toBeVisible();
  });

  test('normalizes a custom output file name on download', async ({ page }) => {
    await openTool(page, 'pdf-split');
    await fileInput(page).setInputFiles([sample]);
    await page.getByLabel('Start page').fill('2');
    await page.getByLabel('End page').fill('4');
    await page.getByLabel('Output file name').fill('  My Pages<>.PDF  ');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download split PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('My Pages.pdf');
  });

  test('shows a specific error for a non-PDF file', async ({ page }) => {
    await openTool(page, 'pdf-split');
    const notPdf = join(process.cwd(), 'tools/pdf-split/manifest.yaml');
    await fileInput(page).setInputFiles([notPdf]);
    await page.getByRole('button', { name: 'Download split PDF' }).click();
    await expect(page.getByText('is not a PDF file.')).toBeVisible();
  });
});

test.describe('PDF & Documents category', () => {
  test('shows exactly three tools and no future PDF tools', async ({ page }) => {
    await gotoReady(page, '/pdf');
    await expect(page.getByRole('heading', { name: 'PDF & Documents', exact: true })).toBeVisible();
    const allTools = page.getByRole('region', { name: 'All PDF & Documents tools' });
    await expect(allTools.getByRole('link', { name: 'PDF Merge' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'JPG to PDF' })).toBeVisible();
    await expect(allTools.getByRole('link', { name: 'PDF Split' })).toBeVisible();
    await expect(allTools.getByRole('link')).toHaveCount(3);
    for (const future of [
      'PDF Compress',
      'PDF to JPG',
      'PDF to PNG',
      'PDF Rotate',
      'Metadata Remover',
    ]) {
      await expect(page.getByText(future, { exact: true })).toHaveCount(0);
    }
  });
});
