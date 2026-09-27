/**
 * Browser/worker-only globals this engine depends on for canvas-based image decoding and encoding.
 *
 * Unlike `packages/core/src/platform-globals.d.ts` (globals identical across Node, browsers and
 * workers), NONE of these exist in plain Node — there is no polyfill for them anywhere in this
 * repository. This is why `image.resize@1` declares `runtimes: ['worker']` only, never `'node'`.
 * See ../AGENTS.md and README.md's "Runtime" section for the full, founder-approved rationale.
 *
 * Declarations are intentionally minimal: only the members this engine actually calls.
 */
/**
 * A minimal stand-in for DOM's real `BlobPart` union, used only so a `Uint8Array`/`ArrayBuffer` can be
 * passed to `new Blob([...])` in this file's own isolated (no-DOM-lib) compilation. In any other
 * project's compilation that pulls this engine's code in transitively (for example `packages/runtime`'s
 * `generated/engine-loaders.ts`), this file is not part of that project's `include`, so DOM's own real
 * `Blob`/`BlobPart` apply there instead — both accept the same values, so the code below type-checks
 * correctly either way.
 */
type BlobPart = Uint8Array | ArrayBuffer;

declare class Blob {
  constructor(parts: BlobPart[], options?: { type?: string });
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}

declare class ImageBitmap {
  readonly width: number;
  readonly height: number;
  close(): void;
}

declare function createImageBitmap(source: Blob): Promise<ImageBitmap>;

type ImageEncodeMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

interface TextMetrics {
  readonly width: number;
}

interface OffscreenCanvasRenderingContext2D {
  fillStyle: string;
  /** `'top'` is the only value this engine ever sets (Image Watermark), so `fillText`'s `y` can be
   * treated as the text's own top edge rather than needing per-glyph baseline metrics. */
  textBaseline: 'top';
  /** A CSS font shorthand, e.g. `"32px sans-serif"` (Image Watermark; no custom font loading). */
  font: string;
  /** 0-1; multiplies the alpha of everything drawn after it is set (Image Watermark's opacity control). */
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage(image: ImageBitmap, dx: number, dy: number, dw: number, dh: number): void;
  /** Draws at the image's own natural size — used where no resize is wanted (Compress, Format Converter,
   * Metadata Remover, Watermark all draw through `image.resize@1`'s shape or their own equivalent). */
  drawImage(image: ImageBitmap, dx: number, dy: number): void;
  measureText(text: string): TextMetrics;
  fillText(text: string, x: number, y: number): void;
}

declare class OffscreenCanvas {
  constructor(width: number, height: number);
  readonly width: number;
  readonly height: number;
  getContext(type: '2d'): OffscreenCanvasRenderingContext2D | null;
  convertToBlob(options?: { type?: ImageEncodeMimeType; quality?: number }): Promise<Blob>;
}
