import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const fixture = (p: string) => join(process.cwd(), p);

test.describe('PDF to Word', () => {
  test('converts the text of a real PDF into a DOCX', async ({ page }) => {
    await gotoReady(page, '/pdf-to-word');
    await page
      .locator('input[type="file"][accept="application/pdf"]')
      .first()
      .setInputFiles(fixture('tools/pdf-to-word/fixtures/files/chromium-report.pdf'));
    await expect(page.getByText('Quarterly Report')).toBeVisible();
    await expect(page.getByText('Revenue grew 12% to ₹4,50,000 in the quarter.')).toBeVisible();
    await page.getByRole('button', { name: /Convert to Word/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /^\s*Converted\s*$/ })).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download DOCX/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('chromium-report.docx');
    const bytes = readFileSync(await file.path());
    expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK');
    expect(bytes.toString('latin1')).toContain('Quarterly Report');
  });

  test('says when a PDF has no text instead of inventing content', async ({ page }) => {
    await gotoReady(page, '/pdf-to-word');
    await page
      .locator('input[type="file"][accept="application/pdf"]')
      .first()
      .setInputFiles(fixture('tools/pdf-split/fixtures/files/five-page.pdf'));
    await expect(page.getByText('No text found', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Convert to Word/ })).toBeDisabled();
  });
});

test.describe('Word to PDF', () => {
  test('lays out a real .docx and downloads a PDF', async ({ page }) => {
    await gotoReady(page, '/word-to-pdf');
    await page
      .locator('input[type="file"][accept^=".docx"]')
      .first()
      .setInputFiles(fixture('tools/word-to-pdf/fixtures/files/order-summary.docx'));
    await expect(page.getByText('order-summary.docx')).toBeVisible();
    await expect(page.getByText(/1 image is not included/)).toBeVisible();
    await page.getByRole('button', { name: /Create PDF/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /^\s*PDF created\s*$/ })).toBeVisible();
    await expect(page.getByText(/1 character outside Western European text/)).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download PDF/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('order-summary.pdf');
    expect(
      readFileSync(await file.path())
        .subarray(0, 5)
        .toString('latin1'),
    ).toBe('%PDF-');
  });

  test('the sample loads two real generated documents', async ({ page }) => {
    await gotoReady(page, '/word-to-pdf');
    await page.getByRole('button', { name: 'Load Sample' }).click();
    await expect(page.getByText('Project-Proposal-Sample.docx')).toBeVisible();
    await expect(page.getByText('Meeting-Notes-Sample.docx')).toBeVisible();
  });
});
