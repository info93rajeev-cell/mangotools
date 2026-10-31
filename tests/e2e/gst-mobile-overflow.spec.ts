import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';

interface ToolEntry {
  slug: string;
  name: string;
  url: string;
  listed?: boolean;
}

const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as { tools: Record<string, ToolEntry> };

// All tools must never horizontally overflow or clip content on mobile viewports (320px, 360px, 375px).
const ALL_TOOLS = Object.values(registry.tools).filter((t) => t.listed !== false);

async function getClippedElements(page: Page, viewportWidth: number): Promise<string[]> {
  return page.evaluate((vpWidth) => {
    const main = document.querySelector('main');
    if (!main) return ['<main> not found'];

    const isVisible = (el: Element) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
    };

    const describe = (el: Element, rect: DOMRect) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className
          ? `.${el.className.split(' ').filter(Boolean).slice(0, 2).join('.')}`
          : '';
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30);
      return `${tag}${id}${cls} [right=${Math.round(rect.right)} > ${vpWidth}] text="${text}"`;
    };

    const elements = Array.from(main.querySelectorAll('*'));
    const clipped: string[] = [];
    for (const el of elements) {
      if (!isVisible(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.right > vpWidth + 1) {
        clipped.push(describe(el, rect));
      }
    }
    return clipped;
  }, viewportWidth);
}

for (const { name, url } of ALL_TOOLS) {
  for (const width of [320, 360, 375]) {
    test(`${name} has no horizontal overflow or clipped elements at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 740 });
      await page.goto(url);
      await expect(page.locator('main').first()).toBeVisible();

      // Ensure page document does not expand past viewport width
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(
        scrollWidth,
        `scrollWidth (${scrollWidth}) should be <= ${width} on ${url}`,
      ).toBeLessThanOrEqual(width);

      // Ensure 0 visible elements in <main> are clipped beyond the viewport
      const clipped = await getClippedElements(page, width);
      expect(
        clipped,
        `Found ${clipped.length} clipped elements on ${url} at ${width}px:\n${clipped.slice(0, 10).join('\n')}`,
      ).toEqual([]);
    });
  }
}
