import { expect, test } from '@playwright/test';
import { inputArea, island, openTool, outputArea } from '../support/tool-page.ts';

const ID = 'json-to-csv';

test.describe('JSON to CSV studio', () => {
  test('opens with the reference records converted and summarised', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await expect(outputArea(page, ID)).toHaveValue(/^name,city,sku,active\nAsha Rao,Delhi,00124/);
    await expect(studio.getByText('4 selected columns')).toBeVisible();
    await expect(studio.getByRole('cell', { name: '00085' })).toBeVisible();
    await expect(studio.getByText('sku values with leading zeros remain text.')).toBeVisible();
  });

  test('flattens nested objects to dot-path columns by default', async ({ page }) => {
    await openTool(page, ID);
    await inputArea(page, ID).fill('[{"id":1,"profile":{"city":"Pune"},"tags":["a"]},{"id":2}]');
    await expect(outputArea(page, ID)).toHaveValue('id,profile.city,tags\n1,Pune,"[""a""]"\n2,,\n');
    await expect(island(page, ID).getByText('Missing')).toBeVisible();
  });

  test('semicolon delimiter, no header and the formula guard', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await inputArea(page, ID).fill('[{"a":"=1+1","b":"x;y"}]');
    await studio.getByLabel('Delimiter').selectOption('semicolon');
    await studio.locator('label', { hasText: 'Include headers' }).click();
    await expect(outputArea(page, ID)).toHaveValue('=1+1;"x;y"\n');
    await studio.locator('label', { hasText: 'Formula guard' }).click();
    await expect(outputArea(page, ID)).toHaveValue('\'=1+1;"x;y"\n');
  });

  test('a record path inside an object picks the nested records', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await inputArea(page, ID).fill('{"meta":{"page":1},"data":[{"sku":"01"},{"sku":"02"}]}');
    await studio.getByLabel('Record path').selectOption('data');
    await expect(outputArea(page, ID)).toHaveValue('sku\n01\n02\n');
    await expect(studio.getByText('Record path: $.data[*]')).toBeVisible();
  });

  test('invalid JSON shows the engine error', async ({ page }) => {
    await openTool(page, ID);
    await inputArea(page, ID).fill('{not json}');
    await expect(island(page, ID).getByRole('alert')).toContainText('The input is not valid JSON.');
  });
});
