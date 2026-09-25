/**
 * Runs after `astro build`: checks every page, writes _headers with the CSP, checks robots and
 * sitemaps, and measures the JavaScript each page loads up front. Exits non-zero on any problem.
 * Usage: tsx scripts/check/postbuild.ts [distDir]   (environment from MANGOTOOLS_ENV)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Registry } from '@mangotools/schemas';
import { walkFiles } from '../lib/files.ts';
import { paths, ROOT } from '../lib/paths.ts';
import {
  checkPage,
  cspScriptHashes,
  entryModules,
  headersFile,
  pageFacts,
  staticImports,
} from './postbuild-rules.ts';

export const BUDGETS = { tool: 60 * 1024, home: 30 * 1024 } as const;

export interface PostbuildResult {
  problems: string[];
  bundles: Record<string, number>;
  pages: number;
}

function loadRegistry(): Registry {
  return JSON.parse(readFileSync(join(paths.generated, 'registry.json'), 'utf8')) as Registry;
}

/** Gzipped size of a page's up-front JavaScript, following static imports. */
function pageScriptBytes(dist: string, html: string): number {
  const seen = new Set<string>();
  const queue = entryModules(html).map((url) => join(dist, url));
  let total = 0;
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const code = readFileSync(file);
    total += gzipSync(code, { level: 9 }).length;
    for (const spec of staticImports(code.toString('utf8'))) queue.push(join(dirname(file), spec));
  }
  return total;
}

function expectedSitemapUrls(registry: Registry, siteUrl: string): string[] {
  const abs = (p: string) => (p === '/' ? siteUrl : `${siteUrl}${p}`);
  return [
    abs('/'),
    abs('/tools'),
    ...registry.categories.filter((c) => c.visible).map((c) => abs(c.url)),
    ...registry.tools.filter((t) => t.listed).map((t) => abs(t.url)),
  ].sort();
}

function checkClosed(dist: string, robots: string): string[] {
  const problems: string[] = [];
  if (!robots.includes('Disallow: /'))
    problems.push('robots.txt must disallow all outside production');
  if (existsSync(join(dist, 'sitemap-pages.xml')) || existsSync(join(dist, 'sitemap-index.xml'))) {
    problems.push('sitemaps must not exist outside production');
  }
  return problems;
}

function checkSitemap(dist: string, registry: Registry, siteUrl: string): string[] {
  const sitemap = join(dist, 'sitemap-pages.xml');
  if (!existsSync(sitemap)) return ['sitemap-pages.xml is missing'];
  const urls = [...readFileSync(sitemap, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1] ?? '')
    .sort();
  const expected = expectedSitemapUrls(registry, siteUrl);
  const problems: string[] = [];
  if (JSON.stringify(urls) !== JSON.stringify(expected)) {
    problems.push(
      `sitemap URLs differ from indexable pages:\n  got ${urls.join(', ')}\n  expected ${expected.join(', ')}`,
    );
  }
  for (const url of urls) {
    const path = url.slice(siteUrl.length) || '/';
    const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`;
    if (!existsSync(join(dist, file)))
      problems.push(`sitemap lists ${url} but ${file} was not built`);
  }
  return problems;
}

function checkRobotsAndSitemap(
  dist: string,
  registry: Registry,
  siteUrl: string,
  indexable: boolean,
): string[] {
  const robotsFile = join(dist, 'robots.txt');
  const robots = existsSync(robotsFile) ? readFileSync(robotsFile, 'utf8') : '';
  if (!indexable) return checkClosed(dist, robots);
  const pointer = robots.includes(`Sitemap: ${siteUrl}/sitemap-index.xml`)
    ? []
    : ['robots.txt must point to the sitemap'];
  return [...pointer, ...checkSitemap(dist, registry, siteUrl)];
}

function budgetProblems(dist: string, bundles: Record<string, number>): string[] {
  return Object.entries(bundles).flatMap(([page, bytes]) => {
    const template = pageFacts(page, readFileSync(join(dist, page), 'utf8')).template;
    const budget = template === 'tool' ? BUDGETS.tool : template === 'home' ? BUDGETS.home : null;
    return budget !== null && bytes > budget
      ? [`${page}: ${bytes} B of JavaScript (budget ${budget} B)`]
      : [];
  });
}

export function runPostbuild(distDir: string, env: string): PostbuildResult {
  const dist = resolve(distDir);
  const registry = loadRegistry();
  const environment = registry.site.environments[env];
  if (!environment) throw new Error(`Unknown environment "${env}".`);
  const siteUrl = environment.url.replace(/\/$/, '');
  const problems: string[] = [];
  const hashes: string[] = [];
  const bundles: Record<string, number> = {};
  const pages = walkFiles(dist, '.html');
  for (const file of pages) {
    const rel = relative(dist, file).split('\\').join('/');
    const html = readFileSync(file, 'utf8');
    const facts = pageFacts(rel, html);
    const devPage = rel.startsWith('_dev/');
    const checks = checkPage(facts, siteUrl).filter((c) => !devPage || c.includes('CSP'));
    problems.push(...checks.map((c) => `${rel}: ${c}`));
    hashes.push(...cspScriptHashes(facts.cspMeta));
    if (!devPage) bundles[rel] = pageScriptBytes(dist, html);
  }
  problems.push(...budgetProblems(dist, bundles));
  problems.push(...checkRobotsAndSitemap(dist, registry, siteUrl, environment.indexable));
  writeFileSync(
    join(dist, '_headers'),
    headersFile({ scriptHashes: hashes, indexable: environment.indexable }),
  );
  return { problems, bundles, pages: pages.length };
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/check/postbuild.ts');
if (isMain) {
  const dist = process.argv[2] ?? join(ROOT, 'apps/web/dist');
  const env = process.env.MANGOTOOLS_ENV ?? 'development';
  const result = runPostbuild(dist, env);
  const reportDir = join(ROOT, 'tests/artifacts');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    join(reportDir, `bundle-sizes-${env}.json`),
    `${JSON.stringify(result.bundles, null, 2)}\n`,
  );
  const kb = (b: number) => `${(b / 1024).toFixed(1)} KB`;
  for (const [page, bytes] of Object.entries(result.bundles).sort())
    console.log(`  ${posix.normalize(page).padEnd(34)} ${kb(bytes)} JS (gzip)`);
  if (result.problems.length > 0) {
    for (const p of result.problems) console.error(`✗ ${p}`);
    console.error(`\npostbuild: ${result.problems.length} problem(s) in ${relative(ROOT, dist)}.`);
    process.exit(1);
  }
  console.log(
    `postbuild: ${result.pages} pages checked in ${relative(ROOT, dist)} (${env}); _headers written.`,
  );
}
