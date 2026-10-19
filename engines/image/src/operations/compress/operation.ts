import { defineOperation, err, ok, warning } from '@mangotools/core';
import type { DecodedSource } from '../../lib/decode-source.ts';
import { decodeAndCheckSource } from '../../lib/decode-source.ts';
import { deriveOutputFileName } from '../../lib/file-name.ts';
import type { ImageFile, ResolvedImageFormat } from '../../lib/formats.ts';
import { computeSizeChange } from '../../lib/size-change.ts';
import { STANDING_WARNINGS } from '../resize/warnings.ts';
import { renderAndEncodeCompress } from './canvas.ts';
import {
  type ImageCompressInput,
  type ImageCompressParams,
  imageCompressInput,
  imageCompressOutput,
  imageCompressParams,
} from './schema.ts';
import { type CompressSearchResult, findCompressCandidate } from './search.ts';
import { validateRequest } from './validate.ts';

const SUPPORTS_ALPHA: Record<ResolvedImageFormat, boolean> = { jpg: false, png: true, webp: true };

function finishCompress(
  file: ImageFile,
  source: DecodedSource,
  requestedFormat: ResolvedImageFormat,
  input: ImageCompressInput,
  params: ImageCompressParams,
  searched: CompressSearchResult,
  fellBackFromWebp: boolean,
) {
  if (!searched.met) {
    return err('IMAGE_COMPRESSION_NOT_SMALLER', {
      details: {
        minQuality: params.minQuality ?? 50,
        bytes: searched.candidate.bytes.byteLength,
        attempts: searched.attempts,
      },
    });
  }

  const { candidate, attempts } = searched;
  const inputBytes = file.bytes.byteLength;
  const sizeChange = computeSizeChange(inputBytes, candidate.bytes.byteLength);

  const flattenToWhite = SUPPORTS_ALPHA[source.sourceType] && !SUPPORTS_ALPHA[requestedFormat];
  const warnings = [...STANDING_WARNINGS];
  if (flattenToWhite) warnings.push(warning('IMAGE_TRANSPARENT_FLATTENED_TO_WHITE'));
  if (candidate.width < source.width || candidate.height < source.height) {
    warnings.push(warning('IMAGE_DIMENSIONS_REDUCED'));
  }
  if (fellBackFromWebp) warnings.push(warning('IMAGE_WEBP_NOT_SUPPORTED_FALLBACK_PNG'));

  const finalFormat = fellBackFromWebp ? 'png' : requestedFormat;

  return ok(
    {
      bytes: candidate.bytes,
      fileName: deriveOutputFileName(finalFormat, file.name, input.outputFileName, {
        suffix: params.outputFileNameSuffix ?? '-compressed',
        fallbackBase: params.outputFileNameFallback ?? 'compressed-image',
      }),
      originalWidth: source.width,
      originalHeight: source.height,
      outputWidth: candidate.width,
      outputHeight: candidate.height,
      originalFileSize: inputBytes,
      outputFileSize: candidate.bytes.byteLength,
      ...sizeChange,
      originalFormat: source.sourceType,
      outputFormat: finalFormat,
      outputQuality: candidate.quality,
      dimensions: `${candidate.width} × ${candidate.height} px`,
      status: 'Compression successful ✓',
      encodeAttempts: attempts,
    },
    warnings,
  );
}

export const imageCompress = defineOperation({
  id: 'image.compress',
  major: 1,
  title: 'Compress an image',
  summary:
    'Reduces file size while preserving dimensions and visual quality using bounded client-side quality search.',
  input: imageCompressInput,
  params: imageCompressParams,
  output: imageCompressOutput,
  errors: [
    'IMAGE_NO_FILE_SELECTED',
    'IMAGE_INVALID_FILE_TYPE',
    'IMAGE_FILE_TOO_LARGE',
    'IMAGE_SOURCE_PIXELS_TOO_LARGE',
    'IMAGE_UNREADABLE',
    'IMAGE_MEMORY_LIMIT_EXCEEDED',
    'IMAGE_COMPRESSION_NOT_SMALLER',
    'IMAGE_COMPRESSION_FAILED',
    'ABORTED',
  ],
  runtimes: ['worker'],
  cost: { weight: 'medium' },
  exposure: 'internal',
  dataClass: 'public',
  async run(input, params, ctx) {
    const validation = validateRequest(input);
    if (!validation.ok) return validation;
    const file = input.file as ImageFile;

    if (ctx.signal.aborted) return err('ABORTED');

    const decoded = await decodeAndCheckSource(file);
    if (!decoded.ok) return decoded;
    const { bitmap, sourceType, width, height } = decoded.value;

    const requestedFormat: ResolvedImageFormat =
      input.outputFormat === 'same' ? sourceType : input.outputFormat;
    const flattenToWhite = SUPPORTS_ALPHA[sourceType] && !SUPPORTS_ALPHA[requestedFormat];

    const inputBytes = file.bytes.byteLength;
    const targetCeilingBytes =
      input.maxFileSizeKB !== undefined
        ? Math.min(inputBytes - 1, Math.round(input.maxFileSizeKB * 1000))
        : inputBytes - 1;

    let fellBackFromWebp = false;

    try {
      const searched = await findCompressCandidate(
        {
          width,
          height,
          startQuality: input.quality ?? 80,
          minQuality: params.minQuality ?? 50,
          format: requestedFormat,
          targetCeilingBytes,
          allowDimensionReduction: input.allowDimensionReduction,
        },
        async (w, h, q) => {
          if (ctx.signal.aborted) throw new Error('Aborted');
          const encoded = await renderAndEncodeCompress(
            bitmap,
            requestedFormat,
            w,
            h,
            q,
            flattenToWhite,
          );
          if (encoded.fellBackFromWebp) fellBackFromWebp = true;
          return encoded.bytes;
        },
      );

      if (ctx.signal.aborted) return err('ABORTED');
      return finishCompress(
        file,
        decoded.value,
        requestedFormat,
        input,
        params,
        searched,
        fellBackFromWebp,
      );
    } catch {
      return err(ctx.signal.aborted ? 'ABORTED' : 'IMAGE_COMPRESSION_FAILED');
    } finally {
      bitmap.close();
    }
  },
});
