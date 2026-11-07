/**
 * Real, in-browser PDF compression. The usable saving in most large PDFs (scans, photos, slide
 * exports) is in their JPEG images, so each JPEG image is decoded by the browser, optionally
 * downscaled and turned grey, and re-encoded at a lower JPEG quality. A re-encoded image replaces
 * the original only when it is smaller. Page thumbnails can be removed, and the file is saved with
 * compressed object streams. Text, vector graphics and fonts are not touched, so text stays
 * selectable and searchable. Images in other formats (Flate, JBIG2, JPEG 2000) are left as they are.
 */
import { PDFArray, PDFDocument, PDFName, PDFNumber, PDFRawStream, type PDFRef } from 'pdf-lib';

export type CompressionPreset = 'light' | 'balanced' | 'strong' | 'custom';

export interface CompressSettings {
  /** JPEG quality, 0.1 – 1. */
  quality: number;
  /** Longest side, in pixels, an image is scaled down to. */
  maxDimension: number;
  grayscale: boolean;
  removeThumbnails: boolean;
}

export const PRESET_SETTINGS: Readonly<
  Record<Exclude<CompressionPreset, 'custom'>, Pick<CompressSettings, 'quality' | 'maxDimension'>>
> = {
  light: { quality: 0.82, maxDimension: 3000 },
  balanced: { quality: 0.7, maxDimension: 2000 },
  strong: { quality: 0.5, maxDimension: 1400 },
};

export function settingsFor(
  preset: CompressionPreset,
  customQualityPercent: number,
  grayscale: boolean,
  removeThumbnails: boolean,
): CompressSettings {
  const base =
    preset === 'custom'
      ? { quality: Math.min(1, Math.max(0.1, customQualityPercent / 100)), maxDimension: 2000 }
      : PRESET_SETTINGS[preset];
  return { ...base, grayscale, removeThumbnails };
}

/** Width and height after scaling the longest side down to `max` (never up). */
export function scaledSize(width: number, height: number, max: number) {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const k = max / longest;
  return { width: Math.max(1, Math.round(width * k)), height: Math.max(1, Math.round(height * k)) };
}

/** Images smaller than this are not worth re-encoding. */
const MIN_IMAGE_BYTES = 8 * 1024;

export interface ImageCandidate {
  ref: PDFRef;
  stream: PDFRawStream;
  width: number;
  height: number;
}

function filterNames(stream: PDFRawStream): string[] {
  const filter = stream.dict.get(PDFName.of('Filter'));
  if (filter instanceof PDFName) return [filter.asString()];
  if (filter instanceof PDFArray)
    return filter.asArray().map((f) => (f instanceof PDFName ? f.asString() : ''));
  return [];
}

function numberIn(stream: PDFRawStream, key: string): number {
  const v = stream.dict.get(PDFName.of(key));
  return v instanceof PDFNumber ? v.asNumber() : 0;
}

/** JPEG (DCTDecode only) image streams large enough to be worth re-encoding. */
export function findJpegImages(doc: PDFDocument): ImageCandidate[] {
  const out: ImageCandidate[] = [];
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    if (obj.dict.get(PDFName.of('Subtype')) !== PDFName.of('Image')) continue;
    const filters = filterNames(obj);
    if (filters.length !== 1 || filters[0] !== '/DCTDecode') continue;
    if (obj.contents.length < MIN_IMAGE_BYTES) continue;
    out.push({ ref, stream: obj, width: numberIn(obj, 'Width'), height: numberIn(obj, 'Height') });
  }
  return out;
}

export interface CompressResult {
  bytes: Uint8Array;
  originalBytes: number;
  compressedBytes: number;
  /** True when the compressed file was not smaller, so the original is returned unchanged. */
  noGain: boolean;
  imagesFound: number;
  imagesRecompressed: number;
  pageCount: number;
}

type Canvas2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function makeCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    return {
      ctx: canvas.getContext('2d') as Canvas2D | null,
      toJpeg: (q: number) => canvas.convertToBlob({ type: 'image/jpeg', quality: q }),
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return {
    ctx: canvas.getContext('2d') as Canvas2D | null,
    toJpeg: (q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', q)),
  };
}

/** Luma (ITU-R BT.601) in place; canvas filters are not available in every browser. */
function toGrey(ctx: Canvas2D, width: number, height: number) {
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const y = Math.round(
      0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0),
    );
    px[i] = y;
    px[i + 1] = y;
    px[i + 2] = y;
  }
  ctx.putImageData(data, 0, 0);
}

