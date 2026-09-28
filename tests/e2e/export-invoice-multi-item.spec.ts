import { expect, type Locator, type Page, test } from '@playwright/test';
import { openTool, primaryResult } from '../support/tool-page.ts';

function row(page: Page, index: number): Locator {
  return page.locator(`[data-item-row="${index}"]`);
}

async function fillCommonFields(page: Page) {
  await page.getByLabel('Exporter — Business name').fill('Sunrise Handicrafts Exports');
  await page.getByLabel('Exporter — Address').fill('12 MG Road, Jaipur, Rajasthan 302001, India');
  await page.getByLabel('Exporter — IEC').fill('AAAAA1234A');
  await page.getByLabel('Exporter — Phone/email').fill('+91 98765 43210');
  await page.getByLabel('Buyer — Name').fill('Global Home Decor LLC');
  await page.getByLabel('Buyer — Address').fill('500 Market Street, San Francisco, CA 94105, USA');
  await page.getByLabel('Buyer — Destination country').fill('United States');
  await page.getByLabel('Invoice — Number').fill('SHE/EXP/2026/030');
  await page.getByLabel('Invoice — Date').fill('2026-09-27');
}

async function fillRow(page: Page, index: number, values: Record<string, string>) {
  const target = row(page, index);
  if (values.description) await target.getByLabel('Item — Description').fill(values.description);
  if (values.hsn) await target.getByLabel('Item — HSN code').fill(values.hsn);
  if (values.quantity) await target.getByLabel('Item — Quantity').fill(values.quantity);
  if (values.unit) await target.getByLabel('Item — Unit', { exact: true }).fill(values.unit);
  if (values.unitPrice) await target.getByLabel('Item — Unit price').fill(values.unitPrice);
}

test.describe('Export Commercial Invoice Generator — multi-item rows', () => {
  test('opens with exactly one item row and no remove action', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await expect(page.locator('[data-item-row]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Remove item/ })).toHaveCount(0);
  });

  test('adding a second item shows two rows and both accept data', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(2);
    await fillRow(page, 0, { description: 'Cushion covers' });
    await fillRow(page, 1, { description: 'Table runners' });
    await expect(row(page, 0).getByLabel('Item — Description')).toHaveValue('Cushion covers');
    await expect(row(page, 1).getByLabel('Item — Description')).toHaveValue('Table runners');
  });

  test('computes correct per-row line amounts, subtotal and total for two items', async ({
    page,
  }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillCommonFields(page);
    await fillRow(page, 0, {
      description: 'Cushion covers',
      hsn: '630490',
      quantity: '500',
      unit: 'PCS',
      unitPrice: '3.50',
    });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, {
      description: 'Table runners',
      hsn: '630790',
      quantity: '200',
      unit: 'PCS',
      unitPrice: '2.00',
    });
    const table = page.locator('[data-tool-island]').getByRole('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('1,750.00');
    await expect(rows.nth(1)).toContainText('400.00');
    await expect(page.locator('[data-output="invoiceSubtotal"]')).toContainText('2,150.00');
    await expect(page.locator('[data-primary-result] output')).toContainText('2,150.00');
  });

  test('a row-specific validation error names the affected item', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillCommonFields(page);
    await fillRow(page, 0, {
      description: 'Cushion covers',
      hsn: '630490',
      quantity: '500',
      unit: 'PCS',
      unitPrice: '3.50',
    });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, {
      description: 'Table runners',
      hsn: '630790',
      quantity: '0',
      unit: 'PCS',
      unitPrice: '2.00',
    });
    await expect(page.getByText('Item 2 —')).toBeVisible();
    await expect(row(page, 1).getByLabel('Item — Quantity')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(row(page, 0).getByLabel('Item — Quantity')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('a removed item disappears after confirming, and the last remaining item cannot be removed', async ({
    page,
  }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, { description: 'Table runners' });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Remove item 2' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Remove item/ })).toHaveCount(0);
  });

  test('the item cap is enforced and communicated once reached', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    for (let i = 1; i < 5; i++) await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Add item' })).toHaveCount(0);
    await expect(page.getByText('This invoice supports at most 5 items.')).toBeVisible();
  });

  test('remains usable at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openTool(page, 'export-commercial-invoice-generator');
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(2);
    await fillRow(page, 1, { description: 'Table runners' });
    await expect(row(page, 1).getByLabel('Item — Description')).toHaveValue('Table runners');
    await expect(page.getByRole('button', { name: 'Remove item 2' })).toBeVisible();
  });

  test('a multi-item invoice does not misleadingly transfer only the first item to the Packing List', async ({
    page,
  }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillCommonFields(page);
    await fillRow(page, 0, {
      description: 'Cushion covers',
      hsn: '630490',
      quantity: '500',
      unit: 'SET',
      unitPrice: '3.50',
    });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, {
      description: 'Table runners',
      hsn: '630790',
      quantity: '200',
      unit: 'PCS',
      unitPrice: '2.00',
    });
    await Promise.all([
      page.waitForURL(/\/export-packing-list-generator/),
      page.getByRole('button', { name: 'Create Packing List' }).click(),
    ]);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    // Exporter/buyer/document fields still transfer — only item-specific fields are withheld.
    await expect(page.getByLabel('Exporter — Business name')).toHaveValue(
      'Sunrise Handicrafts Exports',
    );
    await expect(page.getByLabel('Buyer — Name')).toHaveValue('Global Home Decor LLC');
    // Neither item's identity fields are prefilled — never just "the first one (SET), silently".
    // The Packing List's own default (PCS) proves this, since item 1's real unit was SET.
    await expect(page.getByLabel('Item — Description')).toHaveValue('');
    await expect(page.getByLabel('Item — SKU / style code (optional)')).toHaveValue('');
    await expect(page.getByLabel('Item — Unit', { exact: true })).toHaveValue('PCS');
    await expect(page.getByLabel('Item — Country of origin (optional)')).toHaveValue('');
  });
});

