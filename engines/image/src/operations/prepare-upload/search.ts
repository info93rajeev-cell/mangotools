export interface UploadSearchOptions {
  width: number;
  height: number;
  quality: number;
  format: 'jpg' | 'png';
  maxBytes?: number;
  reduce: boolean;
}
interface Candidate {
  bytes: Uint8Array;
  width: number;
  height: number;
}
export interface UploadSearchResult {
  candidate: Candidate;
  attempts: number;
  met: boolean;
}
type Encoder = (width: number, height: number, quality: number) => Promise<Uint8Array>;

/** Fixed observed-quality grid: no monotonic encoder-size assumption or optimum claim. */
async function encodeStage(
  options: UploadSearchOptions,
  encode: Encoder,
): Promise<UploadSearchResult> {
  const { width, height } = options;
  let best: Candidate | undefined;
  let attempts = 0;
  const qualities =
    options.format === 'png' || options.maxBytes === undefined
      ? [options.quality]
      : Array.from({ length: 8 }, (_, i) => options.quality - ((options.quality - 50) * i) / 7);
  for (const quality of qualities) {
    const bytes = await encode(width, height, quality);
    attempts++;
    const candidate = { bytes, width, height };
    if (!best || bytes.byteLength < best.bytes.byteLength) best = candidate;
    if (options.maxBytes === undefined || bytes.byteLength <= options.maxBytes) {
      return { candidate, attempts, met: true };
    }
  }
  if (!best) throw new Error('No upload candidate encoded');
  return { candidate: best, attempts, met: false };
}

export async function findUploadCandidate(
  options: UploadSearchOptions,
  encode: Encoder,
): Promise<UploadSearchResult> {
  let current = options;
  let best: UploadSearchResult | undefined;
  let attempts = 0;
  for (let stage = 0; stage < 4; stage++) {
    const result = await encodeStage(current, encode);
    attempts += result.attempts;
    if (result.met) return { ...result, attempts };
    if (!best || result.candidate.bytes.byteLength < best.candidate.bytes.byteLength) best = result;
    const shortSide = Math.min(current.width, current.height);
    if (!options.reduce || shortSide <= 64 || options.maxBytes === undefined) break;
    const scale = Math.max(
      64 / shortSide,
      Math.min(0.85, Math.sqrt(options.maxBytes / result.candidate.bytes.byteLength) * 0.9),
    );
    current = {
      ...current,
      width: Math.max(1, Math.round(current.width * scale)),
      height: Math.max(1, Math.round(current.height * scale)),
    };
  }
  if (!best) throw new Error('No upload resolution tested');
  return { ...best, attempts };
}
