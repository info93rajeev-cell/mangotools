import { defineOperation, err, ok, warning } from '@mangotools/core';
import { type DecodedSource, decodeAndCheckSource } from '../../lib/decode-source.ts';
import { deriveOutputFileName } from '../../lib/file-name.ts';
import type { ImageFile } from '../../lib/formats.ts';
import { computeSizeChange } from '../../lib/size-change.ts';
import { MAX_OUTPUT_MEGAPIXELS, MAX_OUTPUT_PIXELS } from '../resize/limits.ts';
import { imageResize } from '../resize/operation.ts';
import { validateRequest } from '../resize/validate.ts';
import { STANDING_WARNINGS } from '../resize/warnings.ts';
import { encodePrepared, fittedDimensions } from './canvas.ts';
import { type UploadInput, uploadInput, uploadOutput, uploadParams } from './schema.ts';
import { findUploadCandidate, type UploadSearchResult } from './search.ts';

function finishUpload(
  input: UploadInput,
  params: { outputFileNameSuffix?: string; outputFileNameFallback?: string },
  source: DecodedSource,
  initial: { width: number; height: number },
  searched: UploadSearchResult,
) {
  const { candidate, attempts } = searched;
  if (!searched.met) {
    return err('IMAGE_SIZE_TARGET_UNREACHABLE', {
      details: {
        bytes: candidate.bytes.byteLength,
        width: candidate.width,
        height: candidate.height,
        attempts,
      },
    });
  }
  const file = input.file as ImageFile;
  const sizeChange = computeSizeChange(file.bytes.byteLength, candidate.bytes.byteLength);
  const warnings = [...STANDING_WARNINGS];
  if (source.sourceType !== 'jpg' && input.outputFormat === 'jpg')
    warnings.push(warning('IMAGE_TRANSPARENT_FLATTENED_TO_WHITE'));
  if (sizeChange.sizeDifferenceBytes < 0) warnings.push(warning('IMAGE_OUTPUT_LARGER_THAN_INPUT'));
  if (candidate.width < initial.width || candidate.height < initial.height)
    warnings.push(warning('IMAGE_DIMENSIONS_REDUCED'));
  return ok(
    {
      bytes: new Uint8Array(candidate.bytes),
      fileName: deriveOutputFileName(input.outputFormat, file.name, input.outputFileName, {
        suffix: params.outputFileNameSuffix,
        fallbackBase: params.outputFileNameFallback,
      }),
      originalWidth: source.width,
      originalHeight: source.height,
      outputWidth: candidate.width,
      outputHeight: candidate.height,
      originalFileSize: file.bytes.byteLength,
      outputFileSize: candidate.bytes.byteLength,
      ...sizeChange,
      originalFormat: source.sourceType,
      outputFormat: input.outputFormat,
      targetFileSizeBytes: input.maxFileSizeKB === undefined ? null : input.maxFileSizeKB * 1000,
      encodeAttempts: attempts,
    },
    warnings,
  );
}

export const imagePrepareUpload = defineOperation({
  id: 'image.prepare-upload',
  major: 1,
  title: 'Prepare an image for upload',
  summary: 'Aspect-safe sizing and verified maximum bytes using a bounded browser-local search.',
  input: uploadInput,
  params: uploadParams,
  output: uploadOutput,
  errors: [...imageResize.errors, 'IMAGE_SIZE_TARGET_UNREACHABLE', 'ABORTED'],
  runtimes: ['worker'],
  cost: { weight: 'heavy' },
  exposure: 'internal',
  dataClass: 'personal',
  async run(input, params, ctx) {
    const validation = validateRequest(input);
    if (!validation.ok) return validation;
    const file = input.file as ImageFile;
    const target = { width: input.targetWidth, height: input.targetHeight };
    if (input.padToTarget && target.width * target.height > MAX_OUTPUT_PIXELS) {
      return err('IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE', { details: { max: MAX_OUTPUT_MEGAPIXELS } });
    }
    if (ctx.signal.aborted) return err('ABORTED');
    const decoded = await decodeAndCheckSource(file);
    if (!decoded.ok) return decoded;
    const { bitmap } = decoded.value;
    try {
      const initial = input.padToTarget ? target : fittedDimensions(bitmap, target);
      const maxBytes = input.maxFileSizeKB === undefined ? undefined : input.maxFileSizeKB * 1000;
      const searched = await findUploadCandidate(
        {
          ...initial,
          quality: input.quality,
          format: input.outputFormat,
          maxBytes,
          reduce: input.allowDimensionReduction,
        },
        (width, height, quality) => {
          if (ctx.signal.aborted) throw new Error('Cancelled');
          return encodePrepared(bitmap, input, width, height, quality);
        },
      );
      if (ctx.signal.aborted) return err('ABORTED');
      return finishUpload(input, params, decoded.value, initial, searched);
    } catch {
      return err(ctx.signal.aborted ? 'ABORTED' : 'IMAGE_RESIZE_FAILED');
    } finally {
      bitmap.close();
    }
  },
});
