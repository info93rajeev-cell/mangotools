import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { copiedTexts, openTool, stubClipboard } from '../support/tool-page.ts';

/**
 * Workstream B of #219: shipment visualization, KPI results, load composition, cost result and
 * output actions. Worksheet, options and cost inputs belong to Workstream A (cbm-compact.spec.ts);
 * this file only drives them through their stable labels and IDs.
 */
const rows = (page: Page) => page.locator('[data-package-row]');
const field = (page: Page, index: number, key: string) =>
  rows(page).nth(index).locator(`[id$="-${key}"]`);
const total = (page: Page) => page.locator('[data-cbm-total]');
const visual = (page: Page) => page.getByRole('region', { name: /^Shipment Visualization/ });
const summary = (page: Page) => page.getByRole('region', { name: 'Results Summary' });
const composition = (page: Page) =>
  page.getByRole('region', { name: 'Load Composition by Package' });
const cost = (page: Page) => page.getByRole('region', { name: 'Estimated freight cost' });
const kpi = (page: Page, name: string) => summary(page).locator(`[data-kpi="${name}"]`);
const print = (page: Page) => page.getByRole('button', { name: 'Print / Save PDF', exact: true });
const copy = (page: Page) => page.getByRole('button', { name: 'Copy Summary', exact: true });

const FOUNDER_ROWS = [
  ['Carton A', '60', '40', '40', '100', '12'],
  ['Carton B', '50', '30', '30', '80', '8'],
  ['Wooden Crate', '120', '100', '180', '10', '250'],
  ['Pallet (Boxed)', '100', '100', '120', '10', '400'],
] as const;

async function ready(page: Page) {
  await openTool(page, 'cbm-calculator');
  await expect(total(page)).toHaveText('6.000 m³');
}

async function fillShipment(page: Page, data: readonly (readonly string[])[] = FOUNDER_ROWS) {
  for (const [index, [description, length, width, height, quantity, weight]] of data.entries()) {
    if (index > 0) await page.getByRole('button', { name: 'Add Package', exact: true }).click();
    await field(page, index, 'description').fill(description ?? '');
    await field(page, index, 'length').fill(length ?? '');
    await field(page, index, 'width').fill(width ?? '');
    await field(page, index, 'height').fill(height ?? '');
    await field(page, index, 'quantity').fill(quantity ?? '');
    if (weight) await field(page, index, 'weightPerItem').fill(weight);
  }
  await expect(total(page)).toHaveText('46.800 m³');
}

async function enableCost(
  page: Page,
  rate: string,
  extra: { minimum?: string; other?: string } = {},
) {
  await page.getByLabel('Enable cost estimate').check();
  await page.getByLabel('Freight rate', { exact: true }).fill(rate);
  if (extra.minimum) await page.getByLabel('Minimum charge', { exact: true }).fill(extra.minimum);
  if (extra.other) await page.getByLabel('Other charges', { exact: true }).fill(extra.other);
}

async function noBodyOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
}

async function noInternalOverflow(section: Locator) {
  const widths = await section.evaluate((node) => [node.scrollWidth, node.clientWidth]);
  expect(widths[0]).toBeLessThanOrEqual((widths[1] ?? 0) + 1);
}