/** Re-encodes JPEG bytes in the browser; null when the browser cannot decode them. */
async function reencodeJpeg(
  bytes: Uint8Array,
  target: { width: number; height: number },
  settings: CompressSettings,
): Promise<Uint8Array | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
  } catch {
    return null;
  }
  const { ctx, toJpeg } = makeCanvas(target.width, target.height);
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();
  if (settings.grayscale) toGrey(ctx, target.width, target.height);
  const blob = await toJpeg(settings.quality);
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
}

function replaceImage(
  doc: PDFDocument,
  image: ImageCandidate,
  bytes: Uint8Array,
  size: { width: number; height: number },
) {
  const dict = image.stream.dict.clone(doc.context);
  dict.set(PDFName.of('Width'), PDFNumber.of(size.width));
  dict.set(PDFName.of('Height'), PDFNumber.of(size.height));
  dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
  dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
  dict.set(PDFName.of('Length'), PDFNumber.of(bytes.length));
  // The browser decodes CMYK or inverted JPEGs to plain RGB, so these no longer apply.
  dict.delete(PDFName.of('Decode'));
  dict.delete(PDFName.of('DecodeParms'));
  doc.context.assign(image.ref, PDFRawStream.of(dict, bytes));
}

async function recompressImages(doc: PDFDocument, settings: CompressSettings) {
  const images = findJpegImages(doc);
  let replaced = 0;
  for (const image of images) {
    if (image.width <= 0 || image.height <= 0) continue;
    const size = scaledSize(image.width, image.height, settings.maxDimension);
    const encoded = await reencodeJpeg(image.stream.contents, size, settings);
    if (encoded && encoded.length < image.stream.contents.length) {
      replaceImage(doc, image, encoded, size);
      replaced += 1;
    }
  }
  return { found: images.length, replaced };
}

function removePageThumbnails(doc: PDFDocument) {
  for (const page of doc.getPages()) page.node.delete(PDFName.of('Thumb'));
}

export async function compressPdf(
  input: Uint8Array,
  settings: CompressSettings,
): Promise<CompressResult> {
  const doc = await PDFDocument.load(input, { ignoreEncryption: true, updateMetadata: false });
  const images = await recompressImages(doc, settings);
  if (settings.removeThumbnails) removePageThumbnails(doc);
  const saved = await doc.save({ useObjectStreams: true });
  const noGain = saved.length >= input.length;
  return {
    bytes: noGain ? input : saved,
    originalBytes: input.length,
    compressedBytes: noGain ? input.length : saved.length,
    noGain,
    imagesFound: images.found,
    imagesRecompressed: images.replaced,
    pageCount: doc.getPageCount(),
  };
}

/** Smaller settings for the next attempt at reaching a size target. */
export function tighter(settings: CompressSettings): CompressSettings {
  return {
    ...settings,
    quality: Math.max(0.3, Math.round(settings.quality * 0.75 * 100) / 100),
    maxDimension: Math.max(800, Math.round(settings.maxDimension * 0.8)),
  };
}

export interface TargetResult extends CompressResult {
  /** The size target, in bytes, or null when none was set. */
  targetBytes: number | null;
  targetMet: boolean;
  attempts: number;
}

/** Compresses, then tries up to two tighter passes while the result is above `targetBytes`. */
export async function compressToTarget(
  input: Uint8Array,
  settings: CompressSettings,
  targetBytes: number | null,
): Promise<TargetResult> {
  let current = settings;
  let result = await compressPdf(input, current);
  let attempts = 1;
  while (targetBytes !== null && result.compressedBytes > targetBytes && attempts < 3) {
    if (result.imagesFound === 0) break;
    current = tighter(current);
    result = await compressPdf(input, current);
    attempts += 1;
  }
  const targetMet = targetBytes === null || result.compressedBytes <= targetBytes;
  return { ...result, targetBytes, targetMet, attempts };
}

/** Percentage saved, rounded down so a result is never overstated. */
export function reductionPercent(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0 || compressedBytes >= originalBytes) return 0;
  return Math.floor(((originalBytes - compressedBytes) / originalBytes) * 100);
}
