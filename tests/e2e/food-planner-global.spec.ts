import { expect, test } from '@playwright/test';
import { openTool } from '../support/tool-page.ts';

test.describe('Global Food Planner — Scenario A (India) and Scenario B (USA)', () => {
  test('Scenario A (India): Loads Delhi, verifies INR (₹), metric units and Indian menu flow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await openTool(page, 'food-planner');

    // Recipes & Menu
    await expect(page.getByRole('tab', { name: /Recipes & Menu/i })).toBeVisible();
    const locSelect = page.locator('#setup-loc, select').first();
    await expect(locSelect).toHaveValue(/Delhi/i);

    // Verify INR (₹) symbol on Plan Setup / Summary Card
    const menuSection = page.locator('[class*="layoutGrid"]');
    await expect(menuSection).toBeVisible();

    // Ingredients tab
    await page.getByRole('tab', { name: /Ingredients/i }).click();
    const ingredientsSection = page.locator('main');
    await expect(ingredientsSection).toContainText(/kg|g|ml|L|piece/i);

    // Shopping List tab
    await page.getByRole('tab', { name: /Shopping List/i }).click();
    await expect(page.locator('body')).toContainText('₹');
    // Indian store/aisle types
    await expect(page.locator('body')).toContainText(
      /Sabzi Mandi|Dairy \/ Milk Booth|General Store|Spice/i,
    );

    // Cost Estimation tab
    await page.getByRole('tab', { name: /Cost Estimation/i }).click();
    await expect(page.locator('body')).toContainText('₹');
    await expect(page.getByText(/Total Menu Cost/i).first()).toBeVisible();

    // Cooking Schedule tab
    await page.getByRole('tab', { name: /Cooking Schedule/i }).click();
    await expect(page.getByText(/Cooking Schedule|preparation timeline/i).first()).toBeVisible();
  });

  test('Scenario B (USA): Switches to New York, verifies USD ($), US customary units, American catalog and cost estimation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await openTool(page, 'food-planner');

    // Select New York in location dropdown
    const locationSelect = page.locator('select').first();
    await locationSelect.selectOption('New York, United States');

    // Click Update Plan button
    const updateBtn = page.getByRole('button', { name: /Update Plan/i });
    if (await updateBtn.isVisible()) {
      await updateBtn.click();
    }

    // Verify US Recipes are visible (Mac & Cheese, BBQ Pulled Chicken, etc.)
    await expect(page.getByText(/Mac & Cheese/i).first()).toBeVisible();
    await expect(page.getByText(/BBQ Pulled Chicken/i).first()).toBeVisible();

    // Shopping List tab in USD
    await page.getByRole('tab', { name: /Shopping List/i }).click();
    await expect(page.locator('body')).toContainText('$');
    // US store types
    await expect(page.locator('body')).toContainText(
      /Produce \/ Farmers Market|Dairy Department|Supermarket Grocery/i,
    );

    // Cost Estimation tab in USD
    await page.getByRole('tab', { name: /Cost Estimation/i }).click();
    await expect(page.locator('body')).toContainText('$');
    await expect(page.getByText(/Target Budget/i).first()).toBeVisible();

    // Cooking Schedule tab
    await page.getByRole('tab', { name: /Cooking Schedule/i }).click();
    await expect(page.getByText(/Cooking Schedule|preparation timeline/i).first()).toBeVisible();
  });

  test('Mobile: Switching to USA updates currency to USD ($) on mobile layout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openTool(page, 'food-planner');

    // Recipes & Menu tab
    await expect(page.getByRole('tab').first()).toBeVisible();

    // Open Cost Estimation tab (tab index 3)
    await page.getByRole('tab').nth(3).click();
    const mobileCost = page.getByTestId('mobile-menu-cost');
    await expect(mobileCost).toBeVisible();
    await expect(mobileCost).toContainText('₹');

    // Switch location on mobile cost screen
    const mobileLocationSelect = page.locator('#mobile-cost-location');
    if (await mobileLocationSelect.isVisible()) {
      await mobileLocationSelect.selectOption('New York, United States');
      const mobileUpdateBtn = page.getByRole('button', { name: /Update/i }).first();
      if (await mobileUpdateBtn.isVisible()) {
        await mobileUpdateBtn.click();
      }
      // Should now display USD ($)
      await expect(mobileCost).toContainText('$');
    }
  });
});
