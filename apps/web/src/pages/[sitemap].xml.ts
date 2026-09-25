import type { APIRoute, GetStaticPaths } from 'astro';
import { absolute, indexable, listedTools, visibleCategories } from '../lib/site.ts';

/** Indexable pages: home, /tools, visible categories and beta/stable tools. */
export function indexablePages(): { path: string; lastmod?: string }[] {
  return [
    { path: '/' },
    { path: '/tools' },
    ...visibleCategories.map((c) => ({ path: c.url })),
    ...listedTools.map((t) => ({ path: t.url, lastmod: t.content.lastReviewed })),
  ];
}

// Sitemaps exist only in indexable environments.
export const getStaticPaths: GetStaticPaths = () =>
  indexable
    ? [{ params: { sitemap: 'sitemap-index' } }, { params: { sitemap: 'sitemap-pages' } }]
    : [];

const XML = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';

export const GET: APIRoute = ({ params }) => {
  const body =
    params.sitemap === 'sitemap-index'
      ? `${XML}<sitemapindex xmlns="${NS}"><sitemap><loc>${absolute('/sitemap-pages.xml')}</loc></sitemap></sitemapindex>\n`
      : `${XML}<urlset xmlns="${NS}">${indexablePages()
          .map(
            (p) =>
              `<url><loc>${absolute(p.path)}</loc>${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ''}</url>`,
          )
          .join('')}</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
