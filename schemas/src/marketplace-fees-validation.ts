import type { z } from 'zod';
import type {
  MarketplaceFeeDatasetBase,
  MarketplaceFeeRecord,
  MarketplaceFeeSource,
} from './marketplace-fees.ts';

const amountKeys = ['ratePercent', 'fixedAmount', 'minimumAmount', 'maximumAmount'] as const;
const provenanceKeys = ['sourceTitle', 'sourceURL', 'sourceAuthority', 'sourceOfficial'] as const;
const conditionKeys = [
  'category',
  'subcategory',
  'sellerTierOrProgramme',
  'fulfilmentMode',
  'priceMin',
  'priceMax',
  'weightMin',
  'weightMax',
  'weightUnit',
  'zone',
] as const;

function compareDecimal(left: string, right: string): number {
  const split = (value: string) => {
    const negative = value.startsWith('-');
    const [integer = '0', fraction = ''] = (negative ? value.slice(1) : value).split('.');
    return { negative, integer, fraction };
  };
  const a = split(left);
  const b = split(right);
  const scale = Math.max(a.fraction.length, b.fraction.length);
  const scaled = (value: ReturnType<typeof split>) => {
    const digits = `${value.integer}${value.fraction.padEnd(scale, '0')}`;
    const number = BigInt(digits || '0');
    return value.negative ? -number : number;
  };
  const aValue = scaled(a);
  const bValue = scaled(b);
  return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
}

function addIssue(ctx: z.RefinementCtx, path: PropertyKey[], message: string) {
  ctx.addIssue({ code: 'custom', path, message });
}

function validateAmountAndProvenance(
  record: MarketplaceFeeRecord,
  path: PropertyKey[],
  ctx: z.RefinementCtx,
) {
  const hasAmount = amountKeys.some((key) => record[key] !== undefined);
  if (record.status === 'user-input' && hasAmount)
    addIssue(ctx, path, 'User-input records must not contain numeric fee amounts.');
  if (['verified', 'conditional'].includes(record.status)) {
    if (!hasAmount) addIssue(ctx, path, 'Verified or conditional records need a fee amount.');
    const complete = provenanceKeys.every((key) => record[key] !== undefined);
    if (!record.sourceId || !complete || record.sourceOfficial !== true || !record.verifiedDate)
      addIssue(ctx, path, 'Verified or conditional records need complete official provenance.');
  }
  const hasProvenance = provenanceKeys.some((key) => record[key] !== undefined);
  if (hasProvenance && !record.sourceId)
    addIssue(ctx, [...path, 'sourceId'], 'Source provenance requires sourceId.');
}

function validateRanges(record: MarketplaceFeeRecord, path: PropertyKey[], ctx: z.RefinementCtx) {
  if ((record.weightMin !== undefined || record.weightMax !== undefined) && !record.weightUnit)
    addIssue(ctx, [...path, 'weightUnit'], 'Weight bounds require weightUnit.');
  for (const [minKey, maxKey] of [
    ['priceMin', 'priceMax'],
    ['weightMin', 'weightMax'],
  ] as const) {
    const min = record[minKey];
    const max = record[maxKey];
    if (min !== undefined && max !== undefined && compareDecimal(min, max) > 0)
      addIssue(ctx, [...path, maxKey], `${maxKey} must be greater than or equal to ${minKey}.`);
  }
}

function validateRecordShape(record: MarketplaceFeeRecord, index: number, ctx: z.RefinementCtx) {
  const path = ['records', index];
  validateAmountAndProvenance(record, path, ctx);
  validateRanges(record, path, ctx);
  if (record.effectiveFrom && record.effectiveTo && record.effectiveTo < record.effectiveFrom)
    addIssue(ctx, [...path, 'effectiveTo'], 'effectiveTo must not precede effectiveFrom.');
  if (record.calculationBasis === 'other' && !record.notes)
    addIssue(ctx, [...path, 'notes'], 'The other calculation basis requires notes.');
}

