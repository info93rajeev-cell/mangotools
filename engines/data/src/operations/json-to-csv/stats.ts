/** Counts reported next to the CSV: missing cells, formula-like cells, leading-zero columns. */
import type { JsonRowTable } from './rows.ts';
import { isFormulaLike } from './stringify.ts';

/** A text value such as "00124" or "0042", which a spreadsheet would read as the number 124. */
const LEADING_ZERO = /^0\d+$/;

export interface TableStats {
  missingCount: number;
  formulaCount: number;
  leadingZeroColumns: string[];
}

export function tableStats(table: JsonRowTable): TableStats {
  let missingCount = 0;
  let formulaCount = 0;
  const zeroColumns = new Set<string>();
  for (const row of table.rows) {
    for (const header of table.headers) {
      if (!Object.hasOwn(row, header)) {
        missingCount += 1;
        continue;
      }
      const value = row[header];
      if (isFormulaLike(value)) formulaCount += 1;
      if (typeof value === 'string' && LEADING_ZERO.test(value)) zeroColumns.add(header);
    }
  }
  const leadingZeroColumns = table.headers.filter((h) => zeroColumns.has(h));
  return { missingCount, formulaCount, leadingZeroColumns };
}
