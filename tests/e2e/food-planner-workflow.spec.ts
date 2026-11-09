import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

test('mobile plan quantities, prices, purchases and task completion stay connected', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'food-planner');
  await page.getByRole('tab').nth(3).click();
  const cost = page.getByTestId('mobile-menu-cost');
  await expect(cost).not.toHaveText('₹378.00');
  const initial = await cost.innerText();
  await page.locator('#mobile-cost-guests').selectOption('10');
  await expect(cost).not.toHaveText(initial);
  await page.getByRole('tab').nth(1).click();
  const ingredients = page.getByTestId('mobile-ingredients');
  await ingredients.getByRole('searchbox').fill('Basmati');
  await ingredients.getByRole('button', { name: /^Edit:/ }).click();
  const editor = ingredients.getByRole('group');
  await editor.getByLabel(/Required/).fill('2000');
  await editor.getByLabel(/Stock quantity/).fill('500');
  await editor.getByLabel(/Your price/).fill('100');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(ingredients).toContainText('Required: 2.00 kg');
  await page.getByRole('tab').nth(2).click();
  const shopping = page.getByTestId('mobile-shopping');
  await shopping.getByRole('button', { name: /^Pulses & Grains/ }).click();
  const rice = shopping.locator('[class*="mobileDishItem"]').filter({ hasText: /Basmati rice/i });
  await expect(rice).toContainText('1.50 kg');
  await expect(rice).toContainText('₹150.00');
  const shoppingTotal = await shopping
    .getByText('Est. Total Cost', { exact: true })
    .locator('..')
    .locator('p')
    .last()
    .innerText();
  await page.getByRole('tab').nth(3).click();
  await expect(
    page
      .getByTestId('mobile-cost')
      .getByText('Total Ingredient Cost', { exact: true })
      .locator('..')
      .locator('p')
      .last(),
  ).toHaveText(shoppingTotal);
  await page.getByRole('tab').nth(2).click();
  await shopping.getByRole('button', { name: /^Pulses & Grains/ }).click();
  await rice.getByRole('button').click();
  await expect(rice.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab').nth(4).click();
  const schedule = page.getByTestId('mobile-schedule');
  const firstTask = schedule.locator('[class*="mobileAccordionBody"] input[type=checkbox]').first();
  await firstTask.check();
  await expect(firstTask).toBeChecked();
  await schedule.getByRole('button', { name: 'Add Task', exact: true }).click();
  const form = schedule.locator('form');
  await form.getByLabel('Task / Preparation').fill('Set dining table');
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(schedule.getByText('Set dining table', { exact: true })).toBeVisible();
  await page.getByRole('tab').nth(2).click();
  await page.getByRole('tab').nth(4).click();
  await expect(schedule.getByText('Set dining table', { exact: true })).toBeVisible();
});

for (const width of [360, 390, 430, 1600]) {
  test(`all five screens fit ${width}px and load their images`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1600 ? 900 : 844 });
    await openTool(page, 'food-planner');
    await page.getByRole('tab').first().waitFor();
    await expect(page.locator('[data-fullscreen-toggle]')).toBeInViewport();
    for (let index = 0; index < 5; index++) {
      await page.getByRole('tab').nth(index).click();
      await expect(page.getByRole('tab').nth(index)).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(350);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
      expect(
        await page
          .locator('main button:visible')
          .evaluateAll((buttons) =>
            buttons
              .filter((button) => button.getBoundingClientRect().right > innerWidth + 0.5)
              .map((button) => button.textContent?.trim()),
          ),
      ).toEqual([]);
      expect(
        await page
          .locator('img:visible')
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      ).toBe(true);
      if (width === 390 || width === 1600)
        await page.screenshot({
          path: testInfo.outputPath(`${width}-${index}.png`),
          fullPage: true,
        });
    }
  });
}

for (const width of [390, 1600]) {
  test(`all five screens have no serious accessibility violations at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await openTool(page, 'food-planner');
    for (let index = 0; index < 5; index++) {
      await page.getByRole('tab').nth(index).click();
      const result = await new AxeBuilder({ page })
        .include('[data-tool-island="food-planner"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        result.violations
          .filter((item) => item.impact === 'serious' || item.impact === 'critical')
          .map(
            (item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(', ')}`,
          ),
      ).toEqual([]);
    }
  });
}

test('desktop shopping edits preserve pantry stock and selected cost rows export', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await openTool(page, 'food-planner');
  await page.getByRole('tab').nth(1).click();
  const circle = page
    .getByRole('img', { name: 'Category Breakdown Donut Chart' })
    .locator('circle')
    .first();
  await expect(circle).toHaveCSS('stroke-width', '14px');
  await page.getByRole('textbox', { name: 'Search ingredient', exact: true }).fill('Basmati');
  await page.getByRole('button', { name: /^Edit Basmati/ }).click();
  const editor = page.getByRole('group');
  await editor.getByLabel(/Required/).fill('2');
  await editor.getByLabel(/Stock quantity/).fill('0.5');
  await editor.getByLabel(/Your price/).fill('100');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('tab').nth(2).click();
  const row = page
    .getByRole('table', { name: 'Consolidated Shopping List Table' })
    .getByRole('row')
    .filter({ hasText: /Basmati rice/i });
  await expect(row).toContainText('1.50');
  await expect(row).toContainText('₹150');
  await row.getByRole('button', { name: /^Increase buy quantity/ }).click();
  await expect(row).toContainText('1.75');
  await expect(row).toContainText('₹175');
  await page.getByRole('tab').nth(3).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected rows', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('food-planner-costs.csv');
});
