import { expect, test } from '@playwright/test';
import { island, openTool } from '../support/tool-page.ts';

const EXPECTED_RECIPES = [
  { id: 'jeera-rice', name: 'Jeera Rice / जीरा राइस', file: 'jeera-rice.jpg', course: 'rice' },
  { id: 'dal-tadka', name: 'Dal Tadka / दाल तड़का', file: 'dal-tadka.jpg', course: 'dal' },
  { id: 'aloo-gobi', name: 'Aloo Gobi / आलू गोभी', file: 'aloo-gobi.jpg', course: 'side' },
  {
    id: 'besan-ladoo',
    name: 'Besan Ladoo / बेसन के लड्डू',
    file: 'besan-ladoo.jpg',
    course: 'dessert',
  },
  { id: 'mathri', name: 'Khasta Mathri / खस्ता मठरी', file: 'mathri.jpg', course: 'snack' },
  {
    id: 'shahi-paneer',
    name: 'Shahi Paneer / शाही पनीर',
    file: 'shahi-paneer.jpg',
    course: 'main',
  },
  { id: 'raita', name: 'Mixed Veg / Boondi Raita / रायता', file: 'raita.jpg', course: 'side' },
  {
    id: 'mixed-veg-salad',
    name: 'Kachumber Salad / कचुम्बर सलाद',
    file: 'mixed-veg-salad.jpg',
    course: 'side',
  },
] as const;

test.describe('Food Planner Recipe Images & Fallbacks', () => {
  test('all 8 recipe card images load successfully with HTTP 200, valid dimensions and synthetic disclaimers', async ({
    page,
  }) => {
    const loadedImages: { url: string; status: number; contentType: string }[] = [];
    const failedUrls: string[] = [];

    // Track all image network responses
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/food/recipes/')) {
        loadedImages.push({
          url,
          status: response.status(),
          contentType: response.headers()['content-type'] ?? '',
        });
        if (response.status() >= 400) {
          failedUrls.push(`${url} (status ${response.status()})`);
        }
      }
    });

    // Track any network load aborts/failures
    page.on('requestfailed', (request) => {
      if (request.url().includes('/food/recipes/')) {
        failedUrls.push(`${request.url()} (${request.failure()?.errorText})`);
      }
    });

    await openTool(page, 'food-planner');
    const planner = island(page, 'food-planner');
    await expect(planner).toBeVisible();

    // Verify all 8 recipe cards are rendered
    const cards = planner.locator('[data-testid^="recipe-image-"]');
    await expect(cards).toHaveCount(8);

    // Verify no recipe image requests failed
    expect(failedUrls, `Some recipe images failed to fetch: ${failedUrls.join(', ')}`).toEqual([]);

    for (const recipe of EXPECTED_RECIPES) {
      const holder = planner.locator(`[data-testid="recipe-image-${recipe.id}"]`);
      await expect(holder).toBeVisible();

      const img = holder.locator('img');
      await expect(img).toBeVisible();

      // Check src attribute matches expected static path
      const src = await img.getAttribute('src');
      expect(src).toBe(`/food/recipes/${recipe.file}`);

      // Check alt text
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();

      // Rule 5: Explicit synthetic visual preview disclosure in title/tooltip
      const title = await img.getAttribute('title');
      expect(title).toContain('(AI-generated visual preview)');

      // Verify that browser successfully decoded the image and natural dimensions are non-zero
      const imageLoaded = await img.evaluate((el: HTMLImageElement) => {
        return el.complete && el.naturalWidth > 0 && el.naturalHeight > 0;
      });
      expect(
        imageLoaded,
        `Image for ${recipe.id} (${recipe.file}) should have decoded with natural dimensions > 0`,
      ).toBe(true);

      const dimensions = await img.evaluate((el: HTMLImageElement) => ({
        width: el.naturalWidth,
        height: el.naturalHeight,
      }));
      // Sized to 600x448 high-DPI assets
      expect(dimensions.width).toBe(600);
      expect(dimensions.height).toBe(448);
    }

    // Confirm all 8 HTTP network responses were 200 OK with image/jpeg
    expect(loadedImages.length).toBeGreaterThanOrEqual(8);
    for (const loaded of loadedImages) {
      expect(loaded.status).toBe(200);
      expect(loaded.contentType).toContain('image/jpeg');
    }
  });

  test('fallback placeholder renders gracefully when recipe image fails to load', async ({
    page,
  }) => {
    await openTool(page, 'food-planner');
    const planner = island(page, 'food-planner');

    // Target the first recipe card image and dispatch an synthetic error event to trigger fallback state
    const firstImg = planner.locator('[data-testid^="recipe-image-"] img').first();
    await expect(firstImg).toBeVisible();

    await firstImg.evaluate((img: HTMLImageElement) => {
      img.dispatchEvent(new Event('error'));
    });

    // The image should be replaced by the fallback placeholder
    const placeholder = planner.locator('[data-testid^="recipe-placeholder-"]').first();
    await expect(placeholder).toBeVisible();
    await expect(placeholder.locator('[class*="placeholderBadge"]')).toHaveText(
      'Image coming soon',
    );

    // Layout must not shift or collapse: placeholder height should remain 108px
    const box = await placeholder.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.round(box.height)).toBe(108);
      expect(box.width).toBeGreaterThan(100);
    }
  });
});
