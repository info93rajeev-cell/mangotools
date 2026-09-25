/** Page text for the site chrome pages (home, all tools, 404). Tool text lives in tools/ and presets/. */
export const COPY = {
  home: {
    heading: 'Professional tools. Zero uploads.',
    lede: 'Free calculators, converters and document tools for engineers, businesses and developers. Everything runs on your device — no sign-up, no ads.',
    popular: 'Popular:',
    popularLabel: 'Popular tools',
    categories: 'Browse by category',
    professional: 'Built for professional work',
    professionalLede: 'Every result shows its working, so you can check it.',
    device: 'Processed on your device',
    deviceLede:
      'Your files and numbers are processed in your browser. Nothing is uploaded to our servers.',
    promises: [
      {
        icon: 'shield-check',
        title: 'No uploads',
        text: 'Files and numbers stay in your browser.',
      },
      { icon: 'lock', title: 'No sign-up', text: 'Every tool works straight away, for free.' },
      {
        icon: 'circle-check',
        title: 'No ads or trackers',
        text: 'Nothing on these pages follows you around the web.',
      },
    ],
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
  },
} as const;

export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
