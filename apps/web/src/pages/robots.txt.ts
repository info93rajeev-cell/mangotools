import type { APIRoute } from 'astro';
import { absolute, indexable } from '../lib/site.ts';

/** Production allows crawling and points at the sitemap; every other environment is closed. */
export const GET: APIRoute = () => {
  const body = indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap-index.xml')}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
