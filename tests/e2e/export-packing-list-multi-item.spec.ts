import { expect, type Locator, type Page, test } from '@playwright/test';
import { openTool, primaryResult } from '../support/tool-page.ts';

function row(page: Page, index: number): Locator {
  return page.locator(`[data-item-row="${index}"]`);
}

async function fillCommonFields(page: Page) {
  await page.getByLabel('Exporter — Business name').fill('Sunrise Handicrafts Exports');
  await page.getByLabel('Exporter — Address').fill('12 MG Road, Jaipur, Rajasthan 302001, India');
  await page.getByLabel('Exporter — IEC').fill('AAAAA1234A');
  await page.getByLabel('Buyer — Name').fill('Global Home Decor LLC');
  await page.getByLabel('Buyer — Address').fill('500 Market Street, San Francisco, CA 94105, USA');
  await page.getByLabel('Buyer — Destination country').fill('United States');
  await page.getByLabel('Document — Packing list number').fill('SHE/PL/2026/030');
  await page.getByLabel('Document — Packing list date').fill('2026-09-28');
}

async function fillShipment(page: Page) {
  await page.getByLabel('Packing — Number of packages/cartons').fill('12');
  await page.getByLabel('Packing — Net weight').fill('140');
  await page.getByLabel('Packing — Gross weight').fill('150');
}

async function fillRow(page: Page, index: number, values: Record<string, string>) {
  const target = row(page, index);
  if (values.description) await target.getByLabel('Item — Description').fill(values.description);
  if (values.quantity) await target.getByLabel('Item — Quantity').fill(values.quantity);
  if (values.unit) await target.getByLabel('Item — Unit', { exact: true }).fill(values.unit);
}

test.describe('Export Packing List Generator — multi-item rows', () => {
  test('opens with exactly one item row and no remove action', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await expect(page.locator('[data-item-row]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Remove item/ })).toHaveCount(0);
  });

  test('adding a second item shows two rows and both accept independent data', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(2);
    await fillRow(page, 0, { description: 'Cushion covers' });
    await fillRow(page, 1, { description: 'Table runners' });
    await expect(row(page, 0).getByLabel('Item — Description')).toHaveValue('Cushion covers');
    await expect(row(page, 1).getByLabel('Item — Description')).toHaveValue('Table runners');
  });

  test('a removed item disappears after confirming, and the last remaining item cannot be removed', async ({
    page,
  }) => {
    await openTool(page, 'export-packing-list-generator');
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, { description: 'Table runners' });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Remove item 2' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /Remove item/ })).toHaveCount(0);
  });

  test('the item cap is enforced and communicated once reached', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    for (let i = 1; i < 5; i++) await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Add item' })).toHaveCount(0);
    await expect(page.getByText('This packing list supports at most 5 items.')).toBeVisible();
  });

  test('a row-specific validation error names the affected item', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await fillCommonFields(page);
    await fillShipment(page);
    await fillRow(page, 0, { description: 'Cushion covers', quantity: '500', unit: 'PCS' });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, { description: 'Table runners', quantity: '0', unit: 'PCS' });
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

  test('optional row fields (SKU, HSN, origin) work and render blank when omitted', async ({
    page,
  }) => {
    await openTool(page, 'export-packing-list-generator');
    await fillCommonFields(page);
    await fillShipment(page);
    await fillRow(page, 0, { description: 'Cushion covers', quantity: '500', unit: 'PCS' });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, { description: 'Table runners', quantity: '200', unit: 'PCS' });
    await row(page, 1).getByLabel('Item — SKU / style code (optional)').fill('TR-1');
    await row(page, 1).getByLabel('Item — HSN code (optional)').fill('630790');
    await row(page, 1).getByLabel('Item — Country of origin (optional)').fill('India');
    const table = page.locator('[data-tool-island]').getByRole('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Cushion covers');
    await expect(rows.nth(1)).toContainText('Table runners');
    await expect(rows.nth(1)).toContainText('TR-1');
    await expect(rows.nth(1)).toContainText('630790');
    await expect(rows.nth(1)).toContainText('India');
  });

  test('never shows an invented total quantity, and keeps shipment-level fields as one set', async ({
    page,
  }) => {
    await openTool(page, 'export-packing-list-generator');
    await fillCommonFields(page);
    await fillShipment(page);
    await fillRow(page, 0, { description: 'Cushion covers', quantity: '500', unit: 'PCS' });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, { description: 'Table runners', quantity: '200', unit: 'KG' });
    // No "700" or "total quantity" anywhere — mixed units (PCS + KG) must never be summed.
    await expect(page.getByText(/total quantity/i)).toHaveCount(0);
    await expect(page.getByText('700', { exact: true })).toHaveCount(0);
    // Package count and net/gross weight remain exactly one set of shipment-level fields.
    await expect(page.getByLabel('Packing — Number of packages/cartons')).toHaveCount(1);
    await expect(page.getByLabel('Packing — Net weight')).toHaveCount(1);
    await expect(page.getByLabel('Packing — Gross weight')).toHaveCount(1);
    await expect(primaryResult(page)).toHaveText('12');
    await expect(page.locator('[data-output="netWeight"] dd')).toHaveText('140');
    await expect(page.locator('[data-output="grossWeight"] dd')).toHaveText('150');
  });

  test('gross-below-net validation still works with multiple items', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await fillCommonFields(page);
    await fillRow(page, 0, { description: 'Cushion covers', quantity: '500', unit: 'PCS' });
    await page.getByRole('button', { name: 'Add item' }).click();
    await fillRow(page, 1, { description: 'Table runners', quantity: '200', unit: 'PCS' });
    await page.getByLabel('Packing — Number of packages/cartons').fill('12');
    await page.getByLabel('Packing — Net weight').fill('150');
    await page.getByLabel('Packing — Gross weight').fill('100');
    await expect(page.getByText('Gross weight cannot be less than net weight.')).toBeVisible();
  });

  test('remains usable at a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openTool(page, 'export-packing-list-generator');
    await page.getByRole('button', { name: 'Add item' }).click();
    await expect(page.locator('[data-item-row]')).toHaveCount(2);
    await fillRow(page, 1, { description: 'Table runners' });
    await expect(row(page, 1).getByLabel('Item — Description')).toHaveValue('Table runners');
    await expect(page.getByRole('button', { name: 'Remove item 2' })).toBeVisible();
  });
});
