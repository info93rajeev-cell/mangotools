import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

/**
 * The founder-approved CBM workbench (#219): quick actions, worksheet-wide units, row selection,
 * reordering, spreadsheet paste, the total row, display options and the information cards.
 */
const rows = (page: Page) => page.locator('[data-package-row]');
const field = (page: Page, index: number, key: string) =>
  rows(page).nth(index).locator(`[id$="-${key}"]`);
const total = (page: Page) => page.locator('[data-cbm-total]');
const handle = (page: Page, index: number) =>
  page.getByRole('button', { name: `Select Carton ${index + 1}`, exact: true });
const toolbar = (page: Page) =>
  page.locator('fieldset[data-placement="title"], fieldset[data-placement="inline"]');
const visual = (page: Page) => page.getByRole('region', { name: /^Shipment Visualization/ });

async function ready(page: Page) {
  await openTool(page, 'cbm-calculator');
  await expect(total(page)).toHaveText('6.000 m³');
}

async function paste(target: Locator, text: string) {
  await target.focus();
  await target.evaluate((node, data) => {
    const transfer = new DataTransfer();
    transfer.setData('text/plain', data);
    node.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }),
    );
  }, text);
}

test.describe('CBM workbench (#219 founder reference)', () => {
  test('quick actions sit beside the page title and reach units, visualization and print', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.addInitScript(() => {
      Object.defineProperty(window, 'print', {
        value: () => document.documentElement.setAttribute('data-test-printed', 'yes'),
      });
    });
    await ready(page);
    const title = await page.getByRole('heading', { level: 1 }).boundingBox();
    const tools = await toolbar(page).boundingBox();
    expect(
      Math.abs(
        (title?.y ?? 0) + (title?.height ?? 0) / 2 - ((tools?.y ?? 0) + (tools?.height ?? 0) / 2),
      ),
    ).toBeLessThan(16);
    await expect(toolbar(page).getByRole('button')).toHaveText([
      '3D visualization',
      'Unit conversion',
      'Print / Save PDF',
    ]);
    await expect(page.getByText(/Import Excel|Download Template/)).toHaveCount(0);

    await page.getByRole('button', { name: 'Units & Display Options' }).click();
    await expect(page.getByLabel('Dimension unit')).toBeHidden();
    await toolbar(page).getByRole('button', { name: 'Unit conversion' }).click();
    await expect(page.getByLabel('Dimension unit')).toBeFocused();

    await page.getByLabel('Show 3D visualization').uncheck();
    await expect(visual(page)).toHaveCount(0);
    await toolbar(page).getByRole('button', { name: '3D visualization' }).click();
    await expect(visual(page)).toBeVisible();
    await expect(page.getByLabel('Show 3D visualization')).toBeChecked();

    await toolbar(page).getByRole('button', { name: 'Print / Save PDF' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-test-printed', 'yes');
  });

  test('one dimension and weight unit convert every package without changing totals', async ({
    page,
  }) => {
    await ready(page);
    await field(page, 0, 'weightPerItem').fill('2');
    await expect(page.getByRole('region', { name: 'Results Summary' })).toContainText('200 kg');
    await page.getByLabel('Dimension unit').selectOption('m');
    await expect(field(page, 0, 'length')).toHaveValue('0.5');
    await expect(page.locator('[data-cbm-worksheet-header]')).toContainText('Length(m)');
    await expect(total(page)).toHaveText('6.000 m³');
    await page.locator('#cbm-weight-unit').selectOption('g');
    await expect(field(page, 0, 'weightPerItem')).toHaveValue('2000');
    await expect(field(page, 0, 'weightUnit')).toHaveValue('g');
    await expect(page.getByRole('region', { name: 'Results Summary' })).toContainText('200 kg');
    await page.getByRole('button', { name: 'Add carton', exact: true }).click();
    await expect(field(page, 1, 'weightUnit')).toHaveValue('g');
  });

  test('selected rows duplicate together and rows reorder by keyboard and drag', async ({
    page,
  }) => {
    await ready(page);
    await field(page, 0, 'description').fill('Alpha');
    await page.getByRole('button', { name: 'Add carton', exact: true }).click();
    await field(page, 1, 'description').fill('Beta');
    for (const key of ['length', 'width', 'height']) await field(page, 1, key).fill('100');
    await expect(total(page)).toHaveText('7.000 m³');
    const duplicate = page.getByRole('button', { name: 'Duplicate selected', exact: true });
    // Always available, as in the reference: it copies the selection, else the active row.
    await expect(duplicate).toBeEnabled();
    await handle(page, 1).click();
    await expect(handle(page, 1)).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page).nth(1)).toHaveAttribute('data-selected', 'true');
    await duplicate.click();
    await expect(rows(page)).toHaveCount(3);
    await expect(total(page)).toHaveText('8.000 m³');
    await expect(page.getByText('Rows: 3', { exact: true })).toBeVisible();

    await handle(page, 0).focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(field(page, 0, 'description')).toHaveValue('Beta');
    await expect(field(page, 1, 'description')).toHaveValue('Alpha');
    await expect(handle(page, 1)).toBeFocused();
    await expect(total(page)).toHaveText('8.000 m³');

    const from = await handle(page, 2).boundingBox();
    const to = await rows(page).nth(0).boundingBox();
    await page.mouse.move((from?.x ?? 0) + 8, (from?.y ?? 0) + 8);
    await page.mouse.down();
    await page.mouse.move((from?.x ?? 0) + 8, (to?.y ?? 0) + 4, { steps: 8 });
    await page.mouse.up();
    await expect(field(page, 0, 'description')).toHaveValue('Beta');
    await expect(field(page, 1, 'description')).toHaveValue('Beta');
    await expect(field(page, 2, 'description')).toHaveValue('Alpha');
  });

  test('a block pasted from a spreadsheet fills rows from the focused cell', async ({ page }) => {
    await ready(page);
    await expect(
      page.getByText('Tip: You can paste data from Excel directly (Ctrl+V).'),
    ).toBeVisible();
    await paste(
      field(page, 0, 'description'),
      'Description / SKU\tLength (cm)\tWidth (cm)\tHeight (cm)\tQty\tWeight\nCarton A\t60\t40\t40\t100\t12\nCarton B\t50\t30\t30\t80\t8\n',
    );
    await expect(rows(page)).toHaveCount(2);
    await expect(field(page, 0, 'description')).toHaveValue('Carton A');
    await expect(field(page, 1, 'weightPerItem')).toHaveValue('8');
    await expect(total(page)).toHaveText('13.200 m³');
    await paste(field(page, 1, 'quantity'), '10');
    await expect(rows(page)).toHaveCount(2);
  });

  test('the total row and the information cards follow the approved reference', async ({
    page,
  }) => {
    await ready(page);
    await expect(page.locator('[data-cbm-total-row]')).toHaveCount(0);
    await page.getByLabel('Show total row').check();
    await expect(page.locator('[data-cbm-total-row]')).toContainText('Total');
    await expect(page.locator('[data-cbm-total-row]')).toContainText('100');
    await expect(page.locator('[data-cbm-total-row]')).toContainText('6.000 m³');
    const notes = page.locator('details', { hasText: 'Important Notes / Warnings' });
    const steps = page.locator('details', { hasText: 'Next Steps in Logistics' });
    await expect(notes).not.toHaveAttribute('open');
    await expect(steps.locator('summary')).toContainText('(3)');
    await steps.locator('summary').click();
    await expect(steps.getByRole('link')).toHaveText([
      'Container Loading Calculator',
      'Pallet Loading Calculator',
      'Volumetric Weight Calculator',
    ]);
  });

  test('phones: cost result opens from the Estimated Total card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page);
    await page.getByLabel('Enable cost estimate').check();
    await page.getByLabel('Freight rate', { exact: true }).fill('100');
    const result = page.getByRole('region', { name: 'Cost Estimate Result' });
    await expect(result.locator('[data-cost-total]')).toHaveText('Estimated Total₹ 600');
    await expect(result.getByText('Other charges')).toBeHidden();
    await result.getByRole('button', { name: 'Show cost breakdown' }).click();
    await expect(result.getByText('Other charges')).toBeVisible();
    const icons = page.locator('fieldset[data-placement="phone"] button');
    await expect(icons).toHaveCount(4);
    for (const icon of await icons.all())
      expect((await icon.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe finds no violations in the worksheet column (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await ready(page);
      await page.getByLabel('Show total row').check();
      await handle(page, 0).click();
      await page.getByLabel('Enable cost estimate').check();
      const results = await new AxeBuilder({ page })
        .include('[data-cbm-workspace]')
        .include('.tool-header')
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
