import { z } from 'zod';
import { imageResizeInput, imageResizeOutput, imageResizeParams } from '../resize/schema.ts';

export const uploadInput = imageResizeInput
  .extend({
    keepAspectRatio: z.literal(true).default(true),
    outputFormat: z.enum(['jpg', 'png']),
    quality: z.number().min(50).max(100).default(90),
    maxFileSizeKB: z.number().int().min(1).max(25_000).optional(),
    padToTarget: z.boolean().default(false),
    allowDimensionReduction: z.boolean().default(false),
  })
  .refine((value) => !(value.padToTarget && value.allowDimensionReduction), {
    path: ['allowDimensionReduction'],
    message: 'Exact padded dimensions cannot be reduced.',
  });
export const uploadOutput = imageResizeOutput.extend({
  targetFileSizeBytes: z.number().int().positive().nullable(),
  encodeAttempts: z.number().int().min(1).max(32),
});
export const uploadParams = imageResizeParams;
export type UploadInput = z.infer<typeof uploadInput>;
