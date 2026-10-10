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
    expect(sources.marketplaceFeeDatasets).toHaveLength(4);
    for (const { data } of sources.marketplaceFeeDatasets) {
      const d = data as { publicationStatus: string; records: unknown[]; sources: unknown[] };
      expect(d.publicationStatus).toBe('draft');
      expect(d.records).toEqual([]);
      expect(d.sources).toEqual([]);
    }
    // Drafts validate but are never emitted or listed, so none becomes user-facing.
    expect(result.output.datasets).toEqual([]);
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
        publicationStatus: 'published',
        publishedDate: '2026-10-10',
        path: '/reference/marketplace-fees/amazon-in/0.0.0.json',
      },
    ]);
    expect(result.output.datasets.map((d) => d.outputPath)).toEqual([
      'reference/marketplace-fees/amazon-in/0.0.0.json',
    ]);
  });

  it('never emits draft or verified versions', () => {
    const result = validateMarketplaceFeeDatasets([
      { file: 'reference/marketplace-fees/amazon-in/0.0.0.yaml', data: draft() },
      {
        file: 'reference/marketplace-fees/flipkart/0.0.0.yaml',
        data: { ...draft('marketplace-fees.flipkart'), publicationStatus: 'verified' },
      },
    ]);
    expect(result.issues).toEqual([]);
    expect(result.output.datasets).toEqual([]);
    expect(result.output.index.datasets).toEqual([]);
  });

  it('keeps withdrawn versions identifiable but marked withdrawn, after their successor', () => {
    const published = (version: string, extra: Record<string, unknown> = {}) => ({
      ...draft('marketplace-fees.myntra', version),
      publicationStatus: 'published',
      publishedDate: '2026-10-10',
      ...extra,
    });
    const result = validateMarketplaceFeeDatasets([
      {
        file: 'reference/marketplace-fees/myntra/2026.2.yaml',
        data: published('2026.2', { supersedes: '2026.1' }),
      },
      {
        file: 'reference/marketplace-fees/myntra/2026.1.yaml',
        data: published('2026.1', { publicationStatus: 'withdrawn' }),
      },
    ]);
    expect(result.issues).toEqual([]);
    expect(
      result.output.index.datasets.map((d) => [d.version, d.publicationStatus, d.supersedes]),
    ).toEqual([
      ['2026.1', 'withdrawn', undefined],
      ['2026.2', 'published', '2026.1'],
    ]);
    expect(result.output.datasets.map((d) => d.outputPath)).toEqual([
      'reference/marketplace-fees/myntra/2026.1.json',
      'reference/marketplace-fees/myntra/2026.2.json',
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
