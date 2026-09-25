import { describe, expect, it } from 'vitest';
import type { SearchDocument } from './lib/options.ts';
import { buildIndex, createSearcher } from './lib/searcher.ts';

const doc = (id: string, name: string, synonyms: string, summary = ''): SearchDocument => ({
  id,
  kind: 'tool',
  name,
  shortName: '',
  summary,
  synonyms,
  categoryName: '',
  tags: '',
});

const search = createSearcher(
  buildIndex([
    doc('json-formatter', 'JSON Formatter & Validator', 'json beautifier json validator'),
    doc('gst-calculator', 'GST Calculator', 'cgst sgst calculator igst calculator'),
    doc('base64-encode-decode', 'Base64 Encode & Decode', 'base64 encoder b64 base 64'),
  ]),
);

describe('search', () => {
  it('finds by name, synonym and typo', () => {
    expect(search('json')[0]?.id).toBe('json-formatter');
    expect(search('cgst')[0]?.id).toBe('gst-calculator');
    expect(search('jsn formatter')[0]?.id).toBe('json-formatter');
    expect(search('b64')[0]?.id).toBe('base64-encode-decode');
  });

  it('is deterministic and empty for blank queries', () => {
    expect(search('calculator')).toEqual(search('calculator'));
    expect(search('   ')).toEqual([]);
  });
});
