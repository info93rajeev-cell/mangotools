import { defineOperation, err, ok, warning } from '@mangotools/core';
import { encodeCanvas } from '../../lib/codec.ts';
import { decodeAndCheckSource } from '../../lib/decode-source.ts';
import { deriveOutputFileName } from '../../lib/file-name.ts';
import { computeSizeChange } from '../../lib/size-change.ts';
import { renderCropped } from './canvas-pipeline.ts';
import {
  type ImageFile,
  imageCropInput,
  imageCropOutput,
  imageCropParams,
  type ResolvedImageFormat,
} from './schema.ts';
import { validateRequest } from './validate.ts';
import { STANDING_WARNINGS } from './warnings.ts';

/** JPG has no alpha channel; PNG and WebP both support one. */
const SUPPORTS_ALPHA: Record<ResolvedImageFormat, boolean> = { jpg: false, png: true, webp: true };

function qualityFraction(quality: number | undefined): number | undefined {
  return quality === undefined ? undefined : quality / 100;
}

export const imageCrop = defineOperation({
  id: 'image.crop',
  major: 1,
  title: 'Crop an image',
  summary: 'Crops a JPG, PNG, or WebP image to a pixel rectangle, entirely in the browser.',
  input: imageCropInput,
  params: imageCropParams,
  output: imageCropOutput,
  errors: [
    'IMAGE_NO_FILE_SELECTED',
    'IMAGE_INVALID_FILE_TYPE',
    'IMAGE_FILE_TOO_LARGE',
    'IMAGE_CROP_POSITION_INVALID',
    'IMAGE_CROP_SIZE_INVALID',
    'IMAGE_UNREADABLE',
    'IMAGE_SOURCE_PIXELS_TOO_LARGE',
    'IMAGE_CROP_OUT_OF_BOUNDS',
    'IMAGE_MEMORY_LIMIT_EXCEEDED',
    'IMAGE_CROP_FAILED',
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

    if (input.cropX + input.cropWidth > width || input.cropY + input.cropHeight > height) {
      bitmap.close();
      return err('IMAGE_CROP_OUT_OF_BOUNDS', { details: { width, height } });
    }

    const requestedFormat: ResolvedImageFormat =
      input.outputFormat === 'same' ? sourceType : input.outputFormat;
    const flattenToWhite = SUPPORTS_ALPHA[sourceType] && !SUPPORTS_ALPHA[requestedFormat];
    const warnings = [...STANDING_WARNINGS];
    if (flattenToWhite) warnings.push(warning('IMAGE_TRANSPARENT_FLATTENED_TO_WHITE'));
    // Only for an *explicit* same-format request, never for 'same' itself — matching image.resize@1's
    // own IMAGE_SAME_FORMAT_REENCODED logic exactly (see its own operation.ts and README.md).
    if (input.outputFormat !== 'same' && input.outputFormat === sourceType) {
      warnings.push(warning('IMAGE_SAME_FORMAT_REENCODED'));
    }

    let canvas: OffscreenCanvas;
    try {
      canvas = renderCropped(
        bitmap,
        input.cropX,
        input.cropY,
        input.cropWidth,
        input.cropHeight,
        flattenToWhite,
      );
    } catch {
      bitmap.close();
      return err('IMAGE_CROP_FAILED');
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
      return err('IMAGE_CROP_FAILED');
    }

    const sizeChange = computeSizeChange(file.bytes.byteLength, bytes.byteLength);
    if (sizeChange.sizeDifferenceBytes < 0)
      warnings.push(warning('IMAGE_OUTPUT_LARGER_THAN_INPUT'));

    return ok(
      {
        bytes,
        fileName: deriveOutputFileName(finalFormat, file.name, input.outputFileName, {
          suffix: '-cropped',
          fallbackBase: 'cropped-image',
        }),
        originalWidth: width,
        originalHeight: height,
        outputWidth: input.cropWidth,
        outputHeight: input.cropHeight,
        cropX: input.cropX,
        cropY: input.cropY,
        cropWidth: input.cropWidth,
        cropHeight: input.cropHeight,
        originalFileSize: file.bytes.byteLength,
        outputFileSize: bytes.byteLength,
        ...sizeChange,
        originalFormat: sourceType,
        outputFormat: finalFormat,
      },
      warnings,
    );
  },
});
