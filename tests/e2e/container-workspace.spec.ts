import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { startContainerPreview } from '../support/container-workspace-preview.ts';
import { copiedTexts, stubClipboard } from '../support/tool-page.ts';

let preview: Awaited<ReturnType<typeof startContainerPreview>>;
let url = '';
test.beforeAll(async ({ browserName: _browserName }, info) => {
  const port = 4600 + info.workerIndex;
  preview = await startContainerPreview(port);
  url = `http://127.0.0.1:${port}`;
});
test.afterAll(async () => {
  await preview?.close();
});
const kpi = (page: Page, index: number) => page.locator(`[data-load-kpi="${index}"]`);
async function ready(page: Page) {
  await page.goto(url);
  await expect(kpi(page, 1)).toHaveText('2');
}
async function priced(page: Page) {
  await page.getByLabel('Enable cost estimate').check();
  await page.getByLabel('Freight rate', { exact: true }).fill('145000');
  await page.getByLabel('Other charges', { exact: true }).fill('12000');
  await expect(page.getByRole('region', { name: 'Estimated Freight Cost' })).toContainText(
    '₹3,02,000.00',
  );
}
test.describe('Container workspace #226', () => {
  test('real mixed-package placement, actual blocks, allocations and unloaded quantities', async ({
    page,
  }) => {
    await ready(page);
    await expect(kpi(page, 0)).toHaveText('200');
    await expect(kpi(page, 2)).toHaveText('70.5%');
    await expect(page.getByText('Loaded: 200 · Unloaded: 0', { exact: false })).toBeVisible();
    await expect(page.locator('[data-placement-block]').first()).toBeVisible();
    const before = await page.locator('svg[data-placement-view]').innerHTML();
    await page.getByLabel('Container', { exact: true }).selectOption({ value: '1' });
    await expect.poll(() => page.locator('svg[data-placement-view]').innerHTML()).not.toBe(before);
    await page.getByRole('button', { name: 'Top View', exact: true }).click();
    await expect(page.locator('svg[data-placement-view]')).toHaveAttribute(
      'data-placement-view',
      'top',
    );
  });
  test('cost uses two actual containers and invalidates on every placement change', async ({
    page,
  }) => {
    await ready(page);
    await priced(page);
    await page.getByLabel('Length 1', { exact: true }).fill('');
    await expect(kpi(page, 1)).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Estimated Freight Cost' })).not.toContainText(
      '₹3,02,000.00',
    );
    await expect(page.getByRole('alert')).toBeVisible();
  });
  test('partial loading remains explicit and cannot produce a freight quote', async ({ page }) => {
    await ready(page);
    await priced(page);
    for (const key of ['Length', 'Width', 'Height'])
      await page.getByLabel(`${key} 1`, { exact: true }).fill('9999');
    await expect(page.getByText('Partial placement', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Estimated Freight Cost' })).not.toContainText(
      '₹3,02,000.00',
    );
    await expect(page.getByRole('region', { name: 'Loading Result', exact: true })).toContainText(
      'Unloaded: 100',
    );
  });
  test('unknown or partial weights do not claim full weight utilization', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Weight / item 1', { exact: true }).fill('');
    await expect(kpi(page, 3)).toHaveText('Not available');
    await expect(
      page
        .getByRole('region', { name: 'Loading Result', exact: true })
        .getByText('Some package weights are missing.', { exact: false }),
    ).toBeVisible();
  });
  test('custom geometry, row duplication, clear, copy and print', async ({ page }) => {
    await stubClipboard(page);
    await ready(page);
    await page.getByRole('button', { name: 'Duplicate selected', exact: true }).click();
    await expect(page.locator('[data-load-package]')).toHaveCount(5);
    await page.getByRole('button', { name: 'Clear All', exact: true }).click();
    await expect(page.locator('[data-load-package]')).toHaveCount(1);
    await page.getByRole('button', { name: /^Custom/ }).click();
    for (const key of ['Length', 'Width', 'Height'])
      await page.getByLabel(`${key} 1`, { exact: true }).fill('60');
    await page.getByLabel('Qty 1', { exact: true }).fill('2');
    for (const key of ['Length', 'Width', 'Height'])
      await page.getByLabel(`${key} (cm)`, { exact: true }).fill('100');
    await expect(kpi(page, 1)).toHaveText('2');
    await page.getByRole('button', { name: 'Copy Summary', exact: true }).click();
    expect((await copiedTexts(page))[0]).toContain('Containers Required: 2');
    await page.evaluate(() => {
      window.print = () => document.documentElement.setAttribute('data-printed', 'yes');
    });
    await page.getByRole('button', { name: 'Print / Save PDF', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-printed', 'yes');
  });
  for (const width of [1366, 390, 375, 360])
    test(`responsive ${width}px and private same-origin worker`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1366 ? 768 : 800 });
      const external: string[] = [];
      page.on('request', (r) => {
        if (
          !r.url().startsWith('http://127.0.0.1:') &&
          !r.url().startsWith('data:') &&
          !r.url().startsWith('blob:')
        )
          external.push(r.url());
      });
      await page.emulateMedia({ colorScheme: 'dark' });
      await ready(page);
      await expect(page.locator('[data-container-workspace]')).toHaveCSS('color-scheme', 'light');
      await priced(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      expect(external).toEqual([]);
      if (width === 1366) {
        const print = await page
          .getByRole('button', { name: 'Print / Save PDF', exact: true })
          .boundingBox();
        expect((print?.y ?? 0) + (print?.height ?? 0)).toBeLessThanOrEqual(768);
      }
      if (width < 700) {
        await expect(page.getByLabel('Description / SKU 1', { exact: true })).toBeHidden();
        await page
          .locator('[data-load-package]')
          .first()
          .getByRole('button', { name: 'Edit', exact: true })
          .click();
        await expect(page.getByLabel('Description / SKU 1', { exact: true })).toBeVisible();
        for (const button of await page
          .locator('[data-load-package]')
          .first()
          .getByRole('button')
          .all()) {
          const box = await button.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box?.width).toBeGreaterThanOrEqual(44);
        }
      }
      await page.screenshot({
        path: test.info().outputPath(`container-${width}.png`),
        fullPage: true,
      });
    });
  test('keyboard and accessibility', async ({ page }) => {
    await ready(page);
    const view = page.getByRole('button', { name: 'Top View', exact: true });
    await view.focus();
    await page.keyboard.press('Enter');
    await expect(view).toHaveAttribute('aria-pressed', 'true');
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
