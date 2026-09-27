import { defineOperation, err, ok, warning } from '@mangotools/core';
import { encodeCanvas } from '../../lib/codec.ts';
import { decodeAndCheckSource } from '../../lib/decode-source.ts';
import { deriveOutputFileName } from '../../lib/file-name.ts';
import { computeSizeChange } from '../../lib/size-change.ts';
import { renderFavicon } from './canvas-pipeline.ts';
import {
  type ImageFile,
  imageFaviconInput,
  imageFaviconOutput,
  imageFaviconParams,
} from './schema.ts';
import { validateRequest } from './validate.ts';
import { STANDING_WARNINGS } from './warnings.ts';

export const imageFavicon = defineOperation({
  id: 'image.favicon',
  major: 1,
  title: 'Generate a favicon',
  summary:
    'Generates a square PNG favicon from a JPG, PNG, or WebP image, entirely in the browser.',
  input: imageFaviconInput,
  params: imageFaviconParams,
  output: imageFaviconOutput,
  errors: [
    'IMAGE_NO_FILE_SELECTED',
    'IMAGE_INVALID_FILE_TYPE',
    'IMAGE_FILE_TOO_LARGE',
    'IMAGE_UNREADABLE',
    'IMAGE_SOURCE_PIXELS_TOO_LARGE',
    'IMAGE_MEMORY_LIMIT_EXCEEDED',
    'IMAGE_FAVICON_FAILED',
  ],
  // Browser/worker-only: OffscreenCanvas and createImageBitmap do not exist in Node. See
  // engines/image/AGENTS.md and README.md's "Runtime" section — this is a disclosed exception, not an
  // oversight, shared by every operation in this engine.
  runtimes: ['worker'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input, _params) {
    const validation = validateRequest(input);
    if (!validation.ok) return validation;
    const file = input.file as ImageFile; // validateRequest already rejected a missing file

    const decoded = await decodeAndCheckSource(file);
    if (!decoded.ok) return decoded;
    const { bitmap, sourceType, width, height } = decoded.value;

    const size = Number(input.size);
    const warnings = [...STANDING_WARNINGS];
    if (width !== height) warnings.push(warning('IMAGE_FAVICON_CROPPED_TO_SQUARE'));
    if (Math.min(width, height) < size) warnings.push(warning('IMAGE_FAVICON_SOURCE_TOO_SMALL'));
    if (size <= 32) warnings.push(warning('IMAGE_FAVICON_SMALL_SIZE_DETAIL_LOSS'));

    let canvas: OffscreenCanvas;
    try {
      canvas = renderFavicon(bitmap, size);
    } catch {
      bitmap.close();
      return err('IMAGE_FAVICON_FAILED');
    }
    bitmap.close();

    let bytes: Uint8Array<ArrayBuffer>;
    try {
      const encoded = await encodeCanvas(canvas, 'png', undefined);
      bytes = new Uint8Array(await encoded.blob.arrayBuffer());
    } catch {
      return err('IMAGE_FAVICON_FAILED');
    }

    const sizeChange = computeSizeChange(file.bytes.byteLength, bytes.byteLength);
    if (sizeChange.sizeDifferenceBytes < 0)
      warnings.push(warning('IMAGE_OUTPUT_LARGER_THAN_INPUT'));

    return ok(
      {
        bytes,
        fileName: deriveOutputFileName('png', file.name, input.outputFileName, {
          suffix: `-favicon-${size}`,
          fallbackBase: 'favicon',
        }),
        originalWidth: width,
        originalHeight: height,
        outputSize: size,
        originalFileSize: file.bytes.byteLength,
        outputFileSize: bytes.byteLength,
        ...sizeChange,
        originalFormat: sourceType,
        outputFormat: 'png',
      },
      warnings,
    );
  },
});
