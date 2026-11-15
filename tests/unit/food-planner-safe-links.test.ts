import { describe, expect, it } from 'vitest';
import type { ExtendedFoodRecipe } from '../../packages/ui/src/toolkit/food-planner/foodRecipesData.ts';
import {
  getRecipeVideoTutorialUrl,
  getSafeRecipeSourceUrl,
} from '../../packages/ui/src/toolkit/food-planner/recipeLinkHelpers.ts';

describe('Food Planner — Safe recipe source & video links', () => {
  it('preserves direct YouTube and Wikipedia links for recipes and sources', () => {
    const ytSource = {
      title: 'Jeera Rice Recipe',
      publisher: 'Chef Ranveer Brar',
      url: 'https://www.youtube.com/watch?v=2u3H7JoAm_U',
    };
    expect(getSafeRecipeSourceUrl(ytSource, 'Jeera Rice')).toBe(
      'https://www.youtube.com/watch?v=2u3H7JoAm_U',
    );

    const vegRecipesSource = {
      title: 'Kachumber Salad Recipe',
      publisher: "Dassana's Veg Recipes",
      url: 'https://www.vegrecipesofindia.com/kachumber-salad-kuchumber-salad/',
    };
    expect(getSafeRecipeSourceUrl(vegRecipesSource, 'Kachumber Salad')).toBe(
      'https://www.vegrecipesofindia.com/kachumber-salad-kuchumber-salad/',
    );

    const hebbarSource = {
      title: 'Kachumber Recipe',
      publisher: "Hebbar's Kitchen",
      url: 'https://hebbarskitchen.com/kachumber-salad-recipe/',
    };
    expect(getSafeRecipeSourceUrl(hebbarSource, 'Kachumber Salad')).toBe(
      'https://hebbarskitchen.com/kachumber-salad-recipe/',
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
      version: '1.0.0',
      name: 'Fresh Garden Green Salad',
      servings: 4,
      prepMinutes: 10,
      cookMinutes: 0,
      diet: 'vegan',
      course: 'side',
      cuisine: 'Indian',
      events: ['daily'],
      thumbnailUrl: '/food/recipes/mixed-veg-salad.jpg',
      verified: true,
      ingredients: [],
      steps: ['Step 1', 'Step 2'],
      videoUrl: 'https://www.youtube.com/watch?v=FjLw3h3iU_8',
    };
    const safeVideoUrl = getRecipeVideoTutorialUrl(recipeWithDeadVideo);
    expect(safeVideoUrl).toContain('https://www.youtube.com/results?search_query=');
    expect(safeVideoUrl).toContain('Fresh%20Garden%20Green%20Salad');

    const recipeWithVerifiedVideo: ExtendedFoodRecipe = {
      ...recipeWithDeadVideo,
      videoUrl: 'https://www.youtube.com/watch?v=bF9cVX6qko0',
    };
    expect(getRecipeVideoTutorialUrl(recipeWithVerifiedVideo)).toBe(
      'https://www.youtube.com/watch?v=bF9cVX6qko0',
    );
  });
});
