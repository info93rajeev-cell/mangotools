import { z } from 'zod';

export const csvToJsonInput = z.strictObject({ text: z.string() });

/** Comma-separated 1-based column numbers, e.g. "2,5". Empty means keep every column. */
const columnList = z.string().regex(/^(\d{1,4}(,\d{1,4})*)?$/);

export const csvToJsonParams = z.strictObject({
  pretty: z.boolean().default(true),
  /** Field separator. `auto` picks the most frequent of , ; tab | on the first line. */
  delimiter: z.enum(['comma', 'semicolon', 'tab', 'pipe', 'auto']).default('comma'),
  /** First row holds column names. Off: columns are named column_1, column_2, … */
  header: z.boolean().default(true),
  /** Remove leading and trailing spaces from every header and value. */
  trim: z.boolean().default(false),
  /** Drop rows whose every value is empty (fully blank lines are always skipped). */
  skipEmptyRows: z.boolean().default(false),
  /** Turn canonical numbers, true/false into JSON numbers and booleans. Off: all strings. */
  inferTypes: z.boolean().default(false),
  /** Write empty values as null instead of "". */
  emptyAsNull: z.boolean().default(false),
  /** Comma-separated tokens written as null, e.g. "NA,N/A,null". Matched exactly. */
  nullValues: z.string().max(500).default(''),
  /** Keep at most this many data rows. Empty or 0 keeps every row. */
  maxRows: z
    .string()
    .regex(/^\d{0,7}$/)
    .default(''),
  /** objects: [{…}], arrays: [[headers…], [values…]], ndjson: one object per line. */
  shape: z.enum(['objects', 'arrays', 'ndjson']).default('objects'),
  /** Columns to leave out of the output, as 1-based numbers. */
  excludeColumns: columnList.default(''),
  /** Wrap the result as { meta: { rowCount, columnCount, columns }, data }. Not for ndjson. */
  metadata: z.boolean().default(false),
});

export const csvColumnType = z.enum(['string', 'number', 'boolean', 'null', 'mixed']);

export const csvToJsonOutput = z.strictObject({
  text: z.string(),
  rowCount: z.int(),
  columnCount: z.int(),
  headers: z.array(z.string()),
  /** Every source column (included or not) with the JSON type its output values have. */
  columns: z.array(
    z.strictObject({
      name: z.string(),
      type: csvColumnType,
      sample: z.string(),
      included: z.boolean(),
    }),
  ),
  /** The delimiter actually used (resolves `auto`). */
  delimiter: z.enum(['comma', 'semicolon', 'tab', 'pipe']),
  /** Data rows in the source before maxRows was applied. */
  sourceRowCount: z.int(),
});

export type CsvToJsonParams = z.infer<typeof csvToJsonParams>;
export type CsvColumnType = z.infer<typeof csvColumnType>;
export type CsvDelimiterName = z.infer<typeof csvToJsonOutput>['delimiter'];
