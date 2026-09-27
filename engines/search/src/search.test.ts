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

describe('search — reversed converter pairs', () => {
  const converters = createSearcher(
    buildIndex([
      doc(
        'csv-to-json',
        'CSV to JSON',
        'convert csv to json · csv json converter · csv to json online',
      ),
      doc(
        'json-to-csv',
        'JSON to CSV',
        'convert json to csv · json csv converter · json to csv online',
      ),
    ]),
  );

  it('"csv to json" ranks CSV to JSON first', () => {
    expect(converters('csv to json')[0]?.id).toBe('csv-to-json');
  });

  it('"convert csv to json" ranks CSV to JSON first', () => {
    expect(converters('convert csv to json')[0]?.id).toBe('csv-to-json');
  });

  it('"json to csv" ranks JSON to CSV first', () => {
    expect(converters('json to csv')[0]?.id).toBe('json-to-csv');
  });

  it('"convert json to csv" ranks JSON to CSV first', () => {
    expect(converters('convert json to csv')[0]?.id).toBe('json-to-csv');
  });

  it('an ambiguous "X Y converter" phrase still favors the tool that has it verbatim', () => {
    expect(converters('csv json converter')[0]?.id).toBe('csv-to-json');
    expect(converters('json csv converter')[0]?.id).toBe('json-to-csv');
  });
});
