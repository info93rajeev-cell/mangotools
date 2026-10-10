import { z } from 'zod';
import { isoDate, kebabId } from './common.ts';
import { validateMarketplaceFeeDataset } from './marketplace-fees-validation.ts';

const decimalString = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Use a plain decimal string.');
const datasetVersion = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Use a filename-safe dataset version.');

export const marketplacePlatformSchema = z.enum(['amazon-in', 'flipkart', 'meesho', 'myntra']);
export const marketplaceFeeFamilySchema = z.enum([
  'marketplace-fees.amazon-in',
  'marketplace-fees.flipkart',
  'marketplace-fees.meesho',
  'marketplace-fees.myntra',
]);
export const marketplaceFeeStatusSchema = z.enum([
  'verified',
  'conditional',
  'user-input',
  'unverified',
]);
export const marketplaceFeeLicenceSchema = z.enum([
  'public',
  'government-open',
  'licensed',
  'customer-provided',
]);

const termsReviewSchema = z
  .object({
    status: z.enum(['approved', 'pending', 'blocked']),
    reviewer: z.string().min(1),
    date: isoDate,
    basis: z.string().min(1),
  })
  .strict();

export const marketplaceFeeSourceSchema = z
  .object({
    id: kebabId,
    title: z.string().min(1),
    url: z.string().min(1),
    authority: z.string().min(1),
    official: z.boolean(),
    licenceClass: marketplaceFeeLicenceSchema,
    termsReview: termsReviewSchema,
  })
  .strict();

const feeTypeSchema = z.enum([
  'referral-commission',
  'closing-fixed',
  'collection-payment',
  'shipping-logistics',
  'fulfilment',
  'pick-and-pack',
  'storage',
  'packaging',
  'cod',
  'reverse-logistics',
  'return',
  'rto',
  'cancellation',
  'platform-service',
  'advertising-promotion',
  'other',
]);

export const marketplaceFeeRecordSchema = z
  .object({
    id: kebabId,
    supersedes: kebabId.optional(),
    platform: marketplacePlatformSchema,
    feeType: feeTypeSchema,
    officialFeeName: z.string().min(1),
    category: z.string().min(1).optional(),
    subcategory: z.string().min(1).optional(),
    sellerTierOrProgramme: z.string().min(1).optional(),
    fulfilmentMode: z.string().min(1).optional(),
    priceMin: decimalString.optional(),
    priceMax: decimalString.optional(),
    weightMin: decimalString.optional(),
    weightMax: decimalString.optional(),
    weightUnit: z.enum(['g', 'kg']).optional(),
    zone: z.string().min(1).optional(),
    ratePercent: decimalString.optional(),
    fixedAmount: decimalString.optional(),
    minimumAmount: decimalString.optional(),
    maximumAmount: decimalString.optional(),
    calculationBasis: z.enum([
      'percent-of-item-price',
      'percent-of-order-value',
      'fixed-per-unit',
      'fixed-per-order',
      'fixed-per-shipment',
      'per-weight-slab',
      'per-volume-per-period',
      'other',
    ]),
    gstRateOnFee: decimalString.optional(),
    taxTreatment: z.enum(['gst-extra', 'gst-inclusive', 'not-applicable', 'unknown']),
    effectiveFrom: isoDate.optional(),
    effectiveTo: isoDate.optional(),
    announcementDate: isoDate.optional(),
    verifiedDate: isoDate.optional(),
    sourceId: kebabId.optional(),
    sourceTitle: z.string().min(1).optional(),
    sourceURL: z.string().min(1).optional(),
    sourceAuthority: z.string().min(1).optional(),
    sourceOfficial: z.boolean().optional(),
    status: marketplaceFeeStatusSchema,
    notes: z.string().min(1).optional(),
  })
  .strict();

const marketplaceFeeDatasetBaseSchema = z
  .object({
    family: marketplaceFeeFamilySchema,
    type: z.literal('marketplace-fee-schedule'),
    version: datasetVersion,
    currency: z.literal('INR'),
    licence: marketplaceFeeLicenceSchema,
    publicationStatus: z.enum(['draft', 'verified', 'published', 'withdrawn']),
    publishedDate: isoDate.optional(),
    supersedes: datasetVersion.optional(),
    sources: z.array(marketplaceFeeSourceSchema),
    records: z.array(marketplaceFeeRecordSchema),
  })
  .strict();

export type MarketplaceFeeDatasetBase = z.infer<typeof marketplaceFeeDatasetBaseSchema>;
export const marketplaceFeeDatasetSchema = marketplaceFeeDatasetBaseSchema.superRefine(
  validateMarketplaceFeeDataset,
);

export const marketplaceFeeIndexSchema = z
  .object({
    marketplaceFeeIndexVersion: z.literal(1),
    datasets: z.array(
      z
        .object({
          family: marketplaceFeeFamilySchema,
          platform: marketplacePlatformSchema,
          version: datasetVersion,
          publishedDate: isoDate,
          path: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type MarketplaceFeeDataset = z.infer<typeof marketplaceFeeDatasetSchema>;
export type MarketplaceFeeRecord = z.infer<typeof marketplaceFeeRecordSchema>;
export type MarketplaceFeeSource = z.infer<typeof marketplaceFeeSourceSchema>;
export type MarketplaceFeeIndex = z.infer<typeof marketplaceFeeIndexSchema>;
