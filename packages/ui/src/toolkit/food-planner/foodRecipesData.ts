export interface ExtendedFoodRecipe {
  id: string;
  version: string;
  name: string;
  localName?: string;
  course: 'main' | 'rice' | 'bread' | 'dal' | 'side' | 'snack' | 'dessert' | 'drink';
  cuisine: string;
  diet: 'vegetarian' | 'vegan' | 'jain' | 'eggetarian' | 'non-vegetarian';
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: Array<{
    ingredient: string;
    quantity: string;
    unit: 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'piece';
    note?: string;
  }>;
  steps: string[];
  sources?: Array<{
    title: string;
    publisher: string;
    url: string;
    accessed: string;
    checks: string;
  }>;
  verification?: {
    status: 'draft' | 'source-checked' | 'kitchen-tested' | 'approved';
    by: string;
    date: string;
    notes: string;
  };
  verified: boolean;
  thumbnailUrl?: string;
}

export interface RecipeVerificationInfo {
  label: string;
  badgeClass: 'badgeVerified' | 'badgePrototype';
  title: string;
}

export function getRecipeVerificationInfo(recipe: ExtendedFoodRecipe): RecipeVerificationInfo {
  const status = recipe.verification?.status;
  if (status === 'approved') {
    return {
      label: '✓ Approved',
      badgeClass: 'badgeVerified',
      title: 'Founder approved recipe',
    };
  }
  if (status === 'kitchen-tested') {
    return {
      label: '✓ Kitchen Tested',
      badgeClass: 'badgeVerified',
      title: 'Validated by documented actual cooking trial',
    };
  }
  if (status === 'source-checked' || recipe.verified) {
    return {
      label: '✓ Source Checked',
      badgeClass: 'badgeVerified',
      title: 'Compared against published recipe references',
    };
  }
  return {
    label: 'Prototype',
    badgeClass: 'badgePrototype',
    title: 'Illustrative recipe not yet validated through kitchen trials',
  };
}

