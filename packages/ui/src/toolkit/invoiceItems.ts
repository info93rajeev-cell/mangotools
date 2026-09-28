/**
 * Pure helpers for the Export Commercial Invoice Generator's multi-item rows (TASK-009G). This is
 * deliberately invoice-specific: the rows are encoded as a single JSON string under one synthetic
 * preset field (`items`), which is the smallest way to carry a structured array through the existing
 * flat `FieldValues` pipe without changing `ToolStore`, `buildRequest`, or the preset field schema.
 * Nothing here is a generic "repeatable field group" primitive — nothing else on the platform reads
 * or writes this shape.
 */

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

/** Mirrors `@mangotools/runtime`'s `normalizeNumberText`, so a row's numbers get the same grouping
 * and symbol stripping ("1,000", "₹5") as every other numeric field on the platform. */
const normalizeNumberText = (raw: string) => raw.replace(/[\s,_₹%]/g, '');

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

const asText = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

function normalizeRow(row: unknown): ItemRowValues {
  const r = row !== null && typeof row === 'object' ? (row as Record<string, unknown>) : {};
  return {
    description: asText(r.description),
    sku: asText(r.sku),
    hsn: asText(r.hsn),
    quantity: asText(r.quantity),
    unit: asText(r.unit) || 'PCS',
    unitPrice: asText(r.unitPrice),
    countryOfOrigin: asText(r.countryOfOrigin),
    netWeight: asText(r.netWeight),
  };
}

/** Reads the form's `items` field value back into rows; always at least one row. */
export function parseItemRows(raw: string): ItemRowValues[] {
  if (raw.trim() === '') return [emptyItemRow()];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [emptyItemRow()];
    return parsed.map(normalizeRow);
  } catch {
    return [emptyItemRow()];
  }
}

/** Encodes rows for the engine. A blank optional field is left out entirely (never `""`), exactly
 * like every other optional field on the platform, so the engine reads it as genuinely absent. */
export function serializeItemRows(rows: ItemRowValues[]): string {
  const payload = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const field of ITEM_ROW_FIELDS) {
      const value = row[field];
      if (value.trim() === '') continue;
      out[field] = NUMERIC_ITEM_FIELDS.has(field) ? normalizeNumberText(value) : value;
    }
    return out;
  });
  return JSON.stringify(payload);
}

export interface RowError {
  index: number;
  field: ItemRowField;
}

const ROW_ERROR_PATH = /^items\[(\d+)\]\.(\w+)$/;

/** Maps an engine error's `path` (e.g. "items[1].quantity") back to the row and field it names. */
export function parseRowError(path: string | undefined): RowError | null {
  if (!path) return null;
  const match = ROW_ERROR_PATH.exec(path);
  if (!match) return null;
  const field = match[2];
  if (!(ITEM_ROW_FIELDS as readonly string[]).includes(field ?? '')) return null;
  return { index: Number(match[1]), field: field as ItemRowField };
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
