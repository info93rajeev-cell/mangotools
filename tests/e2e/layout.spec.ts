import { readFileSync } from 'node:fs';
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
