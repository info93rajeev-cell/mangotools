/**
 * Writes a flat PDF outline (the bookmarks panel in PDF readers): one entry per title, each
 * opening its page fitted to the window.
 */
import { type PDFDocument, PDFHexString, PDFName, type PDFRef } from 'pdf-lib';

export interface OutlineEntry {
  title: string;
  /** 0-based page index in the document. */
  pageIndex: number;
}

export function addOutline(doc: PDFDocument, entries: OutlineEntry[]): void {
  const valid = entries.filter((e) => e.pageIndex >= 0 && e.pageIndex < doc.getPageCount());
  if (valid.length === 0) return;
  const ctx = doc.context;
  const root = ctx.nextRef();
  const refs: PDFRef[] = valid.map(() => ctx.nextRef());
  valid.forEach((entry, i) => {
    const item = ctx.obj({
      Title: PDFHexString.fromText(entry.title),
      Parent: root,
      Dest: [doc.getPage(entry.pageIndex).ref, 'Fit'],
    });
    const prev = refs[i - 1];
    const next = refs[i + 1];
    if (prev) item.set(PDFName.of('Prev'), prev);
    if (next) item.set(PDFName.of('Next'), next);
    const ref = refs[i];
    if (ref) ctx.assign(ref, item);
  });
  const first = refs[0];
  const last = refs[refs.length - 1];
  if (!first || !last) return;
  ctx.assign(root, ctx.obj({ Type: 'Outlines', First: first, Last: last, Count: refs.length }));
  doc.catalog.set(PDFName.of('Outlines'), root);
  doc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
}
