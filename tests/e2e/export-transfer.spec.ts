import { expect, type Page, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
}

const NOTICE =
  'Some details were copied from your invoice. Review them and enter the actual packed quantity, packages and weights.';

async function fillInvoice(page: Page) {
  await page.getByLabel('Exporter — Business name').fill('Sunrise Handicrafts Exports');
  await page.getByLabel('Exporter — Address').fill('12 MG Road, Jaipur, Rajasthan 302001, India');
  await page.getByLabel('Exporter — GSTIN').fill('27ABCDE1234F1Z5');
  await page.getByLabel('Exporter — IEC').fill('AAAAA1234A');
  await page.getByLabel('Exporter — Phone/email').fill('+91 98765 43210');
  await page.getByLabel('Buyer — Name').fill('Global Home Decor LLC');
  await page.getByLabel('Buyer — Address').fill('500 Market Street, San Francisco, CA 94105, USA');
  await page
    .getByLabel('Consignee — Name (optional, if different from buyer)')
    .fill('West Coast Distribution Inc');
  await page
    .getByLabel('Consignee — Address (optional)')
    .fill('9 Dock Road, Oakland, CA 94607, USA');
  await page.getByLabel('Buyer — Destination country').fill('United States');
  await page.getByLabel('Invoice — Number').fill('SHE/EXP/2026/014');
  await page.getByLabel('Invoice — Date').fill('2026-09-27');
  await page.getByLabel('Invoice — Order/reference number (optional)').fill('PO-2026-0098');
  await page.getByLabel('Shipping — Mode (optional)').fill('Air Cargo');
  await page.getByLabel('Shipping — Tracking number (optional)').fill('AWB-123456789');
  await page.getByLabel('Item — Description').fill('Hand-block printed cotton cushion covers');
  await page.getByLabel('Item — SKU (optional)').fill('CC-BLK-001');
  await page.getByLabel('Item — HSN code').fill('630490');
  await page.getByLabel('Item — Quantity').fill('500');
  await page.getByLabel('Item — Unit price').fill('3.50');
  await page.getByLabel('Item — Country of origin (optional)').fill('India');
  await page.getByLabel('Exporter — Authorized signatory (optional)').fill('Raj Mehta');
  await page.getByLabel('Shipping — Package count (optional)').fill('10');
  await page.getByLabel('Shipping — Net weight (optional)').fill('125');
  await page.getByLabel('Shipping — Gross weight (optional)').fill('135');
}

