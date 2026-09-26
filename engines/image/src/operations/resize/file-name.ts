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

export interface OutputFileNameStyle {
  /** Appended to the original base name; defaults to "-resized" (Image Resize's own wording). */
  suffix?: string;
  /** Used when nothing usable remains; defaults to `FALLBACK_OUTPUT_BASE_NAME`. */
  fallbackBase?: string;
}

/**
 * The output file name: a user-entered `requestedName` if given and usable, otherwise the original
 * file's name with a suffix appended, otherwise a fallback — always ending in the correct extension
 * for `outputType`. Never rejects a name; only cleans one up or falls back, matching
 * `pdf.merge@1`/`pdf.jpg-to-pdf@1`'s own `sanitizeOutputFileName` behavior. `style` lets a preset that
 * reuses this operation for a different purpose (Image Compress's "-compressed") pick its own suffix
 * and fallback without changing Image Resize's own default wording.
 */
export function deriveOutputFileName(
  outputType: DetectedImageType,
  originalFileName: string,
  requestedName?: string,
  style?: OutputFileNameStyle,
): string {
  const suffix = style?.suffix ?? '-resized';
  const fallbackBase = style?.fallbackBase ?? FALLBACK_OUTPUT_BASE_NAME;
  const extension = EXTENSION_FOR_TYPE[outputType];
  const requestedBase = requestedName ? sanitizeBase(requestedName) : '';
  if (requestedBase !== '') return `${requestedBase}.${extension}`;
  // Check the original name's own usability *before* appending the suffix — otherwise a name that is
  // only an extension (e.g. ".png") would derive an unhelpful base instead of falling back.
  const originalBase = sanitizeBase(stripExtension(originalFileName));
  const derivedBase = originalBase !== '' ? `${originalBase}${suffix}` : fallbackBase;
  return `${derivedBase}.${extension}`;
}
