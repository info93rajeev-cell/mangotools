import index from '@generated/reference/marketplace-fees/index.json';
import type { MarketplaceFeeIndex } from '@mangotools/schemas';
import type { APIRoute, GetStaticPaths } from 'astro';

/**
 * One immutable marketplace fee dataset version (TASK-008E Task A,
 * DECISION-MARKETPLACE-FEE-REFERENCE-DATA §4). Pages are built only for versions the generated index
 * lists, so a URL names a known platform and version and never carries user input; any other path is
 * not built and falls through to the site's 404.
 */
const files = import.meta.glob<unknown>('@generated/reference/marketplace-fees/*/*.json', {
  eager: true,
  import: 'default',
});

const listed = (index as MarketplaceFeeIndex).datasets;

export const getStaticPaths: GetStaticPaths = () =>
  listed.map((d) => ({ params: { platform: d.platform, version: d.version } }));

export const GET: APIRoute = ({ params }) => {
  const entry = listed.find((d) => d.platform === params.platform && d.version === params.version);
  const data = entry
    ? Object.entries(files).find(([file]) => file.endsWith(entry.path))?.[1]
    : undefined;
  if (data === undefined)
    throw new Error(`No generated dataset for ${params.platform}/${params.version}.`);
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
