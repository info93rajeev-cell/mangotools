import type { DetectedImageType } from './signature.ts';

export const FALLBACK_OUTPUT_BASE_NAME = 'resized-image';

const EXTENSION_FOR_TYPE: Record<DetectedImageType, string> = {
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
};

/** Filename characters unsafe across common filesystems, plus control characters. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are exactly what must be stripped from a file name.
const UNSAFE_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

function stripExtension(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '');
}

function sanitizeBase(base: string): string {
  const cleaned = stripExtension(base.trim().replace(UNSAFE_CHARS, '')).trim();
  return cleaned === '' || cleaned === '.' || cleaned === '..' ? '' : cleaned;
}

/**
 * The output file name: a user-entered `requestedName` if given and usable, otherwise the original
 * file's name with "-resized" appended, otherwise a fixed fallback — always ending in the correct
 * extension for `outputType`. Never rejects a name; only cleans one up or falls back, matching
 * `pdf.merge@1`/`pdf.jpg-to-pdf@1`'s own `sanitizeOutputFileName` behavior.
 */
export function deriveOutputFileName(
  outputType: DetectedImageType,
  originalFileName: string,
  requestedName?: string,
): string {
  const extension = EXTENSION_FOR_TYPE[outputType];
  const requestedBase = requestedName ? sanitizeBase(requestedName) : '';
  if (requestedBase !== '') return `${requestedBase}.${extension}`;
  // Check the original name's own usability *before* appending "-resized" — otherwise a name that is
  // only an extension (e.g. ".png") would derive the unhelpful base "-resized" instead of falling back.
  const originalBase = sanitizeBase(stripExtension(originalFileName));
  const derivedBase = originalBase !== '' ? `${originalBase}-resized` : FALLBACK_OUTPUT_BASE_NAME;
  return `${derivedBase}.${extension}`;
}
