import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { gotoReady, produceResult, TOOL_IDS } from '../support/tool-page.ts';

const PAGES = ['/', '/tools', '/business', '/developer', ...TOOL_IDS.map((id) => `/${id}`)];

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe — ${scheme}`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`${path} (empty state)`, async ({ page }) => {
        await gotoReady(page, path);
        expect(await seriousViolations(page)).toEqual([]);
      });
    }
    for (const id of TOOL_IDS) {
      test(`/${id} (result state)`, async ({ page }) => {
        await gotoReady(page, `/${id}`);
        await produceResult(page, id);
        expect(await seriousViolations(page)).toEqual([]);
      });
    }
    test('/gst-calculator (mobile search open)', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await gotoReady(page, '/gst-calculator');
      await page.getByRole('button', { name: 'Search tools' }).click();
      await page.getByRole('dialog').getByRole('combobox').fill('gst');
      await expect(page.getByRole('dialog').getByRole('option').first()).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
    test('/json-formatter (error state)', async ({ page }) => {
      await gotoReady(page, '/json-formatter');
      await page.locator('#tool-json-formatter-input').fill('{"a":1,}');
      await expect(page.locator('[data-tool-island]')).toHaveAttribute('data-phase', 'error');
      expect(await seriousViolations(page)).toEqual([]);
    });
  });
}
