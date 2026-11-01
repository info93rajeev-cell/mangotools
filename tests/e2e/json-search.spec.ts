import { expect, test } from '@playwright/test';

test.describe('JSON Formatter search', () => {
  test('finds keys inside collapsed arrays, steps through hits and reports bad regex', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto('/json-formatter');
    const box = page.getByLabel('Search keys or values');
    const count = page.locator('[class*="matchCountBadge"]');

    await box.fill('title');
    await expect(count).toHaveText('1 of 2');
    await expect(page.locator('[data-search-hit]')).toHaveCount(2);
    await expect(page.locator('[data-search-active]')).toHaveText('title');

    await box.press('Enter');
    await expect(count).toHaveText('2 of 2');
    await page.getByRole('button', { name: 'Previous match' }).click();
    await expect(count).toHaveText('1 of 2');

    await page.getByLabel('Use regex').check();
    await box.fill('(');
    await expect(count).toHaveText('Invalid regular expression');
    await expect(page.getByRole('button', { name: 'Next match' })).toBeDisabled();
  });
});
