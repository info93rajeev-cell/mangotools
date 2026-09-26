import { describe, expect, it } from 'vitest';
import { createSearcher } from '../../engines/search/src/index.ts';
import { runPipeline } from '../../scripts/generate/pipeline.ts';
import { loadSources } from '../../scripts/generate/sources.ts';
import { loadEngines } from '../../scripts/lib/engines.ts';

const { output } = await runPipeline(loadSources().sources, await loadEngines());
if (!output) throw new Error('pnpm gen pipeline failed; run pnpm gen for details.');
const search = createSearcher(output.searchIndex.index);
const top = (q: string) => search(q, 3)[0]?.id;

describe('search relevance over the generated index', () => {
  const cases: [string, string][] = [
    ['JSON Formatter', 'json-formatter'],
    ['Base64 Encode & Decode', 'base64-encode-decode'],
    ['URL Encode & Decode', 'url-encode-decode'],
    ['GST Calculator', 'gst-calculator'],
    ['Profit Margin Calculator', 'profit-margin-calculator'],
    ['gst', 'gst-calculator'],
    ['json beautifier', 'json-formatter'],
    ['jsn formatter', 'json-formatter'],
    ['b64', 'base64-encode-decode'],
    ['percent encoding', 'url-encode-decode'],
    ['urlencode', 'url-encode-decode'],
    ['cgst sgst', 'gst-calculator'],
    ['goods and services tax', 'gst-calculator'],
    ['gross margin', 'profit-margin-calculator'],
    ['Markup Calculator', 'markup-calculator'],
    ['markup', 'markup-calculator'],
    ['mark up', 'markup-calculator'],
    ['cost plus pricing', 'markup-calculator'],
    ['selling price from markup', 'markup-calculator'],
    ['selling price from margin', 'profit-margin-calculator'],
    ['CBM Calculator', 'cbm-calculator'],
    ['cbm', 'cbm-calculator'],
    ['cubic meter', 'cbm-calculator'],
    ['cubic metre', 'cbm-calculator'],
    ['carton volume', 'cbm-calculator'],
    ['cargo volume', 'cbm-calculator'],
    ['shipping volume', 'cbm-calculator'],
    ['Volumetric Weight Calculator', 'volumetric-weight-calculator'],
    ['volumetric weight', 'volumetric-weight-calculator'],
    ['dimensional weight', 'volumetric-weight-calculator'],
    ['courier weight', 'volumetric-weight-calculator'],
    ['chargeable weight', 'volumetric-weight-calculator'],
    ['shipping weight', 'volumetric-weight-calculator'],
    ['air freight weight', 'volumetric-weight-calculator'],
    ['dim weight', 'volumetric-weight-calculator'],
    ['Container Loading Calculator', 'container-loading-calculator'],
    ['container loading calculator', 'container-loading-calculator'],
    ['container capacity calculator', 'container-loading-calculator'],
    ['carton container calculator', 'container-loading-calculator'],
    ['how many cartons in a container', 'container-loading-calculator'],
    ['20ft container calculator', 'container-loading-calculator'],
    ['40ft container calculator', 'container-loading-calculator'],
    ['shipping container calculator', 'container-loading-calculator'],
    ['Pallet Loading Calculator', 'pallet-loading-calculator'],
    ['pallet loading calculator', 'pallet-loading-calculator'],
    ['pallet capacity calculator', 'pallet-loading-calculator'],
    ['carton pallet calculator', 'pallet-loading-calculator'],
    ['how many cartons on a pallet', 'pallet-loading-calculator'],
    ['euro pallet calculator', 'pallet-loading-calculator'],
    ['pallet planner', 'pallet-loading-calculator'],
    ['PDF Merge', 'pdf-merge'],
    ['pdf merge', 'pdf-merge'],
    ['merge pdf', 'pdf-merge'],
    ['combine pdf', 'pdf-merge'],
    ['pdf joiner', 'pdf-merge'],
    ['combine pdf files', 'pdf-merge'],
    ['merge pdf online', 'pdf-merge'],
    ['browser pdf merger', 'pdf-merge'],
    ['no upload pdf merge', 'pdf-merge'],
  ];
  for (const [query, expected] of cases) {
    it(`"${query}" → ${expected}`, () => expect(top(query)).toBe(expected));
  }

  it('"logistics calculator" finds all four logistics tools first', () => {
    const ids = search('logistics calculator', 4).map((r) => r.id);
    expect(ids.sort()).toEqual([
      'cbm-calculator',
      'container-loading-calculator',
      'pallet-loading-calculator',
      'volumetric-weight-calculator',
    ]);
  });

  it('returns nothing for an empty query', () => expect(search('  ')).toEqual([]));
  it('is deterministic', () => expect(search('encode')).toEqual(search('encode')));
});
