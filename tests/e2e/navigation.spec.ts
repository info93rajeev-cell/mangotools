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

  test('home displays hero, search, popular tools, categories, and all tools catalog', async ({
    page,
  }) => {
    await gotoReady(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Professional tools for work that should not depend on AI.',
    );
    const search = page.getByRole('combobox', { name: 'Search tools' });
    await expect(search).toHaveAttribute(
      'placeholder',
      'Search tools — try GST, JSON, CBM, Base64',
    );
    // Categories section
    const categories = page.getByRole('region', { name: 'Browse by category' });
    await expect(categories.getByRole('link', { name: 'Developer & Data' })).toBeVisible();
    await expect(categories.getByRole('link', { name: 'Business & Finance' })).toBeVisible();
    await expect(categories.getByRole('link', { name: 'Logistics' })).toBeVisible();
    await expect(categories.getByRole('link', { name: 'Image & Media' })).toBeVisible();
    await expect(categories.getByRole('link', { name: 'Civil & Construction' })).toBeVisible();

    // Popular tools section
    const popularSection = page.locator('[data-popular-tools]');
    await expect(popularSection).toBeVisible();
    await expect(popularSection.locator('[data-tool-card]')).toHaveCount(6);

    // All Tools section has exactly 36 unique tool cards
    const allToolsSection = page.locator('#all-tools');
    await expect(allToolsSection).toBeVisible();
    const allCards = allToolsSection.locator('[data-tool-card]');
    await expect(allCards).toHaveCount(36);

    await expect(page.locator('[data-trust-line]')).toHaveText(
      'No ads · No unnecessary uploads · Deterministic results · Built for professional workflows',
    );
  });

  test('home has zero horizontal overflow on desktop and mobile', async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 900 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoReady(page, '/');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `Overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(0);
    }
  });

  test('home search filters both old and new tools in catalog and popover', async ({ page }) => {
    await gotoReady(page, '/');
    const search = page.getByRole('combobox', { name: 'Search tools' });

    // Search for a new image studio: "crop"
    await search.fill('crop');
    await expect(page.getByRole('option', { name: /Image Crop/ })).toBeVisible();
    await expect(page.locator('#all-tools [data-tool-card="image-crop"]')).toBeVisible();
    await expect(page.locator('#all-tools [data-tool-card="gst-calculator"]')).toBeHidden();

    // Clear and search for an older tool: "gst"
    await search.fill('gst');
    await expect(page.getByRole('option', { name: /GST Calculator/ })).toBeVisible();
    await expect(page.locator('#all-tools [data-tool-card="gst-calculator"]')).toBeVisible();
    await expect(page.locator('#all-tools [data-tool-card="image-crop"]')).toBeHidden();

    // Clear search restores all cards
    await search.fill('');
    await expect(page.locator('#all-tools [data-tool-card]')).toHaveCount(36);
  });

  test('clicking upgraded tools opens modern studio layout', async ({ page }) => {
    await gotoReady(page, '/');

    // Click Image Crop card
    const cropCard = page.locator('#all-tools [data-tool-card="image-crop"] a').first();
    await cropCard.click();
    await expect(page).toHaveURL(/\/image-crop$/);
    await expect(page.locator('[data-image-crop-layout]')).toBeVisible();

    // Return home and click Background Remover
    await gotoReady(page, '/');
    const bgCard = page.locator('#all-tools [data-tool-card="image-background-remover"] a').first();
    await bgCard.click();
    await expect(page).toHaveURL(/\/image-background-remover$/);
    await expect(page.locator('[data-image-bg-remover-layout]')).toBeVisible();

    // Return home and click Image Resize
    await gotoReady(page, '/');
    const resizeCard = page.locator('#all-tools [data-tool-card="image-resize"] a').first();
    await resizeCard.click();
    await expect(page).toHaveURL(/\/image-resize$/);
    await expect(page.locator('[data-image-resize-layout]')).toBeVisible();
  });

  test('construction category fits its cards, closed support and footer at 1366x768', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoReady(page, '/construction');

    const cards = page.locator('main [data-tool-card]');
    await expect(cards).toHaveCount(6);
    await expect(cards.last()).toBeInViewport();

    for (const name of ['about', 'faq']) {
      const disclosure = page.locator(`details[data-category-support="${name}"]`);
      await expect(disclosure).toBeInViewport();
      await expect(disclosure).not.toHaveAttribute('open');
    }
    await expect(page.locator('footer')).toBeInViewport();

    const dimensions = await page.evaluate(() => ({
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
    }));
    expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight);
  });

  test('construction category support stays closed without phone-width overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoReady(page, '/construction');

    for (const name of ['about', 'faq']) {
      const disclosure = page.locator(`details[data-category-support="${name}"]`);
      const summary = disclosure.locator('summary').first();
      await expect(disclosure).not.toHaveAttribute('open');
      await summary.focus();
      await page.keyboard.press('Enter');
      await expect(disclosure).toHaveAttribute('open');
      await expect(disclosure.locator('.support-content')).toBeVisible();
      await page.keyboard.press('Enter');
      await expect(disclosure).not.toHaveAttribute('open');
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('search handles synonyms and typos', async ({ page }) => {
    await gotoReady(page, '/tools');
    const search = page.getByRole('combobox', { name: 'Search tools' }).first();
    for (const [query, name] of [
      ['jsn formatter', 'JSON Formatter & Validator'],
      ['b64', 'Base64 Encode & Decode'],
      ['percent encoding', 'URL Encode & Decode'],
      ['gross margin', 'Seller Profitability Calculator'],
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
