import { expect, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

for (const width of [390, 1672]) {
  test(`recipe details expose scaled ingredients and steps at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 941 });
    await openTool(page, 'food-planner');
    if (width < 600) {
      await page.getByRole('spinbutton', { name: 'Jeera Rice portion factor' }).fill('1.5');
      await page.getByRole('button', { name: 'All Recipes', exact: true }).click();
    }
    await page.getByRole('button', { name: 'View recipe: Jeera Rice' }).click();
    const details = page.getByRole('dialog', { name: 'Jeera Rice' });
    await expect(details).toBeVisible();
    await expect(details).toContainText('Basmati rice');
    await expect(details).toContainText(width < 600 ? '1.5 kg' : '1 kg');
    await expect(details).toContainText('Rinse the rice');
    await expect(details.getByRole('link', { name: /Cup of Yum/ })).toHaveAttribute(
      'href',
      'https://cupofyum.com/recipes/jeera-rice-indian-cumin-rice',
    );
    await page.screenshot({ path: test.info().outputPath('recipe-detail.png') });
    await details.getByRole('button', { name: 'Close recipe' }).click();
    await expect(details).not.toBeVisible();
  });
}

test('gallery distinguishes ready recipes from pending trials', async ({ page }) => {
  await openTool(page, 'food-planner');
  await expect(page.getByText('13 ready recipes')).toBeVisible();
  await expect(page.getByText('5 awaiting trials')).toBeVisible();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Awaiting Trials' }).first()).toBeDisabled();
});

test('festival sweet selection reaches ingredients, shopping, cost and schedule', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'food-planner');
  await page.getByRole('button', { name: 'All Recipes', exact: true }).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page
    .locator('[class*="recipeCard"]')
    .filter({ has: page.getByRole('heading', { name: 'Gulab Jamun', exact: true }) })
    .getByRole('button', { name: 'Add', exact: true })
    .click();
  await page.getByRole('tab').nth(1).click();
  const ingredients = page.getByTestId('mobile-ingredients');
  await ingredients.getByRole('searchbox').fill('Whole milk powder');
  await expect(ingredients).toContainText('Whole milk powder');
  await page.getByRole('tab').nth(2).click();
  const shopping = page.getByTestId('mobile-shopping');
  await shopping.getByRole('button', { name: /^Dairy & Paneer/ }).click();
  await expect(shopping).toContainText('Whole milk powder');
  await page.getByRole('tab').nth(3).click();
  await expect(page.getByTestId('mobile-cost')).toContainText('Gulab Jamun');
  await page.getByRole('tab').nth(4).click();
  await expect(page.getByTestId('mobile-schedule')).toContainText('Gulab Jamun');
});

for (const width of [390, 1672]) {
  test(`pending recipe illustrations load at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 941 });
    await openTool(page, 'food-planner');
    if (width < 600) {
      await page.getByRole('button', { name: 'All Recipes', exact: true }).click();
    }
    const pendingIds = ['samosa', 'paneer-tikka', 'pakoda', 'chana-masala', 'masala-chai'];
    for (const [pageNumber, ids] of [
      [2, pendingIds.slice(0, 3)],
      [3, pendingIds.slice(3)],
    ] as const) {
      await page.getByRole('button', { name: String(pageNumber), exact: true }).click();
      for (const id of ids) {
        const image = page.locator(`[data-testid="recipe-image-${id}"] img:visible`);
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute('src', `/food/recipes/${id}.jpg`);
        await expect(image).toHaveJSProperty('complete', true);
        expect(
          await image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
        ).toBeGreaterThan(0);
        await expect(image).toHaveAttribute('alt', /AI-generated illustration/);
      }
    }
    await page.screenshot({ path: test.info().outputPath('pending-recipes.png'), fullPage: true });
  });
}

test('festival sweet recipe details show beginner phase titles and ingredient notes', async ({
  page,
}) => {
  await openTool(page, 'food-planner');
  await page.getByRole('button', { name: /Sweets/ }).click();
  await page.getByRole('button', { name: 'View recipe: Besan Ladoo' }).click();
  const details = page.getByRole('dialog', { name: 'Besan Ladoo' });
  await expect(details).toBeVisible();
  await expect(details).toContainText('Coarse besan');
  await expect(details).toContainText('[तैयारी व कड़ाही का चुनाव]');
  await expect(details).toContainText('[दानेदार बनावट का रहस्य]');
  await details.getByRole('button', { name: 'Close recipe' }).click();
  await expect(details).not.toBeVisible();
});
