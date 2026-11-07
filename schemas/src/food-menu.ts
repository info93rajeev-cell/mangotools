/**
 * Food Planner shared menu versions, saved plans and price references (TASK-FP-001).
 * A published menu version is immutable; saved plans pin the version they were made from.
 */
import { z } from 'zod';
import { isoDate, kebabId, semver } from './common.ts';
import { foodDecimal, foodDietSchema, foodUnitSchema } from './food.ts';

export const foodMenuCategorySchema = z.enum(['small-party', 'wedding', 'corporate', 'festivals']);

/** Immutable id: <category>-<YYYY-MM-DD>-<sequence>, e.g. wedding-2026-11-01-1. */
export const foodMenuVersionId = z
  .string()
  .regex(
    /^(small-party|wedding|corporate|festivals)-\d{4}-\d{2}-\d{2}-[1-9]\d{0,2}$/,
    'Menu version ids look like wedding-2026-11-01-1.',
  );

/** An actually observed trend item. Only the collector writes these; they are never invented. */
export const foodTrendObservationSchema = z.strictObject({
  source: z.literal('google-trends-rss'),
  feedUrl: z.url(),
  geo: z.string().regex(/^[A-Z]{2}(-[A-Z0-9]{1,3})?$/),
  term: z.string().min(1).max(120),
  approxTraffic: z.string().max(20).optional(),
  observedAt: z.iso.datetime({ offset: true }),
});

/**
 * Why an item is on the menu. verified-foundation: a checked recipe chosen for the category.
 * seasonal: chosen for season/occasion/region by a stated rule. observed-trend: linked to a
 * collected trend observation (a supporting signal, never proof of popularity).
 */
export const foodMenuReasonSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('verified-foundation'), note: z.string().max(200) }),
  z.strictObject({
    kind: z.literal('seasonal'),
    season: z.enum(['summer', 'monsoon', 'post-monsoon', 'winter', 'all-year']),
    occasion: z.string().max(60).optional(),
    region: z.string().max(60).optional(),
    note: z.string().max(200),
  }),
  z.strictObject({
    kind: z.literal('observed-trend'),
    /** Index into the version's trendObservations. */
    observation: z.int().min(0),
    note: z.string().max(200),
  }),
]);

export const foodMenuItemSchema = z.strictObject({
  recipe: kebabId,
  recipeVersion: semver,
  reasons: z.array(foodMenuReasonSchema).min(1),
});

/**
 * draft → validated → published → superseded. withdrawn only for a published version found to
 * be wrong; it stays readable so saved plans still open.
 */
export const foodMenuStatusSchema = z.enum([
  'draft',
  'validated',
  'published',
  'superseded',
  'withdrawn',
]);

export const foodMenuVersionSchema = z
  .strictObject({
    id: foodMenuVersionId,
    category: foodMenuCategorySchema,
    status: foodMenuStatusSchema,
    /** Region the version is built for; "IN" is all-India. */
    region: z.string().min(2).max(10),
    createdAt: z.iso.datetime({ offset: true }),
    publishedAt: z.iso.datetime({ offset: true }).optional(),
    /** The version this one replaces; omitted for the first version of a category. */
    supersedes: foodMenuVersionId.optional(),
    /** Next scheduled review (30 days after creation). */
    reviewBy: isoDate,
    items: z.array(foodMenuItemSchema).min(3).max(30),
    trendObservations: z.array(foodTrendObservationSchema).default([]),
    validation: z.strictObject({
      passed: z.boolean(),
      checks: z.array(z.string().min(1).max(200)).min(1),
      /** True when trend data was missing and the version reuses the previous selection. */
      fellBackToPrevious: z.boolean(),
    }),
  })
  .superRefine((menu, ctx) => {
    if (!menu.id.startsWith(`${menu.category}-`)) {
      ctx.addIssue({ code: 'custom', path: ['id'], message: 'id must start with the category.' });
    }
    if (['published', 'superseded'].includes(menu.status) && !menu.publishedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['publishedAt'],
        message: 'Published versions need publishedAt.',
      });
    }
    if (menu.status !== 'draft' && !menu.validation.passed) {
      ctx.addIssue({
        code: 'custom',
        path: ['validation'],
        message: 'Only drafts may fail validation.',
      });
    }
    menu.items.forEach((item, i) => {
      for (const reason of item.reasons) {
        if (
          reason.kind === 'observed-trend' &&
          reason.observation >= menu.trendObservations.length
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', i, 'reasons'],
            message: 'An observed-trend reason must point at a recorded observation.',
          });
        }
      }
    });
  });

/** Where a price comes from. Never presented as a live store price. */
export const foodPriceKindSchema = z.enum([
  'wholesale-reference',
  'retail-reference',
  'user-entered',
]);

export const foodPriceReferenceSchema = z.strictObject({
  ingredient: kebabId,
  kind: foodPriceKindSchema,
  /** INR for `per` units of `unit`, e.g. 4200 per 100 kg (one quintal). */
  priceInr: foodDecimal,
  per: foodDecimal,
  unit: foodUnitSchema,
  /** Required for references; omitted for user-entered prices. */
  source: z
    .strictObject({ name: z.string().min(1).max(120), url: z.url(), market: z.string().max(80) })
    .optional(),
  observedOn: isoDate,
});

/**
 * A visitor's saved plan, stored on their device. It pins the menu version and keeps its own copy
 * of the chosen recipe versions, so a later menu version never changes it.
 */
export const foodSavedPlanSchema = z.strictObject({
  schema: z.literal(1),
  menuVersion: foodMenuVersionId,
  recipes: z.array(z.strictObject({ recipe: kebabId, recipeVersion: semver })).min(1),
  guests: z.int().min(1).max(5000),
  diet: foodDietSchema.optional(),
  budgetInr: foodDecimal.optional(),
  prices: z.array(foodPriceReferenceSchema).default([]),
  savedAt: z.iso.datetime({ offset: true }),
});
