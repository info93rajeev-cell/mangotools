import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { legendMetrics } from '../support/cbm-legend.ts';
import { openTool } from '../support/tool-page.ts';

for (const scheme of ['light', 'dark'] as const) {
  test(`CBM overflowing legend scrolls by keyboard (${scheme})`, async ({ page }) => {
    // The approved composition is hidden below 701px. Use the narrowest visible layout.
    await page.setViewportSize({ width: 701, height: 800 });
    await page.emulateMedia({ colorScheme: scheme });
    await openTool(page, 'cbm-calculator');
    const total = page.locator('[data-cbm-total]');
    await expect(total).toHaveText('6.000 m³');
    // Valid bulk-shipment quantities produce multiple rows to exceed max-height: 150px without any CSS/DOM overrides.
    for (let index = 0; index < 18; index++) {
      if (index) await page.getByRole('button', { name: 'Add carton', exact: true }).click();
      const row = page.locator('[data-package-row]').nth(index);
      for (const [key, value] of Object.entries({
        description: `Bulk Shipment Crate #${index + 1} International Freight`,
        length: '120',
        width: '100',
        height: '180',
        quantity: '100000',
      }))
        await row.locator(`[id$="-${key}"]`).fill(value);
    }
    await expect(total).toContainText('m³');
    const legend = page.getByRole('list', { name: 'Load Composition by Carton' });
    const before = await legendMetrics(legend);
    console.info('CBM narrow legend', scheme, before);
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
    expect(before.overflowY).toBe('auto');
    await expect(legend).toHaveAttribute('tabindex', '0');
    await legend.focus();
    await expect(legend).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(async () => (await legendMetrics(legend)).scrollTop)
      .toBeGreaterThan(before.scrollTop);
    const result = await new AxeBuilder({ page })
      .include('section[aria-labelledby="cbm-composition-title"]')
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
