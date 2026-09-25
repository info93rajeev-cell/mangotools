import { z } from 'zod';

export const jsonFormatInput = z.strictObject({ text: z.string() });

export const jsonFormatParams = z.strictObject({
  action: z.enum(['format', 'minify', 'validate']).default('format'),
  indent: z.enum(['2', '4', 'tab']).default('2'),
  sortKeys: z.boolean().default(false),
});

export const jsonFormatOutput = z.strictObject({
  text: z.string(),
  valid: z.literal(true),
  stats: z.strictObject({
    inputBytes: z.int(),
    outputBytes: z.int(),
    maxDepth: z.int(),
    objectCount: z.int(),
    arrayCount: z.int(),
  }),
});

export type JsonFormatParams = z.infer<typeof jsonFormatParams>;
