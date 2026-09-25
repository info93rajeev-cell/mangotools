import { z } from 'zod';

export const base64Input = z.strictObject({ text: z.string() });

export const base64Params = z.strictObject({
  direction: z.enum(['encode', 'decode']).default('encode'),
  variant: z.enum(['standard', 'url-safe', 'auto']).default('standard'),
  padding: z.boolean().default(true),
  lineLength: z.enum(['0', '76']).default('0'),
});

export const base64Output = z.strictObject({
  text: z.string(),
  byteLength: z.int(),
  isUtf8: z.boolean(),
  hexPreview: z.string().optional(),
});

export type Base64Params = z.infer<typeof base64Params>;
