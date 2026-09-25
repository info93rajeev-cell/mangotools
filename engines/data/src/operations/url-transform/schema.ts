import { z } from 'zod';

export const urlInput = z.strictObject({ text: z.string() });

export const urlParams = z.strictObject({
  direction: z.enum(['encode', 'decode']).default('encode'),
  mode: z.enum(['component', 'full-url', 'form']).default('component'),
});

export const urlOutput = z.strictObject({ text: z.string(), changedCount: z.int() });

export type UrlParams = z.infer<typeof urlParams>;
