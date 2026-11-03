/**
 * Turns the bytes of a PDF text string into Unicode for one font. A font's ToUnicode CMap is used
 * when it has one (bfchar and bfrange entries, with the code lengths from its codespace ranges).
 * Without one, a simple font's single bytes are read as Windows-1252 text, which covers the
 * standard fonts; a composite (Type0) font without ToUnicode cannot be decoded and yields nothing.
 */
import { decodePDFRawStream, type PDFDict, PDFName, PDFRawStream, PDFStream } from 'pdf-lib';

export interface FontDecoder {
  decode(bytes: Uint8Array): string;
  /** A Type0 (CID) font, whose codes are usually two bytes. */
  composite: boolean;
}

/** Windows-1252 code points 0x80–0x9F; the rest of the byte range is Latin-1. */
const CP1252: Readonly<Record<number, number>> = {
  128: 0x20ac,
  130: 0x201a,
  131: 0x0192,
  132: 0x201e,
  133: 0x2026,
  134: 0x2020,
  135: 0x2021,
  136: 0x02c6,
  137: 0x2030,
  138: 0x0160,
  139: 0x2039,
  140: 0x0152,
  142: 0x017d,
  145: 0x2018,
  146: 0x2019,
  147: 0x201c,
  148: 0x201d,
  149: 0x2022,
  150: 0x2013,
  151: 0x2014,
  152: 0x02dc,
  153: 0x2122,
  154: 0x0161,
  155: 0x203a,
  156: 0x0153,
  158: 0x017e,
  159: 0x0178,
};

export function cp1252(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(CP1252[b] ?? b);
  return s;
}

function utf16be(hex: string): string {
  let s = '';
  for (let i = 0; i + 3 < hex.length; i += 4)
    s += String.fromCharCode(Number.parseInt(hex.slice(i, i + 4), 16));
  return s;
}

export interface CMap {
  lengths: number[];
  map: Map<number, string>;
}

function addRange(map: Map<number, string>, lo: number, hi: number, dst: string): void {
  if (hi - lo > 65535) return;
  const base = utf16be(dst);
  const last = base.charCodeAt(base.length - 1);
  for (let code = lo; code <= hi; code++) {
    map.set(code, base.slice(0, -1) + String.fromCharCode(last + code - lo));
  }
}

const sections = (text: string, name: string) =>
  [...text.matchAll(new RegExp(`begin${name}([\\s\\S]*?)end${name}`, 'g'))].map((m) => m[1] ?? '');

const byteLength = (hex: string) => Math.ceil(hex.length / 2);

function readBfChar(body: string, map: Map<number, string>, lengths: Set<number>): void {
  for (const m of body.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g)) {
    map.set(Number.parseInt(m[1] ?? '0', 16), utf16be(m[2] ?? ''));
    lengths.add(byteLength(m[1] ?? ''));
  }
}

function readBfRange(body: string, map: Map<number, string>, lengths: Set<number>): void {
  const re = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]*>|\[[^\]]*\])/g;
  for (const m of body.matchAll(re)) {
    const lo = Number.parseInt(m[1] ?? '0', 16);
    const hi = Number.parseInt(m[2] ?? '0', 16);
    lengths.add(byteLength(m[1] ?? ''));
    const dst = m[3] ?? '';
    if (dst.startsWith('<')) {
      addRange(map, lo, hi, dst.slice(1, -1));
      continue;
    }
    [...dst.matchAll(/<([0-9a-fA-F]*)>/g)].forEach((x, i) => {
      if (lo + i <= hi) map.set(lo + i, utf16be(x[1] ?? ''));
    });
  }
}

/** Parses the bfchar, bfrange and codespacerange sections of a ToUnicode CMap. */
export function parseCMap(text: string): CMap {
  const map = new Map<number, string>();
  const lengths = new Set<number>();
  for (const body of sections(text, 'codespacerange')) {
    for (const m of body.matchAll(/<([0-9a-fA-F]+)>\s*<[0-9a-fA-F]+>/g))
      lengths.add(byteLength(m[1] ?? ''));
  }
  for (const body of sections(text, 'bfchar')) readBfChar(body, map, lengths);
  for (const body of sections(text, 'bfrange')) readBfRange(body, map, lengths);
  return { lengths: [...lengths].sort((a, b) => a - b), map };
}

function matchAt(
  bytes: Uint8Array,
  i: number,
  cmap: CMap,
  lengths: number[],
): [string, number] | null {
  for (const len of lengths) {
    if (i + len > bytes.length) continue;
    let code = 0;
    for (let k = 0; k < len; k++) code = code * 256 + (bytes[i + k] ?? 0);
    const s = cmap.map.get(code);
    if (s !== undefined) return [s, len];
  }
  return null;
}

/** Decodes bytes with a CMap, trying the shortest code length that maps first. */
export function decodeWithCMap(bytes: Uint8Array, cmap: CMap): string {
  const lengths = cmap.lengths.length > 0 ? cmap.lengths : [1];
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const hit = matchAt(bytes, i, cmap, lengths);
    out += hit ? hit[0] : '';
    i += hit ? hit[1] : (lengths[0] ?? 1);
  }
  return out;
}

export function streamText(stream: PDFStream): string {
  const bytes =
    stream instanceof PDFRawStream ? decodePDFRawStream(stream).decode() : stream.getContents();
  return cp1252(bytes);
}

export function fontDecoder(font: PDFDict): FontDecoder {
  const composite = font.get(PDFName.of('Subtype')) === PDFName.of('Type0');
  const tu = font.lookup(PDFName.of('ToUnicode'));
  if (tu instanceof PDFStream) {
    try {
      const cmap = parseCMap(streamText(tu));
      if (cmap.map.size > 0) return { decode: (b) => decodeWithCMap(b, cmap), composite };
    } catch {
      // A damaged CMap falls back below.
    }
  }
  if (composite) return { decode: () => '', composite };
  return { decode: cp1252, composite };
}
