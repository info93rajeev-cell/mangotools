/**
 * Which pages go into which output file when splitting a PDF. Every part lists its pages
 * explicitly, so ranges, page lists ("1, 3, 5-12"), every-page and fixed-size splits all use one
 * code path, and nothing outside the document's pages is ever requested.
 */

export interface SplitRange {
  id: string;
  start: number;
  end: number;
}

export interface SplitPartInfo {
  index: number;
  name: string;
  /** 1-based page numbers, in output order. */
  pages: number[];
  startPage: number;
  endPage: number;
  pageCount: number;
  /** Proportional estimate from the source size; shown as an estimate only. */
  sizeBytes: number;
}

export type SplitMode = 'ranges' | 'extract' | 'every' | 'chunks';

export interface PageListResult {
  pages: number[];
  /** Tokens that were not valid page numbers or ranges within the document. */
  invalid: string[];
}

/** Parses "1, 3, 5-12" into pages within 1…totalPages, keeping order and dropping repeats. */
export function parsePageList(input: string, totalPages: number): PageListResult {
  const pages: number[] = [];
  const seen = new Set<number>();
  const invalid: string[] = [];
  for (const raw of input.split(',')) {
    const token = raw.trim();
    if (!token) continue;
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    const a = Number(m?.[1]);
    const b = m?.[2] === undefined ? a : Number(m[2]);
    if (!m || a < 1 || b < a || b > totalPages) {
      invalid.push(token);
      continue;
    }
    for (let p = a; p <= b; p++) {
      if (!seen.has(p)) {
        seen.add(p);
        pages.push(p);
      }
    }
  }
  return { pages, invalid };
}

/** A range is usable when it starts at 1 or later, ends no earlier, and stays inside the file. */
export function isValidRange(r: SplitRange, totalPages: number): boolean {
  return (
    Number.isInteger(r.start) &&
    Number.isInteger(r.end) &&
    r.start >= 1 &&
    r.end >= r.start &&
    r.end <= totalPages
  );
}

const span = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function part(index: number, name: string, pages: number[], perPage: number): SplitPartInfo {
  return {
    index,
    name,
    pages,
    startPage: pages[0] ?? 0,
    endPage: pages[pages.length - 1] ?? 0,
    pageCount: pages.length,
    sizeBytes: Math.round(perPage * pages.length),
  };
}

export function partName(pattern: string, n: number, fallback: string): string {
  const base = (pattern.trim() || fallback).replace(/[\\/:*?"<>|]/g, '');
  const named = base.includes('{n}') ? base.replace('{n}', String(n)) : `${base}_${n}`;
  return `${named}.pdf`;
}

export interface SplitRequest {
  mode: SplitMode;
  totalPages: number;
  ranges: SplitRange[];
  extractInput: string;
  chunkSize: number;
  pattern: string;
  baseFileSize: number;
  baseName: string;
}

export function resolveSplitParts(req: SplitRequest): SplitPartInfo[] {
  const { totalPages } = req;
  if (totalPages <= 0) return [];
  const perPage = req.baseFileSize / totalPages;
  const name = (n: number) => partName(req.pattern, n, 'Part_{n}');
  if (req.mode === 'ranges') {
    return req.ranges
      .filter((r) => isValidRange(r, totalPages))
      .map((r, i) => part(i + 1, name(i + 1), span(r.start, r.end), perPage));
  }
  if (req.mode === 'extract') {
    const { pages } = parsePageList(req.extractInput, totalPages);
    return pages.length > 0 ? [part(1, `${req.baseName}-extracted.pdf`, pages, perPage)] : [];
  }
  if (req.mode === 'every') {
    return span(1, totalPages).map((p) => part(p, name(p), [p], perPage));
  }
  const size = Math.max(1, Math.floor(req.chunkSize) || 1);
  const parts: SplitPartInfo[] = [];
  for (let s = 1, n = 1; s <= totalPages; s += size, n++) {
    parts.push(part(n, name(n), span(s, Math.min(s + size - 1, totalPages)), perPage));
  }
  return parts;
}

/** Starting ranges for a newly opened file: the first half and the second half. */
export function defaultRanges(totalPages: number): SplitRange[] {
  if (totalPages <= 1) return [{ id: 'r1', start: 1, end: Math.max(1, totalPages) }];
  const half = Math.ceil(totalPages / 2);
  return [
    { id: 'r1', start: 1, end: half },
    { id: 'r2', start: half + 1, end: totalPages },
  ];
}

export function rangesToText(ranges: SplitRange[]): string {
  return ranges
    .map((r) => (r.start === r.end ? String(r.start) : `${r.start}-${r.end}`))
    .join(', ');
}

/** Parses "1-12, 13-42, 50" into one range per item; items outside the file are reported. */
export function parseRangeList(
  input: string,
  totalPages: number,
): { ranges: SplitRange[]; invalid: string[] } {
  const ranges: SplitRange[] = [];
  const invalid: string[] = [];
  input.split(',').forEach((raw, i) => {
    const token = raw.trim();
    if (!token) return;
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token);
    const start = Number(m?.[1]);
    const end = m?.[2] === undefined ? start : Number(m[2]);
    const r = { id: `r${i + 1}-${start}-${end}`, start, end };
    if (m && isValidRange(r, totalPages)) ranges.push(r);
    else invalid.push(token);
  });
  return { ranges, invalid };
}

/** Compact page list, e.g. [1, 3, 5, 6, 7] → "1, 3, 5–7". */
export function pagesLabel(pages: number[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < pages.length) {
    let j = i;
    while (j + 1 < pages.length && pages[j + 1] === (pages[j] ?? 0) + 1) j++;
    out.push(i === j ? String(pages[i]) : `${pages[i]}–${pages[j]}`);
    i = j + 1;
  }
  return out.join(', ');
}