test.describe('Invoice to Packing List transfer', () => {
  test('Create Packing List is disabled until the invoice has a result', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    const button = page.getByRole('button', { name: 'Create Packing List' });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await fillInvoice(page);
    await expect(button).toBeEnabled();
  });

  test('transfers only the approved fields, and strips the hash and any storage', async ({
    page,
  }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillInvoice(page);
    await Promise.all([
      page.waitForURL(/\/export-packing-list-generator/),
      page.getByRole('button', { name: 'Create Packing List' }).click(),
    ]);
    await waitForHydration(page);

    // The hash is consumed and stripped immediately, so it never lingers in the visible URL.
    expect(new URL(page.url()).hash).toBe('');

    await expect(page.getByText(NOTICE)).toBeVisible();

    // Approved fields transferred verbatim.
    await expect(page.getByLabel('Exporter — Business name')).toHaveValue(
      'Sunrise Handicrafts Exports',
    );
    await expect(page.getByLabel('Exporter — Address')).toHaveValue(
      '12 MG Road, Jaipur, Rajasthan 302001, India',
    );
    await expect(page.getByLabel('Exporter — GSTIN (optional)')).toHaveValue('27ABCDE1234F1Z5');
    await expect(page.getByLabel('Exporter — IEC')).toHaveValue('AAAAA1234A');
    await expect(page.getByLabel('Buyer — Name')).toHaveValue('Global Home Decor LLC');
    await expect(page.getByLabel('Buyer — Address')).toHaveValue(
      '500 Market Street, San Francisco, CA 94105, USA',
    );
    await expect(
      page.getByLabel('Consignee — Name (optional, if different from buyer)'),
    ).toHaveValue('West Coast Distribution Inc');
    await expect(page.getByLabel('Consignee — Address (optional)')).toHaveValue(
      '9 Dock Road, Oakland, CA 94607, USA',
    );
    await expect(page.getByLabel('Buyer — Destination country')).toHaveValue('United States');
    await expect(page.getByLabel('Document — Commercial invoice number (optional)')).toHaveValue(
      'SHE/EXP/2026/014',
    );
    await expect(page.getByLabel('Document — Commercial invoice date (optional)')).toHaveValue(
      '2026-09-27',
    );
    await expect(page.getByLabel('Document — Order/reference number (optional)')).toHaveValue(
      'PO-2026-0098',
    );
    await expect(page.getByLabel('Document — Shipping mode (optional)')).toHaveValue('Air Cargo');
    await expect(page.getByLabel('Document — AWB / BL / tracking number (optional)')).toHaveValue(
      'AWB-123456789',
    );
    await expect(page.getByLabel('Item — Description')).toHaveValue(
      'Hand-block printed cotton cushion covers',
    );
    await expect(page.getByLabel('Item — SKU / style code (optional)')).toHaveValue('CC-BLK-001');
    await expect(page.getByLabel('Item — Unit', { exact: true })).toHaveValue('PCS');
    await expect(page.getByLabel('Item — Country of origin (optional)')).toHaveValue('India');
    await expect(page.getByLabel('Declaration — Authorized signatory (optional)')).toHaveValue(
      'Raj Mehta',
    );

    // Deliberately excluded: risky/packing-specific fields stay blank or at their own default.
    await expect(page.getByLabel('Item — HSN code (optional)')).toHaveValue('');
    await expect(page.getByLabel('Item — Quantity')).toHaveValue('');
    await expect(page.getByLabel('Packing — Number of packages/cartons')).toHaveValue('');
    await expect(page.getByLabel('Packing — Net weight')).toHaveValue('');
    await expect(page.getByLabel('Packing — Gross weight')).toHaveValue('');
    await expect(page.getByLabel('Document — Packing list number')).toHaveValue('');
    await expect(page.getByLabel('Document — Packing list date')).toHaveValue('');

    // The platform's own pre-existing "recent tools"/theme preferences (tool IDs and a theme name
    // only, never document content) may already be in localStorage from opening these two tools —
    // that is unrelated to this feature. What the transfer itself must never do is write any of the
    // business data into persistent storage: sessionStorage stays untouched entirely, and none of the
    // transferred values appear anywhere in localStorage.
    const storage = await page.evaluate(() => ({
      sessionLength: window.sessionStorage.length,
      localValues: Object.keys(window.localStorage).map((key) => window.localStorage.getItem(key)),
    }));
    expect(storage.sessionLength).toBe(0);
    for (const value of storage.localValues) {
      expect(value).not.toContain('Sunrise Handicrafts Exports');
      expect(value).not.toContain('Global Home Decor LLC');
      expect(value).not.toContain('SHE/EXP/2026/014');
    }
  });

  test('a reload after the transfer does not restore the copied data', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillInvoice(page);
    await Promise.all([
      page.waitForURL(/\/export-packing-list-generator/),
      page.getByRole('button', { name: 'Create Packing List' }).click(),
    ]);
    await waitForHydration(page);
    await expect(page.getByLabel('Exporter — Business name')).toHaveValue(
      'Sunrise Handicrafts Exports',
    );

    await page.reload();
    await waitForHydration(page);

    await expect(page.getByText(NOTICE)).toHaveCount(0);
    await expect(page.getByLabel('Exporter — Business name')).toHaveValue('');
    await expect(
      page.getByLabel('Consignee — Name (optional, if different from buyer)'),
    ).toHaveValue('');
  });

  test('direct navigation shows no transfer notice and only the packing list tool defaults', async ({
    page,
  }) => {
    await openTool(page, 'export-packing-list-generator');
    await expect(page.getByText(NOTICE)).toHaveCount(0);
    await expect(page.getByLabel('Item — Unit', { exact: true })).toHaveValue('PCS');
    await expect(page.getByLabel('Exporter — Business name')).toHaveValue('');
  });
});
