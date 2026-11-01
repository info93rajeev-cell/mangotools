import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

interface ToolEntry {
  name: string;
  url: string;
  listed?: boolean;
}

const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as { tools: Record<string, ToolEntry> };
const ALL_TOOLS = Object.values(registry.tools).filter((t) => t.listed !== false);

test.describe('full screen mode', () => {
  for (const { name, url } of ALL_TOOLS) {
    test(`${name} offers a labelled full screen button`, async ({ page }) => {
      await page.goto(url);
      const button = page.locator('[data-fullscreen-toggle]');
      await expect(button).toHaveCount(1);
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      await expect(button).toHaveAccessibleName('Full screen');
    });
  }

  for (const url of ['/json-formatter', '/photo-size-reducer', '/concrete-quantity-calculator']) {
    test(`${url} enters and exits full screen`, async ({ page }) => {
      await page.setViewportSize({ width: 740, height: 360 });
      await page.goto(url);
      const button = page.locator('[data-fullscreen-toggle]');
      await button.click();
      await expect
        .poll(() =>
          page.evaluate(() => document.fullscreenElement?.hasAttribute('data-fullscreen-root')),
        )
        .toBe(true);
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(button).toHaveAccessibleName('Exit full screen');
      await expect(
        page.locator('main [data-tool-island], main .civil-page-wrap').first(),
      ).toBeVisible();

      await button.click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
      await expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  }

  test('the site header slides away while scrolling down in phone landscape', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await page.goto('/brickwork-calculator');
    const header = page.locator('.site-header');
    await page.mouse.wheel(0, 600);
    await expect(header).toHaveAttribute('data-hidden', '');
    await expect
      .poll(() => header.evaluate((el) => el.getBoundingClientRect().bottom))
      .toBeLessThanOrEqual(1);
    await page.mouse.wheel(0, -120);
    await expect(header).not.toHaveAttribute('data-hidden');
  });

  test('the site header stays sticky in portrait', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/brickwork-calculator');
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    await expect(page.locator('.site-header')).not.toHaveAttribute('data-hidden');
  });

  test('full screen mode leaves the site header out', async ({ page }) => {
    await page.setViewportSize({ width: 740, height: 360 });
    await page.goto('/json-formatter');
    await page.locator('[data-fullscreen-toggle]').click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.fullscreenElement?.contains(document.querySelector('.site-header')) ?? null,
        ),
      )
      .toBe(false);
  });

  test('the button stays hidden where the Fullscreen API is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false });
    });
    await page.goto('/json-formatter');
    await expect(page.locator('[data-fullscreen-toggle]')).toBeHidden();
  });
});
