/**
 * Post-deploy smoke checks over fetched responses. Pure functions, unit-tested; scripts/check/smoke.ts
 * fetches a live deployment and applies them.
 */
export interface Fetched {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const meta = (html: string, name: string) =>
  new RegExp(`<meta name="${name}" content="([^"]*)"`).exec(html)?.[1] ?? null;
const canonicalOf = (html: string) =>
  /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1] ?? null;

/** Home page: status, canonical, robots and brand. `preview` expects a noindex deployment. */
export function checkHome(res: Fetched, site: string, brand: string, preview: boolean): string[] {
  const problems: string[] = [];
  if (res.status !== 200) problems.push(`home returned ${res.status}`);
  if (!preview && canonicalOf(res.body) !== site) problems.push(`home canonical is not ${site}`);
  const robots = meta(res.body, 'robots');
  const expected = preview ? 'noindex' : 'index, follow';
  if (robots !== expected) problems.push(`home robots meta is "${robots}", expected "${expected}"`);
  if (!/<title>[^<]*<\/title>/.test(res.body) || !res.body.includes(brand))
    problems.push(`home does not show ${brand}`);
  return problems;
}

/** Security headers from _headers; noindex only on previews. */
export function checkHeaders(res: Fetched, preview: boolean): string[] {
  const h = res.headers;
  const csp = h['content-security-policy'] ?? '';
  const problems: string[] = [];
  if (!csp.includes("default-src 'self'") || !csp.includes("frame-ancestors 'none'"))
    problems.push('Content-Security-Policy header is missing or incomplete');
  if (h['x-content-type-options'] !== 'nosniff')
    problems.push('X-Content-Type-Options is not nosniff');
  if (h['referrer-policy'] !== 'strict-origin-when-cross-origin')
    problems.push('Referrer-Policy is not strict-origin-when-cross-origin');
  if (!h['permissions-policy']) problems.push('Permissions-Policy header is missing');
  const noindex = /noindex/i.test(h['x-robots-tag'] ?? '');
  if (preview && !noindex) problems.push('preview is missing X-Robots-Tag: noindex');
  if (!preview && noindex) problems.push('production sends X-Robots-Tag: noindex');
  return problems;
}

export function checkRobots(body: string, site: string, preview: boolean): string[] {
  if (preview)
    return body.includes('Disallow: /') ? [] : ['preview robots.txt does not disallow crawling'];
  const ok = body.includes('Allow: /') && body.includes(`Sitemap: ${site}/sitemap-index.xml`);
  return ok ? [] : [`robots.txt must allow crawling and list ${site}/sitemap-index.xml`];
}

export const locs = (xml: string): string[] =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '');

/** A permanent redirect to exactly `target`. */
export function checkRedirect(res: Fetched, target: string, what: string): string[] {
  const permanent = res.status === 301 || res.status === 308;
  const location = res.headers.location ?? '';
  return permanent && location === target
    ? []
    : [`${what}: expected a 301/308 to ${target}, got ${res.status} ${location}`.trim()];
}
