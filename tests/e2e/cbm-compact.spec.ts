import { expect, type Page, test } from '@playwright/test';
import { copiedTexts, openTool, stubClipboard } from '../support/tool-page.ts';

const total = (page: Page) => page.locator('[data-cbm-total]');
const rows = (page: Page) => page.locator('[data-package-row]');
const field = (page: Page, index: number, key: string) =>
  rows(page).nth(index).locator(`[id$="-${key}"]`);
const summary = (page: Page) => page.getByRole('region', { name: 'Results Summary' });
const cost = (page: Page) => page.getByRole('region', { name: 'Estimated freight cost' });

async function ready(page: Page) {
  await openTool(page, 'cbm-calculator');
  await expect(total(page)).toHaveText('6.000 m³');
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => innerWidth),
  );
}

async function checkShell(page: Page, width: number) {
  const visualization = page.getByRole('region', { name: 'Shipment Visualization' });
  if (width === 1366) {
    const right = await visualization.boundingBox();
    expect(right?.width).toBeGreaterThanOrEqual(420);
    expect(right?.width).toBeLessThanOrEqual(440);
    await expect(page.locator('[data-cbm-worksheet-header]')).toBeVisible();
    return;
  }
  const options = page.getByRole('region', { name: 'Units & Display Options' });
  expect((await options.boundingBox())?.y).toBeLessThan(
    (await visualization.boundingBox())?.y ?? 0,
  );
  expect((await visualization.boundingBox())?.y).toBeLessThan(
    (await summary(page).boundingBox())?.y ?? 0,
  );
}

