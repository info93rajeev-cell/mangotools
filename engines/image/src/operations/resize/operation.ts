import { defineOperation, err, ok, type Result, warning } from '@mangotools/core';
import { decodeImage, encodeCanvas, renderResized } from './canvas-pipeline.ts';
import { computeOutputDimensions, type Dimensions, isUpscale } from './dimensions.ts';
import { deriveOutputFileName } from './file-name.ts';
import {
  MAX_OUTPUT_MEGAPIXELS,
  MAX_OUTPUT_PIXELS,
  MAX_SOURCE_MEGAPIXELS,
  MAX_SOURCE_PIXELS,
} from './limits.ts';
import {
  type ImageFile,
  imageResizeInput,
  imageResizeOutput,
  imageResizeParams,
  type ResolvedImageFormat,
} from './schema.ts';
import { type DetectedImageType, detectImageType, MIME_FOR_TYPE } from './signature.ts';
import { validateRequest } from './validate.ts';
import { STANDING_WARNINGS } from './warnings.ts';

/** JPG has no alpha channel; PNG and WebP both support one. */
const SUPPORTS_ALPHA: Record<ResolvedImageFormat, boolean> = { jpg: false, png: true, webp: true };

function qualityFraction(quality: number | undefined): number | undefined {
  return quality === undefined ? undefined : quality / 100;
}

interface DecodedSource {
  bitmap: ImageBitmap;
  sourceType: DetectedImageType;
  dimensions: Dimensions;
}

/** Decodes `file` and checks its decoded pixel count against the source cap. */
async function decodeAndCheckSource(file: ImageFile): Promise<Result<DecodedSource>> {
  const sourceType = detectImageType(file.bytes);
  if (!sourceType) return err('IMAGE_INVALID_FILE_TYPE', { details: { name: file.name } });
  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImage(file.bytes, MIME_FOR_TYPE[sourceType]);
  } catch {
    return err('IMAGE_UNREADABLE', { details: { name: file.name } });
  }
  const dimensions: Dimensions = { width: bitmap.width, height: bitmap.height };
  if (dimensions.width * dimensions.height > MAX_SOURCE_PIXELS) {
    bitmap.close();
    return err('IMAGE_SOURCE_PIXELS_TOO_LARGE', { details: { max: MAX_SOURCE_MEGAPIXELS } });
  }
  return ok({ bitmap, sourceType, dimensions });
}

export const imageResize = defineOperation({
  id: 'image.resize',
  major: 1,
  title: 'Resize an image',
  summary:
    'Resizes a JPG, PNG, or WebP image to the requested dimensions, entirely in the browser.',
  input: imageResizeInput,
  params: imageResizeParams,
  output: imageResizeOutput,
  errors: [
    'IMAGE_NO_FILE_SELECTED',
    'IMAGE_INVALID_FILE_TYPE',
    'IMAGE_FILE_TOO_LARGE',
    'IMAGE_DIMENSIONS_INVALID',
    'IMAGE_SOURCE_PIXELS_TOO_LARGE',
    'IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE',
    'IMAGE_UNREADABLE',
    'IMAGE_MEMORY_LIMIT_EXCEEDED',
    'IMAGE_RESIZE_FAILED',
  ],
  // Browser/worker-only: OffscreenCanvas and createImageBitmap do not exist in Node. See
  // engines/image/AGENTS.md and README.md's "Runtime" section — this is a disclosed exception, not an
  // oversight.
  runtimes: ['worker'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input) {
    const validation = validateRequest(input);
    if (!validation.ok) return validation;
    const file = input.file as ImageFile; // validateRequest already rejected a missing file

    const decoded = await decodeAndCheckSource(file);
    if (!decoded.ok) return decoded;
    const { bitmap, sourceType, dimensions: source } = decoded.value;

    const output = computeOutputDimensions(
      source,
      { width: input.targetWidth, height: input.targetHeight },
      input.keepAspectRatio,
    );
    if (output.width * output.height > MAX_OUTPUT_PIXELS) {
      bitmap.close();
      return err('IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE', { details: { max: MAX_OUTPUT_MEGAPIXELS } });
    }

    const requestedFormat: ResolvedImageFormat =
      input.outputFormat === 'same' ? sourceType : input.outputFormat;
    const flattenToWhite = SUPPORTS_ALPHA[sourceType] && !SUPPORTS_ALPHA[requestedFormat];
    const warnings = [...STANDING_WARNINGS];
    if (flattenToWhite) warnings.push(warning('IMAGE_TRANSPARENT_FLATTENED_TO_WHITE'));
    if (isUpscale(source, output)) warnings.push(warning('IMAGE_UPSCALED_QUALITY_LOSS'));

    let canvas: OffscreenCanvas;
    try {
      canvas = renderResized(bitmap, output, flattenToWhite);
    } catch {
      bitmap.close();
      return err('IMAGE_RESIZE_FAILED');
    }
    bitmap.close();

    let bytes: Uint8Array;
    let finalFormat: ResolvedImageFormat;
    try {
      const encoded = await encodeCanvas(canvas, requestedFormat, qualityFraction(input.quality));
      if (encoded.fellBackFromWebp) warnings.push(warning('IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG'));
      finalFormat = encoded.finalFormat;
      bytes = new Uint8Array(await encoded.blob.arrayBuffer());
    } catch {
      return err('IMAGE_RESIZE_FAILED');
    }

    return ok(
      {
        bytes,
        fileName: deriveOutputFileName(finalFormat, file.name, input.outputFileName),
        originalWidth: source.width,
        originalHeight: source.height,
        outputWidth: output.width,
        outputHeight: output.height,
        originalFileSize: file.bytes.byteLength,
        outputFileSize: bytes.byteLength,
        outputFormat: finalFormat,
      },
      warnings,
    );
  },
});
