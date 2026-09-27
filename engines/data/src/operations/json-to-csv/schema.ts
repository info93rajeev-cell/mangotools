import { z } from 'zod';

export const jsonToCsvInput = z.strictObject({ text: z.string() });

export const jsonToCsvParams = z.strictObject({});

export const jsonToCsvOutput = z.strictObject({
  text: z.string(),
  rowCount: z.int(),
  columnCount: z.int(),
  headers: z.array(z.string()),
});

export type JsonToCsvParams = z.infer<typeof jsonToCsvParams>;
