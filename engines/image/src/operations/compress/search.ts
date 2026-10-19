export interface CompressSearchOptions {
  width: number;
  height: number;
  startQuality: number;
  minQuality: number;
  format: 'jpg' | 'png' | 'webp';
  targetCeilingBytes: number;
  allowDimensionReduction: boolean;
}

export interface Candidate {
  bytes: Uint8Array;
  width: number;
  height: number;
  quality: number;
}

export interface CompressSearchResult {
  candidate: Candidate;
  attempts: number;
  met: boolean;
}

export type CompressEncoder = (
  width: number,
  height: number,
  quality: number,
) => Promise<Uint8Array>;

/**
 * Encodes candidates across a bounded quality grid from `startQuality` down to `minQuality`.
 * For PNG, quality is ignored (lossless) and encoded exactly once.
 * For JPG/WebP, tests up to 8 quality steps in decreasing order.
 * Returns the highest-quality candidate that meets `targetCeilingBytes`.
 * If none meet the ceiling, returns the candidate with the smallest observed byte size.
 */
export async function encodeStage(
  options: CompressSearchOptions,
  encode: CompressEncoder,
): Promise<CompressSearchResult> {
  const { width, height, format, startQuality, minQuality, targetCeilingBytes } = options;

  if (format === 'png') {
    const bytes = await encode(width, height, 100);
    const candidate: Candidate = { bytes, width, height, quality: 100 };
    return {
      candidate,
      attempts: 1,
      met: bytes.byteLength <= targetCeilingBytes,
    };
  }

  const startQ = Math.max(minQuality, Math.min(100, Math.round(startQuality)));
  const minQ = Math.max(1, Math.min(startQ, Math.round(minQuality)));

  const steps = 8;
  const rawQualities = Array.from({ length: steps }, (_, i) =>
    Math.round(startQ - ((startQ - minQ) * i) / (steps - 1)),
  );
  const qualities = Array.from(new Set(rawQualities));

  let smallest: Candidate | undefined;
  let attempts = 0;

  for (const quality of qualities) {
    const bytes = await encode(width, height, quality);
    attempts++;
    const candidate: Candidate = { bytes, width, height, quality };

    if (!smallest || bytes.byteLength < smallest.bytes.byteLength) {
      smallest = candidate;
    }

    // First candidate meeting the ceiling preserves the highest visual quality
    if (bytes.byteLength <= targetCeilingBytes) {
      return { candidate, attempts, met: true };
    }
  }

  if (!smallest) throw new Error('No candidate encoded');
  return { candidate: smallest, attempts, met: false };
}

/**
 * Searches for a compressed candidate strictly smaller than the target ceiling.
 * If quality stepping at original dimensions does not reach the ceiling and allowDimensionReduction
 * is enabled, downscales dimensions up to 4 stages.
 */
export async function findCompressCandidate(
  options: CompressSearchOptions,
  encode: CompressEncoder,
): Promise<CompressSearchResult> {
  let current = options;
  let best: CompressSearchResult | undefined;
  let totalAttempts = 0;

  for (let stage = 0; stage < 4; stage++) {
    const result = await encodeStage(current, encode);
    totalAttempts += result.attempts;

    if (result.met) {
      return { ...result, attempts: totalAttempts };
    }

    if (!best || result.candidate.bytes.byteLength < best.candidate.bytes.byteLength) {
      best = result;
    }

    const shortSide = Math.min(current.width, current.height);
    if (!options.allowDimensionReduction || shortSide <= 64) {
      break;
    }

    const ratio = options.targetCeilingBytes / result.candidate.bytes.byteLength;
    const scale = Math.max(64 / shortSide, Math.min(0.85, Math.sqrt(ratio) * 0.9));

    current = {
      ...current,
      width: Math.max(1, Math.round(current.width * scale)),
      height: Math.max(1, Math.round(current.height * scale)),
    };
  }

  if (!best) throw new Error('No compress resolution tested');
  return { ...best, attempts: totalAttempts };
}
