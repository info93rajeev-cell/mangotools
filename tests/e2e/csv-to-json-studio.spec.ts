import { expect, test } from '@playwright/test';
import { inputArea, island, openTool, outputArea } from '../support/tool-page.ts';

const ID = 'csv-to-json';

test.describe('CSV to JSON studio', () => {
  test('opens with the reference sample and keeps values as text by default', async ({ page }) => {
    await openTool(page, ID);
    await expect(outputArea(page, ID)).toHaveValue(/"age": "30"/);
    await expect(island(page, ID).getByText('Total Rows')).toBeVisible();
  });

  test('auto detect data types writes numbers and booleans, keeps codes as text', async ({
    page,
  }) => {
    await openTool(page, ID);
    await island(page, ID).locator('label', { hasText: 'Auto detect data types' }).click();
    await expect(outputArea(page, ID)).toHaveValue(/"age": 30,/);
    await expect(outputArea(page, ID)).toHaveValue(/"active": true/);
    await inputArea(page, ID).fill('sku,qty\n00124,5');
    await expect(outputArea(page, ID)).toHaveValue(/"sku": "00124",\s+"qty": 5/);
  });

  test('a column switched off in Column Mappings leaves the output', async ({ page }) => {
    await openTool(page, ID);
    await island(page, ID).getByLabel('Include column salary').locator('xpath=..').click();
    await expect(island(page, ID).getByLabel('Include column salary')).not.toBeChecked();
    await expect(outputArea(page, ID)).not.toHaveValue(/salary/);
    await expect(outputArea(page, ID)).toHaveValue(/"city": "New York"/);
  });

  test('minified, table preview and auto delimiter', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await studio.getByRole('button', { name: 'Minified JSON' }).click();
    await expect(outputArea(page, ID)).toHaveValue(/^\[\{"name":"John Doe"/);
    await studio.getByRole('button', { name: 'Preview Table' }).click();
    await expect(studio.getByRole('cell', { name: 'Mira Shah' })).toBeVisible();
    await studio.getByRole('button', { name: 'Formatted JSON' }).click();
    await studio.getByRole('combobox', { name: 'Delimiter' }).selectOption('auto');
    await inputArea(page, ID).fill('a;b\n1;"x;y"');
    await expect(outputArea(page, ID)).toHaveValue(/"b": "x;y"/);
  });

  test('a broken row shows the engine error in the output', async ({ page }) => {
    await openTool(page, ID);
    await inputArea(page, ID).fill('name,age\nRaj');
    await expect(island(page, ID).getByRole('alert')).toContainText('Row at line 2 has 1 columns');
  });
});