test.describe('CBM results presentation (#219 B)', () => {
  test('KPI cards show pieces, exact-derived CBM, weight coverage and average per piece', async ({
    page,
  }) => {
    await ready(page);
    await fillShipment(page);
    await expect(kpi(page, 'pieces')).toContainText('Total Pieces200');
    await expect(kpi(page, 'volume')).toContainText('1,652.726 ft³');
    await expect(kpi(page, 'weight')).toContainText('Total Weight');
    await expect(kpi(page, 'weight')).toContainText('8,340.000 kg');
    await expect(kpi(page, 'average')).toContainText('0.234 m³');
    await expect(summary(page)).not.toContainText(/partial/i);

    await field(page, 3, 'weightPerItem').fill('');
    await expect(kpi(page, 'weight')).toContainText('Known Weight');
    await expect(kpi(page, 'weight')).toContainText('4,340.000 kg');
    await expect(kpi(page, 'weight')).toContainText('Partial');
    await expect(summary(page)).toContainText(
      'Known packed weight (partial): 190 of 200 pieces weighed.',
    );
    await expect(kpi(page, 'weight')).not.toContainText('Total Weight');

    for (const index of [0, 1, 2]) await field(page, index, 'weightPerItem').fill('');
    await expect(kpi(page, 'weight')).toContainText('Not provided');
  });

  test('load composition uses exact shares, numbered segments and text labels', async ({
    page,
  }) => {
    await ready(page);
    await fillShipment(page);
    const legend = composition(page).locator('ol li');
    await expect(legend).toHaveText([
      '1. Carton A9.600 m³ (20.5%)',
      '2. Carton B3.600 m³ (7.7%)',
      '3. Wooden Crate21.600 m³ (46.2%)',
      '4. Pallet (Boxed)12.000 m³ (25.6%)',
    ]);
    const widths = await composition(page)
      .locator('[aria-hidden="true"] > span')
      .evaluateAll((spans) => spans.map((span) => span.getBoundingClientRect().width));
    const bar = widths.reduce((sum, width) => sum + width, 0);
    expect(widths[2] / bar).toBeGreaterThan(0.44);
    expect(widths[2] / bar).toBeLessThan(0.48);
    await expect(composition(page).locator('div[aria-hidden="true"]')).toContainText('3');

    await field(page, 1, 'length').fill('');
    await expect(composition(page)).toHaveCount(0);
  });

  test('visualization is large, illustrative and independent of quantity', async ({ page }) => {
    await ready(page);
    await expect(
      visual(page).getByText('Illustrative dimensions — not a loading plan.', { exact: true }),
    ).toBeVisible();
    const drawing = visual(page).getByRole('img');
    expect((await drawing.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(180);
    await expect(drawing).toHaveAttribute('aria-label', /not a loading plan/);
    const shapes = () => drawing.locator('polygon').count();
    const before = await shapes();
    await field(page, 0, 'quantity').fill('1000');
    await expect(total(page)).toHaveText('60.000 m³');
    expect(await shapes()).toBe(before);
    await expect(drawing.locator('text')).toHaveText(['L 50 cm', 'W 40 cm', 'H 30 cm']);

    for (const [name, view, labels] of [
      ['Top view', 'top', ['L 50 cm', 'W 40 cm']],
      ['Front view', 'front', ['L 50 cm', 'H 30 cm']],
      ['Side view', 'side', ['W 40 cm', 'H 30 cm']],
      ['3D view', 'iso', ['L 50 cm', 'W 40 cm', 'H 30 cm']],
    ] as const) {
      const button = visual(page).getByRole('button', { name, exact: true });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(visual(page).locator(`svg[data-view="${view}"] text`)).toHaveText([...labels]);
    }
    await expect(page.locator('[data-cbm-workspace]')).not.toContainText(
      /containers? (needed|required)|will fit|fits in/i,
    );
  });

  test('a second package can be chosen for the illustration', async ({ page }) => {
    await ready(page);
    await expect(visual(page).getByLabel('Dimensions shown for')).toHaveCount(0);
    await fillShipment(page);
    const picker = visual(page).getByLabel('Dimensions shown for');
    await picker.selectOption({ label: 'Wooden Crate' });
    await expect(visual(page).getByRole('img').locator('text')).toHaveText([
      'L 120 cm',
      'W 100 cm',
      'H 180 cm',
    ]);
  });

  test('cost result is highlighted, exact and never stale', async ({ page }) => {
    await ready(page);
    await expect(cost(page)).toHaveCount(0);
    await fillShipment(page);
    await enableCost(page, '4500', { other: '2000' });
    const totalTile = cost(page).locator('[data-cost-total]');
    await expect(totalTile).toHaveText('Estimated TotalINR 2,12,600.00');
    await expect(cost(page)).toContainText('Freight (46.8 m³ × INR 4,500.00)INR 2,10,600.00');
    await expect(cost(page)).toContainText('Other chargesINR 2,000.00');
    await expect(cost(page)).toContainText('Estimate calculated');

    await page.evaluate(() => {
      const seen: string[] = [];
      Object.defineProperty(window, '__costSeen', { value: seen });
      new MutationObserver(() => {
        const cbm = document.querySelector('[data-cbm-total]')?.textContent ?? 'none';
        const shown = document.querySelector('[data-cost-total]')?.textContent ?? 'none';
        seen.push(`${cbm}|${shown}`);
      }).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    await field(page, 0, 'quantity').fill('50');
    await expect(total(page)).toHaveText('42.000 m³');
    await expect(totalTile).toHaveText('Estimated TotalINR 1,91,000.00');
    const seen = await page.evaluate(
      () => (window as unknown as { __costSeen: string[] }).__costSeen,
    );
    expect(
      seen.some((entry) => entry.endsWith('INR 2,12,600.00') && !entry.startsWith('46.800')),
    ).toBe(false);

    await page.getByLabel('Currency').selectOption('USD');
    await expect(totalTile).toHaveText('Estimated TotalUSD 191,000.00');
  });

  test('minimum charge keeps the engine semantics', async ({ page }) => {
    await ready(page);
    await enableCost(page, '100', { minimum: '1000' });
    await expect(cost(page)).toContainText('Freight (minimum charge applied)INR 1,000.00');
    await expect(cost(page)).toContainText(
      'Rate × CBM = INR 600.00, below your minimum of INR 1,000.00.',
    );
    await expect(cost(page).locator('[data-cost-total]')).toHaveText('Estimated TotalINR 1,000.00');
  });

  test('Print / Save PDF is primary and Copy Summary secondary, both for current results only', async ({
    page,
  }) => {
    await stubClipboard(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'print', {
        value: () => document.documentElement.setAttribute('data-test-printed', 'yes'),
      });
    });
    await ready(page);
    await expect(print(page)).toHaveAttribute('data-variant', 'primary');
    await expect(copy(page)).toHaveAttribute('data-variant', 'secondary');
    const [a, b] = [await print(page).boundingBox(), await copy(page).boundingBox()];
    expect(Math.abs((a?.y ?? 0) - (b?.y ?? 1))).toBeLessThan(2);
    expect(Math.abs((a?.width ?? 0) - (b?.width ?? 1))).toBeLessThan(2);
    await copy(page).click();
    await expect(page.getByRole('status').filter({ hasText: 'Summary copied.' })).toBeVisible();
    expect((await copiedTexts(page))[0]).toContain('6.000 m³');
    await print(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-test-printed', 'yes');
    await field(page, 0, 'length').fill('');
    await expect(print(page)).toBeDisabled();
    await expect(copy(page)).toBeDisabled();
  });
});

test.describe('CBM results responsive and accessible (#219 B)', () => {
  for (const width of [390, 375, 360]) {
    test(`phone ${width}px: stacked actions, 2×2 KPIs, 44px targets, no overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await ready(page);
      await fillShipment(page);
      await enableCost(page, '4500', { other: '2000' });
      await expect(cost(page).locator('[data-cost-total]')).toBeVisible();
      await noBodyOverflow(page);
      for (const section of [visual(page), summary(page), cost(page)])
        await noInternalOverflow(section);
      const [a, b] = [await print(page).boundingBox(), await copy(page).boundingBox()];
      expect((b?.y ?? 0) - (a?.y ?? 0)).toBeGreaterThan(30);
      expect(a?.width ?? 0).toBeGreaterThan(width - 80);
      const targets = [
        print(page),
        copy(page),
        visual(page).getByLabel('Dimensions shown for'),
        ...(await visual(page).getByRole('button').all()),
      ];
      for (const target of targets)
        expect((await target.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
      const tops = await summary(page)
        .locator('[data-kpi]')
        .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
      expect(new Set(tops).size).toBe(2);
      await page.screenshot({
        path: test.info().outputPath(`cbm-results-${width}.png`),
        fullPage: true,
      });
    });
  }

  for (const [width, height] of [
    [1366, 768],
    [683, 384],
    [320, 640],
  ] as const) {
    test(`no body overflow at ${width}×${height} (desktop, 200% zoom and reflow)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await ready(page);
      await fillShipment(page);
      await enableCost(page, '4500', { other: '2000' });
      await expect(cost(page).locator('[data-cost-total]')).toBeVisible();
      await noBodyOverflow(page);
      if (width === 1366)
        await page.screenshot({ path: test.info().outputPath('cbm-results-1366.png') });
    });
  }

  test('keyboard operates the views and actions with a visible focus ring', async ({ page }) => {
    await ready(page);
    const top = visual(page).getByRole('button', { name: 'Top view', exact: true });
    await top.focus();
    await page.keyboard.press('Enter');
    await expect(top).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    const front = visual(page).getByRole('button', { name: 'Front view', exact: true });
    await expect(front).toBeFocused();
    await page.keyboard.press('Space');
    await expect(front).toHaveAttribute('aria-pressed', 'true');
    const ring = (target: Locator) =>
      target.evaluate((node) => {
        const style = getComputedStyle(node);
        return `${style.outlineStyle} ${style.outlineWidth}`;
      });
    expect(await ring(front)).toBe('solid 2px');
    await page.keyboard.press('Tab');
    await expect(
      visual(page).getByRole('button', { name: 'Side view', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(print(page)).toBeFocused();
    expect(await ring(print(page))).toBe('solid 2px');
    await page.keyboard.press('Tab');
    await expect(copy(page)).toBeFocused();
    expect(await ring(copy(page))).toBe('solid 2px');
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`axe finds no violations in the B sections (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await ready(page);
      await fillShipment(page);
      await field(page, 3, 'weightPerItem').fill('');
      await enableCost(page, '100', { minimum: '1000000' });
      await expect(cost(page).locator('[data-cost-total]')).toBeVisible();
      const results = await new AxeBuilder({ page })
        .include('[data-cbm-workspace] section[aria-labelledby="cbm-visual-title"]')
        .include('[data-cbm-workspace] section[aria-labelledby="cbm-summary-title"]')
        .include('[data-cbm-workspace] section[aria-labelledby="cbm-cost-result-title"]')
        .analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    });
  }
});
