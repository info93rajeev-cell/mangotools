import { describe, expect, it } from 'vitest';
import { validateMarketplaceFeeDatasets } from './marketplace-fees.ts';
import { loadSources } from './sources.ts';

const draft = (family = 'marketplace-fees.amazon-in', version = '0.0.0') => ({
  family,
  type: 'marketplace-fee-schedule',
  version,
  currency: 'INR',
  licence: 'public',
  publicationStatus: 'draft',
  sources: [],
  records: [],
});

describe('marketplace fee generation', () => {
  it('loads all four structure-only repository datasets without publishing rates', () => {
    const { sources, issues } = loadSources();
    const result = validateMarketplaceFeeDatasets(sources.marketplaceFeeDatasets);
    expect(issues).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(result.output.datasets).toHaveLength(4);
    expect(result.output.datasets.every(({ data }) => data.records.length === 0)).toBe(true);
    expect(result.output.index.datasets).toEqual([]);
  });

  it('places a published version in the immutable generated index', () => {
    const data = {
      ...draft(),
      publicationStatus: 'published',
      publishedDate: '2026-10-10',
    };
    const result = validateMarketplaceFeeDatasets([
      { file: 'reference/marketplace-fees/amazon-in/0.0.0.yaml', data },
    ]);
    expect(result.issues).toEqual([]);
    expect(result.output.index.datasets).toEqual([
      {
        family: 'marketplace-fees.amazon-in',
        platform: 'amazon-in',
        version: '0.0.0',
        publishedDate: '2026-10-10',
        path: 'reference/marketplace-fees/amazon-in/0.0.0.json',
      },
    ]);
  });

  it('rejects path identity mismatches and duplicate dataset identities', () => {
    const result = validateMarketplaceFeeDatasets([
      { file: 'reference/marketplace-fees/flipkart/wrong.yaml', data: draft() },
      { file: 'reference/marketplace-fees/amazon-in/0.0.0.yaml', data: draft() },
    ]);
    expect(result.issues.map((entry) => entry.message)).toEqual(
      expect.arrayContaining([
        'Folder platform must match dataset family.',
        'Filename must match dataset version.',
        'Duplicate dataset identity "marketplace-fees.amazon-in@0.0.0".',
      ]),
    );
  });
});
