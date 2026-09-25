import { expect, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

test.describe('navigation', () => {
  test('home search for "gst" opens the GST Calculator', async ({ page }) => {
    await gotoReady(page, '/');
    const search = page.getByRole('combobox', { name: 'Search tools' });
    await search.fill('gst');
    await expect(page.getByRole('option', { name: /GST Calculator/ })).toBeVisible();
    await search.press('Enter');
    await expect(page).toHaveURL(/\/gst-calculator$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('GST Calculator');
  });

  test('search handles synonyms and typos', async ({ page }) => {
    await gotoReady(page, '/tools');
    const search = page.getByRole('combobox', { name: 'Search tools' }).first();
    for (const [query, name] of [
      ['jsn formatter', 'JSON Formatter & Validator'],
      ['b64', 'Base64 Encode & Decode'],
      ['percent encoding', 'URL Encode & Decode'],
      ['gross margin', 'Profit Margin Calculator'],
    ]) {
      await search.fill(query);
      await expect(page.getByRole('option').first()).toContainText(name);
    }
  });

  test('home category card → category → tool', async ({ page }) => {
    await gotoReady(page, '/');
    await page.getByRole('link', { name: 'Developer & Data' }).first().click();
    await expect(page).toHaveURL(/\/developer$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Developer & Data');
    await page.getByRole('link', { name: 'JSON Formatter & Validator' }).last().click();
    await expect(page).toHaveURL(/\/json-formatter$/);
  });

  test('all tools page filters by category', async ({ page }) => {
    await gotoReady(page, '/tools');
    await page.getByRole('button', { name: 'Business & Finance' }).click();
    await expect(page.locator('[data-category="developer"]')).toBeHidden();
    await expect(page.locator('[data-category="business"]')).toBeVisible();
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.locator('[data-category="developer"]')).toBeVisible();
  });

  test('unknown pages return the 404 page', async ({ page }) => {
    const response = await page.goto('/no-such-tool');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
    await expect(page.getByRole('combobox', { name: 'Search tools' })).toBeVisible();
  });

  test('header and footer only link to pages that exist', async ({ page, request }) => {
    await page.goto('/gst-calculator');
    const hrefs = await page
      .locator('header a[href^="/"], footer a[href^="/"]')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href') ?? ''))]);
    expect(hrefs.length).toBeGreaterThan(3);
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  });
});
