import { z } from 'zod';

/**
 * A generic repeatable-row field (`kind: 'rows'`, TASK-008L PR 3): an ordered list of small,
 * strict rows, each made of primitive columns only. Rows never contain other row lists, so there is
 * no recursion. In a form the whole list is one JSON-encoded field value; the runtime turns it into
 * an array of row objects for the engine (`packages/runtime/src/rows.ts`).
 */

export const rowColumnKinds = ['text', 'number', 'money', 'percent', 'enum'] as const;
export type RowColumnKind = (typeof rowColumnKinds)[number];

/** Lower-camel-case column keys, matching engine input keys such as `min`, `chargeMode`. */
const columnKey = z.string().regex(/^[a-z][A-Za-z0-9]*$/, 'Use a lowerCamelCase column key.');

export const MAX_ROW_COLUMNS = 12;
export const MAX_ROWS_LIMIT = 50;

export const rowColumnSchema = z.strictObject({
  labelKey: z.string(),
  kind: z.enum(rowColumnKinds),
  required: z.boolean().optional(),
  /** Choices for an `enum` column; values are strings. */
  options: z
    .array(z.strictObject({ value: z.string(), labelKey: z.string().optional() }))
    .min(1)
    .optional(),
  /** Value a new row starts with; for an `enum` column it must be one of the options. */
  default: z.string().optional(),
  unit: z.string().optional(),
  placeholderKey: z.string().optional(),
  helpKey: z.string().optional(),
});

export type RowColumn = z.infer<typeof rowColumnSchema>;

function columnProblems(key: string, column: RowColumn): string[] {
  if (column.kind !== 'enum') {
    return column.options ? [`Column "${key}" has options but is not an enum.`] : [];
  }
  if (!column.options) return [`Enum column "${key}" needs options.`];
  const values = column.options.map((o) => o.value);
  const bad = column.default !== undefined && !values.includes(column.default);
  return bad ? [`Column "${key}" default is not one of its options.`] : [];
}

function defaultRowProblems(
  row: Record<string, string>,
  index: number,
  columns: Record<string, RowColumn>,
): string[] {
  const problems: string[] = [];
  for (const [key, value] of Object.entries(row)) {
    const column = columns[key];
    if (!column) problems.push(`Default row ${index} has unknown column "${key}".`);
    else if (column.kind === 'enum' && !column.options?.some((o) => o.value === value)) {
      problems.push(`Default row ${index} column "${key}" is not one of its options.`);
    }
  }
  return problems;
}

export const rowsSpecSchema = z
  .strictObject({
    columns: z.record(columnKey, rowColumnSchema),
    /** Fewest rows the form keeps (remove is disabled at this count). Default 0. */
    minRows: z.int().min(0).max(MAX_ROWS_LIMIT).optional(),
    /** Most rows the form allows (add is disabled at this count). */
    maxRows: z.int().min(1).max(MAX_ROWS_LIMIT),
    /** Rows a fresh or reset form starts with; otherwise `minRows` empty rows. */
    defaultRows: z.array(z.record(z.string(), z.string())).optional(),
  })
  .superRefine((spec, ctx) => {
    const problems: string[] = [];
    const entries = Object.entries(spec.columns);
    if (entries.length === 0 || entries.length > MAX_ROW_COLUMNS) {
      problems.push(`Rows need 1–${MAX_ROW_COLUMNS} columns.`);
    }
    for (const [key, column] of entries) problems.push(...columnProblems(key, column));
    const min = spec.minRows ?? 0;
    if (min > spec.maxRows) problems.push('minRows must not exceed maxRows.');
    const defaults = spec.defaultRows ?? [];
    if (spec.defaultRows && (defaults.length < min || defaults.length > spec.maxRows)) {
      problems.push('defaultRows must contain between minRows and maxRows rows.');
    }
    defaults.forEach((row, i) => {
      problems.push(...defaultRowProblems(row, i, spec.columns));
    });
    for (const message of problems) ctx.addIssue({ code: 'custom', message });
  });

export type RowsSpec = z.infer<typeof rowsSpecSchema>;
