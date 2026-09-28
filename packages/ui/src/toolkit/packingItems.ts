/**
 * Domain-specific helpers for the Export Packing List Generator's multi-item rows (TASK-009I). The
 * field-name-agnostic mechanism (the JSON-through-`FieldValues` codec, the row-error-path parser)
 * lives in `itemRows.ts`, shared with the Export Commercial Invoice Generator (TASK-009G) as the
 * first real consumer. Everything here — the field list, defaults, and the incoming-transfer row
 * shaping — stays packing-list-specific.
 */

import { parseRowError as parseRowErrorShared, parseRows, serializeRows } from './itemRows.ts';

export interface PackingItemRowValues {
  description: string;
  sku: string;
  hsn: string;
  countryOfOrigin: string;
  quantity: string;
  unit: string;
}

export const PACKING_ITEM_ROW_FIELDS = [
  'description',
  'sku',
  'hsn',
  'countryOfOrigin',
  'quantity',
  'unit',
] as const;

export type PackingItemRowField = (typeof PACKING_ITEM_ROW_FIELDS)[number];

const NUMERIC_PACKING_ITEM_FIELDS = new Set<PackingItemRowField>(['quantity']);

export function emptyPackingItemRow(): PackingItemRowValues {
  return { description: '', sku: '', hsn: '', countryOfOrigin: '', quantity: '', unit: 'PCS' };
}

/** Reads the form's `items` field value back into rows; always at least one row. */
export function parsePackingItemRows(raw: string): PackingItemRowValues[] {
  const defaults = emptyPackingItemRow() as unknown as Record<string, string>;
  return parseRows(raw, PACKING_ITEM_ROW_FIELDS, defaults) as unknown as PackingItemRowValues[];
}

/** Encodes rows for the engine. A blank optional field is left out entirely (never `""`), exactly
 * like every other optional field on the platform, so the engine reads it as genuinely absent. */
export function serializePackingItemRows(rows: PackingItemRowValues[]): string {
  return serializeRows(
    rows as unknown as Record<string, string>[],
    PACKING_ITEM_ROW_FIELDS,
    NUMERIC_PACKING_ITEM_FIELDS,
  );
}

export interface PackingRowError {
  index: number;
  field: PackingItemRowField;
}

/** Maps an engine error's `path` (e.g. "items[1].quantity") back to the row and field it names. */
export function parsePackingRowError(path: string | undefined): PackingRowError | null {
  const result = parseRowErrorShared(path, PACKING_ITEM_ROW_FIELDS);
  return result ? { index: result.index, field: result.field as PackingItemRowField } : null;
}

/**
 * Shapes an incoming TASK-009D transfer payload just before it is applied to this tool's form
 * values. The Commercial Invoice Generator's own `transferTo.fields` list (unchanged by this task)
 * still sends flat `itemDescription`/`itemSku`/`itemUnit`/`itemCountryOfOrigin` keys — this tool no
 * longer has those as flat preset fields (replaced by `items`), so without this step the generic
 * `filterTransferValues` would silently drop them and a previously-working single-item transfer would
 * stop populating any item at all. This folds those same four keys into row 0 of this tool's own
 * `items` field instead. It is NOT a new multi-row transfer: at most one row is ever populated here,
 * exactly matching the single-item behavior TASK-009D shipped, now expressed through this tool's array
 * shape. `transfer.ts` and the sender's `transferTo` schema/field list are both untouched.
 */
export function shapeIncomingPackingTransfer(
  payload: Record<string, string>,
): Record<string, string> {
  const { itemDescription, itemSku, itemUnit, itemCountryOfOrigin, ...rest } = payload;
  if (!itemDescription && !itemSku && !itemUnit && !itemCountryOfOrigin) return payload;
  const row: PackingItemRowValues = {
    ...emptyPackingItemRow(),
    description: itemDescription ?? '',
    sku: itemSku ?? '',
    unit: itemUnit || 'PCS',
    countryOfOrigin: itemCountryOfOrigin ?? '',
  };
  return { ...rest, items: serializePackingItemRows([row]) };
}
