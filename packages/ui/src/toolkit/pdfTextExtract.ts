/**
 * Extracts the text of each page of a PDF, as lines, by following its text operators (Tf, Td, TD,
 * Tm, T*, Tj, TJ, ' and ") in page and form content streams. Font sizes are kept so larger lines can
 * become headings, and the start of each piece of a line is kept so tables can be found. This reads
 * text the PDF already contains; a scanned page (a picture of text) has none, and images are not
 * carried over.
 */
import { PDFArray, PDFDict, PDFDocument, PDFName, type PDFPage, PDFStream } from 'pdf-lib';
import { type FontDecoder, fontDecoder, streamText } from './pdfFontDecoder.ts';
import { joinBaselines, tableAt } from './pdfTableDetect.ts';
import { Lexer, type Token } from './pdfTextTokens.ts';

export interface TextCell {
  /** Where this piece of the line starts, in points. */
  x: number;
  text: string;
}

export interface TextLine {
  text: string;
  size: number;
  /** Baseline position in the page's text space; only differences between lines matter. */
  y: number;
  /** Where the line starts, in points. */
  x?: number;
  /** The pieces of the line that sit apart from each other (table cells, columns). */
  cells?: TextCell[];
}

export interface PageText {
  lines: TextLine[];
}

interface State {
  fonts: Map<string, FontDecoder>;
  font: FontDecoder | null;
  /** Effective size: the Tf size times the text matrix scale. */
  size: number;
  baseSize: number;
  scale: number;
  /** Origin of the current text line (from Tm, Td, TD), in points. */
  lineY: number;
  lineX: number;
  /** y of the line being built, characters shown since the last move, and where they probably end. */
  textY: number;
  segChars: number;
  endX: number;
  current: string;
  currentSize: number;
  /** Pieces of the current line, each started by a move along the baseline. */
  segs: { x: number; text: string; chars: number }[];
  newSeg: boolean;
  lines: TextLine[];
  forms: PDFDict | null;
  depth: number;
}

/** Joins pieces that touch (kerning moves inside a word or sentence) and keeps real gaps. */
function cellsOf(st: State): TextCell[] {
  const size = st.currentSize || 1;
  const out: { x: number; text: string; end: number }[] = [];
  for (const s of st.segs) {
    const prev = out[out.length - 1];
    const end = s.x + s.chars * size * 0.5;
    if (prev && s.x - prev.end < size * 1.6) {
      prev.text += s.text;
      prev.end = Math.max(prev.end, end);
    } else out.push({ x: s.x, text: s.text, end });
  }
  return out
    .map((c) => ({ x: Math.round(c.x), text: c.text.replace(/\s+/g, ' ').trim() }))
    .filter((c) => c.text);
}

function flush(st: State): void {
  const text = st.current.replace(/\s+/g, ' ').trim();
  if (text) {
    const cells = cellsOf(st);
    st.lines.push({
      text,
      size: Math.round(st.currentSize * 10) / 10,
      y: st.textY,
      x: Math.round(st.segs[0]?.x ?? st.lineX),
      ...(cells.length > 1 ? { cells } : {}),
    });
  }
  st.current = '';
  st.currentSize = 0;
  st.segs = [];
  st.newSeg = true;
}

function show(st: State, text: string): void {
  if (!text) return;
  if (st.current === '') st.textY = st.lineY;
  st.current += text;
  const last = st.segs[st.segs.length - 1];
  if (st.newSeg || !last)
    st.segs.push({
      x: st.lineX + st.segChars * (Math.abs(st.size) || 1) * 0.5,
      text,
      chars: text.length,
    });
  else {
    last.text += text;
    last.chars += text.length;
  }
  st.newSeg = false;
  st.segChars += text.length;
  st.endX = st.lineX + st.segChars * (Math.abs(st.size) || 1) * 0.5;
  st.currentSize = Math.max(st.currentSize, Math.abs(st.size));
}

/**
 * A move to another baseline starts a new line. A move along the same baseline adds a space when
 * it jumps past where the text shown so far probably ends (glyph widths are estimated at half an
 * em, as real widths are not read).
 */
