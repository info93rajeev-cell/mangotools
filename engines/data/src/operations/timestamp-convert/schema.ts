import { z } from 'zod';

export const timestampInput = z.strictObject({ text: z.string() });

export const timestampParams = z.strictObject({
  direction: z.enum(['to-date', 'to-timestamp']).default('to-date'),
  unit: z.enum(['auto', 'seconds', 'milliseconds']).default('auto'),
  basis: z.enum(['local', 'utc']).default('local'),
});

export const timestampOutput = z.strictObject({
  text: z.string(),
  isoString: z.string(),
  utcDisplay: z.string(),
  localDisplay: z.string(),
  unixSeconds: z.int(),
  unixMilliseconds: z.int(),
  detectedUnit: z.enum(['seconds', 'milliseconds']).optional(),
  interpretedBasis: z.enum(['local', 'utc']).optional(),
});

export type TimestampParams = z.infer<typeof timestampParams>;
