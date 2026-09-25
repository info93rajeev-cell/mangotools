import { z } from 'zod';
import { isoDate, kebabId, lengthBetween, presetId, semver } from './common.ts';

/** Lowercases and reduces punctuation such as "&" or "–" to single spaces. */
export const normalizeWords = (text: string) =>
  ` ${text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()} `;

export const manifestSchema = z
  .strictObject({
    manifestVersion: z.literal(1),
    id: kebabId,
    slug: kebabId,
    status: z.enum(['alpha', 'beta', 'stable', 'deprecated']),
    tier: z.enum(['T1', 'T2', 'T3', 'T4']),
    variantOf: kebabId.optional(),
    version: semver,
    changelog: z
      .array(
        z.strictObject({
          version: semver,
          date: isoDate,
          type: z.enum(['added', 'changed', 'fixed', 'removed']),
          summary: z.string().min(5).max(140),
        }),
      )
      .min(1),
    name: lengthBetween(3, 60, 'name'),
    shortName: z.string().max(24).optional(),
    summary: lengthBetween(50, 140, 'summary'),
    archetype: z.enum(['A', 'B', 'C', 'D', 'E']),
    preset: presetId,
    sample: z.string().optional(),
    taxonomy: z.strictObject({
      category: kebabId,
      subcategory: kebabId.optional(),
      professions: z.array(kebabId).max(6).optional(),
      tags: z.array(kebabId).max(8).optional(),
      synonyms: z
        .array(
          z
            .string()
            .max(40)
            .regex(/^[^A-Z]*$/, 'Synonyms are lowercase.'),
        )
        .max(15)
        .optional(),
    }),
    capabilities: z
      .strictObject({
        export: z.array(z.string()).optional(),
        print: z.boolean().optional(),
        share: z.boolean().optional(),
      })
      .optional(),
    privacy: z.strictObject({
      dataClass: z.enum(['public', 'personal', 'sensitive']),
      network: z.enum(['none', 'declared']),
    }),
    disclaimer: z.enum(['none', 'standard', 'professional', 'sensitive']),
    seo: z.strictObject({
      title: lengthBetween(30, 60, 'seo.title'),
      description: lengthBetween(120, 160, 'seo.description'),
      primaryKeyword: z.string().min(3),
      secondaryKeywords: z.array(z.string()).max(8).optional(),
      h1: z.string().optional(),
    }),
    graph: z
      .strictObject({
        related: z.array(kebabId).max(6).optional(),
        next: z.array(kebabId).max(3).optional(),
      })
      .optional(),
    quality: z
      .strictObject({
        verifiedAgainst: z
          .array(z.strictObject({ citation: z.string(), locator: z.string() }))
          .min(1),
        lastVerified: isoDate,
      })
      .optional(),
  })
  .superRefine((m, ctx) => {
    if (m.id !== m.slug)
      ctx.addIssue({ code: 'custom', path: ['slug'], message: 'In Phase 1, slug must equal id.' });
    if (m.tier === 'T4' && !m.variantOf)
      ctx.addIssue({
        code: 'custom',
        path: ['variantOf'],
        message: 'T4 tools must declare variantOf.',
      });
    if ((m.tier === 'T1' || m.tier === 'T2') && !m.quality)
      ctx.addIssue({
        code: 'custom',
        path: ['quality'],
        message: 'T1/T2 tools need quality.verifiedAgainst.',
      });
    if (m.changelog[0]?.version !== m.version)
      ctx.addIssue({
        code: 'custom',
        path: ['changelog'],
        message: 'First changelog entry must match version.',
      });
    if (!normalizeWords(m.seo.title).includes(normalizeWords(m.seo.primaryKeyword)))
      ctx.addIssue({
        code: 'custom',
        path: ['seo', 'title'],
        message: 'seo.title must contain seo.primaryKeyword (punctuation is ignored).',
      });
  });

export type Manifest = z.infer<typeof manifestSchema>;
