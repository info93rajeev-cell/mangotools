import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { gotoReady } from '../support/tool-page.ts';

const OUT = join(process.cwd(), 'tests/artifacts/screenshots');
mkdirSync(OUT, { recursive: true });

const rows = (page: Page) => page.locator('[data-rows-harness]');
const open = async (page: Page) => {
  await gotoReady(page, '/_dev/components');
  await expect(rows(page)).toBeVisible();
};

test('repeatable rows edit every primitive kind and preserve exact strings', async ({ page }) => {
  await open(page);
  const harness = rows(page);
  await expect(harness.locator('[data-row]')).toHaveCount(1);
  await harness.getByLabel('Description').fill('Handling');
  await harness.getByLabel('Quantity').fill('02');
  await harness.getByLabel('Amount').fill('001.50');
  await harness.getByLabel('Rate').fill('7.00');
  await harness.getByLabel('Charge mode').selectOption('percent');
  const value = JSON.parse((await harness.getAttribute('data-rows-value')) ?? '[]');
  expect(value[0]).toEqual({
    description: 'Handling',
    quantity: '02',
    amount: '001.50',
    rate: '7.00',
    mode: 'percent',
  });
  await harness.getByLabel('Rate').fill('');
  expect((await harness.getAttribute('data-rows-value')) ?? '').toContain('"rate":""');
  await harness.getByRole('button', { name: 'Reset rows' }).click();
  await expect(harness).toHaveAttribute('data-rows-value', '');
  await expect(harness.locator('[data-row]')).toHaveCount(1);
});

test('repeatable rows enforce limits, order, and deterministic keyboard focus', async ({
  page,
}) => {
  await open(page);
  const harness = rows(page);
  await harness.getByLabel('Description').fill('A');
  await harness.getByRole('button', { name: 'Add fee line' }).click();
  await expect(harness.getByLabel('Description').nth(1)).toBeFocused();
  await harness.getByLabel('Description').nth(1).fill('B');
  await harness.getByRole('button', { name: 'Add fee line' }).click();
  await expect(harness.getByLabel('Description').nth(2)).toBeFocused();
  await harness.getByLabel('Description').nth(2).fill('C');
  await expect(harness.getByRole('button', { name: 'Add fee line' })).toBeDisabled();
  await harness.getByRole('button', { name: 'Remove Fee line 2' }).click();
  await expect(harness.getByRole('button', { name: 'Remove Fee line 2' })).toBeFocused();
  const afterMiddle = JSON.parse((await harness.getAttribute('data-rows-value')) ?? '[]');
  expect(afterMiddle.map((row: { description: string }) => row.description)).toEqual(['A', 'C']);
  await harness.getByRole('button', { name: 'Remove Fee line 2' }).click();
  await expect(harness.getByRole('button', { name: 'Add fee line' })).toBeFocused();
  await expect(harness.locator('[data-row]')).toHaveCount(1);
  await expect(harness.getByRole('button', { name: 'Remove Fee line 1' })).toBeDisabled();
});

test('repeatable rows remain labelled, unique, accessible, and responsive', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await open(page);
  const harness = rows(page);
  await harness.getByRole('button', { name: 'Add fee line' }).click();
  await expect(harness.getByRole('group', { name: 'Fee line 2' })).toBeVisible();
  const ids = await harness.locator('[id]').evaluateAll((elements) => elements.map((e) => e.id));
  expect(new Set(ids).size).toBe(ids.length);
  expect(
    (await new AxeBuilder({ page }).include('[data-dev-rows-section]').analyze()).violations,
  ).toEqual([]);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page
    .locator('[data-dev-rows-section]')
    .screenshot({ path: join(OUT, 'platform-rows-desktop.png') });
  await page.setViewportSize({ width: 360, height: 800 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page
    .locator('[data-dev-rows-section]')
    .screenshot({ path: join(OUT, 'platform-rows-mobile.png') });
});
