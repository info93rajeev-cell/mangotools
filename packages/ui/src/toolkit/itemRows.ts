/**
 * Narrow, field-name-agnostic pieces shared between the Export Commercial Invoice Generator's
 * (TASK-009G) and Export Packing List Generator's (TASK-009I) repeatable item rows: the two real
 * consumers TASK-009H's architecture spike required before extracting anything. Each tool still owns
 * its own field list, row defaults, row rendering and result columns — this module only extracts the
 * parts proven identical: the JSON-through-`FieldValues` codec and the row-error-path parser. It is
 * not a generic repeatable-field framework; nothing here reads a preset to discover field shape, and
 * nothing here is preset-driven or dynamically configured.
 */

export interface RowError {
  index: number;
  field: string;
}

const ROW_ERROR_PATH = /^items\[(\d+)\]\.(\w+)$/;

/** Maps an engine error's `path` (e.g. "items[1].quantity") back to the row and field it names, when
 * `field` is one of `allowedFields` (never trust an arbitrary path). */
export function parseRowError(
  path: string | undefined,
  allowedFields: readonly string[],
): RowError | null {
  if (!path) return null;
  const match = ROW_ERROR_PATH.exec(path);
  if (!match) return null;
  const field = match[2] ?? '';
  if (!allowedFields.includes(field)) return null;
  return { index: Number(match[1]), field };
}

const asText = (v: unknown): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

/** Reads a JSON-encoded `items` form field back into flat string rows; always at least one row. Each
 * tool supplies its own field list and per-field defaults (e.g. a default unit). */
export function parseRows(
  raw: string,
  fields: readonly string[],
  defaults: Readonly<Record<string, string>>,
): Record<string, string>[] {
  const emptyRow = () => ({ ...defaults });
  if (raw.trim() === '') return [emptyRow()];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [emptyRow()];
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return [emptyRow()];
  return parsed.map((row) => {
    const r = row !== null && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const out: Record<string, string> = {};
    for (const field of fields) out[field] = asText(r[field]) || (defaults[field] ?? '');
    return out;
  });
}

/** Mirrors `@mangotools/runtime`'s `normalizeNumberText`, so a row's numbers get the same grouping
 * and symbol stripping ("1,000", "₹5") as every other numeric field on the platform. */
export function normalizeRowNumberText(raw: string): string {
  return raw.replace(/[\s,_₹%]/g, '');
}

/** Encodes rows for the engine. A blank optional field is left out entirely (never `""`), exactly
 * like every other optional field on the platform, so the engine reads it as genuinely absent. */
export function serializeRows(
  rows: readonly Record<string, string>[],
  fields: readonly string[],
  numericFields: ReadonlySet<string>,
): string {
  const payload = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const field of fields) {
      const value = row[field] ?? '';
      if (value.trim() === '') continue;
      out[field] = numericFields.has(field) ? normalizeRowNumberText(value) : value;
    }
    return out;
  });
  return JSON.stringify(payload);
}
