/**
 * Post-deploy smoke test for a live deployment.
 *   pnpm smoke                                  production (https://beyondtheai.com)
 *   pnpm smoke -- --preview --base <url>        a preview deployment (must be noindex)
 *   pnpm smoke -- --pages-dev <project URL>     also check that *.pages.dev is noindex
 *   pnpm smoke -- --base http://127.0.0.1:4321  a local `pnpm preview` of a production build
 * Requests do not follow redirects, so redirects themselves are checked.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT } from '../lib/paths.ts';
import {
  checkHeaders,
  checkHome,
  checkRedirect,
  checkRobots,
  type Fetched,
  locs,
} from './smoke-rules.ts';

interface RegistryShape {
  site: { brand: { name: string }; environments: Record<string, { url: string }> };
  categories: { visible: boolean }[];
  tools: { listed: boolean }[];
}

const registry = JSON.parse(
  readFileSync(join(ROOT, 'generated/registry.json'), 'utf8'),
) as RegistryShape;
const SITE = (registry.site.environments.production?.url ?? '').replace(/\/$/, '');

async function get(url: string): Promise<Fetched> {
  const res = await fetch(url, { redirect: 'manual' });
  return { status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() };
}

async function sitemapProblems(base: string): Promise<string[]> {
  const index = await get(`${base}/sitemap-index.xml`);
  const pages = (
    await Promise.all(locs(index.body).map((u) => get(u.replace(SITE, base))))
  ).flatMap((s) => locs(s.body));
  const expected =
    2 +
    registry.categories.filter((c) => c.visible).length +
    registry.tools.filter((t) => t.listed).length;
  const problems =
    pages.length === expected ? [] : [`sitemap lists ${pages.length} URLs, expected ${expected}`];
  for (const url of pages) {
    if (!url.startsWith(SITE)) problems.push(`sitemap URL is not on ${SITE}: ${url}`);
    const status = (await get(url.replace(SITE, base))).status;
    if (status !== 200) problems.push(`${url} returned ${status}`);
  }
  return problems;
}

async function pathProblems(base: string, home: Fetched, preview: boolean): Promise<string[]> {
  const problems: string[] = [];
  if ((await get(`${base}/tools/`)).status === 200)
    problems.push('/tools/ is served as a duplicate of /tools');
  if ((await get(`${base}/no-such-page-smoke`)).status !== 404)
    problems.push('unknown pages do not return 404');
  if (!preview && (await get(`${base}/_dev/components`)).status !== 404)
    problems.push('development pages are reachable in production');
  const asset = /\/assets\/[^"']+\.js/.exec(home.body)?.[0];
  const cache = asset ? ((await get(`${base}${asset}`)).headers['cache-control'] ?? '') : '';
  if (!cache.includes('immutable'))
    problems.push('/assets/* is not served with long-lived caching');
  return problems;
}

async function hostProblems(): Promise<string[]> {
  const host = new URL(SITE).host;
  return [
    ...checkRedirect(await get(`https://www.${host}/`), `${SITE}/`, `https://www.${host}/`),
    ...checkRedirect(await get(`http://${host}/`), `${SITE}/`, `http://${host}/`),
  ];
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      base: { type: 'string', default: SITE },
      preview: { type: 'boolean', default: false },
      'pages-dev': { type: 'string' },
    },
  });
  const base = (values.base ?? SITE).replace(/\/$/, '');
  const preview = values.preview ?? false;
  const home = await get(`${base}/`);
  const problems = [
    ...checkHome(home, SITE, registry.site.brand.name, preview),
    ...checkHeaders(home, preview),
    ...checkRobots((await get(`${base}/robots.txt`)).body, SITE, preview),
    ...(preview ? [] : await sitemapProblems(base)),
    ...(await pathProblems(base, home, preview)),
    ...(base === SITE ? await hostProblems() : []),
  ];
  if (values['pages-dev'])
    problems.push(
      ...checkHeaders(await get(values['pages-dev']), true).filter((p) => p.includes('noindex')),
    );
  for (const p of problems) console.error(`✗ ${p}`);
  console.log(
    problems.length === 0
      ? `smoke: ${base} passed.`
      : `smoke: ${problems.length} problem(s) on ${base}.`,
  );
  process.exit(problems.length === 0 ? 0 : 1);
}

await main();
