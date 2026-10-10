import { describe, expect, it } from 'vitest';
import { marketplaceFeeDatasetSchema } from './marketplace-fees.ts';

const source = {
  id: 'official-fees',
  title: 'Official fee schedule',
  url: 'https://example.test/fees',
  authority: 'Example marketplace',
  official: true,
  licenceClass: 'public',
  termsReview: {
    status: 'approved',
    reviewer: 'Founder',
    date: '2026-10-09',
    basis: 'Official public schedule; derived facts only.',
  },
};

const record = {
  id: 'referral-standard-2026',
  platform: 'amazon-in',
  feeType: 'referral-commission',
  officialFeeName: 'Referral fee',
  ratePercent: '10.25',
  calculationBasis: 'percent-of-item-price',
  taxTreatment: 'gst-extra',
  effectiveFrom: '2026-01-01',
  verifiedDate: '2026-10-09',
  sourceId: source.id,
  sourceTitle: source.title,
  sourceURL: source.url,
  sourceAuthority: source.authority,
  sourceOfficial: source.official,
  status: 'verified',
};

const published = () => ({
  family: 'marketplace-fees.amazon-in',
  type: 'marketplace-fee-schedule',
  version: '2026.10.0',
  currency: 'INR',
  licence: 'public',
  publicationStatus: 'published',
  publishedDate: '2026-10-10',
  sources: [structuredClone(source)],
  records: [structuredClone(record)],
});

const messages = (value: unknown) => {
  const parsed = marketplaceFeeDatasetSchema.safeParse(value);
  return parsed.success ? [] : parsed.error.issues.map((entry) => entry.message);
};

describe('marketplaceFeeDatasetSchema', () => {
  it('accepts empty draft structure and a fully sourced published dataset', () => {
    const draft = {
      ...published(),
      publicationStatus: 'draft',
      publishedDate: undefined,
      records: [],
    };
    expect(marketplaceFeeDatasetSchema.safeParse(draft).success).toBe(true);
    expect(marketplaceFeeDatasetSchema.safeParse(published()).success).toBe(true);
  });

  it('is strict and requires the publication date only for published or withdrawn versions', () => {
    expect(messages({ ...published(), extra: true })).not.toEqual([]);
    expect(messages({ ...published(), publishedDate: undefined })).toContain(
      'publishedDate is required only for published or withdrawn datasets.',
    );
    expect(messages({ ...published(), publicationStatus: 'draft' })).toContain(
      'publishedDate is required only for published or withdrawn datasets.',
    );
  });

  it('keeps user-input records numeric-free and sourced statuses fully evidenced', () => {
    const userInput = { ...record, status: 'user-input', ratePercent: '10' };
    expect(messages({ ...published(), records: [userInput] })).toContain(
      'User-input records must not contain numeric fee amounts.',
    );
    const missing = { ...record, sourceId: undefined, sourceTitle: undefined };
    expect(messages({ ...published(), records: [missing] })).toContain(
      'Verified or conditional records need complete official provenance.',
    );
  });

  it('resolves sourceId and requires copied provenance to match the register', () => {
    const unknown = { ...record, sourceId: 'missing-source' };
    expect(messages({ ...published(), records: [unknown] })).toContain(
      'Unknown sourceId "missing-source".',
    );
    const mismatched = { ...record, sourceTitle: 'Different title' };
    expect(messages({ ...published(), records: [mismatched] })).toContain(
      'sourceTitle must match sourceId.',
    );
  });

  it('rejects restricted sources and unapproved sources in published versions', () => {
    const restricted = { ...source, licenceClass: 'licensed' };
    expect(messages({ ...published(), sources: [restricted] })).toContain(
      'Restricted sources must not ship here.',
    );
    const pending = { ...source, termsReview: { ...source.termsReview, status: 'pending' } };
    expect(messages({ ...published(), sources: [pending] })).toContain(
      'Published datasets require approved public sources.',
    );
    expect(messages({ ...published(), licence: 'customer-provided' })).toContain(
      'Restricted datasets must not ship in this repository.',
    );
  });

  it('allows secondary sources only for unverified records', () => {
    const secondary = { ...source, official: false };
    const sourced = { ...record, sourceOfficial: false };
    expect(messages({ ...published(), sources: [secondary], records: [sourced] })).toContain(
      'Non-official sources may only be unverified.',
    );
    expect(
      marketplaceFeeDatasetSchema.safeParse({
        ...published(),
        sources: [secondary],
        records: [{ ...sourced, status: 'unverified' }],
      }).success,
    ).toBe(true);
  });

  it('validates date ordering, publication cutoff and record platform', () => {
    const invalid = {
      ...record,
      platform: 'flipkart',
      effectiveFrom: '2026-02-01',
      effectiveTo: '2026-01-31',
      verifiedDate: '2026-10-11',
    };
    const result = messages({ ...published(), records: [invalid] });
    expect(result).toContain('effectiveTo must not precede effectiveFrom.');
    expect(result).toContain('verifiedDate must not follow publishedDate.');
    expect(result).toContain('Record platform must match dataset family.');
  });

  it('compares decimal ranges without floating point and requires weight units', () => {
    const invalid = { ...record, priceMin: '100.001', priceMax: '100', weightMin: '1' };
    const result = messages({ ...published(), records: [invalid] });
    expect(result).toContain('priceMax must be greater than or equal to priceMin.');
    expect(result).toContain('Weight bounds require weightUnit.');
  });

  it('rejects duplicate ids and overlapping identical condition periods', () => {
    const overlapping = {
      ...record,
      id: 'referral-standard-2027',
      effectiveFrom: '2026-06-01',
    };
    const result = messages({
      ...published(),
      sources: [source, source],
      records: [record, record, overlapping],
    });
    expect(result).toContain('Duplicate source id.');
    expect(result).toContain('Duplicate record id.');
    expect(result.some((message) => message.includes('Effective period overlaps'))).toBe(true);
  });

  it('requires notes for the other calculation basis', () => {
    const other = { ...record, calculationBasis: 'other' };
    expect(messages({ ...published(), records: [other] })).toContain(
      'The other calculation basis requires notes.',
    );
  });
});
