import { z } from 'zod';

export const csvToJsonInput = z.strictObject({ text: z.string() });

export const csvToJsonParams = z.strictObject({
  pretty: z.boolean().default(true),
});

export const csvToJsonOutput = z.strictObject({
  text: z.string(),
  rowCount: z.int(),
  columnCount: z.int(),
  headers: z.array(z.string()),
});

export type CsvToJsonParams = z.infer<typeof csvToJsonParams>;