function validateRecordSource(
  record: MarketplaceFeeRecord,
  index: number,
  sources: Map<string, MarketplaceFeeSource>,
  ctx: z.RefinementCtx,
) {
  if (!record.sourceId) return;
  const source = sources.get(record.sourceId);
  const path = ['records', index, 'sourceId'];
  if (!source) return addIssue(ctx, path, `Unknown sourceId "${record.sourceId}".`);
  const pairs = [
    ['sourceTitle', 'title'],
    ['sourceURL', 'url'],
    ['sourceAuthority', 'authority'],
    ['sourceOfficial', 'official'],
  ] as const;
  for (const [recordKey, sourceKey] of pairs) {
    if (record[recordKey] !== source[sourceKey])
      addIssue(ctx, ['records', index, recordKey], `${recordKey} must match sourceId.`);
  }
  if (!source.official && ['verified', 'conditional'].includes(record.status))
    addIssue(ctx, ['records', index, 'status'], 'Non-official sources may only be unverified.');
}

function conditionIdentity(record: MarketplaceFeeRecord): string {
  return JSON.stringify([
    record.platform,
    record.feeType,
    ...conditionKeys.map((key) => record[key] ?? null),
  ]);
}

function periodsOverlap(left: MarketplaceFeeRecord, right: MarketplaceFeeRecord): boolean {
  if (!left.effectiveFrom || !right.effectiveFrom) return false;
  const leftEnd = left.effectiveTo ?? '9999-12-31';
  const rightEnd = right.effectiveTo ?? '9999-12-31';
  return left.effectiveFrom <= rightEnd && right.effectiveFrom <= leftEnd;
}

function validateSources(dataset: MarketplaceFeeDatasetBase, ctx: z.RefinementCtx) {
  const sourceIds = new Set<string>();
  for (const [index, source] of dataset.sources.entries()) {
    if (sourceIds.has(source.id)) addIssue(ctx, ['sources', index, 'id'], 'Duplicate source id.');
    sourceIds.add(source.id);
    if (['licensed', 'customer-provided'].includes(source.licenceClass))
      addIssue(ctx, ['sources', index, 'licenceClass'], 'Restricted sources must not ship here.');
    if (
      dataset.publicationStatus === 'published' &&
      (source.termsReview.status !== 'approved' ||
        !['public', 'government-open'].includes(source.licenceClass))
    )
      addIssue(ctx, ['sources', index], 'Published datasets require approved public sources.');
  }
}

function validateRecords(dataset: MarketplaceFeeDatasetBase, ctx: z.RefinementCtx) {
  const sources = new Map(dataset.sources.map((source) => [source.id, source]));
  const ids = new Set<string>();
  for (const [index, record] of dataset.records.entries()) {
    if (ids.has(record.id)) addIssue(ctx, ['records', index, 'id'], 'Duplicate record id.');
    ids.add(record.id);
    validateRecordShape(record, index, ctx);
    validateRecordSource(record, index, sources, ctx);
    if (record.platform !== dataset.family.replace('marketplace-fees.', ''))
      addIssue(ctx, ['records', index, 'platform'], 'Record platform must match dataset family.');
    if (dataset.publishedDate && record.verifiedDate && record.verifiedDate > dataset.publishedDate)
      addIssue(
        ctx,
        ['records', index, 'verifiedDate'],
        'verifiedDate must not follow publishedDate.',
      );
  }
}

function validateOverlaps(dataset: MarketplaceFeeDatasetBase, ctx: z.RefinementCtx) {
  for (let left = 0; left < dataset.records.length; left += 1) {
    for (let right = left + 1; right < dataset.records.length; right += 1) {
      const a = dataset.records[left] as MarketplaceFeeRecord;
      const b = dataset.records[right] as MarketplaceFeeRecord;
      if (conditionIdentity(a) === conditionIdentity(b) && periodsOverlap(a, b))
        addIssue(ctx, ['records', right], `Effective period overlaps record "${a.id}".`);
    }
  }
}

export function validateMarketplaceFeeDataset(
  dataset: MarketplaceFeeDatasetBase,
  ctx: z.RefinementCtx,
) {
  if (['licensed', 'customer-provided'].includes(dataset.licence))
    addIssue(ctx, ['licence'], 'Restricted datasets must not ship in this repository.');
  const needsDate = ['published', 'withdrawn'].includes(dataset.publicationStatus);
  if (needsDate !== (dataset.publishedDate !== undefined))
    addIssue(
      ctx,
      ['publishedDate'],
      'publishedDate is required only for published or withdrawn datasets.',
    );
  validateSources(dataset, ctx);
  validateRecords(dataset, ctx);
  validateOverlaps(dataset, ctx);
}
