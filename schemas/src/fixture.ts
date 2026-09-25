import { z } from 'zod';
import { operationRef, presetId } from './common.ts';

export const fixtureSchema = z
  .strictObject({
    id: z
      .string()
      .regex(/^\d{3}-[a-z0-9]+(-[a-z0-9.]+)*$/, 'Fixture ids look like 001-short-description.'),
    operation: operationRef.optional(),
    preset: presetId.optional(),
    source: z.strictObject({
      type: z.enum(['textbook', 'standard', 'hand-verified', 'regression', 'synthetic']),
      citation: z.string().optional(),
    }),
    synthetic: z.boolean().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
    input: z.record(z.string(), z.unknown()),
    expected: z.record(z.string(), z.unknown()).optional(),
    expectedWarnings: z.array(z.string()).optional(),
    expectedError: z.strictObject({ code: z.string(), path: z.string().optional() }).optional(),
    match: z.enum(['subset', 'exact']).optional(),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((f, ctx) => {
    if (!f.operation === !f.preset)
      ctx.addIssue({
        code: 'custom',
        path: ['operation'],
        message: 'Set exactly one of operation or preset.',
      });
    if (!f.expected === !f.expectedError)
      ctx.addIssue({
        code: 'custom',
        path: ['expected'],
        message: 'Set exactly one of expected or expectedError.',
      });
    if (!['regression', 'synthetic'].includes(f.source.type) && !f.source.citation)
      ctx.addIssue({ code: 'custom', path: ['source', 'citation'], message: 'Cite the source.' });
  });

export type Fixture = z.infer<typeof fixtureSchema>;
