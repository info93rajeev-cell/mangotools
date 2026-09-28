/**
 * Domain-specific helpers for the Export Commercial Invoice Generator's multi-item rows (TASK-009G).
 * The field-name-agnostic mechanism (the JSON-through-`FieldValues` codec, the row-error-path parser)
 * now lives in `itemRows.ts`, shared with the Export Packing List Generator (TASK-009I) as the second
 * real consumer proved it stable. Everything here — the field list, defaults, and the
 * invoice-to-packing-list transfer shaping — stays invoice-specific.
 */

import { parseRowError as parseRowErrorShared, parseRows, serializeRows } from './itemRows.ts';

export interface ItemRowValues {
  description: string;
  sku: string;
  hsn: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  countryOfOrigin: string;
  netWeight: string;
}

export const ITEM_ROW_FIELDS = [
  'description',
  'sku',
  'hsn',
  'quantity',
  'unit',
  'unitPrice',
  'countryOfOrigin',
  'netWeight',
] as const;

export type ItemRowField = (typeof ITEM_ROW_FIELDS)[number];

const NUMERIC_ITEM_FIELDS = new Set<ItemRowField>(['quantity', 'unitPrice', 'netWeight']);

export function emptyItemRow(): ItemRowValues {
  return {
    description: '',
    sku: '',
    hsn: '',
    quantity: '',
    unit: 'PCS',
    unitPrice: '',
    countryOfOrigin: '',
    netWeight: '',
  };
}

/** Reads the form's `items` field value back into rows; always at least one row. */
export function parseItemRows(raw: string): ItemRowValues[] {
  const defaults = emptyItemRow() as unknown as Record<string, string>;
  return parseRows(raw, ITEM_ROW_FIELDS, defaults) as unknown as ItemRowValues[];
}

/** Encodes rows for the engine. A blank optional field is left out entirely (never `""`), exactly
 * like every other optional field on the platform, so the engine reads it as genuinely absent. */
export function serializeItemRows(rows: ItemRowValues[]): string {
  return serializeRows(
    rows as unknown as Record<string, string>[],
    ITEM_ROW_FIELDS,
    NUMERIC_ITEM_FIELDS,
  );
}

export interface RowError {
  index: number;
  field: ItemRowField;
}

/** Maps an engine error's `path` (e.g. "items[1].quantity") back to the row and field it names. */
export function parseRowError(path: string | undefined): RowError | null {
  const result = parseRowErrorShared(path, ITEM_ROW_FIELDS);
  return result ? { index: result.index, field: result.field as ItemRowField } : null;
}

/**
 * Shapes a tool's flat form values just before a TASK-009D transfer to another tool. Every other
 * tool has no `items` key at all, so this returns `values` unchanged for them. For this invoice: a
 * single-item invoice still supplies its one item's identity fields exactly as before this task's
 * multi-item change; a multi-item invoice withholds them entirely, rather than silently transferring
 * only the first item as if it stood for the whole invoice. `transfer.ts` itself is untouched — this
 * only fills in (or blanks) the same flat keys `pickTransferValues` already reads.
 */
export function invoiceTransferValues(
  values: Record<string, string | boolean>,
): Record<string, string | boolean> {
  if (typeof values.items !== 'string') return values;
  const rows = parseItemRows(values.items);
  const only = rows.length === 1 ? rows[0] : undefined;
  return {
    ...values,
    itemDescription: only?.description ?? '',
    itemSku: only?.sku ?? '',
    itemUnit: only?.unit ?? '',
    itemCountryOfOrigin: only?.countryOfOrigin ?? '',
  };
}
