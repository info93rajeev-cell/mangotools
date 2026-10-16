import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from '@mangotools/schemas';
import { expect, type Page, test } from '@playwright/test';
import { approvedSitePages } from '../support/site-pages.ts';
import { gotoReady, produceResult, TOOL_IDS } from '../support/tool-page.ts';

const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as Registry;
const PAGES = [
  '/',
  '/tools',
  ...registry.categories.filter((c) => c.visible).map((c) => c.url),
  ...approvedSitePages(),
];
const SIZES = [
  { width: 360, height: 800 },
  { width: 1366, height: 768 },
];

/** Horizontal page scroll, and visible controls in <main> that extend past the right edge. */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const clipped = [...document.querySelectorAll('main button, main a, main input, main select')]
      .filter((el) => {
        if (!el.checkVisibility()) return false;
        const box = el.getBoundingClientRect();
        const scroller = el.closest('[style*="overflow"], .example, pre, table');
        return box.width > 0 && box.right > width + 0.5 && !scroller;
      })
      .map((el) => el.outerHTML.slice(0, 80));
    return { scroll: document.documentElement.scrollWidth - width, clipped };
  });
}

for (const size of SIZES) {
  test.describe(`layout @ ${size.width}×${size.height}`, () => {
    test.use({ viewport: size });
    for (const path of PAGES) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await gotoReady(page, path);
        expect(await overflow(page)).toEqual({ scroll: 0, clipped: [] });
      });
    }
    for (const id of TOOL_IDS) {
      test(`/${id} has no horizontal overflow with a result`, async ({ page }) => {
        await gotoReady(page, `/${id}`);
        await produceResult(page, id);
        expect(await overflow(page)).toEqual({ scroll: 0, clipped: [] });
      });
    }
  });
}

/** Header controls must leave room for the existing 4 px focus outline/offset. */
async function headerBounds(page: Page) {
  return page.locator('.site-header').evaluate((header) => {
    const width = document.documentElement.clientWidth;
    const controls = [...header.querySelectorAll('a, summary, button, input')]
      .filter((el) => el.checkVisibility())
      .map((el) => {
        const { left, right, top, bottom } = el.getBoundingClientRect();
        return {
          label: el.getAttribute('aria-label') ?? el.textContent?.trim(),
          box: { left, right, top, bottom },
        };
      });
    const clipped = controls.filter(
      ({ box }) =>
        box.left < 4 || box.right > width - 4 || box.top < 4 || box.bottom > innerHeight - 4,
    );
    const overlaps = controls.flatMap((a, index) =>
      controls
        .slice(index + 1)
        .filter(
          (b) =>
            a.box.left < b.box.right &&
            a.box.right > b.box.left &&
            a.box.top < b.box.bottom &&
            a.box.bottom > b.box.top,
        )
        .map((b) => [a.label, b.label]),
    );
    return { clipped, overlaps };
  });
}

async function checkMobileSearch(page: Page) {
  const search = page.locator('.site-header [data-mobile-search-open]');
  await search.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Search tools' });
  await expect(dialog.getByRole('combobox')).toBeFocused();
  expect(await overflow(page)).toEqual({ scroll: 0, clipped: [] });
  expect((await headerBounds(page)).clipped).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-search-input')).toHaveCount(0);
  await expect(search).toBeFocused();
}

for (const width of [320, 390, 1366]) {
  for (const id of ['gst-calculator', 'amazon-india-seller-fee-profit-estimator']) {
    test(`shared header /${id} @ ${width}px`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: width === 1366 ? 768 : 800 });
      await gotoReady(page, `/${id}`);
      await page.evaluate(() => document.fonts.ready);
      await produceResult(page, id);
      expect(await overflow(page)).toEqual({ scroll: 0, clipped: [] });
      expect(await headerBounds(page)).toEqual({ clipped: [], overlaps: [] });
      const header = page.locator('.site-header');
      await expect(header.getByRole('link', { name: 'BeyondTheAI home' })).toBeVisible();
      await expect(header.locator('[data-theme-toggle]')).toBeVisible();
      if (width === 1366) {
        await expect(header.locator('#header-search-input')).toBeVisible();
        await expect(header.locator('[data-mobile-search-open]')).toBeHidden();
        expect(
          await header.locator('.bar').evaluate((el) => el.getBoundingClientRect().height),
        ).toBe(60);
      } else {
        await checkMobileSearch(page);
      }
      const tools = header.locator('[data-menu] > summary');
      await tools.focus();
      await page.keyboard.press('Enter');
      await expect(header.getByRole('link', { name: 'All tools', exact: true })).toBeVisible();
      expect(await overflow(page)).toEqual({ scroll: 0, clipped: [] });
      // The dropdown may overlay the page, but none of its links may leave the viewport.
      expect((await headerBounds(page)).clipped).toEqual([]);
      await page.keyboard.press('Enter');
      await expect(header.locator('[data-menu]')).not.toHaveAttribute('open');
      if (width === 320 && browserName === 'chromium') {
        const out = join(process.cwd(), 'tests/artifacts/screenshots');
        mkdirSync(out, { recursive: true });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: join(out, `${id}-header-320x800.png`) });
      }
    });
  }
}
