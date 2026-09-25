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
  ];
  for (const [query, expected] of cases) {
    it(`"${query}" → ${expected}`, () => expect(top(query)).toBe(expected));
  }

  it('returns nothing for an empty query', () => expect(search('  ')).toEqual([]));
  it('is deterministic', () => expect(search('encode')).toEqual(search('encode')));
});
