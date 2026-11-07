import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { verifyPagesDistHasNoOversizedModels } from './fetch-background-remover-models.ts';
import {
  MODEL_PART_BYTES,
  type PartsList,
  splitIntoParts,
  stageBackgroundRemoverModels,
} from './stage-background-remover-models.ts';

const dirs: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'stage-models-'));
  dirs.push(d);
  return d;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const data = (n: number) => Buffer.from(Array.from({ length: n }, (_, i) => (i * 7 + 3) % 256));

describe('stage background-remover models', () => {
  it('uses parts safely under the Cloudflare Pages 25 MiB limit', () => {
    expect(MODEL_PART_BYTES).toBeLessThan(25 * 1024 * 1024);
  });

  it('splits a file into ordered parts that rejoin byte-for-byte', () => {
    const dir = tmp();
    const src = join(dir, 'model.onnx');
    const original = data(1000);
    writeFileSync(src, original);
    const list = splitIntoParts(src, join(dir, 'out', 'model.onnx'), 300);
    expect(list.parts.map((p) => p.byteSize)).toEqual([300, 300, 300, 100]);
    expect(list.parts[0]?.file).toBe('model.onnx.part-000');
    expect(list.byteSize).toBe(1000);
    expect(list.sha256).toBe(sha(original));
    const joined = Buffer.concat(list.parts.map((p) => readFileSync(join(dir, 'out', p.file))));
    expect(joined.equals(original)).toBe(true);
  });

  it('stages config files as-is and .onnx files as parts plus a parts list', async () => {
    const dir = tmp();
    const cache = join(dir, 'cache');
    const dist = join(dir, 'dist');
    const model = data(2500);
    const config = Buffer.from('{"a":1}');
    const manifest = {
      name: 'birefnet-lite-512',
      repository: 'r',
      revision: 'rev1',
      license: 'MIT',
      upstreamBaseUrl: 'https://example.invalid',
      models: [
        {
          logicalName: 'm',
          usage: 'wasm',
          sourcePath: 'onnx/model.onnx',
          sha256: sha(model),
          byteSize: 2500,
          license: 'MIT',
        },
        {
          logicalName: 'c',
          usage: 'config',
          sourcePath: 'config.json',
          sha256: sha(config),
          byteSize: config.length,
          license: 'MIT',
        },
      ],
    };
    const manifestPath = join(dir, 'manifest.json');
    writeFileSync(manifestPath, JSON.stringify(manifest));
    mkdirSync(join(cache, 'onnx'), { recursive: true });
    writeFileSync(join(cache, 'onnx/model.onnx'), model);
    writeFileSync(join(cache, 'config.json'), config);

    await stageBackgroundRemoverModels(dist, {
      manifestPath,
      cacheDir: cache,
      partBytes: 1000,
      download: false,
    });

    const base = join(dist, 'models/birefnet-lite-512/rev1');
    expect(readFileSync(join(base, 'config.json')).equals(config)).toBe(true);
    const list = JSON.parse(
      readFileSync(join(base, 'onnx/model.onnx.parts.json'), 'utf8'),
    ) as PartsList;
    expect(list.parts).toHaveLength(3);
    expect(list.sha256).toBe(sha(model));
    expect(statSync(join(base, 'onnx/model.onnx.part-002')).size).toBe(500);
    await expect(verifyPagesDistHasNoOversizedModels(dist)).resolves.toBeUndefined();
  });

  it('refuses to stage a cached model that does not match the pinned sha256', async () => {
    const dir = tmp();
    const cache = join(dir, 'cache');
    mkdirSync(join(cache, 'onnx'), { recursive: true });
    writeFileSync(join(cache, 'onnx/model.onnx'), data(100));
    const manifestPath = join(dir, 'manifest.json');
    writeFileSync(
      manifestPath,
      JSON.stringify({
        name: 'n',
        repository: 'r',
        revision: 'v',
        license: 'MIT',
        models: [
          {
            logicalName: 'm',
            usage: 'wasm',
            sourcePath: 'onnx/model.onnx',
            sha256: 'f'.repeat(64),
            byteSize: 100,
            license: 'MIT',
          },
        ],
      }),
    );
    await expect(
      stageBackgroundRemoverModels(join(dir, 'dist'), {
        manifestPath,
        cacheDir: cache,
        download: false,
      }),
    ).rejects.toThrow(/does not match the pinned sha256/);
  });
});