export const RECIPES: ExtendedFoodRecipe[] = [
  {
    id: 'jeera-rice',
    version: '0.1.0',
    name: 'Jeera Rice',
    localName: 'जीरा राइस',
    course: 'rice',
    cuisine: 'North Indian',
    diet: 'vegetarian',
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 20,
    verified: true,
    ingredients: [
      { ingredient: 'basmati-rice', quantity: '200', unit: 'g' },
      { ingredient: 'ghee', quantity: '1', unit: 'tbsp' },
      { ingredient: 'cumin-seeds', quantity: '2', unit: 'tsp' },
      { ingredient: 'bay-leaf', quantity: '1', unit: 'piece' },
      { ingredient: 'salt', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Rinse the rice in three changes of water, soak for 20 minutes and drain well.',
      'Warm the ghee in a heavy pan on medium heat. Add cumin seeds and bay leaf until crackling.',
      'Tip in drained rice and stir gently for a minute to coat grains.',
      'Pour in 500 ml water, add salt, bring to a boil, then cover and simmer 12-15 minutes.',
      'Turn off heat and let steam 5 minutes before loosening with a fork.',
    ],
    sources: [
      {
        title: 'Easy Jeera Rice',
        publisher: 'Chef Not Required',
        url: 'https://example.com/jeera-1',
        accessed: '2026-11-02',
        checks: '1 cup basmati serves 4',
      },
      {
        title: 'Jeera Rice Recipe',
        publisher: 'Cup of Yum',
        url: 'https://example.com/jeera-2',
        accessed: '2026-11-02',
        checks: '1 cup rice for 4 servings',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Claude (Engineering Office)',
      date: '2026-11-02',
      notes: 'Cross-checked against published sources. Exact proportions.',
    },
  },
  {
    id: 'dal-tadka',
    version: '0.1.0',
    name: 'Dal Tadka',
    localName: 'दाल तड़का',
    course: 'dal',
    cuisine: 'North Indian',
    diet: 'vegetarian',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    verified: true,
    ingredients: [
      { ingredient: 'toor-dal', quantity: '200', unit: 'g' },
      { ingredient: 'turmeric-powder', quantity: '0.5', unit: 'tsp' },
      { ingredient: 'salt', quantity: '1', unit: 'tsp' },
      { ingredient: 'tomato', quantity: '2', unit: 'piece' },
      { ingredient: 'onion', quantity: '1', unit: 'piece' },
      { ingredient: 'ghee', quantity: '2', unit: 'tbsp' },
      { ingredient: 'cumin-seeds', quantity: '1', unit: 'tsp' },
      { ingredient: 'garlic', quantity: '4', unit: 'piece' },
      { ingredient: 'coriander-leaves', quantity: '2', unit: 'tbsp' },
    ],
    steps: [
      'Wash dal and pressure cook with 750 ml water, turmeric and salt until tender soft.',
      'Whisk cooked dal lightly with warm water to desired soup-like consistency.',
      'In a tadka pan heat ghee; add cumin seeds, sliced garlic and hing until golden.',
      'Add chopped onion and tomato; sauté until soft and oil separates.',
      'Pour hot tempering into simmered dal, garnish with chopped coriander.',
    ],
    sources: [
      {
        title: 'Dal Tadka',
        publisher: 'The Cooks Cook',
        url: 'https://example.com/dal-1',
        accessed: '2026-11-02',
        checks: '200g toor dal serves 4',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Claude (Engineering Office)',
      date: '2026-11-02',
      notes: 'Cross-checked against published sources.',
    },
  },
  {
    id: 'aloo-gobi',
    version: '0.1.0',
    name: 'Aloo Gobi',
    localName: 'आलू गोभी',
    course: 'side',
    cuisine: 'North Indian',
    diet: 'vegan',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    verified: true,
    ingredients: [
      { ingredient: 'potato', quantity: '400', unit: 'g' },
      { ingredient: 'cauliflower', quantity: '400', unit: 'g' },
      { ingredient: 'cooking-oil', quantity: '2', unit: 'tbsp' },
      { ingredient: 'cumin-seeds', quantity: '1', unit: 'tsp' },
      { ingredient: 'onion', quantity: '1', unit: 'piece' },
      { ingredient: 'tomato', quantity: '1', unit: 'piece' },
      { ingredient: 'salt', quantity: '1', unit: 'tsp' },
      { ingredient: 'turmeric-powder', quantity: '0.5', unit: 'tsp' },
      { ingredient: 'coriander-leaves', quantity: '2', unit: 'tbsp' },
    ],
    steps: [
      'Chop potatoes and cauliflower into even florets and bite-sized cubes.',
      'Heat oil in a pan, add cumin seeds, chopped onion and sauté until golden.',
      'Add spices, chopped tomatoes, potatoes and cauliflower. Toss well to coat.',
      'Cover tightly and cook on low-medium flame for 20-25 mins until vegetables are tender.',
      'Uncover, fry on high for 2 minutes to crisp edges, garnish with fresh coriander.',
    ],
    sources: [
      {
        title: 'Aloo Gobi',
        publisher: 'Swasthi Recipes',
        url: 'https://example.com/aloo-gobi-1',
        accessed: '2026-11-02',
        checks: '400g potatoes and cauliflower serves 4',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Claude (Engineering Office)',
      date: '2026-11-02',
      notes: 'Standard dry sabzi proportions.',
    },
  },
  {
    id: 'besan-ladoo',
    version: '0.1.0',
    name: 'Besan Ladoo',
    localName: 'बेसन के लड्डू',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 8,
    prepMinutes: 10,
    cookMinutes: 35,
    verified: false,
    ingredients: [
      { ingredient: 'besan', quantity: '250', unit: 'g' },
      { ingredient: 'ghee', quantity: '125', unit: 'ml' },
      { ingredient: 'sugar', quantity: '175', unit: 'g' },
    ],
    steps: [
      'Heat ghee in a thick kadai over low flame, add coarse besan.',
      'Roast continuously on gentle heat for 25-30 minutes until aromatic and golden brown.',
      'Remove from heat and let cool to lukewarm temperature.',
      'Mix in powdered sugar (boora/tagar) thoroughly and shape into smooth round ladoos.',
    ],
  },
  {
    id: 'mathri',
    version: '0.1.0',
    name: 'Khasta Mathri',
    localName: 'खस्ता मठरी',
    course: 'snack',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 12,
    prepMinutes: 20,
    cookMinutes: 30,
    verified: false,
    ingredients: [
      { ingredient: 'maida', quantity: '300', unit: 'g' },
      { ingredient: 'ghee', quantity: '60', unit: 'ml' },
      { ingredient: 'cumin-seeds', quantity: '1', unit: 'tsp' },
      { ingredient: 'salt', quantity: '1', unit: 'tsp' },
      { ingredient: 'cooking-oil', quantity: '250', unit: 'ml' },
    ],
    steps: [
      'Rub ghee into flour and salt until mixture resembles breadcrumbs.',
      'Add cumin seeds and bind into a stiff firm dough with minimal water.',
      'Roll into small thick rounds, prick with a fork on both sides.',
      'Deep fry in medium-hot oil on low flame until crisp and pale golden.',
    ],
  },
  {
    id: 'shahi-paneer',
    version: '0.1.0',
    name: 'Shahi Paneer',
    localName: 'शाही पनीर',
    course: 'main',
    cuisine: 'Mughlai / North Indian',
    diet: 'vegetarian',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 25,
    verified: false,
    ingredients: [
      { ingredient: 'paneer', quantity: '250', unit: 'g' },
      { ingredient: 'onion', quantity: '2', unit: 'piece' },
      { ingredient: 'tomato', quantity: '2', unit: 'piece' },
      { ingredient: 'ghee', quantity: '2', unit: 'tbsp' },
      { ingredient: 'salt', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Boil onions, tomatoes, and cashews into a smooth silky paste.',
      'Warm ghee in a handi, cook the spiced masala paste until glossy.',
      'Gently fold in fresh paneer cubes and warm milk/cream, simmer 5 minutes on low.',
    ],
  },
  {
    id: 'raita',
    version: '0.1.0',
    name: 'Mixed Veg / Boondi Raita',
    localName: 'रायता',
    course: 'side',
    cuisine: 'North Indian',
    diet: 'vegetarian',
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 0,
    verified: false,
    ingredients: [
      { ingredient: 'curd-yogurt', quantity: '300', unit: 'g' },
      { ingredient: 'cumin-seeds', quantity: '1', unit: 'tsp' },
      { ingredient: 'salt', quantity: '0.5', unit: 'tsp' },
      { ingredient: 'coriander-leaves', quantity: '1', unit: 'tbsp' },
    ],
    steps: [
      'Whisk fresh chilled curd with salt and roasted cumin powder until smooth.',
      'Garnish with fresh coriander and serve cold alongside rice and curries.',
    ],
  },
  {
    id: 'mixed-veg-salad',
    version: '0.1.0',
    name: 'Kachumber Salad',
    localName: 'कचुम्बर सलाद',
    course: 'side',
    cuisine: 'Indian',
    diet: 'vegan',
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 0,
    verified: false,
    ingredients: [
      { ingredient: 'tomato', quantity: '2', unit: 'piece' },
      { ingredient: 'onion', quantity: '1', unit: 'piece' },
      { ingredient: 'salt', quantity: '0.5', unit: 'tsp' },
      { ingredient: 'coriander-leaves', quantity: '1', unit: 'tbsp' },
    ],
    steps: [
      'Finely dice tomatoes and onions.',
      'Toss with salt, lemon juice, and freshly chopped coriander.',
    ],
  },
];
