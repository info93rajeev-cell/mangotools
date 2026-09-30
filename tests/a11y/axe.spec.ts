import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import type { Registry } from '@mangotools/schemas';
import { expect, type Page, test } from '@playwright/test';
import { approvedSitePages } from '../support/site-pages.ts';
import { gotoReady, island, produceResult, TOOL_IDS } from '../support/tool-page.ts';

const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as Registry;
const CATEGORY_PAGES = registry.categories.filter((c) => c.visible).map((c) => c.url);
const PAGES = [
  '/',
  '/tools',
  ...CATEGORY_PAGES,
  ...approvedSitePages(),
  '/this-page-does-not-exist',
  ...TOOL_IDS.map((id) => `/${id}`),
];

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
    test('/gst-calculator (field error state)', async ({ page }) => {
      await gotoReady(page, '/gst-calculator');
      await page.getByLabel('Amount (₹)').fill('12a');
      await expect(page.getByLabel('Amount (₹)')).toHaveAttribute('aria-invalid', 'true');
      expect(await seriousViolations(page)).toEqual([]);
    });
    test('/image-metadata-remover (file error state)', async ({ page }) => {
      await gotoReady(page, '/image-metadata-remover');
      const notAnImage = join(process.cwd(), 'tools/image-metadata-remover/manifest.yaml');
      await island(page, 'image-metadata-remover')
        .locator('input[type="file"]')
        .setInputFiles([notAnImage]);
      await page.getByRole('button', { name: 'Download cleaned image' }).click();
      await expect(page.getByText('is not a JPG, PNG, or WebP image.')).toBeVisible();
      expect(await seriousViolations(page)).toEqual([]);
    });
    test('/tools (search with no results)', async ({ page }) => {
      await gotoReady(page, '/tools');
      await page.locator('#tools-search-input').fill('zzqxv');
      await expect(page.getByText(/No tools match/).first()).toBeVisible();
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
