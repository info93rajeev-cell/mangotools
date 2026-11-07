import { describe, expect, it } from 'vitest';
import {
  isChunkedModelUrl,
  isModelPartsManifest,
  joinedModelResponse,
  type ModelPartsManifest,
} from './chunkedModelFetch.ts';

const ORIGIN = 'https://beyandtheai.com';
const PREFIX = '/models/birefnet-lite-512/';
const BASE = new URL(`${ORIGIN}${PREFIX}rev/onnx/model.onnx`);

function bytes(n: number, seed: number): Uint8Array {
  return Uint8Array.from({ length: n }, (_, i) => (i * 31 + seed) % 256);
}

function fakeFetch(files: Record<string, Uint8Array>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const body = files[url];
    return body ? new Response(body.slice(), { status: 200 }) : new Response('nf', { status: 404 });
  }) as typeof fetch;
}

describe('chunked model delivery', () => {
  it('only intercepts same-origin .onnx files under the model prefix', () => {
    expect(isChunkedModelUrl(BASE, ORIGIN, [PREFIX])).toBe(true);
    expect(isChunkedModelUrl(new URL(`${ORIGIN}${PREFIX}rev/config.json`), ORIGIN, [PREFIX])).toBe(
      false,
    );
    expect(
      isChunkedModelUrl(new URL('https://huggingface.co/x/model.onnx'), ORIGIN, [PREFIX]),
    ).toBe(false);
    expect(isChunkedModelUrl(new URL(`${ORIGIN}/other/model.onnx`), ORIGIN, [PREFIX])).toBe(false);
  });

  it('rejects parts lists whose sizes do not add up', () => {
    const good = {
      byteSize: 5,
      sha256: 'x',
      parts: [
        { file: 'a', byteSize: 2 },
        { file: 'b', byteSize: 3 },
      ],
    };
    expect(isModelPartsManifest(good)).toBe(true);
    expect(isModelPartsManifest({ ...good, byteSize: 6 })).toBe(false);
    expect(isModelPartsManifest({ ...good, parts: [] })).toBe(false);
    expect(isModelPartsManifest(null)).toBe(false);
  });

  it('joins the parts, in order, into one response with the full length', async () => {
    const a = bytes(7, 1);
    const b = bytes(5, 2);
    const c = bytes(3, 3);
    const manifest: ModelPartsManifest = {
      byteSize: 15,
      sha256: 'x',
      parts: [
        { file: 'model.onnx.part-000', byteSize: 7 },
        { file: 'model.onnx.part-001', byteSize: 5 },
        { file: 'model.onnx.part-002', byteSize: 3 },
      ],
    };
    const realFetch = fakeFetch({
      [`${BASE.href}.part-000`]: a,
      [`${BASE.href}.part-001`]: b,
      [`${BASE.href}.part-002`]: c,
    });
    const res = joinedModelResponse(realFetch, BASE, manifest);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe('15');
    const out = new Uint8Array(await res.arrayBuffer());
    expect([...out]).toEqual([...a, ...b, ...c]);
  });

  it('fails instead of returning a corrupt model when a part is missing or short', async () => {
    const manifest: ModelPartsManifest = {
      byteSize: 10,
      sha256: 'x',
      parts: [
        { file: 'model.onnx.part-000', byteSize: 5 },
        { file: 'model.onnx.part-001', byteSize: 5 },
      ],
    };
    const missing = joinedModelResponse(
      fakeFetch({ [`${BASE.href}.part-000`]: bytes(5, 1) }),
      BASE,
      manifest,
    );
    await expect(missing.arrayBuffer()).rejects.toThrow(/part-001 failed: HTTP 404/);
    const short = joinedModelResponse(
      fakeFetch({ [`${BASE.href}.part-000`]: bytes(5, 1), [`${BASE.href}.part-001`]: bytes(4, 2) }),
      BASE,
      manifest,
    );
    await expect(short.arrayBuffer()).rejects.toThrow(/has 4 bytes, expected 5/);
  });
});
