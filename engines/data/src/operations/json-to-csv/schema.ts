import { z } from 'zod';

export const jsonToCsvInput = z.strictObject({ text: z.string() });

/** A dot path of object keys, e.g. "data.items". Empty means the JSON root. */
const recordPath = z
  .string()
  .max(200)
  .regex(/^([^.\s]+(\.[^.\s]+)*)?$/);

export const jsonToCsvParams = z.strictObject({
  /** Field separator written between cells. */
  delimiter: z.enum(['comma', 'semicolon', 'tab', 'pipe']).default('comma'),
  /** Write the column names as the first line. */
  header: z.boolean().default(true),
  /**
   * Nested object or array values. `reject` is the typed error DATA_JSON_TO_CSV_NESTED_VALUE;
   * `flatten` turns objects into dot-path columns (`profile.city`) and writes arrays as JSON text;
   * `json` writes every object or array value as JSON text in its own column.
   */
  nested: z.enum(['reject', 'flatten', 'json']).default('reject'),
  /** `union`: every key from every record. `first`: only the first record's keys. */
  keys: z.enum(['union', 'first']).default('union'),
  /** Where the records are, as a dot path of keys from the root. Empty: the root itself. */
  recordPath: recordPath.default(''),
  /** Prefix a ' to text cells starting with = + - @ tab or CR, so spreadsheets show them as text. */
  formulaGuard: z.boolean().default(false),
});

export const jsonToCsvOutput = z.strictObject({
  text: z.string(),
  rowCount: z.int(),
  columnCount: z.int(),
  headers: z.array(z.string()),
  /** Cells left empty because the record has no such key (null values are not counted). */
  missingCount: z.int(),
  /** Text cells that start with a formula trigger (= + - @ tab CR), guarded or not. */
  formulaCount: z.int(),
  /** Columns with a text value such as "00124" whose leading zero a spreadsheet would drop. */
  leadingZeroColumns: z.array(z.string()),
  /** Dot paths (up to three levels) that hold an array of objects; "" is the root. */
  recordPaths: z.array(z.string()),
  /** The first 100 data rows as the cell texts written (guard included), for a table preview. */
  previewRows: z.array(z.array(z.string())),
});

export type JsonToCsvParams = z.infer<typeof jsonToCsvParams>;
export type JsonToCsvOutput = z.infer<typeof jsonToCsvOutput>;
export type JsonToCsvDelimiter = JsonToCsvParams['delimiter'];
export type JsonToCsvNested = JsonToCsvParams['nested'];
