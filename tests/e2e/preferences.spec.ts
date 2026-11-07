import { expect, test } from '@playwright/test';
import { gotoReady, openTool } from '../support/tool-page.ts';

test('theme choice persists after reload', async ({ page }) => {
  await gotoReady(page, '/');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toHaveAttribute('data-theme-value', 'system');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('data-theme-value', 'dark');
});

test('site stays light on a phone in dark mode until the visitor chooses dark', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await gotoReady(page, '/markup-calculator');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const bar = await page.locator('meta[name="theme-color"]').first().getAttribute('content');
  expect(bar).toBe('#ffffff');
});

test('recent tools appear on /tools, not on home, after visiting tools', async ({ page }) => {
  await gotoReady(page, '/tools');
  await expect(page.locator('[data-recent-tools]')).toHaveCount(0);
  await openTool(page, 'url-encode-decode');
  await openTool(page, 'gst-calculator');
  await gotoReady(page, '/');
  await expect(page.locator('[data-recent-tools]')).toHaveCount(0);
  await gotoReady(page, '/tools');
  const recent = page.locator('[data-recent-tools]');
  await expect(recent).toBeVisible();
  await expect(recent.locator('[data-tool-card]')).toHaveCount(2);
  await expect(recent.locator('[data-tool-card]').first()).toContainText(
    'Universal Tax Calculator',
  );
});
