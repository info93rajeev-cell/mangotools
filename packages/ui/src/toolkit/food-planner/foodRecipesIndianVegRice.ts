import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

export const INDIAN_VEG_RICE: ExtendedFoodRecipe[] = [
  {
    id: 'matar-pulao',
    version: '1.0.0',
    name: 'Fragrant Green Peas Pulao (Matar Pulao)',
    localName: 'मटर पुलाव (Matar Pulao)',
    course: 'rice',
    cuisine: 'North Indian',
    diet: 'vegetarian',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 20,
    thumbnailUrl: '/food/recipes/matar-pulao.jpg',
    verified: true,
    operational: true,
    countries: ['IN', 'US', 'GB'],
    events: ['Dinner Party', 'Sunday Lunch', 'Wedding Buffet', 'Family Gathering'],
    ingredients: [
      {
        ingredient: 'basmati-rice',
        quantity: '350',
        unit: 'g',
        note: 'Aged long-grain basmati, soaked 30 mins',
      },
      { ingredient: 'green-peas', quantity: '180', unit: 'g', note: 'Sweet tender green peas' },
      { ingredient: 'ghee', quantity: '30', unit: 'ml', note: 'Pure desi cow ghee' },
      { ingredient: 'cumin-seeds', quantity: '8', unit: 'ml', note: 'Whole jeera' },
      { ingredient: 'bay-leaf', quantity: '2', unit: 'piece', note: 'Tej patta' },
      { ingredient: 'green-cardamom', quantity: '3', unit: 'piece', note: 'Cracked pods' },
      { ingredient: 'cinnamon-sticks', quantity: '1', unit: 'piece', note: 'Fragrant stick' },
      { ingredient: 'onion', quantity: '1', unit: 'piece', note: 'Thinly sliced' },
      { ingredient: 'salt', quantity: '10', unit: 'ml', note: 'To taste' },
    ],
    steps: [
      'Heat ghee in a heavy pot; sauté cumin seeds, bay leaves, cardamom, and cinnamon until fragrant.',
      'Add sliced onions and sauté on medium flame until pale golden and soft.',
      'Add green peas and drained soaked basmati rice; gently sauté 2 minutes until glossy.',
      'Pour in 2 cups boiling hot water, add salt, bring to a vigorous boil, then simmer tightly covered on low flame for 12 minutes.',
      'Rest covered for 5 minutes before gently fluffing with a fork.',
    ],
    proTips: [
      'Always use boiling water instead of cold water to ensure basmati grains cook evenly without turning mushy.',
    ],
    sources: [
      {
        title: 'Authentic Matar Pulao Recipe',
        publisher: 'Ranveer Brar Official',
        url: 'https://ranveerbrar.com/recipes/matar-pulao-recipe/',
        accessed: '2026-11-14',
        checks: 'Verified whole spice tempering and water-to-rice absorption ratio',
      },
      {
        title: 'Classic Green Peas Pulao Masterclass',
        publisher: 'Sanjeev Kapoor Khazana',
        url: 'https://www.sanjeevkapoor.com/recipe/Matar-Pulao.html',
        accessed: '2026-11-14',
        checks: 'Verified low-flame dum steam technique and rice grain separation',
      },
    ],
    videoUrl: 'https://www.youtube.com/watch?v=mY7bX9a1_bA',
    verification: {
      status: 'source-checked',
      by: 'Culinary Team',
      date: '2026-11-14',
      notes: 'Cross-checked with North Indian wedding banquet pulao standards',
    },
    imageProvenance: {
      type: 'free-source',
      notes: 'High-res studio photography of fragrant green peas pulao',
    },
  },
];