// Moved from tools.spec.ts (TASK-009G) to keep that shared file under its 600-line limit — these
// predate the multi-item rows and only ever exercise a single, default item row.
test.describe('Export Commercial Invoice Generator', () => {
  const fillRequired = async (page: Page) => {
    await fillCommonFields(page);
    await fillRow(page, 0, {
      description: 'Hand-block printed cotton cushion covers',
      hsn: '630490',
      quantity: '500',
      unitPrice: '3.50',
    });
  };

  test('calculates the item line total and invoice total (500 x 3.50 = 1,750.00)', async ({
    page,
  }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await expect(page.getByLabel('Invoice — Currency')).toHaveValue('USD');
    await expect(page.getByLabel('Item — Unit', { exact: true })).toHaveValue('PCS');
    await fillRequired(page);
    await expect(primaryResult(page)).toHaveText('1,750.00');
    const itemTable = page.locator('[data-tool-island]').getByRole('table').locator('tbody tr');
    await expect(itemTable).toHaveCount(1);
    await expect(itemTable.first()).toContainText('1,750.00');
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: /Product Master|Buyer Master|Shipment Record|Postal Export|Courier Export/i,
      }),
    ).toHaveCount(0);
  });

  test('explains an invalid quantity next to the field', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillRequired(page);
    await row(page, 0).getByLabel('Item — Quantity').fill('0');
    await expect(page.getByText('This must be greater than zero.')).toBeVisible();
    await expect(row(page, 0).getByLabel('Item — Quantity')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('explains an invalid invoice date next to the field', async ({ page }) => {
    await openTool(page, 'export-commercial-invoice-generator');
    await fillRequired(page);
    await page.getByLabel('Invoice — Date').fill('27-09-2026');
    await expect(
      page.getByText('Enter a date in YYYY-MM-DD format, such as 2026-09-27.'),
    ).toBeVisible();
    await expect(page.getByLabel('Invoice — Date')).toHaveAttribute('aria-invalid', 'true');
  });
});
