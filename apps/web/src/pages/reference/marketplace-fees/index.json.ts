import index from '@generated/reference/marketplace-fees/index.json';
import type { APIRoute } from 'astro';

/**
 * Index of servable marketplace fee dataset versions (TASK-008E Task A), served as a same-origin
 * static file like /search-index.json. It is not cached as immutable: it changes when a version is
 * published or withdrawn. No runtime code fetches it yet.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
