import { expect, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

test('personal recipes use the same quantity, cost and schedule engines', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'food-planner');
  await page.getByRole('button', { name: 'My Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Create Recipe', exact: true }).click();
  const form = page.getByTestId('personal-recipe-form');
  await form.getByLabel('Recipe name').fill('Family rice');
  await form.getByLabel('Base servings').fill('4');
  await form.getByLabel('Preparation minutes').fill('10');
  await form.getByLabel('Cooking minutes').fill('20');
  await form.getByLabel('Ingredient 1', { exact: true }).selectOption('basmati-rice');
  await form.getByLabel('Quantity 1', { exact: true }).fill('200');
  await form.getByLabel('Instructions').fill('Wash the rice and cook until tender.');
  await form.getByRole('button', { name: 'Save Recipe', exact: true }).click();
  await expect(page.getByTestId('personal-recipes')).toContainText('Family rice');
  await page.getByRole('button', { name: 'Add to menu: Family rice', exact: true }).click();
  await page.getByRole('tab').nth(1).click();
  const ingredients = page.getByTestId('mobile-ingredients');
  await ingredients.getByRole('searchbox').fill('Basmati');
  await expect(ingredients).toContainText('2.00 kg');
  await page.getByRole('tab').nth(4).click();
  const schedule = page.getByTestId('mobile-schedule');
  await expect(schedule).toContainText('Family rice');
  await schedule
    .getByRole('checkbox', { name: /Family rice.*Done/ })
    .first()
    .check();
  await page.getByRole('tab').first().click();
  await page.getByRole('button', { name: 'My Recipes', exact: true }).click();
  await page
    .getByTestId('personal-recipes')
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  await page.getByTestId('personal-recipe-form').getByLabel('Preparation minutes').fill('15');
  await page
    .getByTestId('personal-recipe-form')
    .getByRole('button', { name: 'Save Recipe', exact: true })
    .click();
  await page.getByRole('tab').nth(4).click();
  await expect(
    schedule.getByRole('checkbox', { name: /Family rice.*Done/ }).first(),
  ).not.toBeChecked();
  await page.getByRole('tab').first().click();
  await page.getByRole('button', { name: 'My Recipes', exact: true }).click();
  await page.getByRole('button', { name: 'Remove: Family rice', exact: true }).click();
  await page.getByRole('tab').nth(4).click();
  await expect(schedule).not.toContainText('Family rice');
});

test('inventory import validates canonical IDs and custom category labels stay shared', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'food-planner');
  await page.getByRole('tab').nth(1).click();
  const ingredients = page.getByTestId('mobile-ingredients');
  await ingredients.getByRole('button', { name: 'Import / Export', exact: true }).click();
  const transfer = page.getByTestId('inventory-transfer');
  await transfer
    .getByLabel('Inventory CSV', { exact: true })
    .fill('ingredient,required,stock,price\nbasmati-rice,2000,500,100');
  await transfer.getByRole('button', { name: 'Import CSV', exact: true }).click();
  await expect(transfer.getByRole('status')).toContainText('1');
  await ingredients.getByRole('button', { name: 'Add Category', exact: true }).click();
  const categories = page.getByTestId('inventory-categories');
  await categories.getByLabel('Category name').fill('__proto__');
  await categories.getByRole('button', { name: 'Save Category', exact: true }).click();
  await expect(categories.getByRole('alert')).toBeVisible();
  await categories.getByLabel('Category name').fill('My pantry');
  await categories.getByLabel('Ingredient').selectOption('basmati-rice');
  await categories.getByRole('button', { name: 'Save Category', exact: true }).click();
  await ingredients.getByText('More', { exact: true }).click();
  await expect(ingredients.getByRole('button', { name: /^My pantry/ })).toBeInViewport({
    ratio: 1,
  });
  await page.getByRole('tab').nth(2).click();
  await expect(
    page.getByTestId('mobile-shopping').getByRole('button', { name: /^My pantry/ }),
  ).toBeVisible();
});

test('mobile overhead summary opens a working editor and updates actual totals', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'food-planner');
  await page.getByRole('tab').nth(3).click();
  const cost = page.getByTestId('mobile-cost');
  await cost.getByRole('button', { name: 'Edit Other Costs', exact: true }).click();
  await cost.getByLabel('Cooking Fuel (Gas/Induction)', { exact: true }).uncheck();
  await expect(
    cost.getByText('Other Cost', { exact: true }).locator('..').locator('p').last(),
  ).toHaveText('₹278.00');
  await cost.getByRole('button', { name: 'Edit Other Costs', exact: true }).click();
  await expect(cost.getByRole('button', { name: 'Edit Other Costs', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('mobile In Stock filter uses pantry quantities rather than shopping checkmarks', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'food-planner');
  await page.getByRole('tab').nth(1).click();
  const ingredients = page.getByTestId('mobile-ingredients');
  await ingredients.getByRole('searchbox').fill('Basmati');
  await ingredients.getByRole('button', { name: /^Edit:/ }).click();
  const editor = ingredients.getByRole('group');
  await editor.getByLabel(/Required/).fill('1');
  await editor.getByLabel(/Stock quantity/).fill('1');
  await editor.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('tab').nth(2).click();
  const shopping = page.getByTestId('mobile-shopping');
  await shopping.getByRole('button', { name: 'In Stock', exact: true }).click();
  await shopping.getByRole('button', { name: /^Pulses & Grains/ }).click();
  const rice = shopping.locator('[class*="mobileDishItem"]').filter({ hasText: 'Basmati rice' });
  await expect(rice).toContainText('1.00 kg');
  await expect(rice).toContainText('₹0.00');
  await expect(rice.getByRole('checkbox')).toBeDisabled();
  await shopping.getByRole('button', { name: 'To Buy', exact: true }).click();
  await expect(rice).toHaveCount(0);
});
