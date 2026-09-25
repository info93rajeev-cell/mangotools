/**
 * Post-build checks over the built HTML (TASK-001 §15.6). Pure functions over file text so they
 * can be unit-tested; scripts/check/postbuild.ts applies them to a dist folder.
 */
import { createHash } from 'node:crypto';

export interface PageFacts {
  file: string;
  template: string | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  h1Count: number;
  jsonLd: string[];
  inlineScripts: string[];
  cspMeta: string | null;
  externalUrls: string[];
}

const attr = (tag: string, name: string) =>
  new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1] ?? null;

const decode = (text: string) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

function scripts(html: string): { attrs: string; body: string }[] {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => ({
    attrs: m[1] ?? '',
    body: m[2] ?? '',
  }));
}

/** Extracts what the checks need from one HTML page. */
export function pageFacts(file: string, html: string): PageFacts {
  const meta = (name: string) => {
    const tag = [...html.matchAll(/<meta\b[^>]*>/g)]
      .map((m) => m[0])
      .find((t) => attr(t, 'name') === name);
    return tag ? decode(attr(tag, 'content') ?? '') : null;
  };
  const canonicalTag = /<link\b[^>]*rel="canonical"[^>]*>/.exec(html)?.[0];
  const cspTag = /<meta\b[^>]*http-equiv="content-security-policy"[^>]*>/i.exec(html)?.[0];
  const all = scripts(html);
  const withoutScripts = html.replace(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
    '',
  );
  return {
    file,
    template: attr(/<html\b[^>]*>/.exec(html)?.[0] ?? '', 'data-template'),
    title: /<title>([\s\S]*?)<\/title>/.exec(html)?.[1]
      ? decode(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '')
      : null,
    description: meta('description'),
    canonical: canonicalTag ? attr(canonicalTag, 'href') : null,
    h1Count: (html.match(/<h1\b/g) ?? []).length,
    jsonLd: all.filter((s) => /type="application\/ld\+json"/.test(s.attrs)).map((s) => s.body),
    inlineScripts: all
      .filter((s) => !/\bsrc=/.test(s.attrs) && !/type="application\/ld\+json"/.test(s.attrs))
      .map((s) => s.body),
    cspMeta: cspTag ? decode(attr(cspTag, 'content') ?? '') : null,
    externalUrls: [...withoutScripts.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]),
  };
}

export const sha256 = (text: string) =>
  `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const SEO_TEMPLATES = new Set(['home', 'tools', 'category', 'tool']);
const ALLOWED_HOSTS = ['schema.org', 'www.w3.org'];

function checkHead(page: PageFacts, siteUrl: string): string[] {
  const problems: string[] = [];
  const seo = page.template !== null && SEO_TEMPLATES.has(page.template);
  const titleLength = [...(page.title ?? '')].length;
  if (!page.title) problems.push('has no <title>');
  else if (titleLength > 60) problems.push(`title is ${titleLength} characters (max 60)`);
  const length = [...(page.description ?? '')].length;
  if (seo && (length < 120 || length > 160))
    problems.push(`description is ${length} characters (120–160)`);
  const canonical = page.canonical ?? '';
  if (seo && !canonical.startsWith(siteUrl)) {
    problems.push(`canonical "${canonical}" is not an absolute URL on ${siteUrl}`);
  }
  if (canonical !== siteUrl && canonical.endsWith('/'))
    problems.push('canonical has a trailing slash');
  return problems;
}

function checkJsonLd(page: PageFacts): string[] {
  return page.jsonLd.flatMap((block) => {
    try {
      JSON.parse(block);
      return [];
    } catch {
      return ['JSON-LD does not parse'];
    }
  });
}

function checkHosts(page: PageFacts, siteUrl: string): string[] {
  return page.externalUrls
    .filter((url) => !url.startsWith(siteUrl))
    .filter((url) => !ALLOWED_HOSTS.includes(/^https?:\/\/([^/]+)/.exec(url)?.[1] ?? ''))
    .map((url) => `references another host: ${url}`);
}

function checkScripts(page: PageFacts): string[] {
  const csp = page.cspMeta ?? '';
  const problems = page.inlineScripts
    .filter((body) => !csp.includes(sha256(body)))
    .map((body) => `inline script ${sha256(body)} is not allowed by the page CSP`);
  if (/script-src[^;]*'unsafe-inline'/.test(csp))
    problems.push("CSP allows 'unsafe-inline' scripts");
  return problems;
}

/** Problems with one page. `siteUrl` is the environment's URL without a trailing slash. */
export function checkPage(page: PageFacts, siteUrl: string): string[] {
  const headings = page.h1Count === 1 ? [] : [`has ${page.h1Count} <h1> elements (expected 1)`];
  return [
    ...headings,
    ...checkHead(page, siteUrl),
    ...checkJsonLd(page),
    ...checkHosts(page, siteUrl),
    ...checkScripts(page),
  ];
}

/** Script hashes from a page's CSP meta. */
export const cspScriptHashes = (csp: string | null): string[] =>
  /script-src([^;]*)/.exec(csp ?? '')?.[1]?.match(/'sha256-[^']+'/g) ?? [];

export interface HeadersOptions {
  scriptHashes: string[];
  indexable: boolean;
}

/** Cloudflare Pages _headers with the site-wide CSP (hashes from every page). */
export function headersFile({ scriptHashes, indexable }: HeadersOptions): string {
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${[...new Set(scriptHashes)].sort().join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  const lines = [
    '/*',
    `  Content-Security-Policy: ${csp}`,
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
    ...(indexable ? [] : ['  X-Robots-Tag: noindex']),
    '',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ];
  return lines.join('\n');
}

/** Module URLs a page loads up front: module scripts and island component/renderer URLs. */
export function entryModules(html: string): string[] {
  const urls = new Set<string>();
  for (const m of html.matchAll(/<script\b[^>]*type="module"[^>]*src="([^"]+)"/g))
    urls.add(m[1] ?? '');
  for (const m of html.matchAll(
    /\b(?:component-url|renderer-url|before-hydration-url)="([^"]+)"/g,
  )) {
    if (m[1]) urls.add(m[1]);
  }
  for (const s of scripts(html)) {
    for (const m of s.body.matchAll(/import\s*(?:[^'"()]*?from\s*)?["'](\/[^"']+\.js)["']/g))
      urls.add(m[1] ?? '');
  }
  return [...urls].filter(Boolean);
}

/** Static imports of a built module ("./x.js" relative), not dynamic imports or workers. */
export function staticImports(code: string): string[] {
  const found = new Set<string>();
  for (const m of code.matchAll(
    /(?:^|[;\s}])import\s*(?:[\w*{}\s,$]+from\s*)?["'](\.{1,2}\/[^"']+)["']/g,
  )) {
    found.add(m[1] ?? '');
  }
  for (const m of code.matchAll(/\bexport\s*(?:\*|\{[^}]*\})\s*from\s*["'](\.{1,2}\/[^"']+)["']/g))
    found.add(m[1] ?? '');
  return [...found].filter(Boolean);
}
