import { FESTIVAL_DELICACY_RECIPES } from './foodRecipesFestivalDelicacies.ts';
import type { ExtendedFoodRecipe } from './foodRecipesTypes.ts';

const illustration = {
  type: 'ai-generated' as const,
  notes: 'AI-generated visual illustration. Not a photograph of a tested recipe.',
};

export const FESTIVAL_SWEETS_CORE: ExtendedFoodRecipe[] = [
  {
    id: 'besan-ladoo',
    version: '0.2.0',
    name: 'Besan Ladoo',
    localName: 'बेसन के लड्डू',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 10,
    prepMinutes: 10,
    cookMinutes: 35,
    verified: true,
    videoUrl: 'https://www.youtube.com/watch?v=FjLw3h3iU_8',
    countries: ['IN', 'US', 'GB'],
    events: ['diwali', 'ganesh-chaturthi', 'raksha-bandhan', 'festival', 'puja'],
    proTips: [
      'Always use traditional boora/tagar instead of fine powdered sugar for signature grainy texture.',
      'Never add sugar to hot besan; cooling until lukewarm prevents sugar melting into a sticky paste.',
    ],
    ingredients: [
      {
        ingredient: 'besan',
        quantity: '250',
        unit: 'g',
        note: 'Coarse besan (दानेदार बेसन) for grainy ladoos',
      },
      {
        ingredient: 'ghee',
        quantity: '125',
        unit: 'ml',
        note: 'Desi ghee at room temperature (melted)',
      },
      {
        ingredient: 'sugar',
        quantity: '175',
        unit: 'g',
        note: 'Traditional boora/tagar (तगार); not warm powdered',
      },
      {
        ingredient: 'ground-cardamom',
        quantity: '0.5',
        unit: 'tsp',
        note: 'Freshly crushed cardamom for fragrance',
      },
      {
        ingredient: 'cashew',
        quantity: '20',
        unit: 'g',
        note: 'Finely chopped cashews for nutty bite',
      },
    ],
    steps: [
      '[तैयारी व कड़ाही का चुनाव] Use a heavy-bottomed kadai or pan. Measure 250 g coarse besan and sift once to remove dry clumps. Keep 125 ml pure ghee ready at room temperature.',
      '[धीमी आंच पर घी व बेसन] Melt 110 ml ghee in the kadai on low flame (keep 15 ml aside). Add sifted besan. Stir continuously on low heat. Initially the mix absorbs all ghee and feels stiff, dense, and clumpy. Do not panic or add excess ghee.',
      '[भूनना - प्रारंभिक 0–12 मिनट] Keep stirring continuously from the bottom on low flame so it does not scorch. Around 10-12 minutes, the raw gram flour smell fades, and the mixture begins to loosen and turn slightly soft.',
      '[घी छोड़ना 15–22 मिनट] As besan cooks through, it begins releasing ghee. The dense paste magically transforms into a glossy, smooth, runny lava-like consistency that bubbles gently and the spatula glides effortlessly.',
      '[सुनहरा रंग 23–28 मिनट] Continue stirring on gentle low flame until the besan turns an even rich golden-brown hue (like the color of peanut butter) and a deep, nutty roasted aroma fills the kitchen.',
      '[दानेदार बनावट का रहस्य] When deep golden, immediately sprinkle 1–2 tsp cold water over the hot besan. It will sizzle vigorously and froth up into airy foam! Stir rapidly for 1 min until the sizzle stops, creating authentic grain nodules (दाने).',
      '[ठंडा करना - आवश्यक नियम] Turn off flame and spread roasted besan onto a wide plate. Let it cool until just lukewarm (हल्का गुनगुना) — about 15-20 min. CAUTION: If you add sugar while hot, it will melt, making the mixture runny liquid!',
      '[तगार व इलायची मिलाना] Touch the mixture; it should feel barely warm. Add 175 g boora/tagar, 0.5 tsp cardamom powder, and chopped cashews. Rub and mix thoroughly with your fingers until completely uniform and lump-free.',
      '[लड्डू बांधना] Take a small portion (~35 g) in your palm. Squeeze tightly between fingers to bring it together, then roll gently between both palms in circular motions until smooth, round, and glossy. Garnish with pistachio slivers.',
    ],
    sources: [
      {
        title: 'Besan Ladoo Recipe (Traditional Halwai Style)',
        publisher: 'Dassana Amit (Veg Recipes of India)',
        url: 'https://www.vegrecipesofindia.com/besan-ladoo-recipe-easy-besan-ladoos/',
        accessed: '2026-11-12',
        checks:
          '250g coarse besan, 125ml ghee, slow-roast color change, water splash for danedar grain, cooling before sugar',
      },
      {
        title: 'Besan Ke Laddu Recipe – Danedar & Perfect',
        publisher: 'Hebbars Kitchen',
        url: 'https://hebbarskitchen.com/besan-ladoo-recipe-besan-ke-laddu/',
        accessed: '2026-11-12',
        checks:
          'Cross-checked low-heat ghee release phase, tagar/boora ratio (175g), and round palm shaping',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Food Planner culinary research',
      date: '2026-11-12',
      notes:
        'Detailed beginner method cross-checked against published references; not a kitchen trial.',
    },
    thumbnailUrl: '/food/recipes/besan-ladoo.jpg',
    imageProvenance: illustration,
  },
  {
    id: 'gulab-jamun',
    version: '0.3.0',
    name: 'Gulab Jamun',
    localName: 'गुलाब जामुन',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 20,
    prepMinutes: 20,
    cookMinutes: 35,
    verified: true,
    videoUrl: 'https://www.youtube.com/watch?v=Fq2r_sD1E_U',
    countries: ['IN', 'US', 'GB'],
    events: ['diwali', 'wedding', 'eid', 'festival', 'birthday'],
    proTips: [
      'Do not knead dough hard; gentle gathering prevents gluten and keeps jamuns soft.',
      'Fry on low flame only (140°C); hot oil browns exterior leaving uncooked dough inside.',
    ],
    ingredients: [
      {
        ingredient: 'whole-milk-powder',
        quantity: '100',
        unit: 'g',
        note: 'Full-fat dairy milk powder (not whitener)',
      },
      {
        ingredient: 'maida',
        quantity: '40',
        unit: 'g',
        note: 'All-purpose flour, sifted for binding',
      },
      {
        ingredient: 'baking-soda',
        quantity: '0.25',
        unit: 'tsp',
        note: 'Level 1/4 tsp; excess causes bursting',
      },
      {
        ingredient: 'ghee',
        quantity: '2',
        unit: 'tbsp',
        note: 'Desi ghee rubbed into dough for softness',
      },
      {
        ingredient: 'whole-milk',
        quantity: '100',
        unit: 'ml',
        note: 'Warm milk added in spoons (needs 80-100 ml)',
      },
      {
        ingredient: 'sugar',
        quantity: '400',
        unit: 'g',
        note: 'Granulated sugar for sweet syrup',
      },
      {
        ingredient: 'green-cardamom',
        quantity: '4',
        unit: 'piece',
        note: 'Crushed pods for aromatic syrup',
      },
      {
        ingredient: 'lemon',
        quantity: '1',
        unit: 'piece',
        note: '1 tsp fresh juice to stop crystallization',
      },
    ],
    steps: [
      '[सुगंधित चाशनी बनाना] In a wide deep pot, combine 400 g sugar and 420 ml water with 4 crushed cardamom pods. Bring to a boil on medium flame, stirring until sugar fully dissolves.',
      '[चाशनी की सही स्थिरता (Half-String)] Boil syrup on medium flame for 5–6 minutes. Test between thumb and index finger: it should feel sticky and oily like warm honey (half-string stage), NOT a thick single thread. Add 1 tsp lemon juice. Keep warm.',
      '[सूखे तत्वों का मिश्रण] In a bowl, whisk 100 g whole milk powder, 40 g sifted maida, and 1/4 tsp level baking soda. Add 2 tbsp softened ghee and gently rub with fingertips for 1 minute until it resembles fine breadcrumbs.',
      '[नरम आटा गूंथना (Soft Dough Rule)] Add warm milk gradually, 1 to 2 tbsp at a time. Gently bring together with fingertips into a very soft, sticky dough. DO NOT knead like roti dough, or gluten will develop and make jamuns dense and hard.',
      '[आराम देना व स्थिरता जांच] Cover bowl with a damp cloth and rest for 8–10 minutes. The milk powder absorbs moisture and becomes pliable. If it feels stiff, sprinkle 1 tsp warm milk so the dough stays soft and supple.',
      '[चिकनी गोलियां बनाना (No Cracks!)] Grease palms lightly with ghee. Pinch out 20 small marble-sized portions (~13 g each). Roll gently between palms until completely seamless with ZERO cracks. Even a hairline crack will burst in hot oil.',
      '[तलने का तापमान] Heat oil or ghee in a kadai on low flame (at least 2 inches depth). Test: drop a tiny dough ball. It should sink, sit for 3–4 seconds, then slowly rise to the surface with tiny bubbles without browning immediately.',
      '[धीमी आंच पर तलना (7–9 मिनट)] Slide in 8–10 jamun balls. Do not touch them directly with the ladle initially; gently swirl the surrounding oil with a slotted spoon to keep them rotating. Fry on low flame for 7–9 minutes until evenly deep golden.',
      '[चाशनी में डुबोना] Lift with a slotted spoon, drain for 10 seconds, and immediately drop into the warm sugar syrup (syrup must be warm, not boiling). Let them soak for at least 2 hours. They will swell up, becoming soft, juicy, and spongy.',
    ],
    sources: [
      {
        title: 'Gulab Jamun with Milk Powder (No Khoya Needed)',
        publisher: 'Dassana Amit (Veg Recipes of India)',
        url: 'https://www.vegrecipesofindia.com/gulab-jamun-recipe-with-milk-powder/',
        accessed: '2026-11-12',
        checks:
          '20-piece batch: 100g milk powder, 40g maida, half-string syrup, slow low-flame frying technique',
      },
      {
        title: 'Gulab Jamun Recipe – Soft with Milk Powder',
        publisher: 'Hebbars Kitchen',
        url: 'https://hebbarskitchen.com/MILK-POWDER-GULAB-JAMUN-RECIPE/',
        accessed: '2026-11-12',
        checks:
          'Cross-checked milk-powder proportion, dough softness, resting time and warm syrup soaking',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Food Planner culinary research',
      date: '2026-11-12',
      notes:
        'Detailed beginner method cross-checked against published references; not a kitchen trial.',
    },
    thumbnailUrl: '/food/recipes/gulab-jamun.jpg',
    imageProvenance: illustration,
  },
  {
    id: 'kaju-katli',
    version: '0.3.0',
    name: 'Kaju Katli',
    localName: 'काजू कतली',
    course: 'dessert',
    cuisine: 'North Indian / Festival',
    diet: 'vegetarian',
    servings: 16,
    prepMinutes: 10,
    cookMinutes: 15,
    verified: true,
    videoUrl: 'https://www.youtube.com/watch?v=kYJ6gVlFw8c',
    countries: ['IN', 'US', 'GB'],
    events: ['diwali', 'raksha-bandhan', 'wedding', 'festival', 'gift'],
    proTips: [
      'Pulse cold cashews in short 3-second bursts; continuous grinding releases nut butter.',
      'Test a pea-sized dough ball on plate: if it rolls without sticking to fingers, it is done.',
    ],
    ingredients: [
      {
        ingredient: 'cashew',
        quantity: '160',
        unit: 'g',
        note: 'Plain raw whole cashews at room temperature',
      },
      {
        ingredient: 'sugar',
        quantity: '100',
        unit: 'g',
        note: 'Fine granulated white sugar',
      },
      {
        ingredient: 'ghee',
        quantity: '1',
        unit: 'tbsp',
        note: 'Desi ghee for gloss and non-sticky rolling',
      },
      {
        ingredient: 'ground-cardamom',
        quantity: '0.25',
        unit: 'tsp',
        note: 'Optional fragrant cardamom powder',
      },
    ],
    steps: [
      '[काजू का चयन व तापमान] Use 160 g clean, dry, plain cashew nuts at room temperature. If cashews were refrigerated, let them reach room temperature completely; cold or moist cashews turn oily when ground.',
      '[काजू पाउडर (Pulse Mode)] Grind cashews in a dry mixer jar ONLY in pulse mode: run for 2-3 seconds, stop, shake jar, and pulse 4-5 times. NEVER grind continuously, or natural oils will release and turn it into sticky cashew butter paste!',
      '[पाउडर छानना] Sift ground cashew through a fine-mesh strainer. Stir with a spoon to pass the fine flour. Pulse any coarse bits once more. You should have a fluffy, free-flowing cashew powder with zero oily clumps.',
      '[चाशनी बनाना (Half-String)] In a wide non-stick pan, combine 100 g sugar and 75 ml water on medium-low flame. Stir until sugar dissolves. Simmer 2-3 minutes until syrup turns slightly thick and sticky (half-string consistency).',
      '[काजू पाउडर मिलाना] Reduce flame to the absolute lowest. Tip in cashew powder in two batches, stirring vigorously with a spatula to dissolve any lumps into a smooth, creamy batter.',
      '[लगातार चलाना (6-8 मिनट)] Keep stirring continuously from the bottom on low flame. The mixture will gradually thicken from a pouring batter into a smooth, glossy paste that begins leaving the bottom and sides of the pan.',
      '[गोली बनाने का परीक्षण (Ball Test)] Take a tiny pea-sized portion onto a cool plate and wait 20 seconds. Roll between fingertips: if it rolls into a smooth, non-sticky soft ball, IT IS READY! Turn off flame immediately so it stays tender.',
      '[घी मिलाना व ठंडा करना] Stir in 1 tbsp ghee and 1/4 tsp cardamom powder. Let the mixture sit in the warm pan for 3–4 minutes, turning occasionally with the spatula, until warm to the touch and safe to handle with hands.',
      '[गूंधना, बेलना व काटना] Transfer warm dough onto parchment paper greased with ghee. Knead 1 minute until smooth. Place another parchment on top, roll with a rolling pin to 4 mm thickness. Let set 20 min, then cut into diamond pieces.',
    ],
    sources: [
      {
        title: 'Kaju Katli Recipe (Easy Kaju Barfi)',
        publisher: 'Dassana Amit (Veg Recipes of India)',
        url: 'https://www.vegrecipesofindia.com/kaju-katli-recipe-kaju-katli/',
        accessed: '2026-11-12',
        checks:
          '16-piece batch: 160g cashews, 100g sugar, 75ml water, pulse-sifting and ball test technique',
      },
      {
        title: 'Kaju Katli Recipe | Kaju Barfi Sweet',
        publisher: 'Hebbars Kitchen',
        url: 'https://hebbarskitchen.com/kaju-katli-recipe-kaju-barfi-recipe-2/',
        accessed: '2026-11-12',
        checks: 'Cross-checked low-heat stirring, parchment kneading, and rolling thickness (4 mm)',
      },
    ],
    verification: {
      status: 'source-checked',
      by: 'Food Planner culinary research',
      date: '2026-11-12',
      notes:
        'Detailed beginner method cross-checked against published references; not a kitchen trial.',
    },
    thumbnailUrl: '/food/recipes/kaju-katli.jpg',
    imageProvenance: illustration,
  },
];

export const FESTIVAL_SWEET_RECIPES: ExtendedFoodRecipe[] = [
  ...FESTIVAL_SWEETS_CORE,
  ...FESTIVAL_DELICACY_RECIPES,
];
