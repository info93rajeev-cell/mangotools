/**
 * Reads the text structure of a .docx file in the browser: the ZIP container is opened with the
 * platform's DecompressionStream, and word/document.xml is read for paragraphs (with Title and
 * Heading styles, list items, bold and italic runs, line and page breaks) and table rows. Images,
 * text boxes, headers, footers, footnotes and exact layout are not read.
 */

export interface DocxRun {
  text: string;
  bold: boolean;
  italic: boolean;
}

export type ParaStyle = 'title' | 'h1' | 'h2' | 'h3' | 'p' | 'li';

export interface DocxParagraph {
  style: ParaStyle;
  runs: DocxRun[];
  pageBreakBefore: boolean;
}

export interface DocxContent {
  paragraphs: DocxParagraph[];
  images: number;
  tables: number;
}

interface ZipEntry {
  name: string;
  method: number;
  size: number;
  offset: number;
}

function zipEntries(b: Uint8Array): ZipEntry[] {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not-zip');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out: ZipEntry[] = [];
  for (let n = 0; n < count && v.getUint32(p, true) === 0x02014b50; n++) {
    const nameLen = v.getUint16(p + 28, true);
    const extra = v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
    out.push({
      method: v.getUint16(p + 10, true),
      size: v.getUint32(p + 20, true),
      offset: v.getUint32(p + 42, true),
      name: new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen)),
    });
    p += 46 + nameLen + extra;
  }
  return out;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipText(b: Uint8Array, name: string): Promise<string | null> {
  const entry = zipEntries(b).find((e) => e.name === name);
  if (!entry) return null;
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const start =
    entry.offset + 30 + v.getUint16(entry.offset + 26, true) + v.getUint16(entry.offset + 28, true);
  const raw = b.subarray(start, start + entry.size);
  const data = entry.method === 8 ? await inflateRaw(raw) : raw;
  return new TextDecoder().decode(data);
}

const ENTITY: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e: string) => {
    if (e.startsWith('#x')) return String.fromCodePoint(Number.parseInt(e.slice(2), 16));
    if (e.startsWith('#')) return String.fromCodePoint(Number(e.slice(1)));
    return ENTITY[e] ?? m;
  });
}

function styleOf(pXml: string): ParaStyle {
  const id = /<w:pStyle w:val="([^"]+)"/.exec(pXml)?.[1]?.toLowerCase() ?? '';
  if (id === 'title') return 'title';
  if (/^heading ?1$/.test(id)) return 'h1';
  if (/^heading ?2$/.test(id)) return 'h2';
  if (/^heading ?[3-9]$/.test(id)) return 'h3';
  if (pXml.includes('<w:numPr>') || id.startsWith('listparagraph')) return 'li';
  return 'p';
}

function isOn(rPr: string, tag: 'b' | 'i'): boolean {
  const m = new RegExp(`<w:${tag}(?: w:val="([^"]*)")?\\s*/>`).exec(rPr);
  return m !== null && m[1] !== '0' && m[1] !== 'false';
}

function runText(rXml: string): { text: string; pageBreak: boolean } {
  let text = '';
  let pageBreak = false;
  for (const part of rXml.matchAll(
    /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br( w:type="page")?\/>/g,
  )) {
    const tag = part[0];
    if (tag.startsWith('<w:tab')) text += ' ';
    else if (tag.startsWith('<w:br') && part[2]) pageBreak = true;
    else if (tag.startsWith('<w:br')) text += '\n';
    else text += decodeEntities(part[1] ?? '');
  }
  return { text, pageBreak };
}

function runsOf(pXml: string): { runs: DocxRun[]; pageBreak: boolean } {
  const runs: DocxRun[] = [];
  let pageBreak = false;
  for (const r of pXml.matchAll(/<w:r[ >][\s\S]*?<\/w:r>/g)) {
    const rPr = /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(r[0])?.[1] ?? '';
    const t = runText(r[0]);
    pageBreak ||= t.pageBreak;
    if (t.text) runs.push({ text: t.text, bold: isOn(rPr, 'b'), italic: isOn(rPr, 'i') });
  }
  return { runs, pageBreak };
}

function paragraphOf(pXml: string): DocxParagraph {
  const { runs, pageBreak } = runsOf(pXml);
  const before = pXml.includes('<w:pageBreakBefore/>') || pageBreak;
  return { style: styleOf(pXml), runs, pageBreakBefore: before };
}

/** A table row becomes one paragraph, its cells separated by " | ". */
function rowParagraph(rowXml: string): DocxParagraph {
  const cells = [...rowXml.matchAll(/<w:tc[ >][\s\S]*?<\/w:tc>/g)].map((c) =>
    [...c[0].matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
      .map((p) =>
        runsOf(p[0])
          .runs.map((r) => r.text)
          .join(''),
      )
      .join(' ')
      .trim(),
  );
  return {
    style: 'p',
    runs: [{ text: cells.join(' | '), bold: false, italic: false }],
    pageBreakBefore: false,
  };
}

export function parseDocumentXml(xml: string): DocxContent {
  const body = /<w:body>([\s\S]*)<\/w:body>/.exec(xml)?.[1] ?? xml;
  const paragraphs: DocxParagraph[] = [];
  let tables = 0;
  for (const m of body.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g)) {
    if (m[0].startsWith('<w:tbl>')) {
      tables++;
      for (const row of m[0].matchAll(/<w:tr[ >][\s\S]*?<\/w:tr>/g))
        paragraphs.push(rowParagraph(row[0]));
    } else paragraphs.push(paragraphOf(m[0]));
  }
  const images = (body.match(/<w:drawing>|<w:pict>/g) ?? []).length;
  return { paragraphs, images, tables };
}

export async function readDocx(bytes: Uint8Array): Promise<DocxContent> {
  const xml = await readZipText(bytes, 'word/document.xml');
  if (xml === null) throw new Error('not-docx');
  return parseDocumentXml(xml);
}
