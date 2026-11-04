import type { TextLine } from './pdfTextExtract.ts';

/**
 * Finds tables in the lines of one page: two or more lines in a row whose pieces start at the same
 * column positions (within a few points). Each such run becomes rows of cells. Lines that are one
 * piece of text, or whose pieces do not line up, stay paragraphs. This uses only where the text
 * sits; ruled lines, merged cells and cells that wrap onto several lines are not recognised.
 */

const TOLERANCE = 14;

export interface FoundTable {
  /** Index of the first line after the table. */
  end: number;
  rows: string[][];
}

function columnOf(x: number, columns: number[]): number {
  let best = -1;
  let dist = TOLERANCE + 1;
  columns.forEach((c, i) => {
    const d = Math.abs(c - x);
    if (d < dist) [best, dist] = [i, d];
  });
  return best;
}

function rowFor(line: TextLine, columns: number[]): string[] | null {
  const cells = line.cells;
  if (!cells || cells.length < 2) return null;
  const row = columns.map(() => '');
  for (const cell of cells) {
    const i = columnOf(cell.x, columns);
    if (i < 0 || row[i] !== '') return null;
    row[i] = cell.text;
  }
  return row;
}

/** The table that starts at line `start`, if one does. */
export function tableAt(lines: TextLine[], start: number): FoundTable | null {
  const first = lines[start];
  if (!first?.cells || first.cells.length < 2) return null;
  const columns = first.cells.map((c) => c.x);
  const rows: string[][] = [];
  let i = start;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line) break;
    const row = rowFor(line, columns);
    if (!row) break;
    rows.push(row);
  }
  return rows.length >= 2 ? { end: i, rows } : null;
}

/**
 * Some PDFs write every cell as its own text object, so one table row arrives as several lines on
 * the same baseline. Those are joined back into one line whose cells keep their positions.
 */
export function joinBaselines(lines: TextLine[]): TextLine[] {
  const out: TextLine[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.y - line.y) < 1 && prev.x !== undefined && line.x !== undefined) {
      const prevCells = prev.cells ?? [{ x: prev.x, text: prev.text }];
      const cells = line.cells ?? [{ x: line.x, text: line.text }];
      out[out.length - 1] = {
        ...prev,
        text: `${prev.text} ${line.text}`,
        size: Math.max(prev.size, line.size),
        cells: [...prevCells, ...cells].sort((a, b) => a.x - b.x),
      };
    } else out.push(line);
  }
  return out;
}
