import searchIndex from '@generated/search-index.json';
import type { APIRoute } from 'astro';

/** The prebuilt search index, fetched by the search box on first focus. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(searchIndex), { headers: { 'Content-Type': 'application/json' } });
