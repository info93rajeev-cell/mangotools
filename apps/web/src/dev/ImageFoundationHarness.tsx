import { getWorkerHost } from '@mangotools/runtime';
import { useEffect, useState } from 'preact/hooks';

interface CaseResult {
  ok: boolean;
  outputWidth?: number;
  outputHeight?: number;
  outputFormat?: string;
  warnings?: string[];
  errorCode?: string;
}

/** Draws a small opaque or transparent PNG at runtime, so no binary fixture file needs bundling. */
function canvasToPngBytes(
  width: number,
  height: number,
  transparent: boolean,
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');
  if (!transparent) {
    ctx.fillStyle = '#3366ff';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(5, 5, width - 10, height - 10);
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('canvas.toBlob failed'));
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, 'image/png');
  });
}

/** A PNG signature followed by garbage: passes the signature check, fails to decode. */
function corruptedPngBytes(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
}

async function runCase(
  host: ReturnType<typeof getWorkerHost>,
  input: Record<string, unknown>,
): Promise<CaseResult> {
  const outcome = await host.run('image.resize@1', input, {});
  if (!outcome.ok) return { ok: false, errorCode: outcome.error.code };
  const value = outcome.value as Record<string, unknown>;
  return {
    ok: true,
    outputWidth: value.outputWidth as number,
    outputHeight: value.outputHeight as number,
    outputFormat: value.outputFormat as string,
    warnings: outcome.warnings.map((w) => w.code),
  };
}

/** Every scenario this harness proves for real, in a real browser. See tests/dev/image-foundation.spec.ts. */
function buildCases(
  opaque: Uint8Array,
  transparent: Uint8Array,
): Record<string, Record<string, unknown>> {
  const opaqueFile = { name: 'opaque.png', bytes: opaque };
  const common = { keepAspectRatio: true, outputFormat: 'same' as const };
  return {
    'basic-resize-same-format': { file: opaqueFile, targetWidth: 20, targetHeight: 15, ...common },
    'keep-aspect-ratio-fit-box': {
      file: opaqueFile,
      targetWidth: 100,
      targetHeight: 10,
      ...common,
    },
    'upscale-quality-warning': { file: opaqueFile, targetWidth: 80, targetHeight: 60, ...common },
    'transparent-png-to-jpg': {
      file: { name: 'transparent.png', bytes: transparent },
      targetWidth: 20,
      targetHeight: 15,
      keepAspectRatio: true,
      outputFormat: 'jpg',
    },
    'webp-output-graceful': {
      file: opaqueFile,
      targetWidth: 20,
      targetHeight: 15,
      keepAspectRatio: true,
      outputFormat: 'webp',
    },
    'output-dimensions-too-large': {
      file: opaqueFile,
      targetWidth: 7000,
      targetHeight: 7000,
      keepAspectRatio: false,
      outputFormat: 'same',
    },
    'invalid-dimensions': { file: opaqueFile, targetWidth: 0, targetHeight: 15, ...common },
    'corrupted-image': {
      file: { name: 'corrupted.png', bytes: corruptedPngBytes() },
      targetWidth: 20,
      targetHeight: 15,
      ...common,
    },
  };
}

async function runAllCases(): Promise<Record<string, CaseResult>> {
  const host = getWorkerHost();
  const [opaque, transparent] = await Promise.all([
    canvasToPngBytes(40, 30, false),
    canvasToPngBytes(40, 30, true),
  ]);
  const cases = buildCases(opaque, transparent);
  const entries = await Promise.all(
    Object.entries(cases).map(async ([id, input]) => [id, await runCase(host, input)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * Development-only: runs `image.resize@1` for real, through the real module worker, for a handful of
 * scenarios — proving the canvas decode/resize/encode pipeline works before any visible tool exists.
 * Unlike DeterminismHarness, this does not hash output for cross-run comparison (see
 * engines/image/README.md's "Determinism" section for why); it reports decoded dimensions, format,
 * warnings and error codes for tests/dev/image-foundation.spec.ts to assert on directly.
 */
export function ImageFoundationHarness() {
  const [results, setResults] = useState<Record<string, CaseResult> | null>(null);
  useEffect(() => {
    void runAllCases().then(setResults);
  }, []);
  return (
    <pre id="image-foundation-results" data-done={results ? 'true' : 'false'}>
      {results ? JSON.stringify(results, null, 2) : 'Running…'}
    </pre>
  );
}
