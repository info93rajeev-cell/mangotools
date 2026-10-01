import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult } from '../support/tool-page.ts';

/** Clicks one option of a segmented unit/mode control. */
const choose = (page: Page, tool: string, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);

/** Fills one opening/deduction row (adding it first). */
async function addOpening(page: Page, tool: string, row: number, w: string, h: string, q: string) {
  await island(page, tool).locator('[data-openings] > div button').last().click();
  const base = `#tool-${tool}-openings-${row}`;
  await page.locator(`${base}-width`).fill(w);
  await page.locator(`${base}-height`).fill(h);
  await page.locator(`${base}-quantity`).fill(q);
}

test.describe('Brickwork Calculator', () => {
  const tool = 'brickwork-calculator';

  test('orders whole bricks after repeatable openings and wastage', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Wall length').fill('5');
    await page.getByLabel('Wall height').fill('3');
    await addOpening(page, tool, 0, '0.9', '2.1', '1');
    await addOpening(page, tool, 1, '1.2', '1.2', '2');
    await page.getByLabel('Wastage allowance %').fill('5');
    await expect(primaryResult(page)).toHaveText('538');
    await expect(output(page, 'baseBricks')).toHaveText('511.50');
    await expect(output(page, 'netWallAreaM2')).toHaveText('10.23');
    await expect(output(page, 'wastagePercent')).toHaveText('5%');
    await expect(page.getByLabel('Wastage allowance %')).toBeVisible();
    await expect(page.getByLabel('Mortar joint')).toHaveValue('10');
    const assumptions = page.locator('details[data-assumptions]');
    await expect(assumptions).not.toHaveAttribute('open');
    await expect(assumptions.locator('summary')).toBeVisible();
    await expect(assumptions.locator('ul')).toBeHidden();
    await expect(assumptions).toContainText('5% wastage allowance');
    await expect(assumptions).toContainText('10 mm mortar joint');
  });

  test('changing the wall unit converts values and keeps the result', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Wall length').fill('5');
    await page.getByLabel('Wall height').fill('3');
    await expect(primaryResult(page)).toHaveText('750');
    await choose(page, tool, 'unit', 'ft');
    await expect(page.getByLabel('Wall length')).toHaveValue('16.404199475066');
    await expect(primaryResult(page)).toHaveText('750');
    await expect(output(page, 'netWallAreaFt2')).toHaveText('161.46');
  });

  test('a brick preset fills editable values, and editing switches it to custom', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByLabel('Brick size preset').selectOption('us-modular');
    await expect(page.getByLabel('Brick length')).toHaveValue('7.625');
    await expect(page.getByLabel('Mortar joint')).toHaveValue('0.375');
    await page.getByLabel('Mortar joint').fill('0.5');
    await expect(page.getByLabel('Brick size preset')).toHaveValue('custom');
  });

  test('explanatory field help is collapsed and keyboard operable', async ({ page }) => {
    await openTool(page, tool);
    const help = island(page, tool).locator('details[data-field-help]').first();
    await expect(help).not.toHaveAttribute('open');
    const summary = help.locator('summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(help).toHaveAttribute('open');
    await expect(help.locator('p')).toBeVisible();
  });

  test('rejects openings as large as the wall', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Wall length').fill('2');
    await page.getByLabel('Wall height').fill('2');
    await addOpening(page, tool, 0, '2', '2', '1');
    await expect(page.getByText('Openings and deductions must be smaller')).toBeVisible();
  });
});

test.describe('Concrete Quantity Calculator', () => {
  const tool = 'concrete-quantity-calculator';

  test('calculates circular columns and whole bags from a stated yield', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Member type').selectOption('circular-column');
    await page.getByLabel('Diameter').fill('0.3');
    await page.getByLabel('Height', { exact: true }).fill('3');
    await page.getByLabel('Number of identical members').fill('2');
    await expect(primaryResult(page)).toHaveText('0.424');
    await page.getByLabel('Yield per bag (optional)').fill('14');
    await expect(output(page, 'bags')).toHaveText('31');
  });

  test('overage changes only the order volume', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Length').fill('5');
    await page.getByLabel('Width').fill('4');
    await page.getByLabel('Depth / thickness / height').fill('0.15');
    await page.getByLabel('Overage allowance %').fill('10');
    await expect(primaryResult(page)).toHaveText('3.300');
    await expect(output(page, 'netVolumeM3')).toHaveText('3.000');
    await expect(output(page, 'overagePercent')).toHaveText('10%');
  });
});

test.describe('Excavation Calculator', () => {
  const tool = 'excavation-calculator';

  test('shows bank volume first, then loose volume and whole truck loads', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Length').fill('20');
    await page.getByLabel('Width').fill('0.6');
    await page.getByLabel('Depth').fill('1');
    await expect(primaryResult(page)).toHaveText('12.000');
    await expect(output(page, 'looseVolumeM3')).toHaveCount(0);
    await page.getByLabel('Swell % (optional estimate)').fill('25');
    await page.getByLabel('Usable truck volume (optional)').fill('6');
    await expect(output(page, 'looseVolumeM3')).toHaveText('15.000');
    await expect(output(page, 'truckLoads')).toHaveText('3');
    await expect(output(page, 'swellPercent')).toHaveText('25%');
  });
});

