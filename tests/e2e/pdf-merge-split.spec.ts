import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const fixture = (p: string) => join(process.cwd(), p);
// pdf-lib is a dependency of packages/ui; load it from there to inspect downloaded files.
const pdfLib = createRequire(join(process.cwd(), 'packages/ui/package.json'))('pdf-lib') as {
  PDFDocument: {
    load(b: Uint8Array): Promise<{ getPageCount(): number; catalog: { get(n: unknown): unknown } }>;
  };
  PDFName: { of(s: string): unknown };
};
const load = (path: string) => pdfLib.PDFDocument.load(new Uint8Array(readFileSync(path)));

test.describe('PDF Merge', () => {
  test('merges real files and adds one bookmark per file', async ({ page }) => {
    await gotoReady(page, '/pdf-merge');
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles([
        fixture('tools/pdf-merge/fixtures/files/one-page.pdf'),
        fixture('tools/pdf-merge/fixtures/files/two-page.pdf'),
      ]);
    await expect(page.getByText('two-page.pdf', { exact: true })).toBeVisible();
    const first = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Merged PDF/ }).click();
    const merged = await load(await (await first).path());
    expect(merged.getPageCount()).toBe(3);
    expect(merged.catalog.get(pdfLib.PDFName.of('Outlines'))).toBeDefined();
  });

  test('the sample has every page it lists', async ({ page }) => {
    await gotoReady(page, '/pdf-merge');
    await page
      .getByRole('button', { name: /Load 4 Sample Files|Load Sample/ })
      .first()
      .click();
    await expect(page.getByText('Contract.pdf', { exact: true })).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Merged PDF/ }).click();
    expect((await load(await (await download).path())).getPageCount()).toBe(124);
  });
});

test.describe('PDF Split', () => {
  test('extracts exactly the typed pages', async ({ page }) => {
    await gotoReady(page, '/pdf-split');
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(fixture('tools/pdf-split/fixtures/files/five-page.pdf'));
    await expect(page.getByText('five-page.pdf', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Extract pages/ }).click();
    await page.getByLabel('Specific pages to extract').fill('5, 2');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download PDF/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('five-page-extracted.pdf');
    expect((await load(await file.path())).getPageCount()).toBe(2);
  });

  test('flags ranges outside the file and splits the valid ones', async ({ page }) => {
    await gotoReady(page, '/pdf-split');
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles(fixture('tools/pdf-split/fixtures/files/five-page.pdf'));
    const ranges = page.getByLabel(/Page ranges, one output file each/);
    await expect(ranges).toHaveValue('1-3, 4-5');
    await ranges.fill('1-2, 3-9');
    await expect(page.getByText(/Not used: 3-9/)).toBeVisible();
    await expect(page.getByText('1 file • 2 pages')).toBeVisible();
  });
});
