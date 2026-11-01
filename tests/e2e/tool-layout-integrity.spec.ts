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
const ALL_TOOLS = Object.values(registry.tools).filter((t) => t.listed !== false);

const DATA_TOOLS = [
  'json-formatter',
  'json-to-csv',
  'csv-to-json',
  'base64-encode-decode',
  'url-encode-decode',
  'timestamp-converter',
];

/** Measure only once islands have rendered and async work has settled. */
async function openIdle(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
  await page.waitForTimeout(1500);
}

test.describe('tool layout integrity', () => {
  for (const { name, url } of ALL_TOOLS) {
    test(`${name} has exactly one h1`, async ({ page }) => {
      await openIdle(page, url);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test(`${name} does not overflow in mobile landscape (740x360)`, async ({ page }) => {
      await page.setViewportSize({ width: 740, height: 360 });
      await openIdle(page, url);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${url} is ${scrollWidth}px wide at 740px`).toBeLessThanOrEqual(740);
    });
  }

  for (const slug of DATA_TOOLS) {
    test(`${slug} option cards stay compact and do not overlap at 360px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      await openIdle(page, `/${slug}`);
      const problems = await page.evaluate(() => {
        const intersects = (a: DOMRect, b: DOMRect) =>
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2 &&
          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2;
        const others = [
          ...document.querySelectorAll<HTMLElement>('[class*="statusBar"], section.supporting'),
        ];
        return [...document.querySelectorAll<HTMLElement>('[class*="optcard"]')].flatMap((card) => {
          const a = card.getBoundingClientRect();
          const tall = a.height > 420 ? [`card ${Math.round(a.height)}px tall`] : [];
          const hits = others
            .filter((other) => intersects(a, other.getBoundingClientRect()))
            .map((other) => `card overlaps ${other.className.split(' ')[0]}`);
          return [...tall, ...hits];
        });
      });
      expect(problems).toEqual([]);
    });
  }

  test('civil result tiles stay readable in phone landscape', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await openIdle(page, '/brickwork-calculator');
    const widths = await page
      .locator('.civil-workspace .kpi')
      .evaluateAll((tiles) => tiles.map((tile) => tile.getBoundingClientRect().width));
    expect(widths.length).toBeGreaterThan(0);
    expect(Math.min(...widths)).toBeGreaterThan(120);
  });

  test('photo size reducer starts empty until the user picks a photo or the sample', async ({
    page,
  }) => {
    await openIdle(page, '/photo-size-reducer');
    await expect(page.getByText('Upload a photo or click "Try Sample" to begin')).toBeVisible();
    await expect(page.getByRole('button', { name: /Download/ }).first()).toBeDisabled();
  });
});