function moveTo(st: State, x: number, y: number): void {
  const size = Math.abs(st.size) || 1;
  if (st.current !== '') {
    if (Math.abs(y - st.textY) > Math.max(1, size * 0.5)) flush(st);
    else if (x - st.endX > size * 0.3 && !st.current.endsWith(' ')) {
      st.current += ' ';
    }
  }
  st.lineX = x;
  st.lineY = y;
  st.segChars = 0;
  st.newSeg = true;
}

function showArray(st: State, items: Token[]): void {
  for (const it of items) {
    if (it.t === 'str' && st.font) show(st, st.font.decode(it.v));
    // A large negative adjustment (in thousandths of an em) is a word gap.
    else if (it.t === 'num' && it.v < -200 && !st.current.endsWith(' ')) {
      st.current += ' ';
      const last = st.segs[st.segs.length - 1];
      if (last) last.text += ' ';
    }
  }
}

function fontsOf(resources: PDFDict | undefined): Map<string, FontDecoder> {
  const out = new Map<string, FontDecoder>();
  const dict = resources?.lookup(PDFName.of('Font'));
  if (!(dict instanceof PDFDict)) return out;
  for (const [name, ref] of dict.entries()) {
    const font = dict.context.lookup(ref);
    if (font instanceof PDFDict) out.set(name.decodeText(), fontDecoder(font));
  }
  return out;
}

const num = (stack: Token[], back: number): number => {
  const t = stack[stack.length - back];
  return t?.t === 'num' ? t.v : 0;
};

type Handler = (st: State, stack: Token[]) => void;

const showString: Handler = (st, stack) => {
  const s = stack[stack.length - 1];
  if (s?.t === 'str' && st.font) show(st, st.font.decode(s.v));
};

const HANDLERS: Readonly<Record<string, Handler>> = {
  Tf: (st, stack) => {
    const name = stack[stack.length - 2];
    st.font = name?.t === 'name' ? (st.fonts.get(name.v) ?? null) : null;
    st.baseSize = num(stack, 1) || st.baseSize;
    st.size = st.baseSize * st.scale;
  },
  Td: (st, stack) =>
    moveTo(st, st.lineX + num(stack, 2) * st.scale, st.lineY + num(stack, 1) * st.scale),
  Tm: (st, stack) => {
    // Positions are compared in points, so the text matrix scale is applied to sizes and moves.
    st.scale = Math.abs(num(stack, 3)) || 1;
    st.size = st.baseSize * st.scale;
    moveTo(st, num(stack, 2), num(stack, 1));
  },
  'T*': (st) => flush(st),
  Tj: showString,
  "'": (st, stack) => {
    flush(st);
    showString(st, stack);
  },
  TJ: (st, stack) => {
    const a = stack[stack.length - 1];
    if (a?.t === 'arr') showArray(st, a.v);
  },
  BT: (st) => {
    // BT resets the text matrix; the line being built continues until the baseline changes.
    st.lineX = 0;
    st.lineY = 0;
    st.segChars = 0;
  },
};

function textOp(st: State, op: string, stack: Token[]): void {
  const handler = HANDLERS[op === 'TD' ? 'Td' : op === '"' ? "'" : op];
  handler?.(st, stack);
}

function runForm(st: State, name: string): void {
  if (!st.forms || st.depth > 3) return;
  const form = st.forms.lookup(PDFName.of(name));
  if (!(form instanceof PDFStream)) return;
  if (form.dict.get(PDFName.of('Subtype')) !== PDFName.of('Form')) return;
  const res = form.dict.lookup(PDFName.of('Resources'));
  const resources = res instanceof PDFDict ? res : undefined;
  const inner: State = {
    ...st,
    fonts: resources ? fontsOf(resources) : st.fonts,
    forms: xobjectsOf(resources) ?? st.forms,
    depth: st.depth + 1,
  };
  run(inner, streamText(form));
  st.lines = inner.lines;
  st.current = inner.current;
  st.segs = inner.segs;
}

