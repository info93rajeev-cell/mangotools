/**
 * Checks a finished dist folder before it is deployed, so a production deployment can never ship
 * the development (noindex) build and a preview can never be indexable. Pure over a file reader so
 * it can be unit-tested.
 */
export interface DistReader {
  files: string[];
  read(file: string): string | null;
}

const robotsMeta = (html: string) =>
  /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? null;

/** The `/*` block of a Cloudflare Pages _headers file. */
const siteWideHeaders = (headers: string) => /^\/\*\n((?:[ \t]+.*\n?)*)/m.exec(headers)?.[1] ?? '';

function productionProblems(dist: DistReader, siteUrl: string): string[] {
  const problems: string[] = [];
  const robots = dist.read('robots.txt') ?? '';
  if (!robots.includes('Allow: /') || !robots.includes(`Sitemap: ${siteUrl}/sitemap-index.xml`))
    problems.push(`robots.txt must allow crawling and point to ${siteUrl}/sitemap-index.xml`);
  if (dist.read('sitemap-index.xml') === null) problems.push('sitemap-index.xml is missing');
  if (dist.files.some((f) => f.startsWith('_dev/')))
    problems.push('development pages (_dev/) are in the output');
  if (/X-Robots-Tag/i.test(siteWideHeaders(dist.read('_headers') ?? '')))
    problems.push('_headers marks every page noindex');
  if (robotsMeta(dist.read('index.html') ?? '') !== 'index, follow')
    problems.push('the home page is not indexable');
  return problems;
}

function previewProblems(dist: DistReader): string[] {
  const problems: string[] = [];
  if (!(dist.read('robots.txt') ?? '').includes('Disallow: /'))
    problems.push('robots.txt must disallow crawling outside production');
  if (!/X-Robots-Tag: noindex/.test(siteWideHeaders(dist.read('_headers') ?? '')))
    problems.push('_headers must send X-Robots-Tag: noindex outside production');
  if (robotsMeta(dist.read('index.html') ?? '') !== 'noindex')
    problems.push('the home page must be noindex outside production');
  return problems;
}

/** Problems that make a dist folder unsafe to deploy as `env`. */
export function deployProblems(dist: DistReader, env: string, siteUrl: string): string[] {
  const common = dist.read('_headers') === null ? ['_headers is missing'] : [];
  return [
    ...common,
    ...(env === 'production' ? productionProblems(dist, siteUrl) : previewProblems(dist)),
  ];
}

/** MANGOTOOLS_ENV must be set explicitly for a deployment; it is never defaulted. */
export function deployEnvironment(value: string | undefined): 'production' | 'development' | null {
  return value === 'production' || value === 'development' ? value : null;
}
