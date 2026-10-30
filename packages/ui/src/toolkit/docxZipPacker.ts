/**
 * Minimal in-browser zero-dependency ZIP archive and DOCX packager.
 * Produces standard compliant ZIP (store method 0) and OpenXML DOCX files.
 */

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === undefined) continue;
    c ^= b;
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function createLocalHeader(nameBytes: Uint8Array, size: number, crc: number): Uint8Array {
  const local = new Uint8Array(30 + nameBytes.length);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true);
  lv.setUint16(4, 20, true);
  lv.setUint16(6, 0, true);
  lv.setUint16(8, 0, true);
  lv.setUint16(10, 0x4821, true);
  lv.setUint16(12, 0x589e, true);
  lv.setUint32(14, crc, true);
  lv.setUint32(18, size, true);
  lv.setUint32(22, size, true);
  lv.setUint16(26, nameBytes.length, true);
  lv.setUint16(28, 0, true);
  local.set(nameBytes, 30);
  return local;
}

function createCentralHeader(
  nameBytes: Uint8Array,
  size: number,
  crc: number,
  offset: number,
): Uint8Array {
  const central = new Uint8Array(46 + nameBytes.length);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true);
  cv.setUint16(4, 20, true);
  cv.setUint16(6, 20, true);
  cv.setUint16(8, 0, true);
  cv.setUint16(10, 0, true);
  cv.setUint16(12, 0x4821, true);
  cv.setUint16(14, 0x589e, true);
  cv.setUint32(16, crc, true);
  cv.setUint32(20, size, true);
  cv.setUint32(24, size, true);
  cv.setUint16(28, nameBytes.length, true);
  cv.setUint16(30, 0, true);
  cv.setUint16(32, 0, true);
  cv.setUint16(34, 0, true);
  cv.setUint16(36, 0, true);
  cv.setUint32(38, 0, true);
  cv.setUint32(42, offset, true);
  central.set(nameBytes, 46);
  return central;
}

function createEocdRecord(count: number, centralSize: number, centralOffset: number): Uint8Array {
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, count, true);
  ev.setUint16(10, count, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);
  ev.setUint16(20, 0, true);
  return eocd;
}

/**
 * Builds a valid ZIP archive from a list of binary entries.
 */
export function buildZipArchive(entries: ZipEntry[]): Uint8Array {
  const localHeaders: Uint8Array[] = [];
  const centralEntries: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const crc = crc32(entry.data);
    localHeaders.push(createLocalHeader(nameBytes, entry.data.length, crc));
    localHeaders.push(entry.data);
    centralEntries.push(createCentralHeader(nameBytes, entry.data.length, crc, offset));
    offset += 30 + nameBytes.length + entry.data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralEntries) centralSize += c.length;

  const eocd = createEocdRecord(entries.length, centralSize, centralOffset);
  const out = new Uint8Array(offset + centralSize + 22);
  let pos = 0;
  for (const chunk of localHeaders) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralEntries) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  out.set(eocd, pos);
  return out;
}

/**
 * Creates a valid OpenXML DOCX document package from paragraphs.
 */
export function buildDocxArchive(
  title: string,
  sections: { heading: string; paragraphs: string[] }[],
): Uint8Array {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const packageRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let bodyXml = `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="48"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r></w:p>`;
  for (const sec of sections) {
    bodyXml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E40AF"/></w:rPr><w:t>${escapeXml(sec.heading)}</w:t></w:r></w:p>`;
    for (const p of sec.paragraphs) {
      bodyXml += `<w:p><w:r><w:sz w:val="24"/><w:t>${escapeXml(p)}</w:t></w:r></w:p>`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}</w:body>
</w:document>`;

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: encodeUtf8(contentTypes) },
    { name: '_rels/.rels', data: encodeUtf8(packageRels) },
    { name: 'word/document.xml', data: encodeUtf8(documentXml) },
  ];

  return buildZipArchive(entries);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
