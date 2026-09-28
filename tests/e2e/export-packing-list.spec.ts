import { expect, type Page, test } from '@playwright/test';
import { openTool, primaryResult } from '../support/tool-page.ts';

test.describe('Export Packing List Generator', () => {
  const fillRequired = async (page: Page) => {
    await page.getByLabel('Exporter — Business name').fill('Sunrise Handicrafts Exports');
    await page.getByLabel('Exporter — Address').fill('12 MG Road, Jaipur, Rajasthan 302001, India');
    await page.getByLabel('Exporter — IEC').fill('AAAAA1234A');
    await page.getByLabel('Buyer — Name').fill('Global Home Decor LLC');
    await page
      .getByLabel('Buyer — Address')
      .fill('500 Market Street, San Francisco, CA 94105, USA');
    await page.getByLabel('Buyer — Destination country').fill('United States');
    await page.getByLabel('Document — Packing list number').fill('SHE/PL/2026/014');
    await page.getByLabel('Document — Packing list date').fill('2026-09-28');
    await page.getByLabel('Item — Description').fill('Hand-block printed cotton cushion covers');
    await page.getByLabel('Item — Quantity').fill('500');
    await page.getByLabel('Packing — Number of packages/cartons').fill('10');
    await page.getByLabel('Packing — Net weight').fill('125');
    await page.getByLabel('Packing — Gross weight').fill('135');
  };

  test('shows the package count, net and gross weight, and the disclaimer', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await expect(page.getByLabel('Item — Unit', { exact: true })).toHaveValue('PCS');
    await fillRequired(page);
    await expect(primaryResult(page)).toHaveText('10');
    await expect(page.locator('[data-output="netWeight"] dd')).toHaveText('125');
    await expect(page.locator('[data-output="grossWeight"] dd')).toHaveText('135');
    await expect(page.locator('[data-disclaimer]')).toBeVisible();
  });

  test('explains a gross weight lower than the net weight', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await fillRequired(page);
    await page.getByLabel('Packing — Net weight').fill('150');
    await expect(page.getByText('Gross weight cannot be less than net weight.')).toBeVisible();
    await expect(page.getByLabel('Packing — Gross weight')).toHaveAttribute('aria-invalid', 'true');
  });

  test('explains a fractional package count next to the field', async ({ page }) => {
    await openTool(page, 'export-packing-list-generator');
    await fillRequired(page);
    await page.getByLabel('Packing — Number of packages/cartons').fill('2.5');
    await expect(page.getByText('This must be a whole number.')).toBeVisible();
    await expect(page.getByLabel('Packing — Number of packages/cartons')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  test('links to the shipped Commercial Invoice Generator but no unbuilt export/import tools', async ({
    page,
  }) => {
    await openTool(page, 'export-packing-list-generator');
    await expect(
      page.getByRole('link', { name: 'Export Commercial Invoice Generator' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: /Product Master|Buyer Master|Shipment Record|Postal Export|Courier Export/i,
      }),
    ).toHaveCount(0);
  });
});
