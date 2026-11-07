import { expect, type Page, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

/** The live Civil & Construction workspaces (apps/web/public/civil/reference.js). */
const kpi = (page: Page, n: number) => page.locator('.kpis .kpi strong').nth(n);

async function calculate(page: Page) {
  await page.locator('button.calculate').click();
}

const CASES = [
  // [slug, field, new value, first KPI after Calculate (hand-checked)]
  // Brickwork: (10×3 − 3.33) m² × 0.2 m ÷ 0.002 m³ module = 2,667 net; +5% → 2,801.
  ['brickwork-calculator', 'length', '10', '2,801'],
  // Concrete: 6 × 4 × 0.15 = 3.6 m³; +5% → 3.780.
  ['concrete-quantity-calculator', 'length', '6', '3.780'],
  // Excavation (sloped pit): base 7×4, mid 8×5, top 9×6, depth 2 → 2 × (28 + 160 + 54) ÷ 6.
  ['excavation-calculator', 'length', '7', '80.667'],
  // Paint (both): 2 × (6 + 4) × 3 − 3.33 + 6 × 4 = 80.67 m².
  ['paint-calculator', 'length', '6', '80.67'],
  // Plaster (wall, 2 faces): (6×3 − 3.33) × 2 + 1.26 returns = 30.60 m².
  ['plaster-calculator', 'length', '6', '30.60'],
  // Tile: 7 × 4 − 1 = 27.00 m².
  ['tile-flooring-calculator', 'length', '7', '27.00'],
] as const;

test.describe('Civil calculators keep the entered values when Calculate is pressed', () => {
  for (const [slug, field, value, expected] of CASES) {
    test(`${slug}: Calculate uses the new ${field}`, async ({ page }) => {
      await gotoReady(page, `/${slug}`);
      const url = page.url();
      await page.locator(`#${field}`).fill(value);
      await calculate(page);
      await expect(kpi(page, 0)).toContainText(expected);
      await expect(page.locator(`#${field}`)).toHaveValue(value);
      expect(page.url()).toBe(url);
      await expect(page.locator('.results')).toHaveAttribute('data-stale', 'false');
    });
  }
});

test('plaster: jamb returns are not added to a ceiling', async ({ page }) => {
  await gotoReady(page, '/plaster-calculator');
  await page.locator('[data-mode="Ceiling"]').click();
  await calculate(page);
  // 5 × 4 ceiling, no openings, no returns.
  await expect(kpi(page, 0)).toContainText('20.00');
});
