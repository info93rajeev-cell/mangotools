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
  await expect(page.getByText('8 ready recipes')).toBeVisible();
  await expect(page.getByText('10 awaiting trials')).toBeVisible();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Awaiting Trials' }).first()).toBeDisabled();
});
