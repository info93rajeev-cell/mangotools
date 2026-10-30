/**
 * Unified error presentation and user-facing messages for all Image & Media tools.
 * Replaces raw engine codes (e.g. errors.IMAGE_INVALID_FILE_TYPE) and generic text
 * (e.g. "An error occurred.") with plain, helpful explanations and clear next steps.
 */

export interface ImageErrorLike {
  code?: string;
  messageKey?: string;
  message?: string;
  details?: Record<string, unknown>;
}

export function isHeicFile(fileName?: string, mimeType?: string): boolean {
  if (mimeType && (mimeType === 'image/heic' || mimeType === 'image/heif')) {
    return true;
  }
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return lower.endsWith('.heic') || lower.endsWith('.heif');
}

export function isPdfFile(fileName?: string, mimeType?: string): boolean {
  if (mimeType && mimeType === 'application/pdf') return true;
  if (!fileName) return false;
  return fileName.toLowerCase().endsWith('.pdf');
}

function normalizeErrorCode(rawCode?: string): string {
  if (!rawCode) return '';
  return rawCode.replace(/^errors\./, '').trim();
}

function detectExtensionError(name?: string): string | null {
  if (isHeicFile(name)) {
    return "iPhone HEIC photos aren't supported. Set Camera → Formats → Most Compatible, or take a screenshot.";
  }
  if (isPdfFile(name)) {
    return `"${name || 'This file'}" is a PDF document, not an image. Please upload a JPG, PNG, or WebP image.`;
  }
  return null;
}

const STATIC_CODE_MESSAGES: Record<string, string> = {
  IMAGE_MEMORY_LIMIT_EXCEEDED:
    'The browser ran out of memory while processing this image. Please try a smaller image.',
  IMAGE_DIMENSIONS_INVALID: 'Enter a width and height greater than 0.',
  IMAGE_NO_FILE_SELECTED: 'Select an image to continue.',
  IMAGE_BACKGROUND_REMOVAL_FAILED:
    'The background could not be removed. Please try again with a different image.',
  IMAGE_MODEL_DOWNLOAD_FAILED:
    "Couldn't download the AI model. Check your connection and retry. Person and Chroma modes work offline.",
  IMAGE_COMPRESSION_FAILED:
    'The image could not be compressed. Please try again with a different image.',
  IMAGE_RESIZE_FAILED: 'The image could not be resized. Please try again with a different image.',
  IMAGE_CROP_FAILED: 'The image could not be cropped. Please try again with a different image.',
  IMAGE_WATERMARK_FAILED:
    'The watermark could not be added. Please try again with a different image.',
};

type ParametricHandler = (err: ImageErrorLike, name?: string) => string;

const PARAMETRIC_HANDLERS: Record<string, ParametricHandler> = {
  IMAGE_INVALID_FILE_TYPE: (_err, name) =>
    name
      ? `"${name}" is not a supported JPG, PNG, or WebP image. Please choose a valid image file.`
      : "This file isn't a supported JPG, PNG, or WebP image. Please choose a valid image file.",

  IMAGE_UNREADABLE: (_err, name) =>
    name
      ? `"${name}" could not be read as an image. It may be corrupted or damaged.`
      : 'This file could not be read as an image. It may be corrupted or damaged.',

  IMAGE_FILE_TOO_LARGE: (err, name) => {
    const max = err.details?.max ? `${err.details.max} MB` : 'the allowed limit';
    return name
      ? `"${name}" is larger than ${max}. Please choose a smaller image.`
      : `This image is larger than ${max}. Please choose a smaller image.`;
  },

  IMAGE_SOURCE_PIXELS_TOO_LARGE: (err) => {
    const max = err.details?.max ? `${err.details.max} megapixel` : 'the allowed';
    return `This image exceeds the ${max} limit. Please scale it down or choose a smaller image.`;
  },

  IMAGE_OUTPUT_DIMENSIONS_TOO_LARGE: (err) => {
    const max = err.details?.max ? `${err.details.max} megapixel` : 'the allowed';
    return `This image exceeds the ${max} limit. Please scale it down or choose a smaller image.`;
  },

  IMAGE_ANIMATED_UNSUPPORTED: (_err, name) =>
    name
      ? `"${name}" is an animated image. Animated images are not supported for this operation.`
      : 'Animated images are not supported for this operation. Please use a static image.',

  IMAGE_SIZE_TARGET_UNREACHABLE: (err) => {
    const bytes = err.details?.bytes;
    const w = err.details?.width;
    const h = err.details?.height;
    if (bytes && w && h) {
      return `The size limit was not reached within these settings. Smallest tested: ${bytes} bytes at ${w} × ${h} px. Relax the limit or allow smaller dimensions.`;
    }
    return 'The size limit was not reached within these settings. Relax the limit or allow smaller dimensions.';
  },
};

function isValidCustomMessage(msg: unknown): msg is string {
  return (
    typeof msg === 'string' &&
    msg.length > 0 &&
    msg !== 'An error occurred.' &&
    !msg.startsWith('IMAGE_') &&
    !msg.startsWith('errors.IMAGE_')
  );
}

/**
 * Resolves any raw error, OpError, or exception into a clear, actionable message.
 */
export function resolveImageErrorMessage(error: unknown, fileName?: string): string {
  const errObj = typeof error === 'object' && error !== null ? (error as ImageErrorLike) : {};
  const code = normalizeErrorCode(
    typeof error === 'string' ? error : errObj.code || errObj.messageKey,
  );
  const name =
    fileName ||
    (typeof errObj.details?.name === 'string' ? (errObj.details.name as string) : undefined);

  const extError = detectExtensionError(name);
  if (extError) return extError;

  const staticMsg = STATIC_CODE_MESSAGES[code];
  if (staticMsg) return staticMsg;

  const parametricHandler = PARAMETRIC_HANDLERS[code];
  if (parametricHandler) return parametricHandler(errObj, name);

  if (isValidCustomMessage(errObj.message)) return errObj.message;
  if (isValidCustomMessage(error)) return error;

  return 'Could not process this image. Please check the file and try again with a valid JPG, PNG, or WebP image.';
}
