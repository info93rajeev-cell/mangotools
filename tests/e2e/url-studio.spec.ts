import { expect, test } from '@playwright/test';
import { inputArea, island, openTool, outputArea } from '../support/tool-page.ts';

const ID = 'url-encode-decode';

test.describe('URL studio', () => {
  test('opens with the reference example encoded line by line', async ({ page }) => {
    await openTool(page, ID);
    await expect(outputArea(page, ID)).toHaveValue(/^https%3A%2F%2F.*\nHello%20World%21%20100%25/s);
    await expect(island(page, ID).getByText('Valid Encoding')).toBeVisible();
  });

  test('spaces as + and keeping existing escapes', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await inputArea(page, ID).fill('50%25 off');
    await expect(outputArea(page, ID)).toHaveValue('50%2525%20off');
    await studio.locator('label', { hasText: 'Keep existing encoding' }).click();
    await studio.locator('label', { hasText: 'Encode spaces as %20' }).click();
    await expect(outputArea(page, ID)).toHaveValue('50%25+off');
  });

  test('the Query tab builds a query string onto the base URL', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await expect(studio.getByText('1 query parameter')).toBeVisible();
    await studio.getByRole('button', { name: 'Query', exact: true }).click();
    await expect(studio.getByLabel('Key 1')).toHaveValue('q');
    await studio.getByLabel('Value 1').fill('a b&c');
    await expect(outputArea(page, ID)).toHaveValue('https://beyandtheai.com/search?q=a%20b%26c');
    await studio.getByRole('button', { name: 'Add parameter' }).click();
    await studio.getByLabel('Key 2').fill('lang');
    await studio.getByLabel('Value 2').fill('hi');
    await expect(outputArea(page, ID)).toHaveValue(/&lang=hi$/);
  });

  test('decode lists query parameters in the inspector', async ({ page }) => {
    await openTool(page, ID);
    const studio = island(page, ID);
    await studio.getByRole('button', { name: 'Decode', exact: true }).click();
    await inputArea(page, ID).fill('https://x.com/s?q=caf%C3%A9&n=1');
    await expect(outputArea(page, ID)).toHaveValue('https://x.com/s?q=café&n=1');
    await studio.getByText('URL Inspector').click();
    await expect(studio.getByRole('cell', { name: 'café' })).toBeVisible();
  });

  test('a malformed escape shows the engine error', async ({ page }) => {
    await openTool(page, ID);
    await island(page, ID).getByRole('button', { name: 'Decode', exact: true }).click();
    await inputArea(page, ID).fill('100%');
    await expect(island(page, ID).getByRole('alert')).toContainText('Malformed percent-escape');
  });
});