test.describe('Paint Calculator', () => {
  const tool = 'paint-calculator';

  test('room walls minus openings, coats and coverage', async ({ page }) => {
    await openTool(page, tool);
    await expect(page.getByLabel('Number of coats')).toHaveValue('2');
    await page.getByLabel('Room length').fill('4');
    await page.getByLabel('Room width').fill('3');
    await page.getByLabel('Wall height').fill('2.7');
    await addOpening(page, tool, 0, '0.9', '2.1', '1');
    await addOpening(page, tool, 1, '1.5', '1.2', '1');
    await expect(primaryResult(page)).toHaveText('7.50');
    await expect(output(page, 'netAreaM2')).toHaveText('34.11');
    await expect(page.locator('[data-assumptions]')).toContainText('10 m²/L');
  });

  test('switching coverage unit converts the rate, not just its label', async ({ page }) => {
    await openTool(page, tool);
    await choose(page, tool, 'coverageUnit', 'ft2-per-gal');
    await expect(page.getByLabel('Coverage per coat')).toHaveValue('407.458333333333');
  });
});

test.describe('Plaster Calculator', () => {
  const tool = 'plaster-calculator';

  test('volume only until product yield is entered, then whole bags', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Length', { exact: true }).fill('5');
    await page.getByLabel('Height or width').fill('2');
    await page.getByLabel('Plaster thickness').fill('15');
    await page.getByLabel('Wastage allowance %').fill('10');
    await expect(primaryResult(page)).toHaveText('0.165');
    await page.getByLabel('Material estimate').selectOption('bag-yield');
    await page.getByLabel('Wet yield per bag (from your product)').fill('30');
    await expect(primaryResult(page)).toHaveText('6');
  });
});

test.describe('Tile / Flooring Calculator', () => {
  const tool = 'tile-flooring-calculator';

  test('tiles and boxes, with a layout suggestion filling the wastage', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Floor or wall length').fill('5');
    await page.getByLabel('Floor width or wall height').fill('4');
    await page.getByLabel('Tile length').fill('300');
    await page.getByLabel('Tile width').fill('300');
    await expect(primaryResult(page)).toHaveText('245');
    await page.getByLabel('Tiles per box (optional)').fill('10');
    await expect(output(page, 'boxes')).toHaveText('25');
    await page.getByLabel('Layout (suggests a wastage %)').selectOption('diagonal');
    await expect(page.getByLabel('Wastage allowance %')).toHaveValue('15');
    await expect(primaryResult(page)).toHaveText('256');
  });

  test('explains an invalid dimension next to the field', async ({ page }) => {
    await openTool(page, tool);
    await page.getByLabel('Floor or wall length').fill('0');
    await page.getByLabel('Floor width or wall height').fill('4');
    await page.getByLabel('Tile length').fill('300');
    await page.getByLabel('Tile width').fill('300');
    await expect(page.getByText('This must be greater than zero.')).toBeVisible();
    await expect(page.getByLabel('Floor or wall length')).toHaveAttribute('aria-invalid', 'true');
  });

  test('known area converts with its unit and preserves the tile quantity', async ({ page }) => {
    await openTool(page, tool);
    await choose(page, tool, 'mode', 'area');
    await page.getByLabel(/Area \(surface unit squared/).fill('20');
    await page.getByLabel('Tile length').fill('300');
    await page.getByLabel('Tile width').fill('300');
    await expect(primaryResult(page)).toHaveText('245');
    await choose(page, tool, 'unit', 'ft');
    await expect(page.getByLabel(/Area \(surface unit squared/)).toHaveValue('215.278208334194');
    await expect(primaryResult(page)).toHaveText('245');
  });
});

test.describe('Civil calculators on a 360 px phone', () => {
  const tools = [
    'brickwork-calculator',
    'concrete-quantity-calculator',
    'excavation-calculator',
    'paint-calculator',
    'plaster-calculator',
    'tile-flooring-calculator',
  ];
  for (const tool of tools) {
    test(`${tool} has no horizontal overflow and whole purchase counts`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await openTool(page, tool);
      await island(page, tool).locator('[data-try-sample]').click();
      await expect(primaryResult(page)).not.toHaveText('');
      await expect(page.locator('details[data-working]')).not.toHaveAttribute('open');
      const content = page.locator('details[data-tool-content-section]');
      for (const section of await content.all()) await expect(section).not.toHaveAttribute('open');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      for (const key of [
        'orderBricks',
        'orderTiles',
        'boxes',
        'bags',
        'truckLoads',
        'containers',
      ]) {
        const cell = output(page, key);
        if ((await cell.count()) > 0) await expect(cell).toHaveText(/^[\d,]+$/);
      }
    });
  }
});
