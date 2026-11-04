import { useEffect, useState } from 'preact/hooks';

/**
 * Real page thumbnails, drawn in the browser with pdf.js (Apache-2.0). The library and its worker
 * load only when a preview is first needed, and both come from this site: no file and no page
 * image leaves the device.
 */

type PdfJs = typeof import('pdfjs-dist');
let loading: Promise<PdfJs> | null = null;

function pdfjs(): Promise<PdfJs> {
  loading ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    return lib;
  });
  return loading;
}

function toBlobUrl(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ? URL.createObjectURL(b) : null), 'image/jpeg', 0.82);
  });
}

/** Renders the given 1-based pages at the given CSS width; a page that fails gives null. */
export async function renderPageThumbs(
  bytes: Uint8Array,
  pages: number[],
  width: number,
): Promise<(string | null)[]> {
  const lib = await pdfjs();
  // pdf.js takes ownership of the buffer it is given, so it gets a copy.
  const task = lib.getDocument({ data: bytes.slice() });
  const doc = await task.promise;
  const scaleBase = Math.min(2, globalThis.devicePixelRatio || 1);
  const out: (string | null)[] = [];
  try {
    for (const n of pages) {
      out.push(await renderOne(doc, n, width * scaleBase));
    }
  } finally {
    void task.destroy();
  }
  return out;
}

async function renderOne(
  doc: Awaited<ReturnType<PdfJs['getDocument']>['promise']>,
  n: number,
  pixelWidth: number,
): Promise<string | null> {
  if (n < 1 || n > doc.numPages) return null;
  try {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: pixelWidth / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    page.cleanup();
    return await toBlobUrl(canvas);
  } catch {
    return null;
  }
}

/**
 * Thumbnails of the first `count` pages (or the listed pages) of a PDF. Returns [] while drawing
 * and when there is no file; old images are released when the file changes.
 */
export function usePageThumbs(
  bytes: Uint8Array | null | undefined,
  pages: number[],
  width = 160,
): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const key = pages.join(',');
  useEffect(() => {
    if (!bytes || pages.length === 0 || typeof document === 'undefined') {
      setUrls([]);
      return;
    }
    let live = true;
    let made: (string | null)[] = [];
    renderPageThumbs(bytes, pages, width)
      .then((r) => {
        made = r;
        if (live) setUrls(r);
        else release(r);
      })
      .catch(() => {
        if (live) setUrls([]);
      });
    return () => {
      live = false;
      release(made);
    };
  }, [bytes, key, width]);
  return urls;
}

function release(urls: (string | null)[]) {
  for (const u of urls) if (u) URL.revokeObjectURL(u);
}

/** 1, 2, … n (at most `max`). */
export const firstPages = (count: number, max: number): number[] =>
  Array.from({ length: Math.min(max, Math.max(0, count)) }, (_, i) => i + 1);
