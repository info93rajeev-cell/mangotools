/**
 * Same-origin delivery of large model files on Cloudflare Pages.
 *
 * Pages rejects any single asset over 25 MiB, so the build splits each `.onnx` model into parts
 * (`<file>.part-000`, `<file>.part-001`, …) next to a `<file>.parts.json` list. transformers.js
 * still requests the whole `<file>`; this module intercepts only those requests and answers them
 * with one streamed Response that joins the parts in order. Every other request passes through
 * untouched. If no parts list exists (local dev serves the whole file), the original request is
 * made as normal.
 */

export interface ModelPartsManifest {
  byteSize: number;
  sha256: string;
  parts: { file: string; byteSize: number }[];
}

type FetchFn = typeof fetch;

const INSTALLED = Symbol.for('mangotools.chunkedModelFetch');

/** True when `url` is a model file under one of the given same-origin path prefixes. */
export function isChunkedModelUrl(url: URL, origin: string, prefixes: readonly string[]): boolean {
  if (url.origin !== origin || !url.pathname.endsWith('.onnx')) return false;
  return prefixes.some((prefix) => url.pathname.startsWith(prefix));
}

export function isModelPartsManifest(value: unknown): value is ModelPartsManifest {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<ModelPartsManifest>;
  if (typeof m.byteSize !== 'number' || !Array.isArray(m.parts) || m.parts.length === 0) {
    return false;
  }
  const total = m.parts.reduce(
    (sum, p) =>
      sum + (typeof p?.byteSize === 'number' && typeof p.file === 'string' ? p.byteSize : NaN),
    0,
  );
  return total === m.byteSize;
}

async function streamPart(
  realFetch: FetchFn,
  url: URL,
  expected: number,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> {
  const res = await realFetch(url.href);
  if (!res.ok || !res.body)
    throw new Error(`Model part ${url.pathname} failed: HTTP ${res.status}`);
  const reader = res.body.getReader();
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    controller.enqueue(value);
  }
  if (received !== expected) {
    throw new Error(`Model part ${url.pathname} has ${received} bytes, expected ${expected}`);
  }
}

/** One Response whose body is every part, in order, with the full Content-Length. */
export function joinedModelResponse(
  realFetch: FetchFn,
  base: URL,
  manifest: ModelPartsManifest,
): Response {
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const part of manifest.parts) {
          await streamPart(realFetch, new URL(part.file, base), part.byteSize, controller);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(manifest.byteSize),
    },
  });
}

async function fetchChunkedModel(realFetch: FetchFn, url: URL, init?: RequestInit) {
  const listRes = await realFetch(`${url.href}.parts.json`);
  if (listRes.status === 404) return realFetch(url.href, init);
  if (!listRes.ok) throw new Error(`Model parts list failed: HTTP ${listRes.status}`);
  const manifest: unknown = await listRes.json();
  if (!isModelPartsManifest(manifest)) throw new Error('Model parts list is invalid');
  return joinedModelResponse(realFetch, url, manifest);
}

function requestUrl(input: RequestInfo | URL, origin: string): URL | null {
  try {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return new URL(raw, origin);
  } catch {
    return null;
  }
}

/**
 * Patch `globalThis.fetch` once so model requests under `prefixes` are served from parts.
 * Safe to call repeatedly.
 */
export function installChunkedModelFetch(prefixes: readonly string[]): void {
  const g = globalThis as typeof globalThis & { [INSTALLED]?: boolean };
  if (g[INSTALLED] || typeof g.fetch !== 'function' || typeof location === 'undefined') return;
  const realFetch: FetchFn = g.fetch.bind(g);
  const origin = location.origin;
  g.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input, origin);
    if (url && isChunkedModelUrl(url, origin, prefixes)) {
      return fetchChunkedModel(realFetch, url, init);
    }
    return realFetch(input, init);
  };
  g[INSTALLED] = true;
}
