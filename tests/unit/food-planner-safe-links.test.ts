import { describe, expect, it } from 'vitest';
import type { ExtendedFoodRecipe } from '../../packages/ui/src/toolkit/food-planner/foodRecipesData.ts';
import {
  getRecipeVideoTutorialUrl,
  getSafeRecipeSourceUrl,
} from '../../packages/ui/src/toolkit/food-planner/RecipeDetailDialog.tsx';

describe('Food Planner — Safe recipe source & video links', () => {
  it('preserves direct YouTube and Wikipedia links for recipes and sources', () => {
    const ytSource = {
      title: 'Jeera Rice Recipe',
      publisher: 'Chef Ranveer Brar',
      url: 'https://www.youtube.com/watch?v=kYJ6gVlFw8c',
    };
    expect(getSafeRecipeSourceUrl(ytSource, 'Jeera Rice')).toBe(
      'https://www.youtube.com/watch?v=kYJ6gVlFw8c',
    );

    const wikiSource = {
      title: 'Pani Puri Culinary History',
      publisher: 'Wikipedia',
      url: 'https://en.wikipedia.org/wiki/Panipuri',
    };
    expect(getSafeRecipeSourceUrl(wikiSource, 'Pani Puri')).toBe(
      'https://en.wikipedia.org/wiki/Panipuri',
    );
  });

  it('safely converts external or fragile reference links to Google Recipe Search queries', () => {
    const govSource = {
      title: 'Murthal Highway Dhaba Paratha Protocol',
      publisher: 'Punjab Culinary Heritage Documentation',
      url: 'https://punjabtourism.gov.in/food/murthal-paratha',
    };
    const safeUrl = getSafeRecipeSourceUrl(govSource, 'Punjabi Aloo Paratha (Dhaba Style)');
    expect(safeUrl).toContain('https://www.google.com/search?q=');
    expect(safeUrl).toContain('Murthal');
    expect(safeUrl).toContain('recipe');
    expect(safeUrl).not.toContain('punjabtourism.gov.in');
  });

  it('safely converts hotel school curriculum links to Google Recipe Search queries', () => {
    const nchmSource = {
      title: 'Authentic Indian Breads & Tawa Specials',
      publisher: 'National Council for Hotel Management',
      url: 'https://nchm.nic.in/curriculum/indian-breads',
    };
    const safeUrl = getSafeRecipeSourceUrl(nchmSource, 'Punjabi Aloo Paratha');
    expect(safeUrl).toContain('https://www.google.com/search?q=');
    expect(safeUrl).toContain('National%20Council%20for%20Hotel%20Management');
    expect(safeUrl).not.toContain('nchm.nic.in');
  });

  it('generates active YouTube video tutorial query for broken video URLs', () => {
    const recipeWithDeadVideo: ExtendedFoodRecipe = {
      id: 'test-recipe',
      name: 'Kolkata Bhetki Macher Paturi',
      servings: 4,
      prepTimeMinutes: 30,
      cookTimeMinutes: 20,
      diet: 'non-veg',
      category: 'Main Course',
      cuisine: 'Indian',
      occasion: 'Wedding',
      image: 'recipes/bhetki-paturi.jpg',
      ingredients: [],
      steps: ['Step 1', 'Step 2'],
      videoUrl: 'https://www.youtube.com/watch?v=7bN6vK5m8yA',
    };
    const safeVideoUrl = getRecipeVideoTutorialUrl(recipeWithDeadVideo);
    expect(safeVideoUrl).toContain('https://www.youtube.com/results?search_query=');
    expect(safeVideoUrl).toContain('Kolkata%20Bhetki%20Macher%20Paturi');
  });
});
