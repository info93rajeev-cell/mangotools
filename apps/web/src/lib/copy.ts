/** Page text for the site chrome pages (home, all tools, 404). Tool text lives in tools/ and presets/. */
export const COPY = {
  home: {
    heading: 'Professional tools for work that should not depend on AI.',
    lede: 'Search calculators, converters and business tools with clear, checkable results. No ads, no unnecessary uploads, no AI in calculations.',
    categories: 'Browse by category',
    trust:
      'No ads · No unnecessary uploads · Deterministic results · Built for professional workflows',
  },
  tools: {
    heading: 'All tools',
    lede: 'Every tool runs in your browser. Pick a category or search by name.',
  },
  category: {
    startHere: 'Start here',
    allInCategory: 'All {name} tools',
    about: 'About these tools',
    faq: 'Frequently asked questions',
    count: '{count} tools',
    one: '1 tool',
  },
  notFound: {
    title: 'Page not found | MangoTools',
    description:
      'The page you were looking for does not exist. Search for a tool or pick one of the popular tools below.',
    heading: 'Page not found',
    lede: 'The page you were looking for does not exist or has moved. Search for a tool instead:',
    popular: 'Popular tools',
  },
  dev: {
    components: 'Component gallery',
    determinism: 'Determinism harness',
    imageFoundation: 'Image foundation harness',
  },
} as const;

export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
