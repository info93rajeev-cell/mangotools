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
    await expect(details).toContainText('Wash aged long-grain basmati rice');
    await expect(details.getByRole('link', { name: /Ranveer Brar/ })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=kYJ6gVlFw8c',
    );
    await page.screenshot({ path: test.info().outputPath('recipe-detail.png') });
    await details.getByRole('button', { name: 'Close recipe' }).click();
    await expect(details).not.toBeVisible();
  });
}

test('gallery presents all recipes ready with video tutorial and pro tips', async ({ page }) => {
  await openTool(page, 'food-planner');
  await expect(page.getByText(/ready recipes/)).toBeVisible();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'View recipe: Masala Chai' }).click();
  const details = page.getByRole('dialog', { name: 'Masala Chai' });
  await expect(details).toBeVisible();
  await expect(details.getByRole('link', { name: /Watch Video Tutorial/ })).toBeVisible();
  await expect(details).toContainText("Chef's Secrets & Practical Tips");
  await details.getByRole('button', { name: 'Close recipe' }).click();
  await expect(details).not.toBeVisible();
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
  test(`recipe illustrations load at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 941 });
    await openTool(page, 'food-planner');
    if (width < 600) {
      await page.getByRole('button', { name: 'All Recipes', exact: true }).click();
    }
    const pagesAndIds = [
      [2, ['samosa', 'paneer-tikka', 'pakoda']],
      [3, ['chana-masala', 'masala-chai']],
    ] as const;
    for (const [pageNumber, ids] of pagesAndIds) {
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
