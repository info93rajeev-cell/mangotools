import { defineOperation, err, type OpWarning, ok, warning } from '@mangotools/core';
import { encodeCanvas } from '../../lib/codec.ts';
import { decodeAndCheckSource } from '../../lib/decode-source.ts';
import { deriveOutputFileName } from '../../lib/file-name.ts';
import { computeSizeChange } from '../../lib/size-change.ts';
import { renderBackgroundRemoved } from './canvas-pipeline.ts';
import {
  type ImageFile,
  imageRemoveBackgroundInput,
  imageRemoveBackgroundOutput,
  imageRemoveBackgroundParams,
  type ResolvedImageFormat,
} from './schema.ts';
import { validateRequest } from './validate.ts';

const STANDING_WARNINGS: OpWarning[] = [
  warning('IMAGE_VERIFY_OUTPUT'),
  warning('IMAGE_METADATA_NOT_PRESERVED'),
];

function qualityFraction(quality: number | undefined): number | undefined {
  return quality === undefined ? undefined : quality / 100;
}

export const imageRemoveBackground = defineOperation({
  id: 'image.remove-background',
  major: 1,
  title: 'Remove background from image',
  summary: 'Removes the background from a JPG, PNG, or WebP image, entirely in the browser.',
  input: imageRemoveBackgroundInput,
  params: imageRemoveBackgroundParams,
  output: imageRemoveBackgroundOutput,
  errors: [
    'IMAGE_NO_FILE_SELECTED',
    'IMAGE_INVALID_FILE_TYPE',
    'IMAGE_FILE_TOO_LARGE',
    'IMAGE_UNREADABLE',
    'IMAGE_SOURCE_PIXELS_TOO_LARGE',
    'IMAGE_MEMORY_LIMIT_EXCEEDED',
    'IMAGE_ANIMATED_UNSUPPORTED',
    'IMAGE_WEBP_UNSUPPORTED',
    'IMAGE_BACKGROUND_REMOVAL_FAILED',
  ],
  runtimes: ['worker'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input, _params) {
    const validation = validateRequest(input);
    if (!validation.ok) return validation;
    const file = input.file as ImageFile;

    const decoded = await decodeAndCheckSource(file);
    if (!decoded.ok) return decoded;
    const { bitmap, sourceType, width, height } = decoded.value;

    const requestedFormat: ResolvedImageFormat =
      input.outputFormat === 'same' ? 'png' : input.outputFormat;
    const warnings = [...STANDING_WARNINGS];
    if (requestedFormat === 'jpg' && input.replacementBackground === 'transparent') {
      warnings.push(warning('IMAGE_TRANSPARENT_FLATTENED_TO_WHITE'));
    }

    let canvas: OffscreenCanvas;
    try {
      canvas = renderBackgroundRemoved(
        bitmap,
        input.tolerance,
        input.feather,
        input.targetColor,
        input.replacementBackground,
      );
    } catch {
      bitmap.close();
      return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
    }
    bitmap.close();

    let bytes: Uint8Array;
    let finalFormat: ResolvedImageFormat;
    try {
      const encoded = await encodeCanvas(canvas, requestedFormat, qualityFraction(input.quality));
      if (encoded.fellBackFromWebp) {
        if (requestedFormat === 'webp') return err('IMAGE_WEBP_UNSUPPORTED');
        warnings.push(warning('IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG'));
      }
      finalFormat = encoded.finalFormat;
      bytes = new Uint8Array(await encoded.blob.arrayBuffer());
    } catch {
      return err('IMAGE_BACKGROUND_REMOVAL_FAILED');
    }

    const sizeChange = computeSizeChange(file.bytes.byteLength, bytes.byteLength);
    const fileName = deriveOutputFileName(finalFormat, file.name, input.outputFileName, {
      suffix: '-no-bg',
      fallbackBase: 'background-removed',
    });

    return ok(
      {
        bytes,
        fileName,
        originalWidth: width,
        originalHeight: height,
        outputWidth: width,
        outputHeight: height,
        tolerance: input.tolerance,
        feather: input.feather,
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
