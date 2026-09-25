import { expect, type Page, test } from '@playwright/test';
import { gotoReady, outputArea, primaryResult } from '../support/tool-page.ts';

/** Presses Tab until the element matching `selector` has focus (keyboard only, no clicks). */
async function tabTo(page: Page, selector: string, limit = 60): Promise<void> {
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error(`Could not reach ${selector} with Tab`);
}

test.describe('keyboard-only completion', () => {
  test('GST Calculator', async ({ page }) => {
    await gotoReady(page, '/gst-calculator');
    await tabTo(page, '#tool-gst-calculator-mode-add');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tool-gst-calculator-mode-remove')).toBeChecked();
    await tabTo(page, '#tool-gst-calculator-amount');
    await page.keyboard.type('2500');
    await expect(primaryResult(page)).toHaveText('₹2,118.64');
  });

  test('Profit Margin Calculator', async ({ page }) => {
    await gotoReady(page, '/profit-margin-calculator');
    await tabTo(page, '#tool-profit-margin-calculator-cost');
    await page.keyboard.type('60');
    await page.keyboard.press('Tab');
    await page.keyboard.type('100');
    await expect(primaryResult(page)).toHaveText('40.00%');
  });

  for (const [id, input, output] of [
    ['json-formatter', '{"a":[1,2]}', '{\n  "a": [\n    1,\n    2\n  ]\n}'],
    ['base64-encode-decode', 'Hi', 'SGk='],
    ['url-encode-decode', 'a&b', 'a%26b'],
  ] as const) {
    test(id, async ({ page }) => {
      await gotoReady(page, `/${id}`);
      await tabTo(page, `#tool-${id}-input`);
      await page.keyboard.type(input);
      await expect(outputArea(page, id)).toHaveValue(output);
    });
  }

  test('mobile header search opens, searches and closes by keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoReady(page, '/gst-calculator');
    await tabTo(page, '[data-mobile-search-open]');
    await page.keyboard.press('Enter');
    const search = page
      .getByRole('dialog', { name: 'Search tools' })
      .getByRole('combobox', { name: 'Search tools' });
    await expect(search).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close search' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(search).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Close search' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(search).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('[data-mobile-search-open]')).toBeFocused();
  });

  test('skip link moves focus to the main content', async ({ page }) => {
    await gotoReady(page, '/tools');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});