test.describe('Active CBM shipment workspace', () => {
  test('desktop worksheet text and actions fit within the row', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await ready(page);
    const header = page.locator('[data-cbm-worksheet-header]');
    expect(
      await header.evaluate((n) => Number.parseFloat(getComputedStyle(n).fontSize)),
    ).toBeGreaterThanOrEqual(12);
    expect(
      await field(page, 0, 'length').evaluate((n) =>
        Number.parseFloat(getComputedStyle(n).fontSize),
      ),
    ).toBeGreaterThanOrEqual(12);
    const row = rows(page).first();
    expect(await row.evaluate((n) => n.scrollWidth - n.clientWidth)).toBeLessThanOrEqual(0);
    const bounds = await row.boundingBox();
    const remove = await page
      .getByRole('button', { name: 'Delete Package 1', exact: true })
      .boundingBox();
    expect((remove?.x ?? 0) + (remove?.width ?? 0)).toBeLessThanOrEqual(
      (bounds?.x ?? 0) + (bounds?.width ?? 0),
    );
  });

  test('mobile summaries collapse editors and new or invalid rows open automatically', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await ready(page);
    await expect(field(page, 0, 'length')).toBeHidden();
    await expect(rows(page).first()).toContainText('50 × 40 × 30 cm');
    await page.getByRole('button', { name: 'Edit Package 1', exact: true }).click();
    await expect(field(page, 0, 'length')).toBeVisible();
    await field(page, 0, 'length').fill('');
    await expect(field(page, 0, 'length')).toBeVisible();
    await page.getByRole('button', { name: 'Add Package', exact: true }).click();
    await expect(field(page, 1, 'description')).toBeVisible();
    for (const button of await rows(page).first().getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('cost basis and currency rate adornments are real labelled controls', async ({ page }) => {
    await ready(page);
    await page.getByLabel('Enable cost estimate').check();
    await expect(page.getByLabel('Rate basis', { exact: true })).toHaveValue('Per CBM (m³)');
    await expect(page.getByLabel('Rate basis', { exact: true })).toHaveAttribute('readonly');
    await expect(page.locator('[data-cbm-rate-prefix]')).toHaveText('₹');
    await expect(page.locator('[data-cbm-rate-suffix]')).toHaveText('/ m³');
    await page.getByLabel('Currency', { exact: true }).selectOption('USD');
    await expect(page.locator('[data-cbm-rate-prefix]')).toHaveText('USD');
  });

  test('activates shipment results and keeps support sections collapsed', async ({ page }) => {
    await ready(page);
    await expect(page.locator('[data-cbm-workspace]')).toBeVisible();
    await expect(page.locator('[data-input-panel], [data-output="cbmPerCarton"]')).toHaveCount(0);
    await expect(summary(page)).toContainText('211.888 ft³');
    await expect(summary(page)).toContainText('100');
    await expect(summary(page)).toContainText('Not provided');
    await expect(page.getByRole('region', { name: 'Load Composition by Package' })).toContainText(
      '100.0%',
    );
    for (const item of await page.locator('details[data-tool-content-section]').all())
      await expect(item).not.toHaveAttribute('open');
    await expect(
      page.getByText('Important Notes / Warnings', { exact: true }).locator('..'),
    ).not.toHaveAttribute('open');
    await expect(
      page.getByText('Illustrative dimensions — not a loading plan.', { exact: true }),
    ).toBeVisible();
  });

  test('adds mixed packages, duplicates independently, deletes and clears', async ({ page }) => {
    await ready(page);
    await page.getByRole('button', { name: 'Add Package', exact: true }).click();
    await expect(rows(page)).toHaveCount(2);
    await field(page, 1, 'unit').selectOption('m');
    for (const key of ['length', 'width', 'height']) await field(page, 1, key).fill('1');
    await expect(total(page)).toHaveText('7.000 m³');
    await expect(summary(page)).toContainText('101');
    await page.getByRole('button', { name: 'Duplicate Package 2', exact: true }).click();
    await expect(total(page)).toHaveText('8.000 m³');
    await field(page, 2, 'length').fill('2');
    await expect(total(page)).toHaveText('9.000 m³');
    await page.getByRole('button', { name: 'Delete Package 3', exact: true }).click();
    await expect(total(page)).toHaveText('7.000 m³');
    await page.getByRole('button', { name: 'Clear All', exact: true }).click();
    await expect(rows(page)).toHaveCount(1);
    await expect(field(page, 0, 'length')).toHaveValue('');
    await expect(total(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Copy Summary', exact: true })).toBeDisabled();
  });

  test('supports mm/cm/m/in/ft without changing physical volume', async ({ page }) => {
    await ready(page);
    for (const unit of ['mm', 'cm', 'm', 'in', 'ft']) {
      await field(page, 0, 'unit').selectOption(unit);
      await expect(total(page)).toHaveText('6.000 m³');
    }
  });

  test('distinguishes none, partial and complete packed weight', async ({ page }) => {
    await ready(page);
    await expect(summary(page)).toContainText('Not provided');
    await page.getByRole('button', { name: 'Duplicate Package 1', exact: true }).click();
    await field(page, 0, 'weightPerItem').fill('2');
    await expect(summary(page)).toContainText('Known packed weight (partial)');
    await expect(summary(page)).toContainText('200.000 kg');
    await field(page, 1, 'weightUnit').selectOption('g');
    await field(page, 1, 'weightPerItem').fill('1000');
    await expect(summary(page)).toContainText('300.000 kg');
    await expect(summary(page)).not.toContainText('partial');
  });

  test('prices exact CBM and rejects stale cost after shipment edits', async ({ page }) => {
    await ready(page);
    for (const key of ['length', 'width', 'height']) await field(page, 0, key).fill('1');
    await field(page, 0, 'quantity').fill('1');
    await expect(total(page)).toHaveText('0.000 m³');
    await page.getByLabel('Enable cost estimate').check();
    await page.getByLabel('Freight rate', { exact: true }).fill('1000000');
    await expect(cost(page)).toContainText('INR 1.00');
    await field(page, 0, 'length').fill('');
    await expect(total(page)).toHaveCount(0);
    await expect(cost(page)).not.toContainText('INR 1.00');
    await field(page, 0, 'length').fill('2');
    await expect(cost(page)).toContainText('INR 2.00');
    await page.getByLabel('Enable cost estimate').uncheck();
    await expect(cost(page)).toHaveCount(0);
  });

  test('copies current worksheet and exposes browser print', async ({ page }) => {
    await stubClipboard(page);
    await ready(page);
    await field(page, 0, 'description').fill('Private SKU');
    await expect(total(page)).toBeVisible();
    await page.getByRole('button', { name: 'Copy Summary', exact: true }).click();
    expect((await copiedTexts(page))[0]).toContain('Private SKU');
    expect((await copiedTexts(page))[0]).toContain('6.000 m³');
    await page.evaluate(() => {
      window.print = () => document.documentElement.setAttribute('data-test-printed', 'yes');
    });
    await page.getByRole('button', { name: 'Print / Save PDF', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-test-printed', 'yes');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-cbm-workspace] pre')).toBeVisible();
  });

  for (const width of [1366, 360, 375, 390]) {
    test(`active layout has no overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1366 ? 768 : 800 });
      await ready(page);
      await noOverflow(page);
      await checkShell(page, width);
      if (width < 700) {
        await page.getByRole('button', { name: 'Edit Package 1', exact: true }).click();
        const length = await field(page, 0, 'length').boundingBox();
        const widthField = await field(page, 0, 'width').boundingBox();
        expect(length).toBeTruthy();
        expect(widthField).toBeTruthy();
        expect(Math.abs((length?.y ?? 0) - (widthField?.y ?? 0))).toBeLessThanOrEqual(1);
        expect((length?.x ?? 0) + (length?.width ?? 0)).toBeLessThan(widthField?.x ?? 0);
        expect(
          await field(page, 0, 'length').evaluate((node) => node.getBoundingClientRect().height),
        ).toBeGreaterThanOrEqual(44);
      }
      await page.screenshot({
        path: test.info().outputPath(`cbm-active-${width}.png`),
        fullPage: true,
      });
      await page.getByLabel('Enable cost estimate').check();
      await page.getByLabel('Freight rate', { exact: true }).fill('100');
      await expect(cost(page)).toContainText('INR 600.00');
      await noOverflow(page);
    });
  }
});