function run(st: State, content: string): void {
  const bytes = Uint8Array.from(content, (c) => c.charCodeAt(0) & 0xff);
  const lexer = new Lexer(bytes);
  const stack: Token[] = [];
  for (let tok = lexer.next(); tok; tok = lexer.next()) {
    if (tok.t !== 'op') {
      stack.push(tok);
      continue;
    }
    if (tok.v === 'ID') lexer.skipInlineImage();
    else if (tok.v === 'Do') {
      const n = stack[stack.length - 1];
      if (n?.t === 'name') runForm(st, n.v);
    } else textOp(st, tok.v, stack);
    stack.length = 0;
  }
}

function xobjectsOf(resources: PDFDict | undefined): PDFDict | null {
  const x = resources?.lookup(PDFName.of('XObject'));
  return x instanceof PDFDict ? x : null;
}

function pageContent(page: PDFPage): string {
  const contents = page.node.Contents();
  if (contents instanceof PDFStream) return streamText(contents);
  if (contents instanceof PDFArray) {
    return contents
      .asArray()
      .map((ref) => page.doc.context.lookup(ref))
      .filter((s): s is PDFStream => s instanceof PDFStream)
      .map(streamText)
      .join('\n');
  }
  return '';
}

export function extractPageText(page: PDFPage): PageText {
  const resources = page.node.Resources();
  const st: State = {
    fonts: fontsOf(resources),
    font: null,
    size: 12,
    baseSize: 12,
    scale: 1,
    lineY: 0,
    lineX: 0,
    textY: 0,
    segChars: 0,
    endX: 0,
    current: '',
    currentSize: 0,
    segs: [],
    newSeg: true,
    lines: [],
    forms: xobjectsOf(resources),
    depth: 0,
  };
  run(st, pageContent(page));
  flush(st);
  return { lines: st.lines };
}

export async function extractPdfText(bytes: Uint8Array): Promise<PageText[]> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  return doc.getPages().map((p) => {
    try {
      return extractPageText(p);
    } catch {
      return { lines: [] };
    }
  });
}

/** Most common line size, used to tell headings from body text. */
export function bodySize(pages: PageText[]): number {
  const counts = new Map<number, number>();
  for (const p of pages)
    for (const l of p.lines) counts.set(l.size, (counts.get(l.size) ?? 0) + l.text.length);
  let best = 12;
  let most = 0;
  for (const [size, n] of counts) if (n > most) [best, most] = [size, n];
  return best;
}

export type Block =
  | { kind: 'h1' | 'h2' | 'p'; text: string }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'page' };

function kindOf(size: number, body: number): 'h1' | 'h2' | 'p' {
  if (size >= body * 1.6) return 'h1';
  if (size >= body * 1.2) return 'h2';
  return 'p';
}

/**
 * Lines become paragraphs: a line joins the paragraph above when it has the same size and sits
 * within about one and a half line heights of it. Larger lines become headings. Lines whose pieces
 * line up in columns become tables. Pages are separated by page breaks.
 */
export function toBlocks(pages: PageText[]): Block[] {
  const body = bodySize(pages);
  const out: Block[] = [];
  pages.forEach((page, pi) => {
    if (pi > 0) out.push({ kind: 'page' });
    pageBlocks(joinBaselines(page.lines), body, out);
  });
  return out;
}

function pageBlocks(lines: TextLine[], body: number, out: Block[]): void {
  let prev: TextLine | null = null;
  for (let i = 0; i < lines.length; i++) {
    const table = tableAt(lines, i);
    if (table) {
      out.push({ kind: 'table', rows: table.rows });
      i = table.end - 1;
      prev = null;
      continue;
    }
    const line = lines[i] as TextLine;
    const kind = kindOf(line.size, body);
    const last = out[out.length - 1];
    const joins =
      prev !== null &&
      last?.kind === 'p' &&
      kind === 'p' &&
      prev.size === line.size &&
      Math.abs(line.y - prev.y) <= line.size * 1.6;
    if (joins && last && 'text' in last) last.text = `${last.text} ${line.text}`;
    else out.push({ kind, text: line.text });
    prev = line;
  }
}
