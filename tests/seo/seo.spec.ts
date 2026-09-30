import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Registry } from '@mangotools/schemas';
import { expect, test } from '@playwright/test';

const registry = JSON.parse(
  readFileSync(join(process.cwd(), 'generated/registry.json'), 'utf8'),
) as Registry;
const SITE = registry.site.environments.production?.url ?? '';
const listed = registry.tools.filter((t) => t.listed);
const categories = registry.categories.filter((c) => c.visible);

async function ldTypes(page: import('@playwright/test').Page): Promise<string[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((b) => (JSON.parse(b) as { '@type': string })['@type']).sort();
}

test('home: title, canonical, Organization and WebSite', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('BeyondTheAI — Tools for Work That Should Not Depend on AI');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  expect(await ldTypes(page)).toEqual(['Organization', 'WebSite']);
});

test('public identity: BeyondTheAI on https://beyondtheai.com with no parent organisation', async ({
  page,
}) => {
  expect(SITE).toBe('https://beyondtheai.com');
  await page.goto('/');
  const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
    (b) => JSON.parse(b) as Record<string, unknown>,
  );
  const organization = blocks.find((b) => b['@type'] === 'Organization');
  expect(organization).toMatchObject({ name: 'BeyondTheAI', url: SITE });
  expect(organization).not.toHaveProperty('parentOrganization');
  expect(blocks.find((b) => b['@type'] === 'WebSite')).toMatchObject({
    name: 'BeyondTheAI',
    url: SITE,
    publisher: { '@id': `${SITE}/#organization` },
  });
  expect(organization).toMatchObject({ '@id': `${SITE}/#organization` });
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'BeyondTheAI',
  );
  await expect(page.locator('footer')).toContainText('BeyondTheAI');
  await expect(page.locator('body')).not.toContainText(/MangoTools|MangoPie/);
});

for (const category of categories) {
  test(`category ${category.id}: BreadcrumbList and ItemList`, async ({ page }) => {
    await page.goto(category.url);
    await expect(page).toHaveTitle(category.seo.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${SITE}${category.url}`,
    );
    expect(await ldTypes(page)).toEqual(['BreadcrumbList', 'ItemList']);
  });
}

for (const tool of listed) {
  test(`tool ${tool.id}: WebApplication, BreadcrumbList and FAQPage`, async ({ page }) => {
    await page.goto(tool.url);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      tool.seo.description,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${SITE}${tool.url}`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      new RegExp(`^${SITE}/assets/`),
    );
    expect(await ldTypes(page)).toEqual(['BreadcrumbList', 'FAQPage', 'WebApplication']);
    const app = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .map((b) => JSON.parse(b) as Record<string, unknown>)
      .find((b) => b['@type'] === 'WebApplication');
    expect(app).toMatchObject({
      name: tool.name,
      url: `${SITE}${tool.url}`,
      publisher: { '@id': `${SITE}/#organization`, name: 'BeyondTheAI', url: SITE },
    });
    const title = await page.title();
    expect([...title].length).toBeLessThanOrEqual(60);
  });
}

const PAGES_DIR = join(process.cwd(), 'content/pages');
const approvedPages = (existsSync(PAGES_DIR) ? readdirSync(PAGES_DIR) : [])
  .filter((f) => f.endsWith('.md'))
  .filter((f) => /^status:\s*approved\s*$/m.test(readFileSync(join(PAGES_DIR, f), 'utf8')))
  .map((f) => `/${f.replace(/\.md$/, '')}`);

test('site information pages: only approved pages are published and linked', async ({ page }) => {
  await page.goto('/');
  const links = await page
    .locator('footer nav[aria-label="Site information"] a')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(links.sort()).toEqual([...approvedPages].sort());
  for (const path of ['/about', '/privacy', '/disclaimer']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(approvedPages.includes(path) ? 200 : 404);
  }
});

for (const tool of listed) {
  test(`tool ${tool.id}: FAQPage JSON-LD matches the visible FAQ`, async ({ page }) => {
    await page.goto(tool.url);
    const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
      (b) => JSON.parse(b) as { '@type': string; mainEntity?: unknown },
    );
    const faq = blocks.find((b) => b['@type'] === 'FAQPage')?.mainEntity as {
      name: string;
      acceptedAnswer: { text: string };
    }[];
    const visible = await page.locator('.faq details').evaluateAll((items) =>
      items.map((d) => ({
        q: d.querySelector('summary')?.textContent ?? '',
        a: d.querySelector('.answer')?.textContent ?? '',
      })),
    );
    const squash = (t: string) => t.replace(/\s+/g, '');
    expect(faq.map((f) => f.name)).toEqual(visible.map((v) => v.q.trim()));
    expect(faq.map((f) => squash(f.acceptedAnswer.text))).toEqual(visible.map((v) => squash(v.a)));
  });
}

test('Round 1 contract: 7 visible categories, 31 listed tools, 40 sitemap URLs', async ({
  request,
}) => {
  expect(categories).toHaveLength(7);
  expect(listed).toHaveLength(31);
  const pages = await (await request.get('/sitemap-pages.xml')).text();
  expect([...pages.matchAll(/<loc>/g)]).toHaveLength(1 + 1 + 7 + 31);
});

test('one canonical per page, absolute on the production host, no trailing slash', async ({
  page,
}) => {
  for (const path of [
    '/',
    '/tools',
    ...categories.map((c) => c.url),
    ...listed.map((t) => t.url),
  ]) {
    await page.goto(path);
    const canonicals = await page
      .locator('link[rel="canonical"]')
      .evaluateAll((ls) => ls.map((l) => l.getAttribute('href') ?? ''));
    expect(canonicals, path).toEqual([path === '/' ? SITE : `${SITE}${path}`]);
  }
});

test('sitemap lists exactly the indexable pages; robots points to it', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  const index = await (await request.get('/sitemap-index.xml')).text();
  expect(index).toContain(`${SITE}/sitemap-pages.xml`);
  const pages = await (await request.get('/sitemap-pages.xml')).text();
  const urls = [...pages.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  const expected = [
    SITE,
    `${SITE}/tools`,
    ...categories.map((c) => `${SITE}${c.url}`),
    ...listed.map((t) => `${SITE}${t.url}`),
  ].sort();
  expect(urls).toEqual(expected);
});

test('security headers and CSP are served', async ({ request }) => {
  const response = await request.get('/gst-calculator');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).toMatch(/script-src 'self'( 'sha256-[^']+')+;/);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-robots-tag']).toBeUndefined();
});

test('pages run under the CSP without violations', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || /Content Security Policy/i.test(m.text())) problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(e.message));
  for (const path of ['/', '/tools', '/business', ...listed.map((t) => t.url)]) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(problems).toEqual([]);
});

test('development builds are not indexable', async ({ request }) => {
  const dev = 'http://127.0.0.1:4322';
  expect(await (await request.get(`${dev}/robots.txt`)).text()).toContain('Disallow: /');
  expect((await request.get(`${dev}/sitemap-pages.xml`)).status()).toBe(404);
  expect((await request.get(`${dev}/gst-calculator`)).headers()['x-robots-tag']).toBe('noindex');
});
