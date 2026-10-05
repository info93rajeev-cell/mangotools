import { expect, type Page, test } from '@playwright/test';
import { island, openTool, primaryResult, produceResult } from '../support/tool-page.ts';

/** Clicks one option of a segmented unit/mode control. */
const choose = (page: Page, tool: string, field: string, value: string) =>
  page.locator(`label[for="tool-${tool}-${field}-${value}"]`).click();

const output = (page: Page, key: string) => page.locator(`[data-output="${key}"] dd`);

async function expectSameMobileRow(page: Page, left: string, right: string, fieldSlots = false) {
  const boxes = await page.evaluate(
    ({ left, right, fieldSlots }) => {
      const box = (id: string) => {
        const control = document.querySelector<HTMLElement>(id);
        const element = fieldSlots ? control?.closest<HTMLElement>('[data-width]') : control;
        return element?.getBoundingClientRect().toJSON();
      };
      return { left: box(left), right: box(right) };
    },
    { left, right, fieldSlots },
  );
  expect(boxes.left).toBeTruthy();
  expect(boxes.right).toBeTruthy();
  expect(Math.abs((boxes.left?.top ?? 0) - (boxes.right?.top ?? 0))).toBeLessThanOrEqual(2);
  expect(boxes.left?.right ?? 0).toBeLessThan(boxes.right?.left ?? 0);
}

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
    const notes = page.locator('details[data-notes]');
    await expect(notes).not.toHaveAttribute('open');
    await notes.locator('summary').click();
    await expect(notes).toContainText('5% wastage allowance');
    await expect(notes).toContainText('10 mm mortar joint');
  });

  test('offers the four brick-based wall thickness choices', async ({ page }) => {
    await openTool(page, tool);
    await expect(page.getByLabel('Wall thickness').locator('option')).toHaveText([
      '½ brick',
      '1 brick',
      '1½ brick',
      '2 brick',
    ]);
  });

  test('keeps semantic opening types through unit conversion without changing deduction', async ({
    page,
  }) => {
    await openTool(page, tool);
    await page.getByLabel('Wall length').fill('5');
    await page.getByLabel('Wall height').fill('3');
    await addOpening(page, tool, 0, '0.9', '2.1', '1');
    await page.locator('#tool-brickwork-calculator-openings-0-type').selectOption('door');
    await addOpening(page, tool, 1, '1.2', '1.2', '1');
    await page.locator('#tool-brickwork-calculator-openings-1-type').selectOption('window');
    await addOpening(page, tool, 2, '0.5', '0.5', '1');
    await page.locator('#tool-brickwork-calculator-openings-2-type').selectOption('other');
    await expect(
      page.locator('#tool-brickwork-calculator-openings-0-type').locator('option'),
    ).toHaveText(['Opening', 'Door', 'Window', 'Other']);
    await expect(primaryResult(page)).toHaveText('571');
    await choose(page, tool, 'unit', 'ft');
    await expect(page.locator('#tool-brickwork-calculator-openings-0-type')).toHaveValue('door');
    await expect(page.locator('#tool-brickwork-calculator-openings-1-type')).toHaveValue('window');
    await expect(page.locator('#tool-brickwork-calculator-openings-2-type')).toHaveValue('other');
    await expect(page.locator('#tool-brickwork-calculator-openings-0-width')).toHaveValue(
      '2.952755905512',
    );
    await expect(primaryResult(page)).toHaveText('571');
  });

  test('fits its populated workspace and secondary controls in target desktop viewports', async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await openTool(page, tool);
      await page.getByRole('button', { name: 'Try sample' }).click();

      const bounds = await page.evaluate(() => {
        const bottom = (selector: string) =>
          document.querySelector(selector)?.getBoundingClientRect().bottom ??
          Number.POSITIVE_INFINITY;
        return {
          viewport: window.innerHeight,
          input: bottom('[data-input-panel]'),
          result: bottom('[data-result-panel]'),
          secondary: Math.max(
            ...Array.from(
              document.querySelectorAll(
                'details[data-disclaimer] > summary, details[data-tool-content-section] > summary',
              ),
              (element) => element.getBoundingClientRect().bottom,
            ),
          ),
        };
      });

      expect(Math.max(bounds.input, bounds.result, bounds.secondary)).toBeLessThanOrEqual(
        bounds.viewport,
      );
      await expect(page.locator('details[data-notes]')).not.toHaveAttribute('open');
      for (const section of await page.locator('details[data-tool-content-section]').all()) {
        await expect(section).not.toHaveAttribute('open');
      }
    }
  });

  test('uses compact paired rows without overflow on a 360 px phone', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openTool(page, tool);
    await page.getByRole('button', { name: 'Try sample' }).click();

    const id = (field: string) => `#tool-${tool}-${field}`;
    await expectSameMobileRow(page, id('wallLength'), id('wallHeight'), true);
    await expectSameMobileRow(page, id('quantity'), id('wythes'), true);
    await expectSameMobileRow(page, id('brickLength'), id('brickHeight'), true);
    await expectSameMobileRow(page, id('mortarJoint'), id('wastagePercent'), true);
    await expectSameMobileRow(page, `${id('openings')}-0-type`, `${id('openings')}-0-quantity`);
    await expectSameMobileRow(page, `${id('openings')}-0-width`, `${id('openings')}-0-height`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
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
    await page.getByLabel('Brick unit').selectOption('mm');
    await expect(page.getByLabel('Brick length')).toHaveValue('193.675');
    await expect(page.getByLabel('Brick height')).toHaveValue('57.15');
    await expect(page.getByLabel('Mortar joint')).toHaveValue('9.525');
    await page.getByLabel('Brick length').fill('200');
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
    await page.getByLabel('Same-size members').fill('2');
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
    await page.getByLabel('Swell / bulking %').fill('25');
    await page.getByLabel('Usable truck volume').fill('6');
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
      await produceResult(page, tool);
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
