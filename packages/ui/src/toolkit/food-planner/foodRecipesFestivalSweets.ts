import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

const illustration = {
  type: 'ai-generated' as const,
  notes: 'AI-generated visual illustration. Not a photograph of a tested recipe.',
};

export const FESTIVAL_SWEET_RECIPES: ExtendedFoodRecipe[] = [
  {
    id: 'gulab-jamun',
    version: '0.2.0',
    name: 'Gulab Jamun',
    localName: 'गुलाब जामुन',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 20,
    prepMinutes: 25,
    cookMinutes: 40,
    verified: true,
    ingredients: [
      { ingredient: 'whole-milk-powder', quantity: '100', unit: 'g' },
      { ingredient: 'maida', quantity: '40', unit: 'g' },
      { ingredient: 'baking-soda', quantity: '0.25', unit: 'tsp' },
      { ingredient: 'ghee', quantity: '2', unit: 'tbsp' },
      {
        ingredient: 'whole-milk',
        quantity: '100',
        unit: 'ml',
        note: 'Add gradually; dough may need 80–120 ml.',
      },
      { ingredient: 'sugar', quantity: '400', unit: 'g' },
      { ingredient: 'green-cardamom', quantity: '4', unit: 'piece' },
    ],
    steps: [
      'Simmer sugar in 420 ml water with crushed cardamom for 5–6 minutes; keep the syrup warm.',
      'Combine milk powder, maida and baking soda. Rub in ghee, then add warm milk gradually until a soft dough forms.',
      'Rest the dough covered for 5 minutes, then roll into 20 smooth, crack-free balls.',
      'Fry in neutral oil at low-medium heat, turning gently, until evenly deep golden; allow 6–8 minutes per batch.',
      'Transfer warm balls to warm syrup and soak for at least 1–2 hours before serving. Frying oil is not included in the calculated ingredient cost because pan volume and uptake vary.',
    ],
    sources: [
      {
        title: 'Gulab Jamun with Milk Powder (No Khoya Needed)',
        publisher: 'Mithaiwala Kitchen',
        url: 'https://mymithaiwala.com/recipes/gulab-jamun/',
        accessed: '2026-11-12',
        checks:
          '20-piece metric dough and syrup batch; milk is a 80–120 ml range, with 100 ml planning midpoint.',
      },
      {
        title: 'Gulab Jamun Recipe – Soft with Milk Powder',
        publisher: 'Hebbars Kitchen',
        url: 'https://hebbarskitchen.com/MILK-POWDER-GULAB-JAMUN-RECIPE/',
        accessed: '2026-11-12',
        checks:
          'Cross-checked milk-powder frying method and syrup; this source uses different proportions.',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Food Planner research',
      date: '2026-11-12',
      notes:
        'Adapted from published recipes. Milk is a planning midpoint; frying oil uptake is unpriced. No kitchen trial.',
    },
    thumbnailUrl: '/food/recipes/gulab-jamun.jpg',
    imageProvenance: illustration,
  },
  {
    id: 'kaju-katli',
    version: '0.2.0',
    name: 'Kaju Katli',
    localName: 'काजू कतली',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 14,
    prepMinutes: 5,
    cookMinutes: 15,
    verified: true,
    ingredients: [
      { ingredient: 'cashew', quantity: '160', unit: 'g' },
      { ingredient: 'sugar', quantity: '100', unit: 'g' },
      { ingredient: 'ghee', quantity: '1', unit: 'tbsp' },
    ],
    steps: [
      'Pulse room-temperature cashews into a fine powder without letting them turn oily.',
      'Dissolve sugar in 75 ml water over low heat, then add the cashew powder.',
      'Stir continuously until the mixture thickens and leaves the pan; blend in the ghee.',
      'Cool just enough to handle, knead briefly until smooth, then roll thin between baking sheets.',
      'Let set and cut into 14 diamond pieces.',
    ],
    sources: [
      {
        title: 'Kaju Katli Recipe (Easy Kaju Barfi)',
        publisher: 'Dassana Amit',
        url: 'https://www.vegrecipesofindia.com/kaju-katli-recipe-kaju-katli/',
        accessed: '2026-11-12',
        checks: '14-piece batch: 160 g cashews, 100 g sugar, 5 tbsp water, optional 1 tbsp ghee.',
      },
      {
        title: 'Kaju Katli Recipe | Kaju Barfi Sweet',
        publisher: 'Hebbars Kitchen',
        url: 'https://hebbarskitchen.com/kaju-katli-recipe-kaju-barfi-recipe-2/',
        accessed: '2026-11-12',
        checks: 'Cross-checked low-heat stirring and rolling; source uses a larger batch.',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Food Planner research',
      date: '2026-11-12',
      notes: 'Published recipe quantities cross-checked; not kitchen-tested.',
    },
    thumbnailUrl: '/food/recipes/kaju-katli.jpg',
    imageProvenance: illustration,
  },
  {
    id: 'kheer',
    version: '0.2.0',
    name: 'Rice Kheer',
    localName: 'खीर',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 5,
    prepMinutes: 20,
    cookMinutes: 30,
    verified: true,
    ingredients: [
      {
        ingredient: 'basmati-rice',
        quantity: '50',
        unit: 'g',
        note: 'Approximately 1/4 cup dry rice.',
      },
      { ingredient: 'whole-milk', quantity: '1000', unit: 'ml' },
      { ingredient: 'sugar', quantity: '75', unit: 'g', note: 'Approximately 6 tablespoons.' },
      { ingredient: 'ground-cardamom', quantity: '0.5', unit: 'tsp' },
    ],
    steps: [
      'Rinse and soak the rice for 15–20 minutes, then drain.',
      'Bring the milk to a gentle boil in a heavy pan, stirring to prevent scorching.',
      'Add rice and simmer uncovered on low heat until the grains are half cooked.',
      'Stir in sugar and continue simmering, stirring often, until the rice is tender and milk thickens.',
      'Add ground cardamom. Serve warm or chilled; optional nuts and saffron are not included in the scaled shopping estimate.',
    ],
    sources: [
      {
        title: 'Kheer Recipe (Rice Kheer)',
        publisher: 'Dassana Amit',
        url: 'https://www.vegrecipesofindia.com/rice-kheer-recipe-chawal-ki-kheer/',
        accessed: '2026-11-12',
        checks:
          'Five servings: 1/4 cup rice, 1 litre milk, 6 tbsp sugar, 1/2 tsp cardamom. Rice and sugar are planning mass approximations.',
      },
      {
        title: 'Pal Payasam Recipe | Rice Kheer',
        publisher: 'Hebbars Kitchen',
        url: 'https://hebbarskitchen.com/pal-payasam-recipe-rice-kheer-recipe/',
        accessed: '2026-11-12',
        checks:
          'Cross-checked the rice-milk simmering method and cardamom; this source uses six servings.',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Food Planner research',
      date: '2026-11-12',
      notes:
        'Published method cross-checked. Rice/sugar mass and optional garnishes are estimates; no kitchen trial.',
    },
    thumbnailUrl: '/food/recipes/kheer.jpg',
    imageProvenance: illustration,
  },
];
