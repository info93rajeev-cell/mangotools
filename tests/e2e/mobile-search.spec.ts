import { expect, type Page, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const openButton = (page: Page) => page.getByRole('button', { name: 'Search tools' });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Search tools' });
const dialogSearch = (page: Page) => dialog(page).getByRole('combobox', { name: 'Search tools' });

test.describe('mobile header search', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('opens from the header and finds a tool', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    await expect(page.locator('header #header-search-input')).toBeHidden();
    await openButton(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialogSearch(page)).toBeFocused();
    await dialogSearch(page).fill('json');
    await expect(dialog(page).getByRole('option', { name: /JSON Formatter/ })).toBeVisible();
    await dialogSearch(page).press('Enter');
    await expect(page).toHaveURL(/\/json-formatter$/);
  });

  test('closes with Escape, the close button and a tap outside', async ({ page }) => {
    await gotoReady(page, '/tools');
    await openButton(page).click();
    await dialogSearch(page).fill('gst');
    await expect(dialog(page).getByRole('option').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(openButton(page)).toBeFocused();

    await openButton(page).click();
    await dialog(page).getByRole('button', { name: 'Close search' }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(openButton(page)).toBeFocused();

    await openButton(page).click();
    await page.mouse.click(180, 700);
    await expect(dialog(page)).toBeHidden();
  });

  test('is not shown on the home page', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(page.locator('[data-mobile-search-open]')).toHaveCount(0);
  });
});

test('desktop keeps the inline header search and hides the mobile button', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await gotoReady(page, '/gst-calculator');
  await expect(page.locator('header #header-search-input')).toBeVisible();
  await expect(page.locator('[data-mobile-search-open]')).toBeHidden();
});
